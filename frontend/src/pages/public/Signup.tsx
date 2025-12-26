import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useSignup } from '@/hooks/useSignup';
import type { SignupData } from '@/types';

export const SignupPage: React.FC = () => {
  const { loading, error, signup } = useSignup();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: SignupData = {
      email,
      password,
    };

    await signup(data);
  };

  return (
    <PublicLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-primary-900 mb-2 text-center">
          新規登録
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          医療的ケア児支援課題管理システム
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@care-taskflow.local"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-primary-500 text-white font-semibold rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登録中...' : '登録'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link
            to="/login"
            className="text-primary-500 font-medium hover:underline"
          >
            ログイン
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default SignupPage;
