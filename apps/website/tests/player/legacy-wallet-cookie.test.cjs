'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
function subject({key,preview=false,verify=async()=>({valid:false,parsedJWT:{}}),construct}={}){
 let constructions=0,verifications=0;
 const dependencies={'./preview':{localWalletPreview:preview},'./env.client':{clientId:'fixture-client'},'@/lib/thirdweb/env':{adminPrivateKey:key},'@/lib/thirdweb/env.client':{authDomain:'evoverses.com'},'@/utils/node':{assertEnvNotNull:(value)=>{if(!value)throw Error('Missing key');return value;}},'thirdweb':{createThirdwebClient:()=>({})},'thirdweb/auth':{createAuth:()=>{constructions++;if(construct)construct();return {verifyJWT:async input=>{verifications++;return verify(input);}};}},'viem/accounts':{privateKeyToAddress:()=> '0x'+'11'.repeat(20)}};
 const m={exports:{}},source=ts.transpileModule(fs.readFileSync(path.resolve('src/lib/thirdweb/auth.edge.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',source)(name=>{assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];},m,m.exports);
 return {verify:m.exports.verifyAuthCookie,counts:()=>({constructions,verifications})};
}
test('returning visitor wallet cookie cannot crash rendering when legacy signer is absent',async()=>{
 const s=subject({construct:()=>{throw Error('Must not construct missing verifier');}});
 for(const cookie of ['synthetic-old-wallet-cookie',{name:'ev:jwt',value:'synthetic-old-wallet-cookie'}])assert.deepEqual(await s.verify(cookie),{valid:false,parsedJWT:{}});
 assert.deepEqual(s.counts(),{constructions:0,verifications:0});
});
test('empty, missing, oversized and preview cookies never construct a verifier',async()=>{
 const s=subject({key:'synthetic-present'});
 for(const cookie of [undefined,'',{value:''},'x'.repeat(8193)])assert.equal((await s.verify(cookie)).valid,false);
 assert.deepEqual(s.counts(),{constructions:0,verifications:0});
 assert.equal((await subject({preview:true,key:'synthetic-present'}).verify('fixture')).valid,false);
});
test('verifier setup, signature and provider errors fail closed without throwing',async()=>{
 for(const options of [{construct:()=>{throw Error('bad configuration');}},{verify:async()=>{throw Error('invalid signature or unavailable provider');}}]){
  const s=subject({key:'synthetic-present',...options});assert.deepEqual(await s.verify('fixture'),{valid:false,parsedJWT:{}});
 }
});
test('configured verification still establishes only the identity returned by the verifier',async()=>{
 const identity={valid:true,parsedJWT:{sub:'0x'+'22'.repeat(20)}};
 const s=subject({key:'synthetic-present',verify:async({jwt})=>{assert.equal(jwt,'signed-fixture');return identity;}});
 assert.deepEqual(await s.verify({name:'ev:jwt',value:'signed-fixture'}),identity);assert.deepEqual(await s.verify('signed-fixture'),identity);assert.deepEqual(s.counts(),{constructions:1,verifications:2});
 const invalid=subject({key:'synthetic-present',verify:async()=>({valid:false,parsedJWT:{}})});assert.equal((await invalid.verify('rejected')).valid,false);
});
