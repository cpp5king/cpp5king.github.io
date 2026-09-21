(function(root){
  'use strict';
  root.WATER_MEASURE_RULE_PACK_META=Object.freeze({
    packId:'WATER-MEASURE-TW',
    name:'Water Measure Rules',
    lawName:'水污染防治措施及檢測申報管理辦法',
    packVersion:'2026.09.21.1-test',
    status:'test',
    createdAt:'2026-09-21',
    updatedAt:'2026-09-21',
    lastVerifiedAt:'2026-09-21',
    compatibleApp:{min:'4.9.43'},
    provenance:'PP-IA-41-7F3C9A21',
    integrity:Object.freeze({algorithm:'fnv1a32-json',value:'08d4196d'}),
    officialSources:Object.freeze([
      Object.freeze({
        authority:'環境部',
        title:'水污染防治措施及檢測申報管理辦法',
        sourceId:'FL040734',
        revision:'2026-04-20',
        url:'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL040734'
      })
    ]),
    lawVersions:Object.freeze([
      Object.freeze({
        id:'WMR-2026-04-20-EFFECTIVE',
        effectiveFrom:'2026-04-20',
        effectiveTo:'2029-04-19',
        sourceId:'FL040734',
        regime:'2026-04-20-effective-provisions',
        note:'115年4月20日修正；除另定施行日期者外，自發布日施行。'
      }),
      Object.freeze({
        id:'WMR-2026-04-20-DEFERRED-FULL',
        effectiveFrom:'2029-04-20',
        effectiveTo:null,
        sourceId:'FL040734',
        regime:'2026-04-20-full-deferred-window-passed',
        note:'依目前公布資料，部分另定施行項目自118年4月20日起進入施行時點；仍應確認其後有無修法。'
      })
    ])
  });
})(typeof window==='undefined'?globalThis:window);


// ---- migrated from water-sublaw-core.js ----
(function(root){
  'use strict';
  const versionElement=()=>({id:'sublawVersionResolved',label:'已依行為發生日期確認本案適用之水措管理辦法版本',nextChecks:['確認行為發生日期及當時有效之水措管理辦法版本']});
  root.WATER_SUBLAW_RULES={
    approvedMeasuresMismatch:{id:'WATER-SUB-A4-MISMATCH',version:'1.0',title:'水措管理辦法第4條－未依核准水措內容運作',legalBasis:'水污染防治措施及檢測申報管理辦法第4條',elements:[versionElement(),
      {id:'sublawSubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable',nextChecks:['確認管制主體']},
      {id:'sublawApprovedMeasuresKnown',label:'已取得／確認核准水措內容',nextChecks:['調閱水措計畫、許可證（文件）及核准登記事項']},
      {id:'sublawApprovedMeasuresMismatch',label:'已確認現場運作與核准水措內容不一致',nextChecks:['逐項比對製程、收集、處理、管線、槽體及最終去向']}
    ]},
    rainWastewaterSeparation:{id:'WATER-SUB-A7-RAIN-SEPARATION',version:'1.0',title:'水措管理辦法第7條－廢（污）水與雨水合流收集',legalBasis:'水污染防治措施及檢測申報管理辦法第7條',elements:[versionElement(),
      {id:'sublawSubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable'},
      {id:'wastewaterConfirmed',label:'已確認有廢（污）水',nextChecks:['確認各股水來源與收集路徑']},
      {id:'sublawRainWastewaterCombinedViolation',label:'已確認廢（污）水與雨水合流收集且無核准例外',nextChecks:['追查雨污收集系統；如主張既設技術困難例外，查核主管機關同意文件及防止直接排放設施']}
    ]},
    runoffCollection:{id:'WATER-SUB-A8-RUNOFF',version:'1.0',title:'水措管理辦法第8條－逕流廢水收集處理',legalBasis:'水污染防治措施及檢測申報管理辦法第8條',elements:[versionElement(),
      {id:'sublawSubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable'},
      {id:'sublawRunoffArticle8Applicable',label:'已確認屬第8條所列貯存／堆置物質情形',noMeans:'notApplicable',nextChecks:['確認戶外貯存／堆置物及雨水沖刷後是否產生含該成分之逕流廢水']},
      {id:'sublawRunoffCollectionNoncompliance',label:'已確認應收集處理之逕流廢水未依規定收集處理',nextChecks:['確認逕流方向、截流／收集設施、處理去向及雨天操作情形']}
    ]},
    outsourceStorage:{id:'WATER-SUB-A31-OUTSOURCE-STORAGE',version:'1.0',title:'水措管理辦法第31條－委託處理前貯存／前處理',legalBasis:'水污染防治措施及檢測申報管理辦法第31條',elements:[versionElement(),
      {id:'sublawSubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable'},
      {id:'sublawOutsourceApplicable',label:'實際採委託處理',noMeans:'notApplicable'},
      {id:'sublawOutsourceStorageNoncompliance',label:'已確認委託處理前未依規定設置處理或貯留設施',nextChecks:['確認委託前廢水暫存方式、處理設施及主管機關核准例外']}
    ]},
    outsourceMeter:{id:'WATER-SUB-A31-OUTSOURCE-METER',version:'1.0',title:'水措管理辦法第31條－委託處理水量計測',legalBasis:'水污染防治措施及檢測申報管理辦法第31條',elements:[versionElement(),
      {id:'sublawSubjectEligible',label:'屬事業或污水下水道系統',noMeans:'notApplicable'},
      {id:'sublawOutsourceApplicable',label:'實際採委託處理',noMeans:'notApplicable'},
      {id:'sublawOutsourceMeterNoncompliance',label:'已確認進／出流水端水量計測不符規定',nextChecks:['查核委託者與受託者管線／溝渠進出流水端之獨立專用累計型水量計測設施']}
    ]},
    storageMeter:{id:'WATER-SUB-A39-STORAGE-METER',version:'1.0',title:'水措管理辦法第39條－貯留水量計測',legalBasis:'水污染防治措施及檢測申報管理辦法第39條',elements:[versionElement(),
      {id:'sublawStorageApplicable',label:'實際採貯留',noMeans:'notApplicable'},
      {id:'sublawStorageMeterNoncompliance',label:'已確認貯留水量計測設施不符規定',nextChecks:['查核進、出流水獨立專用累計型水量計，或自動液位及貯留水量計測設施']}
    ]},
    storageRecords:{id:'WATER-SUB-A39-STORAGE-RECORDS',version:'1.0',title:'水措管理辦法第39條－貯留逐日逐批紀錄',legalBasis:'水污染防治措施及檢測申報管理辦法第39條',elements:[versionElement(),
      {id:'sublawStorageApplicable',label:'實際採貯留',noMeans:'notApplicable'},
      {id:'sublawStorageRecordsNoncompliance',label:'已確認未依規定逐日逐批記錄或保存',nextChecks:['調閱貯留時間、輸運方式、水量、處理水量紀錄及保存資料']}
    ]},
    storageCapacity:{id:'WATER-SUB-A40-STORAGE-CAPACITY',version:'1.0',title:'水措管理辦法第40條－貯留緊急應變容量',legalBasis:'水污染防治措施及檢測申報管理辦法第40條',elements:[versionElement(),
      {id:'sublawStorageApplicable',label:'實際採貯留',noMeans:'notApplicable'},
      {id:'sublawStorageCapacityNoncompliance',label:'已確認貯留容量不足以因應緊急應變',nextChecks:['查核槽體有效容量、正常操作液位、廢水產生量與緊急應變需求']}
    ]},
    reuseStandard:{id:'WATER-SUB-A41-REUSE-STANDARD',version:'1.0',title:'水措管理辦法第41條－回收使用水質／法定例外',legalBasis:'水污染防治措施及檢測申報管理辦法第41條',elements:[versionElement(),
      {id:'sublawReuseApplicable',label:'實際採回收使用',noMeans:'notApplicable'},
      {id:'sublawReuseStandardNoncompliance',label:'已確認未符合第41條水質要求且無法定例外',nextChecks:['確認回收用途、處理水質及是否屬製程用水或污染防治設備等法定例外']}
    ]},
    reuseSamplingPort:{id:'WATER-SUB-A41-REUSE-SAMPLING',version:'1.0',title:'水措管理辦法第41條－回收使用前採樣口',legalBasis:'水污染防治措施及檢測申報管理辦法第41條',elements:[versionElement(),
      {id:'sublawReuseApplicable',label:'實際採回收使用',noMeans:'notApplicable'},
      {id:'sublawReuseSamplingPortNoncompliance',label:'已確認依法應設採樣口但未符合規定',nextChecks:['確認回收使用前採樣口及法定例外是否適用']}
    ]},
    outletLocation:{id:'WATER-SUB-A53-OUTLET-LOCATION',version:'1.0',title:'水措管理辦法第53條－放流口位置',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第1款',elements:[versionElement(),{id:'sublawOutletApplicable',label:'屬放流口檢核情形',noMeans:'notApplicable'},{id:'sublawOutletLocationNoncompliance',label:'已確認放流口位置不符規定',nextChecks:['確認是否位於作業環境外、進入承受水體前；如有設置困難，查核主管機關核准文件']}]},
    outletAccess:{id:'WATER-SUB-A53-OUTLET-ACCESS',version:'1.0',title:'水措管理辦法第53條－採樣道路／平台',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第2款',elements:[versionElement(),{id:'sublawOutletApplicable',label:'屬放流口檢核情形',noMeans:'notApplicable'},{id:'sublawOutletAccessNoncompliance',label:'已確認採樣道路或平台不符規定',nextChecks:['確認採樣人員可進出道路及一平方公尺以上採樣平台；核准例外另查']}]},
    outletMeter:{id:'WATER-SUB-A53-OUTLET-METER',version:'1.0',title:'水措管理辦法第53條－放流水量計測',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第3款',elements:[versionElement(),{id:'sublawOutletApplicable',label:'屬放流口檢核情形',noMeans:'notApplicable'},{id:'sublawOutletMeterNoncompliance',label:'已確認應設水量計測但不符規定',nextChecks:['查核獨立專用累計型水量計測設施；逕流廢水放流口例外另查']}]},
    outletSign:{id:'WATER-SUB-A53-OUTLET-SIGN',version:'1.0',title:'水措管理辦法第53條－放流口告示牌與座標',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第4款',elements:[versionElement(),{id:'sublawOutletApplicable',label:'屬放流口檢核情形',noMeans:'notApplicable'},{id:'sublawOutletSignNoncompliance',label:'已確認告示牌或座標標示不符規定',nextChecks:['查核告示牌、座標及許可登記事項']}]},
    outletSampling:{id:'WATER-SUB-A53-OUTLET-SAMPLING',version:'1.0',title:'水措管理辦法第53條－放流口可直接採樣',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第5款',elements:[versionElement(),{id:'sublawOutletApplicable',label:'屬放流口檢核情形',noMeans:'notApplicable'},{id:'sublawOutletSamplingNoncompliance',label:'已確認無法直接採樣或有未核准妨礙採樣設施',nextChecks:['固定放流口結構、採樣障礙及主管機關核准資料']}]},
    outletMixing:{id:'WATER-SUB-A53-OUTLET-MIXING',version:'1.0',title:'水措管理辦法第53條－陰井水質均勻混合',legalBasis:'水污染防治措施及檢測申報管理辦法第53條第1項第6款',elements:[versionElement(),{id:'sublawOutletManholeApplicable',label:'放流口為陰井',noMeans:'notApplicable'},{id:'sublawOutletMixingNoncompliance',label:'已確認陰井水質未充分均勻混合',nextChecks:['確認陰井流況及採樣代表性']}]},
    meterCalibration:{id:'WATER-SUB-A65-METER-CAL',version:'1.0',title:'水措管理辦法第65條－累計型水量計校正維護',legalBasis:'水污染防治措施及檢測申報管理辦法第65條',elements:[versionElement(),{id:'sublawMeterApplicable',label:'本案有依規定設置之累計型水量計測設施',noMeans:'notApplicable'},{id:'sublawMeterCalibrationNoncompliance',label:'已確認校正／維護或紀錄不符規定',nextChecks:['查廠牌校正頻率、至少年度校正要求及五年校正維護紀錄']}]},
    reportingDocuments:{id:'WATER-SUB-A89-1-DOCS',version:'1.0',title:'水措管理辦法第89-1條－申報資料與證明文件一致',legalBasis:'水污染防治措施及檢測申報管理辦法第89-1條',elements:[versionElement(),{id:'sublawReportingApplicable',label:'本案具檢測申報義務',noMeans:'notApplicable'},{id:'sublawReportingEvidenceMismatch',label:'已確認申報資料與單據、檢測報告、紀錄或照片不一致',nextChecks:['逐筆比對申報資料與單據、發票、檢測報告、操作紀錄及照片']}]},
    reportingSite:{id:'WATER-SUB-A89-1-SITE',version:'1.0',title:'水措管理辦法第89-1條－申報資料與現場一致',legalBasis:'水污染防治措施及檢測申報管理辦法第89-1條',elements:[versionElement(),{id:'sublawReportingApplicable',label:'本案具檢測申報義務',noMeans:'notApplicable'},{id:'sublawReportingSiteMismatch',label:'已確認申報資料與現場製程、用電、加藥、水量或操作參數不一致',nextChecks:['交叉比對製程規模、用電、加藥、水量計、操作參數與申報資料']}]}
  };
})(typeof window==='undefined'?globalThis:window);

// ---- migrated from water-industry.js ----
(function(root){
  'use strict';
  const versionElement=()=>({id:'sublawVersionResolved',label:'已依行為發生日期確認本案適用之水措管理辦法版本',nextChecks:['確認行為發生日期及當時有效之水措管理辦法版本']});
  root.WATER_INDUSTRY_RULES={
    article9RainProtection:{id:'WATER-IND-A9-RAIN',version:'1.0',title:'第9條業別－遮雨／擋雨／導雨',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第1項',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industryRainProtectionViolation',label:'已確認開挖面或堆置場所未依規定設置遮雨、擋雨、導雨設施且無核准例外',nextChecks:['確認開挖面／堆置場所、遮雨擋雨導雨設施及主管機關核准例外文件']}
    ]},
    article9SedimentationBasin:{id:'WATER-IND-A9-BASIN',version:'1.0',title:'第9條業別－沉砂池',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第3項',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industrySedimentationBasinMissing',label:'已確認未設置收集處理初期降雨及洗車平台廢水之沉砂池',nextChecks:['查核沉砂池、初期降雨與洗車平台廢水收集流向']}
    ]},
    article9BasinCapacity:{id:'WATER-IND-A9-CAPACITY',version:'1.0',title:'第9條業別－沉砂池設計容量',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第3項第1款',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industrySedimentationBasinPresent',label:'已確認設有沉砂池',noMeans:'notApplicable'},
      {id:'industrySedimentationCapacityViolation',label:'已確認沉砂池總設計容量未達作業場所／工地總面積×0.025公尺',nextChecks:['取得工地／作業場所總面積及沉砂池有效設計容量資料重新核算']}
    ]},
    article9BasinFreeboard:{id:'WATER-IND-A9-FREEBOARD',version:'1.0',title:'第9條業別－非雨天沉砂池液位',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第3項第2款',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industrySedimentationBasinPresent',label:'已確認設有沉砂池',noMeans:'notApplicable'},
      {id:'industrySedimentationFreeboardViolation',label:'已確認非下雨期間最高液面距池頂高度未大於池深二分之一',nextChecks:['量測池深、最高液面及距池頂高度並攝影固定']}
    ]},
    article9BasinMaterial:{id:'WATER-IND-A9-MATERIAL',version:'1.0',title:'第9條業別－沉砂池不透水材質',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第3項第3款',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industrySedimentationBasinPresent',label:'已確認設有沉砂池',noMeans:'notApplicable'},
      {id:'industrySedimentationImpermeableViolation',label:'已確認沉砂池未採不透水材質',nextChecks:['查核池體材質、破損／滲漏狀態及設計資料']}
    ]},
    article9Maintenance:{id:'WATER-IND-A9-MAINT',version:'1.0',title:'第9條業別－維護清淤與三年紀錄',legalBasis:'水污染防治措施及檢測申報管理辦法第9條第4項',elements:[versionElement(),
      {id:'industryArticle9Applicable',label:'屬第9條列舉業別／營建工地',noMeans:'notApplicable'},
      {id:'industryMaintenanceRecordsViolation',label:'已確認擋雨／遮雨／導雨設施或沉砂池未定期維護清淤，或未依規定留存紀錄',nextChecks:['調閱維護清理淤砂時間、方法及三年保存紀錄']}
    ]},
    constructionPlan:{id:'WATER-IND-A10-PLAN',version:'1.0',title:'營建工地－逕流廢水污染削減計畫',legalBasis:'水污染防治措施及檢測申報管理辦法第10條',elements:[versionElement(),
      {id:'industryConstructionApplicable',label:'屬營建工地',noMeans:'notApplicable'},
      {id:'constructionReductionPlanViolation',label:'已確認施工前未取得逕流廢水污染削減計畫核准',nextChecks:['查核施工起始日期、削減計畫送審及核准日期、核准工程圖說']}
    ]},
    constructionImplementation:{id:'WATER-IND-A10-IMPLEMENT',version:'1.0',title:'營建工地－依核准削減計畫實施',legalBasis:'水污染防治措施及檢測申報管理辦法第10條',elements:[versionElement(),
      {id:'industryConstructionApplicable',label:'屬營建工地',noMeans:'notApplicable'},
      {id:'constructionImplementedPlanViolation',label:'已確認現場未依核准削減計畫實施',nextChecks:['比對核准污染削減措施、工程圖說與現場實際設施']}
    ]},
    livestockFertilizerPlan:{id:'WATER-IND-A70-1-PLAN',version:'1.0',title:'畜牧業－沼液沼渣農地肥分使用計畫',legalBasis:'水污染防治措施及檢測申報管理辦法第70條之1',elements:[versionElement(),
      {id:'industryLivestockFertilizerApplicable',label:'畜牧業採沼液沼渣農地肥分使用',noMeans:'notApplicable'},
      {id:'livestockFertilizerPlanViolation',label:'已確認未取得農業主管機關審查同意之沼液沼渣農地肥分使用計畫',nextChecks:['查核農業主管機關審查同意文件、有效期限及環保主管機關備查資料']}
    ]},
    livestockFertilizerOperation:{id:'WATER-IND-A70-1-OP',version:'1.0',title:'畜牧業－依農地肥分使用計畫登記事項運作',legalBasis:'水污染防治措施及檢測申報管理辦法第70條之1、第70條之9',elements:[versionElement(),
      {id:'industryLivestockFertilizerApplicable',label:'畜牧業採沼液沼渣農地肥分使用',noMeans:'notApplicable'},
      {id:'livestockFertilizerPlanApproved',label:'已取得沼液沼渣農地肥分使用計畫審查同意',noMeans:'notApplicable'},
      {id:'livestockFertilizerOperationViolation',label:'已確認未依核准計畫登記事項運作',nextChecks:['比對施灌農地、數量、方式、頻率、輸運及緩衝容量等核准內容與現場／紀錄']}
    ]}
  };
})(typeof window==='undefined'?globalThis:window);

// ---- migrated from water-industry-catalog-v485.js ----
(function(root){
  'use strict';
  const source=Object.freeze({
    id:'FL040734',
    title:'水污染防治措施及檢測申報管理辦法',
    revised:'2026-04-20',
    note:'案件適用版本以行為發生日期與實際施行日判斷；稽查日期不代替行為日期。'
  });
  const industries=Object.freeze({
    mining:{label:'採礦業',articles:['9']},
    stoneExtraction:{label:'土石採取業',articles:['9']},
    stoneProcessing:{label:'土石加工業',articles:['9']},
    readyMix:{label:'水泥業（本辦法第9條所稱預拌混凝土）',articles:['9']},
    earthworkDump:{label:'土石方堆（棄）置場',articles:['9']},
    construction:{label:'營建工地',articles:['9','10','49-3']},
    shipDismantling:{label:'船舶解體業',articles:['45']},
    livestock:{label:'畜牧業',articles:['46','46-1','49-5～49-7','49-10～49-11','70-1～70-10']},
    waterworks:{label:'自來水廠',articles:['47']},
    restaurant:{label:'餐飲業',articles:['48','49']},
    touristHotel:{label:'觀光旅館（飯店）',articles:['48','49']},
    dialysisClinic:{label:'洗腎診所',articles:['49-4']},
    coalPower:{label:'使用燃煤之發電廠',articles:['49-8']},
    semiconductor:{label:'晶圓製造及半導體製造業',articles:['49-9']},
    optoelectronics:{label:'光電材料及元件製造業',articles:['49-9']},
    pcb:{label:'印刷電路板製造業',articles:['49-9']},
    electroplating:{label:'電鍍業',articles:['49-9']},
    metalSurface:{label:'金屬表面處理業',articles:['49-9']},
    other:{label:'其他事業',articles:[]},
    unknown:{label:'業別尚待確認',articles:[]}
  });
  const specialOperations=Object.freeze({
    organicGroundwaterPollutant:{label:'貯存／輸送地下水污染管制標準有機污染物',articles:['49-1']},
    constructionResidualReceiving:{label:'收容處理特定淤泥／高含水土壤／皂土等營建剩餘土石方',articles:['49-2']},
    batPermitReview:{label:'附表五業別規模之水措／許可申請、變更或展延',articles:['49-12']}
  });
  root.WATER_INDUSTRY_CATALOG_V485=Object.freeze({version:'4.8.5',source,industries,specialOperations});
})(typeof window==='undefined'?globalThis:window);

(function(root){
  'use strict';
  const meta=root.WATER_MEASURE_RULE_PACK_META;
  root.WATER_MEASURE_RULE_PACK=Object.freeze({
    meta,
    packId:meta.packId,
    packVersion:meta.packVersion,
    lawVersions:meta.lawVersions,
    commonRules:root.WATER_SUBLAW_RULES||{},
    industryRules:root.WATER_INDUSTRY_RULES||{},
    industryCatalog:root.WATER_INDUSTRY_CATALOG_V485||{},
    provenance:meta.provenance
  });
})(typeof window==='undefined'?globalThis:window);
