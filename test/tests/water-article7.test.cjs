const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalCase(input){const {root}=runtime();return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES.article7Effluent,root.WaterFacts.build(input)));}
const base={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes'};

test('§7 有代表性採樣與有效檢測且超標才成立',()=>{
  const r=evalCase({...base,waterSampleTaken:'yes',waterSampleRepresentative:'yes',waterSampleBeforeReceivingWater:'yes',waterApplicableStandardConfirmed:'yes',waterLabResultAvailable:'yes',waterEffluentExceeded:'yes'});
  assert.equal(r.status,'established');
});

test('§7 未採樣屬事證不足，不得把肉眼污染直接當超標',()=>{
  const r=evalCase({...base,waterSampleTaken:'no'});
  assert.equal(r.status,'insufficient');
  assert.ok(r.missingFacts.includes('sampleTaken'));
  assert.ok(r.nextChecks.some(x=>x.includes('採樣')));
});

test('§7 檢測確認未超標時目前不成立',()=>{
  const r=evalCase({...base,waterSampleTaken:'yes',waterSampleRepresentative:'yes',waterSampleBeforeReceivingWater:'yes',waterApplicableStandardConfirmed:'yes',waterLabResultAvailable:'yes',waterEffluentExceeded:'no'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('effluentExceeded'));
});

test('§7 非管制主體標記不適用',()=>{
  const r=evalCase({waterSubjectType:'nonBusiness',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes'});
  assert.equal(r.status,'notApplicable');
});

test('§7 污水下水道系統與建築物污水處理設施均可進入主體要件',()=>{
  for(const type of ['sewerSystem','buildingSewage']){
    const r=evalCase({waterSubjectType:type,waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterSampleTaken:'no'});
    assert.equal(r.status,'insufficient');
    assert.ok(r.satisfiedFacts.includes('article7SubjectEligible'));
  }
});
