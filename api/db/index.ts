import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * データベース接続とクエリクライアント
 */

// .env.localをロード（開発環境用）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env.local') });

// 環境変数からDATABASE_URLを取得
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL環境変数が設定されていません');
}

// Neon接続プールを作成
const sql = neon(databaseUrl);

// Drizzle ORMクライアントを作成
export const db = drizzle(sql, { schema });

/**
 * データベース接続をテスト
 * @returns 接続が成功した場合はtrue
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
