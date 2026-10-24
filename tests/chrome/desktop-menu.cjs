const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'wallpaper-menu-'));
 const directory=path.join(scratch,'app/menu');await fs.mkdir(directory,{recursive:true});
 const html=`<!doctype html><meta charset="utf-8"><style>[data-is-popover-item-button]{display:block;height:32px;font:14px system-ui}.background-native{display:flex;width:320px}.button-native{flex:1}.button-native:hover{background:#ddd}</style><div id="group" class="background-native"><div id="settings" data-is-popover-item-button="true" aria-keyshortcuts="Meta+," class="button-native" tabindex="0"><div><div class="left-native">◈</div><div class="middle-native"><span id="settings-label" class="title-native">Settings</span></div><div class="right-native">⌘ ,</div></div></div></div><div id="new-tab" data-is-popover-item-button="true" tabindex="0">New tab</div>`;
 await fs.writeFile(path.join(directory,'index.html'),html);
 const source=await fs.readFile(path.resolve(__dirname,'../../desktop/menu.js'),'utf8');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();await page.addInitScript(()=>{window.sent=[];window.require=name=>{if(name!=='electron')throw Error('Unexpected module');return{ipcRenderer:{send:channel=>window.sent.push(channel)}};};});
  const url=pathToFileURL(path.join(directory,'index.html'));url.searchParams.set('rendererInitialData',JSON.stringify({type:'main-menu'}));await page.goto(url.href);
  await page.evaluate(()=>{window.settingsClicks=0;document.querySelector('#settings').addEventListener('click',()=>window.settingsClicks++);});
  await page.evaluate(source);const item=page.getByRole('menuitem',{name:'Wallpaper settings',exact:true});await item.waitFor();
  const position=await item.evaluate(e=>({self:e.getBoundingClientRect().toJSON(),settings:document.querySelector('#settings').getBoundingClientRect().toJSON()}));assert(Math.abs(position.self.x-position.settings.x)<1);assert(Math.abs(position.self.width-position.settings.width)<1);assert(position.self.top>=position.settings.bottom);
  assert.equal(await item.count(),1);assert.equal(await item.getAttribute('aria-keyshortcuts'),null);assert.equal(await page.locator('#settings-label').count(),1);
  await item.click();assert.deepEqual(await page.evaluate(()=>window.sent),['tv-wallpaper:open-settings:v1']);assert.equal(await page.evaluate(()=>window.settingsClicks),0);console.log('PASS matching native-style row opens only the restricted settings action');
  await page.evaluate(source);assert.equal(await item.count(),1);await page.locator('#settings').click();assert.equal(await page.evaluate(()=>window.settingsClicks),1);console.log('PASS repeated injection is idempotent and original Settings still works');
  await page.locator('#settings').focus();await page.keyboard.press('ArrowDown');assert(await item.evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.sent.length),2);
  await page.keyboard.press('ArrowDown');assert(await page.locator('#new-tab').evaluate(e=>e===document.activeElement));await page.keyboard.press('ArrowUp');assert(await item.evaluate(e=>e===document.activeElement));await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.sent.length),3);console.log('PASS arrow-key entry/exit, Enter, and Space');
  await item.evaluate(e=>e.remove());await item.waitFor();assert.equal(await item.count(),1);console.log('PASS native menu rerender restores one item');
  await page.evaluate(()=>window.__tvDesktopWallpaperMenu.stop());assert.equal(await item.count(),0);await page.locator('#group').evaluate(e=>e.append(document.createElement('span')));await page.waitForTimeout(100);assert.equal(await item.count(),0);console.log('PASS cleanup removes the row and disconnects reinsertion');
  url.searchParams.set('rendererInitialData',JSON.stringify({type:'tab-menu'}));await page.goto(url.href);await page.evaluate(source);assert.equal(await page.locator('#tv-desktop-wallpaper-menu-item').count(),0);console.log('PASS other Desktop menus are untouched');
 }finally{await browser.close();await fs.rm(scratch,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
