const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function evalRule(name,input){const {root}=runtime();return plain(root.WaterRuleEngine.evaluate(root.WATER_RULES[name],root.WaterFacts.build(input)));}
const base={waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes'};

test('§32 廢污水排放土壤且查無有效土壤處理許可時成立方向',()=>{
  const r=evalRule('article32Soil',{...base,waterDestination:'soil',waterSoilTreatmentPermit:'none'});
  assert.equal(r.status,'established');
});

test('§32 排放土壤有有效許可時無許可方向不成立',()=>{
  const r=evalRule('article32Soil',{...base,waterDestination:'soil',waterSoilTreatmentPermit:'valid'});
  assert.equal(r.status,'notEstablished');
});

test('§32 管線往地下但未確認進入地下水體不得認定注入地下水體',()=>{
  const r=evalRule('article32Groundwater',{...base,waterDestination:'groundwater',waterGroundwaterBodyConfirmed:'unknown'});
  assert.equal(r.status,'insufficient');
  assert.ok(r.missingFacts.includes('injectedIntoGroundwaterBodyConfirmed'));
});

test('§32 已確認廢污水實際注入地下水體時成立方向',()=>{
  const r=evalRule('article32Groundwater',{...base,waterDestination:'groundwater',waterGroundwaterBodyConfirmed:'yes'});
  assert.equal(r.status,'established');
});
