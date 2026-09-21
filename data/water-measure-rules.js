(function(root){
  'use strict';
  root.WATER_MEASURE_RULE_PACK_META=Object.freeze({
    packId:'WATER-MEASURE-TW',
    name:'Water Measure Rules',
    lawName:'水污染防治措施及檢測申報管理辦法',
    packVersion:'2026.09.21.4-test',
    status:'test',
    createdAt:'2026-09-21',
    updatedAt:'2026-09-21',
    lastVerifiedAt:'2026-09-21',
    compatibleApp:{min:'4.9.43'},
    provenance:'PP-IA-41-7F3C9A21',
    integrity:Object.freeze({algorithm:'fnv1a32-json',value:'c71b497f'}),
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
    unknown:{label:'尚待確認',articles:[]}
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
  const freezeChecks=items=>Object.freeze(items.map(item=>Object.freeze(item)));
  root.WATER_MEASURE_INDUSTRY_EXTENSIONS=Object.freeze({
    groups:Object.freeze({
      article9Types:Object.freeze(['mining','stoneExtraction','stoneProcessing','readyMix','earthworkDump','construction']),
      highTechTypes:Object.freeze(['semiconductor','optoelectronics','pcb','electroplating','metalSurface']),
      foodHotelTypes:Object.freeze(['restaurant','touristHotel'])
    }),
    highTechRequiredStreams:Object.freeze({
      semiconductor:'§49-9：研磨／切割、含氟、TMAH有機、含氰、含鉻及含銅作業廢水，於觸發條件成立時應分流收集處理。',
      optoelectronics:'§49-9：研磨／切割、含氟、TMAH有機、含氰、含鉻及含銅作業廢水，於觸發條件成立時應分流收集處理。',
      pcb:'§49-9：研磨／切割、含氟、TMAH有機、含氰、含鉻及含銅作業廢水，於觸發條件成立時應分流收集處理。',
      electroplating:'§49-9：含氰及含鉻作業廢水，於觸發條件成立時應分流收集處理。',
      metalSurface:'§49-9：含氰及含鉻作業廢水，於觸發條件成立時應分流收集處理。'
    }),
    checks:Object.freeze({
      construction493:Object.freeze({basis:'§49-3',title:'營建工地沉積污泥／廢油',checks:freezeChecks([
        ['waterConstructionVisibleSedimentFound','可見沉積污泥','trigger'],
        ['waterConstructionSedimentCleanedCompliant','沉積污泥清除','conditional:waterConstructionVisibleSedimentFound:yes'],
        ['waterConstructionWasteOilFound','施工維修廢油棄置／溢洩','trigger'],
        ['waterConstructionWasteOilHandledCompliant','廢油收集處理','conditional:waterConstructionWasteOilFound:yes'],
        ['waterConstructionCleanupRecordsCompliant','清除／收集處理紀錄與證明','normal']
      ])}),
      ship45:Object.freeze({basis:'§45',title:'船舶解體業',checks:freezeChecks([
        ['waterShipContainmentCompliant','截流或核准替代防堵設施','normal'],
        ['waterShipOilBoomCompliant','浮油攔除設備','normal'],
        ['waterShipReceivingFacilitiesCompliant','污染物收受設施','normal']
      ])}),
      livestock46:Object.freeze({basis:'§46',title:'漁牧綜合經營',triggerField:'waterLivestockFishIntegratedUse',pendingLabel:'是否採漁牧綜合經營',checks:freezeChecks([
        ['waterLivestockFishDailyVolumeCompliant','每公頃每日廢水量','normal'],
        ['waterLivestockFishStockingCompliant','魚池承受豬隻廢水量','normal'],
        ['waterLivestockFishDOCompliant','魚池溶氧','normal'],
        ['waterLivestockFishFreeboardCompliant','魚池出水高程／池頂距離','normal'],
        ['waterLivestockFishRecordsCompliant','三年紀錄','normal'],
        ['waterLivestockFishNoticeCompliant','排放前三日通知','normal']
      ])}),
      livestock461:Object.freeze({basis:'§46-1',title:'畜牧糞尿資源化',triggerField:'waterLivestockPigCattleResourceApplicable',pendingLabel:'是否飼養豬隻或牛隻',checks:freezeChecks([
        ['waterLivestockResourceMeasureApproved','依法核准之資源化措施','normal'],
        ['waterLivestockResourceRatioCompliant','資源化處理比率','normal']
      ])}),
      livestock4957:Object.freeze({basis:'§49-5～49-7',title:'20至未滿200頭養豬場管理計畫',triggerField:'waterLivestockSmallPigPlanApplicable',pendingLabel:'是否飼養豬隻20頭以上未滿200頭',checks:freezeChecks([
        ['waterLivestockSmallPigPlanApproved','廢（污）水管理計畫核准','normal'],
        ['waterLivestockSmallPigPlanOperationCompliant','依核准計畫運作','normal']
      ])}),
      livestockPause:Object.freeze({basis:'§49-10、§70-6、§70-9',title:'沼液沼渣暫停施灌',checks:freezeChecks([
        ['waterLivestockFertilizerPauseCompliant','應暫停期間確實停止施灌','normal']
      ])}),
      waterworks47:Object.freeze({basis:'§47',title:'自來水廠緊急直接排放',triggerField:'waterWaterworksEmergencyDischargeUsed',pendingLabel:'本次是否使用§47緊急直接排放',checks:freezeChecks([
        ['waterWaterworksEmergencyConditionsMet','緊急直接排放法定條件','normal'],
        ['waterWaterworksEmergencyRegistered','應變措施納入核准文件','normal'],
        ['waterWaterworksBasinsEmptied','沉澱池／污泥濃縮池先淨空','normal'],
        ['waterWaterworksNoticeCompliant','下游通知及主管機關通報','normal'],
        ['waterWaterworksDailyMonitoringCompliant','按日檢測與紀錄','normal']
      ])}),
      food48:Object.freeze({basis:'§48、§49',title:'餐飲廢水油脂截留',triggerField:'waterFoodServiceProvided',pendingLabel:'是否提供餐飲服務',checks:freezeChecks([
        ['waterGreaseTrapPresent','油脂截留設施','normal'],
        ['waterGreaseTrapMaintenanceRecordsCompliant','清理維護及三年紀錄','normal']
      ])}),
      hotSpring48:Object.freeze({basis:'§48、§49',title:'溫泉泡湯廢水',triggerField:'waterHotSpringServiceProvided',pendingLabel:'是否提供溫泉泡湯服務',checks:freezeChecks([
        ['waterHotSpringSeparatedCollectionCompliant','單純泡湯廢水分流收集處理','normal'],
        ['waterHotSpringFiltersCompliant','毛髮／懸浮固體過濾設施','conditional:waterHotSpringMudSpring:no'],
        ['waterHotSpringMaintenanceRecordsCompliant','設施清理維護及三年紀錄','normal']
      ]),extraPending:Object.freeze([{field:'waterHotSpringMudSpring',whenMissing:'溫泉是否屬泥漿泉質'}])}),
      dialysis494:Object.freeze({basis:'§49-4',title:'洗腎診所',checks:freezeChecks([
        ['waterDialysisManagementPlanApproved','營運前廢（污）水管理計畫核准','normal'],
        ['waterDialysisOperationMatchesPlan','依核准管理計畫實施','normal']
      ])}),
      coal498:Object.freeze({basis:'§49-8',title:'燃煤發電廠汞管理',checks:freezeChecks([
        ['waterCoalMercuryRecordsCompliant','燃煤來源／總汞／用量紀錄','normal'],
        ['waterCoalMercuryReportingCompliant','半年網路申報','normal']
      ])}),
      coal498Plan:Object.freeze({basis:'§49-8',title:'汞總量管理計畫',triggerField:'waterCoalMercuryThresholdExceeded',pendingLabel:'燃煤總汞是否達管理計畫門檻',checks:freezeChecks([
        ['waterCoalMercuryPlanApproved','汞總量管理計畫核准','normal'],
        ['waterCoalMercuryPlanImplemented','依核准計畫執行','normal']
      ])}),
      highTech499:Object.freeze({basis:'§49-9',title:'特定製程廢水分流',triggerField:'waterHighTech49_9Trigger',pendingLabel:'是否符合§49-9分流觸發條件',checks:freezeChecks([
        ['waterHighTechSeparatedCollectionCompliant','應分流作業廢水之分流收集處理','normal']
      ])}),
      special491:Object.freeze({basis:'§49-1',title:'有機地下水污染物貯存／輸送',checks:freezeChecks([
        ['waterOrganicLeakPreventionCompliant','防滲漏材質與防範','normal'],
        ['waterOrganicInspectionRecordsCompliant','巡查檢視與三年紀錄','normal']
      ])}),
      special492:Object.freeze({basis:'§49-2',title:'特定營建剩餘土石方收容處理',checks:freezeChecks([
        ['waterResidualDailyRecordsCompliant','每日車輛／土質／收容量／處理量紀錄','normal']
      ])}),
      special4912:Object.freeze({basis:'§49-12',title:'附表五最佳可行控制技術（許可審查提醒）',checks:freezeChecks([
        ['waterBatEvaluationConfirmed','優先評估附表五最佳可行控制技術','normal']
      ])})
    }),
    messages:Object.freeze({
      unknownIndustry:'業別：? 尚待確認；不直接套用業別專屬條文。',
      otherIndustry:'業別：其他事業；目前無匹配之業別專屬包，仍適用一般水污核心及跨業別特殊作業檢查。',
      specialUnset:'跨業別特殊作業：? 尚未確認',
      specialUnknown:'跨業別特殊作業：? 尚待確認',
      specialNone:'跨業別特殊作業：— 已確認均未涉及',
      specialMissing:'是否涉及§49-1、§49-2或§49-12特殊作業',
      specialUnknownMissing:'跨業別特殊作業適用性',
      batVersionPending:'§49-12 最佳可行控制技術：? 版本待確認',
      batVersionMissing:'§49-12適用版本',
      batNotCurrent:'§49-12 最佳可行控制技術：— 本次非申請／變更／展延審查',
      batActivityPending:'§49-12 最佳可行控制技術：? 審查情境待確認',
      batActivityMissing:'本次是否屬申請／變更／展延'
    })
  });
})(typeof window==='undefined'?globalThis:window);

(function(root){
  'use strict';
  const tri=Object.freeze([
    Object.freeze({id:'yes',label:'是，已確認',value:'是，已確認'}),
    Object.freeze({id:'no',label:'否，已確認不是／不符合',value:'否，已確認不是／不符合'}),
    Object.freeze({id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'})
  ]);
  const yn=Object.freeze([
    Object.freeze({id:'yes',label:'是',value:'是'}),
    Object.freeze({id:'no',label:'否',value:'否'}),
    Object.freeze({id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'})
  ]);
  const when=(field,value='yes')=>Object.freeze({field,value});
  const inWhen=(field,value)=>Object.freeze({field,operator:'in',value:Object.freeze(value)});
  const select=(id,label,optionSet,showWhen)=>Object.freeze({id,label,type:'select',missing:'尚待確認',allowCustom:false,optionSet,showWhen});
  const computed=(id,label=id,extra={})=>Object.freeze({id,label,type:'computed',missing:'尚待確認',...extra});
  root.WATER_MEASURE_INDUSTRY_FIELDS=Object.freeze([
    select('waterConstructionVisibleSedimentFound','營建工地周圍排水溝排放管線底部、進入水體處或周圍環境，是否形成可見沉積污泥？','yn',when('waterIndustryType','construction')),
    select('waterConstructionSedimentCleanedCompliant','發現可見沉積污泥後，是否已清除或依主管機關命令於三日內清除？','tri',when('waterConstructionVisibleSedimentFound','yes')),
    select('waterConstructionWasteOilFound','施工機具／車輛維修保養是否有廢機油、潤滑油、柴油等棄置或溢洩？','yn',when('waterIndustryType','construction')),
    select('waterConstructionWasteOilHandledCompliant','前述廢油是否以適當儲存設備收集處理，未隨廢（污）水／逕流廢水排放或溢流至作業環境外？','tri',when('waterConstructionWasteOilFound','yes')),
    select('waterConstructionCleanupRecordsCompliant','沉積污泥清除／廢油收集處理之時間、方法、紀錄及妥善處理證明文件是否符合？','tri',when('waterIndustryType','construction')),

    select('waterShipContainmentCompliant','拆解場所四週截流設施，或經主管機關同意之替代防堵設施，是否符合？','tri',when('waterIndustryType','shipDismantling')),
    select('waterShipOilBoomCompliant','作業區域周圍水面是否有佈設浮油攔除設備？','tri',when('waterIndustryType','shipDismantling')),
    select('waterShipReceivingFacilitiesCompliant','作業區域是否有適當之廢油、廢水及其他污染物收受設施？','tri',when('waterIndustryType','shipDismantling')),

    select('waterLivestockFishIntegratedUse','是否採漁牧綜合經營？','yn',when('waterIndustryType','livestock')),
    select('waterLivestockFishDailyVolumeCompliant','每日排放至每公頃魚池之廢水量是否在4立方公尺以下？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockFishStockingCompliant','每公頃魚池承受之豬隻廢水量是否不超過200頭豬隻？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockFishDOCompliant','魚池溶氧是否達1.0 mg/L以上？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockFishFreeboardCompliant','非雨季期間魚池最高液面距池頂是否維持30公分以上？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockFishRecordsCompliant','畜舍清洗、排入魚池水量及魚池排放時間等紀錄是否完整並保存三年？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockFishNoticeCompliant','魚池廢水排放前三日是否已主動通知主管機關？','tri',when('waterLivestockFishIntegratedUse','yes')),
    select('waterLivestockPigCattleResourceApplicable','是否屬飼養豬隻或牛隻，需檢核畜牧糞尿資源化處理措施？','yn',when('waterIndustryType','livestock')),
    select('waterLivestockResourceMeasureApproved','是否至少採行一項依法核准之畜牧糞尿資源化處理措施？','tri',when('waterLivestockPigCattleResourceApplicable','yes')),
    select('waterLivestockResourceRatioCompliant','依法適用之畜牧糞尿資源化處理比率是否符合？','tri',when('waterLivestockPigCattleResourceApplicable','yes')),
    select('waterLivestockSmallPigPlanApplicable','是否屬飼養豬隻20頭以上未滿200頭之畜牧業？','yn',when('waterIndustryType','livestock')),
    select('waterLivestockSmallPigPlanApproved','該小型養豬場廢（污）水管理計畫是否已依法核准？','tri',when('waterLivestockSmallPigPlanApplicable','yes')),
    select('waterLivestockSmallPigPlanOperationCompliant','現場運作是否符合核准之廢（污）水管理計畫？','tri',when('waterLivestockSmallPigPlanApplicable','yes')),
    select('waterLivestockFertilizerPauseCondition','目前是否有依法應暫停沼液沼渣農地肥分使用之情形（如大雨／豪雨特報期間等）？','yn',when('waterShowIndustryLivestockFertilizer','yes')),
    select('waterLivestockFertilizerPauseCompliant','應暫停期間是否確實停止沼液沼渣農地肥分使用？','tri',when('waterLivestockFertilizerPauseCondition','yes')),

    select('waterWaterworksEmergencyDischargeUsed','本次是否以豪雨／天然災害緊急應變條件直接排放？','yn',when('waterIndustryType','waterworks')),
    select('waterWaterworksEmergencyConditionsMet','是否已確認豪雨特報／天然災害、原水SS或濁度超過2000，且致廢水處理設施無法正常操作？','tri',when('waterWaterworksEmergencyDischargeUsed','yes')),
    select('waterWaterworksEmergencyRegistered','緊急應變措施是否已納入水措計畫核准文件或許可證（文件）？','tri',when('waterWaterworksEmergencyDischargeUsed','yes')),
    select('waterWaterworksBasinsEmptied','沉澱池及污泥濃縮池是否已先淨空？','tri',when('waterWaterworksEmergencyDischargeUsed','yes')),
    select('waterWaterworksNoticeCompliant','排放前是否通知下游用水者並通報當地主管機關？','tri',when('waterWaterworksEmergencyDischargeUsed','yes')),
    select('waterWaterworksDailyMonitoringCompliant','排放期間是否按日檢測並記錄原水濁度、SS及放流水SS，並保存紀錄？','tri',when('waterWaterworksEmergencyDischargeUsed','yes')),

    select('waterFoodServiceProvided','是否提供餐飲服務？','yn',inWhen('waterIndustryType',['restaurant','touristHotel'])),
    select('waterGreaseTrapPresent','餐飲廢水是否設置油脂截留設施？','tri',when('waterFoodServiceProvided','yes')),
    select('waterGreaseTrapMaintenanceRecordsCompliant','油脂截留設施是否定期清理維護並保存三年紀錄？','tri',when('waterFoodServiceProvided','yes')),
    select('waterHotSpringServiceProvided','是否提供溫泉泡湯服務？','yn',inWhen('waterIndustryType',['restaurant','touristHotel'])),
    select('waterHotSpringSeparatedCollectionCompliant','單純泡湯廢水是否依規定與其他作業廢水分流收集處理？','tri',when('waterHotSpringServiceProvided','yes')),
    select('waterHotSpringMudSpring','本案泉質是否屬泥漿泉質？','yn',when('waterHotSpringServiceProvided','yes')),
    select('waterHotSpringFiltersCompliant','非泥漿泉之單純泡湯廢水，毛髮過濾及懸浮固體過濾設施是否符合？','tri',when('waterHotSpringMudSpring','no')),
    select('waterHotSpringMaintenanceRecordsCompliant','相關油脂截留／毛髮／懸浮固體過濾設施之清理維護及三年紀錄是否符合？','tri',when('waterHotSpringServiceProvided','yes')),

    select('waterDialysisManagementPlanApproved','洗腎診所營運前之廢（污）水管理計畫是否已核准？','tri',when('waterIndustryType','dialysisClinic')),
    select('waterDialysisOperationMatchesPlan','現場是否依核准之廢（污）水管理計畫實施？','tri',when('waterIndustryType','dialysisClinic')),

    select('waterCoalMercuryRecordsCompliant','燃煤來源、總汞含量、每日（次）使用量及每月統計等紀錄是否符合並保存三年？','tri',when('waterIndustryType','coalPower')),
    select('waterCoalMercuryReportingCompliant','每年一月及七月底前之前半年燃煤來源、總汞含量及使用量網路申報是否符合？','tri',when('waterIndustryType','coalPower')),
    select('waterCoalMercuryThresholdExceeded','是否達需提出汞總量管理計畫之門檻？','yn',when('waterIndustryType','coalPower')),
    select('waterCoalMercuryPlanApproved','達門檻時，汞總量管理計畫是否已經主管機關審查核准？','tri',when('waterCoalMercuryThresholdExceeded','yes')),
    select('waterCoalMercuryPlanImplemented','是否依核准之汞總量管理計畫執行？','tri',when('waterCoalMercuryThresholdExceeded','yes')),

    select('waterHighTech49_9Trigger','是否符合第49條之9第1項任一分流收集處理觸發情形？','yn',inWhen('waterIndustryType',['semiconductor','optoelectronics','pcb','electroplating','metalSurface'])),
    computed('waterHighTechRequiredStreamsText','本業別應分流之作業廢水',{display:true,showWhen:when('waterHighTech49_9Trigger','yes'),className:'live-assessment'}),
    select('waterHighTechSeparatedCollectionCompliant','應分流之作業廢水是否已分流收集處理？','tri',when('waterHighTech49_9Trigger','yes')),

    Object.freeze({
      id:'waterSpecialOperationTypes',label:'本案是否涉及下列跨業別特殊作業？（有才勾，可複選）',type:'checklist',missing:'尚待確認',separator:'、',showWhen:when('waterShowIndustryChoice','yes'),
      items:Object.freeze([
        Object.freeze({id:'organicGroundwaterPollutant',label:'貯存／輸送地下水污染管制標準有機污染物'}),
        Object.freeze({id:'constructionResidualReceiving',label:'收容處理特定淤泥／高含水土壤／皂土等營建剩餘土石方'}),
        Object.freeze({id:'batPermitReview',label:'附表五業別規模之水措／許可申請、變更或展延'}),
        Object.freeze({id:'none',label:'均未涉及',exclusive:true}),
        Object.freeze({id:'unknown',label:'尚待確認',exclusive:true})
      ])
    }),
    computed('waterSpecialOrganic'),
    computed('waterSpecialResidual'),
    computed('waterSpecialBat'),
    select('waterOrganicLeakPreventionCompliant','有機污染物貯存／輸送設施之防滲漏材質及防範措施是否符合？','tri',when('waterSpecialOrganic','yes')),
    select('waterOrganicInspectionRecordsCompliant','定期巡查檢視紀錄是否完整並保存三年？','tri',when('waterSpecialOrganic','yes')),
    select('waterResidualDailyRecordsCompliant','車輛進出、土質種類、收容量及處理量是否每日記錄並保存三年？','tri',when('waterSpecialResidual','yes')),
    Object.freeze({
      id:'waterBatPermitActivity',label:'本案附表五最佳可行控制技術檢核情境',type:'select',missing:'尚待確認',allowCustom:false,showWhen:when('waterSpecialBat','yes'),
      options:Object.freeze([
        Object.freeze({id:'application',label:'申請水措計畫／許可',value:'申請水措計畫／許可'}),
        Object.freeze({id:'change',label:'變更水措計畫／許可',value:'變更水措計畫／許可'}),
        Object.freeze({id:'extension',label:'展延許可',value:'展延許可'}),
        Object.freeze({id:'notCurrent',label:'本次非申請／變更／展延審查',value:'本次非申請／變更／展延審查'}),
        Object.freeze({id:'unknown',label:'尚待確認',value:'尚待確認'})
      ])
    }),
    select('waterBatEvaluationConfirmed','於申請／變更／展延時，是否已依附表五優先評估最佳可行控制技術？','tri',inWhen('waterBatPermitActivity',['application','change','extension']))
  ]);
  root.WATER_MEASURE_INDUSTRY_FIELD_OPTIONS=Object.freeze({tri,yn});
})(typeof window==='undefined'?globalThis:window);

(function(root){
  'use strict';
  const eq=(source,field,value)=>Object.freeze({source,field,equals:value});
  const all=(...items)=>Object.freeze({all:Object.freeze(items)});
  const any=(...items)=>Object.freeze({any:Object.freeze(items)});
  root.WATER_MEASURE_ASSESSMENT_BINDINGS=Object.freeze({
    common:Object.freeze([
      Object.freeze({key:'sub4',ruleKey:'approvedMeasuresMismatch',label:'水措管理辦法§4 核准內容與現場',active:all(eq('out','waterShowSublawCore','yes'),any(eq('out','waterPermitLegalComparisonActive','yes'),Object.freeze({source:'input',field:'waterPermitCheckMode',falsy:true})))}),
      Object.freeze({key:'sub7',ruleKey:'rainWastewaterSeparation',label:'水措管理辦法§7 雨污分流',active:all(eq('out','waterShowSublawCore','yes'),eq('facts','wastewaterConfirmed','yes'))}),
      Object.freeze({key:'sub8',ruleKey:'runoffCollection',label:'水措管理辦法§8 逕流廢水收集處理',active:eq('out','waterShowSublawRunoff','yes')}),
      Object.freeze({key:'sub31s',ruleKey:'outsourceStorage',label:'水措管理辦法§31 委託前處理／貯留',active:eq('out','waterShowSublawOutsource','yes')}),
      Object.freeze({key:'sub31m',ruleKey:'outsourceMeter',label:'水措管理辦法§31 委託處理水量計測',active:eq('out','waterShowSublawOutsource','yes')}),
      Object.freeze({key:'sub39m',ruleKey:'storageMeter',label:'水措管理辦法§39 貯留水量計測',active:eq('out','waterShowSublawStorage','yes')}),
      Object.freeze({key:'sub39r',ruleKey:'storageRecords',label:'水措管理辦法§39 貯留紀錄',active:eq('out','waterShowSublawStorage','yes')}),
      Object.freeze({key:'sub40',ruleKey:'storageCapacity',label:'水措管理辦法§40 貯留應變容量',active:eq('out','waterShowSublawStorage','yes')}),
      Object.freeze({key:'sub41q',ruleKey:'reuseStandard',label:'水措管理辦法§41 回收使用水質／例外',active:eq('out','waterShowSublawReuse','yes')}),
      Object.freeze({key:'sub41s',ruleKey:'reuseSamplingPort',label:'水措管理辦法§41 回收使用採樣口',active:eq('out','waterShowSublawReuse','yes')}),
      Object.freeze({key:'sub53l',ruleKey:'outletLocation',label:'水措管理辦法§53 放流口位置',active:eq('out','waterShowSublawOutlet','yes')}),
      Object.freeze({key:'sub53a',ruleKey:'outletAccess',label:'水措管理辦法§53 採樣道路／平台',active:eq('out','waterShowSublawOutlet','yes')}),
      Object.freeze({key:'sub53m',ruleKey:'outletMeter',label:'水措管理辦法§53 放流水量計測',active:eq('out','waterShowSublawOutlet','yes')}),
      Object.freeze({key:'sub53s',ruleKey:'outletSign',label:'水措管理辦法§53 告示牌／座標',active:eq('out','waterShowSublawOutlet','yes')}),
      Object.freeze({key:'sub53p',ruleKey:'outletSampling',label:'水措管理辦法§53 可直接採樣',active:eq('out','waterShowSublawOutlet','yes')}),
      Object.freeze({key:'sub53x',ruleKey:'outletMixing',label:'水措管理辦法§53 陰井均勻混合',active:eq('out','waterShowSublawOutletMixing','yes')}),
      Object.freeze({key:'sub65',ruleKey:'meterCalibration',label:'水措管理辦法§65 水量計校正維護',active:eq('out','waterShowSublawMeter','yes')}),
      Object.freeze({key:'sub891d',ruleKey:'reportingDocuments',label:'水措管理辦法§89-1 申報與證明文件一致',active:eq('out','waterShowSublawReporting','yes')}),
      Object.freeze({key:'sub891s',ruleKey:'reportingSite',label:'水措管理辦法§89-1 申報與現場一致',active:eq('out','waterShowSublawReporting','yes')})
    ]),
    industry:Object.freeze([
      Object.freeze({key:'ind9r',ruleKey:'article9RainProtection',label:'業別§9 遮雨／擋雨／導雨',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind9b',ruleKey:'article9SedimentationBasin',label:'業別§9 沉砂池',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind9c',ruleKey:'article9BasinCapacity',label:'業別§9 沉砂池容量',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind9f',ruleKey:'article9BasinFreeboard',label:'業別§9 沉砂池液位',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind9m',ruleKey:'article9BasinMaterial',label:'業別§9 不透水材質',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind9x',ruleKey:'article9Maintenance',label:'業別§9 維護清淤紀錄',active:eq('out','waterShowIndustryArticle9','yes')}),
      Object.freeze({key:'ind10p',ruleKey:'constructionPlan',label:'營建§10 削減計畫',active:eq('out','waterShowIndustryConstruction','yes')}),
      Object.freeze({key:'ind10i',ruleKey:'constructionImplementation',label:'營建§10 依核准計畫實施',active:eq('out','waterShowIndustryConstruction','yes')}),
      Object.freeze({key:'ind70p',ruleKey:'livestockFertilizerPlan',label:'畜牧§70-1 農地肥分計畫',active:eq('out','waterShowIndustryLivestockFertilizer','yes')}),
      Object.freeze({key:'ind70o',ruleKey:'livestockFertilizerOperation',label:'畜牧§70-1 依計畫運作',active:eq('out','waterShowIndustryLivestockFertilizer','yes')})
    ])
  });
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
    industryExtensions:root.WATER_MEASURE_INDUSTRY_EXTENSIONS||{},
    industryFields:root.WATER_MEASURE_INDUSTRY_FIELDS||[],
    industryFieldOptions:root.WATER_MEASURE_INDUSTRY_FIELD_OPTIONS||{},
    assessmentBindings:root.WATER_MEASURE_ASSESSMENT_BINDINGS||{},
    provenance:meta.provenance
  });
})(typeof window==='undefined'?globalThis:window);
