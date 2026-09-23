(function (root) {
  "use strict";
  async function start() {
    const app = document.getElementById('app');
    app.textContent = '正在載入本機模板…';
    let config;
    try { config = await root.TemplateLoader.load(root.INSPECTION_CONFIG); }
    catch (error) { app.textContent = '無法啟動：' + error.message + ' 請檢查 data/templates 設定後重新整理。'; return; }
    const session = root.CaseSession.create(config);
    let viewMode = 'home';
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
      const airHasData = !!root.AirV1UI?.hasData?.();
      return waterHasData || wasteHasData || airHasData || !!state.outputs || Object.values(state.inputs).some(value => Array.isArray(value) ? value.length : value !== '');
    }
    function resetModuleDrafts() {
      if (root.WaterV2UI?.hasData?.()) root.WaterV2UI.reset();
      if (root.WasteV1UI?.hasData?.()) root.WasteV1UI.reset();
      if (root.AirV1UI?.hasData?.()) root.AirV1UI.reset();
    }
    function destructiveNavigate(action, nextView='case', message='切換將清除目前輸入及兩份草稿（含手動修改），是否繼續？') {
      if (hasInput() && !window.confirm(message)) return false;
      resetModuleDrafts();
      action();
      viewMode = nextView;
      render();
      return true;
    }
    function isDirectCaseType(item) {
      if (!item) return false;
      if (item.directTemplateId) return true;
      return (item.categoryId === 'air' && ['air-fixed-source','air-construction','air-open-burning'].includes(item.id)) || item.id === 'waste-inspection';
    }
    function clearCurrentCase() {
      const state=session.snapshot();
      if (!state.categoryId && !hasInput()) return;
      if (!window.confirm('新增案件將清除目前輸入、法規研判與兩份草稿（含手動修改），是否繼續？')) return;
      resetModuleDrafts();
      session.home();
      viewMode='home';
      render();
    }
    function lawContext(state){
      const context={caseTypeId:state.caseTypeId,templateId:state.templateId,sessionState:state,relatedLaws:[]};
      if(state.categoryId==='air'){
        if(['air-fixed-source','air-construction','air-open-burning'].includes(state.caseTypeId)&&root.AirV1UI?.snapshot){
          const airState=root.AirV1UI.snapshot();
          context.airState=airState;
          context.related=root.AIR_RULE_PACK?.assess?.({mode:state.caseTypeId,state:airState})||null;
        }else if(state.caseTypeId==='restaurant-odor'){
          context.related=root.AIR_RULE_PACK?.assess?.({mode:'restaurant-odor',inputs:state.inputs})||null;
        }
      }else if(state.categoryId==='water'){
        const facts=root.WaterV2UI?.hasData?.()?['目前案件已有水污染現場事實紀錄']:['目前案件位於水污染模組'];
        const missing=['仍須依行為日期、管制主體、排放／水措事實確認實際適用條文'];
        context.relatedLaws=[
          {id:'water-act',title:'水污染防治法｜母法方向',facts,missing,articleRefs:['7','13','14','18','20','22','25','30','31','32']},
          {id:'water-measure-reg',title:'水措設施／操作／檢測申報方向',facts,missing:['依現場水措型態確認設施、操作、計測、紀錄及申報等具體義務'],articleRefs:['4','7','8','9','10','11','31','39','40','41','53','65','89-1']},
          {id:'water-permit-reg',title:'水措計畫／許可核對方向',facts,missing:['確認是否屬應辦水措計畫或許可之管制主體與行為']},
          {id:'effluent-standard',title:'放流水標準方向',facts,missing:['有實際排放或水質判斷需求時，再依業別與排放型態確認限值'],articleRefs:['2']}
        ];
      }else if(state.categoryId==='noise'){
        const facts=[state.caseTypeId?`目前案件類型：${state.caseTypeId}`:'目前案件位於噪音模組'];
        context.relatedLaws=[
          {id:'noise-act',title:'噪音管制法｜案件類型與管制依據',facts,missing:['確認噪音源類型、管制區、時段及適用公告'],articleRefs:['6','8','9','11']},
          {id:'noise-standard',title:'噪音管制標準｜量測與評定',facts,missing:['需要量測判定時，確認量測位置、背景音量、評定方法與標準值'],articleRefs:['2','3','4','5','6','7','8','9','10']}
        ];
      }else if(state.categoryId==='waste'){
        const facts=root.WasteV1UI?.hasData?.()?['目前案件已有廢棄物事實／關聯紀錄']:['目前案件位於廢棄物模組'];
        context.relatedLaws=[
          {id:'waste-act',title:'廢棄物清理法｜主要法律方向',facts,missing:['依物質批次、產生者、持有人、清除處理與流向事實確認適用條文'],articleRefs:['2','9','11','12','14','27','28','30','31','33','36','38','39','41','46','48','49','59','71']},
          {id:'waste-rules',title:'廢棄物清理法施行細則｜補充規定',facts,missing:['需要名詞、執行細節或程序補充時再核對施行細則']}
        ];
      }
      return context;
    }
    function moduleStickyActions(items=[]){
      const bar=el('div','', 'module-sticky-actions');bar.setAttribute('aria-label','本流程快速操作');
      for(const item of items){const b=button(item.label,item.action,true);if(item.className)b.classList.add(item.className);bar.append(b);}
      return bar;
    }
    function scrollToTop(){window.scrollTo?.({top:0,behavior:'smooth'});}
    function closeActionModal(){document.querySelector?.('.ia-action-overlay')?.remove?.();}
    function actionModal(title,bodyBuilder,actions=[]){
      closeActionModal();const overlay=el('div','', 'ia-action-overlay');const panel=el('section','', 'ia-action-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',title);
      const head=el('div','', 'ia-action-head');head.append(el('h2',title));const close=button('關閉',closeActionModal,true);head.append(close);panel.append(head);
      const body=el('div','', 'ia-action-body');bodyBuilder?.(body);panel.append(body);
      if(actions.length){const row=el('div','', 'ia-action-buttons');for(const a of actions)row.append(button(a.label,a.action,a.secondary!==false));panel.append(row);}
      overlay.append(panel);document.body.append(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)closeActionModal();});close.focus();
    }
    function displayTemplateValue(field,facts){
      const raw=facts?.[field.id];if(Array.isArray(raw)){
        if(!raw.length)return '';
        return raw.map(id=>field.items?.find(x=>x.id===id)?.label||id).join('、');
      }
      const value=String(raw??'').trim();if(!value)return '';
      if(['select','choiceGroup'].includes(field.type)){
        if(value==='custom')return String(facts?.[field.id+'Custom']||'').trim()||'自訂值尚未填寫';
        return field.options?.find(x=>x.id===value)?.label||value;
      }
      return value;
    }
    function openTemplateSummary(template,facts){
      const normalized=root.DraftEngine.normalize(template,facts||{});
      actionModal('整理目前內容',body=>{
        const intro=el('p','只整理目前已填或已計算的內容；尚未填寫的欄位不會被系統自行補入。','ia-action-note');body.append(intro);
        const list=el('div','', 'ia-current-facts');let count=0;
        for(const field of template.fields||[]){
          if(field.type==='fixed')continue;if(field.showWhen&&!root.DraftEngine.matches(field.showWhen,normalized))continue;
          const value=displayTemplateValue(field,normalized);if(!value)continue;
          const row=el('div','', 'ia-current-fact');row.append(el('strong',field.label),el('span',value));list.append(row);count++;
        }
        if(!count)list.append(el('p','目前尚無可整理的輸入內容。','ia-action-empty'));
        body.append(list);
        try{
          const generated=root.DraftEngine.generate(config,template.id,normalized);
          if(generated?.record){const sec=el('section','', 'ia-action-draft');sec.append(el('h3','稽查紀錄草稿'));const pre=el('div',generated.record,'ia-action-pre');sec.append(pre);body.append(sec);}
        }catch(error){const n=el('p','目前尚未達到正式草稿產生條件；仍保留上方目前內容供現場整理。','ia-action-note');body.append(n);}
      });
    }
    function openNoiseAssessment(template,facts){
      const normalized=root.DraftEngine.normalize(template,facts||{});
      const fields=['noiseZoneResultText','noiseA8ExceptionSummary','noiseRouteText','noiseStandardText','noiseMeasurementPointText','noiseResultText','noiseValidation'];
      actionModal('法規研判',body=>{
        body.append(el('p','依目前已填事實顯示既有噪音規則結果；未確認事項不自動推定。','ia-action-note'));
        let count=0;
        for(const id of fields){const spec=(template.fields||[]).find(x=>x.id===id);const value=String(normalized[id]||'').trim();if(!spec||!value)continue;const row=el('div','', 'ia-assessment-row');row.append(el('strong',spec.label),el('div',value));body.append(row);count++;}
        if(!count)body.append(el('p','目前尚無足夠事實形成法規研判結果。','ia-action-empty'));
      },[{label:'查看相關法規',action:()=>{closeActionModal();root.LawReferenceUI?.open?.('noise',lawContext(session.snapshot()));}}]);
    }
    function navigation(state) {
      const nav = el('nav', '', 'actions'); nav.setAttribute('aria-label', '案件選擇導覽');
      const category=config.categories.find(item=>item.id===state.categoryId);
      if (viewMode!=='home') nav.append(button('首頁／案件大類', () => { viewMode='home'; render(); }, true));
      if (state.categoryId && viewMode==='case') nav.append(button(`返回${category?.title||'模組'}首頁`, () => { viewMode='category'; render(); }, true));
      if (state.templateId && viewMode==='case' && !config.caseTypes.find(item => item.id === state.caseTypeId)?.directTemplateId) nav.append(button('返回紀錄範本', () => { viewMode='template'; render(); }, true));
      if (viewMode!=='case' && state.categoryId) nav.append(button('返回目前案件', () => { viewMode='case'; render(); }, true));
      if (state.categoryId || hasInput()) nav.append(button('新增案件', clearCurrentCase, true));
      if (['water','noise','waste','air'].includes(state.categoryId) && root.LawReferenceUI?.open && viewMode!=='home') nav.append(button('法規', () => root.LawReferenceUI.open(state.categoryId,lawContext(state)), true));
      if (viewMode==='case' && (state.templateId || root.WasteV1UI?.hasData?.() || root.AirV1UI?.hasData?.())) nav.append(button('匯出案件', () => exportCase(), true));
      nav.append(button('匯入案件', () => importInput.click(), true));
      return nav;
    }
    const importInput = document.createElement('input');
    importInput.type = 'file'; importInput.accept = '.json,application/json'; importInput.hidden = true;
    if(document.body?.append)document.body.append(importInput);
    function exportCase(){
      const state=session.snapshot();
      const wasteHasData=state.categoryId==='waste'&&root.WasteV1UI?.hasData?.()&&root.WasteV1UI?.snapshot;
      const airHasData=state.categoryId==='air'&&root.AirV1UI?.hasData?.()&&root.AirV1UI?.snapshot;
      if(!state.templateId&&!wasteHasData&&!airHasData){window.alert?.('目前沒有可匯出的案件。');return;}
      if(state.categoryId==='water'&&root.WaterV2UI?.hasData?.()&&root.WaterV2UI?.snapshot){
        state.waterV2State=root.WaterV2UI.snapshot();
      }
      if(wasteHasData)state.wasteV1State=root.WasteV1UI.snapshot();
      if(airHasData)state.airV1State=root.AirV1UI.snapshot();
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
        if(root.AirV1UI){
          if(parsed.state.airV1State&&root.AirV1UI.restore)root.AirV1UI.restore(parsed.state.airV1State);
          else root.AirV1UI.reset?.();
        }
        viewMode='case';
        render();
      }catch(error){window.alert?.('無法匯入案件：'+error.message);}
    });
    function render() {
      app.replaceChildren();
      const state = session.snapshot();
      const category = config.categories.find(item => item.id === state.categoryId);
      const type = config.caseTypes.find(item => item.id === state.caseTypeId);
      const template = config.templates.find(item => item.id === state.templateId);
      document.body?.setAttribute?.('data-module', viewMode==='home' ? 'home' : (category?.id || 'home'));
      app.append(navigation(state));

      if(viewMode==='home'){
        if(state.categoryId){
          const kept=el('section','', 'panel');
          kept.append(el('h2','目前案件仍保留'));
          kept.append(el('p',`${category?.title||'目前模組'}的輸入仍在本次頁面記憶體中；回首頁不會清除資料。`));
          kept.append(button('返回目前案件',()=>{viewMode='case';render();}));
          app.append(kept);
        }
        app.append(el('h2','選擇案件大類'));
        const list=el('div','', 'actions');
        for(const item of config.categories){
          const isCurrent=item.id===state.categoryId;
          const entry=button(item.title+(isCurrent?'（目前案件）':'')+(item.status==='development'?'（開發中）':''),()=>{
            if(isCurrent){viewMode='category';render();return;}
            destructiveNavigate(()=>session.selectCategory(item.id),'category');
          });
          entry.setAttribute('data-module',item.id);
          entry.disabled=item.status!=='active';
          list.append(entry);
        }
        app.append(list);
        app.querySelector('h2')?.focus?.();
        return;
      }

      if(viewMode==='category'){
        if(!category){viewMode='home';render();return;}
        app.append(el('p',category.title),el('h2',`選擇${category.title}案件類型`));
        const list=el('div','', 'actions');
        const types=config.caseTypes.filter(item=>item.categoryId===category.id);
        for(const item of types){
          const isCurrent=item.id===state.caseTypeId;
          const entry=button(item.title+(isCurrent?'（目前案件）':'')+(item.status==='development'?'（開發中）':''),()=>{
            if(isCurrent){
              viewMode=state.templateId?'case':(isDirectCaseType(item)?'case':'template');
              render();
              return;
            }
            destructiveNavigate(()=>{session.selectCaseType(item.id);if(item.directTemplateId)session.selectTemplate(item.directTemplateId);},isDirectCaseType(item)?'case':'template');
          });
          entry.disabled=item.status!=='active';list.append(entry);
        }
        if(!types.length)list.append(el('p','目前尚無可用案件類型。'));
        app.append(list);
        return;
      }

      if(viewMode==='template'){
        if(!category||!type){viewMode=category?'category':'home';render();return;}
        app.append(el('p',[category.title,type.title].filter(Boolean).join(' → ')),el('h2','選擇處理情境／紀錄範本'));
        const list=el('div','', 'actions');
        const available=config.templates.filter(item=>item.categoryId===category.id&&item.caseTypeId===type.id);
        for(const item of available){
          const isCurrent=item.id===state.templateId;
          list.append(button(item.title+(isCurrent?'（目前案件）':''),()=>{
            if(isCurrent){viewMode='case';render();return;}
            destructiveNavigate(()=>session.selectTemplate(item.id),'case');
          }));
        }
        if(!available.length)list.append(el('p','目前尚無可用範本。'));
        app.append(list);
        return;
      }

      if(!category){viewMode='home';render();return;}
      if(!type){viewMode='category';render();return;}
      if(!template && !['water','waste'].includes(category.id) && !(category.id==='air'&&['air-fixed-source','air-construction','air-open-burning'].includes(type.id))){
        viewMode='template';render();return;
      }
      if (category.id === 'water' && root.WaterV2UI?.mount) {
        const waterHost = el('section', '', 'water-v2-host'); app.append(waterHost); root.WaterV2UI.mount(waterHost);
        app.append(moduleStickyActions([
          {label:'法規研判',action:()=>root.WaterV2UI?.showLaw?.()},
          {label:'整理目前內容',action:()=>root.WaterV2UI?.showSummary?.()},
          {label:'回到最上面',action:scrollToTop}
        ]));return;
      }
      if (category.id === 'waste' && root.WasteV1UI?.mount) {
        const wasteHost = el('section', '', 'waste-v1-host'); app.append(wasteHost); root.WasteV1UI.mount(wasteHost);
        app.append(moduleStickyActions([
          {label:'法規研判',action:()=>root.WasteV1UI?.showLaw?.()},
          {label:'整理目前內容',action:()=>root.WasteV1UI?.showSummary?.()},
          {label:'回到最上面',action:scrollToTop}
        ]));return;
      }
      if (category.id === 'air' && ['air-fixed-source','air-construction','air-open-burning'].includes(type.id) && root.AirV1UI?.mount) {
        const airHost = el('section', '', 'air-v1-host'); app.append(airHost); root.AirV1UI.mount(airHost,type.id); return;
      }
      const trail=[category?.title,type?.title,type?.directTemplateId?null:template?.title].filter(Boolean).join(' → ');
      if(trail)app.append(el('p',trail));
      if(template)renderForm(template);
      else { viewMode='template'; render(); return; }
      const heading=app.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();}
    }
    function renderForm(template) {
      const draftActionLabel = template.draftActionLabel || '完成／產生紀錄';
      const form = el('form'); form.autocomplete = 'off';
      if(template.quickActions||template.floatingFieldActions)form.className='field-floating-enabled';
      form.addEventListener('submit', event => event.preventDefault());
      form.append(el('h2', template.formTitle || '填寫案件事實'));
      for (const related of template.relatedTemplates || []) form.append(button(related.label, () => destructiveNavigate(() => session.selectTemplate(related.id),'case'), true));
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
      const active=session.snapshot();
      if(active.categoryId==='noise'||(active.categoryId==='air'&&active.caseTypeId==='restaurant-odor')){
        const bar=moduleStickyActions([
          {label:'法規研判',action:()=>{const current=session.snapshot();const facts=root.DraftEngine.normalize(template,fields.read());if(current.categoryId==='air')root.AirRuleUI?.open?.({mode:'restaurant-odor',inputs:facts});else openNoiseAssessment(template,facts);}},
          {label:'整理目前內容',action:()=>openTemplateSummary(template,fields.read())},
          {label:'回到最上面',action:scrollToTop}
        ]);
        app.append(bar);
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