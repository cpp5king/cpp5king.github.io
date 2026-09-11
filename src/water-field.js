(function(root){
  'use strict';
  root.TemplateWorkflows=root.TemplateWorkflows||{};
  const yes=v=>v==='yes';
  const bool=v=>v?'yes':'no';
  const evidenceLabels={
    overviewPhoto:'現場全景',sourcePhoto:'污染／廢水來源',collectionPhoto:'收集槽／集水設施',treatmentPhoto:'處理設備',pipelinePhoto:'管線／溝渠',outletPhoto:'排放口',flowVideo:'水流影片',downstreamPhoto:'下游流向',permitRecord:'許可／列管資料',drainageMap:'排水圖資',sampling:'採樣紀錄',statement:'現場人員陳述',other:'其他證據'
  };
  function normaliseSources(out){
    if(!Array.isArray(out.waterSourceTypes)&&out.waterSourceType)out.waterSourceTypes=[out.waterSourceType];
    if(Array.isArray(out.waterSourceTypes)){
      out.waterSourceTypes=[...new Set(out.waterSourceTypes.filter(Boolean))];
      if(out.waterSourceTypes.length>1)out.waterSourceTypes=out.waterSourceTypes.filter(v=>v!=='unknown');
    }
  }
  function currentStep(input){
    if(!input.waterSubjectType)return 1;
    if(input.waterSubjectType==='business'&&!input.waterSubjectConfirmed)return 1;
    if(!input.fieldOperationStatus||!input.fieldProcessObserved||!input.fieldWaterUseObserved)return 2;
    if(!input.waterMatterType)return 3;
    if(input.waterMatterType==='wastewater'){
      if(!input.waterWastewaterStatus)return 3;
      if(input.waterWastewaterStatus==='yes'&&(!Array.isArray(input.waterSourceTypes)||!input.waterSourceTypes.length))return 3;
      if(input.waterWastewaterStatus==='yes'&&!input.fieldCollectionStatus)return 4;
      if(input.waterWastewaterStatus==='yes'&&!input.fieldRouteTraced)return 5;
      if(input.waterWastewaterStatus==='yes'&&!input.waterDestination)return 5;
      if(input.waterWastewaterStatus==='yes'&&!input.waterActualDischarge)return 6;
    }else if(input.waterMatterType!=='unknown'){
      if(!input.waterDumpingConfirmed)return 5;
      if(input.waterDumpingConfirmed==='yes'&&(!input.waterControlZoneConfirmed||!input.waterDesignatedWaterRangeConfirmed))return 5;
    }
    if(!input.waterArticle28Scenario)return 7;
    if(input.waterArticle28Scenario==='yes'&&!input.waterLeakCause)return 7;
    if(input.waterDestination==='surfaceWater'&&input.waterActualDischarge==='yes'&&!input.waterSampleTaken)return 8;
    if(!Array.isArray(input.waterEvidenceTypes)||!input.waterEvidenceTypes.length)return 9;
    if(!input.waterInvestigationComplete)return 10;
    return 10;
  }
  function guidance(input,facts){
    const step=currentStep(input);
    if(step===1)return '先確認受檢對象身分。公司、商號或工廠登記本身不等於水污法事業；應核對實際作業、業別、規模及列管資料。';
    if(step===2){
      if(input.fieldOperationStatus==='notOperating')return '現場未營運也不要直接結案：確認設備狀態、近期操作痕跡、槽體液位、管線濕痕及業者最近營運時段。';
      return '先看實際製程與用水，不要先找法條。確認哪些設備正在運轉、哪裡用水、哪裡可能產生廢（污）水。';
    }
    if(step===3){
      if(input.waterMatterType==='wastewater'&&input.waterWastewaterStatus==='no')return '目前已確認不是廢（污）水。請重新確認是否其實屬污泥、酸鹼廢液、垃圾或其他污染物；若確無其他管制物質，可補足現場證據後結束本次流程。';
      return '認水／認污染物：確認來源、作業關聯、接觸物及污染性。從工廠流出的水不當然就是廢水，其他污染物則另走棄置或設備疏漏支線。';
    }
    if(step===4)return '沿產生點找收集槽、集水井、處理設備與連接管線；建議拍攝全景與各單元銜接關係。';
    if(step===5){
      if(input.waterMatterType&&input.waterMatterType!=='wastewater'&&input.waterMatterType!=='unknown'){
        if(!input.waterDumpingConfirmed||input.waterDumpingConfirmed==='unknown')return '確認這批污染物實際怎麼處理：是否直接載運／傾倒／棄置於水體或沿岸，並固定位置、數量、行為方式與現場照片。';
        if(input.waterDumpingConfirmed==='yes')return '已發現棄置態樣：接著確認是否位於水污染管制區，以及公告指定水體與沿岸管制距離。';
        return '目前未確認棄置行為；仍要確認污染物最終合法處理去向及是否另有設備疏漏。';
      }
      if(input.fieldRouteTraced==='no'||input.waterDestination==='unknown')return '追水不要停：由產生點沿管線／溝渠逐段追查，必要時比對水量、槽體液位、排水圖資或示蹤，直到能說明最終去向。';
      if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&facts.surfaceWaterConfirmed!=='yes')return '道路側溝不能直接等於地面水體。固定側溝位置、水流方向、上下游，並查排水功能、下游連通及官方圖資。';
      return '已找到去向後，固定出口、上下游及與處理流程的連接證據，再確認是否真的有向外排放。';
    }
    if(step===6){
      if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&facts.surfaceWaterConfirmed!=='yes')return '道路側溝不能直接等於地面水體。先確認排水功能、下游流向與排水體系連通，再判斷是否進入排放許可與放流水支線。';
      if(!input.waterActualDischarge||input.waterActualDischarge==='unknown')return '先確認是否真的有廢（污）水向外排出。可用當場水流、影片、監視影像、水位變化、操作紀錄或其他客觀證據固定排放事實。';
      if(input.waterActualDischarge==='no')return '未看到排放時，仍需確認廢水目前是貯留、回收、納管、委外或其他方式；必要時以水量平衡與操作紀錄補強。';
      if(input.waterDestination==='surfaceWater')return '已見排放地面水體：先拍／錄排放行為與放流口，確認許可及放流口，再評估採樣。';
      return '固定實際排放方式、出口與去向，並與核准資料比對。';
    }
    if(step===7){
      if(input.waterArticle28Scenario==='yes')return '若為槽體／管線破裂、溢流等事故，先控制污染再談告發：確認是否為輸送／貯存設備、疏漏原因、污染流向、維護防範、止漏措施、通報時間與下游影響。';
      return '確認現場是否另有漏洩、溢流或設備事故；人為開閥／私管主動排放與設備疏漏應分開判斷。';
    }
    if(step===8)return '採樣前先確認樣品代表性與位置。水黑、臭、有泡沫只能作現場觀察，不能單獨取代放流水檢測結果。';
    if(step===9)return '補證據：至少把「來源－收集／處理－管線－出口／去向」串起來。若要認定側溝為地面水體，另補上下游連通與排水系統證據。';
    if(input.waterInvestigationComplete!=='yes')return '最後檢查是否還有關鍵水路、許可、採樣或事故事實未確認；未確認的必要要件應保留為「？」。';
    return '現場流程已完成。先查看下方初步研判；需要補查§18、申報、繞流／稀釋等構成要件時，按下「繼續案件研判」，本次已填事實會直接帶入，不需重新填寫。';
  }
  function evidenceSummary(input){
    const list=Array.isArray(input.waterEvidenceTypes)?input.waterEvidenceTypes:[];
    const names=list.filter(x=>evidenceLabels[x]).map(x=>evidenceLabels[x]);
    const need=[];
    if(input.waterActualDischarge==='yes'&&!list.includes('flowVideo'))need.push('建議補水流影片');
    if(input.waterActualDischarge==='yes'&&!list.includes('outletPhoto'))need.push('建議補排放口照片');
    if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&!list.includes('downstreamPhoto'))need.push('建議補側溝上下游／流向照片');
    if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&!list.includes('drainageMap'))need.push('若地面水體要件仍有疑義，建議補排水圖資或其他連通證據');
    if(input.waterSampleTaken==='yes'&&!list.includes('sampling'))need.push('建議補完整採樣紀錄');
    const have=names.length?'已固定：'+names.join('、'):'目前尚未勾選已固定證據';
    return have+(need.length?'\n待補強：'+need.join('；'):'\n目前未產生額外固定證據提醒。');
  }
  function prepare(input={}){
    const out={...input};
    normaliseSources(out);
    const base=root.TemplateWorkflows.waterMain.prepare(out);
    Object.assign(out,base);
    const facts=root.WaterFacts.build(out);

    out.fieldShowSubjectConfirmed=bool(out.waterSubjectType==='business');
    out.fieldShowOperation=bool(!!out.waterSubjectType&&(out.waterSubjectType!=='business'||!!out.waterSubjectConfirmed));
    out.fieldShowProcess=bool(out.fieldShowOperation==='yes'&&!!out.fieldOperationStatus);
    out.fieldShowWaterUse=bool(out.fieldShowProcess==='yes'&&!!out.fieldProcessObserved);
    out.fieldShowMatter=bool(out.fieldShowWaterUse==='yes'&&!!out.fieldWaterUseObserved);
    out.fieldShowWastewater=bool(out.fieldShowMatter==='yes'&&out.waterMatterType==='wastewater');
    out.fieldShowSources=bool(out.fieldShowWastewater==='yes'&&out.waterWastewaterStatus==='yes');
    out.fieldShowCollection=bool(out.fieldShowSources==='yes'&&Array.isArray(out.waterSourceTypes)&&out.waterSourceTypes.length>0);
    out.fieldShowTreatment=bool(out.fieldShowCollection==='yes'&&!!out.fieldCollectionStatus);
    out.fieldShowRoute=bool(out.fieldShowTreatment==='yes'&&!!out.waterTreatmentFacilityApplicable);
    out.fieldShowDestination=bool(out.fieldShowRoute==='yes'&&!!out.fieldRouteTraced);
    out.fieldShowSurface=bool(out.fieldShowDestination==='yes'&&out.waterDestination==='surfaceWater');
    out.fieldShowDitch=bool(out.fieldShowSurface==='yes'&&out.waterSurfaceType==='roadsideDitch');
    out.fieldShowDischarge=bool(out.fieldShowDestination==='yes'&&!!out.waterDestination);
    out.fieldShowDumping=bool(out.fieldShowMatter==='yes'&&!!out.waterMatterType&&out.waterMatterType!=='wastewater'&&out.waterMatterType!=='unknown');
    out.fieldShowDumpingDetails=bool(out.fieldShowDumping==='yes'&&out.waterDumpingConfirmed==='yes');
    out.fieldShowPermit=bool(facts.subjectIsBusiness==='yes'&&facts.actualDischargeConfirmed==='yes'&&facts.surfaceWaterConfirmed==='yes');
    const wastewaterIncidentReady=out.waterMatterType==='wastewater'&&((out.waterWastewaterStatus==='yes'&&out.fieldShowDischarge==='yes'&&!!out.waterActualDischarge)||out.waterWastewaterStatus==='no');
    const pollutantIncidentReady=out.fieldShowDumping==='yes'&&!!out.waterDumpingConfirmed;
    out.fieldShowIncident=bool(wastewaterIncidentReady||pollutantIncidentReady);
    out.fieldShowIncidentDetails=bool(out.fieldShowIncident==='yes'&&out.waterArticle28Scenario==='yes');
    out.fieldShowLeakPolluted=bool(out.fieldShowIncidentDetails==='yes'&&out.waterTransportStorageEquipmentConfirmed&&out.waterLeakCause&&out.waterLeakCause!=='humanDischarge');
    out.fieldShowLeakPrevention=bool(out.fieldShowLeakPolluted==='yes'&&out.waterLeakRiskToWaterBodyConfirmed==='yes');
    out.fieldShowEmergency=bool((out.fieldShowLeakPolluted==='yes'&&out.waterLeakPollutedWaterBody==='yes')||out.waterSevereHazardRiskConfirmed==='yes');
    out.fieldShowSampling=bool(out.waterDestination==='surfaceWater'&&out.waterActualDischarge==='yes'&&facts.surfaceWaterConfirmed==='yes');
    out.fieldShowSampleDetails=bool(out.fieldShowSampling==='yes'&&out.waterSampleTaken==='yes');
    out.fieldShowLab=bool(out.fieldShowSampleDetails==='yes'&&out.waterSampleRepresentative==='yes'&&out.waterSampleBeforeReceivingWater==='yes');
    out.fieldShowEffluent=bool(out.fieldShowLab==='yes'&&out.waterLabResultAvailable==='yes');
    out.fieldShowEvidence=bool(out.fieldShowIncident==='yes'&&!!out.waterArticle28Scenario&&(out.fieldShowSampling!=='yes'||!!out.waterSampleTaken));
    out.fieldShowComplete=bool(out.fieldShowEvidence==='yes'&&Array.isArray(out.waterEvidenceTypes)&&out.waterEvidenceTypes.length>0);
    out.fieldShowAssessment=bool(out.fieldShowComplete==='yes'&&out.waterInvestigationComplete==='yes');

    const step=currentStep(out);
    out.fieldProgressText=`STEP ${step} / 10｜${['','認人','看營運／製程','認水','找收集／處理','追水','確認排放','查事故','採樣','補證據','完成研判'][step]}`;
    out.fieldCurrentGuidanceText=guidance(out,facts);
    out.fieldEvidenceSummaryText=evidenceSummary(out);
    out.fieldFinalConclusionText=out.waterFinalConclusionText||'';
    out.fieldRulesOverviewText=out.waterRulesOverviewText||'';
    return out;
  }
  function resetChange(previous={},current={}){
    const next={...current};
    const clear=keys=>keys.forEach(k=>{next[k]=Array.isArray(previous[k])?[]:'';});
    if(previous.waterSubjectType!==current.waterSubjectType)clear(['waterSubjectConfirmed','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterSubjectConfirmed!==current.waterSubjectConfirmed)clear(['fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldOperationStatus!==current.fieldOperationStatus)clear(['fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldProcessObserved!==current.fieldProcessObserved)clear(['fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldWaterUseObserved!==current.fieldWaterUseObserved)clear(['waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterMatterType!==current.waterMatterType)clear(['waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterSampleTaken','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterWastewaterStatus!==current.waterWastewaterStatus)clear(['waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterSampleTaken','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldCollectionStatus!==current.fieldCollectionStatus)clear(['waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterTreatmentFacilityApplicable!==current.waterTreatmentFacilityApplicable)clear(['waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldRouteTraced!==current.fieldRouteTraced)clear(['waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterSampleTaken','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterDestination!==current.waterDestination)clear(['waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterSurfaceType!==current.waterSurfaceType)clear(['waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterSurfaceWaterConfirmed!==current.waterSurfaceWaterConfirmed)clear(['waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterDumpingConfirmed!==current.waterDumpingConfirmed)clear(['waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterControlZoneConfirmed!==current.waterControlZoneConfirmed&&current.waterControlZoneConfirmed==='no')clear(['waterDesignatedWaterRangeConfirmed']);
    else if(previous.waterActualDischarge!==current.waterActualDischarge)clear(['waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterArticle28Scenario!==current.waterArticle28Scenario)clear(['waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterTransportStorageEquipmentConfirmed!==current.waterTransportStorageEquipmentConfirmed)clear(['waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterLeakCause!==current.waterLeakCause)clear(['waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterLeakRiskToWaterBodyConfirmed!==current.waterLeakRiskToWaterBodyConfirmed)clear(['waterMaintenancePreventionTaken']);
    else if(previous.waterLeakPollutedWaterBody!==current.waterLeakPollutedWaterBody||previous.waterSevereHazardRiskConfirmed!==current.waterSevereHazardRiskConfirmed)clear(['waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterSampleTaken!==current.waterSampleTaken)clear(['waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterSampleRepresentative!==current.waterSampleRepresentative||previous.waterSampleBeforeReceivingWater!==current.waterSampleBeforeReceivingWater)clear(['waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterLabResultAvailable!==current.waterLabResultAvailable)clear(['waterEffluentExceeded']);
    else if(JSON.stringify(previous.waterEvidenceTypes||[])!==JSON.stringify(current.waterEvidenceTypes||[]))clear(['waterInvestigationComplete']);
    return next;
  }
  root.TemplateWorkflows.waterField={prepare,resetChange};
})(typeof window==='undefined'?globalThis:window);
