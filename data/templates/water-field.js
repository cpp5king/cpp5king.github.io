(function(root){
  'use strict';
  const T=root.WATER_FIELD_TEXTS,missing=T.missing,when=(field,value='yes')=>({field,value});
  const field=(id,label,type,extra={})=>({id,label,type,missing,...extra});
  const computed=(id,label='',extra={})=>field(id,label||id,'computed',extra);
  const select=(id,label,options,extra={})=>field(id,label,'select',{allowCustom:false,options:options.map(([id,label])=>({id,label,value:label})),...extra});
  const checklist=(id,label,items,extra={})=>field(id,label,'checklist',{separator:'、',items:items.map(([id,label,opts])=>({id,label,...(opts||{})})),...extra});
  const yn=[['yes','是'],['no','否'],['unknown','已查證但目前仍無法確認']];
  const tri=[['yes','是，已確認'],['no','否，已確認不是／不符合'],['unknown','已查證但目前仍無法確認']];
  const template={
    id:'water-field',categoryId:'water',caseTypeId:'water-field-inspection',title:T.title,version:'4.7',workflow:'waterField',choiceStyle:'cards',mobileFocusMode:true,formTitle:T.formTitle,instructions:T.instructions,
    initialGate:true,validateOnSubmit:false,draftActionLabel:'產生案件文字',previewOnlyWhen:when('fieldNoDrafts'),previewOnlyMessage:'完成現場查察後即可產生案件文字。',
    handoff:{label:'繼續案件研判',caseTypeId:'water-inspection',templateId:'water-main',when:when('fieldShowAssessment'),confirmMessage:'將把本次現場稽查已填事實帶入「案件研判（完整母法）」繼續補查，是否繼續？'},
    fields:[
      computed('fieldNoDrafts'),
      computed('waterRecordDraftText'),computed('waterReplyDraftText'),
      field('waterInspectionDate',T.inspectionDate,'date',{format:'iso'}),
      computed('waterLawVersionText',T.lawVersion,{display:true}),
      computed('fieldShowSubjectConfirmed'),computed('waterShowIndustry'),computed('waterShowIndustryArticle9'),computed('waterShowIndustryConstruction'),computed('waterShowIndustryLivestock'),computed('waterShowIndustryLivestockFertilizer'),computed('fieldShowOperation'),computed('fieldShowProcess'),computed('fieldShowWaterUse'),computed('fieldShowMatter'),computed('fieldShowWastewater'),computed('fieldShowSources'),computed('fieldShowCollection'),computed('fieldShowTreatment'),computed('fieldShowRoute'),computed('fieldShowDestination'),computed('fieldShowSurface'),computed('fieldShowDitch'),computed('fieldShowDischarge'),computed('fieldShowDumping'),computed('fieldShowDumpingDetails'),computed('fieldShowPermit'),computed('fieldShowIncident'),computed('fieldShowIncidentDetails'),computed('fieldShowLeakPolluted'),computed('fieldShowLeakPrevention'),computed('fieldShowEmergency'),computed('fieldShowSampling'),computed('fieldShowSampleDetails'),computed('fieldShowLab'),computed('fieldShowEffluent'),computed('fieldShowEvidence'),computed('fieldShowComplete'),computed('fieldShowAssessment'),
      computed('fieldProgressText',T.progress,{display:true}),
      computed('fieldCurrentGuidanceText',T.guidance,{display:true}),

      select('waterSubjectType',T.subjectType,[['business','水污法事業'],['sewerSystem','污水下水道系統'],['buildingSewage','建築物污水處理設施'],['nonBusiness','一般民眾／其他非事業'],['unknown','尚未確認']]),
      select('waterSubjectConfirmed',T.subjectConfirmed,tri,{showWhen:when('fieldShowSubjectConfirmed')}),

      select('waterIndustryType','實際業別／特定水措業別',[['construction','營建工地'],['readyMix','預拌混凝土（第9條所稱水泥業）'],['stoneProcessing','土石加工業'],['stoneExtraction','土石採取業'],['mining','採礦業'],['earthworkDump','土石方堆（棄）置場'],['livestock','畜牧業'],['other','其他事業'],['unknown','尚待確認']],{showWhen:when('waterShowIndustry')}),
      select('waterIndustryRainProtectionStatus','開挖面／堆置場所之遮雨、擋雨、導雨設施是否符合規定？',[['compliant','符合'],['approvedException','設置困難且已取得主管機關同意例外'],['noncompliant','不符合／未設置'],['unknown','尚待確認']],{showWhen:when('waterShowIndustryArticle9')}),
      select('waterIndustrySedimentationBasinPresent','是否設有收集處理初期降雨及洗車平台廢水之沉砂池？',tri,{showWhen:when('waterShowIndustryArticle9')}),
      select('waterIndustrySedimentationCapacityCompliant','沉砂池總設計容量是否達工地／作業場所總面積×0.025公尺以上？',tri,{showWhen:when('waterShowIndustryArticle9')}),
      select('waterIndustrySedimentationFreeboardCompliant','非下雨期間最高液面距池頂高度是否大於池深二分之一？',tri,{showWhen:when('waterShowIndustryArticle9')}),
      select('waterIndustrySedimentationImpermeableCompliant','沉砂池是否採不透水材質？',tri,{showWhen:when('waterShowIndustryArticle9')}),
      select('waterIndustryMaintenanceRecordsCompliant','擋雨／遮雨／導雨設施及沉砂池是否有定期維護清淤並保存三年紀錄？',tri,{showWhen:when('waterShowIndustryArticle9')}),
      select('waterConstructionReductionPlanApprovedBeforeWork','施工前是否已取得逕流廢水污染削減計畫核准？',tri,{showWhen:when('waterShowIndustryConstruction')}),
      select('waterConstructionImplementedApprovedPlan','現場是否依核准削減計畫及工程圖說實施？',tri,{showWhen:when('waterShowIndustryConstruction')}),
      select('waterLivestockFertilizerUse','是否採沼液／沼渣作為農地肥分使用？',tri,{showWhen:when('waterShowIndustryLivestock')}),
      select('waterLivestockFertilizerPlanApproved','是否已取得農業主管機關審查同意之沼液沼渣農地肥分使用計畫？',tri,{showWhen:when('waterShowIndustryLivestockFertilizer')}),
      select('waterLivestockFertilizerMatchesPlan','實際施灌是否依核准計畫登記事項運作？',tri,{showWhen:when('waterShowIndustryLivestockFertilizer')}),
      computed('waterIndustryOverviewText','特定業別子法初步檢核',{display:true,displayWhen:when('waterShowIndustry')}),
      select('fieldOperationStatus',T.operationStatus,[['operating','正在營運／作業'],['temporarilyStopped','暫停作業但有近期操作跡象'],['notOperating','目前未營運'],['unknown','尚待確認']],{showWhen:when('fieldShowOperation')}),
      select('fieldProcessObserved',T.processObserved,yn,{showWhen:when('fieldShowProcess')}),
      select('fieldWaterUseObserved',T.waterUseObserved,yn,{showWhen:when('fieldShowWaterUse')}),

      select('waterMatterType',T.matterType,[['wastewater','廢（污）水／疑似廢（污）水'],['sludge','污泥'],['acidAlkaliWasteLiquid','酸鹼廢液'],['waterFertilizer','水肥'],['garbage','垃圾'],['constructionWaste','建築廢料'],['otherPollutant','其他污染物'],['unknown','尚未確認']],{showWhen:when('fieldShowMatter')}),
      select('waterWastewaterStatus',T.wastewaterStatus,tri,{showWhen:when('fieldShowWastewater')}),
      checklist('waterSourceTypes',T.sourceTypes,[['manufacturing','製造製程'],['operation','操作過程'],['naturalResource','自然資源開發'],['workEnvironment','作業環境'],['domestic','生活污水'],['cleaning','設備／地坪清洗'],['cooling','冷卻水'],['rain','雨水'],['groundwater','地下水'],['other','其他'],['unknown','來源尚待確認',{exclusive:true}]],{showWhen:when('fieldShowSources')}),

      select('fieldCollectionStatus',T.collectionStatus,[['found','已找到收集點／槽體／集水設施'],['none','現場未見收集設施'],['notApplicable','本案不適用'],['unknown','尚待確認']],{showWhen:when('fieldShowCollection')}),
      select('waterTreatmentFacilityApplicable',T.treatmentApplicable,yn,{showWhen:when('fieldShowTreatment')}),
      select('waterTreatmentOperatingNormally',T.treatmentOperating,yn,{showWhen:{field:'waterTreatmentFacilityApplicable',value:'yes'}}),
      select('fieldRouteTraced',T.routeTraced,yn,{showWhen:when('fieldShowRoute')}),
      select('waterDestination',T.destination,[['surfaceWater','地面水體／疑似地面水體'],['sewer','污水下水道'],['storage','貯留'],['reuse','回收使用'],['outsourced','委外處理'],['soil','排放於土壤'],['groundwater','注入地下／疑似地下水體'],['unknown','去向仍不明']],{showWhen:when('fieldShowDestination')}),
      select('waterSurfaceType',T.surfaceType,[['river','河川'],['ocean','海洋'],['lake','湖潭'],['reservoir','水庫'],['pond','池塘'],['irrigationChannel','灌溉渠道'],['drainage','各級排水路'],['roadsideDitch','道路側溝'],['other','其他疑似地面水體'],['unknown','尚未確認']],{showWhen:when('fieldShowSurface')}),
      select('waterSurfaceWaterConfirmed',T.surfaceConfirmed,tri,{showWhen:when('fieldShowSurface')}),
      select('waterDrainageFunctionConfirmed',T.drainageFunction,tri,{showWhen:when('fieldShowDitch')}),
      select('waterDownstreamConfirmed',T.downstream,tri,{showWhen:when('fieldShowDitch')}),
      select('waterDrainageConnectionConfirmed',T.drainageConnection,tri,{showWhen:when('fieldShowDitch')}),

      select('waterActualDischarge',T.actualDischarge,yn,{showWhen:when('fieldShowDischarge')}),
      select('waterDischargePermit',T.permit,[['valid','有有效排放許可／簡易排放許可文件'],['none','查無有效排放許可'],['expired','許可已逾有效期間'],['unknown','尚待確認']],{showWhen:when('fieldShowPermit')}),
      select('waterDumpingConfirmed',T.dumping,yn,{showWhen:when('fieldShowDumping')}),
      select('waterControlZoneConfirmed',T.controlZone,yn,{showWhen:when('fieldShowDumpingDetails')}),
      select('waterDesignatedWaterRangeConfirmed',T.designatedRange,yn,{showWhen:when('fieldShowDumpingDetails')}),

      select('waterArticle28Scenario',T.incidentScenario,yn,{showWhen:when('fieldShowIncident')}),
      select('waterTransportStorageEquipmentConfirmed',T.transportStorageEquipment,yn,{showWhen:when('fieldShowIncidentDetails')}),
      select('waterLeakCause',T.leakCause,[['tankFailure','槽體破裂／失效'],['pipeFailure','管線破裂／失效'],['overflow','設備或槽體溢流'],['levelFailure','液位控制故障'],['otherEquipmentFailure','其他設備故障／疏漏'],['humanDischarge','人為開閥／私管／主動抽排'],['unknown','原因尚待確認']],{showWhen:when('fieldShowIncidentDetails')}),
      select('waterLeakRiskToWaterBodyConfirmed',T.leakRisk,yn,{showWhen:when('fieldShowLeakPolluted')}),
      select('waterMaintenancePreventionTaken',T.maintenancePrevention,yn,{showWhen:when('fieldShowLeakPrevention')}),
      select('waterLeakPollutedWaterBody',T.leakPolluted,yn,{showWhen:when('fieldShowLeakPolluted')}),
      select('waterSevereHazardRiskConfirmed',T.severeHazard,yn,{showWhen:when('fieldShowIncident')}),
      select('waterEmergencyActionTaken',T.emergencyAction,yn,{showWhen:when('fieldShowEmergency')}),
      select('waterThreeHourNotice',T.threeHourNotice,yn,{showWhen:when('fieldShowEmergency')}),

      select('waterSampleTaken',T.sampleTaken,yn,{showWhen:when('fieldShowSampling')}),
      select('waterSampleRepresentative',T.sampleRepresentative,yn,{showWhen:when('fieldShowSampleDetails')}),
      select('waterSampleBeforeReceivingWater',T.sampleBeforeReceivingWater,yn,{showWhen:when('fieldShowSampleDetails')}),
      select('waterApplicableStandardConfirmed','是否已確認本案適用的放流水標準？',yn,{showWhen:when('fieldShowSampleDetails')}),
      select('waterLabResultAvailable',T.labResult,yn,{showWhen:when('fieldShowLab')}),
      select('waterEffluentExceeded',T.effluentExceeded,yn,{showWhen:when('fieldShowEffluent')}),

      checklist('waterEvidenceTypes',T.evidenceTypes,[['overviewPhoto','現場全景'],['sourcePhoto','污染／廢水來源'],['collectionPhoto','收集槽／集水設施'],['treatmentPhoto','處理設備'],['pipelinePhoto','管線／溝渠'],['outletPhoto','排放口'],['flowVideo','水流影片'],['downstreamPhoto','下游流向'],['permitRecord','許可／列管資料'],['drainageMap','排水圖資'],['sampling','採樣紀錄'],['statement','現場人員陳述'],['other','其他證據']],{showWhen:when('fieldShowEvidence')}),
      computed('fieldEvidenceSummaryText',T.evidenceSummary,{display:true,displayWhen:when('fieldShowEvidence')}),
      select('waterInvestigationComplete',T.inspectionComplete,yn,{showWhen:when('fieldShowComplete')}),
      computed('fieldFinalConclusionText',T.finalConclusion,{display:true,displayWhen:when('fieldShowAssessment')}),
      computed('fieldRulesOverviewText',T.overview,{display:true,displayWhen:when('fieldShowAssessment')})
    ],
    record:['{{waterRecordDraftText}}'],reply:['{{waterReplyDraftText}}']
  };
  root.INSPECTION_CONFIG.templates.push(template);
})(window);
