(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const d=new Date(String(value)+'T00:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===String(value)?String(value):null;
  }

  function standards(){
    return root.WATER_LOCAL_RULE_PACK?.standards||[];
  }

  function list(){
    return standards().map(item=>({
      id:item.id,
      name:item.name,
      areaKey:item.areaKey,
      published:item.published,
      source:item.source
    }));
  }

  function resolveArea(areaKey,eventDate){
    const pack=root.WATER_LOCAL_RULE_PACK;
    if(!pack)return {status:'packMissing',standard:null,message:'Water Local Rule Pack 尚未載入。'};
    if(!areaKey){
      return {
        status:'areaUnknown',standard:null,
        message:'地方加嚴放流水標準：尚未確認承受水體／公告範圍；不自動套用地方標準。'
      };
    }
    const standard=standards().find(item=>item.areaKey===areaKey);
    if(!standard){
      return {
        status:'areaUnrecognized',standard:null,
        message:'地方加嚴放流水標準：目前所選區域不在本 Rule Pack 已收錄清單；仍應查核所在地主管機關現行公告。'
      };
    }
    const date=validDate(eventDate);
    if(date&&standard.published&&date<standard.published){
      return {
        status:'notYetPublished',standard,
        message:standard.name+'於'+standard.published+'公布；本次行為日期早於公布日，不以該地方標準回溯判斷。'
      };
    }
    return {
      status:'candidate',standard,
      message:'地方標準候選：'+standard.name+'。仍須確認實際直接／間接排放關係、公告範圍、適用對象及行為時施行規定後，才可作為適用標準。'
    };
  }

  function precedenceMessage(){
    return root.WATER_LOCAL_RULE_PACK?.precedence?.message||'';
  }

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_LOCAL_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      standards:pack.standards||[],
      precedence:pack.precedence||{}
    });
    const actual=fnv1a32(payload);
    return {
      ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,
      algorithm:expected.algorithm,
      expected:expected.value,
      actual
    };
  }

  function packInfo(){
    const pack=root.WATER_LOCAL_RULE_PACK;
    if(!pack)return null;
    return {
      packId:pack.meta?.packId||'',
      packVersion:pack.meta?.packVersion||'',
      status:pack.meta?.status||'unknown',
      jurisdiction:pack.meta?.jurisdiction||'',
      lastVerifiedAt:pack.meta?.lastVerifiedAt||'',
      limitations:pack.meta?.limitations||[],
      provenance:pack.provenance,
      integrity:pack.meta?.integrity||null
    };
  }

  root.WaterLocalLaw=Object.freeze({
    provenance:PROVENANCE,
    list,
    resolveArea,
    precedenceMessage,
    verifyIntegrity,
    packInfo
  });
})(typeof window==='undefined'?globalThis:window);
