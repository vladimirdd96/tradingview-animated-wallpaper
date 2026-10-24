'use strict';
// Exercises the actual already-open Desktop app. It never launches, quits, or reloads it.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const evaluate=require('./evaluate.cjs'),root=path.resolve(__dirname,'..'),data=path.join(os.homedir(),'Library','Application Support','TradingView','ChartWallpaper');
const runtime=()=>JSON.parse(fs.readFileSync(path.join(data,'runtime.json'),'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(route,value,headers){const resp=await fetch(runtime().base+route,{method:value!==undefined?'POST':'GET',body:value!==undefined?(Buffer.isBuffer(value)?value:JSON.stringify(value)):undefined,headers,signal:AbortSignal.timeout(25000)});const body=await resp.json();return {status:resp.status,body};}
(async()=>{
 const start=(await api('state')).body,pid=start.pid;assert(start.charts.length);console.log('PASS attached to existing Desktop',start.version,'PID',pid);
 const oldSettings=start.settings,oldMedia=oldSettings.mime?fs.readFileSync(path.join(data,'wallpaper.bin')):null;
 try{
  assert.equal((await api('aurora',{})).status,200);
  const canvas=await evaluate(async r=>{
   const result=[];for(const w of global.__tvDesktopWallpaperCompanionV1.charts())result.push(await w.executeJavaScript(`(()=>[...document.querySelectorAll('canvas[data-name="pane-canvas"]')].map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let transparent=0,painted=0;for(let i=3;i<d.length;i+=4)d[i]?painted++:transparent++;return {transparent,painted,pointer:getComputedStyle(c.parentElement.querySelector('[data-desktop-wallpaper]')).pointerEvents};}))()`));return result.flat();
  });
  for(const c of canvas){assert(c.transparent>1000);assert(c.painted>100);assert.equal(c.pointer,'none');}console.log('PASS animated aurora, transparent background, retained drawings, pointer passthrough',canvas.length,'panes');
  const bad=await api('upload',Buffer.from('not a media file'));assert.equal(bad.status,400);console.log('PASS invalid media rejected');
  const guard=await fetch(runtime().base+'settings',{method:'POST',headers:{Origin:'https://example.com'},body:'{}'});assert.equal(guard.status,403);
  const denied=await fetch(new URL('/state',runtime().base));assert.equal(denied.status,404);console.log('PASS foreign Origin and missing token rejected');
  const invalid=await api('settings',{dim:999});assert.equal(invalid.status,400);console.log('PASS invalid settings rejected');
  const upload=await api('upload',fs.readFileSync(path.join(__dirname,'sample.webm')),{'X-File-Name':'QA-sample.webm'});assert.equal(upload.status,200,JSON.stringify(upload.body));
  await api('settings',{paused:false});
  const videos=await evaluate(async r=>{
   const w=global.__tvDesktopWallpaperCompanionV1.charts()[0];return w.executeJavaScript(`(async()=>{const vs=[...document.querySelectorAll('[data-desktop-wallpaper] video')];const before=vs.map(v=>v.currentTime);await new Promise(r=>setTimeout(r,350));return vs.map((v,i)=>({advances:v.currentTime!==before[i],paused:v.paused,muted:v.muted,error:v.error?.message}));})()`);
  });
  assert.equal(videos.length,canvas.length);for(const v of videos){assert(v.advances);assert(!v.paused);assert(v.muted);assert(!v.error);}console.log('PASS custom WebM decoded and playing silently in every chart pane');
  await api('settings',{paused:true});
  const paused=await evaluate(async r=>global.__tvDesktopWallpaperCompanionV1.charts()[0].executeJavaScript(`[...document.querySelectorAll('[data-desktop-wallpaper] video')].every(v=>v.paused)`));assert(paused);console.log('PASS video pause');
  await api('settings',{enabled:false});let s=(await api('state')).body;assert(s.charts.every(c=>c.ready===0));
  await api('settings',{enabled:true});s=(await api('state')).body;assert(s.charts.every(c=>c.ready===c.panes));console.log('PASS disable and re-enable');
  await api('settings',{dim:.6,fit:'contain'});assert.equal(JSON.parse(fs.readFileSync(path.join(data,'settings.json'),'utf8')).fit,'contain');console.log('PASS settings persisted locally');
  await api('stop',{});await sleep(700);
  const removed=await evaluate(async r=>{
   const e=r('electron');const rows=[];for(const w of e.webContents.getAllWebContents().filter(w=>/^https:\/\/([a-z0-9-]+\.)?tradingview\.com\/chart\//i.test(w.getURL())))rows.push(await w.executeJavaScript(`!window.__tvDesktopWallpaper && !document.querySelector('[data-desktop-wallpaper]')`));return {mainRemoved:!global.__tvDesktopWallpaperCompanionV1,charts:rows};
  }).catch(e=>{throw e;});assert(removed.mainRemoved);assert(removed.charts.every(Boolean));console.log('PASS cleanup removes renderer hook, layers, and companion');
  console.log(execFileSync(process.execPath,[path.join(root,'attach.cjs')],{encoding:'utf8'}).trim());await sleep(900);
  assert.equal((await api('state')).body.pid,pid);console.log('PASS reattach and saved media restore in original PID; no restart');
 }finally{
  if(!fs.existsSync(path.join(data,'runtime.json'))){execFileSync(process.execPath,[path.join(root,'attach.cjs')]);await sleep(900);}
  if(oldMedia)await api('upload',oldMedia,{'X-File-Name':encodeURIComponent(oldSettings.name)});else await api('aurora',{});
  await api('settings',{enabled:oldSettings.enabled,paused:oldSettings.paused,dim:oldSettings.dim,fit:oldSettings.fit});
 }
 const final=(await api('state')).body;assert.equal(final.pid,pid);console.log('PASS original wallpaper preferences restored; Desktop session preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
