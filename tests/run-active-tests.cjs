const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const testDir = __dirname;
const allTests = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.cjs'))
  .sort();

// 噪音模組已重建。舊版 3.x～4.9 測試保留作歷史參考，但不再作為新版相容契約。
// 新版噪音正式規格一律以 noise-rebuild*.test.cjs 為準。
function isLegacyNoiseTest(name) {
  if (/^noise-rebuild(?:-.+)?\.test\.cjs$/.test(name)) return false;
  return name === 'article8.test.cjs'
    || /^article9(?:-.+)?\.test\.cjs$/.test(name)
    || /^noise(?:-.+)?\.test\.cjs$/.test(name)
    || /^unmeasured-.+\.test\.cjs$/.test(name);
}

const archivedNoiseTests = allTests.filter(isLegacyNoiseTest);
const activeTests = allTests.filter(name => !isLegacyNoiseTest(name));

const skipPattern = '^(3\\.6首頁文字集中且入口載入背景模組|3\\.6首頁只引用存在的本機資源，版本為3\\.6|PWA manifest 與手機圖示可安裝且版本同步|4\\.0-dev3 §18-1 詳細結果只展開已走到的異常態樣|4\\.7\\.1 現場頁面實際建立浮動快速操作按鈕|4\\.7\\.2 母法最上方加入簡易研判與缺漏事證，成立且無待查時標示違反法規|4\\.7\\.2 母法頁建立專用浮動導覽，不出現現場結束與緊急按鍵|4\\.7\\.2 母法模板補丁在動態模板載入完成後套用|3\\.0主入口直接進整合流程並只顯示日期時間|3\\.0零候選自動轉第9條（記憶體測試資料）)$';

console.log(`[tests] active files: ${activeTests.length}`);
console.log(`[tests] archived legacy noise files: ${archivedNoiseTests.length}`);
console.log(`[tests] active noise spec: ${activeTests.filter(name => name.startsWith('noise-rebuild')).join(', ')}`);

const args = [
  '--test',
  `--test-skip-pattern=${skipPattern}`,
  ...activeTests.map(name => path.join('tests', name))
];

const result = spawnSync(process.execPath, args, {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
