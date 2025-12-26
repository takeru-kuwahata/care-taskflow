import type { VercelResponse } from '@vercel/node';
import { sendNoContent } from '../utils/response.js';
import { withCors } from '../middleware/cors.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * POST /api/auth/logout
 * ユーザーログアウトエンドポイント
 *
 * 注: JWTトークンはステートレスのため、サーバー側での無効化は行わない。
 * クライアント側でトークンを削除することでログアウトを実現する。
 * このエンドポイントは主にログアウトイベントの記録や監査用途で使用可能。
 */

async function logoutHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // ログアウト処理（現時点ではログ記録のみ）
  // 将来的にはログアウトイベントをデータベースに記録したり、
  // リフレッシュトークンを無効化する処理を追加可能

  // 成功レスポンス（204 No Content）
  sendNoContent(res);
}

// 認証、CORS、エラーハンドリングを適用
export default withCors(withErrorHandler(requireAuth(logoutHandler)));
