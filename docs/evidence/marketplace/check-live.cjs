const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
 let directGraphql=0;const replies=[];
 page.on('request',r=>{if(new URL(r.url()).hostname==='api.evoverses.com')directGraphql++;});
 page.on('response',async r=>{if(r.url().includes('/api/marketplace/query')){const d=await r.json().catch(()=>({}));replies.push({status:r.status(),total:d.data?.evosByQuery?.total,items:d.data?.evosByQuery?.items?.length});}});
 await page.goto('https://beta.evoverses.com/marketplace/evos',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('a[href^="/assets/evo/"]').first().waitFor({timeout:45000});
 const cards=await page.locator('a[href^="/assets/evo/"]').count();if(!cards||directGraphql)throw Error('Marketplace did not use same-origin data');
 await page.screenshot({path:path.join(__dirname,'live-items.png'),fullPage:false});
 // Force a list failure in this isolated anonymous browser, then verify the visible retry path.
 const failurePage=await browser.newPage();await failurePage.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
 await failurePage.route('**/api/marketplace/query',async route=>{const body=route.request().postDataJSON();if(body.operationName==='EvosByQueryQuery')await route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Simulated unavailable data'})});else await route.continue();});
 await failurePage.goto('https://beta.evoverses.com/marketplace/evos',{waitUntil:'domcontentloaded'});const retry=failurePage.getByRole('button',{name:'Retry loading items'});await retry.waitFor({timeout:30000});
 const noItemsShown=await failurePage.getByText('No items found',{exact:true}).isVisible().catch(()=>false);if(noItemsShown)throw Error('Failure still presented as empty list');
 await failurePage.unroute('**/api/marketplace/query');await retry.click();await failurePage.locator('a[href^="/assets/evo/"]').first().waitFor({timeout:45000});
 const result={cards,directGraphql,noItemsShown,retryRecovered:true,replies};fs.writeFileSync(path.join(__dirname,'live-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
