// ============================================
// AuthService - 実API実装
// ============================================

import type { LoginCredentials, SignupData, AuthResponse } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

export class AuthService {
  /**
   * ログイン処理
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.debug('Login attempt', { email: credentials.email });

    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      logger.info('Login successful', { userId: response.user.id, email: response.user.email });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Login failed', { error: error.message, email: credentials.email });
      throw error;
    }
  }

  /**
   * サインアップ処理
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    logger.debug('Signup attempt', { email: data.email });

    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
      logger.info('Signup successful', { userId: response.user.id, email: response.user.email });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Signup failed', { error: error.message, email: data.email });
      throw error;
    }
  }

  /**
   * ログアウト処理
   */
  async logout(): Promise<void> {
    logger.info('Logout attempt');

    try {
      await apiClient.post<void>('/api/auth/logout', {});
      logger.info('Logout successful');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }
}

// デフォルトインスタンス
export const authService = new AuthService();
