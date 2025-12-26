#!/usr/bin/env tsx

/**
 * テストユーザー作成スクリプト
 * test@example.com / TestPass2025! をDBに直接作成
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// .env.localをプロジェクトルートから読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL環境変数が設定されていません');
  process.exit(1);
}

async function createTestUser() {
  const sql = neon(DATABASE_URL!);

  const email = 'test@example.com';
  const password = 'TestPass2025!';
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // 既存のテストユーザーを削除
    console.log(`🔍 既存のテストユーザー ${email} を削除中...`);
    await sql`DELETE FROM users WHERE email = ${email}`;

    // テストユーザーを作成
    console.log(`📝 テストユーザー ${email} を作成中...`);
    const result = await sql`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (${userId}, ${email}, ${passwordHash}, NOW(), NOW())
      RETURNING id, email, created_at
    `;

    console.log('✅ テストユーザー作成完了:');
    console.log(JSON.stringify(result[0], null, 2));
    console.log('\n🔐 ログイン情報:');
    console.log(`メールアドレス: ${email}`);
    console.log(`パスワード: ${password}`);

    // 検証: ログイン可能か確認
    console.log('\n🔍 検証: パスワードが正しくハッシュ化されているか確認中...');
    const verifyResult = await sql`SELECT password_hash FROM users WHERE email = ${email}`;
    const storedHash = verifyResult[0]?.password_hash || verifyResult[0]?.passwordHash;

    if (!storedHash) {
      console.error('❌ パスワードハッシュが取得できませんでした');
      console.log('取得結果:', JSON.stringify(verifyResult[0], null, 2));
      process.exit(1);
    }

    const isPasswordValid = await bcrypt.compare(password, storedHash);

    if (isPasswordValid) {
      console.log('✅ パスワード検証成功: ログイン可能です');
    } else {
      console.error('❌ パスワード検証失敗: ログインできない可能性があります');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ テストユーザー作成エラー:', error);
    process.exit(1);
  }
}

createTestUser();
