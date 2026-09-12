(function(root){
  'use strict';

  const template=(root.INSPECTION_CONFIG?.templates||[]).find(item=>item.id==='water-main');
  if(template){
    template.version='4.7.2';
    template.assessmentFloatingActions=true;
    const dateIndex=template.fields.findIndex(item=>item.id==='waterInspectionDate');
    const hasSummary=template.fields.some(item=>item.id==='waterLiveDecisionText');
    if(dateIndex>=0&&!hasSummary){
      template.fields.splice(dateIndex,0,
        {id:'waterLiveDecisionText',label:'案件研判摘要',type:'computed',missing:'尚待確認',display:true,className:'live-assessment'},
        {id:'waterLiveMissingText',label:'尚缺關鍵事證',type:'computed',missing:'尚待確認',display:true,className:'live-assessment'}
      );
    }
  }

  const mainWorkflow=root.TemplateWorkflows?.waterMain;
  if(mainWorkflow?.prepare&&!mainWorkflow.__v472Patched){
    const originalPrepare=mainWorkflow.prepare;
    const unique=list=>[...new Set(list.filter(Boolean))];
    const parseOverview=text=>{
      const established=[],pending=[];
      String(text||'').split(/\r?\n/).forEach(line=>{
        const clean=line.trim();
        if(!clean)return;
        const label=clean.split('：')[0]?.trim();
        if(!label)return;
        if(clean.includes('☑ 構成要件完整')||clean.includes('⚠ 疑似不符合'))established.push(label);
        if(clean.includes('? 事證不足')||clean.includes('? 待確認')||clean.includes('? 待查子法'))pending.push(label);
      });
      return {established:unique(established),pending:unique(pending)};
    };
    const bullets=list=>list.map(x=>'• '+x).join('\n');
    const buildQuick=out=>{
      const final=String(out.waterFinalConclusionText||'');
      const {established,pending}=parseOverview(out.waterRulesOverviewText);
      if(final.startsWith('D｜')){
        return '目前狀態：🔴 重大／緊急污染\n\n優先控制污染、保護下游並完成緊急應變與證據固定。';
      }
      if(established.length){
        const finalReady=out.waterInvestigationComplete==='yes'&&pending.length===0;
        const parts=[`目前狀態：🔴 構成要件完整`,`【${finalReady?'違反法規':'目前已具完整要件'}】\n${bullets(established)}`];
        if(pending.length)parts.push('【另待確認】\n'+bullets(pending));
        return parts.join('\n\n');
      }
      if(pending.length||out.waterInvestigationComplete!=='yes'){
        const involved=pending.length?pending:['案件必要查證事項'];
        return '目前狀態：🟡 尚在查證\n\n【目前可能涉及】\n'+bullets(involved);
      }
      return '目前狀態：🟢 本次查無違規事證\n\n依本次已完成查證之事實，尚無足資認定違反水污染防治法之事證。';
    };
    const buildMissing=out=>{
      const {pending}=parseOverview(out.waterRulesOverviewText);
      if(pending.length)return '【尚缺關鍵事證】\n'+bullets(pending.map(x=>'完成「'+x+'」構成要件／證據確認'));
      if(out.waterInvestigationComplete!=='yes')return '【尚缺關鍵事證】\n• 確認本次案件必要查證事項是否均已完成';
      return '目前無關鍵缺漏。';
    };
    mainWorkflow.prepare=function(input={}){
      const out=originalPrepare(input);
      out.waterLiveDecisionText=buildQuick(out);
      out.waterLiveMissingText=buildMissing(out);
      return out;
    };
    mainWorkflow.__v472Patched=true;
  }

  const renderer=root.FieldRenderer;
  if(renderer?.render&&!renderer.__v472Patched){
    const originalRender=renderer.render;
    const makeButton=(text,action,secondary=false)=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=text;
      if(secondary)button.className='secondary';
      button.addEventListener('click',action);
      return button;
    };
    renderer.render=function(template,onChange){
      const result=originalRender(template,onChange);

      // iOS may preview today's date immediately when the native picker opens.
      // Block that preview "input" event from reaching the generic renderer listener;
      // the committed "change" event still proceeds normally after the user confirms.
      result.element.addEventListener('input',event=>{
        if(event?.target?.type==='date'){event.stopImmediatePropagation?.();event.stopPropagation?.();}
      },true);

      if(template.assessmentFloatingActions){
        result.element.className += ' field-floating-enabled';
        const floating=document.createElement('div');
        floating.className='field-floating-actions';
        floating.setAttribute('aria-label','案件研判快速操作');
        const left=document.createElement('div');
        left.className='field-action-rail field-action-left';
        const right=document.createElement('div');
        right.className='field-action-rail field-action-right';
        const back=makeButton('← 上一步',()=>result.navigateStep(-1),true);
        const summary=makeButton('研判摘要',()=>result.focusField('waterLiveDecisionText'),true);
        const next=makeButton('下一步 →',()=>result.focusCurrent());
        const missing=makeButton('缺漏事證',()=>result.focusField('waterLiveMissingText'),true);
        left.append(back,summary);
        right.append(next,missing);
        floating.append(left,right);
        result.element.append(floating);
      }
      return result;
    };
    renderer.__v472Patched=true;
  }
})(typeof window==='undefined'?globalThis:window);
(function(root){
  'use strict';
  const doc=root.document;
  const panel=doc?.querySelector?.('#mobile-install');
  const message=doc?.querySelector?.('#mobile-install-message');
  const installButton=doc?.querySelector?.('#pwa-install-button');
  const isMobile=/Android|iPhone|iPad|iPod/i.test(root.navigator?.userAgent||'') || root.matchMedia?.('(max-width: 760px)').matches;
  const standalone=root.matchMedia?.('(display-mode: standalone)').matches || root.navigator?.standalone===true;
  const secure=root.location?.protocol==='https:' || (root.location?.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(root.location?.hostname));
  if(!isMobile||standalone)return;
  if(panel)panel.hidden=false;
  if(!secure){
    if(message)message.textContent='手機版第一次安裝需由 HTTPS 網址開啟；安裝完成後即可離線使用。ZIP 內檔案仍可供 Windows 離線版使用。';
    if(installButton)installButton.hidden=true;
    return;
  }
  if('serviceWorker' in root.navigator){
    root.addEventListener('load',()=>root.navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  }
  const isiOS=/iPhone|iPad|iPod/i.test(root.navigator?.userAgent||'');
  if(isiOS){
    if(message)message.textContent='iPhone／iPad：請用 Safari 開啟，點「分享」→「加入主畫面」。完成後可離線使用。';
    if(installButton)installButton.hidden=true;
    return;
  }
  let deferredPrompt=null;
  root.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();deferredPrompt=event;
    if(message)message.textContent='可將稽查助手安裝到手機主畫面，安裝後可離線使用。';
    if(installButton)installButton.hidden=false;
  });
  installButton?.addEventListener('click',async()=>{
    if(!deferredPrompt)return;
    deferredPrompt.prompt();
    try{await deferredPrompt.userChoice;}catch(_){/* no-op */}
    deferredPrompt=null;installButton.hidden=true;
  });
})(window);
