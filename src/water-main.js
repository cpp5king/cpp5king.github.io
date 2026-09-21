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

  function evaluateRules(facts){
    if(!root.WaterLaw?.evaluateBindings)throw new Error('WaterLaw core bindings are required before water-main.');
    return root.WaterLaw.evaluateBindings('core',facts);
  }

  function evaluateSublaw(facts){
    const evalSub=id=>{
      const rule=root.WATER_SUBLAW_RULES[id];
      const result=root.WaterRuleEngine.evaluate(rule,facts);
      if(facts.sublawVersionResolved!=='yes'&&result.status!=='notApplicable'){
        result.status='insufficient';
        if(!result.missingFacts.includes('sublawVersionResolved'))result.missingFacts.unshift('sublawVersionResolved');
        if(!result.missingLabels.includes('已確認本版支援之水措管理辦法版本適用'))result.missingLabels.unshift('已確認本版支援之水措管理辦法版本適用');
        if(!result.nextChecks.includes('填入稽查日期並確認當日有效之子法版本'))result.nextChecks.unshift('填入稽查日期並確認當日有效之子法版本');
      }
      return result;
    };
    return {
      approvedMeasuresMismatch:evalSub('approvedMeasuresMismatch'),
      rainWastewaterSeparation:evalSub('rainWastewaterSeparation'),
      runoffCollection:evalSub('runoffCollection'),
      outsourceStorage:evalSub('outsourceStorage'),
      outsourceMeter:evalSub('outsourceMeter'),
      storageMeter:evalSub('storageMeter'),
      storageRecords:evalSub('storageRecords'),
      storageCapacity:evalSub('storageCapacity'),
      reuseStandard:evalSub('reuseStandard'),
      reuseSamplingPort:evalSub('reuseSamplingPort'),
      outletLocation:evalSub('outletLocation'),
      outletAccess:evalSub('outletAccess'),
      outletMeter:evalSub('outletMeter'),
      outletSign:evalSub('outletSign'),
      outletSampling:evalSub('outletSampling'),
      outletMixing:evalSub('outletMixing'),
      meterCalibration:evalSub('meterCalibration'),
      reportingDocuments:evalSub('reportingDocuments'),
      reportingSite:evalSub('reportingSite')
    };
  }

  function prepare(input={}){
    const out={...input};
    normalizeSourceTypes(out);
    root.WaterPermitCheck?.apply(out,out);
    const facts=root.WaterFacts.build(out);
    const lawVersion=root.WaterLawVersions.resolve(out.waterInspectionDate);
    facts.sublawVersionResolved=(lawVersion.status==='resolved'&&lawVersion.date>='2026-04-20')?'yes':'unknown';
    out.sublawVersionResolved=facts.sublawVersionResolved;
    out.waterLawVersionText=lawVersion.text;

    const results=evaluateRules(facts);
    const sublaw=evaluateSublaw(facts);
    const industry=root.WaterIndustry.evaluate(out,facts);
    root.WaterWorkflow.apply(input,facts,out);
    root.WaterAssessment.apply(input,facts,out,lawVersion,results,sublaw,industry);
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