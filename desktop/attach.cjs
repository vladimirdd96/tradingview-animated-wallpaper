'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=__dirname;
const COMPANION_VERSION='1.2.0';
const runtimeFile=path.join(require('node:os').homedir(),'Library','Application Support','TradingView','ChartWallpaper','runtime.json');
async function get(url){return fetch(url,{signal:AbortSignal.timeout(2500)});}
async function main(){
 if(process.platform!=='darwin')throw Error('This launcher targets TradingView Desktop on macOS.');
 if(typeof WebSocket!=='function')throw Error('Node.js 22 or later is required.');
 const rows=execFileSync('/bin/ps',['-axo','pid=,command='],{encoding:'utf8'}).split('\n');
 const found=rows.filter(r=>/^\s*\d+ \/Applications\/TradingView\.app\/Contents\/MacOS\/TradingView\s*$/.test(r));
 if(found.length!==1)throw Error('Keep your normal TradingView Desktop app open, then run this launcher again. It will never open or restart TradingView for you.');
 const pid=Number(found[0].trim().split(/\s+/)[0]);
 try{
  const runtime=JSON.parse(await fs.readFile(runtimeFile,'utf8'));
  if(runtime.pid===pid&&/^http:\/\/127\.0\.0\.1:\d+\/[a-f0-9]{64}\/$/.test(runtime.base)){
   const r=await get(runtime.base+'state');if(r.ok&&(await r.json()).companionVersion===COMPANION_VERSION){await fetch(runtime.base+'show',{method:'POST',signal:AbortSignal.timeout(2500)});console.log('Wallpaper is already attached. Settings window opened.');return;}
  }
 }catch{}
 const framework='/Applications/TradingView.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework';
 const binary=await fs.readFile(framework),sentinel=Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX'),offset=binary.indexOf(sentinel)+sentinel.length;
 if(offset<sentinel.length||binary[offset]!==1||binary[offset+1]<4||binary[offset+5]!==49)throw Error('This app build disables runtime inspector attachment; no signal or app modification was attempted.');
 // Do not attach to a different Node application or an existing debugging session.
 try{const r=await get('http://127.0.0.1:9229/json/list');if(r.ok)throw new Error('BUSY');}catch(e){if(e.message==='BUSY')throw Error('Port 9229 is already used by a debugger. Close that debugger first; no process was signalled.');}
 process._debugProcess(pid);
 let targets;
 for(let i=0;i<40;i++){
  try{targets=await(await get('http://127.0.0.1:9229/json/list')).json();if(targets.length)break;}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 if(!targets?.length)throw Error('The running app did not open its local inspector. It was not restarted or modified.');
 const ownership=execFileSync('/usr/sbin/lsof',['-nP','-iTCP:9229','-sTCP:LISTEN'],{encoding:'utf8'});
 if(!ownership.split('\n').slice(1).some(r=>r.trim().split(/\s+/)[1]===String(pid)&&r.includes('127.0.0.1:9229')))throw Error('Inspector ownership or loopback binding did not match TradingView. Refusing connection.');
 const ws=new WebSocket(targets[0].webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 const assets={};for(const file of ['renderer.js','menu.js','index.html','ui.js','ui.css'])assets[file]=await fs.readFile(path.join(root,file),'utf8');
 const source=await fs.readFile(path.join(root,'main.cjs'),'utf8');
 const expression=`(async()=>{const r=typeof require==='function'?require:process.mainModule.require.bind(process.mainModule);try{if(process.pid!==${pid})throw Error('Process changed');const m={exports:{}};(function(require,module,exports){${source}\n})(r,m,m.exports);return await m.exports(${JSON.stringify(assets)});}finally{setTimeout(()=>r('node:inspector').close(),700);}})()`;
 try{
  const result=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Attachment timed out.')),45000);
   ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id!==1)return;clearTimeout(timer);resolve(m);};ws.onerror=reject;
   ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
  });
  if(result.error||result.result?.exceptionDetails)throw Error(result.result?.exceptionDetails?.exception?.description||result.error?.message||'Desktop injection failed');
  const state=result.result.result.value;
  console.log(`Attached to existing TradingView Desktop ${state.version}, PID ${state.pid}. ${state.charts.reduce((n,c)=>n+(c.ready||0),0)} chart pane(s) ready. No restart or login required.`);
  for(const c of state.charts)for(const e of c.errors||[])console.warn(e);
 }finally{ws.close();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
