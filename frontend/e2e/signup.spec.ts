/**
 * サインアップページE2Eテスト
 * Phase 9: E2Eテスト（AUTH-002）
 */

import { test, expect } from '@playwright/test';

test.describe('サインアップページ（AUTH-002）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('ページタイトルと基本要素が表示される', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('h1')).toContainText('新規登録');

    // サブタイトル確認
    await expect(page.locator('text=医療的ケア児支援課題管理システム')).toBeVisible();

    // フォーム要素確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // ログインリンク確認
    await expect(page.locator('a[href="/login"]')).toContainText('ログイン');
  });

  test('空のフォームで送信できない', async ({ page }) => {
    // 送信ボタンクリック（バリデーション発動）
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認（サインアップページに留まる）
    await expect(page).toHaveURL('/signup');
  });

  test('メールアドレスのみ入力して送信できない', async ({ page }) => {
    await page.fill('input[type="email"]', 'newuser@care-taskflow.local');
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認
    await expect(page).toHaveURL('/signup');
  });

  test('パスワードのみ入力して送信できない', async ({ page }) => {
    await page.fill('input[type="password"]', 'NewPass2025!');
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認
    await expect(page).toHaveURL('/signup');
  });

  test('ログインリンクからログインページに遷移できる', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('正しい情報で新規登録できる', async ({ page }) => {
    // ユニークなメールアドレス生成
    const timestamp = Date.now();
    const email = `test-${timestamp}@care-taskflow.local`;
    const password = 'TestPass2025!';

    // フォーム入力
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // 登録ボタンクリック
    await page.click('button[type="submit"]');

    // ローディング状態確認
    await expect(page.locator('button[type="submit"]')).toContainText('登録中...');

    // 登録成功後、課題一覧ページまたはログインページに遷移することを確認
    await page.waitForURL(/\/(tasks|login)/, { timeout: 10000 });
  });

  test('無効なメールアドレス形式でエラーが表示される', async ({ page }) => {
    // 無効なメールアドレスを入力
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'TestPass2025!');

    // 登録ボタンクリック
    await page.click('button[type="submit"]');

    // HTML5バリデーションが発動してURLが変わらないことを確認
    await expect(page).toHaveURL('/signup');
  });
});
