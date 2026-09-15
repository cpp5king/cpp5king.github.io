const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');

test('4.0-dev3 水污染分類與舊完整母法核心仍保留相容',async()=>{
  const { config }=await loaded();
  assert.equal(config.categories.find(x=>x.id==='water').status,'active');
  const type=config.caseTypes.find(x=>x.id==='water-inspection');
  assert.equal(type.status,'active');assert.equal(type.directTemplateId,'water-main');assert.equal(type.hidden,true);
  assert.ok(config.templates.some(x=>x.id==='water-main'));
});

test('水污主流程依序開啟節點且道路側溝仍保留未知',async()=>{
  const env=await loaded(); env.context.document=documentStub(); env.run('src/field-renderer.js');
  const t=env.config.templates.find(x=>x.id==='water-main');
  const view=env.root.FieldRenderer.render(t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);
  assert.equal(get('waterWastewaterStatus').parentElement.hidden,true);
  view.write({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceType:'roadsideDitch',waterSurfaceWaterConfirmed:'unknown'});
  const facts=plain(env.root.DraftEngine.normalize(t,view.read()));
  assert.equal(facts.waterShowDitchDetails,'yes');
  assert.equal(facts.waterRuleStatus,'insufficient');
  assert.match(facts.waterAssessmentText,/事證不足/);
  assert.match(facts.waterNextChecksText,/道路側溝排水功能/);
  assert.equal(facts.waterShowPermit,'no');
});

test('水污上游答案改變會清除不再有效的下游事實',async()=>{
  const env=await loaded();const w=env.root.TemplateWorkflows.waterMain;
  const before={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceType:'roadsideDitch',waterSurfaceWaterConfirmed:'yes',waterDischargePermit:'none'};
  const after=w.resetChange(before,{...before,waterWastewaterStatus:'no'});
  assert.equal(after.waterActualDischarge,'');
  assert.equal(after.waterDestination,'');
  assert.equal(after.waterSurfaceType,'');
  assert.equal(after.waterDischargePermit,'');
});

test('4.9.33 舊完整母法模板留在相容層，不再作首頁主入口',async()=>{
  const env=await loaded();
  const type=env.config.caseTypes.find(x=>x.id==='water-inspection');
  const template=env.config.templates.find(x=>x.id==='water-main');
  assert.ok(type);assert.equal(type.hidden,true);assert.equal(type.directTemplateId,'water-main');
  assert.ok(template);assert.equal(template.id,'water-main');
  const visible=env.config.caseTypes.filter(x=>x.categoryId==='water'&&!x.hidden);
  assert.deepEqual(visible.map(x=>x.id),['water-v2-inspection']);
});

test('4.0-dev3 地面水體確認後平行開啟 §7，且§7不受§14許可狀態控制',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterDischargePermit:'valid',waterSampleTaken:'no'}));
  assert.equal(facts.waterShowArticle7,'yes');
  assert.match(facts.waterArticle7Text,/事證不足/);
  assert.match(facts.waterArticle14Text,/目前不成立/);
});

test('4.0-dev3 污水下水道系統可進§7與§18-1，但不顯示事業§14區塊',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterSubjectType:'sewerSystem',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes'}));
  assert.equal(facts.waterShowArticle14,'no');
  assert.equal(facts.waterShowArticle7,'yes');
  assert.equal(facts.waterShowArticle181,'yes');
});

test('4.0-dev3 §18-1 詳細結果只展開已走到的異常態樣',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterApprovedRouteConfirmed:'yes',waterActualRouteConfirmed:'yes',waterBypassConfirmed:'yes',waterBypassEmergencyException:'no',waterDilutionObserved:'no',waterTreatmentFacilityApplicable:'no'}));
  assert.match(facts.waterArticle181Text,/繞流排放/);
  assert.match(facts.waterArticle181Text,/違法稀釋/);
  assert.match(facts.waterArticle181Text,/處理設施功能/);
  assert.match(facts.waterArticle181Text,/構成要件完整/);
});
