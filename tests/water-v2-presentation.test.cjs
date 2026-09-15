const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

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
