(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__priorityRoutingWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const validNature=v=>['measurable','difficult','unknown'].includes(v);
  const specialTypes=['vehicle','landTransport','civilAviation','militaryAviation'];
  const zoneAssistFields=['noiseZoneAssistType','noiseZoneLandClass','noiseZoneTrafficSource','noiseZoneSourceZone','noiseZoneSideA','noiseZoneSideB','noiseZonePointSide','noiseZoneMajorPosition','noiseZoneOriginalFourth','noiseZoneAdjacentFirst','noiseZoneUnderlying','noiseZoneBoundaryPair'];
  const downstream=['noiseSpecial','noiseVehicleExhaustA8','noiseDate','noiseTime','noiseZoneMode','noiseZone',...zoneAssistFields,'noiseHoliday','noiseA8Act','noiseA8Disturbance','noiseA6Disturbance','noiseA9Type','noiseFacility','noiseCompositeDifferentActors','noiseCompositeOverallExceeded','noiseCompositeSourceCount','noiseSubject','noiseSource','noiseBand','noiseGeneralPattern','noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseSpeakerMode','noiseFullPoint','noiseFullIndoor','noiseSpeakerOutdoor','noiseRain','noiseWind','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow'];

  function baseline(input){
    return innerPrepare({...input,noiseSpecial:''});
  }
  function setOutcome(out,{route,guide,validation='',blocked=true,record='',reply=''}={}){
    out.noiseRouteText=route||'';
    out.noiseGuide=guide||route||'';
    out.noiseValidation=validation||'';
    out.noiseBlocked=blocked?'yes':'no';
    out.noiseRecord=record||'';
    out.noiseReply=reply||'';
    return out;
  }
  function resolvedZones(input){
    const state=root.NoiseZone?.resolve?.(input);
    if(state?.status==='resolved'&&state.zone)return {ready:true,zones:[state.zone],state};
    if(state?.status==='boundary'&&Array.isArray(state.zones)&&state.zones.length===2)return {ready:true,zones:state.zones,state};
    return {ready:false,zones:[],state};
  }
  function article8Candidates(input){
    const zone=resolvedZones(input);
    if(!zone.ready||!/^\d{1,2}:\d{2}$/.test(String(input.noiseTime||''))||!['yes','no'].includes(input.noiseHoliday))return {ready:false,acts:[],zone};
    const acts=(root.NOISE_ARTICLE8_RULES?.acts||[]).filter(act=>act.id!=='exhaust');
    const applicable=acts.filter(act=>zone.zones.some(z=>core.actApplicable?.(act,z,input.noiseTime,input.noiseHoliday)));
    return {ready:true,acts:applicable,zone};
  }
  function quickSummary(input,out,candidates){
    const nature=input.noiseNature;
    if(!nature||nature==='unknown')return '簡易判斷｜先確認「一般噪音源是否具持續性且可量測」。未確認前不進入後續法規判斷。';
    if(nature==='difficult')return '簡易判斷｜不具持續性或不易量測：環保局一般第9條量測流程停止；主管方向為噪音管制法第6條之警察機關處理。';
    if(!input.noiseSpecial)return '簡易判斷｜已確認具持續性且可量測；請先確認是否屬車輛、交通或航空等特殊噪音來源。一般固定場所／工程／設施才進入第8條／第9條自動分流。';
    if(specialTypes.includes(input.noiseSpecial))return `簡易判斷｜特殊來源分流：${out.noiseRouteText||out.noiseGuide||'依專章處理'}。`;
    if(input.noiseSpecial!=='ordinary')return '簡易判斷｜來源類型尚待確認。';
    if(!input.noiseDate||!/^\d{1,2}:\d{2}$/.test(String(input.noiseTime||'')))return '簡易判斷｜環保局一般噪音案件；下一步先完成稽查日期與時間，再判噪音管制區及第8條公告。';
    if(!candidates?.ready)return `簡易判斷｜環保局一般噪音案件；${candidates?.zone?.state?.message||'請完成噪音管制區及假日別確認。'}`;
    const labels=candidates.acts.map(act=>act.label);
    if(!labels.length)return '簡易判斷｜依目前時間、管制區及假日別，未命中新北市第8條公告禁止時段；系統直接往第9條場所／工程／設施判斷。';
    if(out.noiseRouteText?.includes('第8條公告禁止行為成立'))return `簡易判斷｜目前走第8條。此時段／管制區可能適用之公告行為：${labels.join('、')}。`;
    if(out.noiseShowA9==='yes'||out.noiseRouteText?.includes('第9條'))return `簡易判斷｜第8條未成立，已轉第9條。此時段／管制區原可能適用之公告行為：${labels.join('、')}。`;
    return `簡易判斷｜此時段／管制區可能適用第8條之行為：${labels.join('、')}。請只確認現場實際行為，系統會自動決定第8條或第9條路徑。`;
  }
  function decorate(input,out,candidates){
    out.noiseQuickDecisionText=quickSummary(input,out,candidates);
    return out;
  }
  function hasLegacyOrdinaryProgress(input){
    if(input.noiseSpecial!=='ordinary'||input.noiseNature)return false;
    return !!(input.noiseA8Act||input.noiseA8Disturbance||input.noiseA9Type||input.noiseBand||input.noiseGeneralMethod||input.noiseSpeakerMode||input.noiseFacility);
  }

  function prepare(rawInput={}){
    const input={...rawInput};

    // 舊案件若已明確是特殊來源，維持原專章相容性，不要求補填新第一步。
    if(specialTypes.includes(input.noiseSpecial)&&!input.noiseNature){
      const out=innerPrepare(input);
      return decorate(input,out,null);
    }

    // 4.9.1 以前的一般案件可能沒有新第一題，但已有第8／9條下游事實。
    // 只對這種已明確走到下游的舊案件視為原先「可量測」流程，避免匯入舊案件時被卡回第一題。
    if(hasLegacyOrdinaryProgress(input))input.noiseNature='measurable';

    if(!validNature(input.noiseNature)||input.noiseNature==='unknown'){
      const out=baseline(input);
      setOutcome(out,{route:'第一步｜一般噪音源是否具持續性且可量測（主管機關初篩）',guide:'先確認是否屬環保局可進一步進行一般噪音量測之案件。',validation:'請先確認一般噪音源是否具持續性且可量測。'});
      return decorate(input,out,null);
    }

    if(input.noiseNature==='difficult'){
      const out=baseline(input);
      const body='本案依現場事實屬不具持續性或不易量測之聲音，環保局一般第9條噪音量測流程不續行；依噪音管制法第6條，屬警察機關依有關法規處理之分流方向。本工具於此不另行判斷是否已達妨害安寧程度。';
      setOutcome(out,{route:'第6條／警察機關處理方向／本次不進第9條量測',guide:body,blocked:false,record:`主管機關初步分流：${body}`,reply:'有關噪音陳情案，依目前查得聲音型態屬不具持續性或不易量測，依噪音管制法第6條規定，由警察機關依有關法規處理。'});
      return decorate(input,out,null);
    }

    if(!input.noiseSpecial){
      const out=baseline(input);
      setOutcome(out,{route:'特殊噪音來源快速分流',guide:'具持續性且可量測後，先確認是否屬一般固定場所／工程／設施，或車輛、交通、航空等特殊噪音來源。',validation:'請確認是否屬特殊噪音來源；一般案件請選「固定場所／工程／設施等一般噪音源」。'});
      return decorate(input,out,null);
    }

    if(input.noiseSpecial==='ordinary'&&(!input.noiseDate||!/^\d{1,2}:\d{2}$/.test(String(input.noiseTime||'')))){
      const out=baseline(input);
      setOutcome(out,{route:'第二步｜稽查日期與時間',guide:'先確認實際稽查日期及時間，再依時間與噪音管制區比對第8條公告。',validation:'請先完成稽查日期與時間。'});
      return decorate(input,out,null);
    }

    const candidates=input.noiseSpecial==='ordinary'?article8Candidates(input):null;
    const forwarded={...input};
    if(candidates?.ready&&candidates.acts.length===0&&!input.noiseA8Act)forwarded.noiseA8Act='none';
    const out=innerPrepare(forwarded);
    return decorate(input,out,candidates);
  }

  function resetChange(before={},after={}){
    const next=innerReset(before,after);
    const clear=keys=>keys.forEach(k=>{next[k]='';});

    // 新流程以 noiseNature 為最上游；變更第一步時清掉全部後續事實。
    if(before.noiseNature!==after.noiseNature)clear(downstream);

    // 原核心把 noiseNature 視為 noiseSpecial 的下游；新版順序相反，切換來源時保留第一步答案。
    if(before.noiseSpecial!==after.noiseSpecial)next.noiseNature=after.noiseNature||'';
    return next;
  }

  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,article8Candidates,__priorityRoutingWrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noisePriorityRouting=config=>{
    const t=config?.templates?.find(x=>x.id==='noise-main');
    if(!t||t.__priorityRoutingPatched)return;
    const fields=t.fields||[];
    const byId=id=>fields.find(f=>f.id===id);
    const remove=id=>{const i=fields.findIndex(f=>f.id===id);return i>=0?fields.splice(i,1)[0]:null;};

    const nature=remove('noiseNature');
    const special=remove('noiseSpecial');
    const date=remove('noiseDate');
    const time=remove('noiseTime');
    const firstInput=fields.findIndex(f=>!['computed','fixed'].includes(f.type));
    const insertAt=firstInput<0?fields.length:firstInput;
    const summary={id:'noiseQuickDecisionText',label:'簡易判斷',type:'computed',missing:'（尚未確認）',display:true,className:'live-assessment'};

    if(nature){
      nature.label='第一步｜一般噪音源是否具持續性且可量測？';
      delete nature.displayWhen;
      nature.options=[
        {id:'measurable',value:'具持續性且可量測',label:'是｜具持續性且可量測'},
        {id:'difficult',value:'不具持續性或不易量測',label:'否｜不具持續性或不易量測'},
        {id:'unknown',value:'尚待確認',label:'尚待確認'}
      ];
    }
    if(special){
      special.label='特殊來源快速分流｜一般案件請選第一項';
      special.displayWhen={field:'noiseNature',value:'measurable'};
    }
    if(date){date.label='第二步｜稽查日期';date.displayWhen={field:'noiseSpecial',value:'ordinary'};}
    if(time){time.label='第二步｜稽查時間';time.displayWhen={field:'noiseSpecial',value:'ordinary'};}
    fields.splice(insertAt,0,summary,...[nature,special,date,time].filter(Boolean));

    const zoneMode=byId('noiseZoneMode');if(zoneMode)zoneMode.label='第三步｜噪音管制區判定方式';
    const holiday=byId('noiseHoliday');if(holiday)holiday.label='例假日／國定假日（影響第8條公告時段）';
    const a8=byId('noiseA8Act');if(a8)a8.label='第四步｜現場行為／音源樣態（系統依時間＋管制區自動判斷第8條適用性）';
    const a9=byId('noiseA9Type');if(a9)a9.label='第五步｜第9條場所／工程／設施類型';

    t.mobileFocusMode=true;
    t.floatingFieldActions=true;
    t.quickActions={
      ariaLabel:'噪音流程快速操作',
      startFields:['noiseNature'],
      summaryField:'noiseQuickDecisionText',
      labels:{summary:'簡易判斷',back:'← 上一步',next:'下一步 →'}
    };
    t.version='4.9-rebuild-9';t.moduleVersion='4.9-rebuild-9';t.__priorityRoutingPatched=true;
  };
})(typeof window==='undefined'?globalThis:window);
