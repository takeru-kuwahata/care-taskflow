import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Login hook: Starting login', { email: credentials.email });

      // AuthContextのloginを使用（これがトークン保存とuser状態更新を行う）
      await authLogin(credentials);

      logger.info('Login hook: Login successful');

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
