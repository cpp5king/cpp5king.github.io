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
      if(selected(input.noiseMeasureBands,'full')){
        if((target.id==='construction'||target.id==='renovation')&&row.std?.full!==undefined&&row.std?.lmax!==undefined){
          parts.push('均能：'+fmt(row.std.full)+'分貝','最大音量：'+fmt(row.std.lmax)+'分貝');
        }else if(row.std?.full!==undefined){
          parts.push('均能：'+fmt(row.std.full)+'分貝');
        }
      }
      if(selected(input.noiseMeasureBands,'low')&&row.std?.low!==undefined)parts.push('低頻均能：'+fmt(row.std.low)+'分貝');
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
  function zoneInput(input){
    const out={...input};
    if(input.noiseBoundaryInvolved!=='yes'){
      const direct=validZone(input.noiseDirectZone)?input.noiseDirectZone:'';
      if(direct){
        out.noiseZoneMode='direct';
        out.noiseZone=direct;
        return out;
      }
      // 舊版匯入資料相容：介面已不再以使用分區作為主要輸入。
      let legacyZone=rules.landUseZone(input.noiseLandUseType);
      if(input.noiseLandUseType==='nonUrban'){
        const f=tri(input.noiseNonUrbanFourth);
        if(f==='yes')legacyZone='4';
        if(f==='no')legacyZone='3';
      }
      if(!legacyZone&&validZone(input.noiseZoneLegalOverride))legacyZone=input.noiseZoneLegalOverride;
      out.noiseZoneMode='direct';
      out.noiseZone=legacyZone||'';
      return out;
    }
    if(input.noiseBoundaryInvolved!=='yes')return out;
    out.noiseZoneMode='assist';
    if(input.noiseBoundaryKind==='zoneBoundary'){
      out.noiseZoneAssistType='boundary';
      out.noiseZoneBoundaryPair=input.noiseBoundaryZonePair||'';
      return out;
    }
    if(input.noiseBoundaryKind!=='road')return out;
    const width=num(input.noiseRoadWidth);
    if(width===null)return out;
    if(width<6){
      out.noiseZoneAssistType='roadUnder6';
      out.noiseZoneSideA=input.noiseRoadSideAZone||'';
      out.noiseZoneSideB=input.noiseRoadSideBZone||'';
      out.noiseZonePointSide=input.noiseRoadPointSide||'';
      return out;
    }
    if(width<15){
      out.noiseZoneAssistType='road6to15';
      out.noiseZoneTrafficSource='no';
      out.noiseZoneSourceZone=input.noiseRoadSourceSide==='a'?input.noiseRoadSideAZone:input.noiseRoadSourceSide==='b'?input.noiseRoadSideBZone:'';
      return out;
    }
    out.noiseZoneAssistType='majorTransport';
    const distance=num(input.noiseBoundaryDistance);
    if(distance!==null)out.noiseZoneMajorPosition=distance<=15?'within15':distance<=30?'from15to30':'beyond30';
    out.noiseZoneOriginalFourth=input.noiseRoadOriginalFourth||'';
    out.noiseZoneAdjacentFirst=input.noiseRoadAdjacentFirst||'';
    out.noiseZoneUnderlying=input.noiseZoneLegalOverride||'';
    return out;
  }
  function zoneState(input){
    const mapped=zoneInput(input);
    if(root.NoiseZone?.resolve){
      const state=root.NoiseZone.resolve(mapped);
      if(state?.status==='resolved'&&state.zone)return {status:'resolved',zones:[state.zone],message:state.note||'',mapped};
      if(state?.status==='boundary'&&Array.isArray(state.zones))return {status:'boundary',zones:state.zones,message:state.note||'',mapped};
      return {status:'pending',zones:[],message:state?.message||'管制區尚待確認。',mapped};
    }
    return {status:'pending',zones:[],message:'管制區尚待確認。',mapped};
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
    const fullSelected=selected(input.noiseMeasureBands,'full');
    const lowSelected=selected(input.noiseMeasureBands,'low');
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
    const full=selected(input.noiseMeasureBands,'full'),low=selected(input.noiseMeasureBands,'low');
    if(!full&&!low)return false;
    if(full&&input.noiseMeasurementPlace==='boundary'&&num(input.noiseWind)!==null&&num(input.noiseWind)>5)return true;
    const fullReady=!full||(target.id==='construction'||target.id==='renovation'
      ?num(input.noiseValueLeq)!==null&&num(input.noiseValueLmax)!==null
      :num(input.noiseValueFull)!==null);
    const lowReady=!low||num(input.noiseValueLow)!==null;
    return fullReady&&lowReady;
  }
  function a8CandidateActs(input,zones){
    if(!text(input.noiseDate)||!timeValid(input.noiseTime)||!zones.length)return [];
    if(!['yes','no'].includes(input.noiseBoundaryInvolved))return [];
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
  function a8State(input,zones,evidence,out){
    const candidates=a8CandidateActs(input,zones);
    if(!text(input.noiseDate)||!timeValid(input.noiseTime)||!zones.length||!['yes','no'].includes(input.noiseBoundaryInvolved)){
      return {status:'pending',text:'第8條：待確認稽查日期、時間、噪音管制區及道路／交界情形後，再判斷是否需進行第8條現場行為查核。'};
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
    if(!evidence)return {status:'preserveFirst',act,text:'第8條：已命中公告候選；先完成本次可消失之噪音量測證據保全，再查核公告例外事項。'};
    const ex=typeof core.evaluateA8Exceptions==='function'?core.evaluateA8Exceptions({...input,noiseHoliday:holiday},out,act):{status:act.hasExceptions?'pending':'none'};
    if(ex.status==='pending')return {status:'exceptionPending',act,exception:ex,text:'第8條：公告候選成立，例外事項尚待確認。'+(ex.summary||'')};
    if(ex.status==='exempt')return {status:'excluded',act,exception:ex,text:'第8條：公告例外成立，本案第8條路徑排除；保留量測資料並續依第9條研判。'};
    return {status:'established',act,exception:ex,text:'第8條：公告禁止行為成立，作為本案主要處理路徑；第9條量測資料保留但不生成第9條違規敘述。'};
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
    if(selected(input.noiseMeasureBands,'full')){
      if(target.id==='construction'||target.id==='renovation'){
        if(num(input.noiseValueLeq)!==null)parts.push('均能音量為'+fmt(input.noiseValueLeq)+'分貝');
        if(num(input.noiseValueLmax)!==null)parts.push('最大音量為'+fmt(input.noiseValueLmax)+'分貝');
      }else if(num(input.noiseValueFull)!==null)parts.push('全頻測定值為'+fmt(input.noiseValueFull)+'分貝');
    }
    if(selected(input.noiseMeasureBands,'low')&&num(input.noiseValueLow)!==null)parts.push('低頻測定值為'+fmt(input.noiseValueLow)+'分貝');
    const bg=backgroundClause(input,target,assessment);
    const location=pointText(input,selected(input.noiseMeasureBands,'low')&&!selected(input.noiseMeasureBands,'full'));
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
    if(selected(input.noiseMeasureBands,'full')){
      if(target.id==='construction'||target.id==='renovation'){
        if(num(input.noiseValueLeq)!==null)parts.push('均能音量為'+fmt(input.noiseValueLeq)+'分貝');
        if(num(input.noiseValueLmax)!==null)parts.push('最大音量為'+fmt(input.noiseValueLmax)+'分貝');
      }else if(num(input.noiseValueFull)!==null)parts.push('全頻測定值為'+fmt(input.noiseValueFull)+'分貝');
    }
    if(selected(input.noiseMeasureBands,'low')&&num(input.noiseValueLow)!==null)parts.push('低頻測定值為'+fmt(input.noiseValueLow)+'分貝');
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
      if(!selected(input.noiseMeasureBands,'full')&&!selected(input.noiseMeasureBands,'low'))items.push('量測類型');
      if(selected(input.noiseMeasureBands,'full')){
        if(!input.noiseMeasurementPlace)items.push('全頻量測地點');
        if(input.noiseMeasurementPlace==='boundary'&&((!['yes','no'].includes(input.noiseRain)&&!text(input.noiseWeatherText))||num(input.noiseWind)===null))items.push('是否天雨／風速');
        if(!assessment.full?.status&&assessment.full?.progress)items.push('全頻判定所需資料');
      }
      if(selected(input.noiseMeasureBands,'low')){
        if(!assessment.low?.status&&assessment.low?.progress)items.push('低頻判定所需資料');
      }
      if(a8?.status==='behaviorPending')items.push('第8條現場行為查核');
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
      noise522ShowContinuity:'yes',noise522ShowMeasurability:'yes',noise522ShowPlace:'no',
      noise522ShowSource:'no',noise522ShowEquipment:'no',noise522ShowSourceOther:'no',noise522ShowTargetChoice:'no',noise522ShowTargetManual:'no',
      noise522ShowRunning:'no',noise522ShowMeasurement:'no',noise522ShowFull:'no',noise522ShowSingleFull:'no',noise522ShowConstructionFull:'no',noise522ShowLow:'no',
      noise522ShowMeasurementPlace:'no',noise522ShowWeather:'no',noise522ShowConcurrentFacts:'no',noise522ShowZoneSimple:'no',
      noise522ShowBoundaryKind:'no',noise522ShowRoadFacts:'no',noise522ShowBoundaryPair:'no',noise522ShowA8Behavior:'no',
      ...Object.fromEntries((root.NOISE_ARTICLE8_RULES?.acts||[]).map(act=>['noise522A8Candidate_'+act.id,'no'])),
      noise522TargetText:'',noise522FactSummary:'',noise522Article8Text:'',noise522Article9Text:'',noise522PendingText:'',
      noiseMeasureResultFull:'',noiseMeasureResultLow:'',noiseRouteText:'',noiseGuide:'',noiseValidation:'',noiseRecord:'',noiseReply:'',
      noiseBlocked:'yes',noiseOutcomeId:'',noiseShowA8Exception:'no',noiseShowGeneralMethod:'no',noiseShowSpeakerMode:'no',noiseShowBgFull:'no',noiseShowBgLow:'no',
      noiseShowBgLmax:'no',noiseShowConstructionLmax:'no',noiseShowFullPoint:'no',noiseShowSpeakerLocation:'no',noiseShowWeather:'no'
    };
  }
  function setStage(out,route,guide,validation){
    out.noiseRouteText=route;out.noiseGuide=guide;out.noiseValidation=validation||guide;out.noiseBlocked='yes';return out;
  }
  function prepareNoArticle9(input,out){
    out.noise522ShowConcurrentFacts='yes';
    out.noise522ShowZoneSimple='yes';
    out.noise522ShowBoundaryKind=yes(input.noiseBoundaryInvolved==='yes');
    out.noise522ShowRoadFacts=yes(input.noiseBoundaryInvolved==='yes'&&input.noiseBoundaryKind==='road');
    out.noise522ShowBoundaryPair=yes(input.noiseBoundaryInvolved==='yes'&&input.noiseBoundaryKind==='zoneBoundary');
    out.noise522TargetText='未形成第9條管制對象';
    out.noise522Article9Text='第9條：本案不屬工廠（場）、娛樂場所、營業場所、營建工程，且不屬本府依第9條第1項第6款公告之場所、工程及設施，本路徑不適用第9條量測標準。';
    const zone=zoneState(input);
    applyA8CandidateFlags(out,input,zone.zones);
    if(!validZone(input.noiseDirectZone)){
      out.noise522Article8Text='第8條：待確認噪音管制區後，再判斷目前時段是否存在公告禁止行為候選。';
      out.noise522PendingText='待查／待補：噪音管制區。';
      out.noise522FactSummary=['場所：'+placeLabel(input),'主要音源：'+sourceLabel(input),'第9條公告項目：以上公告項目皆非'].join('\n');
      return setStage(out,'第9條公告不適用 → 管制區待確認','第9條公告管制對象已排除；請先確認噪音管制區。','請確認噪音管制區。');
    }
    if(!['yes','no'].includes(input.noiseBoundaryInvolved)){
      out.noise522Article8Text='第8條：待確認道路／交界情形後，再判斷目前時段是否存在公告禁止行為候選。';
      out.noise522PendingText='待查／待補：是否涉及道路或不同噪音管制區交界。';
      out.noise522FactSummary=['場所：'+placeLabel(input),'主要音源：'+sourceLabel(input),'第9條公告項目：以上公告項目皆非'].join('\n');
      return setStage(out,'第9條公告不適用 → 道路／交界待確認','請確認本案是否涉及道路或不同噪音管制區交界。','請確認道路／交界情形。');
    }
    const a8=a8State(input,zone.zones,true,out);
    if(a8.status==='behaviorPending'){
      out.noise522Article8Text=a8.text;
      out.noise522PendingText='待查／待補：第8條現場行為查核。';
      out.noise522FactSummary=['場所：'+placeLabel(input),'主要音源：'+sourceLabel(input),'第9條公告項目：以上公告項目皆非'].join('\n');
      return setStage(out,'第9條公告不適用 → 第8條現場行為待查',a8.text,'請完成第8條現場行為查核。');
    }
    out.noise522Article8Text=a8.text||'';
    out.noise522PendingText=zone.status==='pending'?'待查／待補：噪音管制區。':'待查／待補：無。';
    out.noise522FactSummary=['場所：'+placeLabel(input),'主要音源：'+sourceLabel(input),'第9條公告項目：以上公告項目皆非'].join('\n');
    if(a8.status==='established'){
      out.noiseRouteText='第8條公告禁止行為成立';
      out.noiseGuide=a8.text+'\n'+out.noise522Article9Text;
      out.noiseRecord=draftA8(input,a8,zone.zones);
      out.noiseReply='';
      out.noiseBlocked=out.noiseRecord?'no':'yes';
      out.noiseValidation=out.noiseRecord?'':'第8條已成立，請補填查核對象／場所／工程名稱後產生正式草稿。';
      out.noiseOutcomeId='article8.established';
      return out;
    }
    if(a8.status==='exceptionPending'){
      out.noiseRouteText='第9條公告不適用 → 第8條例外事項待查';
      out.noiseGuide=out.noise522Article9Text+'\n'+a8.text;
      out.noiseValidation='請完成第8條例外事項查核。';
      out.noiseRecord='';out.noiseReply='';out.noiseBlocked='yes';
      return out;
    }
    if(a8.status==='pending'){
      out.noiseRouteText='第9條公告不適用 → 第8條待確認';
      out.noiseGuide=out.noise522Article9Text+'\n'+a8.text;
      out.noiseValidation=zone.message||'第8條適用事實尚待確認。';
      out.noiseBlocked='yes';
      return out;
    }
    out.noiseRouteText='未形成噪音管制法管制路徑';
    out.noiseGuide=out.noise522Article9Text+'\n'+(a8.text||'第8條：未形成公告禁止行為候選。');
    out.noiseValidation='';
    out.noiseBlocked='no';
    out.noiseOutcomeId='noise.no-regulated-route';
    out.noiseResultText='依目前查得事實，未形成噪音管制法之管制路徑。';
    return out;
  }
  function prepare(raw={}){
    const input={...raw};
    let out=seed(input);
    const continuity=tri(input.noiseContinuity),measurability=tri(input.noiseMeasurability);
    if(continuity==='no'||measurability==='no'){
      out.noiseRouteText='第6條型態／警察機關處理方向';
      out.noiseGuide='本案聲音不具持續性或不易進行有效量測，不進入環保局一般第9條量測主流程；依噪音管制法第6條型態及權責方向處理。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noise522FactSummary='第6條前置分流：'+(continuity==='no'?'不具持續性':'')+((continuity==='no'&&measurability==='no')?'；':'')+(measurability==='no'?'不易有效量測':'')+'。';
      return out;
    }
    if(continuity!=='yes'||measurability!=='yes'){
      return setStage(out,'第6條前置分流','先確認聲音是否具有持續性，以及是否容易進行有效量測。','請完成第6條前置分流兩項事實。');
    }

    out.noise522ShowPlace='yes';
    if(!input.noisePlaceType)return setStage(out,'場所／工程屬性','請直接依本案法律上的場所／工程屬性選擇。','請確認場所／工程屬性。');
    if(input.noisePlaceType==='pending')return setStage(out,'場所／工程屬性尚待確認','場所／工程屬性尚待確認；系統不先推定第9條查核對象。','場所／工程屬性尚待確認。');

    out.noise522ShowSource='yes';
    if(!input.noiseSourceCategory)return setStage(out,'主要噪音來源','請確認主要噪音來源；場所、音源與現場行為分開記錄。','請確認主要噪音來源。');
    const needsAnnouncement=input.noisePlaceType==='nonListed'&&['equipment','speaker','other'].includes(input.noiseSourceCategory);
    out.noise522ShowEquipment=yes(needsAnnouncement);
    out.noise522ShowSourceOther=yes(input.noiseSourceCategory==='other');
    if(needsAnnouncement&&!input.noiseEquipmentType){
      return setStage(out,'其他經主管機關公告之場所、工程及設施','本案不屬工廠（場）、娛樂場所、營業場所或營建工程；請直接核對本府第9條第1項第6款公告內容。','請確認是否屬公告之場所、工程及設施。');
    }
    if(needsAnnouncement&&input.noiseEquipmentType==='pending'){
      return setStage(out,'公告項目尚待確認','目前尚無法確認是否屬主管機關公告之場所、工程及設施；系統不先推定第9條適用。','公告項目尚待確認。');
    }
    if(input.noiseSourceCategory==='pending')return setStage(out,'主要噪音來源尚待確認','主要音源尚待確認；請先釐清音源，系統不以「尚待確認」推定任何第9條查核對象。','主要噪音來源尚待確認。');

    if(input.noiseSourceCategory==='vehicle'){
      out.noise522ShowConcurrentFacts='yes';
      out.noiseRouteText='車輛相關噪音／專章分流';
      out.noiseGuide='車輛相關音源不直接套用一般場所第9條查核對象；如涉及公告特定排氣管行為，可在現場行為中記錄並依第8條規則研判。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      return out;
    }

    const announcedItem=typeof rules.announcedItem==='function'?rules.announcedItem(input):null;
    if(input.noisePlaceType==='nonListed'&&announcedItem?.kind==='none'&&input.noiseSourceCategory!=='speaker'){
      return prepareNoArticle9(input,out);
    }

    const candidates=rules.targetCandidates(input);
    let target=rules.target(input);
    out.noise522ShowTargetChoice=yes(candidates.length>1);
    out.noise522ShowTargetManual=yes(candidates.length===0&&input.noisePlaceType!=='nonListed');
    if(candidates.length>1&&!target)return setStage(out,'選擇查核對象','本案存在不同合法查核路徑，請依陳情對象及現場實際情況選擇。','請選擇本次查核對象。');
    if(!candidates.length&&input.noiseTargetManual){
      target=rules.targets[input.noiseTargetManual]||null;
    }
    if(!target)return setStage(out,'形成查核對象','依目前場所與音源事實尚無法唯一形成第9條查核對象；系統不自行猜測，請補充法律場所性質或由稽查員指定合理查核對象。','查核對象尚待確認。');

    out.noise522TargetText=target.label;
    out.noise522ShowRunning='yes';
    if(!['yes','no'].includes(input.noiseTargetRunning))return setStage(out,'查核對象是否正在運轉／發生','查核對象已形成：'+target.label+'。請確認目前是否正在運轉／發生。','請確認查核對象是否正在運轉／發生。');
    if(input.noiseTargetRunning==='no'){
      out.noiseRouteText='到場時未運轉／未發生';
      out.noiseGuide='已記錄到場時查核對象未運轉／未發生；此事實不得推論為聲音不具持續性。';
      out.noiseValidation='';
      out.noiseBlocked='no';
      out.noise522FactSummary='查核對象：'+target.label+'；到場時未運轉／未發生。';
      if(text(input.noiseSubject)&&rocDate(input.noiseDate)&&inspectionTime(input.noiseTime)){
        out.noiseRecord='本局於'+rocDate(input.noiseDate)+inspectionTime(input.noiseTime)+'派員前往所陳地點，經查該址為'+text(input.noiseSubject)+'，到場時查核對象未運轉／未發生，本次未進行噪音量測。';
      }
      return out;
    }

    out.noise522ShowMeasurement='yes';
    out.noise522ShowConcurrentFacts='yes';
    out.noise522ShowZoneSimple='yes';
    const zone=zoneState(input);
    applyA8CandidateFlags(out,input,zone.zones);
    const fullSelected=selected(input.noiseMeasureBands,'full'),lowSelected=selected(input.noiseMeasureBands,'low');
    out.noise522ShowFull=yes(fullSelected);
    out.noise522ShowSingleFull=yes(fullSelected&&target.id!=='construction'&&target.id!=='renovation');
    out.noise522ShowConstructionFull=yes(fullSelected&&(target.id==='construction'||target.id==='renovation'));
    out.noise522ShowLow=yes(lowSelected);
    out.noise522ShowMeasurementPlace=yes(fullSelected);
    out.noise522ShowWeather=yes(fullSelected&&input.noiseMeasurementPlace==='boundary');
    out.noise522ShowBoundaryKind=yes(input.noiseBoundaryInvolved==='yes');
    out.noise522ShowRoadFacts=yes(input.noiseBoundaryInvolved==='yes'&&input.noiseBoundaryKind==='road');
    out.noise522ShowBoundaryPair=yes(input.noiseBoundaryInvolved==='yes'&&input.noiseBoundaryKind==='zoneBoundary');

    if(!fullSelected&&!lowSelected){
      out.noiseRouteText='現場量測';
      out.noiseGuide='查核對象正在運轉／發生；請選擇全頻、低頻或兩者，立即依噪音計實際操作開始量測。系統不顯示假計時。';
      out.noiseValidation='請選擇量測類型。';
      return out;
    }
    if(fullSelected&&!input.noiseMeasurementPlace){
      out.noiseRouteText='現場量測';
      out.noiseGuide='請選擇全頻量測地點：周界外或陳情人指定之住居所。';
      out.noiseValidation='請確認全頻量測地點。';
      return out;
    }

    const forwarded={...zone.mapped,
      noiseNature:'measurable',noiseSpecial:'ordinary',noiseA8Act:'none',noiseA8Disturbance:'',
      noiseA9Type:target.a9Type,noiseFacility:target.facilityId||rules.announcedFacility(input),
      noiseMeasureDecision:'yes',noiseSubject:input.noiseSubject||'',
      noiseSource:sourceLabel(input),noiseOperation:text(input.noiseObservation)||'作業中',
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
      const preserve=['noiseShowGeneralBg10','noiseShowGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseA8ExceptionSummary'];
      preserve.forEach(k=>{if(legacy[k]!==undefined)out[k]=legacy[k];});
    }
    out.noiseShowGeneralMethod=yes(fullSelected&&['factory','entertainment','business','otherFacility'].includes(target.id));
    out.noiseShowSpeakerMode=yes(fullSelected&&target.id==='speaker');
    out.noiseShowConstructionLmax='no';

    const assessment=measurementAssessment(input,target,zone.zones);
    out.noiseMeasureResultFull=fullSelected&&assessment.full.status?statusLabels[assessment.full.status]:'';
    out.noiseMeasureResultLow=lowSelected&&assessment.low.status?statusLabels[assessment.low.status]:'';
    out.noiseShowBgFull=yes(fullSelected&&assessment.full.needsBackground);
    out.noiseShowBgLow=yes(lowSelected&&assessment.low.needsBackground);
    out.noise522Article9Text='第9條：'+(resultSummary(assessment)||'量測資料已開始保全；法規判定尚待必要資料完成。');

    const evidence=sourceEvidence(input,target);
    const a8=a8State(input,zone.zones,evidence,out);
    out.noise522Article8Text=a8.text||'';
    const pending=pendingItems(input,target,zone,assessment,a8);
    out.noise522PendingText=pending.length?'待查／待補：'+pending.join('、'):'待查／待補：無。';
    const facts=['場所：'+placeLabel(input),'主要音源：'+sourceLabel(input),'查核對象：'+target.label,'運轉／發生：是'];
    if(text(input.noiseMeasurementPlaceDetail))facts.push('位置描述：'+text(input.noiseMeasurementPlaceDetail));
    out.noise522FactSummary=facts.join('\n');
    out.noiseResultText=resultSummary(assessment)||'尚無可形成三態量測結果之完整資料；待補資料屬流程進度，不作為量測結果。';

    const a9Draft=draftA9(input,target,assessment,zone.zones);
    const a9Reply=replyA9(input,target,assessment,zone.zones);
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
    if(a8.status==='exceptionPending'){
      out.noiseRouteText='第8條例外事項待查';
      out.noiseGuide=a8.text+'\n第9條量測資料已保留，不因第8條待查而清除。';
      out.noiseValidation='請完成第8條例外事項查核。';
      out.noiseRecord='';out.noiseReply='';out.noiseBlocked='yes';
      return out;
    }

    out.noiseRouteText=a8.status==='excluded'?'第8條例外排除 → 第9條研判':'第9條量測研判';
    out.noiseGuide=(a8.text?a8.text+'\n':'')+out.noise522Article9Text;
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
      out.noiseValidation=assessment.full.progress||assessment.low.progress||zone.message||'量測／法規研判資料尚待完成。';
    }
    return out;
  }

  function resetChange(before={},after={}){
    const next={...after};
    const clear=keys=>keys.forEach(k=>{next[k]='';});
    if(before.noiseContinuity!==after.noiseContinuity||before.noiseMeasurability!==after.noiseMeasurability){
      if(after.noiseContinuity!=='yes'||after.noiseMeasurability!=='yes')clear(['noisePlaceType','noiseSourceCategory','noiseEquipmentType','noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseMeasureBands']);
    }
    if(before.noisePlaceType!==after.noisePlaceType){
      clear(['noiseEquipmentType','noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseMeasureBands','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseSourceCategory!==after.noiseSourceCategory||before.noiseEquipmentType!==after.noiseEquipmentType){
      clear(['noiseTargetChoice','noiseTargetManual','noiseTargetRunning','noiseMeasureBands','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
    }
    if(before.noiseTargetChoice!==after.noiseTargetChoice||before.noiseTargetManual!==after.noiseTargetManual){
      clear(['noiseTargetRunning','noiseMeasureBands','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow']);
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
      'noiseA9Type','noiseFacility','noiseFullPoint','noiseSpeakerOutdoor','noiseBgLmaxMode','noiseBgLmax'
    ]);
    for(const f of t.fields||[])if(oldInteractive.has(f.id))f.displayWhen=hidden;

    const sourceField=t.fields.find(f=>f.id==='noiseSource');if(sourceField)sourceField.displayWhen=hidden;
    const generalValue=t.fields.find(f=>f.id==='noiseValueFull');if(generalValue)generalValue.displayWhen=show('noise522ShowSingleFull');
    const leq=t.fields.find(f=>f.id==='noiseValueLeq');if(leq)leq.displayWhen=show('noise522ShowConstructionFull');
    const lmax=t.fields.find(f=>f.id==='noiseValueLmax');if(lmax)lmax.displayWhen=show('noise522ShowConstructionFull');
    const low=t.fields.find(f=>f.id==='noiseValueLow');if(low)low.displayWhen=show('noise522ShowLow');
    const wind=t.fields.find(f=>f.id==='noiseWind');if(wind){wind.displayWhen=show('noise522ShowWeather');wind.help='室外量測時填寫實測風速；系統將依量測條件判斷是否可有效量測。';}
    const bgFullMode=t.fields.find(f=>f.id==='noiseBgFullMode');if(bgFullMode)bgFullMode.displayWhen=show('noiseShowBgFull');
    const bgLowMode=t.fields.find(f=>f.id==='noiseBgLowMode');if(bgLowMode)bgLowMode.displayWhen=show('noiseShowBgLow');

    const flags=[
      'noise522Never','noise522ShowContinuity','noise522ShowMeasurability','noise522ShowPlace','noise522ShowSource',
      'noise522ShowEquipment','noise522ShowSourceOther','noise522ShowTargetChoice','noise522ShowTargetManual','noise522ShowRunning','noise522ShowMeasurement',
      'noise522ShowFull','noise522ShowSingleFull','noise522ShowConstructionFull','noise522ShowLow','noise522ShowMeasurementPlace','noise522ShowWeather','noise522ShowConcurrentFacts',
      'noise522ShowZoneSimple','noise522ShowBoundaryKind','noise522ShowRoadFacts','noise522ShowBoundaryPair','noise522ShowA8Behavior',
      ...(root.NOISE_ARTICLE8_RULES?.acts||[]).map(act=>'noise522A8Candidate_'+act.id)
    ].map(id=>computed(id,id));
    const optionsTargets=Object.values(rules.targets).map(x=>({id:x.id,label:x.label}));
    const announcedEquipment=rules.announcedItems||rules.equipment;
    const a8BehaviorOptions=rules.behaviors.filter(x=>x.article8Act||x.id==='none').map(x=>({
      ...x,
      ...(x.article8Act?{when:{field:'noise522A8Candidate_'+x.article8Act,value:'yes'}}:{})
    }));
    const newFields=[
      ...flags,
      field('noiseSubject','查核對象／場所／工程名稱','text',{help:'例如：○○工廠、○○餐廳、○○集合住宅新建工程。'}),
      field('noiseDate','稽查日期','date',{format:'roc'}),
      field('noiseTime','稽查時間','time'),
      computed('noise522TargetText','目前查核對象',true,show('noise522ShowRunning')),
      select('noiseContinuity','這個聲音是否具有持續性？',ynu,show('noise522ShowContinuity')),
      select('noiseMeasurability','依現場狀況，這個聲音是否容易進行有效量測？',ynu,show('noise522ShowMeasurability')),
      select('noisePlaceType','場所／工程屬性',rules.places,show('noise522ShowPlace'),{help:'請依查核對象本身的法律性質選擇，不以實際發出聲音的設備種類判斷。'}),
      select('noiseSourceCategory','主要噪音來源',rules.sources,show('noise522ShowSource'),{help:'記錄現場實際發出噪音的來源；場所屬性與噪音來源分開判斷。'}),
      select('noiseEquipmentType','本案是否屬下列公告項目？',announcedEquipment,show('noise522ShowEquipment')),
      field('noiseSourceDescription','主要音源補充描述','text',{displayWhen:show('noise522ShowSource')}),
      select('noiseTargetChoice','本案可有不同查核方式，請依陳情對象及現場實際情況選擇',optionsTargets,show('noise522ShowTargetChoice')),
      select('noiseTargetManual','查核對象（無法由固定規則唯一形成時由稽查員確認）',optionsTargets,show('noise522ShowTargetManual')),
      select('noiseTargetRunning','目前查核對象是否正在運轉／發生？',yn,show('noise522ShowRunning')),
      select('noiseDirectZone','噪音管制區',[['1','第1類'],['2','第2類'],['3','第3類'],['4','第4類'],['pending','尚待確認']],show('noise522ShowZoneSimple'),{help:'請先選擇所在地原則上所屬之第1～4類；如涉及道路或管制區交界，下一題再進一步確認。'}),
      select('noiseBoundaryInvolved','本量測位置是否涉及道路或不同噪音管制區交界？',yn,show('noise522ShowConcurrentFacts'),{help:'如量測位置位於道路範圍、道路兩側或不同噪音管制區交界，請選「是」。'}),
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
      select('noiseBehavior','第8條現場行為查核',a8BehaviorOptions,show('noise522ShowA8Behavior'),{help:'僅顯示目前日期、時間及噪音管制區可能適用之公告禁止行為。'}),
      checklist('noiseMeasureBands','量測類型',[['full','全頻噪音'],['low','低頻噪音']],show('noise522ShowMeasurement'),{help:'可依案件需要選擇全頻、低頻，或兩者皆量測。'}),
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
    t.fields=t.fields.filter(f=>!existingIds.has(f.id));
    const firstNonComputed=t.fields.findIndex(f=>f.type!=='computed');
    t.fields.splice(firstNonComputed<0?0:firstNonComputed,0,...newFields);
    t.fields.push(...resultFields);
    t.title='噪音稽查－事實／量測／法規分層測試版';
    t.formTitle='噪音案件';
    t.version='5.2.2';
    t.moduleVersion='5.2.2';
    t.previewOnlyMessage='尚有必要事實或法規研判資料未完成；現場事實與已輸入量測資料均保留。';
    t.mobileWizard={
      ariaLabel:'噪音手機逐步流程',brandLabel:'稽查助手',brandSlogan:'先保全現場證據，再完成法規研判',fallbackTitle:'其他必要事項',
      statusFields:[{id:'noise522TargetText',label:'查核對象'},{id:'noiseRouteText',label:'目前路徑'}],
      steps:[
        {id:'basic',title:'案件基本資料',help:'先記錄查核對象／場所／工程名稱及本次稽查日期、時間，後續第8條、第9條研判與紀錄草稿直接引用。',fields:['noiseSubject','noiseDate','noiseTime']},
        {id:'article6',title:'第6條前置分流',help:'確認聲音的持續性與可有效量測性。任一為否即不進一般第9條量測主流程。',fields:['noiseContinuity','noiseMeasurability']},
        {id:'target',title:'場所、音源與查核對象',help:'直接選擇法規上的場所／工程屬性；前四類場所由場所直接形成第9條主要路徑。非上述場所／工程則直接核對本府公告項目；以上皆非時停止第9條公告路徑，再確認第8條。',fields:['noisePlaceType','noiseSourceCategory','noiseEquipmentType','noiseSourceDescription','noiseTargetChoice','noiseTargetManual','noise522TargetText','noiseTargetRunning']},
        {id:'site',title:'管制區與第8條查核',help:'先選噪音管制區，再確認是否涉及道路或不同管制區交界；只有目前日期、時間與管制區存在第8條候選時，才顯示第8條現場行為查核。',fields:['noiseDirectZone','noiseBoundaryInvolved','noiseBoundaryKind','noiseRoadName','noiseRoadWidth','noiseRoadSideAZone','noiseRoadSideBZone','noiseRoadSourceSide','noiseRoadPointSide','noiseBoundaryDistance','noiseRoadOriginalFourth','noiseRoadAdjacentFirst','noiseZoneLegalOverride','noiseBoundaryZonePair','noiseBehavior']},
        {id:'measurement',title:'現場量測',help:'音源正在發生時先保全量測證據；不另記錄量測開始／結束時間，依噪音計及適用評定方法完成量測。室外量測以「是否天雨」及風速記錄量測條件。',fields:['noiseMeasureBands','noiseMeasurementPlace','noiseMeasurementPlaceDetail','noiseRain','noiseWind','noiseGeneralSpecialAssessment','noiseSpeakerMode','noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethodText','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLowMode','noiseBgLow','noiseObservation']},
        {id:'law',title:'結果與法規研判',help:'所有輸入完成後在最底部集中顯示量測結果、現場摘要、第8條、第9條與待查事項。',fields:['noiseA8ExceptionSummary','noiseMeasureResultFull','noiseMeasureResultLow','noise522FactSummary','noise522Article8Text','noise522Article9Text','noise522PendingText']}
      ]
    };
    t.__refactor522Patched=true;
  };
})(typeof window==='undefined'?globalThis:window);
