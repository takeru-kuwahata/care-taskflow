import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env.localファイルを読み込み
dotenv.config({ path: resolve(__dirname, '../.env.local') });

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
