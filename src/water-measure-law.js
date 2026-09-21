(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const d=new Date(String(value)+'T00:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===String(value)?String(value):null;
  }

  function within(date,version){
    if(version.effectiveFrom&&date<version.effectiveFrom)return false;
    if(version.effectiveTo&&date>version.effectiveTo)return false;
    return true;
  }

  function resolveVersion(eventDate){
    const pack=root.WATER_MEASURE_RULE_PACK;
    if(!pack)return {status:'packMissing',date:'',version:null,regime:'unknown',text:'Water Measure Rule Pack 尚未載入。'};
    const date=validDate(eventDate);
    if(!date){
      return {
        status:'dateUnknown',date:'',version:null,regime:'unknown',
        text:'水措管理：行為發生日期尚未確認，適用法規版本待確認；不以稽查日期或裝置日期替代。'
      };
    }
    const matches=(pack.lawVersions||[]).filter(v=>within(date,v));
    if(matches.length===1){
      const v=matches[0];
      const text=v.regime==='2026-04-20-effective-provisions'
        ?'水措管理：依行為發生日期適用115年4月20日修正版中當時已施行之規定；另定施行日期項目仍依個別條文／附表確認。'
        :'水措管理：依目前公布施行日，115年4月20日修正版之延後施行時點已屆；仍應確認行為當時是否已有後續修正。';
      return {status:'resolved',date,version:v,regime:v.regime,text};
    }
    if(date<'2026-04-20'){
      return {
        status:'historicalVersionMissing',date,version:null,regime:'2025-01-20-or-earlier',
        text:'水措管理：行為日期早於115年4月20日；本 Water Measure Rule Pack 尚未收錄該歷史版本，不以115年4月20日規則回溯判斷。'
      };
    }
    return {
      status:'versionUnresolved',date,version:null,regime:'unknown',
      text:'水措管理：依行為發生日期無法唯一解析適用版本，適用法規版本待確認。'
    };
  }

  function rules(scope){
    const pack=root.WATER_MEASURE_RULE_PACK||{};
    if(scope==='industry')return pack.industryRules||{};
    return pack.commonRules||{};
  }

  function getRule(ruleKey,scope='common'){
    return rules(scope)[ruleKey]||null;
  }

  function applyVersionGate(result,version){
    if(!version||version.status==='resolved'||result.status==='notApplicable')return result;
    result.baseStatus=result.status;
    result.status='insufficient';
    result.versionStatus=version.status;
    if(!result.missingFacts.includes('measureLawVersion'))result.missingFacts.unshift('measureLawVersion');
    if(!result.missingLabels.includes('適用之水措管理辦法版本待確認'))result.missingLabels.unshift('適用之水措管理辦法版本待確認');
    if(!result.nextChecks.includes('確認行為發生日期及當時有效之水措管理辦法版本'))result.nextChecks.unshift('確認行為發生日期及當時有效之水措管理辦法版本');
    return result;
  }

  function evaluate(ruleKey,facts,scope='common',context={}){
    const rule=getRule(ruleKey,scope);
    if(!rule)return {ruleId:ruleKey,status:'ruleMissing',missingFacts:[],failedFacts:[],notApplicableFacts:[],nextChecks:[]};
    if(!root.WaterRuleEngine?.evaluate)throw new Error('WaterRuleEngine is required before WaterMeasureLaw.');
    const prepared={...(facts||{})};
    if(context.version){
      prepared.sublawVersionResolved=context.version.status==='resolved'?'yes':'unknown';
    }
    const result=root.WaterRuleEngine.evaluate(rule,prepared);
    return applyVersionGate(result,context.version);
  }

  function evaluateAll(facts,scope='common',context={}){
    const out={};
    for(const key of Object.keys(rules(scope)))out[key]=evaluate(key,facts,scope,context);
    return out;
  }

  function industryCatalog(){
    return root.WATER_MEASURE_RULE_PACK?.industryCatalog||{};
  }

  function packInfo(){
    const pack=root.WATER_MEASURE_RULE_PACK;
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

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h=Math.imul(h,0x01000193)>>>0;
    }
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_MEASURE_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      commonRules:pack.commonRules||{},
      industryRules:pack.industryRules||{},
      industryCatalog:pack.industryCatalog||{}
    });
    const actual=fnv1a32(payload);
    return {
      ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,
      algorithm:expected.algorithm,
      expected:expected.value,
      actual
    };
  }

  root.WaterMeasureLaw=Object.freeze({
    provenance:PROVENANCE,
    resolveVersion,
    getRule,
    evaluate,
    evaluateAll,
    industryCatalog,
    packInfo,
    verifyIntegrity
  });
})(typeof window==='undefined'?globalThis:window);
