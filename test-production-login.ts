import { chromium } from 'playwright';

async function testProductionLogin() {
  console.log('[TEST] Starting production login test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ログインページにアクセス
    console.log('[TEST] Navigating to https://www.mdc-flow.net/login');
    await page.goto('https://www.mdc-flow.net/login', { waitUntil: 'networkidle' });

    // ログインフォームに入力
    console.log('[TEST] Filling login form...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass2025!');

    // ログインボタンをクリック
    console.log('[TEST] Clicking login button...');
    await page.click('button[type="submit"]');

    // ナビゲーション待機（最大15秒）
    console.log('[TEST] Waiting for navigation...');
    await page.waitForURL('**/tasks', { timeout: 15000 }).catch(() => {
      console.log('[TEST] Did not navigate to /tasks within 15 seconds');
    });

    // 結果確認
    const currentUrl = page.url();
    console.log('[TEST] Current URL:', currentUrl);

    if (currentUrl.includes('/tasks')) {
      console.log('[TEST] ✅ Login successful! Redirected to tasks page');
    } else {
      console.log('[TEST] ❌ Login failed. Current page:', currentUrl);

      // エラーメッセージを確認
      const errorMessage = await page.locator('.bg-red-50').textContent().catch(() => null);
      if (errorMessage) {
        console.log('[TEST] Error message:', errorMessage);
      }
    }

    // スクリーンショット撮影
    await page.screenshot({ path: '/tmp/production-login-test.png', fullPage: true });
    console.log('[TEST] Screenshot saved to /tmp/production-login-test.png');

    // 5秒待機（手動確認用）
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('[TEST] Error during test:', error);
  } finally {
    await browser.close();
  }
}

testProductionLogin();
