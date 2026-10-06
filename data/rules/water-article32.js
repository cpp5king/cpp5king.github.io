(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article32Soil={
    id:'WATER-A32-SOIL',version:'1.0',title:'第32條第1項－廢（污）水排放於土壤',legalBasis:'水污染防治法第32條第1項',
    elements:[
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源、產生作業及污染物']},
      {id:'actualDischargeConfirmed',label:'已證明實際排放',nextChecks:['確認排放行為、流向及客觀證據']},
      {id:'dischargedToSoilConfirmed',label:'已確認實際排放於土壤',nextChecks:['確認廢（污）水實際進入土地，而非僅位於地面附近']},
      {id:'noValidSoilTreatmentPermit',label:'查無有效土壤處理許可',nextChecks:['查核土壤處理許可、有效期間及核准範圍','如有許可，另應比對現場是否依核准內容運作']}
    ]
  };
  root.WATER_RULES.article32Groundwater={
    id:'WATER-A32-GROUNDWATER',version:'1.0',title:'第32條第1項－廢（污）水注入地下水體',legalBasis:'水污染防治法第32條第1項',
    elements:[
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源、產生作業及污染物']},
      {id:'actualDischargeConfirmed',label:'已證明實際排放',nextChecks:['確認排放行為、流向及客觀證據']},
      {id:'injectedIntoGroundwaterBodyConfirmed',label:'已確認廢（污）水實際注入地下水體',nextChecks:['確認是否實際進入地下含水層','管線往地下本身不足以證明已注入地下水體']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
