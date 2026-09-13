(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__methodGuidanceWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const methodLabel={
    leq:'Leq（一般全頻量測，連續取樣至少2分鐘）',
    lmaxMean:'Lmax平均（週期／間歇、與背景相差≥10 dB且最大音量差≤5 dB，連續10次最大值平均）',
    l5:'L5（週期／間歇、與背景相差≥10 dB且最大音量差>5 dB，至少20個最大值計算）'
  };

  function derivePeriodic(input={}){
    const bg10=tri(input.noiseGeneralBg10);
    if(bg10==='missing'||bg10==='unknown')return {status:'pending',showBg10:true,showSpread:false,validation:'特殊週期／間歇性評定請確認音源量測值與背景音量是否相差10 dB以上。'};
    if(bg10==='no')return {status:'unsupported',showBg10:true,showSpread:false,validation:'週期／間歇性噪音採 Lmax平均或 L5 的評定條件包含與背景音量相差10 dB以上；目前未達此條件，本模組不自行改套 Leq。請調整測點、排除或降低其他噪音源後重新確認，或由承辦人另行確認適用評定方式。'};
    const spread=input.noiseGeneralSpread;
    if(!spread||spread==='unknown')return {status:'pending',showBg10:true,showSpread:true,validation:'請確認週期／間歇性噪音連續最大音量值之差是否超過5 dB。'};
    if(spread==='lte5')return {status:'ok',method:'lmaxMean',text:methodLabel.lmaxMean,showBg10:true,showSpread:true};
    if(spread==='gt5')return {status:'ok',method:'l5',text:methodLabel.l5,showBg10:true,showSpread:true};
    return {status:'pending',showBg10:true,showSpread:true,validation:'最大音量差資料無法辨識，請重新確認。'};
  }

  // 保留舊案件相容：舊資料若已記錄週期／間歇判斷，仍依原規則解析；新案件一般不再詢問此題。
  function deriveLegacy(input={}){
    const pattern=input.noiseGeneralPattern;
    if(pattern==='other')return {status:'ok',method:'leq',text:methodLabel.leq,showBg10:false,showSpread:false,legacy:true};
    if(pattern==='periodic')return {...derivePeriodic(input),legacy:true};
    if(pattern&&pattern!=='unknown')return {status:'pending',showBg10:false,showSpread:false,validation:'舊案件全頻發聲特性無法辨識，請重新確認。',legacy:true};
    return null;
  }

  function isGeneralCase(input){
    if(input.noiseSpecial!=='ordinary'||input.noiseNature!=='measurable')return false;
    return ['factory','entertainment','business','otherFacility'].includes(input.noiseA9Type);
  }

  function methodState(input){
    const legacy=deriveLegacy(input);
    if(legacy)return legacy;
    if(input.noiseGeneralSpecialAssessment==='periodic')return derivePeriodic(input);
    // 第一線一般案件預設採2分鐘 Leq，不把週期／間歇性當成固定必答題。
    return {status:'ok',method:'leq',text:methodLabel.leq,showBg10:false,showSpread:false,defaulted:true};
  }

  function decorate(out,state){
    const active=isGeneralCase(out)&&String(out.noiseValueFull??'').trim()!=='';
    out.noiseShowGeneralMethod=active?'yes':'no';
    out.noiseShowGeneralBg10=active&&state?.showBg10?'yes':'no';
    out.noiseShowGeneralSpread=active&&state?.showSpread?'yes':'no';
    out.noiseGeneralMethod=active?(state?.method||''):'';
    out.noiseGeneralMethodText=active?(state?.text||''):'';
    return out;
  }

  function prepare(input={}){
    if(!isGeneralCase(input))return decorate(innerPrepare(input),null);
    const state=methodState(input);
    const forwarded={...input,noiseGeneralMethod:state.status==='ok'?state.method:''};
    const out=decorate(innerPrepare(forwarded),state);
    if(state.status==='ok'||out.noiseShowGeneralMethod!=='yes')return out;
    out.noiseBlocked='yes';
    out.noiseValidation=state.validation;
    out.noiseGuide=state.validation;
    out.noiseRecord='';out.noiseReply='';out.noiseOutcomeId='';
    return out;
  }

  function resetChange(before={},after={}){
    const next=innerReset(before,after);
    const clear=keys=>keys.forEach(k=>{next[k]='';});
    if(before.noiseGeneralSpecialAssessment!==after.noiseGeneralSpecialAssessment)clear(['noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseGeneralPattern!==after.noiseGeneralPattern)clear(['noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseGeneralBg10!==after.noiseGeneralBg10)clear(['noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseGeneralSpread!==after.noiseGeneralSpread)clear(['noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull']);
    return next;
  }

  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,deriveGeneralMethod:derivePeriodic,__methodGuidanceWrapped:true};
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
      select('noiseGeneralSpecialAssessment','特殊評定（一般2分鐘 Leq 案件可略過）',[['periodic','遇明顯週期／間歇性發聲，改用特殊評定']],show),
      select('noiseGeneralBg10','特殊評定｜音源量測值與背景音量是否相差10 dB以上',[['yes','是｜相差10 dB以上'],['no','否｜未達10 dB']],{field:'noiseShowGeneralBg10',value:'yes'}),
      select('noiseGeneralSpread','特殊評定｜連續最大音量值之差',[['lte5','不超過5 dB'],['gt5','超過5 dB']],{field:'noiseShowGeneralSpread',value:'yes'}),
      computed('noiseGeneralMethod','系統導出之全頻評定方法'),
      computed('noiseGeneralMethodText','全頻評定方式',true,show)
    ];
    t.fields.splice(index,1,...replacement);
    const speakerFlag=t.fields.findIndex(f=>f.id==='noiseShowSpeakerMode');
    if(speakerFlag>=0)t.fields.splice(speakerFlag,0,computed('noiseShowGeneralBg10','generalBg10'),computed('noiseShowGeneralSpread','generalSpread'));
    t.version='4.9-rebuild-16';t.moduleVersion='4.9-rebuild-16';t.__methodGuidancePatched=true;
  };
})(typeof window==='undefined'?globalThis:window);
