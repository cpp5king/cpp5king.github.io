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
  const dateDay=value=>{
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
    if(!m)return null;
    const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
    const d=new Date(Date.UTC(y,month-1,day));
    if(d.getUTCFullYear()!==y||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return null;
    return d.getUTCDay();
  };
  const holidaySensitiveTime=value=>{
    const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));
    if(!m)return false;
    const minutes=Number(m[1])*60+Number(m[2]);
    return (minutes>=12*60&&minutes<14*60)||(minutes>=20*60&&minutes<22*60);
  };
  function holidayState(input){
    const day=dateDay(input.noiseDate);
    if(day===null)return {ready:false,effective:'',auto:'',sensitive:false,text:'日期尚未完成，無法判斷一般平日／週末。'};
    const auto=day===0||day===6?'yes':'no';
    const override=['yes','no'].includes(input.noiseHolidayOverride)?input.noiseHolidayOverride:'';
    const effective=override||auto;
    const sensitive=validTime(input.noiseTime)&&holidaySensitiveTime(input.noiseTime);
    const autoLabel=auto==='yes'?'一般週末／例假日':'一般平日';
    const effectiveLabel=effective==='yes'?'放假日':'上班日';
    const suffix=override?`；已依稽查員特殊日曆修正為${effectiveLabel}`:(sensitive?'；如遇國定假日、補班日或其他特殊放假，請使用下方「特殊日曆修正」':'');
    return {ready:true,effective,auto,override,sensitive,text:`系統依日期判斷：${autoLabel}${suffix}。`};
  }

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
  function syncA8Options(candidates){
    if(!candidates?.ready)return;
    try{
      const template=root.INSPECTION_CONFIG?.templates?.find(x=>x.id==='noise-main');
      const field=template?.fields?.find(x=>x.id==='noiseA8Act');
      if(!field)return;
      field.options=[
        ...candidates.acts.map(act=>({id:act.id,value:act.label,label:act.label})),
        {id:'none',value:'以上皆非',label:'以上皆非'}
      ];
    }catch(_){/* UI 選項同步失敗時仍以規則引擎結果為準 */}
  }
  function quickSummary(input,out,candidates){
    if(!input.noiseDate||!validTime(input.noiseTime))return '簡易判斷｜先輸入實際稽查日期與24小時制時間。';
    if(!['difficult','measurable'].includes(input.noiseNature))return '簡易判斷｜第一步先確認是否為不具持續性或不易量測之聲音；若是，直接分流主管機關。';
    if(input.noiseNature==='difficult'){
      if(!String(input.noiseDifficultSource||'').trim())return '簡易判斷｜不具持續性或不易量測；請填寫實際音源／聲音描述。';
      if(!['yes','no'].includes(input.noiseCommunityCommittee))return '簡易判斷｜不具持續性或不易量測；請確認是否為設有管理委員會之社區。';
      if(input.noiseCommunityCommittee==='yes')return '簡易判斷｜有管委會社區：主管機關方向為新北市政府工務局公寓大廈管理科。';
      return '簡易判斷｜無管委會／非由管委會處理：轉警察機關處理，不進環保局第8條、第9條流程。';
    }
    if(!input.noiseSpecial)return '簡易判斷｜聲音具持續性且可量測；下一步確認主要噪音來源與主管機關。';
    if(specialTypes.includes(input.noiseSpecial))return `簡易判斷｜特殊來源分流：${out.noiseRouteText||out.noiseGuide||'依專章處理'}。`;
    if(input.noiseSpecial!=='ordinary')return '簡易判斷｜來源類型尚待確認。';
    if(!candidates?.ready)return `簡易判斷｜一般噪音案件；${candidates?.zone?.state?.message||'請完成噪音管制區，系統才能比對第8條禁止時段。'}`;
    const labels=candidates.acts.map(act=>act.label);
    if(out.noiseRouteText?.includes('第8條公告禁止行為成立'))return '簡易判斷｜目前走第8條，由環保局依公告禁止行為處理。';
    if(labels.length&&out.noiseShowAfterA8!=='yes')return '簡易判斷｜系統已依日期、時間及管制區篩選第8條候選，請直接確認現場行為。';
    if(out.noiseShowA9==='yes'||out.noiseRouteText?.includes('第9條'))return '簡易判斷｜第8條未成立或本時段無候選；目前進入第9條場所／工程／設施及量測流程。';
    return '簡易判斷｜依目前事實繼續完成下一個必要判斷。';
  }
  function decorate(input,out,candidates){
    const calendar=holidayState(input);
    const dateTimeReady=!!input.noiseDate&&validTime(input.noiseTime);
    const measurable=input.noiseNature==='measurable';
    out.noiseShowNatureFront=dateTimeReady?'yes':'no';
    out.noiseShowSourceRouting=dateTimeReady&&measurable?'yes':'no';
    out.noiseShowGeneralSetup=measurable&&input.noiseSpecial==='ordinary'?'yes':'no';
    out.noiseShowA8Choice=measurable&&input.noiseSpecial==='ordinary'&&candidates?.ready&&candidates.acts.length>0?'yes':'no';
    out.noiseHoliday=calendar.effective||'';
    out.noiseHolidayAutoText=calendar.text||'';
    out.noiseShowHolidayOverride=measurable&&input.noiseSpecial==='ordinary'&&calendar.ready&&calendar.sensitive?'yes':'no';
    out.noiseQuickDecisionText=quickSummary(input,out,candidates);
    return out;
  }
  function difficultDraftTexts(noiseType){
    const templates=root.NOISE_TEXTS?.templates||{};
    const replyTemplate=String(templates.neighborReply||'');
    return {
      committeeRecord:String(templates.committeeRecord||''),
      policeRecord:String(templates.policeRecord||''),
      reply:replyTemplate?replyTemplate.replace('{{noiseType}}',String(noiseType||'').trim()):''
    };
  }
  function applyDifficultCommunityRoute(input,out){
    if(input.noiseNature!=='difficult')return out;
    out.noiseShowA6Disturbance='yes';
    out.noiseA6Disturbance='';
    const noiseType=String(input.noiseDifficultSource||'').trim();
    if(!noiseType){
      return setOutcome(out,{
        route:'不具持續性或不易量測｜音源描述',
        guide:'請由稽查員填寫實際聽聞之音源／聲音描述；系統不自行推定聲音種類。',
        validation:'請填寫不具持續性／不易量測之音源／聲音描述。'
      });
    }
    const committee=input.noiseCommunityCommittee;
    const drafts=difficultDraftTexts(noiseType);
    if(!drafts.committeeRecord||!drafts.policeRecord||!drafts.reply){
      return setOutcome(out,{
        route:'第6條文字模板未載入',
        guide:'第6條既有核定文字模板未載入，暫不產生案件草稿。',
        validation:'第6條核定文字模板未載入，請重新開啟系統後再試。'
      });
    }
    if(!['yes','no'].includes(committee)){
      return setOutcome(out,{
        route:'不具持續性或不易量測｜主管機關分流',
        guide:'請確認噪音發生場所是否為設有管理委員會之社區；有管委會與無管委會之後續處理機關不同。',
        validation:'請確認是否為設有管理委員會之社區。'
      });
    }
    if(committee==='yes'){
      const body='現場聲音屬不具持續性或不易量測；噪音發生場所為設有管理委員會之社區，主管機關方向為新北市政府工務局公寓大廈管理科；本案不進入環保局第8條、第9條流程。';
      return setOutcome(out,{
        route:'有管委會社區｜主管機關：工務局公寓大廈管理科',
        guide:body,blocked:false,
        record:drafts.committeeRecord,
        reply:drafts.reply
      });
    }
    const body='現場聲音屬不具持續性或不易量測，且非由社區管理委員會處理之情形；後續轉警察機關依有關法規處理，本案不進入環保局第8條、第9條流程。';
    return setOutcome(out,{
      route:'無管委會／警察機關處理方向｜本次不進第8條、第9條',
      guide:body,blocked:false,
      record:drafts.policeRecord,
      reply:drafts.reply
    });
  }
  function prepare(rawInput={}){
    const input={...rawInput};

    if(!input.noiseDate||!validTime(input.noiseTime)){
      const out=baseline(input);
      setOutcome(out,{
        route:'稽查日期與時間',
        guide:'先輸入實際稽查日期及24小時制時間。',
        validation:'請先完成稽查日期與時間。'
      });
      return decorate(input,out,null);
    }

    if(!['difficult','measurable'].includes(input.noiseNature)){
      const out=baseline(input);
      setOutcome(out,{
        route:'第一步｜聲音可量測性／主管機關前置分流',
        guide:'先確認是否為不具持續性或不易量測之聲音；若是，直接依社區管委會情形分流主管機關，不進第8條、第9條。',
        validation:'請先確認是否為不具持續性或不易量測之聲音。'
      });
      return decorate(input,out,null);
    }

    if(input.noiseNature==='difficult'){
      const forwarded={...input,noiseSpecial:''};
      let out=baseline(forwarded);
      out=applyDifficultCommunityRoute(forwarded,out);
      return decorate(forwarded,out,null);
    }

    if(!input.noiseSpecial){
      const out=baseline(input);
      setOutcome(out,{
        route:'第二步｜主要噪音來源／主管機關分流',
        guide:'聲音具持續性且可量測，請確認主要噪音來源；車輛、陸上運輸、民航、軍航依各自主管機關／專章分流，一般噪音源才繼續管制區、第8條與第9條。',
        validation:'請確認主要噪音來源。'
      });
      return decorate(input,out,null);
    }

    const forwarded={...input};
    const calendar=holidayState(forwarded);
    forwarded.noiseHoliday=calendar.effective||'';

    const candidates=forwarded.noiseSpecial==='ordinary'?article8Candidates(forwarded):null;
    if(candidates?.ready){
      const allowed=new Set(candidates.acts.map(act=>act.id));
      if(forwarded.noiseA8Act&&forwarded.noiseA8Act!=='none'&&!allowed.has(forwarded.noiseA8Act))forwarded.noiseA8Act='';
      if(candidates.acts.length===0&&!forwarded.noiseA8Act)forwarded.noiseA8Act='none';
      syncA8Options(candidates);
    }

    // 第8條候選行為本身即為稽查員現場確認，不再另問「是否足以妨害安寧」。
    if(forwarded.noiseSpecial==='ordinary'&&forwarded.noiseA8Act&&forwarded.noiseA8Act!=='none')forwarded.noiseA8Disturbance='yes';
    if(forwarded.noiseSpecial==='vehicle'&&forwarded.noiseVehicleExhaustA8==='yes')forwarded.noiseA8Disturbance='yes';

    let out=innerPrepare(forwarded);
    return decorate(forwarded,out,candidates);
  }
  function resetChange(before={},after={}){
    const adjustedAfter={...after};
    if(before.noiseDate!==after.noiseDate)adjustedAfter.noiseHolidayOverride='';
    if(adjustedAfter.noiseNature!=='measurable'){
      adjustedAfter.noiseSpecial='';
      adjustedAfter.noiseVehicleExhaustA8='';
    }
    const beforeEffective={...before,noiseHoliday:holidayState(before).effective||''};
    const afterEffective={...adjustedAfter,noiseHoliday:holidayState(adjustedAfter).effective||''};
    const next=innerReset(beforeEffective,afterEffective);
    // 新流程把 noiseNature 放在 noiseSpecial 之前；舊核心 resetChange 在來源改變時會清除 noiseNature。
    // 來源屬於下游選項，不得回頭清除已完成的可量測性判斷。
    next.noiseNature=adjustedAfter.noiseNature||'';
    const upstream=['noiseDate','noiseTime','noiseNature','noiseSpecial','noiseZoneMode','noiseZone',...zoneAssistFields,'noiseHolidayOverride','noiseA8Act'];
    if(upstream.some(key=>before[key]!==adjustedAfter[key])){
      next.noiseDifficultSource='';
      next.noiseCommunityCommittee='';
    }
    if(adjustedAfter.noiseNature!=='measurable'){
      next.noiseSpecial='';
      next.noiseVehicleExhaustA8='';
    }
    next.noiseHolidayOverride=adjustedAfter.noiseHolidayOverride||'';
    next.noiseA6Disturbance='';
    next.noiseA8Disturbance='';
    return next;
  }
  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,article8Candidates,holidayState,__priorityRoutingWrapped:true};
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
    const nature=remove('noiseNature');
    const special=remove('noiseSpecial');
    const vehicle=remove('noiseVehicleExhaustA8');
    remove('noiseHoliday');
    remove('noiseA6Disturbance');
    remove('noiseA8Disturbance');

    const firstInput=fields.findIndex(f=>!['computed','fixed'].includes(f.type));
    const insertAt=firstInput<0?fields.length:firstInput;
    const natureFlag={id:'noiseShowNatureFront',label:'nature-front',type:'computed',missing:'（系統判斷）',display:false};
    const sourceFlag={id:'noiseShowSourceRouting',label:'source-routing',type:'computed',missing:'（系統判斷）',display:false};
    const generalFlag={id:'noiseShowGeneralSetup',label:'general-setup',type:'computed',missing:'（系統判斷）',display:false};
    const a8ChoiceFlag={id:'noiseShowA8Choice',label:'a8-choice',type:'computed',missing:'（系統判斷）',display:false};
    const holidayFlag={id:'noiseShowHolidayOverride',label:'holiday-override',type:'computed',missing:'（系統判斷）',display:false};
    const holidayValue={id:'noiseHoliday',label:'holiday-effective',type:'computed',missing:'（系統判斷）',display:false};
    const summary={id:'noiseQuickDecisionText',label:'簡易判斷',type:'computed',missing:'（尚未確認）',display:true,className:'live-assessment'};

    if(date){date.label='稽查日期';delete date.displayWhen;}
    if(time){time.label='稽查時間（24小時制）';time.timePicker={empty:'—',hour:'時',minute:'分'};delete time.displayWhen;}
    if(nature){
      nature.label='第一步｜是否為不具持續性或不易量測之聲音？';
      nature.options=[
        {id:'difficult',value:'不具持續性或不易量測',label:'是｜不具持續性／不易量測，直接判斷主管機關'},
        {id:'measurable',value:'具持續性且可量測',label:'否｜具持續性且容易量測，繼續環保局噪音稽查'}
      ];
      nature.displayWhen={field:'noiseShowNatureFront',value:'yes'};
    }
    if(special){
      special.label='第二步｜主要噪音來源／主管機關分流';
      special.displayWhen={field:'noiseShowSourceRouting',value:'yes'};
    }
    if(vehicle)vehicle.displayWhen={field:'noiseSpecial',value:'vehicle'};

    const difficultSource={
      id:'noiseDifficultSource',
      label:'不具持續性／不易量測｜音源／聲音描述',
      type:'text',missing:'（尚未填寫）',
      placeholder:'例如：寵物吠叫、鄰居偶發聲響、家具落地聲',
      displayWhen:{field:'noiseShowA6Disturbance',value:'yes'}
    };
    const community={
      id:'noiseCommunityCommittee',
      label:'不具持續性／不易量測｜是否為設有管理委員會之社區？',
      type:'select',missing:'（尚未確認）',allowCustom:false,
      options:[
        {id:'yes',value:'有管理委員會之社區',label:'是｜有管理委員會之社區'},
        {id:'no',value:'無管理委員會／非由管委會處理',label:'否｜無管理委員會／非由管委會處理'}
      ],
      displayWhen:{field:'noiseShowA6Disturbance',value:'yes'}
    };

    fields.splice(insertAt,0,natureFlag,sourceFlag,generalFlag,a8ChoiceFlag,holidayFlag,holidayValue,summary,...[date,time,nature,difficultSource,community,special,vehicle].filter(Boolean));

    const zoneMode=byId('noiseZoneMode');
    if(zoneMode){zoneMode.label='一般噪音源｜噪音管制區判定方式';zoneMode.displayWhen={field:'noiseShowGeneralSetup',value:'yes'};}
    const zone=byId('noiseZone');if(zone)zone.displayWhen={field:'noiseShowGeneralSetup',value:'yes'};
    const a8=byId('noiseA8Act');
    if(a8){
      a8.label='依目前日期、時間及管制區可能適用之第8條禁止行為';
      a8.displayWhen={field:'noiseShowA8Choice',value:'yes'};
      const a8Index=fields.indexOf(a8);
      const holidayText={
        id:'noiseHolidayAutoText',
        label:'日曆判斷',
        type:'computed',missing:'（系統判斷）',display:true,
        displayWhen:{field:'noiseShowHolidayOverride',value:'yes'}
      };
      const holidayOverride={
        id:'noiseHolidayOverride',
        label:'特殊日曆修正（一般日期免填）',
        type:'select',missing:'（使用系統判斷）',allowCustom:false,
        options:[
          {id:'yes',value:'當日依特殊日曆視為放假日',label:'改為放假日'},
          {id:'no',value:'當日依特殊日曆視為上班日',label:'改為上班日'}
        ],
        displayWhen:{field:'noiseShowHolidayOverride',value:'yes'}
      };
      fields.splice(a8Index,0,holidayText,holidayOverride);
    }

    const a9=byId('noiseA9Type');if(a9)a9.label='第9條場所／工程／設施類型';

    for(const f of fields){
      if(Array.isArray(f.options))f.options=f.options.filter(option=>option.id!=='unknown');
    }

    // 新案件預先帶入裝置當下日期／時間；只是預填，欄位仍可由稽查員自行修改。
    t.initialValues=()=>{
      const now=new Date(),pad=value=>String(value).padStart(2,'0');
      return {
        noiseDate:`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
        noiseTime:`${pad(now.getHours())}:${pad(now.getMinutes())}`
      };
    };
    t.mobileFocusMode=true;
    t.floatingFieldActions=true;
    t.quickActions={
      ariaLabel:'噪音流程快速操作',
      startFields:['noiseDate','noiseTime'],
      summaryField:'noiseQuickDecisionText',
      labels:{summary:'簡易判斷',back:'← 上一步',next:'下一步 →'}
    };
    t.version='4.9-rebuild-18';t.moduleVersion='4.9-rebuild-18';t.__priorityRoutingPatched=true;
  };
})(typeof window==='undefined'?globalThis:window);
