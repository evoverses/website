'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/player/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
class AuthError extends Error {constructor(code){super(code);this.code=code;}}
function load(readProfile){
 const module={exports:{}};
 const imports={'server-only':{},react:{cache:fn=>fn},'next/headers':{cookies:async()=>({get:()=>({value:'a'.repeat(64)})})},'./auth-core':{PlayerWebError:AuthError,playerSessionCookie:'ev:player-session',createPlayerWebAuth:()=>({readProfile})},'./hosted-config':{betaWebOrigin:'https://beta.evoverses.com',hostedAccountConfig:()=>({hosted:{serviceToken:'fixture'},apiUrl:'https://beta-accounts.evoverses.com'})},'./oauth-rpc':{createOAuthRpc:()=>({})}};
 vm.runInNewContext(code,{module,exports:module.exports,process:{env:{NODE_ENV:'production',EVOVERSES_HOSTED_BETA:'1'}},Buffer,console,require:name=>Object.hasOwn(imports,name)?imports[name]:require(name)});
 return module.exports.getPlayerAccount;
}
test('only invalid sessions return signed-out; service errors propagate for retry',async()=>{
 assert.equal(await load(async()=>{throw new AuthError('INVALID_SESSION');})(),null);
 for(const error of [new AuthError('SERVICE_UNAVAILABLE'),new Error('Network timeout')])await assert.rejects(load(async()=>{throw error;})(),e=>e===error);
 const snapshot={player:{id:'fixture'},balance:{evoros:5000}};assert.equal(await load(async()=>snapshot)(),snapshot);
});
