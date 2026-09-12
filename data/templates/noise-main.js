(function(root){
  'use strict';
  const C='（尚未確認）';
  const computed=(id,label,display=false,displayWhen=null)=>({id,label,type:'computed',missing:C,display,...(displayWhen?{displayWhen}:{})});
  const field=(id,label,type,extra={})=>({id,label,type,missing:C,...extra});
  const when=(field,value='yes')=>({field,value});
  const select=(id,label,items,extra={})=>field(id,label,'select',{allowCustom:false,options:items.map(([value,text])=>({id:value,value:text,label:text})),...extra});
  const ynu=[['yes','是'],['no','否'],['unknown','尚待確認']];
  const yn=[['yes','是'],['no','否']];
  const zones=[['1','第一類'],['2','第二類'],['3','第三類'],['4','第四類']];
  const acts=root.NOISE_ARTICLE8_RULES.acts.map(a=>[a.id,a.label]);
  acts.push(['none','無／不屬上述公告禁止行為']);
  const facilities=root.NOISE_ARTICLE9_RULES.facilities.map(f=>[f.id,f.label]);
  const exFlag=actId=>`noiseShowA8Exception_${actId}`;
  const exValue=(actId,...ids)=>['noiseA8Ex',actId,...ids].join('_');
  const exceptionActs=root.NOISE_ARTICLE8_RULES.acts.filter(a=>a.hasExceptions||a.exceptionChecks?.length);
  const exceptionFlags=exceptionActs.map(a=>computed(exFlag(a.id),`a8-ex-${a.id}`));
  const exceptionFields=exceptionActs.flatMap(act=>{
    const fields=[];
    const show=when(exFlag(act.id));
    for(const check of act.exceptionChecks||[]){
      fields.push(select(exValue(act.id,check.id),`例外條件（須全部符合）｜${check.label}`,ynu,{displayWhen:show}));
    }
    for(const ex of act.exceptions||[]){
      const parent=exValue(act.id,ex.id);
      fields.push(select(parent,`例外情形｜${ex.label}`,ynu,{displayWhen:show}));
      for(const check of ex.checks||[]){
        fields.push(select(exValue(act.id,ex.id,check.id),`核准施工附帶規定｜${check.label}`,ynu,{displayWhen:{field:parent,value:'yes'}}));
      }
    }
    return fields;
  });
  const t={
    id:'noise-main',categoryId:'noise',caseTypeId:'noise-case',title:'噪音稽查－重建版',formTitle:'噪音案件判斷',
    version:'4.9-rebuild-4',moduleVersion:'4.9-rebuild-4',workflow:'noiseMain',choiceStyle:'cards',initialGate:true,
    validateOnSubmit:true,validationMessageField:'noiseValidation',workflowStatus:'noiseGuide',
    previewOnlyWhen:when('noiseBlocked'),previewOnlyMessage:'尚有必要事實未確認，暫不產生正式案件草稿。',
    fields:[
      computed('noiseShowA8','a8'),computed('noiseShowA8Disturbance','a8d'),computed('noiseShowA8Exception','a8e'),...exceptionFlags,
      computed('noiseShowAfterA8','afterA8'),computed('noiseShowA6Disturbance','a6d'),computed('noiseShowA9','a9'),computed('noiseShowOtherFacility','other'),computed('noiseShowMeasure','measure'),
      computed('noiseShowFull','full'),computed('noiseShowFullPoint','fullPoint'),computed('noiseShowSpeakerLocation','speakerLocation'),computed('noiseShowWeather','weather'),computed('noiseShowGeneralMethod','generalMethod'),computed('noiseShowSpeakerMode','speakerMode'),
      computed('noiseShowFullAssessment','fullAssessment'),computed('noiseShowConstructionFull','constructionFull'),computed('noiseShowLow','low'),computed('noiseShowConstructionLmax','lmax'),
      computed('noiseShowBgFull','bgfull'),computed('noiseShowBgLmax','bglmax'),computed('noiseShowBgLow','bglow'),computed('noiseBlocked','blocked'),computed('noiseValidation','validation'),computed('noiseRecord','record'),computed('noiseReply','reply'),
      field('noiseDate','第一步｜稽查日期','date',{format:'roc'}),field('noiseTime','稽查時間','time'),select('noiseZone','噪音管制區',zones),select('noiseHoliday','是否為例假日／國定假日',yn),
      select('noiseA8Act','第二步｜是否涉及新北市第8條公告禁止行為',acts,{displayWhen:when('noiseShowA8')}),
      select('noiseA8Disturbance','該行為是否已足以妨害他人生活環境安寧？',ynu,{displayWhen:when('noiseShowA8Disturbance')}),
      ...exceptionFields,
      computed('noiseA8ExceptionSummary','第8條例外條件研判',true,when('noiseShowA8Exception')),
      select('noiseSpecial','第三步｜主要噪音來源／主管機關分流',[
        ['ordinary','固定場所／工程／設施等一般噪音源'],['vehicle','使用中機動車輛'],['landTransport','快速道路、高速公路、鐵路或捷運等陸上運輸'],['civilAviation','民用航空器／民用機場'],['militaryAviation','軍用航空噪音']
      ],{displayWhen:when('noiseShowAfterA8')}),
      select('noiseNature','第四步｜一般噪音源是否具持續性且可量測？',[
        ['difficult','不具持續性或不易量測'],['measurable','具持續性，可依噪音量測程序確認']
      ],{displayWhen:{field:'noiseSpecial',value:'ordinary'}}),
      select('noiseA6Disturbance','該不具持續性／不易量測聲音是否足以妨害他人生活安寧？',ynu,{displayWhen:when('noiseShowA6Disturbance')}),
      select('noiseA9Type','第五步｜第9條噪音源類型',[
        ['factory','工廠（場）'],['entertainment','娛樂場所'],['business','營業場所'],['construction','營建工程'],['speaker','擴音設施'],['otherFacility','新北市公告之其他設施'],['renovation','非屬前述場所範圍之裝修工程'],['outside','不屬目前第9條列管場所／工程／設施']
      ],{displayWhen:when('noiseShowA9')}),
      select('noiseFacility','公告設施種類',facilities,{displayWhen:when('noiseShowOtherFacility')}),
      field('noiseSubject','稽查對象代稱','text',{displayWhen:when('noiseShowMeasure')}),field('noiseSource','主要噪音源／設備說明','text',{displayWhen:when('noiseShowMeasure')}),
      select('noiseBand','量測頻帶',[['full','全頻 20Hz～20kHz'],['low','低頻 20Hz～200Hz'],['both','全頻＋低頻']],{displayWhen:when('noiseShowMeasure')}),
      select('noiseGeneralMethod','全頻評定方法',[
        ['leq','非週期／非間歇性：Leq，連續取樣至少2分鐘'],['lmaxMean','週期／間歇且最大音量差≤5 dB：連續10次最大值平均'],['l5','週期／間歇且最大音量差>5 dB：至少20個最大值計算L5']
      ],{displayWhen:when('noiseShowGeneralMethod')}),
      select('noiseSpeakerMode','擴音設施型態',[
        ['fixed','固定式或停止移動：以Leq評定，連續取樣至少2分鐘'],['moving','移動性擴音設施：以通過時Lmax評定']
      ],{displayWhen:when('noiseShowSpeakerMode')}),
      select('noiseFullPoint','全頻測點',[['complainant','陳情人指定之居住生活地點'],['authority','陳情人不指定，由主管機關指定周界外測點']],{displayWhen:when('noiseShowFullPoint')}),
      select('noiseFullIndoor','全頻測點是否位於室內',yn,{displayWhen:{field:'noiseFullPoint',value:'complainant'}}),
      select('noiseSpeakerOutdoor','擴音設施實際量測點是否位於室外',yn,{displayWhen:when('noiseShowSpeakerLocation')}),
      select('noiseRain','室外量測時是否下雨',yn,{displayWhen:when('noiseShowWeather')}),field('noiseWind','室外量測風速（m/s）','text',{inputMode:'decimal',displayWhen:when('noiseShowWeather')}),
      field('noiseValueFull','全頻評定值（Leq／Lmax平均／L5／移動擴音Lmax）dB(A)','text',{inputMode:'decimal',displayWhen:when('noiseShowFullAssessment')}),
      field('noiseValueLeq','營建／公告工程全頻 Leq dB(A)','text',{inputMode:'decimal',displayWhen:when('noiseShowConstructionFull')}),
      field('noiseValueLmax','營建／公告工程全頻 Lmax dB(A)','text',{inputMode:'decimal',displayWhen:when('noiseShowConstructionLmax')}),
      field('noiseValueLow','低頻 Leq,LF dB(A)','text',{inputMode:'decimal',displayWhen:when('noiseShowLow')}),
      select('noiseBgFullMode','全頻背景音量處理',[['measured','已量測背景音量'],['uncooperative','負責人／現場人員無法配合，依法不修正並註明'],['pending','尚未完成背景音量確認']],{displayWhen:when('noiseShowBgFull')}),
      field('noiseBgFull','全頻背景音量 dB(A)','text',{inputMode:'decimal',displayWhen:{field:'noiseBgFullMode',value:'measured'}}),
      select('noiseBgLmaxMode','Lmax 背景音量處理',[['measured','已量測背景音量'],['uncooperative','負責人／現場人員無法配合，依法不修正並註明'],['pending','尚未完成背景音量確認']],{displayWhen:when('noiseShowBgLmax')}),
      field('noiseBgLmax','Lmax 背景音量 dB(A)','text',{inputMode:'decimal',displayWhen:{field:'noiseBgLmaxMode',value:'measured'}}),
      select('noiseBgLowMode','低頻背景音量處理',[['measured','已量測背景音量'],['uncooperative','負責人／現場人員無法配合，依法不修正並註明'],['pending','尚未完成背景音量確認']],{displayWhen:when('noiseShowBgLow')}),
      field('noiseBgLow','低頻背景音量 Leq,LF dB(A)','text',{inputMode:'decimal',displayWhen:{field:'noiseBgLowMode',value:'measured'}}),
      computed('noiseRouteText','主管機關／法規路徑',true),computed('noiseStandardText','適用標準',true,when('noiseShowMeasure')),computed('noiseMeasurementPointText','測量重點',true,when('noiseShowMeasure')),computed('noiseResultText','研判結果',true,when('noiseShowMeasure'))
    ],record:['{{noiseRecord}}'],reply:['{{noiseReply}}']
  };
  root.INSPECTION_CONFIG.templates.push(t);
})(window);
