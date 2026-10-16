'use strict';
const path=require('node:path'),{unstable_dev}=require('wrangler');
(async()=>{
 const worker=await unstable_dev('tests/store/fixtures/evo-quote-runtime.mjs',{config:path.resolve('wrangler.beta.jsonc'),envFiles:[],local:true,ip:'127.0.0.1',port:0,inspectorPort:0,persist:false,logLevel:'error',vars:{EVOVERSES_HOSTED_BETA:'1',EVOVERSES_ACCOUNT_API_ORIGIN:'https://beta-accounts.evoverses.com',EVOVERSES_ACCOUNT_SERVICE_TOKEN:'b'.repeat(64)},experimental:{disableExperimentalWarning:true,forceLocal:true,watch:false,liveReload:false}});
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 try{
  const r=await worker.fetch('https://beta.evoverses.com/api/store/evo-quote',{headers:{Cookie:'browser-session-must-not-forward',Origin:'https://beta.evoverses.com'}}),quote=await r.json();
  check(r.status===200&&quote.source==='Avalanche'&&quote.chainId===43114,'Native Workers quote request failed: '+r.status);
  check((await worker.fetch('https://beta.evoverses.com/api/store/evo-quote',{method:'POST'})).status===405,'Quote endpoint must be read-only');
  check((await worker.fetch('https://beta.evoverses.com/store')).status===418,'Other website routes must be preserved');
  console.log('Native Workers on-chain quote, supported redirect mode, private header isolation and route delegation passed; no network or payments');
 }finally{await worker.stop();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
