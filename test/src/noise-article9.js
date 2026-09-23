(function(root){
 'use strict';
 const rules=()=>root.NOISE_ARTICLE9_RULES;
 function minutes(value){if(typeof value!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))return null;const [h,m]=value.split(':').map(Number);return h*60+m;}
 function period(time,zoneId){const t=minutes(time),zone=rules().zones.find(z=>z.id===zoneId);if(t===null||!zone)return null;
  return rules().periods.find(p=>{const [a,b]=zone.periods[p.id].map(minutes);return a<b?t>=a&&t<b:t>=a||t<b;})?.id||null;
 }
 function evaluate(input){
  const r=rules(),type=r.types.find(t=>t.id===input.a9Type),zone=r.zones.find(z=>z.id===input.a9Zone),frequency=r.frequencies.find(f=>f.id===input.a9Frequency);
  const periodId=period(input.a9Time,input.a9Zone),result={period:periodId,standards:[]};
  if(!type||!zone||!periodId||!frequency)return result;
  if(type.id==='other'&&!r.facilities.some(f=>f.id===input.a9Facility))return result;
  const zi=r.zones.indexOf(zone),pi=r.periods.findIndex(p=>p.id===periodId);
  result.standards=frequency.bands.map(band=>{
   const table=r.tables[type.table][band];
   return table?{band,available:true,values:Object.fromEntries(Object.entries(table).map(([metric,rows])=>[metric,rows[zi][pi]]))}:{band,available:false,values:{}};
  });return result;
 }
 function prepare(input){const output={...input};for(const k of ['a9Period','a9Standards'])output[k]='';if(input.scenario!=='article9')return output;
  const result=evaluate({...input,a9Frequency:'both'}),r=rules();output.a9Period=r.periods.find(p=>p.id===result.period)?.label||window.NOISE_TEXTS.common.missing;
  output.a9Standards=result.standards.filter(item=>item.available).map(item=>r.bands[item.band]+'：'+(item.available?Object.entries(item.values).map(([metric,value])=>r.metrics[metric]+' '+value+window.NOISE_TEXTS.article9.text025).join('、'):window.NOISE_TEXTS.article9.text026)).join('\n')||window.NOISE_TEXTS.article9.text027;return output;
 }
 root.NoiseArticle9={period,evaluate,prepare};
 // 共用表單只分派資料準備；第9條不呼叫第8條判斷器。
 const previous=root.TemplateWorkflows.noiseArticle8;
 root.TemplateWorkflows.noiseArticle8={
  ...previous,
  prepare(input){return prepare(previous.prepare(input));},
  clearDraft(before,after){return before.scenario==='article9'||after.scenario==='article9'||previous.clearDraft(before,after);},
  resetChange(before,after){const next=previous.resetChange(before,after);if(before.a9Type!==after.a9Type)return {...next,a9Facility:''};return next;}
 };
})(typeof window==='undefined'?globalThis:window);
