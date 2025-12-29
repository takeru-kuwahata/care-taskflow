import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendValidationError, sendError } from '../utils/response.js';
import {
  validateTaskCreateRequest,
  validateTaskQueryParams,
} from '../utils/tasks.validator.js';
import * as taskService from './tasks.service.js';
import type { TaskCreateRequest, TaskFilter, TaskSort } from '../types/index.js';
import { isTaskCategory, isTaskStatus } from '../types/index.js';

/**
 * GET /api/tasks - 課題一覧取得
 * POST /api/tasks - 課題作成
 */

async function handleGetTasks(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  try {
    // クエリパラメータの検証
    const validationResult = validateTaskQueryParams(req.query);
    if (!validationResult.valid) {
      sendValidationError(res, validationResult.message!);
      return;
    }

    // フィルター・ソート・ページネーション条件を構築
    const filter: TaskFilter = {};
    const sort: TaskSort = {};
    const pagination: { limit?: number; offset?: number } = {};

    const categoryParam = req.query.category;
    const statusParam = req.query.status;
    const assigneeParam = req.query.assignee;
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;

    if (categoryParam && typeof categoryParam === 'string' && isTaskCategory(categoryParam)) {
      filter.category = categoryParam;
    }
    if (statusParam && typeof statusParam === 'string' && isTaskStatus(statusParam)) {
      filter.status = statusParam;
    }
    if (assigneeParam && typeof assigneeParam === 'string') {
      filter.assignee = assigneeParam;
    }

    if (req.query.sortBy) sort.sortBy = req.query.sortBy as 'taskNumber' | 'deadline' | 'status' | 'category';
    if (req.query.sortOrder) sort.sortOrder = req.query.sortOrder as 'asc' | 'desc';

    // ページネーション（デフォルト: limit=20）
    if (limitParam && typeof limitParam === 'string') {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0 && limit <= 1000) {
        pagination.limit = limit;
      }
    } else {
      pagination.limit = 20; // デフォルト
    }

    if (offsetParam && typeof offsetParam === 'string') {
      const offset = parseInt(offsetParam, 10);
      if (!isNaN(offset) && offset >= 0) {
        pagination.offset = offset;
      }
    }

    // 課題一覧を取得
    const taskListResponse = await taskService.getTaskList(filter, sort, pagination);

    sendSuccess(res, taskListResponse);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    sendError(res, '課題一覧取得中にエラーが発生しました');
  }
}

async function handlePostTask(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  try {
    // リクエストボディの検証
    const validationResult = validateTaskCreateRequest(req.body);
    if (!validationResult.valid) {
      sendValidationError(res, validationResult.message!);
      return;
    }

    const userId = req.user!.userId;
    const data = req.body as TaskCreateRequest;

    // 課題を作成
    const task = await taskService.createTaskWithRelations(userId, data);

    sendSuccess(res, { task }, 201);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    sendError(res, '課題作成中にエラーが発生しました');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORSヘッダー設定（リクエストOriginを渡す）
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
      await handleGetTasks(authReq, authRes);
    } else if (authReq.method === 'POST') {
      await handlePostTask(authReq, authRes);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
