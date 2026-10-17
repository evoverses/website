'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={},globals={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,URL,Buffer,AbortController,setTimeout,clearTimeout,TextDecoder,fetch,...globals,require:name=>imports[name]??require(name)});
 return module.exports;
}
const old=load('src/lib/leaderboard/core.ts');
const core=load('src/lib/leaderboard/boards-core.ts',{'./core':old});
const entry=(board='pvbot',extra={})=>({rank:1,name:'Trainer <script>',level:100,pvpXp:board==='overall'?700:0,pvbotXp:300,totalXp:board==='overall'?1000:300,lifetimeXp:board==='overall'?1000:300,battles:4,wins:3,losses:1,winRate:75,...extra});
const snapshot=(board='pvbot',period='day',page=0,extra={})=>({board,period,page,pageSize:50,total:1,periodStart:period==='all'?null:'2026-10-17T00:00:00.000Z',calculatedAt:'2026-10-17T10:00:00.000Z',entries:[entry(board)],...extra});
const expected=(board='pvbot',period='day',page=0)=>({board,period,page});

test('board selection enforces independent defaults, UTC periods and bounded page query',()=>{
 assert.equal(core.boardSelection(new URL('https://beta.evoverses.com/api/leaderboard/pvbot'),'pvbot').period,'day');
 assert.equal(core.boardSelection(new URL('https://beta.evoverses.com/api/leaderboard/overall'),'overall').period,'all');
 assert.equal(core.boardSelection(new URL('https://beta.evoverses.com/api/leaderboard/pvbot?period=week&page=2'),'pvbot').page,2);
 for(const query of ['period=year','page=-1','page=100001','period=all&period=all','page=0&page=1','playerId=forged','board=overall'])assert.throws(()=>core.boardSelection(new URL('https://beta.evoverses.com/api/leaderboard/pvbot?'+query),'pvbot'));
 for(const period of ['day','week','month'])assert.throws(()=>core.boardSelection(new URL('https://beta.evoverses.com/api/leaderboard/overall?period='+period),'overall'));
});

test('strict progression projections reject private fields, mixed boards and inconsistent XP',()=>{
 const value=snapshot();
 assert.equal(core.parseBoard(value,expected()).entries[0].pvbotXp,300);
 for(const bad of [{...value,own:entry()},snapshot('overall'),{...value,entries:[{...entry(),wallet:'private'}]},
  {...value,entries:[entry('pvbot',{level:101})]},{...value,entries:[entry('pvbot',{pvpXp:1,totalXp:301,lifetimeXp:301})]},
  {...value,entries:[entry('pvbot',{totalXp:301})]},{...value,entries:[entry('pvbot',{battles:1})]},
  {...value,entries:[entry('pvbot',{pvbotXp:Number.MAX_SAFE_INTEGER+1})]},{...value,entries:[entry('pvbot',{winRate:NaN})]},
  {...value,calculatedAt:'bad'},{...value,periodStart:null},{...value,entries:Array.from({length:51},()=>entry())}])assert.throws(()=>core.parseBoard(bad,expected()));
 assert.equal(core.parseBoard({...value,own:entry(),ownRow:1},expected(),true).ownRow,1);
 assert.throws(()=>core.parseBoard({...value,own:entry(),ownRow:null},expected(),true));
 assert.throws(()=>core.parseBoard(snapshot('overall'),expected('overall')));
 const cap=snapshot('overall','all',0,{entries:[entry('overall',{pvpXp:20000000,pvbotXp:30000000,totalXp:50000000,lifetimeXp:50000000})]});
 assert.equal(core.parseBoard(cap,expected('overall','all')).entries[0].totalXp,50000000);
 assert.throws(()=>core.parsePosition({own:entry(),ownRow:1,calculatedAt:value.calculatedAt,session:'private'},'pvbot'));
});

test('server ranks and ties survive 50-row boundaries without client resorting',()=>{
 const rows=[entry('overall',{rank:100,name:'First tied trainer'}),entry('overall',{rank:100,name:'Second tied trainer'})];
 const board=core.parseBoard(snapshot('overall','all',2,{total:102,entries:rows}),expected('overall','all',2));
 assert.deepEqual(Array.from(board.entries,row=>[row.rank,row.name]),[[100,'First tied trainer'],[100,'Second tied trainer']]);
 const own=core.parseBoard({...snapshot('overall','all',0),own:rows[1],ownRow:102},expected('overall','all'),true);
 assert.equal(own.own.rank,100);assert.equal(own.ownRow,102);
});

test('board RPC uses fixed scoped routes, omits public credentials and authenticates personal reads',async()=>{
 const connection={apiUrl:'https://beta-accounts.evoverses.com',serviceToken:'a'.repeat(64)},token='b'.repeat(64);
 for(const board of ['pvbot','overall'])for(const personal of [false,true]){
  const period=board==='overall'?'all':'week';
  const response=await core.boardRpc({connection,board,selection:{period,page:2},...(personal?{token}:{}),fetchImpl:async(url,init)=>{
   assert.equal(url,connection.apiUrl+'/internal/leaderboard/'+board+(personal?'/me':''));
   assert.equal(init.headers['X-EvoVerses-Service'],connection.serviceToken);assert.equal(init.headers.Authorization,personal?'Bearer '+token:undefined);
   assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'manual');
   assert.deepEqual(JSON.parse(init.body),{period,page:2});
   return Response.json(snapshot(board,period,2,personal?{own:entry(board),ownRow:2}:{}));
  }});assert.equal(response.board,board);
 }
 await assert.rejects(core.boardRpc({connection,board:'overall',selection:{period:'day',page:0},fetchImpl:()=>{throw Error('Must not forward');}}));
 await assert.rejects(core.boardRpc({connection,board:'pvbot',selection:{period:'day',page:0},token:'forged',fetchImpl:()=>{throw Error('Must not forward');}}));
 for(const bad of [new Response(null,{status:302}),Response.json(snapshot('overall')),Response.json({...snapshot(),own:entry()}),Response.json({padding:'x'.repeat(65537)})]){
  await assert.rejects(core.boardRpc({connection,board:'pvbot',selection:{period:'day',page:0},fetchImpl:async()=>bad}));
 }
});

test('board public and personal gateways keep cookies, identity and caching separate for both scopes',async()=>{
 let session,reads=0,cookieReads=0,seen=[];
 const origin='https://beta.evoverses.com';
 const server=load('src/lib/leaderboard/boards-server.ts',{
  'server-only':{},'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
  'next/headers':{cookies:async()=>{cookieReads++;return {get:()=>session?{value:session}:undefined};}},
  '@/lib/player/server':{getPlayerWebOrigin:()=>origin,getEpicConfig:()=>({apiUrl:'https://beta-accounts.evoverses.com',hosted:{serviceToken:'a'.repeat(64)}})},
  '@/lib/player/auth-core':{playerSessionCookie:'ev:player-session'},
  './boards-core':{...core,boardRpc:async({board,selection,token})=>{reads++;seen.push({board,...selection,token});return snapshot(board,selection.period,selection.page,token?{own:entry(board),ownRow:1}:{});}},
 });
 const request=(board,query='',host='beta.evoverses.com')=>({nextUrl:new URL(origin+'/api/leaderboard/'+board+(query?'?'+query:'')),headers:new Headers({host})});
 for(const board of ['pvbot','overall']){
  const publicResponse=await server.readBoard(request(board),board);
  assert.equal(publicResponse.status,200);assert.equal(publicResponse.headers.get('cache-control'),'public, max-age=60');
  assert.equal((await publicResponse.json()).own,undefined);assert.equal(cookieReads,0);
 }
 assert.equal((await server.readBoard(request('pvbot'),'pvbot',true)).status,401);
 session='c'.repeat(64);
 for(const board of ['pvbot','overall']){
  const personal=await server.readBoard(request(board),board,true);
  assert.equal(personal.headers.get('cache-control'),'no-store');
  assert.deepEqual(Object.keys(await personal.json()).sort(),['calculatedAt','own','ownRow']);
 }
 const before=reads;
 for(const [board,query]of [['pvbot','board=overall'],['pvbot','page=-1'],['overall','period=week']]){
  const result=await server.readBoard(request(board,query),board);assert.equal(result.status,400);assert.equal(result.headers.get('cache-control'),'no-store');
 }
 assert.equal((await server.readBoard(request('pvbot','','attacker.invalid'),'pvbot')).status,403);assert.equal(reads,before);
 assert.deepEqual(seen.slice(0,2).map(row=>[row.board,row.period,row.token]),[['pvbot','day',undefined],['overall','all',undefined]]);
});

const Link=({href,...props})=>React.createElement('a',{href,...props});
const navigation=load('src/app/leaderboard/leaderboard-navigation.tsx',{'next/link':{default:Link}});
function renderBoard(board,period='day',page=0,{viewerId=null,ownRow=null,total=102,empty=false,rankingsError=false,positionError=false,pending=false}={}){
 const captured={queries:[],buttons:[],updates:[]};let states=0;
 const rows=empty?[]:[entry(board,{rank:50,name:'First tied trainer'}),entry(board,{rank:50,name:'Second tied trainer'})];
 const imports={
  react:{...React,useState:value=>{const id=states++;return [id===0?period:page,next=>captured.updates.push([id,next])];}},
  '@tanstack/react-query':{useQuery:options=>{captured.queries.push(options);return {data:options.queryKey[0]==='progression-leaderboard-own'?(viewerId&&!positionError?{own:rows[1],ownRow}:undefined):snapshot(board,period,page,{total,entries:rows}),isFetching:pending,isError:options.queryKey[0]==='progression-leaderboard-own'?positionError:rankingsError,isPending:pending};}},
  '@workspace/ui/components/button':{Button:({variant,...props})=>{captured.buttons.push(props);return React.createElement('button',props);}},
  '@/lib/leaderboard/boards-core':core,'./leaderboard-navigation':navigation,
 };
 const component=load('src/app/leaderboard/progression-leaderboard.tsx',imports);
 captured.html=renderToStaticMarkup(React.createElement(component.ProgressionLeaderboard,{board,viewerId}));
 return captured;
}

test('PvBot and Overall show truthful XP breakdowns, ties, navigation and scoped scores without prizes',()=>{
 for(const [board,period]of [['pvbot','day'],['pvbot','week'],['pvbot','month'],['pvbot','all'],['overall','all']]){
  const result=renderBoard(board,period,1),html=result.html;
  const headers=[...html.matchAll(/<th[^>]*scope="col"[^>]*>([^<]*)<\/th>/g)].map(match=>match[1]);
  assert.equal(headers[0],'Rank');assert.equal(headers.at(-1),board==='pvbot'&&period!=='all'?'Wins':'Total XP');
  for(const heading of ['PvP XP','PvBot XP','Battles','Wins','Losses','Win rate'])assert.ok(headers.includes(heading),heading);
  assert.match(html,/XP columns show lifetime earned Trainer XP/);assert.match(html,/after progression caps/);
  assert.match(html,/Local practice and friendly battles do not count/);assert.match(html,/no prizes or Pro leaderboard eligibility/);
  assert.ok(!html.includes('View prizes'));assert.ok(!html.includes('Monthly Pro leaderboard'));
  assert.match(html,/Page 2 of 3/);
  assert.equal((html.match(/<th scope="row"/g)||[]).length,2);
  assert.equal((html.match(/>50<\/span>/g)||[]).length,2);
  for(const href of ['/leaderboard','/leaderboard/pvbot','/leaderboard/overall'])assert.ok(html.includes(`href="${href}"`));
  assert.ok(html.includes(`href="/leaderboard${board==='pvbot'?'/pvbot':'/overall'}" aria-current="page"`));
  assert.deepEqual(Array.from(result.queries[0].queryKey),['progression-leaderboard',board,period,1]);
  assert.equal(result.queries[0].placeholderData(snapshot(board==='pvbot'?'overall':'pvbot','all')),undefined);
 }
});

test('calendar selection resets paging; private positions do not persist or highlight both tied trainers',()=>{
 const result=renderBoard('pvbot','day',1,{viewerId:'authenticated-viewer',ownRow:52});
 const selected=result.buttons.find(button=>button.children==='Week');selected.onClick();
 assert.deepEqual(result.updates,[[0,'week'],[1,0]]);
 const own=result.queries[1];assert.equal(own.meta.private,true);assert.equal(own.gcTime,0);assert.equal(own.staleTime,0);
 assert.deepEqual(Array.from(own.queryKey),['progression-leaderboard-own','pvbot','day','authenticated-viewer']);
 const rows=[...result.html.matchAll(/<tr class="([^"]*)">(.*?)<\/tr>/g)];
 assert.equal(rows.length,2);assert.ok(rows[0][1].includes('hover:bg-muted/40'));assert.ok(rows[1][1].includes('bg-primary/10'));
 const visitor=renderBoard('overall','all');assert.equal(visitor.queries[1].enabled,false);assert.ok(!visitor.html.includes('Your position:'));
 const last=renderBoard('pvbot','all',2);assert.equal(last.buttons.find(button=>button.children==='Next').disabled,true);
 assert.match(renderBoard('pvbot','day',0,{empty:true,total:0}).html,/No qualifying results yet/);
});

test('all four route adapters use fixed board and private flags',async()=>{
 for(const board of ['pvbot','overall'])for(const privateRead of [false,true]){
  const calls=[];
  const route=load(`src/app/api/leaderboard/${board}/${privateRead?'me/':''}route.ts`,{'@/lib/leaderboard/boards-server':{readBoard:(...args)=>calls.push(args)}});
  const request={};await route.GET(request);assert.deepEqual(calls,[[request,board,privateRead]]);
  assert.equal(route.dynamic,'force-dynamic');assert.equal(route.runtime,'nodejs');
 }
});


test('viewer-aware pages render dynamically, retain only the authenticated viewer key and remain public on profile outages',async()=>{
 for(const board of ['pvbot','overall']){
  for(const available of [true,false]){
   const page=load(`src/app/leaderboard/${board}/page.tsx`,{
    '@/lib/player/server':{getPlayerAccount:async()=>{if(!available)throw Error('Unavailable');return {player:{id:'viewer-id',displayName:'Private display name'},balance:{evoros:123}};}},
    '../progression-leaderboard':{ProgressionLeaderboard:()=>null},
   });
   const element=await page.default();
   assert.equal(page.dynamic,'force-dynamic');assert.equal(element.props.board,board);
   assert.equal(element.props.viewerId,available?'viewer-id':null);
   assert.deepEqual(Object.keys(element.props).sort(),['board','viewerId']);
  }
 }
});


test('keyboard period navigation focuses and selects the requested tab',()=>{
 const result=renderBoard('pvbot');
 const buttons=result.buttons.filter(button=>button.role==='tab');
 const focused=[],clicked=[];
 const nodes=buttons.map((_,index)=>({focus:()=>focused.push(index),click:()=>clicked.push(index)}));
 for(const [index,key,target]of [[0,'ArrowRight',1],[0,'ArrowLeft',3],[1,'Home',0],[1,'End',3]]){
  let prevented=false;
  buttons[index].onKeyDown({key,preventDefault:()=>{prevented=true;},currentTarget:Object.assign(nodes[index],{parentElement:{querySelectorAll:()=>nodes}})});
  assert.equal(prevented,true);assert.equal(focused.at(-1),target);assert.equal(clicked.at(-1),target);
 }
 const count=focused.length;
 buttons[0].onKeyDown({key:'Tab'});assert.equal(focused.length,count);
});

test('public failure retains labelled last results and personal failure gives no false empty result',()=>{
 const failed=renderBoard('pvbot','day',0,{viewerId:'viewer',positionError:true,rankingsError:true});
 assert.match(failed.html,/role="alert"/);assert.match(failed.html,/temporarily unavailable/);
 assert.match(failed.html,/Showing the last successful results/);
 assert.match(failed.html,/Your position is temporarily unavailable/);
 assert.ok(!failed.html.includes('You have no qualifying activity'));
 const pending=renderBoard('overall','all',0,{pending:true});
 assert.match(pending.html,/aria-busy="true"/);
 assert.equal(pending.buttons.find(button=>button.children==='Next').disabled,true);
 assert.equal(pending.buttons.find(button=>button.children==='Previous').disabled,true);
});

test('private endpoint failures and malformed cookies never produce cacheable responses',async()=>{
 const origin='https://beta.evoverses.com';
 const request={nextUrl:new URL(origin+'/api/leaderboard/pvbot/me'),headers:new Headers({host:'beta.evoverses.com'})};
 for(const status of [401,403,503]){
  const server=load('src/lib/leaderboard/boards-server.ts',{
   'server-only':{},'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
   'next/headers':{cookies:async()=>({get:()=>({value:'b'.repeat(64)})})},
   '@/lib/player/server':{getPlayerWebOrigin:()=>origin,getEpicConfig:()=>({apiUrl:'https://beta-accounts.evoverses.com',hosted:{serviceToken:'a'.repeat(64)}})},
   '@/lib/player/auth-core':{playerSessionCookie:'session'},
   './boards-core':{...core,boardRpc:async()=>{throw Object.assign(Error('upstream private diagnostic must not escape'),{status});}},
  });
  const response=await server.readBoard(request,'pvbot',true);
  assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.ok(!(await response.text()).includes('private diagnostic'));
 }
 let invoked=false;
 await assert.rejects(core.boardRpc({connection:{apiUrl:'https://beta-accounts.evoverses.com',serviceToken:'a'.repeat(64)},board:'pvbot',selection:{period:'day',page:0},token:'invalid-session',fetchImpl:()=>{invoked=true;}}));
 assert.equal(invoked,false);
});

test('frontend requests propagate cancellation and keep public and personal routes separate',async()=>{
 for(const board of ['pvbot','overall']){
  const signal=new AbortController().signal,calls=[];
  const imports={react:{...React,useState:value=>[value,()=>{}]},
   '@tanstack/react-query':{useQuery:options=>{calls.push(options);return {isFetching:false};}},
   '@workspace/ui/components/button':{Button:({variant,...props})=>React.createElement('button',props)},
   '@/lib/leaderboard/boards-core':core,'./leaderboard-navigation':navigation};
  const requests=[];let fail=false;
  const component=load('src/app/leaderboard/progression-leaderboard.tsx',imports,{fetch:async(url,init)=>{
   requests.push({url,...init});
   if(fail)return Response.json({error:{code:'INVALID_SESSION'}},{status:401});
   const selected=board==='overall'?'all':'day';
   return Response.json(url.includes('/me?')?{own:entry(board),ownRow:1,calculatedAt:'2026-10-17T10:00:00.000Z'}:snapshot(board,selected));
  }});
  renderToStaticMarkup(React.createElement(component.ProgressionLeaderboard,{board,viewerId:'viewer'}));
  await calls[0].queryFn({signal});await calls[1].queryFn({signal});
  assert.equal(requests[0].credentials,'omit');assert.equal(requests[1].credentials,'same-origin');
  assert.equal(requests[0].cache,'no-store');assert.equal(requests[1].cache,'no-store');
  assert.equal(requests[0].signal,signal);assert.equal(requests[1].signal,signal);
  assert.ok(requests[0].url.startsWith('/api/leaderboard/'+board+'?'));
  assert.ok(requests[1].url.startsWith('/api/leaderboard/'+board+'/me?'));
  fail=true;
  await assert.rejects(calls[0].queryFn({signal}),/Leaderboard unavailable/);
  await assert.rejects(calls[1].queryFn({signal}),/Position unavailable/);
 }
});
