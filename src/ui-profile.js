(function(root){
  'use strict';
  function current(){
    const width=Number(root.innerWidth||root.document?.documentElement?.clientWidth||1200);
    if(width<=760)return 'mobile';
    if(width<=1100)return 'tablet';
    return 'desktop';
  }
  function mobileEditing(spec){
    if(current()!=='mobile')return false;
    const target=root.document?.activeElement;
    if(!target)return false;
    const tag=String(target.tagName||'').toLowerCase();
    const type=String(target.type||'text').toLowerCase();
    const editable=tag==='textarea'||(tag==='input'&&['text','number','search','tel','url','email'].includes(type));
    if(!editable)return false;
    const slot=target.closest?.('.sentence-slot');
    return slot?.getAttribute?.('data-field-id')===spec.id;
  }
  function answered(spec,facts){
    if(['computed','fixed'].includes(spec.type))return true;
    if(mobileEditing(spec))return false;
    const value=facts?.[spec.id];
    if(spec.type==='checklist')return Array.isArray(value)&&value.length>0;
    if(spec.type==='choiceGroup')return !!value;
    if(Array.isArray(value))return value.length>0;
    return String(value??'').trim()!=='';
  }
  root.UiProfile={current,answered};
})(typeof window==='undefined'?globalThis:window);
