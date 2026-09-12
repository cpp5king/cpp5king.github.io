(function(root){
  'use strict';
  const bool=v=>v?'yes':'no';

  function apply(input,facts,out={}){
    const wastewaterPath=facts.matterType==='wastewater'||(!facts.matterType&&!!input.waterWastewaterStatus);
    out.waterNoDrafts=input.waterInvestigationComplete==='yes'?'no':'yes';
    out.waterShowSubjectConfirmed=bool(input.waterSubjectType==='business');
    out.waterShowIndustry=bool(facts.subjectIsBusiness==='yes');
    out.waterShowIndustryArticle9=bool(out.waterShowIndustry==='yes'&&['mining','stoneExtraction','stoneProcessing','readyMix','earthworkDump','construction'].includes(input.waterIndustryType));
    out.waterShowIndustryConstruction=bool(out.waterShowIndustry==='yes'&&input.waterIndustryType==='construction');
    out.waterShowIndustryLivestock=bool(out.waterShowIndustry==='yes'&&input.waterIndustryType==='livestock');
    out.waterShowIndustryLivestockFertilizer=bool(out.waterShowIndustryLivestock==='yes'&&input.waterLivestockFertilizerUse==='yes');
    out.waterShowArticle13Details=bool(facts.subjectIsBusiness==='yes'&&input.waterArticle13NewOrChangeConfirmed==='yes');
    out.waterShowMatterType=bool(!!input.waterSubjectType);
    out.waterShowWastewater=bool(wastewaterPath);
    out.waterShowArticle14=bool(input.waterSubjectType==='business'&&wastewaterPath);
    out.waterShowDischarge=bool(out.waterShowWastewater==='yes'&&facts.wastewaterConfirmed==='yes');
    out.waterShowDestination=bool(out.waterShowWastewater==='yes'&&facts.wastewaterConfirmed==='yes');
    out.waterShowSurfaceDetails=bool(out.waterShowDestination==='yes'&&input.waterDestination==='surfaceWater');
    out.waterShowDitchDetails=bool(out.waterShowSurfaceDetails==='yes'&&input.waterSurfaceType==='roadsideDitch');
    out.waterShowPermit=bool(facts.subjectIsBusiness==='yes'&&facts.actualDischargeConfirmed==='yes'&&facts.surfaceWaterConfirmed==='yes');

    out.waterShowStorageDetails=bool(facts.article20SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&input.waterDestination==='storage');
    out.waterShowStorageMismatch=bool(out.waterShowStorageDetails==='yes'&&input.waterStorageActivityConfirmed==='yes'&&input.waterStoragePermit==='valid');

    out.waterShowArticle7=bool(facts.article7SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes'&&facts.surfaceWaterConfirmed==='yes');
    out.waterShowSampleDetails=bool(out.waterShowArticle7==='yes'&&input.waterSampleTaken==='yes');
    out.waterShowLabDetails=bool(out.waterShowSampleDetails==='yes'&&input.waterSampleRepresentative==='yes'&&input.waterSampleBeforeReceivingWater==='yes'&&input.waterApplicableStandardConfirmed==='yes');
    out.waterShowEffluentResult=bool(out.waterShowLabDetails==='yes'&&input.waterLabResultAvailable==='yes');

    out.waterShowArticle181=bool(facts.article181SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes');
    out.waterShowBypassRoute=bool(out.waterShowArticle181==='yes'&&facts.actualDischargeConfirmed==='yes');
    out.waterShowBypassQuestion=bool(out.waterShowBypassRoute==='yes'&&input.waterApprovedRouteConfirmed==='yes'&&input.waterActualRouteConfirmed==='yes');
    out.waterShowBypassEmergency=bool(out.waterShowBypassQuestion==='yes'&&input.waterBypassConfirmed==='yes');
    out.waterShowDilutionDetails=bool(out.waterShowArticle181==='yes'&&input.waterDilutionObserved==='yes');
    out.waterShowDilutionMismatch=bool(out.waterShowDilutionDetails==='yes'&&input.waterDilutionPermit==='valid');
    out.waterShowDilutionEmergency=bool(out.waterShowDilutionDetails==='yes'&&input.waterRequiresTreatmentToMeetStandard==='yes'&&input.waterMixedWithNoTreatmentNeededWater==='yes'&&['none','expired','unknown'].includes(input.waterDilutionPermit));
    out.waterShowTreatmentDetails=bool(out.waterShowArticle181==='yes'&&input.waterTreatmentFacilityApplicable==='yes');
    out.waterShowArticle18Noncompliance=bool(facts.subjectIsBusiness==='yes'&&input.waterArticle18SpecificDutyConfirmed==='yes');

    out.waterShowArticle28=bool(facts.article28SubjectEligible==='yes'&&facts.article28MatterEligible==='yes');
    out.waterShowArticle28Details=bool(out.waterShowArticle28==='yes'&&input.waterArticle28Scenario==='yes');
    out.waterShowArticle28LeakChecks=bool(out.waterShowArticle28Details==='yes'&&!!input.waterLeakCause&&input.waterLeakCause!=='humanDischarge');
    out.waterShowArticle28Prevention=bool(out.waterShowArticle28LeakChecks==='yes'&&input.waterLeakRiskToWaterBodyConfirmed==='yes');
    out.waterShowArticle28Emergency=bool(out.waterShowArticle28LeakChecks==='yes'&&input.waterLeakPollutedWaterBody==='yes');

    out.waterShowArticle27=bool(facts.article27SubjectEligible==='yes'&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes');
    out.waterShowArticle27Actions=bool((out.waterShowArticle27==='yes'&&input.waterSevereHazardRiskConfirmed==='yes')||out.waterShowArticle28Emergency==='yes');

    out.waterShowArticle32=bool(wastewaterPath&&facts.wastewaterConfirmed==='yes'&&facts.actualDischargeConfirmed==='yes'&&['soil','groundwater'].includes(input.waterDestination));
    out.waterShowSoilPermit=bool(out.waterShowArticle32==='yes'&&input.waterDestination==='soil');
    out.waterShowGroundwaterCheck=bool(out.waterShowArticle32==='yes'&&input.waterDestination==='groundwater');

    out.waterShowArticle30=bool(facts.article30MatterEligible==='yes');
    out.waterShowArticle30Details=bool(out.waterShowArticle30==='yes'&&input.waterDumpingConfirmed==='yes');

    out.waterShowReportingNoncompliance=bool(facts.article22SubjectEligible==='yes'&&input.waterArticle22ReportingDutyConfirmed==='yes');
    out.waterShowReportedMismatch=bool(out.waterShowReportingNoncompliance==='yes');
    out.waterShowFalseDetails=bool(out.waterShowReportedMismatch==='yes'&&input.waterReportedDataMismatch==='yes');
    out.waterShowArticle26Obstruction=bool(facts.article26TargetEligible==='yes'&&input.waterArticle26InspectionBasisConfirmed==='yes');
    out.waterShowArticle59Details=bool(out.waterShowArticle181==='yes'&&input.waterFacilityFailureConfirmed==='yes');
    out.waterShowPolluter=bool(input.waterSurfaceWaterPollutionEventConfirmed==='yes');
    out.waterShowAssessment=bool(!!input.waterSubjectType);

    out.waterShowSublawCore=bool(facts.sublawSubjectEligible==='yes');
    out.waterShowSublawRainException=bool(out.waterShowSublawCore==='yes'&&input.waterSublawWastewaterRainwaterCombined==='yes');
    out.waterShowSublawRunoff=bool(out.waterShowSublawCore==='yes'&&input.waterSublawRunoffArticle8Applicable==='yes');
    out.waterShowSublawOutsource=bool(out.waterShowSublawCore==='yes'&&input.waterDestination==='outsourced');
    out.waterShowSublawStorage=bool(out.waterShowSublawCore==='yes'&&input.waterDestination==='storage');
    out.waterShowSublawReuse=bool(out.waterShowSublawCore==='yes'&&input.waterDestination==='reuse');
    out.waterShowSublawOutlet=bool(out.waterShowSublawCore==='yes'&&facts.sublawOutletApplicable==='yes');
    out.waterShowSublawOutletMixing=bool(out.waterShowSublawOutlet==='yes'&&input.waterSublawOutletIsManhole==='yes');
    out.waterShowSublawMeter=bool(out.waterShowSublawCore==='yes'&&input.waterSublawMeterApplicable==='yes');
    out.waterShowSublawReporting=bool(out.waterShowSublawCore==='yes'&&input.waterArticle22ReportingDutyConfirmed==='yes');
    return out;
  }

  // 目前 4.3 的完整案件研判以 show flags 表示流程階段；不新增對外欄位，避免改變既有輸出。
  function stage(input,facts,out={}){
    const view=apply(input,facts,{...out});
    if(view.waterShowAssessment!=='yes')return 'subject';
    if(view.waterShowWastewater==='yes'&&view.waterShowDestination!=='yes')return 'water';
    if(view.waterShowDestination==='yes'&&view.waterShowArticle7!=='yes'&&view.waterShowArticle181!=='yes')return 'destination';
    return 'assessment';
  }


  function currentFieldStep(input){
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

  function fieldGuidance(input,facts){
    const step=currentFieldStep(input);
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

  root.WaterWorkflow={apply,stage,currentFieldStep,fieldGuidance};
})(typeof window==='undefined'?globalThis:window);
