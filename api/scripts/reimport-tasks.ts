import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tasks, causes, actions, assignees } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL環境変数が設定されていません');
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const DEFAULT_USER_ID = 'system-user-import';

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
  if (normalized.includes('移行')) return 'transition';
  if (normalized.includes('レスパイト')) return 'respite';
  if (normalized.includes('福祉')) return 'welfare';
  if (normalized.includes('保育') || normalized.includes('幼稚園')) return 'nursery';
  if (normalized.includes('学校')) return 'school';
  if (normalized.includes('在宅')) return 'home_life';
  return 'other';
}

async function main() {
  console.log('=== Excelデータを完全再インポート ===\n');

  const rawData = JSON.parse(
    readFileSync(join(__dirname, '../../data/tasks-formatted.json'), 'utf-8')
  );

  const validTasks = rawData.filter((row: any) => row.issue);
  console.log(`有効なタスク数: ${validTasks.length}\n`);

  let updated = 0;
  let created = 0;

  for (const row of validTasks) {
    try {
      const taskNumber = row.id;
      const taskId = `task-${taskNumber}`;

      // 既存チェック
      const existing = await db.select().from(tasks).where(eq(tasks.taskNumber, taskNumber)).limit(1);

      const taskData: any = {
        category: normalizeCategory(row.category),
        problem: row.issue,
        status: convertProgressToStatus(row.progress),
        relatedBusiness: row.relatedProject || null,
        businessContent: row.projectContent || null,
        organization: row.department || null,
        importance: convertToLevel(row.importance),
        urgency: convertToLevel(row.urgency),
        createdBy: DEFAULT_USER_ID,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // 更新
        const existingId = existing[0].id;
        await db.update(tasks).set(taskData).where(eq(tasks.id, existingId));

        // 関連データ更新
        await db.delete(causes).where(eq(causes.taskId, existingId));
        await db.delete(actions).where(eq(actions.taskId, existingId));
        await db.delete(assignees).where(eq(assignees.taskId, existingId));

        if (row.cause) {
          await db.insert(causes).values({ id: `cause-${existingId}-${Date.now()}`, taskId: existingId, cause: row.cause });
        }
        if (row.action) {
          await db.insert(actions).values({ id: `action-${existingId}-${Date.now()}`, taskId: existingId, action: row.action });
        }
        if (row.assignee) {
          await db.insert(assignees).values({ id: `assignee-${existingId}-${Date.now()}`, taskId: existingId, name: row.assignee, organization: row.department });
        }

        console.log(`✓ ${taskNumber}: 更新 (重要=${taskData.importance}, 緊急=${taskData.urgency})`);
        updated++;
      } else {
        // 新規作成
        taskData.id = taskId;
        await db.insert(tasks).values(taskData);

        if (row.cause) {
          await db.insert(causes).values({ id: `cause-${taskId}-1`, taskId, cause: row.cause });
        }
        if (row.action) {
          await db.insert(actions).values({ id: `action-${taskId}-1`, taskId, action: row.action });
        }
        if (row.assignee) {
          await db.insert(assignees).values({ id: `assignee-${taskId}-1`, taskId, name: row.assignee, organization: row.department });
        }

        console.log(`✓ ${taskNumber}: 新規作成 (重要=${taskData.importance}, 緊急=${taskData.urgency})`);
        created++;
      }
    } catch (error: any) {
      console.error(`✗ タスク ${row.id} 失敗:`, error.message);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${updated}件, 新規: ${created}件`);

  // 統計
  const all = await db.select().from(tasks);
  const withI = all.filter(t => t.importance);
  const withU = all.filter(t => t.urgency);
  console.log(`\n全タスク: ${all.length}, 重要度あり: ${withI.length}, 緊急度あり: ${withU.length}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
