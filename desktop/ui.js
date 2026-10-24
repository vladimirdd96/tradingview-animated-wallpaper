'use strict';
const $=id=>document.getElementById(id);let changing=false;
async function api(route,body,headers){
 const response=await fetch(route,{method:body!==undefined?'POST':'GET',body:body!==undefined?(typeof body==='string'||body instanceof ArrayBuffer?body:JSON.stringify(body)):undefined,headers,signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Request failed');return result;
}
function render(state){
 const ready=state.charts.reduce((n,c)=>n+(c.ready||0),0),errors=state.charts.flatMap(c=>c.errors||[]);
 $('connection').textContent=errors.length?errors.join(' · '):!state.settings.enabled?'Wallpaper disabled':ready?`${ready} chart pane${ready===1?'':'s'} active in Desktop ${state.version}`:'Waiting for an open TradingView chart…';
 $('connection').classList.toggle('error',!!errors.length);
 if(changing)return;
 $('enabled').checked=state.settings.enabled;$('paused').checked=state.settings.paused;$('fit').value=state.settings.fit;$('dim').value=Math.round(state.settings.dim*100);$('amount').value=$('dim').value+'%';$('name').textContent=state.settings.name;
}
async function update(settings){changing=true;try{const s=await api('settings',settings);changing=false;render(s);$('message').textContent='Applied to your open Desktop charts.';}catch(e){$('message').textContent=e.message;}finally{changing=false;}}
for(const id of ['enabled','paused'])$(id).onchange=()=>update({[id]:$(id).checked});
$('fit').onchange=()=>update({fit:$('fit').value});
$('dim').oninput=()=>{changing=true;$('amount').value=$('dim').value+'%';};$('dim').onchange=()=>update({dim:Number($('dim').value)/100});
$('aurora').onclick=async()=>{try{render(await api('aurora',{}));$('message').textContent='Built-in aurora applied.';}catch(e){$('message').textContent=e.message;}};
$('file').onchange=async()=>{
 const file=$('file').files[0];if(!file)return;
 if(file.size>40*1024*1024){$('message').textContent='Choose a file smaller than 40 MB.';return;}
 changing=true;$('file').disabled=true;$('message').textContent='Checking your wallpaper…';
 try{
  if(!['video/mp4','video/webm','image/gif','image/webp','image/png','image/jpeg'].includes(file.type))throw Error('Choose MP4, WebM, GIF, WebP, PNG or JPEG.');
  const kind=file.type.startsWith('video/')?'video':'img',url=URL.createObjectURL(file);
  try{await new Promise((resolve,reject)=>{
   const el=document.createElement(kind);const timer=setTimeout(()=>finish(Error('Media decoding timed out.')),15000);
   function finish(error){clearTimeout(timer);el.removeAttribute('src');if(kind==='video')el.load();error?reject(error):resolve();}
   el[kind==='video'?'onloadeddata':'onload']=()=>finish();el.onerror=()=>finish(Error('This file cannot be decoded. Try H.264 MP4 or VP8/VP9 WebM.'));el.src=url;
  });}finally{URL.revokeObjectURL(url);}
  const state=await api('upload',await file.arrayBuffer(),{'X-File-Name':encodeURIComponent(file.name),'Content-Type':'application/octet-stream'});
  changing=false;render(state);$('message').textContent='Wallpaper saved and playing in your Desktop charts.';
 }catch(e){$('message').textContent=e.message;}finally{changing=false;$('file').disabled=false;$('file').value='';}
};
$('stop').onclick=async()=>{try{await api('stop',{});$('message').textContent='Wallpaper removed. You can close this window.';}catch(e){$('message').textContent=e.message;}};
async function refresh(){if(changing||document.hidden)return;try{render(await api('state'));}catch{$('connection').textContent='Companion disconnected. Run the launcher while TradingView is open.';$('connection').classList.add('error');}}
refresh();setInterval(refresh,2000);
