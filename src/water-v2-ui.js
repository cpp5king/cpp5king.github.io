(function(root){
  'use strict';
  const workflow=root.TemplateWorkflows&&root.TemplateWorkflows.waterField;
  if(!workflow||typeof workflow.prepare!=='function')return;
  const original=workflow.prepare;
  const factLabels={
    'water.subject.type':'行為主體／稽查對象',
    'water.liquid.classification':'該股水是否屬廢（污）水',
    'water.discharge.occurred':'是否有實際排放',
    'water.discharge.destination_type':'排放最終去向',
    'water.permit.discharge_status':'排放許可狀態',
    'water.sampling.formal_result_available':'正式採樣檢驗結果',
    'water.sampling.applicable_standard_confirmed':'適用放流水標準',
    'water.sampling.standard_exceeded':'正式檢驗結果與標準比對',
    'water.leak.risk_to_water_body':'是否有疏漏至水體之虞',
    'water.leak.preventive_measure_present':'是否已採維護／防範措施',
    'water.leak.reached_water_body':'疏漏是否進入水體',
    'water.emergency.response_performed':'是否已立即緊急應變',
    'water.emergency.incident_time':'事故發生時間',
    'water.emergency.notification_time':'主管機關通知時間',
    'water.control_zone.status':'是否位於水污染管制區',
    'water.subject.activity_type':'業別／製程類型',
    'water.subject.regulatory_scale_status':'水污管制規模狀態',
    'water.discharge.affects_water_quality':'是否有事實支持影響水體品質',
    'water.soil.contact_mode':'廢污水接觸土壤的行為型態',
    'water.soil_treatment.permit_status':'土壤處理許可狀態',
    'water.flow.bypass_direct_relation':'實際水流是否直接繞過核准收集／處理流程'
  };
  function requestLabel(item){
    if(!item)return '';
    const req=item.request||item;
    if(req.key)return factLabels[req.key]||req.key;
    if(req.object==='flow'&&req.kind==='authorized')return '核准收集／處理流程';
    if(req.object==='flow'&&req.kind==='actual')return '實際水流路徑';
    if(req.object==='flow')return '核准流程與實際水流關係';
    if(req.legalSource)return '案件日期當日有效的公告版本';
    return '';
  }
  workflow.prepare=function(input={}){
    const out=original(input);
    if(out.waterV2DashboardText){
      out.fieldLiveDecisionText=`【V2流程】\n${out.waterV2DashboardText}${out.fieldLiveDecisionText?`\n\n【既有即時判定】\n${out.fieldLiveDecisionText}`:''}`;
    }
    if(out.waterV2Workflow&&out.waterV2Workflow.primaryRecommendation){
      const recommendation=out.waterV2Workflow.primaryRecommendation.label;
      const legalMissing=requestLabel(out.waterLegalAnalysis&&out.waterLegalAnalysis.primaryFactRequest);
      out.fieldCurrentGuidanceText=`V2主要建議：${recommendation}${legalMissing?`\n法規研判尚缺：${legalMissing}`:''}${out.fieldCurrentGuidanceText?`\n\n${out.fieldCurrentGuidanceText}`:''}`;
    }
    if(out.waterLegalSummaryText&&out.fieldShowAssessment==='yes'){
      out.fieldRulesOverviewText=`${out.fieldRulesOverviewText||''}${out.fieldRulesOverviewText?'\n\n':''}【法規研判 V1｜Batch A】\n${out.waterLegalSummaryText}`;
    }
    return out;
  };
})(typeof window==='undefined'?globalThis:window);
