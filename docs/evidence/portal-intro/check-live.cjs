const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const response=await page.goto('https://beta.evoverses.com',{waitUntil:'load'});
  if(response.status()!==200)throw Error('Landing page status '+response.status()+': '+(await response.text()).slice(0,350));
  const scene=page.locator('[class*="portal-intro_scene"]');await scene.waitFor();
  await scene.locator('img[alt="EvoVerses"]').evaluate(im=>im.decode());
  await page.waitForFunction(()=>document.getAnimations().length>0);
  await page.evaluate(async()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=2800;}await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const desktop=await page.evaluate(()=>({youtubeEmbeds:document.querySelectorAll('iframe[src*="youtube"]').length,overflow:document.documentElement.scrollWidth>innerWidth,portal:getComputedStyle(document.querySelector('[class*="portal-intro_vortex"]')).opacity,logo:getComputedStyle(document.querySelector('[class*="portal-intro_logo"]')).opacity}));
  console.log(JSON.stringify(desktop));
  if(desktop.youtubeEmbeds||desktop.overflow||desktop.portal!=='0'||desktop.logo!=='1')throw Error('Live landing state mismatch');
  await page.screenshot({path:path.join(__dirname,'live-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'live-mobile.png'),fullPage:true});
  const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(mobileOverflow)throw Error('Live mobile overflow');
  fs.writeFileSync(path.join(__dirname,'live-check.json'),JSON.stringify({status:response.status(),desktop,mobileOverflow},null,2));console.log(JSON.stringify({status:response.status(),desktop,mobileOverflow}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
