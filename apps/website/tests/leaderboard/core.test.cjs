'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('src/lib/leaderboard/core.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleFixture={exports:{}};vm.runInNewContext(source,{module:moduleFixture,exports:moduleFixture.exports,require,URL,Buffer,AbortController,setTimeout,clearTimeout,TextDecoder,fetch});
const {selection,parseLeaderboard,leaderboardRpc}=moduleFixture.exports;
const entry={rank:1,name:'Trainer <script>',level:100,periodXp:500,lifetimeXp:2000,battles:4,wins:3,losses:1,winRate:75};
const snapshot={period:'day',page:0,pageSize:50,total:1,periodStart:'2026-10-12T00:00:00.000Z',calculatedAt:'2026-10-12T10:00:00.000Z',entries:[entry]};
test('query selection bounds and public response validation deny private data',()=>{
 assert.equal(selection(new URL('https://beta.evoverses.com/api/leaderboard')).period,'day');
 for(const query of ['period=year','page=-1','page=100001','period=day&period=week','playerId=forged'])assert.throws(()=>selection(new URL('https://beta.evoverses.com/api/leaderboard?'+query)));
 assert.equal(parseLeaderboard(snapshot,{period:'day',page:0}).entries[0].level,100);
 for(const value of [{...snapshot,own:entry},{...snapshot,entries:[{...entry,wallet:'private'}]},{...snapshot,entries:[{...entry,level:101}]},{...snapshot,entries:[{...entry,periodXp:-1}]},{...snapshot,entries:[{...entry,wins:5}]},{...snapshot,calculatedAt:'invalid'}])assert.throws(()=>parseLeaderboard(value,{period:'day',page:0}));
 assert.equal(parseLeaderboard({...snapshot,own:entry,ownRow:1},{period:'day',page:0},true).ownRow,1);
});
test('RPC keeps website credential server-side, validates sessions, rejects redirects and malformed replies',async()=>{
 const connection={apiUrl:'https://beta-accounts.evoverses.com',serviceToken:'c'.repeat(64)};let calls=0;
 const fetchImpl=async(url,init)=>{calls++;assert.equal(url,'https://beta-accounts.evoverses.com/internal/leaderboard');assert.equal(init.headers['X-EvoVerses-Service'],connection.serviceToken);assert.equal(init.headers.Authorization,undefined);assert.equal(init.redirect,'manual');return Response.json(snapshot);};
 assert.equal((await leaderboardRpc({connection,selection:{period:'day',page:0},fetchImpl})).total,1);
 await assert.rejects(leaderboardRpc({connection,selection:{period:'day',page:0},token:'forged',fetchImpl}));assert.equal(calls,1);
 await assert.rejects(leaderboardRpc({connection,selection:{period:'day',page:0},fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://elsewhere.invalid'}})}));
 await assert.rejects(leaderboardRpc({connection,selection:{period:'day',page:0},fetchImpl:async()=>Response.json({...snapshot,entries:[{...entry,epicId:'private'}]})}));
});

test('website public and personal endpoints enforce host, bounds and separate caching',async()=>{
 const compiled=ts.transpileModule(fs.readFileSync('src/lib/leaderboard/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 let session,reads=0,cookieReads=0;
 const module={exports:{}};const origin='https://beta.evoverses.com';
 const imports={'server-only':{},'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},'next/headers':{cookies:async()=>{cookieReads++;return {get:()=>session?{value:session}:undefined};}},'@/lib/player/server':{getPlayerWebOrigin:()=>origin,getEpicConfig:()=>({apiUrl:'https://beta-accounts.evoverses.com',hosted:{serviceToken:'c'.repeat(64)}})},'@/lib/player/auth-core':{playerSessionCookie:'ev:player-session'},'./core':{selection,leaderboardRpc:async({token})=>{reads++;return {...snapshot,...(token?{own:entry,ownRow:1}:{})};}}};
 vm.runInNewContext(compiled,{module,exports:module.exports,URL,require:name=>imports[name]});
 const request=(originOverride=origin,query='period=day&page=0')=>({nextUrl:new URL(originOverride+'/api/leaderboard?'+query),headers:new Headers({host:new URL(originOverride).host})});
 const publicResult=await module.exports.readLeaderboard(request(),false);
 assert.equal(publicResult.status,200);assert.equal(publicResult.headers.get('cache-control'),'public, max-age=60');assert.equal((await publicResult.json()).own,undefined);assert.equal(cookieReads,0);
 assert.equal((await module.exports.readLeaderboard(request(),true)).status,401);
 session='f'.repeat(64);const personal=await module.exports.readLeaderboard(request(),true);assert.equal(personal.status,200);assert.equal(personal.headers.get('cache-control'),'no-store');assert.equal((await personal.json()).own.name,entry.name);
 const prior=reads;assert.equal((await module.exports.readLeaderboard(request('https://attacker.invalid'),false)).status,403);assert.equal((await module.exports.readLeaderboard(request(origin,'page=-1'),false)).status,400);assert.equal(reads,prior);
});
