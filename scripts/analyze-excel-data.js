import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = JSON.parse(readFileSync(join(__dirname, '../data/tasks-formatted.json'), 'utf-8'));

console.log('=== Excelデータの分析 ===\n');
console.log('全データ数:', data.length);
console.log('issueがnullのデータ数:', data.filter(t => !t.issue).length);
console.log('urgencyとimportanceの両方があるデータ数:', data.filter(t => t.urgency && t.importance).length);

const missingData = data.filter(t => t.issue && (!t.urgency || !t.importance));
console.log('\nurgencyまたはimportanceが欠けているデータ（issueあり）:');
console.log('件数:', missingData.length);
missingData.forEach(t => {
  console.log(`  ID ${t.id}: ${t.issue ? t.issue.substring(0, 40) : '(no issue)'} - urgency: ${t.urgency}, importance: ${t.importance}`);
});

// 実際にDBに入れるべきデータ（issueがあるもの）
const validTasks = data.filter(t => t.issue);
console.log('\n有効なタスク数（issueがあるもの）:', validTasks.length);
console.log('そのうち urgency/importance が設定されているもの:', validTasks.filter(t => t.urgency && t.importance).length);
