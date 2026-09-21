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
    const date=String(state?.inputs?.waterInspectionDate||'').replaceAll('-','')||new Date().toISOString().slice(0,10).replaceAll('-','');
    const template=String(state?.templateId||'case').replace(/[^a-zA-Z0-9_-]+/g,'-');
    return `inspection-${date}-${template}.json`;
  }

  root.CaseFile={SCHEMA,SCHEMA_VERSION,createPayload,serialize,parse,filename,validateState};
})(typeof window==='undefined'?globalThis:window);
