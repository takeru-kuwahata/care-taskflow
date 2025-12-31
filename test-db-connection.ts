import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './api/db/index.js';
import { users } from './api/db/schema.js';
import { eq } from 'drizzle-orm';

async function testConnection() {
  console.log('[TEST] DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
  console.log('[TEST] Testing database connection...');
  
  try {
    // データベースからユーザーを取得
    const allUsers = await db.select().from(users);
    console.log('[TEST] Database connection successful!');
    console.log('[TEST] Total users in database:', allUsers.length);
    
    if (allUsers.length > 0) {
      console.log('[TEST] Users:', allUsers.map(u => ({ 
        id: u.id, 
        email: u.email,
        hasPassword: !!u.passwordHash,
        passwordHashLength: u.passwordHash?.length || 0
      })));
      
      // test@example.com があるか確認
      const testUser = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test@example.com'))
        .limit(1);
      
      if (testUser.length > 0) {
        console.log('[TEST] test@example.com found!');
        console.log('[TEST] User details:', {
          id: testUser[0].id,
          email: testUser[0].email,
          passwordHash: testUser[0].passwordHash?.substring(0, 20) + '...',
          createdAt: testUser[0].createdAt,
          updatedAt: testUser[0].updatedAt,
        });
      } else {
        console.log('[TEST] test@example.com NOT found in database');
      }
    }
  } catch (error) {
    console.error('[TEST] Database connection FAILED:', error);
    process.exit(1);
  }
}

testConnection();
