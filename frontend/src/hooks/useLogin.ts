import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/AuthService';
import type { LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Login hook: Starting login', { email: credentials.email });

      const result = await authService.login(credentials);

      // トークンをローカルストレージに保存
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      logger.info('Login hook: Login successful', { userId: result.user.id });

      // 課題一覧ページへリダイレクト
      navigate('/tasks');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Login hook: Login failed', { error: error.message });
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    login,
  };
};
