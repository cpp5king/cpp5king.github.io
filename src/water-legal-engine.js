(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const RESULT_ORDER={potential_violation:7,elements_substantially_met:6,exception_possible:5,possible_application:4,facts_insufficient:3,human_review_required:3,no_issue_found:2,not_applicable:1};
  function idx(session){return root.WaterV2Session.factIndex(session);}
  function fact(session,key){const f=idx(session)[key];return f?f.value:undefined;}
  function ev(status,label,refs=[],missingFacts=[]){return {status,label,refs,missingFacts};}
  function factRef(session,key){const f=idx(session)[key];return f?[f.id]:[];}
  function factEquals(session,key,expected,label){const v=fact(session,key);if(v===undefined||v==='unknown')return ev('unknown',label,[],[{key}]);return ev(v===expected?'met':'not_met',label,factRef(session,key));}
  function factIn(session,key,values,label){const v=fact(session,key);if(v===undefined||v==='unknown')return ev('unknown',label,[],[{key}]);return ev(values.includes(v)?'met':'not_met',label,factRef(session,key));}
  function candidate(session,rule){
    const c=rule.candidate;if(!c)return true;
    if(c.factEquals){const [k,v]=c.factEquals;if(fact(session,k)!==v)return false;}
    if(c.anyFacts&&c.anyFacts.length&&!c.anyFacts.some(k=>fact(session,k)!==undefined))return false;
    if(c.orObjects&&c.orObjects.includes('flows')&&(session.flows||[]).length)return true;
    return true;
  }
  function subjectState(session,rule){
    if((rule.subjects||[]).includes('any'))return ev('met','適用主體不限');
    const v=fact(session,'water.subject.type');if(!v||v==='unknown')return ev('unknown','適用主體',[],[{key:'water.subject.type'}]);
    return ev((rule.subjects||[]).includes(v)?'met':'not_met','適用主體',factRef(session,'water.subject.type'));
  }
  function formalLab(session){const a=fact(session,'water.sampling.formal_result_available');return a==='yes'?ev('met','正式檢驗結果',factRef(session,'water.sampling.formal_result_available')):a==='no'?ev('not_met','正式檢驗結果',factRef(session,'water.sampling.formal_result_available')):ev('unknown','正式檢驗結果',[],[{key:'water.sampling.formal_result_available'}]);}
  function applicableStandard(session){return factEquals(session,'water.sampling.applicable_standard_confirmed','yes','適用放流水標準');}
  function standardComparison(session){
    const lab=formalLab(session),std=applicableStandard(session);if(lab.status!=='met'||std.status!=='met')return ev('unknown','放流水標準比對',[],[{key:lab.status!=='met'?'water.sampling.formal_result_available':'water.sampling.applicable_standard_confirmed'}]);
    const exceeded=fact(session,'water.sampling.standard_exceeded');if(exceeded==='yes')return ev('not_met','放流水標準比對',factRef(session,'water.sampling.standard_exceeded'));if(exceeded==='no')return ev('met','放流水標準比對',factRef(session,'water.sampling.standard_exceeded'));return ev('unknown','放流水標準比對',[],[{key:'water.sampling.standard_exceeded'}]);
  }
  function permitStatus(session,key,label){const v=fact(session,key);if(!v||v==='unknown'||v==='not_found')return ev('unknown',label,factRef(session,key),[{key}]);if(v==='valid')return ev('met',label,factRef(session,key));if(v==='not_obtained')return ev('not_met',label,factRef(session,key));return ev('conflict',label,factRef(session,key),[]);}
  function permitComparison(session){
    const keys=['water.permit.source_difference','water.permit.process_difference','water.permit.discharge_location_difference','water.permit.route_difference','water.permit.treatment_difference'];
    const present=keys.filter(k=>fact(session,k)!==undefined);if(!present.length)return ev('unknown','許可登記事項與現場運作比對',[],keys.map(key=>({key})));
    const refs=present.flatMap(k=>factRef(session,k));if(present.some(k=>fact(session,k)==='yes'))return ev('not_met','許可登記事項與現場運作比對',refs);if(present.every(k=>fact(session,k)==='no'))return ev('met','許可登記事項與現場運作比對',refs);return ev('unknown','許可登記事項與現場運作比對',refs,present.filter(k=>fact(session,k)==='unknown').map(key=>({key})));
  }
  function authorizedFlow(session){const flows=(session.flows||[]).filter(f=>f.kind==='authorized'&&f.status!=='disputed');return flows.length?ev('met','核准收集／處理流程',flows.map(f=>f.id)):ev('unknown','核准收集／處理流程',[],[{object:'flow',kind:'authorized'}]);}
  function actualFlow(session){const flows=(session.flows||[]).filter(f=>f.kind!=='authorized'&&f.status==='confirmed');return flows.length?ev('met','實際水流路徑',flows.map(f=>f.id)):ev('unknown','實際水流路徑',[],[{object:'flow',kind:'actual'}]);}
  function graphEdges(session,kind){return (session.flows||[]).filter(f=>(kind==='authorized'?f.kind==='authorized':f.kind!=='authorized')&&f.status==='confirmed').map(f=>`${f.from}>${f.to}`);}
  function flowBypass(session){
    const a=authorizedFlow(session),b=actualFlow(session);if(a.status!=='met'||b.status!=='met')return ev('unknown','是否繞過核准收集／處理流程',[],[{object:'flow',kind:a.status!=='met'?'authorized':'actual'}]);
    const authorized=graphEdges(session,'authorized'),actual=graphEdges(session,'actual');
    if(!actual.length||!authorized.length)return ev('unknown','是否繞過核准收集／處理流程',[],[{object:'flow'}]);
    const explicit=(session.flows||[]).some(f=>f.kind==='actual'&&f.status==='confirmed'&&f.bypassesAuthorized===true);
    if(explicit)return ev('not_met','是否繞過核准收集／處理流程',(session.flows||[]).filter(f=>f.bypassesAuthorized===true).map(f=>f.id));
    const allMatch=actual.every(edge=>authorized.includes(edge));
    return allMatch?ev('met','是否繞過核准收集／處理流程',[]):ev('unknown','是否繞過核准收集／處理流程',[],[{key:'water.flow.bypass_direct_relation'}]);
  }
  function leakRisk(session){const risk=fact(session,'water.leak.risk_to_water_body'),pre=fact(session,'water.leak.preventive_measure_present');if(risk==='no')return ev('met','疏漏風險／防範',factRef(session,'water.leak.risk_to_water_body'));if(risk!=='yes')return ev('unknown','疏漏風險／防範',[],[{key:'water.leak.risk_to_water_body'}]);if(pre==='yes')return ev('met','疏漏風險／防範',[...factRef(session,'water.leak.risk_to_water_body'),...factRef(session,'water.leak.preventive_measure_present')]);if(pre==='no')return ev('not_met','疏漏風險／防範',[...factRef(session,'water.leak.risk_to_water_body'),...factRef(session,'water.leak.preventive_measure_present')]);return ev('unknown','疏漏風險／防範',factRef(session,'water.leak.risk_to_water_body'),[{key:'water.leak.preventive_measure_present'}]);}
  function leakIncident(session){const leak=fact(session,'water.leak.present'),reached=fact(session,'water.leak.reached_water_body');if(leak==='no')return ev('not_applicable','疏漏致污染水體',factRef(session,'water.leak.present'));if(leak!=='yes')return ev('unknown','疏漏致污染水體',[],[{key:'water.leak.present'}]);if(reached==='yes')return ev('met','疏漏致污染水體',[...factRef(session,'water.leak.present'),...factRef(session,'water.leak.reached_water_body')]);if(reached==='no')return ev('not_met','疏漏致污染水體',[...factRef(session,'water.leak.present'),...factRef(session,'water.leak.reached_water_body')]);return ev('unknown','疏漏致污染水體',factRef(session,'water.leak.present'),[{key:'water.leak.reached_water_body'}]);}
  function emergencyResponse(session){const incident=leakIncident(session);if(incident.status!=='met')return ev('not_applicable','立即緊急應變',incident.refs);return factEquals(session,'water.emergency.response_performed','yes','立即緊急應變');}
  function threeHour(session){const incident=leakIncident(session);if(incident.status!=='met')return ev('not_applicable','事故後三小時通知',incident.refs);const direct=fact(session,'water.emergency.notice_within_3h');if(direct==='yes')return ev('met','事故後三小時通知',factRef(session,'water.emergency.notice_within_3h'));if(direct==='no')return ev('not_met','事故後三小時通知',factRef(session,'water.emergency.notice_within_3h'));
    const a=fact(session,'water.emergency.incident_time'),b=fact(session,'water.emergency.notification_time');if(!a||!b)return ev('unknown','事故後三小時通知',[],[{key:'water.emergency.incident_time'},{key:'water.emergency.notification_time'}]);const ms=new Date(b)-new Date(a);if(!Number.isFinite(ms)||ms<0)return ev('conflict','事故後三小時通知',[...factRef(session,'water.emergency.incident_time'),...factRef(session,'water.emergency.notification_time')]);return ev(ms<=10800000?'met':'not_met','事故後三小時通知',[...factRef(session,'water.emergency.incident_time'),...factRef(session,'water.emergency.notification_time')]);}
  function announcementMatch(session){
    const date=(session.session&&session.session.incidentDate)||'';const all=Object.values(root.WATER_LEGAL_V2_ANNOUNCEMENTS||{}).filter(x=>date&&date>=x.validFrom&&(!x.validTo||date<=x.validTo)).sort((a,b)=>b.validFrom.localeCompare(a.validFrom));if(!date)return ev('unknown','有效公告版本',[],[{key:'session.incidentDate'}]);if(!all.length)return ev('unknown','有效公告版本',[],[{legalSource:'NOTICE-WATER-POLLUTING-BEHAVIOR'}]);const ann=all[0],activity=fact(session,'water.subject.activity_type'),scale=fact(session,'water.subject.regulatory_scale_status'),dest=fact(session,'water.discharge.destination_type'),impact=fact(session,'water.discharge.affects_water_quality');
    if(!activity||!scale)return ev('unknown','公告具體態樣比對',[],[{key:'water.subject.activity_type'},{key:'water.subject.regulatory_scale_status'}]);
    const profile=ann.profiles.find(p=>p.activities.includes(activity)&&(p.scale===scale||(p.scale==='below_regulated_scale_or_nonregulated'&&['below_regulated_scale','nonregulated'].includes(scale))));if(!profile)return ev('not_met','公告具體態樣比對',[]);
    const missing=[];if(profile.requiresSurfaceDischarge&&dest!=='surface_water_body')missing.push({key:'water.discharge.destination_type'});if(profile.requiresWaterQualityImpact&&impact!=='confirmed')missing.push({key:'water.discharge.affects_water_quality'});if(missing.length)return ev('unknown','公告具體態樣比對',[],missing);return ev('met','公告具體態樣比對',[]);
  }
  function soilContact(session){const v=fact(session,'water.soil.contact_mode');if(!v||v==='unknown')return ev('unknown','排放於土壤之行為型態',[],[{key:'water.soil.contact_mode'}]);if(v==='intentional_discharge')return ev('met','排放於土壤之行為型態',factRef(session,'water.soil.contact_mode'));if(v==='approved_soil_treatment')return ev('not_met','排放於土壤之行為型態',factRef(session,'water.soil.contact_mode'));if(['accidental_leak','overflow'].includes(v))return ev('not_applicable','排放於土壤之行為型態',factRef(session,'water.soil.contact_mode'));return ev('unknown','排放於土壤之行為型態',factRef(session,'water.soil.contact_mode'));}
  function soilPermit(session){return permitStatus(session,'water.soil_treatment.permit_status','土壤處理許可狀態');}
  function element(session,e){
    const [type,a,b,c]=e;if(type==='factEquals')return factEquals(session,a,b,c||a);if(type==='factIn')return factIn(session,a,b,c||a);if(type==='formalLabResult')return formalLab(session);if(type==='applicableStandard')return applicableStandard(session);if(type==='standardComparison')return standardComparison(session);if(type==='permitRequirement'){const subj=fact(session,'water.subject.type'),liq=fact(session,'water.liquid.classification'),dis=fact(session,'water.discharge.occurred'),dest=fact(session,'water.discharge.destination_type');if(!subj||!liq||!dis||!dest)return ev('unknown','本案排放許可適用性',[],[{key:'water.subject.type'},{key:'water.liquid.classification'},{key:'water.discharge.occurred'},{key:'water.discharge.destination_type'}]);return ev(['business','sewer_system'].includes(subj)&&['wastewater','sewage'].includes(liq)&&dis==='yes'&&dest==='surface_water_body'?'met':'not_met','本案排放許可適用性',[]);}if(type==='permitStatus')return permitStatus(session,a,c||b||a);if(type==='permitComparison')return permitComparison(session);if(type==='authorizedFlow')return authorizedFlow(session);if(type==='actualFlow')return actualFlow(session);if(type==='flowBypass')return flowBypass(session);if(type==='leakRisk')return leakRisk(session);if(type==='leakIncident')return leakIncident(session);if(type==='emergencyResponse')return emergencyResponse(session);if(type==='threeHourNotice')return threeHour(session);if(type==='announcementMatch')return announcementMatch(session);if(type==='soilContactMode')return soilContact(session);if(type==='soilPermit')return soilPermit(session);return ev('unknown',String(type),[],[]);
  }
  function statusFor(rule,subject,pre,els){
    if(subject.status==='not_met'||pre.some(x=>x.status==='not_met'||x.status==='not_applicable'))return 'not_applicable';
    if(subject.status==='unknown'||pre.some(x=>['unknown','conflict'].includes(x.status)))return 'facts_insufficient';
    if(rule.id==='LAW-WATER-007-01'){
      if(els[0].status!=='met'||els[1].status!=='met')return 'possible_application';
      if(els[2].status==='not_met')return 'potential_violation';
      if(els[2].status==='met')return 'no_issue_found';
      return 'facts_insufficient';
    }
    if(rule.id==='LAW-WATER-014-01-A'){
      const x=els[0];if(x.status==='not_met')return 'potential_violation';if(x.status==='met')return 'no_issue_found';if(x.status==='conflict')return 'human_review_required';return 'facts_insufficient';
    }
    if(rule.id==='LAW-WATER-014-01-B'){
      const x=els[0];if(x.status==='not_met')return 'possible_application';if(x.status==='met')return 'no_issue_found';return 'facts_insufficient';
    }
    if(rule.id==='LAW-WATER-018-1-01-C'){
      if(els.some(x=>x.status==='unknown'||x.status==='conflict'))return 'facts_insufficient';if(els[2].status==='not_met')return 'elements_substantially_met';if(els[2].status==='met')return 'no_issue_found';return 'facts_insufficient';
    }
    if(rule.id==='LAW-WATER-028-01'){
      if(els.some(x=>x.status==='not_met'))return 'possible_application';if(els.some(x=>x.status==='unknown'||x.status==='conflict'))return 'facts_insufficient';return 'no_issue_found';
    }
    if(rule.id==='LAW-WATER-030-05'){
      const x=els[0];if(x.status==='met')return 'elements_substantially_met';if(x.status==='not_met')return 'not_applicable';return 'facts_insufficient';
    }
    if(rule.id==='LAW-WATER-032-01-B1'){
      if(els[0].status==='not_applicable')return 'not_applicable';if(els.some(x=>x.status==='unknown'||x.status==='conflict'))return 'facts_insufficient';if(els[0].status==='met'&&els[1].status==='not_met')return 'potential_violation';if(els[1].status==='met')return 'no_issue_found';return 'possible_application';
    }
    if(els.some(x=>x.status==='unknown'||x.status==='conflict'))return 'facts_insufficient';if(els.some(x=>x.status==='not_met'))return 'possible_application';return 'no_issue_found';
  }
  function evaluateRule(session,rule){
    const subject=subjectState(session,rule);const prerequisites=(rule.prerequisites||[]).map(e=>element(session,e));const elements=(rule.elements||[]).map(e=>element(session,e));const status=statusFor(rule,subject,prerequisites,elements);const all=[subject,...prerequisites,...elements];const missingFacts=all.flatMap(x=>x.missingFacts||[]);const supportingRefs=[...new Set(all.flatMap(x=>x.refs||[]))];return {ruleId:rule.id,title:rule.title,ruleType:rule.ruleType,status,source:rule.source,priority:rule.priority||0,subject,prerequisites,elements,missingFacts,supportingRefs,relatedRuleIds:rule.relatedRules||[],exceptionRuleIds:rule.exceptions||[]};
  }
  function analyze(session,opts={}){
    const rules=opts.rules||root.WATER_LEGAL_V2_RULES||{};const results=Object.values(rules).filter(r=>candidate(session,r)).map(r=>evaluateRule(session,r)).sort((a,b)=>(b.priority-a.priority)||(RESULT_ORDER[b.status]-RESULT_ORDER[a.status]));const active=results.filter(r=>!['not_applicable','no_issue_found'].includes(r.status));const missing=[];for(const r of active){for(const m of r.missingFacts){const signature=JSON.stringify(m);if(!missing.some(x=>JSON.stringify(x.request)===signature))missing.push({request:m,ruleId:r.ruleId,priority:r.priority});}}
    missing.sort((a,b)=>b.priority-a.priority);return {schemaVersion:'1.0',provenance:PROVENANCE,incidentDate:(session.session&&session.session.incidentDate)||'',analyzedAt:new Date().toISOString(),results,primaryResults:active.slice(0,3),missingFacts:missing,primaryFactRequest:missing[0]||null};
  }
  root.WaterLegalEngine={analyze,evaluateRule,provenance:PROVENANCE};
})(typeof window==='undefined'?globalThis:window);
