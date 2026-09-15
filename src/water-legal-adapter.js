(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  function analyze(input={}){
    const source=input.waterV2UseSession===true?input:{...input,waterV2Session:null};
    const session=root.WaterV2Session.fromLegacy(source);
    const workflow=root.WaterV2Workflow.apply(session);
    const legal=root.WaterLegalEngine.analyze(session);
    return {
      session,
      workflow,
      legal,
      dashboardText:root.WaterV2Workflow.dashboardText(workflow),
      factSummaryText:root.WaterV2Summary.factualText(session),
      legalSummaryText:root.WaterV2Summary.legalText(legal)
    };
  }
  root.WaterLegalAdapter={analyze,provenance:PROVENANCE};
})(typeof window==='undefined'?globalThis:window);
