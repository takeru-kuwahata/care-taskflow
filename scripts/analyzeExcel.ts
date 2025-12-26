import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

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

function analyzeExcel() {
  console.log('Excelファイルを読み込んでいます...');

  // Excelファイルを読み込む
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = '課題一覧';

  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`シート "${sheetName}" が見つかりません`);
    console.log('利用可能なシート:', workbook.SheetNames);
    return;
  }

  const worksheet = workbook.Sheets[sheetName];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`\n総データ数: ${data.length}件\n`);

  // カテゴリを抽出
  const categories = new Set<string>();
  const statusSet = new Set<string>();
  const progressSet = new Set<string>();

  data.forEach((row, index) => {
    if (row['項目']) {
      categories.add(row['項目'].trim());
    }
    if (row['対応状況']) {
      statusSet.add(row['対応状況'].trim());
    }
    if (row['進捗']) {
      progressSet.add(row['進捗'].trim());
    }
  });

  console.log('=== カテゴリ一覧 ===');
  const sortedCategories = Array.from(categories).sort();
  sortedCategories.forEach((cat, index) => {
    const count = data.filter(row => row['項目']?.trim() === cat).length;
    console.log(`${index + 1}. ${cat} (${count}件)`);
  });

  console.log('\n=== 対応状況の種類 ===');
  Array.from(statusSet).sort().forEach(status => {
    const count = data.filter(row => row['対応状況']?.trim() === status).length;
    console.log(`- ${status} (${count}件)`);
  });

  console.log('\n=== 進捗の種類 ===');
  Array.from(progressSet).sort().forEach(progress => {
    const count = data.filter(row => row['進捗']?.trim() === progress).length;
    console.log(`- ${progress} (${count}件)`);
  });

  // サンプルデータを表示
  console.log('\n=== サンプルデータ（最初の3件） ===');
  data.slice(0, 3).forEach((row, index) => {
    console.log(`\n【課題 ${index + 1}】`);
    console.log(`項番: ${row['項番']}`);
    console.log(`項目（カテゴリ）: ${row['項目']}`);
    console.log(`問題点: ${row['問題点']}`);
    console.log(`原因: ${row['原因']}`);
    console.log(`対応案: ${row['対応案']}`);
    console.log(`進捗: ${row['進捗']}`);
    console.log(`対応状況: ${row['対応状況']}`);
    console.log(`対応者: ${row['対応者']}`);
  });

  // 分析結果をJSONで保存
  const analysisResult = {
    totalCount: data.length,
    categories: sortedCategories.map(cat => ({
      name: cat,
      count: data.filter(row => row['項目']?.trim() === cat).length,
    })),
    statusTypes: Array.from(statusSet).sort(),
    progressTypes: Array.from(progressSet).sort(),
    sampleData: data.slice(0, 5),
  };

  const outputPath = '/Users/kuwahatatakeru/医療DW Dropbox/21_AI/医療的ケア児支援課題管理システム/scripts/excel-analysis.json';
  fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
  console.log(`\n分析結果を保存しました: ${outputPath}`);
}

analyzeExcel();
