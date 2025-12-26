import XLSX from 'xlsx';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// .env.localを読み込む
dotenv.config({ path: '.env.local' });

const EXCEL_PATH = '/Users/kuwahatatakeru/Downloads/医ケア児支援_課題管理表_桑畑編集_20251224.xlsx';

interface ExcelRow {
  '項番': number | string;
  '統合候補': string;
  '枝番': string;
  '項目': string; // カテゴリ
  '問題点': string;
  '原因': string;
  '対応案': string;
  '進捗': string;
  '対応状況': string;
  '対応者': string;
  '関連事業': string;
  '事業内容': string;
  '該当所属': string;
}

// カテゴリマッピング（Excel → システム）
const CATEGORY_MAP: Record<string, string> = {
  '３　成人移行': 'transition',
  '４　レスパイト': 'respite',
  '５　福祉サービス': 'welfare',
  '８　保育園・幼稚園': 'nursery',
  '９　学校': 'school',
  '10　在宅生活': 'home_life',
  '11　その他': 'other',
};

// 進捗マッピング（Excel → システム）
const STATUS_MAP: Record<string, string> = {
  '○': 'completed',
  '〇': 'completed',
  '△': 'in_progress',
  '': 'not_started',
};

async function importData() {
  console.log('=== Excelデータインポート開始 ===\n');

  // データベース接続
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URLが設定されていません');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  console.log('データベースに接続しました');

  // Excelファイルを読み込む
  console.log('Excelファイルを読み込んでいます...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = '課題一覧';
  const worksheet = workbook.Sheets[sheetName];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`総データ数: ${data.length}件\n`);

  // 有効なデータのみフィルタリング
  const validData = data.filter(row => {
    const category = row['項目']?.trim();
    return category && CATEGORY_MAP[category];
  });

  console.log(`有効なデータ数: ${validData.length}件\n`);

  // システムユーザーを作成（または既存のものを使用）
  const systemUserId = 'system-user-import';

  try {
    await client.query(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [systemUserId, 'system@care-taskflow.app', 'N/A']);
    console.log('システムユーザーを作成しました\n');
  } catch (error) {
    console.log('システムユーザーは既に存在します\n');
  }

  // 既存のデータを削除（クリーンインポート）
  console.log('既存のデータを削除しています...');
  await client.query('DELETE FROM assignees');
  await client.query('DELETE FROM actions');
  await client.query('DELETE FROM causes');
  await client.query('DELETE FROM tasks');
  await client.query('ALTER SEQUENCE tasks_task_number_seq RESTART WITH 1');
  console.log('既存のデータを削除しました\n');

  // データをインポート
  let importedCount = 0;
  let skippedCount = 0;

  for (const row of validData) {
    try {
      const category = CATEGORY_MAP[row['項目'].trim()];
      const problem = row['問題点']?.trim() || '';
      const causeText = row['原因']?.trim() || '';
      const actionText = row['対応案']?.trim() || '';
      const progressText = row['進捗']?.trim() || '';
      const statusText = row['対応状況']?.trim() || '';
      const assigneeText = row['対応者']?.trim() || '';
      const relatedBusiness = row['関連事業']?.trim() || '';
      const businessContent = row['事業内容']?.trim() || '';
      const organization = row['該当所属']?.trim() || '';

      // 問題点が空の場合はスキップ
      if (!problem) {
        skippedCount++;
        continue;
      }

      // ステータスを決定
      let status = 'not_started';
      if (progressText && STATUS_MAP[progressText]) {
        status = STATUS_MAP[progressText];
      } else if (statusText) {
        status = 'in_progress';
      }

      // 課題を作成
      const taskId = uuidv4();
      await client.query(`
        INSERT INTO tasks (id, category, problem, status, related_business, business_content, organization, created_at, updated_at, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
      `, [taskId, category, problem, status, relatedBusiness || null, businessContent || null, organization || null, systemUserId]);

      // 原因を作成
      if (causeText) {
        await client.query(`
          INSERT INTO causes (id, task_id, cause, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [uuidv4(), taskId, causeText]);
      }

      // 対応案を作成
      if (actionText) {
        await client.query(`
          INSERT INTO actions (id, task_id, action, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [uuidv4(), taskId, actionText]);
      }

      // 対応者を作成
      if (assigneeText) {
        // 改行で分割して複数の対応者を作成
        const assigneeNames = assigneeText.split('\n').map(name => name.trim()).filter(name => name);
        for (const name of assigneeNames) {
          await client.query(`
            INSERT INTO assignees (id, task_id, name, created_at)
            VALUES ($1, $2, $3, NOW())
          `, [uuidv4(), taskId, name]);
        }
      }

      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(`${importedCount}件インポート完了...`);
      }
    } catch (error) {
      console.error(`エラー発生（項番: ${row['項番']}）:`, error);
      skippedCount++;
    }
  }

  console.log(`\n=== インポート完了 ===`);
  console.log(`インポート成功: ${importedCount}件`);
  console.log(`スキップ: ${skippedCount}件`);
  console.log(`総処理: ${importedCount + skippedCount}件\n`);

  // 各カテゴリの件数を確認
  console.log('=== カテゴリ別件数 ===');
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

// スクリプト実行
importData().catch(error => {
  console.error('インポートエラー:', error);
  process.exit(1);
});
