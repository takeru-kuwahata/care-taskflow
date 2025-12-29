import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendValidationError, sendError } from '../../../utils/response.js';
import * as commentsService from '../../../comments/comments.service.js';

/**
 * GET /api/tasks/:id/comments - 課題のコメント一覧を取得
 * POST /api/tasks/:id/comments - 課題にコメントを追加
 *
 * Phase 12: コメント機能
 */

async function handleGetTaskComments(_req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    const comments = await commentsService.getTaskComments(taskId);
    sendSuccess(res, { comments });
  } catch (error) {
    console.error('GET /api/tasks/:id/comments error:', error);
    sendError(res, 'コメント一覧取得中にエラーが発生しました');
  }
}

async function handlePostTaskComment(req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    const { content } = req.body;

    // バリデーション
    if (!content || typeof content !== 'string' || content.trim() === '') {
      sendValidationError(res, 'コメント内容を入力してください');
      return;
    }

    // コメントを作成
    const comment = await commentsService.createComment(taskId, req.user!.userId, content);

    sendSuccess(res, { comment }, 201);
  } catch (error: any) {
    console.error('POST /api/tasks/:id/comments error:', error);
    if (error.message && error.message.includes('コメント')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'コメント投稿中にエラーが発生しました');
    }
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
    if (authReq.method === 'GET') {
      await handleGetTaskComments(authReq, authRes, taskId);
    } else if (authReq.method === 'POST') {
      await handlePostTaskComment(authReq, authRes, taskId);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
