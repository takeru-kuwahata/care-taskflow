import bcrypt from 'bcryptjs';

/**
 * パスワードハッシュ化ユーティリティ
 */

const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 * @param password - プレーンテキストパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードの照合
 * @param password - プレーンテキストパスワード
 * @param hashedPassword - ハッシュ化されたパスワード
 * @returns 一致する場合はtrue
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * パスワードバリデーション
 * @param password - 検証するパスワード
 * @returns バリデーション結果
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'パスワードは8文字以上である必要があります',
    };
  }

  return { valid: true };
}
