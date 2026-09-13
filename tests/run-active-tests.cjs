const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const testDir = __dirname;
const allTests = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.cjs'))
  .sort();

// 噪音模組已重建。舊版 3.x～4.9 測試保留作歷史參考，但不再作為新版相容契約。
// 4.9.16 又完成「可量測性前置、第8條動態候選、第9條量測／不量測分流」等正式流程重排；
// 因此下列 4.9.4 時期的 rebuild 契約也已被 4.9.16 專用契約取代，不再當成 active spec。
const supersededNoiseSpecFiles = new Set([
  'noise-rebuild.test.cjs',
  'noise-rebuild-method-guidance.test.cjs',
  'noise-rebuild-priority-routing.test.cjs'
]);

function isLegacyNoiseTest(name) {
  if (supersededNoiseSpecFiles.has(name)) return true;
  if (/^noise-rebuild(?:-.+)?\.test\.cjs$/.test(name)) return false;
  return name === 'article8.test.cjs'
    || /^article9(?:-.+)?\.test\.cjs$/.test(name)
    || /^noise(?:-.+)?\.test\.cjs$/.test(name)
    || /^unmeasured-.+\.test\.cjs$/.test(name);
}

const archivedNoiseTests = allTests.filter(isLegacyNoiseTest);
const activeTests = allTests.filter(name => !isLegacyNoiseTest(name));

// 這些是已被後續正式流程取代的「舊順序」單一測試案例；檔案其餘回歸仍照常執行。
// 4.9.16 最新流程由 noise-rebuild-4916-*.test.cjs 覆蓋；舊案例只留歷史參考。
const supersededCases = [
  '重建版第一步：未確認主要噪音來源時先停在主管機關分流',
  '第8條爆竹：專案核准例外成立後回到一般第6／9條流程',
  '第8條室外擴音：執行公務例外可排除該禁止行為後續走第6條',
  '第8條營建：核准施工且公告事項六附帶規定全數符合時例外成立',
  '第8條吹葉機：主管機關核准例外成立後不以第8條成立',
  '重建版：第6條不自行補足妨害安寧事實',
  '交界案件若第一關為不具持續性或不易量測，不再判交界與第8／9條',
  '主流程整合：特殊來源先分流，不應要求一般噪音管制區資料',
  '主管機關先分流：陸上運輸、民航、軍航不需要先判噪音管制區',
  '車輛分流 unknown：排氣管第8條是否涉及未知時不得直接略過',
  '車輛分流：未見排氣管第8條行為即走第11至13條專章，不要求管制區',
  '車輛排氣管第8條：行為存在但妨害安寧未知時保持待確認',
  '車輛排氣管第8條：行為及妨害安寧均成立時優先走第8條',
  '車輛排氣管第8條：妨害安寧明確為否時回到機動車輛專章',
  '重建版：第6條妨害安寧明確為否時不硬轉第9條'
];
const existingSkipped = [
  '3.6首頁文字集中且入口載入背景模組',
  '3.6首頁只引用存在的本機資源，版本為3.6',
  'PWA manifest 與手機圖示可安裝且版本同步',
  '4.0-dev3 §18-1 詳細結果只展開已走到的異常態樣',
  '4.7.1 現場頁面實際建立浮動快速操作按鈕',
  '4.7.2 母法最上方加入簡易研判與缺漏事證，成立且無待查時標示違反法規',
  '4.7.2 母法頁建立專用浮動導覽，不出現現場結束與緊急按鍵',
  '4.7.2 母法模板補丁在動態模板載入完成後套用',
  '3.0主入口直接進整合流程並只顯示日期時間',
  '3.0零候選自動轉第9條（記憶體測試資料）'
];
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const skipPattern = `^(?:${[...existingSkipped,...supersededCases].map(escapeRegExp).join('|')})$`;

console.log(`[tests] active files: ${activeTests.length}`);
console.log(`[tests] archived legacy noise files: ${archivedNoiseTests.length}`);
console.log(`[tests] active noise spec: ${activeTests.filter(name => name.startsWith('noise-rebuild')).join(', ')}`);
console.log(`[tests] superseded noise spec files: ${Array.from(supersededNoiseSpecFiles).join(', ')}`);
console.log(`[tests] superseded single-case contracts: ${supersededCases.length}`);

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
