'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/player/beta-admin-client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,fetch,AbortSignal,setTimeout,Error});
const {sendBetaAdminRequest}=mod.exports;
const input={requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',playerId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',action:'grant_evoros',amount:500,reason:'Event reward'},wait=async()=>{};
test('lost grant response retries exactly the same idempotent operation without changing amount or recipient',async()=>{
 const bodies=[],credits=new Map();
 const value=await sendBetaAdminRequest('action',input,async(_,options)=>{
  bodies.push(options.body);const action=JSON.parse(options.body).input;
  if(!credits.has(action.requestId))credits.set(action.requestId,action.amount);
  if(bodies.length===1)throw Error('Response lost after commit');
  return Response.json({evorosGranted:500});
 },wait);
 assert.equal(value.evorosGranted,500);assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);assert.equal(credits.size,1);assert.equal([...credits.values()].reduce((a,b)=>a+b,0),500);
});
test('temporary service failures get one bounded retry; two failures remain uncertain',async()=>{
 for(const status of [429,503]){
  let calls=0;await assert.rejects(sendBetaAdminRequest('action',input,async()=>{calls++;return Response.json({error:{code:'BETA_ADMIN_UNAVAILABLE'}},{status});},wait),/BETA_ADMIN_UNAVAILABLE/);assert.equal(calls,2);
 }
});
test('role, session, validation and conflict denials never retry; list requests and unkeyed writes never retry',async()=>{
 for(const status of [400,401,403,409]){let calls=0;await assert.rejects(sendBetaAdminRequest('action',input,async()=>{calls++;return Response.json({error:{code:'DENIED'}},{status});},wait),/DENIED/);assert.equal(calls,1);}
 for(const [operation,payload] of [['list',{}],['action',{}]]){let calls=0;await assert.rejects(sendBetaAdminRequest(operation,payload,async()=>{calls++;throw Error('Offline');},wait),/NETWORK_UNCERTAIN/);assert.equal(calls,1);}
});
