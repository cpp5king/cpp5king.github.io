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
    ['speaker','擴音設施'],
    ['vehicle','車輛相關'],
    ['other','其他'],
    ['pending','尚待確認']
  ].map(([id,label])=>({id,label}));
  const announcedItems=[
    ['hvac','空調（通風、冷暖氣機）系統','facility','1'],
    ['coolingTower','冷卻水塔','facility','2'],
    ['pump','抽水（加壓）馬達','facility','3'],
    ['exhaustFan','抽排風機','facility','4'],
    ['refrigeration','冷凍（冷藏）櫃','facility','5'],
    ['generator','發電機（含固定及移動式）','facility','6'],
    ['transformer','變壓器','facility','7'],
    ['nonBusinessKaraoke','非營業用卡拉 OK','facility','8'],
    ['renovation','非屬前四類場所／工程範圍內之裝修工程','renovation',''],
    ['none','以上公告項目皆非','none',''],
    ['pending','尚待確認','pending','']
  ].map(([id,label,kind,facilityId])=>({id,label,kind,facilityId}));
  const behaviors=[
    ['fireworks','施放爆竹煙火','fireworks'],
    ['outdoorSpeaker','室外使用擴音設施','outdoorSpeaker'],
    ['commercialMachinery','使用動力機械從事商業行為','commercialMachinery'],
    ['religious','宗教／民俗活動使用發聲法器','religious'],
    ['instrument','使用樂器','instrument'],
    ['vehicleBusiness','運轉引擎試車／使用動力機械清洗、修理、改裝車輛之商業行為','vehicleBusiness'],
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
    renovation:{id:'renovation',label:'其他經主管機關公告之裝修工程',a9Type:'renovation'},
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
  function announcedItem(input={}){
    return announcedItems.find(x=>x.id===input.noiseEquipmentType)||null;
  }
  function overallTarget(legal){
    return ['factory','entertainment','business','construction'].includes(legal)?targets[legal]:null;
  }
  function targetCandidates(input={}){
    const legal=placeClass(input),source=input.noiseSourceCategory,item=announcedItem(input);
    if(!legal||legal==='pending'||source==='pending'||!source)return [];
    if(source==='vehicle')return [];
    if(legal==='nonListed'){
      if(item?.kind==='facility')return [{...targets.otherFacility,facilityId:item.facilityId}];
      if(item?.kind==='renovation')return [targets.renovation];
      if(source==='speaker'&&item?.kind==='none')return [targets.speaker];
      return [];
    }
    if(source==='speaker'){
      const overall=overallTarget(legal);
      return overall?[overall,targets.speaker]:[targets.speaker];
    }
    if(source==='equipment'||source==='other'){
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
    const item=announcedItem(input);
    return item?.kind==='facility'?item.facilityId:'';
  }
  function landUseZone(id){return landUseZones[id]||'';}
  root.NOISE_REFACTOR_522=Object.freeze({
    version:'5.2.7',
    source:'5.2.7 噪音流程重構映射層；第8、9條法規條件與數值沿用既有單一規則來源。',
    places:Object.freeze(places),
    sources:Object.freeze(sources),
    equipment:Object.freeze(announcedItems),
    announcedItems:Object.freeze(announcedItems),
    behaviors:Object.freeze(behaviors),
    targets:Object.freeze(targets),
    placeClass,announcedItem,targetCandidates,target,article8Act,announcedFacility,landUseZone
  });
})(typeof window==='undefined'?globalThis:window);
