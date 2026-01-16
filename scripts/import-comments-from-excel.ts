import XLSX from 'xlsx';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// .env.localを読み込む
dotenv.config({ path: '.env.local' });

const EXCEL_PATH = '/Users/kuwahatatakeru/医療DW Dropbox/21_AI/IKEA-KANAGAWA/docs/医療的ケア児等支援に係る課題管理表.xlsx';

interface ExcelRow {
  '__EMPTY': number | string;       // A列: 項番
  '__EMPTY_2': string;               // B列: 項目
  '__EMPTY_3': string;               // C列: 問題点
  '__EMPTY_4': number;               // D列: 重要度
  '__EMPTY_5': number;               // E列: 緊急度
  '__EMPTY_6': number;               // F列: (未使用)
  '__EMPTY_7': string;               // G列: (未使用)
  '__EMPTY_8': string;               // H列: 原因
  '__EMPTY_9': string;               // I列: 対応案（コメント）
  '__EMPTY_10': string;              // J列: 進捗
  '__EMPTY_11': string;              // K列: 対応状況
  '__EMPTY_12': string;              // L列: 該当所属
  '__EMPTY_13': string;              // M列: 対応者
}

async function importComments() {
  console.log('=== Excelコメントデータインポート開始 ===\n');

  // データベース接続
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URLが設定されていません');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  console.log('データベースに接続しました');

  // システムユーザーIDを取得
  const systemUserResult = await client.query(
    "SELECT id FROM users WHERE email = 'system@care-taskflow.app' OR email LIKE 'system%' LIMIT 1"
  );

  let systemUserId: string;
  if (systemUserResult.rows.length === 0) {
    // システムユーザーを作成
    systemUserId = 'system-user-comments';
    await client.query(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [systemUserId, 'system-comments@care-taskflow.app', 'N/A']);
    console.log('システムユーザーを作成しました\n');
  } else {
    systemUserId = systemUserResult.rows[0].id;
    console.log(`既存のシステムユーザーを使用します: ${systemUserId}\n`);
  }

  // Excelファイルを読み込む
  console.log('Excelファイルを読み込んでいます...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = '1222_取りまとめ';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`シート "${sheetName}" が見つかりません。利用可能なシート: ${workbook.SheetNames.join(', ')}`);
  }

  // 5行目からデータが始まる（4行目まではヘッダー）
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { range: 4 });

  console.log(`総データ数: ${data.length}件\n`);

  // データベースから全課題を取得（問題点でマッピング）
  const tasksResult = await client.query('SELECT id, task_number, problem FROM tasks ORDER BY task_number');
  const taskMapByProblem = new Map<string, { id: string; taskNumber: number }>();

  for (const task of tasksResult.rows) {
    // 問題点を正規化（空白・改行を削除して小文字化）
    const normalizedProblem = task.problem.replace(/\s+/g, '').toLowerCase();
    taskMapByProblem.set(normalizedProblem, {
      id: task.id,
      taskNumber: task.task_number,
    });
  }

  console.log(`データベース内の課題数: ${taskMapByProblem.size}件\n`);

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of data) {
    try {
      const excelTaskNumber = typeof row['__EMPTY'] === 'number'
        ? row['__EMPTY']
        : parseInt(String(row['__EMPTY']).trim(), 10);

      const problem = row['__EMPTY_3']?.trim(); // C列: 問題点
      const comment = row['__EMPTY_9']?.trim(); // I列: 対応案（コメント）

      // 問題点が無効、またはコメントが空の場合はスキップ
      if (!problem || !comment) {
        skippedCount++;
        continue;
      }

      // 問題点を正規化してtask_idを取得
      const normalizedProblem = problem.replace(/\s+/g, '').toLowerCase();
      const taskInfo = taskMapByProblem.get(normalizedProblem);

      if (!taskInfo) {
        console.log(`⚠ Excel項番 ${excelTaskNumber} の問題点「${problem.substring(0, 30)}...」に対応する課題が見つかりません`);
        skippedCount++;
        continue;
      }

      const { id: taskId, taskNumber } = taskInfo;

      // 既存のコメントを確認（システムユーザーによるコメント）
      const existingComment = await client.query(
        'SELECT id FROM comments WHERE task_id = $1 AND user_id = $2 LIMIT 1',
        [taskId, systemUserId]
      );

      if (existingComment.rows.length > 0) {
        // 既存のコメントを上書き
        await client.query(
          'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2',
          [comment, existingComment.rows[0].id]
        );
        console.log(`✓ 項番 ${taskNumber} のコメントを更新しました`);
        updatedCount++;
      } else {
        // 新規コメントを作成
        const commentId = uuidv4();
        await client.query(
          'INSERT INTO comments (id, task_id, user_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [commentId, taskId, systemUserId, comment]
        );
        console.log(`✓ 項番 ${taskNumber} のコメントを追加しました`);
        importedCount++;
      }

    } catch (error) {
      console.error(`✗ 項番 ${row['__EMPTY']} の処理に失敗しました:`, error);
      skippedCount++;
    }
  }

  console.log(`\n=== インポート完了 ===`);
  console.log(`新規追加: ${importedCount}件`);
  console.log(`更新: ${updatedCount}件`);
  console.log(`スキップ: ${skippedCount}件`);
  console.log(`総処理: ${importedCount + updatedCount + skippedCount}件\n`);

  await client.end();
  console.log('データベース接続を切断しました');
}

// スクリプト実行
importComments().catch(error => {
  console.error('インポートエラー:', error);
  process.exit(1);
});
