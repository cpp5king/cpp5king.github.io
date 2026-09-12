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

  function unique(items){return [...new Set(items.filter(Boolean))];}
  function parseOverview(text){
    const established=[],pending=[];
    String(text||'').split(/\r?\n/).forEach(line=>{
      const clean=line.trim();
      if(!clean)return;
      const label=clean.split('：')[0]?.trim();
      if(!label)return;
      if(clean.includes('☑ 構成要件完整')||clean.includes('⚠ 疑似不符合'))established.push(label);
      if(clean.includes('? 事證不足')||clean.includes('? 待確認')||clean.includes('? 待查子法'))pending.push(label);
    });
    return {established:unique(established),pending:unique(pending)};
  }
  function bullets(list){return list.map(x=>'• '+x).join('\n');}
  function buildQuickAssessment(out){
    const final=String(out.waterFinalConclusionText||'');
    const {established,pending}=parseOverview(out.waterRulesOverviewText);
    if(final.startsWith('D｜'))return '目前狀態：🔴 重大／緊急污染\n\n優先控制污染、保護下游並完成緊急應變與證據固定。';
    if(established.length){
      const finalReady=out.waterInvestigationComplete==='yes'&&pending.length===0;
      const parts=[`目前狀態：🔴 構成要件完整`,`【${finalReady?'違反法規':'目前已具完整要件'}】\n${bullets(established)}`];
      if(pending.length)parts.push('【另待確認】\n'+bullets(pending));
      return parts.join('\n\n');
    }
    if(pending.length||out.waterInvestigationComplete!=='yes'){
      const involved=pending.length?pending:['案件必要查證事項'];
      return '目前狀態：🟡 尚在查證\n\n【目前可能涉及】\n'+bullets(involved);
    }
    return '目前狀態：🟢 本次查無違規事證\n\n依本次已完成查證之事實，尚無足資認定違反水污染防治法之事證。';
  }
  function buildQuickMissing(out){
    const {pending}=parseOverview(out.waterRulesOverviewText);
    if(pending.length)return '【尚缺關鍵事證】\n'+bullets(pending.map(x=>'完成「'+x+'」構成要件／證據確認'));
    if(out.waterInvestigationComplete!=='yes')return '【尚缺關鍵事證】\n• 確認本次案件必要查證事項是否均已完成';
    return '目前無關鍵缺漏。';
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
    out.waterLiveDecisionText=buildQuickAssessment(out);
    out.waterLiveMissingText=buildQuickMissing(out);
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
