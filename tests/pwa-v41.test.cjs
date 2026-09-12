const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('4.2 提供可安裝 PWA manifest 與手機圖示',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.name,'稽查助手4.7.1');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./index.html');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
});

test('4.2 首頁載入 manifest、PWA 啟動程式及手機 viewport',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/manifest\.webmanifest/);
  assert.match(html,/src\/pwa\.js/);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/id="mobile-install"/);
});

test('4.2 service worker App Shell 僅快取本機現有資源',()=>{
  const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
  assert.match(sw,/inspection-assistant-4\.7\.1-pp-7f3c9a21/);
  assert.doesNotMatch(sw,/https?:\/\/(?!localhost|127\.0\.0\.1)/);
  const assets=[...sw.matchAll(/'\.\/([^']*)'/g)].map(match=>match[1]).filter(Boolean);
  for(const asset of new Set(assets))assert.ok(fs.existsSync(path.join(root,asset)),`missing cached asset: ${asset}`);
});

test('4.2 手機介面具有單欄與大觸控區樣式',()=>{
  const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
  assert.match(css,/@media \(max-width: 760px\)/);
  assert.match(css,/\.single-choice \{ grid-template-columns: 1fr; \}/);
  assert.match(css,/min-height:50px/);
});
