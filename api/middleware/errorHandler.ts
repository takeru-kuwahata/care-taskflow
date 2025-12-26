import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from '../utils/response.js';

/**
 * エラーハンドリングミドルウェア
 */

/**
 * グローバルエラーハンドラー
 * @param error - エラーオブジェクト
 * @param req - Vercel Request オブジェクト
 * @param res - Vercel Response オブジェクト
 */
export function handleError(
  error: unknown,
  _req: VercelRequest,
  res: VercelResponse
): void {
  // エラー詳細をログ出力（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // エラーメッセージの抽出
  let message = 'サーバーエラーが発生しました';
  let statusCode = 500;

  if (error instanceof Error) {
    message = error.message;

    // カスタムエラークラスがある場合の処理
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      statusCode = error.statusCode;
    }
  }

  sendError(res, message, statusCode);
}

/**
 * 非同期ハンドラーをエラーハンドリングでラップ
 * @param handler - 非同期ハンドラー
 * @returns エラーハンドリングでラップされたハンドラー
 */
export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

/**
 * カスタムエラークラス
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * バリデーションエラークラス
 */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * 認証エラークラス
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = '認証が必要です') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Not Foundエラークラス
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'リソースが見つかりません') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 競合エラークラス
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
