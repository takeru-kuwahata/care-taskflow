import { eq, and, desc, asc, count, sql, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tasks, causes, actions, assignees } from '../db/schema.js';
import {
  type Task,
  type Cause,
  type Action,
  type Assignee,
  type TaskCategory,
  type TaskStatus,
  type TaskFilter,
  type TaskSort,
  type TaskPagination,
  type CauseCreateRequest,
  type ActionCreateRequest,
  type AssigneeCreateRequest,
  type CategoryStat,
  type StatusStat,
  TASK_STATUSES,
} from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * 課題リポジトリ層
 * データベースアクセスロジックを担当
 */

/**
 * タイムスタンプをISO 8601文字列に変換
 */
function toISOString(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}

/**
 * DB結果を原因型に変換
 */
function mapCause(dbCause: typeof causes.$inferSelect): Cause {
  return {
    id: dbCause.id,
    taskId: dbCause.taskId,
    cause: dbCause.cause,
    createdAt: dbCause.createdAt.toISOString(),
  };
}

/**
 * DB結果を対応案型に変換
 */
function mapAction(dbAction: typeof actions.$inferSelect): Action {
  return {
    id: dbAction.id,
    taskId: dbAction.taskId,
    action: dbAction.action,
    createdAt: dbAction.createdAt.toISOString(),
  };
}

/**
 * DB結果を対応者型に変換
 */
function mapAssignee(dbAssignee: typeof assignees.$inferSelect): Assignee {
  return {
    id: dbAssignee.id,
    taskId: dbAssignee.taskId,
    name: dbAssignee.name,
    organization: dbAssignee.organization || undefined,
    createdAt: dbAssignee.createdAt.toISOString(),
  };
}

/**
 * DB結果を課題型に変換（関連データ含む）
 */
function mapTask(
  dbTask: typeof tasks.$inferSelect,
  taskCauses: Cause[],
  taskActions: Action[],
  taskAssignees: Assignee[]
): Task {
  return {
    id: dbTask.id,
    taskNumber: dbTask.taskNumber,
    category: dbTask.category as TaskCategory,
    problem: dbTask.problem,
    status: dbTask.status as TaskStatus,
    deadline: toISOString(dbTask.deadline),
    relatedBusiness: dbTask.relatedBusiness || undefined,
    businessContent: dbTask.businessContent || undefined,
    organization: dbTask.organization || undefined,
    createdAt: dbTask.createdAt.toISOString(),
    updatedAt: dbTask.updatedAt.toISOString(),
    createdBy: dbTask.createdBy,
    causes: taskCauses,
    actions: taskActions,
    assignees: taskAssignees,
  };
}

/**
 * 課題を作成
 */
export async function createTask(
  userId: string,
  category: TaskCategory,
  problem: string,
  status: TaskStatus,
  deadline?: string,
  relatedBusiness?: string,
  businessContent?: string,
  organization?: string
): Promise<Task> {
  const taskId = randomUUID();
  const now = new Date();

  const [newTask] = await db.insert(tasks).values({
    id: taskId,
    category,
    problem,
    status,
    deadline: deadline ? new Date(deadline) : null,
    relatedBusiness: relatedBusiness || null,
    businessContent: businessContent || null,
    organization: organization || null,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return mapTask(newTask, [], [], []);
}

/**
 * 原因を作成
 */
export async function createCauses(
  taskId: string,
  causesData: CauseCreateRequest[]
): Promise<Cause[]> {
  if (causesData.length === 0) return [];

  const values = causesData.map(c => ({
    id: randomUUID(),
    taskId,
    cause: c.cause,
    createdAt: new Date(),
  }));

  const createdCauses = await db.insert(causes).values(values).returning();
  return createdCauses.map(mapCause);
}

/**
 * 対応案を作成
 */
export async function createActions(
  taskId: string,
  actionsData: ActionCreateRequest[]
): Promise<Action[]> {
  if (actionsData.length === 0) return [];

  const values = actionsData.map(a => ({
    id: randomUUID(),
    taskId,
    action: a.action,
    createdAt: new Date(),
  }));

  const createdActions = await db.insert(actions).values(values).returning();
  return createdActions.map(mapAction);
}

/**
 * 対応者を作成
 */
export async function createAssignees(
  taskId: string,
  assigneesData: AssigneeCreateRequest[]
): Promise<Assignee[]> {
  if (assigneesData.length === 0) return [];

  const values = assigneesData.map(a => ({
    id: randomUUID(),
    taskId,
    name: a.name,
    organization: a.organization || null,
    createdAt: new Date(),
  }));

  const createdAssignees = await db.insert(assignees).values(values).returning();
  return createdAssignees.map(mapAssignee);
}

/**
 * 課題IDで課題を取得（関連データ含む）
 */
export async function findTaskById(taskId: string): Promise<Task | null> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

  if (!task) return null;

  const [taskCauses, taskActions, taskAssignees] = await Promise.all([
    db.select().from(causes).where(eq(causes.taskId, taskId)),
    db.select().from(actions).where(eq(actions.taskId, taskId)),
    db.select().from(assignees).where(eq(assignees.taskId, taskId)),
  ]);

  return mapTask(
    task,
    taskCauses.map(mapCause),
    taskActions.map(mapAction),
    taskAssignees.map(mapAssignee)
  );
}

/**
 * 課題一覧を取得（フィルター・ソート・ページネーション対応）
 */
export async function findTasks(
  filter?: TaskFilter,
  sort?: TaskSort,
  pagination?: TaskPagination
): Promise<Task[]> {
  let query = db.select().from(tasks);

  // フィルタリング
  const conditions = [];

  if (filter?.category) {
    conditions.push(eq(tasks.category, filter.category));
  }

  if (filter?.status) {
    conditions.push(eq(tasks.status, filter.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  // ソート
  if (sort?.sortBy) {
    const orderFunc = sort.sortOrder === 'desc' ? desc : asc;
    switch (sort.sortBy) {
      case 'taskNumber':
        query = query.orderBy(orderFunc(tasks.taskNumber)) as typeof query;
        break;
      case 'deadline':
        query = query.orderBy(orderFunc(tasks.deadline)) as typeof query;
        break;
      case 'status':
        query = query.orderBy(orderFunc(tasks.status)) as typeof query;
        break;
      case 'category':
        query = query.orderBy(orderFunc(tasks.category)) as typeof query;
        break;
    }
  }

  // ページネーション
  if (pagination?.limit) {
    query = query.limit(pagination.limit) as typeof query;
  }
  if (pagination?.offset) {
    query = query.offset(pagination.offset) as typeof query;
  }

  const taskList = await query;

  // 対応者フィルターが指定されている場合、追加でフィルタリング
  let filteredTaskList = taskList;
  if (filter?.assignee) {
    const assigneesList = await db.select().from(assignees);
    const matchingTaskIds = assigneesList
      .filter(a => a.name.includes(filter.assignee!))
      .map(a => a.taskId);

    filteredTaskList = taskList.filter(t => matchingTaskIds.includes(t.id));
  }

  // 各課題の関連データを取得
  const tasksWithRelations: Task[] = [];

  for (const task of filteredTaskList) {
    const [taskCauses, taskActions, taskAssignees] = await Promise.all([
      db.select().from(causes).where(eq(causes.taskId, task.id)),
      db.select().from(actions).where(eq(actions.taskId, task.id)),
      db.select().from(assignees).where(eq(assignees.taskId, task.id)),
    ]);

    tasksWithRelations.push(
      mapTask(
        task,
        taskCauses.map(mapCause),
        taskActions.map(mapAction),
        taskAssignees.map(mapAssignee)
      )
    );
  }

  return tasksWithRelations;
}

/**
 * 課題の総数を取得（フィルター対応）
 */
export async function countTasks(filter?: TaskFilter): Promise<number> {
  let query = db.select({ count: count() }).from(tasks);

  // フィルタリング
  const conditions = [];

  if (filter?.category) {
    conditions.push(eq(tasks.category, filter.category));
  }

  if (filter?.status) {
    conditions.push(eq(tasks.status, filter.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const result = await query;
  let totalCount = result[0]?.count || 0;

  // 対応者フィルターが指定されている場合、追加でフィルタリング
  if (filter?.assignee) {
    const assigneesList = await db.select().from(assignees);
    const matchingTaskIds = new Set(
      assigneesList
        .filter(a => a.name.includes(filter.assignee!))
        .map(a => a.taskId)
    );

    // フィルターされた課題の中で、対応者条件に合うものの数を計算
    const taskList = await db.select().from(tasks).where(conditions.length > 0 ? and(...conditions) : undefined);
    totalCount = taskList.filter(t => matchingTaskIds.has(t.id)).length;
  }

  return totalCount;
}

/**
 * 課題を更新
 */
export async function updateTask(
  taskId: string,
  updates: {
    category?: TaskCategory;
    problem?: string;
    status?: TaskStatus;
    deadline?: string;
    relatedBusiness?: string;
    businessContent?: string;
    organization?: string;
  }
): Promise<Task | null> {
  const updateData: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.problem !== undefined) updateData.problem = updates.problem;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.deadline !== undefined) updateData.deadline = new Date(updates.deadline);
  if (updates.relatedBusiness !== undefined) updateData.relatedBusiness = updates.relatedBusiness;
  if (updates.businessContent !== undefined) updateData.businessContent = updates.businessContent;
  if (updates.organization !== undefined) updateData.organization = updates.organization;

  const [updatedTask] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updatedTask) return null;

  return await findTaskById(taskId);
}

/**
 * 課題の原因を全て削除
 */
export async function deleteCausesByTaskId(taskId: string): Promise<void> {
  await db.delete(causes).where(eq(causes.taskId, taskId));
}

/**
 * 課題の対応案を全て削除
 */
export async function deleteActionsByTaskId(taskId: string): Promise<void> {
  await db.delete(actions).where(eq(actions.taskId, taskId));
}

/**
 * 課題の対応者を全て削除
 */
export async function deleteAssigneesByTaskId(taskId: string): Promise<void> {
  await db.delete(assignees).where(eq(assignees.taskId, taskId));
}

/**
 * 課題を削除
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const result = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
  return result.length > 0;
}

/**
 * ダッシュボード統計: カテゴリ別件数を取得
 */
export async function getCategoryStats(): Promise<CategoryStat[]> {
  const stats = await db
    .select({
      category: tasks.category,
      count: count(),
    })
    .from(tasks)
    .groupBy(tasks.category);

  return stats.map(s => ({
    category: s.category as TaskCategory,
    count: Number(s.count),
  }));
}

/**
 * ダッシュボード統計: ステータス別件数を取得
 */
export async function getStatusStats(): Promise<StatusStat[]> {
  const stats = await db
    .select({
      status: tasks.status,
      count: count(),
    })
    .from(tasks)
    .groupBy(tasks.status);

  return stats.map(s => ({
    status: s.status as TaskStatus,
    count: Number(s.count),
  }));
}

/**
 * ダッシュボード統計: 期限切れ件数を取得
 */
export async function getOverdueCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        lt(tasks.deadline, today),
        sql`${tasks.status} != ${TASK_STATUSES.COMPLETED}`
      )
    );

  return Number(result[0]?.count || 0);
}

/**
 * ダッシュボード統計: 最近更新された課題を取得
 */
export async function getRecentTasks(limit: number = 5): Promise<Task[]> {
  const recentTasksList = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.updatedAt))
    .limit(limit);

  // 各課題の関連データを取得
  const tasksWithRelations: Task[] = [];

  for (const task of recentTasksList) {
    const [taskCauses, taskActions, taskAssignees] = await Promise.all([
      db.select().from(causes).where(eq(causes.taskId, task.id)),
      db.select().from(actions).where(eq(actions.taskId, task.id)),
      db.select().from(assignees).where(eq(assignees.taskId, task.id)),
    ]);

    tasksWithRelations.push(
      mapTask(
        task,
        taskCauses.map(mapCause),
        taskActions.map(mapAction),
        taskAssignees.map(mapAssignee)
      )
    );
  }

  return tasksWithRelations;
}
