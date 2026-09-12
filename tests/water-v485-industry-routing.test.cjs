const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

async function loaded485(){
  const env=runtime();
  env.run('data/rules/water-industry-catalog-v485.js');
  env.run('src/water-industry-v485.js');
  env.run('src/water-industry-v485-final.js');
  await env.root.TemplateLoader.load(env.root.INSPECTION_CONFIG,file=>env.run('data/templates/'+file));
  return {...env,config:env.root.INSPECTION_CONFIG};
}
async function norm(templateId,input){
  const {root,config}=await loaded485();
  const template=config.templates.find(item=>item.id===templateId);
  root.DraftEngine.validate(template);
  return plain(root.DraftEngine.normalize(template,input));
}

test('4.8.5 移除手動啟用題，確認業別後自動載入附加檢查',async()=>{
  const {root,config}=await loaded485();
  for(const id of ['water-field','water-main']){
    const template=config.templates.find(item=>item.id===id);
    root.DraftEngine.validate(template);
    assert.equal(template.fields.some(field=>field.id==='waterIndustryCheckMode'),false);
    const industry=template.fields.find(field=>field.id==='waterIndustryType');
    assert.deepEqual(plain(industry.showWhen),{field:'waterShowIndustryChoice',value:'yes'});
    assert.equal(industry.options[0].id,'other');
    assert.equal(industry.options[0].label,'其他事業');
    assert.equal(industry.options[1].id,'unknown');
    assert.equal(industry.options[1].label,'尚待確認');
    assert.ok(industry.options.some(option=>option.id==='shipDismantling'));
    assert.ok(industry.options.some(option=>option.id==='dialysisClinic'));
    assert.ok(industry.options.some(option=>option.id==='semiconductor'));
  }
});

test('4.8.5 船舶解體業自動進入第45條附加檢查',async()=>{
  const out=await norm('water-main',{
    waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'shipDismantling',
    waterShipContainmentCompliant:'yes',waterShipOilBoomCompliant:'no',waterShipReceivingFacilitiesCompliant:'yes',waterSpecialOperationTypes:['none']
  });
  assert.equal(out.waterShowIndustry,'yes');
  assert.match(out.waterIndustryOverviewText,/§45/);
  assert.match(out.waterIndustryOverviewText,/疑似不符/);
});

test('4.8.5 餐飲與溫泉依實際服務條件展開',async()=>{
  const out=await norm('water-main',{
    waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'touristHotel',
    waterFoodServiceProvided:'yes',waterGreaseTrapPresent:'yes',waterGreaseTrapMaintenanceRecordsCompliant:'yes',
    waterHotSpringServiceProvided:'yes',waterHotSpringSeparatedCollectionCompliant:'yes',waterHotSpringMudSpring:'no',waterHotSpringFiltersCompliant:'yes',waterHotSpringMaintenanceRecordsCompliant:'yes',
    waterSpecialOperationTypes:['none']
  });
  assert.match(out.waterIndustryOverviewText,/§48、§49/);
  assert.match(out.waterIndustryOverviewText,/餐飲廢水油脂截留/);
  assert.match(out.waterIndustryOverviewText,/溫泉泡湯廢水/);
});

test('4.8.5 高科技業別第49條之9只在觸發條件成立時要求分流',async()=>{
  const out=await norm('water-main',{
    waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'semiconductor',
    waterHighTech49_9Trigger:'yes',waterHighTechSeparatedCollectionCompliant:'yes',waterSpecialOperationTypes:['none']
  });
  assert.match(out.waterHighTechRequiredStreamsText,/TMAH/);
  assert.match(out.waterIndustryOverviewText,/§49-9/);
});

test('4.8.5 跨業別特殊作業可複選並載入第49-1、49-2支線',async()=>{
  const out=await norm('water-main',{
    waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'other',
    waterSpecialOperationTypes:['organicGroundwaterPollutant','constructionResidualReceiving'],
    waterOrganicLeakPreventionCompliant:'yes',waterOrganicInspectionRecordsCompliant:'yes',waterResidualDailyRecordsCompliant:'yes'
  });
  assert.equal(out.waterSpecialOrganic,'yes');
  assert.equal(out.waterSpecialResidual,'yes');
  assert.match(out.waterIndustryOverviewText,/§49-1/);
  assert.match(out.waterIndustryOverviewText,/§49-2/);
});

test('4.8.5 保留既有營建第9、10條成立規則',async()=>{
  const out=await norm('water-main',{
    waterInspectionDate:'2026-09-12',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'construction',
    waterConstructionReductionPlanApprovedBeforeWork:'no',waterConstructionImplementedApprovedPlan:'no',
    waterConstructionVisibleSedimentFound:'no',waterConstructionWasteOilFound:'no',waterConstructionCleanupRecordsCompliant:'yes',waterSpecialOperationTypes:['none']
  });
  assert.match(out.waterIndustryOverviewText,/削減計畫/);
  assert.match(out.waterFinalConclusionText,/B｜構成要件完整/);
});
