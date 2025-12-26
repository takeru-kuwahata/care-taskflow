import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../utils/response.js';

/**
 * CORS ミドルウェア
 */

/**
 * CORS ヘッダーを設定するミドルウェア
 * @param req - Vercel Request オブジェクト
 * @param res - Vercel Response オブジェクト
 * @returns OPTIONSリクエストの場合はtrue（早期リターン）、それ以外はfalse
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  // CORSヘッダーを設定
  setCorsHeaders(res);

  // プリフライトリクエスト（OPTIONS）の処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * CORS対応のハンドラーをラップ
 * @param handler - CORSヘッダーを設定するハンドラー
 * @returns CORSでラップされたハンドラー
 */
export function withCors(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const isOptionsRequest = handleCors(req, res);

    if (isOptionsRequest) {
      return;
    }

    await handler(req, res);
  };
}
