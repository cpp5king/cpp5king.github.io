(function(root){
  'use strict';
  const stateLabels={not_applicable:'目前不適用',facts_insufficient:'資料不足',possible_application:'可能適用',elements_substantially_met:'主要要件大致具備',exception_possible:'存在例外待確認',potential_violation:'可能不符合',no_issue_found:'目前未見不符',human_review_required:'建議人工確認'};
  const keyLabels={'water.discharge.destination_type':'排放最終去向','water.subject.type':'行為主體','water.liquid.classification':'該股水性質','water.permit.discharge_required':'本案是否依法需排放許可','water.permit.discharge_status':'排放許可狀態','water.sampling.formal_result_available':'正式檢驗結果','water.sampling.applicable_standard_confirmed':'適用放流水標準','water.sampling.standard_exceeded':'正式檢驗與標準比對','water.control_zone.status':'水污染管制區','water.subject.activity_type':'業別／製程','water.subject.regulatory_scale_status':'管制規模','water.discharge.affects_water_quality':'是否影響水體品質','water.soil.contact_mode':'排放於土壤之行為型態','water.soil_treatment.permit_status':'土壤處理許可'};
  function legalText(analysis){
    if(!analysis||!analysis.results)return '尚無法規研判結果。';
    const visible=analysis.results.filter(r=>!['not_applicable','no_issue_found'].includes(r.status));if(!visible.length)return '目前依已輸入事實，Batch A 核心規則未發現需優先處理的法規研判項目。';
    return visible.slice(0,5).map((r,i)=>{
      const missing=(r.missingFacts||[]).slice(0,3).map(x=>keyLabels[x.key]||(x.object==='flow'?'水流關係':x.object)||'待確認事實').join('、');
      return `${i+1}. ${r.source.law}第${r.source.article}條｜${r.title}\n狀態：${stateLabels[r.status]||r.status}${missing?`\n尚缺：${missing}`:''}`;
    }).join('\n\n');
  }
  function factualText(session){
    const idx=root.WaterV2Session.factIndex(session),parts=[];
    const val=k=>idx[k]&&idx[k].value;
    if(val('water.discharge.occurred')==='yes')parts.push('本次已記錄有實際排放行為。');
    if(val('water.discharge.destination_type'))parts.push(`排放去向：${val('water.discharge.destination_type')}。`);
    if(val('water.premises.relation_status'))parts.push(`場所關聯狀態：${val('water.premises.relation_status')}。`);
    if((session.flows||[]).length)parts.push(`目前建立 ${(session.flows||[]).length} 筆水流關係。`);
    if((session.incidents||[]).length)parts.push(`目前有 ${(session.incidents||[]).length} 個異常事件紀錄。`);
    return parts.length?parts.join('\n'):'目前尚未形成足以摘要的核心現場事實。';
  }
  root.WaterV2Summary={factualText,legalText};
})(typeof window==='undefined'?globalThis:window);
