const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:mod,exports:mod.exports,require:n=>imports[n]??require(n),Date});return mod.exports;}
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',playerId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function snapshot(masterAdministrator){return {administratorId:id,masterAdministrator,players:[{id:playerId,displayName:'Tester',experience:0,evoros:0,access:'pending',accountStatus:'active',administrator:false,masterAdministrator:false,version:0,initialGrant:false}],products:[],history:[],page:1,total:1,more:false};}
const Link=props=>React.createElement('a',props);
test('regular-admin account page retains leaderboard tools and hides downloads',async()=>{
 let master=false;
 const Page=load('src/app/beta-admin/page.tsx',{'next/link':{default:Link},'next/headers':{cookies:async()=>({get:()=>({value:'a'.repeat(64)})})},'@/components/player/beta-admin':{BetaAdmin:()=>null},'@/lib/player/auth-core':{playerSessionCookie:'test'},'@/lib/player/beta-admin-handler':{betaAdminSnapshotSchema:{parse:v=>v}},'@/lib/player/beta-admin-server':{betaAdminRpc:async()=>({status:200,value:snapshot(master)})},'@/lib/player/server':{playerLoginEnabled:true}}).default;
 const regular=renderToStaticMarkup(await Page());assert.ok(!regular.includes('Manage game downloads'));assert.ok(regular.includes('Manage leaderboards'));
 master=true;assert.ok(renderToStaticMarkup(await Page()).includes('Manage game downloads'));
});
test('regular admins retain trainer rewards but cannot see NFT EVO prize management',async()=>{
 let master=false;
 const Page=load('src/app/beta-admin/leaderboard/page.tsx',{'next/link':{default:Link},'@/lib/downloads/server':{permission:async(_,requireMaster)=>{if(requireMaster&&!master)throw Error('MASTER_ADMIN_REQUIRED');}},'@/components/player/leaderboard-rewards-admin':{LeaderboardRewardsAdmin:()=>React.createElement('div',null,'Trainer rewards')},'@/components/player/pro-prizes-admin':{ProPrizesAdmin:()=>React.createElement('div',null,'NFT EVO prizes')}}).default;
 const regular=renderToStaticMarkup(await Page());assert.ok(regular.includes('Trainer rewards'));assert.ok(!regular.includes('NFT EVO prizes'));
 master=true;assert.ok(renderToStaticMarkup(await Page()).includes('NFT EVO prizes'));
});
test('single and bulk deletion controls appear only for master admins',()=>{
 const Button=({variant,size,...props})=>React.createElement('button',props),Input=props=>React.createElement('input',props);
 const dialogs=Object.fromEntries(['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription','DialogFooter'].map(n=>[n,()=>null]));
 const {BetaAdmin}=load('src/components/player/beta-admin.tsx',{'@workspace/ui/components/button':{Button},'@workspace/ui/components/input':{Input},'@workspace/ui/components/label':{Label:props=>React.createElement('label',props)},'@workspace/ui/components/dialog':dialogs});
 const regular=renderToStaticMarkup(React.createElement(BetaAdmin,{initialSnapshot:snapshot(false)}));assert.equal((regular.match(/>Delete<\/button>/g)||[]).length,0);assert.ok(regular.includes('Approve beta'));assert.ok(regular.includes('Make admin'));
 const master=renderToStaticMarkup(React.createElement(BetaAdmin,{initialSnapshot:snapshot(true)}));assert.equal((master.match(/>Delete<\/button>/g)||[]).length,2);
});

test('account audit shows operator names, stable ID fallback and automatic attribution',()=>{
 const Button=({variant,size,...props})=>React.createElement('button',props),Input=props=>React.createElement('input',props);
 const dialogs=Object.fromEntries(['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription','DialogFooter'].map(n=>[n,()=>null]));
 const {BetaAdmin}=load('src/components/player/beta-admin.tsx',{'@workspace/ui/components/button':{Button},'@workspace/ui/components/input':{Input},'@workspace/ui/components/label':{Label:props=>React.createElement('label',props)},'@workspace/ui/components/dialog':dialogs});
 const initial=snapshot(true),row={id:'audit1',administratorId:id,administratorName:'Operator <script>',ruleId:null,playerId,displayName:'Recipient',action:'approve',reason:'Testing attribution',createdAt:'2026-10-13T00:00:00.000Z'};
 initial.history=[row,{...row,id:'audit2',administratorName:null},{...row,id:'audit3',administratorId:null,administratorName:null,ruleId:'reward-rule'}];
 const html=renderToStaticMarkup(React.createElement(BetaAdmin,{initialSnapshot:initial}));
 assert.ok(html.includes('Operator &lt;script&gt;'));assert.ok(!html.includes('Operator <script>'));assert.ok(html.includes('title="'+id+'"'));assert.ok(html.includes('Automatic reward'));assert.ok(html.includes('>'+id+'</span>'));
});

test('EVO prize audit displays the server-resolved operator name with its ID retained',()=>{
 const Button=({variant,size,...props})=>React.createElement('button',props),Input=props=>React.createElement('input',props);
 const dialogs=Object.fromEntries(['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription','DialogFooter'].map(n=>[n,()=>null]));
 const data={pool:null,finalized:false,version:0,flags:[],winners:[],entry:{fee:null,bonus:'0',reserve:'0',rollover:'0',collected:'0',commission:'0',cancelled:false,entrants:[],more:false},audit:[{id:'audit1',administratorId:id,administratorName:'Prize operator',action:'bonus',createdAt:'2026-10-13T00:00:00.000Z',details:{}}]};
 const {ProPrizesAdmin}=load('src/components/player/pro-prizes-admin.tsx',{'@tanstack/react-query':{useQuery:()=>({data}),useQueryClient:()=>({})},'@workspace/ui/components/button':{Button},'@workspace/ui/components/input':{Input},'@workspace/ui/components/dialog':dialogs,'@/lib/leaderboard/pro-core':{}});
 const html=renderToStaticMarkup(React.createElement(ProPrizesAdmin));assert.ok(html.includes('Prize operator'));assert.ok(html.includes('title="'+id+'"'));
});
