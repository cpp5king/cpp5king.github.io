const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalRule(input){const {root}=runtime();return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES.article30Dumping,root.WaterFacts.build(input)));}

test('§30 污泥於水污染管制區指定水體沿岸範圍內棄置時成立方向',()=>{
  const r=evalRule({waterMatterType:'sludge',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'yes',waterDesignatedWaterRangeConfirmed:'yes'});
  assert.equal(r.status,'established');
});

test('§30 未確認水污染管制區時不得直接認定',()=>{
  const r=evalRule({waterMatterType:'acidAlkaliWasteLiquid',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'unknown',waterDesignatedWaterRangeConfirmed:'yes'});
  assert.equal(r.status,'insufficient');
  assert.ok(r.missingFacts.includes('controlZoneConfirmed'));
});

test('§30 一般管線排放廢污水不以污染物棄置模組直接套用',()=>{
  const r=evalRule({waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterDumpingConfirmed:'yes',waterControlZoneConfirmed:'yes',waterDesignatedWaterRangeConfirmed:'yes'});
  assert.equal(r.status,'notEstablished');
  assert.ok(r.failedFacts.includes('article30MatterEligible'));
});
