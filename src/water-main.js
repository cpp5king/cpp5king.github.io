(function(root){
  'use strict';
  root.TemplateWorkflows=root.TemplateWorkflows||{};

  function normalizeSourceTypes(out){
    if(!Array.isArray(out.waterSourceTypes)&&out.waterSourceType)out.waterSourceTypes=[out.waterSourceType];
    if(Array.isArray(out.waterSourceTypes)){
      out.waterSourceTypes=[...new Set(out.waterSourceTypes.filter(Boolean))];
      if(out.waterSourceTypes.length>1)out.waterSourceTypes=out.waterSourceTypes.filter(value=>value!=='unknown');
    }
  }

  function evaluateRules(facts,version){
    if(!root.WaterLaw?.evaluateBindings)throw new Error('WaterLaw core bindings are required before water-main.');
    return root.WaterLaw.evaluateBindings('core',facts,{version});
  }

  function evaluateSublaw(facts,version){
    if(!root.WaterMeasureLaw?.evaluateAll)throw new Error('WaterMeasureLaw is required before water-main.');
    return root.WaterMeasureLaw.evaluateAll(facts,'common',{version});
  }

  function prepare(input={}){
    const out={...input};
    normalizeSourceTypes(out);
    root.WaterPermitCheck?.apply(out,out);
    const facts=root.WaterFacts.build(out);
    const hasBehaviorDateField=Object.prototype.hasOwnProperty.call(out,'waterBehaviorDate');
    const behaviorDate=hasBehaviorDateField?out.waterBehaviorDate:out.waterInspectionDate;
    const coreLawVersion=root.WaterLaw.resolveLawVersion(behaviorDate);
    const measureVersion=root.WaterMeasureLaw.resolveVersion(behaviorDate);
    const permitVersion=root.WaterPermitLaw.resolveVersion(behaviorDate);
    const standardVersion=root.WaterStandardLaw.resolveVersion(behaviorDate);
    const standardRoute=root.WaterStandardLaw.routeAppendix(out);
    const lawVersion=root.WaterLawVersions.resolve(behaviorDate);

    facts.sublawVersionResolved=measureVersion.status==='resolved'?'yes':'unknown';
    out.sublawVersionResolved=facts.sublawVersionResolved;
    out.waterLawVersionText=lawVersion.text;
    out.waterCoreLawVersionText=coreLawVersion.message+(hasBehaviorDateField?'':'（舊案件相容：沿用原案件日期基準）');
    out.waterMeasureLawVersionText=measureVersion.text+(hasBehaviorDateField?'':'（舊案件相容：沿用原案件日期基準）');
    out.waterPermitLawVersionText=permitVersion.text+(hasBehaviorDateField?'':'（舊案件相容：沿用原案件日期基準）');
    const permitPackInfo=root.WaterPermitLaw.packInfo();
    out.waterPermitRulePackVersionText=permitPackInfo?'Water Permit Rules：'+permitPackInfo.packVersion+'（'+permitPackInfo.status+'）':'Water Permit Rules：未載入';
    const standardPackInfo=root.WaterStandardLaw.packInfo();
    out.waterStandardRulePackVersionText=standardPackInfo?'Water Standard Rules：'+standardPackInfo.packVersion+'（'+standardPackInfo.status+'）':'Water Standard Rules：未載入';
    out.waterStandardLawVersionText=standardVersion.text+(hasBehaviorDateField?'':'（舊案件相容：沿用原案件日期基準）');
    out.waterStandardRouteText=standardRoute.message;

    const packInfo=root.WaterLaw.packInfo();
    out.waterRulePackVersionText=packInfo?'Water Rules：'+packInfo.packVersion+'（'+packInfo.status+'）':'Water Rules：未載入';
    const measurePackInfo=root.WaterMeasureLaw.packInfo();
    out.waterMeasureRulePackVersionText=measurePackInfo?'Water Measure Rules：'+measurePackInfo.packVersion+'（'+measurePackInfo.status+'）':'Water Measure Rules：未載入';

    const results=evaluateRules(facts,coreLawVersion);
    const sublaw=evaluateSublaw(facts,measureVersion);
    const industry=root.WaterIndustry.evaluate(out,facts,measureVersion);
    root.WaterWorkflow.apply(input,facts,out);
    root.WaterAssessment.apply(input,facts,out,measureVersion,results,sublaw,industry);
    const docs=root.WaterDocuments.build(out,facts);
    out.waterRecordDraftText=docs.recordText;
    out.waterReplyDraftText=docs.replyText;
    return out;
  }

  function resetChange(previous={},current={}){
    return root.WaterDependencies.resetChange(previous,current);
  }

  root.TemplateWorkflows.waterMain={prepare,resetChange};
})(typeof window==='undefined'?globalThis:window);