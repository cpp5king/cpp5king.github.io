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
    const pack=root.WATER_PERMIT_RULE_PACK;
    if(!pack)return {status:'packMissing',date:'',version:null,regime:'unknown',text:'Water Permit Rule Pack 尚未載入。'};
    const date=validDate(eventDate);
    if(!date){
      return {
        status:'dateUnknown',date:'',version:null,regime:'unknown',
        text:'許可審查：行為發生日期尚未確認，適用法規版本待確認；不以稽查日期或裝置日期替代。'
      };
    }
    const matches=(pack.lawVersions||[]).filter(v=>within(date,v));
    if(matches.length===1){
      const v=matches[0];
      let text='';
      if(v.regime==='2024-01-11-general')text='許可審查：依行為發生日期適用113年1月11日版本。';
      else if(v.regime==='2024-01-11-general-with-2026-art57')text='許可審查：115年10月1日前（其中115年3月24日至9月30日），原則以113年1月11日版本之一般規則為基礎；115年3月24日修正之第57條自發布日施行。';
      else text='許可審查：依行為發生日期適用115年3月24日修正版（除第57條自發布日施行外，其餘自115年10月1日施行）。';
      return {status:'resolved',date,version:v,regime:v.regime,text};
    }
    if(date<'2024-01-11'){
      return {
        status:'historicalVersionMissing',date,version:null,regime:'historical-unloaded',
        text:'許可審查：行為日期早於113年1月11日；本 Water Permit Rule Pack 尚未收錄該歷史版本，不以較新版本回溯判斷。'
      };
    }
    return {
      status:'versionUnresolved',date,version:null,regime:'unknown',
      text:'許可審查：依行為發生日期無法唯一解析適用版本，適用法規版本待確認。'
    };
  }

  function comparisonItems(){
    return (root.WATER_PERMIT_RULE_PACK?.comparisonItems||[]).map(item=>[item.key,item.label]);
  }

  function subjectEligible(input={}){
    const cfg=root.WATER_PERMIT_RULE_PACK?.subjectEligibility;
    if(!cfg)return false;
    if(input.waterSubjectType==='sewerSystem')return (cfg.allowed||[]).includes('sewerSystem');
    if(input.waterSubjectType==='business'){
      return (cfg.allowed||[]).includes('business')&&input[cfg.businessConfirmationFact]==='yes';
    }
    return false;
  }

  function comparableReference(input={}){
    return (root.WATER_PERMIT_RULE_PACK?.referenceStates||[]).includes(input.waterPermitReferenceStatus);
  }

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_PERMIT_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      lawVersions:pack.lawVersions||[],
      subjectEligibility:pack.subjectEligibility||{},
      comparisonItems:pack.comparisonItems||[],
      referenceStates:pack.referenceStates||[]
    });
    const actual=fnv1a32(payload);
    return {ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,algorithm:expected.algorithm,expected:expected.value,actual};
  }

  function packInfo(){
    const pack=root.WATER_PERMIT_RULE_PACK;
    if(!pack)return null;
    return {
      packId:pack.meta?.packId||'',
      packVersion:pack.meta?.packVersion||'',
      status:pack.meta?.status||'unknown',
      lastVerifiedAt:pack.meta?.lastVerifiedAt||'',
      officialSources:pack.meta?.officialSources||[],
      provenance:pack.provenance,
      integrity:pack.meta?.integrity||null
    };
  }

  root.WaterPermitLaw=Object.freeze({
    provenance:PROVENANCE,
    resolveVersion,
    comparisonItems,
    subjectEligible,
    comparableReference,
    verifyIntegrity,
    packInfo
  });
})(typeof window==='undefined'?globalThis:window);
