import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tasks } from '../api/db/schema.js';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL環境変数が設定されていません');
}

const connection = neon(DATABASE_URL);
const db = drizzle(connection);

async function main() {
  console.log('=== データベースのデータを確認します ===\n');

  // 全タスク数
  const allTasks = await db.select().from(tasks);
  console.log(`全タスク数: ${allTasks.length}`);

  // 重要度が設定されているタスク数
  const tasksWithImportance = allTasks.filter(t => t.importance !== null);
  console.log(`重要度が設定されているタスク数: ${tasksWithImportance.length}`);

  // 緊急度が設定されているタスク数
  const tasksWithUrgency = allTasks.filter(t => t.urgency !== null);
  console.log(`緊急度が設定されているタスク数: ${tasksWithUrgency.length}`);

  // サンプル表示（最初の5件）
  console.log('\n=== サンプルデータ（最初の5件） ===');
  allTasks.slice(0, 5).forEach(task => {
    console.log(`\nタスク ${task.taskNumber}:`);
    console.log(`  問題点: ${task.problem}`);
    console.log(`  重要度: ${task.importance || '未設定'}`);
    console.log(`  緊急度: ${task.urgency || '未設定'}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });
