/**
 * E2Eテスト認証ヘルパー
 * Phase 9: E2Eテスト
 */

import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass2025!',
};

/**
 * ログイン処理を実行
 */
export async function login(page: Page) {
  // コンソールログとネットワークログを記録
  page.on('console', (msg) => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('response', (response) => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`[Network] Login API Response: ${response.status()}`);
      response.json().then(data => console.log('[Network] Response body:', JSON.stringify(data))).catch(() => {});
    }
  });

  await page.goto('/login');

  // ページが完全にロードされるまで待機
  await page.waitForLoadState('networkidle');

  console.log('[Test] Filling email field...');
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(TEST_USER.email);

  console.log('[Test] Filling password field...');
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(TEST_USER.password);

  console.log('[Test] Clicking login button...');
  const loginButton = page.locator('button[type="submit"]');
  await loginButton.waitFor({ state: 'visible', timeout: 5000 });
  await loginButton.click();

  console.log('[Test] Waiting for navigation to /tasks...');

  // ログインAPIの応答を待機（少し待つ）
  await page.waitForTimeout(1000);

  // localStorageの状態を確認
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const userStr = await page.evaluate(() => localStorage.getItem('user'));
  console.log('[Test] localStorage auth_token:', token ? 'EXISTS' : 'NOT FOUND');
  console.log('[Test] localStorage user:', userStr ? 'EXISTS' : 'NOT FOUND');

  // 課題一覧ページに直接遷移（AuthContextのuseEffectでlocalStorageから読み込まれる）
  await page.goto('/tasks');

  //  await page.waitForLoadState('networkidle');

  // 課題一覧ページの主要要素が表示されるまで待機（認証状態が確立されたことを確認）
  await page.locator('h1:has-text("課題一覧")').waitFor({ state: 'visible', timeout: 10000 });

  console.log('[Test] Login successful!');
}

/**
 * ログアウト処理を実行（存在する場合）
 */
export async function logout(page: Page) {
  // MainLayoutにログアウトボタンがあれば実行
  const logoutButton = page.locator('button:has-text("ログアウト")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/login');
  }
}
