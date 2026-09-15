const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');

test('4.2.1 舊現場查察模板仍保留繼續案件研判交接',async()=>{
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

test('4.2.1 舊水污介面預留「產生案件文字」名稱但未核定模板前仍不生成假草稿',async()=>{
  const {config}=await loaded();
  for(const id of ['water-field','water-main']){
    const t=config.templates.find(x=>x.id===id);
    assert.equal(t.draftActionLabel,'產生案件文字');
    assert.ok(t.previewOnlyWhen);
  }
});

test('4.9.33 舊 handoff 只作相容能力，不再由首頁暴露舊入口',async()=>{
  const {config}=await loaded();
  const fieldType=config.caseTypes.find(x=>x.id==='water-field-inspection');
  const assessType=config.caseTypes.find(x=>x.id==='water-inspection');
  const fieldTemplate=config.templates.find(x=>x.id==='water-field');
  assert.equal(fieldType.hidden,true);
  assert.equal(assessType.hidden,true);
  assert.ok(fieldTemplate.handoff);
  assert.equal(fieldTemplate.handoff.caseTypeId,'water-inspection');
  assert.equal(fieldTemplate.handoff.templateId,'water-main');
  const visible=config.caseTypes.filter(x=>x.categoryId==='water'&&!x.hidden);
  assert.deepEqual(visible.map(x=>x.id),['water-v2-inspection']);
});
