const {chromium}=require('C:/Users/DanManchester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('evoverses:pro-mode','on'));
page.on('console',m=>{if(m.type()==='error')console.log('console',m.text().slice(0,700))});
page.on('requestfailed',r=>console.log('failed',new URL(r.url()).hostname,new URL(r.url()).pathname,r.failure()?.errorText));
page.on('response',async r=>{if(r.url().includes('/graphql'))console.log('graphql',r.status(),(await r.text()).slice(0,700));});
await page.goto('https://beta.evoverses.com/marketplace/evo',{waitUntil:'networkidle',timeout:45000});console.log('visible', (await page.locator('body').innerText()).slice(-1800));}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
