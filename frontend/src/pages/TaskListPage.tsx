import React from 'react';
import { MainLayout } from '../layouts/MainLayout';

export const TaskListPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">課題一覧</h1>
          <p className="text-gray-600 mt-1">
            医療的ケア児支援の課題を管理します
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">
            課題一覧機能はPhase 4: ページ実装で実装されます
          </p>
        </div>
      </div>
    </MainLayout>
  );
};
