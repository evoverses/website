const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,Buffer,Headers,AbortController,URL,URLSearchParams,TextDecoder,setTimeout,clearTimeout,fetch,Date,require:name=>Object.hasOwn(imports,name)?imports[name]:require(name)});
 return module.exports;
}
const healthCore=load('../../packages/evoverses/src/lib/asset/health.ts');
const evoCore=load('src/lib/player/inventory/evo.ts',{'@/data/evo-progression.json':require('../../src/data/evo-progression.json'),'@workspace/evoverses/lib/asset/health':healthCore});
const combatCore=load('src/lib/player/inventory/combat.ts');
const core=load('src/lib/player/auth-core.ts',{'./inventory/evo':evoCore,'./inventory/combat':combatCore});
const profile={player:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',displayName:'Test trainer',experience:40},balance:{evoros:125}};
const token='a'.repeat(64);
const config={clientId:'fixture-client',clientSecret:'synthetic-secret',applicationId:'fixture-app',deploymentId:'fixture-deployment',apiUrl:'http://127.0.0.1:50999'};
function setup(options={}){
 let clock=Date.now(),confirmation=options.confirmation,calls=[];
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 const flow=core.createPlayerWebAuth({configuration:()=>config,now:()=>clock,fetchImpl:async(url,init)=>{
  calls.push({url,init});
  if(url.endsWith('/token'))return json(options.providerResponse??{client_id:config.clientId,application_id:config.applicationId,account_id:'a'.repeat(32),token_type:'bearer',access_token:'synthetic.signed.proof'});
  if(url.endsWith('/login')){
   const input=JSON.parse(init.body);assert.equal(input.proof,'synthetic.signed.proof');
   if(confirmation&&!input.confirmNewPlayer)return json({error:{code:'NEW_PLAYER_CONFIRMATION_REQUIRED'}},409);
   if(options.loginDenied)return json({error:{code:'INVALID_PROVIDER_EVIDENCE'}},401);
   return json({player:profile.player,sessionToken:token,issuedAt:options.fractional?(clock-10)/1000:Math.floor(clock/1000),expiresAt:options.longSession?Math.floor(clock/1000)+options.longSession:options.fractional?(clock-10)/1000+900:Math.floor(clock/1000)+900});
  }
  if(url.endsWith('/me'))return options.meDenied?json({error:{code:'INVALID_SESSION'}},401):json(profile);
  if(url.endsWith('/inventory')&&options.inventory)return json(options.inventory);
  if(url.endsWith('/inventory'))return json({items:[{productId:'vital_dew',revision:1,quantity:2}],evos:[]});
  if(url.endsWith('/logout'))return new Response(null,{status:204});
  throw Error('Unexpected endpoint');
 }});
 const begin=()=>{const x=flow.start();return{...x,state:new URL(x.url).searchParams.get('state')};};
 return {flow,begin,calls,advance:n=>clock+=n};
}
const reject=(promise,code)=>assert.rejects(promise,e=>e.code===code);
test('authorization uses fixed Epic endpoint, registered callback, reviewed deployment and random browser-bound state',()=>{
 const {begin}=setup();const first=begin(),second=begin(),url=new URL(first.url);
 assert.equal(url.origin,'https://www.epicgames.com');assert.equal(url.pathname,'/id/authorize');
 assert.equal(url.searchParams.get('redirect_uri'),'http://localhost:3100/api/player/auth/epic/callback');
 assert.equal(url.searchParams.get('prompt'),'login');
 assert.equal(url.searchParams.get('client_id'),config.clientId);assert.equal(url.searchParams.get('scope'),'basic_profile friends_list presence country');
 assert.match(first.cookie,/^[a-f0-9]{64}$/);assert.notEqual(first.cookie,first.state);assert.notEqual(first.state,second.state);
 assert.equal(first.url.includes(config.clientSecret),false);
});
test('state mismatch, missing cookie, cross-browser callback and expiry cannot exchange a code',async()=>{
 const {flow,begin,calls,advance}=setup();const x=begin();
 await reject(flow.callback({state:x.state,cookie:'b'.repeat(64),code:'code'}),'SIGNIN_EXPIRED');
 await reject(flow.callback({state:x.state,cookie:'',code:'code'}),'SIGNIN_EXPIRED');
 await reject(flow.callback({state:'c'.repeat(64),cookie:x.cookie,code:'code'}),'SIGNIN_EXPIRED');
 assert.equal(calls.length,0);advance(300001);
 await reject(flow.callback({state:x.state,cookie:x.cookie,code:'code'}),'SIGNIN_EXPIRED');assert.equal(calls.length,0);
});
test('state consumed before exchange prevents parallel/replayed callbacks; no browser-selected player',async()=>{
 const {flow,begin,calls}=setup();const x=begin(),input={state:x.state,cookie:x.cookie,code:'code'};
 const success=flow.callback(input);await reject(flow.callback(input),'SIGNIN_EXPIRED');
 const result=await success;assert.equal(result.session.player.id,profile.player.id);
 assert.equal(calls.filter(c=>c.url.endsWith('/token')).length,1);
 assert.deepEqual(Object.keys(JSON.parse(calls.find(c=>c.url.endsWith('/login')).init.body)).sort(),['confirmNewPlayer','proof']);
 assert.equal(new URLSearchParams(calls[0].init.body).get('deployment_id'),config.deploymentId);
 assert.equal(calls.every(c=>c.init.redirect==='manual'&&c.init.cache==='no-store'),true);
});
test('new player needs explicit confirmation; proof stays server-side and confirmation is single-use',async()=>{
 const {flow,begin}=setup({confirmation:true});const x=begin();
 const result=await flow.callback({state:x.state,cookie:x.cookie,code:'code'});
 assert.equal(result.session,undefined);assert.match(result.pendingCookie,/^[a-f0-9]{64}$/);
 assert.equal(JSON.stringify(result).includes('synthetic.signed.proof'),false);
 assert.equal(flow.hasPending(result.pendingCookie),true);
 const session=await flow.confirm(result.pendingCookie);assert.equal(session.player.id,profile.player.id);
 await reject(flow.confirm(result.pendingCookie),'SIGNIN_EXPIRED');assert.equal(flow.hasPending(result.pendingCookie),false);
});
test('confirmation expires and backend revalidates evidence rather than trusting the OAuth return',async()=>{
 const {flow,begin,advance}=setup({confirmation:true});const x=begin();const result=await flow.callback({state:x.state,cookie:x.cookie,code:'code'});advance(60001);
 await reject(flow.confirm(result.pendingCookie),'SIGNIN_EXPIRED');
 const denied=setup({loginDenied:true}),y=denied.begin();await reject(denied.flow.callback({state:y.state,cookie:y.cookie,code:'code'}),'EPIC_VERIFICATION_FAILED');
});
test('provider cancellation and wrong client response fail closed',async()=>{
 const {flow,begin,calls}=setup();const x=begin();await reject(flow.callback({state:x.state,cookie:x.cookie,cancelled:true}),'EPIC_CANCELLED');assert.equal(calls.length,0);
 const s=setup({providerResponse:{client_id:'other-client'}}),y=s.begin();await reject(s.flow.callback({state:y.state,cookie:y.cookie,code:'code'}),'EPIC_VERIFICATION_FAILED');assert.equal(s.calls.filter(c=>c.url.endsWith('/login')).length,0);
});
test('failed profile hydration revokes the issued session and does not sign browser in',async()=>{
 const s=setup({meDenied:true}),x=s.begin();await reject(s.flow.callback({state:x.state,cookie:x.cookie,code:'code'}),'SERVICE_UNAVAILABLE');
 assert.equal(s.calls.some(c=>c.url.endsWith('/logout')),true);
});
test('profile/inventory are projected from bearer-authorised backend and malformed sessions are refused',async()=>{
 const {flow,calls}=setup();assert.equal((await flow.readProfile(token)).balance.evoros,125);assert.equal((await flow.readInventory(token)).items[0].quantity,2);
 await flow.logout(token);assert.equal(calls.every(c=>c.init.headers.authorization==='Bearer '+token),true);
 const prior=calls.length;await reject(flow.readProfile('claimed-player-id'),'INVALID_SESSION');assert.equal(calls.length,prior);
});
test('response body size and global start budgets are bounded',async()=>{
 const flow=core.createPlayerWebAuth({configuration:()=>config,fetchImpl:async()=>new Response('x'.repeat(65537),{headers:{'content-type':'application/json'}})});
 await reject(flow.readProfile(token),'SERVICE_UNAVAILABLE');
 const {begin}=setup();for(let i=0;i<30;i++)begin();assert.throws(()=>begin(),e=>e.code==='SIGNIN_BUSY');
});

// Real route handlers with a tiny Next response double: cookie flags, Origin and callback validation.
class Reply{
 constructor(body,status){this.body=body;this.status=status;this.headers=new Headers();this.cookies={values:[],set:(...args)=>this.cookies.values.push(args)};}
 static redirect(url,status){const r=new Reply(null,status);r.headers.set('location',String(url));return r;}
 static json(value,{status=200}={}){return new Reply(value,status);}
}
function routes(enabled=true,origin=core.playerWebOrigin,lifetime=899.125){let starts=0,logouts=0;const auth={start:()=>{starts++;return{url:'https://www.epicgames.com/id/authorize?state=public-state',cookie:'a'.repeat(64)}},logout:async()=>{logouts++},callback:async()=>({session:{token,expiresAt:Date.now()/1000+lifetime}})};
 auth.startAsync=async()=>auth.start();
 const handlers=load('src/lib/player/handlers.ts',{'server-only':{},'next/server':{NextResponse:Reply},'./auth-core':core,'./server':{playerLoginEnabled:enabled,getPlayerWebOrigin:()=>origin,playerWebAuth:()=>auth}});
 return{handlers,count:()=>({starts,logouts})};}
const req=(url='http://localhost:3100/api/player/auth/epic/start',origin='http://localhost:3100',cookie=token)=>({url,headers:new Headers({host:new URL(url).host,...(origin?{origin}: {})}),cookies:{get:()=>cookie?{value:cookie}:undefined}});
test('cross-site or wrong-host mutations cannot issue or clear any cookies or revoke a session',async()=>{
 const {handlers,count}=routes();for(const input of [req(undefined,'https://attacker.example'),req(undefined,null),req('http://127.0.0.1:3100/api/player/auth/epic/start')]){
  for(const handler of [handlers.startEpic,handlers.signOutPlayer,handlers.confirmEpic]){const r=await handler(input);assert.equal(r.status,403);assert.equal(r.cookies.values.length,0);}
 }
 assert.deepEqual(count(),{starts:0,logouts:0});
});
test('OAuth cookies are HttpOnly, scoped and SameSite=Lax; responses do not cache or forward referrers',async()=>{
 const {handlers}=routes();const r=await handlers.startEpic(req());assert.equal(r.status,303);
 const state=r.cookies.values.find(x=>x[0]===core.epicStateCookie);assert.equal(state[2].httpOnly,true);assert.equal(state[2].sameSite,'lax');assert.equal(state[2].path,'/api/player/auth/epic');assert.equal(state[2].maxAge,300);
 assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('referrer-policy'),'no-referrer');
});
test('duplicate callback parameters are refused before token exchange',async()=>{
 const {handlers}=routes();const r=await handlers.epicCallback(req('http://localhost:3100/api/player/auth/epic/callback?state=one&state=two&code=code',null));assert.equal(r.headers.get('location'),'http://localhost:3100/signin?status=SIGNIN_EXPIRED');
});
test('disabled local adapter exposes no authentication mutation',async()=>{
 const {handlers,count}=routes(false);assert.equal((await handlers.startEpic(req())).status,403);assert.equal(count().starts,0);
});
test('successful sign-out revokes the backend session and expires browser cookies',async()=>{
 const {handlers,count}=routes();const r=await handlers.signOutPlayer(req('http://localhost:3100/api/player/auth/logout'));
 assert.equal(count().logouts,1);assert.equal(r.headers.get('location'),'http://localhost:3100/signin?status=SIGNED_OUT');
 const cookie=r.cookies.values.find(v=>v[0]===core.playerSessionCookie);assert.equal(cookie[1],'');assert.equal(cookie[2].maxAge,0);assert.equal(cookie[2].httpOnly,true);
});
test('configuration enables nothing in production, even with local switches set',()=>{
 const compiled=ts.transpileModule(fs.readFileSync('src/lib/player/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};const forbidden=()=>{throw Error('Must not read credentials');};
 vm.runInNewContext(compiled,{module,exports:module.exports,process:{env:{NODE_ENV:'production',EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN:'1',NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN:'1',EVOVERSES_LOCAL_EPIC_PRIVATE_INI:'synthetic-file'}},require:name=>({
  'server-only':{},'node:fs':{readFileSync:forbidden,statSync:forbidden,existsSync:forbidden},'node:path':require('node:path'),
  'react':{cache:fn=>fn},'next/headers':{cookies:forbidden},'./auth-core':core
 }[name])});
 assert.equal(module.exports.localPlayerLogin,false);assert.equal(module.exports.getLocalEpicConfig(),null);
});

test('accepts real backend fractional epoch-second timestamps without extending session expiry',async()=>{
 const s=setup({fractional:true}),x=s.begin();const result=await s.flow.callback({state:x.state,cookie:x.cookie,code:'code'});
 assert.equal(result.session.player.id,profile.player.id);assert.equal(Number.isFinite(result.session.expiresAt),true);
});

test('accepted callback sets only the independent HttpOnly session with integer bounded cookie lifetime',async()=>{
 const {handlers}=routes();const r=await handlers.epicCallback(req('http://localhost:3100/api/player/auth/epic/callback?state='+('b'.repeat(64))+'&code=synthetic-code',null));
 assert.equal(r.headers.get('location'),'http://localhost:3100/profile');
 const cookie=r.cookies.values.find(v=>v[0]===core.playerSessionCookie);assert.equal(cookie[1],token);assert.equal(cookie[2].httpOnly,true);assert.equal(cookie[2].sameSite,'lax');assert.equal(cookie[2].path,'/');assert.equal(Number.isInteger(cookie[2].maxAge),true);assert.equal(cookie[2].maxAge<=900,true);
 assert.equal(r.cookies.values.some(v=>v[0]==='ev:jwt'),false);
});

test('failure diagnostics report fixed stage/status only and cannot expose proofs or disrupt authentication', async()=>{
 const events=[];
 const flow=core.createPlayerWebAuth({configuration:()=>config,diagnostic:event=>events.push(event),fetchImpl:async()=>Response.json({error:'synthetic-provider-secret'}, {status:503})});
 const x=flow.start();
 await reject(flow.callback({state:new URL(x.url).searchParams.get('state'),cookie:x.cookie,code:'synthetic-private-code'}),'EPIC_VERIFICATION_FAILED');
 assert.equal(events.length,1);assert.equal(events[0].stage,'epic-token');assert.equal(events[0].outcome,'http-error');assert.equal(events[0].status,503);
 assert.deepEqual(Object.keys(events[0]).sort(),['elapsedMs','outcome','stage','status']);
 assert.equal(JSON.stringify(events).includes('synthetic'),false);
 const broken=core.createPlayerWebAuth({configuration:()=>config,diagnostic:()=>{throw Error('logger failed')},fetchImpl:async()=>{throw Error('synthetic-private-response')}});
 const y=broken.start();await reject(broken.callback({state:new URL(y.url).searchParams.get('state'),cookie:y.cookie,code:'synthetic-private-code'}),'SERVICE_UNAVAILABLE');
});

test('hosted cookies are Secure and exact HTTPS origin checks reject local, forwarded and cross-site requests',async()=>{
 const origin='https://beta.evoverses.com',{handlers,count}=routes(true,origin);
 const r=await handlers.startEpic(req(origin+'/api/player/auth/epic/start',origin));
 assert.equal(r.status,303);assert.equal(r.cookies.values.find(v=>v[0]===core.epicStateCookie)[2].secure,true);
 const callback=await handlers.epicCallback(req(origin+'/api/player/auth/epic/callback?state='+('b'.repeat(64))+'&code=code',null));
 assert.equal(callback.headers.get('location'),origin+'/profile');assert.equal(callback.cookies.values.find(v=>v[0]===core.playerSessionCookie)[2].secure,true);
 for(const input of [req(),req(origin+'/api/player/auth/epic/start','https://evoverses.com'),req('http://beta.evoverses.com/api/player/auth/epic/start',origin)])assert.equal((await handlers.startEpic(input)).status,403);
 assert.equal(count().starts,1);
});

test('hosted OAuth survives multiple instances using the real encrypted database store and does not send service credentials to Epic',async()=>{
 const path=require('node:path'),backend=path.join(process.env.EVOVERSES_ACCOUNT_TEST_REPO||path.resolve(__dirname,'../../../../..','evoverses-beta-account-bridge'),'Prototypes/player_economy');
 const {localPGlite}=require(path.join(backend,'scripts/local-pglite.cjs')),{embeddedDatabase}=require(path.join(backend,'src/database.cjs')),{WebOAuthStore}=require(path.join(backend,'src/web-oauth-store.cjs'));
 const db=new (localPGlite())();
 try{
  await db.exec('CREATE SCHEMA player');await db.exec(fs.readFileSync(path.join(backend,'schema/012_web_oauth.sql'),'utf8'));
  const hosted={...config,apiUrl:'https://accounts.example.com',hosted:{origin:'https://beta.evoverses.com',serviceToken:'d'.repeat(64)}};
  let exchanges=0;
  const fetchImpl=async(url,init)=>{
   const headers=new Headers(init.headers);
   if(url.endsWith('/token')){exchanges++;assert.equal(headers.has('x-evoverses-service'),false);assert.equal(new URLSearchParams(init.body).get('redirect_uri'),'https://beta.evoverses.com/api/player/auth/epic/callback');return Response.json({client_id:config.clientId,application_id:config.applicationId,account_id:'a'.repeat(32),token_type:'bearer',access_token:'synthetic.signed.proof'});}
   assert.equal(headers.get('x-evoverses-service'),'d'.repeat(64));
   if(url.endsWith('/login')){if(!JSON.parse(init.body).confirmNewPlayer)return Response.json({error:{code:'NEW_PLAYER_CONFIRMATION_REQUIRED'}},{status:409});return Response.json({player:profile.player,sessionToken:token,issuedAt:Date.now()/1000,expiresAt:Date.now()/1000+899});}
   if(url.endsWith('/me'))return Response.json(profile);
   throw Error('Unexpected endpoint');
  };
  const instance=()=>core.createPlayerWebAuth({configuration:()=>hosted,fetchImpl,transactions:new WebOAuthStore({database:embeddedDatabase(db),key:Buffer.alloc(32,1)})});
  const first=instance();assert.throws(()=>first.start(),e=>e.code==='SIGNIN_UNAVAILABLE');
  const started=await first.startAsync(),input={state:new URL(started.url).searchParams.get('state'),cookie:started.cookie,code:'code'};
  const second=instance(),result=await second.callback(input);assert.equal(exchanges,1);
  await reject(first.callback(input),'SIGNIN_EXPIRED');
  const third=instance();assert.equal(await third.hasPendingAsync(result.pendingCookie),true);
  assert.equal((await third.confirm(result.pendingCookie)).player.id,profile.player.id);
  await reject(second.confirm(result.pendingCookie),'SIGNIN_EXPIRED');
 }finally{await db.close();}
});

test('hosted configuration refuses incomplete credentials, HTTP, IP addresses, URL paths and production local switches',()=>{
 const {hostedAccountConfig}=load('src/lib/player/hosted-config.ts');
 const env={NODE_ENV:'production',EVOVERSES_HOSTED_BETA:'1',AUTH_EPIC_ID:'syntheticclient00000001',AUTH_EPIC_SECRET:'synthetic-secret',EVOVERSES_EPIC_APPLICATION_ID:'fixture-app',EVOVERSES_EPIC_DEPLOYMENT_ID:'fixture-deployment',EVOVERSES_ACCOUNT_API_ORIGIN:'https://accounts.example.com',EVOVERSES_ACCOUNT_SERVICE_TOKEN:'d'.repeat(64)};
 assert.equal(hostedAccountConfig(env).hosted.origin,'https://beta.evoverses.com');
 for(const patch of [{NODE_ENV:'development'},{EVOVERSES_HOSTED_BETA:'0'},{AUTH_EPIC_SECRET:undefined},{EVOVERSES_ACCOUNT_SERVICE_TOKEN:undefined},{EVOVERSES_ACCOUNT_API_ORIGIN:'http://accounts.example.com'},{EVOVERSES_ACCOUNT_API_ORIGIN:'https://127.0.0.1'},{EVOVERSES_ACCOUNT_API_ORIGIN:'https://accounts.example.com/'},{EVOVERSES_ACCOUNT_API_ORIGIN:'https://accounts.example.com/path'},{EVOVERSES_ACCOUNT_API_ORIGIN:'https://user:password@accounts.example.com'}])assert.equal(hostedAccountConfig({...env,...patch}),null);
});

test('OAuth RPC authenticates only to fixed HTTPS service and projects bounded, safe results',async()=>{
 const {createOAuthRpc}=load('src/lib/player/oauth-rpc.ts',{'./auth-core':core});
 const input={keyHash:'a'.repeat(64),bindingHash:'b'.repeat(64),contextHash:'c'.repeat(64)};
 const connection=()=>({apiUrl:'https://accounts.example.com',serviceToken:'d'.repeat(64)});
 const calls=[];const rpc=createOAuthRpc({connection,fetchImpl:async(url,init)=>{calls.push({url,init});return Response.json({value:url.endsWith('take-pending')?'synthetic.signed.proof':true});}});
 await rpc.putState(input);assert.equal(await rpc.takePending(input),'synthetic.signed.proof');
 assert.equal(calls[0].url,'https://accounts.example.com/internal/web-oauth/put-state');assert.equal(calls[0].init.headers['X-EvoVerses-Service'],'d'.repeat(64));
 assert.equal(calls[0].init.redirect,'manual');assert.equal(calls[0].init.cache,'no-store');assert.equal(calls[0].init.credentials,'omit');
 assert.deepEqual(JSON.parse(calls[0].init.body),input);
 for(const response of [Response.json({value:'wrong-type'}),Response.json({value:true,proof:'unexpected'}),Response.json({value:'x'.repeat(24001)}),Response.json({error:{code:'raw-database-error'}},{status:500})]){
  await reject(createOAuthRpc({connection,fetchImpl:async()=>response}).hasPending(input),'SERVICE_UNAVAILABLE');
 }
 await reject(createOAuthRpc({connection,fetchImpl:async()=>Response.json({error:{code:'SIGNIN_EXPIRED'}},{status:409})}).takeState(input),'SIGNIN_EXPIRED');
 for(const apiUrl of ['http://accounts.example.com','https://accounts.example.com/path','https://127.0.0.1'])await reject(createOAuthRpc({connection:()=>({...connection(),apiUrl}),fetchImpl:async()=>{throw Error('Must not call');}}).putState(input),'SIGNIN_UNAVAILABLE');
});


test('account and OAuth transports refuse redirects without forwarding credentials',async()=>{
 const response=()=>Response.json({value:true,...profile},{status:307,headers:{location:'https://attacker.invalid/collect'}});
 let calls=0;
 const fetchImpl=async(url,init)=>{calls++;assert.equal(init.redirect,'manual');return response();};
 const flow=core.createPlayerWebAuth({configuration:()=>config,fetchImpl});
 await reject(flow.readProfile(token),'SERVICE_UNAVAILABLE');
 const {createOAuthRpc}=load('src/lib/player/oauth-rpc.ts',{'./auth-core':core});
 const rpc=createOAuthRpc({connection:()=>({apiUrl:'https://accounts.example.com',serviceToken:'d'.repeat(64)}),fetchImpl});
 await reject(rpc.putState({keyHash:'a'.repeat(64),bindingHash:'b'.repeat(64),contextHash:'c'.repeat(64)}),'SERVICE_UNAVAILABLE');
 assert.equal(calls,2);
});

test('seven-day login preserves backend expiry and browser cookie lifetime; longer sessions are rejected',async()=>{
 const s=setup({longSession:604800}),x=s.begin();
 const result=await s.flow.callback({state:x.state,cookie:x.cookie,code:'code'});
 assert.ok(result.session.expiresAt>Date.now()/1000+604790);
 const {handlers}=routes(true,core.playerWebOrigin,604800);
 const response=await handlers.epicCallback(req('http://localhost:3100/api/player/auth/epic/callback?state='+('b'.repeat(64))+'&code=synthetic-code',null));
 const cookie=response.cookies.values.find(v=>v[0]===core.playerSessionCookie);
 assert.ok(cookie[2].maxAge>=604790&&cookie[2].maxAge<=604800);
 const bad=setup({longSession:604801}),y=bad.begin();await reject(bad.flow.callback({state:y.state,cookie:y.cookie,code:'code'}),'SERVICE_UNAVAILABLE');
});
