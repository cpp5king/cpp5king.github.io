(function(root){
  'use strict';
  const places=[
    ['factory','工廠（場）','factory'],
    ['entertainment','娛樂場所','entertainment'],
    ['business','營業場所','business'],
    ['construction','營建工程','construction'],
    ['nonListed','非上述場所／工程','nonListed'],
    ['pending','尚待確認','pending']
  ].map(([id,label,legalClass])=>({id,label,legalClass}));
  const sources=[
    ['equipment','機械設備'],
    ['speaker','擴音設備'],
    ['vehicle','車輛相關'],
    ['other','其他'],
    ['pending','尚待確認']
  ].map(([id,label])=>({id,label}));
  const equipment=[
    ['hvac','空調／冷暖氣設備','1'],
    ['coolingTower','冷卻水塔','2'],
    ['pump','抽水／加壓馬達','3'],
    ['exhaustFan','抽排風機','4'],
    ['refrigeration','冷凍／冷藏設備','5'],
    ['generator','發電機','6'],
    ['transformer','變壓器','7'],
    ['process','製程設備',''],
    ['breaker','破碎機',''],
    ['excavator','挖土機',''],
    ['cutter','切割機',''],
    ['drill','電鑽／鑽孔機',''],
    ['grinder','砂輪機',''],
    ['compressor','空壓機',''],
    ['other','其他機械設備','']
  ].map(([id,label,facilityId])=>({id,label,facilityId}));
  const behaviors=[
    ['fireworks','施放爆竹煙火','fireworks'],
    ['outdoorSpeaker','室外使用擴音設施','outdoorSpeaker'],
    ['commercialMachinery','使用動力機械從事商業行為','commercialMachinery'],
    ['religious','宗教／民俗活動使用發聲法器','religious'],
    ['instrument','使用樂器','instrument'],
    ['vehicleBusiness','引擎試車／車輛修理、改裝','vehicleBusiness'],
    ['karaoke','卡拉 OK／伴唱歌唱','karaoke'],
    ['renovation','使用動力機械或手持工具從事裝修工程','renovation'],
    ['construction','使用動力機械或手持工具從事營建工程','construction'],
    ['exhaust','特定排氣管車輛','exhaust'],
    ['leafBlower','吹葉機','leafBlower'],
    ['other','其他',''],
    ['none','無上述行為','']
  ].map(([id,label,article8Act])=>({id,label,article8Act}));
  const targets={
    factory:{id:'factory',label:'工廠（場）整體噪音',a9Type:'factory'},
    entertainment:{id:'entertainment',label:'娛樂場所整體噪音',a9Type:'business'},
    business:{id:'business',label:'營業場所整體噪音',a9Type:'business'},
    construction:{id:'construction',label:'營建工程整體噪音',a9Type:'construction'},
    renovation:{id:'renovation',label:'公告裝修工程',a9Type:'renovation'},
    speaker:{id:'speaker',label:'擴音設施',a9Type:'speaker'},
    otherFacility:{id:'otherFacility',label:'其他經主管機關公告之場所、工程及設施',a9Type:'otherFacility'}
  };
  const landUseZones={
    nationalPark:'1',
    residential:'2',
    school:'2',
    commercial:'3',
    industrial:'4',
    otherUrban:'3'
  };
  function placeClass(input={}){
    return places.find(x=>x.id===input.noisePlaceType)?.legalClass||'';
  }
  function equipmentMeta(input={}){
    return equipment.find(x=>x.id===input.noiseEquipmentType)||null;
  }
  function overallTarget(legal){
    return ['factory','entertainment','business','construction'].includes(legal)?targets[legal]:null;
  }
  function targetCandidates(input={}){
    const legal=placeClass(input),source=input.noiseSourceCategory,equipmentRow=equipmentMeta(input);
    if(!legal||legal==='pending'||source==='pending'||!source)return [];
    if(source==='vehicle')return [];
    if(source==='speaker'){
      const rows=[];
      const overall=overallTarget(legal);
      if(overall)rows.push(overall);
      rows.push(targets.speaker);
      return rows;
    }
    if(source==='equipment'){
      const overall=overallTarget(legal);
      if(overall)return [overall];
      if(legal==='nonListed'&&equipmentRow?.facilityId)return [{...targets.otherFacility,facilityId:equipmentRow.facilityId}];
      return [];
    }
    if(source==='other'){
      const overall=overallTarget(legal);
      return overall?[overall]:[];
    }
    return [];
  }
  function target(input={}){
    const candidates=targetCandidates(input);
    if(candidates.length===1)return candidates[0];
    return candidates.find(x=>x.id===input.noiseTargetChoice)||null;
  }
  function article8Act(input={}){
    return behaviors.find(x=>x.id===input.noiseBehavior)?.article8Act||'';
  }
  function announcedFacility(input={}){
    return equipmentMeta(input)?.facilityId||'';
  }
  function landUseZone(id){return landUseZones[id]||'';}
  root.NOISE_REFACTOR_522=Object.freeze({
    version:'5.2.2',
    source:'5.2.1 噪音規則之流程重構映射層；第8、9條法規條件與數值沿用既有單一規則來源。',
    places:Object.freeze(places),
    sources:Object.freeze(sources),
    equipment:Object.freeze(equipment),
    behaviors:Object.freeze(behaviors),
    targets:Object.freeze(targets),
    placeClass,targetCandidates,target,article8Act,announcedFacility,landUseZone
  });
})(typeof window==='undefined'?globalThis:window);
