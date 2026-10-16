const {test}=require('node:test'),assert=require('node:assert/strict');
const {fetchHostedEvoQuote}=require(process.env.EVOROS_TEST_LIB+'/lib/store/hosted-evo-quote.js');
const valid=()=>({priceUsd:'0.0001045762295',fetchedAt:new Date().toISOString(),source:'Avalanche',chainId:43114,blockNumber:'97697155',oracleAddress:'0x0a77230d17318075983913bc2145db16c7366156',oracleUpdatedAt:new Date().toISOString(),poolAddress:'0xb99a92b6d5a7ca3a2215a63d43d5e8ad43abc4e9'});
const connection={apiUrl:'https://beta-accounts.evoverses.com',token:'b'.repeat(64)};
test('hosted quotes use the private account service and preserve its original observation time',async()=>{
 const quote=valid();const actual=await fetchHostedEvoQuote(connection,async(url,init)=>{
  assert.equal(url,connection.apiUrl+'/internal/store');assert.equal(init.headers['X-EvoVerses-Service'],connection.token);assert.equal(init.redirect,'manual');assert.equal(init.credentials,'omit');assert.deepEqual(JSON.parse(init.body),{operation:'evo-quote'});return Response.json({value:quote});
 });assert.deepEqual(actual,quote);
});
test('hosted quotes reject provider/service failures and wrong, expired or zero-priced markets',async()=>{
 await assert.rejects(fetchHostedEvoQuote(connection,async()=>new Response('',{status:503})));
 await assert.rejects(fetchHostedEvoQuote(connection,async()=>Response.redirect('https://example.com',302))); 
 for(const change of [q=>q.priceUsd='0',q=>q.poolAddress='wrong',q=>q.source='unknown',q=>q.fetchedAt=new Date(Date.now()-300000).toISOString()]){const quote=valid();change(quote);await assert.rejects(fetchHostedEvoQuote(connection,async()=>Response.json({value:quote})));}
});
