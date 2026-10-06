(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article27Emergency={
    id:'WATER-A27-EMERGENCY',version:'1.0',title:'第27條－重大危害未立即緊急應變',legalBasis:'水污染防治法第27條第1項',
    elements:[
      {id:'article27SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認排放物為廢（污）水',nextChecks:['確認水的來源與性質']},
      {id:'actualDischargeConfirmed',label:'已確認存在排放行為',nextChecks:['固定排放事實、時間、位置與流向']},
      {id:'severeHazardRiskConfirmed',label:'已確認有嚴重危害人體健康、農漁業生產或飲用水水源之虞',nextChecks:['確認危害對象、污染物、濃度／量、影響範圍及下游風險；必要時查適用認定規定']},
      {id:'noImmediateEmergencyAction',label:'未立即採取緊急應變措施',nextChecks:['查核停止排放、圍堵、回收、抽除、減停產等應變措施及時間']}
    ]
  };
  root.WATER_RULES.article27Notice={
    id:'WATER-A27-NOTICE',version:'1.0',title:'第27條－重大危害未於3小時內通知',legalBasis:'水污染防治法第27條第1項',
    elements:[
      {id:'article27SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認排放物為廢（污）水',nextChecks:['確認水的來源與性質']},
      {id:'actualDischargeConfirmed',label:'已確認存在排放行為',nextChecks:['固定排放事實、時間、位置與流向']},
      {id:'severeHazardRiskConfirmed',label:'已確認有法定重大危害之虞',nextChecks:['確認危害事實與風險']},
      {id:'noThreeHourNotice',label:'未於3小時內通知當地主管機關',nextChecks:['查核危害發生／知悉時間、通報時間與通報紀錄']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
