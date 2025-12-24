// ユーザー型
export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 課題型
export interface Task {
  id: string;
  taskNumber: number;
  category: string;
  problem: string;
  status: 'not_started' | 'in_progress' | 'completed';
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

// 認証関連型
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

// フィルター条件型
export interface TaskFilter {
  category?: string;
  status?: string;
  assignee?: string;
}

// ソート条件型
export interface TaskSort {
  sortBy?: 'taskNumber' | 'deadline' | 'status' | 'category';
  sortOrder?: 'asc' | 'desc';
}
