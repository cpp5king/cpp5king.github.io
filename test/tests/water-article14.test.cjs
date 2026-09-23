const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalCase(input){
  const { root }=runtime();
  return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES.article14NoPermit,root.WaterFacts.build(input)));
}

test('§14五項核心要件全部確認才輸出成立方向',()=>{
  const r=evalCase({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterDischargePermit:'none'});
  assert.equal(r.status,'established');
  assert.equal(r.missingFacts.length,0);assert.equal(r.failedFacts.length,0);
});

test('§14道路側溝未確認地面水體時必須事證不足並提示追水',()=>{
  const r=evalCase({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceType:'roadsideDitch',waterSurfaceWaterConfirmed:'unknown',waterDischargePermit:'none'});
  assert.equal(r.status,'insufficient');
  assert.ok(r.missingFacts.includes('surfaceWaterConfirmed'));
  assert.ok(r.nextChecks.includes('確認道路側溝排水功能'));
  assert.ok(r.nextChecks.includes('追查下游集水井、箱涵或雨水下水道'));
});

test('§14有有效許可時無許可排放要件不成立',()=>{
  const r=evalCase({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterDischargePermit:'valid'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('noValidDischargePermit'));
});

test('§14非水污法事業時不得因水髒或排水直接成立',()=>{
  const r=evalCase({waterSubjectType:'nonBusiness',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterDischargePermit:'none'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('subjectIsBusiness'));
});
