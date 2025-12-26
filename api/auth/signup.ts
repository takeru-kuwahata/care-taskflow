import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signupUser } from './auth.service.js';
import { sendSuccess, sendValidationError } from '../utils/response.js';
import { withCors } from '../middleware/cors.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import type { SignupData } from '../types/index.js';

/**
 * POST /api/auth/signup
 * 新規ユーザー登録エンドポイント
 */

async function signupHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // リクエストボディのバリデーション
  const body = req.body as unknown;

  if (typeof body !== 'object' || body === null) {
    sendValidationError(res, '無効なリクエストボディです');
    return;
  }

  const data = body as Partial<SignupData>;

  if (!data.email || !data.password) {
    sendValidationError(res, 'メールアドレスとパスワードは必須です');
    return;
  }

  // サインアップ処理
  const signupData: SignupData = {
    email: data.email,
    password: data.password,
  };

  const authResponse = await signupUser(signupData);

  // 成功レスポンス（201 Created）
  sendSuccess(res, authResponse, 201);
}

// CORS、エラーハンドリングを適用
export default withCors(withErrorHandler(signupHandler));
