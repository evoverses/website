// Isolated browser checks. Injected fixture wallet; all signing/transfers are forbidden.
const assert=require('node:assert/strict'),{createRequire}=require('node:module'),path=require('node:path'),os=require('node:os');
const {chromium}=createRequire(process.env.EVOVERSES_TEST_RUNTIME_PACKAGE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'))('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(60000);page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(()=>{
   const owner='0x1111111111111111111111111111111111111111';let authorised=false;const events={};window.__walletCalls=[];
   const provider={isMetaMask:true,on:(name,callback)=>{(events[name]??=[]).push(callback)},removeListener:(name,callback)=>{events[name]=(events[name]||[]).filter(fn=>fn!==callback)},request:async({method,params})=>{
    window.__walletCalls.push(method);
    if(method==='eth_requestAccounts'){authorised=true;return[owner]}
    if(method==='eth_accounts')return authorised?[owner]:[];
    if(method==='eth_chainId')return'0xa86a';
    if(method==='net_version')return'43114';
    if(method==='wallet_getPermissions')return authorised?[{parentCapability:'eth_accounts'}]:[];
    if(method==='wallet_getCapabilities')return{};
    throw Error('Fixture denies '+method);
   }};window.ethereum=provider;
   const announce=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'11111111-2222-4333-8444-555555555555',name:'MetaMask',icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',rdns:'io.metamask'},provider}}));
   window.addEventListener('eip6963:requestProvider',announce);announce();
  });
  await page.route('https://api.avax.network/ext/bc/C/rpc',async route=>{const body=route.request().postDataJSON();const reply=q=>({jsonrpc:'2.0',id:q.id,result:q.method==='eth_call'&&q.params[0].data.startsWith('0x313ce567')?'0x'+(18).toString(16).padStart(64,'0'):q.method==='eth_call'?'0x'+(100n*10n**18n).toString(16).padStart(64,'0'):q.method==='eth_chainId'?'0xa86a':'0x0'});await route.fulfill({json:Array.isArray(body)?body.map(reply):reply(body)});});
  await page.route('**/api/store/evo-quote',route=>route.fulfill({status:503,json:{error:'Fixture quote unavailable'}}));
  await page.goto('http://localhost:3100/store',{waitUntil:'networkidle',timeout:180000});
  assert.equal(await page.getByRole('group',{name:'Payment method'}).count(),0);
  assert.equal(await page.getByTestId('navbar-evoros').count(),1);assert.equal(await page.getByTestId('navbar-evo').count(),0);
  assert.equal(await page.getByTestId('purchase-button').isDisabled(),true);
  await page.getByRole('switch',{name:'Pro mode',exact:true}).click();
  const fiat=page.getByRole('button',{name:'FIAT',exact:true}),evo=page.getByRole('button',{name:'EVO',exact:true});
  assert.equal(await fiat.getAttribute('aria-pressed'),'true');assert.equal(await evo.isDisabled(),true);
  assert.equal(await page.getByTestId('navbar-evo').isVisible(),true);
  await page.getByRole('button',{name:'Your account',exact:true}).click();await page.getByRole('menuitem',{name:'Connect wallet',exact:true}).click();
  await page.getByRole('button',{name:/MetaMask/i}).first().click();
  await page.getByRole('button',{name:'Your account',exact:true}).waitFor();
  assert.equal(await evo.isEnabled(),true);
  await page.waitForFunction(()=>document.querySelector('[data-testid="navbar-evo"]')?.textContent.includes('100'));
  assert.ok((await page.evaluate(()=>window.__walletCalls)).includes('eth_requestAccounts'));
  assert.ok(!(await page.evaluate(()=>window.__walletCalls)).some(name=>/sign|sendTransaction/i.test(name)));
  await evo.click();assert.equal(await page.getByTestId('store-wallet').isVisible(),true);
  await page.getByRole('button',{name:'Your account',exact:true}).click();await page.getByRole('menuitem',{name:'Disconnect wallet',exact:true}).click();
  await page.getByRole('button',{name:'Your account',exact:true}).click();await page.getByRole('menuitem',{name:'Connect wallet',exact:true}).waitFor();await page.keyboard.press('Escape');
  assert.equal(await fiat.getAttribute('aria-pressed'),'true');assert.equal(await evo.isDisabled(),true);
  for(const width of [1280,1024,768,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Menu fits '+width);}
  await page.getByRole('switch',{name:'Pro mode',exact:true}).click();
  assert.equal(await page.getByRole('group',{name:'Payment method'}).count(),0);assert.equal(await page.getByTestId('navbar-evo').count(),0);
  assert.deepEqual(errors,[]);console.log('Non-Pro/Pro payment controls, injected external wallet connect/disconnect, EVO balance, no signing, and responsive navbar checks passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1});
