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
    const pack=root.WATER_STANDARD_RULE_PACK;
    if(!pack)return {status:'packMissing',date:'',version:null,text:'Water Standard Rule Pack 尚未載入。'};
    const date=validDate(eventDate);
    if(!date){
      return {
        status:'dateUnknown',date:'',version:null,
        text:'放流水標準：行為發生日期尚未確認，適用標準版本待確認；不以稽查日期或裝置日期替代。'
      };
    }
    const matches=(pack.lawVersions||[]).filter(v=>within(date,v));
    if(matches.length===1){
      return {
        status:'resolved',date,version:matches[0],
        text:'放流水標準：本 Pack 可提供113年12月18日修正版之附表路由；實際限值及個別另定施行日期仍須依行為時有效規定確認。'
      };
    }
    if(date<'2024-12-18'){
      return {
        status:'historicalVersionMissing',date,version:null,
        text:'放流水標準：行為日期早於113年12月18日；本 Water Standard Rule Pack 尚未收錄該歷史版本，不以較新標準回溯判斷。'
      };
    }
    return {
      status:'versionUnresolved',date,version:null,
      text:'放流水標準：依行為發生日期無法唯一解析適用版本，適用標準版本待確認。'
    };
  }

  function routeAppendix(input={}){
    const pack=root.WATER_STANDARD_RULE_PACK;
    if(!pack)return {status:'packMissing',appendix:null,message:'Water Standard Rule Pack 尚未載入。'};

    if(input.waterSubjectType==='buildingSewage'){
      return {status:'routed',appendix:pack.buildingAppendix,basis:'建築物污水處理設施',message:'依目前主體類型，國家放流水標準基礎路由為附表十五。'};
    }

    if(input.waterSubjectType==='business'){
      if(input.waterSubjectConfirmed!=='yes'){
        return {status:'subjectUnconfirmed',appendix:null,message:'尚未確認屬水污法事業，暫不指定放流水標準附表。'};
      }
      const industry=input.waterIndustryType||'';
      const appendix=pack.industryAppendix?.[industry]||pack.defaultBusinessAppendix;
      const basis=pack.industryAppendix?.[industry]?'特定事業類型':'其他事業';
      return {
        status:'routed',appendix,basis,
        message:'依目前主體／業別，國家放流水標準基礎路由為附表'+appendix+'；仍須確認是否有特定業別、區域或地方加嚴標準。'
      };
    }

    if(input.waterSubjectType==='sewerSystem'){
      const subtype=input.waterSewerStandardType||'';
      if(!subtype){
        return {
          status:'subtypeRequired',appendix:null,
          message:'污水下水道系統需先確認類型（科學工業園區、石化專業區、其他工業區、社區、其他指定地區或公共下水道）才能指定附表九至十四。'
        };
      }
      const appendix=pack.sewerAppendices?.[subtype];
      if(!appendix)return {status:'subtypeUnknown',appendix:null,message:'目前下水道系統類型尚無法對應放流水標準附表。'};
      return {status:'routed',appendix,basis:'污水下水道系統',message:'依目前下水道系統類型，國家放流水標準基礎路由為附表'+appendix+'。'};
    }

    return {status:'notApplicable',appendix:null,message:'目前主體類型不進入本 Water Standard Rule Pack 之附表路由。'};
  }

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_STANDARD_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      lawVersions:pack.lawVersions||[],
      industryAppendix:pack.industryAppendix||{},
      defaultBusinessAppendix:pack.defaultBusinessAppendix||'',
      sewerAppendices:pack.sewerAppendices||{},
      buildingAppendix:pack.buildingAppendix||'',
      totalLoadControlAppendix:pack.totalLoadControlAppendix||'',
      precedence:pack.precedence||[]
    });
    const actual=fnv1a32(payload);
    return {ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,algorithm:expected.algorithm,expected:expected.value,actual};
  }

  function packInfo(){
    const pack=root.WATER_STANDARD_RULE_PACK;
    if(!pack)return null;
    return {
      packId:pack.meta?.packId||'',
      packVersion:pack.meta?.packVersion||'',
      status:pack.meta?.status||'unknown',
      lastVerifiedAt:pack.meta?.lastVerifiedAt||'',
      officialSources:pack.meta?.officialSources||[],
      limitations:pack.meta?.limitations||[],
      provenance:pack.provenance,
      integrity:pack.meta?.integrity||null
    };
  }

  root.WaterStandardLaw=Object.freeze({
    provenance:PROVENANCE,
    resolveVersion,
    routeAppendix,
    verifyIntegrity,
    packInfo
  });
})(typeof window==='undefined'?globalThis:window);
