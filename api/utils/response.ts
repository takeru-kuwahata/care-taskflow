import type { VercelResponse } from '@vercel/node';

/**
 * レスポンスヘルパーユーティリティ
 */

/**
 * 成功レスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param data - レスポンスデータ
 * @param statusCode - HTTPステータスコード（デフォルト: 200）
 */
export function sendSuccess<T>(
  res: VercelResponse,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json(data);
}

/**
 * エラーレスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param message - エラーメッセージ
 * @param statusCode - HTTPステータスコード（デフォルト: 500）
 */
export function sendError(
  res: VercelResponse,
  message: string,
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    error: message,
  });
}

/**
 * バリデーションエラーレスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param message - エラーメッセージ
 */
export function sendValidationError(res: VercelResponse, message: string): void {
  sendError(res, message, 400);
}

/**
 * 認証エラーレスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param message - エラーメッセージ（デフォルト: '認証が必要です'）
 */
export function sendUnauthorized(
  res: VercelResponse,
  message: string = '認証が必要です'
): void {
  sendError(res, message, 401);
}

/**
 * 404エラーレスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param message - エラーメッセージ（デフォルト: 'リソースが見つかりません'）
 */
export function sendNotFound(
  res: VercelResponse,
  message: string = 'リソースが見つかりません'
): void {
  sendError(res, message, 404);
}

/**
 * 競合エラーレスポンスを返す
 * @param res - Vercel Response オブジェクト
 * @param message - エラーメッセージ
 */
export function sendConflict(res: VercelResponse, message: string): void {
  sendError(res, message, 409);
}

/**
 * No Contentレスポンスを返す
 * @param res - Vercel Response オブジェクト
 */
export function sendNoContent(res: VercelResponse): void {
  res.status(204).end();
}

/**
 * CORSヘッダーを設定
 * @param res - Vercel Response オブジェクト
 * @param origin - 許可するオリジン（デフォルト: 環境変数CORS_ORIGIN）
 */
export function setCorsHeaders(
  res: VercelResponse,
  origin?: string
): void {
  const allowedOrigin = origin || process.env.CORS_ORIGIN || 'http://localhost:3247';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
