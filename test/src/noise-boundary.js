(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__boundaryWrapped)return;
  const corePrepare=core.prepare;
  const yes=b=>b?'yes':'no';
  const text=v=>typeof v==='string'?v.trim():'';
  const unique=items=>[...new Set(items.filter(Boolean))];
  const zoneLabel=z=>`第${z}類`;
  const boundaryLabel=zones=>zones.map(zoneLabel).join('與')+'噪音管制區交界';

  function boundaryState(input){
    if(input.noiseSpecial!=='ordinary')return null;
    if(!root.NoiseZone?.resolve)return null;
    const state=root.NoiseZone.resolve(input);
    return state?.status==='boundary'?state:null;
  }

  function runZone(input,zone){
    return corePrepare({...input,noiseZoneMode:'direct',noiseZone:zone});
  }

  function a8ApplicabilityDifference(input,zones){
    const actId=input.noiseA8Act;
    if(!actId||actId==='none')return null;
    const act=root.NOISE_ARTICLE8_RULES?.acts?.find(a=>a.id===actId);
    if(!act)return null;
    const states=zones.map(zone=>({zone,applies:core.actApplicable(act,zone,input.noiseTime,input.noiseHoliday)}));
    if(states.every(x=>x.applies===states[0].applies))return null;
    return {act,states};
  }

  function mergeTexts(runs,key,zones){
    return runs.map((r,i)=>text(r[key])?`${zoneLabel(zones[i])}：${text(r[key])}`:'').filter(Boolean).join('\n');
  }

  function mergePending(base,runs,zones,state){
    const validations=unique(runs.map((r,i)=>text(r.noiseValidation)?`${zoneLabel(zones[i])}：${text(r.noiseValidation)}`:''));
    base.noiseBlocked='yes';
    base.noiseValidation=validations.join('\n')||'交界雙區案件尚有必要事實未確認。';
    base.noiseGuide=`${state.note||'本案位於二個噪音管制區交界。'}\n${base.noiseValidation}`;
    const standards=mergeTexts(runs,'noiseStandardText',zones);if(standards)base.noiseStandardText=standards;
    const results=mergeTexts(runs,'noiseResultText',zones);if(results)base.noiseResultText=results;
    return base;
  }

  function mergeA8(base,runs,zones,state){
    const source=runs[0];
    Object.assign(base,source);
    base.noiseZone='';
    base.noiseBoundaryZones=zones.join('-');
    base.noiseZoneResultText=state.note||'';
    const single=`第${zones[0]}類噪音管制區`;
    const both=boundaryLabel(zones);
    base.noiseRecord=text(source.noiseRecord).replace(single,both);
    base.noiseReply=text(source.noiseReply).replace(single,both);
    base.noiseGuide=`${state.note||''}\n${text(source.noiseGuide)}`.trim();
    return base;
  }

  function mergeFinalA9(base,runs,zones,state){
    const exceeded=runs.some(r=>/第24條/.test(text(r.noiseGuide)));
    base.noiseBlocked='no';
    base.noiseValidation='';
    base.noiseZone='';
    base.noiseBoundaryZones=zones.join('-');
    base.noiseZoneResultText=state.note||'';
    base.noiseRouteText='第9條交界雙區量測判定';
    base.noiseStandardText=mergeTexts(runs,'noiseStandardText',zones);
    base.noiseMeasurementPointText=text(runs[0].noiseMeasurementPointText);
    base.noiseResultText=mergeTexts(runs,'noiseResultText',zones);
    base.noiseGuide=exceeded?'交界雙區判定：至少一區超過適用噪音管制標準，依噪音管制法第24條辦理限期改善。':'交界雙區判定：兩區各自依其時段與標準檢核，均未超過適用噪音管制標準。';
    const subject=text(inputForDraft(base).noiseSubject)||'受稽查場所';
    const source=text(inputForDraft(base).noiseSource)||'噪音源';
    base.noiseRecord=`${state.note||`本案位於${boundaryLabel(zones)}。`} 稽查對象「${subject}」，主要噪音源為「${source}」。兩區分別依當時時段及適用標準判定：${base.noiseResultText.replace(/\n/g,' ')}${exceeded?'至少一區之結果超過適用標準，依噪音管制法第24條辦理限期改善。':'兩區結果均未超過各自適用標準。'}`;
    base.noiseReply=exceeded?'本案位於二個噪音管制區交界，經分別依兩區適用標準檢核，至少一區結果超過標準，將依噪音管制法第24條辦理限期改善。':'本案位於二個噪音管制區交界，經分別依兩區適用標準檢核，結果均未超過標準。';
    return base;
  }

  function inputForDraft(out){return out||{};}

  function prepare(input={}){
    const state=boundaryState(input);
    if(!state)return corePrepare(input);
    const zones=Array.isArray(state.zones)?state.zones.filter(z=>['1','2','3','4'].includes(z)):[];
    if(zones.length!==2)return corePrepare(input);

    const difference=a8ApplicabilityDifference(input,zones);
    if(difference){
      const base={...input,noiseZone:'',noiseBoundaryZones:zones.join('-'),noiseZoneResultText:state.note||'',noiseBlocked:'yes',noiseValidation:'',noiseRecord:'',noiseReply:'',noiseRouteText:'第8條交界適用性待確認',noiseStandardText:'',noiseMeasurementPointText:'',noiseResultText:'',noiseGuide:''};
      const detail=difference.states.map(x=>`${zoneLabel(x.zone)}${x.applies?'落入':'未落入'}公告管制`).join('；');
      base.noiseValidation=`第8條公告行為「${difference.act.label}」在交界兩區的適用結果不同（${detail}），不得自行簡化成單一管制區結論。`;
      base.noiseGuide=`${state.note||''}\n${base.noiseValidation}`.trim();
      return base;
    }

    const runs=zones.map(zone=>runZone(input,zone));
    const base={...runs[0],noiseZone:'',noiseBoundaryZones:zones.join('-'),noiseZoneResultText:state.note||''};

    // 第8條成立路徑文字曾由「成立路徑」簡化為「成立」；交界判斷不得因此失去雙區身分。
    const a8Established=runs.map(r=>/第8條公告禁止行為成立/.test(text(r.noiseRouteText)));
    if(a8Established.every(Boolean))return mergeA8(base,runs,zones,state);
    if(a8Established.some(Boolean)){
      base.noiseBlocked='yes';
      base.noiseValidation='交界兩區對第8條成立路徑的判斷不一致，請重新確認管制區事實與公告適用條件。';
      base.noiseGuide=`${state.note||''}\n${base.noiseValidation}`.trim();
      base.noiseRecord='';base.noiseReply='';
      return base;
    }

    if(runs.some(r=>r.noiseBlocked==='yes'))return mergePending(base,runs,zones,state);

    const measurement=runs.some(r=>r.noiseShowMeasure==='yes')&&runs.every(r=>/第9條量測/.test(text(r.noiseGuide)));
    if(measurement)return mergeFinalA9(base,runs,zones,state);

    Object.assign(base,runs[0]);
    base.noiseZone='';base.noiseBoundaryZones=zones.join('-');base.noiseZoneResultText=state.note||'';
    base.noiseGuide=`${state.note||''}\n${text(runs[0].noiseGuide)}`.trim();
    return base;
  }

  function resetChange(before={},after={}){
    return core.resetChange(before,after);
  }
  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,__boundaryWrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};
})(typeof window==='undefined'?globalThis:window);
