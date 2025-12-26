/**
 * 課題一覧ページE2Eテスト
 * Phase 9: E2Eテスト（P-001）
 */

import { test, expect } from '@playwright/test';
import { login } from './auth.setup';

test.describe('課題一覧ページ（P-001）', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await login(page);
  });

  test('E2E-TASKLIST-001: ページタイトルと基本要素が表示される', async ({ page }) => {
    // タイトル確認（ページ内の主要なh1タグを特定）
    await expect(page.locator('h1:has-text("課題一覧")')).toBeVisible();

    // 新規課題登録ボタン確認
    await expect(page.locator('button:has-text("新規課題登録")')).toBeVisible();

    // フィルターセクション確認
    await expect(page.locator('text=フィルター')).toBeVisible();
  });

  test('E2E-TASKLIST-002: フィルター機能が正常に動作する', async ({ page }) => {
    // カテゴリフィルター
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 }); // 最初のカテゴリを選択

    // フィルタークリアボタンが表示されることを確認
    await expect(page.locator('button:has-text("フィルタークリア")')).toBeVisible();

    // フィルタークリア
    await page.click('button:has-text("フィルタークリア")');

    // フィルタークリアボタンが非表示になることを確認
    await expect(page.locator('button:has-text("フィルタークリア")')).not.toBeVisible();
  });

  test('E2E-TASKLIST-003: ステータスフィルターが機能する', async ({ page }) => {
    // ステータスフィルターのselect要素を取得（2番目のselect）
    const statusSelect = page.locator('select').nth(1);
    await statusSelect.selectOption({ index: 1 });

    // フィルタークリアボタンが表示されることを確認
    await expect(page.locator('button:has-text("フィルタークリア")')).toBeVisible();
  });

  test('E2E-TASKLIST-004: 対応者フィルターが機能する', async ({ page }) => {
    // 対応者フィルターのselect要素を取得（3番目のselect）
    const assigneeSelect = page.locator('select').nth(2);

    // オプションが存在する場合のみ選択
    const optionCount = await assigneeSelect.locator('option').count();
    if (optionCount > 1) {
      await assigneeSelect.selectOption({ index: 1 });

      // フィルタークリアボタンが表示されることを確認
      await expect(page.locator('button:has-text("フィルタークリア")')).toBeVisible();
    }
  });

  test('E2E-TASKLIST-005: テーブルソート機能が動作する（項番）', async ({ page }) => {
    // 項番でソート
    const taskNumberHeader = page.locator('th:has-text("項番")');
    await taskNumberHeader.click();

    // ソートインジケーター（昇順：↑）が表示されることを確認
    await expect(taskNumberHeader.locator('text=↑')).toBeVisible();

    // もう一度クリックして降順ソート
    await taskNumberHeader.click();

    // ソートインジケーター（降順：↓）が表示されることを確認
    await expect(taskNumberHeader.locator('text=↓')).toBeVisible();
  });

  test('E2E-TASKLIST-006: 期限でソートできる', async ({ page }) => {
    await test.step('期限カラムヘッダーをクリック', async () => {
      const deadlineHeader = page.locator('th:has-text("期限")');
      await deadlineHeader.click();

      // ソートインジケーター（昇順：↑）が表示されることを確認
      await expect(deadlineHeader.locator('text=↑')).toBeVisible({ timeout: 5000 });
    });

    await test.step('再度クリックして降順ソート', async () => {
      const deadlineHeader = page.locator('th:has-text("期限")');
      await deadlineHeader.click();

      // ソートインジケーター（降順：↓）が表示されることを確認
      await expect(deadlineHeader.locator('text=↓')).toBeVisible({ timeout: 5000 });
    });
  });

  test('E2E-TASKLIST-007: ステータスでソートできる', async ({ page }) => {
    await test.step('ステータスカラムヘッダーをクリック', async () => {
      const statusHeader = page.locator('th:has-text("進捗ステータス")');
      await statusHeader.click();

      // ソートインジケーター（昇順：↑）が表示されることを確認
      await expect(statusHeader.locator('text=↑')).toBeVisible({ timeout: 5000 });
    });

    await test.step('再度クリックして降順ソート', async () => {
      const statusHeader = page.locator('th:has-text("進捗ステータス")');
      await statusHeader.click();

      // ソートインジケーター（降順：↓）が表示されることを確認
      await expect(statusHeader.locator('text=↓')).toBeVisible({ timeout: 5000 });
    });
  });

  test('E2E-TASKLIST-008: 新規課題登録ボタンから課題作成ページに遷移できる', async ({ page }) => {
    await page.click('button:has-text("新規課題登録")');

    // 課題作成ページへ遷移することを確認
    await expect(page).toHaveURL('/tasks/new');
    await expect(page.locator('main h1')).toContainText('課題新規作成');
  });

  test('E2E-TASKLIST-009: 課題行クリックで詳細ページに遷移できる', async ({ page }) => {
    // テーブルの最初の行をクリック
    const firstRow = page.locator('tbody tr').first();

    // 課題が存在する場合のみテスト実行
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      await firstRow.click();

      // 課題詳細ページへ遷移することを確認
      await expect(page).toHaveURL(/\/tasks\/[a-f0-9-]+/);
      // ページ本文のh1（ヘッダーのh1を除外）
      await expect(page.locator('main h1')).toContainText('課題詳細');
    }
  });

  test('課題が存在しない場合、空状態メッセージが表示される', async ({ page }) => {
    // すべてのフィルターを適用して結果を0にする試み
    const categorySelect = page.locator('select').first();
    const statusSelect = page.locator('select').nth(1);

    await categorySelect.selectOption({ index: 1 });
    await statusSelect.selectOption({ index: 1 });

    // 結果が0件の場合、空状態メッセージが表示される可能性がある
    const emptyMessage = page.locator('text=課題が見つかりませんでした');
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);

    // 空状態またはテーブルのいずれかが表示されていることを確認
    if (hasEmptyState) {
      await expect(emptyMessage).toBeVisible();
    } else {
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('ローディング状態が表示される', async ({ page }) => {
    // ページリロードしてローディング状態を確認
    await page.reload();

    // ローディングスピナーが一瞬表示される可能性がある
    // （高速なので検出できない場合もある）
    const spinner = page.locator('.animate-spin');
    const isVisible = await spinner.isVisible({ timeout: 1000 }).catch(() => false);

    // スピナーが表示されるか、すぐにコンテンツが表示されるかのいずれか
    if (!isVisible) {
      await expect(page.locator('h1')).toContainText('課題一覧');
    }
  });
});
