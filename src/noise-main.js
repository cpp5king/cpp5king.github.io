(function(root){
  'use strict';
  root.TemplateWorkflows=root.TemplateWorkflows||{};

  const A8=()=>root.NOISE_ARTICLE8_RULES;
  const A9=()=>root.NOISE_ARTICLE9_RULES;
  const yes=b=>b?'yes':'no';
  const text=v=>typeof v==='string'?v.trim():'';
  const num=v=>text(String(v??''))!==''&&Number.isFinite(Number(v))?Number(v):null;
  const fmt=v=>Number.isFinite(v)?(Math.round(v*10)/10).toFixed(1).replace(/\.0$/,''):'';
  const clock=v=>{const m=/^(\d{1,2}):(\d{2})$/.exec(text(v));if(!m)return null;const h=Number(m[1]),n=Number(m[2]);return h>=0&&h<24&&n>=0&&n<60?h*60+n:null;};
  const inWindow=(time,start,end)=>{const t=clock(time),s=clock(start),e=clock(end);if(t===null||s===null||e===null)return false;return s<e?t>=s&&t<e:t>=s||t<e;};
  const tri=v=>['yes','no','unknown'].includes(v)?v:'missing';
  const exFlag=actId=>`noiseShowA8Exception_${actId}`;
  const exValue=(actId,...ids)=>['noiseA8Ex',actId,...ids].join('_');

  function a8ExceptionKeys(){
    const keys=[];
    for(const act of A8().acts||[]){
      for(const check of act.exceptionChecks||[])keys.push(exValue(act.id,check.id));
      for(const ex of act.exceptions||[]){
        keys.push(exValue(act.id,ex.id));
        for(const check of ex.checks||[])keys.push(exValue(act.id,ex.id,check.id));
      }
    }
    return keys;
  }

  const blankFlags={
    noiseShowA8:'no',noiseShowA8Disturbance:'no',noiseShowA8Exception:'no',noiseShowAfterA8:'no',noiseShowA6Disturbance:'no',
    noiseShowA9:'no',noiseShowOtherFacility:'no',noiseShowMeasure:'no',noiseShowFull:'no',noiseShowFullPoint:'no',noiseShowSpeakerLocation:'no',noiseShowWeather:'no',
    noiseShowGeneralMethod:'no',noiseShowSpeakerMode:'no',noiseShowFullAssessment:'no',noiseShowConstructionFull:'no',noiseShowLow:'no',
    noiseShowConstructionLmax:'no',noiseShowBgFull:'no',noiseShowBgLmax:'no',noiseShowBgLow:'no'
  };
  for(const act of A8().acts||[])if(act.hasExceptions||act.exceptionChecks?.length)blankFlags[exFlag(act.id)]='no';

  function base(input){
    return {...input,...blankFlags,noiseBlocked:'yes',noiseValidation:'',noiseRecord:'',noiseReply:'',noiseRouteText:'',noiseStandardText:'',noiseMeasurementPointText:'',noiseResultText:'',noiseGuide:'',noiseA8ExceptionSummary:'',noiseZoneResultText:'',noiseOutcomeId:''};
  }
  function finish(out,{route='',guide='',validation='',record='',reply='',blocked=true,outcome=''}={}){
    out.noiseRouteText=route;out.noiseGuide=guide||route;out.noiseValidation=validation;out.noiseRecord=record;out.noiseReply=reply;out.noiseBlocked=yes(blocked);out.noiseOutcomeId=outcome||out.noiseOutcomeId||'';return out;
  }
  function routeDraft(title,body){return {record:`${title}：${body}`,reply:`有關噪音陳情案，${body}`};}

  function specialCase(out,type,prefix=''){
    const special={
      vehicle:['使用中機動車輛','屬使用中機動車輛噪音管制範圍；依噪音管制法第11條至第13條等規定辦理，不套用一般場所第9條量測流程。'],
      landTransport:['陸上運輸系統','快速道路、高速公路、鐵路及大眾捷運系統之行駛噪音，依噪音管制法第14條及陸上運輸系統噪音管制標準辦理。'],
      civilAviation:['民用航空噪音','民用航空器及民用機場相關噪音依噪音管制法第11條、第15條至第16條等規定辦理。'],
      militaryAviation:['軍用航空噪音','軍用航空噪音依噪音管制法第17條等規定，由軍用航空主管機關會商地方主管機關辦理。']
    }[type];
    if(!special)return null;
    const body=`${prefix?prefix+' ':''}${special[1]}`;
    const d=routeDraft(special[0],body);
    return finish(out,{route:special[0],guide:body,record:d.record,reply:d.reply,blocked:false});
  }

  function period(zone,time){
    const z=A9().zones.find(x=>x.id===zone);if(!z||clock(time)===null)return null;
    for(const id of ['day','evening','night']){const [s,e]=z.periods[id];if(inWindow(time,s,e))return id;}
    return null;
  }
  function actApplicable(act,zone,time,holiday){
    if(!act||!act.zones.includes(zone))return false;
    if(act.allDay)return true;
    const windows=holiday==='yes'&&act.holidayPeriods?act.holidayPeriods:act.periods||[];
    return windows.some(([s,e])=>inWindow(time,s,e));
  }

  function evaluateA8Exceptions(input,out,act){
    const has=!!(act.hasExceptions||act.exceptionChecks?.length);
    if(!has)return {status:'none',summary:'無公告例外條件。'};
    out.noiseShowA8Exception='yes';out[exFlag(act.id)]='yes';
    if(act.exceptionChecks?.length){
      const states=act.exceptionChecks.map(check=>({check,state:tri(input[exValue(act.id,check.id)])}));
      const no=states.find(x=>x.state==='no');
      if(no){const summary=`例外不成立：${no.check.label}為否；公告所列條件須全部符合。`;out.noiseA8ExceptionSummary=summary;return {status:'notExempt',summary};}
      const pending=states.find(x=>x.state==='missing'||x.state==='unknown');
      if(pending){const summary=`例外尚待確認：${pending.check.label}。`;out.noiseA8ExceptionSummary=summary;return {status:'pending',summary,validation:`請確認第8條例外條件：${pending.check.label}。`};}
      const summary='公告所列例外條件均已確認成立。';out.noiseA8ExceptionSummary=summary;return {status:'exempt',summary};
    }
    let pending=null;let requirementsFailed=null;
    for(const ex of act.exceptions||[]){
      const state=tri(input[exValue(act.id,ex.id)]);
      if(state==='yes'){
        if(ex.checks?.length){
          const checks=ex.checks.map(check=>({check,state:tri(input[exValue(act.id,ex.id,check.id)])}));
          const failed=checks.find(x=>x.state==='no');
          if(failed){requirementsFailed=`已確認「${ex.label}」，但未符合公告事項六附帶規定：${failed.check.label}。`;continue;}
          const childPending=checks.find(x=>x.state==='missing'||x.state==='unknown');
          if(childPending){pending=`已確認「${ex.label}」，尚須確認：${childPending.check.label}`;continue;}
        }
        const summary=`公告例外成立：${ex.label}。`;out.noiseA8ExceptionSummary=summary;return {status:'exempt',summary};
      }
      if((state==='missing'||state==='unknown')&&!pending)pending=`${ex.label}`;
    }
    if(pending){const summary=`公告例外尚待確認：${pending}。`;out.noiseA8ExceptionSummary=summary;return {status:'pending',summary,validation:`請確認第8條公告例外：${pending}。`};}
    if(requirementsFailed){out.noiseA8ExceptionSummary=requirementsFailed;return {status:'requirementsFailed',summary:requirementsFailed};}
    const summary='已逐項確認，未符合公告所列例外情形。';out.noiseA8ExceptionSummary=summary;return {status:'notExempt',summary};
  }

  function sourceMeta(type){
    const map={
      factory:{table:'factory',kind:'general',label:'工廠（場）',basis:'噪音管制法第9條第1項第1款'},
      entertainment:{table:'business',kind:'general',label:'娛樂場所',basis:'噪音管制法第9條第1項第2款'},
      business:{table:'business',kind:'general',label:'營業場所',basis:'噪音管制法第9條第1項第3款'},
      construction:{table:'construction',kind:'construction',label:'營建工程',basis:'噪音管制法第9條第1項第4款'},
      speaker:{table:'speaker',kind:'speaker',label:'擴音設施',basis:'噪音管制法第9條第1項第5款'},
      otherFacility:{table:'other',kind:'general',label:'新北市公告之其他設施',basis:'噪音管制法第9條第1項第6款及新北市115年3月5日公告'},
      renovation:{table:'construction',kind:'construction',label:'公告裝修工程',basis:'噪音管制法第9條第1項第6款、新北市115年3月5日公告及噪音管制標準第8條第2項'}
    };
    return map[type]||null;
  }
  function standards(meta,zone,p){
    if(!meta||!p)return null;const table=A9().tables[meta.table],zi=Number(zone)-1,pi={day:0,evening:1,night:2}[p];
    if(!table||zi<0||zi>3||pi===undefined)return null;
    return {full:table.full?.leq?.[zi]?.[pi],lmax:table.full?.lmax?.[zi]?.[pi],low:table.low?.leqLF?.[zi]?.[pi]};
  }

  function correction(overall,bg){
    const diff=overall-bg;
    if(diff<3)return {status:'invalid',message:'整體音量與背景音量相差小於3 dB，依噪音管制標準應停止測量，另尋適合測點或排除／降低其他噪音源後重新量測。'};
    if(diff>=10)return {status:'ok',value:overall,note:'與背景音量相差10 dB以上，不需修正。'};
    const energy=Math.pow(10,overall/10)-Math.pow(10,bg/10);
    if(!(energy>0))return {status:'invalid',message:'背景音量資料無法進行有效修正，請重新確認量測值。'};
    return {status:'ok',value:10*Math.log10(energy),note:`與背景音量相差${fmt(diff)} dB，已依公式扣除背景音量影響。`};
  }
  function assessMetric(label,overall,std,mode,bg){
    if(std===undefined)return {needed:false,decisive:true,line:''};
    if(overall===null)return {needed:true,decisive:false,line:`${label}：尚未輸入測量值。`,validation:`請輸入${label}測量值。`};
    if(overall<=std)return {needed:true,decisive:true,exceeded:false,value:overall,line:`${label} ${fmt(overall)} dB，標準 ${std} dB，未超過標準。`};
    if(mode==='uncooperative')return {needed:true,decisive:true,exceeded:true,value:overall,line:`${label} ${fmt(overall)} dB，標準 ${std} dB；現場人員無法配合背景音量量測，依規定不修正並註明，結果超過標準。`};
    if(mode!=='measured')return {needed:true,decisive:false,needBackground:true,line:`${label} ${fmt(overall)} dB 高於標準 ${std} dB，需完成背景音量確認後才能判定。`,validation:`${label}高於標準，請完成背景音量處理。`};
    if(bg===null)return {needed:true,decisive:false,needBackground:true,line:`${label}需輸入背景音量。`,validation:`請輸入${label}背景音量。`};
    const c=correction(overall,bg);
    if(c.status!=='ok')return {needed:true,decisive:false,invalid:true,needBackground:true,line:`${label}：${c.message}`,validation:c.message};
    const v=c.value,exceeded=v>std;
    return {needed:true,decisive:true,exceeded,value:v,needBackground:true,line:`${label}整體 ${fmt(overall)} dB、背景 ${fmt(bg)} dB；${c.note} 修正後 ${fmt(v)} dB，標準 ${std} dB，${exceeded?'超過':'未超過'}標準。`};
  }

  function generalMethodLabel(method){return {leq:'Leq（非週期／非間歇性，連續取樣至少2分鐘）',lmaxMean:'Lmax平均（週期／間歇、最大音量差≤5 dB，連續10次最大值平均）',l5:'L5（週期／間歇、最大音量差>5 dB，至少20個最大值計算）'}[method]||'';}
  function speakerMethodLabel(mode){return {fixed:'Leq（固定或停止移動，連續取樣至少2分鐘）',moving:'Lmax（移動性擴音設施通過時最大值）'}[mode]||'';}
  function measurementPoint(input,meta,band){
    const lines=[];
    if(meta.kind==='speaker'&&(band==='full'||band==='both')){
      lines.push('擴音設施：於音源水平投影距離3公尺以上之主管機關指定位置量測；移動音源則取最近距離不少於3公尺之指定位置。');
      if(input.noiseSpeakerOutdoor==='yes')lines.push('本次擴音設施測點位於室外。');
      if(input.noiseSpeakerOutdoor==='no')lines.push('本次擴音設施測點位於室內。');
    }else if(band==='full'||band==='both'){
      if(input.noiseFullPoint==='complainant')lines.push('全頻：於陳情人指定之室內居住生活地點量測。');
      else if(input.noiseFullPoint==='authority')lines.push('全頻：陳情人不指定時，由主管機關指定周界外測點，並距最近建築物牆面線1公尺以上。');
      else lines.push('全頻：尚未確認測點。');
    }
    if(band==='low'||band==='both')lines.push('低頻：於陳情人指定之居住生活室內地點量測；原則距最近建築物牆面線1公尺以上，門窗關閉。');
    lines.push('測量高度原則為離地面或樓板1.2～1.5公尺。');
    if(meta.kind==='general'&&input.noiseGeneralMethod)lines.push(`全頻評定方法：${generalMethodLabel(input.noiseGeneralMethod)}。`);
    if(meta.kind==='speaker'&&input.noiseSpeakerMode)lines.push(`擴音設施評定方法：${speakerMethodLabel(input.noiseSpeakerMode)}。`);
    if(meta.kind==='construction')lines.push('工程音源：連續測量取樣至少2分鐘，並記錄 Lmax、Leq；有低頻時並記錄 Leq,LF。');
    return lines.join('\n');
  }
  function weatherState(input,meta,band){
    if(!(band==='full'||band==='both'))return {show:false,error:''};
    if(meta.kind==='speaker'){
      if(!['yes','no'].includes(input.noiseSpeakerOutdoor))return {show:false,error:'請確認擴音設施實際量測點是否位於室外。'};
      return {show:input.noiseSpeakerOutdoor==='yes',error:''};
    }
    if(input.noiseFullPoint==='authority')return {show:true,error:''};
    if(input.noiseFullPoint==='complainant')return {show:false,error:''};
    return {show:false,error:'請確認全頻測量地點。'};
  }
  function weatherValidation(input,show){
    if(!show)return '';
    // 天雨路濕已在「是否進行量測 → 不量測原因」處理；進入實際量測後只確認風速。
    const wind=num(input.noiseWind);if(wind===null)return '室外量測請輸入風速。';
    if(wind>5)return '未符合噪音管制標準量測時氣象條件之規定，無法量測具代表性之數據。';
    return '';
  }

  function article8Stage(input,out){
    if(!text(input.noiseDate)||clock(input.noiseTime)===null||!['1','2','3','4'].includes(input.noiseZone)||!['yes','no'].includes(input.noiseHoliday))return {done:true,out:finish(out,{route:'第8條前置判斷',validation:'請完成稽查日期、時間、噪音管制區及假日別。'})};
    if(!input.noiseA8Act)return {done:true,out:finish(out,{route:'第8條公告禁止行為優先判斷',validation:'請確認現場是否涉及第8條公告禁止行為。'})};
    if(input.noiseA8Act==='none')return {done:false,note:'未見第8條公告禁止行為。'};
    const act=A8().acts.find(a=>a.id===input.noiseA8Act&&a.id!=='exhaust');
    if(!act)return {done:true,out:finish(out,{route:'第8條公告禁止行為',validation:'無法辨識所選公告行為，請重新選擇。'})};
    if(!actApplicable(act,input.noiseZone,input.noiseTime,input.noiseHoliday))return {done:false,note:'所選行為於本次管制區／時段條件下不落入第8條公告管制。'};
    out.noiseShowA8Disturbance='yes';
    if(!['yes','no','unknown'].includes(input.noiseA8Disturbance))return {done:true,out:finish(out,{route:`第8條候選：${act.label}`,validation:'請確認是否已足以妨害他人生活環境安寧。'})};
    if(input.noiseA8Disturbance==='unknown')return {done:true,out:finish(out,{route:`第8條候選：${act.label}`,validation:'「妨害他人生活環境安寧」尚待確認，暫不作成違規結論。'})};
    if(input.noiseA8Disturbance==='no')return {done:false,note:'現場尚不足認妨害他人生活環境安寧。'};
    const exception=evaluateA8Exceptions(input,out,act);
    if(exception.status==='pending')return {done:true,out:finish(out,{route:`第8條候選：${act.label}`,guide:exception.summary,validation:exception.validation||'公告例外條件尚待確認，暫不作成違規結論。'})};
    if(exception.status==='exempt')return {done:false,note:`${exception.summary} 本案不以該第8條禁止行為成立。`};
    const exText=exception.status==='requirementsFailed'?`；${exception.summary}`:(exception.status==='notExempt'?`；${exception.summary}`:'');
    const body=`現場於新北市第${input.noiseZone}類噪音管制區、${input.noiseTime}查見「${act.label}」，落於公告管制範圍，且已確認足以妨害他人生活環境安寧${exText}，依噪音管制法第8條及新北市現行公告辦理。`;
    const d=routeDraft('第8條公告禁止行為',body);
    return {done:true,out:finish(out,{route:'第8條公告禁止行為成立路徑',guide:'本案依第8條公告禁止行為處理，不以第9條量測作為成立要件。',record:d.record,reply:d.reply,blocked:false,outcome:'article8.established'})};
  }

  function prepare(rawInput={}){
    const input={...rawInput};
    const out=base(input);
    if(!input.noiseSpecial)return finish(out,{route:'第一步｜主要噪音來源／主管機關分流',validation:'請先確認主要噪音來源，以判斷主管機關與法規路徑。'});

    if(['landTransport','civilAviation','militaryAviation'].includes(input.noiseSpecial))return specialCase(out,input.noiseSpecial);

    if(input.noiseSpecial==='vehicle'){
      const exhaust=tri(input.noiseVehicleExhaustA8);
      if(exhaust==='missing')return finish(out,{route:'使用中機動車輛｜先檢查第8條排氣管公告行為',validation:'請確認車輛是否涉及變更合格排氣管，或使用未經噪音審驗／檢驗合格排氣管行駛道路之行為。'});
      if(exhaust==='unknown')return finish(out,{route:'使用中機動車輛｜第8條排氣管公告行為待確認',validation:'排氣管第8條公告行為尚待確認，不得直接略過後轉機動車輛專章。'});
      if(exhaust==='yes'){
        out.noiseShowA8Disturbance='yes';
        const disturbance=tri(input.noiseA8Disturbance);
        if(disturbance==='missing')return finish(out,{route:'第8條車輛排氣管公告禁止行為候選',validation:'請確認該排氣管公告行為是否已足以妨害他人生活環境安寧。'});
        if(disturbance==='unknown')return finish(out,{route:'第8條車輛排氣管公告禁止行為候選',validation:'「妨害他人生活環境安寧」尚待確認，暫不作成第8條結論。'});
        if(disturbance==='yes'){
          const body='現場查見使用中機動車輛涉及任意變更經噪音檢（查）驗合格排氣管，或使用未經噪音審驗／檢驗合格排氣管行駛道路之公告禁止行為，且已確認足以妨害他人生活環境安寧；該行為為新北市各類噪音管制區全時段禁止事項，依噪音管制法第8條及新北市現行公告辦理。';
          const d=routeDraft('第8條車輛排氣管公告禁止行為',body);
          return finish(out,{route:'第8條車輛排氣管公告禁止行為成立路徑',guide:'本案先依第8條公告禁止行為處理，不以一般場所第9條量測流程判定。',record:d.record,reply:d.reply,blocked:false,outcome:'article8.vehicleExhaust'});
        }
        return specialCase(out,'vehicle','已確認排氣管公告行為尚不足認妨害他人生活環境安寧，未逕以第8條成立。');
      }
      return specialCase(out,'vehicle','未見第8條車輛排氣管公告禁止行為。');
    }

    if(input.noiseSpecial!=='ordinary')return finish(out,{route:'來源類型未支援',validation:'請重新選擇主要噪音來源。'});

    const zoneState=root.NoiseZone?.resolve?root.NoiseZone.resolve(input):{status:['1','2','3','4'].includes(input.noiseZone)?'resolved':'pending',zone:input.noiseZone,note:'',message:'請確認噪音管制區。'};
    if(zoneState.status==='resolved')input.noiseZone=zoneState.zone;
    else input.noiseZone='';
    Object.assign(out,input);out.noiseZoneResultText=zoneState.note||zoneState.message||'';
    if(zoneState.status!=='resolved')return finish(out,{route:'第二步｜噪音管制區判定',guide:zoneState.note||zoneState.message,validation:zoneState.message||'請確認噪音管制區。'});

    out.noiseShowA8='yes';
    const a8=article8Stage(input,out);if(a8.done)return a8.out;
    out.noiseShowAfterA8='yes';const a8Note=a8.note||'';

    if(!['difficult','measurable'].includes(input.noiseNature))return finish(out,{route:`${a8Note}\n一般場所／工程／設施：判斷是否可量測`,validation:'請確認聲音是否具持續性且可量測。'});
    if(input.noiseNature==='difficult'){
      out.noiseShowA6Disturbance='yes';
      if(!['yes','no','unknown'].includes(input.noiseA6Disturbance))return finish(out,{route:'噪音管制法第6條候選',validation:'請確認該不具持續性或不易量測聲音是否足以妨害他人生活安寧。'});
      if(input.noiseA6Disturbance==='unknown')return finish(out,{route:'噪音管制法第6條候選',validation:'是否足以妨害他人生活安寧尚待確認，暫不作成第6條結論。'});
      if(input.noiseA6Disturbance==='no'){
        const body=`${a8Note} 現場所聞聲音不具持續性或不易量測，但目前尚不足認足以妨害他人生活安寧，未逕作噪音管制法第6條違規判斷，亦不以第9條量測標準判定。`;
        const d=routeDraft('第6條要件未成立',body);return finish(out,{route:'第6條要件未成立／本次不進第9條量測',guide:body,record:d.record,reply:d.reply,blocked:false});
      }
      const body=`${a8Note} 本案聲音屬不具持續性或不易量測，且已確認足以妨害他人生活環境安寧，依噪音管制法第6條，由警察機關依有關法規處理。`;
      const d=routeDraft('噪音管制法第6條路徑',body);return finish(out,{route:'第6條／警察機關處理路徑',guide:body,record:d.record,reply:d.reply,blocked:false});
    }

    out.noiseShowA9='yes';
    if(!input.noiseA9Type)return finish(out,{route:`${a8Note}\n第9條場所／工程／設施判斷`,validation:'請確認第9條噪音源類型。'});
    if(input.noiseA9Type==='outside')return finish(out,{route:`${a8Note}\n目前不屬第9條列管場所／工程／設施。`,guide:'不得因「不屬第9條」直接推論無其他法規責任；請回到噪音來源與主管機關重新確認。',blocked:true});
    const meta=sourceMeta(input.noiseA9Type);if(!meta)return finish(out,{route:'第9條來源類型無法辨識',validation:'請重新確認噪音源類型。'});
    if(input.noiseA9Type==='otherFacility'){
      out.noiseShowOtherFacility='yes';
      if(!A9().facilities.some(f=>f.id===input.noiseFacility))return finish(out,{route:`${a8Note}\n第9條第1項第6款／新北市公告設施`,validation:'請確認公告設施種類。'});
    }

    out.noiseShowMeasure='yes';
    const p=period(input.noiseZone,input.noiseTime),std=standards(meta,input.noiseZone,p);if(!p||!std)return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'無法依管制區與時段解析噪音標準。'});
    const periodLabel={day:'日間',evening:'晚間',night:'夜間'}[p];
    const hasValue=value=>text(String(value??''))!=='';
    const fullValues=meta.kind==='construction'?[input.noiseValueLeq,input.noiseValueLmax]:[input.noiseValueFull];
    const useFull=fullValues.some(hasValue),useLow=hasValue(input.noiseValueLow);
    const fullAvailable=std.full!==undefined||std.lmax!==undefined;
    const lowAvailable=std.low!==undefined&&meta.kind!=='speaker';
    const band=useFull&&useLow?'both':useFull?'full':useLow?'low':'';

    // 不再要求先選量測頻帶；直接顯示可輸入之量測值，系統依實際輸入判斷本次量測項目。
    out.noiseShowFull=yes(useFull);out.noiseShowLow=yes(lowAvailable);out.noiseShowFullPoint=yes(useFull&&meta.kind!=='speaker');out.noiseShowSpeakerLocation=yes(useFull&&meta.kind==='speaker');
    out.noiseShowGeneralMethod=yes(useFull&&meta.kind==='general');out.noiseShowSpeakerMode=yes(useFull&&meta.kind==='speaker');
    out.noiseShowFullAssessment=yes(fullAvailable&&['general','speaker'].includes(meta.kind));out.noiseShowConstructionFull=yes(fullAvailable&&meta.kind==='construction');out.noiseShowConstructionLmax=yes(fullAvailable&&meta.kind==='construction'&&std.lmax!==undefined);
    if(useFull&&meta.kind==='general'&&!generalMethodLabel(input.noiseGeneralMethod))return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'請確認全頻評定方式。'});
    if(useFull&&meta.kind==='speaker'&&!speakerMethodLabel(input.noiseSpeakerMode))return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'請確認擴音設施為移動性或固定／停止移動。'});
    if(useLow&&!lowAvailable)return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'此噪音源類型沒有可套用的低頻標準，請移除低頻量測值或重新確認來源類型。'});

    const standardLines=[];
    if(meta.kind==='construction'){
      if(std.full!==undefined)standardLines.push(`全頻 Leq ${std.full} dB(A)`);
      if(std.lmax!==undefined)standardLines.push(`Lmax ${std.lmax} dB(A)`);
    }else if(std.full!==undefined)standardLines.push(`全頻 ${std.full} dB(A)`);
    if(lowAvailable)standardLines.push(`低頻 Leq,LF ${std.low} dB(A)`);
    out.noiseStandardText=`第${input.noiseZone}類／${periodLabel}：${standardLines.join('；')}`;

    if(!text(input.noiseSubject))return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'請填入稽查對象代稱。'});
    if(!text(input.noiseSource))return finish(out,{route:`${a8Note}
${meta.basis}`,validation:'請填入主要噪音源／設備說明。'});
    if(!useFull&&!useLow){
      out.noiseMeasurementPointText='請直接輸入全頻或低頻量測值；系統將依實際輸入自動判斷本次量測項目。';
      out.noiseResultText='尚無量測資料，尚未進行符合／超標研判。';
      return finish(out,{route:`${a8Note}
${meta.basis}`,guide:'尚無量測數值；輸入全頻或低頻數值後，系統會自動展開對應測點、氣象與背景音處理。',validation:'尚無量測資料，請輸入全頻或低頻量測值。'});
    }

    const weather=weatherState(input,meta,band);out.noiseShowWeather=yes(weather.show);
    out.noiseMeasurementPointText=measurementPoint(input,meta,band);
    if(weather.error)return finish(out,{route:`${a8Note}
${meta.basis}`,guide:weather.error,validation:weather.error});
    const weatherError=weatherValidation(input,weather.show);if(weatherError){
      const windInvalid=num(input.noiseWind)!==null&&num(input.noiseWind)>5;
      out.noiseResultText=windInvalid
        ?'未符合噪音管制標準量測時氣象條件之規定，無法量測具代表性之數據。'
        :'室外量測尚待輸入風速，暫不進行符合／超標研判。';
      return finish(out,{route:`${a8Note}
${meta.basis}`,guide:weatherError,validation:weatherError,outcome:windInvalid?'article9.weather.wind':''});
    }

    const results=[];let fullPrimary=null,fullLmax=null,lowResult=null;
    if(useFull&&meta.kind==='general'){fullPrimary=assessMetric(generalMethodLabel(input.noiseGeneralMethod),num(input.noiseValueFull),std.full,input.noiseBgFullMode,num(input.noiseBgFull));results.push(fullPrimary);}
    if(useFull&&meta.kind==='speaker'){fullPrimary=assessMetric(speakerMethodLabel(input.noiseSpeakerMode),num(input.noiseValueFull),std.full,input.noiseBgFullMode,num(input.noiseBgFull));results.push(fullPrimary);}
    if(useFull&&meta.kind==='construction'){
      fullPrimary=assessMetric('全頻 Leq',num(input.noiseValueLeq),std.full,input.noiseBgFullMode,num(input.noiseBgFull));results.push(fullPrimary);
      if(std.lmax!==undefined){fullLmax=assessMetric('Lmax',num(input.noiseValueLmax),std.lmax,input.noiseBgLmaxMode,num(input.noiseBgLmax));results.push(fullLmax);}
    }
    if(useLow&&std.low!==undefined){lowResult=assessMetric('低頻 Leq,LF',num(input.noiseValueLow),std.low,input.noiseBgLowMode,num(input.noiseBgLow));results.push(lowResult);}
    out.noiseShowBgFull=yes(!!fullPrimary?.needBackground);out.noiseShowBgLmax=yes(!!fullLmax?.needBackground);out.noiseShowBgLow=yes(!!lowResult?.needBackground);
    out.noiseResultText=results.map(r=>r.line).filter(Boolean).join('\n');
    const pending=results.find(r=>!r.decisive);
    if(pending)return finish(out,{route:`${a8Note}\n${meta.basis}`,guide:out.noiseResultText,validation:pending.validation||'量測資料尚未完成。'});

    const exceeded=results.some(r=>r.exceeded);
    const facility=input.noiseA9Type==='otherFacility'?`（${A9().facilities.find(f=>f.id===input.noiseFacility)?.label||''}）`:'';
    const body=`現場稽查對象「${text(input.noiseSubject)}」，主要噪音源為「${text(input.noiseSource)}」，屬${meta.label}${facility}；適用第${input.noiseZone}類噪音管制區${periodLabel}標準。${out.noiseResultText.replace(/\n/g,' ')}${exceeded?'量測結果有項目超過噪音管制標準，依噪音管制法第24條辦理限期改善。':'量測結果未超過本次適用噪音管制標準。'}`;
    const reply=exceeded?'本案經量測有項目超過噪音管制標準，將依噪音管制法第24條辦理限期改善。':'本案經依適用噪音管制標準量測，結果未超過標準。';
    out.noiseRouteText=`${a8Note}\n${meta.basis}`;
    return finish(out,{route:out.noiseRouteText,guide:exceeded?'第9條量測超標：進入第24條限期改善程序。':'第9條量測未超標。',record:body,reply,blocked:false,outcome:exceeded?'article9.exceeded':'article9.compliant'});
  }

  function resetChange(before={},after={}){
    const next={...after};const clear=keys=>keys.forEach(k=>{next[k]='';});
    const exceptionKeys=a8ExceptionKeys();
    const zoneAssistFields=['noiseZoneAssistType','noiseZoneLandClass','noiseZoneTrafficSource','noiseZoneSourceZone','noiseZoneSideA','noiseZoneSideB','noiseZonePointSide','noiseZoneMajorPosition','noiseZoneOriginalFourth','noiseZoneAdjacentFirst','noiseZoneUnderlying','noiseZoneBoundaryPair'];
    const zoneFields=['noiseZoneMode','noiseZone',...zoneAssistFields,'noiseHoliday','noiseA8Act'];
    const measurements=['noiseFacility','noiseSubject','noiseSource','noiseOperation','noiseGeneralSpecialAssessment','noiseFullPoint','noiseSpeakerOutdoor','noiseRain','noiseWind','noiseGeneralMethod','noiseSpeakerMode','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow'];
    if(before.noiseSpecial!==after.noiseSpecial)clear(['noiseVehicleExhaustA8','noiseA8Disturbance',...zoneFields,...exceptionKeys,'noiseNature','noiseA6Disturbance','noiseA9Type',...measurements]);
    if(before.noiseVehicleExhaustA8!==after.noiseVehicleExhaustA8)clear(['noiseA8Disturbance']);
    if(before.noiseZoneMode!==after.noiseZoneMode){clear(zoneAssistFields);if(after.noiseZoneMode==='assist')next.noiseZone='';}
    if(['noiseDate','noiseTime','noiseZone','noiseZoneMode',...zoneAssistFields,'noiseHoliday'].some(k=>before[k]!==after[k]))clear(['noiseA8Disturbance',...exceptionKeys,'noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow']);
    if(before.noiseA8Act!==after.noiseA8Act)clear(['noiseA8Disturbance',...exceptionKeys]);
    if(before.noiseA8Disturbance!==after.noiseA8Disturbance&&after.noiseSpecial==='ordinary')clear(exceptionKeys);
    for(const act of A8().acts||[])for(const ex of act.exceptions||[]){
      if(!ex.checks?.length)continue;
      const parent=exValue(act.id,ex.id);
      if(before[parent]!==after[parent]&&after[parent]!=='yes')clear(ex.checks.map(check=>exValue(act.id,ex.id,check.id)));
    }
    if(before.noiseNature!==after.noiseNature)clear(['noiseA6Disturbance','noiseA9Type',...measurements]);
    if(before.noiseA9Type!==after.noiseA9Type)clear(measurements);
    if(before.noiseGeneralMethod!==after.noiseGeneralMethod||before.noiseSpeakerMode!==after.noiseSpeakerMode)clear(['noiseValueFull','noiseBgFullMode','noiseBgFull']);
    if(before.noiseFullPoint!==after.noiseFullPoint||before.noiseSpeakerOutdoor!==after.noiseSpeakerOutdoor)clear(['noiseRain','noiseWind','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax']);
    return next;
  }

  function validate(input){const out=prepare(input);return out.noiseBlocked==='yes'&&out.noiseValidation?[out.noiseValidation]:[];}
  root.NoiseMain={prepare,resetChange,validate,period,actApplicable,correction,evaluateA8Exceptions};
  root.TemplateWorkflows.noiseMain={prepare,resetChange,validate,clearDraft:()=>true};
})(typeof window==='undefined'?globalThis:window);
