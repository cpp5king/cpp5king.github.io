const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const {runtime,plain}=require('./helpers.cjs');
const repoRoot=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(repoRoot,file),'utf8');

function env(){
  const e=runtime();
  [
    'data/rules/water-legal-v2.js',
    'src/water-v2-session.js',
    'src/water-v2-workflow.js',
    'src/water-legal-engine.js',
    'src/water-v2-summary.js',
    'src/water-legal-adapter.js'
  ].forEach(e.run);
  return e;
}
function presentation(){
  const context=vm.createContext({window:{CustomRenderers:{},WaterV2Session:{}}});
  vm.runInContext(read('src/water-v2-summary.js'),context);
  vm.runInContext(read('src/water-v2-app.js'),context);
  return context.window;
}

test('Water V2 法規研判尚缺項目使用人話且 Flow 不重複',()=>{
  const e=env();
  const out=plain(e.root.WaterLegalAdapter.analyze({
    waterInspectionDate:'2026-09-16',
    waterActualDischarge:'yes'
  }));
  const r=out.legal.results.find(x=>x.ruleId==='LAW-WATER-018-1-01-C');
  assert.ok(r);
  const labels=r.missingFacts.map(x=>x.key);
  assert.ok(labels.includes('行為主體'));
  assert.ok(labels.includes('該股水性質'));
  assert.ok(labels.includes('核准收集／處理流程'));
  assert.ok(labels.includes('實際水流路徑'));
  assert.equal(labels.some(x=>/^water\./.test(x)),false);
  assert.equal(new Set(labels).size,labels.length);
  assert.equal(r.internalMissingFacts.some(x=>x.key==='water.subject.type'),true);
});

test('Water V2 主要法規缺項不直接顯示內部 Fact Key',()=>{
  const e=env();
  const out=plain(e.root.WaterLegalAdapter.analyze({
    waterInspectionDate:'2026-09-16',
    waterActualDischarge:'yes'
  }));
  const req=out.legal.primaryFactRequest;
  assert.ok(req&&req.request);
  assert.equal(/^water\./.test(req.request.key||''),false);
  assert.ok(req.internalRequest);
});

test('Water V2 顯示層將內部狀態與物件類型轉為使用者語言',()=>{
  const w=presentation(),p=w.WaterV2Presentation;
  assert.equal(p.statusText('confirmed'),'已確認');
  assert.equal(p.statusText('blocked'),'現場無法完成');
  assert.equal(p.statusText('not_started'),'尚未處理');
  assert.equal(p.statusText('unknown'),'無法確認');
  assert.equal(p.pointTypeText('pipe'),'管線');
  assert.equal(p.pointTypeText('water_body'),'水體');
  assert.equal(p.flowKindText('actual'),'實際水流');
  assert.equal(p.flowKindText('authorized'),'核准／登記流程');
});

test('Water V2 摘要值不直接顯示內部 enum',()=>{
  const w=presentation(),s=w.WaterV2Summary,p=w.WaterV2Presentation;
  assert.equal(p.missingText({key:'water.subject.type'}),'行為主體');
  assert.equal(p.missingText({object:'flow',kind:'actual'}),'實際水流路徑');
  assert.equal(s.valueLabel('water.discharge.destination_type','surface_water_body'),'地面水體');
  assert.equal(s.valueLabel('water.premises.relation_status','confirmed_relation'),'已確認關聯');
});

test('Water V2 可見清單不再直接輸出內部 Point/Incident/Screening/Sampling ID 或 raw status',()=>{
  const src=read('src/water-v2-app.js');
  assert.doesNotMatch(src,/\$\{point\.id\}｜/);
  assert.doesNotMatch(src,/statusChip\(a\.status\)/);
  assert.doesNotMatch(src,/statusChip\(inc\.status\)/);
  assert.doesNotMatch(src,/\$\{inc\.id\}｜\$\{inc\.title\}/);
  assert.doesNotMatch(src,/\$\{s\.id\}｜\$\{pointName\(state,s\.pointRef\)\}/);
  assert.match(src,/pointTypeText\(point\.type\)/);
  assert.match(src,/statusText\(flow\.status\)/);
});

test('Water V2 一般操作重新 render 後保留桌面版捲動位置',()=>{
  const src=read('src/water-v2-summary.js');
  assert.match(src,/pendingView/);
  assert.match(src,/root\.scrollTo/);
  assert.match(src,/requestAnimationFrame/);
  assert.match(src,/data-water-v2-anchor/);
});

test('Water V2 W01 改為三態入口且有發現才展開現場細節',()=>{
  const src=read('src/water-v2-summary.js');
  assert.match(src,/有發現需查情形/);
  assert.match(src,/未發現明顯異常/);
  assert.match(src,/無法確認原因/);
  assert.match(src,/正在排水/);
  assert.match(src,/其他已確認水體／水流/);
  assert.match(src,/dischargeField\.hidden=true/);
  assert.match(src,/showFindings&&val\(state,'water\.observation\.active_discharge'\)==='yes'/);
});

test('Water V2 W02 為時效性事實保全工作區而非 raw Action 狀態頁',()=>{
  const src=read('src/water-v2-summary.js');
  assert.match(src,/先保留可能隨時間消失的現場情形/);
  assert.match(src,/現況已記錄/);
  assert.match(src,/已拍攝/);
  assert.match(src,/未拍攝／無法拍攝/);
  assert.match(src,/前往 W04 循線記錄/);
  assert.match(src,/目前無法確認/);
  assert.match(src,/必要時使用現場工具/);
});
