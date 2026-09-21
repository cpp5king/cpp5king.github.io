(function(root){
  'use strict';
  const SOURCES=Object.freeze({
    measures:{name:'水污染防治措施及檢測申報管理辦法',revision:'2026-04-20',sourceId:'FL040734'},
    permit:{name:'水污染防治措施計畫及許可申請審查管理辦法',revision:'2026-03-24',sourceId:'GL005950'}
  });

  function resolvePermit(dateValue){
    if(!root.WaterPermitLaw?.resolveVersion){
      return {date:'',status:'packMissing',permitRegime:'unknown',text:'許可審查：Water Permit Rule Pack 尚未載入。'};
    }
    const r=root.WaterPermitLaw.resolveVersion(dateValue);
    return {
      ...r,
      permitRegime:r.regime||'unknown'
    };
  }

  function resolve(dateValue){
    const permit=resolvePermit(dateValue);
    const measures=root.WaterMeasureLaw?.resolveVersion
      ? root.WaterMeasureLaw.resolveVersion(dateValue)
      : {status:'packMissing',regime:'unknown',text:'水措管理：Water Measure Rule Pack 尚未載入。'};

    return {
      date:permit.date||measures.date||'',
      status:permit.status==='resolved'&&measures.status==='resolved'
        ?'resolved'
        :((permit.status==='dateUnknown'||permit.status==='unknown')&&measures.status==='dateUnknown'?'unknown':'partial'),
      permitRegime:permit.permitRegime||'unknown',
      measuresRegime:measures.regime||'unknown',
      permit,
      measures,
      text:[permit.text,measures.text].filter(Boolean).join('\n')
    };
  }

  root.WaterLawVersions={resolve,resolvePermit,sources:SOURCES};
})(typeof window==='undefined'?globalThis:window);
