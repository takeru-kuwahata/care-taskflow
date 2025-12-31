import { test } from '@playwright/test';

test('本番環境デバッグ - コンソールログ確認', async ({ page }) => {
  // コンソールログをキャプチャ
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  // ネットワークエラーをキャプチャ
  page.on('requestfailed', request => {
    console.log('NETWORK ERROR:', request.url(), request.failure()?.errorText);
  });

  await page.goto('https://www.mdc-flow.net/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'TestPass2025!');
  await page.click('button[type="submit"]');
  
  // 10秒待機してログを確認
  await page.waitForTimeout(10000);
  
  console.log('Current URL:', page.url());
});
