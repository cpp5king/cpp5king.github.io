const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');

test('4.2 水污染新增現場稽查入口且案件研判保留',async()=>{
  const {config}=await loaded();
  const field=config.caseTypes.find(x=>x.id==='water-field-inspection');
  const assess=config.caseTypes.find(x=>x.id==='water-inspection');
  assert.equal(field.title,'現場稽查');assert.equal(field.directTemplateId,'water-field');
  assert.equal(assess.title,'案件研判（完整母法）');assert.equal(assess.directTemplateId,'water-main');
});

test('4.2 現場稽查依前端順序逐步開啟，不先攤開法律條文',async()=>{
  const e=await loaded(); e.context.document=documentStub(); e.run('src/field-renderer.js');
  const t=e.config.templates.find(x=>x.id==='water-field');
  const view=e.root.FieldRenderer.render(t,()=>{}); const get=id=>nodes(view.element).find(n=>n.id===id);
  assert.equal(get('fieldOperationStatus').parentElement.hidden,true);
  assert.equal(get('waterDestination').parentElement.hidden,true);
  assert.equal(get('fieldFinalConclusionText').parentElement.hidden,true);
  view.write({waterSubjectType:'business',waterSubjectConfirmed:'yes'});
  assert.equal(get('fieldOperationStatus').parentElement.hidden,false);
  assert.equal(get('waterMatterType').parentElement.hidden,true);
});

test('4.2 現場稽查追水到道路側溝時提示追下游而非直接認定地面水體',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const facts=plain(e.root.DraftEngine.normalize(t,{
    waterSubjectType:'business',waterSubjectConfirmed:'yes',fieldOperationStatus:'operating',fieldProcessObserved:'yes',fieldWaterUseObserved:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceTypes:['cleaning'],fieldCollectionStatus:'found',waterTreatmentFacilityApplicable:'no',
    fieldRouteTraced:'yes',waterDestination:'surfaceWater',waterSurfaceType:'roadsideDitch',waterSurfaceWaterConfirmed:'unknown'
  }));
  assert.match(facts.fieldCurrentGuidanceText,/道路側溝不能直接等於地面水體/);
  assert.equal(facts.fieldShowDitch,'yes');
});

test('4.2 現場稽查可複選證據並針對排放自動提示缺少水流影片與排放口',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const facts=plain(e.root.DraftEngine.normalize(t,{
    waterSubjectType:'business',waterSubjectConfirmed:'yes',fieldOperationStatus:'operating',fieldProcessObserved:'yes',fieldWaterUseObserved:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceTypes:['manufacturing','cleaning'],fieldCollectionStatus:'found',waterTreatmentFacilityApplicable:'no',
    fieldRouteTraced:'yes',waterDestination:'surfaceWater',waterSurfaceType:'river',waterSurfaceWaterConfirmed:'yes',waterActualDischarge:'yes',waterDischargePermit:'unknown',
    waterArticle28Scenario:'no',waterSevereHazardRiskConfirmed:'no',waterSampleTaken:'no',waterEvidenceTypes:['overviewPhoto','sourcePhoto']
  }));
  assert.match(facts.fieldEvidenceSummaryText,/水流影片/);
  assert.match(facts.fieldEvidenceSummaryText,/排放口照片/);
  assert.deepEqual(facts.waterSourceTypes,['manufacturing','cleaning']);
});

test('4.2 完成現場查察後才顯示後台法規初步研判',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const base={
    waterSubjectType:'business',waterSubjectConfirmed:'yes',fieldOperationStatus:'operating',fieldProcessObserved:'yes',fieldWaterUseObserved:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceTypes:['manufacturing'],fieldCollectionStatus:'found',waterTreatmentFacilityApplicable:'no',
    fieldRouteTraced:'yes',waterDestination:'surfaceWater',waterSurfaceType:'river',waterSurfaceWaterConfirmed:'yes',waterActualDischarge:'yes',waterDischargePermit:'none',
    waterArticle28Scenario:'no',waterSevereHazardRiskConfirmed:'no',waterSampleTaken:'no',waterEvidenceTypes:['overviewPhoto','sourcePhoto','outletPhoto','flowVideo']
  };
  let facts=plain(e.root.DraftEngine.normalize(t,base));
  assert.equal(facts.fieldShowAssessment,'no');
  facts=plain(e.root.DraftEngine.normalize(t,{...base,waterInvestigationComplete:'yes'}));
  assert.equal(facts.fieldShowAssessment,'yes');
  assert.match(facts.fieldFinalConclusionText,/構成要件事實已完整|尚有要件待確認/);
  assert.match(facts.fieldRulesOverviewText,/§14/);
});

test('4.2 非廢水污染物不會卡在追水流程，可直接走§30棄置分支',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const facts=plain(e.root.DraftEngine.normalize(t,{
    waterSubjectType:'nonBusiness',fieldOperationStatus:'notOperating',fieldProcessObserved:'yes',fieldWaterUseObserved:'no',
    waterMatterType:'sludge',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'yes',waterDesignatedWaterRangeConfirmed:'yes',
    waterArticle28Scenario:'no',waterEvidenceTypes:['overviewPhoto','sourcePhoto'],waterInvestigationComplete:'yes'
  }));
  assert.equal(facts.fieldShowDumping,'yes');
  assert.equal(facts.fieldShowDumpingDetails,'yes');
  assert.equal(facts.fieldShowAssessment,'yes');
  assert.match(facts.fieldRulesOverviewText,/§30/);
});
