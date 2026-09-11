(function(root){
  'use strict';
  const legacy=()=>root.TemplateWorkflows.noiseArticle8;
  const template=()=>root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-main');
  const common=['mainDate','mainTime','mainZone','mainHoliday'];
  const text=x=>typeof x==='string'?x.trim():'';
  const yes=b=>b?'yes':'no';
  function article8(input){return {...input,scenario:'article8',date:input.mainDate,article8Time:input.mainTime,article8Zone:input.mainZone,article8Holiday:input.mainHoliday,prohibitedAct:template().scope.excludedActIds.includes(input.mainAct)?'':input.mainAct};}
  function article9(input){
    // Only Article 9 inputs cross the branch boundary. No Article 8 facts reach its documents.
    return {...Object.fromEntries(Object.entries(input).filter(([key])=>key.startsWith('a9'))),scenario:'article9',a9RepeatedBackground:input.backgroundRepeated||'',a9BackgroundMeasurements:input.backgroundMeasurements||'',a9Date:input.mainDate,a9Time:input.mainTime,a9Zone:input.mainZone,a9Operation:input.mainMeasure==='yes'?root.NOISE_TEXTS.main.measuredOperation:''};
  }
  function route(input){
    const state=root.NoiseArticle8.evaluate(article8(input));
    // Unit scope filters engine results; the official rule collection is never altered.
    state.candidates=state.candidates.filter(a=>!template().scope.excludedActIds.includes(a.id));
    const confirmed=state.zoneValid&&(!state.needsHoliday||['yes','no'].includes(input.mainHoliday));
    let branch='article8';
    if(confirmed&&(!state.candidates.length||input.mainAct==='none'||state.status===root.NOISE_ARTICLE8_RULES.messages.exempt))branch='article9';
    return {branch,state,confirmed};
  }
  function reasons(input){return template().unmeasured.reasons.filter(r=>Array.isArray(input.mainReasons)&&input.mainReasons.includes(r.id)&&(!r.types||r.types.includes(input.a9Type)));}
  function dateTime(input){const [y,m,d]=(input.mainDate||'').split('-').map(Number);return {date:`${y-1911}年${m}月${d}日`,time:root.NoiseFormat.inspectionHour(input.mainTime)};}
  function knownSource(input){
    if(input.mainMeasure!=='no'||!input.mainReasons?.includes('source'))return '';
    const r=root.NOISE_ARTICLE9_RULES;
    if(input.a9Type==='speaker')return r.types.find(t=>t.id==='speaker').label;
    if(input.a9Type==='other')return r.facilities.find(f=>f.id===input.a9Facility)?.label||'';
    return '';
  }
  function validate(input){
    const {branch,state}=route(input),errors=[];
    const required=(key,label)=>{if(!text(input[key])||text(input[key]).includes(window.NOISE_TEXTS.common.missing))errors.push(window.NOISE_TEXTS.main.requiredPrefix+label);};
    if(!root.NoiseFormat.validTime(input.mainTime))return [root.NOISE_TEXTS.ui.timeInvalid];
    if(!root.NOISE_ARTICLE9_RULES.zones.some(z=>z.id===input.mainZone))return [root.NOISE_TEXTS.ui.zoneRequired];
    const subjectRequired=key=>{if(!text(input[key])||text(input[key]).includes(root.NOISE_TEXTS.common.missing))errors.push(root.NOISE_TEXTS.ui.subjectRequired);};
    if(branch==='article8'){
      if(!state.established)return [state.status];
      subjectRequired('subject');
      return errors;
    }
    if(!['yes','no'].includes(input.mainMeasure))return [window.NOISE_TEXTS.main.text029];
    if(!root.NOISE_ARTICLE9_RULES.types.some(t=>t.id===input.a9Type))return [window.NOISE_TEXTS.main.text030];
    if(input.a9Type==='other'&&!root.NOISE_ARTICLE9_RULES.facilities.some(f=>f.id===input.a9Facility))return [window.NOISE_TEXTS.main.text031];
    if(input.mainMeasure==='no'){
      const selected=reasons(input).map(r=>r.id);
      if(!selected.length)return [window.NOISE_TEXTS.main.text032];
      subjectRequired('a9Subject');
      if(selected.includes('source')&&!knownSource(input))required('a9Source',window.NOISE_TEXTS.templates.text039);
      if(selected.includes('other'))required('mainReasonOther',window.NOISE_TEXTS.main.text018);
    }else{
      subjectRequired('a9Subject');required('a9Source',window.NOISE_TEXTS.templates.text039);
      const measure=root.NoiseArticle9Measurement.assess(article9(input));
      if(!measure.ready){
        if(!['yes','no'].includes(input.a9Rain))errors.push(window.NOISE_TEXTS.main.text033);
        else if(input.a9Rain==='no'&&!['yes','no'].includes(input.a9Home))errors.push(window.NOISE_TEXTS.main.text034);
        else if(!measure.items.length)errors.push(window.NOISE_TEXTS.main.text035);
        else if(!text(input.a9WindSpeed))errors.push(window.NOISE_TEXTS.main.text036);
        else if(input.a9Unavailable?.includes('unavailable')&&!text(input.a9CannotReason))errors.push(window.NOISE_TEXTS.main.text037);
        else errors.push(measure.status==='difference'?root.NOISE_TEXTS.ui.backgroundFailure:measure.message===window.NOISE_TEXTS.common.missing?window.NOISE_TEXTS.main.text038:measure.message);
      }
    }
    return errors;
  }
  function unmeasured(input){
    const data=template().unmeasured;
    const selected=reasons(input),source=selected.some(r=>r.id==='source');
    // Each selected fact contributes exactly one fragment, in data-file order.
    // Document envelopes contain no unselected inspection findings.
    const phrase=r=>{
      if(r.id==='other')return text(input.mainReasonOther).replace(/^[，。；、\s]+|[，。；、\s]+$/g,'');
      if(r.id==='source')return data.sourceFact.replace(/\{\{noiseSource\}\}/g,()=>knownSource(input)||text(input.a9Source));
      return r.phrase;
    };
    const values={...dateTime(input),subject:text(input.a9Subject),ending:data.ending,factsText:selected.map(phrase).filter(Boolean).join('，')};
    const record=root.NoiseText.render(data[source?'source':'place'],values);
    return {record,reply:data.prefix+record+data.suffix};
  }
  function prepare(input){
    input=reconcile(input);
    input=root.NoiseBackgrounds.sync(input,article9(input));
    const {branch,state,confirmed}=route(input);
    const eight=legacy().prepare(article8(input));
    for(const id of template().scope.excludedActIds)eight['a8Candidate_'+id]='no';
    const measuring=branch==='article9'&&input.mainMeasure==='yes';
    const validType=root.NOISE_ARTICLE9_RULES.types.some(t=>t.id===input.a9Type);
    const validFacility=input.a9Type!=='other'||root.NOISE_ARTICLE9_RULES.facilities.some(f=>f.id===input.a9Facility);
    const factsReady=branch==='article9'&&['yes','no'].includes(input.mainMeasure)&&validType&&validFacility;
    const nine=legacy().prepare({...article9(input),scenario:measuring&&factsReady?'article9':''});
    const out={...input,...eight,...Object.fromEntries(Object.entries(nine).filter(([k])=>k.startsWith('a9')))};
    // Hidden does not mean invalid: keep sanitized user facts while another route is visible.
    for(const f of template().fields)if(!['computed','fixed'].includes(f.type))out[f.id]=input[f.id]??(f.type==='checklist'?[]:'');
    for(const key of common)out[key]=input[key]||'';
    out.mainAct=state.candidates.some(a=>a.id===input.mainAct)||input.mainAct==='none'?input.mainAct:'';
    out.scenario=measuring&&factsReady?'article9':'article8';
    out.mainRoute=branch;
    out.mainShowZone=yes(state.ready);out.mainShowHoliday=yes(state.needsHoliday);out.mainShowActs=yes(confirmed&&state.candidates.length);
    out.mainShowType=yes(branch==='article9'&&['yes','no'].includes(input.mainMeasure));
    const selected=reasons(input).map(r=>r.id);
    out.mainReasons=selected;
    out.mainShowFacts=yes(factsReady&&(measuring||selected.length));out.mainUnmeasured=yes(factsReady&&input.mainMeasure==='no');
    out.mainShowSource=yes(factsReady&&(measuring||(selected.includes('source')&&!knownSource(input))));
    out.mainOtherReason=yes(out.mainUnmeasured==='yes'&&selected.includes('other'));
    const formatted=dateTime(input);
    out.mainSummary=factsReady?window.NOISE_TEXTS.main.text039+formatted.date+window.NOISE_TEXTS.main.text040+input.mainTime+window.NOISE_TEXTS.main.text041+input.mainZone+window.NOISE_TEXTS.main.text042+(measuring?window.NOISE_TEXTS.main.text043+nine.a9Period:''):'';
    // Measured controls remain governed by the existing engine, after type and site facts.
    if(!factsReady||!measuring){for(const k of Object.keys(out))if(k.startsWith('a9Show'))out[k]='no';}
    out.mainRecord='';out.mainReply='';let documents=null;
    const errors=validate(input);out.mainValidation=errors[0]||'';
    if(!errors.length){
      if(branch==='article8'&&state.established)documents=root.DraftEngine.generate(root.INSPECTION_CONFIG,'noise-case',article8(input));
      if(factsReady&&input.mainMeasure==='no')documents=unmeasured(input);
      if(measuring&&factsReady&&nine.a9Blocked==='no')documents={record:nine.a9Record,reply:nine.a9Reply};
    }
    if(documents){out.mainRecord=documents.record;out.mainReply=documents.reply;}
    out.mainBlocked=yes(!documents);
    out.mainGuide=state.status;
    if(branch==='article9'){
      const entry=!state.candidates.length?window.NOISE_TEXTS.main.text044:window.NOISE_TEXTS.main.enterArticle9;
      const step=out.mainShowType!=='yes'?window.NOISE_TEXTS.main.text046:!factsReady?window.NOISE_TEXTS.main.text047:!measuring?window.NOISE_TEXTS.main.noMeasurementGuide:nine.a9ShowBackground==='yes'?window.NOISE_TEXTS.main.text049:nine.a9ShowValues==='yes'?window.NOISE_TEXTS.main.measurementGuide:window.NOISE_TEXTS.main.text051;
      out.mainGuide=entry+'\n'+(documents?window.NOISE_TEXTS.main.text052:nine.a9Retry==='yes'?window.NOISE_TEXTS.main.text053:step);
    }
    if(out.mainValidation&&!template().validateOnSubmit)out.mainGuide+='\n'+out.mainValidation;
    if(measuring&&nine.a9ShowValues==='yes')out.mainGuide+='\n'+root.NOISE_TEXTS.ui.metricsHint;
    const backgroundFailed=measuring&&nine.a9Retry==='yes'&&nine.a9RetryLabel===root.NOISE_TEXTS.ui.retryDifference;
    out.mainShowDuration=yes(nine.a9ShowValues==='yes'&&input.backgroundLocked!=='yes'&&!backgroundFailed);
    out.backgroundHistoryText=measuring?root.NoiseBackgrounds.describe(input.backgroundMeasurements):'';
    if(measuring&&input.backgroundLocked==='yes'&&nine.a9Blocked!=='no')out.mainGuide=root.NOISE_TEXTS.ui.backgroundGuide;
    if(backgroundFailed){out.mainGuide=root.NOISE_TEXTS.ui.backgroundFailure;out.a9MeasurementStatus=root.NOISE_TEXTS.ui.backgroundFailure;}
    out.attemptHistoryText=measuring?root.NoiseAttempts.describe(input.measurementAttempts):'';
    return out;
  }
  function resetChange(before,after){
    const changed=keys=>keys.some(k=>JSON.stringify(before[k]??'')!==JSON.stringify(after[k]??''));
    const checks=root.NOISE_ARTICLE8_RULES.acts.flatMap(a=>[...(a.exceptionChecks||[]),...(a.exceptions||[]).flatMap(e=>e.checks||[])]).map(c=>c.id);
    const next={...after};
    if(before.backgroundLocked==='yes'&&after.backgroundLocked==='yes')for(const key of root.NoiseBackgrounds.sourceKeys)next[key]=before[key];
    if(before.mainDate&&changed(['mainDate']))next.mainHoliday=''; // Holiday confirmation belongs to a particular date.
    if(changed(['mainAct']))for(const k of ['article8Exception','equipment','article8Operation','article8FactInput','subject',...checks])next[k]='';
    if(changed(['a9Unavailable']))for(const k of ['a9CannotReason','a9AllYear','a9AnnualValid',...root.NoiseArticle9Measurement.keys.filter(k=>/^a9(Bg|Annual)_/.test(k))])next[k]='';
    if(changed([...common,'mainMeasure','a9Type','a9Facility','a9Rain','a9Home',...root.NoiseArticle9Measurement.keys.filter(k=>k!=='a9Exit')]))next.a9Exit='';
    return reconcile(next);
  }
  function reconcile(input){
    const next={...input},clear=keys=>keys.forEach(k=>{next[k]=Array.isArray(next[k])?[]:'';});
    let {state}=route(next);
    if(!state.needsHoliday)next.mainHoliday='';
    if(next.mainAct!=='none'&&!state.candidates.some(a=>a.id===next.mainAct))next.mainAct='';
    state=route(next).state;
    if(!state.showException)next.article8Exception='';
    for(const act of root.NOISE_ARTICLE8_RULES.acts)for(const c of [...(act.exceptionChecks||[]),...(act.exceptions||[]).flatMap(e=>e.checks||[])])if(!state.visibleChecks.includes(c.id))next[c.id]='';
    if(!state.act)clear(['article8Exception','equipment','article8Operation','article8FactInput','subject']);
    else if(!state.established)clear(['equipment','article8Operation','article8FactInput']);
    else if(next.mainAct!=='construction')clear(['equipment','article8Operation']);
    if(next.a9Type!=='other')next.a9Facility='';
    next.mainReasons=next.mainMeasure==='no'?reasons(next).map(r=>r.id):[];
    if(!next.mainReasons.includes('other'))next.mainReasonOther='';
    if(next.mainMeasure==='no')clear(['backgroundMeasurements','backgroundRound','backgroundLocked','a9Rain','a9Home',...root.NoiseArticle9Measurement.keys]);
    const rules=root.NOISE_ARTICLE9_RULES,type=rules.types.find(t=>t.id===next.a9Type);
    const table=type&&rules.tables[type.table];
    const lookup=root.NoiseArticle9.evaluate({...article9(next),a9Frequency:'both'});
    const required=[];
    for(const metric of rules.measurement.metrics){
      const applicable=table?.[metric.band]?.[metric.id]!==undefined;
      if(!applicable){clear(['a9Value_'+metric.id,'a9Bg_'+metric.id,'a9Annual_'+metric.id]);continue;}
      const standard=lookup.standards.find(s=>s.band===metric.band)?.values[metric.id];
      const raw=text(next['a9Value_'+metric.id]);
      const needs=raw!==''&&standard!==undefined&&Number(raw)>standard&&next.a9Rain!=='yes';
      if(needs)required.push(metric.id);
      if(!needs&&lookup.standards.length)clear(['a9Bg_'+metric.id,'a9Annual_'+metric.id]);
    }
    if(!required.length&&lookup.standards.length)clear(['a9Unavailable','a9CannotReason','a9AllYear','a9AnnualValid']);
    if(next.a9Unavailable?.includes('unavailable'))clear(rules.measurement.metrics.map(m=>'a9Bg_'+m.id));
    else clear(['a9CannotReason','a9AllYear','a9AnnualValid',...rules.measurement.metrics.map(m=>'a9Annual_'+m.id)]);
    if(next.a9Type!==rules.measurement.annualBackgroundType)clear(['a9AllYear','a9AnnualValid',...rules.measurement.metrics.map(m=>'a9Annual_'+m.id)]);
    if(next.a9AllYear!=='yes'||next.a9AnnualValid!=='yes')clear(rules.measurement.metrics.map(m=>'a9Annual_'+m.id));
    return next;
  }
  root.NoiseMain={route,article8,article9,prepare,resetChange,validate};
  root.TemplateWorkflows.noiseMain={prepare,resetChange,validate,clearDraft:()=>true,
    restart:input=>root.NoiseAttempts.restart(input,article9(input)),
    finish:input=>({...input,...root.NoiseArticle9Measurement.finish(article9(input))})};
})(window);
