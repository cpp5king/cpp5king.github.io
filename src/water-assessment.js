(function(root){
  'use strict';
  const statusLabel={
    established:'☑ 構成要件事實已完整',
    notEstablished:'☒ 目前不支持',
    insufficient:'? 尚有要件待確認',
    notApplicable:'— 本案不適用'
  };

  function ruleLines(rule,result){
    return root.WaterLaw.ruleElements(rule).map(element=>{
      if(result.satisfiedFacts.includes(element.id))return '☑ '+element.label;
      if(result.failedFacts.includes(element.id))return '☒ '+element.label;
      if(result.notApplicableFacts.includes(element.id))return '— '+element.label;
      return '? '+element.label;
    }).join('\n');
  }

  function missingText(result){
    const parts=[];
    if(result.failedLabels.length)parts.push(...result.failedLabels.map(x=>'目前不支持：'+x));
    if(result.missingLabels.length)parts.push(...result.missingLabels.map(x=>'尚待確認／補證：'+x));
    if(result.notApplicableLabels.length)parts.push(...result.notApplicableLabels.map(x=>'本案不適用：'+x));
    return parts.length?parts.join('\n'):'目前無缺漏。';
  }

  function nextText(result){
    return result.nextChecks.length?result.nextChecks.map((x,i)=>(i+1)+'. '+x).join('\n'):'目前無新增查證事項。';
  }

  function resultBlock(rule,result,assessment){
    return statusLabel[result.status]+'\n'+assessment+'\n\n【構成要件】\n'+ruleLines(rule,result)+'\n\n【缺漏／目前不支持】\n'+missingText(result)+'\n\n【下一步】\n'+nextText(result);
  }

  function genericNarrative(r){
    if(r.status==='established')return '本案具'+r.legalBasis+'之查核方向，構成要件事實目前已完整。';
    if(r.status==='notEstablished')return r.title+'目前不支持。';
    if(r.status==='notApplicable')return r.title+'本案不適用。';
    return r.title+'尚有要件待確認。';
  }

  function coreResultBlock(ruleKey,result){
    const rule=root.WaterLaw.getRule(ruleKey,'core');
    return resultBlock(rule,result,root.WaterLaw.narrative(ruleKey,result.status));
  }

  function guardedText(ruleKey,input,result){
    const guard=root.WaterLaw.entryGuard(ruleKey,input);
    if(guard.action!=='evaluate')return guard.text;
    return coreResultBlock(ruleKey,result);
  }

  function groupText(groupKey,input,resultMap){
    const selected=root.WaterLaw.group(groupKey,input);
    if(selected.state!=='active')return selected.message||'目前未進入此法規支線。';
    return selected.ruleKeys.map(ruleKey=>{
      const result=resultMap[ruleKey];
      return '【'+root.WaterLaw.getRule(ruleKey,'core').title+'】\n'+coreResultBlock(ruleKey,result);
    }).join('\n\n');
  }

  function article7Text(input,r7,r59){
    let assessment=root.WaterLaw.narrative('article7Effluent',r7.status);
    const rel=root.WaterLaw.relation('article7Effluent');
    if(rel&&r7.status==='established'&&input[rel.exceptionFact]===rel.exceptionFactValue){
      if(r59.status==='established')assessment=rel.establishedExceptionText;
      else if(r59.status==='insufficient')assessment=rel.pendingExceptionText;
    }
    return resultBlock(root.WaterLaw.getRule('article7Effluent','core'),r7,assessment);
  }

  function finalConclusion(input,active,r59){
    if(input.waterSevereHazardRiskConfirmed==='yes'){
      return 'D｜重大／緊急污染\n優先控制污染、保護下游、確認緊急應變及3小時通報，並立即固定排放、污染範圍、流向與相關證據；法律研判不得優先於污染控制。';
    }
    const rel=root.WaterLaw.relation('article7Effluent');
    const adjusted=active.map(item=>{
      if(rel&&item.ruleKey==='article7Effluent'&&item.result.status==='established'&&input[rel.exceptionFact]===rel.exceptionFactValue){
        if(r59.status==='established')return {...item,effectiveStatus:'notEstablished',note:rel.finalEstablishedNote||''};
        if(r59.status==='insufficient')return {...item,effectiveStatus:'insufficient',note:rel.finalPendingNote||''};
      }
      return {...item,effectiveStatus:item.result.status};
    });
    const established=adjusted.filter(x=>x.effectiveStatus==='established');
    const pending=adjusted.filter(x=>x.effectiveStatus==='insufficient');
    if(established.length){
      const lines=established.map(x=>'• '+x.label).join('\n');
      const tail=(input.waterInvestigationComplete==='yes'&&!pending.length)?'':'\n\n尚有其他支線待查時，仍應分別完成構成要件與證據檢核。';
      return 'B｜構成要件事實已完整\n目前至少一項法律方向之構成要件事實已完整：\n'+lines+tail;
    }
    if(pending.length||input.waterInvestigationComplete!=='yes'){
      const labels=pending.map(x=>'• '+x.label).join('\n')||'• 本次案件尚未確認所有必要查證事項均已完成';
      const checks=[];
      pending.forEach(x=>(x.result.nextChecks||[]).forEach(check=>{if(!checks.includes(check))checks.push(check);}));
      const next=checks.length?'\n\n建議下一步：\n'+checks.slice(0,8).map((x,i)=>(i+1)+'. '+x).join('\n'):'';
      return 'C｜尚有要件待確認\n目前尚有法律要件或必要事實待確認：\n'+labels+next;
    }
    return 'A｜目前不支持\n依本次已完成查證之事實，目前不支持已列法規方向。此狀態僅代表本次查察結果；缺少事實不等於否定事實。';
  }
  const sublawStatusLabel={established:'⚠ 疑似不符合',notEstablished:'✓ 目前未見不符',insufficient:'? 待確認',notApplicable:'— 不適用'};
  function sublawOverview(input,law,items){
    const lines=[`【法規版本】\n${law.text}`];
    const active=items.filter(x=>x.active);
    if(active.length){
      lines.push('【水措管理共通義務初步檢核】\n'+active.map(x=>`${x.label}：${sublawStatusLabel[x.result.status]}`).join('\n'));
      const established=active.filter(x=>x.result.status==='established');
      const pending=active.filter(x=>x.result.status==='insufficient');
      if(established.length)lines.push('【疑似不符合】\n'+established.map(x=>`• ${x.label}`).join('\n'));
      if(pending.length){
        const checks=[];
        pending.forEach(x=>(x.result.nextChecks||[]).forEach(c=>{if(!checks.includes(c))checks.push(c);}));
        lines.push('【尚待確認】\n'+pending.map(x=>`• ${x.label}`).join('\n')+(checks.length?'\n\n建議查證：\n'+checks.slice(0,10).map((x,i)=>`${i+1}. ${x}`).join('\n'):''));
      }
    }else{
      lines.push('【水措管理共通義務初步檢核】\n目前尚未進入可判斷之子法支線。');
    }
    lines.push('※ 4.3 僅處理共通子法義務；特定業別、另定施行日之自動監測／附表項目仍須進一步查核，不由本版自動認定違規。');
    return lines.join('\n\n');
  }
  function unique(items){return [...new Set(items.filter(Boolean))];}
  function parseOverview(text){
    const established=[],pending=[];
    String(text||'').split(/\r?\n/).forEach(line=>{
      const clean=line.trim();
      if(!clean)return;
      const label=clean.split('：')[0]?.trim();
      if(!label)return;
      if(clean.includes('☑ 構成要件事實已完整')||clean.includes('⚠ 疑似不符合'))established.push(label);
      if(clean.includes('? 尚有要件待確認')||clean.includes('? 待確認')||clean.includes('? 待查子法'))pending.push(label);
    });
    return {established:unique(established),pending:unique(pending)};
  }
  function bullets(list){return list.map(x=>'• '+x).join('\n');}
  function liveDecision(out){
    const final=String(out.waterFinalConclusionText||'');
    const {established,pending}=parseOverview(out.waterRulesOverviewText);
    if(final.startsWith('D｜'))return '目前狀態：🔴 重大／緊急污染\n\n優先控制污染、保護下游並完成緊急應變與證據固定。';
    if(established.length){
      const parts=['目前狀態：🔴 構成要件事實已完整','【已完整之法律方向】\n'+bullets(established)];
      if(pending.length)parts.push('【另待確認】\n'+bullets(pending));
      return parts.join('\n\n');
    }
    if(pending.length||out.waterInvestigationComplete!=='yes'){
      const involved=pending.length?pending:['案件必要查證事項'];
      return '目前狀態：🟡 尚有要件待確認\n\n【目前可能涉及】\n'+bullets(involved);
    }
    return '目前狀態：🟢 目前不支持\n\n依本次已完成查證之事實，目前不支持已列法規方向；缺少事實不等於否定事實。';
  }
  function liveMissing(out){
    const {pending}=parseOverview(out.waterRulesOverviewText);
    if(pending.length)return '【尚缺關鍵事證】\n'+bullets(pending.map(x=>'完成「'+x+'」構成要件／證據確認'));
    if(out.waterInvestigationComplete!=='yes')return '【尚缺關鍵事證】\n• 確認本次案件必要查證事項是否均已完成';
    return '目前無關鍵缺漏。';
  }
  function apply(input,facts,out,lawVersion,results,sub,industry){
    const {r13,r14,r7,r18,rb,rd,rt,r20s,r20sm,r20d,r20dm,r22,r35,r26,r27e,r27n,r28p,r28e,r28n,r30,r32s,r32g,r59,r71}=results;
    const subItems=[
      {key:'sub4',label:'水措管理辦法§4 核准內容與現場',result:sub.approvedMeasuresMismatch,active:out.waterShowSublawCore==='yes'&&(out.waterPermitLegalComparisonActive==='yes'||!input.waterPermitCheckMode)},
      {key:'sub7',label:'水措管理辦法§7 雨污分流',result:sub.rainWastewaterSeparation,active:out.waterShowSublawCore==='yes'&&facts.wastewaterConfirmed==='yes'},
      {key:'sub8',label:'水措管理辦法§8 逕流廢水收集處理',result:sub.runoffCollection,active:out.waterShowSublawRunoff==='yes'},
      {key:'sub31s',label:'水措管理辦法§31 委託前處理／貯留',result:sub.outsourceStorage,active:out.waterShowSublawOutsource==='yes'},
      {key:'sub31m',label:'水措管理辦法§31 委託處理水量計測',result:sub.outsourceMeter,active:out.waterShowSublawOutsource==='yes'},
      {key:'sub39m',label:'水措管理辦法§39 貯留水量計測',result:sub.storageMeter,active:out.waterShowSublawStorage==='yes'},
      {key:'sub39r',label:'水措管理辦法§39 貯留紀錄',result:sub.storageRecords,active:out.waterShowSublawStorage==='yes'},
      {key:'sub40',label:'水措管理辦法§40 貯留應變容量',result:sub.storageCapacity,active:out.waterShowSublawStorage==='yes'},
      {key:'sub41q',label:'水措管理辦法§41 回收使用水質／例外',result:sub.reuseStandard,active:out.waterShowSublawReuse==='yes'},
      {key:'sub41s',label:'水措管理辦法§41 回收使用採樣口',result:sub.reuseSamplingPort,active:out.waterShowSublawReuse==='yes'},
      {key:'sub53l',label:'水措管理辦法§53 放流口位置',result:sub.outletLocation,active:out.waterShowSublawOutlet==='yes'},
      {key:'sub53a',label:'水措管理辦法§53 採樣道路／平台',result:sub.outletAccess,active:out.waterShowSublawOutlet==='yes'},
      {key:'sub53m',label:'水措管理辦法§53 放流水量計測',result:sub.outletMeter,active:out.waterShowSublawOutlet==='yes'},
      {key:'sub53s',label:'水措管理辦法§53 告示牌／座標',result:sub.outletSign,active:out.waterShowSublawOutlet==='yes'},
      {key:'sub53p',label:'水措管理辦法§53 可直接採樣',result:sub.outletSampling,active:out.waterShowSublawOutlet==='yes'},
      {key:'sub53x',label:'水措管理辦法§53 陰井均勻混合',result:sub.outletMixing,active:out.waterShowSublawOutletMixing==='yes'},
      {key:'sub65',label:'水措管理辦法§65 水量計校正維護',result:sub.meterCalibration,active:out.waterShowSublawMeter==='yes'},
      {key:'sub891d',label:'水措管理辦法§89-1 申報與證明文件一致',result:sub.reportingDocuments,active:out.waterShowSublawReporting==='yes'},
      {key:'sub891s',label:'水措管理辦法§89-1 申報與現場一致',result:sub.reportingSite,active:out.waterShowSublawReporting==='yes'}
    ];
    out.waterSublawOverviewText=sublawOverview(out,lawVersion,subItems);

    const industryItems=[];
    if(industry?.results){
      const ir=industry.results;
      const a9=out.waterShowIndustryArticle9==='yes', construction=out.waterShowIndustryConstruction==='yes', livestock=out.waterShowIndustryLivestockFertilizer==='yes';
      if(a9){
        industryItems.push(['ind9r','業別§9 遮雨／擋雨／導雨',root.WATER_INDUSTRY_RULES.article9RainProtection,ir.article9RainProtection]);
        industryItems.push(['ind9b','業別§9 沉砂池',root.WATER_INDUSTRY_RULES.article9SedimentationBasin,ir.article9SedimentationBasin]);
        industryItems.push(['ind9c','業別§9 沉砂池容量',root.WATER_INDUSTRY_RULES.article9BasinCapacity,ir.article9BasinCapacity]);
        industryItems.push(['ind9f','業別§9 沉砂池液位',root.WATER_INDUSTRY_RULES.article9BasinFreeboard,ir.article9BasinFreeboard]);
        industryItems.push(['ind9m','業別§9 不透水材質',root.WATER_INDUSTRY_RULES.article9BasinMaterial,ir.article9BasinMaterial]);
        industryItems.push(['ind9x','業別§9 維護清淤紀錄',root.WATER_INDUSTRY_RULES.article9Maintenance,ir.article9Maintenance]);
      }
      if(construction){
        industryItems.push(['ind10p','營建§10 削減計畫',root.WATER_INDUSTRY_RULES.constructionPlan,ir.constructionPlan]);
        industryItems.push(['ind10i','營建§10 依核准計畫實施',root.WATER_INDUSTRY_RULES.constructionImplementation,ir.constructionImplementation]);
      }
      if(livestock){
        industryItems.push(['ind70p','畜牧§70-1 農地肥分計畫',root.WATER_INDUSTRY_RULES.livestockFertilizerPlan,ir.livestockFertilizerPlan]);
        industryItems.push(['ind70o','畜牧§70-1 依計畫運作',root.WATER_INDUSTRY_RULES.livestockFertilizerOperation,ir.livestockFertilizerOperation]);
      }
    }
    out.waterIndustryOverviewText=industryItems.length?industryItems.map(([,label,rule,result])=>`【${label}】\n${resultBlock(rule,result,genericNarrative(result))}`).join('\n\n'):'目前未進入特定業別子法支線。';

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
    subItems.filter(x=>x.active).forEach(x=>summaries.push(`${x.label}：${sublawStatusLabel[x.result.status]}`));
    industryItems.forEach(([,label,,result])=>summaries.push(`${label}：${sublawStatusLabel[result.status]}`));
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
      if(input.waterDilutionObserved==='yes')add('a181d','§18-1 稀釋',rd);
      if(input.waterTreatmentFacilityApplicable==='yes')add('a181t','§18-1 處理設施',rt);
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
    subItems.filter(x=>x.active).forEach(x=>add(x.key,x.label,x.result));
    industryItems.forEach(([key,label,,result])=>add(key,label,result));
    out.waterFinalConclusionText=finalConclusion(input,activeForFinal,r59);
    out.waterLiveDecisionText=liveDecision(out);
    out.waterLiveMissingText=liveMissing(out);

    out.waterRuleStatus=r14.status;
    out.waterArticle14ElementsText=ruleLines(root.WATER_RULES.article14NoPermit,r14);
    out.waterAssessmentText=assess14(r14);out.waterMissingText=missingText(r14);out.waterNextChecksText=nextText(r14);
    return out;
  }
  root.WaterAssessment={apply};
})(typeof window==='undefined'?globalThis:window);
