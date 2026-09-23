(function(root){
  'use strict';
  const EFFECTIVE_DATE='2026-03-05';
  const validZone=z=>['1','2','3','4'].includes(z);
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const pair=(a,b)=>[a,b].sort().join('-');

  function result(status,extra={}){return {status,zone:null,zones:null,note:'',message:'',...extra};}

  function resolve(input={}){
    const manual=validZone(input.noiseZone)?input.noiseZone:null;
    if(input.noiseZoneMode!=='assist'){
      if(manual)return result('resolved',{zone:manual,note:`管制區由稽查人員直接確認為第${manual}類。`,basis:'manual'});
      return result('pending',{message:'請直接選擇噪音管制區，或啟用「依新北市公告協助判定」。'});
    }

    if(!input.noiseDate)return result('pending',{message:'使用管制區判定輔助前，請先確認稽查日期。'});
    if(input.noiseDate<EFFECTIVE_DATE)return result('pending',{message:'目前管制區判定輔助僅套用115年3月5日起現行公告；較早案件請依當時有效公告確認後直接選擇管制區。'});

    const type=input.noiseZoneAssistType;
    if(!type)return result('pending',{message:'請選擇管制區判定情境。'});

    if(type==='land'){
      const map={nationalPark:'1',residentialSchool:'2',fourth:'4',other:'3'};
      const zone=map[input.noiseZoneLandClass];
      if(!zone)return result('pending',{message:'請確認音源所在地之土地／設施類別。'});
      const labels={nationalPark:'國家公園',residentialSchool:'都市計畫住宅區或學校用地',fourth:'公告第四類土地／設施範圍',other:'第一、二、四類以外地區'};
      return result('resolved',{zone,note:`依115年3月5日公告一般劃定：${labels[input.noiseZoneLandClass]}，研判第${zone}類噪音管制區。`,basis:'announcement-1'});
    }

    if(type==='road6to15'){
      const traffic=tri(input.noiseZoneTrafficSource);
      if(traffic==='missing'||traffic==='unknown')return result('pending',{message:'6公尺以上未滿15公尺道路，請先確認是否屬交通噪音源。'});
      if(traffic==='yes')return result('pending',{message:'公告第七點「依音源所在位置」僅適用交通噪音源以外案件；本案為交通噪音源，請先回主管機關／專章分流，不以此簡化規則決定管制區。'});
      if(!validZone(input.noiseZoneSourceZone))return result('pending',{message:'請確認噪音源所在位置原屬第幾類管制區。'});
      return result('resolved',{zone:input.noiseZoneSourceZone,note:`道路寬度6公尺以上未滿15公尺，且非交通噪音源，依公告第七點採噪音源所在位置之第${input.noiseZoneSourceZone}類管制區標準。`,basis:'announcement-7'});
    }

    if(type==='roadUnder6'){
      const a=input.noiseZoneSideA,b=input.noiseZoneSideB,side=input.noiseZonePointSide;
      if(!validZone(a)||!validZone(b))return result('pending',{message:'請確認未滿6公尺道路兩側相鄰土地各自所屬管制區。'});
      if(!['a','b'].includes(side))return result('pending',{message:'請確認音源／測點位於道路中心線哪一側。'});
      const selected=side==='a'?a:b;
      if(a===b)return result('resolved',{zone:a,note:`未滿6公尺道路兩側均為第${a}類，依公告第六點研判道路屬第${a}類。`,basis:'announcement-6'});
      const p=pair(a,b);
      if(p==='1-3')return result('resolved',{zone:'2',note:'未滿6公尺道路兩側為第一類與第三類，自道路中心線各退縮15公尺範圍依公告劃為第二類。',basis:'announcement-6-1'});
      if(p==='2-4')return result('resolved',{zone:'3',note:'未滿6公尺道路兩側為第二類與第四類，自道路中心線各退縮15公尺範圍依公告劃為第三類。',basis:'announcement-6-2'});
      if(p==='1-4'){
        const zone=selected==='1'?'2':'3';
        return result('resolved',{zone,note:`未滿6公尺道路兩側為第一類與第四類；本點位於原第${selected}類側，依公告自中心線退縮15公尺後研判為第${zone}類。`,basis:'announcement-6-3'});
      }
      return result('resolved',{zone:selected,note:`未滿6公尺道路兩側為不同類且非公告所列跨類特殊組合，以道路中心線為界；本點位於原第${selected}類側，研判第${selected}類。`,basis:'announcement-6'});
    }

    if(type==='majorTransport'){
      const pos=input.noiseZoneMajorPosition;
      if(!['on','within15','from15to30','beyond30'].includes(pos))return result('pending',{message:'請確認相對於正式通車運輸系統／15公尺以上道路周界的位置。'});
      if(pos==='on')return result('resolved',{zone:'4',note:'正式通車之快速道路、高速公路、鐵路、大眾捷運道路／軌道／專用路線及15公尺以上其他道路本體屬第四類。',basis:'announcement-1-4'});
      if(pos==='beyond30'){
        if(!validZone(input.noiseZoneUnderlying))return result('pending',{message:'已超出周界外推30公尺特殊劃定範圍，請確認該位置原土地管制區。'});
        return result('resolved',{zone:input.noiseZoneUnderlying,note:`本點距交通設施／15公尺以上道路周界逾30公尺，回歸原土地劃定，第${input.noiseZoneUnderlying}類。`,basis:'announcement-5'});
      }
      const originalFourth=tri(input.noiseZoneOriginalFourth);
      if(originalFourth==='missing'||originalFourth==='unknown')return result('pending',{message:'請確認該外推範圍原本是否屬第四類管制區；原第四類不適用外推改劃。'});
      if(originalFourth==='yes')return result('resolved',{zone:'4',note:'該位置原屬第四類，依公告第五點但書不適用周界外推改劃，維持第四類。',basis:'announcement-5-proviso'});
      const adjacentFirst=tri(input.noiseZoneAdjacentFirst);
      if(adjacentFirst==='missing'||adjacentFirst==='unknown')return result('pending',{message:'請確認該交通設施／道路是否緊鄰第一類噪音管制區。'});
      if(adjacentFirst==='yes'){
        const zone=pos==='within15'?'3':'2';
        return result('resolved',{zone,note:`交通設施／15公尺以上道路緊鄰第一類；本點位於周界外${pos==='within15'?'15公尺內':'逾15至30公尺內'}，依公告第五點研判第${zone}類。`,basis:'announcement-5-1'});
      }
      return result('resolved',{zone:'3',note:'交通設施／15公尺以上道路周界外30公尺內，非原第四類且未緊鄰第一類，依公告第五點劃為第三類。',basis:'announcement-5-1'});
    }

    if(type==='boundary'){
      const raw=String(input.noiseZoneBoundaryPair||'');
      const zones=raw.split('-').filter(validZone);
      if(zones.length!==2||zones[0]===zones[1])return result('pending',{message:'請確認交界處涉及的兩類噪音管制區。'});
      return result('boundary',{zones,note:`測量地點（音源）位於第${zones[0]}類與第${zones[1]}類交界；公告第八點要求音量不得超過其中任何一區標準，不能只選單一管制區。`,message:'本案屬二個噪音管制區交界，應同時套用兩區標準；目前單一管制區流程暫不自動簡化。',basis:'announcement-8'});
    }

    return result('pending',{message:'無法辨識管制區判定情境。'});
  }

  root.NoiseZone={resolve,EFFECTIVE_DATE};
})(typeof window==='undefined'?globalThis:window);
