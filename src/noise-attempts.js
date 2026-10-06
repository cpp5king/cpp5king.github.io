(function(root){
  'use strict';
  // Stored as JSON in an internal computed field to fit the existing string-based form state.
  // Snapshot data never enters assess(): only the current measurement does.
  function list(value){try{const items=JSON.parse(value||'[]');return Array.isArray(items)?items:[];}catch{return [];}}
  function snapshot(input,current,state,number){
    const rules=root.NOISE_ARTICLE9_RULES;
    return {number,backgroundMeasurements:root.NoiseBackgrounds.list(input.backgroundMeasurements),context:{date:current.a9Date,time:current.a9Time,zone:current.a9Zone,type:current.a9Type,facility:current.a9Facility||''},
      point:rules.measurement.points[current.a9Home]?.record||'',wind:current.a9WindSpeed||'',
      items:(state.availableItems||state.items).filter(m=>String(current['a9Value_'+m.id]??'')!=='').map(m=>{
        const assessed=state.items.find(i=>i.id===m.id)||m;
        return {id:m.id,label:m.label,raw:current['a9Value_'+m.id],standard:m.standard,
          background:current['a9Bg_'+m.id]||'',annualBackground:current['a9Annual_'+m.id]||'',
          difference:assessed.correction?.difference??null,corrected:assessed.correction?.corrected?assessed.final:null};
      }),status:state.status,reason:state.message,unavailableReason:current.a9CannotReason||''};
  }
  function restart(input,current){
    const state=root.NoiseArticle9Measurement.assess({...current,a9Exit:''});
    if(!state.retry)return input;
    if(state.status==='difference')return root.NoiseBackgrounds.restart(input,current);
    const history=list(input.measurementAttempts);
    history.push(snapshot(input,current,state,history.length+1));
    return {...input,...root.NoiseArticle9Measurement.restart(current),measurementAttempts:JSON.stringify(history),backgroundMeasurements:'',backgroundRound:'',backgroundLocked:''};
  }
  function describe(value){
    const history=list(value),ui=root.NOISE_TEXTS.ui,fill=root.NoiseText.render;
    const blocks=history.map(a=>{
      const lines=[fill(ui.attempt,{number:a.number}),fill(ui.historyContext,a.context),fill(ui.historyPoint,{point:a.point}),fill(ui.historyWind,{value:a.wind})];
      for(const m of a.items){lines.push(fill(ui.historyValue,{label:m.label,value:m.raw}));
        if(m.background||m.annualBackground)lines.push(fill(ui.historyBackground,{value:m.background||m.annualBackground}));
        // Do not round a difference near the 3 dB boundary into a misleading 3.0.
        if(m.difference!==null)lines.push(fill(ui.historyDifference,{value:Number.isInteger(m.difference)?m.difference.toFixed(1):String(m.difference)}));
        if(m.corrected!==null)lines.push(fill(ui.historyCorrected,{value:root.NoiseFormat.correctedVolume(m.corrected)}));
      }
      lines.push(fill(ui.historyResult,{value:a.reason}));return lines.join('\n');
    });
    return [...blocks,fill(ui.currentAttempt,{number:history.length+1}),ui.historyNote].join('\n\n');
  }
  root.NoiseAttempts={list,restart,describe};
})(window);
