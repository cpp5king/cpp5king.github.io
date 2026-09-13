(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__approvedDraftsWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const text=v=>typeof v==='string'?v.trim():'';
  const num=v=>text(String(v??''))!==''&&Number.isFinite(Number(v))?Number(v):null;
  const fmt=v=>Number.isFinite(v)?String(Math.round(v*10)/10):'';

  function getPath(path){
    return String(path||'').split('.').reduce((value,key)=>value?.[key],root.NOISE_TEXTS);
  }
  function render(path,values){
    const template=getPath(path);
    if(typeof template!=='string')throw new Error('找不到核定文字模板：'+path);
    return root.NoiseText.render(template,values);
  }
  function renderSourceStatus(path,values,statusText){
    const template=getPath(path);
    if(typeof template!=='string')throw new Error('找不到核定文字模板：'+path);
    const statusTemplate=template.replace('{{noiseSource}}未運轉','{{siteStatus}}');
    if(statusTemplate===template)throw new Error('噪音源未運轉核定文字缺少可替換之現場狀態片段：'+path);
    return root.NoiseText.render(statusTemplate,{...values,siteStatus:statusText});
  }
  function invalidDifference(input,out){
    if(!/相差小於3\s*dB|相差小於3分貝/.test(String(out?.noiseValidation||'')))return false;
    const pairs=[
      ['noiseValueFull','noiseBgFull','noiseBgFullMode'],
      ['noiseValueLeq','noiseBgFull','noiseBgFullMode'],
      ['noiseValueLmax','noiseBgLmax','noiseBgLmaxMode'],
      ['noiseValueLow','noiseBgLow','noiseBgLowMode']
    ];
    return pairs.some(([valueKey,bgKey,modeKey])=>input[modeKey]==='measured'&&num(input[valueKey])!==null&&num(input[bgKey])!==null&&(num(input[valueKey])-num(input[bgKey]))<3);
  }
  function rocDate(value){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
    if(!m||Number(m[1])<=1911)return root.NOISE_TEXTS.common.missing;
    return `${Number(m[1])-1911}年${Number(m[2])}月${Number(m[3])}日`;
  }
  function inspectionTime(value){
    const m=/^(\d{2}):(\d{2})$/.exec(text(value));
    if(!m)return root.NOISE_TEXTS.common.missing;
    return `${Number(m[1])}時${Number(m[2])?Number(m[2])+'分':''}許`;
  }
  function sourceMeta(input){
    const typeMap={
      factory:['工廠（場）','factory','噪音管制法第9條第1項第1款'],
      entertainment:['娛樂場所','business','噪音管制法第9條第1項第2款'],
      business:['營業場所','business','噪音管制法第9條第1項第3款'],
      construction:['營建工程','construction','噪音管制法第9條第1項第4款'],
      speaker:['擴音設施','speaker','噪音管制法第9條第1項第5款'],
      otherFacility:['新北市公告之其他設施','other','噪音管制法第9條第1項第6款及新北市115年3月5日公告'],
      renovation:['公告裝修工程','construction','噪音管制法第9條第1項第6款、新北市115年3月5日公告及噪音管制標準第8條第2項']
    };
    const row=typeMap[input.noiseA9Type];
    return row?{label:row[0],table:row[1],legalBasis:row[2]}:null;
  }
  function periodId(zone,time){return core.period?.(zone,time)||'';}
  function standards(meta,zone,p){
    const zi=Number(zone)-1,pi={day:0,evening:1,night:2}[p],table=root.NOISE_ARTICLE9_RULES?.tables?.[meta?.table];
    if(!table||zi<0||zi>3||pi===undefined)return {};
    return {full:table.full?.leq?.[zi]?.[pi],lmax:table.full?.lmax?.[zi]?.[pi],low:table.low?.leqLF?.[zi]?.[pi]};
  }
  function measurementPoint(input){
    const hasFull=text(input.noiseValueFull)||text(input.noiseValueLeq)||text(input.noiseValueLmax);
    const hasLow=text(input.noiseValueLow);
    if(hasFull&&input.noiseA9Type==='speaker')return {record:'主管機關指定之適當位置',reply:'主管機關指定之適當位置'};
    if(hasFull&&input.noiseFullPoint==='complainant')return {record:'陳情人指定之居住生活地點',reply:'臺端指定之生活居住場所'};
    if(hasFull&&input.noiseFullPoint==='authority')return {record:'主管機關指定之周界外適當測點',reply:'周界外之適當處所'};
    if(hasLow)return {record:'陳情人指定之居住生活室內地點',reply:'臺端指定之生活居住室內地點'};
    return {record:'依規定之適當測點',reply:'依規定之適當測點'};
  }
  function resultAndStandard(input){
    const meta=sourceMeta(input),p=periodId(input.noiseZone,input.noiseTime),std=standards(meta,input.noiseZone,p);
    const result=[],standard=[];
    if(meta?.table==='construction'){
      if(text(input.noiseValueLeq)){result.push(`均能音量為${text(input.noiseValueLeq)}分貝`);if(std.full!==undefined)standard.push(`均能：${std.full}分貝`);}
      if(text(input.noiseValueLmax)){result.push(`最大音量為${text(input.noiseValueLmax)}分貝`);if(std.lmax!==undefined)standard.push(`最大音量：${std.lmax}分貝`);}
    }else if(text(input.noiseValueFull)){
      const method=input.noiseGeneralMethod==='lmaxMean'?'最大音量平均值':input.noiseGeneralMethod==='l5'?'L5':input.noiseA9Type==='speaker'&&input.noiseSpeakerMode==='moving'?'最大音量':'一般均能音量';
      result.push(`${method}為${text(input.noiseValueFull)}分貝`);if(std.full!==undefined)standard.push(`${method}：${std.full}分貝`);
    }
    if(text(input.noiseValueLow)){result.push(`低頻均能音量為${text(input.noiseValueLow)}分貝`);if(std.low!==undefined)standard.push(`低頻均能：${std.low}分貝`);}
    return {resultText:result.join('、'),standardText:standard.join('、'),std,meta,p};
  }
  function backgroundText(input,calc){
    const parts=[];
    const metrics=[];
    if(calc.meta?.table==='construction'){
      if(text(input.noiseValueLeq))metrics.push(['均能音量',num(input.noiseValueLeq),calc.std.full,input.noiseBgFullMode,num(input.noiseBgFull)]);
      if(text(input.noiseValueLmax))metrics.push(['最大音量',num(input.noiseValueLmax),calc.std.lmax,input.noiseBgLmaxMode,num(input.noiseBgLmax)]);
    }else if(text(input.noiseValueFull))metrics.push(['全頻音量',num(input.noiseValueFull),calc.std.full,input.noiseBgFullMode,num(input.noiseBgFull)]);
    if(text(input.noiseValueLow))metrics.push(['低頻均能音量',num(input.noiseValueLow),calc.std.low,input.noiseBgLowMode,num(input.noiseBgLow)]);
    for(const [label,overall,std,mode,bg] of metrics){
      if(overall===null||std===undefined||overall<=std)continue;
      if(mode==='uncooperative'){parts.push(`${label}之背景音量因負責人／現場人員無法配合而未取得，依法不修正並註明`);continue;}
      if(mode!=='measured'||bg===null)continue;
      const c=core.correction?.(overall,bg);
      if(c?.status==='ok')parts.push(`另請業者關閉噪音源後量測${label}背景音量為${fmt(bg)}分貝，${c.note}${c.value!==overall?`修正後為${fmt(c.value)}分貝`:''}`);
    }
    return parts.join('；');
  }
  function commonValues(input){
    const calc=resultAndStandard(input),point=measurementPoint(input),periodLabel={day:'日間',evening:'晚間',night:'夜間'}[calc.p]||root.NOISE_TEXTS.common.missing;
    const background=backgroundText(input,calc);
    return {
      date:rocDate(input.noiseDate),time:inspectionTime(input.noiseTime),subject:text(input.noiseSubject)||root.NOISE_TEXTS.common.missing,
      operation:text(input.noiseOperation)||root.NOISE_TEXTS.common.missing,noiseSource:text(input.noiseSource)||root.NOISE_TEXTS.common.missing,
      legalBasis:calc.meta?.legalBasis||root.NOISE_TEXTS.common.missing,sourceType:calc.meta?.label||root.NOISE_TEXTS.common.missing,
      zone:text(input.noiseZone)||root.NOISE_TEXTS.common.missing,period:periodLabel,measurementPoint:point.record,measurementPointPublic:point.reply,
      resultText:calc.resultText||root.NOISE_TEXTS.common.missing,standardText:calc.standardText||root.NOISE_TEXTS.common.missing,
      backgroundText:background||'本次無須進行背景音量修正',backgroundClause:background?'，'+background:''
    };
  }
  function applyArticle8(input,out,map){
    out.noiseShowA8DraftFacts='yes';
    const subject=text(input.noiseA8Subject);
    if(!subject){
      out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';
      out.noiseValidation='請填寫第8條稽查對象代稱。';
      out.noiseGuide='第8條禁止行為已由現場選擇確認；填寫稽查對象後即可套用既有核定文字。';
      return out;
    }
    const act=(root.NOISE_ARTICLE8_RULES?.acts||[]).find(x=>x.id===input.noiseA8Act);
    const values={date:rocDate(input.noiseDate),article8TimeText:inspectionTime(input.noiseTime),subject,article8Zone:text(input.noiseZone),prohibitedAct:act?.label||root.NOISE_TEXTS.common.missing};
    const record=render(map.record,values);
    out.noiseRecord=record;
    out.noiseReply=map.replyWrap?root.NOISE_TEXTS.common.replyPrefix+render(map.reply,values)+root.NOISE_TEXTS.common.replyEnding:render(map.reply,values);
    out.noiseBlocked='no';out.noiseValidation='';
    return out;
  }
  function applyArticle9(input,out,map){
    if(!text(input.noiseOperation)){
      out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseValidation='請填寫現場作業情形。';out.noiseGuide='量測判定已完成；請補充現場作業情形後套用既有核定文字。';return out;
    }
    const values=commonValues(input);
    out.noiseRecord=render(map.record,values);
    out.noiseReply=map.replyWrap?root.NOISE_TEXTS.common.replyPrefix+render(map.reply,values)+root.NOISE_TEXTS.common.replyEnding:render(map.reply,values);
    out.noiseBlocked='no';out.noiseValidation='';
    return out;
  }
  function applyWeather(input,out,map){
    if(!text(input.noiseSubject)){out.noiseBlocked='yes';out.noiseValidation='請填入稽查對象代稱。';return out;}
    if(!text(input.noiseSource)){out.noiseBlocked='yes';out.noiseValidation='請填入主要噪音源／設備說明。';return out;}
    if(!text(input.noiseOperation)){out.noiseBlocked='yes';out.noiseValidation='請填寫現場作業情形。';return out;}
    const values=commonValues(input);
    out.noiseRecord=render(map.record,values);
    out.noiseReply=map.replyWrap?root.NOISE_TEXTS.common.replyPrefix+render(map.reply,values)+root.NOISE_TEXTS.common.replyEnding:render(map.reply,values);
    out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次量測條件不符，不作符合／超標判定；已套用既有核定之無法量測文字。';
    return out;
  }
  function noMeasureFlags(out,input){
    const showDecision=out.noiseShowMeasure==='yes'&&!!text(input.noiseSource);
    const decision=input.noiseMeasureDecision;
    const measuring=showDecision&&decision==='yes';
    const fullPointEligible=['factory','entertainment','business','construction','otherFacility','renovation'].includes(input.noiseA9Type);
    const fullAvailable=out.noiseShowFullAssessment==='yes'||out.noiseShowConstructionFull==='yes'||out.noiseShowConstructionLmax==='yes';
    const speakerFull=input.noiseA9Type==='speaker'&&out.noiseShowFullAssessment==='yes';
    const pointReady=!fullPointEligible||['complainant','authority'].includes(input.noiseFullPoint);
    const speakerReady=!speakerFull||['yes','no'].includes(input.noiseSpeakerOutdoor);
    out.noiseShowMeasureDecision=showDecision?'yes':'no';
    out.noiseShowMeasureInputs=measuring?'yes':'no';
    out.noiseShowNoMeasureReason=showDecision&&decision==='no'?'yes':'no';
    out.noiseShowNoMeasureDetail=out.noiseShowNoMeasureReason;
    // 決定進行量測後，先顯示測點；輸入全頻數值前不必先有數值才能看到測點。
    out.noiseShowFullPoint=measuring&&fullPointEligible&&fullAvailable?'yes':'no';
    out.noiseShowSpeakerLocation=measuring&&speakerFull?'yes':'no';
    const fullReady=measuring&&pointReady&&speakerReady;
    out.noiseShowInputFull=fullReady&&out.noiseShowFullAssessment==='yes'?'yes':'no';
    out.noiseShowInputConstructionFull=fullReady&&out.noiseShowConstructionFull==='yes'?'yes':'no';
    out.noiseShowInputConstructionLmax=fullReady&&out.noiseShowConstructionLmax==='yes'?'yes':'no';
    // 低頻測點固定依室內規則處理，不需要再詢問全頻測點室內／室外。
    out.noiseShowInputLow=measuring&&out.noiseShowLow==='yes'?'yes':'no';
    return out;
  }
  function applyNoMeasure(input,out){
    const subject=text(input.noiseSubject),source=text(input.noiseSource),reason=input.noiseNoMeasureReason,detail=text(input.noiseNoMeasureDetail);
    out.noiseOutcomeId='';out.noiseRecord='';out.noiseReply='';out.noiseBlocked='yes';
    out.noiseResultText='本次選擇不進行噪音量測，不作符合／超標判定。';
    if(!subject){out.noiseValidation='請填入稽查對象代稱。';out.noiseGuide='已選擇不進行量測；請先完成稽查對象。';return out;}
    if(!source){out.noiseValidation='請填入主要噪音源／設備說明。';out.noiseGuide='主要噪音源／設備說明完成後，再確認是否進行量測。';return out;}
    if(!reason){out.noiseValidation='請選擇本次不進行量測的原因。';out.noiseGuide='本案不進行量測；請記錄現場實際原因，系統不自行推定。';return out;}
    const values=commonValues({...input,noiseOperation:detail});
    if(reason==='sourceOff'){
      const map=root.NOISE_RESULT_TEXT_MAP?.['article9.sourceOff'];
      out.noiseOutcomeId='article9.sourceOff';
      out.noiseRecord=render(map.record,values);out.noiseReply=render(map.reply,values);
      out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次因噪音源／設備未運轉，不進行量測；已套用既有核定文字。';return out;
    }
    if(reason==='noSpeaker'){
      if(input.noiseA9Type!=='speaker'){
        out.noiseValidation='「現場未發現擴音設備」僅適用擴音設施案件，請重新選擇不量測原因。';out.noiseGuide=out.noiseValidation;return out;
      }
      const map=root.NOISE_RESULT_TEXT_MAP?.['article9.noSpeaker'];
      out.noiseOutcomeId='article9.noSpeaker';
      out.noiseRecord=render(map.record,values);out.noiseReply=render(map.reply,values);
      out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次現場未發現擴音設備，不進行量測；已套用既有核定文字。';return out;
    }
    if(reason==='rain'){
      if(!detail){out.noiseValidation='請補充現場作業情形／天雨狀況。';out.noiseGuide='天雨路濕不宜量測時，請補充當時現場作業情形。';return out;}
      const map=root.NOISE_RESULT_TEXT_MAP?.['article9.weather.rain'];
      out.noiseOutcomeId='article9.weather.rain';
      out.noiseRecord=render(map.record,values);
      out.noiseReply=map.replyWrap?root.NOISE_TEXTS.common.replyPrefix+render(map.reply,values)+root.NOISE_TEXTS.common.replyEnding:render(map.reply,values);
      out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次因天雨路濕不宜量測，不作符合／超標判定。';return out;
    }
    if(reason==='doorLocked'){
      const map=root.NOISE_RESULT_TEXT_MAP?.['article9.sourceOff'];
      out.noiseOutcomeId='article9.doorLocked';
      out.noiseRecord=renderSourceStatus(map.record,values,'現場大門深鎖');
      out.noiseReply=renderSourceStatus(map.reply,values,'現場大門深鎖');
      out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次因現場大門深鎖不進行量測；沿用既有「噪音源未運轉」核定文字架構，僅替換現場狀態。';return out;
    }
    if(!detail){out.noiseValidation='請填寫不量測原因說明。';out.noiseGuide='請記錄未進行量測的實際現場原因。';return out;}
    const date=rocDate(input.noiseDate),time=inspectionTime(input.noiseTime);
    const fact=`其他現場原因：${detail}`;
    out.noiseOutcomeId='article9.notMeasured.other';
    out.noiseRecord=`本局於${date}${time}派員前往稽查，經查該址為${subject}，主要噪音源／設備為${source}，本次未進行噪音量測，原因為${fact}。`;
    out.noiseReply=root.NOISE_TEXTS.common.replyPrefix+`本局於${date}${time}派員前往稽查，經查該址為${subject}，主要噪音源／設備為${source}，本次因${fact}，未進行噪音量測。`+root.NOISE_TEXTS.common.replyEnding;
    out.noiseBlocked='no';out.noiseValidation='';out.noiseGuide='本次未進行量測；僅記錄現場事實，不作符合／超標判定。';return out;
  }

  function prepare(input={}){
    let out=noMeasureFlags(innerPrepare(input),input);
    out.noiseShowA8DraftFacts='no';

    // 主要噪音源／設備說明完成後，先由稽查員決定本次是否實際進行量測。
    if(out.noiseShowMeasureDecision==='yes'){
      if(!['yes','no'].includes(input.noiseMeasureDecision)){
        out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseOutcomeId='';
        out.noiseValidation='請確認本次是否進行噪音量測。';
        out.noiseGuide='主要噪音源／設備已確認；請選擇是否進行量測。';
        return out;
      }
      if(input.noiseMeasureDecision==='no')return applyNoMeasure(input,out);
      if(out.noiseShowFullPoint==='yes'&&!['complainant','authority'].includes(input.noiseFullPoint)&&!text(input.noiseValueLow)){
        out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseOutcomeId='';
        out.noiseValidation='請先選擇全頻測點，再輸入全頻量測值。';
        out.noiseGuide='本次已確認進行量測；請先確認全頻測點。低頻量測固定依室內測點規則處理。';
        return out;
      }
      if(out.noiseShowSpeakerLocation==='yes'&&!['yes','no'].includes(input.noiseSpeakerOutdoor)&&!text(input.noiseValueLow)){
        out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseOutcomeId='';
        out.noiseValidation='請先確認擴音設施實際量測點，再輸入全頻量測值。';
        out.noiseGuide=out.noiseValidation;
        return out;
      }
    }

    const differenceInvalid=invalidDifference(input,out);
    out.noiseShowDifferenceAction=differenceInvalid?'yes':'no';
    if(differenceInvalid){
      if(input.noiseDifferenceAction==='finish'){
        out.noiseOutcomeId='article9.differenceEnded';
        const differenceMap=root.NOISE_RESULT_TEXT_MAP?.['article9.differenceEnded'];
        try{return applyArticle9(input,out,differenceMap);}catch(error){
          out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseValidation='小於3 dB結束量測文字無法套用，請重新開啟系統後再試。';out.noiseGuide=error.message;return out;
        }
      }
      out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseOutcomeId='';
      out.noiseValidation='請選擇再次量測或結束本次量測。';
      out.noiseGuide='整體音量與背景音量相差小於3 dB；可重新選擇測點／降低其他噪音後再次量測，或結束本次量測。';
      return out;
    }
    out.noiseDifferenceAction='';

    const outcome=out.noiseOutcomeId;
    const map=root.NOISE_RESULT_TEXT_MAP?.[outcome];
    if(!map||map.status!=='active')return out;
    try{
      if(outcome==='article8.established')return applyArticle8(input,out,map);
      if(outcome==='article9.compliant'||outcome==='article9.exceeded'||outcome==='article9.differenceEnded')return applyArticle9(input,out,map);
      if(outcome==='article9.weather.rain'||outcome==='article9.weather.wind')return applyWeather(input,out,map);
    }catch(error){
      out.noiseBlocked='yes';out.noiseRecord='';out.noiseReply='';out.noiseValidation='核定文字模板無法套用，請重新開啟系統後再試。';out.noiseGuide=error.message;
    }
    return out;
  }
  function resetChange(before={},after={}){
    // FieldRenderer only reads editable DOM controls. Workflow/computed noise fields are not
    // controls, so they are absent from `after`; passing that sparse object into older reset
    // layers made an ordinary measurement keystroke look like a method/route change and the
    // just-entered value was immediately cleared. Preserve prior derived facts for comparison,
    // while letting the current editable controls override them.
    const comparable={...before,...after};
    const next=innerReset(before,comparable),clear=keys=>keys.forEach(key=>{next[key]='';});
    const measurementKeys=['noiseOperation','noiseGeneralSpecialAssessment','noiseGeneralBg10','noiseGeneralSpread','noiseFullPoint','noiseSpeakerOutdoor','noiseWind','noiseGeneralMethod','noiseSpeakerMode','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow'];
    if(['noiseDate','noiseTime','noiseZone','noiseA8Act'].some(key=>before[key]!==comparable[key]))clear(['noiseA8Subject']);
    if(before.noiseA9Type!==comparable.noiseA9Type)clear(['noiseMeasureDecision','noiseNoMeasureReason','noiseNoMeasureDetail',...measurementKeys]);
    if(before.noiseSource!==comparable.noiseSource)clear(['noiseMeasureDecision','noiseNoMeasureReason','noiseNoMeasureDetail',...measurementKeys]);
    if(before.noiseMeasureDecision!==comparable.noiseMeasureDecision){
      if(comparable.noiseMeasureDecision==='yes')clear(['noiseNoMeasureReason','noiseNoMeasureDetail']);
      else if(comparable.noiseMeasureDecision==='no')clear(measurementKeys);
    }
    if(before.noiseNoMeasureReason!==comparable.noiseNoMeasureReason)clear(['noiseNoMeasureDetail']);
    const retryMeasurementKeys=['noiseGeneralSpecialAssessment','noiseGeneralBg10','noiseGeneralSpread','noiseFullPoint','noiseSpeakerOutdoor','noiseWind','noiseGeneralMethod','noiseSpeakerMode','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow'];
    if(before.noiseDifferenceAction!==comparable.noiseDifferenceAction&&comparable.noiseDifferenceAction==='retry'){
      clear([...retryMeasurementKeys,'noiseDifferenceAction']);
    }else if(['noiseFullPoint','noiseSpeakerOutdoor','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow'].some(key=>before[key]!==comparable[key])){
      clear(['noiseDifferenceAction']);
    }
    return next;
  }
  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,__approvedDraftsWrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noiseApprovedDrafts=config=>{
    const t=config?.templates?.find(x=>x.id==='noise-main');if(!t||t.__approvedDraftsPatched)return;
    const fields=t.fields||[],missing='（尚未確認）';
    const computed=(id,label)=>({id,label,type:'computed',missing,display:false});
    const field=(id,label,displayWhen,extra={})=>({id,label,type:'text',missing,displayWhen,...extra});
    const select=(id,label,options,displayWhen)=>({id,label,type:'select',missing,allowCustom:false,options:options.map(([value,label,when])=>({id:value,value:label,label,...(when?{when}:{})})),displayWhen});
    const firstInput=fields.findIndex(f=>!['computed','fixed'].includes(f.type));
    fields.splice(firstInput<0?0:firstInput,0,
      computed('noiseOutcomeId','outcome-id'),computed('noiseShowA8DraftFacts','a8-draft-facts'),
      computed('noiseShowMeasureDecision','measure-decision'),computed('noiseShowMeasureInputs','measure-inputs'),
      computed('noiseShowNoMeasureReason','no-measure-reason'),computed('noiseShowNoMeasureDetail','no-measure-detail'),
      computed('noiseShowInputFull','input-full'),computed('noiseShowInputConstructionFull','input-construction-full'),
      computed('noiseShowInputConstructionLmax','input-construction-lmax'),computed('noiseShowInputLow','input-low'),computed('noiseShowDifferenceAction','difference-action')
    );
    const a8Summary=fields.findIndex(f=>f.id==='noiseA8ExceptionSummary');
    const a8Insert=a8Summary>=0?a8Summary+1:fields.findIndex(f=>f.id==='noiseA9Type');
    fields.splice(a8Insert,0,
      field('noiseA8Subject','第8條｜稽查對象代稱',{field:'noiseShowA8DraftFacts',value:'yes'})
    );

    const sourceIndex=fields.findIndex(f=>f.id==='noiseSource');
    if(sourceIndex>=0){
      fields.splice(sourceIndex+1,0,
        select('noiseMeasureDecision','本次是否進行噪音量測？',[
          ['yes','是｜進行量測，繼續輸入全頻／低頻數值'],
          ['no','否｜不進行量測，記錄原因']
        ],{field:'noiseShowMeasureDecision',value:'yes'}),
        select('noiseNoMeasureReason','不量測原因',[
          ['sourceOff','稽查時噪音源／設備未運轉'],
          ['noSpeaker','現場未發現擴音設備',{field:'noiseA9Type',value:'speaker'}],
          ['rain','天雨路濕，不宜進行噪音量測'],
          ['doorLocked','大門深鎖'],
          ['other','其他原因']
        ],{field:'noiseShowNoMeasureReason',value:'yes'}),
        field('noiseNoMeasureDetail','不量測原因補充說明',{field:'noiseShowNoMeasureDetail',value:'yes'},{placeholder:'請記錄現場實際情形；其他原因時必填'}),
        field('noiseOperation','現場作業情形',{field:'noiseShowMeasureInputs',value:'yes'})
      );
    }

    // 「測點是否位於室內」已由測點選擇自動判定，不再保留獨立欄位。
    const indoorIndex=fields.findIndex(f=>f.id==='noiseFullIndoor');
    if(indoorIndex>=0)fields.splice(indoorIndex,1);
    // 天雨路濕已在「不進行量測」原因處理；進入實際量測後不再重複詢問是否下雨。
    const rainIndex=fields.findIndex(f=>f.id==='noiseRain');
    if(rainIndex>=0)fields.splice(rainIndex,1);

    // 量測值必須排在測點之後；仍使用 number 欄位以支援整數及小數輸入。
    const valueFlags={noiseValueFull:'noiseShowInputFull',noiseValueLeq:'noiseShowInputConstructionFull',noiseValueLmax:'noiseShowInputConstructionLmax',noiseValueLow:'noiseShowInputLow'};
    const valueIds=Object.keys(valueFlags),valueFields=[];
    for(const id of valueIds){
      const i=fields.findIndex(f=>f.id===id);if(i<0)continue;
      const f=fields.splice(i,1)[0];
      f.type='number';f.min=0;delete f.inputMode;
      f.displayWhen={field:valueFlags[id],value:'yes'};
      valueFields.push(f);
    }
    const weatherAnchor=fields.findIndex(f=>f.id==='noiseWind');
    const pointAnchor=fields.findIndex(f=>f.id==='noiseSpeakerOutdoor');
    const insertAfter=weatherAnchor>=0?weatherAnchor:pointAnchor;
    if(insertAfter>=0)fields.splice(insertAfter+1,0,...valueFields);

    const bgAnchor=fields.findIndex(f=>f.id==='noiseBgLow');
    const actionField=select('noiseDifferenceAction','整體音量與背景音量相差小於3 dB｜下一步',[['retry','再次量測｜重新選擇測點／降低其他噪音後重新輸入'],['finish','結束本次量測｜不作符合／超標判定']],{field:'noiseShowDifferenceAction',value:'yes'});
    if(bgAnchor>=0)fields.splice(bgAnchor+1,0,actionField);else fields.push(actionField);

    t.version='4.9-rebuild-22';t.moduleVersion='4.9-rebuild-22';t.__approvedDraftsPatched=true;
  };
})(typeof window==='undefined'?globalThis:window);
