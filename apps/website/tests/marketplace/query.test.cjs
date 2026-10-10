const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file, imports={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,Request,Response,TextDecoder,AbortSignal,require:n=>Object.hasOwn(imports,n)?imports[n]:require(n)});return module.exports;}
const queries=load('src/lib/evo/queries.ts');
const {createMarketplaceQueryHandler}=load('src/lib/marketplace/query-handler.ts',{'../evo/queries':queries});
const request=(operationName,variables={},query=queries[operationName==='EvosByQueryQuery'?'evosByQueryQuery':operationName==='EvoByIdQuery'?'evoByIdQuery':'evosMarketplaceSummaryQuery'])=>new Request('https://beta.example/api/marketplace/query',{method:'POST',body:JSON.stringify({operationName,variables,query})});
test('authored list, summary and individual Evo reads use fixed upstream without browser Origin or credentials',async()=>{
 let calls=0;
 const handler=createMarketplaceQueryHandler('https://metadata.example/graphql',async(url,init)=>{
  calls++;assert.equal(url,'https://metadata.example/graphql');assert.equal(init.headers.Origin,undefined);assert.equal(init.headers.Authorization,undefined);
  return Response.json({data:{evosByQuery:{items:[{tokenId:'2253'}],total:5108,nextPage:1}}});
 });
 for(const [op,vars] of [['EvosByQueryQuery',{page:0,limit:25,attributes:{attack:{gte:1,lte:50},species:['KITSUL']}}],['EvoMarketplaceSummaryQuery',{collection:'evos'}],['EvoByIdQuery',{tokenId:'2253'}]]){
  const r=await handler(request(op,vars));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.ok((await r.json()).data);
 }
 assert.equal(calls,3);
});
test('forged operations, queries, variables, excessive limits and oversized bodies never reach upstream',async()=>{
 let calls=0;const handler=createMarketplaceQueryHandler('https://metadata.example/graphql',async()=>{calls++;return Response.json({data:{}})});
 for(const req of [request('Mutation'),request('EvosByQueryQuery',{},'mutation { deleteAll }'),request('EvosByQueryQuery',{limit:101}),request('EvosByQueryQuery',{page:-1}),request('EvosByQueryQuery',{url:'https://attacker.example'}),request('EvosByQueryQuery',{owners:['wrong']}),request('EvosByQueryQuery',{attributes:{unexpected:'value'}}),new Request('https://beta.example/api/marketplace/query',{method:'POST',body:'x'.repeat(17000)})])assert.equal((await handler(req)).status,400);
 assert.equal(calls,0);
});
test('upstream HTTP, invalid JSON and GraphQL failures remain errors rather than an empty inventory',async()=>{
 for(const response of [new Response('down',{status:500}),new Response('not-json'),Response.json({errors:[{message:'internal detail'}]}),Response.json({})]){
  const handler=createMarketplaceQueryHandler('https://metadata.example/graphql',async()=>response);
  const r=await handler(request('EvosByQueryQuery'));assert.equal(r.status,502);assert.equal(JSON.stringify(await r.json()).includes('internal detail'),false);
 }
});
