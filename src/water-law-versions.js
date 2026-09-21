(function(root){
  'use strict';

  function sourceFrom(facade){
    const source=facade?.packInfo?.()?.officialSources?.[0]||{};
    return Object.freeze({
      name:source.title||'',
      revision:source.revision||'',
      sourceId:source.sourceId||''
    });
  }

  const SOURCES={};
  Object.defineProperties(SOURCES,{
    measures:{enumerable:true,get(){return sourceFrom(root.WaterMeasureLaw);}},
    permit:{enumerable:true,get(){return sourceFrom(root.WaterPermitLaw);}}
  });
  Object.freeze(SOURCES);

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
