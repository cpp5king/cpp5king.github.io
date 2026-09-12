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
    const evalRule=id=>root.WaterRuleEngine.evaluate(root.WATER_RULES[id],facts);
    return {
      r13:evalRule('article13Plan'),
      r14:evalRule('article14NoPermit'),
      r7:evalRule('article7Effluent'),
      r18:evalRule('article18Measures'),
      rb:evalRule('article181Bypass'),
      rd:evalRule('article181Dilution'),
      rt:evalRule('article181Treatment'),
      r20s:evalRule('article20StorageNoPermit'),
      r20sm:evalRule('article20StorageMismatch'),
      r20d:evalRule('article20DilutionNoPermit'),
      r20dm:evalRule('article20DilutionMismatch'),
      r22:evalRule('article22Reporting'),
      r35:evalRule('article35FalseReporting'),
      r26:evalRule('article26Obstruction'),
      r27e:evalRule('article27Emergency'),
      r27n:evalRule('article27Notice'),
      r28p:evalRule('article28Prevention'),
      r28e:evalRule('article28Emergency'),
      r28n:evalRule('article28Notice'),
      r30:evalRule('article30Dumping'),
      r32s:evalRule('article32Soil'),
      r32g:evalRule('article32Groundwater'),
      r59:evalRule('article59Exception'),
      r71:evalRule('article71Cleanup')
    };
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
    const facts=root.WaterFacts.build(out);
    const lawVersion=root.WaterLawVersions.resolve(out.waterInspectionDate);
    facts.sublawVersionResolved=(lawVersion.status==='resolved'&&lawVersion.date>='2026-04-20')?'yes':'unknown';
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
