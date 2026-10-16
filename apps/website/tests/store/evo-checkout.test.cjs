'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {encodeFunctionData,erc20Abi}=require('viem');
const {validateEvoOrder,evoOrderSchema,evoPurchaseToken,evoPurchaseTreasury}=require(path.join(process.env.EVOROS_TEST_LIB,'lib/store/evo-checkout.js'));
const orderId='11111111-1111-4111-8111-111111111111',owner='0x'+'a'.repeat(40),units='2500000000000000000000';
function order(){return {orderId,bundleId:'bundle_pouch',evoros:250,status:'awaiting_payment',chainId:43114,token:evoPurchaseToken,recipient:evoPurchaseTreasury,payer:owner,units,expiresAt:new Date(Date.now()+300000).toISOString(),data:encodeFunctionData({abi:erc20Abi,functionName:'transfer',args:[evoPurchaseTreasury,BigInt(units)]})+'45564f524f5331'+orderId.replaceAll('-','')};}
test('wallet payment validates fixed chain/token/treasury, owner, exact bundle, order reference and expiry before signing',()=>{
 const value=order();assert.equal(evoOrderSchema.safeParse({...value,bundleId:'bundle_missing'}).success,false);assert.deepEqual(validateEvoOrder(value,owner,'bundle_pouch',250),value);
 for(const change of [{status:'credited'},{chainId:1},{token:owner},{recipient:owner},{payer:evoPurchaseTreasury},{evoros:500},{bundleId:'bundle_vault'},{units:'1'},{units:'0'},{units:String(2n**256n)},{data:'0x1234'},{orderId:'22222222-2222-4222-8222-222222222222'},{expiresAt:new Date(Date.now()-1).toISOString()}])assert.throws(()=>validateEvoOrder({...value,...change},owner,'bundle_pouch',250));
});
function handler(fetchImpl){const module={exports:{}};const source=ts.transpileModule(fs.readFileSync(path.resolve('src/lib/store/evo-purchase-handler.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports={'server-only':{},'../player/server':{getEpicConfig:()=>({apiUrl:'https://beta-accounts.evoverses.com',hosted:{serviceToken:'b'.repeat(64)}}),getPlayerWebOrigin:()=> 'https://beta.evoverses.com'},'../player/auth-core':{playerSessionCookie:'ev:player-session'},'../beta/release-policy':{evorosPurchasesEnabled:true}};
 vm.runInNewContext(source,{module,exports:module.exports,Response,Request,URL,AbortSignal,Buffer,Date,JSON,fetch:fetchImpl,require:name=>Object.hasOwn(imports,name)?imports[name]:require(name)});return module.exports.evoPurchase;
}
function request(body,headers={}){return new Request('https://beta.evoverses.com/api/store/evo/reserve',{method:'POST',headers:{host:'beta.evoverses.com',origin:'https://beta.evoverses.com','content-type':'application/json',cookie:'ev:player-session='+'a'.repeat(64),...headers},body:JSON.stringify(body)});}
test('EVO bridge requires same-origin signed-in requests and rejects browser-supplied payment terms',async()=>{
 let calls=0;const run=handler(async()=>{calls++;return Response.json({value:order()});}),input={requestId:orderId,bundleId:'bundle_pouch',address:owner};
 for(const [r,status] of [[request(input,{origin:'https://attacker.example'}),403],[request(input,{host:'attacker.example'}),403],[request(input,{cookie:''}),401],[request({...input,amount:'1'}),400],[request(input,{'content-type':'text/plain'}),415]])assert.equal((await run(r,'reserve')).status,status);
 assert.equal(calls,0);
});
test('EVO bridge sends service credentials only to the pinned account API and refuses redirects',async()=>{
 const calls=[],run=handler(async(url,options)=>{calls.push({url,options});return Response.json({value:order()});});
 assert.equal((await run(request({requestId:orderId,bundleId:'bundle_pouch',address:owner}),'reserve')).status,200);
 const {url,options}=calls[0];assert.equal(url,'https://beta-accounts.evoverses.com/internal/store');assert.equal(options.redirect,'manual');assert.equal(options.headers['X-EvoVerses-Service'],'b'.repeat(64));assert.equal(JSON.parse(options.body).operation,'evo-reserve');assert.equal(JSON.parse(options.body).sessionToken,'a'.repeat(64));
 const redirect=handler(async()=>Response.json({}, {status:302,headers:{Location:'https://attacker.example'}}));assert.equal((await redirect(request({orderId,transactionHash:'0x'+'1'.repeat(64)}),'verify')).status,503);
});
