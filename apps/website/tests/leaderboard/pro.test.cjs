'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,Buffer,URL,Response,TextDecoder,require:name=>imports[name]??require(name)});return mod.exports;}
const core=load('src/lib/leaderboard/pro-core.ts'),{proHandler}=load('src/lib/leaderboard/pro-handler.ts',{'@/lib/player/auth-core':{playerSessionCookie:'ev:player-session'},'./pro-core':core});
const origin='https://beta.evoverses.com',id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',token='b'.repeat(64);
function request(body,extra={}){return new Request(origin+'/api/leaderboard/pro',{method:'POST',headers:{host:'beta.evoverses.com',origin,cookie:'ev:player-session='+token,'content-type':'application/json',...extra},body:JSON.stringify(body)});}
test('Pro public reads omit sessions and payout wallets and paginate monthly scores',async()=>{
 const response=await proHandler(new Request(origin+'/api/leaderboard/pro?month=2026-10&page=2',{headers:{host:'beta.evoverses.com',cookie:'ev:player-session='+token}}),{origin,rpc:async(operation,input,session)=>{assert.equal(operation,'read');assert.equal(input.month,'2026-10');assert.equal(input.page,2);assert.equal(session,undefined);return {status:200,value:{month:'2026-10',page:2,total:101,calculatedAt:'2026-10-12T00:00:00.000Z',pool:'1000',finalized:false,entries:[]}};}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'public, max-age=60');assert.equal(core.proBoardSchema.safeParse({...await response.json(),wallet:'0x'+'1'.repeat(40)}).success,false);
 for(const query of ['month=2026-13','month=2026-10&month=2026-09','page=-1','wallet=anything'])assert.equal((await proHandler(new Request(origin+'/api/leaderboard/pro?'+query,{headers:{host:'beta.evoverses.com'}}),{origin,rpc:async()=>{throw Error('Invalid forwarded');}})).status,400);
});
test('Pro admin rejects missing sessions, foreign origins and forged grants',async()=>{
 let calls=0;const deps={origin,rpc:async()=>{calls++;throw Error('Unexpected');}};const body={operation:'change',input:{requestId:id,action:'set_pool',month:'2026-10',expectedVersion:0,amount:'1000'}};
 assert.equal((await proHandler(request(body,{cookie:''}),deps)).status,401);assert.equal((await proHandler(request(body,{origin:'https://attacker.example'}),deps)).status,403);
 for(const input of [{...body.input,recipient:id},{...body.input,quantity:1},{...body.input,amount:'1e10'},{...body.input,amount:'-1'}])assert.equal((await proHandler(request({...body,input}),deps)).status,400);assert.equal(calls,0);
});
test('Pro manual payment tracking uses authenticated uncached requests',async()=>{
 const input={requestId:id,action:'payment',month:'2026-09',expectedVersion:1,payoutId:id,paid:true,transactionHash:'0x'+'a'.repeat(64),reason:'Manual test reference'};
 const response=await proHandler(request({operation:'change',input}),{origin,rpc:async(operation,body,session)=>{assert.equal(operation,'change');assert.equal(body.requestId,id);assert.equal(body.transactionHash,input.transactionHash);assert.equal(session,token);return {status:200,value:{saved:true,month:'2026-09'}};}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const denied=await proHandler(request({operation:'list',input:{month:'2026-09'}}),{origin,rpc:async()=>({status:403,value:{error:{code:'ADMIN_REQUIRED'}}})});assert.equal(denied.status,403);
});
test('Monthly Pro rules are a readable list covering scoring, eligibility, ties and payment',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');const mod={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync('src/components/player/pro-leaderboard.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const stubs={react:{...React,useState:v=>[typeof v==='function'?v():v,()=>{}]},'@tanstack/react-query':{useQuery:()=>({data:{pool:'1000',entries:[],total:0},isFetching:false})},'@workspace/ui/components/button':{Button:({variant,...props})=>React.createElement('button',props)},'@workspace/ui/components/input':{Input:props=>React.createElement('input',props)},'@/lib/leaderboard/pro-core':core};
 vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date,require:name=>stubs[name]??require(name)});const html=renderToStaticMarkup(React.createElement(mod.exports.ProLeaderboard));assert.equal((html.match(/<li>/g)||[]).length,7);for(const text of ['10 ranked battles','mixed team','50%, 30% and 20%','40% each','first linked wallet','Friendly battles and PvBot'])assert.ok(html.includes(text),text);
});
