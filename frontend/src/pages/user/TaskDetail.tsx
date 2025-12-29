// ============================================
// TaskDetail - 課題詳細ページ
// ============================================
// 新規作成モード（/tasks/new）と編集モード（/tasks/:id）の両方に対応

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { TagInput } from '@/components/TagInput';
import { CommentSection } from '@/components/CommentSection';
import { addTagToTask, removeTagFromTask } from '@/lib/apiClient';
import type {
  TaskCategory,
  TaskStatus,
  CauseCreateRequest,
  ActionCreateRequest,
  AssigneeCreateRequest,
  Tag,
  ImportanceLevel,
  UrgencyLevel,
} from '@/types';
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  IMPORTANCE_LABELS,
  URGENCY_LABELS,
} from '@/types';
import { logger } from '@/lib/logger';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewMode = !id;

  const { task, loading, error, createTask, updateTask, deleteTask } = useTaskDetail(id);

  // フォームステート
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [problem, setProblem] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [deadline, setDeadline] = useState('');
  const [relatedBusiness, setRelatedBusiness] = useState('');
  const [businessContent, setBusinessContent] = useState('');
  const [organization, setOrganization] = useState('');
  const [causes, setCauses] = useState<string[]>(['']);
  const [actions, setActions] = useState<string[]>(['']);
  const [assignees, setAssignees] = useState<{ name: string; organization?: string }[]>([
    { name: '', organization: '' },
  ]);

  // 削除確認モーダル
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Phase 12: タグの状態管理
  const [tags, setTags] = useState<Tag[]>([]);

  // Phase 12: 重要度×緊急度マトリクスの状態管理
  const [importance, setImportance] = useState<ImportanceLevel | ''>('');
  const [urgency, setUrgency] = useState<UrgencyLevel | ''>('');

  // 編集モード時にデータをフォームに反映
  useEffect(() => {
    if (task) {
      logger.debug('Loading task data into form', { taskId: task.id });
      setCategory(task.category);
      setProblem(task.problem);
      setStatus(task.status);
      setDeadline(task.deadline || '');
      setRelatedBusiness(task.relatedBusiness || '');
      setBusinessContent(task.businessContent || '');
      setOrganization(task.organization || '');
      setCauses(task.causes.length > 0 ? task.causes.map((c) => c.cause) : ['']);
      setActions(task.actions.length > 0 ? task.actions.map((a) => a.action) : ['']);
      setAssignees(
        task.assignees.length > 0
          ? task.assignees.map((a) => ({ name: a.name, organization: a.organization }))
          : [{ name: '', organization: '' }]
      );
      // Phase 12: タグを反映
      setTags(task.tags || []);
      // Phase 12: 重要度×緊急度を反映
      setImportance(task.importance || '');
      setUrgency(task.urgency || '');
    }
  }, [task]);

  // 原因の追加・削除
  const handleAddCause = () => {
    setCauses([...causes, '']);
  };

  const handleRemoveCause = (index: number) => {
    if (causes.length > 1) {
      setCauses(causes.filter((_, i) => i !== index));
    }
  };

  const handleCauseChange = (index: number, value: string) => {
    const newCauses = [...causes];
    newCauses[index] = value;
    setCauses(newCauses);
  };

  // 対応案の追加・削除
  const handleAddAction = () => {
    setActions([...actions, '']);
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const handleActionChange = (index: number, value: string) => {
    const newActions = [...actions];
    newActions[index] = value;
    setActions(newActions);
  };

  // 対応者の追加・削除
  const handleAddAssignee = () => {
    setAssignees([...assignees, { name: '', organization: '' }]);
  };

  const handleRemoveAssignee = (index: number) => {
    if (assignees.length > 1) {
      setAssignees(assignees.filter((_, i) => i !== index));
    }
  };

  const handleAssigneeChange = (
    index: number,
    field: 'name' | 'organization',
    value: string
  ) => {
    const newAssignees = [...assignees];
    newAssignees[index][field] = value;
    setAssignees(newAssignees);
  };

  // Phase 12: タグの追加・削除ハンドラー
  const handleAddTag = async (tagName: string) => {
    if (!id) {
      throw new Error('新規作成モードではタグを追加できません');
    }

    const { tag } = await addTagToTask(id, tagName);
    setTags([...tags, tag]);
    logger.debug('Tag added', { tagId: tag.id, tagName: tag.name });
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!id) {
      throw new Error('新規作成モードではタグを削除できません');
    }

    await removeTagFromTask(id, tagId);
    setTags(tags.filter((t) => t.id !== tagId));
    logger.debug('Tag removed', { tagId });
  };

  // 保存処理
  const handleSave = async () => {
    try {
      // バリデーション
      if (!category) {
        alert('項目（カテゴリ）を選択してください');
        return;
      }
      if (!problem.trim()) {
        alert('問題点を入力してください');
        return;
      }
      if (!status) {
        alert('進捗ステータスを選択してください');
        return;
      }

      logger.debug('Saving task', { isNewMode, category, status });

      // リクエストデータ作成
      const causesData: CauseCreateRequest[] = causes
        .filter((c) => c.trim())
        .map((c) => ({ cause: c }));
      const actionsData: ActionCreateRequest[] = actions
        .filter((a) => a.trim())
        .map((a) => ({ action: a }));
      const assigneesData: AssigneeCreateRequest[] = assignees
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name,
          organization: a.organization || undefined,
        }));

      if (isNewMode) {
        // 新規作成
        await createTask({
          category: category as TaskCategory,
          problem,
          status: status as TaskStatus,
          deadline: deadline || undefined,
          relatedBusiness: relatedBusiness || undefined,
          businessContent: businessContent || undefined,
          organization: organization || undefined,
          causes: causesData.length > 0 ? causesData : undefined,
          actions: actionsData.length > 0 ? actionsData : undefined,
          assignees: assigneesData.length > 0 ? assigneesData : undefined,
          // Phase 12: 重要度×緊急度マトリクス
          importance: importance || undefined,
          urgency: urgency || undefined,
        });

        logger.info('Task created successfully');
        alert('課題を作成しました');
      } else {
        // 更新
        await updateTask(id, {
          category: category as TaskCategory,
          problem,
          status: status as TaskStatus,
          deadline: deadline || undefined,
          relatedBusiness: relatedBusiness || undefined,
          businessContent: businessContent || undefined,
          organization: organization || undefined,
          causes: causesData.length > 0 ? causesData : undefined,
          actions: actionsData.length > 0 ? actionsData : undefined,
          assignees: assigneesData.length > 0 ? assigneesData : undefined,
          // Phase 12: 重要度×緊急度マトリクス
          importance: importance || undefined,
          urgency: urgency || undefined,
        });

        logger.info('Task updated successfully', { taskId: id });
        alert('課題を更新しました');
      }

      // 課題一覧ページへ遷移
      navigate('/tasks');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to save task', { error: error.message });
      alert('保存に失敗しました: ' + error.message);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!id) return;

    try {
      logger.debug('Deleting task', { taskId: id });
      await deleteTask(id);

      logger.info('Task deleted successfully', { taskId: id });
      alert('課題を削除しました');
      navigate('/tasks');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete task', { error: error.message, taskId: id });
      alert('削除に失敗しました: ' + error.message);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-96">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  if (error && !isNewMode) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          エラー: {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tasks')}
              className="inline-flex items-center gap-1 px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              {isNewMode ? '課題新規作成' : '課題詳細'}
            </h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white p-8 rounded-xl shadow-sm mb-6">
          {/* 基本情報 Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50">
              基本情報
            </h2>

            {/* 項目（カテゴリ） */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                項目（カテゴリ）
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              >
                <option value="">選択してください</option>
                {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 問題点 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                問題点
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="具体的な問題点を入力してください（最大500文字）"
                maxLength={500}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 resize-y min-h-32"
              />
            </div>
          </div>

          {/* 原因・対応案 Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50">
              原因・対応案
            </h2>

            {/* 原因（複数登録可） */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">原因</label>
              <div className="flex flex-col gap-3">
                {causes.map((cause, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={cause}
                      onChange={(e) => handleCauseChange(index, e.target.value)}
                      placeholder="原因を入力してください"
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleRemoveCause(index)}
                      disabled={causes.length === 1}
                      className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddCause}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-500 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mt-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
                原因を追加
              </button>
            </div>

            {/* 対応案（複数登録可） */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">対応案</label>
              <div className="flex flex-col gap-3">
                {actions.map((action, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => handleActionChange(index, e.target.value)}
                      placeholder="対応案を入力してください"
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleRemoveAction(index)}
                      disabled={actions.length === 1}
                      className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddAction}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-500 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mt-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
                対応案を追加
              </button>
            </div>
          </div>

          {/* 進捗管理 Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50">
              進捗管理
            </h2>

            {/* 進捗ステータス */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                進捗ステータス
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              >
                <option value="">選択してください</option>
                {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 対応者（複数選択可） */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">対応者</label>
              <div className="flex flex-col gap-3">
                {assignees.map((assignee, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={assignee.name}
                      onChange={(e) => handleAssigneeChange(index, 'name', e.target.value)}
                      placeholder="対応者名"
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      value={assignee.organization || ''}
                      onChange={(e) => handleAssigneeChange(index, 'organization', e.target.value)}
                      placeholder="所属（任意）"
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleRemoveAssignee(index)}
                      disabled={assignees.length === 1}
                      className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddAssignee}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-500 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mt-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
                対応者を追加
              </button>
            </div>

            {/* 期限 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                期限
                <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              />
            </div>

            {/* Phase 12: タグ */}
            {!isNewMode && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  タグ
                  <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
                </label>
                <TagInput
                  tags={tags}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              </div>
            )}

            {/* Phase 12: 重要度×緊急度マトリクス */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* 重要度 */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  重要度
                  <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
                </label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as ImportanceLevel | '')}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                >
                  <option value="">未設定</option>
                  {Object.entries(IMPORTANCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 緊急度 */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  緊急度
                  <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel | '')}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                >
                  <option value="">未設定</option>
                  {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 詳細情報 Section */}
          <div className="mb-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50">
              詳細情報
            </h2>

            {/* 関連事業 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                関連事業
                <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
              </label>
              <input
                type="text"
                value={relatedBusiness}
                onChange={(e) => setRelatedBusiness(e.target.value)}
                placeholder="関連事業名を入力してください"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              />
            </div>

            {/* 事業内容 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                事業内容
                <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
              </label>
              <textarea
                value={businessContent}
                onChange={(e) => setBusinessContent(e.target.value)}
                placeholder="事業内容を入力してください"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 resize-y min-h-24"
              />
            </div>

            {/* 該当所属 */}
            <div className="mb-0">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                該当所属
                <span className="text-gray-500 ml-1 font-normal text-xs">（任意）</span>
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="該当所属を入力してください"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Phase 12: コメントセクション */}
          {!isNewMode && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50">
                コメント・対話
              </h2>
              <CommentSection taskId={id!} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-lg text-base font-medium hover:bg-blue-600 transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
              </svg>
              保存
            </button>
          </div>

          {!isNewMode && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-500 border border-red-500 rounded-lg text-base font-medium hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              削除
            </button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-xl max-w-md w-11/12 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                課題の削除
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                この課題を削除してもよろしいですか？
                <br />
                削除すると元に戻せません。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TaskDetail;
