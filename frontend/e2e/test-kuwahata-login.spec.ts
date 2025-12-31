import { test } from '@playwright/test';

test('桑畑さんのアカウントでログイン', async ({ page }) => {
  page.on('console', msg => console.log('🖥️ BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('❌ ERROR:', error.message));
  page.on('requestfailed', req => console.log('🚫 FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('📡 API:', res.status(), res.url());
    }
  });

  await page.goto('https://www.mdc-flow.net/login');
  console.log('📍 Current URL:', page.url());
  
  await page.fill('input[type="email"]', 'kuwahata@mdc-japan.org');
  await page.fill('input[type="password"]', 'ikea2026');
  
  console.log('🔘 Clicking login button...');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(15000);
  
  console.log('📍 Final URL:', page.url());
  console.log('🔑 Token in localStorage:', await page.evaluate(() => localStorage.getItem('auth_token')));
});
