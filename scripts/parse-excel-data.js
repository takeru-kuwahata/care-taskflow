import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rawData = JSON.parse(readFileSync(join(__dirname, '../data/excel-import.json'), 'utf-8'));

// ヘッダー行は3行目（インデックス2）
const headerRow = rawData[2];

// データは5行目（インデックス4）から
const dataRows = rawData.slice(4);

// ヘッダーのマッピング
const columnMapping = {
  '__EMPTY': 'id',
  '__EMPTY_1': 'branchId',
  '__EMPTY_2': 'category',
  '__EMPTY_3': 'issue',
  '__EMPTY_4': 'urgency',
  '__EMPTY_5': 'importance',
  '__EMPTY_6': 'priority',
  '__EMPTY_7': 'comment',
  '__EMPTY_8': 'cause',
  '__EMPTY_9': 'action',
  '__EMPTY_10': 'progress',
  '__EMPTY_11': 'status',
  '__EMPTY_12': 'assignee',
  '__EMPTY_13': 'relatedProject',
  '__EMPTY_14': 'projectContent',
  '__EMPTY_15': 'department'
};

// データを整形
const tasks = dataRows
  .filter(row => row.__EMPTY) // IDがある行のみ
  .map(row => {
    const task = {};

    for (const [excelCol, dbCol] of Object.entries(columnMapping)) {
      const value = row[excelCol];

      // 空の値をnullに変換
      if (value === undefined || value === null || value === '') {
        task[dbCol] = null;
        continue;
      }

      // 数値型のフィールド
      if (['id', 'branchId', 'urgency', 'importance', 'priority'].includes(dbCol)) {
        task[dbCol] = typeof value === 'number' ? value : null;
      } else {
        // 文字列型のフィールド
        task[dbCol] = String(value).trim();
      }
    }

    return task;
  });

console.log('=== データ統計 ===');
console.log('総タスク数:', tasks.length);
console.log('\n=== 最初の5件 ===');
console.log(JSON.stringify(tasks.slice(0, 5), null, 2));

// 整形されたデータを出力
import { writeFileSync } from 'fs';
writeFileSync(
  join(__dirname, '../data/tasks-formatted.json'),
  JSON.stringify(tasks, null, 2),
  'utf-8'
);
console.log('\n=== 整形データを出力しました ===');
console.log('出力先: data/tasks-formatted.json');
