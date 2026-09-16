(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const handled=new Set(['completed','blocked','cancelled']);
  function value(session,key){return root.WaterV2Session.value(session,key);}
  function actionHandled(session,type){return (session.actions||[]).some(a=>a.type===type&&handled.has(a.status));}
  function criticalPending(session){return (session.unknowns||[]).filter(u=>u.status==='pending'&&u.priority==='critical');}
  function unresolvedIncident(session){return (session.incidents||[]).filter(i=>i.handlingStatus!=='complete'&&i.status!=='closed_due_to_correction');}
  function preservationNeeded(session){
    const live=value(session,'water.observation.active_discharge')==='yes'||value(session,'water.discharge.occurred')==='yes'||value(session,'water.overflow.active')==='yes'||value(session,'water.leak.present')==='yes';
    return live&&!actionHandled(session,'preserve_current_condition');
  }
  function sourceNeed(session){
    const water=value(session,'water.observation.water_present')==='yes'||value(session,'water.discharge.occurred')==='yes'||value(session,'water.observation.active_discharge')==='yes';
    const rel=value(session,'water.premises.relation_status');
    return water&&rel!=='confirmed_relation';
  }
  function recommend(session,state){
    if(state==='initial_observation')return {action:'confirm_water_condition',label:'確認排水及水體情形',priority:1000};
    if(state==='fact_preservation')return {action:'preserve_current_condition',label:'先固定目前排水／異常狀態',priority:1000};
    if(state==='source_tracing')return {action:'trace_source',label:'循線確認來源與水流關係',priority:800};
    if(state==='subject_confirmation')return {action:'confirm_subject',label:'確認場所與實際營運對象',priority:600};
    if(state==='regulated_status')return {action:'query_regulated_status',label:'確認水污管制身分',priority:500};
    if(state==='regulated_inspection'){
      const open=unresolvedIncident(session)[0];
      if(open)return {action:(open.primaryAction||'review_incident'),label:open.title||'處理現場異常事項',priority:400};
      return {action:'review_regulated_areas',label:'查核製程、廢污水流向、處理設施及許可差異',priority:400};
    }
    if(state==='fact_review')return {action:'review_facts',label:'整理並確認本次稽查事實',priority:100};
    return {action:'complete_inspection',label:'本次現場稽查已完成',priority:0};
  }
  function evaluate(session){
    const previous=(session.workflow&&session.workflow.state)||'initial_observation';
    const overall=value(session,'water.observation.overall_status');
    let state='initial_observation',returnState=null;
    if(overall==='no_obvious_abnormality')state='fact_review';
    else if(preservationNeeded(session)){state='fact_preservation';returnState=previous==='fact_preservation'?(session.workflow.returnState||'source_tracing'):previous;}
    else if(sourceNeed(session))state='source_tracing';
    else {
      const rel=value(session,'water.premises.relation_status');
      const subjectType=value(session,'water.subject.type');
      const subjectConfirmed=value(session,'water.subject.identity_confirmed');
      const regulated=value(session,'water.regulated.query_result');
      if(rel==='confirmed_relation'&&(!subjectType||subjectType==='unknown'||subjectConfirmed==='unknown'))state='subject_confirmation';
      else if(subjectType&&subjectType!=='unknown'&&(!regulated||regulated==='not_checked'))state='regulated_status';
      else if(regulated==='confirmed_regulated')state='regulated_inspection';
      else if(unresolvedIncident(session).length)state='regulated_inspection';
      else state='fact_review';
    }
    if(session.session.status==='completed')state='completed';
    const ready=state==='fact_review'&&criticalPending(session).length===0&&unresolvedIncident(session).length===0;
    const primaryRecommendation=recommend(session,state);
    return {state,returnState,completionStatus:ready?'ready':'needs_attention',criticalPending:criticalPending(session).map(x=>x.id),openIncidents:unresolvedIncident(session).map(x=>x.id),primaryRecommendation};
  }
  function apply(session){
    const result=evaluate(session),old=(session.workflow&&session.workflow.state)||'initial_observation';
    if(old!==result.state){session.workflow.history.push({from:old,to:result.state,reason:'rule_recompute',timestamp:new Date().toISOString()});}
    session.workflow.state=result.state;session.workflow.returnState=result.returnState;
    session.recommendations=(session.recommendations||[]).filter(r=>r.source!=='workflow');
    session.recommendations.push({id:'REC-WORKFLOW-PRIMARY',source:'workflow',...result.primaryRecommendation});
    return result;
  }
  function dashboardText(result){
    const labels={initial_observation:'初步現場確認',fact_preservation:'現場事實保全',source_tracing:'查源／追水',subject_confirmation:'確認場所／稽查對象',regulated_status:'確認水污管制身分',regulated_inspection:'列管事業現場查核',fact_review:'案件事實整理',completed:'本次現場稽查完成'};
    return `目前狀態：${labels[result.state]||result.state}\n主要建議：${result.primaryRecommendation.label}\n完成狀態：${result.completionStatus==='ready'?'已具備完成條件':'仍有重要事項待處理'}`;
  }
  root.WaterV2Workflow={evaluate,apply,dashboardText,provenance:PROVENANCE};
})(typeof window==='undefined'?globalThis:window);
