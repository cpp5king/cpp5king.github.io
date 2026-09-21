(function(root){
  'use strict';
  const article9Types=new Set(['mining','stoneExtraction','stoneProcessing','readyMix','earthworkDump','construction']);
  const tri=v=>v==='yes'?'yes':v==='no'?'no':'unknown';
  const inverse=v=>v==='yes'?'no':v==='no'?'yes':'unknown';
  const complianceViolation=v=>v==='yes'?'no':v==='no'?'yes':'unknown';
  function rainViolation(input){
    const v=input.waterIndustryRainProtectionStatus;
    if(v==='compliant'||v==='approvedException')return 'no';
    if(v==='noncompliant')return 'yes';
    return 'unknown';
  }
  function facts(input,facts){
    const type=input.waterIndustryType||'';
    return Object.assign({},facts,{
      industryType:type,
      industryArticle9Applicable:type? (article9Types.has(type)?'yes':'no'):'unknown',
      industryConstructionApplicable:type? (type==='construction'?'yes':'no'):'unknown',
      industryLivestockFertilizerApplicable:type==='livestock'?tri(input.waterLivestockFertilizerUse):type?'no':'unknown',
      industryRainProtectionViolation:rainViolation(input),
      industrySedimentationBasinMissing:inverse(input.waterIndustrySedimentationBasinPresent),
      industrySedimentationBasinPresent:tri(input.waterIndustrySedimentationBasinPresent),
      industrySedimentationCapacityViolation:complianceViolation(input.waterIndustrySedimentationCapacityCompliant),
      industrySedimentationFreeboardViolation:complianceViolation(input.waterIndustrySedimentationFreeboardCompliant),
      industrySedimentationImpermeableViolation:complianceViolation(input.waterIndustrySedimentationImpermeableCompliant),
      industryMaintenanceRecordsViolation:complianceViolation(input.waterIndustryMaintenanceRecordsCompliant),
      constructionReductionPlanViolation:complianceViolation(input.waterConstructionReductionPlanApprovedBeforeWork),
      constructionImplementedPlanViolation:complianceViolation(input.waterConstructionImplementedApprovedPlan),
      livestockFertilizerPlanViolation:inverse(input.waterLivestockFertilizerPlanApproved),
      livestockFertilizerPlanApproved:tri(input.waterLivestockFertilizerPlanApproved),
      livestockFertilizerOperationViolation:complianceViolation(input.waterLivestockFertilizerMatchesPlan)
    });
  }
  function evaluate(input,baseFacts,measureVersion){
    const merged=facts(input,baseFacts);
    if(!root.WaterMeasureLaw?.evaluateAll)throw new Error('WaterMeasureLaw is required before WaterIndustry.');
    const context=measureVersion?{version:measureVersion}:{};
    return {facts:merged,results:root.WaterMeasureLaw.evaluateAll(merged,'industry',context)};
  }

  root.WaterIndustry={evaluate,article9Types};
})(typeof window==='undefined'?globalThis:window);
