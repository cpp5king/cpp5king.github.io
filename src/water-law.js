(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';

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
    return {status:'resolved',eventDate:date,version:matches[0],message:`適用法規版本：${matches[0].id}`};
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
    const payload=JSON.stringify({coreRules:pack.coreRules||{},fieldRules:pack.fieldRules||{}});
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
    packInfo,
    verifyIntegrity
  });
})(typeof window==='undefined'?globalThis:window);
