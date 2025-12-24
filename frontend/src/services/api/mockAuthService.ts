import type { User, LoginCredentials, SignupData, AuthResponse } from '../../types';

// モックユーザーデータ
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'test@care-taskflow.local',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// モックパスワード（本番環境では絶対に使用しない）
const MOCK_PASSWORDS: Record<string, string> = {
  'test@care-taskflow.local': 'TestPass2025!',
};

export const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find((u) => u.email === credentials.email);
    const password = MOCK_PASSWORDS[credentials.email];

    if (!user || password !== credentials.password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    return {
      user,
      token: `mock_token_${user.id}`,
    };
  },

  async signup(data: SignupData): Promise<AuthResponse> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 既存ユーザーチェック
    if (MOCK_USERS.find((u) => u.email === data.email)) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_USERS.push(newUser);
    MOCK_PASSWORDS[data.email] = data.password;

    return {
      user: newUser,
      token: `mock_token_${newUser.id}`,
    };
  },

  async logout(): Promise<void> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  async getCurrentUser(token: string): Promise<User> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userId = token.replace('mock_token_', '');
    const user = MOCK_USERS.find((u) => u.id === userId);

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    return user;
  },
};
