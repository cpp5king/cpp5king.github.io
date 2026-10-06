(function(root){
  'use strict';
  const baseWorkflow=root.TemplateWorkflows.noiseMain;
  const baseNoiseMain=root.NoiseMain;
  const text=x=>typeof x==='string'?x.trim():'';
  const yes=b=>b?'yes':'no';
  const specialTypes=['traffic','aviation','military'];
  const legacyStarted=input=>!!(
    input.mainDate||input.mainTime||input.mainZone||input.mainAct||input.mainMeasure||input.a9Type||
    input.a9Subject||input.a9Source||input.subject||input.noiseType||input.hasCommittee
  );
  const hasArticle9Facts=input=>!!(input.mainMeasure||input.a9Type||input.a9Subject||input.a9Source||input.a9Facility);
  function routing(input){
    const started=legacyStarted(input);
    const continuity=input.mainContinuity||(started?'measurable':'');
    if(continuity==='article6')return {branch:'article6',continuity,special:''};
    if(continuity!=='measurable')return {branch:'routing',continuity,special:''};
    const special=input.mainSpecial||(started?'ordinary':'');
    if(specialTypes.includes(special))return {branch:'special',continuity,special};
    if(special!=='ordinary')return {branch:'routing',continuity,special};
    return {branch:'ordinary',continuity,special};
  }
  function migrate(input){
    const next={...input};
    if(legacyStarted(next)&&!next.mainContinuity)next.mainContinuity='measurable';
    if(next.mainContinuity==='measurable'&&legacyStarted(next)&&!next.mainSpecial)next.mainSpecial='ordinary';
    if(next.mainSpecial==='ordinary'&&hasArticle9Facts(next)&&!next.mainArticle9Scope)next.mainArticle9Scope='yes';
    return next;
  }
  function emptyOutput(input,branch,guide){
    return {...input,
      mainRoute:branch,mainGuide:guide,mainValidation:guide,mainBlocked:'yes',mainRecord:'',mainReply:'',
      mainShowCore:'no',mainShowZone:'no',mainShowHoliday:'no',mainShowActs:'no',mainShowArticle9Scope:'no',
      mainShowMeasure:'no',mainShowType:'no',mainShowFacts:'no',mainShowSource:'no',mainUnmeasured:'no',
      mainOtherReason:'no',mainShowDuration:'no',backgroundHistoryText:'',attemptHistoryText:''};
  }
  function validateNeighbor(input){
    const legacy=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case');
    const spec=legacy?.fields?.find(f=>f.id==='noiseType');
    const valid=spec?.options?.some(o=>o.id===input.noiseType)||(input.noiseType==='custom'&&text(input.noiseTypeCustom));
    if(!valid)return [root.NOISE_TEXTS.neighbor.text003];
    if(!['yes','no'].includes(input.hasCommittee))return [root.NOISE_TEXTS.neighbor.text004];
    return [];
  }
  function neighborDocuments(input){
    return root.DraftEngine.generate(root.INSPECTION_CONFIG,'noise-case',{...input,scenario:'neighbor'});
  }
  function validate(input){
    input=migrate(input);
    const pre=routing(input),t=root.NOISE_TEXTS.main;
    if(pre.branch==='routing')return [pre.continuity!=='measurable'?t.routingRequired:t.specialRequired];
    if(pre.branch==='article6')return validateNeighbor(input);
    if(pre.branch==='special')return [t.specialGuide];
    const r=baseNoiseMain.route(input);
    if(r.branch==='article9'){
      if(!['yes','no'].includes(input.mainArticle9Scope))return [t.article9ScopeRequired];
      if(input.mainArticle9Scope==='no')return [t.article9OutGuide];
    }
    return baseWorkflow.validate(input);
  }
  function prepare(input){
    input=migrate(input);
    const pre=routing(input),t=root.NOISE_TEXTS.main;
    if(pre.branch==='routing')return emptyOutput(input,'routing',pre.continuity!=='measurable'?t.routingRequired:t.specialRequired);
    if(pre.branch==='special')return emptyOutput(input,'special',t.specialGuide);
    if(pre.branch==='article6'){
      const errors=validateNeighbor(input);
      let docs=null;
      if(!errors.length)docs=neighborDocuments(input);
      return {...emptyOutput(input,'article6',errors[0]||t.article6Guide+'\n'+t.article6Next),
        mainValidation:errors[0]||'',mainBlocked:yes(!docs),mainRecord:docs?.record||'',mainReply:docs?.reply||''};
    }
    const out=baseWorkflow.prepare(input);
    out.mainContinuity=input.mainContinuity;
    out.mainSpecial=input.mainSpecial;
    out.mainShowCore='yes';
    out.mainShowArticle9Scope=yes(out.mainRoute==='article9');
    out.mainShowMeasure='no';
    if(out.mainRoute==='article9'){
      if(!['yes','no'].includes(input.mainArticle9Scope)){
        out.mainGuide=t.enterArticle9+'\n'+t.article9ScopeRequired;
        out.mainValidation=t.article9ScopeRequired;
        out.mainBlocked='yes';out.mainRecord='';out.mainReply='';
        out.mainShowType='no';out.mainShowFacts='no';out.mainShowSource='no';out.mainUnmeasured='no';out.mainOtherReason='no';out.mainShowDuration='no';
      }else if(input.mainArticle9Scope==='no'){
        out.mainGuide=t.article9OutGuide;
        out.mainValidation=t.article9OutGuide;
        out.mainBlocked='yes';out.mainRecord='';out.mainReply='';
        out.mainShowType='no';out.mainShowFacts='no';out.mainShowSource='no';out.mainUnmeasured='no';out.mainOtherReason='no';out.mainShowDuration='no';
      }else{
        out.mainShowMeasure='yes';
      }
    }
    out.mainArticle9Scope=input.mainArticle9Scope||'';
    return out;
  }
  function resetChange(before,after){
    const next={...after};
    if(before.mainContinuity!==after.mainContinuity){
      next.mainSpecial='';next.mainArticle9Scope='';
    }
    if(before.mainSpecial!==after.mainSpecial)next.mainArticle9Scope='';
    if(before.mainArticle9Scope!==after.mainArticle9Scope&&after.mainArticle9Scope!=='yes'){
      next.mainMeasure='';
    }
    return baseWorkflow.resetChange(migrate(before),migrate(next));
  }
  function route(input){
    input=migrate(input);
    const pre=routing(input);
    if(pre.branch!=='ordinary')return {branch:pre.branch,state:{candidates:[],zoneValid:false,needsHoliday:false,ready:false,established:false,status:''},confirmed:false,special:pre.special};
    return baseNoiseMain.route(input);
  }
  root.NoiseMain={...baseNoiseMain,routing,route,validate,prepare,resetChange};
  root.TemplateWorkflows.noiseMain={...baseWorkflow,prepare,resetChange,validate};
})(window);
