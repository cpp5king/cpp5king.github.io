(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article26Obstruction={
    id:'WATER-A26-OBSTRUCTION',version:'1.0',title:'第26條－規避、妨礙或拒絕查證',legalBasis:'水污染防治法第26條',
    elements:[
      {id:'article26TargetEligible',label:'查證對象屬事業、污水下水道系統或建築物污水處理設施',noMeans:'notApplicable',nextChecks:['確認查證對象身分']},
      {id:'article26InspectionBasisConfirmed',label:'已確認稽查人員攜帶證明文件並就法定查證事項執行查證',nextChecks:['記錄證件出示、要求查證事項及執行時間']},
      {id:'article26ObstructionConfirmed',label:'已確認受檢者有規避、妨礙或拒絕行為',nextChecks:['具體記錄要求事項、對方回應、告知內容、持續時間及錄音錄影等證據']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
