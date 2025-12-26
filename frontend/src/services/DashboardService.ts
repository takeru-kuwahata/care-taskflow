// ============================================
// DashboardService - ダッシュボード実API実装
// ============================================

import { apiClient } from '@/lib/apiClient';
import type { DashboardStatsResponse } from '@/types';
import { logger } from '@/lib/logger';

export class DashboardService {
  /**
   * ダッシュボード統計取得
   * GET /api/dashboard/stats
   */
  async getStats(): Promise<DashboardStatsResponse> {
    logger.debug('Fetching dashboard stats');

    try {
      const response = await apiClient.get<DashboardStatsResponse>('/api/dashboard/stats');

      logger.info('Dashboard stats fetched successfully', {
        totalTasks: response.summary.totalTasks,
        completionRate: response.summary.completionRate,
      });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch dashboard stats', { error: error.message });
      throw error;
    }
  }
}
