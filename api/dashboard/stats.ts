import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendError } from '../utils/response.js';
import * as repository from '../tasks/tasks.repository.js';
import type { DashboardStatsResponse } from '../types/index.js';
import { TASK_STATUSES } from '../types/index.js';

/**
 * GET /api/dashboard/stats - ダッシュボード統計取得
 */

async function handleGetDashboardStats(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  try {
    // 並列で各統計を取得
    const [categoryStats, statusStats, overdueCount, recentTasks, total] = await Promise.all([
      repository.getCategoryStats(),
      repository.getStatusStats(),
      repository.getOverdueCount(),
      repository.getRecentTasks(5),
      repository.countTasks(),
    ]);

    // ステータス統計から進行中の件数を取得
    const inProgressCount = statusStats.find(s => s.status === TASK_STATUSES.IN_PROGRESS)?.count || 0;
    const completedCount = statusStats.find(s => s.status === TASK_STATUSES.COMPLETED)?.count || 0;

    // 完了率を計算
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const response: DashboardStatsResponse = {
      summary: {
        totalTasks: total,
        completionRate,
        inProgressCount,
        overdueCount,
      },
      categoryStats,
      statusStats,
      recentTasks,
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    sendError(res, 'ダッシュボード統計取得中にエラーが発生しました');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORSヘッダー設定
  setCorsHeaders(res);

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 認証が必要なハンドラー
  return requireAuth(async (authReq: AuthenticatedRequest, authRes: VercelResponse) => {
    if (authReq.method === 'GET') {
      await handleGetDashboardStats(authReq, authRes);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
