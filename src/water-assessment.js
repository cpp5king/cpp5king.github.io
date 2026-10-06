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
      return root.WaterLaw.finalMessage('severeHazard')||'D｜重大／緊急污染\n優先控制污染、保護下游並固定相關證據；法律研判不得優先於污染控制。';
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
    const subItems=root.WaterMeasureLaw.assessmentItems('common',{input,facts,out,results:sub});
    out.waterSublawOverviewText=sublawOverview(out,lawVersion,subItems);

    const industryItems=industry?.results
      ?root.WaterMeasureLaw.assessmentItems('industry',{input,facts,out,results:industry.results}).filter(item=>item.active)
      :[];
    out.waterIndustryOverviewText=industryItems.length?industryItems.map(item=>`【${item.label}】\n${resultBlock(item.rule,item.result,genericNarrative(item.result))}`).join('\n\n'):'目前未進入特定業別子法支線。';

    const resultMap={
      article13Plan:r13,
      article14NoPermit:r14,
      article7Effluent:r7,
      article18Measures:r18,
      article181Bypass:rb,
      article181Dilution:rd,
      article181Treatment:rt,
      article20StorageNoPermit:r20s,
      article20StorageMismatch:r20sm,
      article20DilutionNoPermit:r20d,
      article20DilutionMismatch:r20dm,
      article22Reporting:r22,
      article35FalseReporting:r35,
      article26Obstruction:r26,
      article27Emergency:r27e,
      article27Notice:r27n,
      article28Prevention:r28p,
      article28Emergency:r28e,
      article28Notice:r28n,
      article30Dumping:r30,
      article32Soil:r32s,
      article32Groundwater:r32g,
      article59Exception:r59,
      article71Cleanup:r71
    };

    const summaries=[];
    const addSummary=(ruleKey,value)=>summaries.push(root.WaterLaw.summaryLabel(ruleKey)+'：'+value);

    if(facts.subjectIsBusiness==='yes')addSummary('article13Plan',input.waterArticle13NewOrChangeConfirmed==='yes'?statusLabel[r13.status]:(input.waterArticle13NewOrChangeConfirmed==='no'?'— 未進入':'? 待確認'));
    if(out.waterShowArticle14==='yes')addSummary('article14NoPermit',statusLabel[r14.status]);
    if(out.waterShowArticle7==='yes')addSummary('article7Effluent',statusLabel[r7.status]);
    if(facts.subjectIsBusiness==='yes')addSummary('article18Measures',input.waterArticle18SpecificDutyConfirmed==='yes'?statusLabel[r18.status]:(input.waterArticle18SpecificDutyConfirmed==='no'?'— 未進入':'? 待查子法'));

    if(out.waterShowArticle181==='yes'){
      addSummary('article181Bypass',statusLabel[rb.status]);
      addSummary('article181Dilution',statusLabel[rd.status]);
      addSummary('article181Treatment',statusLabel[rt.status]);
      if(input.waterDestination==='storage')addSummary('article20StorageNoPermit',statusLabel[r20s.status]);
      if(input.waterDilutionObserved==='yes')addSummary('article20DilutionNoPermit',statusLabel[r20d.status]);
      addSummary('article22Reporting',input.waterArticle22ReportingDutyConfirmed==='yes'?statusLabel[r22.status]:(input.waterArticle22ReportingDutyConfirmed==='no'?'— 未進入':'? 待確認'));
    }

    if(out.waterShowFalseDetails==='yes')addSummary('article35FalseReporting',statusLabel[r35.status]);
    if(out.waterShowArticle26Obstruction==='yes')addSummary('article26Obstruction',statusLabel[r26.status]);
    if(out.waterShowArticle27==='yes')addSummary('article27Emergency',input.waterSevereHazardRiskConfirmed==='yes'?statusLabel[r27e.status]:(input.waterSevereHazardRiskConfirmed==='no'?'— 未進入':'? 待確認'));
    if(out.waterShowArticle28==='yes'&&input.waterArticle28Scenario)addSummary('article28Prevention',input.waterArticle28Scenario==='no'?'— 未進入':statusLabel[r28p.status]);
    if(out.waterShowArticle32==='yes')addSummary(input.waterDestination==='soil'?'article32Soil':'article32Groundwater',statusLabel[(input.waterDestination==='soil'?r32s:r32g).status]);
    if(out.waterShowArticle30==='yes')addSummary('article30Dumping',statusLabel[r30.status]);
    if(input.waterFacilityFailureConfirmed==='yes')addSummary('article59Exception',statusLabel[r59.status]);
    if(input.waterSurfaceWaterPollutionEventConfirmed==='yes')addSummary('article71Cleanup',statusLabel[r71.status]);

    subItems.filter(x=>x.active).forEach(x=>summaries.push(x.label+'：'+sublawStatusLabel[x.result.status]));
    industryItems.forEach(item=>summaries.push(item.label+'：'+sublawStatusLabel[item.result.status]));
    if(!summaries.length)summaries.push('目前尚未進入可判斷之主要條文模組。');

    out.waterRulesOverviewText=summaries.join('\n');
    out.waterArticle13Text=guardedText('article13Plan',input,r13);
    out.waterArticle14Text=coreResultBlock('article14NoPermit',r14);
    out.waterArticle7Text=article7Text(input,r7,r59);
    out.waterArticle18Text=guardedText('article18Measures',input,r18);
    out.waterArticle181Text=groupText('article181',input,resultMap);
    out.waterArticle20Text=groupText('article20',input,resultMap);
    out.waterArticle22Text=guardedText('article22Reporting',input,r22);
    out.waterArticle35Text=coreResultBlock('article35FalseReporting',r35);
    out.waterArticle26Text=guardedText('article26Obstruction',input,r26);
    out.waterArticle27Text=groupText('article27',input,resultMap);
    out.waterArticle28Text=groupText('article28',input,resultMap);
    out.waterArticle32Text=groupText('article32',input,resultMap);
    out.waterArticle30Text=coreResultBlock('article30Dumping',r30);
    out.waterArticle59Text=guardedText('article59Exception',input,r59);
    out.waterArticle71Text=guardedText('article71Cleanup',input,r71);

    const activeForFinal=[];
    const addRule=(key,ruleKey,result)=>activeForFinal.push({key,ruleKey,label:root.WaterLaw.summaryLabel(ruleKey),result});
    const addOther=(key,label,result)=>activeForFinal.push({key,ruleKey:null,label,result});

    if(facts.subjectIsBusiness==='yes'&&input.waterArticle13NewOrChangeConfirmed==='yes')addRule('a13','article13Plan',r13);
    if(out.waterShowArticle14==='yes')addRule('a14','article14NoPermit',r14);
    if(out.waterShowArticle7==='yes')addRule('a7','article7Effluent',r7);
    if(facts.subjectIsBusiness==='yes'&&input.waterArticle18SpecificDutyConfirmed==='yes')addRule('a18','article18Measures',r18);

    if(out.waterShowArticle181==='yes'){
      const g181=root.WaterLaw.group('article181',input);
      if(g181.state==='active')g181.ruleKeys.forEach(ruleKey=>addRule(ruleKey,ruleKey,resultMap[ruleKey]));
      const g20=root.WaterLaw.group('article20',input);
      if(g20.state==='active')g20.ruleKeys.forEach(ruleKey=>addRule(ruleKey,ruleKey,resultMap[ruleKey]));
      if(input.waterArticle22ReportingDutyConfirmed==='yes')addRule('a22','article22Reporting',r22);
    }

    if(out.waterShowFalseDetails==='yes')addRule('a35','article35FalseReporting',r35);
    if(out.waterShowArticle26Obstruction==='yes')addRule('a26','article26Obstruction',r26);
    if(out.waterShowArticle27==='yes'){
      const g27=root.WaterLaw.group('article27',input);
      if(g27.state==='active')g27.ruleKeys.forEach(ruleKey=>addRule(ruleKey,ruleKey,resultMap[ruleKey]));
    }
    if(out.waterShowArticle28==='yes'){
      const g28=root.WaterLaw.group('article28',input);
      if(g28.state==='active')g28.ruleKeys.forEach(ruleKey=>addRule(ruleKey,ruleKey,resultMap[ruleKey]));
    }
    if(out.waterShowArticle32==='yes'){
      const g32=root.WaterLaw.group('article32',input);
      if(g32.state==='active')g32.ruleKeys.forEach(ruleKey=>addRule(ruleKey,ruleKey,resultMap[ruleKey]));
    }
    if(out.waterShowArticle30==='yes')addRule('a30','article30Dumping',r30);

    subItems.filter(x=>x.active).forEach(x=>addOther(x.key,x.label,x.result));
    industryItems.forEach(item=>addOther(item.key,item.label,item.result));

    out.waterFinalConclusionText=finalConclusion(input,activeForFinal,r59);
    out.waterLiveDecisionText=liveDecision(out);
    out.waterLiveMissingText=liveMissing(out);

    out.waterRuleStatus=r14.status;
    out.waterArticle14ElementsText=ruleLines(root.WaterLaw.getRule('article14NoPermit','core'),r14);
    out.waterAssessmentText=root.WaterLaw.narrative('article14NoPermit',r14.status);
    out.waterMissingText=missingText(r14);
    out.waterNextChecksText=nextText(r14);
    return out;
  }
  root.WaterAssessment={apply};
})(typeof window==='undefined'?globalThis:window);
