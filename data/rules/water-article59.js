(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article59Exception={
    id:'WATER-A59-EXCEPTION',version:'1.0',title:'第59條－處理設施故障24小時標準例外',legalBasis:'水污染防治法第59條',mode:'exception',
    elements:[
      {id:'facilityFailureConfirmed',label:'已確認廢（污）水處理設施發生故障',nextChecks:['確認故障設施、故障時間與原因']},
      {id:'a59ImmediateRepairAndResponse',label:'立即修復或啟用備份裝置，並採取減產、停產或其他應變措施',nextChecks:['查修復、備援、減停產與應變紀錄']},
      {id:'a59ImmediateRecordAndReport',label:'立即記錄故障並以電話或電傳向主管機關報備，且留存報備人員資料',nextChecks:['查故障紀錄簿及通報紀錄']},
      {id:'a59RecoveredWithin24Hours',label:'24小時內恢復正常操作，或恢復前持續減少／停止生產服務',nextChecks:['核對恢復時間與生產／服務量']},
      {id:'a59WrittenReportWithin5Days',label:'5日內提出書面報告',nextChecks:['查主管機關收文時間及書面報告內容']},
      {id:'a59DirectCausation',label:'故障與所違反之放流水標準具有直接關係',nextChecks:['比對故障設備功能、超標項目及因果關係']},
      {id:'a59NotSameFailureWithin6Months',label:'不屬6個月內相同故障',nextChecks:['查核近6個月故障紀錄']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
