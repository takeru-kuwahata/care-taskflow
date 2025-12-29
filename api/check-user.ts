import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const user = await db.select().from(users).where(eq(users.email, 'kuwahata@mdc-japan.org'));
console.log('ユーザー情報:', JSON.stringify(user, null, 2));
