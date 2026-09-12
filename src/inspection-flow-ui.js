(function(root){
  'use strict';

  function el(tag,text,className){
    const doc=root.document||(typeof document!=='undefined'?document:null);
    const node=doc.createElement(tag);
    if(text)node.textContent=text;
    if(className)node.className=className;
    return node;
  }
  function button(text,action,secondary=false){
    const node=el('button',text,secondary?'secondary':'');
    node.type='button';
    node.addEventListener('click',action);
    return node;
  }
  function hasValue(value){return Array.isArray(value)?value.length>0:!!value;}
  function started(config,facts){
    const keys=config.startFields||[];
    return !keys.length||keys.some(key=>hasValue(facts?.[key]));
  }
  function focusFirst(fields,ids=[]){
    for(const id of ids)if(fields.focusField(id))return true;
    return false;
  }
  function mobileProfile(){
    return (root.UiProfile?.current?.()||'desktop')==='mobile';
  }
  function installMultiSelectHold(template,fields){
    const container=fields?.element;
    if(!container||!template.mobileFocusMode)return ()=>false;
    container.addEventListener('change',event=>{
      if(!mobileProfile()||event?.target?.type!=='checkbox')return;
      const slot=event.target.closest?.('.sentence-slot');
      if(!slot)return;
      container.querySelectorAll?.('.multi-select-editing').forEach(node=>{
        if(node!==slot)node.classList?.remove('multi-select-editing');
      });
      slot.classList?.add('multi-select-editing');
    });
    return ()=>{
      const editing=container.querySelector?.('.multi-select-editing');
      if(!editing)return false;
      editing.classList?.remove('multi-select-editing');
      return true;
    };
  }

  function attach({template,fields,workflow,performHandoff,onEnd}){
    const config=template.quickActions;
    if(!config)return {element:null,update:()=>{}};
    const labels={
      back:'← 上一步',next:'下一步 →',summary:'研判摘要',missing:'缺漏事證',
      handoff:'進入案件研判',end:'結束本次查察',emergency:'立即處置／緊急應變',
      ...(config.labels||{})
    };
    const floating=el('div','', 'field-floating-actions');
    floating.setAttribute('aria-label',config.ariaLabel||'流程快速操作');
    const left=el('div','', 'field-action-rail field-action-left');
    const right=el('div','', 'field-action-rail field-action-right');
    const releaseMultiSelect=installMultiSelectHold(template,fields);

    const back=button(labels.back,()=>{
      releaseMultiSelect();
      fields.navigateStep(-1);
    },true);
    const next=button(labels.next,()=>{
      // 複選題在手機上不因勾第一項就視為「已完成」。
      // 使用者可連續勾選，按「下一步」才離開該複選題。
      releaseMultiSelect();
      fields.focusCurrent();
    });
    left.append(back);

    let summary=null,missing=null,handoff=null,end=null,emergency=null;
    if(config.summaryField){
      summary=button(labels.summary,()=>fields.focusField(config.summaryField),true);
      left.append(summary);
    }
    right.append(next);
    if(config.missingField){
      missing=button(labels.missing,()=>fields.focusField(config.missingField),true);
      right.append(missing);
    }
    if(config.handoff&&performHandoff){
      handoff=button(labels.handoff,performHandoff);
      right.append(handoff);
    }
    if(config.endEarly&&onEnd){
      end=button(labels.end,onEnd,true);
      right.append(end);
    }
    if((config.emergencyFields||[]).length){
      emergency=button(labels.emergency,()=>focusFirst(fields,config.emergencyFields));
      emergency.className+=' danger';
      right.append(emergency);
    }
    floating.append(left,right);

    function update(facts={}){
      const hasStart=started(config,facts);
      back.disabled=!hasStart;
      next.disabled=!hasStart;
      if(handoff){
        const allowed=workflow?.canHandoff?.(facts) ?? (!template.handoff?.when||root.DraftEngine.matches(template.handoff.when,facts));
        handoff.hidden=!allowed;
      }
      if(end){
        const completeValue=config.completeValue||'yes';
        end.disabled=!hasStart||(config.completeField&&facts[config.completeField]===completeValue);
      }
      if(emergency){
        const active=workflow?.emergencyActive?workflow.emergencyActive(facts):true;
        emergency.hidden=!active;
      }
    }

    return {element:floating,update};
  }

  root.InspectionFlowUI={attach};
})(typeof window==='undefined'?globalThis:window);