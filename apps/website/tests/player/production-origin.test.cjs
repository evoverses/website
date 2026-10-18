"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
function loader(overrides={}) {
 const cache=new Map();
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const localRequire=name=>{
   if(Object.hasOwn(overrides,name))return overrides[name];
   let target=name.startsWith('.')?path.resolve(path.dirname(file),name):name.startsWith('@/')?path.resolve('src',name.slice(2)):name.startsWith('@workspace/evoverses/')?path.resolve('../../packages/evoverses/src',name.slice('@workspace/evoverses/'.length)):null;
   if(!target)return require(name);if(target.endsWith('.json'))return JSON.parse(fs.readFileSync(target,'utf8'));
   for(const candidate of [target,target+'.ts',path.join(target,'index.ts')])if(fs.existsSync(candidate)&&fs.statSync(candidate).isFile())return load(candidate);
   throw Error('Unresolved test source: '+name);
  };
  new Function('require','module','exports',source)(localRequire,module,module.exports);return module.exports;
 }return load;
}
const load=loader(),beta='https://beta.evoverses.com',prod='https://evoverses.com';
const env={NODE_ENV:'production',EVOVERSES_HOSTED_BETA:'1',AUTH_EPIC_ID:'fixturewebsiteclient00001',AUTH_EPIC_SECRET:'synthetic-only',EVOVERSES_EPIC_DEPLOYMENT_ID:'fixture-deployment',EVOVERSES_EPIC_APPLICATION_ID:'fixture-app',EVOVERSES_ACCOUNT_API_ORIGIN:'https://beta-accounts.evoverses.com',EVOVERSES_ACCOUNT_SERVICE_TOKEN:'b'.repeat(64)};
test('production origin is exact, server-configured and beta remains the default',()=>{
 const {hostedAccountConfig}=load('src/lib/player/hosted-config.ts');assert.equal(hostedAccountConfig(env).hosted.origin,beta);
 assert.equal(hostedAccountConfig({...env,EVOVERSES_WEB_ORIGIN:prod}).hosted.origin,prod);
 for(const origin of [prod+'/',prod+':443','http://evoverses.com','https://www.evoverses.com','https://attacker.test',prod+'.attacker.test',''])assert.equal(hostedAccountConfig({...env,EVOVERSES_WEB_ORIGIN:origin}),null);
});
test('OAuth callback and durable transaction context bind to the configured website',async()=>{
 const {hostedAccountConfig}=load('src/lib/player/hosted-config.ts');const {createPlayerWebAuth}=load('src/lib/player/auth-core.ts');const contexts=[];
 for(const origin of [beta,prod]){
  const auth=createPlayerWebAuth({configuration:()=>hostedAccountConfig({...env,EVOVERSES_WEB_ORIGIN:origin}),transactions:{putState:async value=>contexts.push(value.contextHash)},fetchImpl:async()=>{throw Error('No provider contact allowed');}});
  const value=await auth.startAsync();assert.equal(new URL(value.url).searchParams.get('redirect_uri'),origin+'/api/player/auth/epic/callback');
 }
 assert.notEqual(contexts[0],contexts[1]);
});
test('production account handlers preserve host and origin rejection before authentication',async()=>{
 const inventory=load('src/lib/player/inventory/handler.ts').inventoryHandler;
 const admin=load('src/lib/player/beta-admin-handler.ts').betaAdminHandler;
 const wallet=load('src/lib/player/wallet/handler.ts').walletHandler;
 for(const [handler,route,method] of [[inventory,'/api/player/inventory','POST'],[admin,'/api/player/beta-admin','POST'],[wallet,'/api/player/wallet','POST']]){
  const deps={enabled:true,webOrigin:prod,rpc:async()=>{throw Error('Unauthenticated requests must not reach account service');}};
  const good=new Request(prod+route,{method,headers:{host:'evoverses.com',origin:prod}});assert.equal((await handler(good,deps)).status,401);
  for(const headers of [{host:'evoverses.com',origin:beta},{host:'attacker.test',origin:prod}])assert.equal((await handler(new Request(prod+route,{method,headers}),deps)).status,403);
 }
});
test('wallet signatures stay bound to their actual page across beta and production',()=>{
 const {createSiweMessage}=require('viem/siwe'),{walletChallengeMatches}=load('src/lib/player/wallet/challenge.ts');const now=Date.now(),address='0x'+'11'.repeat(20),expiresAt=new Date(now+300000).toISOString();
 for(const origin of [beta,prod]){
  const challenge={challengeId:'fixture',expiresAt,message:createSiweMessage({scheme:'https',domain:new URL(origin).host,uri:origin+'/profile',address,chainId:43114,version:'1',nonce:'12345678',requestId:'fixture',issuedAt:new Date(now),expirationTime:new Date(expiresAt)})};
  assert.equal(walletChallengeMatches(challenge,address,origin,now),true);assert.equal(walletChallengeMatches(challenge,address,origin===prod?beta:prod,now),false);
 }
});
test('production webhook verifies signatures and ignores events for the other website',async()=>{
 let fulfilled=0,verified=0;const {handleStripeWebhook}=loader({'./core':{fulfillCardPayment:async()=>{fulfilled++;return 'credited';},StorePaymentError:class extends Error {}}})('src/lib/store/stripe/webhook-handler.ts');
 const checkout={id:'cs_test_fixture',metadata:{storeOrigin:beta}};const service={config:{origin:prod,live:false,webhookSecret:'synthetic'},players:{},gateway:{},sdk:{webhooks:{constructEvent:()=>{verified++;return {livemode:false,type:'checkout.session.completed',data:{object:checkout}};}}}};
 const request=()=>new Request(prod+'/api/store/stripe/webhook',{method:'POST',headers:{'stripe-signature':'fixture'},body:'{}'});
 assert.equal((await(await handleStripeWebhook(request(),service)).json()).status,'ignored');assert.equal(fulfilled,0);
 checkout.metadata.storeOrigin=prod;assert.equal((await(await handleStripeWebhook(request(),service)).json()).status,'credited');assert.equal(fulfilled,1);assert.equal(verified,2);
 service.config.webhookOrigins=[beta,prod];checkout.metadata.storeOrigin=beta;assert.equal((await(await handleStripeWebhook(request(),service)).json()).status,'credited');assert.equal(fulfilled,2);
});
test('production and staged routing stay explicit and existing privacy and service pages are retained',()=>{
 const config=JSON.parse(fs.readFileSync('wrangler.production.jsonc','utf8'));assert.deepEqual(config.routes,[{pattern:'evoverses.com/*',zone_id:'3adca176848846d97901677ea588989b'}]); const staged=JSON.parse(fs.readFileSync('wrangler.production-staged.jsonc','utf8'));assert.deepEqual(staged.routes,[]);assert.deepEqual({...config,routes:[]},staged);assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);assert.equal(config.vars.EVOVERSES_WEB_ORIGIN,prod);
 const privacy=fs.readFileSync('src/app/privacy/page.tsx','utf8');assert.match(privacy,/836ee923-8be7-4ffb-8bba-e53a9aebe6fe/);assert.match(privacy,/https:\/\/app.termly.io\/embed-policy.min.js/);
 for(const page of ['privacy','links'])assert.equal(fs.existsSync('src/app/'+page+'/page.tsx'),true);
});
