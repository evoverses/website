'use strict';
// Local Workers execution with synthetic credentials only. Never enables remote bindings.
const path=require('node:path'),{createHmac}=require('node:crypto'),{unstable_dev}=require('wrangler');
(async()=>{
 const live=JSON.parse(require('node:fs').readFileSync('wrangler.beta.jsonc','utf8')).vars.EVOROS_STRIPE_MODE==='live';
 const worker=await unstable_dev('cloudflare-worker.ts',{config:path.resolve('wrangler.beta.jsonc'),envFiles:[],local:true,ip:'127.0.0.1',port:0,inspectorPort:0,persist:false,logLevel:'error',vars:{AUTH_EPIC_SECRET:'synthetic-build-only',EVOVERSES_ACCOUNT_SERVICE_TOKEN:'b'.repeat(64),STRIPE_SECRET_KEY:live?'rk_live_synthetic':'rk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic'},experimental:{disableExperimentalWarning:true,forceLocal:true,watch:false,liveReload:false}});
 const check=(value,message)=>{if(!value)throw Error(message);};
 try{
  const page=await worker.fetch('https://beta.evoverses.com/store'),html=await page.text();check(page.status===200&&html.includes('Stripe')&&!html.includes('Purchases paused for beta'),'Store runtime failed or pause remains');console.log('Store page renders with both purchase methods and no beta pause');
  const checkout=await worker.fetch('https://beta.evoverses.com/api/store/stripe/checkout',{method:'POST',headers:{Origin:'https://beta.evoverses.com','Content-Type':'application/json'},body:JSON.stringify({bundleId:'bundle_pouch',requestId:'11111111-1111-4111-8111-111111111111'})});// Wrangler's local proxy rewrites Origin to its internal host. Both auth and exact-origin rejection must stay closed.
  check([401,403].includes(checkout.status),'Unsigned/dev-proxy card checkout must be rejected: '+checkout.status);console.log('Stripe checkout rejects unsigned or rewritten-origin requests');
  const body=JSON.stringify({id:'evt_synthetic_runtime_probe',livemode:live,type:'checkout.session.completed',data:{object:{id:live?'cs_live_synthetic':'cs_test_synthetic',metadata:{storeOrigin:'http://localhost:3100'}}}}),time=Math.floor(Date.now()/1000),signature='t='+time+',v1='+createHmac('sha256','whsec_synthetic').update(time+'.'+body).digest('hex');
  const webhook=await worker.fetch('https://beta.evoverses.com/api/store/stripe/webhook',{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':signature},body});const status=await webhook.json();check(webhook.status===200&&status.status==='ignored','Hosted webhook runtime signature/origin isolation failed: '+webhook.status);console.log('Stripe raw-body signature works in Workers; foreign-origin payments are ignored');
  const unsigned=await worker.fetch('https://beta.evoverses.com/api/store/stripe/webhook',{method:'POST',headers:{'Content-Type':'application/json'},body});check(unsigned.status===400,'Unsigned webhook must be rejected');
  console.log('Store Workers runtime checks passed without external payment calls');
 }finally{await worker.stop();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
