(function(root){
  'use strict';
  const core=root.NoiseMain;
  if(!core||core.__priorityRoutingWrapped)return;
  const innerPrepare=core.prepare;
  const innerReset=core.resetChange;
  const specialTypes=['vehicle','landTransport','civilAviation','militaryAviation'];
  const zoneAssistFields=['noiseZoneAssistType','noiseZoneLandClass','noiseZoneTrafficSource','noiseZoneSourceZone','noiseZoneSideA','noiseZoneSideB','noiseZonePointSide','noiseZoneMajorPosition','noiseZoneOriginalFourth','noiseZoneAdjacentFirst','noiseZoneUnderlying','noiseZoneBoundaryPair'];
  const validTime=value=>{
    const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));
    if(!m)return false;
    const h=Number(m[1]),n=Number(m[2]);
    return h>=0&&h<24&&n>=0&&n<60;
  };

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
    if(!zone.ready||!validTime(input.noiseTime)||!['yes','no'].includes(input.noiseHoliday))return {ready:false,acts:[],zone};
    const acts=(root.NOISE_ARTICLE8_RULES?.acts||[]).filter(act=>act.id!=='exhaust');
    const applicable=acts.filter(act=>zone.zones.some(z=>core.actApplicable?.(act,z,input.noiseTime,input.noiseHoliday)));
    return {ready:true,acts:applicable,zone};
  }
  function quickSummary(input,out,candidates){
    if(!input.noiseDate||!validTime(input.noiseTime))return '簡易判斷｜第一步先輸入實際稽查日期與時間。禁止時段可能直接影響第8條及主管機關分流，未完成前不先下結論。';
    if(!input.noiseSpecial)return '簡易判斷｜已取得稽查日期與時間；下一步確認主要噪音來源／主管機關分流。';
    if(specialTypes.includes(input.noiseSpecial))return `簡易判斷｜特殊來源分流：${out.noiseRouteText||out.noiseGuide||'依專章處理'}。`;
    if(input.noiseSpecial!=='ordinary')return '簡易判斷｜來源類型尚待確認。';
    if(!candidates?.ready)return `簡易判斷｜一般噪音案件；${candidates?.zone?.state?.message||'請完成噪音管制區及假日別確認，才能比對第8條禁止時段。'}`;
    const labels=candidates.acts.map(act=>act.label);
    if(out.noiseRouteText?.includes('第8條公告禁止行為成立'))return `簡易判斷｜目前走第8條，由環保局依公告禁止行為處理。此時段／管制區可能適用：${labels.join('、')||'已確認之禁止行為'}。`;
    if(labels.length&&out.noiseShowAfterA8!=='yes')return `簡易判斷｜此時段／管制區可能適用第8條：${labels.join('、')}。請確認現場實際行為及必要事實。`;
    if(out.noiseShowAfterA8==='yes'&&!input.noiseNature)return '簡易判斷｜第8條禁止行為未成立或不適用；下一步再判斷聲音是否具持續性且可量測。';
    if(input.noiseNature==='difficult'){
      if(!['yes','no'].includes(input.noiseCommunityCommittee))return '簡易判斷｜第8條未成立，且聲音不具持續性或不易量測；請確認是否為設有管理委員會之社區。';
      if(input.noiseCommunityCommittee==='yes')return '簡易判斷｜有管委會之社區：交由管理委員會處理；主管機關方向為新北市政府工務局公寓大廈管理科。';
      return '簡易判斷｜無管委會／非由管委會處理：轉警察機關處理方向，不進第9條量測。';
    }
    if(input.noiseNature==='measurable'){
      if(out.noiseShowA9==='yes'||out.noiseRouteText?.includes('第9條'))return '簡易判斷｜第8條未成立，聲音具持續性且可量測；目前進入第9條場所／工程／設施及量測流程。';
      return '簡易判斷｜聲音具持續性且可量測，依後續第9條流程確認。';
    }
    return '簡易判斷｜依目前事實繼續完成下一個必要判斷。';
  }
  function decorate(input,out,candidates){
    out.noiseQuickDecisionText=quickSummary(input,out,candidates);
    return out;
  }
  function applyDifficultCommunityRoute(input,out){
    if(input.noiseSpecial!=='ordinary'||input.noiseNature!=='difficult'||out.noiseShowAfterA8!=='yes')return out;
    // 沿用既有「第8條後、不易量測」顯示旗標，但前端改問管委會，不再要求稽查員判斷第6條妨害安寧要件。
    out.noiseShowA6Disturbance='yes';
    out.noiseA6Disturbance='';
    const committee=input.noiseCommunityCommittee;
    if(!['yes','no','unknown'].includes(committee)||committee==='unknown'){
      return setOutcome(out,{
        route:'第8條未成立／不具持續性或不易量測｜主管機關分流',
        guide:'請確認噪音發生場所是否為設有管理委員會之社區；有管委會與無管委會之後續處理機關不同。',
        validation:'請確認是否為設有管理委員會之社區。'
      });
    }
    if(committee==='yes'){
      const body='本案第8條公告禁止行為未成立或不適用，現場聲音屬不具持續性或不易量測；噪音發生場所為設有管理委員會之社區，交由社區管理委員會處理，主管機關方向為新北市政府工務局公寓大廈管理科；本案不進入環保局一般第9條量測流程。';
      return setOutcome(out,{
        route:'有管委會社區／交由管理委員會處理｜主管機關：工務局公寓大廈管理科',
        guide:body,blocked:false,
        record:`主管機關分流：${body}`,
        reply:'有關噪音陳情案，依目前查得情形屬社區管理委員會處理範圍，公寓大廈管理主管機關方向為新北市政府工務局公寓大廈管理科。'
      });
    }
    const body='本案第8條公告禁止行為未成立或不適用，現場聲音屬不具持續性或不易量測，且非由社區管理委員會處理之情形；後續轉警察機關依有關法規處理，本案不進入環保局一般第9條量測流程。';
    return setOutcome(out,{
      route:'無管委會／警察機關處理方向｜本次不進第9條量測',
      guide:body,blocked:false,
      record:`主管機關分流：${body}`,
      reply:'有關噪音陳情案，依目前查得聲音型態屬不具持續性或不易量測，且非由社區管理委員會處理之情形，後續由警察機關依有關法規處理。'
    });
  }

  function prepare(rawInput={}){
    const input={...rawInput};

    // 全部噪音案件一律先取得實際稽查日期與時間；禁止時段本身可能改變第8條及主管機關方向。
    if(!input.noiseDate||!validTime(input.noiseTime)){
      const out=baseline(input);
      setOutcome(out,{
        route:'第一步｜稽查日期與時間',
        guide:'先輸入實際稽查日期及時間。部分第8條公告行為依禁止時段決定是否由環保局處理，因此時間必須在來源與量測分流之前確認。',
        validation:'請先完成稽查日期與時間。'
      });
      return decorate(input,out,null);
    }

    const candidates=input.noiseSpecial==='ordinary'?article8Candidates(input):null;
    const forwarded={...input};
    // 依時間、管制區與假日別確認沒有任何第8條候選時，自動略過，不要求人工再選「無」。
    if(candidates?.ready&&candidates.acts.length===0&&!forwarded.noiseA8Act)forwarded.noiseA8Act='none';

    let out=innerPrepare(forwarded);
    out=applyDifficultCommunityRoute(forwarded,out);
    return decorate(forwarded,out,candidates);
  }

  function resetChange(before={},after={}){
    const next=innerReset(before,after);
    const upstream=['noiseDate','noiseTime','noiseSpecial','noiseZoneMode','noiseZone',...zoneAssistFields,'noiseHoliday','noiseA8Act','noiseA8Disturbance','noiseNature'];
    if(upstream.some(key=>before[key]!==after[key]))next.noiseCommunityCommittee='';
    // 舊第6條妨害安寧欄位已不再作為此分流必要事實。
    next.noiseA6Disturbance='';
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

    const date=remove('noiseDate');
    const time=remove('noiseTime');
    remove('noiseA6Disturbance');
    const firstInput=fields.findIndex(f=>!['computed','fixed'].includes(f.type));
    const insertAt=firstInput<0?fields.length:firstInput;
    const summary={id:'noiseQuickDecisionText',label:'簡易判斷',type:'computed',missing:'（尚未確認）',display:true,className:'live-assessment'};
    if(date){date.label='第一步｜稽查日期';delete date.displayWhen;}
    if(time){time.label='第一步｜稽查時間';delete time.displayWhen;}
    fields.splice(insertAt,0,summary,...[date,time].filter(Boolean));

    const special=byId('noiseSpecial');
    if(special){special.label='第二步｜主要噪音來源／主管機關分流';delete special.displayWhen;}
    const zoneMode=byId('noiseZoneMode');if(zoneMode)zoneMode.label='第三步｜噪音管制區判定方式';
    const holiday=byId('noiseHoliday');if(holiday)holiday.label='例假日／國定假日（影響第8條公告時段）';
    const a8=byId('noiseA8Act');if(a8)a8.label='第四步｜現場行為／音源樣態（系統依時間＋管制區自動判斷第8條適用性）';
    const nature=byId('noiseNature');
    if(nature){
      nature.label='第五步｜第8條未成立後，聲音是否具持續性且可量測？';
      nature.options=[
        {id:'measurable',value:'具持續性且可量測',label:'是｜具持續性且可量測'},
        {id:'difficult',value:'不具持續性或不易量測',label:'否｜不具持續性或不易量測'},
        {id:'unknown',value:'尚待確認',label:'尚待確認'}
      ];
      const natureIndex=fields.indexOf(nature);
      const community={
        id:'noiseCommunityCommittee',
        label:'不具持續性／不易量測｜是否為設有管理委員會之社區？',
        type:'select',missing:'（尚未確認）',allowCustom:false,
        options:[
          {id:'yes',value:'有管理委員會之社區',label:'是｜有管理委員會之社區'},
          {id:'no',value:'無管理委員會／非由管委會處理',label:'否｜無管理委員會／非由管委會處理'},
          {id:'unknown',value:'尚待確認',label:'尚待確認'}
        ],
        displayWhen:{field:'noiseShowA6Disturbance',value:'yes'}
      };
      fields.splice(natureIndex+1,0,community);
    }
    const a9=byId('noiseA9Type');if(a9)a9.label='第六步｜第9條場所／工程／設施類型';

    t.mobileFocusMode=true;
    t.floatingFieldActions=true;
    t.quickActions={
      ariaLabel:'噪音流程快速操作',
      startFields:['noiseDate','noiseTime'],
      summaryField:'noiseQuickDecisionText',
      labels:{summary:'簡易判斷',back:'← 上一步',next:'下一步 →'}
    };
    t.version='4.9-rebuild-10';t.moduleVersion='4.9-rebuild-10';t.__priorityRoutingPatched=true;
  };
})(typeof window==='undefined'?globalThis:window);