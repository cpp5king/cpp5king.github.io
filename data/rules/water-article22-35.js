(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article22Reporting={
    id:'WATER-A22-REPORTING',version:'1.0',title:'第22條－申報義務',legalBasis:'水污染防治法第22條',
    elements:[
      {id:'article22SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'article22ReportingDutyConfirmed',label:'已依適用規定確認本案具有申報義務',nextChecks:['確認應申報之格式、內容、頻率與方式；細節需進水措管理／檢測申報模組']},
      {id:'article22ReportingNoncomplianceConfirmed',label:'已確認未依規定完成申報',nextChecks:['固定申報期限、申報資料、系統紀錄與缺漏內容']}
    ]
  };
  root.WATER_RULES.article35FalseReporting={
    id:'WATER-A35-FALSE',version:'1.0',title:'第35條－明知不實申報／虛偽業務文書',legalBasis:'水污染防治法第35條',
    elements:[
      {id:'article22SubjectEligible',label:'屬依法有申報義務之事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認主體及申報義務來源']},
      {id:'article22ReportingDutyConfirmed',label:'已確認依法具有申報義務',nextChecks:['確認本法及相關規定之申報義務']},
      {id:'falseReportOrBusinessRecordConfirmed',label:'已確認存在不實申報或業務文書虛偽記載',nextChecks:['比對申報資料、原始紀錄、用水量、電量、藥劑、污泥、委外量、生產量等客觀資料']},
      {id:'knowingFalseEvidenceConfirmed',label:'已有證據足以支持「明知不實」之主觀要件',nextChecks:['查明資料製作流程、決策者、原始資料、修改紀錄、指示或其他可證明明知之證據']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
