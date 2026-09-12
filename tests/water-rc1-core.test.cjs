const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain } = require('./helpers.cjs');

async function norm(input){
  const env=await loaded();
  const t=env.config.templates.find(x=>x.id==='water-main');
  return plain(env.root.DraftEngine.normalize(t,input));
}

test('4.0-rc1 §13 指定事業於設立變更前查無核准水措計畫可形成成立方向',async()=>{
  const f=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterArticle13NewOrChangeConfirmed:'yes',waterArticle13DesignatedSubjectConfirmed:'yes',waterMeasuresPlanApproval:'none'});
  assert.match(f.waterArticle13Text,/構成要件完整/);
  assert.match(f.waterArticle13Text,/第13條/);
});

test('4.0-rc1 §18 未進子法時只提示待查，已確認具體義務且不符才成立',async()=>{
  const pending=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterArticle18SpecificDutyConfirmed:'unknown'});
  assert.match(pending.waterArticle18Text,/4\.3 已接入部分共通子法規則/);
  const hit=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterArticle18SpecificDutyConfirmed:'yes',waterArticle18NoncomplianceConfirmed:'yes'});
  assert.match(hit.waterArticle18Text,/構成要件完整/);
});

test('4.0-rc1 沒有向外排放仍可追到貯留並進§20',async()=>{
  const f=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'no',waterDestination:'storage',waterStorageActivityConfirmed:'yes',waterStoragePermit:'none'});
  assert.equal(f.waterShowDestination,'yes');
  assert.equal(f.waterShowStorageDetails,'yes');
  assert.match(f.waterArticle20Text,/未經許可貯留廢水/);
  assert.match(f.waterArticle20Text,/構成要件完整/);
});

test('4.0-rc1 §20 有有效貯留許可但未依登記事項可獨立成立方向',async()=>{
  const f=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterDestination:'storage',waterStorageActivityConfirmed:'yes',waterStoragePermit:'valid',waterStorageRegistrationMismatch:'yes'});
  assert.match(f.waterArticle20Text,/貯留未依登記事項運作/);
  assert.match(f.waterArticle20Text,/構成要件完整/);
});

test('4.0-rc1 §22與§35分離，資料不一致不直接等於明知不實',async()=>{
  const f=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle22ReportingDutyConfirmed:'yes',waterArticle22ReportingNoncomplianceConfirmed:'no',waterReportedDataMismatch:'yes',waterFalseReportOrBusinessRecordConfirmed:'yes',waterKnowingFalseEvidenceConfirmed:'unknown'});
  assert.match(f.waterArticle22Text,/目前不成立/);
  assert.match(f.waterArticle35Text,/事證不足/);
  assert.match(f.waterArticle35Text,/明知不實/);
});

test('4.0-rc1 §35須有明知證據才形成刑事疑義完整方向',async()=>{
  const f=await norm({waterSubjectType:'sewerSystem',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterArticle22ReportingDutyConfirmed:'yes',waterReportedDataMismatch:'yes',waterFalseReportOrBusinessRecordConfirmed:'yes',waterKnowingFalseEvidenceConfirmed:'yes'});
  assert.match(f.waterArticle35Text,/構成要件完整/);
  assert.match(f.waterArticle35Text,/刑事疑義/);
});

test('4.0-rc1 §26需先建立合法查證基礎再判規避妨礙拒絕',async()=>{
  const f=await norm({waterSubjectType:'buildingSewage',waterArticle26InspectionBasisConfirmed:'yes',waterArticle26ObstructionConfirmed:'yes'});
  assert.equal(f.waterShowArticle26Obstruction,'yes');
  assert.match(f.waterArticle26Text,/構成要件完整/);
});

test('4.0-rc1 §27重大危害同時檢核立即應變與3小時通知',async()=>{
  const f=await norm({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterSevereHazardRiskConfirmed:'yes',waterEmergencyActionTaken:'no',waterThreeHourNotice:'no'});
  assert.match(f.waterArticle27Text,/重大危害未立即緊急應變/);
  assert.match(f.waterArticle27Text,/重大危害未於3小時內通知/);
  assert.match(f.waterFinalConclusionText,/D｜重大／緊急污染/);
});

test('4.0-rc1 §59六項完整時會提示可能適用24小時標準例外',async()=>{
  const base={waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'yes',waterSampleTaken:'yes',waterSampleRepresentative:'yes',waterSampleBeforeReceivingWater:'yes',waterApplicableStandardConfirmed:'yes',waterLabResultAvailable:'yes',waterEffluentExceeded:'yes',waterTreatmentFacilityApplicable:'yes',waterFacilityFailureConfirmed:'yes',waterA59ImmediateRepairAndResponse:'yes',waterA59ImmediateRecordAndReport:'yes',waterA59RecoveredWithin24Hours:'yes',waterA59WrittenReportWithin5Days:'yes',waterA59DirectCausation:'yes',waterA59NotSameFailureWithin6Months:'yes',waterInvestigationComplete:'yes'};
  const f=await norm(base);
  assert.match(f.waterArticle59Text,/可能.*標準例外/);
  assert.match(f.waterArticle7Text,/§59/);
  assert.doesNotMatch(f.waterFinalConclusionText,/§7 放流水標準/);
});

test('4.0-rc1 §71污染事件與污染行為人確認後輸出限期清除後續',async()=>{
  const f=await norm({waterSubjectType:'nonBusiness',waterSurfaceWaterPollutionEventConfirmed:'yes',waterPolluterIdentified:'yes'});
  assert.match(f.waterArticle71Text,/限期清除處理/);
  assert.match(f.waterArticle71Text,/代為清除/);
});

test('4.0-rc1 最終輸出在無成立方向且查證未完成時為C，完成時可為A',async()=>{
  const pending=await norm({waterSubjectType:'nonBusiness',waterMatterType:'unknown',waterInvestigationComplete:'no'});
  assert.match(pending.waterFinalConclusionText,/C｜事證不足/);
  const clear=await norm({waterSubjectType:'nonBusiness',waterMatterType:'unknown',waterInvestigationComplete:'yes',waterSurfaceWaterPollutionEventConfirmed:'no'});
  assert.match(clear.waterFinalConclusionText,/A｜本次查無違規事證/);
});
