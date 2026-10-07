(function(root){
  'use strict';

  const META=Object.freeze({
    id:'NIEA-W109.54B',
    title:'事業放流水採樣方法',
    code:'NIEA W109.54B',
    announcedAt:'2024-09-12',
    effectiveFrom:'2024-12-15',
    source:'使用者提供之環境部公告方法 PDF',
    scope:['事業','污水下水道系統','建築物污水處理設施'],
    externalReferences:[
      '水質檢測方法總則(NIEA W102.5)',
      '環境檢驗器品清洗及校正指引(NIEA PA-106)',
      '各待測物檢測方法'
    ],
    policy:'本模組僅將 NIEA W109.54B 可直接確認之採樣程序規則化；容器、水樣需要量、保存劑、保存條件與保存期限如須依 W102.5 或各待測物方法決定，維持「待依適用方法確認」，不自行補值。'
  });

  const SUBJECTS=Object.freeze([
    ['industry','事業'],
    ['sewer','污水下水道系統'],
    ['building','建築物污水處理設施']
  ]);
  const OUTLETS=Object.freeze([
    ['permitted','許可排放口'],
    ['nonPermitted','非許可排放口']
  ]);
  const SAMPLING_MODES=Object.freeze([
    ['grab','抓樣'],
    ['composite','混樣']
  ]);
  const EQUIPMENT=Object.freeze([
    ['manual','手動採水設備'],
    ['autoGrab','自動抓樣設備'],
    ['autoComposite','自動混樣採水設備']
  ]);
  const TRI=Object.freeze([
    ['yes','是，已確認'],
    ['no','否，已確認未完成／不符合'],
    ['unknown','尚待確認']
  ]);

  function empty(){
    return {
      subjectType:'',
      outletType:'',
      samplingLocation:'',
      coordinates:'',
      sampleId:'',
      sampleDate:'',
      sampleTime:'',
      sampleDescription:'放流水',
      sampleCount:'',
      analysisItems:'',
      samplingMode:'',
      samplingEquipment:'',
      special:{
        totalResidualChlorine:false,
        temperature:false,
        ph:false,
        chromiumVI:false,
        ammoniaElectrode:false,
        alkalinity:false,
        conductivity:false,
        dissolvedOxygen:false,
        sulfide:false,
        oilGrease:false,
        toc:false,
        voc:false,
        microbiology:false,
        dissolvedFeMn:false,
        otherShortHolding:false,
        otherNoMix:false
      },
      preflight:{
        representativePlan:'',
        equipmentClean:'',
        containerConfirmed:'',
        preservativeConfirmed:'',
        sufficientVolume:'',
        safetyChecked:'',
        temperatureMeter:'',
        phMeter:'',
        vocContainer:'',
        microbiologyContainer:'',
        filterReady:''
      },
      execution:{
        autoTubeInEffluent:'',
        autoCollectionProtected:'',
        autoSettingsConfirmed:'',
        bottleTight:'',
        splitRequired:'',
        splitMixed:'',
        vocNoHeadspace:'',
        compositeSubsamplesCold:'',
        compositeLastSampleTime:'',
        dissolvedFiltered:'',
        fieldTemperature:'',
        fieldPh:'',
        fieldConductivity:'',
        fieldDo:'',
        fieldResidualChlorine:''
      },
      preservation:{
        sampleContainer:'',
        preservationMethod:'',
        preservativeAdded:'',
        chilled:'',
        transportPackaged:'',
        coolingMode:'',
        coolingOther:'',
        noDryIce:''
      },
      label:{
        sampleId:false,
        samplerUnit:false,
        dateTime:false,
        location:false,
        preservative:false,
        analysisItems:false
      },
      seal:{
        attached:false,
        tamperEvident:false,
        signed:false
      },
      qc:{
        equipmentReused:false,
        fieldBlank:'',
        equipmentBlank:'',
        tripBlank:''
      },
      samplerName:'',
      samplerUnit:'',
      notes:''
    };
  }

  const bool=v=>v===true;
  const text=v=>String(v??'').trim();
  const triMissing=(value,label,missing,issues)=>{
    if(value==='yes')return;
    if(value==='no')issues.push(label+'：已確認未完成／不符合。');
    else missing.push(label+'：尚待確認。');
  };

  function compositeRestrictions(s){
    const x=s.special||{};
    const groups=[];
    if(x.totalResidualChlorine||x.temperature||x.ph)groups.push('須現場檢測項目（總餘氯／水溫／pH）');
    if(x.chromiumVI||x.ammoniaElectrode||x.alkalinity||x.otherShortHolding)groups.push('最長保存期限24小時以下項目');
    if(x.conductivity||x.dissolvedOxygen||x.sulfide||x.oilGrease||x.toc||x.voc||x.otherNoMix)groups.push('不可攪動或不適宜混樣項目');
    if(x.microbiology)groups.push('微生物樣品');
    return groups;
  }

  function requiredQc(s){
    const req=[];
    if(s.special?.voc)req.push({key:'fieldBlank',label:'現場空白樣品',reason:'檢測水中揮發性有機化合物時，每批次採樣行程至少製備1件。'});
    if(s.qc?.equipmentReused)req.push({key:'equipmentBlank',label:'設備空白樣品',reason:'同一採樣行程重複使用採樣容器或圓筒，且採樣過程無法依規定清洗時應製備。'});
    if(s.special?.voc||s.special?.microbiology)req.push({key:'tripBlank',label:'運送空白樣品',reason:'檢測水中揮發性有機化合物或微生物樣品時，每批次採樣行程至少製備1件。'});
    return req;
  }

  function evaluate(input){
    const s=input||empty(), missing=[], issues=[], warnings=[], reminders=[];

    if(!SUBJECTS.some(x=>x[0]===s.subjectType))missing.push('適用對象尚未確認。');
    if(!OUTLETS.some(x=>x[0]===s.outletType))missing.push('採樣點屬許可或非許可排放口尚未確認。');
    if(!text(s.samplingLocation)&&!text(s.coordinates))missing.push('採樣地點或座標至少需記錄一項。');
    if(!text(s.sampleId))missing.push('樣品編號尚未記錄。');
    if(!text(s.sampleDate)||!text(s.sampleTime))missing.push('採樣日期及時間尚未完整記錄。');
    if(!text(s.sampleDescription))missing.push('樣品種類尚未記錄。');
    if(!text(s.sampleCount))missing.push('樣品數量尚未記錄。');
    if(!text(s.analysisItems))missing.push('分析／檢測項目尚未記錄。');
    if(!SAMPLING_MODES.some(x=>x[0]===s.samplingMode))missing.push('採樣方式（抓樣／混樣）尚未確認。');
    if(!EQUIPMENT.some(x=>x[0]===s.samplingEquipment))missing.push('採樣器材尚未記錄。');
    if(!text(s.samplerName)||!text(s.samplerUnit))missing.push('採樣人員姓名及所屬單位尚未完整記錄。');

    triMissing(s.preflight?.representativePlan,'代表性水樣規劃',missing,issues);
    triMissing(s.preflight?.equipmentClean,'採樣設備／容器清洗',missing,issues);
    triMissing(s.preflight?.containerConfirmed,'依待測物方法確認樣品容器',missing,issues);
    triMissing(s.preflight?.preservativeConfirmed,'依待測物方法確認保存方式／保存劑',missing,issues);
    triMissing(s.preflight?.sufficientVolume,'足量樣品規劃',missing,issues);
    triMissing(s.preflight?.safetyChecked,'採樣安全評估',missing,issues);

    if(s.special?.temperature)triMissing(s.preflight?.temperatureMeter,'溫度計最小刻度0.1℃',missing,issues);
    if(s.special?.ph)triMissing(s.preflight?.phMeter,'pH計最小刻度0.01且具溫度補償',missing,issues);
    if(s.special?.voc)triMissing(s.preflight?.vocContainer,'VOC採樣容器規格',missing,issues);
    if(s.special?.microbiology)triMissing(s.preflight?.microbiologyContainer,'微生物無菌容器規格',missing,issues);
    if(s.special?.dissolvedFeMn)triMissing(s.preflight?.filterReady,'溶解性鐵／錳現場過濾裝置',missing,issues);

    if(s.samplingMode==='composite'){
      const restrictions=compositeRestrictions(s);
      if(restrictions.length)warnings.push('混樣風險：本次包含一般不適宜混樣之'+restrictions.join('、')+'；應改採適當方式或再依個別檢測方法確認。');
      triMissing(s.execution?.compositeSubsamplesCold,'混樣子樣品冷藏',missing,issues);
      if(!text(s.execution?.compositeLastSampleTime))missing.push('混樣最後一個子樣品採集時間尚未記錄；本方法以此作為混樣樣品採樣時間。');
    }

    if(s.samplingEquipment==='autoGrab'||s.samplingEquipment==='autoComposite'){
      triMissing(s.execution?.autoTubeInEffluent,'自動採水設備採樣管置於放流水中',missing,issues);
      triMissing(s.execution?.autoCollectionProtected,'自動採水設備收集管置於不受污染位置',missing,issues);
      triMissing(s.execution?.autoSettingsConfirmed,'自動取樣／混樣條件設定',missing,issues);
      triMissing(s.execution?.bottleTight,'採樣後樣品瓶蓋緊',missing,issues);
    }

    if(s.execution?.splitRequired==='yes')triMissing(s.execution?.splitMixed,'分裝前足量水樣已混合均勻',missing,issues);
    if(s.execution?.splitRequired==='')missing.push('是否需要分裝樣品尚未確認。');
    if(s.special?.voc)triMissing(s.execution?.vocNoHeadspace,'VOC樣品未預留運送膨脹空間',missing,issues);
    if(s.special?.dissolvedFeMn)triMissing(s.execution?.dissolvedFiltered,'溶解性鐵／錳已於現場過濾',missing,issues);

    if(s.special?.temperature&&!text(s.execution?.fieldTemperature))missing.push('現場水溫結果尚未記錄。');
    if(s.special?.ph&&!text(s.execution?.fieldPh))missing.push('現場pH結果尚未記錄。');
    if(s.special?.conductivity&&!text(s.execution?.fieldConductivity))missing.push('現場導電度結果尚未記錄。');
    if(s.special?.dissolvedOxygen&&!text(s.execution?.fieldDo))missing.push('現場溶氧結果尚未記錄。');
    if(s.special?.totalResidualChlorine&&!text(s.execution?.fieldResidualChlorine))missing.push('現場總餘氯結果尚未記錄。');

    if(!text(s.preservation?.sampleContainer))missing.push('樣品容器尚未記錄。');
    if(!text(s.preservation?.preservationMethod))missing.push('實際保存方式尚未記錄。');
    if(!text(s.preservation?.preservativeAdded))missing.push('添加保存劑情形尚未記錄；未添加時亦應記錄。');
    triMissing(s.preservation?.chilled,'樣品移入冷藏設備保存及運送',missing,issues);
    triMissing(s.preservation?.transportPackaged,'樣品運送包裝妥適',missing,issues);
    if(!['iceWaterBath','other'].includes(s.preservation?.coolingMode))missing.push('運送冷藏方式尚未確認。');
    if(s.preservation?.coolingMode==='other'&&!text(s.preservation?.coolingOther))missing.push('其他適當冷藏方式尚未說明。');
    triMissing(s.preservation?.noDryIce,'未使用乾冰',missing,issues);

    const labelMap=[
      ['sampleId','標籤：樣品編號'],
      ['samplerUnit','標籤：採樣者姓名及所屬單位'],
      ['dateTime','標籤：採樣日期及時間'],
      ['location','標籤：採樣地點'],
      ['preservative','標籤：添加保存劑'],
      ['analysisItems','標籤：檢測項目']
    ];
    for(const [key,label] of labelMap)if(!bool(s.label?.[key]))missing.push(label+'尚未確認已記載。');
    if(!bool(s.seal?.attached))missing.push('樣品封條尚未確認已黏貼。');
    if(!bool(s.seal?.tamperEvident))missing.push('封條是否具開封可辨識性尚未確認。');
    if(!bool(s.seal?.signed))missing.push('現場採樣人員尚未確認於封條簽章。');

    for(const req of requiredQc(s)){
      const value=s.qc?.[req.key];
      if(value==='no')issues.push(req.label+'：已確認未製備。');
      else if(value!=='yes')missing.push(req.label+'：尚未確認是否已製備。');
    }

    reminders.push('若放流水樣品檢測值介於放流水法規標準值100%至120%，除檢測方法另有規定外，應執行已製備空白樣品之檢測。');
    reminders.push('容器、水樣需要量、保存劑、保存條件及保存期限仍應依各待測物檢測方法或 NIEA W102.5 確認，本模組不自行補值。');
    if(s.special?.dissolvedFeMn)reminders.push('溶解性鐵、錳等水樣須於採樣現場進行過濾處理。');
    if(s.samplingMode==='grab')reminders.push('抓樣反映採樣當時污染物之瞬間濃度。');
    if(s.samplingMode==='composite')reminders.push('混樣反映一段時間之平均濃度，混合後視為一個樣品。');

    const status=issues.length?'risk':missing.length?'pending':'complete';
    return {status,issues,missing,warnings,reminders,requiredQc:requiredQc(s),compositeRestrictions:compositeRestrictions(s)};
  }

  function summary(s){
    const e=evaluate(s);
    const subject=SUBJECTS.find(x=>x[0]===s.subjectType)?.[1]||'尚未確認';
    const outlet=OUTLETS.find(x=>x[0]===s.outletType)?.[1]||'尚未確認';
    const mode=SAMPLING_MODES.find(x=>x[0]===s.samplingMode)?.[1]||'尚未確認';
    const equipment=EQUIPMENT.find(x=>x[0]===s.samplingEquipment)?.[1]||'尚未確認';
    const lines=[
      '事業放流水採樣｜NIEA W109.54B',
      '適用對象：'+subject,
      '採樣點：'+outlet+'；'+(text(s.samplingLocation)||'地點未填')+(text(s.coordinates)?'；座標 '+text(s.coordinates):''),
      '樣品編號：'+(text(s.sampleId)||'未填')+'；日期時間：'+(text(s.sampleDate)||'未填')+' '+(text(s.sampleTime)||'未填'),
      '樣品種類／數量：'+(text(s.sampleDescription)||'未填')+'／'+(text(s.sampleCount)||'未填'),
      '檢測項目：'+(text(s.analysisItems)||'未填'),
      '採樣方式／器材：'+mode+'／'+equipment,
      '樣品容器：'+(text(s.preservation?.sampleContainer)||'未填'),
      '保存方式：'+(text(s.preservation?.preservationMethod)||'未填'),
      '保存劑：'+(text(s.preservation?.preservativeAdded)||'未填'),
      '採樣人員：'+(text(s.samplerName)||'未填')+'／'+(text(s.samplerUnit)||'未填'),
      '程序檢核：'+(e.status==='complete'?'程序檢核完整':e.status==='risk'?'有已確認程序風險':'尚有程序事項待確認')
    ];
    if(e.issues.length)lines.push('【已確認風險】',...e.issues.map(x=>'• '+x));
    if(e.missing.length)lines.push('【待確認】',...e.missing.map(x=>'• '+x));
    if(e.warnings.length)lines.push('【方法提醒】',...e.warnings.map(x=>'• '+x));
    return lines.join('\n');
  }

  root.WaterSamplingW10954B=Object.freeze({
    meta:()=>META,
    subjects:()=>SUBJECTS.map(x=>x.slice()),
    outlets:()=>OUTLETS.map(x=>x.slice()),
    samplingModes:()=>SAMPLING_MODES.map(x=>x.slice()),
    equipment:()=>EQUIPMENT.map(x=>x.slice()),
    tri:()=>TRI.map(x=>x.slice()),
    empty,
    evaluate,
    summary,
    requiredQc,
    compositeRestrictions
  });
})(window);
