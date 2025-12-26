import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * データベーステストヘルパー
 * 統合テストでのデータベース操作を簡略化
 */

/**
 * テスト用ユーザーをクリーンアップ
 * @param email - クリーンアップするユーザーのメールアドレス
 */
export async function cleanupTestUser(email: string): Promise<void> {
  await db.delete(users).where(eq(users.email, email));
}

/**
 * 複数のテスト用ユーザーをクリーンアップ
 * @param emails - クリーンアップするユーザーのメールアドレス配列
 */
export async function cleanupTestUsers(emails: string[]): Promise<void> {
  for (const email of emails) {
    await cleanupTestUser(email);
  }
}

/**
 * すべてのテストユーザーをクリーンアップ
 * テストメールアドレスのパターン（test-*@*.com）にマッチするユーザーを削除
 */
export async function cleanupAllTestUsers(): Promise<void> {
  const testUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, 'test@example.com'));

  for (const user of testUsers) {
    await db.delete(users).where(eq(users.id, user.id));
  }
}

/**
 * ユーザーが存在するか確認
 * @param email - 確認するユーザーのメールアドレス
 * @returns 存在する場合はtrue
 */
export async function userExists(email: string): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0;
}
