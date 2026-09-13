const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runtime,loaded,plain}=require('./helpers.cjs');

const common={
  noiseNature:'measurable',noiseSpecial:'ordinary',noiseDate:'2026-09-13',noiseTime:'15:00',
  noiseZoneMode:'direct',noiseZone:'2',noiseHoliday:'no'
};

test('4.9.2 噪音表單：第一題改為持續性可量測，並啟用浮動操作與上方簡易判斷',async()=>{
  const {config}=await loaded();
  const t=config.templates.find(x=>x.id==='noise-main');
  assert.equal(t.floatingFieldActions,true);
  assert.equal(t.mobileFocusMode,true);
  assert.equal(t.quickActions.summaryField,'noiseQuickDecisionText');
  assert.equal(t.quickActions.labels.summary,'簡易判斷');
  const ids=t.fields.map(f=>f.id);
  assert.ok(ids.indexOf('noiseQuickDecisionText')<ids.indexOf('noiseNature'));
  assert.ok(ids.indexOf('noiseNature')<ids.indexOf('noiseSpecial'));
  assert.ok(ids.indexOf('noiseSpecial')<ids.indexOf('noiseDate'));
  assert.match(t.fields.find(f=>f.id==='noiseNature').label,/第一步.*持續性且可量測/);
  assert.match(t.fields.find(f=>f.id==='noiseA8Act').label,/系統依時間＋管制區自動判斷第8條/);
});

test('4.9.2 第一關：尚未確認是否持續可量測時不得先要求管制區或第8條',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({noiseSpecial:'ordinary',noiseDate:'2026-09-13',noiseTime:'22:30',noiseZone:'2',noiseHoliday:'no'}));
  assert.match(out.noiseRouteText,/第一步/);
  assert.match(out.noiseValidation,/持續性且可量測/);
  assert.equal(out.noiseShowA8,'no');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseQuickDecisionText,/先確認/);
});

test('4.9.2 主管機關優先：不具持續性或不易量測即結束環保局一般第9條流程',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({noiseNature:'difficult'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第6條.*警察機關/);
  assert.equal(out.noiseShowA8,'no');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseQuickDecisionText,/一般第9條量測流程停止/);
  assert.match(out.noiseRecord,/不具持續性或不易量測/);
});

test('4.9.2 具持續性且可量測後才做特殊來源快速分流',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({noiseNature:'measurable'}));
  assert.match(out.noiseRouteText,/特殊噪音來源快速分流/);
  assert.match(out.noiseValidation,/一般案件請選/);
  assert.match(out.noiseQuickDecisionText,/特殊噪音來源/);
});

test('4.9.2 一般案件先完成日期時間，再進管制區與第8條判斷',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({noiseNature:'measurable',noiseSpecial:'ordinary'}));
  assert.match(out.noiseRouteText,/第二步.*日期與時間/);
  assert.match(out.noiseValidation,/日期與時間/);
});

test('4.9.2 日間無任何第8條公告候選時自動略過第8條並進第9條',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare(common));
  assert.equal(out.noiseShowA9,'yes');
  assert.match(out.noiseValidation,/第9條噪音源類型/);
  assert.match(out.noiseQuickDecisionText,/未命中.*第8條/);
  assert.match(out.noiseQuickDecisionText,/直接往第9條/);
});

test('4.9.2 夜間有第8條候選時先列出可能行為，不替稽查員猜現場行為',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({...common,noiseTime:'22:30'}));
  assert.equal(out.noiseShowA8,'yes');
  assert.match(out.noiseValidation,/現場是否涉及第8條公告禁止行為/);
  assert.match(out.noiseQuickDecisionText,/可能適用第8條/);
  assert.match(out.noiseQuickDecisionText,/使用樂器發聲/);
});

test('4.9.2 夜間實際行為命中公告時走第8條；明確無符合行為則轉第9條',()=>{
  const {root}=runtime();
  const a8=plain(root.NoiseMain.prepare({...common,noiseTime:'22:30',noiseA8Act:'instrument',noiseA8Disturbance:'yes'}));
  assert.equal(a8.noiseBlocked,'no');
  assert.match(a8.noiseRouteText,/第8條公告禁止行為成立/);
  assert.match(a8.noiseQuickDecisionText,/目前走第8條/);

  const a9=plain(root.NoiseMain.prepare({...common,noiseTime:'22:30',noiseA8Act:'none'}));
  assert.equal(a9.noiseShowA9,'yes');
  assert.match(a9.noiseQuickDecisionText,/已轉第9條/);
});

test('4.9.2 reset：第一題變更清掉全部下游；特殊來源變更不得反向清掉第一題',()=>{
  const {root}=runtime();
  const before={...common,noiseA8Act:'none',noiseA9Type:'business'};
  const changedNature=root.NoiseMain.resetChange(before,{...before,noiseNature:'difficult'});
  assert.equal(changedNature.noiseSpecial,'');
  assert.equal(changedNature.noiseTime,'');
  assert.equal(changedNature.noiseZone,'');
  assert.equal(changedNature.noiseA9Type,'');

  const changedSpecial=root.NoiseMain.resetChange(common,{...common,noiseSpecial:'vehicle'});
  assert.equal(changedSpecial.noiseNature,'measurable');
});

test('4.9.2 依賴：首頁與PWA均載入 priority routing 模組',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  assert.match(read('index.html'),/src\/noise-priority-routing\.js/);
  assert.match(read('service-worker.js'),/src\/noise-priority-routing\.js/);
});
