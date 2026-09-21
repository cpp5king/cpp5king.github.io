const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain } = require('./helpers.cjs');

test('4.0-dev3 非事業污染物棄置可進§30而不需硬走廢水流程',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterBehaviorDate:'2026-09-11',waterSubjectType:'nonBusiness',waterMatterType:'garbage',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'yes',waterDesignatedWaterRangeConfirmed:'yes'}));
  assert.equal(facts.waterShowWastewater,'no');
  assert.equal(facts.waterShowArticle30,'yes');
  assert.match(facts.waterArticle30Text,/構成要件事實已完整/);
});

test('4.0-dev3 廢污水排土壤會開啟§32且有效土壤處理許可使該方向不成立',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterBehaviorDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'soil',waterSoilTreatmentPermit:'valid'}));
  assert.equal(facts.waterShowArticle32,'yes');
  assert.match(facts.waterArticle32Text,/目前不支持/);
});

test('4.0-dev3 設備故障與人為主動排放分流',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const equipment=plain(env.root.DraftEngine.normalize(t,{waterBehaviorDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle28Scenario:'yes',waterTransportStorageEquipmentConfirmed:'yes',waterLeakCause:'pipeFailure',waterLeakRiskToWaterBodyConfirmed:'yes',waterMaintenancePreventionTaken:'no'}));
  assert.match(equipment.waterArticle28Text,/構成要件事實已完整/);
  const human=plain(env.root.DraftEngine.normalize(t,{waterBehaviorDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle28Scenario:'yes',waterTransportStorageEquipmentConfirmed:'yes',waterLeakCause:'humanDischarge'}));
  assert.match(human.waterArticle28Text,/人為開閥|主動抽排|法規層研判/);
});

test('4.0-dev3 變更主要物質會清除舊廢水與棄置支線資料',async()=>{
  const env=await loaded();const w=env.root.TemplateWorkflows.waterMain;
  const before={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'soil',waterSoilTreatmentPermit:'none',waterArticle28Scenario:'yes'};
  const after=w.resetChange(before,{...before,waterMatterType:'sludge'});
  assert.equal(after.waterWastewaterStatus,'');
  assert.equal(after.waterDestination,'');
  assert.equal(after.waterSoilTreatmentPermit,'');
  assert.equal(after.waterArticle28Scenario,'');
});
