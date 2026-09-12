(function(root){
  'use strict';
  const source=Object.freeze({
    id:'FL040734',
    title:'水污染防治措施及檢測申報管理辦法',
    revised:'2026-04-20',
    note:'案件適用版本仍以稽查日期與實際施行日判斷。'
  });
  const industries=Object.freeze({
    mining:{label:'採礦業',articles:['9']},
    stoneExtraction:{label:'土石採取業',articles:['9']},
    stoneProcessing:{label:'土石加工業',articles:['9']},
    readyMix:{label:'水泥業（本辦法第9條所稱預拌混凝土）',articles:['9']},
    earthworkDump:{label:'土石方堆（棄）置場',articles:['9']},
    construction:{label:'營建工地',articles:['9','10','49-3']},
    shipDismantling:{label:'船舶解體業',articles:['45']},
    livestock:{label:'畜牧業',articles:['46','46-1','49-5～49-7','49-10～49-11','70-1～70-10']},
    waterworks:{label:'自來水廠',articles:['47']},
    restaurant:{label:'餐飲業',articles:['48','49']},
    touristHotel:{label:'觀光旅館（飯店）',articles:['48','49']},
    dialysisClinic:{label:'洗腎診所',articles:['49-4']},
    coalPower:{label:'使用燃煤之發電廠',articles:['49-8']},
    semiconductor:{label:'晶圓製造及半導體製造業',articles:['49-9']},
    optoelectronics:{label:'光電材料及元件製造業',articles:['49-9']},
    pcb:{label:'印刷電路板製造業',articles:['49-9']},
    electroplating:{label:'電鍍業',articles:['49-9']},
    metalSurface:{label:'金屬表面處理業',articles:['49-9']},
    other:{label:'其他事業',articles:[]},
    unknown:{label:'業別尚待確認',articles:[]}
  });
  const specialOperations=Object.freeze({
    organicGroundwaterPollutant:{label:'貯存／輸送地下水污染管制標準有機污染物',articles:['49-1']},
    constructionResidualReceiving:{label:'收容處理特定淤泥／高含水土壤／皂土等營建剩餘土石方',articles:['49-2']},
    batPermitReview:{label:'附表五業別規模之水措／許可申請、變更或展延',articles:['49-12']}
  });
  root.WATER_INDUSTRY_CATALOG_V485=Object.freeze({version:'4.8.5',source,industries,specialOperations});
})(typeof window==='undefined'?globalThis:window);
