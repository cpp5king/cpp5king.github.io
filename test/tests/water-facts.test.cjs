const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

test('水污統一事實：未確認不得轉成否定或肯定', () => {
  const { root } = runtime();
  const f = plain(root.WaterFacts.build({ waterSubjectType:'business', waterSubjectConfirmed:'unknown', waterWastewaterStatus:'unknown', waterActualDischarge:'unknown', waterDestination:'unknown' }));
  assert.equal(f.subjectIsBusiness,'unknown');
  assert.equal(f.wastewaterConfirmed,'unknown');
  assert.equal(f.actualDischargeConfirmed,'unknown');
  assert.equal(f.surfaceWaterConfirmed,'unknown');
  assert.equal(f.noValidDischargePermit,'unknown');
});

test('水污統一事實：非地面水體去向明確時地面水體要件為否', () => {
  const { root } = runtime();
  const f = plain(root.WaterFacts.build({ waterSubjectType:'business', waterSubjectConfirmed:'yes', waterDestination:'storage' }));
  assert.equal(f.subjectIsBusiness,'yes');
  assert.equal(f.surfaceWaterConfirmed,'no');
});

test('水污統一事實：道路側溝不自動等於地面水體', () => {
  const { root } = runtime();
  const f = plain(root.WaterFacts.build({ waterDestination:'surfaceWater', waterSurfaceType:'roadsideDitch', waterSurfaceWaterConfirmed:'unknown' }));
  assert.equal(f.surfaceType,'roadsideDitch');
  assert.equal(f.surfaceWaterConfirmed,'unknown');
});
