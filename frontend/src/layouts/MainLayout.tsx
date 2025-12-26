import React, { useState } from 'react';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-primary-700">
              ケアTaskFlow
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform duration-300 z-20 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <nav className="p-4 space-y-2">
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
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="pt-14 md:pl-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
