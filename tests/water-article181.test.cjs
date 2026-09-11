const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalRule(name,input){const {root}=runtime();return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES[name],root.WaterFacts.build(input)));}
const subject={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes'};

test('§18-1 繞流需確認核准水路、實際水路、繞流事實且無緊急例外',()=>{
  const r=evalRule('article181Bypass',{...subject,waterApprovedRouteConfirmed:'yes',waterActualRouteConfirmed:'yes',waterBypassConfirmed:'yes',waterBypassEmergencyException:'no'});
  assert.equal(r.status,'established');
});

test('§18-1 發現不明管線但未確認實際水路不得直接認定繞流',()=>{
  const r=evalRule('article181Bypass',{...subject,waterApprovedRouteConfirmed:'yes',waterActualRouteConfirmed:'unknown',waterBypassConfirmed:'unknown'});
  assert.equal(r.status,'insufficient');
  assert.ok(r.missingFacts.includes('actualRouteConfirmed'));
  assert.ok(r.missingFacts.includes('bypassConfirmed'));
});

test('§18-1 繞流符合急迫搶救例外時該違規方向不成立',()=>{
  const r=evalRule('article181Bypass',{...subject,waterApprovedRouteConfirmed:'yes',waterActualRouteConfirmed:'yes',waterBypassConfirmed:'yes',waterBypassEmergencyException:'yes'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('noBypassEmergencyException'));
});

test('§18-1 稀釋須先檢核第20條稀釋許可',()=>{
  const r=evalRule('article181Dilution',{...subject,waterRequiresTreatmentToMeetStandard:'yes',waterDilutionObserved:'yes',waterMixedWithNoTreatmentNeededWater:'yes',waterDilutionPermit:'valid',waterDilutionEmergencyException:'no'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('noValidDilutionPermit'));
});

test('§18-1 無稀釋許可且符合其餘要件時成立方向',()=>{
  const r=evalRule('article181Dilution',{...subject,waterRequiresTreatmentToMeetStandard:'yes',waterDilutionObserved:'yes',waterMixedWithNoTreatmentNeededWater:'yes',waterDilutionPermit:'none',waterDilutionEmergencyException:'no'});
  assert.equal(r.status,'established');
});

test('§18-1 處理設施未正常操作可成立第四項方向',()=>{
  const r=evalRule('article181Treatment',{...subject,waterTreatmentFacilityApplicable:'yes',waterTreatmentFunctionSufficient:'yes',waterTreatmentOperatingNormally:'no'});
  assert.equal(r.status,'established');
  assert.ok(r.satisfiedFacts.includes('treatmentFacilityNonCompliant'));
});

test('§18-1 處理設施功能與操作均正常時第四項目前不成立',()=>{
  const r=evalRule('article181Treatment',{...subject,waterTreatmentFacilityApplicable:'yes',waterTreatmentFunctionSufficient:'yes',waterTreatmentOperatingNormally:'yes'});
  assert.equal(r.status,'notEstablished');
});
