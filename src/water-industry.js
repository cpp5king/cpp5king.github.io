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
  function evaluate(input,baseFacts){
    const merged=facts(input,baseFacts);
    const out={facts:merged,results:{}};
    for(const [key,rule] of Object.entries(root.WATER_INDUSTRY_RULES)){
      const result=root.WaterRuleEngine.evaluate(rule,merged);
      if(merged.sublawVersionResolved!=='yes'&&result.status!=='notApplicable'){
        result.status='insufficient';
        if(!result.missingFacts.includes('sublawVersionResolved'))result.missingFacts.unshift('sublawVersionResolved');
        if(!result.missingLabels.includes('已依稽查日期確認本案適用之子法施行版本'))result.missingLabels.unshift('已依稽查日期確認本案適用之子法施行版本');
        if(!result.nextChecks.includes('填入稽查日期並確認當日有效之子法版本'))result.nextChecks.unshift('填入稽查日期並確認當日有效之子法版本');
      }
      out.results[key]=result;
    }
    return out;
  }
  root.WaterIndustry={evaluate,article9Types};
})(typeof window==='undefined'?globalThis:window);
