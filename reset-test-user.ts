import { db } from './api/db/index.js';
import { users } from './api/db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from './api/utils/password.js';

async function resetTestUser() {
  const email = 'test@example.com';
  const password = 'TestPass2025!';

  console.log('[RESET] Resetting test user...');
  console.log('[RESET] Email:', email);
  console.log('[RESET] Password:', password);

  try {
    // 既存のtest@example.comを削除
    const deleted = await db
      .delete(users)
      .where(eq(users.email, email))
      .returning();

    if (deleted.length > 0) {
      console.log('[RESET] Deleted existing user:', deleted[0].id);
    } else {
      console.log('[RESET] No existing user found');
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password);
    console.log('[RESET] Password hash:', passwordHash.substring(0, 20) + '...');

    // 新しいユーザーを作成
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const result = await db
      .insert(users)
      .values({
        id: userId,
        email,
        passwordHash,
      })
      .returning();

    console.log('[RESET] Created new user:', result[0].id);
    console.log('[RESET] Email:', result[0].email);
    console.log('[RESET] Created at:', result[0].createdAt);

    console.log('\n[RESET] ✅ Test user reset complete!');
    console.log('[RESET] You can now login with:');
    console.log('[RESET]   Email:', email);
    console.log('[RESET]   Password:', password);
  } catch (error) {
    console.error('[RESET] Failed:', error);
    process.exit(1);
  }
}

resetTestUser();
