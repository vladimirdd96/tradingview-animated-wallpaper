import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>['.git','node_modules','dist','artifacts','data'].includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const manifest=JSON.parse(read('chrome-extension/manifest.json'));
assert.equal(manifest.manifest_version,3);assert(/^\d+\.\d+\.\d+$/.test(manifest.version));
for(const entry of manifest.content_scripts){for(const file of [...(entry.js||[]),...(entry.css||[])])assert(fs.existsSync(path.join(root,'chrome-extension',file)),`Manifest asset missing: ${file}`);assert(entry.matches.every(m=>m==='https://*.tradingview.com/*'));}
for(const file of [manifest.action.default_popup,manifest.options_page])assert(fs.existsSync(path.join(root,'chrome-extension',file)));
assert.deepEqual([...manifest.permissions].sort(),['storage','unlimitedStorage'].sort());
const version=JSON.parse(read('package.json')).version;
for(const file of ['desktop/attach.cjs','desktop/main.cjs'])assert(read(file).includes(`COMPANION_VERSION='${version}'`),`${file} companion version mismatch`);
let scripts=0;
for(const file of walk(root)){
 const rel=path.relative(root,file);
 if(/\.(?:js|cjs|mjs)$/.test(file)){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(r.status,0,`${rel}: ${r.stderr}`);scripts++;}
 if(/\.(?:md|txt|json|js|cjs|mjs|html|css|yml|py|command)$/.test(file)){
  const text=fs.readFileSync(file,'utf8');assert(!/\/Users\/[^/\s]+/i.test(text),`Personal data/path in ${rel}`);
  assert(!/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/.test(text),`Possible credential in ${rel}`);
 }
 if(file.endsWith('.md'))for(const m of fs.readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){
  const link=m[1];if(/^(https?:|#|mailto:)/.test(link))continue;
  const target=decodeURIComponent(link.split('#')[0]);if(target)assert(fs.existsSync(path.resolve(path.dirname(file),target)),`Broken local link ${rel} -> ${link}`);
 }
 if(file.endsWith('.html'))for(const m of fs.readFileSync(file,'utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^(https?:|data:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(path.dirname(file),m[1])),`Missing HTML asset ${rel}: ${m[1]}`);
 }
}
assert(fs.statSync(path.join(root,'desktop/Enable Desktop Wallpaper.command')).mode&0o111,'Launcher must be executable');
const zsh=spawnSync('zsh',['-n',path.join(root,'desktop/Enable Desktop Wallpaper.command')],{encoding:'utf8'});if(!zsh.error)assert.equal(zsh.status,0,zsh.stderr);
console.log(`PASS manifest, assets, local documentation links, privacy checks, and ${scripts} JavaScript syntax checks`);
