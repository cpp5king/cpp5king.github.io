(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article18Measures={
    id:'WATER-A18-MEASURES',version:'1.0',title:'第18條－水污染防治措施具體義務',legalBasis:'水污染防治法第18條',
    elements:[
      {id:'subjectIsBusiness',label:'已確認為水污法事業',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'article18SpecificDutyConfirmed',label:'已依水措管理相關規定確認本案具體義務',nextChecks:['進入第二階段水措管理模組，確認適用對象、設施、操作、監測、紀錄或其他具體義務']},
      {id:'article18NoncomplianceConfirmed',label:'已確認現場未符合該具體水措義務',nextChecks:['固定現場設施、操作、紀錄及核准資料，並逐項對照具體水措規定']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
