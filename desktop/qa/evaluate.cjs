const fs=require('node:fs'),path=require('node:path');
let lastRuntime;
module.exports=async function evaluate(fn){
 try{lastRuntime=JSON.parse(fs.readFileSync(path.join(require('node:os').homedir(),'Library','Application Support','TradingView','ChartWallpaper','runtime.json'),'utf8'));}catch{}
 const runtime=lastRuntime;if(!runtime)throw Error('No existing Desktop attachment found.');
 const ps=require('node:child_process').execFileSync('/bin/ps',['-p',String(runtime.pid),'-o','command='],{encoding:'utf8'}).trim();
 if(ps!=='/Applications/TradingView.app/Contents/MacOS/TradingView')throw Error('Original Desktop process changed; refusing signal');
 process._debugProcess(runtime.pid);
 let t;for(let i=0;i<40;i++){try{t=await(await fetch('http://127.0.0.1:9229/json/list')).json();if(t.length)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const ws=new WebSocket(t[0].webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 const expression=`(async()=>{const r=typeof require==='function'?require:process.mainModule.require.bind(process.mainModule);try{return await (${fn.toString()})(r);}finally{setTimeout(()=>r('node:inspector').close(),300);}})()`;
 try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Inspector request timed out')),20000);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id!==1)return;clearTimeout(timer);if(m.result?.exceptionDetails)reject(Error(m.result.exceptionDetails.exception?.description||'Evaluation error'));else resolve(m.result?.result?.value);};ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));});}finally{ws.close();await new Promise(r=>setTimeout(r,450));}
};
