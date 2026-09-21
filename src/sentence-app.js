(function (root) {
  "use strict";
  async function start() {
    const app = document.getElementById('app');
    app.textContent = '正在載入本機模板…';
    let config;
    try { config = await root.TemplateLoader.load(root.INSPECTION_CONFIG); }
    catch (error) { app.textContent = '無法啟動：' + error.message + ' 請檢查 data/templates 設定後重新整理。'; return; }
    const session = root.CaseSession.create(config);
    function el(tag, text, className) {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    }
    function button(text, action, secondary = false) {
      const node = el('button', text, secondary ? 'secondary' : '');
      node.type = 'button'; node.addEventListener('click', action); return node;
    }
    function hasInput() {
      const state = session.snapshot();
      const waterHasData = !!root.WaterV2UI?.hasData?.();
      const wasteHasData = !!root.WasteV1UI?.hasData?.();
      return waterHasData || wasteHasData || !!state.outputs || Object.values(state.inputs).some(value => Array.isArray(value) ? value.length : value !== '');
    }
    function navigate(action) {
      const waterHasData = !!root.WaterV2UI?.hasData?.();
      const wasteHasData = !!root.WasteV1UI?.hasData?.();
      if (hasInput() && !window.confirm('切換將清除目前輸入及兩份草稿（含手動修改），是否繼續？')) return;
      if (waterHasData) root.WaterV2UI.reset();
      if (wasteHasData) root.WasteV1UI.reset();
      action(); render();
    }
    function navigation(state) {
      const nav = el('nav', '', 'actions'); nav.setAttribute('aria-label', '案件選擇導覽');
      if (state.categoryId) nav.append(button('首頁／案件大類', () => navigate(() => session.home()), true));
      if (state.caseTypeId) nav.append(button('重新選擇案件類型', () => navigate(() => session.selectCategory(state.categoryId)), true));
      if (state.templateId && !config.caseTypes.find(item => item.id === state.caseTypeId)?.directTemplateId) nav.append(button('切換紀錄範本', () => navigate(() => session.selectCaseType(state.caseTypeId)), true));
      if (state.templateId || root.WasteV1UI?.hasData?.()) nav.append(button('匯出案件', () => exportCase(), true));
      nav.append(button('匯入案件', () => importInput.click(), true));
      return nav;
    }
    const importInput = document.createElement('input');
    importInput.type = 'file'; importInput.accept = '.json,application/json'; importInput.hidden = true;
    if(document.body?.append)document.body.append(importInput);
    function exportCase(){
      const state=session.snapshot();
      const wasteHasData=state.categoryId==='waste'&&root.WasteV1UI?.hasData?.()&&root.WasteV1UI?.snapshot;
      if(!state.templateId&&!wasteHasData){window.alert?.('目前沒有可匯出的案件。');return;}
      if(state.categoryId==='water'&&root.WaterV2UI?.hasData?.()&&root.WaterV2UI?.snapshot){
        state.waterV2State=root.WaterV2UI.snapshot();
      }
      if(wasteHasData)state.wasteV1State=root.WasteV1UI.snapshot();
      const text=root.CaseFile.serialize(state,root.INSPECTION_APP_META);
      const blob=new Blob([text],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=root.CaseFile.filename(state);document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    }
    importInput.addEventListener('change',async()=>{
      const file=importInput.files?.[0]; importInput.value=''; if(!file)return;
      try{
        if(hasInput()&&!window.confirm('匯入案件將取代目前輸入及草稿，是否繼續？'))return;
        const parsed=root.CaseFile.parse(await file.text(),config);
        session.restore(parsed.state);
        if(root.WaterV2UI){
          if(parsed.state.waterV2State&&root.WaterV2UI.restore)root.WaterV2UI.restore(parsed.state.waterV2State);
          else root.WaterV2UI.reset?.();
        }
        if(root.WasteV1UI){
          if(parsed.state.wasteV1State&&root.WasteV1UI.restore)root.WasteV1UI.restore(parsed.state.wasteV1State);
          else root.WasteV1UI.reset?.();
        }
        render();
      }catch(error){window.alert?.('無法匯入案件：'+error.message);}
    });
    function render() {
      app.replaceChildren(); const state = session.snapshot(); app.append(navigation(state));
      const category = config.categories.find(item => item.id === state.categoryId);
      const type = config.caseTypes.find(item => item.id === state.caseTypeId);
      const template = config.templates.find(item => item.id === state.templateId);
      document.body?.setAttribute?.('data-module',category?.id || 'home');
      if (category?.id === 'water' && root.WaterV2UI?.mount) {
        const waterHost = el('section', '', 'water-v2-host');
        app.append(waterHost);
        root.WaterV2UI.mount(waterHost);
        return;
      }
      if (category?.id === 'waste' && root.WasteV1UI?.mount) {
        const wasteHost = el('section', '', 'waste-v1-host');
        app.append(wasteHost);
        root.WasteV1UI.mount(wasteHost);
        return;
      }
      const trail = [category?.title, type?.title, type?.directTemplateId ? null : template?.title].filter(Boolean).join(' → ');
      if (trail) app.append(el('p', trail));
      let title;
      if (!category) {
        title = '選擇案件大類';
        const list = el('div', '', 'actions');
        for (const item of config.categories) {
          const entry = button(item.title + (item.status === 'development' ? '（開發中）' : ''), () => { session.selectCategory(item.id); render(); });
          entry.setAttribute('data-module',item.id);
          entry.disabled = item.status !== 'active'; list.append(entry);
        }
        app.append(el('h2', title), list);
      } else if (!type) {
        title = '選擇案件類型'; app.append(el('h2', title));
        const list = el('div', '', 'actions');
        for (const item of config.caseTypes.filter(item => item.categoryId === category.id)) {
          const entry = button(item.title + (item.status === 'development' ? '（開發中）' : ''), () => { session.selectCaseType(item.id); if (item.directTemplateId) session.selectTemplate(item.directTemplateId); render(); });
          entry.disabled = item.status !== 'active'; list.append(entry);
        }
        app.append(list);
      } else if (!template) {
        title = '選擇處理情境／紀錄範本'; app.append(el('h2', title));
        const list = el('div', '', 'actions');
        const available = config.templates.filter(item => item.categoryId === category.id && item.caseTypeId === type.id);
        for (const item of available) list.append(button(item.title, () => { session.selectTemplate(item.id); render(); }));
        if (!available.length) list.append(el('p', '目前尚無可用範本。'));
        app.append(list);
      } else renderForm(template);
      const heading = app.querySelector('h2'); if (heading) { heading.tabIndex = -1; heading.focus(); }
    }
    function renderForm(template) {
      const draftActionLabel = template.draftActionLabel || '完成／產生紀錄';
      const form = el('form'); form.autocomplete = 'off';
      if(template.quickActions||template.floatingFieldActions)form.className='field-floating-enabled';
      form.addEventListener('submit', event => event.preventDefault());
      form.append(el('h2', template.formTitle || '填寫案件事實'));
      for (const related of template.relatedTemplates || []) form.append(button(related.label, () => navigate(() => session.selectTemplate(related.id)), true));
      const instructions=el('p',template.instructions||'');
      if(template.instructions)form.append(instructions);
      const status = el('p'); status.setAttribute('role', 'status');
      let updateQuickActions=()=>{};
      const fields = root.FieldRenderer.render(template, facts => {
        session.setInputs(facts);
        finish.hidden=!template.finishWhen || !root.DraftEngine.matches(template.finishWhen,facts);
        if(template.retryLabelField)retry.textContent=facts[template.retryLabelField]||template.retryLabel;
        if(template.finishLabelField)finish.textContent=facts[template.finishLabelField]||'結束本次量測';
        retry.hidden=!template.retryWhen || !root.DraftEngine.matches(template.retryWhen,facts);
        actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen && root.DraftEngine.matches(template.previewOnlyWhen,facts);
        instructions.textContent=(template.instructionWhen && root.DraftEngine.matches(template.instructionWhen,facts))?template.previewInstructions:(actions.hidden?(template.previewInstructions||template.instructions):template.instructions);
        if (template.workflow && !session.snapshot().outputs) {
          outputs.hidden = true;
          drafts.record.value = ''; drafts.reply.value = '';
          status.textContent = '';
        }
        if (session.snapshot().stale) status.textContent = '輸入已變更，下方仍為上次紀錄；請重新產生紀錄。';
        updateQuickActions(facts);
      });
      form.append(fields.element);
      const outputs = el('div'); outputs.hidden = true;
      const drafts = {};
      for (const [kind, title] of [['record', '稽查紀錄草稿'], ['reply', '民眾回覆草稿']]) {
        const section = el('section', '', 'panel'); section.append(el('h2', title));
        const label = el('label', '可修改文字；不會改動原始草稿模板。'); label.htmlFor = kind;
        const area = el('textarea'); area.id = kind; area.rows = 8; area.autocomplete = 'off'; area.spellcheck = false; drafts[kind] = area;
        const message = el('p'); message.setAttribute('role', 'status');
        const copy = button('複製文字', async () => {
          message.textContent = '';
          try {
            if (!navigator.clipboard?.writeText) throw new Error('fallback');
            await navigator.clipboard.writeText(area.value); message.textContent = '已複製目前文字。';
          } catch (_) {
            area.focus(); area.select(); let copied = false;
            try { copied = document.execCommand('copy'); } catch (_) { /* 手動複製 */ }
            message.textContent = copied ? '已複製目前文字。' : '已選取文字，請按 Ctrl+C 複製。';
          }
        }, true);
        area.addEventListener('input', () => { session.editOutput(kind, area.value); message.textContent = ''; });
        section.append(label, area, copy, message); outputs.append(section);
      }
      let flowUi=null;
      const actions = el('div', '', 'actions');
      actions.setAttribute('data-draft-actions','yes');
      if(template.initialGate)actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen && root.DraftEngine.matches(template.previewOnlyWhen,root.DraftEngine.normalize(template,{}));
      if (template.demo && template.demoLabel) actions.append(button(template.demoLabel, () => {
        session.setInputs(fields.write(template.demo));
        status.textContent = session.snapshot().outputs ? '已套用範例選項；下方仍為上次紀錄，請重新產生紀錄。' : `已套用範例選項，請按「${draftActionLabel}」。`;
      }, true));
      const draftAction=button(draftActionLabel, () => {
        if(!template.validateOnSubmit&&template.previewOnlyWhen && root.DraftEngine.matches(template.previewOnlyWhen,fields.read()))return;
        const beforeGenerate=session.snapshot();
        if (beforeGenerate.outputs) {
          const reviewCount=Array.isArray(beforeGenerate.legalReviews)?beforeGenerate.legalReviews.length:0;
          const message=beforeGenerate.categoryId==='water'&&reviewCount
            ?'重新產生會更新下方兩份草稿及手動修改；先前第 '+reviewCount+' 次法規研判快照會保留，不會被覆寫。是否繼續？'
            :'重新產生將覆蓋下方兩份紀錄及手動修改，是否繼續？';
          if(!window.confirm(message))return;
        }
        try {
          session.setInputs(fields.read()); const generated = session.generate();
          drafts.record.value = generated.record; drafts.reply.value = generated.reply;
          outputs.querySelectorAll('[role="status"]').forEach(node => { node.textContent = ''; });
          outputs.hidden = false;
          const generatedState=session.snapshot();
          const reviewCount=Array.isArray(generatedState.legalReviews)?generatedState.legalReviews.length:0;
          status.textContent = generatedState.categoryId==='water'&&reviewCount
            ?'已依選項產生兩份紀錄，並保留第 '+reviewCount+' 次法規研判快照；請核對後複製使用。'
            :'已依選項產生兩份紀錄，請核對後複製使用。';
          const shownInMobileResult=flowUi?.showResults?.()===true;
          if(!shownInMobileResult)drafts.record.focus();
        } catch (error) {
          const message='無法產生紀錄：' + error.message;
          status.textContent = message;
          flowUi?.showError?.(message);
        }
      });
      draftAction.setAttribute('data-draft-action','yes');
      actions.append(draftAction);
      const retry=button(template.retryLabel||'重新量測',()=>{
        const workflow=root.TemplateWorkflows?.[template.workflow];
        if(!workflow?.restart)return;
        session.setInputs(fields.write(workflow.restart(fields.read())));
        outputs.hidden=true;drafts.record.value='';drafts.reply.value='';status.textContent='';retry.hidden=true;finish.hidden=true;actions.hidden=!template.validateOnSubmit;
      },true);retry.hidden=true;
      const finish=button('結束本次量測',()=>{
        const workflow=root.TemplateWorkflows?.[template.workflow];if(!workflow?.finish)return;
        session.setInputs(fields.write(workflow.finish(fields.read())));
        const facts=session.snapshot().inputs;
        actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen&&root.DraftEngine.matches(template.previewOnlyWhen,facts);
        finish.hidden=!template.finishWhen||!root.DraftEngine.matches(template.finishWhen,facts);retry.hidden=finish.hidden;
        outputs.hidden=true;drafts.record.value='';drafts.reply.value='';status.textContent='';
      },true);finish.hidden=true;
      const handoffActions=el('div','','actions');
      const performHandoff=()=>{
        if(!template.handoff)return;
        const facts=fields.read();
        if(template.handoff.confirmMessage&&!window.confirm(template.handoff.confirmMessage))return;
        session.handoff(template.handoff.caseTypeId,template.handoff.templateId,facts);
        render();
      };
      if(template.handoff){
        const handoff=button(template.handoff.label||'繼續下一步',performHandoff);
        handoffActions.append(handoff);
        const updateHandoff=facts=>{handoffActions.hidden=!!template.quickActions?.handoff||!!template.floatingFieldActions||(!!template.handoff.when&&!root.DraftEngine.matches(template.handoff.when,facts));};
        updateHandoff(session.snapshot().inputs);
        form.addEventListener('change',()=>updateHandoff(session.snapshot().inputs));
        form.addEventListener('input',()=>updateHandoff(session.snapshot().inputs));
      }else handoffActions.hidden=true;

      if(template.quickActions){
        const workflow=root.TemplateWorkflows?.[template.workflow];
        const endEarly=()=>{
          if(!workflow?.endEarly)return;
          const facts=fields.read();
          const confirmMessage=template.quickActions.endConfirmMessage||'將以目前已查得事實結束本次現場查察；未確認事項會保留為事證不足，是否繼續？';
          if(confirmMessage&&!window.confirm(confirmMessage))return;
          const ended=workflow.endEarly(facts);
          const normalized=fields.write(ended);session.setInputs(normalized);
          actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen&&root.DraftEngine.matches(template.previewOnlyWhen,normalized);
          instructions.textContent=(template.instructionWhen&&root.DraftEngine.matches(template.instructionWhen,normalized))?template.previewInstructions:(actions.hidden?(template.previewInstructions||template.instructions):template.instructions);
          outputs.hidden=true;drafts.record.value='';drafts.reply.value='';
          status.textContent=template.quickActions.endStatusMessage||'已結束本次現場查察；可查看研判或產生案件文字。';
          updateQuickActions(normalized);
        };
        flowUi=root.InspectionFlowUI?.attach({template,fields,workflow,performHandoff,onEnd:endEarly,outputs,status});
        if(flowUi?.element){form.append(flowUi.element);updateQuickActions=flowUi.update;updateQuickActions(session.snapshot().inputs);}
      }


      form.append(actions,retry,finish,handoffActions); app.append(form, status, outputs);
      const existing=session.snapshot().inputs;
      if(Object.values(existing).some(value=>Array.isArray(value)?value.length:value!=='')){
        const facts=fields.write(existing);
        finish.hidden=!template.finishWhen||!root.DraftEngine.matches(template.finishWhen,facts);
        retry.hidden=finish.hidden;
        actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen&&root.DraftEngine.matches(template.previewOnlyWhen,facts);
        if(template.handoff)handoffActions.hidden=!!template.quickActions?.handoff||!!template.floatingFieldActions||(!!template.handoff.when&&!root.DraftEngine.matches(template.handoff.when,facts));
        updateQuickActions(facts);
      }
    }
    render();
  }
  const appMeta=root.INSPECTION_APP_META;
  if(appMeta){
    if(root.document)root.document.title=appMeta.label;
    const appVersionTitle=root.document?.querySelector?.('#app-version-title');
    if(appVersionTitle)appVersionTitle.textContent=appMeta.label;
  }
  // 可供 DOM 整合測試呼叫，同一個入口在實際頁面自動啟動。
  root.InspectionApp = { start };
  const homeInstructions=document.querySelector?.('#home-instructions');
  if(homeInstructions)homeInstructions.textContent=root.NOISE_TEXTS.ui.homeInstructions;
  start();
})(window);