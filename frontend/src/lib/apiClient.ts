// ============================================
// APIクライアント - 実API呼び出し
// ============================================

import { logger } from '@/lib/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8432';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 汎用APIリクエストメソッド
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // デフォルトヘッダー
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 既存のヘッダーをマージ
    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // 認証トークンの追加
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      logger.debug('API Request', { url, method: config.method || 'GET' });

      const response = await fetch(url, config);

      // レスポンスのステータスチェック
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: response.statusText,
        }));

        logger.error('API Error', {
          url,
          status: response.status,
          error: errorData,
        });

        // 401エラー（認証エラー）の場合、ログインページにリダイレクト
        if (response.status === 401) {
          logger.warn('認証エラー検出: ログインページにリダイレクトします');
          // トークンをクリア
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');

          // ユーザーに通知（リダイレクト前に表示）
          const errorMessage = errorData.message || '認証の有効期限が切れました。再度ログインしてください。';

          // セッションストレージにエラーメッセージを保存（ログインページで表示用）
          sessionStorage.setItem('auth_error', errorMessage);

          // ログインページにリダイレクト
          window.location.href = '/login';
          throw new Error(errorMessage);
        }

        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      // 204 No Contentの場合
      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();
      logger.debug('API Response', { url, data });

      return data as T;
    } catch (error) {
      logger.error('API Request Failed', { url, error });
      throw error;
    }
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POSTリクエスト
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUTリクエスト
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// デフォルトインスタンス
export const apiClient = new ApiClient();

// ============================================
// Phase 12: タグクラウド機能 API
// ============================================

/**
 * 全タグを取得
 */
export async function getAllTags(searchQuery?: string): Promise<{ tags: import('@/types').Tag[] }> {
  const endpoint = searchQuery ? `/api/tags?q=${encodeURIComponent(searchQuery)}` : '/api/tags';
  return apiClient.get(endpoint);
}

/**
 * 課題にタグを追加
 */
export async function addTagToTask(taskId: string, tagName: string): Promise<{ tag: import('@/types').Tag }> {
  return apiClient.post(`/api/tasks/${taskId}/tags`, { name: tagName });
}

/**
 * 課題からタグを削除
 */
export async function removeTagFromTask(taskId: string, tagId: string): Promise<void> {
  return apiClient.delete(`/api/tasks/${taskId}/tags/${tagId}`);
}

// ============================================
// Phase 12: コメント機能 API
// ============================================

/**
 * 課題のコメント一覧を取得
 */
export async function getTaskComments(taskId: string): Promise<{ comments: import('@/types').Comment[] }> {
  return apiClient.get(`/api/tasks/${taskId}/comments`);
}

/**
 * 課題にコメントを投稿
 */
export async function createComment(taskId: string, content: string): Promise<{ comment: import('@/types').Comment }> {
  return apiClient.post(`/api/tasks/${taskId}/comments`, { content });
}

// ============================================
// Phase 12: 重要度×緊急度マトリクス API
// ============================================

/**
 * マトリクスデータを取得
 */
export async function getMatrixData(): Promise<import('@/types').MatrixResponse> {
  return apiClient.get('/api/dashboard/matrix');
}
