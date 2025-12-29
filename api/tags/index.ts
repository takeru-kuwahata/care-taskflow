import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js';
import * as tagsService from './tags.service.js';

/**
 * GET /api/tags
 * 全タグを取得
 *
 * Query Parameters:
 *   - q: 検索クエリ（オプション）
 *
 * Phase 12: タグクラウド機能
 */

async function handleGetTags(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  try {
    // クエリパラメータ取得
    const query = req.query.q as string | undefined;

    // タグ取得
    const tags = query
      ? await tagsService.searchTags(query)
      : await tagsService.getAllTags();

    sendSuccess(res, { tags });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    sendError(res, 'タグ一覧取得中にエラーが発生しました');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORSヘッダー設定
  const requestOrigin = req.headers.origin as string | undefined;
  setCorsHeaders(res, requestOrigin);

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 認証が必要なハンドラー
  return requireAuth(async (authReq: AuthenticatedRequest, authRes: VercelResponse) => {
    if (authReq.method === 'GET') {
      await handleGetTags(authReq, authRes);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
