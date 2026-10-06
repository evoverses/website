// Local, signed-out browser check. Epic's navigation is intercepted before any provider login.
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),{createRequire}=require('node:module');
const runtimePackage=process.env.EVOVERSES_TEST_RUNTIME_PACKAGE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=createRequire(runtimePackage)('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.name));
  let formOrigin;
  page.on('request',request=>{if(request.url()==='http://localhost:3100/api/player/auth/epic/start')formOrigin=request.headers().origin;});
  await page.route('https://www.epicgames.com/id/authorize**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>Epic navigation intercepted by local test.</p>'}));
  assert.equal((await page.goto('http://localhost:3100/signin',{waitUntil:'domcontentloaded',timeout:60000})).status(),200);
  const button=page.getByRole('button',{name:'Sign in with Epic',exact:true});assert.equal(await button.isEnabled(),true,'Start reviewed local player service first');
  await page.waitForFunction(()=>{const img=document.querySelector('img[alt="The EvoVerses battle arena"]');return img?.complete&&img.naturalWidth>0;});
  assert.equal((await context.request.get('http://localhost:3100/api/player/me')).status(),401);
  const denied=await context.request.post('http://localhost:3100/api/player/auth/epic/start',{headers:{Origin:'https://attacker.example'},maxRedirects:0});assert.equal(denied.status(),403);assert.equal(denied.headers()['set-cookie'],undefined);
  const outgoing=page.waitForResponse(r=>r.url()==='http://localhost:3100/api/player/auth/epic/start'&&r.status()===303);
  await button.click();const response=await outgoing,authorization=new URL(response.headers().location);
  assert.equal(authorization.origin,'https://www.epicgames.com');assert.equal(authorization.searchParams.get('redirect_uri'),'http://localhost:3100/api/player/auth/epic/callback');
  if(process.env.EVOVERSES_TEST_EPIC_CLIENT_ID)assert.equal(authorization.searchParams.get('client_id'),process.env.EVOVERSES_TEST_EPIC_CLIENT_ID,'Actual form selects the configured website client');
  assert.equal(formOrigin,'http://localhost:3100','Actual HTML form sends real Origin');
  const state=(await context.cookies('http://localhost:3100/api/player/auth/epic/callback')).find(cookie=>cookie.name==='ev:epic-state');assert.equal(state.httpOnly,true);assert.equal(state.sameSite,'Lax');
  await page.goto('http://localhost:3100/signin?confirm=1',{waitUntil:'domcontentloaded'});assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).count(),0,'Query alone cannot create a player');
  await context.addCookies([{name:'ev:player-session',value:'f'.repeat(64),domain:'localhost',path:'/',httpOnly:true,sameSite:'Lax'}]);
  await page.goto('http://localhost:3100/profile',{waitUntil:'domcontentloaded'});assert.equal(new URL(page.url()).pathname,'/signin','Forged cookie cannot authorise profile');
  await context.clearCookies();await page.setViewportSize({width:375,height:812});await page.goto('http://localhost:3100/signin',{waitUntil:'domcontentloaded'});
  assert.equal(await button.isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log('Local Epic screen, actual form Origin, cookie/CSRF/confirmation/forged-session and mobile checks passed. No Epic login was automated.');
 }finally{await browser.close();}
})().catch(()=>{console.error('Local player browser check failed. Provider values and URLs omitted.');process.exitCode=1});
