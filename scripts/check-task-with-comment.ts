import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkTask() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Get a task with comments
  const result = await client.query(`
    SELECT t.id, t.task_number, t.problem, c.content as comment
    FROM tasks t
    LEFT JOIN comments c ON t.id = c.task_id
    WHERE c.content IS NOT NULL
    LIMIT 1
  `);

  if (result.rows.length > 0) {
    console.log(JSON.stringify(result.rows[0], null, 2));
  } else {
    console.log('No tasks with comments found');
  }

  await client.end();
}

checkTask().catch(console.error);
