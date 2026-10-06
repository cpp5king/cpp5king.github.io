(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article13Plan={
    id:'WATER-A13-PLAN',version:'1.0',title:'第13條－設立／變更前水措計畫',legalBasis:'水污染防治法第13條',
    elements:[
      {id:'subjectIsBusiness',label:'已確認為水污法事業',noMeans:'notApplicable',nextChecks:['確認實際作業內容、業別、規模及列管身分']},
      {id:'article13DesignatedSubjectConfirmed',label:'已確認屬第13條指定之種類、範圍及規模',nextChecks:['查核中央主管機關指定公告；V1未納入子法／公告細節']},
      {id:'article13NewOrChangeConfirmed',label:'本案涉及事業設立或變更',nextChecks:['確認是否為設立或依法需辦理水措計畫之變更時點']},
      {id:'noApprovedMeasuresPlanBeforeAction',label:'設立或變更前查無已審查核准之水污染防治措施計畫',nextChecks:['查核水措計畫核准文件、核准日期與實際設立／變更日期']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
