(() => {
 const $=id=>document.getElementById(id);let pending=null,url=null;
 const status=t=>{$('status').textContent=t;};
 async function show(data,kind,name){$('preview').replaceChildren();if(url)URL.revokeObjectURL(url);if(!data)return;const blob=await(await fetch(data)).blob();url=URL.createObjectURL(blob);const el=document.createElement(kind==='video'?'video':'img');el.src=url;el.alt='Wallpaper preview';if(kind==='video'){el.controls=true;el.muted=true;el.loop=true;} $('preview').append(el);$('name').textContent=name||'Custom wallpaper';}
 chrome.storage.local.get(['media','kind','name','fit']).then(s=>{$('fit').value=s.fit||'cover';show(s.media,s.kind,s.name);});
 $('file').onchange=async()=>{
   pending=null;$('save').disabled=true;const f=$('file').files[0];if(!f)return;
   const types=['video/mp4','video/webm','image/png','image/jpeg','image/webp','image/gif'];
   if(!types.includes(f.type)){status('Choose MP4, WebM, GIF, WebP, PNG or JPEG.');return;}
   if(f.size>40*1024*1024){status('This file is over 40 MB. Please compress it first.');return;}
   status('Checking media…');
   try{
     const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(f);});
     const kind=f.type.startsWith('video/')?'video':'image';
     await new Promise((resolve,reject)=>{const el=document.createElement(kind==='video'?'video':'img');const timer=setTimeout(()=>{el.removeAttribute('src');reject(Error('Media decoding timed out.'));},15000);const done=fn=>()=>{clearTimeout(timer);el.removeAttribute('src');if(kind==='video')el.load();fn();};el[kind==='video'?'onloadeddata':'onload']=done(resolve);el.onerror=done(()=>reject(Error('Chrome cannot decode this file. Try H.264 MP4 or WebM.')));el.src=data;});
     pending={media:data,kind,name:f.name};await show(data,kind,f.name);$('save').disabled=false;status('Ready to save.');
   }catch(e){status(e.message);}
 };
 $('save').onclick=async()=>{if(!pending)return;$('save').disabled=true;try{await chrome.storage.local.set({...pending,fit:$('fit').value,enabled:true});status('Saved. Refresh your TradingView chart.');}catch(e){status('Save failed: '+e.message);$('save').disabled=false;}};
 $('fit').onchange=()=>chrome.storage.local.set({fit:$('fit').value});
 $('reset').onclick=async()=>{await chrome.storage.local.remove(['media','kind','name']);await chrome.storage.local.set({enabled:true});pending=null;$('save').disabled=true;$('file').value='';$('name').textContent='Built-in aurora';await show(null);status('Aurora selected. Refresh your TradingView chart.');};
})();