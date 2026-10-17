'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function config(env,phase){
 let sentry=0;const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('next.config.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,process:{env},require:name=>{
  if(name==='@sentry/nextjs')return{withSentryConfig:value=>{sentry++;return{...value,wrappedBySentry:true};}};
  if(name==='next/constants')return{PHASE_DEVELOPMENT_SERVER:'development'};
  throw Error('Unexpected import '+name);
 }});
 return {value:module.exports.default(phase),sentry};
}
test('isolated production checks bypass all Sentry release/upload build hooks',()=>{
 const local=config({EVOVERSES_LOCAL_BUILD_CHECK:'1'},'production-build');assert.equal(local.sentry,0);assert.equal(local.value.distDir,'.next-beta-check');
 const worker=config({EVOVERSES_CLOUDFLARE_BUILD_CHECK:'1'},'production-build');assert.equal(worker.sentry,0);assert.equal(worker.value.output,'standalone');
});
test('ordinary production monitoring and development output remain configured',()=>{
 const production=config({},'production-build');assert.equal(production.sentry,1);assert.equal(production.value.wrappedBySentry,true);assert.equal(production.value.distDir,'.next');
 const development=config({EVOVERSES_LOCAL_BUILD_CHECK:'1'},'development');assert.equal(development.sentry,0);assert.equal(development.value.distDir,'.next');
});
