(function(root){
  'use strict';
  const VERSION='4.8.5';
  const MISSING='尚待確認';
  if(!root.WaterMeasureLaw)throw new Error('WaterMeasureLaw is required before water-industry-v485.');
  const when=(field,value='yes')=>({field,value});
  const industryOptions=root.WaterMeasureLaw.industryOptions();
  function addOnFields(){
    return root.WaterMeasureLaw.industryFieldDefinitions();
  }
  const newFieldIds=addOnFields().map(field=>field.id);

  function patchTemplate(template){
    if(!template||!['water-field','water-main'].includes(template.id))return;
    template.version=VERSION;
    template.fields=template.fields.filter(field=>field.id!=='waterIndustryCheckMode'&&!newFieldIds.includes(field.id));
    const industry=template.fields.find(field=>field.id==='waterIndustryType');
    if(industry){
      industry.label='實際業別（系統依業別自動載入附加檢查）';
      industry.options=industryOptions;
      industry.showWhen=when('waterShowIndustryChoice','yes');
    }
    const overview=template.fields.find(field=>field.id==='waterIndustryOverviewText');
    if(overview){overview.label='特定業別附加檢查';overview.displayWhen=when('waterShowIndustry','yes');}
    let insertAt=template.fields.findIndex(field=>field.id==='waterIndustryOverviewText');
    if(insertAt<0){
      const industryAt=template.fields.findIndex(field=>field.id==='waterIndustryType');
      insertAt=industryAt>=0?industryAt+1:template.fields.length;
    }
    template.fields.splice(insertAt,0,...addOnFields());
  }

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.waterIndustry485=function(config){
    for(const template of config.templates||[])patchTemplate(template);
  };

  const baseWorkflowApply=root.WaterWorkflow?.apply;
  if(typeof baseWorkflowApply==='function'&&!root.WaterWorkflow.__industry485){
    root.WaterWorkflow.apply=function(input,facts,out={}){
      const result=baseWorkflowApply(input,facts,out);
      result.waterShowIndustryChoice=facts.subjectIsBusiness==='yes'?'yes':'no';
      result.waterShowIndustry=result.waterShowIndustryChoice==='yes'&&!!input.waterIndustryType?'yes':'no';
      const guidance=root.WaterMeasureLaw.industryGuidance(input);
      result.waterShowIndustryArticle9=result.waterShowIndustry==='yes'&&guidance.isArticle9?'yes':'no';
      result.waterShowIndustryConstruction=result.waterShowIndustry==='yes'&&input.waterIndustryType==='construction'?'yes':'no';
      result.waterShowIndustryLivestock=result.waterShowIndustry==='yes'&&input.waterIndustryType==='livestock'?'yes':'no';
      result.waterShowIndustryLivestockFertilizer=result.waterShowIndustryLivestock==='yes'&&input.waterLivestockFertilizerUse==='yes'?'yes':'no';
      const ops=Array.isArray(input.waterSpecialOperationTypes)?input.waterSpecialOperationTypes:[];
      result.waterSpecialOrganic=ops.includes('organicGroundwaterPollutant')?'yes':'no';
      result.waterSpecialResidual=ops.includes('constructionResidualReceiving')?'yes':'no';
      result.waterSpecialBat=ops.includes('batPermitReview')?'yes':'no';
      result.waterHighTechRequiredStreamsText=guidance.highTechRequiredStreamsText||'';
      return result;
    };
    root.WaterWorkflow.__industry485=true;
  }

  function collect(input,out){
    if(!root.WaterMeasureLaw?.evaluateIndustryExtensions)throw new Error('WaterMeasureLaw industry extensions are required before water-industry-v485.');
    return root.WaterMeasureLaw.evaluateIndustryExtensions(input,{lawReady:out.sublawVersionResolved==='yes'});
  }

  const baseAssessmentApply=root.WaterAssessment?.apply;
  if(typeof baseAssessmentApply==='function'&&!root.WaterAssessment.__industry485){
    root.WaterAssessment.apply=function(input,facts,out,lawVersion,results,sub,industry){
      const result=baseAssessmentApply(input,facts,out,lawVersion,results,sub,industry);
      if(facts.subjectIsBusiness!=='yes'||!input.waterIndustryType)return result;
      const extra=collect(input,result);
      const baseText=String(result.waterIndustryOverviewText||'').trim();
      const oldEmpty=baseText==='目前未進入特定業別子法支線。';
      const parts=[];
      if(baseText&&!oldEmpty)parts.push(baseText);
      if(extra.sections.length)parts.push(extra.sections.join('\n\n'));
      if(!parts.length)parts.push('目前已完成業別辨識；本業別無已建置之專屬成立規則，仍依一般水污核心及跨業別特殊作業檢查。');
      result.waterIndustryOverviewText=parts.join('\n\n');
      if(extra.overview.length){
        const current=String(result.waterRulesOverviewText||'').trim();
        result.waterRulesOverviewText=[current,...extra.overview].filter(Boolean).join('\n');
      }
      if(extra.missing.length){
        result.waterLiveMissingText=[String(result.waterLiveMissingText||'').trim(),'【特定業別／特殊作業待確認】',...extra.missing.map(x=>'• '+x)].filter(Boolean).join('\n');
      }
      if(extra.concerns.length){
        result.waterLiveDecisionText=[String(result.waterLiveDecisionText||'').trim(),'⚠ 特定業別附加檢查發現疑似不符合事項，應依適用條文與現場證據再確認。'].filter(Boolean).join('\n');
        if(/^A｜/.test(String(result.waterFinalConclusionText||''))){
          result.waterFinalConclusionText='C｜尚有要件待確認\n特定業別附加檢查發現疑似不符合事項；目前先保留為待補強之法規／事證支線，不以本附加檢查單獨作成終局違規結論。';
        }
      }
      return result;
    };
    root.WaterAssessment.__industry485=true;
  }

  const resetFields=[...newFieldIds.filter(id=>!['waterHighTechRequiredStreamsText','waterSpecialOrganic','waterSpecialResidual','waterSpecialBat'].includes(id))];
  function clearNew(previous,current,next){
    const clear=keys=>keys.forEach(key=>{next[key]=Array.isArray(previous?.[key])?[]:'';});
    if(previous?.waterIndustryType!==current?.waterIndustryType)clear(resetFields.filter(id=>id!=='waterSpecialOperationTypes'&&!id.startsWith('waterOrganic')&&!id.startsWith('waterResidual')&&!id.startsWith('waterBat')));
    if(JSON.stringify(previous?.waterSpecialOperationTypes||[])!==JSON.stringify(current?.waterSpecialOperationTypes||[]))clear(['waterOrganicLeakPreventionCompliant','waterOrganicInspectionRecordsCompliant','waterResidualDailyRecordsCompliant','waterBatPermitActivity','waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFishIntegratedUse!==current?.waterLivestockFishIntegratedUse)clear(['waterLivestockFishDailyVolumeCompliant','waterLivestockFishStockingCompliant','waterLivestockFishDOCompliant','waterLivestockFishFreeboardCompliant','waterLivestockFishRecordsCompliant','waterLivestockFishNoticeCompliant']);
    if(previous?.waterLivestockPigCattleResourceApplicable!==current?.waterLivestockPigCattleResourceApplicable)clear(['waterLivestockResourceMeasureApproved','waterLivestockResourceRatioCompliant']);
    if(previous?.waterLivestockSmallPigPlanApplicable!==current?.waterLivestockSmallPigPlanApplicable)clear(['waterLivestockSmallPigPlanApproved','waterLivestockSmallPigPlanOperationCompliant']);
    if(previous?.waterWaterworksEmergencyDischargeUsed!==current?.waterWaterworksEmergencyDischargeUsed)clear(['waterWaterworksEmergencyConditionsMet','waterWaterworksEmergencyRegistered','waterWaterworksBasinsEmptied','waterWaterworksNoticeCompliant','waterWaterworksDailyMonitoringCompliant']);
    if(previous?.waterFoodServiceProvided!==current?.waterFoodServiceProvided)clear(['waterGreaseTrapPresent','waterGreaseTrapMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringServiceProvided!==current?.waterHotSpringServiceProvided)clear(['waterHotSpringSeparatedCollectionCompliant','waterHotSpringMudSpring','waterHotSpringFiltersCompliant','waterHotSpringMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringMudSpring!==current?.waterHotSpringMudSpring)clear(['waterHotSpringFiltersCompliant']);
    if(previous?.waterCoalMercuryThresholdExceeded!==current?.waterCoalMercuryThresholdExceeded)clear(['waterCoalMercuryPlanApproved','waterCoalMercuryPlanImplemented']);
    if(previous?.waterHighTech49_9Trigger!==current?.waterHighTech49_9Trigger)clear(['waterHighTechSeparatedCollectionCompliant']);
    if(previous?.waterBatPermitActivity!==current?.waterBatPermitActivity)clear(['waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFertilizerPauseCondition!==current?.waterLivestockFertilizerPauseCondition)clear(['waterLivestockFertilizerPauseCompliant']);
    return next;
  }

  if(root.WaterDependencies?.resetChange&&!root.WaterDependencies.__industry485){
    const base=root.WaterDependencies.resetChange;
    root.WaterDependencies.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    root.WaterDependencies.__industry485=true;
  }
  const fieldWorkflow=root.TemplateWorkflows?.waterField;
  if(fieldWorkflow?.resetChange&&!fieldWorkflow.__industry485){
    const base=fieldWorkflow.resetChange;
    fieldWorkflow.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    fieldWorkflow.__industry485=true;
  }

  root.WaterIndustryV485={collect,patchTemplate,version:VERSION};
})(typeof window==='undefined'?globalThis:window);
