const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');

test('4.7.2 iPhone 日期在原生選擇器仍開啟時不完成，關閉後才提交',async()=>{
  const e=await loaded();
  e.root.innerWidth=390;
  const doc=documentStub();
  e.context.document=doc;
  e.root.document=doc;
  e.run('src/field-renderer.js');
  const template=e.config.templates.find(x=>x.id==='water-field');
  let changes=0,lastFacts=null;
  const r=e.root.FieldRenderer.render(template,facts=>{changes++;lastFacts=facts;});
  const date=nodes(r.element).find(n=>n.id==='waterInspectionDate');
  assert.ok(date,'找不到日期欄位');
  date.value='2026-09-12';
  doc.activeElement=date;
  date.dispatch('input',{target:date});
  date.dispatch('change',{target:date});
  assert.equal(changes,0,'選擇器開啟期間不應提交日期');
  doc.activeElement=null;
  date.dispatch('focusout',{target:date});
  assert.equal(changes,1,'關閉日期選擇器後應提交一次');
  assert.equal(lastFacts.waterInspectionDate,'2026-09-12');

  const renderer=require('node:fs').readFileSync('src/field-renderer.js','utf8');
  assert.match(renderer,/shouldDeferMobileDate/);
  assert.match(renderer,/activeElement === target/);
  assert.match(renderer,/"focusout"/);
});
test('4.7.2 母法最上方加入簡易研判與缺漏事證，成立且無待查時標示違反法規',async()=>{
  const e=await loaded();
  e.run('src/field-renderer.js');
  e.run('src/pwa.js');
  const t=e.config.templates.find(x=>x.id==='water-main');
  assert.equal(t.version,'4.7.2');
  assert.equal(t.assessmentFloatingActions,true);
  const dateIndex=t.fields.findIndex(x=>x.id==='waterInspectionDate');
  assert.ok(t.fields.findIndex(x=>x.id==='waterLiveDecisionText')<dateIndex);
  assert.ok(t.fields.findIndex(x=>x.id==='waterLiveMissingText')<dateIndex);

  let out=e.root.DraftEngine.normalize(t,{waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'unknown'});
  assert.match(out.waterLiveDecisionText,/尚在查證|目前可能涉及/);
  assert.match(out.waterLiveMissingText,/尚缺關鍵事證/);

  out=e.root.DraftEngine.normalize(t,{waterInspectionDate:'2026-09-12',waterSubjectType:'nonBusiness',waterMatterType:'sludge',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'yes',waterDesignatedWaterRangeConfirmed:'yes',waterInvestigationComplete:'yes'});
  assert.match(out.waterLiveDecisionText,/違反法規/);
  assert.match(out.waterLiveDecisionText,/§30/);
});

test('4.7.2 母法頁建立專用浮動導覽，不出現現場結束與緊急按鍵',async()=>{
  const e=await loaded();
  e.root.innerWidth=390;
  const doc=documentStub();e.context.document=doc;
  e.run('src/field-renderer.js');
  e.run('src/pwa.js');
  const t=e.config.templates.find(x=>x.id==='water-main');
  const r=e.root.FieldRenderer.render(t,()=>{});
  const labels=nodes(r.element).filter(n=>n.tagName==='BUTTON').map(n=>n.textContent);
  for(const label of ['← 上一步','研判摘要','下一步 →','缺漏事證'])assert.ok(labels.includes(label),label+' 未建立');
  assert.ok(!labels.includes('結束本次查察'));
  assert.ok(!labels.includes('立即處置／緊急應變'));
});

test('4.7.2 母法模板補丁在動態模板載入完成後套用',async()=>{
  const e=await loaded();
  const t=e.config.templates.find(x=>x.id==='water-main');
  assert.equal(t.version,'4.7.2');
  assert.equal(t.assessmentFloatingActions,true);
  const dateIndex=t.fields.findIndex(x=>x.id==='waterInspectionDate');
  assert.ok(t.fields.findIndex(x=>x.id==='waterLiveDecisionText')<dateIndex);
  assert.ok(t.fields.findIndex(x=>x.id==='waterLiveMissingText')<dateIndex);
});
