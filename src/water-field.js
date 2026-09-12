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
    if(!out.fieldSourceMode&&out.waterSubjectType)out.fieldSourceMode='known';
    const base=root.TemplateWorkflows.waterMain.prepare(out);
    Object.assign(out,base);
    const facts=root.WaterFacts.build(out);

    out.fieldShowSourceMode='yes';
    out.fieldShowUnknownObserved=bool(out.fieldSourceMode==='unknown');
    out.fieldShowUnknownSigns=bool(out.fieldShowUnknownObserved==='yes'&&out.fieldUnknownWaterObserved==='yes');
    out.fieldShowUnknownFlow=bool(out.fieldShowUnknownSigns==='yes'&&Array.isArray(out.fieldUnknownWaterSigns)&&out.fieldUnknownWaterSigns.length>0);
    out.fieldShowUnknownTrace=bool(out.fieldShowUnknownFlow==='yes'&&out.fieldUnknownFlowDirectionConfirmed==='yes');
    out.fieldShowUnknownOutlet=bool(out.fieldShowUnknownTrace==='yes'&&!!out.fieldUnknownUpstreamTraceStatus&&!!out.fieldUnknownBranchStatus);
    out.fieldShowUnknownConnection=bool(out.fieldShowUnknownOutlet==='yes'&&out.fieldUnknownOutletFound==='yes');
    out.fieldShowKnownSubject=bool(out.fieldSourceMode==='known'||root.WaterWorkflow.unknownTraceReadyForSubject(out));
    out.fieldShowSubjectConfirmed=bool(out.fieldShowKnownSubject==='yes'&&out.waterSubjectType==='business');
    out.fieldShowOperation=bool(out.fieldShowKnownSubject==='yes'&&!!out.waterSubjectType&&(out.waterSubjectType!=='business'||!!out.waterSubjectConfirmed));
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
    const unknownTraceEvidence=out.fieldSourceMode==='unknown'&&!!out.fieldUnknownWaterObserved;
    out.fieldShowEvidence=bool((out.fieldShowIncident==='yes'&&!!out.waterArticle28Scenario&&(out.fieldShowSampling!=='yes'||!!out.waterSampleTaken))||unknownTraceEvidence);
    out.fieldShowComplete=bool(out.fieldShowEvidence==='yes'&&Array.isArray(out.waterEvidenceTypes)&&out.waterEvidenceTypes.length>0);
    out.fieldShowAssessment=bool(out.waterInvestigationComplete==='yes');
    out.fieldCanHandoff=bool(root.WaterWorkflow.fieldCanHandoff(out));
    out.fieldEmergencyActive=bool(root.WaterWorkflow.fieldEmergencyActive(out));
    out.fieldLiveDecisionText=root.WaterWorkflow.fieldLiveDecision(out,facts);
    out.fieldProgressText=root.WaterWorkflow.fieldProgress(out);
    out.fieldCurrentGuidanceText=root.WaterWorkflow.fieldGuidance(out,facts);
    out.fieldEvidenceSummaryText=evidenceSummary(out);
    out.fieldNoDrafts=out.waterInvestigationComplete==='yes'?'no':'yes';
    if(out.waterInvestigationComplete==='yes'&&out.fieldSourceMode==='unknown'&&out.fieldUnknownSourceConnectionConfirmed!=='yes'){
      out.fieldFinalConclusionText='C｜事證不足\n本次查察尚未建立異常水與特定污染來源／行為人的客觀連結，現階段不足以認定特定對象違反水污染防治法。可依陳情主要時段、流向、岔流、排水圖資或再次追查補強。';
    }else out.fieldFinalConclusionText=out.waterFinalConclusionText||'';
    out.fieldRulesOverviewText=out.waterRulesOverviewText||'';
    out.waterRecordDraftText=out.waterRecordDraftText||'';
    out.waterReplyDraftText=out.waterReplyDraftText||'';
    return out;
  }
  function resetChange(previous={},current={}){
    const next={...current};
    const clear=keys=>keys.forEach(k=>{next[k]=Array.isArray(previous[k])?[]:'';});
    if(previous.fieldSourceMode!==current.fieldSourceMode)clear(['fieldUnknownWaterObserved','fieldUnknownWaterSigns','fieldUnknownFlowDirectionConfirmed','fieldUnknownUpstreamTraceStatus','fieldUnknownBranchStatus','fieldUnknownOutletFound','fieldUnknownSourceConnectionConfirmed','waterSubjectType','waterSubjectConfirmed','waterIndustryType','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldUnknownWaterObserved!==current.fieldUnknownWaterObserved)clear(['fieldUnknownWaterSigns','fieldUnknownFlowDirectionConfirmed','fieldUnknownUpstreamTraceStatus','fieldUnknownBranchStatus','fieldUnknownOutletFound','fieldUnknownSourceConnectionConfirmed','waterSubjectType','waterSubjectConfirmed','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldUnknownFlowDirectionConfirmed!==current.fieldUnknownFlowDirectionConfirmed)clear(['fieldUnknownUpstreamTraceStatus','fieldUnknownBranchStatus','fieldUnknownOutletFound','fieldUnknownSourceConnectionConfirmed','waterSubjectType','waterSubjectConfirmed','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldUnknownOutletFound!==current.fieldUnknownOutletFound)clear(['fieldUnknownSourceConnectionConfirmed','waterSubjectType','waterSubjectConfirmed','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.fieldUnknownSourceConnectionConfirmed!==current.fieldUnknownSourceConnectionConfirmed)clear(['waterSubjectType','waterSubjectConfirmed','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','fieldRouteTraced','waterDestination','waterActualDischarge','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterSubjectType!==current.waterSubjectType)clear(['waterSubjectConfirmed','waterIndustryType','waterIndustryRainProtectionStatus','waterIndustrySedimentationBasinPresent','waterIndustrySedimentationCapacityCompliant','waterIndustrySedimentationFreeboardCompliant','waterIndustryMaintenanceRecordsCompliant','waterConstructionReductionPlanApprovedBeforeWork','waterConstructionImplementedApprovedPlan','waterLivestockFertilizerUse','waterLivestockFertilizerPlanApproved','waterLivestockFertilizerMatchesPlan','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
    else if(previous.waterIndustryType!==current.waterIndustryType)clear(['waterIndustryRainProtectionStatus','waterIndustrySedimentationBasinPresent','waterIndustrySedimentationCapacityCompliant','waterIndustrySedimentationFreeboardCompliant','waterIndustrySedimentationImpermeableCompliant','waterIndustryMaintenanceRecordsCompliant','waterConstructionReductionPlanApprovedBeforeWork','waterConstructionImplementedApprovedPlan','waterLivestockFertilizerUse','waterLivestockFertilizerPlanApproved','waterLivestockFertilizerMatchesPlan']);
    else if(previous.waterLivestockFertilizerUse!==current.waterLivestockFertilizerUse)clear(['waterLivestockFertilizerPlanApproved','waterLivestockFertilizerMatchesPlan']);
    else if(previous.waterSubjectConfirmed!==current.waterSubjectConfirmed)clear(['waterIndustryType','waterIndustryRainProtectionStatus','waterIndustrySedimentationBasinPresent','waterIndustrySedimentationCapacityCompliant','waterIndustrySedimentationFreeboardCompliant','waterIndustrySedimentationImpermeableCompliant','waterIndustryMaintenanceRecordsCompliant','waterConstructionReductionPlanApprovedBeforeWork','waterConstructionImplementedApprovedPlan','waterLivestockFertilizerUse','waterLivestockFertilizerPlanApproved','waterLivestockFertilizerMatchesPlan','fieldOperationStatus','fieldProcessObserved','fieldWaterUseObserved','waterMatterType','waterWastewaterStatus','waterSourceTypes','fieldCollectionStatus','waterTreatmentFacilityApplicable','waterTreatmentOperatingNormally','fieldRouteTraced','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterActualDischarge','waterDischargePermit','waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed','waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterSevereHazardRiskConfirmed','waterEmergencyActionTaken','waterThreeHourNotice','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterLabResultAvailable','waterEffluentExceeded','waterEvidenceTypes','waterInvestigationComplete']);
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
  function endEarly(input={}){return root.WaterWorkflow.fieldEnd(input);}
  function canHandoff(input={}){return root.WaterWorkflow.fieldCanHandoff(input);}
  function emergencyActive(input={}){return root.WaterWorkflow.fieldEmergencyActive(input);}
  root.TemplateWorkflows.waterField={prepare,resetChange,endEarly,canHandoff,emergencyActive};
})(typeof window==='undefined'?globalThis:window);
