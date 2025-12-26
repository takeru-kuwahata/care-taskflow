import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/AuthService';
import type { SignupData } from '@/types';
import { logger } from '@/lib/logger';

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  const signup = async (data: SignupData) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Signup hook: Starting signup', { email: data.email });

      const result = await authService.signup(data);

      // トークンをローカルストレージに保存
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      logger.info('Signup hook: Signup successful', { userId: result.user.id });

      // 課題一覧ページへリダイレクト
      navigate('/tasks');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Signup hook: Signup failed', { error: error.message });
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signup,
  };
};
