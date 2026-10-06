(function(root){
 const trim=x=>typeof x==='string'?x.trim():'';
 const missing=x=>trim(x)||window.NOISE_TEXTS.common.missing;
 const fill=(s,v)=>root.NoiseText.render(s,Object.fromEntries(Object.entries(v).map(([k,value])=>[k,value??root.NOISE_TEXTS.common.missing])));
 function endedBackground(input,state){
  const t=root.NOISE_TEXTS.ui.endedBackground,history=root.NoiseBackgrounds.list(input.a9BackgroundMeasurements);
  // The evaluator can stop at the first invalid metric. Use the already recorded
  // per-metric background facts to include other currently invalid metrics too.
  const groups=state.items.filter(i=>(i.correction&&!i.correction.usable)||history.some(row=>row.id===i.id&&!row.valid&&Number(row.sourceValue)===i.raw&&input[row.key]!==''&&Number(row.value)===Number(input[row.key]))).map(item=>{
    const rows=history.filter(row=>row.id===item.id&&!row.valid&&Number(row.sourceValue)===item.raw);
    const values=rows.length?rows.map(row=>row.value):[item.background];
    const source=fill(t.source,{label:t.labels[item.id],value:item.raw});
    const series=values.length===1?fill(t.single,{value:values[0]}):fill(t.multiple,{series:values.map((value,index)=>fill(t.item,{number:index+1,value})).join('、')});
    return source+'，'+series;
  });
  return fill(t.record,{facts:groups.join('；'),conclusion:t.conclusion});
 }
 function generate(input,state){const data=root.NOISE_ARTICLE9_DOCUMENTS,r=root.NOISE_ARTICLE9_RULES,template=data[state.status==='differenceEnded'?'differenceHistoryEnded':state.status];if(!state.ready||!template)throw Error(window.NOISE_TEXTS.article9.text040);
  const date=/^\d{4}-\d\d-\d\d$/.test(input.a9Date||'')?new Date(input.a9Date+'T00:00:00Z'):null;
  const valid=date&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===input.a9Date&&Number(input.a9Date.slice(0,4))>1911;
  const time=root.NoiseFormat.inspectionHour(input.a9Time);
  const point=r.measurement.points[input.a9Home];
  const formatItem=(item,final)=>fill(final&&item.correction?.corrected?data.correctedValue:data.value,{label:item.label,value:final&&item.correction?.corrected?root.NoiseFormat.correctedVolume(item.final):String(final?item.final:item.raw)});
  const v={date:valid?(date.getUTCFullYear()-1911)+window.NOISE_TEXTS.article9.text041+(date.getUTCMonth()+1)+window.NOISE_TEXTS.article9.text042+date.getUTCDate()+window.NOISE_TEXTS.article9.text043:window.NOISE_TEXTS.common.missing,time,subject:missing(input.a9Subject),operation:missing(input.a9Operation),noiseSource:missing(input.a9Source),legalBasis:r.types.find(t=>t.id===input.a9Type)?.legalBasis,sourceType:r.types.find(t=>t.id===input.a9Type)?.label,zone:input.a9Zone,period:r.periods.find(p=>p.id===state.lookup.period)?.label,measurementPoint:point?.record,measurementPointPublic:point?.reply,
   resultText:state.items.map(i=>formatItem(i,false)).join('，'),standardText:state.items.map(i=>fill(data.standard,{label:r.measurement.metrics.find(m=>m.id===i.id).standard,value:i.standard})).join('，')};
  const backgrounds=[];
  for(const i of state.items.filter(i=>i.backgroundMode)){
   if(i.backgroundMode==='unavailable'){if(!backgrounds.includes(fill(data.background.unavailable,{reason:missing(input.a9CannotReason)})))backgrounds.push(fill(data.background.unavailable,{reason:missing(input.a9CannotReason)}));continue;}
   const intro=fill(data.background[i.backgroundMode],{background:i.background});
   const detail=i.correction.corrected?fill(data.background.corrected,{correctedResultText:formatItem(i,true)}):fill(data.background.uncorrected,{metric:i.short});
   backgrounds.push(intro+'，'+detail);
  }
  v.backgroundHistoryFact=state.status==='differenceEnded'?endedBackground(input,state):'';
  v.backgroundText=backgrounds.join('；');
  v.backgroundClause=backgrounds.length?'，'+v.backgroundText:'';
  return {record:fill(template.record,v),reply:fill(template.reply,v)};
 }
 root.NoiseArticle9Documents={generate};
})(window);
