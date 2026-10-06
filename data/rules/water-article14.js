(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article14NoPermit={
    id:'WATER-A14-NO-PERMIT',
    version:'1.0',
    title:'第14條第1項－無許可排放',
    legalBasis:'水污染防治法第14條第1項',
    elements:[
      {id:'subjectIsBusiness',label:'已確認為水污法事業',nextChecks:['確認實際作業內容','確認列管業別及規模','查核水污列管資料']},
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源及產生作業','確認是否接觸原物料、產品或污染物','必要時補強水質或製程事證']},
      {id:'actualDischargeConfirmed',label:'已證明實際排放',nextChecks:['確認現場流水或排放痕跡','調閱照片、影片或監視影像','必要時以水位、示蹤或操作紀錄補強']},
      {id:'surfaceWaterConfirmed',label:'已確認排入地面水體',nextChecks:['追查最終流向','調閱排水圖資或查詢管理單位'],contextChecks:{surfaceType:{roadsideDitch:['確認道路側溝排水功能','追查下游集水井、箱涵或雨水下水道','必要時進行示蹤']}}},
      {id:'noValidDischargePermit',label:'稽查當時無有效排放許可',nextChecks:['查核許可對象、場址、許可類型及有效期間','確認稽查日期當時許可效力']}
    ]
  };
})(window);
