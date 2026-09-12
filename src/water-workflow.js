(function(root){
  'use strict';
  const bool=v=>v?'yes':'no';

  function apply(input,facts,out={}){
    const wastewaterPath=facts.matterType==='wastewater'||(!facts.matterType&&!!input.waterWastewaterStatus);
    out.waterNoDrafts=input.waterInvestigationComplete==='yes'?'no':'yes';
    out.waterShowSubjectConfirmed=bool(input.waterSubjectType==='business');
    out.waterShowIndustryChoice=bool(facts.subjectIsBusiness==='yes');
    out.waterShowIndustry=bool(out.waterShowIndustryChoice==='yes'&&(input.waterIndustryCheckMode==='check'||(!input.waterIndustryCheckMode&&!!input.waterIndustryType)));
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

  function stage(input,facts,out={}){
    const view=apply(input,facts,{...out});
    if(view.waterShowAssessment!=='yes')return 'subject';
    if(view.waterShowWastewater==='yes'&&view.waterShowDestination!=='yes')return 'water';
    if(view.waterShowDestination==='yes'&&view.waterShowArticle7!=='yes'&&view.waterShowArticle181!=='yes')return 'destination';
    return 'assessment';
  }

  function fieldSourceMode(input={}){
    if(input.fieldSourceMode)return input.fieldSourceMode;
    return input.waterSubjectType?'known':'';
  }

  function unknownTraceReadyForSubject(input={}){
    return fieldSourceMode(input)==='unknown'&&input.fieldUnknownSourceConnectionConfirmed==='yes';
  }

  function fieldCanHandoff(input={}){
    const sourceReady=fieldSourceMode(input)==='known'||unknownTraceReadyForSubject(input);
    return !!(sourceReady&&input.waterSubjectType&&input.waterSubjectType!=='unknown');
  }

  function fieldEmergencyActive(input={}){
    return input.waterSevereHazardRiskConfirmed==='yes'||input.waterLeakPollutedWaterBody==='yes';
  }

  function fieldLiveDecision(input={},facts={}){
    const mode=fieldSourceMode(input);
    if(fieldEmergencyActive(input))return '【目前判定】\nD｜重大／緊急污染風險\n優先控制污染、保護下游並確認緊急應變與通報；現場流程可暫停，先處置再補查。';
    if(!mode)return '【目前判定】\n? 尚未選擇案件起點\n先確認本案是「已知污染來源」或「只看到異常水／污染源不明」。';
    if(mode==='unknown'){
      if(input.fieldUnknownWaterObserved==='no')return '【目前判定】\n? 本次到場未發現陳情所述異常水體\n可補陳情時間、照片、流向或上游可能來源；若仍無其他事證，可結束本次查察。';
      if(input.fieldUnknownWaterObserved!=='yes')return '【目前判定】\n? 是否存在異常水體尚待確認\n先固定陳情位置及現況。';
      if(input.fieldUnknownFlowDirectionConfirmed!=='yes')return '【目前判定】\n? 已看到異常水，但流向尚未確認\n先判斷水往哪裡流，再往上游逆向追查。';
      if(input.fieldUnknownOutletFound!=='yes')return '【目前判定】\n? 污染來源尚未確認\n持續往上游追水；遇岔流時逐支排除，找出異常水首次出現的區段與疑似出口。';
      if(input.fieldUnknownSourceConnectionConfirmed!=='yes')return '【目前判定】\n? 已找到疑似出口，但尚未建立與場所／行為人的來源連結\n應確認管線、集水井、場內溝渠、示蹤、操作前後水流變化或其他連通證據。';
      if(!input.waterSubjectType||input.waterSubjectType==='unknown')return '【目前判定】\n✓ 已建立疑似污染來源連結\n下一步確認污染行為人／管制主體；確認後可直接進入案件研判或繼續來源稽查。';
    }
    if(fieldCanHandoff(input)){
      const legal=(input.waterFinalConclusionText||'').split('\n')[0];
      return `【目前判定】\n✓ 已確認可進入案件研判${legal?`\n後台目前：${legal}`:''}\n流程仍可繼續補證，也可直接轉完整案件研判。`;
    }
    if(input.waterSubjectType==='unknown')return '【目前判定】\n? 管制主體尚未確認\n目前可以繼續查證；尚不宜直接套用事業排放許可等規則。';
    return '【目前判定】\n? 仍在查證\n依目前事實繼續完成下一個必要確認事項；流程不是強制問卷，可隨時結束本次查察。';
  }

  function fieldPermitCheckComplete(input={}){
    if(input.waterSubjectType!=='business'&&input.waterSubjectType!=='sewerSystem')return true;
    if(input.waterSubjectType==='business'&&input.waterSubjectConfirmed!=='yes')return true;
    if(input.waterWastewaterStatus!=='yes')return true;
    const mode=input.waterPermitCheckMode;
    if(!mode)return false;
    if(mode==='skip')return true;
    if(mode==='quick'&&['no','unknown'].includes(input.waterPermitQuickDifferenceObserved))return true;
    if(mode==='quick'&&input.waterPermitQuickDifferenceObserved!=='yes')return false;
    const reference=input.waterPermitReferenceStatus;
    if(!reference)return false;
    if(['unavailable','unknown'].includes(reference))return true;
    const keys=['waterPermitSourceCompare','waterPermitProcessCompare','waterPermitOutletCompare','waterPermitDestinationCompare','waterPermitFacilityCompare','waterPermitOperationCompare'];
    if(keys.some(key=>!input[key]))return false;
    const hasMismatch=keys.some(key=>input[key]==='mismatch');
    if(hasMismatch&&!String(input.waterPermitMismatchDetail||'').trim())return false;
    return true;
  }

  function currentFieldStep(input={}){
    const mode=fieldSourceMode(input);
    if(!mode)return 1;
    if(mode==='unknown'){
      if(!input.fieldUnknownWaterObserved)return 2;
      if(input.fieldUnknownWaterObserved==='no')return (!Array.isArray(input.waterEvidenceTypes)||!input.waterEvidenceTypes.length)?15:16;
      if(input.fieldUnknownWaterObserved==='yes'&&(!Array.isArray(input.fieldUnknownWaterSigns)||!input.fieldUnknownWaterSigns.length))return 2;
      if(input.fieldUnknownWaterObserved==='yes'&&!input.fieldUnknownFlowDirectionConfirmed)return 3;
      if(input.fieldUnknownFlowDirectionConfirmed==='yes'&&!input.fieldUnknownUpstreamTraceStatus)return 4;
      if(input.fieldUnknownFlowDirectionConfirmed==='yes'&&!input.fieldUnknownBranchStatus)return 4;
      if(input.fieldUnknownFlowDirectionConfirmed==='yes'&&!input.fieldUnknownOutletFound)return 5;
      if(input.fieldUnknownOutletFound==='yes'&&!input.fieldUnknownSourceConnectionConfirmed)return 6;
      if(input.fieldUnknownSourceConnectionConfirmed!=='yes')return 6;
    }
    if(!input.waterSubjectType)return 7;
    if(input.waterSubjectType==='business'&&!input.waterSubjectConfirmed)return 7;
    if(!input.fieldOperationStatus||!input.fieldProcessObserved||!input.fieldWaterUseObserved)return 8;
    if(!input.waterMatterType)return 9;
    if(input.waterMatterType==='wastewater'){
      if(!input.waterWastewaterStatus)return 9;
      if(input.waterWastewaterStatus==='yes'&&(!Array.isArray(input.waterSourceTypes)||!input.waterSourceTypes.length))return 9;
      if(input.waterWastewaterStatus==='yes'&&!input.fieldCollectionStatus)return 10;
      if(input.waterWastewaterStatus==='yes'&&!input.fieldRouteTraced)return 11;
      if(input.waterWastewaterStatus==='yes'&&!input.waterDestination)return 11;
      if(input.waterWastewaterStatus==='yes'&&input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&input.waterSurfaceWaterConfirmed!=='yes')return 11;
      if(input.waterWastewaterStatus==='yes'&&!input.waterActualDischarge)return 12;
    }else if(input.waterMatterType!=='unknown'){
      if(!input.waterDumpingConfirmed)return 11;
      if(input.waterDumpingConfirmed==='yes'&&(!input.waterControlZoneConfirmed||!input.waterDesignatedWaterRangeConfirmed))return 11;
    }
    if(!fieldPermitCheckComplete(input))return 12;
    if(!input.waterActualDischarge)return 13;
    if(!input.waterArticle28Scenario)return 14;
    if(input.waterArticle28Scenario==='yes'&&!input.waterLeakCause)return 14;
    if(input.waterDestination==='surfaceWater'&&input.waterActualDischarge==='yes'&&!input.waterSampleTaken)return 15;
    if(!Array.isArray(input.waterEvidenceTypes)||!input.waterEvidenceTypes.length)return 16;
    return 17;
  }

  const fieldStepLabels={
    1:'選案件起點',2:'固定異常水現況',3:'判斷流向',4:'逆向追水／排除岔流',5:'找疑似出口',6:'建立來源連結',7:'認人',8:'看營運／製程',9:'認水／污染物',10:'找收集／處理',11:'追水／追去向',12:'對許可／水措',13:'確認排放',14:'查事故',15:'採樣',16:'補證據',17:'完成／研判'
  };
  function fieldProgress(input={}){
    const step=currentFieldStep(input);
    return `STEP ${step} / 17｜${fieldStepLabels[step]||'現場查證'}`;
  }

  function fieldGuidance(input,facts){
    const step=currentFieldStep(input);
    if(step===1)return '先選案件起點：若已知被陳情業者／場所，走「污染源已知」；若只有看到異常水，走「污染源不明」並從水逆向追查。';
    if(step===2){
      if(input.fieldUnknownWaterObserved==='no')return '本次未看到異常水，不代表已證明沒有污染。先固定陳情位置、時間、既有照片或影像，必要時確認主要發生時段後再查。';
      return '先固定異常水現況：顏色、氣味、泡沫、油膜、混濁、沉積物、持續流水情形及照片／影片；這些是追源線索，不直接等於放流水超標。';
    }
    if(step===3)return '先確認水往哪裡流，再逆著流向往上游走。若流向不明，可從坡度、集水井、箱涵、雨水孔或實際水流判斷。';
    if(step===4)return '持續往上游追查。遇側溝或支流岔口時逐支確認是否有相同異常；清澈支線可先排除，異常支線繼續追。';
    if(step===5)return '找異常水首次出現的位置或疑似出口，例如PVC管、雨排口、集水井、箱涵支線、場內溝渠；先拍攝位置與上下游關係。';
    if(step===6)return '找到出口後仍不能直接認定排放人。應建立「異常水→出口→管線／溝渠→場所」的客觀連通，可用追管、示蹤、水位／操作變化、排水圖或監視影像佐證。';
    if(step===7)return '確認污染行為人／管制主體。公司、商號或工廠登記本身不等於水污法事業；應核對實際作業、業別、規模及列管資料。';
    if(step===8){
      if(input.fieldOperationStatus==='notOperating')return '現場未營運也不要直接結案：確認設備狀態、近期操作痕跡、槽體液位、管線濕痕及業者最近營運時段。';
      return '先看實際製程與用水，不要先找法條。確認哪些設備正在運轉、哪裡用水、哪裡可能產生廢（污）水。';
    }
    if(step===9){
      if(input.waterMatterType==='wastewater'&&input.waterWastewaterStatus==='no')return '目前已確認不是廢（污）水。請重新確認是否其實屬污泥、酸鹼廢液、垃圾或其他污染物；若確無其他管制物質，可補足現場證據後結束本次流程。';
      return '認水／認污染物：確認來源、作業關聯、接觸物及污染性。從工廠流出的水不當然就是廢水，其他污染物則另走棄置或設備疏漏支線。';
    }
    if(step===10)return '沿產生點找收集槽、集水井、處理設備與連接管線；建議拍攝全景與各單元銜接關係。';
    if(step===11){
      if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType==='roadsideDitch'&&input.waterSurfaceWaterConfirmed!=='yes')return '道路側溝不能直接等於地面水體。往下游追流，確認排水功能、集水井／箱涵／雨水下水道或排水路連通，必要時調圖資或示蹤。';
      if(input.fieldRouteTraced==='no'||input.waterDestination==='unknown')return '去向仍不明時不要停止：追管線、閥門、槽體液位、回收／委外單據及水量平衡，找出廢水最後實際去向。';
      return '把「來源→收集→處理→最終去向」串成一條水路，再拿核准資料來比對，不要先因系統查無許可就下違規結論。';
    }
    if(step===12){
      if(input.waterPermitCheckMode==='skip')return '本次已選擇跳過許可／水措逐項差異檢核；系統只記錄「本次未查」，不會把它當成一致。';
      if(input.waterPermitCheckMode==='quick')return '常去或既有資料熟悉的場所可用快速確認；若發現設備、管線、排放口、處理方式或操作有明顯變更，再展開逐項差異檢核。';
      return '把現場實際來源、收集／處理流程、排放口、最終去向、設施與操作方式，和本案可取得的核准內容逐項比對；無資料就標示不足，不要猜。';
    }
    if(step===13){
      if(input.waterActualDischarge==='no')return '本次沒有看到排放仍可繼續查：確認是否只是當下停排、是否有排放痕跡、槽體容量、回收／委外／納管資料與操作時段。';
      return '若正在排放，先固定排放口、水流、流向與持續時間，再確認出口與許可／水措是否一致。';
    }
    if(step===14){
      if(input.waterLeakCause==='humanDischarge')return '目前較像人為開閥、私管或主動抽排，不要硬套設備疏漏；固定操作、閥門、管線及排放路徑後交由後台§14／§18-1研判。';
      return '區分主動排放與設備事故。槽體／管線破裂、液位故障或溢流，應拍故障點、污染流向、止漏措施並確認是否進入水體。';
    }
    if(step===15)return '採樣前確認樣品能代表該股放流水，並位於進入承受水體前。外觀、泡沫或氣味只能作為查證線索，不能直接取代檢測超標證據。';
    if(step===16)return '依本案態樣補固定證據。至少確認能回答「水從哪裡來、經過哪裡、最後去哪裡」，以及排放／事故與對象間的連結。';
    return '目前可依上方即時判定選擇：繼續補查、直接進入案件研判，或結束本次查察；流程不要求把所有無關欄位走完。';
  }

  function fieldEnd(input={}){
    return {...input,waterInvestigationComplete:'yes',fieldEarlyEnded:'yes'};
  }

  root.WaterWorkflow={apply,stage,currentFieldStep,fieldPermitCheckComplete,fieldGuidance,fieldProgress,fieldSourceMode,fieldCanHandoff,fieldEmergencyActive,fieldLiveDecision,fieldEnd,unknownTraceReadyForSubject};
})(typeof window==='undefined'?globalThis:window);
