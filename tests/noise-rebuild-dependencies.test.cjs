const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const legacyExecutors=[
  'src/noise-article8.js',
  'src/noise-article9.js',
  'data/templates/noise-article9-documents.js',
  'src/noise-article9-documents.js',
  'src/noise-article9-measurement.js',
  'src/noise-backgrounds.js',
  'src/noise-attempts.js',
  'src/noise-v490.js'
];

const rebuilt=['src/noise-zone.js','src/noise-main.js','src/noise-composite.js','src/noise-boundary.js'];

test('重建版依賴：首頁不再執行舊噪音引擎',()=>{
  const html=read('index.html');
  for(const file of legacyExecutors)assert.equal(html.includes(file),false,`${file} 不應再由首頁執行`);
  for(const file of rebuilt)assert.equal(html.includes(file),true,`${file} 應由首頁載入`);
  assert.ok(html.indexOf('src/noise-main.js')<html.indexOf('src/noise-composite.js'));
  assert.ok(html.indexOf('src/noise-composite.js')<html.indexOf('src/noise-boundary.js'));
});

test('重建版依賴：PWA App Shell 不再預快取舊噪音引擎',()=>{
  const sw=read('service-worker.js');
  for(const file of legacyExecutors)assert.equal(sw.includes(file),false,`${file} 不應再列入 App Shell`);
  for(const file of rebuilt)assert.equal(sw.includes(file),true,`${file} 應列入 App Shell`);
});

test('重建版依賴：歷史檔案仍保留於 repo，不以清理載入鏈等同刪除歷史參考',()=>{
  for(const file of legacyExecutors.filter(x=>x!=='src/noise-v490.js')){
    assert.equal(fs.existsSync(path.join(root,file)),true,`${file} 應保留作歷史參考`);
  }
});
