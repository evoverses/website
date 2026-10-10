const { test } = require('node:test');
const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const { createSiweMessage } = require('viem/siwe');
const moduleValue = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync('src/lib/player/wallet/challenge.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('module','exports','require',compiled)(moduleValue,moduleValue.exports,require);
const {walletChallengeMatches}=moduleValue.exports;
const address='0x'+'11'.repeat(20), now=Date.parse('2026-10-10T00:00:00Z');
function challenge(origin, overrides={}) {
 const url=new URL(origin), expiresAt=new Date(now+300000).toISOString();
 return {challengeId:'fixture-request',expiresAt,message:createSiweMessage({scheme:url.protocol.slice(0,-1),domain:url.host,uri:origin+'/profile',address,chainId:43114,version:'1',nonce:'12345678',requestId:'fixture-request',issuedAt:new Date(now),expirationTime:new Date(expiresAt),...overrides})};
}
test('beta and localhost challenges permit signing only on their matching page',()=>{
 for(const origin of ['http://localhost:3100','https://beta.evoverses.com']) assert.equal(walletChallengeMatches(challenge(origin),address,origin,now),true);
 assert.equal(walletChallengeMatches(challenge('https://beta.evoverses.com'),address,'http://localhost:3100',now),false);
 assert.equal(walletChallengeMatches(challenge('http://localhost:3100'),address,'https://beta.evoverses.com',now),false);
});
test('foreign pages and altered scheme, domain, URI, chain or address cannot trigger signing',()=>{
 const origin='https://beta.evoverses.com';
 assert.equal(walletChallengeMatches(challenge('https://attacker.invalid'),address,'https://attacker.invalid',now),false);
 for(const overrides of [{scheme:'http'},{domain:'attacker.invalid'},{uri:'https://attacker.invalid/profile'},{chainId:1},{address:'0x'+'22'.repeat(20)}]) assert.equal(walletChallengeMatches(challenge(origin,overrides),address,origin,now),false);
});
test('expired, mismatched request or malformed challenges cannot trigger signing',()=>{
 const origin='https://beta.evoverses.com', value=challenge(origin);
 assert.equal(walletChallengeMatches(value,address,origin,now+300000),false);
 assert.equal(walletChallengeMatches({...value,challengeId:'changed'},address,origin,now),false);
 assert.equal(walletChallengeMatches({...value,expiresAt:new Date(now+600000).toISOString()},address,origin,now),false);
 assert.equal(walletChallengeMatches({...value,message:'invalid'},address,origin,now),false);
});
