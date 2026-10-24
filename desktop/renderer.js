(() => {
  if (!/^https:\/\/([a-z0-9-]+\.)?tradingview\.com\/chart\//i.test(location.href)) return;
  if (window.__tvDesktopWallpaper) return;
  const selector='canvas[data-name="pane-canvas"]';
  const proto=CanvasRenderingContext2D.prototype, originalFill=proto.fillRect, clear=proto.clearRect;
  let config={enabled:true,dim:.4,paused:false,fit:'cover'}, mediaURL=null, revision=0, stopped=false, queued=false;
  const layers=new Map();
  const style=document.createElement('style');
  style.textContent=`[data-desktop-wallpaper]{position:absolute!important;inset:0;pointer-events:none!important;overflow:hidden;z-index:0;background:#10141d}
  [data-desktop-wallpaper] img,[data-desktop-wallpaper] video{width:100%;height:100%;display:block;object-fit:cover}
  [data-desktop-wallpaper] .dw-aurora{position:absolute;inset:-50%;background:radial-gradient(ellipse at 25% 35%,#157c8e 0,transparent 40%),radial-gradient(ellipse at 75% 60%,#703a96 0,transparent 45%),#10141d;animation:dw-drift 20s ease-in-out infinite alternate}
  @keyframes dw-drift{to{transform:translate(12%,8%) rotate(25deg)}}
  [data-desktop-wallpaper] .dw-shade{position:absolute;inset:0;background:#000}
  canvas[data-name="pane-canvas"],canvas[data-qa-id="pane-top-canvas"]{z-index:1}
  @media(prefers-reduced-motion:reduce){[data-desktop-wallpaper] .dw-aurora{animation-play-state:paused!important}}`;
  document.documentElement.append(style);
  function fill(x,y,w,h){
    const c=this.canvas;
    if(c.matches?.(selector)&&c.parentElement?.querySelector(':scope > [data-desktop-wallpaper="ready"]')){
      const t=this.getTransform(), x1=t.a*x+t.e,y1=t.d*y+t.f,x2=t.a*(x+w)+t.e,y2=t.d*(y+h)+t.f;
      if(t.b===0&&t.c===0&&Math.min(x1,x2)<=1&&Math.min(y1,y2)<=1&&Math.max(x1,x2)>=c.width-1&&Math.max(y1,y2)>=c.height-1){
        this.save();this.resetTransform();clear.call(this,0,0,c.width,c.height);this.restore();return;
      }
    }
    return originalFill.call(this,x,y,w,h);
  }
  proto.fillRect=fill;
  function empty(){for(const l of layers.values()){l.querySelector('video')?.pause();l.remove();}layers.clear();}
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function visibility(){for(const l of layers.values()){
    const pause=document.hidden||config.paused||motion.matches;
    const video=l.querySelector('video');if(video){if(pause)video.pause();else if(video.paused)video.play().then(()=>{delete l.dataset.error;}).catch(()=>{l.dataset.error='Playback blocked. Unpause or choose a different video.';});}
    const aurora=l.querySelector('.dw-aurora');if(aurora)aurora.style.animationPlayState=pause?'paused':'running';
  }}
  function scan(){
    if(stopped)return;
    for(const [c,l]of layers)if(!c.isConnected){l.querySelector('video')?.pause();l.remove();layers.delete(c);}
    if(!config.enabled)return;
    for(const c of document.querySelectorAll(selector)){
      if(layers.has(c))continue;
      const l=document.createElement('div');l.dataset.desktopWallpaper='loading';l.setAttribute('aria-hidden','true');
      const ready=()=>{if(l.isConnected)l.dataset.desktopWallpaper='ready';};
      if(mediaURL){
        const m=document.createElement(config.kind==='video'?'video':'img');m.style.objectFit=config.fit==='contain'?'contain':'cover';
        if(m.tagName==='VIDEO'){m.muted=true;m.loop=true;m.playsInline=true;m.autoplay=!config.paused;m.addEventListener('loadeddata',ready,{once:true});}
        else m.addEventListener('load',ready,{once:true});
        m.addEventListener('error',()=>{l.dataset.desktopWallpaper='error';l.dataset.error='Chrome could not decode this file. Try H.264 MP4 or VP8/VP9 WebM.';});
        m.src=mediaURL;l.append(m);
      }else{const a=document.createElement('div');a.className='dw-aurora';l.append(a);queueMicrotask(ready);}
      const shade=document.createElement('div');shade.className='dw-shade';shade.style.opacity=String(config.dim);l.append(shade);
      c.parentElement.insertBefore(l,c.parentElement.firstChild);layers.set(c,l);
    }
    visibility();
  }
  const observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;scan();});}});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',visibility);
  const api={
    async apply(next){
      const gen=++revision;config={...config,...next,dim:Math.min(.95,Math.max(0,Number(next.dim??config.dim)))};
      const changed=next.media!==undefined;
      if(changed){
        let url=null;if(next.media)url=URL.createObjectURL(await(await fetch(next.media)).blob());
        if(gen!==revision||stopped){if(url)URL.revokeObjectURL(url);return;}
        empty();if(mediaURL)URL.revokeObjectURL(mediaURL);mediaURL=url;delete config.media;
      }
      if(!config.enabled)empty();else{
        for(const l of layers.values()){
          l.querySelector('.dw-shade').style.opacity=String(config.dim);
          const m=l.querySelector('img,video');if(m)m.style.objectFit=config.fit==='contain'?'contain':'cover';
        }
        scan();
      }
      const start=performance.now();while([...layers.values()].some(l=>l.dataset.desktopWallpaper==='loading')&&performance.now()-start<5000)await new Promise(r=>setTimeout(r,50));
      return api.status();
    },
    status(){return {panes:document.querySelectorAll(selector).length,ready:[...layers.values()].filter(l=>l.dataset.desktopWallpaper==='ready').length,errors:[...layers.values()].map(l=>l.dataset.error).filter(Boolean),enabled:config.enabled};},
    stop(){stopped=true;revision++;observer.disconnect();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',visibility);empty();if(mediaURL)URL.revokeObjectURL(mediaURL);style.remove();if(proto.fillRect===fill)proto.fillRect=originalFill;delete window.__tvDesktopWallpaper;}
  };
  window.__tvDesktopWallpaper=api;
})();
