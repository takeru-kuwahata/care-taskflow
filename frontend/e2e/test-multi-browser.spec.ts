import { test, expect, chromium, firefox, webkit } from '@playwright/test';

const testLogin = async (browserType: any, browserName: string) => {
  const browser = await browserType.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`[${browserName}] Testing login...`);
    
    await page.goto('https://www.mdc-flow.net/login');
    await page.fill('input[type="email"]', 'kuwahata@mdc-japan.org');
    await page.fill('input[type="password"]', 'ikea2026');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks', { timeout: 15000 });
    
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log(`[${browserName}] ✅ Login successful, token exists: ${!!token}`);
    
    return true;
  } catch (error) {
    console.log(`[${browserName}] ❌ Login failed:`, error);
    return false;
  } finally {
    await browser.close();
  }
};

test('Chromiumでログイン', async () => {
  const result = await testLogin(chromium, 'Chromium');
  expect(result).toBe(true);
});

test('Firefoxでログイン', async () => {
  const result = await testLogin(firefox, 'Firefox');
  expect(result).toBe(true);
});

test('WebKitでログイン', async () => {
  const result = await testLogin(webkit, 'WebKit');
  expect(result).toBe(true);
});
