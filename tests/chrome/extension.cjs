const {chromium}=require('playwright');
const path=require('path'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const ext=path.resolve(__dirname,'../../chrome-extension');
 fs.mkdirSync(path.resolve(__dirname,'../../artifacts'),{recursive:true});
 const scratch=fs.mkdtempSync(path.join(require('os').tmpdir(),'chart-wallpaper-qa-'));
 const videoPath=path.join(scratch,'test-video.webm');
 const context=await chromium.launchPersistentContext(path.join(scratch,'profile'),{headless:true,channel:"chromium",args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:900}});
 try{
 const p=await context.newPage();await p.goto('chrome://extensions/');
 const info=await p.evaluate(()=>new Promise(r=>chrome.developerPrivate.getExtensionsInfo({includeDisabled:true},r)));
 const e=info.find(x=>x.name==='Chart Wallpaper — Local & Free');assert(e,'Chrome loaded extension');assert.equal(e.state,'ENABLED');assert.equal(e.manifestErrors.length,0);assert.equal(e.runtimeErrors.length,0);console.log('PASS Chrome loads manifest without errors',e.id);
 const options=await context.newPage();await options.goto(`chrome-extension://${e.id}/options.html`);await options.waitForSelector('#file');
 const page=await context.newPage();await page.goto('https://www.tradingview.com/chart/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-chart-wallpaper="ready"]',{timeout:60000});await page.waitForSelector('canvas[data-name="pane-canvas"]');
 await page.setViewportSize({width:1438,height:900});await page.waitForTimeout(2000);
 const stats=await page.evaluate(()=>{const c=document.querySelector('canvas[data-name="pane-canvas"]'),ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height).data;let transparent=0,painted=0;for(let i=3;i<d.length;i+=4){if(!d[i])transparent++;else painted++;}return {transparent,painted,hook:window.__chartWallpaperHook,layers:document.querySelectorAll('[data-chart-wallpaper]').length};});
 assert(stats.transparent>10000);assert(stats.painted>1000);assert(stats.hook);console.log('PASS live chart transparent background with painted candles',stats);
 await page.screenshot({path:path.resolve(__dirname,'../../artifacts/chrome-live-chart.png')});
 // Generate a real video file inside Chromium, exercising upload/decode/storage/playback.
 const bytes=await options.evaluate(async()=>{const c=document.createElement('canvas');c.width=320;c.height=180;const ctx=c.getContext('2d');const stream=c.captureStream(15),r=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];r.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>r.onstop=resolve);r.start();let n=0;const id=setInterval(()=>{ctx.fillStyle=n++%2?'#355da8':'#803178';ctx.fillRect(0,0,320,180);},66);await new Promise(resolve=>setTimeout(resolve,1100));clearInterval(id);r.stop();await done;stream.getTracks().forEach(t=>t.stop());return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];});
 fs.writeFileSync(videoPath,Buffer.from(bytes));
 await options.locator('#file').setInputFiles(videoPath);await options.waitForFunction(()=>!document.querySelector('#save').disabled);await options.click('#save');await options.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Saved.'));
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[data-chart-wallpaper="ready"] video',{timeout:60000});
 const before=await page.locator('[data-chart-wallpaper] video').first().evaluate(v=>v.currentTime);await page.waitForTimeout(300);const after=await page.locator('[data-chart-wallpaper] video').first().evaluate(v=>({t:v.currentTime,paused:v.paused,muted:v.muted}));assert(!after.paused);assert(after.muted);assert.notEqual(before,after.t);console.log('PASS custom WebM uploaded, persisted across reload, playing behind chart');
 await options.evaluate(()=>chrome.storage.local.set({paused:true}));await page.waitForFunction(()=>document.querySelector('[data-chart-wallpaper] video')?.paused);console.log('PASS pause');
 await options.evaluate(()=>chrome.storage.local.set({enabled:false}));await page.waitForFunction(()=>!document.querySelector('[data-chart-wallpaper]'));console.log('PASS disable removes media layer');
 await options.evaluate(()=>chrome.storage.local.set({enabled:true}));await page.waitForSelector('[data-chart-wallpaper="ready"]');console.log('PASS re-enable');
 await options.click('#reset');await page.waitForSelector('.cw-aurora');console.log('PASS reset built-in');
 await options.locator('#file').setInputFiles({name:'bad.webm',mimeType:'video/webm',buffer:Buffer.from('not a video')});await options.waitForFunction(()=>document.querySelector('#status').textContent.includes('cannot decode'));assert(await options.locator('#save').isDisabled());console.log('PASS corrupt media rejected');
 const popup=await context.newPage();await popup.goto(`chrome-extension://${e.id}/popup.html`);await popup.waitForSelector('#options');console.log('PASS popup loads');
 await p.reload();const final=await p.evaluate(()=>new Promise(r=>chrome.developerPrivate.getExtensionsInfo({includeDisabled:true},r)));const ours=final.find(x=>x.id===e.id);assert.equal(ours.runtimeErrors.length,0,JSON.stringify(ours.runtimeErrors));console.log('PASS no Chrome extension runtime errors');
 }finally{await context.close();fs.rmSync(scratch,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
