const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');
async function norm(templateId,input){const {root,config}=await loaded();const t=config.templates.find(x=>x.id===templateId);return plain(root.DraftEngine.normalize(t,input));}

test('4.5 第9條業別能啟動遮雨與沉砂池規則',async()=>{
  const out=await norm('water-main',{waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'readyMix',waterIndustryRainProtectionStatus:'noncompliant',waterIndustrySedimentationBasinPresent:'no'});
  assert.equal(out.waterShowIndustryArticle9,'yes');
  assert.match(out.waterIndustryOverviewText,/遮雨／擋雨／導雨/);
  assert.match(out.waterIndustryOverviewText,/構成要件完整/);
  assert.match(out.waterIndustryOverviewText,/沉砂池/);
});

test('4.5 營建工地另檢核施工前削減計畫與依計畫實施',async()=>{
  const out=await norm('water-main',{waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'construction',waterConstructionReductionPlanApprovedBeforeWork:'no',waterConstructionImplementedApprovedPlan:'no'});
  assert.equal(out.waterShowIndustryConstruction,'yes');
  assert.match(out.waterIndustryOverviewText,/削減計畫/);
  assert.match(out.waterFinalConclusionText,/B｜構成要件完整/);
});

test('4.5 畜牧業僅在採沼液沼渣農地肥分時進入70-1支線',async()=>{
  const off=await norm('water-main',{waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'livestock',waterLivestockFertilizerUse:'no'});
  assert.equal(off.waterShowIndustryLivestockFertilizer,'no');
  const on=await norm('water-main',{waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'livestock',waterLivestockFertilizerUse:'yes',waterLivestockFertilizerPlanApproved:'no'});
  assert.equal(on.waterShowIndustryLivestockFertilizer,'yes');
  assert.match(on.waterIndustryOverviewText,/農地肥分使用計畫/);
});

test('4.5 早於115年4月20日的特定業別規則維持待確認，不回溯套新版',async()=>{
  const out=await norm('water-main',{waterInspectionDate:'2026-04-19',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'construction',waterConstructionReductionPlanApprovedBeforeWork:'no'});
  assert.match(out.waterIndustryOverviewText,/事證不足/);
  assert.match(out.waterIndustryOverviewText,/子法施行版本/);
});
