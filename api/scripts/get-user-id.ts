import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../db/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL required');

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const allUsers = await db.select().from(users);
console.log('既存ユーザー:');
allUsers.forEach(u => console.log(`  ID: ${u.id}, Email: ${u.email}`));

if (allUsers.length > 0) {
  console.log(`\n最初のユーザーIDを使用: ${allUsers[0].id}`);
}
