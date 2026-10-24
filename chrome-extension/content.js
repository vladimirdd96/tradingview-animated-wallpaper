(() => {
  'use strict';
  const selector='canvas[data-name="pane-canvas"]';
  let settings={}, objectURL=null, generation=0;
  const layers=new Map();
  const style=document.createElement('style');
  style.textContent=`[data-chart-wallpaper]{position:absolute!important;inset:0;pointer-events:none!important;overflow:hidden;z-index:0;background:#10141d}
  [data-chart-wallpaper] video,[data-chart-wallpaper] img{width:100%;height:100%;display:block;object-fit:cover}
  [data-chart-wallpaper] .cw-aurora{position:absolute;inset:-50%;background:radial-gradient(ellipse at 25% 35%,#157c8e 0,transparent 40%),radial-gradient(ellipse at 75% 60%,#703a96 0,transparent 45%),#10141d;animation:cw-drift 20s ease-in-out infinite alternate}
  @keyframes cw-drift{to{transform:translate(12%,8%) rotate(25deg)}}
  [data-chart-wallpaper] .cw-shade{position:absolute;inset:0;background:#000}
  canvas[data-name="pane-canvas"],canvas[data-qa-id="pane-top-canvas"]{z-index:1}
  @media(prefers-reduced-motion:reduce){[data-chart-wallpaper] .cw-aurora{animation-play-state:paused}}`;
  document.documentElement.append(style);
  function removeLayers(){for(const l of layers.values()){l.querySelector('video')?.pause();l.remove();}layers.clear();}
  function visibility(){for(const l of layers.values()){
    const v=l.querySelector('video'); if(v){if(document.hidden||settings.paused)v.pause();else v.play().catch(()=>{l.dataset.error='Playback blocked';});}
    const a=l.querySelector('.cw-aurora');if(a)a.style.animationPlayState=document.hidden||settings.paused?'paused':'';
  }}
  function scan(){
    for(const [c,l] of layers)if(!c.isConnected){l.querySelector('video')?.pause();l.remove();layers.delete(c);}
    if(settings.enabled===false)return;
    for(const c of document.querySelectorAll(selector)){
      if(layers.has(c))continue;
      const host=c.parentElement, l=document.createElement('div');
      l.dataset.chartWallpaper='loading';l.setAttribute('aria-hidden','true');
      const ready=()=>{if(l.isConnected)l.dataset.chartWallpaper='ready';};
      if(objectURL){
        const media=document.createElement(settings.kind==='video'?'video':'img');
        media.style.objectFit=settings.fit==='contain'?'contain':'cover';
        if(media.tagName==='VIDEO'){media.muted=true;media.loop=true;media.playsInline=true;media.autoplay=!settings.paused;media.addEventListener('loadeddata',ready,{once:true});}
        else media.addEventListener('load',ready,{once:true});
        media.addEventListener('error',()=>{l.dataset.chartWallpaper='error';l.dataset.error='Cannot decode wallpaper';});
        media.src=objectURL;l.append(media);
      }else{const a=document.createElement('div');a.className='cw-aurora';l.append(a);queueMicrotask(ready);}
      const shade=document.createElement('div');shade.className='cw-shade';shade.style.opacity=String(Math.max(0,Math.min(.95,Number(settings.dim??.35))));l.append(shade);
      host.insertBefore(l,host.firstChild);layers.set(c,l);
    }
    visibility();
  }
  async function load(){
    const g=++generation;
    try {
      const s=await chrome.storage.local.get(['enabled','paused','dim','fit','media','kind']);
      let url=null;
      if(s.media){const blob=await (await fetch(s.media)).blob();url=URL.createObjectURL(blob);}
      if(g!==generation){if(url)URL.revokeObjectURL(url);return;}
      removeLayers();if(objectURL)URL.revokeObjectURL(objectURL);objectURL=url;settings=s;scan();
    }catch(e){console.warn('Chart Wallpaper could not load:',e.message);}
  }
  // Observe structure only; never watch our own animation styles.
  let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;scan();});}}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',visibility);
  chrome.storage.onChanged.addListener((_,area)=>{if(area==='local')load();});
  chrome.runtime.onMessage.addListener((m,_,reply)=>{if(m?.type==='wallpaper-status')reply({panes:layers.size,ready:[...layers.values()].filter(l=>l.dataset.chartWallpaper==='ready').length,errors:[...layers.values()].map(l=>l.dataset.error).filter(Boolean)});});
  load();
})();
