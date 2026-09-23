(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article71Cleanup={
    id:'WATER-A71-CLEANUP',version:'1.0',title:'第71條－地面水體污染事件清除處理',legalBasis:'水污染防治法第71條',mode:'action',
    elements:[
      {id:'surfaceWaterPollutionEventConfirmed',label:'已確認地面水體發生污染事件',nextChecks:['固定污染範圍、來源、流向、影像及必要採樣證據']},
      {id:'polluterIdentified',label:'已確認污染行為人',nextChecks:['追查污染來源、操作人、事業／行為人及因果關係']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
