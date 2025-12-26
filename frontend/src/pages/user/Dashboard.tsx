// ============================================
// DashboardPage - ダッシュボードページ（P-000）
// ============================================
// ユーザーページ（要認証）

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardService } from '@/services/DashboardService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardStatsResponse, Task } from '@/types';
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from '@/types';

const service = new DashboardService();

// グラフカラー
const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
const STATUS_COLORS = {
  not_started: '#9CA3AF',
  in_progress: '#3B82F6',
  completed: '#10B981',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await service.getStats();
        setData(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          エラーが発生しました: {error?.message}
        </div>
      </MainLayout>
    );
  }

  // カテゴリ別データを整形（グラフ用）
  const categoryChartData = data.categoryStats.map((stat, index) => ({
    name: TASK_CATEGORY_LABELS[stat.category],
    value: stat.count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  // ステータス別データを整形（グラフ用）
  const statusChartData = data.statusStats.map((stat) => ({
    name: TASK_STATUS_LABELS[stat.status],
    count: stat.count,
    fill: STATUS_COLORS[stat.status],
  }));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">課題管理システムの全体進捗を確認できます</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">総課題数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">完了率</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{data.summary.completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">進行中</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{data.summary.inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">期限切れ</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{data.summary.overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別課題数</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}件`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス別進捗</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近の活動</h2>
          {data.recentTasks.length > 0 ? (
            <div className="space-y-3">
              {data.recentTasks.map((task: Task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">
                        {String(task.taskNumber).padStart(3, '0')}
                      </span>
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {TASK_CATEGORY_LABELS[task.category]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1 truncate max-w-2xl">{task.problem}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                        task.status === TASK_STATUSES.NOT_STARTED
                          ? 'bg-gray-100 text-gray-700'
                          : task.status === TASK_STATUSES.IN_PROGRESS
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          task.status === TASK_STATUSES.NOT_STARTED
                            ? 'bg-gray-500'
                            : task.status === TASK_STATUSES.IN_PROGRESS
                            ? 'bg-blue-600'
                            : 'bg-green-600'
                        }`}
                      ></span>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">最近の活動はありません</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
