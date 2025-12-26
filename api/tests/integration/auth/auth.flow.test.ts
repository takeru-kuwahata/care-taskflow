import { signupUser, loginUser } from '../../../auth/auth.service.js';
import { cleanupTestUser, userExists } from '../../utils/db-test-helper.js';
import {
  generateUniqueEmail,
  generateTestPassword,
  isValidAuthResponse,
} from '../../utils/test-auth-helper.js';
import type { SignupData, LoginCredentials } from '../../../types/index.js';

/**
 * 認証フロー統合テスト
 * モックを使用せず、実際のデータベースとサービスを使用
 */

describe('認証フロー統合テスト', () => {
  let testEmail: string;
  const testPassword = generateTestPassword();

  beforeEach(() => {
    // 各テストで新しいユニークなメールアドレスを生成
    testEmail = generateUniqueEmail();
  });

  afterEach(async () => {
    // テスト後にクリーンアップ
    await cleanupTestUser(testEmail);
  });

  describe('サインアップフロー', () => {
    it('新規ユーザーを正常に登録できる', async () => {
      const signupData: SignupData = {
        email: testEmail,
        password: testPassword,
      };

      const response = await signupUser(signupData);

      // レスポンス検証
      expect(isValidAuthResponse(response)).toBe(true);
      expect(response.user.email).toBe(testEmail);
      expect(response.token).toBeTruthy();

      // データベース確認
      const exists = await userExists(testEmail);
      expect(exists).toBe(true);
    });

    it('同じメールアドレスで重複登録するとエラーになる', async () => {
      const signupData: SignupData = {
        email: testEmail,
        password: testPassword,
      };

      // 1回目の登録（成功）
      await signupUser(signupData);

      // 2回目の登録（失敗）
      await expect(signupUser(signupData)).rejects.toThrow(
        'このメールアドレスは既に登録されています'
      );
    });

    it('無効なメールアドレスでエラーになる', async () => {
      const signupData: SignupData = {
        email: 'invalid-email',
        password: testPassword,
      };

      await expect(signupUser(signupData)).rejects.toThrow(
        '有効なメールアドレスを入力してください'
      );
    });

    it('パスワードが短すぎるとエラーになる', async () => {
      const signupData: SignupData = {
        email: testEmail,
        password: 'short',
      };

      await expect(signupUser(signupData)).rejects.toThrow(
        'パスワードは8文字以上である必要があります'
      );
    });
  });

  describe('ログインフロー', () => {
    beforeEach(async () => {
      // 各テストの前にユーザーを登録
      const signupData: SignupData = {
        email: testEmail,
        password: testPassword,
      };
      await signupUser(signupData);
    });

    it('正しい認証情報でログインできる', async () => {
      const credentials: LoginCredentials = {
        email: testEmail,
        password: testPassword,
      };

      const response = await loginUser(credentials);

      // レスポンス検証
      expect(isValidAuthResponse(response)).toBe(true);
      expect(response.user.email).toBe(testEmail);
      expect(response.token).toBeTruthy();
    });

    it('間違ったパスワードでログインするとエラーになる', async () => {
      const credentials: LoginCredentials = {
        email: testEmail,
        password: 'WrongPassword123!',
      };

      await expect(loginUser(credentials)).rejects.toThrow(
        'メールアドレスまたはパスワードが正しくありません'
      );
    });

    it('存在しないメールアドレスでログインするとエラーになる', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@test.local',
        password: testPassword,
      };

      await expect(loginUser(credentials)).rejects.toThrow(
        'メールアドレスまたはパスワードが正しくありません'
      );
    });

    it('無効なメールアドレスでエラーになる', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: testPassword,
      };

      await expect(loginUser(credentials)).rejects.toThrow(
        '有効なメールアドレスを入力してください'
      );
    });
  });

  describe('サインアップ→ログインフロー（エンドツーエンド）', () => {
    it('サインアップ後に同じ認証情報でログインできる', async () => {
      // Step 1: サインアップ
      const signupData: SignupData = {
        email: testEmail,
        password: testPassword,
      };

      const signupResponse = await signupUser(signupData);
      expect(isValidAuthResponse(signupResponse)).toBe(true);

      // Step 2: ログイン
      const credentials: LoginCredentials = {
        email: testEmail,
        password: testPassword,
      };

      const loginResponse = await loginUser(credentials);
      expect(isValidAuthResponse(loginResponse)).toBe(true);

      // Step 3: ユーザー情報が一致することを確認
      expect(loginResponse.user.id).toBe(signupResponse.user.id);
      expect(loginResponse.user.email).toBe(signupResponse.user.email);
    });
  });
});
