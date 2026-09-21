(function(root){
  'use strict';
  const VERSION='4.8.5';
  const MISSING='尚待確認';
  if(!root.WaterMeasureLaw)throw new Error('WaterMeasureLaw is required before water-industry-v485.');
  const triOptions=[
    {id:'yes',label:'是，已確認',value:'是，已確認'},
    {id:'no',label:'否，已確認不是／不符合',value:'否，已確認不是／不符合'},
    {id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'}
  ];
  const ynOptions=[
    {id:'yes',label:'是',value:'是'},
    {id:'no',label:'否',value:'否'},
    {id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'}
  ];
  const option=(id,label)=>({id,label,value:label});
  const select=(id,label,options,showWhen)=>({id,label,type:'select',missing:MISSING,allowCustom:false,options,showWhen});
  const computed=(id,label=id,extra={})=>({id,label,type:'computed',missing:MISSING,...extra});
  const when=(field,value='yes')=>({field,value});
  const inWhen=(field,value)=>({field,operator:'in',value});
  const checklist=(id,label,items,showWhen)=>({
    id,label,type:'checklist',missing:MISSING,separator:'、',showWhen,
    items:items.map(item=>({id:item.id,label:item.label,...(item.exclusive?{exclusive:true}:{})}))
  });
  const industryOptions=root.WaterMeasureLaw.industryOptions();

  const newFieldIds=[
    'waterConstructionVisibleSedimentFound','waterConstructionSedimentCleanedCompliant','waterConstructionWasteOilFound','waterConstructionWasteOilHandledCompliant','waterConstructionCleanupRecordsCompliant',
    'waterShipContainmentCompliant','waterShipOilBoomCompliant','waterShipReceivingFacilitiesCompliant',
    'waterLivestockFishIntegratedUse','waterLivestockFishDailyVolumeCompliant','waterLivestockFishStockingCompliant','waterLivestockFishDOCompliant','waterLivestockFishFreeboardCompliant','waterLivestockFishRecordsCompliant','waterLivestockFishNoticeCompliant',
    'waterLivestockPigCattleResourceApplicable','waterLivestockResourceMeasureApproved','waterLivestockResourceRatioCompliant','waterLivestockSmallPigPlanApplicable','waterLivestockSmallPigPlanApproved','waterLivestockSmallPigPlanOperationCompliant',
    'waterLivestockFertilizerPauseCondition','waterLivestockFertilizerPauseCompliant',
    'waterWaterworksEmergencyDischargeUsed','waterWaterworksEmergencyConditionsMet','waterWaterworksEmergencyRegistered','waterWaterworksBasinsEmptied','waterWaterworksNoticeCompliant','waterWaterworksDailyMonitoringCompliant',
    'waterFoodServiceProvided','waterGreaseTrapPresent','waterGreaseTrapMaintenanceRecordsCompliant','waterHotSpringServiceProvided','waterHotSpringSeparatedCollectionCompliant','waterHotSpringMudSpring','waterHotSpringFiltersCompliant','waterHotSpringMaintenanceRecordsCompliant',
    'waterDialysisManagementPlanApproved','waterDialysisOperationMatchesPlan',
    'waterCoalMercuryRecordsCompliant','waterCoalMercuryReportingCompliant','waterCoalMercuryThresholdExceeded','waterCoalMercuryPlanApproved','waterCoalMercuryPlanImplemented',
    'waterHighTech49_9Trigger','waterHighTechRequiredStreamsText','waterHighTechSeparatedCollectionCompliant',
    'waterSpecialOperationTypes','waterSpecialOrganic','waterSpecialResidual','waterSpecialBat','waterOrganicLeakPreventionCompliant','waterOrganicInspectionRecordsCompliant','waterResidualDailyRecordsCompliant','waterBatPermitActivity','waterBatEvaluationConfirmed'
  ];

  function addOnFields(){
    const fields=[];
    fields.push(
      select('waterConstructionVisibleSedimentFound','營建工地周圍排水溝排放管線底部、進入水體處或周圍環境，是否形成可見沉積污泥？',ynOptions,when('waterIndustryType','construction')),
      select('waterConstructionSedimentCleanedCompliant','發現可見沉積污泥後，是否已清除或依主管機關命令於三日內清除？',triOptions,when('waterConstructionVisibleSedimentFound','yes')),
      select('waterConstructionWasteOilFound','施工機具／車輛維修保養是否有廢機油、潤滑油、柴油等棄置或溢洩？',ynOptions,when('waterIndustryType','construction')),
      select('waterConstructionWasteOilHandledCompliant','前述廢油是否以適當儲存設備收集處理，未隨廢（污）水／逕流廢水排放或溢流至作業環境外？',triOptions,when('waterConstructionWasteOilFound','yes')),
      select('waterConstructionCleanupRecordsCompliant','沉積污泥清除／廢油收集處理之時間、方法、紀錄及妥善處理證明文件是否符合？',triOptions,when('waterIndustryType','construction')),

      select('waterShipContainmentCompliant','拆解場所四週截流設施，或經主管機關同意之替代防堵設施，是否符合？',triOptions,when('waterIndustryType','shipDismantling')),
      select('waterShipOilBoomCompliant','作業區域周圍水面是否有佈設浮油攔除設備？',triOptions,when('waterIndustryType','shipDismantling')),
      select('waterShipReceivingFacilitiesCompliant','作業區域是否有適當之廢油、廢水及其他污染物收受設施？',triOptions,when('waterIndustryType','shipDismantling')),

      select('waterLivestockFishIntegratedUse','是否採漁牧綜合經營？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockFishDailyVolumeCompliant','每日排放至每公頃魚池之廢水量是否在4立方公尺以下？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishStockingCompliant','每公頃魚池承受之豬隻廢水量是否不超過200頭豬隻？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishDOCompliant','魚池溶氧是否達1.0 mg/L以上？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishFreeboardCompliant','非雨季期間魚池最高液面距池頂是否維持30公分以上？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishRecordsCompliant','畜舍清洗、排入魚池水量及魚池排放時間等紀錄是否完整並保存三年？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishNoticeCompliant','魚池廢水排放前三日是否已主動通知主管機關？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockPigCattleResourceApplicable','是否屬飼養豬隻或牛隻，需檢核畜牧糞尿資源化處理措施？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockResourceMeasureApproved','是否至少採行一項依法核准之畜牧糞尿資源化處理措施？',triOptions,when('waterLivestockPigCattleResourceApplicable','yes')),
      select('waterLivestockResourceRatioCompliant','依法適用之畜牧糞尿資源化處理比率是否符合？',triOptions,when('waterLivestockPigCattleResourceApplicable','yes')),
      select('waterLivestockSmallPigPlanApplicable','是否屬飼養豬隻20頭以上未滿200頭之畜牧業？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockSmallPigPlanApproved','該小型養豬場廢（污）水管理計畫是否已依法核准？',triOptions,when('waterLivestockSmallPigPlanApplicable','yes')),
      select('waterLivestockSmallPigPlanOperationCompliant','現場運作是否符合核准之廢（污）水管理計畫？',triOptions,when('waterLivestockSmallPigPlanApplicable','yes')),
      select('waterLivestockFertilizerPauseCondition','目前是否有依法應暫停沼液沼渣農地肥分使用之情形（如大雨／豪雨特報期間等）？',ynOptions,when('waterShowIndustryLivestockFertilizer','yes')),
      select('waterLivestockFertilizerPauseCompliant','應暫停期間是否確實停止沼液沼渣農地肥分使用？',triOptions,when('waterLivestockFertilizerPauseCondition','yes')),

      select('waterWaterworksEmergencyDischargeUsed','本次是否以豪雨／天然災害緊急應變條件直接排放？',ynOptions,when('waterIndustryType','waterworks')),
      select('waterWaterworksEmergencyConditionsMet','是否已確認豪雨特報／天然災害、原水SS或濁度超過2000，且致廢水處理設施無法正常操作？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksEmergencyRegistered','緊急應變措施是否已納入水措計畫核准文件或許可證（文件）？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksBasinsEmptied','沉澱池及污泥濃縮池是否已先淨空？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksNoticeCompliant','排放前是否通知下游用水者並通報當地主管機關？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksDailyMonitoringCompliant','排放期間是否按日檢測並記錄原水濁度、SS及放流水SS，並保存紀錄？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),

      select('waterFoodServiceProvided','是否提供餐飲服務？',ynOptions,inWhen('waterIndustryType',['restaurant','touristHotel'])),
      select('waterGreaseTrapPresent','餐飲廢水是否設置油脂截留設施？',triOptions,when('waterFoodServiceProvided','yes')),
      select('waterGreaseTrapMaintenanceRecordsCompliant','油脂截留設施是否定期清理維護並保存三年紀錄？',triOptions,when('waterFoodServiceProvided','yes')),
      select('waterHotSpringServiceProvided','是否提供溫泉泡湯服務？',ynOptions,inWhen('waterIndustryType',['restaurant','touristHotel'])),
      select('waterHotSpringSeparatedCollectionCompliant','單純泡湯廢水是否依規定與其他作業廢水分流收集處理？',triOptions,when('waterHotSpringServiceProvided','yes')),
      select('waterHotSpringMudSpring','本案泉質是否屬泥漿泉質？',ynOptions,when('waterHotSpringServiceProvided','yes')),
      select('waterHotSpringFiltersCompliant','非泥漿泉之單純泡湯廢水，毛髮過濾及懸浮固體過濾設施是否符合？',triOptions,when('waterHotSpringMudSpring','no')),
      select('waterHotSpringMaintenanceRecordsCompliant','相關油脂截留／毛髮／懸浮固體過濾設施之清理維護及三年紀錄是否符合？',triOptions,when('waterHotSpringServiceProvided','yes')),

      select('waterDialysisManagementPlanApproved','洗腎診所營運前之廢（污）水管理計畫是否已核准？',triOptions,when('waterIndustryType','dialysisClinic')),
      select('waterDialysisOperationMatchesPlan','現場是否依核准之廢（污）水管理計畫實施？',triOptions,when('waterIndustryType','dialysisClinic')),

      select('waterCoalMercuryRecordsCompliant','燃煤來源、總汞含量、每日（次）使用量及每月統計等紀錄是否符合並保存三年？',triOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryReportingCompliant','每年一月及七月底前之前半年燃煤來源、總汞含量及使用量網路申報是否符合？',triOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryThresholdExceeded','是否達需提出汞總量管理計畫之門檻？',ynOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryPlanApproved','達門檻時，汞總量管理計畫是否已經主管機關審查核准？',triOptions,when('waterCoalMercuryThresholdExceeded','yes')),
      select('waterCoalMercuryPlanImplemented','是否依核准之汞總量管理計畫執行？',triOptions,when('waterCoalMercuryThresholdExceeded','yes')),

      select('waterHighTech49_9Trigger','是否符合第49條之9第1項任一分流收集處理觸發情形？',ynOptions,inWhen('waterIndustryType',['semiconductor','optoelectronics','pcb','electroplating','metalSurface'])),
      computed('waterHighTechRequiredStreamsText','本業別應分流之作業廢水',{display:true,showWhen:when('waterHighTech49_9Trigger','yes'),className:'live-assessment'}),
      select('waterHighTechSeparatedCollectionCompliant','應分流之作業廢水是否已分流收集處理？',triOptions,when('waterHighTech49_9Trigger','yes')),

      checklist('waterSpecialOperationTypes','本案是否涉及下列跨業別特殊作業？（有才勾，可複選）',[
        {id:'organicGroundwaterPollutant',label:'貯存／輸送地下水污染管制標準有機污染物'},
        {id:'constructionResidualReceiving',label:'收容處理特定淤泥／高含水土壤／皂土等營建剩餘土石方'},
        {id:'batPermitReview',label:'附表五業別規模之水措／許可申請、變更或展延'},
        {id:'none',label:'均未涉及',exclusive:true},{id:'unknown',label:'尚待確認',exclusive:true}
      ],when('waterShowIndustryChoice','yes')),
      computed('waterSpecialOrganic'),computed('waterSpecialResidual'),computed('waterSpecialBat'),
      select('waterOrganicLeakPreventionCompliant','有機污染物貯存／輸送設施之防滲漏材質及防範措施是否符合？',triOptions,when('waterSpecialOrganic','yes')),
      select('waterOrganicInspectionRecordsCompliant','定期巡查檢視紀錄是否完整並保存三年？',triOptions,when('waterSpecialOrganic','yes')),
      select('waterResidualDailyRecordsCompliant','車輛進出、土質種類、收容量及處理量是否每日記錄並保存三年？',triOptions,when('waterSpecialResidual','yes')),
      select('waterBatPermitActivity','本案附表五最佳可行控制技術檢核情境',[option('application','申請水措計畫／許可'),option('change','變更水措計畫／許可'),option('extension','展延許可'),option('notCurrent','本次非申請／變更／展延審查'),option('unknown','尚待確認')],when('waterSpecialBat','yes')),
      select('waterBatEvaluationConfirmed','於申請／變更／展延時，是否已依附表五優先評估最佳可行控制技術？',triOptions,inWhen('waterBatPermitActivity',['application','change','extension']))
    );
    return fields;
  }

  function patchTemplate(template){
    if(!template||!['water-field','water-main'].includes(template.id))return;
    template.version=VERSION;
    template.fields=template.fields.filter(field=>field.id!=='waterIndustryCheckMode'&&!newFieldIds.includes(field.id));
    const industry=template.fields.find(field=>field.id==='waterIndustryType');
    if(industry){
      industry.label='實際業別（系統依業別自動載入附加檢查）';
      industry.options=industryOptions;
      industry.showWhen=when('waterShowIndustryChoice','yes');
    }
    const overview=template.fields.find(field=>field.id==='waterIndustryOverviewText');
    if(overview){overview.label='特定業別附加檢查';overview.displayWhen=when('waterShowIndustry','yes');}
    let insertAt=template.fields.findIndex(field=>field.id==='waterIndustryOverviewText');
    if(insertAt<0){
      const industryAt=template.fields.findIndex(field=>field.id==='waterIndustryType');
      insertAt=industryAt>=0?industryAt+1:template.fields.length;
    }
    template.fields.splice(insertAt,0,...addOnFields());
  }

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.waterIndustry485=function(config){
    for(const template of config.templates||[])patchTemplate(template);
  };

  const baseWorkflowApply=root.WaterWorkflow?.apply;
  if(typeof baseWorkflowApply==='function'&&!root.WaterWorkflow.__industry485){
    root.WaterWorkflow.apply=function(input,facts,out={}){
      const result=baseWorkflowApply(input,facts,out);
      result.waterShowIndustryChoice=facts.subjectIsBusiness==='yes'?'yes':'no';
      result.waterShowIndustry=result.waterShowIndustryChoice==='yes'&&!!input.waterIndustryType?'yes':'no';
      const guidance=root.WaterMeasureLaw.industryGuidance(input);
      result.waterShowIndustryArticle9=result.waterShowIndustry==='yes'&&guidance.isArticle9?'yes':'no';
      result.waterShowIndustryConstruction=result.waterShowIndustry==='yes'&&input.waterIndustryType==='construction'?'yes':'no';
      result.waterShowIndustryLivestock=result.waterShowIndustry==='yes'&&input.waterIndustryType==='livestock'?'yes':'no';
      result.waterShowIndustryLivestockFertilizer=result.waterShowIndustryLivestock==='yes'&&input.waterLivestockFertilizerUse==='yes'?'yes':'no';
      const ops=Array.isArray(input.waterSpecialOperationTypes)?input.waterSpecialOperationTypes:[];
      result.waterSpecialOrganic=ops.includes('organicGroundwaterPollutant')?'yes':'no';
      result.waterSpecialResidual=ops.includes('constructionResidualReceiving')?'yes':'no';
      result.waterSpecialBat=ops.includes('batPermitReview')?'yes':'no';
      result.waterHighTechRequiredStreamsText=guidance.highTechRequiredStreamsText||'';
      return result;
    };
    root.WaterWorkflow.__industry485=true;
  }

  function collect(input,out){
    if(!root.WaterMeasureLaw?.evaluateIndustryExtensions)throw new Error('WaterMeasureLaw industry extensions are required before water-industry-v485.');
    return root.WaterMeasureLaw.evaluateIndustryExtensions(input,{lawReady:out.sublawVersionResolved==='yes'});
  }

  const baseAssessmentApply=root.WaterAssessment?.apply;
  if(typeof baseAssessmentApply==='function'&&!root.WaterAssessment.__industry485){
    root.WaterAssessment.apply=function(input,facts,out,lawVersion,results,sub,industry){
      const result=baseAssessmentApply(input,facts,out,lawVersion,results,sub,industry);
      if(facts.subjectIsBusiness!=='yes'||!input.waterIndustryType)return result;
      const extra=collect(input,result);
      const baseText=String(result.waterIndustryOverviewText||'').trim();
      const oldEmpty=baseText==='目前未進入特定業別子法支線。';
      const parts=[];
      if(baseText&&!oldEmpty)parts.push(baseText);
      if(extra.sections.length)parts.push(extra.sections.join('\n\n'));
      if(!parts.length)parts.push('目前已完成業別辨識；本業別無已建置之專屬成立規則，仍依一般水污核心及跨業別特殊作業檢查。');
      result.waterIndustryOverviewText=parts.join('\n\n');
      if(extra.overview.length){
        const current=String(result.waterRulesOverviewText||'').trim();
        result.waterRulesOverviewText=[current,...extra.overview].filter(Boolean).join('\n');
      }
      if(extra.missing.length){
        result.waterLiveMissingText=[String(result.waterLiveMissingText||'').trim(),'【特定業別／特殊作業待確認】',...extra.missing.map(x=>'• '+x)].filter(Boolean).join('\n');
      }
      if(extra.concerns.length){
        result.waterLiveDecisionText=[String(result.waterLiveDecisionText||'').trim(),'⚠ 特定業別附加檢查發現疑似不符合事項，應依適用條文與現場證據再確認。'].filter(Boolean).join('\n');
        if(/^A｜/.test(String(result.waterFinalConclusionText||''))){
          result.waterFinalConclusionText='C｜尚有要件待確認\n特定業別附加檢查發現疑似不符合事項；目前先保留為待補強之法規／事證支線，不以本附加檢查單獨作成終局違規結論。';
        }
      }
      return result;
    };
    root.WaterAssessment.__industry485=true;
  }

  const resetFields=[...newFieldIds.filter(id=>!['waterHighTechRequiredStreamsText','waterSpecialOrganic','waterSpecialResidual','waterSpecialBat'].includes(id))];
  function clearNew(previous,current,next){
    const clear=keys=>keys.forEach(key=>{next[key]=Array.isArray(previous?.[key])?[]:'';});
    if(previous?.waterIndustryType!==current?.waterIndustryType)clear(resetFields.filter(id=>id!=='waterSpecialOperationTypes'&&!id.startsWith('waterOrganic')&&!id.startsWith('waterResidual')&&!id.startsWith('waterBat')));
    if(JSON.stringify(previous?.waterSpecialOperationTypes||[])!==JSON.stringify(current?.waterSpecialOperationTypes||[]))clear(['waterOrganicLeakPreventionCompliant','waterOrganicInspectionRecordsCompliant','waterResidualDailyRecordsCompliant','waterBatPermitActivity','waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFishIntegratedUse!==current?.waterLivestockFishIntegratedUse)clear(['waterLivestockFishDailyVolumeCompliant','waterLivestockFishStockingCompliant','waterLivestockFishDOCompliant','waterLivestockFishFreeboardCompliant','waterLivestockFishRecordsCompliant','waterLivestockFishNoticeCompliant']);
    if(previous?.waterLivestockPigCattleResourceApplicable!==current?.waterLivestockPigCattleResourceApplicable)clear(['waterLivestockResourceMeasureApproved','waterLivestockResourceRatioCompliant']);
    if(previous?.waterLivestockSmallPigPlanApplicable!==current?.waterLivestockSmallPigPlanApplicable)clear(['waterLivestockSmallPigPlanApproved','waterLivestockSmallPigPlanOperationCompliant']);
    if(previous?.waterWaterworksEmergencyDischargeUsed!==current?.waterWaterworksEmergencyDischargeUsed)clear(['waterWaterworksEmergencyConditionsMet','waterWaterworksEmergencyRegistered','waterWaterworksBasinsEmptied','waterWaterworksNoticeCompliant','waterWaterworksDailyMonitoringCompliant']);
    if(previous?.waterFoodServiceProvided!==current?.waterFoodServiceProvided)clear(['waterGreaseTrapPresent','waterGreaseTrapMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringServiceProvided!==current?.waterHotSpringServiceProvided)clear(['waterHotSpringSeparatedCollectionCompliant','waterHotSpringMudSpring','waterHotSpringFiltersCompliant','waterHotSpringMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringMudSpring!==current?.waterHotSpringMudSpring)clear(['waterHotSpringFiltersCompliant']);
    if(previous?.waterCoalMercuryThresholdExceeded!==current?.waterCoalMercuryThresholdExceeded)clear(['waterCoalMercuryPlanApproved','waterCoalMercuryPlanImplemented']);
    if(previous?.waterHighTech49_9Trigger!==current?.waterHighTech49_9Trigger)clear(['waterHighTechSeparatedCollectionCompliant']);
    if(previous?.waterBatPermitActivity!==current?.waterBatPermitActivity)clear(['waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFertilizerPauseCondition!==current?.waterLivestockFertilizerPauseCondition)clear(['waterLivestockFertilizerPauseCompliant']);
    return next;
  }

  if(root.WaterDependencies?.resetChange&&!root.WaterDependencies.__industry485){
    const base=root.WaterDependencies.resetChange;
    root.WaterDependencies.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    root.WaterDependencies.__industry485=true;
  }
  const fieldWorkflow=root.TemplateWorkflows?.waterField;
  if(fieldWorkflow?.resetChange&&!fieldWorkflow.__industry485){
    const base=fieldWorkflow.resetChange;
    fieldWorkflow.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    fieldWorkflow.__industry485=true;
  }

  root.WaterIndustryV485={collect,patchTemplate,version:VERSION};
})(typeof window==='undefined'?globalThis:window);
