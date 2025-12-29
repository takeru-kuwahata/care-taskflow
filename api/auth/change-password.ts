import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findUserByEmail, updateUserPassword } from './auth.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 認証トークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証が必要です' });
    }

    const token = authHeader.substring(7);
    let payload: JWTPayload;

    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return res.status(401).json({ message: '認証トークンが無効です' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '現在のパスワードと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: '新しいパスワードは8文字以上で入力してください' });
    }

    // ユーザー情報を取得
    const user = await findUserByEmail(payload.email);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    // 現在のパスワードを検証
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: '現在のパスワードが正しくありません' });
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await updateUserPassword(user.id, hashedPassword);

    return res.status(200).json({ message: 'パスワードを変更しました' });
  } catch (error) {
    console.error('[Change Password] Error:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
}
