import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { User } from '../types/index.js';

/**
 * 認証リポジトリ層
 * データベースとのやり取りを担当
 */

/**
 * ユーザーをメールアドレスで検索
 * @param email - メールアドレス
 * @returns ユーザー情報、存在しない場合はnull
 */
export async function findUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

/**
 * ユーザーをIDで検索
 * @param userId - ユーザーID
 * @returns ユーザー情報、存在しない場合はnull
 */
export async function findUserById(userId: string): Promise<User | null> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  return {
    id: result[0].id,
    email: result[0].email,
    createdAt: result[0].createdAt.toISOString(),
    updatedAt: result[0].updatedAt.toISOString(),
  };
}

/**
 * 新規ユーザーを作成
 * @param email - メールアドレス
 * @param passwordHash - ハッシュ化されたパスワード
 * @returns 作成されたユーザー情報
 */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const result = await db
    .insert(users)
    .values({
      id: userId,
      email,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return {
    id: result[0].id,
    email: result[0].email,
    createdAt: result[0].createdAt.toISOString(),
    updatedAt: result[0].updatedAt.toISOString(),
  };
}

/**
 * ユーザーのパスワードを更新
 * @param userId - ユーザーID
 * @param newPasswordHash - 新しいハッシュ化されたパスワード
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
): Promise<void> {
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
