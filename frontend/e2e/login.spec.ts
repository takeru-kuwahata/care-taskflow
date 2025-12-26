/**
 * ログインページE2Eテスト
 * Phase 9: E2Eテスト（AUTH-001）
 */

import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth.setup';

test.describe('ログインページ（AUTH-001）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('ページタイトルと基本要素が表示される', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('h1')).toContainText('ログイン');

    // サブタイトル確認
    await expect(page.locator('text=医療的ケア児支援課題管理システム')).toBeVisible();

    // フォーム要素確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 新規登録リンク確認
    await expect(page.locator('a[href="/signup"]')).toContainText('新規登録');
  });

  test('正しい認証情報でログインできる', async ({ page }) => {
    // フォーム入力
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // ローディング状態確認
    await expect(page.locator('button[type="submit"]')).toContainText('ログイン中...');

    // localStorageにトークンが保存されるまで待機
    await page.waitForFunction(() => localStorage.getItem('auth_token') !== null, { timeout: 10000 });

    // 課題一覧ページへ遷移
    await page.goto('/tasks');

    // 課題一覧ページの主要要素が表示されるまで待機
    await page.locator('h1:has-text("課題一覧")').waitFor({ state: 'visible', timeout: 10000 });

    // 課題一覧ページにいることを確認
    await expect(page).toHaveURL('/tasks');
  });

  test('空のフォームで送信できない', async ({ page }) => {
    // 送信ボタンクリック（バリデーション発動）
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認（ログインページに留まる）
    await expect(page).toHaveURL('/login');
  });

  test('メールアドレスのみ入力して送信できない', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認
    await expect(page).toHaveURL('/login');
  });

  test('パスワードのみ入力して送信できない', async ({ page }) => {
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // URLが変わらないことを確認
    await expect(page).toHaveURL('/login');
  });

  test('新規登録リンクからサインアップページに遷移できる', async ({ page }) => {
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL('/signup');
  });

  test('不正な認証情報でエラーメッセージが表示される', async ({ page }) => {
    // 不正な認証情報を入力
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認（タイムアウト延長）
    const errorMessage = page.locator('.bg-red-50');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
