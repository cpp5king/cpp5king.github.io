(function(root){
  'use strict';
  root.WATER_RULE_PACK_META=Object.freeze({
    packId:'WATER-CORE-TW',
    name:'Water Core Rules',
    lawName:'水污染防治法',
    packVersion:'2026.09.21.1-test',
    status:'test',
    createdAt:'2026-09-21',
    updatedAt:'2026-09-21',
    lastVerifiedAt:'2026-09-21',
    compatibleApp:{min:'4.9.43'},
    provenance:'PP-IA-41-7F3C9A21',
    integrity:Object.freeze({algorithm:'fnv1a32-json',value:'329f7eb8'}),
    officialSources:Object.freeze([
      Object.freeze({
        authority:'環境部',
        title:'水污染防治法',
        sourceId:'FL015486',
        url:'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL015486'
      })
    ]),
    lawVersions:Object.freeze([
      Object.freeze({
        id:'WPA-2018-06-13',
        effectiveFrom:'2018-06-13',
        effectiveTo:null,
        sourceId:'FL015486',
        ruleSet:'current'
      })
    ])
  });
})(typeof window==='undefined'?globalThis:window);

// ---- migrated from data/rules/water-article13.js ----
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


// ---- migrated from data/rules/water-article14.js ----
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
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from data/rules/water-article18.js ----
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


// ---- migrated from data/rules/water-article20.js ----
(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article20StorageNoPermit={
    id:'WATER-A20-STORAGE-NO-PERMIT',version:'1.0',title:'第20條－未經許可貯留廢水',legalBasis:'水污染防治法第20條第1項',
    elements:[
      {id:'article20SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認為廢水',nextChecks:['確認水的來源、產生作業及污染物']},
      {id:'storageActivityConfirmed',label:'已確認存在廢水貯留行為',nextChecks:['確認槽體、池體、暫存方式及實際用途']},
      {id:'noValidStoragePermit',label:'查無有效貯留許可',nextChecks:['查核貯留許可、有效期間及核准範圍']}
    ]
  };
  root.WATER_RULES.article20StorageMismatch={
    id:'WATER-A20-STORAGE-MISMATCH',version:'1.0',title:'第20條－貯留未依登記事項運作',legalBasis:'水污染防治法第20條第1項',
    elements:[
      {id:'article20SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'storageActivityConfirmed',label:'已確認存在廢水貯留行為',nextChecks:['確認實際貯留方式']},
      {id:'validStoragePermitConfirmed',label:'已確認具有有效貯留許可',noMeans:'notApplicable',nextChecks:['查核貯留許可']},
      {id:'storageRegistrationMismatch',label:'已確認實際貯留未依許可登記事項運作',nextChecks:['逐項比對核准槽體、容量、流程、操作及現場實況']}
    ]
  };
  root.WATER_RULES.article20DilutionNoPermit={
    id:'WATER-A20-DILUTION-NO-PERMIT',version:'1.0',title:'第20條－未經許可稀釋廢水',legalBasis:'水污染防治法第20條第1項',
    elements:[
      {id:'article20SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認為廢水',nextChecks:['確認水的來源、產生作業及污染物']},
      {id:'dilutionObserved',label:'已確認存在廢水稀釋行為',nextChecks:['確認混合點、來源水與操作方式']},
      {id:'noValidDilutionPermit',label:'查無有效稀釋許可',nextChecks:['查核稀釋許可、有效期間及核准範圍']}
    ]
  };
  root.WATER_RULES.article20DilutionMismatch={
    id:'WATER-A20-DILUTION-MISMATCH',version:'1.0',title:'第20條－稀釋未依登記事項運作',legalBasis:'水污染防治法第20條第1項',
    elements:[
      {id:'article20SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'dilutionObserved',label:'已確認存在廢水稀釋行為',nextChecks:['確認實際稀釋方式']},
      {id:'validDilutionPermitConfirmed',label:'已確認具有有效稀釋許可',noMeans:'notApplicable',nextChecks:['查核稀釋許可']},
      {id:'dilutionRegistrationMismatch',label:'已確認實際稀釋未依許可登記事項運作',nextChecks:['逐項比對核准稀釋方式、來源、比例、流程及現場實況']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from data/rules/water-article22-35.js ----
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


// ---- migrated from data/rules/water-article26.js ----
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


// ---- migrated from data/rules/water-article27.js ----
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


// ---- migrated from data/rules/water-article7.js ----
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


// ---- migrated from data/rules/water-article18-1.js ----
(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article181Bypass={
    id:'WATER-A181-BYPASS',version:'1.0',title:'第18條之1第1項－繞流排放',legalBasis:'水污染防治法第18條之1第1項',
    elements:[
      {id:'article181SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源、產生作業及污染物']},
      {id:'approvedRouteConfirmed',label:'已確認核准登記之收集、處理流程及出口',noMeans:'insufficient',nextChecks:['調閱核准水措、許可及水路資料']},
      {id:'actualRouteConfirmed',label:'已確認現場實際水路',noMeans:'insufficient',nextChecks:['追查管線、閥門、槽體與實際流向']},
      {id:'bypassConfirmed',label:'已確認實際避開核准流程或由非核准出口排放',nextChecks:['以水流、示蹤、水位、閥門操作或影像補強繞流事實']},
      {id:'noBypassEmergencyException',label:'無第18條之1第3項緊急例外',nextChecks:['確認是否屬搶救人員或重大處理設施之急迫情形及3小時內通知']}
    ]
  };
  root.WATER_RULES.article181Dilution={
    id:'WATER-A181-DILUTION',version:'1.0',title:'第18條之1第2項－違法稀釋',legalBasis:'水污染防治法第18條之1第2項',
    elements:[
      {id:'article181SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'wastewaterConfirmed',label:'已確認為廢（污）水',nextChecks:['查明水的來源、產生作業及污染物']},
      {id:'requiresTreatmentToMeetStandard',label:'該廢（污）水須經處理始能符合管制標準',nextChecks:['確認原水水質、處理需求及適用管制標準']},
      {id:'dilutionObserved',label:'已確認排放（入）前有混合稀釋行為',nextChecks:['確認混合點、來源水及操作方式']},
      {id:'mixedWithNoTreatmentNeededWater',label:'混入無需處理即能符合標準之水',nextChecks:['確認被混入水來源及其是否無需處理即可符合標準']},
      {id:'noValidDilutionPermit',label:'查無合法稀釋許可／依據',nextChecks:['查核第20條稀釋許可及相關管理規定']},
      {id:'noDilutionEmergencyException',label:'無第18條之1第3項緊急例外',nextChecks:['確認是否屬急迫搶救情形及3小時內通知']}
    ]
  };
  root.WATER_RULES.article181Treatment={
    id:'WATER-A181-TREATMENT',version:'1.0',title:'第18條之1第4項－處理設施功能／操作',legalBasis:'水污染防治法第18條之1第4項',
    elements:[
      {id:'article181SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'treatmentFacilityApplicable',label:'本案有廢（污）水（前）處理設施可供檢視',noMeans:'notApplicable',nextChecks:['確認現場是否設有廢（污）水（前）處理設施']},
      {id:'treatmentFacilityNonCompliant',label:'處理設施功能／設備不足或未維持正常操作',nextChecks:['查核設備功能、鼓風、加藥、泵浦、操作狀態及相關紀錄']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from data/rules/water-article28.js ----
(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article28Prevention={
    id:'WATER-A28-PREVENTION',version:'1.0',title:'第28條第1項－疏漏風險之維護／防範',legalBasis:'水污染防治法第28條第1項',
    mode:'violation',
    elements:[
      {id:'article28SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'article28MatterEligible',label:'涉及污染物或廢（污）水',nextChecks:['確認疏漏物質性質']},
      {id:'transportStorageEquipmentConfirmed',label:'已確認為輸送或貯存設備',nextChecks:['確認槽體、管線、泵浦或其他輸送／貯存設備']},
      {id:'equipmentLeakScenarioEligible',label:'屬設備疏漏／溢流／滲漏態樣，而非人為主動排放',noMeans:'notApplicable',nextChecks:['查明疏漏原因及設備狀態']},
      {id:'leakRiskToWaterBodyConfirmed',label:'已確認有疏漏至水體之虞',nextChecks:['追查設備與水體之位置關係、流向及可能污染路徑']},
      {id:'noMaintenancePrevention',label:'未採取必要維護及防範措施',nextChecks:['查核維護、防範措施及相關紀錄']}
    ]
  };
  root.WATER_RULES.article28Emergency={
    id:'WATER-A28-EMERGENCY',version:'1.0',title:'第28條第1項－污染水體後未立即應變',legalBasis:'水污染防治法第28條第1項',
    mode:'violation',
    elements:[
      {id:'article28SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'article28MatterEligible',label:'涉及污染物或廢（污）水',nextChecks:['確認疏漏物質性質']},
      {id:'transportStorageEquipmentConfirmed',label:'已確認為輸送或貯存設備',nextChecks:['確認疏漏設備種類與功能']},
      {id:'equipmentLeakScenarioEligible',label:'屬設備疏漏／溢流／滲漏態樣，而非人為主動排放',noMeans:'notApplicable',nextChecks:['查明疏漏原因；人為開閥或主動抽排優先查§14／§18-1']},
      {id:'leakPollutedWaterBodyConfirmed',label:'已確認疏漏致污染水體',nextChecks:['固定污染範圍、流向、影像及必要採樣證據']},
      {id:'noImmediateEmergencyAction',label:'未立即採取緊急應變措施',nextChecks:['查核止漏、圍堵、回收、抽除等應變措施及時間']}
    ]
  };
  root.WATER_RULES.article28Notice={
    id:'WATER-A28-NOTICE',version:'1.0',title:'第28條第1項－污染水體後未於3小時內通知',legalBasis:'水污染防治法第28條第1項',
    mode:'violation',
    elements:[
      {id:'article28SubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體身分']},
      {id:'article28MatterEligible',label:'涉及污染物或廢（污）水',nextChecks:['確認疏漏物質性質']},
      {id:'transportStorageEquipmentConfirmed',label:'已確認為輸送或貯存設備',nextChecks:['確認疏漏設備種類與功能']},
      {id:'equipmentLeakScenarioEligible',label:'屬設備疏漏／溢流／滲漏態樣，而非人為主動排放',noMeans:'notApplicable',nextChecks:['查明疏漏原因']},
      {id:'leakPollutedWaterBodyConfirmed',label:'已確認疏漏致污染水體',nextChecks:['固定污染範圍、流向及發生時間']},
      {id:'noThreeHourNotice',label:'未於事故發生後3小時內通知當地主管機關',nextChecks:['查核事故發生時間、通報時間及通報紀錄']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from data/rules/water-article30.js ----
(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article30Dumping={
    id:'WATER-A30-DUMPING',version:'1.0',title:'第30條第1項第2款－污染物棄置',legalBasis:'水污染防治法第30條第1項第2款',
    elements:[
      {id:'controlZoneConfirmed',label:'已確認行為地點位於水污染管制區',nextChecks:['查核水污染管制區公告及行為地點']},
      {id:'article30MatterEligible',label:'棄置物屬垃圾、水肥、污泥、酸鹼廢液、建築廢料或其他污染物',nextChecks:['確認棄置物性質；必要時採樣或查來源']},
      {id:'dumpingConfirmed',label:'已確認存在棄置行為',nextChecks:['以現場影像、行為人陳述、運載紀錄或其他客觀證據固定棄置事實']},
      {id:'designatedWaterRangeConfirmed',label:'已確認位於公告指定水體或其沿岸規定距離內',nextChecks:['查核主管機關公告之指定水體與沿岸管制距離','確認實際位置與距離']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from data/rules/water-article32.js ----
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


// ---- migrated from data/rules/water-article59.js ----
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


// ---- migrated from data/rules/water-article71.js ----
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


// ---- migrated from data/rules/water-v2-core.js ----
(function(root){
  'use strict';
  const R=root.WATER_V2_RULES=root.WATER_V2_RULES||{};
  const e=(id,label)=>({id,label});
  const rule=(id,title,legalBasis,elements)=>({id,version:'1.0',title,legalBasis,elements});

  R.article14NoPermitGround=rule(
    'WATER-V2-A14-NO-PERMIT-GROUND','第14條第1項－無有效排放許可而排放至地面水體','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_ground','實際處理方式包含排放至地面水體')
    ]
  );
  R.article14PermitMismatch=rule(
    'WATER-V2-A14-PERMIT-MISMATCH','第14條第1項－排放許可登記事項差異','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_discharge','核對類型為排放許可／簡易排放許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );
  R.article14RouteMismatch=rule(
    'WATER-V2-A14-ROUTE-MISMATCH','第14條第1項－排放路徑與排放許可登記事項差異','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_discharge','核對類型為排放許可／簡易排放許可'),
      e('actual_discharge','現場有實際排放'),
      e('route_mismatch','現場排放位置／路徑與核准內容不一致'),
      e('approved_final_outlet_confirmed','已確認不是由非核准最終放流口／納管口排出'),
      e('destination_ground','最終去向為地面水體')
    ]
  );

  R.article18Meter=rule(
    'WATER-V2-A18-METER','第18條－水量計測設施義務','水污染防治法第18條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('meter_required','依法應設水量計測'),
      e('meter_noncompliance','水量計測未設置或未正常計量')
    ]
  );
  R.article18Record=rule(
    'WATER-V2-A18-RECORD','第18條－操作／管理紀錄義務','水污染防治法第18條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('record_required','依法應有操作／管理紀錄'),
      e('record_noncompliance','紀錄無法提供或不足以查核')
    ]
  );

  R.article181Bypass=rule(
    'WATER-V2-A181-BYPASS','第18條之1第1項－非核准最終出口','水污染防治法第18條之1第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('non_approved_final_outlet','由非核准最終放流口／非核准納管口排出')
    ]
  );
  R.article181Dilution=rule(
    'WATER-V2-A181-DILUTION','第18條之1第2項－禁止稀釋方向','水污染防治法第18條之1第2項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('dilution_needs_treatment','廢污水需處理才能符合標準'),
      e('mixed_water','排放／納管前與其他水混合'),
      e('mixed_water_clean','混入水無需處理即可符合標準'),
      e('mixed_before_discharge','混合發生於排放／納管前')
    ]
  );
  R.article181Treatment=rule(
    'WATER-V2-A181-TREATMENT','第18條之1第4項－處理設施未維持正常操作','水污染防治法第18條之1第4項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('treatment_needed','現場有廢污水需要處理'),
      e('treatment_should_operate','處理設施當時應運轉'),
      e('treatment_not_running','處理設施未正常運轉'),
      e('no_alternative_treatment','未記錄其他替代處理方式')
    ]
  );

  R.article20NoPermitStorage=rule(
    'WATER-V2-A20-NO-PERMIT-STORAGE','第20條－無有效許可而採貯留','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_storage','實際處理方式包含貯留')
    ]
  );
  R.article20NoPermitDilution=rule(
    'WATER-V2-A20-NO-PERMIT-DILUTION','第20條－無有效許可而採稀釋','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_dilution','實際處理方式包含稀釋')
    ]
  );
  R.article20StorageMismatch=rule(
    'WATER-V2-A20-STORAGE-MISMATCH','第20條－貯留許可登記事項差異','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_storage','核對類型為貯留許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );
  R.article20DilutionMismatch=rule(
    'WATER-V2-A20-DILUTION-MISMATCH','第20條－稀釋許可登記事項差異','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_dilution','核對類型為稀釋許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );

  R.article30Direction=rule(
    'WATER-V2-A30-DIRECTION','第30條－水污染管制區禁止行為方向','水污染防治法第30條方向',[
      e('subject_other','非上述管制主體'),
      e('article30_action_any','已記錄第30條相關行為'),
      e('control_zone_yes','行為地點位於公告水污染管制區')
    ]
  );

  R.article32NoPermitSoilMethod=rule(
    'WATER-V2-A32-NO-PERMIT-SOIL-METHOD','第32條－無有效許可而採土壤處理方向','水污染防治法第32條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_soil','實際處理方式包含土壤處理')
    ]
  );
  R.article32Groundwater=rule(
    'WATER-V2-A32-GROUNDWATER','第32條第1項－注入地下水體','水污染防治法第32條第1項',[
      e('groundwater_discharge','已記錄廢污水注入地下水體')
    ]
  );
  R.article32SoilNoException=rule(
    'WATER-V2-A32-SOIL-NO-EXCEPTION','第32條第1項－排放於土壤且不具合法例外','水污染防治法第32條第1項',[
      e('soil_discharge','已記錄廢污水排放於土壤'),
      e('soil_exception_no','已確認不具完整土壤處理合法例外')
    ]
  );
  R.article32SoilPending=rule(
    'WATER-V2-A32-SOIL-PENDING','第32條－土壤處理合法例外待確認','水污染防治法第32條方向',[
      e('soil_discharge','已記錄廢污水排放於土壤'),
      e('soil_exception_unknown','土壤處理合法例外尚未確認')
    ]
  );

  R.article25Building=rule(
    'WATER-V2-A25-BUILDING','第25條－建築物污水處理設施方向','水污染防治法第25條方向',[
      e('subject_building','管制主體為建築物污水處理設施')
    ]
  );
})(typeof window==='undefined'?globalThis:window);


(function(root){
  'use strict';

  root.WATER_FIELD_NAVIGATION=Object.freeze({
    article14NoPermitGround:Object.freeze({
      lawBySubject:Object.freeze({
        industry:'水污染防治法第14條第1項',
        sewer:'水污染防治法第19條準用第14條第1項'
      }),
      reason:'目前結構化事實為無有效排放許可／核准資料，且有排放廢污水至地面水體方向。'
    }),
    article14PermitMismatch:Object.freeze({
      lawBySubject:Object.freeze({
        industry:'水污染防治法第14條第1項',
        sewer:'水污染防治法第19條準用第14條第1項'
      }),
      reason:'{code} 項已記錄與排放許可／簡易排放許可登記事項不一致，進入未依登記事項運作之查核方向。'
    }),
    article14RouteMismatch:Object.freeze({
      lawBySubject:Object.freeze({
        industry:'水污染防治法第14條第1項',
        sewer:'水污染防治法第19條準用第14條第1項'
      }),
      reason:'現場有實際排放至地面水體，排放位置／路徑與排放許可登記事項不一致，且已確認並非由非核准最終放流口排出，進入第14條第1項方向。'
    }),
    article18Meter:Object.freeze({
      lawBySubject:Object.freeze({
        industry:'水污染防治法第18條',
        sewer:'水污染防治法第19條準用第18條'
      }),
      reason:'已記錄「{issue}」之具體事實，屬水污染防治措施中計測設施之查核方向；仍需依實際處理方式、設置位置及適用子法確認具體義務。'
    }),
    article18Record:Object.freeze({
      lawBySubject:Object.freeze({
        industry:'水污染防治法第18條',
        sewer:'水污染防治法第19條準用第18條'
      }),
      reason:'已記錄「{issue}」之具體事實，屬水污染防治措施中操作／管理紀錄義務之查核方向；仍需確認本案適用之具體子法規定。'
    }),
    article181Bypass:Object.freeze({
      law:'水污染防治法第18條之1第1項',
      reason:'結構化事實顯示由非核准最終放流口／非核准納管口排出，進入繞流排放方向。'
    }),
    article181Dilution:Object.freeze({
      law:'水污染防治法第18條之1第2項',
      reason:'結構化事實符合排放／納管前，將須處理之廢污水與無需處理即可符合標準之水混合稀釋的查核方向。'
    }),
    article181Treatment:Object.freeze({
      law:'水污染防治法第18條之1第4項',
      reason:'結構化事實顯示廢污水需要處理、處理設施當時應運轉但未正常運轉，且未記錄其他替代處理方式。'
    }),
    article20NoPermitStorage:Object.freeze({
      law:'水污染防治法第20條',
      reason:'目前結構化事實顯示採貯留方式，但無有效許可／核准資料；第20條對事業及污水下水道系統直接適用。'
    }),
    article20NoPermitDilution:Object.freeze({
      law:'水污染防治法第20條',
      reason:'目前結構化事實顯示採稀釋方式，但無有效許可／核准資料；第20條對事業及污水下水道系統直接適用。'
    }),
    article20StorageMismatch:Object.freeze({
      law:'水污染防治法第20條',
      reason:'{code} 項已記錄與貯留許可登記事項不一致，進入第20條「依登記事項運作」之查核方向。'
    }),
    article20DilutionMismatch:Object.freeze({
      law:'水污染防治法第20條',
      reason:'{code} 項已記錄與稀釋許可登記事項不一致，進入第20條「依登記事項運作」之查核方向。'
    }),
    article32NoPermitSoilMethod:Object.freeze({
      law:'水污染防治法第32條',
      reason:'目前結構化事實顯示廢污水排放於土壤，且未有有效水許可／核准資料可支持土壤處理合法例外。'
    }),
    article32Groundwater:Object.freeze({
      law:'水污染防治法第32條第1項',
      reason:'現場結構化事實包含將廢污水注入地下水體，進入第32條第1項禁止方向。'
    }),
    article32SoilNoException:Object.freeze({
      law:'水污染防治法第32條第1項',
      reason:'現場有排放廢污水於土壤，且已確認未具備「符合土壤處理標準並取得主管機關許可」之合法例外。'
    }),
    article32SoilPending:Object.freeze({
      law:'水污染防治法第32條方向',
      reason:'現場有排放廢污水於土壤情形；第32條原則禁止，但法律另有符合土壤處理標準並經許可之例外。'
    }),
    article30Direction:Object.freeze({
      law:'水污染防治法第30條方向',
      reason:'已確認行為地點位於水污染管制區，並記錄行為：{actions}；仍依各款具體要件進一步確認。'
    }),
    article25Building:Object.freeze({
      law:'水污染防治法第25條方向',
      reason:'本對象選定為建築物污水處理設施；應依設施狀態、管理／清理、紀錄及排放事實進一步判斷。'
    })
  });

  root.WATER_PENDING_GUIDANCE=Object.freeze({
    permitUnknown:'{subject}：目前是否具有有效水許可／核准資料。',
    permitTypeMissing:'{subject}：確認目前核對的有效許可／核准類型。',
    permitTypeUnknown:'{subject}：目前許可類型尚無法確認，暫不以許可登記事項差異直接指定第14條或第20條。',
    recycleOutsourceStorage:'{subject}：全量回收／全量委託情境尚需確認是否涉及廢水貯留及相應許可義務，不直接僅因處理方式套用第20條。',
    permitMismatchOther:'{subject}：B～E 已發現許可／核准差異，但目前許可類型為「{permitType}」，需再確認該差異所對應之具體法規義務。',
    routeMismatchSewer:'{subject}：實際最終去向為納管，路徑與核准內容不一致時，不直接套用第14條；需釐清是否屬第18條之1繞流、下水道核准排放口差異或其他水措義務。',
    routeMismatchGroundPrerequisite:'{subject}：排放路徑與許可／核准內容不一致，但尚缺「排放許可類型」及「排放至地面水體」等第14條前提，暫不直接指定第14條。',
    finalOutletUnknown:'{subject}：排放路徑與許可不一致時，需確認是否屬非核准最終放流口／非核准納管口，以區分第18條之1第1項與其他許可差異。',
    alternativeTreatmentUnknown:'{subject}：處理設施應運轉但未正常運轉時，尚需確認是否有有效替代處理方式，以判斷第18條之1第4項方向。',
    meterDuty:'{subject}：確認該水量計測設施之適用水措規定、法定設置位置及具體義務。',
    recordDuty:'{subject}：確認本案應保存／提供之具體水措紀錄種類、頻率及保存義務。',
    soilException:'{subject}：確認土壤排放是否已處理符合土壤處理標準，且具有有效土壤處理許可。',
    destinationUnknown:'{subject}：實際排放之最終去向。',
    sampledNoLab:'{subject}：本次僅記錄現場採樣；V2 不輸入實驗室結果，也不自動判定第7條超標。',
    controlZone:'{subject}：第30條適用前提為行為地點位於公告之水污染管制區，尚需先確認管制區範圍。',
    a30Pesticide:'{subject}：第30條第1款尚需確認是否涉及主管機關指定水體，且有污染之虞。',
    a30Discard:'{subject}：第30條第2款尚需確認棄置位置是否在水體或其沿岸規定距離內，及棄置物是否屬法定污染物。',
    a30Livestock:'{subject}：第30條第4款尚需確認是否位於主管機關指定水體或其沿岸規定距離內。',
    a30Other:'{subject}：第30條第5款尚需確認是否有主管機關公告禁止該類足使水污染之行為。'
  });

  root.WATER_CORE_RELATIONS=Object.freeze({
    article7Effluent:Object.freeze({
      exceptionRule:'article59Exception',
      exceptionFact:'waterFacilityFailureConfirmed',
      exceptionFactValue:'yes',
      establishedExceptionText:'放流水檢測超標之事實要件已確認，但§59（第59條）故障例外條件目前亦完整；§7研判須先處理該例外關係。',
      pendingExceptionText:'放流水檢測超標之事實要件已確認，但第59條故障例外條件尚未查清；目前應先完成例外條件確認。'
    }),
    humanDischarge:Object.freeze({
      excludePrimary:'article28Prevention',
      reviewRules:Object.freeze(['article14NoPermit','article181Bypass']),
      guidance:'目前較像人為開閥、私管或主動抽排，不要硬套設備疏漏；固定操作、閥門、管線及排放路徑後交由法規層研判。'
    })
  });
})(typeof window==='undefined'?globalThis:window);

(function(root){
  'use strict';
  const meta=root.WATER_RULE_PACK_META;
  root.WATER_RULE_PACK=Object.freeze({
    meta,
    packId:meta.packId,
    packVersion:meta.packVersion,
    lawVersions:meta.lawVersions,
    coreRules:root.WATER_RULES||{},
    fieldRules:root.WATER_V2_RULES||{},
    fieldNavigation:root.WATER_FIELD_NAVIGATION||{},
    pendingGuidance:root.WATER_PENDING_GUIDANCE||{},
    coreRelations:root.WATER_CORE_RELATIONS||{},
    provenance:meta.provenance
  });
})(typeof window==='undefined'?globalThis:window);
