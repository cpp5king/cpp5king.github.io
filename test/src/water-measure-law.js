(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const d=new Date(String(value)+'T00:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===String(value)?String(value):null;
  }

  function within(date,version){
    if(version.effectiveFrom&&date<version.effectiveFrom)return false;
    if(version.effectiveTo&&date>version.effectiveTo)return false;
    return true;
  }

  function resolveVersion(eventDate){
    const pack=root.WATER_MEASURE_RULE_PACK;
    if(!pack)return {status:'packMissing',date:'',version:null,regime:'unknown',text:'水措管理規則 尚未載入。'};
    const date=validDate(eventDate);
    if(!date){
      return {
        status:'dateUnknown',date:'',version:null,regime:'unknown',
        text:'水措管理：行為發生日期尚未確認，適用法規版本待確認；不以稽查日期或裝置日期替代。'
      };
    }
    const matches=(pack.lawVersions||[]).filter(v=>within(date,v));
    if(matches.length===1){
      const v=matches[0];
      const text=v.regime==='2026-04-20-effective-provisions'
        ?'水措管理：依行為發生日期適用115年4月20日修正版中當時已施行之規定；另定施行日期項目仍依個別條文／附表確認。'
        :'水措管理：依目前公布施行日，115年4月20日修正版之延後施行時點已屆；仍應確認行為當時是否已有後續修正。';
      return {status:'resolved',date,version:v,regime:v.regime,text};
    }
    if(date<'2026-04-20'){
      return {
        status:'historicalVersionMissing',date,version:null,regime:'2025-01-20-or-earlier',
        text:'水措管理：行為日期早於115年4月20日；本版水措管理規則尚未收錄該歷史版本，不以115年4月20日規則回溯判斷。'
      };
    }
    return {
      status:'versionUnresolved',date,version:null,regime:'unknown',
      text:'水措管理：依行為發生日期無法唯一解析適用版本，適用法規版本待確認。'
    };
  }

  function rules(scope){
    const pack=root.WATER_MEASURE_RULE_PACK||{};
    if(scope==='industry')return pack.industryRules||{};
    return pack.commonRules||{};
  }

  function getRule(ruleKey,scope='common'){
    return rules(scope)[ruleKey]||null;
  }

  function applyVersionGate(result,version){
    if(!version||version.status==='resolved'||result.status==='notApplicable')return result;
    result.baseStatus=result.status;
    result.status='insufficient';
    result.versionStatus=version.status;
    if(!result.missingFacts.includes('measureLawVersion'))result.missingFacts.unshift('measureLawVersion');
    if(!result.missingLabels.includes('適用之水措管理辦法版本待確認'))result.missingLabels.unshift('適用之水措管理辦法版本待確認');
    if(!result.nextChecks.includes('確認行為發生日期及當時有效之水措管理辦法版本'))result.nextChecks.unshift('確認行為發生日期及當時有效之水措管理辦法版本');
    return result;
  }

  function evaluate(ruleKey,facts,scope='common',context={}){
    const rule=getRule(ruleKey,scope);
    if(!rule)return {ruleId:ruleKey,status:'ruleMissing',missingFacts:[],failedFacts:[],notApplicableFacts:[],nextChecks:[]};
    if(!root.WaterRuleEngine?.evaluate)throw new Error('WaterRuleEngine is required before WaterMeasureLaw.');
    const prepared={...(facts||{})};
    if(context.version){
      prepared.sublawVersionResolved=context.version.status==='resolved'?'yes':'unknown';
    }
    const result=root.WaterRuleEngine.evaluate(rule,prepared);
    return applyVersionGate(result,context.version);
  }

  function evaluateAll(facts,scope='common',context={}){
    const out={};
    for(const key of Object.keys(rules(scope)))out[key]=evaluate(key,facts,scope,context);
    return out;
  }

  function industryCatalog(){
    return root.WATER_MEASURE_RULE_PACK?.industryCatalog||{};
  }


  function uiText(key,scope='main'){
    return root.WATER_MEASURE_RULE_PACK?.uiText?.[scope]?.[key]||'';
  }

  function applyUiText(target,scope='main'){
    if(!target||typeof target!=='object')return target;
    Object.assign(target,root.WATER_MEASURE_RULE_PACK?.uiText?.[scope]||{});
    return target;
  }

  function industryExtensions(){
    return root.WATER_MEASURE_RULE_PACK?.industryExtensions||{};
  }

  function industryGroups(){
    return industryExtensions().groups||{};
  }

  function industryOptions(){
    const industries=industryCatalog().industries||{};
    return Object.entries(industries).map(([id,item])=>({id,label:item.label,value:item.label}));
  }

  function industryFieldDefinitions(){
    const pack=root.WATER_MEASURE_RULE_PACK||{};
    const optionSets=pack.industryFieldOptions||{};
    const clone=value=>JSON.parse(JSON.stringify(value));
    return (pack.industryFields||[]).map(definition=>{
      const field=clone(definition);
      if(field.type==='select'&&field.optionSet){
        field.options=clone(optionSets[field.optionSet]||[]);
        delete field.optionSet;
      }
      return field;
    });
  }


  function bindingMatches(condition,sources){
    if(!condition)return true;
    if(Array.isArray(condition.all))return condition.all.every(item=>bindingMatches(item,sources));
    if(Array.isArray(condition.any))return condition.any.some(item=>bindingMatches(item,sources));
    const source=sources[condition.source]||{};
    const value=source[condition.field];
    if(condition.falsy===true)return !value;
    if(Object.prototype.hasOwnProperty.call(condition,'equals'))return value===condition.equals;
    return false;
  }

  function assessmentItems(scope,{input={},facts={},out={},results={}}={}){
    const pack=root.WATER_MEASURE_RULE_PACK||{};
    const bindings=pack.assessmentBindings?.[scope]||[];
    return bindings.map(binding=>({
      key:binding.key,
      ruleKey:binding.ruleKey,
      label:binding.label,
      rule:getRule(binding.ruleKey,scope==='industry'?'industry':'common'),
      result:results[binding.ruleKey],
      active:bindingMatches(binding.active,{input,facts,out})
    }));
  }

  function industryGuidance(input={}){
    const ext=industryExtensions();
    const type=input.waterIndustryType||'';
    return {
      highTechRequiredStreamsText:ext.highTechRequiredStreams?.[type]||'',
      isArticle9:(ext.groups?.article9Types||[]).includes(type),
      isHighTech:(ext.groups?.highTechTypes||[]).includes(type),
      isFoodHotel:(ext.groups?.foodHotelTypes||[]).includes(type)
    };
  }

  function extensionState(value){
    if(value==='yes')return 'ok';
    if(value==='no')return 'bad';
    return 'missing';
  }

  function extensionIcon(status){
    return status==='ok'?'☑':status==='bad'?'⚠':status==='na'?'—':'?';
  }

  function evaluateIndustryExtensions(input={},context={}){
    const ext=industryExtensions();
    const defs=ext.checks||{};
    const messages=ext.messages||{};
    const groups=ext.groups||{};
    const sections=[],overview=[],missing=[],concerns=[];
    const lawReady=context.version
      ?context.version.status==='resolved'
      :(context.lawReady!==undefined?!!context.lawReady:input.sublawVersionResolved==='yes');
    const type=input.waterIndustryType||'';

    const add=(definition,checksOverride)=>{
      if(!definition)return;
      const basis=definition.basis||'';
      const title=definition.title||'';
      const checks=checksOverride||definition.checks||[];
      if(!lawReady){
        sections.push('【'+basis+' '+title+'】\n? 本案適用之子法版本尚待確認；先保留現場事實，不直接作違規判斷。');
        overview.push(basis+' '+title+'：? 版本待確認');
        missing.push(basis+' '+title+'之適用版本');
        return;
      }
      const lines=[];let hasBad=false,hasMissing=false;
      for(const item of checks){
        const field=item[0],label=item[1],mode=item[2]||'normal';
        if(mode.startsWith('conditional:')){
          const [,conditionField,expected]=mode.split(':');
          if(input[conditionField]!==expected)continue;
        }
        const value=input[field];
        if(mode==='trigger'){
          if(value==='no'){lines.push('— '+label+'：未觸發');continue;}
          if(value==='yes'){lines.push('☑ '+label+'：已觸發');continue;}
          lines.push('? '+label+'：待確認');hasMissing=true;missing.push(label);continue;
        }
        const status=extensionState(value);
        lines.push(extensionIcon(status)+' '+label+'：'+(status==='ok'?'已確認符合':status==='bad'?'疑似不符':'待確認'));
        if(status==='bad'){hasBad=true;concerns.push(basis+' '+label);}
        if(status==='missing'){hasMissing=true;missing.push(label);}
      }
      for(const extra of definition.extraPending||[]){
        const value=input[extra.field];
        if(!value||value==='unknown'){hasMissing=true;missing.push(extra.whenMissing);}
      }
      const status=hasBad?'⚠ 疑似不符':hasMissing?'? 待確認':'☑ 已完成';
      sections.push('【'+basis+' '+title+'】\n'+lines.join('\n'));
      overview.push(basis+' '+title+'：'+status);
    };

    const trigger=(definition,pendingOverview)=>{
      const value=input[definition.triggerField];
      if(value==='yes'){add(definition);return true;}
      if(value==='no')return false;
      overview.push(pendingOverview||definition.basis+' '+definition.title+'：? 是否適用待確認');
      if(definition.pendingLabel)missing.push(definition.pendingLabel);
      return false;
    };

    if(type==='construction')add(defs.construction493);
    if(type==='shipDismantling')add(defs.ship45);
    if(type==='livestock'){
      trigger(defs.livestock46,'§46 漁牧綜合經營：? 是否適用待確認');
      trigger(defs.livestock461,'§46-1 畜牧糞尿資源化：? 是否適用待確認');
      trigger(defs.livestock4957,'§49-5～49-7 小型養豬場：? 是否適用待確認');
      if(input.waterLivestockFertilizerUse==='yes'&&input.waterLivestockFertilizerPauseCondition==='yes')add(defs.livestockPause);
    }
    if(type==='waterworks')trigger(defs.waterworks47,'§47 自來水廠緊急直接排放：? 本次是否使用待確認');
    if((groups.foodHotelTypes||[]).includes(type)){
      trigger(defs.food48,'§48、§49 餐飲服務：? 是否提供餐飲服務待確認');
      trigger(defs.hotSpring48,'§48、§49 溫泉泡湯服務：? 是否提供待確認');
    }
    if(type==='dialysisClinic')add(defs.dialysis494);
    if(type==='coalPower'){
      add(defs.coal498);
      trigger(defs.coal498Plan,'§49-8 汞總量管理門檻：? 待確認');
    }
    if((groups.highTechTypes||[]).includes(type)){
      trigger(defs.highTech499,'§49-9 特定製程廢水分流：? 觸發條件待確認');
    }

    const ops=Array.isArray(input.waterSpecialOperationTypes)?input.waterSpecialOperationTypes:[];
    if(ops.includes('organicGroundwaterPollutant'))add(defs.special491);
    if(ops.includes('constructionResidualReceiving'))add(defs.special492);
    if(ops.includes('batPermitReview')){
      if(!lawReady){overview.push(messages.batVersionPending);missing.push(messages.batVersionMissing);}
      else if(['application','change','extension'].includes(input.waterBatPermitActivity))add(defs.special4912);
      else if(input.waterBatPermitActivity==='notCurrent')overview.push(messages.batNotCurrent);
      else {overview.push(messages.batActivityPending);missing.push(messages.batActivityMissing);}
    }

    if(type==='unknown'){overview.unshift(messages.unknownIndustry);missing.push('實際業別');}
    if(type==='other')overview.unshift(messages.otherIndustry);
    if(!ops.length){overview.push(messages.specialUnset);missing.push(messages.specialMissing);}
    else if(ops.includes('unknown')){overview.push(messages.specialUnknown);missing.push(messages.specialUnknownMissing);}
    else if(ops.includes('none'))overview.push(messages.specialNone);

    return {
      sections,
      overview,
      missing:[...new Set(missing.filter(Boolean))],
      concerns:[...new Set(concerns.filter(Boolean))]
    };
  }

  function packInfo(){
    const pack=root.WATER_MEASURE_RULE_PACK;
    if(!pack)return null;
    return {
      packId:pack.packId,
      packVersion:pack.packVersion,
      status:pack.meta?.status||'unknown',
      lastVerifiedAt:pack.meta?.lastVerifiedAt||'',
      officialSources:pack.meta?.officialSources||[],
      provenance:pack.provenance,
      integrity:pack.meta?.integrity||null
    };
  }

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h=Math.imul(h,0x01000193)>>>0;
    }
    return h.toString(16).padStart(8,'0');
  }

  function verifyIntegrity(){
    const pack=root.WATER_MEASURE_RULE_PACK;
    const expected=pack?.meta?.integrity;
    if(!pack||!expected)return {ok:false,reason:'integrityMetadataMissing'};
    const payload=JSON.stringify({
      commonRules:pack.commonRules||{},
      industryRules:pack.industryRules||{},
      industryCatalog:pack.industryCatalog||{},
      industryExtensions:pack.industryExtensions||{},
      industryFields:pack.industryFields||[],
      industryFieldOptions:pack.industryFieldOptions||{},
      assessmentBindings:pack.assessmentBindings||{},
      uiText:pack.uiText||{}
    });
    const actual=fnv1a32(payload);
    return {
      ok:expected.algorithm==='fnv1a32-json'&&actual===expected.value,
      algorithm:expected.algorithm,
      expected:expected.value,
      actual
    };
  }

  root.WaterMeasureLaw=Object.freeze({
    provenance:PROVENANCE,
    resolveVersion,
    getRule,
    evaluate,
    evaluateAll,
    industryCatalog,
    uiText,
    applyUiText,
    industryExtensions,
    industryGroups,
    industryOptions,
    industryFieldDefinitions,
    assessmentItems,
    industryGuidance,
    evaluateIndustryExtensions,
    packInfo,
    verifyIntegrity
  });
  if(root.WATER_TEXTS?.main)applyUiText(root.WATER_TEXTS.main,'main');
})(typeof window==='undefined'?globalThis:window);
