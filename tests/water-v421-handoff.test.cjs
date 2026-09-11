const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');

test('4.2.1 現場查察完成後提供繼續案件研判交接',async()=>{
  const {config}=await loaded();
  const t=config.templates.find(x=>x.id==='water-field');
  assert.ok(t.handoff);
  assert.equal(t.handoff.label,'繼續案件研判');
  assert.equal(t.handoff.caseTypeId,'water-inspection');
  assert.equal(t.handoff.templateId,'water-main');
  assert.deepEqual(plain(t.handoff.when),{field:'fieldShowAssessment',value:'yes'});
});

test('4.2.1 交接到完整母法模式時保留已填共同事實並重新計算目標模板',async()=>{
  const {root,config}=await loaded();
  const session=root.CaseSession.create(config);
  session.selectCategory('water');
  session.selectCaseType('water-field-inspection');
  session.selectTemplate('water-field');
  const facts={
    waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',
    waterSourceTypes:['manufacturing','cleaning'],
    waterActualDischarge:'yes',waterDestination:'surfaceWater',
    waterSurfaceType:'roadsideDitch',waterSurfaceWaterConfirmed:'unknown',
    waterEvidenceTypes:['overviewPhoto','flowVideo']
  };
  session.handoff('water-inspection','water-main',facts);
  const state=session.snapshot();
  assert.equal(state.caseTypeId,'water-inspection');
  assert.equal(state.templateId,'water-main');
  assert.equal(state.inputs.waterSubjectType,'business');
  assert.deepEqual(plain(state.inputs.waterSourceTypes),['manufacturing','cleaning']);
  assert.equal(state.inputs.waterDestination,'surfaceWater');
  assert.equal(state.inputs.waterSurfaceType,'roadsideDitch');
  assert.equal(state.inputs.waterSurfaceWaterConfirmed,'unknown');
  assert.equal(state.inputs.waterShowDitchDetails,'yes');
  assert.equal(state.inputs.waterRuleStatus,'insufficient');
});

test('4.2.1 水污介面預留「產生案件文字」名稱但未核定模板前仍不生成假草稿',async()=>{
  const {config}=await loaded();
  for(const id of ['water-field','water-main']){
    const t=config.templates.find(x=>x.id===id);
    assert.equal(t.draftActionLabel,'產生案件文字');
    assert.ok(t.previewOnlyWhen);
  }
});

test('4.2.1 介面的「繼續案件研判」按鈕可實際切換到完整母法模式',async()=>{
  const {documentStub,nodes}=require('./dom-stub.cjs');
  const env=await loaded();
  // 本測試只驗證交接按鈕本身，條件顯示另由前述 workflow 測試負責。
  env.config.templates.find(x=>x.id==='water-field').handoff.when=null;
  const doc=documentStub(),app=doc.createElement('main');
  doc.getElementById=()=>app;
  env.context.document=doc;
  env.root.confirm=()=>true;
  env.root.TemplateLoader.load=async()=>env.config;
  env.run('src/field-renderer.js');
  env.run('src/sentence-app.js');
  await new Promise(r=>setImmediate(r));
  const button=text=>nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===text);
  button('水污染').dispatch('click');
  button('現場稽查').dispatch('click');
  const handoff=button('繼續案件研判');
  assert.ok(handoff);
  handoff.dispatch('click');
  assert.match(app.textContent,/案件研判（完整母法）/);
});
