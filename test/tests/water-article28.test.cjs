const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalRule(name,input){const {root}=runtime();return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES[name],root.WaterFacts.build(input)));}
const base={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle28Scenario:'yes',waterTransportStorageEquipmentConfirmed:'yes'};

test('§28 設備有疏漏至水體之虞且未採維護防範措施時成立方向',()=>{
  const r=evalRule('article28Prevention',{...base,waterLeakCause:'pipeFailure',waterLeakRiskToWaterBodyConfirmed:'yes',waterMaintenancePreventionTaken:'no'});
  assert.equal(r.status,'established');
});

test('§28 人為開閥主動排放不硬套設備疏漏',()=>{
  const r=evalRule('article28Prevention',{...base,waterLeakCause:'humanDischarge',waterLeakRiskToWaterBodyConfirmed:'yes',waterMaintenancePreventionTaken:'no'});
  assert.equal(r.status,'notApplicable');
  assert.ok(r.notApplicableFacts.includes('equipmentLeakScenarioEligible'));
});

test('§28 疏漏污染水體後未立即應變可成立方向',()=>{
  const r=evalRule('article28Emergency',{...base,waterLeakCause:'tankFailure',waterLeakPollutedWaterBody:'yes',waterEmergencyActionTaken:'no'});
  assert.equal(r.status,'established');
});

test('§28 疏漏污染水體後已立即應變則未立即應變方向不成立',()=>{
  const r=evalRule('article28Emergency',{...base,waterLeakCause:'overflow',waterLeakPollutedWaterBody:'yes',waterEmergencyActionTaken:'yes'});
  assert.equal(r.status,'notEstablished');
});

test('§28 疏漏污染水體後未於3小時通知可成立方向',()=>{
  const r=evalRule('article28Notice',{...base,waterLeakCause:'levelFailure',waterLeakPollutedWaterBody:'yes',waterThreeHourNotice:'no'});
  assert.equal(r.status,'established');
});
