const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
  await page.goto('https://beta.evoverses.com/marketplace/evos',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('a[href^="/assets/evo/"]').first().waitFor({timeout:45000});
  const settings=await page.locator('button:has(svg.lucide-settings)').count();
  const insights=await page.getByRole('button',{name:'Insights'}).count();
  const insightIcons=await page.locator('button:has(svg.lucide-trending-up)').count();
  const layouts=await page.getByRole('radio').count();
  if(settings||insights||insightIcons)throw Error('Unfinished toolbar buttons still visible');
  console.log(JSON.stringify({settings,insights,insightIcons,layouts,cards:await page.locator('a[href^="/assets/evo/"]').count()}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
