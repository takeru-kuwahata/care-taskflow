import XLSX from 'xlsx';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// .env.localを読み込む
dotenv.config({ path: '.env.local' });

const EXCEL_PATH = '/Users/kuwahatatakeru/医療DW Dropbox/21_AI/IKEA-KANAGAWA/docs/医療的ケア児等支援に係る課題管理表.xlsx';

// カテゴリマッピング
const CATEGORY_MAP: Record<string, string> = {
  '３　成人移行': 'transition',
  '４　レスパイト': 'respite',
  '５　福祉サービス': 'welfare',
  '８　保育園・幼稚園': 'nursery',
  '９　学校': 'school',
  '10　在宅生活': 'home_life',
  '11　その他': 'other',
};

// ステータスマッピング
const STATUS_MAP: Record<string, string> = {
  '○': 'completed',
  '〇': 'completed',
  '◎': 'completed',
  '△': 'in_progress',
  '▲': 'in_progress',
  '': 'not_started',
};

// 緊急度・重要度の変換
function convertToLevel(value: number | string | undefined): string | null {
  if (!value) return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return null;
  if (num >= 3) return 'high';
  if (num === 2) return 'medium';
  if (num === 1) return 'low';
  return null;
}

async function importAllTasks() {
  console.log('=== Excel全課題インポート開始 ===\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URLが設定されていません');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('データベースに接続しました\n');

  // システムユーザー確認
  const systemUserResult = await client.query(
    "SELECT id FROM users WHERE email LIKE 'system%' LIMIT 1"
  );
  const systemUserId = systemUserResult.rows[0]?.id || 'system-user-import';

  // Excelファイルを読み込む
  console.log('Excelファイルを読み込んでいます...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const ws = workbook.Sheets['1222_取りまとめ'];

  // ヘッダー付きで読み込み（行番号ベース）
  const allData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // 6行目から開始（index 5）
  const dataRows = allData.slice(5).filter(row => row[0] && typeof row[0] === 'number');

  console.log(`総データ数: ${dataRows.length}件\n`);

  // 既存データを削除
  console.log('既存データを削除しています...');
  await client.query('DELETE FROM assignees');
  await client.query('DELETE FROM actions');
  await client.query('DELETE FROM causes');
  await client.query('DELETE FROM comments');
  await client.query('DELETE FROM tasks');
  await client.query('ALTER SEQUENCE tasks_task_number_seq RESTART WITH 1');
  console.log('既存データを削除しました\n');

  let importedCount = 0;
  let skippedCount = 0;
  let lastCategory: string | null = null; // 直前のカテゴリを保持
  let lastProblem: string | null = null; // 直前の問題点を保持

  for (const row of dataRows) {
    try {
      const taskNumber = row[0]; // 項番
      const categoryRaw = row[2]; // 項目（カテゴリ）
      const problemRaw = row[3]; // 問題点

      // カテゴリがある場合は更新、ない場合は直前のカテゴリを継承
      if (categoryRaw && categoryRaw.trim()) {
        lastCategory = categoryRaw.trim();
      }

      // 問題点がある場合は更新、ない場合は直前の問題点を継承
      if (problemRaw && problemRaw.trim()) {
        lastProblem = problemRaw.trim();
      }

      const category = lastCategory;
      const problem = lastProblem || `課題${taskNumber}`; // 列3: ②問題点（継承または課題X）
      const urgency = row[4]; // 列4: 緊急度
      const importance = row[5]; // 列5: 重要度
      const comment = row[7]; // 列7 (Excel I列): コメント
      const cause = row[8]; // 列8 (Excel J列): ③原因
      const action = row[9]; // 列9 (Excel K列): ④対応案
      const progress = row[10]; // 列10 (Excel L列): ⑤進捗
      const statusText = row[11]; // 列11 (Excel M列): ⑥対応状況
      const assignee = row[12]; // 列12 (Excel N列): ⑦対応者
      const relatedBusiness = row[13]; // 列13 (Excel O列): 関連事業
      const businessContent = row[14]; // 列14 (Excel P列): 事業内容
      const organization = row[15]; // 列15 (Excel Q列): 該当所属

      // カテゴリがない場合はスキップ
      if (!category || !CATEGORY_MAP[category.trim()]) {
        console.log(`⚠ 項番 ${taskNumber} はカテゴリがないためスキップします`);
        skippedCount++;
        continue;
      }

      // ステータス決定
      let status = 'not_started';
      if (progress && STATUS_MAP[progress.trim()]) {
        status = STATUS_MAP[progress.trim()];
      } else if (statusText) {
        status = 'in_progress';
      }

      // 課題を作成
      const taskId = uuidv4();
      await client.query(`
        INSERT INTO tasks (
          id, category, problem, status,
          related_business, business_content, organization,
          importance, urgency,
          created_at, updated_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10)
      `, [
        taskId,
        CATEGORY_MAP[category.trim()],
        problem.trim() || `課題${taskNumber}`,
        status,
        relatedBusiness?.trim() || null,
        businessContent?.trim() || null,
        organization?.trim() || null,
        convertToLevel(importance),
        convertToLevel(urgency),
        systemUserId
      ]);

      // 原因を作成
      if (cause && cause.trim()) {
        await client.query(`
          INSERT INTO causes (id, task_id, cause, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [uuidv4(), taskId, cause.trim()]);
      }

      // 対応案を作成
      if (action && action.trim()) {
        await client.query(`
          INSERT INTO actions (id, task_id, action, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [uuidv4(), taskId, action.trim()]);
      }

      // 対応者を作成
      if (assignee && assignee.trim()) {
        const assigneeNames = assignee.split('\n').map(name => name.trim()).filter(name => name);
        for (const name of assigneeNames) {
          await client.query(`
            INSERT INTO assignees (id, task_id, name, organization, created_at)
            VALUES ($1, $2, $3, $4, NOW())
          `, [uuidv4(), taskId, name, organization?.trim() || null]);
        }
      }

      // コメントを作成
      if (comment && comment.trim()) {
        await client.query(`
          INSERT INTO comments (id, task_id, user_id, content, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [uuidv4(), taskId, systemUserId, comment.trim()]);
      }

      importedCount++;
      if (importedCount % 20 === 0) {
        console.log(`${importedCount}件インポート完了...`);
      }

    } catch (error) {
      console.error(`✗ 項番 ${row[0]} のインポートに失敗しました:`, error);
      skippedCount++;
    }
  }

  console.log(`\n=== インポート完了 ===`);
  console.log(`インポート成功: ${importedCount}件`);
  console.log(`スキップ: ${skippedCount}件`);

  // カテゴリ別件数を確認
  console.log('\n=== カテゴリ別件数 ===');
  const result = await client.query(`
    SELECT category, COUNT(*) as count
    FROM tasks
    GROUP BY category
    ORDER BY category
  `);

  for (const row of result.rows) {
    const categoryLabel = Object.entries(CATEGORY_MAP).find(([_, value]) => value === row.category)?.[0] || row.category;
    console.log(`${categoryLabel}: ${row.count}件`);
  }

  await client.end();
  console.log('\nデータベース接続を切断しました');
}

importAllTasks().catch(error => {
  console.error('インポートエラー:', error);
  process.exit(1);
});
