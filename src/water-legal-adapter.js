(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  function analyze(input={}){
    const source=input.waterV2UseSession===true?input:{...input,waterV2Session:null};
    const session=root.WaterV2Session.fromLegacy(source);
    if(['yes','no'].includes(input.waterEffluentExceeded)&&root.WaterV2Session.value(session,'water.sampling.applicable_standard_confirmed')===undefined){
      root.WaterV2Session.addFact(session,'water.sampling.applicable_standard_confirmed','yes',{category:'derived',source:{type:'legacy_question_context',ref:'waterEffluentExceeded'},description:'既有欄位已明確要求與適用放流水標準比對。'});
    }
    const workflow=root.WaterV2Workflow.apply(session);
    const legal=root.WaterLegalEngine.analyze(session);
    if(root.WaterLawVersions)legal.lawVersion=root.WaterLawVersions.resolve(session.session.incidentDate);
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
