import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth.js';
import { setCorsHeaders, sendNoContent, sendError } from '../../../utils/response.js';
import * as tagsService from '../../../tags/tags.service.js';

/**
 * DELETE /api/tasks/:id/tags/:tagId
 * 課題からタグを削除
 *
 * Phase 12: タグクラウド機能
 */

async function handleDeleteTaskTag(_req: AuthenticatedRequest, res: VercelResponse, taskId: string, tagId: string): Promise<void> {
  try {
    // タグを削除
    await tagsService.removeTagFromTask(taskId, tagId);

    sendNoContent(res);
  } catch (error) {
    console.error('DELETE /api/tasks/:id/tags/:tagId error:', error);
    sendError(res, 'タグ削除中にエラーが発生しました');
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

  // 課題IDとタグIDを取得
  const taskId = req.query.id as string;
  const tagId = req.query.tagId as string;

  if (!taskId) {
    sendError(res, '課題IDが指定されていません', 400);
    return;
  }

  if (!tagId) {
    sendError(res, 'タグIDが指定されていません', 400);
    return;
  }

  // 認証が必要なハンドラー
  return requireAuth(async (authReq: AuthenticatedRequest, authRes: VercelResponse) => {
    if (authReq.method === 'DELETE') {
      await handleDeleteTaskTag(authReq, authRes, taskId, tagId);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
