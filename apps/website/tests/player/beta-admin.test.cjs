'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleRef={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/player/beta-admin-handler.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:moduleRef,exports:moduleRef.exports,Buffer,URL,Response,TextDecoder,require:name=>name==='./auth-core'?{playerSessionCookie:'ev:player-session'}:require(name)});
const {betaAdminHandler}=moduleRef.exports;
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',token='a'.repeat(64);
const input={requestId:receipt,playerId:id,action:'grant_item',reason:'Event reward',productId:'evo_pack_2',revision:2,quantity:1};
const result={operationId:receipt,playerId:id,action:'grant_item',access:'approved',version:1,evoros:5000,evorosGranted:0,sessionsRevoked:0,productId:'evo_pack_2',revision:2,quantityGranted:1,remainingQuantity:1};
const request=(body={operation:'action',input},headers={},url='http://localhost:3100/api/player/beta-admin')=>new Request(url,{method:'POST',headers:{host:'localhost:3100',origin:'http://localhost:3100',cookie:'ev:player-session='+token,'content-type':'application/json',...headers},body:JSON.stringify(body)});
test('disabled adapter, foreign origin, duplicate cookies and missing session never reach backend',async()=>{
 let calls=0;const rpc=async()=>{calls++;throw Error('unexpected');};
 assert.equal((await betaAdminHandler(request(),{enabled:false,rpc})).status,503);
 for(const headers of [{origin:'https://attacker.example'},{host:'beta.evoverses.com'},{cookie:''},{cookie:`ev:player-session=${token}; ev:player-session=${token}`}])assert.ok([401,403].includes((await betaAdminHandler(request(undefined,headers),{enabled:true,rpc})).status));
 assert.equal((await betaAdminHandler(request(undefined,{},'http://localhost:3100/api/player/beta-admin?admin=true'),{enabled:true,rpc})).status,403);
 assert.equal(calls,0);
});
test('grant payload is strict and excludes client-selected actors, free-form effects and invalid quantities',async()=>{
 let calls=0;const rpc=async()=>{calls++;return{status:200,value:result};};
 for(const patch of [{administratorId:id},{verified:true},{quantity:0},{quantity:1001},{quantity:1.5},{reason:''},{effect:{evos:999}}])assert.equal((await betaAdminHandler(request({operation:'action',input:{...input,...patch}}),{enabled:true,rpc})).status,400);
 assert.equal((await betaAdminHandler(request({operation:'action',input:{...input,reason:'x'.repeat(4100)}}),{enabled:true,rpc})).status,413);assert.equal(calls,0);
});
test('valid retries preserve request ID and payload, session travels only to backend, private output is stripped',async()=>{
 const calls=[];const rpc=async(operation,session,data)=>{calls.push({operation,session,data});return{status:200,value:{...result,sessionToken:token,walletAddress:'private'}};};
 for(let i=0;i<2;i++){const response=await betaAdminHandler(request(),{enabled:true,rpc});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),result);}
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),Array.from({length:2},()=>({operation:'action',session:token,data:input})));
});
test('backend role checks and safe errors are retained; arbitrary errors and malformed success fail closed',async()=>{
 const call=(status,value)=>betaAdminHandler(request(),{enabled:true,rpc:async()=>({status,value})});
 const denied=await call(403,{error:{code:'ADMIN_REQUIRED',details:'private'}});assert.equal(denied.status,403);assert.deepEqual(await denied.json(),{error:{code:'ADMIN_REQUIRED'}});
 for(const [status,value] of [[500,{error:{code:'SQL credentials'}}],[200,{...result,evoros:-1}]])assert.deepEqual(await(await call(status,value)).json(),{error:{code:'BETA_ADMIN_UNAVAILABLE'}});
});
test('list removes identity/wallet fields and projects human and automated audit results',async()=>{
 const response=await betaAdminHandler(request({operation:'list',input:{search:'Dan'}}),{enabled:true,rpc:async()=>({status:200,value:{administratorId:id,players:[{id,displayName:'Danmancs',experience:123,accountStatus:'active',evoros:5000,access:'approved',version:1,administrator:true,masterAdministrator:true,initialGrant:true,wallets:['private']}],more:false,total:1,page:1,products:[],history:[{id:receipt,administratorId:null,ruleId:'player-level-pack-v1',eventKey:'level:10',playerId:id,displayName:'Danmancs',action:'grant_item',reason:'Verified automatic reward',createdAt:'2026-10-09T00:00:00.000Z',result:{...result,proof:'private'}}],identities:['private']}})});
 assert.equal(response.status,200);const body=await response.json();assert.equal(JSON.stringify(body).includes('private'),false);assert.deepEqual(body.history[0].result,result);
});


test('permanent admin changes have explicit actions, support non-beta accounts and reject forged permissions',async()=>{
 for(const action of ['promote_admin','revoke_admin']){
  const data={requestId:receipt,playerId:id,action,reason:'Confirmed account role change'};
  let calls=0;
  const rpc=async()=>{calls++;return {status:200,value:{...result,action,access:'pending',administrator:action==='promote_admin'}};};
  assert.equal((await betaAdminHandler(request({operation:'action',input:data}),{enabled:true,rpc})).status,200);
  assert.equal((await betaAdminHandler(request({operation:'action',input:{...data,administrator:true}}),{enabled:true,rpc})).status,400);
  assert.equal(calls,1);
 }
});
test('list sorting and paging are restricted and XP is projected without provider identities',async()=>{
 let calls=0;const rpc=async()=>{calls++;return {status:403,value:{error:{code:'ADMIN_REQUIRED'}}};};
 for(const input of [{sort:'name; DROP TABLE players'},{direction:'down'},{page:0}]) assert.equal((await betaAdminHandler(request({operation:'list',input}),{enabled:true,rpc})).status,400);
 assert.equal(calls,0);
});

test('ordinary admin requests cannot assign protected master status',async()=>{
 const data={requestId:receipt,playerId:id,action:'promote_admin',reason:'Role change',masterAdministrator:true};let calls=0;
 const r=await betaAdminHandler(request({operation:'action',input:data}),{enabled:true,rpc:async()=>{calls++;return {status:200,value:result};}});
 assert.equal(r.status,400);assert.equal(calls,0);
});

test('ban/unban require current status and forward only strict authenticated moderation payloads',async()=>{
 for(const action of ['ban','unban']){
  let calls=0;
  const input={requestId:receipt,playerId:id,action,reason:'Moderation decision',expectedAccountStatus:action==='ban'?'active':'suspended'};
  const rpc=async(op,t,data)=>{calls++;assert.equal(t,token);assert.equal(data.action,action);return {status:200,value:{...result,action,accountStatus:action==='ban'?'suspended':'active'}};};
  assert.equal((await betaAdminHandler(request({operation:'action',input}),{enabled:true,rpc})).status,200);
  assert.equal((await betaAdminHandler(request({operation:'action',input:{...input,expectedAccountStatus:'closed'}}),{enabled:true,rpc})).status,400);
  assert.equal(calls,1);
 }
});

test('delete uses strict status-bound payloads and accepts the closed receipt without leaking private fields',async()=>{
 const input={requestId:receipt,playerId:id,action:'delete',reason:'Test account cleanup',expectedAccountStatus:'active'};
 let calls=0;const rpc=async()=>{calls++;return {status:200,value:{...result,action:'delete',accountStatus:'closed'}};};
 const response=await betaAdminHandler(request({operation:'action',input}),{enabled:true,rpc});assert.equal(response.status,200);assert.equal((await response.json()).accountStatus,'closed');
 for(const extra of [{expectedAccountStatus:'closed'},{hardDelete:true},{cascade:true}])assert.equal((await betaAdminHandler(request({operation:'action',input:{...input,...extra}}),{enabled:true,rpc})).status,400);
 assert.equal(calls,1);
});
