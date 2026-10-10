'use strict';
// Explicit operator-only transfer. Run through AWS asm-exec with a dynamic
// reference in EVOVERSES_ACCOUNT_SERVICE_TOKEN. Values travel only on stdin
// to Wrangler; no secret or local configuration is exported into the build.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function main(){
 try{
  if(process.env.EVOVERSES_BETA_SECRET_UPLOAD!=='1'||process.argv.length!==4)throw Error('Explicit upload required');
  const local=process.argv[2],app=process.argv[3],token=process.env.EVOVERSES_ACCOUNT_SERVICE_TOKEN;
  if(!path.isAbsolute(local)||!path.isAbsolute(app)||!/^[a-f0-9]{64}$/.test(token||''))throw Error('Invalid upload configuration');
  const text=fs.readFileSync(local,'utf8'),match=/^AUTH_EPIC_SECRET\s*=\s*(.+)$/m.exec(text);
  if(!match)throw Error('Missing Epic credential');
  let secret=match[1].trim();
  if(secret.startsWith('"'))secret=JSON.parse(secret);
  else if(secret.startsWith("'")&&secret.endsWith("'"))secret=secret.slice(1,-1);
  if(typeof secret!=='string'||!secret||secret==='REPLACE_ME'||secret.length>2048||secret.trim()!==secret)throw Error('Invalid Epic credential');
  const result=spawnSync(process.execPath,[path.join(app,'node_modules/wrangler/bin/wrangler.js'),'secret','bulk','--config','wrangler.beta.jsonc'],
   {cwd:app,input:JSON.stringify({AUTH_EPIC_SECRET:secret,EVOVERSES_ACCOUNT_SERVICE_TOKEN:token}),stdio:['pipe','inherit','inherit'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  if(result.error||result.status!==0)throw Error('Upload failed');
  console.log('BETA_WORKER_SECRET_TRANSFER_COMPLETE');
 }catch{console.error('BETA_WORKER_SECRET_TRANSFER_FAILED');process.exitCode=1;}
}
if(require.main===module)main();
