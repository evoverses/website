const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript');
const output={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/beta-owner-worker.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:output,exports:output.exports,require:id=>{assert.equal(id,'./player/auth-core');return {playerSessionCookie:'ev:player-session'};},Request,Response,URL,Set});
const {createBetaOwnerWorker}=output.exports;
const owner='11111111-2222-3333-4444-555555555555';
function fixture(identity={player:{id:owner}},status=200){
 const requests=[];
 const worker=createBetaOwnerWorker({fetch:async request=>{
  requests.push(request);
  if(new URL(request.url).pathname==='/api/player/me'){
   if(identity instanceof Error)throw identity;
   return Response.json(identity,{status});
  }
  return new Response('beta content',{headers:{'Cache-Control':'public, max-age=3600'}});
 }});
 return {requests,fetch:(path='/',options={},env={EVOVERSES_BETA_OWNER_PLAYER_ID:owner},host='beta.evoverses.com')=>worker.fetch(new Request('https://'+host+path,options),env,{waitUntil(){}})};
}
function redirected(response,path='/',status=302){
 assert.equal(response.status,status);assert.equal(response.headers.get('location'),'https://evoverses.com'+path);
 assert.equal(response.headers.get('cache-control'),'private, no-store');assert.match(response.headers.get('vary'),/Cookie/);
}
test('anonymous beta visits redirect with the same path and query without a session lookup',async()=>{
 const f=fixture();redirected(await f.fetch('/nursery/bertha?egg=5112'),'/nursery/bertha?egg=5112');assert.equal(f.requests.length,0);
});
test('verified owner can enter beta and private responses cannot become cached public pages',async()=>{
 const f=fixture();const r=await f.fetch('/nursery/hermann',{headers:{cookie:'other=ignored; ev:player-session=opaque-owner',authorization:'Bearer ignored'}});
 assert.equal(await r.text(),'beta content');assert.equal(r.headers.get('cache-control'),'private, no-store');
 assert.equal(f.requests.length,2);assert.equal(f.requests[0].url,'https://beta.evoverses.com/api/player/me');
 assert.equal(f.requests[0].headers.get('cookie'),'ev:player-session=opaque-owner');assert.equal(f.requests[0].headers.get('authorization'),null);
});
test('another player cannot enter, even with the owner display name or a forged query',async()=>{
 const f=fixture({player:{id:'other',displayName:'DanMancs'},masterAdministrator:true});
 redirected(await f.fetch('/?owner='+owner,{headers:{cookie:'ev:player-session=someone'}}),'/?owner='+owner);assert.equal(f.requests.length,1);
});
test('invalid, expired, unavailable and malformed identity responses fail closed',async()=>{
 for(const [identity,status] of [[{player:{id:owner}},401],[{player:{id:owner}},503],[{},200],[new Error('offline'),200]]){
  const f=fixture(identity,status);redirected(await f.fetch('/',{headers:{cookie:'ev:player-session=opaque'}}));assert.equal(f.requests.length,1);
 }
});
test('missing owner configuration or duplicate/empty cookies cannot grant access',async()=>{
 for(const [cookie,env] of [['ev:player-session=one; ev:player-session=two',{EVOVERSES_BETA_OWNER_PLAYER_ID:owner}],['ev:player-session=',{EVOVERSES_BETA_OWNER_PLAYER_ID:owner}],['ev:player-session=opaque',{}]]){
  const f=fixture();redirected(await f.fetch('/',{headers:{cookie}},env));assert.equal(f.requests.length,0);
 }
});
test('blocked writes use 303 so mutations are not replayed on main',async()=>{
 const f=fixture();redirected(await f.fetch('/api/store/checkout',{method:'POST',body:'purchase'}),'/api/store/checkout',303);assert.equal(f.requests.length,0);
});
test('API, download and Next data routes are covered by the same owner check',async()=>{
 for(const path of ['/api/player/me','/api/nursery/access','/api/downloads/file','/_next/data/build/profile.json','/signin/anything','/api/player/auth/anything']){
  const f=fixture();redirected(await f.fetch(path),path);assert.equal(f.requests.length,0);
 }
});
test('exact sign-in and OAuth routes remain available for owner session recovery',async()=>{
 for(const path of ['/signin','/api/player/auth/epic/start','/api/player/auth/epic/callback','/api/player/auth/epic/confirm','/api/player/auth/logout']){
  const f=fixture();const r=await f.fetch(path);assert.equal(await r.text(),'beta content');assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(f.requests.length,1);
 }
});
test('public build assets still load for the sign-in page',async()=>{
 const f=fixture();assert.equal(await (await f.fetch('/_next/static/chunks/login.js')).text(),'beta content');assert.equal(f.requests.length,1);
});
test('main and local runtime requests retain existing behavior',async()=>{
 for(const host of ['evoverses.com','localhost','other.evoverses.com']){
  const f=fixture();const r=await f.fetch('/',{}, {},host);assert.equal(await r.text(),'beta content');assert.equal(r.headers.get('cache-control'),'public, max-age=3600');assert.equal(f.requests.length,1);
 }
});
