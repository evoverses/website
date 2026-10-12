'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,Buffer,URL,Response,TextDecoder,require:name=>imports[name]??require(name)});return mod.exports;}
const core=load('src/lib/leaderboard/rewards-core.ts');
const {rewardsHandler}=load('src/lib/leaderboard/rewards-handler.ts',{'@/lib/player/auth-core':{playerSessionCookie:'ev:player-session'},'./rewards-core':core});
const origin='https://beta.evoverses.com',token='a'.repeat(64),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const period={id,period:'week',start:'2026-10-05T00:00:00.000Z',end:'2026-10-12T00:00:00.000Z',status:'awarded',policyVersion:'leaderboard-prizes-v1',decidedAt:'2026-10-12T12:00:00.000Z',winners:[{name:'Trainer',xp:100,battles:5,place:1,items:[{productId:'evo_pack_4',revision:2,quantity:1}],badge:null}]};
const adminPeriod={...period,previewHash:'b'.repeat(64),reason:null,decidedBy:id,winners:period.winners.map(w=>({...w,playerId:id}))};
function request(kind,body,headers={}){return new Request(origin+'/api/leaderboard/rewards'+(kind==='archive'?'/archive':kind==='mine'?'/me':''),{method:kind==='admin'?'POST':'GET',headers:{host:'beta.evoverses.com',origin,cookie:'ev:player-session='+token,'content-type':'application/json',...headers},...(kind==='admin'?{body:JSON.stringify(body)}:{})});}
test('reward actions reject foreign origins, absent sessions and client-controlled grants',async()=>{
 let calls=0;const deps={origin,rpc:async()=>{calls++;throw Error('unexpected');}};
 const body={operation:'approve',input:{periodId:id,previewHash:'b'.repeat(64)}};
 assert.equal((await rewardsHandler(request('admin',body,{origin:'https://attacker.example'}),'admin',deps)).status,403);
 assert.equal((await rewardsHandler(request('admin',body,{cookie:''}),'admin',deps)).status,401);
 for(const input of [{...body.input,quantity:100},{...body.input,recipients:[id]}, {...body.input,previewHash:'invalid'}])assert.equal((await rewardsHandler(request('admin',{...body,input}),'admin',deps)).status,400);
 assert.equal(calls,0);
});
test('public archives never forward a session or accept private identifiers; own rewards are uncached',async()=>{
 let calls=0;const rpc=async(operation,input,session)=>{calls++;if(operation==='archive'){assert.equal(session,undefined);return {status:200,value:{page:0,more:false,periods:[period]}};}assert.equal(session,token);return {status:200,value:{badges:[{medal:'gold',month:'2026-09'}],rewards:[period]}};};
 const archive=await rewardsHandler(request('archive'),'archive',{origin,rpc});assert.equal(archive.status,200);assert.equal(archive.headers.get('cache-control'),'public, max-age=60');assert.ok(!(await archive.text()).includes('playerId'));
 const mine=await rewardsHandler(request('mine'),'mine',{origin,rpc});assert.equal(mine.status,200);assert.equal(mine.headers.get('cache-control'),'no-store');assert.equal((await mine.json()).badges[0].medal,'gold');
 const privateResult=await rewardsHandler(request('archive'),'archive',{origin,rpc:async()=>({status:200,value:{page:0,more:false,periods:[adminPeriod]}})});assert.equal(privateResult.status,503);
 assert.equal(calls,2);
});
test('changed approval previews and already awarded receipts survive projection without granting from the browser',async()=>{
 const body={operation:'approve',input:{periodId:id,previewHash:'b'.repeat(64)}};
 for(const status of ['preview_changed','awarded']){const response=await rewardsHandler(request('admin',body),'admin',{origin,rpc:async(operation,input,session)=>{assert.equal(operation,'approve');assert.equal(input.periodId,id);assert.equal(session,token);return {status:200,value:{status,period:adminPeriod}};}});assert.equal(response.status,200);assert.equal((await response.json()).status,status);}
});

test('archive period filters are validated and forwarded before pagination',async()=>{
 let calls=0;
 for(const selected of ['day','week','month']){
  const response=await rewardsHandler(new Request(origin+'/api/leaderboard/rewards/archive?period='+selected+'&page=2',{headers:{host:'beta.evoverses.com'}}),'archive',{origin,rpc:async(operation,input)=>{calls++;assert.equal(operation,'archive');assert.equal(input.period,selected);assert.equal(input.page,2);return {status:200,value:{page:2,more:false,periods:[]}};}});
  assert.equal(response.status,200);
 }
 for(const query of ['period=all','period=year','period=day&period=week','period=','period=day&extra=1'])assert.equal((await rewardsHandler(new Request(origin+'/api/leaderboard/rewards/archive?'+query,{headers:{host:'beta.evoverses.com'}}),'archive',{origin,rpc:async()=>{throw Error('Invalid filter forwarded');}})).status,400);
 assert.equal(calls,3);
});
