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
    'src/water-legal-adapter.js',
    'src/water-v2-ui.js'
  ].forEach(e.run);
  return e;
}
function analyze(input){return plain(env().root.WaterLegalAdapter.analyze(input));}
function result(out,id){return out.legal.results.find(x=>x.ruleId===id);}
function base(overrides={}){
  return {waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',...overrides};
}

test('V2-1 正常核准放流且正式檢驗符合標準，不誤報 §7、§14、§18-1',()=>{
  const out=analyze(base({
    waterDischargePermit:'valid',waterPermitSourceCompare:'match',waterPermitProcessCompare:'match',waterPermitOutletCompare:'match',waterPermitDestinationCompare:'match',waterPermitFacilityCompare:'match',
    waterSampleTaken:'yes',waterLabResultAvailable:'yes',waterApplicableStandardConfirmed:'yes',waterEffluentExceeded:'no',
    waterV2Flows:[
      {id:'AF1',kind:'authorized',from:'P1',to:'T1',status:'confirmed'},
      {id:'AF2',kind:'authorized',from:'T1',to:'D01',status:'confirmed'},
      {id:'F1',kind:'actual',from:'P1',to:'T1',status:'confirmed'},
      {id:'F2',kind:'actual',from:'T1',to:'D01',status:'confirmed'}
    ]
  }));
  assert.equal(result(out,'LAW-WATER-007-01').status,'no_issue_found');
  assert.equal(result(out,'LAW-WATER-014-01-A').status,'no_issue_found');
  assert.equal(result(out,'LAW-WATER-014-01-B').status,'no_issue_found');
  assert.equal(result(out,'LAW-WATER-018-1-01-C').status,'no_issue_found');
});

test('V2-2 額外管線但未直接確認繞過流程，不自動成立繞流',()=>{
  const out=analyze(base({waterDischargePermit:'valid',waterV2Flows:[
    {id:'AF1',kind:'authorized',from:'P1',to:'T1',status:'confirmed'},
    {id:'AF2',kind:'authorized',from:'T1',to:'D01',status:'confirmed'},
    {id:'F1',kind:'actual',from:'P1',to:'P8',status:'confirmed'}
  ]}));
  assert.equal(result(out,'LAW-WATER-018-1-01-C').status,'facts_insufficient');
});

test('V2-3 已直接確認實際水流繞過核准流程，只到主要要件大致具備',()=>{
  const out=analyze(base({waterDischargePermit:'valid',waterV2Flows:[
    {id:'AF1',kind:'authorized',from:'P1',to:'T1',status:'confirmed'},
    {id:'AF2',kind:'authorized',from:'T1',to:'D01',status:'confirmed'},
    {id:'F1',kind:'actual',from:'P1',to:'P8',status:'confirmed',bypassesAuthorized:true},
    {id:'F2',kind:'actual',from:'P8',to:'DITCH',status:'confirmed'}
  ]}));
  assert.equal(result(out,'LAW-WATER-018-1-01-C').status,'elements_substantially_met');
});

test('V2-4 處理設施故障 26 小時但尚無排放事實，不由 Batch A 創造違規',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterTreatmentFacilityApplicable:'yes',waterTreatmentOperatingNormally:'no',waterFacilityFailureConfirmed:'yes',waterFacilityFailureHours:26});
  assert.equal(out.legal.results.some(r=>r.status==='potential_violation'),false);
});

test('V2-5 查無許可資料不等於確認未取得許可',()=>{
  const out=analyze(base({waterDischargePermit:'notFound'}));
  assert.equal(result(out,'LAW-WATER-014-01-A').status,'facts_insufficient');
});

test('V2-6 貯留許可差異保留事實，但 Batch A 不越權下 §20 結論',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterDestination:'storage',waterStoragePermit:'valid',waterStorageRegistrationMismatch:'yes'});
  assert.equal(out.session.facts.some(f=>f.key==='water.storage.registration_difference'&&f.value==='yes'),true);
  assert.equal(out.legal.results.some(r=>r.status==='potential_violation'),false);
});

test('V2-7 廢水輸送設備破裂進入水體，逾三小時通知可被規則抓出',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle28Scenario:'yes',waterTransportStorageEquipmentConfirmed:'yes',waterLeakRiskToWaterBodyConfirmed:'yes',waterMaintenancePreventionTaken:'yes',waterLeakPollutedWaterBody:'yes',waterEmergencyActionTaken:'yes',waterEmergencyIncidentTime:'2026-09-16T14:10:00+08:00',waterEmergencyNotificationTime:'2026-09-16T17:30:00+08:00'});
  const r=result(out,'LAW-WATER-028-01');
  assert.equal(r.elements.find(x=>x.label==='事故後三小時通知').status,'not_met');
  assert.equal(r.status,'possible_application');
});

test('V2-8 未達規模食品製造排水可依案件日期比對 §30Ⅰ⑤ 公告方向',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'nonBusiness',waterSubjectConfirmed:'yes',waterIndustryType:'food_manufacturing',waterRegulatoryScaleStatus:'below_regulated_scale',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterControlZoneConfirmed:'yes',waterDischargeAffectsWaterQuality:'confirmed'});
  assert.equal(result(out,'LAW-WATER-030-05').status,'elements_substantially_met');
});

test('V2-9 主動排廢污水於土壤且確認未取得土壤處理許可，可開啟 §32 方向',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'soil',waterSoilContactMode:'intentional_discharge',waterSoilTreatmentPermit:'none'});
  assert.equal(result(out,'LAW-WATER-032-01-B1').status,'potential_violation');
});

test('V2-10 只看到異常水但來源、性質、去向未知，不自行補法律事實',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',fieldSourceMode:'unknown',fieldUnknownWaterObserved:'yes',fieldUnknownWaterSigns:['turbid']});
  assert.equal(out.legal.results.some(r=>r.status==='potential_violation'||r.status==='elements_substantially_met'),false);
  assert.equal(out.workflow.state,'source_tracing');
});

test('V2 防錯：快篩結果不得滿足第7條正式檢驗要件',()=>{
  const out=analyze(base({waterV2Screenings:[{id:'S1',parameter:'COD',result:{type:'quantitative',value:999}}]}));
  assert.notEqual(result(out,'LAW-WATER-007-01').status,'potential_violation');
});

test('V2 防錯：意外洩漏到土壤不等同主動排放於土壤',()=>{
  const out=analyze({waterInspectionDate:'2026-09-16',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'soil',waterSoilContactMode:'accidental_leak',waterArticle28Scenario:'yes',waterTransportStorageEquipmentConfirmed:'yes'});
  assert.equal(result(out,'LAW-WATER-032-01-B1').status,'not_applicable');
});

test('V2 UI bridge 將流程建議加入現場即時判定，案件完成後加入法規研判摘要',async()=>{
  const e=env();
  await e.root.TemplateLoader.load(e.root.INSPECTION_CONFIG,file=>e.run('data/templates/'+file));
  const t=e.root.INSPECTION_CONFIG.templates.find(x=>x.id==='water-field');
  const facts=plain(e.root.DraftEngine.normalize(t,{waterInspectionDate:'2026-09-16',fieldSourceMode:'unknown',fieldUnknownWaterObserved:'yes',fieldUnknownWaterSigns:['continuous']}));
  assert.match(facts.fieldLiveDecisionText,/【V2流程】/);
  assert.match(facts.fieldCurrentGuidanceText,/V2主要建議/);
});
