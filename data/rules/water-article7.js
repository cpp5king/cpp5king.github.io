(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article7Effluent={
    id:'WATER-A7-EFFLUENT',version:'1.0',title:'第7條－放流水標準',legalBasis:'水污染防治法第7條第1項',
    elements:[
      {id:'article7SubjectEligible',label:'屬第7條管制主體',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源、產生作業及污染物']},
      {id:'actualDischargeConfirmed',label:'已證明實際排放',nextChecks:['確認現場流水、排放痕跡或其他客觀證據']},
      {id:'surfaceWaterConfirmed',label:'已確認排入地面水體',nextChecks:['追查最終流向','調閱排水圖資或查詢管理單位']},
      {id:'sampleTaken',label:'已有放流水採樣',noMeans:'insufficient',nextChecks:['於可代表該股放流水的位置辦理適當採樣']},
      {id:'sampleRepresentative',label:'採樣可代表該股放流水',noMeans:'insufficient',nextChecks:['確認採樣時點、排放狀態與代表性']},
      {id:'sampleBeforeReceivingWater',label:'採樣位置位於進入承受水體前',noMeans:'insufficient',nextChecks:['確認採樣點位於進入承受水體前之放流水位置']},
      {id:'applicableStandardConfirmed',label:'已確認適用放流水標準',noMeans:'insufficient',nextChecks:['確認業別、項目及適用之放流水標準']},
      {id:'labResultAvailable',label:'已有有效檢測結果',noMeans:'insufficient',nextChecks:['取得合格檢驗測定結果後再判斷水質']},
      {id:'effluentExceeded',label:'檢測結果超過適用標準',nextChecks:['核對超標項目、數值、標準及檢測報告']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
