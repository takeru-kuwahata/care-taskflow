import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';
import { sendUnauthorized } from '../utils/response.js';

/**
 * 認証ミドルウェア
 * リクエストに含まれるJWTトークンを検証し、ユーザー情報をリクエストに追加
 */

/**
 * 拡張されたリクエスト型（ユーザー情報を含む）
 */
export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * 認証ミドルウェア型
 */
export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<boolean>;

/**
 * JWT トークンを検証し、リクエストにユーザー情報を追加
 * @param req - Vercel Request オブジェクト
 * @param res - Vercel Response オブジェクト
 * @returns 認証成功時はtrue、失敗時はfalse
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<boolean> {
  const authHeader = req.headers.authorization;

  // 詳細なログ出力（デバッグ用）
  console.log('[Auth] Authentication attempt', {
    path: req.url,
    method: req.method,
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader?.substring(0, 20) || 'none',
  });

  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    console.warn('[Auth] No token found in request', {
      path: req.url,
      authHeader: authHeader?.substring(0, 50) || 'none',
    });
    sendUnauthorized(res, '認証トークンが必要です');
    return false;
  }

  const payload = verifyToken(token);

  if (!payload) {
    console.warn('[Auth] Invalid token', {
      path: req.url,
      tokenPrefix: token.substring(0, 20),
    });
    sendUnauthorized(res, '無効な認証トークンです');
    return false;
  }

  // リクエストにユーザー情報を追加
  req.user = {
    userId: payload.userId,
    email: payload.email,
  };

  console.log('[Auth] Authentication successful', {
    path: req.url,
    userId: payload.userId,
    email: payload.email,
  });

  return true;
}

/**
 * 認証が必要なハンドラーをラップ
 * @param handler - 認証後に実行するハンドラー
 * @returns ミドルウェアでラップされたハンドラー
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const isAuthenticated = await authenticate(authReq, res);

    if (!isAuthenticated) {
      return;
    }

    await handler(authReq, res);
  };
}
