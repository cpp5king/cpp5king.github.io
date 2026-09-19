const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('水污染 V2 已接入稽查助手主入口，噪音入口仍保留',()=>{
  const html=read('index.html');
  assert.match(html,/src\/water-v2-ui\.css\?v=\d+\.\d+\.\d+/);
  assert.match(html,/src\/water-v2-ui\.js\?v=\d+\.\d+\.\d+/);
  assert.match(html,/src\/noise-main\.js\?v=\d+\.\d+\.\d+/);
  assert.ok(html.indexOf('src/water-v2-ui.js?v=')<html.indexOf('src/sentence-app.js?v='));
  const app=read('src/sentence-app.js');
  assert.match(app,/category\?\.id === 'water'/);
  assert.match(app,/root\.WaterV2UI\?\.mount/);
});

test('確認管制主體只保留四類，未選即代表尚未確認',()=>{
  const source=read('src/water-v2-ui.js');
  for(const label of ['水污法事業','污水下水道系統','建築物污水處理設施','非上述管制主體']) assert.match(source,new RegExp(label));
  assert.doesNotMatch(source,/\['unknown','尚無法確認','保留未知/);
  const block=source.slice(source.indexOf('const subjectTypes'),source.indexOf('function newId'));
  const entries=(block.match(/\['(?:industry|sewer|building|other)'/g)||[]);
  assert.equal(entries.length,4);
});

test('疑似來源可直接進行對象查核並可回寫來源判斷',()=>{
  const source=read('src/water-v2-ui.js');
  assert.match(source,/suspected:'疑似來源，尚無法確認'/);
  assert.match(source,/可先進入對象查核，以進一步確認或排除來源關聯/);
  assert.match(source,/data-handoff-source/);
  assert.match(source,/進行對象查核/);
  assert.match(source,/suspected:'仍無法確認',confirmed:'確認為來源',excluded:'排除此來源'/);
});

test('水污染 V2 維持記憶體模式與固定 provenance',()=>{
  const source=read('src/water-v2-ui.js');
  assert.match(source,/PP-IA-41-7F3C9A21/);
  assert.doesNotMatch(source,/localStorage\s*[.(]/);
  assert.doesNotMatch(source,/indexedDB\s*[.(]/);
  assert.doesNotThrow(()=>new Function(source));
});

test('PWA 與離線快取包含 Water V2 資產且版本同步',()=>{
  assert.match(read('data/app-meta.js'),/version:'\d+\.\d+\.\d+'/);
  assert.match(read('manifest.webmanifest'),/稽查助手\d+\.\d+\.\d+/);
  assert.match(read('src/pwa.js'),/const VERSION='\d+\.\d+\.\d+'/);
  const sw=read('service-worker.js');
  assert.match(sw,/const VERSION='4\.9\.35'/);
  assert.match(sw,/\.\/src\/water-v2-ui\.css/);
  assert.match(sw,/\.\/src\/water-v2-ui\.js/);
});
