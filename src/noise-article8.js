(function(root) {
  'use strict';
  const rules = () => root.NOISE_ARTICLE8_RULES;
  const allChecks = () => rules().acts.flatMap(a=>[...(a.exceptionChecks||[]),...(a.exceptions||[]).flatMap(e=>e.checks||[])]);
  const text = value => typeof value === 'string' ? value.trim() : '';
  function minutes(value) {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const [h,m]=value.split(':').map(Number); return h*60+m;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0,4)) <= 1911) return false;
    const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
  }
  function inPeriods(time,periods) {
    return periods.some(([start,end])=>{
      const a=minutes(start),b=minutes(end);
      return a<b ? time>=a && time<b : time>=a || time<b;
    });
  }
  function filterActs(input) {
    const data=rules(),time=minutes(text(input.article8Time));
    const ready=validDate(text(input.date)) && time!==null;
    const zoneValid=ready && data.zones.some(z=>z.id===input.article8Zone);
    if(!zoneValid)return {ready,zoneValid,needsHoliday:false,candidates:[]};
    const applicable=holiday=>data.acts.filter(act=>act.zones.includes(input.article8Zone) && (act.allDay || inPeriods(time,holiday&&act.holidayPeriods?act.holidayPeriods:act.periods)));
    const weekday=applicable(false),holiday=applicable(true);
    const needsHoliday=weekday.map(a=>a.id).join('|')!==holiday.map(a=>a.id).join('|');
    const confirmed=!needsHoliday || ['yes','no'].includes(input.article8Holiday);
    return {ready,zoneValid,needsHoliday,candidates:confirmed?(needsHoliday&&input.article8Holiday==='yes'?holiday:weekday):[]};
  }
  function evaluate(input) {
    const data=rules(),m=data.messages,filtered=filterActs(input);
    const result={...filtered,showZone:filtered.ready,showException:false,established:false,visibleChecks:[],status:window.NOISE_TEXTS.article8.text001,act:null};
    if(!filtered.ready)return result;
    if(!filtered.zoneValid){result.status=m.zone;return result;}
    if(filtered.needsHoliday&&!['yes','no'].includes(input.article8Holiday)){result.status=m.holiday;return result;}
    if(!filtered.candidates.length){result.status=window.NOISE_TEXTS.article8.text002;return result;}
    const act=filtered.candidates.find(a=>a.id===input.prohibitedAct);result.act=act;
    if(!act){result.status=m.act;return result;}
    if (act.hasExceptions) {
      if (act.exceptionChecks) {
        result.visibleChecks=act.exceptionChecks.map(c=>c.id);
        if (!act.exceptionChecks.every(c=>['yes','no'].includes(input[c.id]))) {result.status=m.checks;return result;}
        if (act.exceptionChecks.every(c=>input[c.id]==='yes')) {result.status=m.exempt;return result;}
      } else {
      result.showException=true;
      const selected=(act.exceptions||[]).find(e=>act.id+':'+e.id===input.article8Exception);
      if (selected) {result.visibleChecks=(selected.checks||[]).map(c=>c.id);result.status=m.exempt;return result;}
      if (!act.exceptionsComplete) {result.status=m.incomplete;return result;}
      if (input.article8Exception!=='none') {result.status=m.exception;return result;}
      }
    }
    result.established=true;result.status=m.established;return result;
  }
  const computed=['a8ShowActs','a8ShowSubject','factText','a8StructuredFacts','a8FreeFacts','a8Ready','a8NeedsHoliday','a8ShowZone','a8ShowException','a8Established','a8Status','article8TimeText','article8LegalBasis'];
  const specific=['article8FactInput','article8Time','prohibitedAct','article8Holiday','article8Zone','article8Exception','equipment','article8Operation'];
  function prepare(input) {
    const output={...input};
    for(const act of rules().acts)output['a8Candidate_'+act.id]='no';
    for(const c of allChecks()) {output[c.id+'Visible']='no';if(input.scenario!=='article8')output[c.id]='';}
    for (const key of computed) output[key]='';
    if (input.scenario!=='article8') {output.a8ShowSubject=root.INSPECTION_CONFIG.templates.find(t=>t.workflow==='noiseArticle8').article8SubjectScenarios.includes(input.scenario)?'yes':'no';for(const key of specific) output[key]='';return output;}
    const state=evaluate(input);
    output.a8ShowActs=state.candidates.length?'yes':'no';
    output.a8ShowSubject=state.act?'yes':'no';
    for(const act of state.candidates)output['a8Candidate_'+act.id]='yes';
    const factsConfig=root.INSPECTION_CONFIG.templates.find(t=>t.workflow==='noiseArticle8').article8Facts;
    const structured=state.established && input.prohibitedAct===factsConfig.structuredAct;
    output.a8StructuredFacts=structured?'yes':'no';
    output.a8FreeFacts=state.established?'yes':'no';
    output.factText='';
    if(state.established){
      const ui=root.NOISE_TEXTS.ui,parts=[ui.standardFacts[state.act.id]||state.act.label];
      const clean=value=>text(value).replace(/^[，。；、\s]+|[，。；、\s]+$/g,'');
      const equipment=clean(input.equipment),operation=clean(input.article8Operation),supplement=clean(input.article8FactInput);
      if(structured){
        if(equipment&&operation)parts.push(root.NoiseText.render(ui.constructionDetails,{equipment,operation}));
        else {if(equipment)parts.push(root.NoiseText.render(ui.equipmentPattern,{text:equipment}));if(operation)parts.push(root.NoiseText.render(ui.operationPattern,{text:operation}));}
      }else{output.equipment='';output.article8Operation='';}
      if(supplement)parts.push(root.NoiseText.render(ui.supplementPattern,{text:supplement}));
      output.factText=parts.join('，');
    }else output.article8FactInput='';
    for(const c of allChecks()) {const visible=state.visibleChecks.includes(c.id);output[c.id+'Visible']=visible?'yes':'no';if(!visible)output[c.id]='';}
    output.a8Ready=state.ready?'yes':'no';
    output.a8NeedsHoliday=state.needsHoliday?'yes':'no';
    output.a8ShowZone=state.showZone?'yes':'no';
    output.a8ShowException=state.showException?'yes':'no';
    output.a8Established=state.established?'yes':'no';
    output.a8Status=state.status;
    if (state.ready) output.article8TimeText=root.NoiseFormat.inspectionHour(input.article8Time);
    if (state.established) output.article8LegalBasis=rules().legalBasis;
    if (!state.ready || !state.act) output.prohibitedAct='';
    if (!state.needsHoliday) output.article8Holiday='';
    if (!state.showZone) output.article8Zone='';
    if (!state.showException) output.article8Exception='';
    if (!state.established) {output.equipment='';output.article8Operation='';}
    return output;
  }
  function resetChange(before,after) {
    if (before.scenario!=='article8' || after.scenario!=='article8') return after;
    const next={...after};
    const clear=keys=>['article8FactInput',...keys,...allChecks().map(c=>c.id)].forEach(key=>{next[key]='';});
    if (['date','article8Time'].some(key=>before[key]!==after[key])) {
      clear(['article8Zone','article8Holiday','prohibitedAct','article8Exception','equipment','article8Operation']);
    } else if(before.article8Zone!==after.article8Zone) {
      clear(['article8Holiday','prohibitedAct','article8Exception','equipment','article8Operation']);
    } else if(before.article8Holiday!==after.article8Holiday) {
      clear(['prohibitedAct','article8Exception','equipment','article8Operation']);
    } else if(before.prohibitedAct!==after.prohibitedAct) {
      clear(['article8Exception','equipment','article8Operation']);
    } else if(before.article8Exception!==after.article8Exception) {
      clear(['equipment','article8Operation']);
    }
    return next;
  }
  root.NoiseArticle8={filterActs,evaluate,prepare,minutes,inPeriods,resetChange};
  root.TemplateWorkflows=root.TemplateWorkflows||{};
  root.TemplateWorkflows.noiseArticle8={prepare,resetChange,clearDraft:(before,after)=>before.scenario==='article8'||after.scenario==='article8'};
})(typeof window === 'undefined' ? globalThis : window);
