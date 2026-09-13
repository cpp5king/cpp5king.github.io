(function(root){
  'use strict';

  function el(tag,text,className){
    const node=root.document.createElement(tag);
    if(text)node.textContent=text;
    if(className)node.className=className;
    return node;
  }
  function button(text,secondary=false){
    const node=el('button',text,secondary?'secondary':'');
    node.type='button';
    return node;
  }
  function mobileProfile(){
    return (root.UiProfile?.current?.()||'desktop')==='mobile';
  }
  function isInteractive(spec){
    return !!spec&&!['computed','fixed'].includes(spec.type);
  }
  function isPresentational(spec){
    return !!spec&&(spec.type!=='computed'||spec.display===true);
  }
  function matchesStep(step,id){
    if(!id)return false;
    if((step.fields||[]).includes(id))return true;
    return (step.prefixes||[]).some(prefix=>id.startsWith(prefix));
  }

  function attach({template,fields}){
    const config=template?.mobileWizard;
    const container=fields?.element;
    if(!config||!container)return {element:null,update:()=>{}};

    const specs=new Map((template.fields||[]).map(spec=>[spec.id,spec]));
    const header=el('section','', 'mobile-wizard-header');
    header.setAttribute('aria-label',config.ariaLabel||'手機逐步流程');
    const progressRow=el('div','', 'mobile-wizard-progress-row');
    const progress=el('strong','步驟 1 / 1','mobile-wizard-progress');
    const title=el('span','', 'mobile-wizard-title');
    progressRow.append(progress,title);
    const track=el('div','', 'mobile-wizard-track');
    const fill=el('span','', 'mobile-wizard-fill');
    track.append(fill);
    const status=el('div','', 'mobile-wizard-status');
    header.append(progressRow,track,status);

    if(container.prepend)container.prepend(header);
    else if(container.insertBefore)container.insertBefore(header,container.firstChild||null);
    else container.append(header);

    const nav=el('nav','', 'mobile-wizard-nav');
    nav.setAttribute('aria-label','步驟導覽');
    const back=button('← 上一步',true);
    const next=button('下一步 →');
    nav.append(back,next);

    const form=container.closest?.('form');
    form?.classList?.add('mobile-wizard-enabled');
    container.setAttribute('data-mobile-wizard','yes');

    let latestFacts={};
    let currentStepId='';
    let initialRevealQueued=false;

    function slotRecords(){
      if(!container.querySelectorAll)return [];
      return Array.from(container.querySelectorAll('.sentence-slot')).map(slot=>{
        const id=slot.getAttribute?.('data-field-id')||slot.dataset?.fieldId||'';
        return {id,slot,spec:specs.get(id)};
      }).filter(record=>record.spec);
    }

    function configuredStepFor(record){
      return (config.steps||[]).find(step=>matchesStep(step,record.id))||null;
    }

    function visibleInteractiveRecords(){
      return slotRecords().filter(({slot,spec})=>!slot.hidden&&isInteractive(spec));
    }

    function activeSteps(){
      const visible=visibleInteractiveRecords();
      const steps=(config.steps||[]).filter(step=>visible.some(record=>matchesStep(step,record.id)));
      const unmatched=visible.filter(record=>!configuredStepFor(record));
      if(unmatched.length){
        steps.push({
          id:'__mobile_wizard_other__',
          title:config.fallbackTitle||'其他必要事項',
          __records:unmatched
        });
      }
      return steps;
    }

    function recordsForStep(step){
      if(step?.__records)return step.__records;
      return slotRecords().filter(record=>matchesStep(step||{},record.id));
    }

    function stepOrder(id){
      if(id==='__mobile_wizard_other__')return Number.MAX_SAFE_INTEGER;
      const index=(config.steps||[]).findIndex(step=>step.id===id);
      return index<0?Number.MAX_SAFE_INTEGER:index;
    }

    function reconcile(steps){
      if(!steps.length){currentStepId='';return null;}
      const existing=steps.find(step=>step.id===currentStepId);
      if(existing)return existing;
      if(!currentStepId){currentStepId=steps[0].id;return steps[0];}
      const previousOrder=stepOrder(currentStepId);
      const nextCandidate=steps.find(step=>stepOrder(step.id)>=previousOrder);
      const target=nextCandidate||steps[steps.length-1];
      currentStepId=target.id;
      return target;
    }

    function renderStatus(){
      const blocks=[];
      for(const item of config.statusFields||[]){
        const value=String(latestFacts?.[item.id]||'').trim();
        if(!value)continue;
        const block=el('p','', 'mobile-wizard-status-line');
        if(item.label)block.append(el('strong',item.label+'：'));
        block.append(root.document.createTextNode(value));
        blocks.push(block);
      }
      status.replaceChildren?.(...blocks);
      if(!status.replaceChildren){status.textContent='';blocks.forEach(block=>status.append(block));}
      status.hidden=!blocks.length;
    }

    function render(){
      const records=slotRecords();
      if(!mobileProfile()){
        container.removeAttribute?.('data-mobile-wizard');
        header.hidden=true;
        nav.hidden=true;
        for(const {slot} of records)slot.removeAttribute?.('data-wizard-hidden');
        return;
      }
      container.setAttribute('data-mobile-wizard','yes');
      header.hidden=false;
      nav.hidden=false;
      const steps=activeSteps();
      const current=reconcile(steps);
      const index=current?steps.findIndex(step=>step.id===current.id):-1;

      for(const record of records){
        const show=!!current&&isPresentational(record.spec)&&matchesStep(current,record.id);
        record.slot.setAttribute?.('data-wizard-hidden',show?'no':'yes');
        record.slot.setAttribute?.('data-wizard-current',show?'yes':'no');
      }

      const total=Math.max(steps.length,1);
      const shownIndex=index>=0?index+1:0;
      progress.textContent=`步驟 ${shownIndex} / ${total}`;
      title.textContent=current?.title||'目前沒有可填寫步驟';
      fill.setAttribute('style',`width:${shownIndex?Math.round(shownIndex/total*100):0}%`);
      back.disabled=index<=0;
      next.disabled=index<0||index>=steps.length-1;
      renderStatus();
    }

    function focusCurrentStep(){
      const steps=activeSteps();
      const current=steps.find(step=>step.id===currentStepId);
      if(!current)return;
      const target=recordsForStep(current).find(record=>!record.slot.hidden&&isInteractive(record.spec));
      if(!target)return;
      target.slot.scrollIntoView?.({behavior:'smooth',block:'start'});
      target.slot.querySelector?.('input,select,textarea,button')?.focus?.();
    }

    function move(direction){
      const steps=activeSteps();
      const current=reconcile(steps);
      const index=current?steps.findIndex(step=>step.id===current.id):-1;
      const nextIndex=index+direction;
      if(nextIndex<0||nextIndex>=steps.length)return;
      currentStepId=steps[nextIndex].id;
      render();
      focusCurrentStep();
    }

    back.addEventListener('click',()=>move(-1));
    next.addEventListener('click',()=>move(1));

    function update(facts={}){
      latestFacts=facts||{};
      render();
      if(mobileProfile()&&!initialRevealQueued){
        initialRevealQueued=true;
        const reveal=()=>header.scrollIntoView?.({behavior:'auto',block:'start'});
        if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(reveal);
        else root.setTimeout?.(reveal,0);
      }
    }

    return {element:nav,update,render,getCurrentStep:()=>currentStepId};
  }

  root.MobileWizardUI={attach};
})(typeof window==='undefined'?globalThis:window);