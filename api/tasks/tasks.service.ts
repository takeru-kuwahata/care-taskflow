import {
  type Task,
  type TaskListResponse,
  type TaskCreateRequest,
  type TaskUpdateRequest,
  type TaskFilter,
  type TaskSort,
  type TaskPagination,
} from '../types/index.js';
import * as repository from './tasks.repository.js';

/**
 * 課題サービス層
 * ビジネスロジックとトランザクション管理を担当
 */

/**
 * 課題を作成（関連データも一緒に作成）
 */
export async function createTaskWithRelations(
  userId: string,
  data: TaskCreateRequest
): Promise<Task> {
  // 課題本体を作成
  const task = await repository.createTask(
    userId,
    data.category,
    data.problem,
    data.status,
    data.deadline,
    data.relatedBusiness,
    data.businessContent,
    data.organization
  );

  // 原因を作成
  const taskCauses = data.causes
    ? await repository.createCauses(task.id, data.causes)
    : [];

  // 対応案を作成
  const taskActions = data.actions
    ? await repository.createActions(task.id, data.actions)
    : [];

  // 対応者を作成
  const taskAssignees = data.assignees
    ? await repository.createAssignees(task.id, data.assignees)
    : [];

  // 関連データを含めた完全な課題を返す
  return {
    ...task,
    causes: taskCauses,
    actions: taskActions,
    assignees: taskAssignees,
  };
}

/**
 * 課題一覧を取得（フィルター・ソート・ページネーション対応）
 */
export async function getTaskList(
  filter?: TaskFilter,
  sort?: TaskSort,
  pagination?: TaskPagination
): Promise<TaskListResponse> {
  const tasks = await repository.findTasks(filter, sort, pagination);
  const total = await repository.countTasks(filter);

  return {
    tasks,
    total,
    limit: pagination?.limit,
    offset: pagination?.offset,
  };
}

/**
 * 課題詳細を取得
 */
export async function getTaskDetail(taskId: string): Promise<Task | null> {
  return await repository.findTaskById(taskId);
}

/**
 * 課題を更新（関連データも更新）
 */
export async function updateTaskWithRelations(
  taskId: string,
  data: TaskUpdateRequest
): Promise<Task | null> {
  // 課題が存在するか確認
  const existingTask = await repository.findTaskById(taskId);
  if (!existingTask) {
    return null;
  }

  // 課題本体を更新
  const taskUpdates: Parameters<typeof repository.updateTask>[1] = {};

  if (data.category !== undefined) taskUpdates.category = data.category;
  if (data.problem !== undefined) taskUpdates.problem = data.problem;
  if (data.status !== undefined) taskUpdates.status = data.status;
  if (data.deadline !== undefined) taskUpdates.deadline = data.deadline;
  if (data.relatedBusiness !== undefined) taskUpdates.relatedBusiness = data.relatedBusiness;
  if (data.businessContent !== undefined) taskUpdates.businessContent = data.businessContent;
  if (data.organization !== undefined) taskUpdates.organization = data.organization;

  // 課題本体を更新
  if (Object.keys(taskUpdates).length > 0) {
    await repository.updateTask(taskId, taskUpdates);
  }

  // 原因を更新（全削除して再作成）
  if (data.causes !== undefined) {
    await repository.deleteCausesByTaskId(taskId);
    if (data.causes.length > 0) {
      await repository.createCauses(taskId, data.causes);
    }
  }

  // 対応案を更新（全削除して再作成）
  if (data.actions !== undefined) {
    await repository.deleteActionsByTaskId(taskId);
    if (data.actions.length > 0) {
      await repository.createActions(taskId, data.actions);
    }
  }

  // 対応者を更新（全削除して再作成）
  if (data.assignees !== undefined) {
    await repository.deleteAssigneesByTaskId(taskId);
    if (data.assignees.length > 0) {
      await repository.createAssignees(taskId, data.assignees);
    }
  }

  // 更新後の課題を取得して返す
  return await repository.findTaskById(taskId);
}

/**
 * 課題を削除
 */
export async function deleteTaskById(taskId: string): Promise<boolean> {
  const existingTask = await repository.findTaskById(taskId);
  if (!existingTask) {
    return false;
  }

  return await repository.deleteTask(taskId);
}
