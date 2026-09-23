const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('5.1.1 formal metadata keeps provenance and no RC marker',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(read('data/app-meta.js'),context);
  const meta=context.window.INSPECTION_APP_META;
  assert.equal(meta.version,'5.1.1');
  assert.equal(meta.label,'稽查助手5.1.1');
  assert.equal(meta.build,'release-5.1.1');
  assert.equal(meta.provenance,'PP-IA-41-7F3C9A21');
  for(const p of ['index.html','manifest.webmanifest','service-worker.js','data/app-meta.js'])assert.doesNotMatch(read(p),/local-rc8|5\.1\.0-local|5\.1\.1-local/);
});

test('5.1 four modules and Air four paths are active',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(read('data/templates/catalog.js'),context);
  const c=context.window.INSPECTION_CONFIG;
  assert.deepEqual(Array.from(c.categories,x=>[x.id,x.status]),[['air','active'],['water','active'],['noise','active'],['waste','active']]);
  const air=Array.from(c.caseTypes).filter(x=>x.categoryId==='air');
  assert.deepEqual(Array.from(air,x=>x.id),['air-fixed-source','air-construction','restaurant-odor','air-open-burning']);
  assert.equal(air.find(x=>x.id==='restaurant-odor').directTemplateId,'restaurant-odor-reference');
});

test('post-5.1 Waste has a real case entry and routes directly to Waste UI',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(read('data/templates/catalog.js'),context);
  const c=context.window.INSPECTION_CONFIG;
  const waste=c.caseTypes.find(x=>x.id==='waste-inspection');
  assert.ok(waste);
  assert.equal(waste.categoryId,'waste');
  assert.equal(waste.status,'active');
  const app=read('src/sentence-app.js');
  assert.match(app,/item\.id === 'waste-inspection'/);
  assert.match(app,/category\.id === 'waste'/);
  assert.match(app,/root\.WasteV1UI\?\.mount/);
});

test('5.1 Air routing sends three structured paths to Air V1 and restaurant to template flow',()=>{
  const app=read('src/sentence-app.js');
  assert.match(app,/\['air-fixed-source','air-construction','air-open-burning'\]\.includes\(type\.id\)/);
  assert.match(app,/root\.AirV1UI\?\.mount/);
  assert.match(app,/category\.id === 'air'/);
  assert.match(read('data/templates/restaurant-odor.js'),/relatedTemplates/);
  assert.match(read('data/templates/restaurant-odor-sampling-pending.js'),/caseTypeId: "restaurant-odor"/);
});

test('5.1 homepage navigation and full-case clearing are separate actions',()=>{
  const app=read('src/sentence-app.js');
  assert.match(app,/首頁／案件大類/);
  assert.match(app,/viewMode='home'; render\(\)/);
  assert.match(app,/button\('新增案件'/);
  assert.doesNotMatch(app,/新增案件／清除目前案件/);
  assert.match(app,/clearCurrentCase/);
  assert.doesNotMatch(app,/首頁／案件大類[^\n]{0,120}clearCurrentCase/);
});

test('5.1 four modules expose consistent onsite actions',()=>{
  const app=read('src/sentence-app.js');
  const air=read('src/air-v1-ui.js');
  for(const label of ['法規研判','整理目前內容','回到最上面']){
    assert.ok((app.match(new RegExp(label,'g'))||[]).length>=3,label);
    assert.match(air,new RegExp(label));
  }
  assert.match(read('src/water-v2-ui.js'),/showLaw/);
  assert.match(read('src/water-v2-ui.js'),/showSummary/);
  assert.match(read('src/waste-v1-ui.js'),/showLaw/);
  assert.match(read('src/waste-v1-ui.js'),/showSummary/);
});

test('post-5.1 Air hides internal serial id and explains user-facing fields',()=>{
  const air=read('src/air-v1-ui.js');
  const css=read('src/air-v1-ui.css');
  assert.doesNotMatch(air,/field\('空污系統稽查對象流水編號'/);
  assert.match(air,/field\('管制編號（如有）'/);
  assert.match(air,/固定污染源／製程項目別/);
  assert.match(air,/const AIR_HELP=Object\.freeze/);
  assert.match(air,/未知不等於否定/);
  assert.match(css,/air-field-help/);
});

test('5.1 Air user-facing internal labels are localized',()=>{
  const air=read('src/air-v1-ui.js');
  const rule=read('src/air-rule-ui.js');
  assert.match(air,/現場處置與廢棄物連結/);
  assert.doesNotMatch(air,/現場處置與 Waste 連結/);
  assert.doesNotMatch(air,/Air Rule Pack/);
  assert.doesNotMatch(rule,/Air Rule Pack/);
});

test('5.1 full-law UI has quick/full views, related filter and explanatory facts',()=>{
  const ui=read('src/law-reference-ui.js');
  for(const text of ['法規速查','完整法規','只顯示與目前案件相關','觸發事實','仍待確認事項','查看原始條文格式'])assert.match(ui,new RegExp(text));
  assert.match(ui,/noiseBoxBlocks/);
  assert.match(ui,/noiseRows/);
});

test('5.1 bundled central law snapshot contains 14 laws and 687 articles from MOJ only',()=>{
  const s=read('data/law-fulltext.js');
  const m=s.match(/Object\.freeze\((\{.*\})\);\}\)\(window\);/s);
  assert.ok(m,'law-fulltext.js parse wrapper');
  const j=JSON.parse(m[1]);
  assert.equal(Object.keys(j.entries||{}).length,14);
  let count=0;
  for(const e of Object.values(j.entries||{})){
    assert.ok(String(e.sourceUrl||'').startsWith('https://law.moj.gov.tw/'),e.name);
    count+=(e.articles||[]).filter(a=>a.type==='A').length;
  }
  assert.equal(count,687);
});

test('5.1 Air import validation checks nested structure and referential integrity',()=>{
  const air=read('src/air-v1-ui.js');
  assert.match(air,/function normalizeState\(input\)/);
  assert.match(air,/來源關聯必須是陣列/);
  assert.match(air,/連到不存在的來源/);
  assert.match(air,/連到不存在的現場物件/);
  assert.match(air,/連到不存在的現場觀察/);
  assert.match(air,/validateState:normalizeState/);
});

test('5.1 construction improvement links to real observation object',()=>{
  const air=read('src/air-v1-ui.js');
  assert.match(air,/afterObservationId/);
  assert.match(air,/改善後現場觀察（選填）/);
  assert.match(air,/建立改善後現場觀察/);
  assert.match(air,/constructionObsIds\.has\(imp\.afterObservationId\)/);
});

test('5.1 new law and Air layers remain memory-only',()=>{
  for(const p of ['src/air-v1-ui.js','src/air-rule-ui.js','src/law-reference-ui.js']){
    const s=read(p);
    assert.doesNotMatch(s,/localStorage\s*[.(]/);
    assert.doesNotMatch(s,/indexedDB\s*[.(]/);
    assert.doesNotMatch(s,/SQLite/i);
  }
});
