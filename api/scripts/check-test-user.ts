/**
 * テストユーザー存在確認スクリプト
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM用の__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.localを読み込み（プロジェクトルートから）
const envPath = resolve(__dirname, '../../.env.local');
console.log('環境変数ファイルパス:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('環境変数の読み込みに失敗:', result.error);
  process.exit(1);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '存在する' : '存在しない');

import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function checkTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'TestPass2025!';

    console.log('テストユーザー確認中...');
    console.log(`Email: ${email}`);

    // テストユーザーを検索
    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) {
      console.log('\n❌ テストユーザーが存在しません');
      console.log('   → テストユーザーを作成する必要があります');
      process.exit(1);
    } else {
      console.log('\n✅ テストユーザーが存在します');
      console.log('   ユーザー情報:');
      console.log('   - ID:', result[0].id);
      console.log('   - Email:', result[0].email);
      console.log('   - Created:', result[0].createdAt);

      // パスワードハッシュの検証
      const isPasswordValid = await bcrypt.compare(password, result[0].passwordHash);

      if (isPasswordValid) {
        console.log('\n✅ パスワードが正しいです');
        process.exit(0);
      } else {
        console.log('\n❌ パスワードが一致しません');
        console.log('   → パスワードハッシュを確認してください');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('\nエラー:', error);
    process.exit(1);
  }
}

checkTestUser();
