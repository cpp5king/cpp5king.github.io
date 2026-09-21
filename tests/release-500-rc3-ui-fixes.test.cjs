const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('5.0 RC3 homepage removes legacy draft-selection notice',()=>{
  const html=read('index.html');
  assert.doesNotMatch(html,/照草稿選填/);
  assert.doesNotMatch(html,/id="home-instructions"/);
  assert.match(html,/完全離線 · 規則式稽查輔助/);
});

test('5.0 RC3 gives four modules separate theme identities',()=>{
  const app=read('src/sentence-app.js');
  const css=read('src/styles.css');
  assert.match(app,/setAttribute\?\.\('data-module',category\?\.id \|\| 'home'\)/);
  assert.match(app,/entry\.setAttribute\('data-module',item\.id\)/);
  assert.match(css,/body\[data-module="air"\].*#2e8b57/);
  assert.match(css,/body\[data-module="water"\].*#2f7de1/);
  assert.match(css,/body\[data-module="noise"\].*#7c3aed/);
  assert.match(css,/body\[data-module="waste"\].*#8b5e3c/);
});

test('5.0 RC3 water quick screening fixes COD as a basic item',()=>{
  const ui=read('src/water-v2-ui.js');
  assert.match(ui,/BASIC_SCREENING_CODES=Object\.freeze\(\['COD'\]\)/);
  assert.match(ui,/ensureBasicScreeningRecords\(records\)/);
  assert.match(ui,/pH、水溫與 COD 為固定基本項目/);
  assert.match(ui,/screen-basic-badge">固定基本快篩/);
});

test('5.0 RC3 COD is excluded from optional screening chips and cannot receive a delete button',()=>{
  const ui=read('src/water-v2-ui.js');
  assert.match(ui,/items\.filter\(d=>!isBasicScreeningCode\(d\.code\)\)/);
  assert.match(ui,/optionalCodes=rec\.codes\.filter\(code=>!isBasicScreeningCode\(code\)\)/);
  assert.match(ui,/basicRecords=.*filter\(x=>isBasicScreeningCode\(x\.r\.code\)\)/);
  assert.match(ui,/optionalRecords=.*filter\(x=>!isBasicScreeningCode\(x\.r\.code\)\)/);
});

test('5.0 RC3 Waste batch editor uses opaque scoped modal with fixed actions',()=>{
  const ui=read('src/waste-v1-ui.js');
  const css=read('src/waste-v1-ui.css');
  assert.match(ui,/className='waste-modal-layer'/);
  assert.match(ui,/\(host\|\|document\.body\)\.appendChild\(layer\)/);
  assert.match(ui,/waste-modal-header/);
  assert.match(ui,/waste-modal-body/);
  assert.match(ui,/waste-modal-footer/);
  assert.match(ui,/saveLabel:'儲存批次'/);
  assert.match(css,/\.waste-v017-host \.waste-modal-layer\{[^}]*background:rgba\(37,29,24,\.72\)/);
  assert.match(css,/\.waste-v017-host \.waste-modal-panel\{[^}]*background:#fff/);
});

test('5.0 RC3 Waste batch editor is sectioned and becomes full-screen on mobile',()=>{
  const ui=read('src/waste-v1-ui.js');
  const css=read('src/waste-v1-ui.css');
  for(const label of ['基本辨識','來源與產生情境','廢棄物身分與分類','後段核對與用途'])assert.match(ui,new RegExp(label));
  assert.match(css,/\.waste-v017-host \.waste-modal-panel\.waste-modal-batch\{width:min\(880px,100%\)\}/);
  assert.match(css,/height:100dvh/);
});

test('5.0 RC3 Waste module uses coffee-brown visual identity',()=>{
  const css=read('src/waste-v1-ui.css');
  assert.match(css,/--blue:#8b5e3c;--blue2:#6f472d;--deep:#4e3427/);
  assert.match(css,/\.waste-v017-host \.hero\{background:linear-gradient\(135deg,#6f472d,#8b5e3c\)/);
  assert.match(css,/\.waste-v017-host button\.secondary\{background:#fff;color:#6f472d;border-color:#c9b29f\}/);
});
