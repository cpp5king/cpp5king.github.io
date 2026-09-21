(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const bool=v=>v?'yes':'no';

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const d=new Date(String(value)+'T00:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===String(value)?String(value):null;
  }

  function compareVersionDate(date,from,to){
    if(!date)return false;
    if(from&&date<from)return false;
    if(to&&date>to)return false;
    return true;
  }

  function resolveLawVersion(eventDate){
    const pack=root.WATER_RULE_PACK;
    if(!pack)return {status:'packMissing',eventDate:'',version:null,message:'Water Rule Pack 尚未載入。'};
    const date=validDate(eventDate);
    if(!date)return {status:'dateUnknown',eventDate:'',version:null,message:'行為發生日期尚未確認，適用法規版本待確認。'};
    const matches=(pack.lawVersions||[]).filter(v=>compareVersionDate(date,v.effectiveFrom,v.effectiveTo));
    if(matches.length!==1){
      return {status:'versionUnresolved',eventDate:date,version:null,message:'依行為發生日期無法唯一解析法規版本，適用法規版本待確認。'};
    }
    return {status:'resolved',eventDate:date,version:matches[0],message:'適用法規版本：'+matches[0].id};
  }

  function allRules(scope){
    const pack=root.WATER_RULE_PACK||{};
    if(scope==='field')return pack.fieldRules||{};
    if(scope==='core')return pack.coreRules||{};
    return Object.assign({},pack.coreRules||{},pack.fieldRules||{});
  }

  function getRule(ruleKey,scope){
    const rules=allRules(scope);
    return rules[ruleKey]||null;
  }

  function evaluate(ruleKey,facts,scope){
    const rule=getRule(ruleKey,scope);
    if(!rule)return {ruleId:ruleKey,status:'ruleMissing',missingFacts:[],failedFacts:[],notApplicableFacts:[],nextChecks:[]};
    if(!root.WaterRuleEngine?.evaluate)throw new Error('WaterRuleEngine is required before WaterLaw.');
    return root.WaterRuleEngine.evaluate(rule,facts||{});
  }

  function evaluateMany(ruleKeys,facts,scope){
    const out={};
    (ruleKeys||[]).forEach(key=>{out[key]=evaluate(key,facts,scope);});
    return out;
  }

  function formatTemplate(template,context={}){
    return String(template||'').replace(/\{([A-Za-z0-9_]+)\}/g,(all,key)=>{
      const value=context[key];
      return value===undefined||value===null?'':String(value);
    });
  }

  function direction(ruleKey,context={}){
    const nav=root.WATER_RULE_PACK?.fieldNavigation?.[ruleKey];
    if(!nav)return null;
    const law=nav.lawBySubject?.[context.subjectType]||nav.law||'';
    return {law,reason:formatTemplate(nav.reason,context),ruleKey};
  }

  function pending(key,context={}){
    const template=root.WATER_RULE_PACK?.pendingGuidance?.[key];
    return template?formatTemplate(template,context):'';
  }

  function relation(key){
    return root.WATER_RULE_PACK?.coreRelations?.[key]||null;
  }

  function visibility(input={},facts={}){
    const wastewaterPath=facts.matterType==='wastewater'||(!facts.matterType&&!!input.waterWastewaterStatus);
    const out={};

    out.waterShowArticle13Details=bool(facts.subjectIsBusiness==='yes'&&input.waterArticle13NewOrChangeConfirmed==='yes');
    out.waterShowArticle14=bool(input.waterSubjectType==='business'&&wastewaterPath);

    out.waterShowStorageDetails=bool(facts.article20SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&input.waterDestination==='storage');
    out.waterShowStorageMismatch=bool(out.waterShowStorageDetails==='yes'&&input.waterStorageActivityConfirmed==='yes'&&input.waterStoragePermit==='valid');

    out.waterShowArticle7=bool(facts.article7SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes'&&facts.surfaceWaterConfirmed==='yes');
    out.waterShowSampleDetails=bool(out.waterShowArticle7==='yes'&&input.waterSampleTaken==='yes');
    out.waterShowLabDetails=bool(out.waterShowSampleDetails==='yes'&&input.waterSampleRepresentative==='yes'&&input.waterSampleBeforeReceivingWater==='yes'&&input.waterApplicableStandardConfirmed==='yes');
    out.waterShowEffluentResult=bool(out.waterShowLabDetails==='yes'&&input.waterLabResultAvailable==='yes');

    out.waterShowArticle181=bool(facts.article181SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes');
    out.waterShowBypassRoute=bool(out.waterShowArticle181==='yes'&&facts.actualDischargeConfirmed==='yes');
    out.waterShowBypassQuestion=bool(out.waterShowBypassRoute==='yes'&&input.waterApprovedRouteConfirmed==='yes'&&input.waterActualRouteConfirmed==='yes');
    out.waterShowBypassEmergency=bool(out.waterShowBypassQuestion==='yes'&&input.waterBypassConfirmed==='yes');
    out.waterShowDilutionDetails=bool(out.waterShowArticle181==='yes'&&input.waterDilutionObserved==='yes');
    out.waterShowDilutionMismatch=bool(out.waterShowDilutionDetails==='yes'&&input.waterDilutionPermit==='valid');
    out.waterShowDilutionEmergency=bool(out.waterShowDilutionDetails==='yes'&&input.waterRequiresTreatmentToMeetStandard==='yes'&&input.waterMixedWithNoTreatmentNeededWater==='yes'&&['none','expired','unknown'].includes(input.waterDilutionPermit));
    out.waterShowTreatmentDetails=bool(out.waterShowArticle181==='yes'&&input.waterTreatmentFacilityApplicable==='yes');
    out.waterShowArticle18Noncompliance=bool(facts.subjectIsBusiness==='yes'&&input.waterArticle18SpecificDutyConfirmed==='yes');

    out.waterShowArticle28=bool(facts.article28SubjectEligible==='yes'&&facts.article28MatterEligible==='yes');
    out.waterShowArticle28Details=bool(out.waterShowArticle28==='yes'&&input.waterArticle28Scenario==='yes');
    out.waterShowArticle28LeakChecks=bool(out.waterShowArticle28Details==='yes'&&!!input.waterLeakCause&&input.waterLeakCause!=='humanDischarge');
    out.waterShowArticle28Prevention=bool(out.waterShowArticle28LeakChecks==='yes'&&input.waterLeakRiskToWaterBodyConfirmed==='yes');
    out.waterShowArticle28Emergency=bool(out.waterShowArticle28LeakChecks==='yes'&&input.waterLeakPollutedWaterBody==='yes');

    out.waterShowArticle27=bool(facts.article27SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes');
    out.waterShowArticle27Actions=bool((out.waterShowArticle27==='yes'&&input.waterSevereHazardRiskConfirmed==='yes')||out.waterShowArticle28Emergency==='yes');

    out.waterShowArticle32=bool(wastewaterPath&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes'&&['soil','groundwater'].includes(input.waterDestination));
    out.waterShowSoilPermit=bool(out.waterShowArticle32==='yes'&&input.waterDestination==='soil');
    out.waterShowGroundwaterCheck=bool(out.waterShowArticle32==='yes'&&input.waterDestination==='groundwater');

    out.waterShowArticle30=bool(facts.article30MatterEligible==='yes');
    out.waterShowArticle30Details=bool(out.waterShowArticle30==='yes'&&input.waterDumpingConfirmed==='yes');

    out.waterShowReportingNoncompliance=bool(facts.article22SubjectEligible==='yes'&&input.waterArticle22ReportingDutyConfirmed==='yes');
    out.waterShowReportedMismatch=bool(out.waterShowReportingNoncompliance==='yes');
    out.waterShowFalseDetails=bool(out.waterShowReportedMismatch==='yes'&&input.waterReportedDataMismatch==='yes');
    out.waterShowArticle26Obstruction=bool(facts.article26TargetEligible==='yes'&&input.waterArticle26InspectionBasisConfirmed==='yes');
    out.waterShowArticle59Details=bool(out.waterShowArticle181==='yes'&&input.waterFacilityFailureConfirmed==='yes');
    out.waterShowPolluter=bool(input.waterSurfaceWaterPollutionEventConfirmed==='yes');

    return out;
  }


  function narrative(ruleKey,status){
    const rule=getRule(ruleKey,'core');
    const configured=root.WATER_RULE_PACK?.corePresentation?.narratives?.[ruleKey]?.[status];
    if(configured)return configured;
    if(!rule)return '';
    if(status==='established')return '本案具'+(rule.legalBasis||rule.title)+'之成立方向。';
    if(status==='notEstablished')return (rule.title||ruleKey)+'目前不成立。';
    if(status==='notApplicable')return (rule.title||ruleKey)+'目前不適用。';
    return (rule.title||ruleKey)+'目前事證不足。';
  }

  function entryGuard(ruleKey,input={}){
    const guard=root.WATER_RULE_PACK?.corePresentation?.guards?.[ruleKey];
    if(!guard)return {action:'evaluate',text:''};
    const value=input[guard.field]||'';
    if(value===guard.evaluateValue)return {action:'evaluate',text:''};
    if(value===guard.noValue)return {action:'message',text:guard.noText||''};
    return {action:'message',text:guard.pendingText||''};
  }

  function conditionsMatch(input,conditions){
    return (conditions||[]).every(cond=>{
      const value=input[cond.field];
      if(Object.prototype.hasOwnProperty.call(cond,'equals'))return value===cond.equals;
      if(Array.isArray(cond.in))return cond.in.includes(value);
      if(Object.prototype.hasOwnProperty.call(cond,'notEquals'))return value!==cond.notEquals;
      return !!value;
    });
  }

  function group(groupKey,input={}){
    const cfg=root.WATER_RULE_PACK?.corePresentation?.groups?.[groupKey];
    if(!cfg)return {state:'missing',ruleKeys:[],message:''};

    if(cfg.gate){
      const value=input[cfg.gate.field]||'';
      if(value===cfg.gate.noValue)return {state:'message',ruleKeys:[],message:cfg.gate.noText||''};
      if((cfg.gate.pendingValues||[]).includes(value))return {state:'message',ruleKeys:[],message:cfg.gate.pendingText||''};
    }

    if(cfg.block&&input[cfg.block.field]===cfg.block.equals){
      const rel=relation(cfg.block.relation);
      return {state:'message',ruleKeys:[],message:rel?.guidance||''};
    }

    if(cfg.routeField){
      const route=(cfg.routes||{})[input[cfg.routeField]];
      if(!route)return {state:'empty',ruleKeys:[],message:cfg.emptyText||''};
      return {state:'active',ruleKeys:[...route],message:''};
    }

    const ruleKeys=(cfg.entries||[])
      .filter(entry=>!entry.when||conditionsMatch(input,entry.when))
      .map(entry=>entry.ruleKey);

    if(!ruleKeys.length)return {state:'empty',ruleKeys:[],message:cfg.emptyText||''};
    return {state:'active',ruleKeys,message:''};
  }

  function summaryLabel(ruleKey){
    return root.WATER_RULE_PACK?.corePresentation?.summaryLabels?.[ruleKey]||getRule(ruleKey,'core')?.title||ruleKey;
  }

  function ruleElements(rule){
    if(!rule)return [];
    if(Array.isArray(rule.elements))return rule.elements;
    const out=[];
    const walk=node=>{
      if(!node)return;
      if(node.id&&!node.op){out.push(node);return;}
      (node.items||[]).forEach(walk);
    };
    walk(rule.logic);
    return out;
  }

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h=Math.imul(h,0x01000193)>>>0;
    }
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      coreRules:pack.coreRules||{},
      fieldRules:pack.fieldRules||{},
      fieldNavigation:pack.fieldNavigation||{},
      pendingGuidance:pack.pendingGuidance||{},
      coreRelations:pack.coreRelations||{},
      corePresentation:pack.corePresentation||{}
    });
    const actual=fnv1a32(payload);
    return {ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,algorithm:expected.algorithm,expected:expected.value,actual};
  }

  function packInfo(){
    const pack=root.WATER_RULE_PACK;
    if(!pack)return null;
    return {
      packId:pack.packId,
      packVersion:pack.packVersion,
      status:pack.meta?.status||'unknown',
      lastVerifiedAt:pack.meta?.lastVerifiedAt||'',
      officialSources:pack.meta?.officialSources||[],
      provenance:pack.provenance,
      integrity:pack.meta?.integrity||null
    };
  }

  root.WaterLaw=Object.freeze({
    provenance:PROVENANCE,
    resolveLawVersion,
    allRules,
    getRule,
    evaluate,
    evaluateMany,
    direction,
    pending,
    relation,
    visibility,
    narrative,
    entryGuard,
    group,
    summaryLabel,
    ruleElements,
    packInfo,
    verifyIntegrity
  });
})(typeof window==='undefined'?globalThis:window);
