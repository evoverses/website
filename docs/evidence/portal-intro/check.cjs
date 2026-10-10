const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto('file:///'+path.join(__dirname,'preview.html').replace(/\\/g,'/'));
  await page.locator('.image').evaluate(im=>im.decode());
  const evidence=[];
  for(const time of [600,1300,2800]){
   await page.evaluate(t=>{for(const a of document.getAnimations()){a.pause();a.currentTime=t;}},time);
   await page.screenshot({path:path.join(__dirname,`desktop-${time}.png`)});
   evidence.push(await page.evaluate(t=>({time:t,portalOpacity:getComputedStyle(document.querySelector('.vortex')).opacity,logoOpacity:getComputedStyle(document.querySelector('.logo')).opacity,overflow:document.documentElement.scrollWidth>innerWidth}),time));
  }
  await page.setViewportSize({width:375,height:750});await page.screenshot({path:path.join(__dirname,'mobile-final.png')});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>({portal:getComputedStyle(document.querySelector('.vortex')).display,logoOpacity:getComputedStyle(document.querySelector('.logo')).opacity,animations:document.getAnimations().length}));
  if(reduced.portal!=='none'||reduced.animations!==0)throw Error('Reduced motion failure');
  fs.writeFileSync(path.join(__dirname,'visual-check.json'),JSON.stringify({evidence,reduced},null,2));console.log(JSON.stringify({evidence,reduced}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
