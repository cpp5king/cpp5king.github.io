(function(root){
  'use strict';
  const maps={
    subject:{business:'水污法事業',sewerSystem:'污水下水道系統',buildingSewage:'建築物污水處理設施',nonBusiness:'一般民眾／其他非事業',unknown:'管制主體尚待確認'},
    industry:{construction:'營建工地',readyMix:'預拌混凝土（第9條所稱水泥業）',stoneProcessing:'土石加工業',stoneExtraction:'土石採取業',mining:'採礦業',earthworkDump:'土石方堆（棄）置場',livestock:'畜牧業',other:'其他事業',unknown:'業別尚待確認'},
    matter:{wastewater:'廢（污）水',sludge:'污泥',acidAlkaliWasteLiquid:'酸鹼廢液',waterFertilizer:'水肥',garbage:'垃圾',constructionWaste:'建築廢料',otherPollutant:'其他污染物',unknown:'污染物性質尚待確認'},
    destination:{surfaceWater:'地面水體',sewer:'污水下水道',storage:'貯留',reuse:'回收使用',outsourced:'委外處理',soil:'土壤',groundwater:'地下／疑似地下水體',unknown:'最終去向尚待確認'},
    surface:{river:'河川',ocean:'海洋',lake:'湖潭',reservoir:'水庫',pond:'池塘',irrigationChannel:'灌溉渠道',drainage:'各級排水路',roadsideDitch:'道路側溝',other:'其他疑似地面水體',unknown:'地面水體類型尚待確認'},
    source:{manufacturing:'製造製程',operation:'操作過程',naturalResource:'自然資源開發',workEnvironment:'作業環境',domestic:'生活污水',cleaning:'清洗水',cooling:'冷卻水',rain:'雨水',groundwater:'地下水',other:'其他',unknown:'來源尚待確認'},
    yesno:{yes:'是',no:'否',unknown:'尚待確認'}
  };
  const label=(map,key)=>maps[map]?.[key]||'';
  const list=(map,values)=>Array.isArray(values)?values.map(x=>label(map,x)).filter(Boolean).join('、'):'';
  const firstLine=text=>String(text||'').split('\n')[0].trim();
  const rocDate=iso=>{
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));
    if(!m)return '';
    return `${Number(m[1])-1911}年${Number(m[2])}月${Number(m[3])}日`;
  };
  function describe(input){
    const parts=[];
    const date=rocDate(input.waterInspectionDate); if(date)parts.push(`本局於${date}派員進行水污染查察。`); else parts.push('本次進行水污染查察。');
    if(input.waterSubjectType){
      let subject=label('subject',input.waterSubjectType);
      if(input.waterSubjectType==='business'&&input.waterIndustryType)subject+=`，實際業別初步確認為${label('industry',input.waterIndustryType)}`;
      parts.push(`查察對象為${subject}。`);
    }
    if(input.fieldOperationStatus){
      const op={operating:'現場正在營運／作業',temporarilyStopped:'現場暫停作業但有近期操作跡象',notOperating:'現場目前未營運',unknown:'現場營運狀態尚待確認'}[input.fieldOperationStatus];
      if(op)parts.push(`${op}。`);
    }
    if(input.waterMatterType){
      const matter=label('matter',input.waterMatterType); const sources=list('source',input.waterSourceTypes);
      parts.push(`本次查察物質初步辨識為${matter}${sources?`，主要來源包括${sources}`:''}。`);
    }
    if(input.waterDestination){
      let dest=label('destination',input.waterDestination);
      if(input.waterDestination==='surfaceWater'&&input.waterSurfaceType)dest+=`（${label('surface',input.waterSurfaceType)}）`;
      parts.push(`追查最終去向為${dest}${input.waterActualDischarge?`，實際向外排放：${label('yesno',input.waterActualDischarge)}`:''}。`);
    }
    if(input.waterDischargePermit)parts.push(`排放許可狀態：${{valid:'有有效排放許可／簡易排放許可文件',none:'查無有效排放許可',expired:'許可已逾有效期間',unknown:'許可狀態尚待確認'}[input.waterDischargePermit]||input.waterDischargePermit}。`);
    const permitLine=root.WaterPermitCheck?.documentLine?.(input); if(permitLine)parts.push(permitLine);
    if(input.waterArticle28Scenario==='yes')parts.push(`現場另有設備疏漏／事故態樣，原因為${{tankFailure:'槽體破裂／失效',pipeFailure:'管線破裂／失效',overflow:'設備或槽體溢流',levelFailure:'液位控制故障',otherEquipmentFailure:'其他設備故障／疏漏',humanDischarge:'人為開閥／私管／主動抽排',unknown:'原因尚待確認'}[input.waterLeakCause]||'尚待確認'}。`);
    if(input.waterSampleTaken)parts.push(`採樣情形：${input.waterSampleTaken==='yes'?'已採樣':input.waterSampleTaken==='no'?'本次未採樣':'是否採樣尚待確認'}${input.waterLabResultAvailable==='yes'&&input.waterEffluentExceeded?`；檢測結果是否超標：${label('yesno',input.waterEffluentExceeded)}`:''}。`);
    return parts.join('');
  }
  function build(input={},facts={}){
    const body=describe(input);
    const conclusion=String(input.waterFinalConclusionText||'').trim();
    const overview=String(input.waterRulesOverviewText||'').trim();
    const record=[body,conclusion?`【初步研判】\n${conclusion}`:'',overview?`【規則摘要】\n${overview}`:''].filter(Boolean).join('\n\n');
    const c=firstLine(conclusion);
    let reply=`有關反映水污染情形，本局已派員進行查察。${body.replace(/^本局於[^。]+派員進行水污染查察。|^本次進行水污染查察。/,'')}`;
    if(c.startsWith('D｜'))reply+=' 現場已優先處理污染控制及後續查證事項。';
    else if(c.startsWith('B｜'))reply+=' 本局將依查察所得事證及相關規定續處。';
    else if(c.startsWith('C｜'))reply+=' 目前仍有事項待進一步查證，本局將依相關規定續辦。';
    else if(c.startsWith('A｜'))reply+=' 依本次查察所得事證，尚無足資認定違反水污染防治法之事證。';
    else reply+=' 後續將依查察所得事證及相關規定辦理。';
    return {recordText:record||'本次水污染查察尚無足夠資料產生案件文字。',replyText:reply};
  }
  root.WaterDocuments={build};
})(typeof window==='undefined'?globalThis:window);
