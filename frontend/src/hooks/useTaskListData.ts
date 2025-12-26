// ============================================
// useTaskListData - カスタムフック
// ============================================
// TaskListページのデータ取得・管理

import { useState, useEffect } from 'react';
import { TaskService } from '@/services/TaskService';
import type { TaskListResponse, TaskFilter, TaskSort, TaskPagination } from '@/types';
import { logger } from '@/lib/logger';

const service = new TaskService();

export const useTaskListData = () => {
  const [data, setData] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [sort, setSort] = useState<TaskSort>({});
  const [pagination, setPagination] = useState<TaskPagination>({ limit: 20, offset: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      logger.debug('Fetching task list data', { hookName: 'useTaskListData', filter, sort, pagination });

      const result = await service.getList(filter, sort, pagination);
      setData(result);

      logger.info('Task list data fetched successfully', {
        count: result.tasks.length,
        total: result.total,
        hookName: 'useTaskListData',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch task list data', {
        error: error.message,
        hookName: 'useTaskListData',
      });
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.debug('Hook mounted or filter/sort/pagination changed', { hookName: 'useTaskListData' });
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort, pagination]);

  const updateFilter = (newFilter: Partial<TaskFilter>) => {
    logger.debug('Updating filter', { newFilter });
    setFilter((prev: TaskFilter) => ({ ...prev, ...newFilter }));
    // フィルター変更時はページを1ページ目にリセット
    setPagination({ ...pagination, offset: 0 });
  };

  const clearFilter = () => {
    logger.debug('Clearing filter');
    setFilter({});
    setPagination({ ...pagination, offset: 0 });
  };

  const updateSort = (newSort: TaskSort) => {
    logger.debug('Updating sort', { newSort });
    setSort(newSort);
  };

  const updatePagination = (newPagination: Partial<TaskPagination>) => {
    logger.debug('Updating pagination', { newPagination });
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const setPage = (page: number) => {
    const offset = (page - 1) * (pagination.limit || 20);
    updatePagination({ offset });
  };

  const setPageSize = (limit: number) => {
    updatePagination({ limit, offset: 0 });
  };

  return {
    data,
    loading,
    error,
    filter,
    sort,
    pagination,
    refetch: fetchData,
    updateFilter,
    clearFilter,
    updateSort,
    updatePagination,
    setPage,
    setPageSize,
  };
};
