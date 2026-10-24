(async()=>{
 const s=await chrome.storage.local.get({enabled:true,dim:.35,paused:false});
 for(const key of ['enabled','paused']){const el=document.getElementById(key);el.checked=s[key];el.onchange=()=>chrome.storage.local.set({[key]:el.checked});}
 const dim=document.getElementById('dim'),out=document.getElementById('amount');dim.value=Math.round(s.dim*100);out.value=dim.value+'%';dim.oninput=()=>{out.value=dim.value+'%';};dim.onchange=()=>chrome.storage.local.set({dim:Number(dim.value)/100});
 document.getElementById('options').onclick=()=>chrome.runtime.openOptionsPage();
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 try{const r=await chrome.tabs.sendMessage(tab.id,{type:'wallpaper-status'});document.getElementById('status').textContent=r.errors.length?r.errors.join(' · '):r.ready?`${r.ready} chart pane(s) ready`:'Open a TradingView chart, then refresh it.';}
 catch{document.getElementById('status').textContent='Open a TradingView chart to use wallpaper.';}
})();