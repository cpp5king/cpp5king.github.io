(function(root){
  'use strict';
  const workflow=root.TemplateWorkflows&&root.TemplateWorkflows.waterField;
  if(!workflow||typeof workflow.prepare!=='function')return;
  const original=workflow.prepare;
  workflow.prepare=function(input={}){
    const out=original(input);
    if(out.waterV2DashboardText){
      out.fieldLiveDecisionText=`【V2流程】\n${out.waterV2DashboardText}${out.fieldLiveDecisionText?`\n\n【既有即時判定】\n${out.fieldLiveDecisionText}`:''}`;
    }
    if(out.waterV2Workflow&&out.waterV2Workflow.primaryRecommendation){
      const recommendation=out.waterV2Workflow.primaryRecommendation.label;
      out.fieldCurrentGuidanceText=`V2主要建議：${recommendation}${out.fieldCurrentGuidanceText?`\n\n${out.fieldCurrentGuidanceText}`:''}`;
    }
    if(out.waterLegalSummaryText&&out.fieldShowAssessment==='yes'){
      out.fieldRulesOverviewText=`${out.fieldRulesOverviewText||''}${out.fieldRulesOverviewText?'\n\n':''}【法規研判 V1｜Batch A】\n${out.waterLegalSummaryText}`;
    }
    return out;
  };
})(typeof window==='undefined'?globalThis:window);
