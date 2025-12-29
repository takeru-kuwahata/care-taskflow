import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js';
import * as tasksRepository from '../tasks/tasks.repository.js';
import type { MatrixResponse, ImportanceLevel, UrgencyLevel, MatrixCell } from '../types/index.js';

/**
 * GET /api/dashboard/matrix
 * 重要度×緊急度マトリクスデータを取得
 *
 * Phase 12: 重要度×緊急度マトリクス機能
 */

async function handleGetMatrix(_req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  try {
    const data = await tasksRepository.getMatrixData();

    // MatrixCell[]型に変換
    const matrix: MatrixCell[] = data.matrix.map(m => ({
      importance: m.importance as ImportanceLevel,
      urgency: m.urgency as UrgencyLevel,
      count: m.count,
    }));

    const response: MatrixResponse = {
      matrix,
      unsetCount: data.unsetCount,
      totalTasks: data.totalTasks,
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('GET /api/dashboard/matrix error:', error);
    sendError(res, 'マトリクスデータ取得中にエラーが発生しました');
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
      await handleGetMatrix(authReq, authRes);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
