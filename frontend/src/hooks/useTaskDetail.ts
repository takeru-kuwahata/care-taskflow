// ============================================
// useTaskDetail - カスタムフック
// ============================================
// TaskDetailページで使用するカスタムフック

import { useState, useEffect } from 'react';
import { TaskService } from '@/services/TaskService';
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '@/types';
import { logger } from '@/lib/logger';

const service = new TaskService();

export const useTaskDetail = (taskId?: string) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTask = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Fetching task', { taskId: id, hookName: 'useTaskDetail' });

      const result = await service.getDetail(id);
      setTask(result.task);

      logger.info('Task fetched successfully', {
        taskId: id,
        hookName: 'useTaskDetail',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch task', {
        error: error.message,
        taskId: id,
        hookName: 'useTaskDetail',
      });
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      logger.debug('Hook mounted with taskId', { taskId, hookName: 'useTaskDetail' });
      fetchTask(taskId);
    } else {
      logger.debug('Hook mounted without taskId (new mode)', { hookName: 'useTaskDetail' });
      setTask(null);
      setLoading(false);
    }
  }, [taskId]);

  const createTask = async (data: TaskCreateRequest): Promise<Task> => {
    try {
      logger.debug('Creating task', { category: data.category, hookName: 'useTaskDetail' });
      const newTask = await service.create(data);

      logger.info('Task created successfully', {
        taskId: newTask.id,
        hookName: 'useTaskDetail',
      });

      return newTask;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to create task', {
        error: error.message,
        hookName: 'useTaskDetail',
      });
      throw error;
    }
  };

  const updateTask = async (id: string, data: TaskUpdateRequest): Promise<Task> => {
    try {
      logger.debug('Updating task', { taskId: id, hookName: 'useTaskDetail' });
      const updatedTask = await service.update(id, data);
      setTask(updatedTask);

      logger.info('Task updated successfully', {
        taskId: id,
        hookName: 'useTaskDetail',
      });

      return updatedTask;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update task', {
        error: error.message,
        taskId: id,
        hookName: 'useTaskDetail',
      });
      throw error;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      logger.debug('Deleting task', { taskId: id, hookName: 'useTaskDetail' });
      await service.delete(id);

      logger.info('Task deleted successfully', {
        taskId: id,
        hookName: 'useTaskDetail',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete task', {
        error: error.message,
        taskId: id,
        hookName: 'useTaskDetail',
      });
      throw error;
    }
  };

  return {
    task,
    loading,
    error,
    refetch: taskId ? () => fetchTask(taskId) : undefined,
    createTask,
    updateTask,
    deleteTask,
  };
};
