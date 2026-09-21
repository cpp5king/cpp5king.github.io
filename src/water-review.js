(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const SCHEMA='water-legal-review';
  const SCHEMA_VERSION=1;
  const clone=value=>JSON.parse(JSON.stringify(value));

  function fnv1a32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h.toString(16).padStart(8,'0');
  }

  function info(facade){
    const value=facade?.packInfo?.();
    if(!value)return null;
    return {
      packId:value.packId||'',
      packVersion:value.packVersion||'',
      status:value.status||'unknown',
      jurisdiction:value.jurisdiction||'',
      integrity:value.integrity?clone(value.integrity):null
    };
  }

  function packSnapshot(){
    return {
      core:info(root.WaterLaw),
      measure:info(root.WaterMeasureLaw),
      permit:info(root.WaterPermitLaw),
      standard:info(root.WaterStandardLaw),
      local:info(root.WaterLocalLaw)
    };
  }

  function common({sequence=1,mode,behaviorDate='',inspectionDate='',factsSnapshot,assessment,outputSnapshot}){
    const facts=clone(factsSnapshot||{});
    const packs=packSnapshot();
    return {
      schema:SCHEMA,
      schemaVersion:SCHEMA_VERSION,
      reviewId:'water-review-'+sequence,
      sequence,
      reviewedAt:new Date().toISOString(),
      mode,
      behaviorDate:String(behaviorDate||''),
      inspectionDate:String(inspectionDate||''),
      inputHash:fnv1a32(JSON.stringify(facts)),
      packSnapshot:packs,
      packHash:fnv1a32(JSON.stringify(packs)),
      factsSnapshot:facts,
      assessment:clone(assessment||{}),
      outputSnapshot:clone(outputSnapshot||null),
      provenance:PROVENANCE
    };
  }

  function captureTemplate(state={},sequence=1){
    const inputs=state.inputs||{};
    return common({
      sequence,
      mode:'template',
      behaviorDate:inputs.waterBehaviorDate||'',
      inspectionDate:inputs.waterInspectionDate||'',
      factsSnapshot:inputs,
      assessment:{
        finalConclusion:String(inputs.waterFinalConclusionText||''),
        liveDecision:String(inputs.waterLiveDecisionText||''),
        rulesOverview:String(inputs.waterRulesOverviewText||''),
        missing:String(inputs.waterLiveMissingText||''),
        coreLawVersion:String(inputs.waterCoreLawVersionText||''),
        measureLawVersion:String(inputs.waterMeasureLawVersionText||''),
        permitLawVersion:String(inputs.waterPermitLawVersionText||''),
        standardLawVersion:String(inputs.waterStandardLawVersionText||''),
        standardRoute:String(inputs.waterStandardRouteText||''),
        localRuleStatus:String(inputs.waterLocalRuleStatusText||'')
      },
      outputSnapshot:state.outputs||null
    });
  }

  function captureV2({caseInfo={},factLines=[],assessment={},rawState={},draftText=''},sequence=1){
    const snapshot=clone(rawState||{});
    if(snapshot&&typeof snapshot==='object')delete snapshot.legalReviews;
    return common({
      sequence,
      mode:'water-v2',
      behaviorDate:caseInfo.behaviorDate||'',
      inspectionDate:caseInfo.inspectionDate||'',
      factsSnapshot:{state:snapshot,factLines:clone(factLines||[])},
      assessment:{
        laws:clone(assessment.laws||[]),
        pending:clone(assessment.pending||[]),
        lawVersion:clone(assessment.lawVersion||null)
      },
      outputSnapshot:{draftText:String(draftText||'')}
    });
  }

  function validate(review){
    if(!review||typeof review!=='object'||Array.isArray(review))throw new Error('法規研判快照格式無效。');
    if(review.schema!==SCHEMA||review.schemaVersion!==SCHEMA_VERSION)throw new Error('法規研判快照版本不支援。');
    if(!Number.isSafeInteger(review.sequence)||review.sequence<1)throw new Error('法規研判快照序號無效。');
    if(typeof review.reviewId!=='string'||!review.reviewId)throw new Error('法規研判快照識別碼無效。');
    if(typeof review.mode!=='string'||!['template','water-v2'].includes(review.mode))throw new Error('法規研判快照模式無效。');
    if(!review.factsSnapshot||typeof review.factsSnapshot!=='object'||Array.isArray(review.factsSnapshot))throw new Error('法規研判快照缺少事實快照。');
    if(!review.assessment||typeof review.assessment!=='object'||Array.isArray(review.assessment))throw new Error('法規研判快照缺少研判結果。');
    if(!review.packSnapshot||typeof review.packSnapshot!=='object'||Array.isArray(review.packSnapshot))throw new Error('法規研判快照缺少 Rule Pack 快照。');
    return clone(review);
  }

  root.WaterReview=Object.freeze({
    PROVENANCE,
    SCHEMA,
    SCHEMA_VERSION,
    packSnapshot,
    captureTemplate,
    captureV2,
    validate
  });
})(typeof window==='undefined'?globalThis:window);
