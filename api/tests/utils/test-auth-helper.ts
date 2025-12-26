import type { AuthResponse } from '../../types/index.js';

/**
 * 認証テストヘルパー
 * 認証関連のテストを簡略化
 */

/**
 * ユニークなテストメールアドレスを生成
 * @param prefix - メールアドレスのプレフィックス（デフォルト: 'test-user'）
 * @returns ユニークなメールアドレス
 */
export function generateUniqueEmail(prefix: string = 'test-user'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomStr}@test.local`;
}

/**
 * テスト用パスワードを生成
 * @returns テスト用パスワード
 */
export function generateTestPassword(): string {
  return 'TestPass2025!';
}

/**
 * AuthResponseが有効かチェック
 * @param response - 検証するAuthResponse
 * @returns 有効な場合はtrue
 */
export function isValidAuthResponse(response: unknown): response is AuthResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const authResponse = response as Record<string, unknown>;

  return (
    typeof authResponse.user === 'object' &&
    authResponse.user !== null &&
    typeof (authResponse.user as Record<string, unknown>).id === 'string' &&
    typeof (authResponse.user as Record<string, unknown>).email === 'string' &&
    typeof authResponse.token === 'string'
  );
}

/**
 * Authorizationヘッダーを生成
 * @param token - JWTトークン
 * @returns Authorizationヘッダーの値
 */
export function generateAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
