(function(root){
 'use strict';
 const r=()=>root.NOISE_ARTICLE9_RULES.measurement;
 const str=x=>typeof x==='string'?x.trim():'';
 const unavailable=input=>Array.isArray(input.a9Unavailable)&&input.a9Unavailable.includes('unavailable');
 const number=x=>/^(?:\d+)(?:\.\d+)?$/.test(str(x))&&Number.isFinite(Number(x))?Number(x):null;
 function invalid(result,input,kind){
  result.status=kind;result.message=r().messages[kind];result.retry=true;
  if(input.a9Exit===kind){result.status=kind+'Ended';result.message=window.NOISE_TEXTS.article9.text028;result.ready=true;result.retry=false;}
  return result;
 }
 function correct(l1,l2){const d=l1-l2;if(d<r().minimumDifference)return {usable:false,difference:d};if(d>=r().noCorrectionDifference)return {usable:true,value:l1,corrected:false,difference:d};return {usable:true,value:l1+10*Math.log10(1-Math.pow(10,-d/10)),corrected:true,difference:d};}
 function assess(input){
  const rule=r(),m=rule.messages,lookup=root.NoiseArticle9.evaluate({...input,a9Frequency:'both'});
  const result={lookup,status:'pending',message:m.pending,items:[],canMeasure:false,needsBackground:false,annual:false,ready:false,retry:false};
  const type=root.NOISE_ARTICLE9_RULES.types.find(t=>t.id===input.a9Type);
  if(!type || (type.id==='other'&&!root.NOISE_ARTICLE9_RULES.facilities.some(f=>f.id===input.a9Facility)))return result;
  if(input.a9Rain==='yes'){result.status='rain';result.message=m.rain;result.ready=true;return result;}
  if(input.a9Rain!=='no')return result;
  if(!lookup.standards.length)return result;
  if(!rule.points[input.a9Home])return result;
  result.canMeasure=true;
  result.availableItems=rule.metrics.flatMap(metric=>{
   const group=lookup.standards.find(s=>s.band===metric.band);
   if(!group || group.values[metric.id]===undefined)return [];
   const raw=number(input['a9Value_'+metric.id]);return [{...metric,standard:group.values[metric.id],raw,final:raw}];
  });
  result.items=result.availableItems.filter(i=>str(input['a9Value_'+i.id])!=='');
  const wind=number(input.a9WindSpeed);
  if(wind!==null && wind>rule.windLimit){return invalid(result,input,'wind');}
  if(wind===null||!result.items.length||result.items.some(i=>i.raw===null))return result;
  const exceeded=result.items.filter(i=>i.raw>i.standard);
  if(exceeded.length){
   result.needsBackground=true;result.message=m.background;
   if(unavailable(input)){
    if(!str(input.a9CannotReason))return result;
    if(type.id===rule.annualBackgroundType){
     if(!['yes','no'].includes(input.a9AllYear))return result;
     if(input.a9AllYear==='yes'){
      if(!['yes','no'].includes(input.a9AnnualValid))return result;
      result.annual=input.a9AnnualValid==='yes';
     }
    }
   }
   for(const item of exceeded){
    const annual=result.annual&&item.band===rule.annualBackgroundBand;
    if(unavailable(input)&&!annual){item.backgroundMode='unavailable';continue;}
    const background=number(input[(annual?'a9Annual_':'a9Bg_')+item.id]);
    if(background===null)return result;
    item.background=background;item.backgroundMode=annual?'annual':'measured';
    const correction=correct(item.raw,background);item.correction=correction;
    if(!correction.usable){return invalid(result,input,'difference');}
    item.final=correction.value;
   }
  }
  // Normalize only machine-precision equality, never round measured values for judgement.
  for(const item of result.items)if(item.correction?.corrected && Math.abs(item.final-item.standard)<=Number.EPSILON*Math.max(1,Math.abs(item.standard))*8)item.final=item.standard;
  result.status=result.items.every(i=>i.final<=i.standard)?'compliant':'exceeded';result.message=m[result.status];result.ready=true;return result;
 }
 const keys=['a9Exit','a9WindSpeed','a9Unavailable','a9CannotReason','a9AllYear','a9AnnualValid',...['Value','Bg','Annual'].flatMap(prefix=>['leq','lmax','leqLF'].map(id=>'a9'+prefix+'_'+id))];
 function finish(input){const state=assess({...input,a9Exit:''});return state.retry?{...input,a9Exit:state.status}:input;}
 function restart(input){return {...input,...Object.fromEntries(keys.map(k=>[k,'']))};}
 function prepare(input){
  input={...input};
  if(unavailable(input))for(const metric of r().metrics)input['a9Bg_'+metric.id]='';
  const out={...input},active=input.scenario==='article9',state=active?assess(input):null;
  const flags={a9Blocked:active&&!state.ready,a9Retry:active&&state.retry,a9ShowRain:active,a9ShowPoint:active&&input.a9Rain==='no',a9ShowValues:active&&state.canMeasure,a9ShowBackground:active&&state.needsBackground,a9ShowReason:active&&state.needsBackground&&unavailable(input),a9ShowFactory:active&&state.needsBackground&&unavailable(input)&&input.a9Type===r().annualBackgroundType,a9ShowAnnual:active&&state.needsBackground&&unavailable(input)&&input.a9Type===r().annualBackgroundType&&input.a9AllYear==='yes'};
  for(const metric of r().metrics){const item=state?.items.find(i=>i.id===metric.id);flags['a9ShowValue_'+metric.id]=active&&state.canMeasure&&state.availableItems.some(i=>i.id===metric.id);
   const needs=active&&state.needsBackground&&item&&item.raw>item.standard;
   flags['a9ShowBg_'+metric.id]=needs&&!unavailable(input);
   flags['a9ShowAnnual_'+metric.id]=needs&&state.annual&&metric.band===r().annualBackgroundBand;
  }
  for(const [key,value]of Object.entries(flags))out[key]=value?'yes':'no';
  out.a9Exit=state?.status.endsWith('Ended')?input.a9Exit:'';
  const exitLabels=root.NOISE_ARTICLE9_DOCUMENTS.exitActions?.[state?.status];
  out.a9RetryLabel=exitLabels?.retry||'';out.a9FinishLabel=exitLabels?.finish||'';
  out.a9MeasurementStatus=state?.message||'';
  out.a9CorrectionDetails=active&&state.needsBackground?state.items.filter(i=>i.raw>i.standard).map(i=>{
   const lines=[i.label,window.NOISE_TEXTS.article9.text029+i.raw+' dB',window.NOISE_TEXTS.article9.text030+(i.background===undefined?(i.backgroundMode==='unavailable'?window.NOISE_TEXTS.article9.backgroundUnavailable:window.NOISE_TEXTS.common.missing):i.background+' dB')];
   if(i.correction?.corrected&&i.correction.usable)lines.push(window.NOISE_TEXTS.article9.text032+root.NoiseFormat.correctedVolume(i.final)+' dB');
   lines.push(window.NOISE_TEXTS.article9.text033+i.standard+' dB');
   lines.push(window.NOISE_TEXTS.article9.text034+(state.ready&&!state.status.endsWith('Ended')?(i.final<=i.standard?window.NOISE_TEXTS.article9.text035:window.NOISE_TEXTS.article9.text036):window.NOISE_TEXTS.article9.text037));return lines.join('\n');
  }).join('\n\n'):'';
  out.a9Duration=active?window.NOISE_TEXTS.article9.text038+(r().durationSeconds/60)+window.NOISE_TEXTS.article9.text039:'';
  out.a9Record='';out.a9Reply='';
  if(active){
   // Discard obsolete manual-result fields. They cannot select an old Article 9 outcome.
   out.measurementResult='';out.explainedToComplainant='';
   if(state.ready){const documents=root.NoiseArticle9Documents.generate(input,state);out.a9Record=documents.record;out.a9Reply=documents.reply;}
  }
  return out;
 }
 root.NoiseArticle9Measurement={assess,correct,restart,finish,prepare,keys};
 const previous=root.TemplateWorkflows.noiseArticle8;
 root.TemplateWorkflows.noiseArticle8={...previous,
  prepare(input){return prepare(previous.prepare(input));},
  restart,finish,
  resetChange(before,after){let next=previous.resetChange(before,after);if(before.scenario!=='article9'||after.scenario!=='article9')return next;
   if(JSON.stringify(before.a9Unavailable)!==JSON.stringify(after.a9Unavailable)){next={...next,a9Exit:'',a9CannotReason:'',a9AllYear:'',a9AnnualValid:'',...Object.fromEntries(keys.filter(k=>k.startsWith('a9Bg_')||k.startsWith('a9Annual_')).map(k=>[k,'']))};}
   if(keys.filter(k=>k!=='a9Exit').some(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])))next={...next,a9Exit:''};
   if(['a9Type','a9Facility','a9Zone','a9Date','a9Time','a9Rain','a9Home'].some(k=>before[k]!==after[k]))return restart(next);
   if(before.a9WindSpeed!==after.a9WindSpeed)next={...next,a9Exit:'',a9Unavailable:[],a9CannotReason:'',a9AllYear:'',a9AnnualValid:'',...Object.fromEntries(keys.filter(k=>k.startsWith('a9Bg_')||k.startsWith('a9Annual_')).map(k=>[k,'']))};
   if(r().metrics.some(m=>before['a9Value_'+m.id]!==after['a9Value_'+m.id]))return {...next,a9WindSpeed:'',a9Unavailable:[],a9CannotReason:'',a9AllYear:'',a9AnnualValid:'',...Object.fromEntries(keys.filter(k=>k.startsWith('a9Bg_')||k.startsWith('a9Annual_')).map(k=>[k,'']))};
   return next;
  }
 };
})(typeof window==='undefined'?globalThis:window);
