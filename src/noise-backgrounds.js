(function(root){
  'use strict';
  const list=value=>{try{const rows=JSON.parse(value||'[]');return Array.isArray(rows)?rows:[];}catch{return [];}};
  const sourceKeys=['a9Value_leq','a9Value_lmax','a9Value_leqLF','a9Home','a9WindSpeed'];
  // One round can contain independent full-frequency, maximum and low-frequency backgrounds.
  // A row in the current round is replaced while typing; clicking retry commits that round.
  function sync(input,current){
    const round=Number(input.backgroundRound)||1;
    const history=list(input.backgroundMeasurements).filter(row=>row.round<round);
    const state=root.NoiseArticle9Measurement.assess({...current,a9Exit:''});
    const lookup=root.NoiseArticle9.evaluate({...current,a9Frequency:'both'});
    const active=[];
    if(current.a9Rain==='no'&&Number(current.a9WindSpeed)<=root.NOISE_ARTICLE9_RULES.measurement.windLimit&&current.a9WindSpeed!=='')for(const metric of root.NOISE_ARTICLE9_RULES.measurement.metrics){
      const raw=current['a9Value_'+metric.id],standard=lookup.standards.find(s=>s.band===metric.band)?.values[metric.id];
      const key=current.a9Unavailable?.includes('unavailable')?'a9Annual_'+metric.id:'a9Bg_'+metric.id;
      const value=current[key];
      if(!/^\d+(?:\.\d+)?$/.test(raw||'')||!/^\d+(?:\.\d+)?$/.test(value||'')||!(Number(raw)>standard))continue;
      const correction=root.NoiseArticle9Measurement.correct(Number(raw),Number(value));
      active.push({round,number:round,id:metric.id,label:metric.label,key,value,sourceValue:raw,difference:correction.difference,valid:correction.usable,selected:correction.usable});
    }
    // Retained valid metrics need not be measured again when a different metric failed.
    for(const row of history)row.selected=!!active.find(a=>a.id===row.id&&a.value===row.value&&a.sourceValue===row.sourceValue&&a.valid)&&row.valid;
    const rows=[...history];
    for(const row of active){
      const retained=history.findLast(h=>h.id===row.id&&h.selected);
      if(!retained)rows.push(row);
    }
    return {...input,backgroundRound:String(round),backgroundMeasurements:JSON.stringify(rows),backgroundLocked:input.backgroundLocked==='yes'?'yes':'',
      backgroundRepeated: new Set(rows.filter(r=>!r.valid).map(r=>r.round)).size>1?'yes':''};
  }
  function restart(input,current){
    if(root.NoiseArticle9Measurement.assess({...current,a9Exit:''}).status!=='difference')return input;
    const next=sync(input,current),rows=list(next.backgroundMeasurements),round=Number(next.backgroundRound);
    for(const row of rows.filter(r=>!r.valid&&r.round===round))next[row.key]='';
    return {...next,backgroundRound:String(round+1),backgroundLocked:'yes',a9Exit:''};
  }
  function describe(value){
    const t=root.NOISE_TEXTS.ui;
    return list(value).map(r=>root.NoiseText.render(t.backgroundHistoryRow,{number:r.round,label:r.label,value:r.value,difference:String(r.difference),status:r.valid?t.backgroundUsable:t.backgroundInvalid,selected:r.selected?t.backgroundSelected:''})).join('\n');
  }
  root.NoiseBackgrounds={list,sync,restart,describe,sourceKeys};
})(window);
