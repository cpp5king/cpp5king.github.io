const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8');}
function appMeta(){const context=vm.createContext({window:{}});vm.runInContext(read('data/app-meta.js'),context);return context.window.INSPECTION_APP_META;}

test('PWA manifest 與手機圖示可安裝且版本同步',()=>{
  const meta=appMeta();
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name,meta.label);
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./index.html');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
});

test('首頁載入 manifest、PWA 啟動程式及手機 viewport',()=>{
  const html=read('index.html');
  assert.match(html,/manifest\.webmanifest/);
  assert.match(html,/src\/pwa\.js/);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/id="mobile-install"/);
});

test('service worker App Shell 僅快取本機現有資源且版本同步',()=>{
  const meta=appMeta();
  const sw=read('service-worker.js');
  assert.match(sw,new RegExp("const VERSION='"+meta.version.replaceAll('.','\\.')+"'"));
  assert.match(sw,/inspection-assistant-[^']+-pp-7f3c9a21/);
  assert.doesNotMatch(sw,/https?:\/\/(?!localhost|127\.0\.0\.1)/);
  const assets=[...sw.matchAll(/'\.\/([^']*)'/g)].map(match=>match[1]).filter(Boolean);
  for(const asset of new Set(assets))assert.ok(fs.existsSync(path.join(root,asset)),`missing cached asset: ${asset}`);
});

test('手機介面具有單欄與大觸控區樣式',()=>{
  const css=read('src/styles.css');
  assert.match(css,/@media \(max-width: 760px\)/);
  assert.match(css,/\.single-choice \{ grid-template-columns: 1fr; \}/);
  assert.match(css,/min-height:50px/);
});