import xlsx from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const excelFilePath = join(__dirname, '../../IKEA-KANAGAWA/docs/医療的ケア児等支援に係る課題管理表.xlsx');

console.log('Excelファイル読み込み中:', excelFilePath);

const workbook = xlsx.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('\n=== シート情報 ===');
console.log('シート名:', sheetName);

const data = xlsx.utils.sheet_to_json(worksheet);

console.log('\n=== データサマリー ===');
console.log('総行数:', data.length);

if (data.length > 0) {
  console.log('\n=== ヘッダー（列名） ===');
  console.log(Object.keys(data[0]));

  console.log('\n=== 最初の3件のデータ ===');
  data.slice(0, 3).forEach((row, index) => {
    console.log(`\n--- 行${index + 1} ---`);
    console.log(JSON.stringify(row, null, 2));
  });
}

// JSONファイルとして出力
import { writeFileSync } from 'fs';
const outputPath = join(__dirname, '../data/excel-import.json');
writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n=== データをJSONファイルに出力しました ===');
console.log('出力先:', outputPath);
