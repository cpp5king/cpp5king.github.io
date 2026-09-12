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
      return !!state.outputs || Object.values(state.inputs).some(value => Array.isArray(value) ? value.length : value !== '');
    }
    function navigate(action) {
      if (hasInput() && !window.confirm('切換將清除目前輸入及兩份草稿（含手動修改），是否繼續？')) return;
      action(); render();
    }
    function navigation(state) {
      const nav = el('nav', '', 'actions'); nav.setAttribute('aria-label', '案件選擇導覽');
      if (state.categoryId) nav.append(button('首頁／案件大類', () => navigate(() => session.home()), true));
      if (state.caseTypeId) nav.append(button('重新選擇案件類型', () => navigate(() => session.selectCategory(state.categoryId)), true));
      if (state.templateId && !config.caseTypes.find(item => item.id === state.caseTypeId)?.directTemplateId) nav.append(button('切換紀錄範本', () => navigate(() => session.selectCaseType(state.caseTypeId)), true));
      if (state.templateId) nav.append(button('匯出案件', () => exportCase(), true));
      nav.append(button('匯入案件', () => importInput.click(), true));
      return nav;
    }
    const importInput = document.createElement('input');
    importInput.type = 'file'; importInput.accept = '.json,application/json'; importInput.hidden = true;
    if(document.body?.append)document.body.append(importInput);
    function exportCase(){
      const state=session.snapshot();
      if(!state.templateId){window.alert?.('目前沒有可匯出的案件。');return;}
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
        session.restore(parsed.state); render();
      }catch(error){window.alert?.('無法匯入案件：'+error.message);}
    });
    function render() {
      app.replaceChildren(); const state = session.snapshot(); app.append(navigation(state));
      const category = config.categories.find(item => item.id === state.categoryId);
      const type = config.caseTypes.find(item => item.id === state.caseTypeId);
      const template = config.templates.find(item => item.id === state.templateId);
      const trail = [category?.title, type?.title, type?.directTemplateId ? null : template?.title].filter(Boolean).join(' → ');
      if (trail) app.append(el('p', trail));
      let title;
      if (!category) {
        title = '選擇案件大類';
        const list = el('div', '', 'actions');
        for (const item of config.categories) {
          const entry = button(item.title + (item.status === 'development' ? '（開發中）' : ''), () => { session.selectCategory(item.id); render(); });
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
      const draftActionLabel = template.draftActionLabel || '填入兩份草稿';
      const form = el('form'); form.autocomplete = 'off';
      if(template.floatingFieldActions)form.className='field-floating-enabled';
      form.addEventListener('submit', event => event.preventDefault());
      form.append(el('h2', template.formTitle || '填寫案件事實'));
      for (const related of template.relatedTemplates || []) form.append(button(related.label, () => navigate(() => session.selectTemplate(related.id)), true));
      const instructions=el('p',template.instructions||'');
      if(template.instructions)form.append(instructions);
      const status = el('p'); status.setAttribute('role', 'status');
      let updateFloatingActions=()=>{};
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
        if (session.snapshot().stale) status.textContent = `輸入已變更，下方仍為上次草稿；請重新${draftActionLabel}。`;
        updateFloatingActions(facts);
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
      const actions = el('div', '', 'actions');
      if(template.initialGate)actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen && root.DraftEngine.matches(template.previewOnlyWhen,root.DraftEngine.normalize(template,{}));
      if (template.demo && template.demoLabel) actions.append(button(template.demoLabel, () => {
        session.setInputs(fields.write(template.demo));
        status.textContent = session.snapshot().outputs ? `已套用範例選項；下方仍為上次草稿，請重新${draftActionLabel}。` : `已套用範例選項，請按「${draftActionLabel}」。`;
      }, true));
      actions.append(button(draftActionLabel, () => {
        if(!template.validateOnSubmit&&template.previewOnlyWhen && root.DraftEngine.matches(template.previewOnlyWhen,fields.read()))return;
        if (session.snapshot().outputs && !window.confirm('重新填入將覆蓋下方兩份草稿及手動修改，是否繼續？')) return;
        try {
          session.setInputs(fields.read()); const generated = session.generate();
          drafts.record.value = generated.record; drafts.reply.value = generated.reply;
          outputs.querySelectorAll('[role="status"]').forEach(node => { node.textContent = ''; });
          outputs.hidden = false; status.textContent = '已依選項填回兩份草稿，請核對後複製使用。'; drafts.record.focus();
        } catch (error) { status.textContent = '無法填入草稿：' + error.message; }
      }));
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
        const updateHandoff=facts=>{handoffActions.hidden=!!template.floatingFieldActions||(!!template.handoff.when&&!root.DraftEngine.matches(template.handoff.when,facts));};
        updateHandoff(session.snapshot().inputs);
        form.addEventListener('change',()=>updateHandoff(session.snapshot().inputs));
        form.addEventListener('input',()=>updateHandoff(session.snapshot().inputs));
      }else handoffActions.hidden=true;

      if(template.floatingFieldActions){
        const workflow=root.TemplateWorkflows?.[template.workflow];
        const floating=el('div','','field-floating-actions');
        floating.setAttribute('aria-label','現場流程快速操作');
        const left=el('div','','field-action-rail field-action-left');
        const right=el('div','','field-action-rail field-action-right');
        const back=button('← 上一步',()=>fields.navigateStep(-1),true);
        const decision=button('目前判定',()=>fields.focusField('fieldLiveDecisionText'),true);
        const next=button('下一步 →',()=>fields.focusCurrent());
        const assess=button('進入案件研判',performHandoff);
        const end=button('結束本次查察',()=>{
          const facts=fields.read();
          if(!window.confirm('將以目前已查得事實結束本次現場查察；未確認事項會保留為事證不足，是否繼續？'))return;
          const ended=workflow?.endEarly?workflow.endEarly(facts):{...facts,waterInvestigationComplete:'yes'};
          const normalized=fields.write(ended); session.setInputs(normalized);
          actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen&&root.DraftEngine.matches(template.previewOnlyWhen,normalized);
          instructions.textContent=(template.instructionWhen&&root.DraftEngine.matches(template.instructionWhen,normalized))?template.previewInstructions:(actions.hidden?(template.previewInstructions||template.instructions):template.instructions);
          outputs.hidden=true; drafts.record.value=''; drafts.reply.value=''; status.textContent='已結束本次現場查察；可查看上方／下方研判或產生案件文字。';
          updateFloatingActions(normalized);
        },true);
        const emergency=button('立即處置／緊急應變',()=>{
          if(!fields.focusField('waterEmergencyActionTaken'))fields.focusField('waterSevereHazardRiskConfirmed');
        });
        emergency.className+=' danger';
        left.append(back,decision); right.append(next,assess,end,emergency); floating.append(left,right); form.append(floating);
        updateFloatingActions=facts=>{
          const hasStart=!!(facts.fieldSourceMode||facts.waterSubjectType);
          back.disabled=!hasStart;
          next.disabled=!hasStart;
          assess.hidden=!(workflow?.canHandoff?.(facts)||root.DraftEngine.matches(template.handoff?.when,facts));
          end.disabled=!hasStart||facts.waterInvestigationComplete==='yes';
          emergency.hidden=!workflow?.emergencyActive?.(facts);
        };
        updateFloatingActions(session.snapshot().inputs);
      }

      form.append(actions,retry,finish,handoffActions); app.append(form, status, outputs);
      const existing=session.snapshot().inputs;
      if(Object.values(existing).some(value=>Array.isArray(value)?value.length:value!=='')){
        const facts=fields.write(existing);
        finish.hidden=!template.finishWhen||!root.DraftEngine.matches(template.finishWhen,facts);
        retry.hidden=finish.hidden;
        actions.hidden=!template.validateOnSubmit&&!!template.previewOnlyWhen&&root.DraftEngine.matches(template.previewOnlyWhen,facts);
        if(template.handoff)handoffActions.hidden=!!template.floatingFieldActions||(!!template.handoff.when&&!root.DraftEngine.matches(template.handoff.when,facts));
        updateFloatingActions(facts);
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
