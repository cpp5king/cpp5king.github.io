(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__methodGuidanceWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const methodLabel={
    leq:'Leq（非週期／非間歇性，連續取樣至少2分鐘）',
    lmaxMean:'Lmax平均（週期／間歇、與背景相差≥10 dB且最大音量差≤5 dB，連續10次最大值平均）',
    l5:'L5（週期／間歇、與背景相差≥10 dB且最大音量差>5 dB，至少20個最大值計算）'
  };

  function deriveGeneralMethod(input={}){
    const pattern=input.noiseGeneralPattern;
    if(!pattern||pattern==='unknown')return {status:'pending',showBg10:false,showSpread:false,validation:'請先確認全頻噪音是否屬週期性或間歇性變動。'};
    if(pattern==='other')return {status:'ok',method:'leq',text:methodLabel.leq,showBg10:false,showSpread:false};
    if(pattern!=='periodic')return {status:'pending',showBg10:false,showSpread:false,validation:'全頻發聲特性無法辨識，請重新確認。'};

    const bg10=tri(input.noiseGeneralBg10);
    if(bg10==='missing'||bg10==='unknown')return {status:'pending',showBg10:true,showSpread:false,validation:'週期／間歇性噪音請確認音源量測值與背景音量是否相差10 dB以上。'};
    if(bg10==='no')return {status:'unsupported',showBg10:true,showSpread:false,validation:'週期／間歇性噪音採 Lmax平均或 L5 的評定條件包含與背景音量相差10 dB以上；目前未達此條件，本模組不自行改套 Leq。請調整測點、排除或降低其他噪音源後重新確認，或由承辦人另行確認適用評定方式。'};

    const spread=input.noiseGeneralSpread;
    if(!spread||spread==='unknown')return {status:'pending',showBg10:true,showSpread:true,validation:'請確認週期／間歇性噪音連續最大音量值之差是否超過5 dB。'};
    if(spread==='lte5')return {status:'ok',method:'lmaxMean',text:methodLabel.lmaxMean,showBg10:true,showSpread:true};
    if(spread==='gt5')return {status:'ok',method:'l5',text:methodLabel.l5,showBg10:true,showSpread:true};
    return {status:'pending',showBg10:true,showSpread:true,validation:'最大音量差資料無法辨識，請重新確認。'};
  }

  function isGeneralFull(input){
    if(input.noiseSpecial!=='ordinary'||input.noiseNature!=='measurable')return false;
    if(!['factory','entertainment','business','otherFacility'].includes(input.noiseA9Type))return false;
    return input.noiseBand==='full'||input.noiseBand==='both';
  }

  function methodState(input){
    const hasGuidedFacts=!!(input.noiseGeneralPattern||input.noiseGeneralBg10||input.noiseGeneralSpread);
    if(!hasGuidedFacts&&methodLabel[input.noiseGeneralMethod]){
      return {status:'ok',method:input.noiseGeneralMethod,text:`舊案件相容｜${methodLabel[input.noiseGeneralMethod]}`,showBg10:false,showSpread:false,legacy:true};
    }
    return deriveGeneralMethod(input);
  }

  function decorate(out,state){
    out.noiseShowGeneralMethod=isGeneralFull(out)?'yes':(out.noiseShowGeneralMethod||'no');
    out.noiseShowGeneralBg10=state?.showBg10?'yes':'no';
    out.noiseShowGeneralSpread=state?.showSpread?'yes':'no';
    out.noiseGeneralMethod=state?.method||'';
    out.noiseGeneralMethodText=state?.text||'';
    return out;
  }

  function prepare(input={}){
    if(!isGeneralFull(input))return decorate(innerPrepare(input),null);
    const state=methodState(input);
    const forwarded={...input,noiseGeneralMethod:state.status==='ok'?state.method:''};
    const out=decorate(innerPrepare(forwarded),state);
    if(state.status==='ok')return out;
    if(out.noiseShowGeneralMethod!=='yes')return out;
    out.noiseBlocked='yes';
    out.noiseValidation=state.validation;
    out.noiseGuide=state.validation;
    out.noiseRecord='';out.noiseReply='';
    return out;
  }

  function resetChange(before={},after={}){
    const next=innerReset(before,after);
    const clear=keys=>keys.forEach(k=>{next[k]='';});
    if(before.noiseGeneralPattern!==after.noiseGeneralPattern)clear(['noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseGeneralBg10!==after.noiseGeneralBg10)clear(['noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseGeneralSpread!==after.noiseGeneralSpread)clear(['noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    return next;
  }

  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,deriveGeneralMethod,__methodGuidanceWrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noiseMethodGuidance=config=>{
    const t=config?.templates?.find(x=>x.id==='noise-main');
    if(!t||t.__methodGuidancePatched)return;
    const index=t.fields.findIndex(f=>f.id==='noiseGeneralMethod');
    if(index<0)return;
    const missing=t.fields[index].missing||'（尚未確認）';
    const select=(id,label,options,displayWhen)=>({id,label,type:'select',missing,allowCustom:false,options:options.map(([value,text])=>({id:value,value:text,label:text})),displayWhen});
    const computed=(id,label,display=false,displayWhen=null)=>({id,label,type:'computed',missing,display,...(displayWhen?{displayWhen}:{})});
    const show={field:'noiseShowGeneralMethod',value:'yes'};
    const replacement=[
      select('noiseGeneralPattern','全頻發聲特性｜是否呈週期性或間歇性變動',[['periodic','是｜呈週期性或間歇性變動'],['other','否｜非屬週期性／間歇性變動（含聲音大小或發生間隔不一定）'],['unknown','尚待確認']],show),
      select('noiseGeneralBg10','週期／間歇性噪音｜音源量測值與背景音量是否相差10 dB以上',[['yes','是｜相差10 dB以上'],['no','否｜未達10 dB'],['unknown','尚待確認']],{field:'noiseShowGeneralBg10',value:'yes'}),
      select('noiseGeneralSpread','週期／間歇性噪音｜連續最大音量值之差',[['lte5','不超過5 dB'],['gt5','超過5 dB'],['unknown','尚待確認']],{field:'noiseShowGeneralSpread',value:'yes'}),
      computed('noiseGeneralMethod','系統導出之全頻評定方法'),
      computed('noiseGeneralMethodText','系統導出之全頻評定方法',true,show)
    ];
    t.fields.splice(index,1,...replacement);
    t.fields.splice(t.fields.findIndex(f=>f.id==='noiseShowSpeakerMode'),0,
      computed('noiseShowGeneralBg10','generalBg10'),computed('noiseShowGeneralSpread','generalSpread'));
    t.version='4.9-rebuild-8';t.moduleVersion='4.9-rebuild-8';t.__methodGuidancePatched=true;
  };
})(typeof window==='undefined'?globalThis:window);
