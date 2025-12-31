import { test, expect } from '@playwright/test';

test('本番環境でログインできるか確認', async ({ page }) => {
  // 本番環境のログインページにアクセス
  await page.goto('https://www.mdc-flow.net/login');

  // フォーム入力
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'TestPass2025!');

  // ログインボタンクリック
  await page.click('button[type="submit"]');

  // 成功したら /tasks に遷移するはず
  await page.waitForURL('**/tasks', { timeout: 15000 });

  console.log('✅ ログイン成功');
});
