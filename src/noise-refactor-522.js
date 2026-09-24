(function(root){
  'use strict';
  const core=root.NoiseMain;
  const rules=root.NOISE_REFACTOR_522;
  if(!core||!rules||core.__refactor522Wrapped)return;

  const text=v=>typeof v==='string'?v.trim():'';
  const num=v=>text(String(v??''))!==''&&Number.isFinite(Number(v))?Number(v):null;
  const yes=b=>b?'yes':'no';
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const selected=(value,id)=>Array.isArray(value)?value.includes(id):value===id||String(value||'').split(',').includes(id);
  const validZone=z=>['1','2','3','4'].includes(String(z||''));
  const zoneLabel=z=>'第'+z+'類';
  const statusLabels={high:'高於適用標準',notHigh:'未高於適用標準',unable:'本次無法完成有效判定'};
  const hidden={field:'noise522Never',value:'yes'};
  const a8ExceptionFlag=id=>'noiseShowA8Exception_'+id;
  const a8ExceptionValue=(actId,...ids)=>['noiseA8Ex',actId,...ids].join('_');

  function fmt(v){return Number.isFinite(Number(v))?String(Math.round(Number(v)*10)/10):'';}
  function timeValid(v){const m=/^(\d{1,2}):(\d{2})$/.exec(text(v));if(!m)return false;const h=Number(m[1]),n=Number(m[2]);return h>=0&&h<24&&n>=0&&n<60;}
  function rocDate(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text(v));return m&&Number(m[1])>1911?(Number(m[1])-1911)+'年'+Number(m[2])+'月'+Number(m[3])+'日':'';}
  function inspectionTime(v){const m=/^(\d{1,2}):(\d{2})$/.exec(text(v));return m?Number(m[1])+'時'+(Number(m[2])?Number(m[2])+'分':'')+'許':'';}
  function inspectionHour(v){const m=/^(\d{1,2}):(\d{2})$/.exec(text(v));return m?Number(m[1])+'時許':'';}
  function periodLabel(v){return {day:'日間',evening:'晚間',night:'夜間'}[v]||'';}
  function targetStandardLabel(target){
    return {factory:'工廠（場）',entertainment:'娛樂場所',business:'營業場所',construction:'營建工程',renovation:'營建工程',speaker:'擴音設施',otherFacility:'其他經主管機關公告之場所、工程及設施'}[target?.id]||target?.label||'';
  }
  function publicPointText(input){
    const base=input.noiseMeasurementPlace==='boundary'
      ?'主管機關指定之周界外適當測點'
      :input.noiseMeasurementPlace==='complainant'
        ?'陳情人指定之住居所'
        :'';
    return base+(base&&text(input.noiseMeasurementPlaceDetail)?'（'+text(input.noiseMeasurementPlaceDetail)+'）':'');
  }
  function standardDescription(input,target,assessment){
    const rows=assessment?.rows||[];
    if(!rows.length)return '';
    return rows.map(row=>{
      const parts=[];
      if(fullEntered(input,target)){
        if((target.id==='construction'||target.id==='renovation')&&row.std?.full!==undefined&&row.std?.lmax!==undefined){
          parts.push('均能：'+fmt(row.std.full)+'分貝','最大音量：'+fmt(row.std.lmax)+'分貝');
        }else if(row.std?.full!==undefined){
          parts.push('均能：'+fmt(row.std.full)+'分貝');
        }
      }
      if(lowEntered(input)&&row.std?.low!==undefined)parts.push('低頻均能：'+fmt(row.std.low)+'分貝');
      return targetStandardLabel(target)+zoneLabel(row.zone)+'管制區'+periodLabel(row.std?.period)+'噪音管制標準'+(parts.length?'（'+parts.join('、')+'）':'');
    }).filter(Boolean).join('；');
  }
  function combineStatuses(rows){
    const finals=rows.map(x=>x.status).filter(Boolean);
    if(!rows.length||finals.length!==rows.length)return '';
    if(finals.includes('high'))return 'high';
    if(finals.includes('unable'))return 'unable';
    return 'notHigh';
  }
  function placeRow(input){return rules.places.find(x=>x.id===input.noisePlaceType)||null;}
  function placeLabel(input){
    const row=placeRow(input);
    if(!row)return '';
    if(row.id==='other'&&text(input.noisePlaceOtherText))return text(input.noisePlaceOtherText);
    return row.label;
  }
  function sourceLabel(input){
    if(input.noiseSourceCategory==='equipment'){
      const row=(rules.announcedItems||rules.equipment).find(x=>x.id===input.noiseEquipmentType);
      const announcedLabel=row&&['facility','renovation'].includes(row.kind)?row.label:'';
      return text(input.noiseSourceDescription)||announcedLabel||'機械設備';
    }
    const row=rules.sources.find(x=>x.id===input.noiseSourceCategory);
    return text(input.noiseSourceDescription)||row?.label||'';
  }
  function targetLabel(target){return target?.label||'';}
  function targetTable(target){
    if(!target)return '';
    return {factory:'factory',entertainment:'business',business:'business',construction:'construction',renovation:'construction',speaker:'speaker',otherFacility:'other'}[target.id]||'';
  }
  function fullEntered(input,target){
    if(!target)return false;
    return target.id==='construction'||target.id==='renovation'
      ? num(input.noiseValueLeq)!==null||num(input.noiseValueLmax)!==null
      : num(input.noiseValueFull)!==null;
  }
  function lowEntered(input){return num(input.noiseValueLow)!==null;}
  function anyMeasurementEntered(input,target){return fullEntered(input,target)||lowEntered(input);}
  function holidayState(input){
    if(typeof core.holidayState==='function'){
      const state=core.holidayState(input);
      if(state&&['yes','no'].includes(state.effective))return state.effective;
    }
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text(input.noiseDate));
    if(!m)return '';
    const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])));
    if(Number.isNaN(d.getTime()))return '';
    return d.getUTCDay()===0||d.getUTCDay()===6?'yes':'no';
  }
  function a8ZoneState(input){
    const zone=validZone(input.noiseA8SourceZone)
      ?String(input.noiseA8SourceZone)
      :(validZone(input.noiseDirectZone)?String(input.noiseDirectZone):'');
    if(!zone)return {status:'pending',zones:[],message:'請確認音源／第8條行為發生地所屬噪音管制區。',mapped:{...input}};
    return {status:'resolved',zones:[zone],message:'音源／第8條行為所在地為第'+zone+'類噪音管制區。',mapped:{...input,noiseZoneMode:'direct',noiseZone:zone}};
  }
  function a9ZoneInput(input){
    const out={...input};
    if(input.noiseA9BoundaryInvolved!=='yes'){
      const direct=validZone(input.noiseA9DirectZone)?String(input.noiseA9DirectZone):'';
      out.noiseZoneMode='direct';
      out.noiseZone=direct;
      return out;
    }
    out.noiseZoneMode='assist';
    if(input.noiseA9BoundaryKind==='zoneBoundary'){
      out.noiseZoneAssistType='boundary';
      out.noiseZoneBoundaryPair=input.noiseA9BoundaryZonePair||'';
      return out;
    }
    if(input.noiseA9BoundaryKind!=='road')return out;
    const width=num(input.noiseA9RoadWidth);
    if(width===null)return out;
    if(width<6){
      out.noiseZoneAssistType='roadUnder6';
      out.noiseZoneSideA=input.noiseA9RoadSideAZone||'';
      out.noiseZoneSideB=input.noiseA9RoadSideBZone||'';
      out.noiseZonePointSide=input.noiseA9RoadPointSide||'';
      return out;
    }
    if(width<15){
      out.noiseZoneAssistType='road6to15';
      out.noiseZoneTrafficSource='no';
      out.noiseZoneSourceZone=input.noiseA9RoadSourceSide==='a'?input.noiseA9RoadSideAZone:input.noiseA9RoadSourceSide==='b'?input.noiseA9RoadSideBZone:'';
      return out;
    }
    out.noiseZoneAssistType='majorTransport';
    const distance=num(input.noiseA9BoundaryDistance);
    if(distance!==null)out.noiseZoneMajorPosition=distance<=15?'within15':distance<=30?'from15to30':'beyond30';
    out.noiseZoneOriginalFourth=input.noiseA9RoadOriginalFourth||'';
    out.noiseZoneAdjacentFirst=input.noiseA9RoadAdjacentFirst||'';
    out.noiseZoneUnderlying=input.noiseA9ZoneLegalOverride||'';
    return out;
  }
  function a9ZoneState(input){
    const mapped=a9ZoneInput(input);
    if(root.NoiseZone?.resolve){
      const state=root.NoiseZone.resolve(mapped);
      if(state?.status==='resolved'&&state.zone)return {status:'resolved',zones:[state.zone],message:state.note||'',mapped};
      if(state?.status==='boundary'&&Array.isArray(state.zones))return {status:'boundary',zones:state.zones,message:state.note||'',mapped};
      return {status:'pending',zones:[],message:state?.message||'第9條量測適用管制區尚待確認。',mapped};
    }
    return {status:'pending',zones:[],message:'第9條量測適用管制區尚待確認。',mapped};
  }
  function zoneResultText(zone){
    if(!zone||zone.status==='pending')return '';
    if(zone.status==='boundary')return '第9條量測適用管制區：'+zone.zones.map(zoneLabel).join('＋')+'（交界，同時套用）';
    return '第9條量測適用管制區：'+zone.zones.map(zoneLabel).join('、');
  }
  function standardFor(target,zone,input){
    const table=root.NOISE_ARTICLE9_RULES?.tables?.[targetTable(target)];
    const p=typeof core.period==='function'?core.period(zone,input.noiseTime):'';
    const zi=Number(zone)-1,pi={day:0,evening:1,night:2}[p];
    if(!table||zi<0||zi>3||pi===undefined)return {period:p};
    return {period:p,full:table.full?.leq?.[zi]?.[pi],lmax:table.full?.lmax?.[zi]?.[pi],low:table.low?.leqLF?.[zi]?.[pi]};
  }
  function metric(overall,std,mode,bg){
    const v=num(overall);
    if(v===null||std===undefined)return {status:'',progress:'量測值或適用標準尚待確認。',needsBackground:false};
    if(v<=std)return {status:'notHigh',value:v,needsBackground:false};
    if(mode==='uncooperative')return {status:'high',value:v,needsBackground:true,note:'現場人員無法配合背景音量量測，依既有規則不修正並註明。'};
    if(mode!=='measured')return {status:'',progress:'測定值高於適用標準，尚待完成背景音量確認。',needsBackground:true};
    const b=num(bg);
    if(b===null)return {status:'',progress:'尚待輸入背景音量。',needsBackground:true};
    const c=core.correction(v,b);
    if(!c||c.status!=='ok')return {status:'unable',value:v,background:b,needsBackground:true,note:c?.message||'背景音量差值不足，無法完成有效判定。'};
    return {status:c.value>std?'high':'notHigh',value:c.value,raw:v,background:b,needsBackground:true,note:c.note||''};
  }
  function evaluateForZone(input,target,zone){
    const std=standardFor(target,zone,input);
    const fullSelected=fullEntered(input,target);
    const lowSelected=lowEntered(input);
    const outdoor=input.noiseMeasurementPlace==='boundary';
    const wind=num(input.noiseWind);
    let full={status:'',progress:'',needsBackground:false},low={status:'',progress:'',needsBackground:false};
    if(fullSelected){
      if(outdoor&&input.noiseRain==='yes'){
        full={status:'unable',note:'室外量測時天雨。',needsBackground:false};
      }else if(outdoor&&(!['yes','no'].includes(input.noiseRain)||wind===null)){
        full={status:'',progress:'室外量測條件尚待確認（是否天雨／風速）。',needsBackground:false};
      }else if(outdoor&&wind>5){
        full={status:'unable',note:'室外量測風速大於5 m/s。',needsBackground:false};
      }else if(target.id==='construction'||target.id==='renovation'){
        const leq=metric(input.noiseValueLeq,std.full,input.noiseBgFullMode,input.noiseBgFull);
        const lmaxValue=num(input.noiseValueLmax);
        const lmax=lmaxValue===null||std.lmax===undefined
          ?{status:'',progress:'Lmax或適用標準尚待確認。'}
          :{status:lmaxValue>std.lmax?'high':'notHigh',value:lmaxValue};
        full={status:combineStatuses([leq,lmax]),progress:leq.progress||lmax.progress||'',needsBackground:!!leq.needsBackground,leq,lmax};
      }else{
        full=metric(input.noiseValueFull,std.full,input.noiseBgFullMode,input.noiseBgFull);
      }
    }
    if(lowSelected)low=metric(input.noiseValueLow,std.low,input.noiseBgLowMode,input.noiseBgLow);
    return {zone,std,full,low};
  }
  function combineBand(zoneRows,band){
    if(!zoneRows.length)return {status:'',progress:'管制區尚待確認。',needsBackground:false};
    const rows=zoneRows.map(x=>x[band]);
    return {
      status:combineStatuses(rows),
      progress:rows.map(x=>x.progress).find(Boolean)||'',
      needsBackground:rows.some(x=>x.needsBackground),
      details:rows
    };
  }
  function measurementAssessment(input,target,zones){
    if(!timeValid(input.noiseTime)||!text(input.noiseDate)||!zones.length)return {full:{status:'',progress:'稽查日期、時間或管制區尚待確認。'},low:{status:'',progress:'稽查日期、時間或管制區尚待確認.'},rows:[]};
    const rows=zones.map(zone=>evaluateForZone(input,target,zone));
    return {rows,full:combineBand(rows,'full'),low:combineBand(rows,'low')};
  }
  function sourceEvidence(input,target){
    if(input.noiseTargetRunning!=='yes')return false;
    if(input.noiseMeasurementPlace==='boundary'&&input.noiseRain==='yes')return true;
    if(input.noiseMeasurementPlace==='boundary'&&num(input.noiseWind)!==null&&num(input.noiseWind)>5)return true;
    if(target.id==='construction'||target.id==='renovation'){
      if(num(input.noiseValueLeq)!==null&&num(input.noiseValueLmax)!==null)return true;
    }else if(num(input.noiseValueFull)!==null)return true;
    if(num(input.noiseValueLow)!==null)return true;
    return false;
  }
  function directA9TargetForA8(act){
    if(!act)return null;
    if(act.id==='construction')return rules.targets.construction;
    if(act.id==='outdoorSpeaker')return rules.targets.speaker;
    if(act.id==='commercialMachinery'||act.id==='vehicleBusiness')return rules.targets.business;
    return null;
  }
  function a8NeedsGeneralA9Facts(act){
    return !!act&&['karaoke','renovation'].includes(act.id);
  }
  function a8SharesArticle9Source(input,target,act){
    const linked=directA9TargetForA8(act);
    return !!linked&&!!target&&linked.id===target.id;
  }
  function a8CandidateActs(input,zones){
    if(!text(input.noiseDate)||!timeValid(input.noiseTime)||!zones.length)return [];
    const holiday=holidayState(input);
    if(!holiday)return [];
    return (root.NOISE_ARTICLE8_RULES?.acts||[]).filter(act=>{
      if(act.id==='exhaust')return false;
      return zones.some(zone=>!!core.actApplicable?.(act,zone,input.noiseTime,holiday));
    });
  }
  function applyA8CandidateFlags(out,input,zones){
    const candidates=a8CandidateActs(input,zones);
    out.noise522ShowA8Behavior=yes(candidates.length>0);
    for(const act of root.NOISE_ARTICLE8_RULES?.acts||[]){
      out['noise522A8Candidate_'+act.id]=yes(candidates.some(x=>x.id===act.id));
    }
    return candidates;
  }
  function a8State(input,zones,evidence,out,target){
    const candidates=a8CandidateActs(input,zones);
    if(!text(input.noiseDate)||!timeValid(input.noiseTime)||!zones.length){
      return {status:'pending',text:'第8條：待確認稽查日期、時間及音源／行為所在地噪音管制區後，再判斷是否需進行第8條現場行為查核。'};
    }
    if(!candidates.length)return {status:'none',text:'第8條：依目前日期、時間及噪音管制區，未形成公告禁止行為候選。'};
    if(!input.noiseBehavior)return {status:'behaviorPending',candidates,text:'第8條：目前時段及管制區存在公告禁止行為候選，請完成第8條現場行為查核。'};
    if(input.noiseBehavior==='none')return {status:'none',candidates,text:'第8條：已查核，現場無目前時段及管制區所列公告禁止行為。'};
    const actId=rules.article8Act(input);
    const act=candidates.find(x=>x.id===actId);
    if(!act)return {status:'none',candidates,text:'第8條：目前所選現場行為不屬本時段及管制區之公告禁止行為候選。'};
    const holiday=holidayState(input);
    const states=zones.map(zone=>!!core.actApplicable?.(act,zone,input.noiseTime,holiday));
    if(states.every(x=>!x))return {status:'notApplicable',act,text:'第8條：本案現場行為未落入目前日期、時間及管制區之公告禁止條件。'};
    if(states.some(Boolean)&&!states.every(Boolean))return {status:'pending',act,text:'第8條：交界兩區之公告適用結果不同，尚待依實際管制區事實確認。'};
    const hasExceptions=!!(act.hasExceptions||act.exceptionChecks?.length);
    if(!hasExceptions)return {status:'established',act,exception:{status:'none'},preMeasure:false,text:'第8條：公告禁止時段及禁止行為均已確認，且本項無公告例外條件；第8條禁止行為成立，不進入第9條量測。'};
    const relatedToA9=a8SharesArticle9Source(input,target,act);
    if(relatedToA9&&!evidence)return {status:'preserveFirst',act,preMeasure:true,text:'第8條：本項設有公告例外，且該禁止行為與本次第9條量測對象屬同一噪音來源／作業；為避免接觸查核對象後噪音狀態改變，請先保全第9條量測證據，再查核第8條例外事項。'};
    const ex=typeof core.evaluateA8Exceptions==='function'?core.evaluateA8Exceptions({...input,noiseHoliday:holiday},out,act):{status:'pending'};
    if(ex.status==='pending'){
      return {status:'exceptionPending',act,exception:ex,preMeasure:relatedToA9,text:relatedToA9
        ?'第8條：公告候選成立，量測證據已先行保全；例外事項尚待確認。'+(ex.summary||'')
        :'第8條：公告候選成立；本項行為與目前第9條量測對象不是同一噪音來源／作業，不因查核本項例外而先行量測。'+(ex.summary||'')};
    }
    if(ex.status==='exempt')return {status:'excluded',act,exception:ex,preMeasure:relatedToA9,text:relatedToA9
      ?'第8條：公告例外成立，本案第8條路徑排除；使用已保全之量測資料續依第9條研判。'
      :'第8條：公告例外成立，本案第8條路徑排除；如本案另有獨立第9條查核對象，再依該噪音來源進行量測。'};
    return {status:'established',act,exception:ex,preMeasure:relatedToA9,text:relatedToA9
      ?'第8條：公告禁止行為成立，作為本案主要處理路徑；先前保全之第9條量測資料留存，但不作為成立第8條之必要條件。'
      :'第8條：公告禁止行為成立；本項行為與目前第9條量測對象不是同一噪音來源／作業，不因本項第8條查核啟動量測。'};
  }
  function pointText(input,lowOnly){
    if(lowOnly)return '陳情人指定之住居所';
    return input.noiseMeasurementPlace==='boundary'?'周界外':input.noiseMeasurementPlace==='complainant'?'陳情人指定之住居所':'';
  }
  function backgroundClause(input,target,assessment){
    const parts=[];
    if(assessment.full?.needsBackground&&input.noiseBgFullMode==='measured'&&num(input.noiseBgFull)!==null){
      const raw=target.id==='construction'||target.id==='renovation'?num(input.noiseValueLeq):num(input.noiseValueFull);
      const bg=num(input.noiseBgFull);
      if(raw!==null){
        const diff=raw-bg;
        parts.push('另量測背景音量為'+fmt(bg)+'分貝，與主要量測值相差'+fmt(diff)+'dB'+(diff>=10?'以上，不需修正':diff>=3?'，已依規定進行背景音修正':'，差值小於3dB'));
      }
    }
    if(assessment.low?.needsBackground&&input.noiseBgLowMode==='measured'&&num(input.noiseBgLow)!==null){
      const raw=num(input.noiseValueLow),bg=num(input.noiseBgLow);
      if(raw!==null)parts.push('低頻背景音量為'+fmt(bg)+'分貝，差值'+fmt(raw-bg)+'dB');
    }
    return parts.join('；');
  }
  function draftA8(input,a8,zones){
    if(!a8?.act||a8.status!=='established'||!text(input.noiseSubject)||!rocDate(input.noiseDate)||!inspectionTime(input.noiseTime))return '';
    const zoneText=zones.length===1?zoneLabel(zones[0]):zones.map(zoneLabel).join('、');
    return '本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往所陳地點，經查該址為'+text(input.noiseSubject)+'，位處本府公告之'+zoneText+'噪音管制區，現場於公告禁止時段'+a8.act.label+'，已違反噪音管制法第8條暨本府現行公告相關規定，本局依法告發並令其立即停止改善。';
  }
  function draftA9(input,target,assessment,zones){
    if(!text(input.noiseSubject)||!rocDate(input.noiseDate)||!inspectionTime(input.noiseTime)||!zones.length)return '';
    const fullStatus=assessment.full?.status||'',lowStatus=assessment.low?.status||'';
    const statuses=[fullStatus,lowStatus].filter(Boolean);
    if(!statuses.length)return '';
    const source=sourceLabel(input)||targetLabel(target);
    const outdoor=input.noiseMeasurementPlace==='boundary';
    if(statuses.includes('unable')&&outdoor&&input.noiseRain==='yes'){
      return '本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時噪音源仍運轉中，惟現場天雨，不符室外噪音量測條件，本次無法進行有效噪音量測。';
    }
    if(statuses.includes('unable')&&outdoor&&num(input.noiseWind)!==null&&num(input.noiseWind)>5){
      return '本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時噪音源仍運轉中，惟現場風速為'+fmt(input.noiseWind)+'m/s，已逾噪音管制標準所定室外測量風速不得大於5m/s之測量條件，本次無法進行有效噪音量測。';
    }
    const parts=[];
    if(fullEntered(input,target)){
      if(target.id==='construction'||target.id==='renovation'){
        if(num(input.noiseValueLeq)!==null)parts.push('均能音量為'+fmt(input.noiseValueLeq)+'分貝');
        if(num(input.noiseValueLmax)!==null)parts.push('最大音量為'+fmt(input.noiseValueLmax)+'分貝');
      }else if(num(input.noiseValueFull)!==null)parts.push('全頻測定值為'+fmt(input.noiseValueFull)+'分貝');
    }
    if(lowEntered(input)&&num(input.noiseValueLow)!==null)parts.push('低頻測定值為'+fmt(input.noiseValueLow)+'分貝');
    const bg=backgroundClause(input,target,assessment);
    const location=pointText(input,lowEntered(input)&&!fullEntered(input,target));
    const rainText=input.noiseRain==='yes'?'天雨':input.noiseRain==='no'?'無雨':text(input.noiseWeatherText)?'天候'+text(input.noiseWeatherText):'';
    const weather=outdoor&&rainText?'量測時'+rainText+(num(input.noiseWind)!==null?'，風速為'+fmt(input.noiseWind)+'m/s，':'，'):'';
    const mixed=[];
    if(fullStatus)mixed.push('全頻測定結果'+statusLabels[fullStatus]);
    if(lowStatus)mixed.push('低頻測定結果'+statusLabels[lowStatus]);
    const result=mixed.join('；');
    const standard=standardDescription(input,target,assessment);
    let ending='';
    if(statuses.includes('high'))ending=(standard?'經比對'+standard+'，':'經比對本案適用之噪音管制標準，')+result+'，依噪音管制法第9條規定辦理限期改善，經限期改善仍未符合噪音管制標準者將依法告發。';
    else if(statuses.includes('unable'))ending=result+'。';
    else ending=(standard?'未超過'+standard:'經比對本案適用之噪音管制標準，'+result)+'。';
    return '本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時作業中，噪音源為'+source+'，'+weather+'於'+location+(text(input.noiseMeasurementPlaceDetail)?'（'+text(input.noiseMeasurementPlaceDetail)+'）':'')+'量測'+parts.join('、')+(bg?'，'+bg:'')+'，'+ending;
  }
  function replyA9(input,target,assessment,zones){
    if(!text(input.noiseSubject)||!rocDate(input.noiseDate)||!inspectionHour(input.noiseTime)||!zones.length)return '';
    const fullStatus=assessment.full?.status||'',lowStatus=assessment.low?.status||'';
    const statuses=[fullStatus,lowStatus].filter(Boolean);
    if(!statuses.length)return '';
    const source=sourceLabel(input)||targetLabel(target);
    const point=publicPointText(input);
    const parts=[];
    if(fullEntered(input,target)){
      if(target.id==='construction'||target.id==='renovation'){
        if(num(input.noiseValueLeq)!==null)parts.push('均能音量為'+fmt(input.noiseValueLeq)+'分貝');
        if(num(input.noiseValueLmax)!==null)parts.push('最大音量為'+fmt(input.noiseValueLmax)+'分貝');
      }else if(num(input.noiseValueFull)!==null)parts.push('全頻測定值為'+fmt(input.noiseValueFull)+'分貝');
    }
    if(lowEntered(input)&&num(input.noiseValueLow)!==null)parts.push('低頻測定值為'+fmt(input.noiseValueLow)+'分貝');
    const lead='本局於'+rocDate(input.noiseDate)+inspectionHour(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時作業中，噪音源為'+source+'，'+(point?'於'+point:'於現場')+'量測'+parts.join('、')+'，';
    if(statuses.includes('unable')){
      if(input.noiseMeasurementPlace==='boundary'&&input.noiseRain==='yes'){
        return '本局於'+rocDate(input.noiseDate)+inspectionHour(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時噪音源仍運轉中，惟現場天雨，不符室外量測條件，本次無法完成有效噪音量測。';
      }
      if(input.noiseMeasurementPlace==='boundary'&&num(input.noiseWind)!==null&&num(input.noiseWind)>5){
        return '本局於'+rocDate(input.noiseDate)+inspectionHour(input.noiseTime)+'派員前往稽查，經查該址為'+text(input.noiseSubject)+'，稽查時噪音源仍運轉中，惟現場風速為'+fmt(input.noiseWind)+'m/s，已逾室外量測條件，本次無法完成有效噪音量測。';
      }
      return lead+'本次量測因背景音量等測量條件影響，無法完成有效判定，本局將視實際情形持續辦理後續查處。';
    }
    const standard=standardDescription(input,target,assessment);
    if(statuses.every(x=>x==='notHigh')){
      return lead+'未超過'+(standard||'本案適用之噪音管制標準')+'，本局仍勸導業者降低音量並注意作業時段及加強噪音防護措施以免擾鄰，爾後將不定期派員前往稽查，倘發現有違反法令，將依法告發，以維護環境品質。';
    }
    const mixed=[];
    if(fullStatus)mixed.push('全頻'+statusLabels[fullStatus]);
    if(lowStatus)mixed.push('低頻'+statusLabels[lowStatus]);
    return lead+'經比對'+(standard||'本案適用之噪音管制標準')+'，'+mixed.join('；')+'，本局將依噪音管制法相關規定辦理後續改善及查處。';
  }
  function pendingItems(input,target,zone,assessment,a8){
    const items=[];
    if(!text(input.noiseDate))items.push('稽查日期');
    if(!timeValid(input.noiseTime))items.push('稽查時間');
    if(zone.status==='pending')items.push('噪音管制區');
    if(!text(input.noiseSubject))items.push('查核對象／場所／工程名稱');
    if(input.noiseTargetRunning==='yes'){
      const full=fullEntered(input,target),low=lowEntered(input);
      if(!full&&!low&&['none','notApplicable','noDisturbance','preserveFirst','exceptionPending','excluded'].includes(a8?.status))items.push('量測結果尚未輸入');
      if(full){
        if(!input.noiseMeasurementPlace)items.push('量測地點');
        if(input.noiseMeasurementPlace==='boundary'&&((!['yes','no'].includes(input.noiseRain)&&!text(input.noiseWeatherText))||num(input.noiseWind)===null))items.push('是否天雨／風速');
        if(!assessment.full?.status&&assessment.full?.progress)items.push('全頻判定所需資料');
      }
      if(low&&!assessment.low?.status&&assessment.low?.progress)items.push('低頻判定所需資料');
      if(a8?.status==='behaviorPending')items.push('第8條現場行為查核');
      if(a8?.status==='disturbancePending')items.push('第8條妨害安寧事實');
    }
    if(a8?.status==='exceptionPending')items.push('第8條例外事項');
    return [...new Set(items)];
  }
  function resultSummary(assessment){
    const lines=[];
    if(assessment.full?.status)lines.push('全頻：'+statusLabels[assessment.full.status]);
    else if(assessment.full?.progress)lines.push('全頻：'+assessment.full.progress);
    if(assessment.low?.status)lines.push('低頻：'+statusLabels[assessment.low.status]);
    else if(assessment.low?.progress)lines.push('低頻：'+assessment.low.progress);
    return lines.join('\n');
  }
  function seed(input){
    return {...input,
      noise522Never:'no',
      noise522ShowSite:'yes',noise522ShowContinuity:'no',noise522ShowMeasurability:'no',noise522ShowPlace:'no',
      noise522ShowSource:'no',noise522ShowEquipment:'no',noise522ShowSourceOther:'no',noise522ShowTargetChoice:'no',noise522ShowTargetManual:'no',
      noise522ShowRunning:'no',noise522ShowMeasurement:'no',noise522ShowFull:'no',noise522ShowSingleFull:'no',noise522ShowConstructionFull:'no',noise522ShowLow:'no',
      noise522ShowMeasurementPlace:'no',noise522ShowWeather:'no',noise522ShowConcurrentFacts:'no',noise522ShowA8Zone:'yes',noise522ShowA9Zone:'no',noise522ShowA9DirectZone:'no',
      noise522ShowA9BoundaryKind:'no',noise522ShowA9RoadFacts:'no',noise522ShowA9BoundaryPair:'no',noise522ShowA8Behavior:'no',noise522ShowA8Disturbance:'no',noise522ShowLowInput:'no',
      noise522A9ZoneText:'',
      ...Object.fromEntries((root.NOISE_ARTICLE8_RULES?.acts||[]).map(act=>['noise522A8Candidate_'+act.id,'no'])),
      ...Object.fromEntries(Object.values(rules.targets||{}).map(target=>['noise522TargetCandidate_'+target.id,'no'])),
      noise522TargetText:'',noise522FactSummary:'',noise522Article8Text:'',noise522Article9Text:'',noise522PendingText:'',
      noiseMeasureResultFull:'',noiseMeasureResultLow:'',noiseRouteText:'',noiseGuide:'',noiseValidation:'',noiseRecord:'',noiseReply:'',
      noiseBlocked:'yes',noiseOutcomeId:'',noiseShowA8Exception:'no',noiseShowGeneralMethod:'no',noiseShowSpeakerMode:'no',noiseShowBgFull:'no',noiseShowBgLow:'no',
      noiseShowBgLmax:'no',noiseShowConstructionLmax:'no',noiseShowFullPoint:'no',noiseShowSpeakerLocation:'no',noiseShowWeather:'no'
    };
  }
  function setStage(out,route,guide,validation){
    out.noiseRouteText=route;out.noiseGuide=guide;out.noiseValidation=validation||guide;out.noiseBlocked='yes';return out;
  }
  function finishA8Only(input,out,a8Zone,a8){
    out.noise522ShowConcurrentFacts='yes';
    out.noise522Article8Text=a8.text||'';
    out.noise522Article9Text='第9條：本次查核聲音依目前第8條行為事實處理，不因所在場所本身另行建立第9條量測路徑。';
    out.noise522PendingText='待查／待補：無。';
    out.noise522FactSummary='第8條現場行為：'+(a8.act?.label||'已查核')+'。';
    if(a8.status==='established'){
      out.noiseRouteText='第8條公告禁止行為成立';
      out.noiseGuide=a8.text;
      out.noiseRecord=draftA8(input,a8,zone.zones);
      out.noiseReply='';
      out.noiseBlocked=out.noiseRecord?'no':'yes';
      out.noiseValidation=out.noiseRecord?'':'第8條已成立，請補填查核對象／場所／工程名稱後產生正式草稿。';
      out.noiseOutcomeId='article8.established';
      return out;
    }
    if(a8.status==='excluded'){
      out.noiseRouteText='第8條例外成立';
      out.noiseGuide=a8.text+'\n本次查核之同一聲音不另因場所身分自動轉入第9條量測。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noiseOutcomeId='article8.excluded';
      out.noiseResultText='第8條公告例外成立；本次第8條聲音查核完成。';
      return out;
    }
    if(a8.status==='noDisturbance'||a8.status==='notApplicable'){
      out.noiseRouteText='第8條未成立';
      out.noiseGuide=a8.text+'\n本次查核之同一聲音未形成直接第9條量測路徑。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noiseOutcomeId='article8.not-established';
      out.noiseResultText='本次第8條聲音查核未成立。';
      return out;
    }
    return out;
  }

  function finishNoArticle9(input,out,a8){
    out.noise522ShowConcurrentFacts='yes';
    out.noise522TargetText='未形成第9條管制對象';
    out.noise522Article8Text=a8?.text||out.noise522Article8Text||'';
    out.noise522Article9Text='第9條：依本次查核聲音之場所、音源及公告項目事實，未形成第9條量測對象。';
    out.noise522PendingText='待查／待補：無。';
    out.noiseRouteText='未形成第9條管制對象';
    out.noiseGuide=(out.noise522Article8Text?out.noise522Article8Text+'\n':'')+out.noise522Article9Text;
    out.noiseValidation='';
    out.noiseBlocked='no';
    out.noiseOutcomeId='noise.no-article9-route';
    out.noiseResultText='依目前查得事實，本次聲音未形成第9條量測路徑。';
    return out;
  }

  function prepareMeasurementForTarget(input,out,target,a8,implicitRunning=false){
    const measureInput=implicitRunning?{...input,noiseTargetRunning:'yes'}:input;
    out.noise522ShowConcurrentFacts='yes';
    out.noise522TargetText=target.label;
    out.noise522Article8Text=a8?.text||'';
    const measurementAllowed=['none','notApplicable','noDisturbance','preserveFirst','exceptionPending','excluded'].includes(a8?.status||'none');
    out.noise522ShowMeasurement=yes(measurementAllowed);
    out.noise522ShowSingleFull=yes(measurementAllowed&&target.id!=='construction'&&target.id!=='renovation');
    out.noise522ShowConstructionFull=yes(measurementAllowed&&(target.id==='construction'||target.id==='renovation'));
    out.noise522ShowLowInput=yes(measurementAllowed);
    out.noise522ShowMeasurementPlace=yes(measurementAllowed);
    out.noise522ShowWeather='no';

    const fullSelected=fullEntered(input,target),lowSelected=lowEntered(input);
    out.noise522ShowFull=yes(fullSelected);
    out.noise522ShowLow=yes(lowSelected);

    const factParts=[];
    if(placeLabel(input))factParts.push('場所：'+placeLabel(input));
    if(sourceLabel(input))factParts.push('主要音源：'+sourceLabel(input));
    factParts.push('查核對象：'+target.label);
    factParts.push('運轉／發生：是');
    if(a8?.act)factParts.push('第8條行為：'+a8.act.label);
    if(text(input.noiseMeasurementPlaceDetail))factParts.push('位置描述：'+text(input.noiseMeasurementPlaceDetail));
    out.noise522FactSummary=factParts.join('\n');

    if(measurementAllowed&&!input.noiseMeasurementPlace){
      out.noiseRouteText=a8?.status==='preserveFirst'?'第8條例外前量測證據保全':'第9條現場量測';
      out.noiseGuide=a8?.status==='preserveFirst'
        ?a8.text
        :'已形成第9條查核對象：'+target.label+'。請先確認實際量測地點；第9條適用管制區將依量測位置另行判定，不沿用第8條音源所在地管制區。';
      out.noiseValidation='請確認量測地點。';
      out.noise522Article9Text='第9條：已進入量測階段，量測地點及適用管制區尚待確認。';
      return out;
    }

    out.noise522ShowA9Zone=yes(measurementAllowed&&!!input.noiseMeasurementPlace);
    out.noise522ShowA9BoundaryKind=yes(measurementAllowed&&input.noiseA9BoundaryInvolved==='yes');
    out.noise522ShowA9RoadFacts=yes(measurementAllowed&&input.noiseA9BoundaryInvolved==='yes'&&input.noiseA9BoundaryKind==='road');
    out.noise522ShowA9BoundaryPair=yes(measurementAllowed&&input.noiseA9BoundaryInvolved==='yes'&&input.noiseA9BoundaryKind==='zoneBoundary');
    out.noise522ShowA9DirectZone=yes(measurementAllowed&&input.noiseA9BoundaryInvolved==='no');

    if(measurementAllowed&&!['yes','no'].includes(input.noiseA9BoundaryInvolved)){
      out.noiseRouteText='第9條量測適用管制區';
      out.noiseGuide='量測地點已確認；請判斷該量測位置是否涉及道路或不同噪音管制區交界。';
      out.noiseValidation='請確認量測位置是否涉及道路或不同噪音管制區交界。';
      out.noise522Article9Text='第9條：量測適用管制區尚待確認。';
      return out;
    }
    const zone=a9ZoneState(input);
    out.noise522A9ZoneText=zoneResultText(zone);
    if(measurementAllowed&&zone.status==='pending'){
      out.noiseRouteText='第9條量測適用管制區';
      out.noiseGuide=zone.message||'請完成第9條量測適用管制區判定。';
      out.noiseValidation=zone.message||'第9條量測適用管制區尚待確認。';
      out.noise522Article9Text='第9條：'+(zone.message||'量測適用管制區尚待確認。');
      return out;
    }
    out.noise522ShowWeather=yes(measurementAllowed&&input.noiseMeasurementPlace==='boundary');

    const forwarded={...zone.mapped,
      noiseNature:'measurable',noiseSpecial:'ordinary',noiseA8Act:'none',noiseA8Disturbance:'',
      noiseA9Type:target.a9Type,noiseFacility:target.facilityId||rules.announcedFacility(input),
      noiseMeasureDecision:'yes',noiseSubject:input.noiseSubject||'',
      noiseSource:sourceLabel(input)||target.label,noiseOperation:text(input.noiseObservation)||'作業中',
      noiseFullPoint:input.noiseMeasurementPlace==='boundary'?'authority':input.noiseMeasurementPlace==='complainant'?'complainant':'',
      noiseSpeakerOutdoor:input.noiseMeasurementPlace==='boundary'?'yes':input.noiseMeasurementPlace==='complainant'?'no':'',
      noiseHoliday:holidayState(input)
    };
    if((target.id==='factory'||target.id==='entertainment'||target.id==='business'||target.id==='otherFacility')&&!selected(input.noiseGeneralSpecialAssessment,'periodic'))forwarded.noiseGeneralMethod='leq';
    if(target.id==='construction'||target.id==='renovation'){
      forwarded.noiseBgLmaxMode='uncooperative';
      forwarded.noiseBgLmax='';
    }

    let legacy=null;
    if(text(input.noiseDate)&&timeValid(input.noiseTime)&&zone.status!=='pending'){
      try{legacy=core.prepare(forwarded);}catch(_){legacy=null;}
    }
    if(legacy){
      const preserve=['noiseShowGeneralBg10','noiseShowGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText'];
      preserve.forEach(k=>{if(legacy[k]!==undefined)out[k]=legacy[k];});
    }
    out.noiseShowGeneralMethod=yes(measurementAllowed&&['factory','entertainment','business','otherFacility'].includes(target.id));
    out.noiseShowSpeakerMode=yes(measurementAllowed&&target.id==='speaker');
    out.noiseShowConstructionLmax='no';

    const assessment=measurementAssessment(input,target,zone.zones);
    out.noiseMeasureResultFull=fullSelected&&assessment.full.status?statusLabels[assessment.full.status]:'';
    out.noiseMeasureResultLow=lowSelected&&assessment.low.status?statusLabels[assessment.low.status]:'';
    out.noiseShowBgFull=yes(fullSelected&&assessment.full.needsBackground);
    out.noiseShowBgLow=yes(lowSelected&&assessment.low.needsBackground);
    out.noise522Article9Text='第9條：'+(resultSummary(assessment)||'量測結果尚未輸入；實際未量測之項目可留白。');

    const pending=pendingItems(measureInput,target,zone,assessment,a8||{status:'none'});
    out.noise522PendingText=pending.length?'待查／待補：'+pending.join('、'):'待查／待補：無。';
    out.noiseResultText=resultSummary(assessment)||'量測結果尚未輸入；實際未量測之項目可留白。';

    const a9Draft=draftA9(input,target,assessment,zone.zones);
    const a9Reply=replyA9(input,target,assessment,zone.zones);
    if(a8?.status==='exceptionPending'){
      out.noiseRouteText='第8條例外事項待查';
      out.noiseGuide=a8.text+'\n第9條量測資料已保留，不因第8條待查而清除。';
      out.noiseValidation='請完成第8條例外事項查核。';
      out.noiseRecord='';out.noiseReply='';out.noiseBlocked='yes';
      return out;
    }

    out.noiseRouteText=a8?.status==='excluded'?'第8條例外排除 → 第9條研判':'第9條量測研判';
    out.noiseGuide=(a8?.text?a8.text+'\n':'')+out.noise522Article9Text;
    const selectedStatuses=[fullSelected?assessment.full.status:'',lowSelected?assessment.low.status:''].filter(Boolean);
    const allSelectedFinal=(!fullSelected||!!assessment.full.status)&&(!lowSelected||!!assessment.low.status);
    if(allSelectedFinal&&selectedStatuses.length){
      out.noiseRecord=a9Draft;
      out.noiseReply=a9Reply;
      out.noiseBlocked=a9Draft?'no':'yes';
      out.noiseValidation=a9Draft?'':'量測判定已完成，請補齊正式草稿所需之日期、時間、管制區及查核對象名稱。';
      if(selectedStatuses.includes('high'))out.noiseOutcomeId='article9.exceeded';
      else if(selectedStatuses.includes('unable'))out.noiseOutcomeId='article9.unable';
      else out.noiseOutcomeId='article9.compliant';
    }else{
      out.noiseBlocked='yes';
      out.noiseValidation=!fullSelected&&!lowSelected?'量測結果尚未輸入；請填入本次實際完成之量測值，未量測項目可留白。':(assessment.full.progress||assessment.low.progress||zone.message||'量測／法規研判資料尚待完成。');
    }
    return out;
  }

  function prepareGeneralArticle9(input,out,a8){
    out.noise522ShowContinuity='yes';
    out.noise522ShowMeasurability='yes';
    const continuity=tri(input.noiseContinuity),measurability=tri(input.noiseMeasurability);
    if(continuity==='no'||measurability==='no'){
      out.noiseRouteText='第6條型態／警察機關處理方向';
      out.noiseGuide='本案未形成第8條處理路徑，且聲音不具持續性或不易進行有效量測，不進入環保局一般第9條量測主流程；依噪音管制法第6條型態及權責方向處理。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noise522Article8Text=a8?.text||'';
      out.noise522FactSummary='第6條前置分流：'+(continuity==='no'?'不具持續性':'')+((continuity==='no'&&measurability==='no')?'；':'')+(measurability==='no'?'不易有效量測':'')+'。';
      return out;
    }
    if(continuity!=='yes'||measurability!=='yes'){
      return setStage(out,'第6條前置分流','第8條未形成處理路徑；請確認這個聲音是否具有持續性，以及是否容易進行有效量測。','請完成第6條前置分流兩項事實。');
    }

    out.noise522ShowPlace='yes';
    if(!input.noisePlaceType)return setStage(out,'場所／工程屬性','第8條分流完成；請依本次同一聲音之實際場所／工程法律性質選擇。','請確認場所／工程屬性。');
    if(input.noisePlaceType==='pending')return setStage(out,'場所／工程屬性尚待確認','場所／工程屬性尚待確認；系統不先推定第9條查核對象。','場所／工程屬性尚待確認。');

    out.noise522ShowSource='yes';
    if(!input.noiseSourceCategory)return setStage(out,'主要噪音來源','請確認本次同一聲音的主要噪音來源；場所、音源與現場行為分開記錄。','請確認主要噪音來源。');
    const needsAnnouncement=input.noisePlaceType==='nonListed'&&['equipment','speaker','other'].includes(input.noiseSourceCategory);
    out.noise522ShowEquipment=yes(needsAnnouncement);
    out.noise522ShowSourceOther=yes(input.noiseSourceCategory==='other');
    if(needsAnnouncement&&!input.noiseEquipmentType){
      return setStage(out,'其他經主管機關公告之場所、工程及設施','本案不屬工廠（場）、娛樂場所、營業場所或營建工程；請直接核對本府第9條第1項第6款公告內容。','請確認是否屬公告之場所、工程及設施。');
    }
    if(needsAnnouncement&&input.noiseEquipmentType==='pending')return setStage(out,'公告項目尚待確認','目前尚無法確認是否屬主管機關公告之場所、工程及設施；系統不先推定第9條適用。','公告項目尚待確認。');
    if(input.noiseSourceCategory==='pending')return setStage(out,'主要噪音來源尚待確認','主要音源尚待確認；系統不以「尚待確認」推定任何第9條查核對象。','主要噪音來源尚待確認。');

    if(input.noiseSourceCategory==='vehicle')return finishNoArticle9(input,out,a8);
    const announcedItem=typeof rules.announcedItem==='function'?rules.announcedItem(input):null;
    if(input.noisePlaceType==='nonListed'&&announcedItem?.kind==='none'&&input.noiseSourceCategory!=='speaker')return finishNoArticle9(input,out,a8);

    const candidates=rules.targetCandidates(input);
    let target=rules.target(input);
    for(const row of Object.values(rules.targets||{}))out['noise522TargetCandidate_'+row.id]=yes(candidates.some(x=>x.id===row.id));
    out.noise522ShowTargetChoice=yes(candidates.length>1);
    out.noise522ShowTargetManual=yes(candidates.length===0&&input.noisePlaceType!=='nonListed');
    if(candidates.length>1&&!target)return setStage(out,'選擇查核對象','本次同一聲音存在不同合法第9條查核路徑，請依陳情對象及現場實際情況選擇。','請選擇本次查核對象。');
    if(!candidates.length&&input.noiseTargetManual)target=rules.targets[input.noiseTargetManual]||null;
    if(!target)return setStage(out,'形成查核對象','依目前場所與音源事實尚無法唯一形成第9條查核對象；系統不自行猜測。','查核對象尚待確認。');

    out.noise522TargetText=target.label;
    out.noise522ShowRunning='yes';
    if(!['yes','no'].includes(input.noiseTargetRunning))return setStage(out,'查核對象是否正在運轉／發生','第9條查核對象已形成：'+target.label+'。請確認目前是否正在運轉／發生。','請確認查核對象是否正在運轉／發生。');
    if(input.noiseTargetRunning==='no'){
      out.noiseRouteText='到場時未運轉／未發生';
      out.noiseGuide='已記錄到場時第9條查核對象未運轉／未發生；此事實不得推論為聲音不具持續性。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noise522Article8Text=a8?.text||'';
      out.noise522FactSummary='查核對象：'+target.label+'；到場時未運轉／未發生。';
      if(text(input.noiseSubject)&&rocDate(input.noiseDate)&&inspectionTime(input.noiseTime)){
        out.noiseRecord='本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往所陳地點，經查該址為'+text(input.noiseSubject)+'，到場時查核對象未運轉／未發生，本次未進行噪音量測。';
      }
      return out;
    }
    return prepareMeasurementForTarget(input,out,target,a8||{status:'none',text:''},false);
  }

  function prepare(raw={}){
    const input={...raw};
    let out=seed(input);

    // 1. Article 8 uses the noise-source / prohibited-act location zone.
    out.noise522ShowA8Zone='yes';
    if(!text(input.noiseDate)||!timeValid(input.noiseTime)){
      return setStage(out,'案件基本資料','先完成稽查日期與24小時制稽查時間，系統才能依當時時段篩選第8條公告禁止行為。','請完成稽查日期與稽查時間。');
    }
    const a8Zone=a8ZoneState(input);
    if(a8Zone.status==='pending'){
      return setStage(out,'第8條音源所在地管制區',a8Zone.message,a8Zone.message);
    }

    // 2. Article 8 is the first legal fork.
    const candidates=applyA8CandidateFlags(out,input,a8Zone.zones);
    if(candidates.length&&!input.noiseBehavior){
      out.noise522ShowConcurrentFacts='yes';
      out.noise522Article8Text='第8條：目前日期、時間及管制區存在公告禁止行為候選，請先完成現場行為查核。';
      return setStage(out,'第8條現場行為查核','先判斷現場是否有目前時段可能適用的第8條公告禁止行為；沒有再進入第6條／第9條一般流程。','請完成第8條現場行為查核。');
    }

    if(candidates.length&&input.noiseBehavior&&input.noiseBehavior!=='none'){
      const actId=rules.article8Act(input);
      const act=candidates.find(x=>x.id===actId)||null;
      const directTarget=directA9TargetForA8(act);
      const evidence=directTarget?sourceEvidence({...input,noiseTargetRunning:'yes'},directTarget):true;
      const a8=a8State(input,a8Zone.zones,evidence,out,directTarget);
      out.noise522ShowConcurrentFacts='yes';
      out.noise522Article8Text=a8.text||'';

      if(a8.status==='behaviorPending')return setStage(out,'第8條現場行為待查',a8.text,'請完成第8條現場行為查核。');
      if(a8.status==='pending')return setStage(out,'第8條適用事實待確認',a8.text,zone.message||'第8條適用事實尚待確認。');
      if(a8.status==='established')return finishA8Only(input,out,a8Zone,a8);

      if(a8.status==='preserveFirst'){
        // The selected Article 8 act itself is definitively the same Article 9 noise source.
        return prepareMeasurementForTarget(input,out,directTarget,a8,true);
      }
      if(a8.status==='exceptionPending'){
        if(a8.preMeasure&&directTarget)return prepareMeasurementForTarget(input,out,directTarget,a8,true);
        out.noiseRouteText='第8條例外事項待查';
        out.noiseGuide=a8.text;
        out.noiseValidation='請完成第8條例外事項查核。';
        out.noiseBlocked='yes';
        out.noise522PendingText='待查／待補：第8條例外事項。';
        return out;
      }
      if(a8.status==='excluded'){
        if(directTarget)return prepareMeasurementForTarget(input,out,directTarget,a8,true);
        if(a8NeedsGeneralA9Facts(act))return prepareGeneralArticle9(input,out,a8);
        return finishA8Only(input,out,a8Zone,a8);
      }
      if(a8.status==='noDisturbance'||a8.status==='notApplicable'){
        if(directTarget)return prepareMeasurementForTarget(input,out,directTarget,a8,true);
        if(a8NeedsGeneralA9Facts(act))return prepareGeneralArticle9(input,out,a8);
        return finishA8Only(input,out,a8Zone,a8);
      }
      return finishA8Only(input,out,a8Zone,a8);
    }

    // 3. No Article 8 act: only now enter Article 6 / Article 9 general path.
    const a8=candidates.length
      ?{status:'none',text:'第8條：已查核，現場無目前時段及管制區所列公告禁止行為。'}
      :{status:'none',text:'第8條：依目前日期、時間及噪音管制區，未形成公告禁止行為候選。'};
    out.noise522Article8Text=a8.text;
    return prepareGeneralArticle9(input,out,a8);
  }

  function resetChange(before={},after={}){
    const next={...after};
    const clear=keys=>keys.forEach(k=>{next[k]='';});
    if(before.noiseBehavior!==after.noiseBehavior){
      const exceptionKeys=[];
      for(const act of root.NOISE_ARTICLE8_RULES?.acts||[]){
        for(const check of act.exceptionChecks||[])exceptionKeys.push(a8ExceptionValue(act.id,check.id));
        for(const ex of act.exceptions||[]){
          exceptionKeys.push(a8ExceptionValue(act.id,ex.id));
          for(const check of ex.checks||[])exceptionKeys.push(a8ExceptionValue(act.id,ex.id,check.id));
        }
      }
      clear(['noiseA8Disturbance',...exceptionKeys,'noiseContinuity','noiseMeasurability','noisePlaceType','noiseSourceCategory','noiseEquipmentType','noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseMeasurementPlace','noiseMeasurementPlaceDetail','noiseRain','noiseWind','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseContinuity!==after.noiseContinuity||before.noiseMeasurability!==after.noiseMeasurability){
      if(after.noiseContinuity!=='yes'||after.noiseMeasurability!=='yes')clear(['noisePlaceType','noiseSourceCategory','noiseEquipmentType','noiseTargetChoice','noiseTargetManual','noiseTargetRunning']);
    }
    if(before.noisePlaceType!==after.noisePlaceType){
      clear(['noiseEquipmentType','noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseSourceCategory!==after.noiseSourceCategory||before.noiseEquipmentType!==after.noiseEquipmentType){
      clear(['noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseTargetChoice!==after.noiseTargetChoice||before.noiseTargetManual!==after.noiseTargetManual){
      clear(['noiseTargetRunning','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseTargetRunning!==after.noiseTargetRunning&&after.noiseTargetRunning!=='yes'){
      clear(['noiseMeasureBands','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseDate!==after.noiseDate||before.noiseTime!==after.noiseTime||before.noiseDirectZone!==after.noiseDirectZone||
       before.noiseBoundaryInvolved!==after.noiseBoundaryInvolved||before.noiseBoundaryKind!==after.noiseBoundaryKind||
       before.noiseBoundaryZonePair!==after.noiseBoundaryZonePair||before.noiseRoadWidth!==after.noiseRoadWidth||
       before.noiseRoadSideAZone!==after.noiseRoadSideAZone||before.noiseRoadSideBZone!==after.noiseRoadSideBZone||
       before.noiseRoadSourceSide!==after.noiseRoadSourceSide||before.noiseRoadPointSide!==after.noiseRoadPointSide||
       before.noiseBoundaryDistance!==after.noiseBoundaryDistance||before.noiseRoadOriginalFourth!==after.noiseRoadOriginalFourth||
       before.noiseRoadAdjacentFirst!==after.noiseRoadAdjacentFirst||before.noiseZoneLegalOverride!==after.noiseZoneLegalOverride){
      clear(['noiseBehavior']);
    }
    if(before.noiseMeasurementPlace!==after.noiseMeasurementPlace)clear(['noiseWind','noiseRain']);
    if(selected(before.noiseGeneralSpecialAssessment,'periodic')&&!selected(after.noiseGeneralSpecialAssessment,'periodic')){
      clear(['noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText']);
    }
    return next;
  }
  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}

  root.NoiseMain={...core,prepare,resetChange,validate,__refactor522Wrapped:true};
  root.TemplateWorkflows.noiseMain={...root.TemplateWorkflows.noiseMain,prepare,resetChange,validate};

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noiseRefactor522=config=>{
    const t=config?.templates?.find(x=>x.id==='noise-main');
    if(!t||t.__refactor522Patched)return;
    const missing='（尚未確認）';
    const field=(id,label,type,extra={})=>({id,label,type,missing,...extra});
    const computed=(id,label,display=false,displayWhen=null)=>({id,label,type:'computed',missing,display,...(displayWhen?{displayWhen}:{})});
    const select=(id,label,options,displayWhen,extra={})=>field(id,label,'select',{allowCustom:false,options:options.map(x=>({
      id:x.id||x[0],label:x.label||x[1],value:x.label||x[1],
      ...(x.when?{when:x.when}:{}),...(x.disabled?{disabled:true}:{})
    })),...(displayWhen?{displayWhen}:{}),...extra});
    const checklist=(id,label,items,displayWhen,extra={})=>field(id,label,'checklist',{items:items.map(x=>({id:x.id||x[0],label:x.label||x[1],value:x.label||x[1]})),separator:'、',emptyValue:'',...(displayWhen?{displayWhen}:{}),...extra});
    const show=id=>({field:id,value:'yes'});
    const ynu=[['yes','是'],['no','否'],['unknown','尚無法確認']];
    const yn=[['yes','是'],['no','否']];
    const zones=[['1','第1類'],['2','第2類'],['3','第3類'],['4','第4類']];

    const oldInteractive=new Set([
      'noiseSpecial','noiseVehicleExhaustA8','noiseZoneMode','noiseZone','noiseHoliday','noiseA8Act','noiseA8Disturbance','noiseNature','noiseA6Disturbance',
      'noiseA9Type','noiseFacility','noiseFullPoint','noiseSpeakerOutdoor','noiseBgLmaxMode','noiseBgLmax','noiseQuickDecisionText','noiseMeasureBands','noiseA8Disturbance'
    ]);
    for(const f of t.fields||[])if(oldInteractive.has(f.id))f.displayWhen=hidden;

    const sourceField=t.fields.find(f=>f.id==='noiseSource');if(sourceField)sourceField.displayWhen=hidden;
    const generalValue=t.fields.find(f=>f.id==='noiseValueFull');if(generalValue){generalValue.label='測定均能音量（dB）';generalValue.displayWhen=show('noise522ShowSingleFull');}
    const leq=t.fields.find(f=>f.id==='noiseValueLeq');if(leq){leq.label='測定均能音量（dB）';leq.displayWhen=show('noise522ShowConstructionFull');}
    const lmax=t.fields.find(f=>f.id==='noiseValueLmax');if(lmax){lmax.label='測定最大音量（dB）';lmax.displayWhen=show('noise522ShowConstructionFull');}
    const low=t.fields.find(f=>f.id==='noiseValueLow');if(low){low.label='測定低頻音量（dB）';low.displayWhen=show('noise522ShowLowInput');}
    const wind=t.fields.find(f=>f.id==='noiseWind');if(wind){wind.displayWhen=show('noise522ShowWeather');wind.help='室外量測時填寫實測風速；系統將依量測條件判斷是否可有效量測。';}
    const bgFullMode=t.fields.find(f=>f.id==='noiseBgFullMode');if(bgFullMode)bgFullMode.displayWhen=show('noiseShowBgFull');
    const bgLowMode=t.fields.find(f=>f.id==='noiseBgLowMode');if(bgLowMode)bgLowMode.displayWhen=show('noiseShowBgLow');

    const flags=[
      'noise522Never','noise522ShowSite','noise522ShowContinuity','noise522ShowMeasurability','noise522ShowPlace','noise522ShowSource',
      'noise522ShowEquipment','noise522ShowSourceOther','noise522ShowTargetChoice','noise522ShowTargetManual','noise522ShowRunning','noise522ShowMeasurement',
      'noise522ShowFull','noise522ShowSingleFull','noise522ShowConstructionFull','noise522ShowLow','noise522ShowMeasurementPlace','noise522ShowWeather','noise522ShowConcurrentFacts',
      'noise522ShowZoneSimple','noise522ShowBoundaryKind','noise522ShowRoadFacts','noise522ShowBoundaryPair','noise522ShowA8Behavior','noise522ShowA8Disturbance','noise522ShowLowInput',
      ...(root.NOISE_ARTICLE8_RULES?.acts||[]).map(act=>'noise522A8Candidate_'+act.id),
      ...Object.values(rules.targets||{}).map(target=>'noise522TargetCandidate_'+target.id)
    ].map(id=>computed(id,id));
    const optionsTargets=Object.values(rules.targets).map(x=>({id:x.id,label:x.label,when:{field:'noise522TargetCandidate_'+x.id,value:'yes'}}));
    const optionsTargetsAll=Object.values(rules.targets).map(x=>({id:x.id,label:x.label}));
    const announcedEquipment=rules.announcedItems||rules.equipment;
    const a8BehaviorOptions=rules.behaviors.filter(x=>x.article8Act||x.id==='none').map(x=>({
      ...x,
      ...(x.article8Act?{when:{field:'noise522A8Candidate_'+x.article8Act,value:'yes'}}:{})
    }));
    const newFields=[
      ...flags,
      field('noiseSubject','查核對象／場所／工程名稱','text',{help:'例如：○○工廠、○○餐廳、○○集合住宅新建工程。'}),
      field('noiseDate','稽查日期','date',{format:'roc'}),
      field('noiseTime','稽查時間（24小時制）','time',{timePicker:{empty:'—',hour:'時',minute:'分'},help:'使用 00～23 時的24小時制，例如 05:30、10:36、19:20、23:45。'}),
      select('noiseDirectZone','噪音管制區',[['1','第1類'],['2','第2類'],['3','第3類'],['4','第4類'],['pending','尚待確認']],show('noise522ShowSite'),{help:'先確認所在地噪音管制區；如涉及道路或不同管制區交界，下一題再進一步確認。'}),
      select('noiseBoundaryInvolved','本案位置是否涉及道路或不同噪音管制區交界？',yn,show('noise522ShowSite'),{help:'此項先用於確認第8條及後續第9條適用管制區。'}),
      select('noiseBoundaryKind','道路／交界類型',[['road','道路'],['zoneBoundary','不同噪音管制區交界']],show('noise522ShowBoundaryKind')),
      field('noiseRoadName','道路名稱','text',{displayWhen:show('noise522ShowRoadFacts')}),
      field('noiseRoadWidth','道路寬度（公尺）','number',{min:0,displayWhen:show('noise522ShowRoadFacts')}),
      select('noiseRoadSideAZone','道路 A 側噪音管制區',zones,show('noise522ShowRoadFacts')),
      select('noiseRoadSideBZone','道路 B 側噪音管制區',zones,show('noise522ShowRoadFacts')),
      select('noiseRoadSourceSide','音源所在側',[['a','A側'],['b','B側']],show('noise522ShowRoadFacts')),
      select('noiseRoadPointSide','量測點所在側',[['a','A側'],['b','B側']],show('noise522ShowRoadFacts')),
      field('noiseBoundaryDistance','量測點距道路／交界距離（公尺）','number',{min:0,displayWhen:show('noise522ShowRoadFacts')}),
      select('noiseRoadOriginalFourth','15公尺以上道路外推範圍原本是否屬第四類',ynu,show('noise522ShowRoadFacts')),
      select('noiseRoadAdjacentFirst','15公尺以上道路是否緊鄰第一類噪音管制區',ynu,show('noise522ShowRoadFacts')),
      select('noiseZoneLegalOverride','原噪音管制區（道路判定需要時）',zones,show('noise522ShowRoadFacts')),
      select('noiseBoundaryZonePair','交界涉及之兩類噪音管制區',[
        ['1-2','第1類＋第2類'],['1-3','第1類＋第3類'],['1-4','第1類＋第4類'],['2-3','第2類＋第3類'],['2-4','第2類＋第4類'],['3-4','第3類＋第4類']
      ],show('noise522ShowBoundaryPair')),
      select('noiseBehavior','第8條現場行為查核',a8BehaviorOptions,show('noise522ShowA8Behavior'),{help:'先直接判斷現場是否有目前時段及管制區可能適用的第8條公告禁止行為；沒有才進入一般第6條／第9條流程。'}),
      select('noiseA8Disturbance','該禁止行為是否致妨害他人生活環境安寧？',ynu,show('noise522ShowA8Disturbance'),{help:'此為第8條構成事實之一，不以第9條分貝標準取代。'}),
      select('noiseContinuity','這個聲音是否具有持續性？',ynu,show('noise522ShowContinuity')),
      select('noiseMeasurability','依現場狀況，這個聲音是否容易進行有效量測？',ynu,show('noise522ShowMeasurability')),
      select('noisePlaceType','場所／工程屬性',rules.places,show('noise522ShowPlace'),{help:'第8條未形成處理路徑後，才依本次同一聲音的場所／工程法律性質判斷第9條。'}),
      select('noiseSourceCategory','主要噪音來源',rules.sources,show('noise522ShowSource'),{help:'記錄本次同一聲音實際來自何種音源；不以場所身分替代音源事實。'}),
      select('noiseEquipmentType','本案是否屬下列公告項目？',announcedEquipment,show('noise522ShowEquipment')),
      field('noiseSourceDescription','主要音源補充描述','text',{displayWhen:show('noise522ShowSource')}),
      select('noiseTargetChoice','本次查核方式',optionsTargets,show('noise522ShowTargetChoice'),{help:'只顯示本次同一聲音已形成的第9條候選路徑。'}),
      select('noiseTargetManual','查核對象（無法由固定規則唯一形成時由稽查員確認）',optionsTargetsAll,show('noise522ShowTargetManual')),
      computed('noise522TargetText','目前查核對象',true,show('noise522ShowRunning')),
      select('noiseTargetRunning','目前查核對象是否正在運轉／發生？',yn,show('noise522ShowRunning')),
      select('noiseMeasurementPlace','量測地點',[['boundary','周界外'],['complainant','陳情人指定之住居所']],show('noise522ShowMeasurementPlace'),{help:'請依實際測點選擇；具特殊法定測量位置者，系統依適用規則處理。'}),
      field('noiseMeasurementPlaceDetail','量測位置描述（選填）','text',{displayWhen:show('noise522ShowMeasurement'),required:false,help:'補充實際測點位置，例如「工地東側周界外」、「陳情人臥室窗邊」。'}),
      select('noiseRain','是否天雨？',yn,show('noise522ShowWeather'),{help:'僅供室外量測條件記錄。'}),
      field('noiseObservation','補充現場事實（選填）','textarea',{
        displayWhen:show('noise522ShowConcurrentFacts'),required:false,
        placeholder:'僅填寫其他欄位未涵蓋、可能有助後續研判之客觀現場情形。',help:'例如設備間歇啟動、關閉設備後聲音消失，或另有明顯背景音源。'
      }),
    ];

    const resultFields=[
      computed('noiseMeasureResultFull','全頻量測結果',true,show('noise522ShowFull')),
      computed('noiseMeasureResultLow','低頻量測結果',true,show('noise522ShowLow')),
      computed('noise522FactSummary','現場稽查摘要',true,show('noise522ShowConcurrentFacts')),
      computed('noise522Article8Text','第8條法規研判',true,show('noise522ShowConcurrentFacts')),
      computed('noise522Article9Text','第9條法規研判',true,show('noise522ShowConcurrentFacts')),
      computed('noise522PendingText','待查事項',true,show('noise522ShowConcurrentFacts'))
    ];
    const existingIds=new Set([...newFields,...resultFields].map(f=>f.id));
    t.fields=t.fields.filter(f=>!existingIds.has(f.id)&&f.id!=='noiseQuickDecisionText'&&f.id!=='noiseMeasureBands');
    const exceptionIds=new Set();
    for(const act of root.NOISE_ARTICLE8_RULES?.acts||[]){
      for(const check of act.exceptionChecks||[])exceptionIds.add(a8ExceptionValue(act.id,check.id));
      for(const ex of act.exceptions||[]){
        exceptionIds.add(a8ExceptionValue(act.id,ex.id));
        for(const check of ex.checks||[])exceptionIds.add(a8ExceptionValue(act.id,ex.id,check.id));
      }
    }
    exceptionIds.add('noiseA8ExceptionSummary');
    const movedExceptions=t.fields.filter(f=>exceptionIds.has(f.id));
    t.fields=t.fields.filter(f=>!exceptionIds.has(f.id));
    const firstNonComputed=t.fields.findIndex(f=>f.type!=='computed');
    t.fields.splice(firstNonComputed<0?0:firstNonComputed,0,...newFields);
    t.fields.push(...movedExceptions,...resultFields);
    t.title='噪音稽查－事實／量測／法規分層測試版';
    t.formTitle='噪音案件';
    t.version='5.2.6';
    t.moduleVersion='5.2.6';
    t.previewOnlyMessage='尚有必要事實或法規研判資料未完成；現場事實與已輸入量測資料均保留。';
    t.mobileWizard={
      ariaLabel:'噪音手機逐步流程',brandLabel:'稽查助手',brandSlogan:'先保全現場證據，再完成法規研判',fallbackTitle:'其他必要事項',
      statusFields:[{id:'noise522TargetText',label:'查核對象'},{id:'noiseRouteText',label:'目前路徑'}],
      steps:[
        {id:'basic',title:'案件基本資料',help:'先記錄查核對象／場所／工程名稱、稽查日期及24小時制時間。',fields:['noiseSubject','noiseDate','noiseTime']},
        {id:'article8-site',title:'管制區與第8條先分流',help:'先確認噪音管制區與道路／交界，再直接判斷現場是否有第8條公告禁止行為。沒有第8條行為，才進入一般第6條／第9條流程。',fields:['noiseDirectZone','noiseBoundaryInvolved','noiseBoundaryKind','noiseRoadName','noiseRoadWidth','noiseRoadSideAZone','noiseRoadSideBZone','noiseRoadSourceSide','noiseRoadPointSide','noiseBoundaryDistance','noiseRoadOriginalFourth','noiseRoadAdjacentFirst','noiseZoneLegalOverride','noiseBoundaryZonePair','noiseBehavior','noiseA8Disturbance']},
        {id:'article6',title:'第6條前置分流',help:'只有第8條沒有形成處理路徑時，才確認聲音持續性與是否容易有效量測。',fields:['noiseContinuity','noiseMeasurability']},
        {id:'target',title:'第9條場所、音源與查核對象',help:'只針對本次同一聲音確認場所、音源及第9條查核對象；不因所在場所身分把另一種第8條聲音自動送去量測。',fields:['noisePlaceType','noiseSourceCategory','noiseEquipmentType','noiseSourceDescription','noiseTargetChoice','noiseTargetManual','noise522TargetText','noiseTargetRunning']},
        {id:'measurement',title:'現場量測',help:'進入量測階段後直接填入實際量得的均能音量、低頻音量；營建工程等依法需要者另填最大音量。未量測項目留白即可。',fields:['noiseMeasurementPlace','noiseMeasurementPlaceDetail','noiseRain','noiseWind','noiseGeneralSpecialAssessment','noiseSpeakerMode','noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethodText','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow','noiseObservation']},
        {id:'article8-exceptions',title:'第8條例外查核',help:'只有第8條與第9條確定是同一個聲音且需先保全證據時，量測完成後才查例外；其他第8條行為直接查例外，不自動跳第9條。',fields:[...Array.from(exceptionIds)]},
        {id:'law',title:'結果與法規研判',help:'集中顯示量測結果、現場摘要、第8條、第9條與待查事項。',fields:['noiseMeasureResultFull','noiseMeasureResultLow','noise522FactSummary','noise522Article8Text','noise522Article9Text','noise522PendingText']}
      ]
    };
    t.quickActions={...(t.quickActions||{}),summaryField:null};
    t.__refactor522Patched=true;
  };
})(typeof window==='undefined'?globalThis:window);
