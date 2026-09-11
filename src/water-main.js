(function(root){
  'use strict';
  root.TemplateWorkflows=root.TemplateWorkflows||{};
  const bool=v=>v?'yes':'no';
  const statusLabel={established:'☑ 構成要件完整',notEstablished:'☒ 目前不成立',insufficient:'? 事證不足',notApplicable:'— 不適用'};
  function ruleLines(rule,result){
    return rule.elements.map(element=>{
      if(result.satisfiedFacts.includes(element.id))return '☑ '+element.label;
      if(result.failedFacts.includes(element.id))return '☒ '+element.label;
      if(result.notApplicableFacts.includes(element.id))return '— '+element.label;
      return '? '+element.label;
    }).join('\n');
  }
  function missingText(result){
    const parts=[];
    if(result.failedLabels.length)parts.push(...result.failedLabels.map(x=>'不成立：'+x));
    if(result.missingLabels.length)parts.push(...result.missingLabels.map(x=>'尚待確認／補證：'+x));
    if(result.notApplicableLabels.length)parts.push(...result.notApplicableLabels.map(x=>'不適用：'+x));
    return parts.length?parts.join('\n'):'目前無缺漏。';
  }
  function nextText(result){return result.nextChecks.length?result.nextChecks.map((x,i)=>`${i+1}. ${x}`).join('\n'):'目前無新增查證事項。';}
  function resultBlock(rule,result,assessment){
    return `${statusLabel[result.status]}\n${assessment}\n\n【構成要件】\n${ruleLines(rule,result)}\n\n【缺漏／不成立】\n${missingText(result)}\n\n【下一步】\n${nextText(result)}`;
  }
  function assess14(r){
    if(r.status==='established')return '本案具水污染防治法第14條第1項無許可排放之成立方向。';
    if(r.status==='notEstablished')return '第14條無許可排放目前不成立。';
    if(r.status==='notApplicable')return '目前不進入第14條無許可排放判斷。';
    return '目前事證不足以認定第14條無許可排放。';
  }
  function assess7(r){
    if(r.status==='established')return '本案具水污染防治法第7條第1項放流水超標之成立方向。';
    if(r.status==='notEstablished')return '依目前已確認事實，第7條放流水超標目前不成立。';
    if(r.status==='notApplicable')return '目前不屬第7條管制主體。';
    return '目前事證不足以認定第7條放流水超標。';
  }
  function article7Text(input,r7,r59){
    let assessment=assess7(r7);
    if(r7.status==='established'&&input.waterFacilityFailureConfirmed==='yes'){
      if(r59.status==='established')assessment='放流水檢測超標之事實要件已確認，但§59（第59條）六項故障例外條件目前亦完整；故障發生24小時內可能不適用主管機關所定標準，§7違規結論應先排除第59條例外後再定。';
      else if(r59.status==='insufficient')assessment='放流水檢測超標之事實要件已確認，但業者主張／現場涉及第59條故障例外且條件尚未查清；目前不宜只以超標結果作成終局違規結論。';
    }
    return resultBlock(root.WATER_RULES.article7Effluent,r7,assessment);
  }
  function assess35(r){
    if(r.status==='established')return '本案已具第35條刑事疑義之核心要件方向；應進一步固定「明知」及虛偽申報／記載證據，不以本助手直接作成刑事責任終局判斷。';
    if(r.status==='notEstablished')return '依目前事證，第35條刑事疑義之必要要件尚有不成立。';
    if(r.status==='notApplicable')return '目前不進入第35條刑事疑義判斷。';
    return '目前事證不足以進一步認定第35條刑事疑義。';
  }
  function assess59(r){
    if(r.status==='established')return '第59條所列六項條件目前均已確認，該處理設施故障於故障發生24小時內「可能」適用標準例外；仍不免除其他獨立違規態樣之檢核。';
    if(r.status==='notEstablished')return '第59條24小時標準例外目前不具完整適用條件。';
    return '第59條24小時標準例外尚有必要條件待確認。';
  }
  function assess71(r){
    if(r.status==='established')return '已具第71條後續處理基礎：主管機關應令污染行為人限期清除處理；屆期不為清除處理時，得代為清除並求償必要費用。';
    if(r.status==='notEstablished')return '目前尚未具第71條污染清除處理之完整啟動事實。';
    return '第71條後續處理尚待確認污染事件或污染行為人。';
  }
  function assessGeneric(r){
    if(r.status==='established')return `本案具${r.legalBasis}之成立方向。`;
    if(r.status==='notEstablished')return `${r.title}目前不成立。`;
    if(r.status==='notApplicable')return `${r.title}目前不適用。`;
    return `${r.title}目前事證不足。`;
  }
  function combined181(input,results){
    const active=[];
    if(input.waterActualDischarge==='yes')active.push(results[0]);
    if(input.waterDilutionObserved)active.push(results[1]);
    if(input.waterTreatmentFacilityApplicable)active.push(results[2]);
    if(!active.length)return '請依現場情形完成繞流、稀釋及處理設施檢核；未確認事項不會自動認定違規。';
    return active.map(({rule,result})=>`【${rule.title}】\n${resultBlock(rule,result,assessGeneric(result))}`).join('\n\n');
  }
  function combined20(input,results){
    const active=[];
    if(input.waterDestination==='storage'){
      active.push(results[0]);
      if(input.waterStoragePermit==='valid')active.push(results[1]);
    }
    if(input.waterDilutionObserved==='yes'){
      active.push(results[2]);
      if(input.waterDilutionPermit==='valid')active.push(results[3]);
    }
    if(!active.length)return '目前未進入第20條貯留／稀釋支線。';
    return active.map(({rule,result})=>`【${rule.title}】\n${resultBlock(rule,result,assessGeneric(result))}`).join('\n\n');
  }
  function combined27(input,results){
    if(input.waterSevereHazardRiskConfirmed==='no')return '目前已確認不屬第27條所稱嚴重危害之虞；一般放流水超標本身不等於第27條重大污染。';
    if(!input.waterSevereHazardRiskConfirmed||input.waterSevereHazardRiskConfirmed==='unknown')return '是否具有嚴重危害人體健康、農漁業生產或飲用水水源之虞尚待確認。';
    return results.map(({rule,result})=>`【${rule.title}】\n${resultBlock(rule,result,assessGeneric(result))}`).join('\n\n');
  }
  function combined28(input,results){
    if(input.waterArticle28Scenario==='no')return '目前未發現輸送或貯存設備疏漏態樣；§28設備疏漏支線暫不進入。';
    if(!input.waterArticle28Scenario||input.waterArticle28Scenario==='unknown')return '是否存在輸送或貯存設備疏漏、溢流或滲漏態樣尚待確認。';
    if(input.waterLeakCause==='humanDischarge')return '目前較符合人為開閥、私管或主動抽排態樣，§28設備疏漏支線不優先適用；應回查§14、§18-1及實際排放路徑。';
    const active=[results[0]];
    if(input.waterLeakPollutedWaterBody==='yes')active.push(results[1],results[2]);
    return active.map(({rule,result})=>`【${rule.title}】\n${resultBlock(rule,result,assessGeneric(result))}`).join('\n\n');
  }
  function combined32(input,soil,groundwater){
    if(input.waterDestination==='soil')return resultBlock(root.WATER_RULES.article32Soil,soil,assessGeneric(soil));
    if(input.waterDestination==='groundwater')return resultBlock(root.WATER_RULES.article32Groundwater,groundwater,assessGeneric(groundwater));
    return '目前未進入第32條土壤／地下水體支線。';
  }
  function article13Text(input,result){
    if(input.waterArticle13NewOrChangeConfirmed==='no')return '目前已確認不涉及事業設立或變更，§13本案暫不進入。';
    if(!input.waterArticle13NewOrChangeConfirmed||input.waterArticle13NewOrChangeConfirmed==='unknown')return '是否涉及§13所稱設立或變更尚待確認。';
    return resultBlock(root.WATER_RULES.article13Plan,result,assessGeneric(result));
  }
  function article18Text(input,result){
    if(input.waterArticle18SpecificDutyConfirmed==='no')return '目前已確認無本案欲檢核之具體第18條水措義務；若涉及雨污分流、逕流、設備規格、紀錄頻率等，應進入第二階段水措管理模組。';
    if(!input.waterArticle18SpecificDutyConfirmed||input.waterArticle18SpecificDutyConfirmed==='unknown')return '第18條為授權型水措義務；V1不自行補入子法細節。請先依水措管理相關規定確認本案具體義務。';
    return resultBlock(root.WATER_RULES.article18Measures,result,assessGeneric(result));
  }
  function article22Text(input,result){
    if(input.waterArticle22ReportingDutyConfirmed==='no')return '目前已確認本案無欲檢核之第22條申報義務。';
    if(!input.waterArticle22ReportingDutyConfirmed||input.waterArticle22ReportingDutyConfirmed==='unknown')return '申報義務之格式、內容、頻率與方式需依適用規定確認；V1不自行補入子法細節。';
    return resultBlock(root.WATER_RULES.article22Reporting,result,assessGeneric(result));
  }
  function article26Text(input,result){
    if(input.waterArticle26InspectionBasisConfirmed==='no')return '本次查證基礎尚未建立完整，不宜直接以第26條規避、妨礙或拒絕查證方向判斷。';
    if(!input.waterArticle26InspectionBasisConfirmed||input.waterArticle26InspectionBasisConfirmed==='unknown')return '請先記錄稽查人員證件出示及具體查證事項，再判斷是否有規避、妨礙或拒絕。';
    return resultBlock(root.WATER_RULES.article26Obstruction,result,assessGeneric(result));
  }
  function article59Text(input,result){
    if(input.waterFacilityFailureConfirmed==='no')return '目前未確認有廢（污）水處理設施故障，不進入第59條例外。';
    if(!input.waterFacilityFailureConfirmed||input.waterFacilityFailureConfirmed==='unknown')return '是否確有處理設施故障尚待確認；設備故障本身不等於免責。';
    return resultBlock(root.WATER_RULES.article59Exception,result,assess59(result));
  }
  function article71Text(input,result){
    if(input.waterSurfaceWaterPollutionEventConfirmed==='no')return '目前未確認地面水體發生污染事件，不進入第71條污染清除後續。';
    if(!input.waterSurfaceWaterPollutionEventConfirmed||input.waterSurfaceWaterPollutionEventConfirmed==='unknown')return '是否已發生地面水體污染事件尚待確認。';
    return resultBlock(root.WATER_RULES.article71Cleanup,result,assess71(result));
  }
  function finalConclusion(input,active,r59){
    if(input.waterSevereHazardRiskConfirmed==='yes'){
      return 'D｜重大／緊急污染\n優先控制污染、保護下游、確認緊急應變及3小時通報，並立即固定排放、污染範圍、流向與相關證據；告發研判不得優先於污染控制。';
    }
    const adjusted=active.map(item=>{
      if(item.key==='a7'&&item.result.status==='established'&&input.waterFacilityFailureConfirmed==='yes'){
        if(r59.status==='established')return {...item,effectiveStatus:'notEstablished',note:'§7超標事實受§59例外影響，需先排除例外'};
        if(r59.status==='insufficient')return {...item,effectiveStatus:'insufficient',note:'§7超標事實尚待排除§59故障例外'};
      }
      return {...item,effectiveStatus:item.result.status};
    });
    const established=adjusted.filter(x=>x.effectiveStatus==='established');
    const pending=adjusted.filter(x=>x.effectiveStatus==='insufficient');
    if(established.length){
      const lines=established.map(x=>'• '+x.label).join('\n');
      const tail=(input.waterInvestigationComplete==='yes'&&!pending.length)?'':'\n\n尚有其他支線待查時，仍應分別完成構成要件與證據檢核。';
      return `B｜構成要件完整\n目前至少一項法律問題已具完整成立方向：\n${lines}${tail}`;
    }
    if(pending.length||input.waterInvestigationComplete!=='yes'){
      const labels=pending.map(x=>'• '+x.label).join('\n')||'• 本次案件尚未確認所有必要查證事項均已完成';
      const checks=[];
      pending.forEach(x=>(x.result.nextChecks||[]).forEach(c=>{if(!checks.includes(c))checks.push(c);}));
      const next=checks.length?'\n\n建議下一步：\n'+checks.slice(0,8).map((x,i)=>`${i+1}. ${x}`).join('\n'):'';
      return `C｜事證不足\n目前尚不足以作成違規成立結論。待確認項目：\n${labels}${next}`;
    }
    return 'A｜本次查無違規事證\n依本次查察所得事證，尚無足資認定違反水污染防治法之事證。此結論僅代表本次查察結果，不表示證明不存在任何違規。';
  }
  function prepare(input={}){
    const out={...input};
    if(!Array.isArray(out.waterSourceTypes)&&out.waterSourceType)out.waterSourceTypes=[out.waterSourceType];
    if(Array.isArray(out.waterSourceTypes)){
      out.waterSourceTypes=[...new Set(out.waterSourceTypes.filter(Boolean))];
      if(out.waterSourceTypes.length>1)out.waterSourceTypes=out.waterSourceTypes.filter(value=>value!=='unknown');
    }
    const facts=root.WaterFacts.build(out);
    const evalRule=id=>root.WaterRuleEngine.evaluate(root.WATER_RULES[id],facts);
    const r13=evalRule('article13Plan'),r14=evalRule('article14NoPermit'),r7=evalRule('article7Effluent'),r18=evalRule('article18Measures');
    const rb=evalRule('article181Bypass'),rd=evalRule('article181Dilution'),rt=evalRule('article181Treatment');
    const r20s=evalRule('article20StorageNoPermit'),r20sm=evalRule('article20StorageMismatch'),r20d=evalRule('article20DilutionNoPermit'),r20dm=evalRule('article20DilutionMismatch');
    const r22=evalRule('article22Reporting'),r35=evalRule('article35FalseReporting'),r26=evalRule('article26Obstruction');
    const r27e=evalRule('article27Emergency'),r27n=evalRule('article27Notice');
    const r28p=evalRule('article28Prevention'),r28e=evalRule('article28Emergency'),r28n=evalRule('article28Notice');
    const r30=evalRule('article30Dumping'),r32s=evalRule('article32Soil'),r32g=evalRule('article32Groundwater');
    const r59=evalRule('article59Exception'),r71=evalRule('article71Cleanup');

    const wastewaterPath=facts.matterType==='wastewater'||(!facts.matterType&&!!input.waterWastewaterStatus);
    out.waterNoDrafts='yes';
    out.waterShowSubjectConfirmed=bool(input.waterSubjectType==='business');
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

    const summaries=[];
    if(facts.subjectIsBusiness==='yes')summaries.push(`§13 水措計畫：${input.waterArticle13NewOrChangeConfirmed==='yes'?statusLabel[r13.status]:(input.waterArticle13NewOrChangeConfirmed==='no'?'— 未進入':'? 待確認')}`);
    if(out.waterShowArticle14==='yes')summaries.push(`§14 排放許可：${statusLabel[r14.status]}`);
    if(out.waterShowArticle7==='yes')summaries.push(`§7 放流水標準：${statusLabel[r7.status]}`);
    if(facts.subjectIsBusiness==='yes')summaries.push(`§18 水污染防治措施：${input.waterArticle18SpecificDutyConfirmed==='yes'?statusLabel[r18.status]:(input.waterArticle18SpecificDutyConfirmed==='no'?'— 未進入':'? 待查子法')}`);
    if(out.waterShowArticle181==='yes'){
      summaries.push(`§18-1 繞流：${statusLabel[rb.status]}`);
      summaries.push(`§18-1 稀釋：${statusLabel[rd.status]}`);
      summaries.push(`§18-1 處理設施：${statusLabel[rt.status]}`);
      if(input.waterDestination==='storage')summaries.push(`§20 貯留：${statusLabel[r20s.status]}`);
      if(input.waterDilutionObserved==='yes')summaries.push(`§20 稀釋：${statusLabel[r20d.status]}`);
      summaries.push(`§22 申報：${input.waterArticle22ReportingDutyConfirmed==='yes'?statusLabel[r22.status]:(input.waterArticle22ReportingDutyConfirmed==='no'?'— 未進入':'? 待確認')}`);
    }
    if(out.waterShowFalseDetails==='yes')summaries.push(`§35 不實申報／虛偽紀錄：${statusLabel[r35.status]}`);
    if(out.waterShowArticle26Obstruction==='yes')summaries.push(`§26 查證／拒檢：${statusLabel[r26.status]}`);
    if(out.waterShowArticle27==='yes')summaries.push(`§27 重大危害：${input.waterSevereHazardRiskConfirmed==='yes'?statusLabel[r27e.status]:(input.waterSevereHazardRiskConfirmed==='no'?'— 未進入':'? 待確認')}`);
    if(out.waterShowArticle28==='yes'&&input.waterArticle28Scenario)summaries.push(`§28 設備疏漏：${input.waterArticle28Scenario==='no'?'— 未進入':statusLabel[r28p.status]}`);
    if(out.waterShowArticle32==='yes')summaries.push(`§32 ${input.waterDestination==='soil'?'土壤':'地下水體'}：${statusLabel[(input.waterDestination==='soil'?r32s:r32g).status]}`);
    if(out.waterShowArticle30==='yes')summaries.push(`§30 污染物棄置：${statusLabel[r30.status]}`);
    if(input.waterFacilityFailureConfirmed==='yes')summaries.push(`§59 故障例外：${statusLabel[r59.status]}`);
    if(input.waterSurfaceWaterPollutionEventConfirmed==='yes')summaries.push(`§71 污染清除：${statusLabel[r71.status]}`);
    if(!summaries.length)summaries.push('目前尚未進入可判斷之主要條文模組。');

    out.waterRulesOverviewText=summaries.join('\n');
    out.waterArticle13Text=article13Text(input,r13);
    out.waterArticle14Text=resultBlock(root.WATER_RULES.article14NoPermit,r14,assess14(r14));
    out.waterArticle7Text=article7Text(input,r7,r59);
    out.waterArticle18Text=article18Text(input,r18);
    out.waterArticle181Text=combined181(input,[{rule:root.WATER_RULES.article181Bypass,result:rb},{rule:root.WATER_RULES.article181Dilution,result:rd},{rule:root.WATER_RULES.article181Treatment,result:rt}]);
    out.waterArticle20Text=combined20(input,[{rule:root.WATER_RULES.article20StorageNoPermit,result:r20s},{rule:root.WATER_RULES.article20StorageMismatch,result:r20sm},{rule:root.WATER_RULES.article20DilutionNoPermit,result:r20d},{rule:root.WATER_RULES.article20DilutionMismatch,result:r20dm}]);
    out.waterArticle22Text=article22Text(input,r22);
    out.waterArticle35Text=resultBlock(root.WATER_RULES.article35FalseReporting,r35,assess35(r35));
    out.waterArticle26Text=article26Text(input,r26);
    out.waterArticle27Text=combined27(input,[{rule:root.WATER_RULES.article27Emergency,result:r27e},{rule:root.WATER_RULES.article27Notice,result:r27n}]);
    out.waterArticle28Text=combined28(input,[{rule:root.WATER_RULES.article28Prevention,result:r28p},{rule:root.WATER_RULES.article28Emergency,result:r28e},{rule:root.WATER_RULES.article28Notice,result:r28n}]);
    out.waterArticle32Text=combined32(input,r32s,r32g);
    out.waterArticle30Text=resultBlock(root.WATER_RULES.article30Dumping,r30,assessGeneric(r30));
    out.waterArticle59Text=article59Text(input,r59);
    out.waterArticle71Text=article71Text(input,r71);

    const activeForFinal=[];
    const add=(key,label,result)=>activeForFinal.push({key,label,result});
    if(facts.subjectIsBusiness==='yes'&&input.waterArticle13NewOrChangeConfirmed==='yes')add('a13','§13 水措計畫',r13);
    if(out.waterShowArticle14==='yes')add('a14','§14 排放許可',r14);
    if(out.waterShowArticle7==='yes')add('a7','§7 放流水標準',r7);
    if(facts.subjectIsBusiness==='yes'&&input.waterArticle18SpecificDutyConfirmed==='yes')add('a18','§18 水污染防治措施',r18);
    if(out.waterShowArticle181==='yes'){
      if(input.waterActualDischarge==='yes')add('a181b','§18-1 繞流',rb);
      if(input.waterDilutionObserved)add('a181d','§18-1 稀釋',rd);
      if(input.waterTreatmentFacilityApplicable)add('a181t','§18-1 處理設施',rt);
      if(input.waterDestination==='storage'){add('a20s','§20 貯留',r20s);if(input.waterStoragePermit==='valid')add('a20sm','§20 貯留登記事項',r20sm);}
      if(input.waterDilutionObserved==='yes'){add('a20d','§20 稀釋',r20d);if(input.waterDilutionPermit==='valid')add('a20dm','§20 稀釋登記事項',r20dm);}
      if(input.waterArticle22ReportingDutyConfirmed==='yes')add('a22','§22 申報',r22);
    }
    if(out.waterShowFalseDetails==='yes')add('a35','§35 不實申報／虛偽紀錄',r35);
    if(out.waterShowArticle26Obstruction==='yes')add('a26','§26 規避／妨礙／拒絕查證',r26);
    if(out.waterShowArticle27==='yes'&&input.waterSevereHazardRiskConfirmed==='yes'){add('a27e','§27 緊急應變',r27e);add('a27n','§27 3小時通知',r27n);}
    if(out.waterShowArticle28==='yes'&&input.waterArticle28Scenario==='yes'){add('a28p','§28 維護／防範',r28p);if(input.waterLeakPollutedWaterBody==='yes'){add('a28e','§28 緊急應變',r28e);add('a28n','§28 3小時通知',r28n);}}
    if(out.waterShowArticle32==='yes')add('a32','§32 土壤／地下水體',input.waterDestination==='soil'?r32s:r32g);
    if(out.waterShowArticle30==='yes')add('a30','§30 污染物棄置',r30);
    out.waterFinalConclusionText=finalConclusion(input,activeForFinal,r59);

    out.waterRuleStatus=r14.status;
    out.waterArticle14ElementsText=ruleLines(root.WATER_RULES.article14NoPermit,r14);
    out.waterAssessmentText=assess14(r14);out.waterMissingText=missingText(r14);out.waterNextChecksText=nextText(r14);
    return out;
  }
  function resetChange(previous={},current={}){
    const next={...current},clear=keys=>keys.forEach(key=>{next[key]='';});
    const article13Branch=['waterArticle13NewOrChangeConfirmed','waterArticle13DesignatedSubjectConfirmed','waterMeasuresPlanApproval'];
    const wastewaterBranch=['waterWastewaterStatus','waterSourceTypes','waterActualDischarge','waterDestination','waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterDischargePermit','waterStorageActivityConfirmed','waterStoragePermit','waterStorageRegistrationMismatch','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded','waterApprovedRouteConfirmed','waterActualRouteConfirmed','waterBypassConfirmed','waterBypassEmergencyException','waterDilutionObserved','waterRequiresTreatmentToMeetStandard','waterMixedWithNoTreatmentNeededWater','waterDilutionPermit','waterDilutionRegistrationMismatch','waterDilutionEmergencyException','waterTreatmentFacilityApplicable','waterTreatmentFunctionSufficient','waterTreatmentOperatingNormally','waterArticle18SpecificDutyConfirmed','waterArticle18NoncomplianceConfirmed','waterSevereHazardRiskConfirmed','waterSoilTreatmentPermit','waterGroundwaterBodyConfirmed','waterArticle22ReportingDutyConfirmed','waterArticle22ReportingNoncomplianceConfirmed','waterReportedDataMismatch','waterFalseReportOrBusinessRecordConfirmed','waterKnowingFalseEvidenceConfirmed','waterFacilityFailureConfirmed','waterA59ImmediateRepairAndResponse','waterA59ImmediateRecordAndReport','waterA59RecoveredWithin24Hours','waterA59WrittenReportWithin5Days','waterA59DirectCausation','waterA59NotSameFailureWithin6Months'];
    const incidentBranch=['waterArticle28Scenario','waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterEmergencyActionTaken','waterThreeHourNotice'];
    const dumpingBranch=['waterDumpingConfirmed','waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed'];
    const inspectionBranch=['waterArticle26InspectionBasisConfirmed','waterArticle26ObstructionConfirmed'];
    const cleanupBranch=['waterSurfaceWaterPollutionEventConfirmed','waterPolluterIdentified'];
    const allAfterMatter=[...wastewaterBranch,...incidentBranch,...dumpingBranch];
    if(previous.waterSubjectType!==current.waterSubjectType)clear(['waterSubjectConfirmed',...article13Branch,...allAfterMatter,...inspectionBranch,...cleanupBranch]);
    else if(previous.waterSubjectConfirmed!==current.waterSubjectConfirmed)clear([...article13Branch,'waterMatterType',...allAfterMatter]);
    else if(previous.waterArticle13NewOrChangeConfirmed!==current.waterArticle13NewOrChangeConfirmed)clear(['waterArticle13DesignatedSubjectConfirmed','waterMeasuresPlanApproval']);
    else if(previous.waterMatterType!==current.waterMatterType)clear(allAfterMatter);
    else if(previous.waterWastewaterStatus!==current.waterWastewaterStatus)clear([...wastewaterBranch.slice(2),...incidentBranch]);
    else if(previous.waterActualDischarge!==current.waterActualDischarge)clear(['waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded','waterApprovedRouteConfirmed','waterActualRouteConfirmed','waterBypassConfirmed','waterBypassEmergencyException','waterSevereHazardRiskConfirmed','waterSoilTreatmentPermit','waterGroundwaterBodyConfirmed']);
    else if(previous.waterDestination!==current.waterDestination)clear(['waterSurfaceType','waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterDischargePermit','waterStorageActivityConfirmed','waterStoragePermit','waterStorageRegistrationMismatch','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded','waterSoilTreatmentPermit','waterGroundwaterBodyConfirmed']);
    else if(previous.waterStorageActivityConfirmed!==current.waterStorageActivityConfirmed)clear(['waterStoragePermit','waterStorageRegistrationMismatch']);
    else if(previous.waterStoragePermit!==current.waterStoragePermit)clear(['waterStorageRegistrationMismatch']);
    else if(previous.waterSurfaceType!==current.waterSurfaceType)clear(['waterSurfaceWaterConfirmed','waterDrainageFunctionConfirmed','waterDownstreamConfirmed','waterDrainageConnectionConfirmed','waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterSurfaceWaterConfirmed!==current.waterSurfaceWaterConfirmed)clear(['waterDischargePermit','waterSampleTaken','waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterSampleTaken!==current.waterSampleTaken)clear(['waterSampleRepresentative','waterSampleBeforeReceivingWater','waterApplicableStandardConfirmed','waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterSampleRepresentative!==current.waterSampleRepresentative||previous.waterSampleBeforeReceivingWater!==current.waterSampleBeforeReceivingWater||previous.waterApplicableStandardConfirmed!==current.waterApplicableStandardConfirmed)clear(['waterLabResultAvailable','waterEffluentExceeded']);
    else if(previous.waterLabResultAvailable!==current.waterLabResultAvailable)clear(['waterEffluentExceeded']);
    else if(previous.waterApprovedRouteConfirmed!==current.waterApprovedRouteConfirmed||previous.waterActualRouteConfirmed!==current.waterActualRouteConfirmed)clear(['waterBypassConfirmed','waterBypassEmergencyException']);
    else if(previous.waterBypassConfirmed!==current.waterBypassConfirmed)clear(['waterBypassEmergencyException']);
    else if(previous.waterDilutionObserved!==current.waterDilutionObserved)clear(['waterRequiresTreatmentToMeetStandard','waterMixedWithNoTreatmentNeededWater','waterDilutionPermit','waterDilutionRegistrationMismatch','waterDilutionEmergencyException']);
    else if(previous.waterRequiresTreatmentToMeetStandard!==current.waterRequiresTreatmentToMeetStandard||previous.waterMixedWithNoTreatmentNeededWater!==current.waterMixedWithNoTreatmentNeededWater||previous.waterDilutionPermit!==current.waterDilutionPermit)clear(['waterDilutionRegistrationMismatch','waterDilutionEmergencyException']);
    else if(previous.waterTreatmentFacilityApplicable!==current.waterTreatmentFacilityApplicable)clear(['waterTreatmentFunctionSufficient','waterTreatmentOperatingNormally','waterFacilityFailureConfirmed','waterA59ImmediateRepairAndResponse','waterA59ImmediateRecordAndReport','waterA59RecoveredWithin24Hours','waterA59WrittenReportWithin5Days','waterA59DirectCausation','waterA59NotSameFailureWithin6Months']);
    else if(previous.waterArticle18SpecificDutyConfirmed!==current.waterArticle18SpecificDutyConfirmed)clear(['waterArticle18NoncomplianceConfirmed']);
    else if(previous.waterArticle28Scenario!==current.waterArticle28Scenario)clear(['waterTransportStorageEquipmentConfirmed','waterLeakCause','waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterLeakCause!==current.waterLeakCause)clear(['waterLeakRiskToWaterBodyConfirmed','waterMaintenancePreventionTaken','waterLeakPollutedWaterBody','waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterLeakRiskToWaterBodyConfirmed!==current.waterLeakRiskToWaterBodyConfirmed)clear(['waterMaintenancePreventionTaken']);
    else if(previous.waterLeakPollutedWaterBody!==current.waterLeakPollutedWaterBody)clear(['waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterSevereHazardRiskConfirmed!==current.waterSevereHazardRiskConfirmed&&current.waterSevereHazardRiskConfirmed!=='yes'&&current.waterLeakPollutedWaterBody!=='yes')clear(['waterEmergencyActionTaken','waterThreeHourNotice']);
    else if(previous.waterDumpingConfirmed!==current.waterDumpingConfirmed)clear(['waterControlZoneConfirmed','waterDesignatedWaterRangeConfirmed']);
    else if(previous.waterControlZoneConfirmed!==current.waterControlZoneConfirmed&&current.waterControlZoneConfirmed==='no')clear(['waterDesignatedWaterRangeConfirmed']);
    else if(previous.waterArticle22ReportingDutyConfirmed!==current.waterArticle22ReportingDutyConfirmed)clear(['waterArticle22ReportingNoncomplianceConfirmed','waterReportedDataMismatch','waterFalseReportOrBusinessRecordConfirmed','waterKnowingFalseEvidenceConfirmed']);
    else if(previous.waterReportedDataMismatch!==current.waterReportedDataMismatch)clear(['waterFalseReportOrBusinessRecordConfirmed','waterKnowingFalseEvidenceConfirmed']);
    else if(previous.waterFacilityFailureConfirmed!==current.waterFacilityFailureConfirmed)clear(['waterA59ImmediateRepairAndResponse','waterA59ImmediateRecordAndReport','waterA59RecoveredWithin24Hours','waterA59WrittenReportWithin5Days','waterA59DirectCausation','waterA59NotSameFailureWithin6Months']);
    else if(previous.waterArticle26InspectionBasisConfirmed!==current.waterArticle26InspectionBasisConfirmed)clear(['waterArticle26ObstructionConfirmed']);
    else if(previous.waterSurfaceWaterPollutionEventConfirmed!==current.waterSurfaceWaterPollutionEventConfirmed)clear(['waterPolluterIdentified']);
    return next;
  }
  root.TemplateWorkflows.waterMain={prepare,resetChange};
})(typeof window==='undefined'?globalThis:window);
