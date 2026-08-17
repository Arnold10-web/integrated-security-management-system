import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3000';

let browser;
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] });
} catch(e) {
  console.log('chrome channel fail, default', e);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
}
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Start perf measurement
let frames = 0;
await page.goto(BASE, { waitUntil: 'networkidle' });
console.log('goto root', page.url());

// Login as IT Officer via public login form - inspect form selectors
await page.waitForTimeout(1500);
const hasLogin = await page.locator('input[type="email"], input[placeholder*="Email" i], input[name="email"]').count();
console.log('email inputs', hasLogin);
await page.screenshot({ path: '/tmp/verify_it/01_login.png', fullPage: true });
console.log('01_login captured');

// Try to fill login - look at LoginView structure
// It has email/password inputs with specific IDs or labels
const emailInput = page.locator('input[type="email"]').first();
const passInput = page.locator('input[type="password"]').first();
const hasEmail = await emailInput.count();
const hasPass = await passInput.count();
console.log(`email count ${hasEmail} pass count ${hasPass}`);

if (hasEmail && hasPass) {
  await emailInput.fill('joseph.kizza@iscms.ug');
  await passInput.fill('password123');
  // Find login button
  const loginBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
  console.log('loginBtn count', await loginBtn.count());
  await loginBtn.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/verify_it/02_after_login.png', fullPage: true });
  console.log('02_after_login captured url', page.url());
  // Dismiss welcome/walkthrough modal that intercepts clicks (IT Officer first login)
  for (let i=0;i<3;i++) {
    const modalClose = page.locator('button:has-text("Continue"), button:has-text("Got it"), button:has-text("Dismiss"), button:has-text("Close"), button:has-text("Skip")').first();
    if (await modalClose.count() && await modalClose.isVisible()) { try { await modalClose.click({timeout:2000}); await page.waitForTimeout(400); console.log('dismissed modal via close btn'); } catch {} }
    const overlay = page.locator('div.fixed.inset-0').first();
    if (await overlay.count() && await overlay.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      // also try clicking outside via Escape again and checking if overlay gone
      if (!(await overlay.isVisible())) break;
    } else break;
  }
  await page.waitForTimeout(800);
} else {
  console.log('No login form found - trying direct API login and set token');
  // fallback: do API login and inject token
  const loginRes = await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'joseph.kizza@iscms.ug',password:'password123'})}).then(r=>r.json());
  await page.evaluate((token) => { localStorage.setItem('iscms_access_token', token); }, loginRes.token);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/verify_it/02_after_login.png', fullPage: true });
}

// Now find IT tab - should be visible for IT Officer
await page.waitForTimeout(1500);
const itTab = page.locator('text=IT Department, text=Device Sessions, text=IT Officer').first();
console.log('itTab count', await itTab.count());
// Try to click Device Sessions & IP Intelligence tab
let deviceTab = page.locator('button:has-text("Device Sessions"), button:has-text("IP Intelligence")').first();
if (await deviceTab.count() === 0) {
  // fallback: look for Monitor icon tab or text containing Device
  deviceTab = page.locator('text=Device Sessions & IP Intelligence').first();
}
console.log('deviceTab count', await deviceTab.count());
if (await deviceTab.count() > 0) {
  await deviceTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/verify_it/03_devices_tab.png', fullPage: true });
  console.log('03_devices_tab captured');
} else {
  // Try clicking IT Admin nav first?
  const itAdminTab = page.locator('button:has-text("User Accounts")').first();
  if (await itAdminTab.count()) {
    console.log('no device tab yet, maybe need to navigate to IT section');
    await page.screenshot({ path: '/tmp/verify_it/03_no_device_tab.png', fullPage: true });
  }
}

// Within devices panel, drive controls
// Search
let searchInput = page.locator('input[placeholder*="Search email, IP"]').first();
if (await searchInput.count()) {
  await searchInput.fill('joseph');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/verify_it/04_search.png', fullPage: true });
  console.log('04_search captured');
  await searchInput.fill('');
  await page.waitForTimeout(500);
}

// All filter -> Active filter
let activeSelect = page.locator('select').first();
if (await activeSelect.count()) {
  await activeSelect.selectOption('Active');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/verify_it/05_active_filter.png', fullPage: true });
  console.log('05_active_filter captured');
  await activeSelect.selectOption('Terminated');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/verify_it/06_terminated_filter.png', fullPage: true });
  console.log('06_terminated_filter captured');
  await activeSelect.selectOption('ALL');
  await page.waitForTimeout(800);
}

// Login Attempts tab
let attemptsTab = page.locator('button:has-text("Login Attempts")').first();
if (await attemptsTab.count()) {
  await attemptsTab.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/verify_it/07_login_attempts.png', fullPage: true });
  console.log('07_login_attempts captured');
  // back to sessions
  let sessionsTab = page.locator('button:has-text("Live Sessions")').first();
  await sessionsTab.click();
  await page.waitForTimeout(800);
}

// Terminate first active session if exists
let terminateBtn = page.locator('button:has-text("Terminate")').first();
if (await terminateBtn.count()) {
  page.on('dialog', async d => { console.log('confirm dialog', d.message()); await d.accept(); });
  await terminateBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/verify_it/08_after_terminate.png', fullPage: true });
  console.log('08_after_terminate captured');
}

// Export CSV
let exportBtn = page.locator('button:has-text("Export CSV")').first();
if (await exportBtn.count()) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 3000 }).catch(() => null),
    exportBtn.click(),
  ]);
  console.log('export click done, download', download ? 'yes' : 'timeout (still ok, CSV via blob)');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/verify_it/09_export.png', fullPage: true });
}

// Refresh
let refreshBtn = page.locator('button:has-text("Refresh")').first();
if (await refreshBtn.count()) {
  await refreshBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/verify_it/10_refresh.png', fullPage: true });
  console.log('10_refresh captured');
}

// System health bar is at top of panel
let healthBar = page.locator('text=Uptime').first();
if (await healthBar.count()) {
  console.log('health bar visible', await healthBar.textContent());
}

// FPS measurement 1s RAF
const fps = await page.evaluate(async () => {
  return new Promise(resolve => { let frames=0; const start=performance.now(); function tick(){ frames++; if(performance.now()-start<1000) requestAnimationFrame(tick); else resolve(frames); } requestAnimationFrame(tick); });
});
console.log(`FPS (RAF 1s): ${fps}`);

// Final full page
await page.screenshot({ path: '/tmp/verify_it/final.png', fullPage: true });
console.log('final captured');

await browser.close();
console.log('done');

// Also verify via API directly that endpoints still work
const itToken = await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'joseph.kizza@iscms.ug',password:'password123'})}).then(r=>r.json()).then(j=>j.token);
const stats = await fetch(API+'/api/it/sessions/stats',{headers:{Authorization:'Bearer '+itToken}}).then(r=>r.json());
console.log('API stats', `total ${stats.totalSessions} active ${stats.activeSessions} uniqueIps ${stats.uniqueIps}`);
const dlCheck = await fetch(API+'/api/it/sessions?limit=1',{headers:{Authorization:'Bearer '+itToken}}).then(r=>r.json());
console.log('API sessions sample', dlCheck.data?.[0]?.ipAddress, dlCheck.data?.[0]?.device, dlCheck.data?.[0]?.browser);
