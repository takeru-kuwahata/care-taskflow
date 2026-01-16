import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tasks, causes, actions, assignees } from '../api/db/schema.js';
import { eq, sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL環境変数が設定されていません');
}

const connection = neon(DATABASE_URL);
const db = drizzle(connection);

const DEFAULT_USER_ID = 'system';

function convertToLevel(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  if (value >= 3) return 'high';
  if (value === 2) return 'medium';
  if (value === 1) return 'low';
  return null;
}

function convertProgressToStatus(progress: string | null): string {
  if (!progress) return 'not_started';
  const symbol = progress.trim();
  if (symbol === '○' || symbol === '◎') return 'completed';
  if (symbol === '△' || symbol === '▲') return 'in_progress';
  return 'not_started';
}

function normalizeCategory(category: string | null): string {
  if (!category) return 'other';
  const normalized = category.toLowerCase().trim();
  if (normalized.includes('移行') || normalized.includes('transition')) return 'transition';
  if (normalized.includes('レスパイト') || normalized.includes('respite')) return 'respite';
  if (normalized.includes('福祉') || normalized.includes('welfare')) return 'welfare';
  if (normalized.includes('保育') || normalized.includes('幼稚園') || normalized.includes('nursery')) return 'nursery';
  if (normalized.includes('学校') || normalized.includes('school')) return 'school';
  if (normalized.includes('在宅') || normalized.includes('home')) return 'home_life';
  return 'other';
}

async function main() {
  console.log('=== 全タスクを削除して再インポートします ===\n');

  const rawData = JSON.parse(
    readFileSync(join(__dirname, '../data/tasks-formatted.json'), 'utf-8')
  );

  // issueがあるタスクのみをインポート対象とする
  const validTasks = rawData.filter((row: any) => row.issue);

  console.log(`インポート対象タスク数: ${validTasks.length}\n`);

  // 既存の全タスクを削除
  console.log('既存タスクを削除中...');
  await db.delete(tasks);
  console.log('削除完了\n');

  let importedCount = 0;

  for (const row of validTasks) {
    try {
      const taskNumber = row.id;
      const taskId = `task-${taskNumber}`;

      const taskData = {
        id: taskId,
        category: normalizeCategory(row.category),
        problem: row.issue,
        status: convertProgressToStatus(row.progress),
        relatedBusiness: row.relatedProject,
        businessContent: row.projectContent,
        organization: row.department,
        importance: convertToLevel(row.importance),
        urgency: convertToLevel(row.urgency),
        createdBy: DEFAULT_USER_ID,
      };

      // 新規作成
      await db.insert(tasks).values(taskData);

      console.log(`✓ タスク ${taskNumber} を作成 (重要度: ${taskData.importance}, 緊急度: ${taskData.urgency})`);
      importedCount++;

      // 原因を登録
      if (row.cause) {
        await db.insert(causes).values({
          id: `cause-${taskId}-1`,
          taskId,
          cause: row.cause,
        });
      }

      // 対応案を登録
      if (row.action) {
        await db.insert(actions).values({
          id: `action-${taskId}-1`,
          taskId,
          action: row.action,
        });
      }

      // 対応者を登録
      if (row.assignee) {
        await db.insert(assignees).values({
          id: `assignee-${taskId}-1`,
          taskId,
          name: row.assignee,
          organization: row.department,
        });
      }
    } catch (error) {
      console.error(`✗ タスク ${row.id} のインポートに失敗:`, error);
    }
  }

  console.log('\n=== インポート完了 ===');
  console.log(`新規作成: ${importedCount}件`);

  // 統計確認
  const allTasks = await db.select().from(tasks);
  const withImportance = allTasks.filter(t => t.importance !== null);
  const withUrgency = allTasks.filter(t => t.urgency !== null);

  console.log(`\n=== 統計 ===`);
  console.log(`全タスク数: ${allTasks.length}`);
  console.log(`重要度が設定されているタスク: ${withImportance.length}`);
  console.log(`緊急度が設定されているタスク: ${withUrgency.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });
