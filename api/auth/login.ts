import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loginUser } from './auth.service.js';
import { sendSuccess, sendValidationError } from '../utils/response.js';
import { withCors } from '../middleware/cors.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import type { LoginCredentials } from '../types/index.js';

/**
 * POST /api/auth/login
 * ユーザーログインエンドポイント
 */

async function loginHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // デバッグ：リクエストボディをログ出力
  console.log('[DEBUG] Login request body:', JSON.stringify(req.body, null, 2));

  // リクエストボディのバリデーション
  const body = req.body as unknown;

  if (typeof body !== 'object' || body === null) {
    sendValidationError(res, '無効なリクエストボディです');
    return;
  }

  const data = body as Partial<LoginCredentials>;

  if (!data.email || !data.password) {
    sendValidationError(res, 'メールアドレスとパスワードは必須です');
    return;
  }

  // ログイン処理
  const credentials: LoginCredentials = {
    email: data.email,
    password: data.password,
  };

  const authResponse = await loginUser(credentials);

  // 成功レスポンス（200 OK）
  sendSuccess(res, authResponse, 200);
}

// CORS、エラーハンドリングを適用
export default withCors(withErrorHandler(loginHandler));
