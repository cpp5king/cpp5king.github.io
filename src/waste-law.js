(function(root,factory){
  const api=factory(root.WasteRulePack,root.WasteModel);
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.WasteLaw=api;
})(typeof window!=='undefined'?window:globalThis,function(R,M){
  'use strict';
  if(!R&&typeof require==='function') R=require('../data/waste-rules.js');
  if(!M&&typeof require==='function') M=require('./waste-model.js');
  const requirementStates=['已有事實支持','尚有要件待確認','目前不支持','無法確認','本次未查','本案不適用'];
  const progressStates=['尚待查核','查核中','已完成','暫不深入'];
  function ensureState(state){
    M.ensureState?.(state);
    if(!state.law) state.law={dismissedSuggestionKeys:[],navHint:null};
    if(!Array.isArray(state.law.dismissedSuggestionKeys)) state.law.dismissedSuggestionKeys=[];
    if(!Array.isArray(state.assessments)) state.assessments=[];
    return state.law;
  }
  function ruleById(id){return R.directions.find(x=>x.id===id)||null;}
  function allActions(state,batchId){return state.events.filter(e=>!batchId||e.batchId===batchId).map(e=>e.action).filter(Boolean);}
  function relatedSubjectIdsForBatch(state,batchId){
    const ids=new Set();if(!batchId)return ids;
    const add=x=>{if(x)ids.add(x);};
    const batch=state.batches.find(b=>b.id===batchId);if(batch?.originSubjectId)add(batch.originSubjectId);
    state.events.filter(e=>e.batchId===batchId).forEach(e=>add(e.subjectId));
    state.flows.filter(f=>f.batchId===batchId).forEach(f=>add(f.carrierSubjectId));
    state.documents.filter(d=>d.batchId===batchId||(!d.batchId&&d.flowId&&state.flows.some(f=>f.id===d.flowId&&f.batchId===batchId))).forEach(d=>add(d.subjectId));
    (state.producerRelations||[]).filter(r=>r.batchId===batchId&&r.status!=='已排除').forEach(r=>add(r.subjectId));
    (state.environmentObservations||[]).filter(o=>(o.batchIds||[]).includes(batchId)).forEach(o=>(o.subjectIds||[]).forEach(add));
    (state.assessments||[]).filter(a=>a.primaryBatchId===batchId).forEach(a=>add(a.subjectId));
    return ids;
  }
  function subjectsWithRoles(state,roles,batchId=''){
    const allowed=batchId?relatedSubjectIdsForBatch(state,batchId):null;
    return state.subjects.filter(s=>(!allowed||allowed.has(s.id))&&(s.roles||[]).some(r=>roles.includes(r)));
  }
  function relatedIdsForBatch(state,batchId){const ids=[];if(batchId)ids.push(batchId);state.events.filter(e=>e.batchId===batchId).forEach(e=>ids.push(e.id));state.flows.filter(f=>f.batchId===batchId).forEach(f=>ids.push(f.id));state.documents.filter(d=>d.batchId===batchId||(!d.batchId&&d.flowId&&state.flows.some(f=>f.id===d.flowId&&f.batchId===batchId))).forEach(d=>ids.push(d.id));(state.producerRelations||[]).filter(r=>r.batchId===batchId).forEach(r=>ids.push(r.id));(state.environmentObservations||[]).filter(o=>(o.batchIds||[]).includes(batchId)).forEach(o=>ids.push(o.id));relatedSubjectIdsForBatch(state,batchId).forEach(id=>ids.push(id));return [...new Set(ids)];}
  function relatedIdsForObservation(state,o){const ids=[o.id,...(o.batchIds||[]),...(o.eventIds||[]),...(o.subjectIds||[]),...(o.vehicleIds||[])];if(o.placeId)ids.push(o.placeId);for(const bid of o.batchIds||[])relatedIdsForBatch(state,bid).forEach(id=>ids.push(id));return [...new Set(ids.filter(Boolean))];}
  function linkedBatches(state,o){return (o.batchIds||[]).map(id=>state.batches.find(b=>b.id===id)).filter(Boolean);}
  function environmentMatches(state,o,t){
    const ph=o.phenomena||[],media=o.media||[];
    if(t.environmentPhenomenaAny&&!t.environmentPhenomenaAny.some(x=>ph.includes(x)))return false;
    if(t.environmentPhenomenaAll&&!t.environmentPhenomenaAll.every(x=>ph.includes(x)))return false;
    if(t.environmentMediaAny&&!t.environmentMediaAny.some(x=>media.includes(x)))return false;
    if(t.environmentCurrentAny&&!t.environmentCurrentAny.includes(o.currentStatus))return false;
    if(t.linkedClassificationAny){const bs=linkedBatches(state,o);if(!bs.length||!bs.some(b=>t.linkedClassificationAny.includes(b.classification)))return false;}
    if(t.linkedDetailClassificationAny){const bs=linkedBatches(state,o);if(!bs.length||!bs.some(b=>t.linkedDetailClassificationAny.includes(b.detailClassification)))return false;}
    return true;
  }
  function hasEnvironmentAbnormality(state,batchId){const neutral=new Set(['無明顯異常','無法確認','本次未查']);return (state.environmentObservations||[]).some(o=>(!batchId||(o.batchIds||[]).includes(batchId))&&(o.phenomena||[]).some(x=>!neutral.has(x)));}
  function matchesTrigger(state,rule,batch){
    const t=rule.trigger||{}, acts=new Set(allActions(state,batch?.id));
    if(t.manualOnly||t.environmentScope)return false;
    if(t.sourceUnresolved&&!(state.entryMode==='unknown'&&state.sourceTrace?.status==='本次無法確認來源'))return false;
    if(t.allActions&&!t.allActions.every(x=>acts.has(x)))return false;
    if(t.anyActions&&!t.anyActions.some(x=>acts.has(x)))return false;
    if(t.batchUses){const uses=[batch?.claimUse,batch?.documentUse,batch?.actualUse].filter(Boolean);if(!t.batchUses.some(x=>uses.includes(x)))return false;}
    if(t.classificationAny&&(!batch||!t.classificationAny.includes(batch.classification)))return false;
    if(t.detailClassificationAny&&(!batch||!t.detailClassificationAny.includes(batch.detailClassification)))return false;
    if(t.wasteIdentityAny&&(!batch||!t.wasteIdentityAny.includes(batch.wasteIdentity)))return false;
    if(t.materialKindsAny&&(!batch||!t.materialKindsAny.includes(batch.materialKind)))return false;
    if(t.roles){const has=subjectsWithRoles(state,t.roles,batch?.id||'').length>0;if(!has)return false;}
    if(t.requiresBatch&&!batch)return false;
    if(t.hasEnvironmentAbnormality&&!hasEnvironmentAbnormality(state,batch?.id))return false;
    if(t.environmentScopeForBatch){const obs=(state.environmentObservations||[]).filter(o=>(o.batchIds||[]).includes(batch?.id));if(!obs.some(o=>environmentMatches(state,o,t)))return false;}
    if(t.hasDocumentIssueAny&&!state.documents.some(d=>t.hasDocumentIssueAny.includes(d.reviewIssue)))return false;
    return true;
  }
  function triggerReason(rule,batch,state,o=null){
    const t=rule.trigger||{},parts=[];const acts=allActions(state,batch?.id);
    if(o){const ph=(o.phenomena||[]).filter(x=>!t.environmentPhenomenaAny||t.environmentPhenomenaAny.includes(x));const media=(o.media||[]).filter(x=>!t.environmentMediaAny||t.environmentMediaAny.includes(x));if(ph.length)parts.push(`環境現象：${ph.join('、')}`);if(media.length)parts.push(`受影響位置／介質：${media.join('、')}`);if(o.currentStatus)parts.push(`狀態：${o.currentStatus}`);}
    if(t.allActions?.length)parts.push(`已記錄 ${t.allActions.join('＋')}`);
    if(t.anyActions?.length){const hit=t.anyActions.filter(x=>acts.includes(x));if(hit.length)parts.push(`已記錄 ${hit.join('、')}`);}
    if(t.batchUses?.length){const uses=[batch?.claimUse,batch?.documentUse,batch?.actualUse].filter(Boolean).filter(x=>t.batchUses.includes(x));if(uses.length)parts.push(`已有用途資料：${[...new Set(uses)].join('、')}`);}
    if(t.classificationAny&&batch?.classification)parts.push(`批次分類：${batch.classification}`);
    if(t.detailClassificationAny&&batch?.detailClassification)parts.push(`細分：${batch.detailClassification}`);
    if(t.materialKindsAny&&batch?.materialKind)parts.push(`物質：${batch.materialKind}`);
    if(t.roles?.length){const names=subjectsWithRoles(state,t.roles,batch?.id||'').map(s=>s.name||s.id);if(names.length)parts.push(`本批已建立相關角色：${names.join('、')}`);}
    if(t.environmentScopeForBatch&&batch?.id){const obs=(state.environmentObservations||[]).filter(x=>(x.batchIds||[]).includes(batch.id)&&environmentMatches(state,x,t));const ph=[...new Set(obs.flatMap(x=>(x.phenomena||[]).filter(v=>!t.environmentPhenomenaAny||t.environmentPhenomenaAny.includes(v))))];if(ph.length)parts.push(`相關環境現象：${ph.join('、')}`);}
    if(t.sourceUnresolved)parts.push('本次來源仍無法確認');
    if(t.hasEnvironmentAbnormality)parts.push('已有相關環境異常觀察');
    if(t.hasDocumentIssueAny)parts.push('已有文件／申報資料疑點');
    return parts.join('；')||'由既有案件資料觸發。';
  }
  function detectDirections(state){
    ensureState(state);const out=[];
    for(const rule of R.directions){
      const t=rule.trigger||{};
      if(t.environmentScope){for(const o of state.environmentObservations||[]){if(!environmentMatches(state,o,t))continue;const bs=linkedBatches(state,o),batchId=bs.length===1?bs[0].id:'';out.push({key:`law:${rule.id}:obs:${o.id}`,ruleId:rule.id,title:rule.title,reason:triggerReason(rule,batchId?bs[0]:null,state,o),batchId,relatedIds:relatedIdsForObservation(state,o),status:rule.status});}continue;}
      if(t.sourceUnresolved&&matchesTrigger(state,rule,null))out.push({key:`law:${rule.id}:case`,ruleId:rule.id,title:rule.title,reason:triggerReason(rule,null,state),batchId:'',relatedIds:[],status:rule.status});
      for(const b of state.batches){if(matchesTrigger(state,rule,b))out.push({key:`law:${rule.id}:${b.id}`,ruleId:rule.id,title:rule.title,reason:triggerReason(rule,b,state),batchId:b.id,relatedIds:relatedIdsForBatch(state,b.id),status:rule.status});}
      if(!state.batches.length&&!t.requiresBatch&&matchesTrigger(state,rule,null)&&!t.sourceUnresolved)out.push({key:`law:${rule.id}:case`,ruleId:rule.id,title:rule.title,reason:triggerReason(rule,null,state),batchId:'',relatedIds:[],status:rule.status});
    }
    const seen=new Set();return out.filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return !state.law.dismissedSuggestionKeys.includes(x.key);});
  }
  function parseDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const d=new Date(`${s}T00:00:00Z`);return Number.isNaN(d.getTime())?null:d;}
  function resolveVersion(rule,dateText){
    if(rule.status==='scaffold'||!rule.versions?.length)return {status:'scaffold',version:null,message:rule.note||'規則待擴充'};
    const d=parseDate(dateText);if(!d)return {status:'date_missing',version:null,message:'行為日期未確認，適用法規版本待確認。'};
    const v=rule.versions.find(x=>{const from=parseDate(x.effectiveFrom),to=x.effectiveTo?parseDate(x.effectiveTo):null;return (!from||d>=from)&&(!to||d<=to);});
    if(!v)return {status:'not_covered',version:null,message:'本規則包尚未收錄該行為日期所對應的法規版本。'};
    return {status:'ok',version:v,message:''};
  }
  function createAssessment(state,data={}){
    ensureState(state);const rule=ruleById(data.ruleId);if(!rule)return null;const a={
      id:M.id(state,'LA'),ruleId:rule.id,direction:rule.title,source:data.source||'manual',suggestionKey:data.suggestionKey||'',triggerReason:data.triggerReason||'',triggerRelatedIds:(data.triggerRelatedIds||[]).slice(),
      primaryBatchId:data.primaryBatchId||'',subjectId:data.subjectId||'',role:data.role||'',eventIds:(data.eventIds||[]).slice(),behaviorDate:data.behaviorDate||'',progress:'尚待查核',pauseReason:'',legalState:'尚有要件待確認',
      rulePackVersion:R.meta.version,ruleVersionId:'',requirementStates:{},supportLinks:{},counterLinks:{},notes:'',createdAt:new Date().toISOString(),history:[]
    };state.assessments.push(a);refreshAssessment(state,a);return a;
  }
  function activeSuggestionKeys(state){return new Set(detectDirections(state).map(x=>x.key));}
  function refreshAssessment(state,a){
    const rule=ruleById(a.ruleId), resolved=resolveVersion(rule,a.behaviorDate);a.rulePackVersion=R.meta.version;a.ruleVersionId=resolved.version?.id||'';a.legalState=deriveLegalState(a,resolved);return {rule,resolved};
  }
  function getRequirements(state,a){const {rule,resolved}=refreshAssessment(state,a);return {rule,resolved,requirements:resolved.version?.requirements||[]};}
  function deriveLegalState(a,resolved){
    if(!resolved||resolved.status!=='ok')return '尚有要件待確認';
    const reqs=resolved.version.requirements||[];
    if(reqs.filter(r=>r.kind==='exception').some(r=>a.requirementStates[r.id]==='已有事實支持'))return '本案不適用';
    const necessary=reqs.filter(r=>r.required&&r.kind!=='supplement'&&r.kind!=='exception');
    const states=necessary.map(r=>a.requirementStates[r.id]||'尚有要件待確認');
    if(states.some(x=>x==='尚有要件待確認'))return '尚有要件待確認';
    if(states.some(x=>x==='目前不支持'))return '目前不支持';
    if(states.some(x=>x==='無法確認'))return '無法確認';
    if(states.some(x=>x==='本次未查'))return '本次未查';
    if(states.some(x=>x==='本案不適用'))return '本案不適用';
    return states.length&&states.every(x=>x==='已有事實支持')?'構成要件事實已完整':'尚有要件待確認';
  }
  function setRequirementState(state,assessmentId,reqId,value){const a=state.assessments.find(x=>x.id===assessmentId);if(!a)return null;a.requirementStates[reqId]=value;refreshAssessment(state,a);return a;}
  function setProgress(state,assessmentId,value,reason=''){const a=state.assessments.find(x=>x.id===assessmentId);if(!a)return null;a.progress=value;if(value==='暫不深入')a.pauseReason=reason||a.pauseReason;return a;}
  function addEvidenceLink(state,assessmentId,reqId,recordId,side='support'){const a=state.assessments.find(x=>x.id===assessmentId);if(!a||!recordId)return null;const key=side==='counter'?'counterLinks':'supportLinks';if(!Array.isArray(a[key][reqId]))a[key][reqId]=[];if(!a[key][reqId].includes(recordId))a[key][reqId].push(recordId);return a;}
  function removeEvidenceLink(state,assessmentId,reqId,recordId,side='support'){const a=state.assessments.find(x=>x.id===assessmentId);if(!a)return null;const key=side==='counter'?'counterLinks':'supportLinks';a[key][reqId]=(a[key][reqId]||[]).filter(x=>x!==recordId);return a;}
  function recordById(state,id){for(const [kind,list] of [['批次',state.batches],['產生者關係',state.producerRelations||[]],['環境觀察',state.environmentObservations||[]],['主體',state.subjects],['事件',state.events],['流向',state.flows],['文件',state.documents],['地點',state.places],['車輛',state.vehicles],['待確認',state.questions],['疑點',state.doubts]]){const x=list.find(v=>v.id===id);if(x)return {kind,item:x};}return null;}
  function recordLabel(state,id){const hit=recordById(state,id);if(!hit)return id;const x=hit.item;if(hit.kind==='事件')return `事件｜${M.eventSummary(state,x)||x.id}`;if(hit.kind==='流向')return `流向｜${M.labelById(state.batches,x.batchId,['label','materialKind'])||x.batchId||'未指定批次'}｜${M.labelById(state.places,x.fromPlaceId,['name'])||'未知'} → ${M.labelById(state.places,x.toPlaceId,['name'])||'未知'}`;if(hit.kind==='環境觀察')return `環境觀察｜${M.environmentObservationSummary(state,x)||x.id}`;if(hit.kind==='產生者關係')return `產生者關係｜${M.labelById(state.subjects,x.subjectId,['name'])||x.basisText||'未命名'}｜${x.status||''}`;if(hit.kind==='文件')return `文件｜${x.type||x.title||x.id}｜${x.reviewState||''}`;if(hit.kind==='批次')return `批次｜${x.label||x.materialKind||x.id}`;if(hit.kind==='主體')return `主體｜${x.name||x.id}`;if(hit.kind==='地點')return `地點｜${x.name||x.address||x.id}`;if(hit.kind==='車輛')return `車輛｜${x.plate||x.id}`;return `${hit.kind}｜${x.text||x.id}`;}
  function candidateFacts(state,a,req){
    const ids=[];const sources=req?.candidateSources||[];const batchId=a.primaryBatchId,subjectId=a.subjectId;
    if(sources.includes('batch')&&batchId)ids.push(batchId);
    if(sources.includes('producer'))(state.producerRelations||[]).filter(r=>!batchId||r.batchId===batchId).forEach(r=>ids.push(r.id));
    if(sources.includes('subject')&&subjectId)ids.push(subjectId);
    if(sources.includes('event'))state.events.filter(e=>(!batchId||e.batchId===batchId)&&(!subjectId||!e.subjectId||e.subjectId===subjectId)).forEach(e=>ids.push(e.id));
    if(sources.includes('flow'))state.flows.filter(f=>(!batchId||f.batchId===batchId)&&(!subjectId||!f.carrierSubjectId||f.carrierSubjectId===subjectId)).forEach(f=>ids.push(f.id));
    if(sources.includes('document'))state.documents.filter(d=>(!batchId||!d.batchId||d.batchId===batchId)&&(!subjectId||!d.subjectId||d.subjectId===subjectId)).forEach(d=>ids.push(d.id));
    if(sources.includes('environment'))(state.environmentObservations||[]).filter(o=>(a.triggerRelatedIds||[]).includes(o.id)||!batchId||(o.batchIds||[]).includes(batchId)).forEach(o=>ids.push(o.id));
    if(sources.includes('place')){const pids=new Set();state.events.filter(e=>!batchId||e.batchId===batchId).forEach(e=>e.placeId&&pids.add(e.placeId));state.flows.filter(f=>!batchId||f.batchId===batchId).forEach(f=>{if(f.fromPlaceId)pids.add(f.fromPlaceId);if(f.toPlaceId)pids.add(f.toPlaceId);});(state.environmentObservations||[]).filter(o=>(a.triggerRelatedIds||[]).includes(o.id)||!batchId||(o.batchIds||[]).includes(batchId)).forEach(o=>o.placeId&&pids.add(o.placeId));[...pids].forEach(x=>ids.push(x));}
    if(sources.includes('vehicle'))state.events.filter(e=>(!batchId||e.batchId===batchId)&&e.vehicleId).forEach(e=>ids.push(e.vehicleId));
    for(const id of a.triggerRelatedIds||[])if((sources.includes('environment')||sources.includes('event')||sources.includes('place')||sources.includes('vehicle'))&&recordById(state,id))ids.push(id);
    return [...new Set(ids)].map(id=>({id,label:recordLabel(state,id)}));
  }
  function allRelatedFacts(state,a){const ids=new Set([a.primaryBatchId,a.subjectId,...(a.eventIds||[]),...(a.triggerRelatedIds||[])] .filter(Boolean));state.events.filter(e=>!a.primaryBatchId||e.batchId===a.primaryBatchId).forEach(e=>ids.add(e.id));state.flows.filter(f=>!a.primaryBatchId||f.batchId===a.primaryBatchId).forEach(f=>ids.add(f.id));state.documents.filter(d=>(!a.primaryBatchId||!d.batchId||d.batchId===a.primaryBatchId)&&(!a.subjectId||!d.subjectId||d.subjectId===a.subjectId)).forEach(d=>ids.add(d.id));(state.producerRelations||[]).filter(r=>!a.primaryBatchId||r.batchId===a.primaryBatchId).forEach(r=>ids.add(r.id));(state.environmentObservations||[]).filter(o=>!a.primaryBatchId||(o.batchIds||[]).includes(a.primaryBatchId)).forEach(o=>ids.add(o.id));return [...ids].map(id=>({id,label:recordLabel(state,id)}));}
  function behaviorOverview(state,a){const events=state.events.filter(e=>(!a.primaryBatchId||e.batchId===a.primaryBatchId)&&(!a.eventIds?.length||a.eventIds.includes(e.id)||a.triggerRelatedIds?.includes(e.id)));const counts={};for(const e of events){if(e.action)counts[e.action]=(counts[e.action]||0)+1;}const parts=Object.entries(counts).map(([k,v])=>`${v} 次${k}`);return parts.length?`本次相關事件記錄：${parts.join('、')}。`:'';}
  function triggerIsActive(state,a){if(a.source!=='system'||!a.suggestionKey)return true;return activeSuggestionKeys(state).has(a.suggestionKey);}
  function lawSnapshot(state){ensureState(state);const suggestions=detectDirections(state),assessments=state.assessments;let pending=0;for(const a of assessments){const {requirements}=getRequirements(state,a);for(const r of requirements){const st=a.requirementStates[r.id]||'尚有要件待確認';if(r.required&&['尚有要件待確認','本次未查'].includes(st))pending++;}}return {suggestions,assessments,pending};}
  function departureCheck(state){ensureState(state);const map=new Map();for(const a of state.assessments){if(a.progress==='暫不深入')continue;const {requirements}=getRequirements(state,a);for(const r of requirements){if(r.onsite==='後續查證'||r.kind==='supplement'||r.kind==='exception')continue;const st=a.requirementStates[r.id]||'尚有要件待確認';if(!['尚有要件待確認','本次未查'].includes(st))continue;const key=r.sharedKey||`${a.id}:${r.id}`;if(!map.has(key))map.set(key,{key,label:r.label,onsite:r.onsite||'一般現場確認',assessmentIds:[a.id],target:r.target||'event'});else map.get(key).assessmentIds.push(a.id);}}
    const onsite=[...map.values()].sort((a,b)=>(a.onsite==='現場查核優先'?0:1)-(b.onsite==='現場查核優先'?0:1));const follow=[];for(const a of state.assessments){const {requirements}=getRequirements(state,a);for(const r of requirements){if(r.onsite!=='後續查證')continue;const st=a.requirementStates[r.id]||'尚有要件待確認';if(['尚有要件待確認','本次未查'].includes(st))follow.push({label:r.label,assessmentId:a.id,target:r.target||'document'});}}return {onsite,follow};
  }
  function articleCatalog(){return R?.articleCatalog||[];}
  function articleByNo(no){return articleCatalog().find(x=>String(x.article)===String(no))||null;}
  function rulePackStatus(){return {valid:!!R?.verify?.(),meta:R?.meta||{},notices:R?.notices||[],futureChanges:R?.futureChanges||[],articleCount:articleCatalog().length};}
  return {requirementStates,progressStates,ensureState,ruleById,detectDirections,resolveVersion,createAssessment,refreshAssessment,getRequirements,deriveLegalState,setRequirementState,setProgress,addEvidenceLink,removeEvidenceLink,recordLabel,candidateFacts,allRelatedFacts,behaviorOverview,triggerIsActive,lawSnapshot,departureCheck,articleCatalog,articleByNo,rulePackStatus};
});
