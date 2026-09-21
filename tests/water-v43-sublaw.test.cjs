const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain,runtime}=require('./helpers.cjs');

test('4.3 法規版本引擎不以裝置日期代替案件日期',()=>{
  const env=runtime();
  const unknown=plain(env.root.WaterLawVersions.resolve(''));
  assert.equal(unknown.status,'unknown');
  assert.match(unknown.text,/稽查日期尚未填寫/);
});

test('4.3 依稽查日期切換115年10月1日前後許可審查版本提示',()=>{
  const env=runtime();
  const before=plain(env.root.WaterLawVersions.resolve('2026-09-30'));
  const after=plain(env.root.WaterLawVersions.resolve('2026-10-01'));
  assert.equal(before.permitRegime,'2024-01-11-general-with-2026-art57');
  assert.equal(after.permitRegime,'2026-03-24-revision-effective');
  assert.match(before.text,/115年10月1日前/);
  assert.match(after.text,/115年3月24日修正版/);
});

test('4.3 早於115年4月20日案件不以新版水措共通規則回溯下結論',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{
    waterInspectionDate:'2026-04-19',waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',
    waterSublawApprovedMeasuresConfirmed:'yes',waterSublawOperationMatchesApprovedMeasures:'no'
  }));
  assert.match(facts.waterLawVersionText,/早於115年4月20日/);
  assert.match(facts.waterSublawOverviewText,/待確認/);
  assert.doesNotMatch(facts.waterSublawOverviewText,/§4 核准內容與現場：⚠ 疑似不符合/);
});

test('4.3 核准水措內容與現場不一致可形成管理辦法第4條疑似不符合方向',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{
    waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',
    waterSublawApprovedMeasuresConfirmed:'yes',waterSublawOperationMatchesApprovedMeasures:'no'
  }));
  assert.equal(facts.waterShowSublawCore,'yes');
  assert.match(facts.waterSublawOverviewText,/§4 核准內容與現場：⚠ 疑似不符合/);
  assert.match(facts.waterFinalConclusionText,/B｜構成要件事實已完整|C｜尚有要件待確認/);
});

test('4.3 貯留案件自動開啟第39與40條共通檢核',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{
    waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterDestination:'storage',
    waterSublawStorageMeterCompliant:'yes',waterSublawStorageRecordsCompliant:'yes',waterSublawStorageCapacityCompliant:'yes'
  }));
  assert.equal(facts.waterShowSublawStorage,'yes');
  assert.match(facts.waterSublawOverviewText,/§39 貯留水量計測：✓ 目前未見不符/);
  assert.match(facts.waterSublawOverviewText,/§39 貯留紀錄：✓ 目前未見不符/);
  assert.match(facts.waterSublawOverviewText,/§40 貯留應變容量：✓ 目前未見不符/);
});

test('4.3 地面水體放流案件開啟第53條放流口共通檢核',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  const facts=plain(env.root.DraftEngine.normalize(t,{
    waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',
    waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',
    waterSublawOutletLocationCompliant:'yes',waterSublawOutletAccessCompliant:'yes',
    waterSublawOutletMeterCompliant:'yes',waterSublawOutletSignCompliant:'yes',waterSublawOutletSamplingCompliant:'yes',
    waterSublawOutletIsManhole:'no'
  }));
  assert.equal(facts.waterShowSublawOutlet,'yes');
  assert.match(facts.waterSublawOverviewText,/§53 放流口位置：✓ 目前未見不符/);
  assert.match(facts.waterSublawOverviewText,/§53 可直接採樣：✓ 目前未見不符/);
});

test('4.3 現場模式保留案件日期並顯示子法版本判定',async()=>{
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-field');
  const facts=plain(env.root.DraftEngine.normalize(t,{waterInspectionDate:'2026-09-11'}));
  assert.equal(facts.waterInspectionDate,'2026-09-11');
  assert.match(facts.waterLawVersionText,/水措管理/);
});
