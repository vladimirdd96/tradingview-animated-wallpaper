(() => {
  'use strict';
  // This script runs only in Desktop's trusted local main-menu view, never a chart page.
  if(location.protocol!=='file:'||!location.pathname.endsWith('/app/menu/index.html'))return;
  try{if(JSON.parse(new URL(location.href).searchParams.get('rendererInitialData')).type!=='main-menu')return;}catch{return;}
  if(window.__tvDesktopWallpaperMenu)return;
  let ipc;try{ipc=require('electron').ipcRenderer;}catch{return;}
  if(!ipc?.send)return;
  const id='tv-desktop-wallpaper-menu-item',channel='tv-wallpaper:open-settings:v1';
  let stopped=false,queued=false,item=null,wrapper=null;
  function install(){
    if(stopped||document.getElementById(id))return;
    const anchor=document.querySelector('[data-is-popover-item-button][aria-keyshortcuts="Meta+,"]')||document.querySelector('[data-is-popover-item-button][aria-keyshortcuts="Control+,"]');
    if(!anchor)return;
    wrapper?.remove();
    const clone=anchor.cloneNode(true),title=clone.querySelector('[class*="title-"]');
    if(!title)return;
    clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    clone.id=id;clone.removeAttribute('aria-keyshortcuts');clone.setAttribute('role','menuitem');clone.setAttribute('aria-label','Wallpaper settings');clone.tabIndex=0;
    title.textContent='Wallpaper settings…';clone.querySelector('[class*="right-"]')?.remove();
    clone.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();ipc.send(channel);});
    clone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();clone.click();}});
    wrapper=anchor.parentElement.cloneNode(false);wrapper.removeAttribute('id');wrapper.append(clone);anchor.parentElement.after(wrapper);item=clone;
  }
  function navigate(event){
    if(!item?.isConnected||!['ArrowDown','ArrowUp'].includes(event.key))return;
    const rows=[...document.querySelectorAll('[data-is-popover-item-button]')].filter(e=>e.getBoundingClientRect().height>0);
    const index=rows.indexOf(item),active=document.activeElement?.closest('[data-is-popover-item-button]');
    const direction=event.key==='ArrowDown'?1:-1;
    let target;
    if(active===item)target=rows[index+direction];
    else if(rows[index-direction]===active)target=item;
    if(target){event.preventDefault();event.stopImmediatePropagation();target.focus();}
  }
  const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;install();});}});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('keydown',navigate,true);
  window.__tvDesktopWallpaperMenu={stop(){stopped=true;observer.disconnect();document.removeEventListener('keydown',navigate,true);wrapper?.remove();delete window.__tvDesktopWallpaperMenu;}};
  install();
})();
