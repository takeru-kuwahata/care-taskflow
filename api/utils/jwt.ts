import jwt from 'jsonwebtoken';

/**
 * JWT トークンユーティリティ
 */

// JWT シークレット（環境変数から取得）
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// トークン有効期限（24時間）
const TOKEN_EXPIRY = '24h';

/**
 * JWT ペイロード型
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * JWT トークンを生成
 * @param payload - トークンに含めるペイロード
 * @returns JWT トークン
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * JWT トークンを検証
 * @param token - 検証するトークン
 * @returns デコードされたペイロード、無効な場合はnull
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Authorization ヘッダーからトークンを抽出
 * @param authHeader - Authorization ヘッダーの値
 * @returns トークン、存在しない場合はnull
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
