const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');

test('4.0-dev3 水污染分類與主流程已正式接入 catalog',async()=>{
  const { config }=await loaded();
  assert.equal(config.categories.find(x=>x.id==='water').status,'active');
  const type=config.caseTypes.find(x=>x.id==='water-inspection');
  assert.equal(type.status,'active');assert.equal(type.directTemplateId,'water-main');
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

test('水污首頁可直接點入，判斷流程不顯示公文草稿按鈕',async()=>{
  const env=await loaded();const doc=documentStub(),app=doc.createElement('main');doc.getElementById=()=>app;env.context.document=doc;env.root.confirm=()=>true;env.root.TemplateLoader.load=async()=>env.config;
  env.run('src/field-renderer.js');env.run('src/sentence-app.js');await new Promise(r=>setImmediate(r));
  const click=text=>{const b=nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===text);assert.ok(b,text);b.dispatch('click');};
  click('水污染');click('案件研判（完整母法）');
  assert.ok(app.querySelector('form'));
  const draftButton=nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent==='產生案件文字');
  assert.ok(draftButton);assert.equal(draftButton.parentElement.hidden,true);
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
