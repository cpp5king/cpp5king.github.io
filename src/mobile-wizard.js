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

    const brandRow=el('div','', 'mobile-wizard-brand-row');
    const brand=el('div','', 'mobile-wizard-brand');
    const brandMark=el('span','', 'mobile-wizard-brand-mark');
    brandMark.setAttribute('aria-hidden','true');
    brand.append(brandMark,el('strong',config.brandLabel||'稽查助手'));
    brandRow.append(brand,el('small',config.brandSlogan||'專業稽查・守護安寧','mobile-wizard-slogan'));

    const progressRow=el('div','', 'mobile-wizard-progress-row');
    const progress=el('strong','步驟 1 / 1','mobile-wizard-progress');
    const track=el('div','', 'mobile-wizard-track');
    progressRow.append(progress,track);

    const heading=el('div','', 'mobile-wizard-heading');
    const stepIcon=el('span','1','mobile-wizard-step-icon');
    stepIcon.setAttribute('aria-hidden','true');
    const title=el('h2','', 'mobile-wizard-title');
    heading.append(stepIcon,title);
    header.append(brandRow,progressRow,heading);

    const content=el('section','', 'mobile-wizard-content');
    content.setAttribute('aria-live','polite');
    const help=el('aside','', 'mobile-wizard-help');
    const helpIcon=el('span','i','mobile-wizard-help-icon');
    helpIcon.setAttribute('aria-hidden','true');
    const helpText=el('span','', 'mobile-wizard-help-text');
    help.append(helpIcon,helpText);
    content.append(help);
    const status=el('aside','', 'mobile-wizard-status');
    status.setAttribute('aria-label','目前研判摘要');

    const originalNodes=Array.from(container.children||[]);
    for(const node of originalNodes)content.append(node);
    content.append(status);
    if(container.prepend)container.prepend(header);
    else container.insertBefore?.(header,container.firstChild||null);
    container.append(content);

    const nav=el('nav','', 'mobile-wizard-nav');
    nav.setAttribute('aria-label','步驟導覽');
    const back=button('‹  上一步',true);
    const next=button('下一步  ›');
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

    function renderTrack(total,shownIndex){
      const segments=[];
      for(let i=1;i<=total;i++){
        const segment=el('span','', 'mobile-wizard-segment');
        segment.setAttribute('data-state',i<=shownIndex?'active':'pending');
        segments.push(segment);
      }
      track.replaceChildren?.(...segments);
      if(!track.replaceChildren){track.textContent='';segments.forEach(segment=>track.append(segment));}
    }

    function render(){
      const records=slotRecords();
      if(!mobileProfile()){
        container.removeAttribute?.('data-mobile-wizard');
        header.hidden=true;
        content.removeAttribute?.('data-mobile-active');
        nav.hidden=true;
        for(const {slot} of records)slot.removeAttribute?.('data-wizard-hidden');
        return;
      }
      container.setAttribute('data-mobile-wizard','yes');
      content.setAttribute('data-mobile-active','yes');
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

      const configuredSteps=config.steps||[];
      const total=Math.max(configuredSteps.length,1);
      const configuredIndex=current?configuredSteps.findIndex(step=>step.id===current.id):-1;
      const shownIndex=configuredIndex>=0?configuredIndex+1:(index>=0?Math.min(index+1,total):0);
      progress.textContent=`步驟 ${shownIndex} / ${total}`;
      title.textContent=current?.title||'目前沒有可填寫步驟';
      const helpValue=String(current?.help||'').trim();
      helpText.textContent=helpValue;
      help.hidden=!helpValue;
      stepIcon.textContent=String(shownIndex||'–');
      stepIcon.setAttribute('data-step-id',current?.id||'');
      renderTrack(total,shownIndex);
      back.disabled=index<=0;
      next.disabled=index<0||index>=steps.length-1;
      renderStatus();
    }

    function resetContentScroll(){
      if(!mobileProfile())return;
      try{content.scrollTo?.({top:0,left:0,behavior:'auto'});}
      catch(_){content.scrollTop=0;}
    }

    function move(direction){
      const steps=activeSteps();
      const current=reconcile(steps);
      const index=current?steps.findIndex(step=>step.id===current.id):-1;
      const nextIndex=index+direction;
      if(nextIndex<0||nextIndex>=steps.length)return;
      currentStepId=steps[nextIndex].id;
      render();
      resetContentScroll();
    }

    back.addEventListener('click',()=>move(-1));
    next.addEventListener('click',()=>move(1));

    function update(facts={}){
      latestFacts=facts||{};
      render();
      if(mobileProfile()&&!initialRevealQueued){
        initialRevealQueued=true;
        const reveal=()=>resetContentScroll();
        if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(reveal);
        else root.setTimeout?.(reveal,0);
      }
    }

    return {element:nav,update,render,getCurrentStep:()=>currentStepId};
  }

  root.MobileWizardUI={attach};
})(typeof window==='undefined'?globalThis:window);
