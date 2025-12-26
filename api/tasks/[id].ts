import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { setCorsHeaders, sendSuccess, sendValidationError, sendError, sendNotFound, sendNoContent } from '../utils/response.js';
import { validateTaskUpdateRequest } from '../utils/tasks.validator.js';
import * as taskService from './tasks.service.js';
import type { TaskUpdateRequest } from '../types/index.js';

/**
 * GET /api/tasks/:id - 課題詳細取得
 * PUT /api/tasks/:id - 課題更新
 * DELETE /api/tasks/:id - 課題削除
 */

async function handleGetTaskById(_req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    const task = await taskService.getTaskDetail(taskId);

    if (!task) {
      sendNotFound(res, 'Task not found');
      return;
    }

    sendSuccess(res, { task });
  } catch (error) {
    console.error('GET /api/tasks/:id error:', error);
    sendError(res, '課題詳細取得中にエラーが発生しました');
  }
}

async function handlePutTask(req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    // リクエストボディの検証
    const validationResult = validateTaskUpdateRequest(req.body);
    if (!validationResult.valid) {
      sendValidationError(res, validationResult.message!);
      return;
    }

    const data = req.body as TaskUpdateRequest;

    // 課題を更新
    const updatedTask = await taskService.updateTaskWithRelations(taskId, data);

    if (!updatedTask) {
      sendNotFound(res, 'Task not found');
      return;
    }

    sendSuccess(res, { task: updatedTask });
  } catch (error) {
    console.error('PUT /api/tasks/:id error:', error);
    sendError(res, '課題更新中にエラーが発生しました');
  }
}

async function handleDeleteTask(_req: AuthenticatedRequest, res: VercelResponse, taskId: string): Promise<void> {
  try {
    const deleted = await taskService.deleteTaskById(taskId);

    if (!deleted) {
      sendNotFound(res, 'Task not found');
      return;
    }

    sendNoContent(res);
  } catch (error) {
    console.error('DELETE /api/tasks/:id error:', error);
    sendError(res, '課題削除中にエラーが発生しました');
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

  // 課題IDを取得
  const taskId = req.query.id as string;

  if (!taskId) {
    sendError(res, '課題IDが指定されていません', 400);
    return;
  }

  // 認証が必要なハンドラー
  return requireAuth(async (authReq: AuthenticatedRequest, authRes: VercelResponse) => {
    if (authReq.method === 'GET') {
      await handleGetTaskById(authReq, authRes, taskId);
    } else if (authReq.method === 'PUT') {
      await handlePutTask(authReq, authRes, taskId);
    } else if (authReq.method === 'DELETE') {
      await handleDeleteTask(authReq, authRes, taskId);
    } else {
      sendError(authRes, 'メソッドが許可されていません', 405);
    }
  })(req, res);
}
