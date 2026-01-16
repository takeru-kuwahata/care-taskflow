// ============================================
// TaskListPage - 課題一覧ページ（P-001）
// ============================================
// ユーザーページ（要認証）

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { useTaskListData } from '@/hooks/useTaskListData';
import { MessageCircle, Tag } from 'lucide-react';
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  IMPORTANCE_LABELS,
  URGENCY_LABELS,
  type TaskCategory,
  type TaskStatus,
  type Task,
} from '@/types';

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, updateFilter, clearFilter, updateSort, pagination, setPage, setPageSize } = useTaskListData();

  // ローカル状態（フィルター選択値）
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  // ソート状態
  type SortKey = 'taskNumber' | 'deadline' | 'status' | 'importance' | 'urgency' | null;
  type SortOrder = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 対応者一覧を抽出（重複排除）
  const assignees = Array.from(
    new Set(
      data?.tasks.flatMap((task: Task) => task.assignees.map((assignee: { name: string }) => assignee.name)) || []
    )
  );

  // フィルター変更ハンドラー
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskCategory | '';
    setSelectedCategory(value);
    if (value) {
      updateFilter({ category: value });
    } else {
      updateFilter({ category: undefined });
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskStatus | '';
    setSelectedStatus(value);
    if (value) {
      updateFilter({ status: value });
    } else {
      updateFilter({ status: undefined });
    }
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAssignee(value);
    if (value) {
      updateFilter({ assignee: value });
    } else {
      updateFilter({ assignee: undefined });
    }
  };

  // フィルタークリア
  const handleClearFilter = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedAssignee('');
    clearFilter();
  };

  // ソート処理
  const handleSort = (key: SortKey) => {
    let newSortOrder: SortOrder = 'asc';

    if (sortKey === key) {
      // 同じ列をクリックした場合、昇順/降順を切り替え
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // 別の列をクリックした場合、その列で昇順ソート
      newSortOrder = 'asc';
    }

    setSortKey(key);
    setSortOrder(newSortOrder);

    // フック経由でソート条件を更新
    if (key) {
      updateSort({ sortBy: key, sortOrder: newSortOrder });
    }
  };

  // 期限が過ぎているかチェック
  const isOverdue = (deadline?: string): boolean => {
    if (!deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  };

  // 新規課題登録ボタン
  const handleNewTask = () => {
    navigate('/tasks/new');
  };

  // 課題行クリック
  const handleRowClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          エラーが発生しました: {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">課題一覧</h1>
          <button
            onClick={handleNewTask}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規課題登録
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-900">フィルター</span>
          </div>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">項目（カテゴリ）</label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                {Object.entries(TASK_CATEGORY_LABELS).map(([categoryValue, label]: [string, string]) => (
                  <option key={categoryValue} value={categoryValue}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">進捗ステータス</label>
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                {Object.entries(TASK_STATUS_LABELS).map(([statusValue, label]: [string, string]) => (
                  <option key={statusValue} value={statusValue}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">対応者</label>
              <select
                value={selectedAssignee}
                onChange={handleAssigneeChange}
                className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                {assignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCategory || selectedStatus || selectedAssignee) && (
              <button
                onClick={handleClearFilter}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                フィルタークリア
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {data && data.tasks.length > 0 ? (
            <>
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      onClick={() => handleSort('taskNumber')}
                      className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-48 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1">
                        項番・項目
                        {sortKey === 'taskNumber' && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-900">
                      問題点
                    </th>
                    <th
                      onClick={() => handleSort('importance')}
                      className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-24 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1">
                        重要度
                        {sortKey === 'importance' && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('urgency')}
                      className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-24 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1">
                        緊急度
                        {sortKey === 'urgency' && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-36 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1">
                        進捗ステータス
                        {sortKey === 'status' && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-36">
                      対応者
                    </th>
                    <th
                      onClick={() => handleSort('deadline')}
                      className="px-5 py-4 text-left text-sm font-semibold text-gray-900 w-28 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1">
                        期限
                        {sortKey === 'deadline' && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.map((task: Task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task)}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                            {String(task.taskNumber).padStart(3, '0')}
                          </span>
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium whitespace-nowrap">
                            {TASK_CATEGORY_LABELS[task.category]}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="text-sm leading-relaxed font-medium">
                            {task.problem}
                          </div>
                          {/* 詳細情報（原因・対応案・コメントの最初の50文字） */}
                          <div className="text-xs text-gray-500 leading-relaxed">
                            {(() => {
                              const details = [];
                              if (task.causes && task.causes.length > 0 && task.causes[0].cause) {
                                details.push(`原因: ${task.causes[0].cause.substring(0, 50)}${task.causes[0].cause.length > 50 ? '...' : ''}`);
                              }
                              if (task.actions && task.actions.length > 0 && task.actions[0].action) {
                                details.push(`対応案: ${task.actions[0].action.substring(0, 50)}${task.actions[0].action.length > 50 ? '...' : ''}`);
                              }
                              if (task.comments && task.comments.length > 0 && task.comments[0].content) {
                                details.push(`コメント: ${task.comments[0].content.substring(0, 50)}${task.comments[0].content.length > 50 ? '...' : ''}`);
                              }
                              return details.length > 0 ? details[0] : '';
                            })()}
                          </div>
                          {/* Phase 12: バッジ表示 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* タグバッジ */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3 text-gray-400" />
                                {task.tags.slice(0, 3).map((tag) => (
                                  <span key={tag.id} className="inline-block bg-gray-200 text-gray-700 rounded text-xs px-1.5 py-0.5">
                                    {tag.name}
                                  </span>
                                ))}
                                {task.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                                )}
                              </div>
                            )}

                            {/* コメント数バッジ */}
                            {task.commentCount !== undefined && task.commentCount > 0 && (
                              <span className="inline-flex items-center gap-1 border border-gray-300 rounded text-xs px-1.5 py-0.5">
                                <MessageCircle className="h-3 w-3" />
                                {task.commentCount}
                              </span>
                            )}

                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {task.importance ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            task.importance === 'high' ? 'bg-red-100 text-red-700' :
                            task.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {IMPORTANCE_LABELS[task.importance]}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">未設定</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {task.urgency ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            task.urgency === 'high' ? 'bg-red-100 text-red-700' :
                            task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {URGENCY_LABELS[task.urgency]}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">未設定</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
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
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {task.assignees.map((a: { name: string }) => a.name).join(', ') || '-'}
                      </td>
                      <td
                        className={`px-5 py-4 text-sm ${
                          isOverdue(task.deadline) ? 'text-red-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {task.deadline || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {data.total > (pagination.limit || 20) && (
                <div className="flex justify-between items-center px-5 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">表示件数:</span>
                    <select
                      value={pagination.limit || 20}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10件</option>
                      <option value={20}>20件</option>
                      <option value={50}>50件</option>
                      <option value={100}>100件</option>
                    </select>
                    <span className="text-sm text-gray-600 ml-4">
                      {data.total}件中 {(pagination.offset || 0) + 1} - {Math.min((pagination.offset || 0) + (pagination.limit || 20), data.total)}件を表示
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, Math.floor((pagination.offset || 0) / (pagination.limit || 20))))}
                      disabled={(pagination.offset || 0) === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>

                    {(() => {
                      const currentPage = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
                      const totalPages = Math.ceil(data.total / (pagination.limit || 20));
                      const pages: number[] = [];

                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        if (currentPage <= 4) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push(-1);
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 3) {
                          pages.push(1);
                          pages.push(-1);
                          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push(-1);
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                          pages.push(-1);
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((page, index) =>
                        page === -1 ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setPage(page)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() => setPage(Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 2)}
                      disabled={(pagination.offset || 0) + (pagination.limit || 20) >= data.total}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-blue-300 text-6xl mb-4">📋</div>
              <p className="text-gray-500">課題が見つかりませんでした</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskListPage;
