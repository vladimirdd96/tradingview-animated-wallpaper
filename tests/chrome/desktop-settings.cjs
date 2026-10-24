const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../../desktop'),assets={};for(const name of ['index.html','ui.js','ui.css'])assets[name]=await fs.readFile(path.join(root,name),'utf8');
 let state={theme:'dark',version:'3.4.0',settings:{enabled:true,paused:false,dim:.82,fit:'cover',kind:'video',name:'Example local wallpaper.mp4'},charts:[{ready:2,panes:2,errors:[]}]},hidden=0;
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:560,height:630}});await page.emulateMedia({colorScheme:'light'});
  await page.route('http://127.0.0.1:8765/**',async route=>{
   const req=route.request(),name=new URL(req.url()).pathname.split('/').at(-1);
   if(name==='state')return route.fulfill({json:state});
   if(name==='settings'){Object.assign(state.settings,req.postDataJSON());return route.fulfill({json:state});}
   if(name==='hide'){hidden++;return route.fulfill({json:{ok:true}});}
   if(name==='upload'){state.settings.kind='video';state.settings.name=decodeURIComponent(req.headers()['x-file-name']);return route.fulfill({json:state});}
   if(name==='aurora'){state.settings.kind='aurora';state.settings.name='Built-in aurora';return route.fulfill({json:state});}
   const file=name||'index.html';return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:assets[file]||''});
  });
  await page.goto('http://127.0.0.1:8765/test/');await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).color),'rgb(219, 219, 219)');assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(31, 31, 31)');console.log('PASS TradingView dark selection overrides a light system appearance');
  state.theme='light';await page.evaluate(()=>window.__tvWallpaperSetTheme('light'));assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).color),'rgb(31, 31, 31)');console.log('PASS live light-theme update without reopening settings');
  await page.setViewportSize({width:560,height:688});assert(await page.locator('main').evaluate(e=>e.scrollHeight<=e.clientHeight+1));console.log('PASS all settings fit the default native window');
  for(const width of [440,560]){await page.setViewportSize({width,height:580});state.settings.name='A very long local wallpaper filename '.repeat(10)+'.mp4';await page.waitForTimeout(2200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#done').isVisible());assert((await page.locator('#done').boundingBox()).y<580);}console.log('PASS narrow window and long filename stay contained; Done remains available');
  await page.getByRole('switch',{name:'Show wallpaper',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('Applied'));assert(!state.settings.enabled);
  await page.getByRole('switch',{name:'Pause animation',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#paused').checked);assert(state.settings.paused);console.log('PASS accessible wallpaper and pause switches');
  const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:'Choose file…',exact:true}).click()]);await chooser.setFiles(path.join(root,'qa/sample.webm'));await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('saved'));assert.equal(state.settings.name,'sample.webm');assert(await page.locator('#choose').isEnabled());console.log('PASS custom file chooser validates media, uploads, and unlocks controls');
  await page.getByRole('button',{name:'Done',exact:true}).click();assert.equal(hidden,1);console.log('PASS Done hides settings without stopping wallpaper');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
