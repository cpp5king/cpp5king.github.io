(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__compositeWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const countDelta={two:-3,three:-4,four:-6,five:-7,sixPlus:-8};
  const countLabel={two:'2',three:'3',four:'4',five:'5',sixPlus:'6以上'};
  const text=v=>typeof v==='string'?v.trim():'';

  function facilityKnown(input){
    return root.NOISE_ARTICLE9_RULES?.facilities?.some(f=>f.id===input.noiseFacility);
  }

  function compositeState(input){
    if(input.noiseSpecial!=='ordinary'||input.noiseA9Type!=='otherFacility')return {status:'notApplicable',summary:''};
    if(!facilityKnown(input))return {status:'notReady',summary:''};
    const different=tri(input.noiseCompositeDifferentActors);
    if(different==='missing'||different==='unknown')return {status:'pending',summary:'複合音量修正尚待確認：是否由非同一行為人、法人或非法人之設施共同產生。',validation:'請確認是否涉及非同一行為人、法人或非法人之設施共同產生複合音量。'};
    if(different==='no')return {status:'normal',summary:'已確認不屬不同主體設施共同產生之複合音量，不適用噪音管制標準第9條修正。'};
    const exceeded=tri(input.noiseCompositeOverallExceeded);
    if(exceeded==='missing'||exceeded==='unknown')return {status:'pending',summary:'已確認涉及不同主體設施之複合音量；是否超過噪音管制標準第8條原標準尚待確認。',validation:'請確認不同主體設施所產生之複合音量是否已超過噪音管制標準第8條原標準值。'};
    if(exceeded==='no')return {status:'normal',summary:'雖涉及不同主體設施之複合音量，但已確認複合音量未超過噪音管制標準第8條原標準值，不啟動第9條修正。'};
    const delta=countDelta[input.noiseCompositeSourceCount];
    if(delta===undefined)return {status:'pending',summary:'不同主體設施之複合音量已超過原標準，尚未確認音源數。',validation:'請確認非屬同一行為人、法人或非法人之音源數。'};
    return {status:'adjust',delta,summary:`噪音管制標準第9條複合音量修正：不同主體音源數為${countLabel[input.noiseCompositeSourceCount]}，各設施適用之第8條標準值降低${Math.abs(delta)} dB。`};
  }

  function withAdjustedOtherTable(delta,fn){
    const table=root.NOISE_ARTICLE9_RULES?.tables?.other;
    if(!table)return fn();
    const oldFull=table.full?.leq;
    const oldLow=table.low?.leqLF;
    if(oldFull)table.full.leq=oldFull.map(row=>row.map(v=>v+delta));
    if(oldLow)table.low.leqLF=oldLow.map(row=>row.map(v=>v+delta));
    try{return fn();}
    finally{
      if(oldFull)table.full.leq=oldFull;
      if(oldLow)table.low.leqLF=oldLow;
    }
  }

  function decorate(out,state){
    out.noiseCompositeText=state.summary||'';
    if(state.status==='adjust'){
      if(text(out.noiseStandardText))out.noiseStandardText=`${state.summary}\n${out.noiseStandardText}`;
      if(text(out.noiseGuide))out.noiseGuide=`${state.summary}\n${out.noiseGuide}`;
      if(text(out.noiseRecord))out.noiseRecord=`${state.summary} ${out.noiseRecord}`;
    }
    return out;
  }

  function pending(out,state){
    out.noiseCompositeText=state.summary||'';
    out.noiseBlocked='yes';
    out.noiseValidation=state.validation||'複合音量修正條件尚待確認。';
    out.noiseGuide=`${state.summary||''}\n${out.noiseValidation}`.trim();
    out.noiseRecord='';out.noiseReply='';
    out.noiseStandardText='';out.noiseResultText='';
    return out;
  }

  function prepare(input={}){
    const state=compositeState(input);
    if(state.status==='notApplicable'||state.status==='notReady')return innerPrepare(input);
    if(state.status==='adjust')return decorate(withAdjustedOtherTable(state.delta,()=>innerPrepare(input)),state);
    const out=innerPrepare(input);
    if(out.noiseShowOtherFacility!=='yes')return out;
    if(state.status==='pending')return pending(out,state);
    return decorate(out,state);
  }

  function resetChange(before={},after={}){
    const next=innerReset(before,after);
    const clear=keys=>keys.forEach(k=>{next[k]='';});
    if(before.noiseA9Type!==after.noiseA9Type&&after.noiseA9Type!=='otherFacility')clear(['noiseCompositeDifferentActors','noiseCompositeOverallExceeded','noiseCompositeSourceCount']);
    if(before.noiseCompositeDifferentActors!==after.noiseCompositeDifferentActors&&after.noiseCompositeDifferentActors!=='yes')clear(['noiseCompositeOverallExceeded','noiseCompositeSourceCount']);
    if(before.noiseCompositeOverallExceeded!==after.noiseCompositeOverallExceeded&&after.noiseCompositeOverallExceeded!=='yes')clear(['noiseCompositeSourceCount']);
    return next;
  }

  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,__compositeWrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};
})(typeof window==='undefined'?globalThis:window);
