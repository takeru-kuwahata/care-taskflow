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
