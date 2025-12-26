import type { SignupData, LoginCredentials, AuthResponse } from '../types/index.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../middleware/errorHandler.js';
import { createUser, findUserByEmail, findUserById } from './auth.repository.js';

/**
 * 認証サービス層
 * ビジネスロジックを担当
 */

/**
 * メールアドレスのバリデーション
 * @param email - メールアドレス
 * @returns バリデーション結果
 */
function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email || !email.includes('@')) {
    return {
      valid: false,
      message: '有効なメールアドレスを入力してください',
    };
  }

  return { valid: true };
}

/**
 * サインアップデータのバリデーション
 * @param data - サインアップデータ
 */
function validateSignupData(data: SignupData): void {
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message!);
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message!);
  }
}

/**
 * ログイン認証情報のバリデーション
 * @param credentials - ログイン認証情報
 */
function validateLoginCredentials(credentials: LoginCredentials): void {
  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message!);
  }

  if (!credentials.password) {
    throw new ValidationError('パスワードを入力してください');
  }
}

/**
 * 新規ユーザー登録
 * @param data - サインアップデータ
 * @returns 認証レスポンス（ユーザー情報とトークン）
 */
export async function signupUser(data: SignupData): Promise<AuthResponse> {
  // バリデーション
  validateSignupData(data);

  // メールアドレス重複チェック
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('このメールアドレスは既に登録されています');
  }

  // パスワードをハッシュ化
  const passwordHash = await hashPassword(data.password);

  // ユーザーを作成
  const user = await createUser(data.email, passwordHash);

  // JWTトークンを生成
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user,
    token,
  };
}

/**
 * ユーザーログイン
 * @param credentials - ログイン認証情報
 * @returns 認証レスポンス（ユーザー情報とトークン）
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  // バリデーション
  validateLoginCredentials(credentials);

  // ユーザーを検索
  const userWithPassword = await findUserByEmail(credentials.email);
  if (!userWithPassword) {
    throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません');
  }

  // パスワード照合
  const isPasswordValid = await comparePassword(
    credentials.password,
    userWithPassword.passwordHash
  );

  if (!isPasswordValid) {
    throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません');
  }

  // パスワードハッシュを除外したユーザー情報を取得
  const user = await findUserById(userWithPassword.id);
  if (!user) {
    throw new UnauthorizedError('ユーザーが見つかりません');
  }

  // JWTトークンを生成
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user,
    token,
  };
}
