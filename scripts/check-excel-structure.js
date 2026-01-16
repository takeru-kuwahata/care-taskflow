import XLSX from 'xlsx';

const wb = XLSX.readFile('/Users/kuwahatatakeru/医療DW Dropbox/21_AI/IKEA-KANAGAWA/docs/医療的ケア児等支援に係る課題管理表.xlsx');
const ws = wb.Sheets['1222_取りまとめ'];
const allData = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('ヘッダー行（4行目）:');
const headers = allData[3];
headers.forEach((h, i) => {
  const excelCol = String.fromCharCode(66 + i); // B列から開始
  console.log(`列${i} (Excel列${excelCol}): ${h || '(空欄)'}`);
});

console.log('\n\nサンプルデータ（項番1の行、6行目）:');
const row1 = allData[5];
row1.forEach((cell, i) => {
  if (cell !== undefined) {
    const display = String(cell).substring(0, 80);
    console.log(`列${i}: ${display}`);
  }
});

console.log('\n\nサンプルデータ（項番2の行、7行目）:');
const row2 = allData[6];
row2.forEach((cell, i) => {
  if (cell !== undefined) {
    const display = String(cell).substring(0, 80);
    console.log(`列${i}: ${display}`);
  }
});
