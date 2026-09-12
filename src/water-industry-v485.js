(function(root){
  'use strict';
  const VERSION='4.8.5';
  const MISSING='尚待確認';
  const article9Types=new Set(['mining','stoneExtraction','stoneProcessing','readyMix','earthworkDump','construction']);
  const highTechTypes=new Set(['semiconductor','optoelectronics','pcb','electroplating','metalSurface']);
  const foodHotelTypes=new Set(['restaurant','touristHotel']);
  const triOptions=[
    {id:'yes',label:'是，已確認',value:'是，已確認'},
    {id:'no',label:'否，已確認不是／不符合',value:'否，已確認不是／不符合'},
    {id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'}
  ];
  const ynOptions=[
    {id:'yes',label:'是',value:'是'},
    {id:'no',label:'否',value:'否'},
    {id:'unknown',label:'已查證但目前仍無法確認',value:'已查證但目前仍無法確認'}
  ];
  const option=(id,label)=>({id,label,value:label});
  const select=(id,label,options,showWhen)=>({id,label,type:'select',missing:MISSING,allowCustom:false,options,showWhen});
  const computed=(id,label=id,extra={})=>({id,label,type:'computed',missing:MISSING,...extra});
  const when=(field,value='yes')=>({field,value});
  const inWhen=(field,value)=>({field,operator:'in',value});
  const checklist=(id,label,items,showWhen)=>({
    id,label,type:'checklist',missing:MISSING,separator:'、',showWhen,
    items:items.map(item=>({id:item.id,label:item.label,...(item.exclusive?{exclusive:true}:{})}))
  });
  const industryOptions=[
    option('construction','營建工地'),option('readyMix','水泥業（本辦法第9條所稱預拌混凝土）'),
    option('stoneProcessing','土石加工業'),option('stoneExtraction','土石採取業'),option('mining','採礦業'),option('earthworkDump','土石方堆（棄）置場'),
    option('shipDismantling','船舶解體業'),option('livestock','畜牧業'),option('waterworks','自來水廠'),option('restaurant','餐飲業'),option('touristHotel','觀光旅館（飯店）'),
    option('dialysisClinic','洗腎診所'),option('coalPower','使用燃煤之發電廠'),option('semiconductor','晶圓製造及半導體製造業'),
    option('optoelectronics','光電材料及元件製造業'),option('pcb','印刷電路板製造業'),option('electroplating','電鍍業'),option('metalSurface','金屬表面處理業'),
    option('other','其他事業'),option('unknown','尚待確認')
  ];

  const newFieldIds=[
    'waterConstructionVisibleSedimentFound','waterConstructionSedimentCleanedCompliant','waterConstructionWasteOilFound','waterConstructionWasteOilHandledCompliant','waterConstructionCleanupRecordsCompliant',
    'waterShipContainmentCompliant','waterShipOilBoomCompliant','waterShipReceivingFacilitiesCompliant',
    'waterLivestockFishIntegratedUse','waterLivestockFishDailyVolumeCompliant','waterLivestockFishStockingCompliant','waterLivestockFishDOCompliant','waterLivestockFishFreeboardCompliant','waterLivestockFishRecordsCompliant','waterLivestockFishNoticeCompliant',
    'waterLivestockPigCattleResourceApplicable','waterLivestockResourceMeasureApproved','waterLivestockResourceRatioCompliant','waterLivestockSmallPigPlanApplicable','waterLivestockSmallPigPlanApproved','waterLivestockSmallPigPlanOperationCompliant',
    'waterLivestockFertilizerPauseCondition','waterLivestockFertilizerPauseCompliant',
    'waterWaterworksEmergencyDischargeUsed','waterWaterworksEmergencyConditionsMet','waterWaterworksEmergencyRegistered','waterWaterworksBasinsEmptied','waterWaterworksNoticeCompliant','waterWaterworksDailyMonitoringCompliant',
    'waterFoodServiceProvided','waterGreaseTrapPresent','waterGreaseTrapMaintenanceRecordsCompliant','waterHotSpringServiceProvided','waterHotSpringSeparatedCollectionCompliant','waterHotSpringMudSpring','waterHotSpringFiltersCompliant','waterHotSpringMaintenanceRecordsCompliant',
    'waterDialysisManagementPlanApproved','waterDialysisOperationMatchesPlan',
    'waterCoalMercuryRecordsCompliant','waterCoalMercuryReportingCompliant','waterCoalMercuryThresholdExceeded','waterCoalMercuryPlanApproved','waterCoalMercuryPlanImplemented',
    'waterHighTech49_9Trigger','waterHighTechRequiredStreamsText','waterHighTechSeparatedCollectionCompliant',
    'waterSpecialOperationTypes','waterSpecialOrganic','waterSpecialResidual','waterSpecialBat','waterOrganicLeakPreventionCompliant','waterOrganicInspectionRecordsCompliant','waterResidualDailyRecordsCompliant','waterBatPermitActivity','waterBatEvaluationConfirmed'
  ];

  function addOnFields(){
    const fields=[];
    fields.push(
      select('waterConstructionVisibleSedimentFound','營建工地周圍排水溝排放管線底部、進入水體處或周圍環境，是否形成可見沉積污泥？',ynOptions,when('waterIndustryType','construction')),
      select('waterConstructionSedimentCleanedCompliant','發現可見沉積污泥後，是否已清除或依主管機關命令於三日內清除？',triOptions,when('waterConstructionVisibleSedimentFound','yes')),
      select('waterConstructionWasteOilFound','施工機具／車輛維修保養是否有廢機油、潤滑油、柴油等棄置或溢洩？',ynOptions,when('waterIndustryType','construction')),
      select('waterConstructionWasteOilHandledCompliant','前述廢油是否以適當儲存設備收集處理，未隨廢（污）水／逕流廢水排放或溢流至作業環境外？',triOptions,when('waterConstructionWasteOilFound','yes')),
      select('waterConstructionCleanupRecordsCompliant','沉積污泥清除／廢油收集處理之時間、方法、紀錄及妥善處理證明文件是否符合？',triOptions,when('waterIndustryType','construction')),

      select('waterShipContainmentCompliant','拆解場所四週截流設施，或經主管機關同意之替代防堵設施，是否符合？',triOptions,when('waterIndustryType','shipDismantling')),
      select('waterShipOilBoomCompliant','作業區域周圍水面是否有佈設浮油攔除設備？',triOptions,when('waterIndustryType','shipDismantling')),
      select('waterShipReceivingFacilitiesCompliant','作業區域是否有適當之廢油、廢水及其他污染物收受設施？',triOptions,when('waterIndustryType','shipDismantling')),

      select('waterLivestockFishIntegratedUse','是否採漁牧綜合經營？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockFishDailyVolumeCompliant','每日排放至每公頃魚池之廢水量是否在4立方公尺以下？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishStockingCompliant','每公頃魚池承受之豬隻廢水量是否不超過200頭豬隻？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishDOCompliant','魚池溶氧是否達1.0 mg/L以上？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishFreeboardCompliant','非雨季期間魚池最高液面距池頂是否維持30公分以上？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishRecordsCompliant','畜舍清洗、排入魚池水量及魚池排放時間等紀錄是否完整並保存三年？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockFishNoticeCompliant','魚池廢水排放前三日是否已主動通知主管機關？',triOptions,when('waterLivestockFishIntegratedUse','yes')),
      select('waterLivestockPigCattleResourceApplicable','是否屬飼養豬隻或牛隻，需檢核畜牧糞尿資源化處理措施？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockResourceMeasureApproved','是否至少採行一項依法核准之畜牧糞尿資源化處理措施？',triOptions,when('waterLivestockPigCattleResourceApplicable','yes')),
      select('waterLivestockResourceRatioCompliant','依法適用之畜牧糞尿資源化處理比率是否符合？',triOptions,when('waterLivestockPigCattleResourceApplicable','yes')),
      select('waterLivestockSmallPigPlanApplicable','是否屬飼養豬隻20頭以上未滿200頭之畜牧業？',ynOptions,when('waterIndustryType','livestock')),
      select('waterLivestockSmallPigPlanApproved','該小型養豬場廢（污）水管理計畫是否已依法核准？',triOptions,when('waterLivestockSmallPigPlanApplicable','yes')),
      select('waterLivestockSmallPigPlanOperationCompliant','現場運作是否符合核准之廢（污）水管理計畫？',triOptions,when('waterLivestockSmallPigPlanApplicable','yes')),
      select('waterLivestockFertilizerPauseCondition','目前是否有依法應暫停沼液沼渣農地肥分使用之情形（如大雨／豪雨特報期間等）？',ynOptions,when('waterShowIndustryLivestockFertilizer','yes')),
      select('waterLivestockFertilizerPauseCompliant','應暫停期間是否確實停止沼液沼渣農地肥分使用？',triOptions,when('waterLivestockFertilizerPauseCondition','yes')),

      select('waterWaterworksEmergencyDischargeUsed','本次是否以豪雨／天然災害緊急應變條件直接排放？',ynOptions,when('waterIndustryType','waterworks')),
      select('waterWaterworksEmergencyConditionsMet','是否已確認豪雨特報／天然災害、原水SS或濁度超過2000，且致廢水處理設施無法正常操作？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksEmergencyRegistered','緊急應變措施是否已納入水措計畫核准文件或許可證（文件）？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksBasinsEmptied','沉澱池及污泥濃縮池是否已先淨空？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksNoticeCompliant','排放前是否通知下游用水者並通報當地主管機關？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),
      select('waterWaterworksDailyMonitoringCompliant','排放期間是否按日檢測並記錄原水濁度、SS及放流水SS，並保存紀錄？',triOptions,when('waterWaterworksEmergencyDischargeUsed','yes')),

      select('waterFoodServiceProvided','是否提供餐飲服務？',ynOptions,inWhen('waterIndustryType',['restaurant','touristHotel'])),
      select('waterGreaseTrapPresent','餐飲廢水是否設置油脂截留設施？',triOptions,when('waterFoodServiceProvided','yes')),
      select('waterGreaseTrapMaintenanceRecordsCompliant','油脂截留設施是否定期清理維護並保存三年紀錄？',triOptions,when('waterFoodServiceProvided','yes')),
      select('waterHotSpringServiceProvided','是否提供溫泉泡湯服務？',ynOptions,inWhen('waterIndustryType',['restaurant','touristHotel'])),
      select('waterHotSpringSeparatedCollectionCompliant','單純泡湯廢水是否依規定與其他作業廢水分流收集處理？',triOptions,when('waterHotSpringServiceProvided','yes')),
      select('waterHotSpringMudSpring','本案泉質是否屬泥漿泉質？',ynOptions,when('waterHotSpringServiceProvided','yes')),
      select('waterHotSpringFiltersCompliant','非泥漿泉之單純泡湯廢水，毛髮過濾及懸浮固體過濾設施是否符合？',triOptions,when('waterHotSpringMudSpring','no')),
      select('waterHotSpringMaintenanceRecordsCompliant','相關油脂截留／毛髮／懸浮固體過濾設施之清理維護及三年紀錄是否符合？',triOptions,when('waterHotSpringServiceProvided','yes')),

      select('waterDialysisManagementPlanApproved','洗腎診所營運前之廢（污）水管理計畫是否已核准？',triOptions,when('waterIndustryType','dialysisClinic')),
      select('waterDialysisOperationMatchesPlan','現場是否依核准之廢（污）水管理計畫實施？',triOptions,when('waterIndustryType','dialysisClinic')),

      select('waterCoalMercuryRecordsCompliant','燃煤來源、總汞含量、每日（次）使用量及每月統計等紀錄是否符合並保存三年？',triOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryReportingCompliant','每年一月及七月底前之前半年燃煤來源、總汞含量及使用量網路申報是否符合？',triOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryThresholdExceeded','是否達需提出汞總量管理計畫之門檻？',ynOptions,when('waterIndustryType','coalPower')),
      select('waterCoalMercuryPlanApproved','達門檻時，汞總量管理計畫是否已經主管機關審查核准？',triOptions,when('waterCoalMercuryThresholdExceeded','yes')),
      select('waterCoalMercuryPlanImplemented','是否依核准之汞總量管理計畫執行？',triOptions,when('waterCoalMercuryThresholdExceeded','yes')),

      select('waterHighTech49_9Trigger','是否符合第49條之9第1項任一分流收集處理觸發情形？',ynOptions,inWhen('waterIndustryType',['semiconductor','optoelectronics','pcb','electroplating','metalSurface'])),
      computed('waterHighTechRequiredStreamsText','本業別應分流之作業廢水',{display:true,showWhen:when('waterHighTech49_9Trigger','yes'),className:'live-assessment'}),
      select('waterHighTechSeparatedCollectionCompliant','應分流之作業廢水是否已分流收集處理？',triOptions,when('waterHighTech49_9Trigger','yes')),

      checklist('waterSpecialOperationTypes','本案是否涉及下列跨業別特殊作業？（有才勾，可複選）',[
        {id:'organicGroundwaterPollutant',label:'貯存／輸送地下水污染管制標準有機污染物'},
        {id:'constructionResidualReceiving',label:'收容處理特定淤泥／高含水土壤／皂土等營建剩餘土石方'},
        {id:'batPermitReview',label:'附表五業別規模之水措／許可申請、變更或展延'},
        {id:'none',label:'均未涉及',exclusive:true},{id:'unknown',label:'尚待確認',exclusive:true}
      ],when('waterShowIndustryChoice','yes')),
      computed('waterSpecialOrganic'),computed('waterSpecialResidual'),computed('waterSpecialBat'),
      select('waterOrganicLeakPreventionCompliant','有機污染物貯存／輸送設施之防滲漏材質及防範措施是否符合？',triOptions,when('waterSpecialOrganic','yes')),
      select('waterOrganicInspectionRecordsCompliant','定期巡查檢視紀錄是否完整並保存三年？',triOptions,when('waterSpecialOrganic','yes')),
      select('waterResidualDailyRecordsCompliant','車輛進出、土質種類、收容量及處理量是否每日記錄並保存三年？',triOptions,when('waterSpecialResidual','yes')),
      select('waterBatPermitActivity','本案附表五最佳可行控制技術檢核情境',[option('application','申請水措計畫／許可'),option('change','變更水措計畫／許可'),option('extension','展延許可'),option('notCurrent','本次非申請／變更／展延審查'),option('unknown','尚待確認')],when('waterSpecialBat','yes')),
      select('waterBatEvaluationConfirmed','於申請／變更／展延時，是否已依附表五優先評估最佳可行控制技術？',triOptions,inWhen('waterBatPermitActivity',['application','change','extension']))
    );
    return fields;
  }

  function patchTemplate(template){
    if(!template||!['water-field','water-main'].includes(template.id))return;
    template.version=VERSION;
    template.fields=template.fields.filter(field=>field.id!=='waterIndustryCheckMode'&&!newFieldIds.includes(field.id));
    const industry=template.fields.find(field=>field.id==='waterIndustryType');
    if(industry){
      industry.label='實際業別（系統依業別自動載入附加檢查）';
      industry.options=industryOptions;
      industry.showWhen=when('waterShowIndustryChoice','yes');
    }
    const overview=template.fields.find(field=>field.id==='waterIndustryOverviewText');
    if(overview){overview.label='特定業別附加檢查';overview.displayWhen=when('waterShowIndustry','yes');}
    let insertAt=template.fields.findIndex(field=>field.id==='waterIndustryOverviewText');
    if(insertAt<0){
      const industryAt=template.fields.findIndex(field=>field.id==='waterIndustryType');
      insertAt=industryAt>=0?industryAt+1:template.fields.length;
    }
    template.fields.splice(insertAt,0,...addOnFields());
  }

  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.waterIndustry485=function(config){
    for(const template of config.templates||[])patchTemplate(template);
  };

  const baseWorkflowApply=root.WaterWorkflow?.apply;
  if(typeof baseWorkflowApply==='function'&&!root.WaterWorkflow.__industry485){
    root.WaterWorkflow.apply=function(input,facts,out={}){
      const result=baseWorkflowApply(input,facts,out);
      result.waterShowIndustryChoice=facts.subjectIsBusiness==='yes'?'yes':'no';
      result.waterShowIndustry=result.waterShowIndustryChoice==='yes'&&!!input.waterIndustryType?'yes':'no';
      result.waterShowIndustryArticle9=result.waterShowIndustry==='yes'&&article9Types.has(input.waterIndustryType)?'yes':'no';
      result.waterShowIndustryConstruction=result.waterShowIndustry==='yes'&&input.waterIndustryType==='construction'?'yes':'no';
      result.waterShowIndustryLivestock=result.waterShowIndustry==='yes'&&input.waterIndustryType==='livestock'?'yes':'no';
      result.waterShowIndustryLivestockFertilizer=result.waterShowIndustryLivestock==='yes'&&input.waterLivestockFertilizerUse==='yes'?'yes':'no';
      const ops=Array.isArray(input.waterSpecialOperationTypes)?input.waterSpecialOperationTypes:[];
      result.waterSpecialOrganic=ops.includes('organicGroundwaterPollutant')?'yes':'no';
      result.waterSpecialResidual=ops.includes('constructionResidualReceiving')?'yes':'no';
      result.waterSpecialBat=ops.includes('batPermitReview')?'yes':'no';
      if(highTechTypes.has(input.waterIndustryType)){
        result.waterHighTechRequiredStreamsText=['semiconductor','optoelectronics','pcb'].includes(input.waterIndustryType)
          ?'§49-9：研磨／切割、含氟、TMAH有機、含氰、含鉻及含銅作業廢水，於觸發條件成立時應分流收集處理。'
          :'§49-9：含氰及含鉻作業廢水，於觸發條件成立時應分流收集處理。';
      }else result.waterHighTechRequiredStreamsText='';
      return result;
    };
    root.WaterWorkflow.__industry485=true;
  }

  function state(value){return value==='yes'?'ok':value==='no'?'bad':value==='unknown'||!value?'missing':'missing';}
  function icon(s){return s==='ok'?'☑':s==='bad'?'⚠':s==='na'?'—':'?';}
  function collect(input,out){
    const sections=[],overview=[],missing=[],concerns=[];
    const lawReady=out.sublawVersionResolved==='yes';
    const type=input.waterIndustryType||'';
    const add=(basis,title,checks)=>{
      if(!lawReady){sections.push(`【${basis} ${title}】\n? 本案適用之子法版本尚待確認；先保留現場事實，不直接作違規判斷。`);overview.push(`${basis} ${title}：? 版本待確認`);missing.push(`${basis} ${title}之適用版本`);return;}
      const lines=[];let hasBad=false,hasMissing=false;
      for(const [field,label,mode] of checks){
        const value=input[field];
        if(mode==='trigger'){
          if(value==='no'){lines.push(`— ${label}：未觸發`);continue;}
          if(value==='yes'){lines.push(`☑ ${label}：已觸發`);continue;}
          lines.push(`? ${label}：待確認`);hasMissing=true;missing.push(label);continue;
        }
        const s=state(value);lines.push(`${icon(s)} ${label}：${s==='ok'?'已確認符合':s==='bad'?'疑似不符':'待確認'}`);
        if(s==='bad'){hasBad=true;concerns.push(`${basis} ${label}`);} if(s==='missing'){hasMissing=true;missing.push(label);}
      }
      const status=hasBad?'⚠ 疑似不符':hasMissing?'? 待確認':'☑ 已完成';
      sections.push(`【${basis} ${title}】\n${lines.join('\n')}`);overview.push(`${basis} ${title}：${status}`);
    };

    if(type==='construction'){
      const checks=[];
      checks.push(['waterConstructionVisibleSedimentFound','可見沉積污泥','trigger']);
      if(input.waterConstructionVisibleSedimentFound==='yes')checks.push(['waterConstructionSedimentCleanedCompliant','沉積污泥清除']);
      checks.push(['waterConstructionWasteOilFound','施工維修廢油棄置／溢洩','trigger']);
      if(input.waterConstructionWasteOilFound==='yes')checks.push(['waterConstructionWasteOilHandledCompliant','廢油收集處理']);
      checks.push(['waterConstructionCleanupRecordsCompliant','清除／收集處理紀錄與證明']);
      add('§49-3','營建工地沉積污泥／廢油',checks);
    }
    if(type==='shipDismantling')add('§45','船舶解體業',[['waterShipContainmentCompliant','截流或核准替代防堵設施'],['waterShipOilBoomCompliant','浮油攔除設備'],['waterShipReceivingFacilitiesCompliant','污染物收受設施']]);
    if(type==='livestock'){
      if(input.waterLivestockFishIntegratedUse==='yes')add('§46','漁牧綜合經營',[['waterLivestockFishDailyVolumeCompliant','每公頃每日廢水量'],['waterLivestockFishStockingCompliant','魚池承受豬隻廢水量'],['waterLivestockFishDOCompliant','魚池溶氧'],['waterLivestockFishFreeboardCompliant','魚池出水高程／池頂距離'],['waterLivestockFishRecordsCompliant','三年紀錄'],['waterLivestockFishNoticeCompliant','排放前三日通知']]);
      else if(input.waterLivestockFishIntegratedUse==='unknown'||!input.waterLivestockFishIntegratedUse){overview.push('§46 漁牧綜合經營：? 是否適用待確認');missing.push('是否採漁牧綜合經營');}
      if(input.waterLivestockPigCattleResourceApplicable==='yes')add('§46-1','畜牧糞尿資源化',[['waterLivestockResourceMeasureApproved','依法核准之資源化措施'],['waterLivestockResourceRatioCompliant','資源化處理比率']]);
      else if(input.waterLivestockPigCattleResourceApplicable==='unknown'||!input.waterLivestockPigCattleResourceApplicable){overview.push('§46-1 畜牧糞尿資源化：? 是否適用待確認');missing.push('是否飼養豬隻或牛隻');}
      if(input.waterLivestockSmallPigPlanApplicable==='yes')add('§49-5～49-7','20至未滿200頭養豬場管理計畫',[['waterLivestockSmallPigPlanApproved','廢（污）水管理計畫核准'],['waterLivestockSmallPigPlanOperationCompliant','依核准計畫運作']]);
      else if(input.waterLivestockSmallPigPlanApplicable==='unknown'||!input.waterLivestockSmallPigPlanApplicable){overview.push('§49-5～49-7 小型養豬場：? 是否適用待確認');missing.push('是否飼養豬隻20頭以上未滿200頭');}
      if(input.waterLivestockFertilizerUse==='yes'&&input.waterLivestockFertilizerPauseCondition==='yes')add('§49-10、§70-6、§70-9','沼液沼渣暫停施灌',[['waterLivestockFertilizerPauseCompliant','應暫停期間確實停止施灌']]);
    }
    if(type==='waterworks'&&input.waterWaterworksEmergencyDischargeUsed==='yes')add('§47','自來水廠緊急直接排放',[['waterWaterworksEmergencyConditionsMet','緊急直接排放法定條件'],['waterWaterworksEmergencyRegistered','應變措施納入核准文件'],['waterWaterworksBasinsEmptied','沉澱池／污泥濃縮池先淨空'],['waterWaterworksNoticeCompliant','下游通知及主管機關通報'],['waterWaterworksDailyMonitoringCompliant','按日檢測與紀錄']]);
    else if(type==='waterworks'&&(input.waterWaterworksEmergencyDischargeUsed==='unknown'||!input.waterWaterworksEmergencyDischargeUsed)){overview.push('§47 自來水廠緊急直接排放：? 本次是否使用待確認');missing.push('本次是否使用§47緊急直接排放');}
    if(foodHotelTypes.has(type)){
      if(input.waterFoodServiceProvided==='yes')add('§48、§49','餐飲廢水油脂截留',[['waterGreaseTrapPresent','油脂截留設施'],['waterGreaseTrapMaintenanceRecordsCompliant','清理維護及三年紀錄']]);
      else if(input.waterFoodServiceProvided==='unknown'||!input.waterFoodServiceProvided){overview.push('§48、§49 餐飲服務：? 是否提供餐飲服務待確認');missing.push('是否提供餐飲服務');}
      if(input.waterHotSpringServiceProvided==='yes'){
        const checks=[['waterHotSpringSeparatedCollectionCompliant','單純泡湯廢水分流收集處理']];
        if(input.waterHotSpringMudSpring==='no')checks.push(['waterHotSpringFiltersCompliant','毛髮／懸浮固體過濾設施']);
        else if(input.waterHotSpringMudSpring==='unknown'||!input.waterHotSpringMudSpring)missing.push('溫泉是否屬泥漿泉質');
        checks.push(['waterHotSpringMaintenanceRecordsCompliant','設施清理維護及三年紀錄']);
        add('§48、§49','溫泉泡湯廢水',checks);
      }else if(input.waterHotSpringServiceProvided==='unknown'||!input.waterHotSpringServiceProvided){overview.push('§48、§49 溫泉泡湯服務：? 是否提供待確認');missing.push('是否提供溫泉泡湯服務');}
    }
    if(type==='dialysisClinic')add('§49-4','洗腎診所',[['waterDialysisManagementPlanApproved','營運前廢（污）水管理計畫核准'],['waterDialysisOperationMatchesPlan','依核准管理計畫實施']]);
    if(type==='coalPower'){
      add('§49-8','燃煤發電廠汞管理',[['waterCoalMercuryRecordsCompliant','燃煤來源／總汞／用量紀錄'],['waterCoalMercuryReportingCompliant','半年網路申報']]);
      if(input.waterCoalMercuryThresholdExceeded==='yes')add('§49-8','汞總量管理計畫',[['waterCoalMercuryPlanApproved','汞總量管理計畫核准'],['waterCoalMercuryPlanImplemented','依核准計畫執行']]);
      else if(input.waterCoalMercuryThresholdExceeded==='unknown'||!input.waterCoalMercuryThresholdExceeded){overview.push('§49-8 汞總量管理門檻：? 待確認');missing.push('燃煤總汞是否達管理計畫門檻');}
    }
    if(highTechTypes.has(type)){
      if(input.waterHighTech49_9Trigger==='yes')add('§49-9','特定製程廢水分流',[['waterHighTechSeparatedCollectionCompliant','應分流作業廢水之分流收集處理']]);
      else if(input.waterHighTech49_9Trigger==='unknown'||!input.waterHighTech49_9Trigger){overview.push('§49-9 特定製程廢水分流：? 觸發條件待確認');missing.push('是否符合§49-9分流觸發條件');}
    }

    const ops=Array.isArray(input.waterSpecialOperationTypes)?input.waterSpecialOperationTypes:[];
    if(ops.includes('organicGroundwaterPollutant'))add('§49-1','有機地下水污染物貯存／輸送',[['waterOrganicLeakPreventionCompliant','防滲漏材質與防範'],['waterOrganicInspectionRecordsCompliant','巡查檢視與三年紀錄']]);
    if(ops.includes('constructionResidualReceiving'))add('§49-2','特定營建剩餘土石方收容處理',[['waterResidualDailyRecordsCompliant','每日車輛／土質／收容量／處理量紀錄']]);
    if(ops.includes('batPermitReview')){
      if(!lawReady){overview.push('§49-12 最佳可行控制技術：? 版本待確認');missing.push('§49-12適用版本');}
      else if(['application','change','extension'].includes(input.waterBatPermitActivity))add('§49-12','附表五最佳可行控制技術（許可審查提醒）',[['waterBatEvaluationConfirmed','優先評估附表五最佳可行控制技術']]);
      else if(input.waterBatPermitActivity==='notCurrent'){overview.push('§49-12 最佳可行控制技術：— 本次非申請／變更／展延審查');}
      else {overview.push('§49-12 最佳可行控制技術：? 審查情境待確認');missing.push('本次是否屬申請／變更／展延');}
    }
    if(type==='unknown'){overview.unshift('業別：? 尚待確認；不直接套用業別專屬條文。');missing.push('實際業別');}
    if(type==='other')overview.unshift('業別：其他事業；目前無匹配之業別專屬包，仍適用一般水污核心及跨業別特殊作業檢查。');
    if(!ops.length){overview.push('跨業別特殊作業：? 尚未確認');missing.push('是否涉及§49-1、§49-2或§49-12特殊作業');}
    else if(ops.includes('unknown')){overview.push('跨業別特殊作業：? 尚待確認');missing.push('跨業別特殊作業適用性');}
    else if(ops.includes('none'))overview.push('跨業別特殊作業：— 已確認均未涉及');
    return {sections,overview,missing:[...new Set(missing)],concerns:[...new Set(concerns)]};
  }

  const baseAssessmentApply=root.WaterAssessment?.apply;
  if(typeof baseAssessmentApply==='function'&&!root.WaterAssessment.__industry485){
    root.WaterAssessment.apply=function(input,facts,out,lawVersion,results,sub,industry){
      const result=baseAssessmentApply(input,facts,out,lawVersion,results,sub,industry);
      if(facts.subjectIsBusiness!=='yes'||!input.waterIndustryType)return result;
      const extra=collect(input,result);
      const baseText=String(result.waterIndustryOverviewText||'').trim();
      const oldEmpty=baseText==='目前未進入特定業別子法支線。';
      const parts=[];
      if(baseText&&!oldEmpty)parts.push(baseText);
      if(extra.sections.length)parts.push(extra.sections.join('\n\n'));
      if(!parts.length)parts.push('目前已完成業別辨識；本業別無已建置之專屬成立規則，仍依一般水污核心及跨業別特殊作業檢查。');
      result.waterIndustryOverviewText=parts.join('\n\n');
      if(extra.overview.length){
        const current=String(result.waterRulesOverviewText||'').trim();
        result.waterRulesOverviewText=[current,...extra.overview].filter(Boolean).join('\n');
      }
      if(extra.missing.length){
        result.waterLiveMissingText=[String(result.waterLiveMissingText||'').trim(),'【特定業別／特殊作業待確認】',...extra.missing.map(x=>'• '+x)].filter(Boolean).join('\n');
      }
      if(extra.concerns.length){
        result.waterLiveDecisionText=[String(result.waterLiveDecisionText||'').trim(),'⚠ 特定業別附加檢查發現疑似不符合事項，應依適用條文與現場證據再確認。'].filter(Boolean).join('\n');
        if(/^A｜/.test(String(result.waterFinalConclusionText||''))){
          result.waterFinalConclusionText='C｜事證不足\n特定業別附加檢查發現疑似不符合事項；目前先保留為待補強之法規／事證支線，不以本附加檢查單獨作成終局違規結論。';
        }
      }
      return result;
    };
    root.WaterAssessment.__industry485=true;
  }

  const resetFields=[...newFieldIds.filter(id=>!['waterHighTechRequiredStreamsText','waterSpecialOrganic','waterSpecialResidual','waterSpecialBat'].includes(id))];
  function clearNew(previous,current,next){
    const clear=keys=>keys.forEach(key=>{next[key]=Array.isArray(previous?.[key])?[]:'';});
    if(previous?.waterIndustryType!==current?.waterIndustryType)clear(resetFields.filter(id=>id!=='waterSpecialOperationTypes'&&!id.startsWith('waterOrganic')&&!id.startsWith('waterResidual')&&!id.startsWith('waterBat')));
    if(JSON.stringify(previous?.waterSpecialOperationTypes||[])!==JSON.stringify(current?.waterSpecialOperationTypes||[]))clear(['waterOrganicLeakPreventionCompliant','waterOrganicInspectionRecordsCompliant','waterResidualDailyRecordsCompliant','waterBatPermitActivity','waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFishIntegratedUse!==current?.waterLivestockFishIntegratedUse)clear(['waterLivestockFishDailyVolumeCompliant','waterLivestockFishStockingCompliant','waterLivestockFishDOCompliant','waterLivestockFishFreeboardCompliant','waterLivestockFishRecordsCompliant','waterLivestockFishNoticeCompliant']);
    if(previous?.waterLivestockPigCattleResourceApplicable!==current?.waterLivestockPigCattleResourceApplicable)clear(['waterLivestockResourceMeasureApproved','waterLivestockResourceRatioCompliant']);
    if(previous?.waterLivestockSmallPigPlanApplicable!==current?.waterLivestockSmallPigPlanApplicable)clear(['waterLivestockSmallPigPlanApproved','waterLivestockSmallPigPlanOperationCompliant']);
    if(previous?.waterWaterworksEmergencyDischargeUsed!==current?.waterWaterworksEmergencyDischargeUsed)clear(['waterWaterworksEmergencyConditionsMet','waterWaterworksEmergencyRegistered','waterWaterworksBasinsEmptied','waterWaterworksNoticeCompliant','waterWaterworksDailyMonitoringCompliant']);
    if(previous?.waterFoodServiceProvided!==current?.waterFoodServiceProvided)clear(['waterGreaseTrapPresent','waterGreaseTrapMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringServiceProvided!==current?.waterHotSpringServiceProvided)clear(['waterHotSpringSeparatedCollectionCompliant','waterHotSpringMudSpring','waterHotSpringFiltersCompliant','waterHotSpringMaintenanceRecordsCompliant']);
    if(previous?.waterHotSpringMudSpring!==current?.waterHotSpringMudSpring)clear(['waterHotSpringFiltersCompliant']);
    if(previous?.waterCoalMercuryThresholdExceeded!==current?.waterCoalMercuryThresholdExceeded)clear(['waterCoalMercuryPlanApproved','waterCoalMercuryPlanImplemented']);
    if(previous?.waterHighTech49_9Trigger!==current?.waterHighTech49_9Trigger)clear(['waterHighTechSeparatedCollectionCompliant']);
    if(previous?.waterBatPermitActivity!==current?.waterBatPermitActivity)clear(['waterBatEvaluationConfirmed']);
    if(previous?.waterLivestockFertilizerPauseCondition!==current?.waterLivestockFertilizerPauseCondition)clear(['waterLivestockFertilizerPauseCompliant']);
    return next;
  }

  if(root.WaterDependencies?.resetChange&&!root.WaterDependencies.__industry485){
    const base=root.WaterDependencies.resetChange;
    root.WaterDependencies.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    root.WaterDependencies.__industry485=true;
  }
  const fieldWorkflow=root.TemplateWorkflows?.waterField;
  if(fieldWorkflow?.resetChange&&!fieldWorkflow.__industry485){
    const base=fieldWorkflow.resetChange;
    fieldWorkflow.resetChange=function(previous={},current={}){return clearNew(previous,current,base(previous,current));};
    fieldWorkflow.__industry485=true;
  }

  root.WaterIndustryV485={collect,patchTemplate,version:VERSION};
})(typeof window==='undefined'?globalThis:window);
