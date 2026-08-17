import { chromium } from 'playwright';
const BASE='http://localhost:5173';
const API='http://localhost:3000';
let browser;
try { browser=await chromium.launch({headless:true, channel:'chrome', args:['--no-sandbox']}); } catch(e){ browser=await chromium.launch({headless:true, args:['--no-sandbox']}); }
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
page.on('console', m=> console.log('BROWSER:',m.text()));
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill('joseph.kizza@iscms.ug');
await page.locator('input[type="password"]').fill('password123');
await page.locator('button:has-text("Sign In")').click();
await page.waitForTimeout(2500);
for(let i=0;i<3;i++){ const b=page.locator('button:has-text("Continue"), button:has-text("Got it")').first(); if(await b.count()&&await b.isVisible()){await b.click(); await page.waitForTimeout(400);} await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
await page.evaluate(()=>{ const el=document.querySelector('div.fixed.inset-0'); if(el) el.remove(); document.querySelectorAll('[role="dialog"]').forEach(e=>e.remove()); });
await page.waitForTimeout(400);
console.log('login done url',page.url());
console.log('token len', (await page.evaluate(()=>localStorage.getItem('iscms_access_token')||'')).length);

// Open Device Sessions tab
const deviceTab=page.locator('button:has-text("Device Sessions")').first();
await deviceTab.waitFor({state:'visible', timeout:5000});
await deviceTab.click();
await page.waitForTimeout(2500);
await page.screenshot({path:'/tmp/verify_it/final_devices.png', fullPage:true});
console.log('devices tab screenshot');

// In-page API check
const statsTxt=await page.evaluate(async()=>{
  const t=localStorage.getItem('iscms_access_token');
  const r=await fetch('/api/it/sessions/stats',{headers:{Authorization:'Bearer '+t}});
  return r.status+' '+(await r.text()).slice(0,800);
});
console.log('stats via page',statsTxt);
const sessionsTxt=await page.evaluate(async()=>{
  const t=localStorage.getItem('iscms_access_token');
  const r=await fetch('/api/it/sessions?limit=5',{headers:{Authorization:'Bearer '+t}});
  return r.status+' '+(await r.text()).slice(0,1000);
});
console.log('sessions via page',sessionsTxt);

// Drive Login Attempts tab
const attemptsTab=page.locator('button:has-text("Login Attempts")').first();
await attemptsTab.click();
await page.waitForTimeout(1000);
await page.screenshot({path:'/tmp/verify_it/final_attempts.png', fullPage:true});
console.log('attempts tab screenshot');

// Back to sessions
await page.locator('button:has-text("Live Sessions")').click();
await page.waitForTimeout(1000);

// Search
const search=page.locator('input[placeholder*="Search email, IP"]').first();
await search.fill('joseph');
await page.waitForTimeout(800);
await page.screenshot({path:'/tmp/verify_it/final_search.png', fullPage:true});
console.log('search done');
await search.fill('');
await page.waitForTimeout(500);

// All filter -> Active
const sel=page.locator('select').first();
await sel.selectOption('Active');
await page.waitForTimeout(800);
await page.screenshot({path:'/tmp/verify_it/final_active.png', fullPage:true});
console.log('active filter done');
await sel.selectOption('Terminated');
await page.waitForTimeout(800);
await page.screenshot({path:'/tmp/verify_it/final_terminated.png', fullPage:true});
console.log('terminated filter done');
await sel.selectOption('ALL');
await page.waitForTimeout(800);

// Terminate first active if any
let termBtn=page.locator('button:has-text("Terminate")').first();
if(await termBtn.count()){
  page.on('dialog', async d=>{ console.log('terminate confirm',d.message()); await d.accept(); });
  await termBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({path:'/tmp/verify_it/final_terminate.png', fullPage:true});
  console.log('terminate done');
} else console.log('no terminate btn (maybe no active sessions)');

// Export CSV
const expBtn=page.locator('button:has-text("Export CSV")').first();
if(await expBtn.count()){
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:3000}).catch(()=>null), expBtn.click()]);
  console.log('export', dl?'download':'no download (blob)');
  await page.waitForTimeout(500);
}

// Refresh
await page.locator('button:has-text("Refresh")').click();
await page.waitForTimeout(800);
await page.screenshot({path:'/tmp/verify_it/final_refresh.png', fullPage:true});
console.log('refresh done');

// System health bar
console.log('health bar', await page.locator('text=Uptime').first().textContent().catch(()=>'not found'));

// FPS
const fps=await page.evaluate(async()=>new Promise(r=>{let f=0;const s=performance.now();function t(){f++; if(performance.now()-s<1000) requestAnimationFrame(t); else r(f);} requestAnimationFrame(t);}));
console.log(`FPS ${fps}`);
await page.screenshot({path:'/tmp/verify_it/final.png', fullPage:true});
await browser.close();
console.log('done verification');
