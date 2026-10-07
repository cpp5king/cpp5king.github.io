(function(root){
  'use strict';
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/[\\s（）()／/、，,。．.－_-]+/g,'');
  function pack(){return root.WATER_BUSINESS_CLASSIFICATION_DATA||{records:[],aliases:{},meta:{}};}
  function get(id){return (pack().records||[]).find(row=>row.id===id)||null;}
  function haystack(row){
    const aliases=pack().aliases?.[row.id]||[];
    return [row.no,row.name,row.officialDefinition,row.applicability,row.notes,...(row.keywords||[]),...aliases].map(normalize).join('|');
  }
  function score(row,query){
    const q=normalize(query);if(!q)return 0;
    const n=normalize(row.name),a=(pack().aliases?.[row.id]||[]).map(normalize),k=(row.keywords||[]).map(normalize);
    if(String(row.no)===q)return 120;
    if(n===q)return 110;
    if(n.includes(q))return 95;
    if(a.some(x=>x===q))return 90;
    if(k.some(x=>x===q))return 85;
    if(a.some(x=>x.includes(q))||k.some(x=>x.includes(q)))return 70;
    return haystack(row).includes(q)?50:0;
  }
  function search(query,{limit=12}={}){
    const q=normalize(query);if(!q)return [];
    return (pack().records||[]).map(row=>({row,score:score(row,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.row.no-b.row.no).slice(0,limit).map(x=>x.row);
  }
  function normalizeSelections(value){
    const seen=new Set();return (Array.isArray(value)?value:[]).filter(x=>x&&get(x.id)&&!seen.has(x.id)&&seen.add(x.id)).map(x=>({id:x.id,status:['candidate','confirmed','rejected','unknown'].includes(x.status)?x.status:'candidate',evidence:String(x.evidence||'')}));
  }
  function confirmed(value){return normalizeSelections(value).filter(x=>x.status==='confirmed');}
  root.WaterBusinessClassification=Object.freeze({search,get,all:()=>[...(pack().records||[])],normalizeSelections,confirmed,meta:()=>pack().meta||{},count:()=>pack().records?.length||0});
})(typeof window==='undefined'?globalThis:window);
