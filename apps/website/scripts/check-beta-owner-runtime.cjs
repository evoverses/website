const path = require('node:path');
const assert = require('node:assert/strict');
const {unstable_dev} = require('wrangler');
async function checkBetaOwnerRuntime(configPath = 'wrangler.beta.jsonc') {
 const worker=await unstable_dev('cloudflare-worker.ts',{
  config:path.resolve(configPath),envFiles:[],local:true,ip:'127.0.0.1',port:0,inspectorPort:0,persist:false,logLevel:'error',
  experimental:{disableExperimentalWarning:true,forceLocal:true,watch:false,liveReload:false}
 });
 try {
  for(const route of ['/','/profile','/nursery/bertha?egg=5112','/api/nursery/access','/api/player/me','/api/leaderboard/pvbot','/api/downloads/file']){
   const response=await worker.fetch(route,{redirect:'manual'});
   assert.equal(response.status,302,route);
   assert.equal(response.headers.get('location'),'https://evoverses.com'+route);
   assert.equal(response.headers.get('cache-control'),'private, no-store');
   assert.match(response.headers.get('vary'),/Cookie/);
   console.log(`Beta redirect ${route}: HTTP 302, private, no-store`);
  }
  const blocked=await worker.fetch('/api/store/checkout',{method:'POST',body:'test',redirect:'manual'});
  assert.equal(blocked.status,303);assert.equal(blocked.headers.get('location'),'https://evoverses.com/api/store/checkout');
  console.log('Blocked beta POST: HTTP 303, no mutation replay');
  const signin=await worker.fetch('/signin',{redirect:'manual'});
  assert.equal(signin.status,200);assert.match(await signin.text(),/Sign in with Epic/);
  assert.equal(signin.headers.get('cache-control'),'private, no-store');
  console.log('Owner sign-in recovery: HTTP 200');
 } finally {await worker.stop();}
}
module.exports = {checkBetaOwnerRuntime};
if (require.main === module) checkBetaOwnerRuntime(process.argv[2]).catch(error=>{console.error(error.message);process.exitCode=1;});
