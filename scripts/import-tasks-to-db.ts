import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tasks, causes, actions, assignees } from '../api/db/schema.js';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数の読み込み
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL環境変数が設定されていません');
}

// データベース接続
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// デフォルトのユーザーID（実際の環境に合わせて調整してください）
const DEFAULT_USER_ID = 'system';

// 緊急度・重要度の数値を文字列に変換
function convertToLevel(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 3) return 'high';
  if (value === 2) return 'medium';
  if (value === 1) return 'low';
  return null;
}

// 進捗記号をステータスに変換
function convertProgressToStatus(progress: string | null): string {
  if (!progress) return 'not_started';
  const symbol = progress.trim();
  if (symbol === '○' || symbol === '◎') return 'completed';
  if (symbol === '△' || symbol === '▲') return 'in_progress';
  return 'not_started';
}

// カテゴリを正規化
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
  console.log('=== データベースへのインポートを開始します ===\n');

  // JSONファイル読み込み
  const rawData = JSON.parse(
    readFileSync(join(__dirname, '../data/tasks-formatted.json'), 'utf-8')
  );

  console.log(`読み込んだデータ数: ${rawData.length}\n`);

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rawData) {
    try {
      // issueがnullの場合はスキップ（枝番データ）
      if (!row.issue) {
        skippedCount++;
        continue;
      }

      const taskNumber = row.id;
      const taskId = `task-${taskNumber}`;

      // 既存のタスクを確認
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.taskNumber, taskNumber))
        .limit(1);

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

      if (existingTasks.length > 0) {
        // 既存データを更新（IDは変更しない）
        const existingTaskId = existingTasks[0].id;

        await db
          .update(tasks)
          .set({
            category: taskData.category,
            problem: taskData.problem,
            status: taskData.status,
            relatedBusiness: taskData.relatedBusiness,
            businessContent: taskData.businessContent,
            organization: taskData.organization,
            importance: taskData.importance,
            urgency: taskData.urgency,
            updatedAt: new Date(),
          })
          .where(eq(tasks.taskNumber, taskNumber));

        console.log(`✓ タスク ${taskNumber} を更新しました`);
        updatedCount++;

        // 関連データを削除して再作成（既存のIDを使用）
        await db.delete(causes).where(eq(causes.taskId, existingTaskId));
        await db.delete(actions).where(eq(actions.taskId, existingTaskId));
        await db.delete(assignees).where(eq(assignees.taskId, existingTaskId));

        // 関連データの挿入時も既存IDを使用
        if (row.cause) {
          await db.insert(causes).values({
            id: `cause-${existingTaskId}-1`,
            taskId: existingTaskId,
            cause: row.cause,
          });
        }

        if (row.action) {
          await db.insert(actions).values({
            id: `action-${existingTaskId}-1`,
            taskId: existingTaskId,
            action: row.action,
          });
        }

        if (row.assignee) {
          await db.insert(assignees).values({
            id: `assignee-${existingTaskId}-1`,
            taskId: existingTaskId,
            name: row.assignee,
            organization: row.department,
          });
        }

        continue; // 次のタスクへ
      } else {
        // 新規作成
        await db.insert(tasks).values(taskData);
        console.log(`✓ タスク ${taskNumber} を作成しました`);
        importedCount++;
      }

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
      console.error(`✗ タスク ${row.id} のインポートに失敗しました:`, error);
    }
  }

  console.log('\n=== インポート完了 ===');
  console.log(`新規作成: ${importedCount}件`);
  console.log(`更新: ${updatedCount}件`);
  console.log(`スキップ: ${skippedCount}件`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });
