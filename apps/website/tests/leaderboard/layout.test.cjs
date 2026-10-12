'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/app/leaderboard/trainer-leaderboard.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function render(period){
 const entries=[1,2,3,4].map(rank=>({rank,name:`Trainer ${rank}`,level:10,periodXp:period==='all'?900:100,lifetimeXp:900,battles:2,wins:1,losses:1,winRate:50}));
 const stubs={react:{...React,useState:value=>[value==='day'?period:value,()=>{}]},'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='trainer-leaderboard-own'?undefined:{period,page:0,total:4,entries,calculatedAt:'2026-10-12T10:00:00Z'},isFetching:false})},'@workspace/ui/components/button':{Button:({variant,...props})=>React.createElement('button',props)},'@/lib/leaderboard/core':{}};
 const module={exports:{}};vm.runInNewContext(compiled,{module,exports:module.exports,require:name=>stubs[name]??require(name)});
 return renderToStaticMarkup(React.createElement(module.exports.TrainerLeaderboard,{signedIn:false}));
}
test('rank stays left, score stays right and trophies distinguish the podium',()=>{
 for(const period of ['day','week','month','all']){
  const html=render(period),headers=[...html.matchAll(/<th[^>]*scope="col"[^>]*>([^<]*)<\/th>/g)].map(m=>m[1]);
  assert.equal(headers[0],'Rank');assert.equal(headers.at(-1),period==='all'?'Lifetime XP':'Period XP');
  assert.equal(headers.filter(h=>h==='Lifetime XP').length,1);
  for(const [label,color]of [["Gold trophy","text-yellow-400"],["Silver trophy","text-slate-300"],["Bronze trophy","text-amber-600"]]){const icon=html.match(new RegExp(`<svg[^>]*aria-label="${label}"[^>]*>`));assert.ok(icon);assert.ok(icon[0].includes(color));}
  const rows=[...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/g)].slice(1);
  assert.equal(rows.length,4);
  for(const row of rows)assert.match(row[1],new RegExp(`text-primary[^>]*>${period==='all'?900:100}<\\/td>$`));
 }
});
