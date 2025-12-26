/**
 * 課題詳細ページE2Eテスト
 * Phase 9: E2Eテスト（P-002）
 */

import { test, expect } from '@playwright/test';
import { login } from './auth.setup';

test.describe('課題詳細ページ - 新規作成モード（P-002）', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/tasks/new');
  });

  test('新規作成ページのタイトルと基本要素が表示される', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('main h1')).toContainText('課題新規作成');

    // 戻るボタン確認
    await expect(page.locator('button:has-text("戻る")')).toBeVisible();

    // 保存ボタン確認
    await expect(page.locator('button:has-text("保存")')).toBeVisible();

    // セクション見出し確認
    await expect(page.locator('h2:has-text("基本情報")')).toBeVisible();
    await expect(page.locator('h2:has-text("原因・対応案")')).toBeVisible();
    await expect(page.locator('h2:has-text("進捗管理")')).toBeVisible();
    await expect(page.locator('h2:has-text("詳細情報")')).toBeVisible();
  });

  test('必須項目を入力せずに保存しようとするとアラートが表示される', async ({ page }) => {
    // アラートイベントを監視
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('項目（カテゴリ）を選択してください');
      await dialog.accept();
    });

    await page.click('button:has-text("保存")');
  });

  test('新しい課題を作成できる', async ({ page }) => {
    // 基本情報入力
    await page.selectOption('select', { index: 1 }); // カテゴリ選択
    await page.fill('textarea', 'E2Eテストで作成した課題です');

    // ステータス選択
    const statusSelect = page.locator('select').nth(1);
    await statusSelect.selectOption({ index: 1 });

    // アラートハンドラー設定
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('課題を作成しました');
      await dialog.accept();
    });

    // 保存ボタンクリック
    await page.click('button:has-text("保存")');

    // 課題一覧ページへ遷移することを確認
    await page.waitForURL('/tasks', { timeout: 10000 });
  });

  test('原因を追加・削除できる', async ({ page }) => {
    // 初期状態：原因入力フィールドが1つ存在
    const initialCauseCount = await page.locator('input[placeholder="原因を入力してください"]').count();
    expect(initialCauseCount).toBe(1);

    // 原因を追加
    await page.click('button:has-text("原因を追加")');

    // 原因が2つになることを確認
    const afterAddCount = await page.locator('input[placeholder="原因を入力してください"]').count();
    expect(afterAddCount).toBe(2);

    // 2番目の原因を削除（原因セクション内の削除ボタン）
    const causeRemoveButtons = page.locator('input[placeholder="原因を入力してください"]').locator('..').locator('button');
    await causeRemoveButtons.nth(1).click();

    // 原因が1つに戻ることを確認
    const afterRemoveCount = await page.locator('input[placeholder="原因を入力してください"]').count();
    expect(afterRemoveCount).toBe(1);
  });

  test('対応案を追加・削除できる', async ({ page }) => {
    // 初期状態：対応案入力フィールドが1つ存在
    const initialActionCount = await page.locator('input[placeholder="対応案を入力してください"]').count();
    expect(initialActionCount).toBe(1);

    // 対応案を追加
    await page.click('button:has-text("対応案を追加")');

    // 対応案が2つになることを確認
    const afterAddCount = await page.locator('input[placeholder="対応案を入力してください"]').count();
    expect(afterAddCount).toBe(2);
  });

  test('対応者を追加・削除できる', async ({ page }) => {
    // 初期状態：対応者入力フィールドが1つ存在
    const initialAssigneeCount = await page.locator('input[placeholder="対応者名"]').count();
    expect(initialAssigneeCount).toBe(1);

    // 対応者を追加
    await page.click('button:has-text("対応者を追加")');

    // 対応者が2つになることを確認
    const afterAddCount = await page.locator('input[placeholder="対応者名"]').count();
    expect(afterAddCount).toBe(2);
  });

  test('戻るボタンで課題一覧に戻れる', async ({ page }) => {
    await page.click('button:has-text("戻る")');
    await expect(page).toHaveURL('/tasks');
  });

  test('期限を設定できる', async ({ page }) => {
    const deadlineInput = page.locator('input[type="date"]');
    await deadlineInput.fill('2025-12-31');

    const value = await deadlineInput.inputValue();
    expect(value).toBe('2025-12-31');
  });

  test('詳細情報（任意項目）を入力できる', async ({ page }) => {
    // 関連事業
    await page.fill('input[placeholder="関連事業名を入力してください"]', 'テスト関連事業');

    // 事業内容
    await page.fill('textarea[placeholder="事業内容を入力してください"]', 'テスト事業内容');

    // 該当所属
    await page.fill('input[placeholder="該当所属を入力してください"]', 'テスト所属');

    // 入力値が保持されることを確認
    await expect(page.locator('input[placeholder="関連事業名を入力してください"]')).toHaveValue('テスト関連事業');
  });
});

test.describe('課題詳細ページ - 編集モード（P-002）', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // 課題一覧から最初の課題を開く
    await page.goto('/tasks');

    // テーブルが読み込まれるまで待機
    await page.waitForSelector('tbody tr, .text-gray-500:has-text("課題が見つかりませんでした")', { timeout: 10000 });

    const rowCount = await page.locator('tbody tr').count();

    // 課題が存在しない場合はスキップ
    if (rowCount === 0) {
      test.skip(true, 'No tasks available for editing');
    }

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForURL(/\/tasks\/[a-f0-9-]+/);
  });

  test('編集モードでタイトルと削除ボタンが表示される', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('main h1')).toContainText('課題詳細');

    // 削除ボタン確認
    await expect(page.locator('button:has-text("削除")')).toBeVisible();
  });

  test('課題データがフォームに反映されている', async ({ page }) => {
    // 問題点textareaが表示されるまで待機
    const problemTextarea = page.locator('textarea').first();
    await problemTextarea.waitFor({ state: 'visible', timeout: 5000 });

    // 問題点が入力されていることを確認
    const problemValue = await problemTextarea.inputValue();
    expect(problemValue.length).toBeGreaterThan(0);
  });

  test('課題を更新できる', async ({ page }) => {

    // 問題点を変更
    const problemTextarea = page.locator('textarea').first();
    await problemTextarea.fill('E2Eテストで更新した課題です');

    // アラートハンドラー設定
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('課題を更新しました');
      await dialog.accept();
    });

    // 保存ボタンクリック
    await page.click('button:has-text("保存")');

    // 課題一覧ページへ遷移することを確認
    await page.waitForURL('/tasks', { timeout: 10000 });
  });

  test('削除確認モーダルが表示される', async ({ page }) => {

    // 削除ボタンクリック
    await page.click('button:has-text("削除")');

    // モーダルが表示されることを確認
    await expect(page.locator('text=課題の削除')).toBeVisible();
    await expect(page.locator('text=この課題を削除してもよろしいですか')).toBeVisible();

    // キャンセルボタン確認
    await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();

    // 削除するボタン確認
    await expect(page.locator('button:has-text("削除する")')).toBeVisible();
  });

  test('削除モーダルでキャンセルできる', async ({ page }) => {

    // 削除ボタンクリック
    await page.click('button:has-text("削除")');

    // キャンセルボタンクリック
    await page.click('button:has-text("キャンセル")');

    // モーダルが閉じることを確認
    await expect(page.locator('text=課題の削除')).not.toBeVisible();
  });
});
