// ============================================
// 定数・列挙型
// ============================================

// カテゴリ定数（項目）
export const TASK_CATEGORIES = {
  TRANSITION: 'transition',
  RESPITE: 'respite',
  WELFARE: 'welfare',
  NURSERY: 'nursery',
  SCHOOL: 'school',
  HOME_LIFE: 'home_life',
  OTHER: 'other',
} as const;

export type TaskCategory = typeof TASK_CATEGORIES[keyof typeof TASK_CATEGORIES];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  [TASK_CATEGORIES.TRANSITION]: '成人移行',
  [TASK_CATEGORIES.RESPITE]: 'レスパイト',
  [TASK_CATEGORIES.WELFARE]: '福祉サービス',
  [TASK_CATEGORIES.NURSERY]: '保育園・幼稚園',
  [TASK_CATEGORIES.SCHOOL]: '学校',
  [TASK_CATEGORIES.HOME_LIFE]: '在宅生活',
  [TASK_CATEGORIES.OTHER]: 'その他',
};

// 進捗ステータス定数
export const TASK_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUSES.NOT_STARTED]: '未着手',
  [TASK_STATUSES.IN_PROGRESS]: '進行中',
  [TASK_STATUSES.COMPLETED]: '完了',
};

// ============================================
// エンティティ型
// ============================================

// ユーザー型
export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 原因型
export interface Cause {
  id: string;
  taskId: string;
  cause: string;
  createdAt: string;
}

// 対応案型
export interface Action {
  id: string;
  taskId: string;
  action: string;
  createdAt: string;
}

// 対応者型
export interface Assignee {
  id: string;
  taskId: string;
  name: string;
  organization?: string;
  createdAt: string;
}

// 課題型
export interface Task {
  id: string;
  taskNumber: number;
  category: TaskCategory;
  problem: string;
  status: TaskStatus;
  deadline?: string;
  relatedBusiness?: string;
  businessContent?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  causes: Cause[];
  actions: Action[];
  assignees: Assignee[];
}

// ============================================
// 認証関連型
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// フィルター・ソート型
// ============================================

// フィルター条件型
export interface TaskFilter {
  category?: TaskCategory;
  status?: TaskStatus;
  assignee?: string;
}

// ソート条件型
export interface TaskSort {
  sortBy?: 'taskNumber' | 'deadline' | 'status' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// APIレスポンス型
// ============================================

// 課題一覧レスポンス型
export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// 課題詳細レスポンス型
export interface TaskDetailResponse {
  task: Task;
}

// APIエラーレスポンス型
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// APIリクエスト型
// ============================================

// 原因作成リクエスト型（課題作成・更新時）
export interface CauseCreateRequest {
  cause: string;
}

// 対応案作成リクエスト型（課題作成・更新時）
export interface ActionCreateRequest {
  action: string;
}

// 対応者作成リクエスト型（課題作成・更新時）
export interface AssigneeCreateRequest {
  name: string;
  organization?: string;
}

// 課題作成リクエスト型
export interface TaskCreateRequest {
  category: TaskCategory;
  problem: string;
  status: TaskStatus;
  deadline?: string;
  relatedBusiness?: string;
  businessContent?: string;
  organization?: string;
  causes?: CauseCreateRequest[];
  actions?: ActionCreateRequest[];
  assignees?: AssigneeCreateRequest[];
}

// 課題更新リクエスト型
export interface TaskUpdateRequest {
  category?: TaskCategory;
  problem?: string;
  status?: TaskStatus;
  deadline?: string;
  relatedBusiness?: string;
  businessContent?: string;
  organization?: string;
  causes?: CauseCreateRequest[];
  actions?: ActionCreateRequest[];
  assignees?: AssigneeCreateRequest[];
}

// ============================================
// 型ガード関数
// ============================================

// 型ガード: TaskCategory
export function isTaskCategory(value: unknown): value is TaskCategory {
  if (typeof value !== 'string') {
    return false;
  }
  return Object.values(TASK_CATEGORIES).includes(value as TaskCategory);
}

// 型ガード: TaskStatus
export function isTaskStatus(value: unknown): value is TaskStatus {
  if (typeof value !== 'string') {
    return false;
  }
  return Object.values(TASK_STATUSES).includes(value as TaskStatus);
}

// 型ガード: Task
export function isTask(obj: unknown): obj is Task {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const task = obj as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.taskNumber === 'number' &&
    isTaskCategory(task.category) &&
    typeof task.problem === 'string' &&
    isTaskStatus(task.status) &&
    typeof task.createdAt === 'string' &&
    typeof task.updatedAt === 'string' &&
    typeof task.createdBy === 'string' &&
    Array.isArray(task.causes) &&
    Array.isArray(task.actions) &&
    Array.isArray(task.assignees)
  );
}

// 型ガード: TaskListResponse
export function isTaskListResponse(obj: unknown): obj is TaskListResponse {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const response = obj as Record<string, unknown>;
  return (
    Array.isArray(response.tasks) &&
    response.tasks.every(isTask) &&
    typeof response.total === 'number'
  );
}
