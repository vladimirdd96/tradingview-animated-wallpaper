'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {app,BrowserWindow,webContents,ipcMain,nativeTheme}=require('electron');
const {pathToFileURL}=require('node:url');
const COMPANION_VERSION='1.1.1';
const MENU_CHANNEL='tv-wallpaper:open-settings:v1';
function menuURL(url){
 try{const u=new URL(url);return u.protocol==='file:'&&u.pathname===new URL(pathToFileURL(path.join(app.getAppPath(),'app/menu/index.html')).href).pathname&&JSON.parse(u.searchParams.get('rendererInitialData')).type==='main-menu';}catch{return false;}
}
const KEY='__tvDesktopWallpaperCompanionV1';
const chartURL=url=>/^https:\/\/([a-z0-9-]+\.)?tradingview\.com\/chart\//i.test(url);
module.exports=async function install(assets){
 if(global[KEY]?.version===COMPANION_VERSION){global[KEY].show();return global[KEY].state();}
 if(global[KEY]){if((await global[KEY].state()).busy)throw Error('Wait for the current wallpaper change before upgrading.');await global[KEY].stop();}
 const data=path.join(app.getPath('userData'),'ChartWallpaper');await fs.mkdir(data,{recursive:true,mode:0o700});
 let config={enabled:true,dim:.45,paused:false,fit:'cover',name:'Built-in aurora',kind:'aurora'},media=null;
 try{const saved=JSON.parse(await fs.readFile(path.join(data,'settings.json'),'utf8'));config={...config,...saved};if(config.mime)media=await fs.readFile(path.join(data,'wallpaper.bin'));}catch(e){if(e.code!=='ENOENT')console.warn('Wallpaper settings reset:',e.message);}
 const renderer=assets['renderer.js'],token=crypto.randomBytes(32).toString('hex');
 const hooked=new Map(),statuses=new Map();let settingsWindow=null,server,stopping=false,busy=false,base;
 const charts=()=>webContents.getAllWebContents().filter(w=>!w.isDestroyed()&&chartURL(w.getURL()));
 const options=(withMedia=true)=>({...config,...(withMedia?{media:media?`data:${config.mime};base64,${media.toString('base64')}`:null}:{})});
 async function repaint(w){
  if(w.isDestroyed())return;
  const z=w.getZoomFactor();
  try{w.setZoomFactor(z+.001);await new Promise(r=>setTimeout(r,90));}finally{if(!w.isDestroyed())w.setZoomFactor(z);}
 }
 async function apply(w,withMedia=true){
  if(stopping||w.isDestroyed()||!chartURL(w.getURL()))return;
  try{
   const script=`${renderer}\nwindow.__tvDesktopWallpaper.apply(${JSON.stringify(options(withMedia))})`;
   const status=await w.executeJavaScript(script);statuses.set(w.id,status);await repaint(w);return status;
  }catch(e){statuses.set(w.id,{ready:0,errors:[e.message]});return {ready:0,errors:[e.message]};}
 }
 async function applyMenu(w){
  if(stopping||w.isDestroyed()||!menuURL(w.getURL()))return;
  try{await w.executeJavaScript(assets['menu.js']);}catch(e){console.warn('Wallpaper menu could not attach:',e.message);}
 }
 function openMenuSettings(event){
  if(stopping||!base||!hooked.has(event.sender.id)||!menuURL(event.sender.getURL()))return;
  void event.sender.executeJavaScript('window.hideMenu?.()').catch(()=>{});
  show();
 }
 function hook(w){
  if(hooked.has(w.id))return;
  const finish=()=>{if(chartURL(w.getURL()))void apply(w);else if(menuURL(w.getURL()))void applyMenu(w);};
  const destroyed=()=>{hooked.delete(w.id);statuses.delete(w.id);};
  hooked.set(w.id,{w,finish,destroyed});w.on('did-finish-load',finish);w.once('destroyed',destroyed);
 }
 const created=(_,w)=>hook(w);app.on('web-contents-created',created);for(const w of webContents.getAllWebContents())hook(w);
 async function save(){
  await fs.writeFile(path.join(data,'settings.json.tmp'),JSON.stringify(config,null,2),{mode:0o600});await fs.rename(path.join(data,'settings.json.tmp'),path.join(data,'settings.json'));
  if(media){await fs.writeFile(path.join(data,'wallpaper.bin.tmp'),media,{mode:0o600});await fs.rename(path.join(data,'wallpaper.bin.tmp'),path.join(data,'wallpaper.bin'));}
  else await fs.rm(path.join(data,'wallpaper.bin'),{force:true});
 }
 async function state(){
  for(const w of charts())try{statuses.set(w.id,await w.executeJavaScript('window.__tvDesktopWallpaper?.status()??{ready:0,errors:["Wallpaper has not attached yet"]}'));}catch{}
  return {theme:nativeTheme.shouldUseDarkColors?'dark':'light',pid:process.pid,version:app.getVersion(),companionVersion:COMPANION_VERSION,settings:{...config},charts:charts().map(w=>({id:w.id,...statuses.get(w.id)})),busy};
 }
 function syncTheme(){
  if(!settingsWindow||settingsWindow.isDestroyed())return;
  const theme=nativeTheme.shouldUseDarkColors?'dark':'light';
  settingsWindow.setBackgroundColor(theme==='dark'?'#1f1f1f':'#ffffff');
  void settingsWindow.webContents.executeJavaScript(`window.__tvWallpaperSetTheme?.(${JSON.stringify(theme)})`).catch(()=>{});
 }
 function show(){
  if(settingsWindow&&!settingsWindow.isDestroyed()){settingsWindow.show();settingsWindow.focus();return;}
  settingsWindow=new BrowserWindow({title:'Wallpaper settings',width:560,height:720,minWidth:440,minHeight:580,backgroundColor:nativeTheme.shouldUseDarkColors?'#1f1f1f':'#ffffff',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  settingsWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  settingsWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(base))event.preventDefault();});
  settingsWindow.webContents.on('did-finish-load',syncTheme);
  settingsWindow.on('closed',()=>{settingsWindow=null;});void settingsWindow.loadURL(base);
 }
 async function stop(){
  if(stopping)return;stopping=true;app.removeListener('web-contents-created',created);ipcMain.removeListener(MENU_CHANNEL,openMenuSettings);nativeTheme.removeListener('updated',syncTheme);
  for(const {w,finish,destroyed}of hooked.values())if(!w.isDestroyed()){w.removeListener('did-finish-load',finish);w.removeListener('destroyed',destroyed);}
  for(const {w}of hooked.values())if(!w.isDestroyed()&&menuURL(w.getURL()))try{await w.executeJavaScript('window.__tvDesktopWallpaperMenu?.stop()');}catch{}
  for(const w of charts())try{await w.executeJavaScript('window.__tvDesktopWallpaper?.stop()');await repaint(w);}catch{}
  if(settingsWindow&&!settingsWindow.isDestroyed())settingsWindow.close();
  await fs.rm(path.join(data,'runtime.json'),{force:true});server.close();delete global[KEY];
 }
 function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
 async function body(req,limit){const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Error('File exceeds 40 MB');parts.push(chunk);}return Buffer.concat(parts);}
 function sniff(b){
  if(b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))return {mime:'video/webm',kind:'video'};
  if(b.length>12&&b.toString('ascii',4,8)==='ftyp')return {mime:'video/mp4',kind:'video'};
  if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {mime:'image/png',kind:'image'};
  if(b.subarray(0,3).equals(Buffer.from([255,216,255])))return {mime:'image/jpeg',kind:'image'};
  if(/^GIF8[79]a/.test(b.toString('ascii',0,6)))return {mime:'image/gif',kind:'image'};
  if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return {mime:'image/webp',kind:'image'};
  throw Error('Unsupported or corrupt file. Choose MP4, WebM, GIF, WebP, PNG, or JPEG.');
 }
 server=http.createServer(async(req,res)=>{
  try{
   if(req.headers.host!==new URL(base).host){send(res,403,{error:'Host rejected'});return;}
   if(req.headers.origin&&req.headers.origin!==new URL(base).origin){send(res,403,{error:'Origin rejected'});return;}
   const url=new URL(req.url,base),prefix=`/${token}/`;
   if(!url.pathname.startsWith(prefix)){send(res,404,{error:'Not found'});return;}
   const route=url.pathname.slice(prefix.length);
   if(req.method==='GET'&&['','ui.js','ui.css'].includes(route)){
    const file=route||'index.html',contents=assets[file];
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(contents);return;
   }
   if(req.method==='GET'&&route==='state'){send(res,200,await state());return;}
   if(req.method!=='POST'){send(res,404,{error:'Not found'});return;}
   if(busy){send(res,409,{error:'A wallpaper change is still finishing. Try again in a moment.'});return;}
   busy=true;
   try{
    if(route==='show'){show();send(res,200,{ok:true});return;}
    if(route==='hide'){settingsWindow?.hide();send(res,200,{ok:true});return;}
    if(route==='stop'){send(res,200,{ok:true});setTimeout(()=>void stop(),100);return;}
    if(route==='upload'){
     const bytes=await body(req,40*1024*1024),type=sniff(bytes),previous={config,media};
     let name;try{name=decodeURIComponent(String(req.headers['x-file-name']||'Custom wallpaper')).slice(0,180);}catch{name='Custom wallpaper';}
     config={...config,...type,name,enabled:true};media=bytes;
     const results=await Promise.all(charts().map(w=>apply(w)));
     if(!results.length||results.some(s=>!s||s.errors?.length||!s.ready)){
      config=previous.config;media=previous.media;await Promise.all(charts().map(w=>apply(w)));throw Error('The chart could not play this file. Your previous wallpaper was restored.');
     }
     await save();send(res,200,await state());return;
    }
    if(route==='settings'){
     const next=JSON.parse((await body(req,4096)).toString()),updated={...config};
     if(next.enabled!==undefined){if(typeof next.enabled!=='boolean')throw Error('Invalid enabled setting');updated.enabled=next.enabled;}
     if(next.paused!==undefined){if(typeof next.paused!=='boolean')throw Error('Invalid pause setting');updated.paused=next.paused;}
     if(next.dim!==undefined){if(typeof next.dim!=='number'||!Number.isFinite(next.dim)||next.dim<0||next.dim>.95)throw Error('Invalid darkening setting');updated.dim=next.dim;}
     if(next.fit!==undefined){if(!['cover','contain'].includes(next.fit))throw Error('Invalid fitting setting');updated.fit=next.fit;}
     config=updated;await Promise.all(charts().map(w=>apply(w,false)));await save();send(res,200,await state());return;
    }
    if(route==='aurora'){media=null;config={...config,enabled:true,kind:'aurora',name:'Built-in aurora'};delete config.mime;await Promise.all(charts().map(w=>apply(w)));await save();send(res,200,await state());return;}
    send(res,404,{error:'Not found'});
   }finally{busy=false;}
  }catch(e){if(!res.headersSent)send(res,400,{error:e.message});else res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 base=`http://127.0.0.1:${server.address().port}/${token}/`;
 await fs.writeFile(path.join(data,'runtime.json'),JSON.stringify({pid:process.pid,base}),{mode:0o600});
 global[KEY]={version:COMPANION_VERSION,state,show,stop,apply,charts};
 ipcMain.on(MENU_CHANNEL,openMenuSettings);nativeTheme.on('updated',syncTheme);
 await Promise.all(webContents.getAllWebContents().filter(w=>!w.isDestroyed()&&menuURL(w.getURL())).map(w=>applyMenu(w)));
 await Promise.all(charts().map(w=>apply(w)));
 show();return state();
};
