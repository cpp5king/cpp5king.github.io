(function(root){
  'use strict';
  const SOURCES=Object.freeze({
    measures:{name:'水污染防治措施及檢測申報管理辦法',revision:'2026-04-20',sourceId:'FL040734'},
    permit:{name:'水污染防治措施計畫及許可申請審查管理辦法',revision:'2026-03-24',sourceId:'GL005950'}
  });

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const d=new Date(value+'T00:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;
  }

  function resolvePermit(dateValue){
    const date=validDate(dateValue);
    if(!date){
      return {
        date:'',status:'unknown',permitRegime:'unknown',
        text:'許可審查：行為發生日期尚未確認，適用法規版本待確認；不以稽查日期或裝置日期替代。'
      };
    }
    const after=date>='2026-10-01';
    const permitRegime=after?'2026-03-24-revision-effective':'2024-01-11-general-with-2026-art57';
    const text=after
      ?'許可審查：適用115年3月24日修正版（除第57條自發布日施行外，其餘自115年10月1日施行）。'
      :'許可審查：115年10月1日前行為，原則仍以113年1月11日版本之一般規則為基礎；115年3月24日修正中僅第57條自發布日施行。';
    return {date,status:'resolved',permitRegime,text};
  }

  function resolve(dateValue){
    const permit=resolvePermit(dateValue);
    const measures=root.WaterMeasureLaw?.resolveVersion
      ? root.WaterMeasureLaw.resolveVersion(dateValue)
      : {status:'packMissing',regime:'unknown',text:'水措管理：Water Measure Rule Pack 尚未載入。'};

    return {
      date:permit.date||measures.date||'',
      status:permit.status==='resolved'&&measures.status==='resolved'?'resolved':(permit.status==='unknown'&&measures.status==='dateUnknown'?'unknown':'partial'),
      permitRegime:permit.permitRegime||'unknown',
      measuresRegime:measures.regime||'unknown',
      permit,
      measures,
      text:[permit.text,measures.text].filter(Boolean).join('\n')
    };
  }

  root.WaterLawVersions={resolve,resolvePermit,sources:SOURCES};
})(typeof window==='undefined'?globalThis:window);
