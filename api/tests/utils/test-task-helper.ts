import { db } from '../../db/index.js';
import { tasks, causes, actions, assignees } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import type { TaskCreateRequest } from '../../types/index.js';

/**
 * 課題テストヘルパー
 * 課題関連の統合テストを簡略化
 */

/**
 * テスト用課題を全削除
 * @param userId - 削除する課題の作成者ID
 */
export async function cleanupTestTasks(userId: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.createdBy, userId));
}

/**
 * 課題IDで課題を削除
 * @param taskId - 削除する課題のID
 */
export async function cleanupTaskById(taskId: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

/**
 * テスト用課題データを生成
 * @param overrides - 上書きするフィールド
 * @returns テスト用課題作成リクエスト
 */
export function generateTestTaskData(overrides?: Partial<TaskCreateRequest>): TaskCreateRequest {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);

  return {
    category: 'system',
    problem: `テスト課題-${timestamp}-${randomStr}`,
    status: 'not_started',
    deadline: '2025-12-31',
    relatedBusiness: 'テスト関連業務',
    businessContent: 'テスト業務内容',
    organization: 'テスト組織',
    causes: [
      { cause: 'テスト原因1' },
      { cause: 'テスト原因2' },
    ],
    actions: [
      { action: 'テスト対応案1' },
    ],
    assignees: [
      { name: 'テスト担当者', organization: 'テスト組織' },
    ],
    ...overrides,
  };
}

/**
 * 課題が存在するか確認
 * @param taskId - 確認する課題のID
 * @returns 存在する場合はtrue
 */
export async function taskExists(taskId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return result.length > 0;
}

/**
 * 課題の原因数を取得
 * @param taskId - 課題ID
 * @returns 原因の数
 */
export async function getCausesCount(taskId: string): Promise<number> {
  const result = await db
    .select()
    .from(causes)
    .where(eq(causes.taskId, taskId));

  return result.length;
}

/**
 * 課題の対応案数を取得
 * @param taskId - 課題ID
 * @returns 対応案の数
 */
export async function getActionsCount(taskId: string): Promise<number> {
  const result = await db
    .select()
    .from(actions)
    .where(eq(actions.taskId, taskId));

  return result.length;
}

/**
 * 課題の対応者数を取得
 * @param taskId - 課題ID
 * @returns 対応者の数
 */
export async function getAssigneesCount(taskId: string): Promise<number> {
  const result = await db
    .select()
    .from(assignees)
    .where(eq(assignees.taskId, taskId));

  return result.length;
}
