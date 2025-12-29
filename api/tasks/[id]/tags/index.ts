import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendValidationError, sendError } from '../../../utils/response.js';
import * as tagsService from '../../../tags/tags.service.js';

/**
 * POST /api/tasks/:id/tags
 * 課題にタグを追加
 *
 * Request Body:
 *   - name: タグ名（新規作成または既存タグを使用）
 *
 * Phase 12: タグクラウド機能
 */

async function handlePostTaskTag(req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    const { name } = req.body;

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim() === '') {
      sendValidationError(res, 'タグ名を入力してください');
      return;
    }

    // タグを追加
    const tag = await tagsService.addTagToTask(taskId, name);

    sendSuccess(res, { tag }, 201);
  } catch (error) {
    console.error('POST /api/tasks/:id/tags error:', error);
    sendError(res, 'タグ追加中にエラーが発生しました');
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

  // 課題IDを取得
  const taskId = req.query.id as string;

  if (!taskId) {
    sendError(res, '課題IDが指定されていません', 400);
    return;
  }

  // 認証が必要なハンドラー
  return requireAuth(async (authReq: AuthenticatedRequest, authRes: VercelResponse) => {
    if (authReq.method === 'POST') {
      await handlePostTaskTag(authReq, authRes, taskId);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
