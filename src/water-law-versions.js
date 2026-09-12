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
  function resolve(dateValue){
    const date=validDate(dateValue);
    if(!date){
      return {date:'',status:'unknown',permitRegime:'unknown',measuresRegime:'unknown',
        text:'稽查日期尚未填寫，無法自動判定子法施行版本。請先填入稽查日期；程式不以裝置目前日期代替案件日期。'};
    }
    const permitAfter=date>='2026-10-01';
    const measuresAfter=date>='2026-04-20';
    const deferredAfter=date>='2029-04-20';
    const permitRegime=permitAfter?'2026-03-24-revision-effective':'2024-01-11-general-with-2026-art57';
    const measuresRegime=measuresAfter?(deferredAfter?'2026-04-20-full-deferred-window-passed':'2026-04-20-effective-provisions'):'2025-01-20-or-earlier';
    const permitText=permitAfter
      ?'許可審查：適用115年3月24日修正版（除第57條自發布日施行外，其餘自115年10月1日施行）。'
      :'許可審查：115年10月1日前案件，原則仍以113年1月11日版本之一般規則為基礎；115年3月24日修正中僅第57條自發布日施行。';
    const measuresText=measuresAfter
      ?(deferredAfter
        ?'水措管理：115年4月20日修正版之延後施行時點已屆；仍應依個別條文與附表確認適用。'
        :'水措管理：以115年4月20日修正版中已生效條文為準；另定施行日期之自動監測／附表項目，本版僅提示，不自動認定違規。')
      :'水措管理：案件日期早於115年4月20日，應回查當時有效版本；本版不以新制回溯判斷。';
    return {date,status:'resolved',permitRegime,measuresRegime,text:`${permitText}\n${measuresText}`};
  }
  root.WaterLawVersions={resolve,sources:SOURCES};
})(typeof window==='undefined'?globalThis:window);
