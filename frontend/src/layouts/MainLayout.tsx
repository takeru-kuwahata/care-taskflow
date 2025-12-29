import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email || '';

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePasswordChange = () => {
    navigate('/change-password');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform duration-300 z-20 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">ログイン中</h2>
          <p className="text-sm text-gray-700 break-all">{userEmail}</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <a
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 flex items-center gap-2"
          >
            <span>📊</span>
            <span>ダッシュボード</span>
          </a>
          <a
            href="/tasks"
            className="block px-4 py-2 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 flex items-center gap-2"
          >
            <span>📋</span>
            <span>課題一覧</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handlePasswordChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <span>パスワード変更</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="md:pl-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
