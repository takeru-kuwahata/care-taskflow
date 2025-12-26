// ============================================
// TaskService - 実API実装
// ============================================
// バックエンドAPI統合（スライス2: 課題管理）

import { apiClient } from '@/lib/apiClient';
import type {
  Task,
  TaskListResponse,
  TaskDetailResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilter,
  TaskSort,
  TaskPagination,
} from '@/types';
import { logger } from '@/lib/logger';

export class TaskService {
  /**
   * 課題一覧取得
   * GET /api/tasks
   */
  async getList(filter?: TaskFilter, sort?: TaskSort, pagination?: TaskPagination): Promise<TaskListResponse> {
    logger.debug('Fetching task list', { filter, sort, pagination });

    try {
      // クエリパラメータを構築
      const params = new URLSearchParams();

      if (filter?.category) {
        params.append('category', filter.category);
      }
      if (filter?.status) {
        params.append('status', filter.status);
      }
      if (filter?.assignee) {
        params.append('assignee', filter.assignee);
      }

      if (sort?.sortBy) {
        params.append('sortBy', sort.sortBy);
      }
      if (sort?.sortOrder) {
        params.append('sortOrder', sort.sortOrder);
      }

      if (pagination?.limit !== undefined) {
        params.append('limit', pagination.limit.toString());
      }
      if (pagination?.offset !== undefined) {
        params.append('offset', pagination.offset.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/tasks?${queryString}` : '/api/tasks';

      const response = await apiClient.get<TaskListResponse>(endpoint);

      logger.info('Task list fetched successfully', { count: response.tasks.length, total: response.total });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch task list', { error: error.message });
      throw error;
    }
  }

  /**
   * 課題詳細取得
   * GET /api/tasks/:id
   */
  async getDetail(id: string): Promise<TaskDetailResponse> {
    logger.debug('Fetching task detail', { taskId: id });

    try {
      const response = await apiClient.get<TaskDetailResponse>(`/api/tasks/${id}`);

      logger.info('Task detail fetched successfully', { taskId: id });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch task detail', { error: error.message, taskId: id });
      throw error;
    }
  }

  /**
   * 課題作成
   * POST /api/tasks
   */
  async create(data: TaskCreateRequest): Promise<Task> {
    logger.debug('Creating new task', { category: data.category });

    try {
      const response = await apiClient.post<{ task: Task }>('/api/tasks', data);

      logger.info('Task created successfully', { taskId: response.task.id });
      return response.task;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to create task', { error: error.message, data });
      throw error;
    }
  }

  /**
   * 課題更新
   * PUT /api/tasks/:id
   */
  async update(id: string, data: TaskUpdateRequest): Promise<Task> {
    logger.debug('Updating task', { taskId: id });

    try {
      const response = await apiClient.put<{ task: Task }>(`/api/tasks/${id}`, data);

      logger.info('Task updated successfully', { taskId: id });
      return response.task;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update task', { error: error.message, taskId: id });
      throw error;
    }
  }

  /**
   * 課題削除
   * DELETE /api/tasks/:id
   */
  async delete(id: string): Promise<void> {
    logger.debug('Deleting task', { taskId: id });

    try {
      await apiClient.delete<void>(`/api/tasks/${id}`);

      logger.info('Task deleted successfully', { taskId: id });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete task', { error: error.message, taskId: id });
      throw error;
    }
  }
}
