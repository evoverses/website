const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
  const page=await context.newPage();
  await page.route('**/api/marketplace/query',async route=>{
   const response=await route.fetch(),data=await response.json();
   const items=data.data?.evosByQuery?.items;
   if(items)items.slice(0,3).forEach((asset,i)=>{asset.metadata.chroma=['none','chroma','super'][i];asset.metadata.rarity='unknown';});
   await route.fulfill({response,json:data});
  });
  // Use common artwork in this border-only fixture when a species has no special-skin image.
  await page.route('**/imagedelivery.net/**/evo/**',async route=>{const url=route.request().url();if(/\/(chroma|super)\/public$/.test(url))return route.fulfill({response:await route.fetch({url:url.replace(/\/(chroma|super)\/public$/,'/none/public')})});return route.continue();});
  await page.goto('http://localhost:3127/marketplace/evos',{waitUntil:'domcontentloaded'});
  await page.locator('[data-evo-card-rarity="epic"]').first().waitFor({timeout:45000});
  const cards=page.locator('[data-evo-card]');
  const result=await cards.evaluateAll(cards=>cards.slice(0,3).map(card=>({tier:card.dataset.evoCardRarity,filter:getComputedStyle(card.querySelector('[data-evo-card-border]')).filter,text:card.querySelector('[data-evo-card-info]').textContent})));
  if(result.map(v=>v.tier).join(',')!=='common,chroma,epic'||result[0].filter!=='none'||result[1].filter===result[2].filter)throw Error('Appearance mapping failed');
  await cards.first().evaluate(async card=>Promise.all([...card.parentElement.parentElement.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r;}))));
  await page.screenshot({path:path.join(__dirname,'rarity-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(__dirname,'rarity-mobile.png')});
  fs.writeFileSync(path.join(__dirname,'appearance-check.json'),JSON.stringify({origin:'http://localhost:3127',fixture:true,note:'Skin flags are injected into read-only local responses; no account or metadata changes.',result},null,2));
  await page.unrouteAll({behavior:'ignoreErrors'});
  console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
