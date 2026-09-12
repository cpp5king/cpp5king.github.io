(function(root){
  'use strict';
  function current(){
    const width=Number(root.innerWidth||root.document?.documentElement?.clientWidth||1200);
    if(width<=760)return 'mobile';
    if(width<=1100)return 'tablet';
    return 'desktop';
  }
  function answered(spec,facts){
    if(['computed','fixed'].includes(spec.type))return true;
    const value=facts?.[spec.id];
    if(spec.type==='checklist')return Array.isArray(value)&&value.length>0;
    if(spec.type==='choiceGroup')return !!value;
    if(Array.isArray(value))return value.length>0;
    return String(value??'').trim()!=='';
  }
  root.UiProfile={current,answered};
})(typeof window==='undefined'?globalThis:window);
