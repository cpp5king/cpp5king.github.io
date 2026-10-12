(function(root){
  'use strict';

  const BASIC_ITEMS=Object.freeze([
    Object.freeze({id:'ss',label:'SS（懸浮固體）',group:'lab'}),
    Object.freeze({id:'bod',label:'BOD（生化需氧量）',group:'lab'}),
    Object.freeze({id:'cod',label:'COD（化學需氧量）',group:'lab'}),
    Object.freeze({id:'ammonia',label:'氨氮',group:'lab'}),
    Object.freeze({id:'copper',label:'銅',group:'lab',metal:true}),
    Object.freeze({id:'zinc',label:'鋅',group:'lab',metal:true}),
    Object.freeze({id:'nickel',label:'鎳',group:'lab',metal:true}),
    Object.freeze({id:'chromium',label:'鉻（總鉻）',group:'lab',metal:true}),
    Object.freeze({id:'cadmium',label:'鎘',group:'lab',metal:true}),
    Object.freeze({id:'arsenic',label:'砷',group:'lab',metal:true}),
    Object.freeze({id:'lead',label:'鉛',group:'lab',metal:true}),
    Object.freeze({id:'mercury',label:'汞',group:'lab',metal:true}),
    Object.freeze({id:'mineralOil',label:'礦物性油脂',group:'lab',special:'oilGrease'}),
    Object.freeze({id:'totalOil',label:'總油脂',group:'lab',special:'oilGrease'}),
    Object.freeze({id:'ph',label:'pH',group:'field',special:'ph'}),
    Object.freeze({id:'temperature',label:'水溫',group:'field',special:'temperature'}),
    Object.freeze({id:'do',label:'DO（溶氧）',group:'field',special:'dissolvedOxygen'})
  ]);

  const INDUSTRIES=Object.freeze([
    ['semiconductor','晶圓製造及半導體製造業'],
    ['optoelectronics','光電材料及元件製造業'],
    ['petrochemical','石油化學業'],
    ['chemical','化工業'],
    ['basicMetal','金屬基本工業'],
    ['metalSurface','金屬表面處理業'],
    ['electroplating','電鍍業'],
    ['pcb','印刷電路板製造業'],
    ['coalPower','燃煤發電廠'],
    ['powerPlant','其他發電廠'],
    ['desalination','海水淡化廠'],
    ['other','其他事業']
  ]);

  const SEWER_TYPES=Object.freeze([
    ['sciencePark','科學工業園區專用污水下水道系統'],
    ['petrochemicalPark','石油化學專業區專用污水下水道系統'],
    ['otherIndustrialPark','其他工業區專用污水下水道系統'],
    ['community','社區專用污水下水道系統'],
    ['otherDesignatedArea','其他指定地區或場所專用污水下水道系統'],
    ['publicSewer','公共污水下水道系統']
  ]);

  function appendixFor(ctx){
    if(!root.WaterStandardLaw?.routeAppendix)return {status:'unavailable',appendix:null,message:'放流水標準路由尚未載入。'};
    const input={
      waterSubjectType:ctx?.subjectType==='industry'?'business':ctx?.subjectType==='sewer'?'sewerSystem':ctx?.subjectType==='building'?'buildingSewage':'',
      waterSubjectConfirmed:ctx?.subjectType==='industry'?'yes':'',
      waterIndustryType:ctx?.industryType==='other'?'':(ctx?.industryType||''),
      waterSewerStandardType:ctx?.sewerType||''
    };
    return root.WaterStandardLaw.routeAppendix(input);
  }

  function candidates(ctx){
    const route=appendixFor(ctx);
    return {
      route,
      items:BASIC_ITEMS.map(x=>Object.assign({},x)),
      note:'5.2.16 先提供現場常用基本候選項目；尚未將各附表全部水質項目與限值完整資料化。實際適用項目仍應以行為時有效之放流水標準附表、地方加嚴或特定業別規定確認。'
    };
  }

  root.WaterDischargeSamplingItems=Object.freeze({
    industries:()=>INDUSTRIES.map(x=>x.slice()),
    sewerTypes:()=>SEWER_TYPES.map(x=>x.slice()),
    basicItems:()=>BASIC_ITEMS.map(x=>Object.assign({},x)),
    candidates,
    appendixFor
  });
})(window);
