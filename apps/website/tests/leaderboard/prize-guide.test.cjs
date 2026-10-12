'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const names={vital_dew:'Vital Dew',evo_pack_2:'2-Evo pack',evo_pack_4:'4-Evo pack',evo_pack_6:'6-Evo pack'};
const imports={'@/lib/leaderboard/rewards-core':{rewardItemName:id=>names[id]},'next/image':({unoptimized,...props})=>React.createElement('img',props),'@tanstack/react-query':{useQuery:()=>({isPending:false})},'@workspace/ui/components/button':{Button:({variant,...props})=>React.createElement('button',props)},'@workspace/ui/components/dialog':{Dialog:({children})=>children,DialogTrigger:({children})=>children,DialogContent:()=>null}};
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/player/leaderboard-rewards.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module:mod,exports:mod.exports,require:name=>imports[name]??require(name)});
test('graphic prize quantities and item artwork match the backend v1 policy for all nine places',()=>{
 const accountRepo=process.env.EVOVERSES_ACCOUNT_TEST_REPO||path.resolve(process.cwd(),'../../../evoverses');
 const policy={requireBetaApproval:true,thresholds:{day:3,week:5,month:10},revision:2,prizes:{day:[{vital_dew:3},{vital_dew:2},{vital_dew:1}],week:[{evo_pack_4:1},{evo_pack_2:1,vital_dew:3},{evo_pack_2:1}],month:[{evo_pack_6:1},{evo_pack_4:1},{evo_pack_2:1}]}};
 const sqlFile=path.join(accountRepo,'Prototypes/player_economy/schema/022_leaderboard_rewards.sql');
 if(fs.existsSync(sqlFile)){const sql=fs.readFileSync(sqlFile,'utf8');assert.deepEqual(JSON.parse(sql.match(/VALUES\('leaderboard-prizes-v1',\s*'(\{[^']+\})'\)/)[1]),policy);}else if(process.env.EVOVERSES_ACCOUNT_TEST_REPO)throw Error('Explicit backend test repository missing');
 for(const period of ['day','week','month']){
  const html=renderToStaticMarkup(React.createElement(mod.exports.PrizeGuide,{period})),cards=[...html.matchAll(/<article[^>]*>(.*?)<\/article>/g)];assert.equal(cards.length,3);
  for(let i=0;i<3;i++){for(const[product,quantity]of Object.entries(policy.prizes[period][i])){assert.ok(cards[i][1].includes(`/inventory/items/${product}.png`));assert.ok(cards[i][1].includes(`${quantity} × ${names[product]}`));}assert.equal(cards[i][1].includes('monthly champion badge'),period==='month');}
 }
});
test('leaderboard exposes separate prize and winner buttons without eagerly rendering the dialogs',()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.LeaderboardPrizes));assert.ok(html.includes('View prizes'));assert.ok(html.includes('Past winners'));assert.ok(!html.includes('/inventory/items/'));assert.ok(!html.includes('<table'));
});
