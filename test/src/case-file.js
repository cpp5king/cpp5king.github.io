(function(root){
  'use strict';
  const SCHEMA='inspection-assistant-case';
  const SCHEMA_VERSION=1;
  const clone=value=>JSON.parse(JSON.stringify(value));

  function validateState(config,state){
    if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('案件檔缺少有效狀態。');
    const categoryId=String(state.categoryId||'');
    const caseTypeId=String(state.caseTypeId||'');
    const templateId=String(state.templateId||'');
    if(categoryId&&!config.categories.some(item=>item.id===categoryId&&item.status==='active'))throw new Error('案件檔的案件大類不存在或尚未開放。');
    if(caseTypeId&&!config.caseTypes.some(item=>item.id===caseTypeId&&item.categoryId===categoryId&&item.status==='active'))throw new Error('案件檔的案件類型與目前版本不相容。');
    if(templateId&&!config.templates.some(item=>item.id===templateId&&item.categoryId===categoryId&&item.caseTypeId===caseTypeId))throw new Error('案件檔的模板與目前版本不相容。');
    if(!state.inputs||typeof state.inputs!=='object'||Array.isArray(state.inputs))throw new Error('案件檔缺少有效輸入資料。');
    if(state.outputs!==null&&state.outputs!==undefined){
      if(typeof state.outputs!=='object'||Array.isArray(state.outputs))throw new Error('案件檔草稿格式無效。');
      for(const key of ['record','reply'])if(state.outputs[key]!==undefined&&typeof state.outputs[key]!=='string')throw new Error('案件檔草稿格式無效。');
    }
    const validated={categoryId,caseTypeId,templateId,inputs:clone(state.inputs),outputs:state.outputs?{record:String(state.outputs.record||''),reply:String(state.outputs.reply||'')}:null,stale:!!state.stale};
    if(Object.prototype.hasOwnProperty.call(state,'legalReviews')){
      if(!Array.isArray(state.legalReviews))throw new Error('案件檔法規研判歷程格式無效。');
      if(!root.WaterReview?.validate)throw new Error('目前版本缺少法規研判快照驗證模組。');
      validated.legalReviews=state.legalReviews.map(review=>root.WaterReview.validate(review));
    }
    if(Object.prototype.hasOwnProperty.call(state,'waterV2State')){
      if(!root.WaterV2UI?.validateState)throw new Error('目前版本缺少水污染案件驗證模組。');
      validated.waterV2State=root.WaterV2UI.validateState(state.waterV2State);
    }
    if(Object.prototype.hasOwnProperty.call(state,'wasteV1State')){
      if(!root.WasteV1UI?.validateState)throw new Error('目前版本缺少廢棄物案件驗證模組。');
      validated.wasteV1State=root.WasteV1UI.validateState(state.wasteV1State);
    }
    if(Object.prototype.hasOwnProperty.call(state,'airV1State')){
      if(!root.AirV1UI?.validateState)throw new Error('目前版本缺少空氣污染案件驗證模組。');
      validated.airV1State=root.AirV1UI.validateState(state.airV1State);
    }
    return validated;
  }

  function createPayload(state,appMeta){
    return {
      schema:SCHEMA,
      schemaVersion:SCHEMA_VERSION,
      appVersion:String(appMeta?.version||''),
      exportedAt:new Date().toISOString(),
      state:clone(state)
    };
  }

  function serialize(state,appMeta){return JSON.stringify(createPayload(state,appMeta),null,2);}

  function parse(text,config){
    let payload;
    try{payload=JSON.parse(String(text||''));}catch(_){throw new Error('案件檔不是有效的 JSON。');}
    if(payload?.schema!==SCHEMA||payload?.schemaVersion!==SCHEMA_VERSION)throw new Error('案件檔格式或版本不支援。');
    return {payload,state:validateState(config,payload.state)};
  }

  function filename(state){
    const rawDate=String(state?.inputs?.waterInspectionDate||state?.wasteV1State?.caseInfo?.inspectionDate||state?.airV1State?.fixed?.basic?.inspectionDateTime||state?.airV1State?.construction?.basic?.inspectionDateTime||state?.airV1State?.burning?.basic?.inspectionDateTime||'');
    const date=(rawDate.replace(/[^0-9]/g,'').slice(0,12)||new Date().toISOString().slice(0,10).replaceAll('-',''));
    const template=String(state?.templateId||(state?.categoryId==='waste'?'waste-v1':state?.categoryId==='air'?(state?.caseTypeId||'air-v1'):'case')).replace(/[^a-zA-Z0-9_-]+/g,'-');
    return `inspection-${date}-${template}.json`;
  }

  root.CaseFile={SCHEMA,SCHEMA_VERSION,createPayload,serialize,parse,filename,validateState};
})(typeof window==='undefined'?globalThis:window);
