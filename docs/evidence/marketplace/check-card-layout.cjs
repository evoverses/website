const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const origin=process.env.CARD_CHECK_ORIGIN||'https://beta.evoverses.com';
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
  const page=await context.newPage();
  async function capture(label){
   await page.locator('[data-evo-card]').first().waitFor({timeout:45000});
   await page.locator('[data-evo-card]').first().evaluate(async el=>{
    await Promise.all([...el.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r;})));
   });
   const geometry=await page.locator('[data-evo-card]').evaluateAll(cards=>cards.slice(0,8).map(card=>{
    const c=card.getBoundingClientRect(), art=card.querySelector('[data-evo-card-art]').getBoundingClientRect(), info=card.querySelector('[data-evo-card-info]').getBoundingClientRect();
    const number=card.querySelector('[data-evo-card-number]').getBoundingClientRect();
    const numberClear=info.bottom<=number.top||info.right<=number.left||info.left>=number.right;
    const generation=card.querySelector('[data-evo-card-bar="generation"]').getBoundingClientRect();
    const generationAligned=Math.abs(info.bottom-generation.bottom)<=1;
    const barGeometry=[...card.querySelectorAll('[data-evo-card-bar]')].map(el=>{const r=el.getBoundingClientRect();return {bar:el.dataset.evoCardBar,top:(r.top-c.top)/c.width,height:r.height/c.width};});
    const grid=card.querySelector('[data-evo-card-info] .grid');
    const statsLayout=!grid||(grid.children.length===6&&getComputedStyle(grid).gridTemplateColumns.split(' ').length===2);
    const textFits=[...card.querySelectorAll('[data-evo-card-info] span')].every(el=>{const r=el.getBoundingClientRect();return r.left>=info.left-1&&r.right<=info.right+1&&r.top>=info.top-1&&r.bottom<=info.bottom+1;});
    return {width:c.width,artTop:(art.top-c.top)/c.width,artHeight:art.height/c.width,infoWidth:info.width/c.width,infoHeight:info.height/c.width,infoLeft:(info.left-c.left)/c.width,bufferLeft:parseFloat(getComputedStyle(card.querySelector('[data-evo-card-info]')).paddingLeft)/c.width,infoBottom:(c.bottom-info.bottom)/c.width,artClear:art.bottom<=info.top,numberClear,generationAligned,barGeometry,statsLayout,textFits};
   }));
   if(geometry.some(c=>!c.artClear||!c.numberClear||!c.generationAligned||!c.statsLayout||!c.textFits||Math.abs(c.artTop-.27)>.01||Math.abs(c.infoWidth-.4)>.01||Math.abs(c.infoHeight-.31)>.01||Math.abs(c.infoLeft-.0961)>.01||Math.abs(c.bufferLeft-.03)>.01))throw Error('Card layout failed: '+label+' '+JSON.stringify(geometry));
   const screenshot=path.join(__dirname,'cards-'+label+'.png');await page.screenshot({path:screenshot,fullPage:false});results.push({label,geometry});
  }
  await page.goto(origin+'/marketplace/evos',{waitUntil:'domcontentloaded',timeout:45000});
  await capture('grid-desktop');
  await page.getByRole('radio').nth(1).click();await capture('compact-desktop');
  await page.getByRole('radio').nth(2).click();await capture('mosaic-desktop');
  await page.locator('a[href^="/assets/evo/"]').first().click();
  await page.getByRole('button',{name:'Back',exact:true}).waitFor();await capture('detail-desktop');
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.waitForURL('**/marketplace/evos',{waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:390,height:844});
  await capture('list-mobile');
  await page.goto(origin+'/assets/evo/4503',{waitUntil:'domcontentloaded'});await capture('detail-mobile');
  const health = await page.locator('[data-evo-card-info] .grid > div').first().innerText();
  if (!/^HP:\s*25$/.test(health)) throw Error('Krokon L1 card HP must be 25: '+health);
  const direct=await context.newPage();await direct.goto(origin+'/assets/evo/4503',{waitUntil:'domcontentloaded'});
  const back=direct.getByRole('button',{name:'Back',exact:true});await back.waitFor();await direct.locator('[data-evo-card]').waitFor({timeout:45000});await back.focus();await direct.keyboard.press('Enter');await direct.waitForURL('**/marketplace/evos',{waitUntil:'domcontentloaded'});
  fs.writeFileSync(path.join(__dirname,'card-layout-check.json'),JSON.stringify({origin,backReturned:true,results},null,2));
  console.log(JSON.stringify({origin,backReturned:true,views:results.map(r=>r.label)}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
