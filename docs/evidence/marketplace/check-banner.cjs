const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const results=[];
 for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.addInitScript(theme=>{localStorage.setItem('evoverses:pro-mode','on');localStorage.setItem('theme',theme);},theme);
  await page.goto('https://beta.evoverses.com/marketplace/evos',{waitUntil:'domcontentloaded'});
  const stats=page.getByTestId('marketplace-banner-stats');await stats.waitFor({timeout:30000});
  await page.locator('a[href^="/assets/evo/"]').first().waitFor({timeout:45000});
  await page.waitForFunction(theme=>document.documentElement.classList.contains(theme),theme);
  const result=await stats.evaluate(el=>({background:getComputedStyle(el).backgroundColor,labels:[...el.querySelectorAll('span.text-slate-200')].map(e=>getComputedStyle(e).color),values:[...el.querySelectorAll('span.text-white')].map(e=>getComputedStyle(e).color),headingClass:el.closest('div[style]').querySelector('h1').className,descriptionCount:el.closest('div[style]').querySelectorAll('h4').length}));
  if(result.labels.length!==5||result.values.length!==5||!result.headingClass.includes('sr-only')||result.descriptionCount)throw Error('Banner structure incorrect');
  results.push({theme,...result});await page.screenshot({path:path.join(__dirname,'banner-'+theme+'.png'),fullPage:false});await page.close();
 }
 if(JSON.stringify(results[0].labels)!==JSON.stringify(results[1].labels)||JSON.stringify(results[0].values)!==JSON.stringify(results[1].values)||results[0].background!==results[1].background)throw Error('Stats change colour with theme');
 fs.writeFileSync(path.join(__dirname,'banner-check.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
