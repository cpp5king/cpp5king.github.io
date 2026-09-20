(function(root){
  'use strict';

  const VERSION = '4.9.43';
  const PROVENANCE = 'PP-IA-41-7F3C9A21';
  let $app = null;

  const state = {
    view: 'home',
    pollutionPoint: {
      presence: '', phenomena: [], otherPhenomenon: '', location: '', directionKnown: '', directionText: '', notes: ''
    },
    baseScreening: { status: '', unavailableReason: '', ph: '', temperature: '', industry: '', processes: [], records: [] },
    traceNodes: [],
    sources: [],
    currentInspection: null,
    inspections: [],
    draftText: ''
  };

  const phenomenaOptions = [
    {value:'變色',label:'水的顏色異常',hint:'水體出現明顯異於周邊或平常狀態的顏色。'},
    {value:'異味',label:'聞到異常氣味',hint:'現場可明顯察覺異常氣味；不需先判斷是哪一種化學物。'},
    {value:'泡沫',label:'有明顯或持續泡沫',hint:'泡沫持續存在或明顯聚集，不只是水流短暫自然起泡。'},
    {value:'油膜',label:'水面有油狀膜',hint:'水面可見油狀膜、彩色膜或疑似油性漂浮層。'},
    {value:'混濁',label:'水看起來明顯混濁',hint:'水體明顯不透明或可見懸浮顆粒增加。'},
    {value:'漂浮物／懸浮物',label:'水中有漂浮或懸浮物',hint:'如碎屑、顆粒、絮狀物或其他可見物質。'},
    {value:'沉積物／污泥／浮渣',label:'有異常沉積或污泥',hint:'如底部沉積、污泥堆積或水面浮渣。'},
    {value:'異常水流',label:'有不尋常的排水情形',hint:'如持續排水、間歇排水或突然大量流出。'},
    {value:'水生生物異常',label:'魚蝦等水生生物有異常',hint:'如死亡、異常聚集或活動異常。'},
    {value:'其他',label:'其他',hint:'上述無法涵蓋的客觀現場現象。'}
  ];
  const evidenceOptions = [
    ['water_route','水路可連續追溯'],
    ['pipe_connected','管線／排水系統確認連通'],
    ['direct_observation','直接看到該處排水進入追查水路'],
    ['statement','現場人員陳述'],
    ['document','文件／其他資料'],
    ['screening','快篩結果提供輔助支持'],
    ['other','其他']
  ];

  const subjectTypes = [
    ['industry','水污法事業','依許可／核准資料進行 A～F 現場查核'],
    ['sewer','污水下水道系統','沿用 A～F 現場事實；第14、15、18條依第19條準用，其餘依各條文判斷'],
    ['building','建築物污水處理設施','依設施、管理、紀錄、排放四主題查核'],
    ['other','非上述管制主體','先記現場行為，再整理可能法規方向']
  ];

  function newId(prefix){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`; }
  function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function ynu(value, name, labels={yes:'是',no:'否',unknown:'無法確認'}){
    return `<div class="choice-row">${Object.entries(labels).map(([v,l])=>`<label class="choice"><input type="radio" name="${name}" value="${v}" ${value===v?'checked':''}><span>${l}</span></label>`).join('')}</div>`;
  }
  function checkboxList(selected, items, name){
    return `<div class="check-grid">${items.map(item=>{const [v,l]=Array.isArray(item)?item:[item,item];return `<label class="check"><input type="checkbox" name="${name}" value="${esc(v)}" ${selected.includes(v)?'checked':''}><span>${esc(l)}</span></label>`}).join('')}</div>`;
  }
  function phenomenaCheckboxList(selected=[]){
    return `<div class="check-grid phenomena-grid">${phenomenaOptions.map(item=>`<label class="check phenomenon-check"><input type="checkbox" name="phenomena" value="${esc(item.value)}" ${selected.includes(item.value)?'checked':''}><span><b>${esc(item.label)}</b><small>${esc(item.hint)}</small></span></label>`).join('')}</div>`;
  }
  function phenomenonLabel(value){return phenomenaOptions.find(x=>x.value===value)?.label||value;}
  function selectValue(options, value, blank='請選擇'){
    return `<option value="">${blank}</option>`+options.map(([v,l])=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(l)}</option>`).join('');
  }

  function screeningAssist(){
    if(!root.WaterScreeningAssist) throw new Error('WaterScreeningAssist 尚未載入。');
    return root.WaterScreeningAssist;
  }
  function screenReactionLabel(v){return ({yes:'有反應',no:'無反應',unclear:'無法判讀'})[v]||'未填';}
  function screeningRecord(code){
    return {code, reaction:''};
  }
  function screenScopeId(scope){return String(scope).replace(/[^a-zA-Z0-9_-]/g,'_');}
  function previousScreeningRecords(node){
    if(!node) return [];
    if(node.parentId){
      const parent=state.traceNodes.find(x=>x.id===node.parentId);
      return parent?.screenings||[];
    }
    return state.baseScreening.records||[];
  }
  function mergeScreeningRecommendations(...sets){
    const codes=[...new Set(sets.flatMap(x=>x?.codes||[]))];
    const reasons=[...new Set(sets.flatMap(x=>x?.reasons||[]))];
    return {codes,reasons};
  }
  function screeningRecommendationData(scope,node=null,meta={}){
    const industryRec=screeningAssist().industryRecommendations(meta.industry||'',meta.processes||[]);
    if(scope==='base') return mergeScreeningRecommendations(screeningAssist().recommendations(state.pollutionPoint.phenomena||[]),industryRec);
    const codes=screeningAssist().repeatFrom(previousScreeningRecords(node));
    const repeatRec={codes,reasons:codes.length?['沿線比對：優先重測前一位置「有反應」的快篩項目。']:[]};
    return mergeScreeningRecommendations(repeatRec,industryRec);
  }
  function screeningContextHtml(scope,meta={}){
    const selected=meta.industry||'';
    const def=screeningAssist().industry(selected);
    const processes=Array.isArray(meta.processes)?meta.processes:[];
    return `<details class="screen-context" ${selected?'open':''}><summary>依行業／製程取得快篩建議（選填）</summary>
      <div class="hint">這裡只用來推薦快篩項目，不會拿來認定污染來源或行業別。</div>
      <label class="field"><span class="field-label">已知／疑似行業或來源類型</span><select class="select-input" data-screen-context="industry" data-scope="${scope}">${selectValue(screeningAssist().industries.map(x=>[x.code,x.label]),selected,'尚不指定')}</select></label>
      ${def&&def.processes?.length?`<label class="field"><span class="field-label">主要製程／特徵（可複選）</span><div class="check-grid">${def.processes.map(proc=>`<label class="check"><input type="checkbox" data-screen-process="${proc.code}" data-scope="${scope}" ${processes.includes(proc.code)?'checked':''}><span>${esc(proc.label)}</span></label>`).join('')}</div></label>`:''}
    </details>`;
  }
  function screeningRecommendationHtml(scope,records,node=null,meta={}){
    const rec=screeningRecommendationData(scope,node,meta);
    if(!rec.codes.length){
      const msg=scope==='base'?'目前沒有足夠的現場情形或行業／製程資訊產生特定建議；可依現場判斷自行選擇。':'目前沒有可沿用的有反應項目或行業／製程建議；可依現場判斷自行選擇。';
      return `<div class="screen-rec"><div class="screen-rec-title">建議優先快篩</div><div class="muted small">${esc(msg)}</div></div>`;
    }
    return `<div class="screen-rec"><div class="screen-rec-title">綜合建議優先快篩</div><div class="screen-chip-row">${rec.codes.map(code=>{const d=screeningAssist().item(code);const exists=records.some(r=>screeningAssist().normalizeRecord(r).code===code);return `<button type="button" class="screen-chip ${exists?'selected':''}" data-add-screen-code="${scope}" data-code="${code}" ${exists?'disabled':''}>${esc(d?.label||code)}${exists?' ✓':''}</button>`;}).join('')}</div>${rec.reasons.length?`<div class="screen-rec-reasons">${rec.reasons.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:''}</div>`;
  }
  function screeningAllItemsHtml(scope,records){
    return `<details class="screen-all"><summary>其他可選快篩（目前共 ${screeningAssist().items.length} 項）</summary><div class="screen-chip-row">${screeningAssist().items.map(d=>{const exists=records.some(r=>screeningAssist().normalizeRecord(r).code===d.code);return `<button type="button" class="screen-chip ${exists?'selected':''}" data-add-screen-code="${scope}" data-code="${d.code}" ${exists?'disabled':''}>${esc(d.label)}${exists?' ✓':''}</button>`;}).join('')}</div></details>`;
  }
  function screeningDirectionsHtml(records,scope,meta={}){
    const dirs=screeningAssist().sourceDirections(records,{ph:meta.ph??''});
    const id=`screenDirections_${screenScopeId(scope)}`;
    if(!dirs.length&&!records.some(r=>screeningAssist().normalizeRecord(r).reaction==='yes')) return `<div id="${id}" class="screen-directions"><div class="muted small">尚無「有反應」項目或明顯酸鹼特徵；目前不產生可能來源方向。</div></div>`;
    return `<div id="${id}" class="screen-directions"><div class="screen-rec-title">可能來源方向</div>${dirs.map(d=>`<div class="source-direction"><strong>${esc(d.title)}</strong><div>${esc(d.reason)}</div><div class="hint">${esc(d.caution)}</div></div>`).join('')}<div class="notice warn">僅供污染查源參考，不代表污染來源、行業別、法定超標或違規成立。</div></div>`;
  }
  function screeningTable(records,scope,meta={},node=null){
    const normalized=records.map((r,i)=>Object.assign(r,screeningAssist().normalizeRecord(r)));
    const ph=meta.ph??'', temp=meta.temperature??'';
    return `<div class="screening-panel">
      ${screeningContextHtml(scope,meta)}
      ${screeningRecommendationHtml(scope,records,node,meta)}
      <div class="grid-2 screen-basic">
        <label class="field"><span class="field-label">pH（固定基本量測）</span><input class="text-input" inputmode="decimal" data-screen-basic="ph" data-scope="${scope}" value="${esc(ph)}" placeholder="例如 7.2"></label>
        <label class="field"><span class="field-label">水溫（固定基本量測）</span><div class="input-suffix"><input class="text-input" inputmode="decimal" data-screen-basic="temperature" data-scope="${scope}" value="${esc(temp)}" placeholder="例如 26.4"><span>°C</span></div></label>
      </div>
      ${(ph===''||temp==='')?'<div class="notice warn">已進行快篩時，pH 與水溫建議固定記錄。</div>':''}
      ${screeningAllItemsHtml(scope,records)}
      ${normalized.length?`<div class="screen-records">${normalized.map((r,i)=>{const d=screeningAssist().item(r.code);return `<article class="screen-record screen-record-compact"><div class="screen-record-head"><div><strong>${esc(d?.label||r.code||'快篩項目')}</strong></div><button type="button" class="btn btn-danger" data-remove-screen="${scope}" data-index="${i}">刪除</button></div><label class="field"><span class="field-label">快篩是否有反應？</span><select class="select-input" data-screen="reaction" data-scope="${scope}" data-index="${i}"><option value="">請選擇</option><option value="yes" ${r.reaction==='yes'?'selected':''}>有反應</option><option value="no" ${r.reaction==='no'?'selected':''}>無反應</option><option value="unclear" ${r.reaction==='unclear'?'selected':''}>無法判讀</option></select></label></article>`;}).join('')}</div>`:'<div class="empty compact">尚未加入實際快篩項目。</div>'}
      ${screeningDirectionsHtml(records,scope,{ph})}
    </div>`;
  }
  function refreshScreeningDirections(scope,records,node=null){
    const el=document.getElementById(`screenDirections_${screenScopeId(scope)}`);
    if(!el)return;
    const ph=scope==='base'?state.baseScreening.ph:(node?.screeningPh||'');
    const html=screeningDirectionsHtml(records,scope,{ph});
    const wrap=document.createElement('div');wrap.innerHTML=html;
    el.replaceWith(wrap.firstElementChild);
  }
  function screeningSummaryEntries(){
    const out=[];
    if(state.baseScreening.status==='yes'){
      const dirs=screeningAssist().sourceDirections(state.baseScreening.records,{ph:state.baseScreening.ph});
      if(dirs.length)out.push({location:'污染點',dirs});
    }
    state.traceNodes.forEach(n=>{
      if(!(n.screeningActive||n.screenings?.length))return;
      const dirs=screeningAssist().sourceDirections(n.screenings||[],{ph:n.screeningPh||''});
      if(dirs.length)out.push({location:n.location||`節點 ${nodeNumber(n.id)}`,dirs});
    });
    return out;
  }
  function hasData(){
    const p = state.pollutionPoint;
    return !!(p.presence || p.phenomena.length || p.location || p.notes || state.baseScreening.status || state.traceNodes.length || state.inspections.length || state.currentInspection);
  }
  function setView(v){ state.view=v; root.scrollTo?.({top:0,behavior:'smooth'}); render(); }


  function render(){
    if(!$app) return;
    if(state.view==='home') renderHome();
    else if(state.view==='pollution') renderPollution();
    else if(state.view==='subject') renderSubject();
    else if(state.view==='summary') renderSummary();
    else if(state.view==='draft') renderDraft();
    bindCommon();
  }

  function bindCommon(){}

  function renderHome(){
    $app.innerHTML = `
      <section class="hero">
        <h2>水污染 V2</h2>
        <p>先選你現在面對的情境。污染來源未知就從「污染排查」開始；已經知道要查誰，就直接進「對象查核」。流程可做到一半停止，隨時整理目前內容。</p>
        <span class="pill">資料只存在本次頁面記憶體，不寫入 localStorage / IndexedDB</span>
      </section>
      <section class="grid-2">
        <article class="card entry-card" id="enterPollution">
          <div class="big">⌁</div><h3>污染排查</h3>
          <p>處理「污染從哪裡來、排放者是誰？」</p>
          <p class="small">污染點 → 快篩 → 追水 → 找到來源／排放者。只查事實，不查許可、不配法條。</p>
          <button class="btn btn-primary">${hasData() && (state.traceNodes.length || state.pollutionPoint.presence)?'繼續污染排查':'開始污染排查'}</button>
        </article>
        <article class="card entry-card" id="enterSubject">
          <div class="big">▣</div><h3>對象查核</h3>
          <p>處理「已經知道要查誰後，現場如何用水、處理水、排放水？」</p>
          <p class="small">先確認管制主體；水污法事業／下水道系統走 A～F，其他主體走各自流程。</p>
          <button class="btn btn-primary">${state.currentInspection?'繼續對象查核':'開始對象查核'}</button>
        </article>
      </section>
      <section class="card">
        <h3>隨時整理目前內容</h3>
        <p>流程不要求全部完成；污染排查或對象查核做到任何階段，都可以先整理目前已記錄的事實、可能法規與尚待確認事項。</p>
        <div class="btn-row"><button class="btn btn-secondary" id="homeSummary" ${hasData()?'':'disabled'}>整理目前內容</button></div>
      </section>`;
    document.getElementById('enterPollution').onclick=()=>setView('pollution');
    document.getElementById('enterSubject').onclick=()=>{ if(!state.currentInspection) state.currentInspection=createInspection(); setView('subject'); };
    document.getElementById('homeSummary').onclick=()=>setView('summary');
  }

  function renderPollution(){
    const p=state.pollutionPoint;
    $app.innerHTML = `
      <div class="section-title"><div><h2>污染排查</h2><p>只查事實：污染點 → 快篩 → 追水 → 來源。</p></div><button class="btn btn-ghost" id="backHome">返回水污首頁</button></div>
      <div class="stepbar"><span class="step ${p.presence?'done active':'active'}">1 污染點</span><span class="step ${state.baseScreening.status?'done':''}">2 快篩</span><span class="step ${state.traceNodes.length?'done':''}">3 追水</span><span class="step ${state.sources.length?'done':''}">4 來源</span></div>

      <section class="card" id="pollutionPointCard">
        <h3>1｜污染點</h3><p>先把到場時實際看到的污染現象留下來；現象消失也可以繼續追查。</p>
        <label class="field"><span class="field-label">污染現象目前是否仍存在？</span>${ynu(p.presence,'pollutionPresence')}</label>
        <label class="field"><span class="field-label">現場發現哪些情形？</span><span class="field-help">請勾選現場實際看到、聞到或可直接確認的情形，可複選；不需先判斷污染物或污染來源。</span>${phenomenaCheckboxList(p.phenomena)}</label>
        <label class="field"><span class="field-label">其他污染現象</span><input class="text-input" id="otherPhenomenon" value="${esc(p.otherPhenomenon)}" placeholder="其他現象（選填）"></label>
        <label class="field"><span class="field-label">污染點位置／位置描述</span><input class="text-input" id="pollutionLocation" value="${esc(p.location)}" placeholder="例如：○○路與○○巷口側溝"></label>
        <label class="field"><span class="field-label">目前是否可以辨識水流方向？</span>${ynu(p.directionKnown,'directionKnown')}</label>
        ${p.directionKnown==='yes'?`<label class="field"><span class="field-label">水流方向／描述</span><input class="text-input" id="directionText" value="${esc(p.directionText)}" placeholder="例如：由東往西流"></label>`:''}
        <label class="field"><span class="field-label">現場補充說明</span><textarea class="text-area" id="pollutionNotes" placeholder="只寫現場事實；沒有也可留白">${esc(p.notes)}</textarea></label>
      </section>

      <section class="card">
        <h3>2｜快篩</h3><p>建立污染點特徵基準；不等同正式檢驗結果。</p>
        <label class="field"><span class="field-label">是否進行快篩？</span>${ynu(state.baseScreening.status,'screeningStatus',{yes:'是',no:'否',unknown:'無法進行'})}</label>
        ${state.baseScreening.status==='unknown'?`<label class="field"><span class="field-label">無法進行原因</span><input class="text-input" id="screeningUnavailable" value="${esc(state.baseScreening.unavailableReason)}"></label>`:''}
        ${state.baseScreening.status==='yes'?screeningTable(state.baseScreening.records,'base',{ph:state.baseScreening.ph,temperature:state.baseScreening.temperature,industry:state.baseScreening.industry||'',processes:state.baseScreening.processes||[]}):''}
        <div class="notice info">快篩結果相近 ≠ 已確認來源；快篩異常 ≠ 法定檢驗超標。</div>
      </section>

      <section class="card">
        <h3>3｜追水</h3><p>一個位置是一個節點；遇到岔流就從同一節點新增另一支線。</p>
        ${state.traceNodes.length?renderTraceTree():`<div class="empty">尚未建立追查節點。<div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="addRootNode">開始追查污染來源</button></div></div>`}
      </section>

      <section class="card">
        <h3>4｜目前來源</h3>
        ${state.sources.length?state.sources.map(renderSourceBox).join(''):`<div class="empty">目前尚未標記疑似或確認來源。污染排查可以停在這裡，不必勉強找到來源。</div>`}
      </section>
      <div class="sticky-actions"><button class="btn btn-ghost" id="pollutionHomeBottom">返回</button><button class="btn btn-primary" id="pollutionSummary">整理目前內容</button></div>`;

    document.getElementById('backHome').onclick=()=>setView('home');
    document.getElementById('pollutionHomeBottom').onclick=()=>setView('home');
    document.getElementById('pollutionSummary').onclick=()=>setView('summary');
    bindPollutionInputs();
    bindScreening('base',state.baseScreening.records);
    if(!state.traceNodes.length) document.getElementById('addRootNode').onclick=()=>{ addTraceNode(null); };
    bindTraceEvents();
    bindSourceEvents();
  }

  function bindPollutionInputs(){
    document.querySelectorAll('input[name="pollutionPresence"]').forEach(el=>el.onchange=e=>{state.pollutionPoint.presence=e.target.value;});
    document.querySelectorAll('input[name="phenomena"]').forEach(el=>el.onchange=()=>{state.pollutionPoint.phenomena=[...document.querySelectorAll('input[name="phenomena"]:checked')].map(x=>x.value);const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});});
    const bind=(id,key,rerender=false)=>{const el=document.getElementById(id);if(el) el.oninput=e=>{state.pollutionPoint[key]=e.target.value;if(rerender) renderPollution();};};
    bind('otherPhenomenon','otherPhenomenon');bind('pollutionLocation','location');bind('pollutionNotes','notes');bind('directionText','directionText');
    document.querySelectorAll('input[name="directionKnown"]').forEach(el=>el.onchange=e=>{state.pollutionPoint.directionKnown=e.target.value;if(e.target.value!=='yes')state.pollutionPoint.directionText='';renderPollution();});
    document.querySelectorAll('input[name="screeningStatus"]').forEach(el=>el.onchange=e=>{state.baseScreening.status=e.target.value;renderPollution();});
    const su=document.getElementById('screeningUnavailable');if(su)su.oninput=e=>state.baseScreening.unavailableReason=e.target.value;
  }

  function bindScreening(scope,records,node=null){
    document.querySelectorAll(`[data-screen-context="industry"][data-scope="${scope}"]`).forEach(el=>el.onchange=e=>{
      if(scope==='base'){
        state.baseScreening.industry=e.target.value;
        state.baseScreening.processes=[];
      }else if(node){
        node.screeningIndustry=e.target.value;
        node.screeningProcesses=[];
      }
      const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});
    });
    document.querySelectorAll(`[data-screen-process][data-scope="${scope}"]`).forEach(el=>el.onchange=e=>{
      const code=e.target.dataset.screenProcess;
      const target=scope==='base'?state.baseScreening:node;
      if(!target)return;
      const key=scope==='base'?'processes':'screeningProcesses';
      const list=Array.isArray(target[key])?target[key]:[];
      target[key]=e.target.checked?[...new Set([...list,code])]:list.filter(x=>x!==code);
      const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});
    });
    document.querySelectorAll(`[data-add-screen-code="${scope}"]`).forEach(btn=>btn.onclick=()=>{
      const code=btn.dataset.code;
      if(!records.some(r=>screeningAssist().normalizeRecord(r).code===code)) records.push(screeningRecord(code));
      const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});
    });
    document.querySelectorAll(`[data-remove-screen="${scope}"]`).forEach(btn=>btn.onclick=()=>{records.splice(Number(btn.dataset.index),1);const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});});
    document.querySelectorAll(`[data-screen][data-scope="${scope}"]`).forEach(el=>{
      const handler=e=>{const i=Number(e.target.dataset.index),key=e.target.dataset.screen;records[i]=Object.assign(records[i],screeningAssist().normalizeRecord(records[i]));records[i][key]=e.target.value;if(key==='reaction')refreshScreeningDirections(scope,records,node);};
      el.oninput=handler;el.onchange=handler;
    });
    document.querySelectorAll(`[data-screen-basic][data-scope="${scope}"]`).forEach(el=>el.oninput=e=>{
      const key=e.target.dataset.screenBasic;
      if(scope==='base') state.baseScreening[key]=e.target.value;
      else if(node){if(key==='ph')node.screeningPh=e.target.value;if(key==='temperature')node.screeningTemperature=e.target.value;}
      if(key==='ph')refreshScreeningDirections(scope,records,node);
    });
  }

  function addTraceNode(parentId){
    const siblings=state.traceNodes.filter(n=>n.parentId===parentId).length;
    state.traceNodes.push({id:newId('node'),parentId,branchNo:siblings+1,type:'',location:'',hasFlow:'',directionKnown:'',directionText:'',notes:'',result:'',stopReason:'',stopNotes:'',screeningActive:false,screeningPh:'',screeningTemperature:'',screeningIndustry:'',screeningProcesses:[],screenings:[],sourceStatus:'',sourceName:'',evidence:[],evidenceOther:''});
    renderPollution();
  }
  function nodeDepth(node){let d=0,p=node.parentId;while(p){d++;const pn=state.traceNodes.find(n=>n.id===p);p=pn?pn.parentId:null;}return Math.min(d,4);}
  function nodeNumber(id){return state.traceNodes.findIndex(n=>n.id===id)+1;}
  function renderTraceTree(){
    const roots=state.traceNodes.filter(n=>!n.parentId);
    return roots.map(n=>renderNodeRecursive(n)).join('');
  }
  function renderNodeRecursive(n){
    const children=state.traceNodes.filter(x=>x.parentId===n.id);
    return `${renderTraceNode(n)}${children.map(c=>renderNodeRecursive(c)).join('')}`;
  }
  function renderTraceNode(n){
    const depth=nodeDepth(n), idx=nodeNumber(n);
    const statusTag=n.sourceStatus==='confirmed'?'<span class="tag confirmed">已確認來源</span>':n.sourceStatus==='suspected'?'<span class="tag suspected">疑似來源</span>':n.sourceStatus==='excluded'?'<span class="tag stopped">已排除來源</span>':n.result==='stop'?'<span class="tag stopped">支線停止</span>':'';
    const nodeTypeOptions=[['ditch','側溝'],['drain','排水溝'],['outfall','排水口'],['channel','渠道'],['pipe','管線'],['manhole','人孔／陰井'],['site','場址／場所'],['waterbody','水體'],['other','其他']];
    return `<article class="subcard trace-card level-${depth}" data-node-id="${n.id}">
      <div class="trace-head"><div><h4>節點 ${idx}${n.parentId?`｜支線 ${n.branchNo}`:''}</h4><div>${statusTag}</div></div><button class="btn btn-danger" data-remove-node="${n.id}">刪除此節點</button></div>
      <div class="grid-2">
        <label class="field"><span class="field-label">節點類型</span><select class="select-input" data-node-field="type" data-node="${n.id}">${selectValue(nodeTypeOptions,n.type)}</select></label>
        <label class="field"><span class="field-label">位置／簡述</span><input class="text-input" data-node-field="location" data-node="${n.id}" value="${esc(n.location)}" placeholder="例如：○○路 123 號前側溝"></label>
      </div>
      <label class="field"><span class="field-label">目前是否有水流？</span>${ynu(n.hasFlow,`hasFlow_${n.id}`)}</label>
      <label class="field"><span class="field-label">水流方向是否可以確認？</span>${ynu(n.directionKnown,`nodeDir_${n.id}`)}</label>
      ${n.directionKnown==='yes'?`<label class="field"><span class="field-label">水流方向／流向說明</span><input class="text-input" data-node-field="directionText" data-node="${n.id}" value="${esc(n.directionText)}"></label>`:''}
      <label class="field"><span class="field-label">節點補充</span><textarea class="text-area" data-node-field="notes" data-node="${n.id}">${esc(n.notes)}</textarea></label>
      ${(n.screeningActive||n.screenings.length)?`<div class="divider"></div><h4>此節點快篩</h4>${screeningTable(n.screenings,`node:${n.id}`,{ph:n.screeningPh||'',temperature:n.screeningTemperature||'',industry:n.screeningIndustry||'',processes:n.screeningProcesses||[]},n)}`:''}
      ${n.result==='stop'?`<div class="details"><label class="field"><span class="field-label">停止原因</span>${ynu(n.stopReason,`stop_${n.id}`,{excluded:'已排除',blocked:'無法繼續追查'})}</label><label class="field"><span class="field-label">排除／停止說明</span><textarea class="text-area" data-node-field="stopNotes" data-node="${n.id}">${esc(n.stopNotes)}</textarea></label></div>`:''}
      ${n.result==='source'?renderSourceEditor(n):''}
      <div class="btn-row">
        <button class="btn btn-secondary" data-add-child="${n.id}">繼續往來源追</button>
        <button class="btn btn-secondary" data-add-child="${n.id}">新增另一支線</button>
        <button class="btn btn-ghost" data-add-node-screen="${n.id}">＋此處快篩</button>
        <button class="btn btn-ghost" data-stop-node="${n.id}">此支線停止追查</button>
        <button class="btn btn-good" data-source-node="${n.id}">標記疑似來源</button>
      </div>
    </article>`;
  }
  function renderSourceEditor(n){
    return `<div class="details">
      <h4>來源判斷</h4>
      <label class="field"><span class="field-label">目前對此來源的判斷</span>${ynu(n.sourceStatus,`sourceStatus_${n.id}`,{suspected:'疑似來源，尚無法確認',confirmed:'已確認來源',excluded:'已排除'})}</label>
      <label class="field"><span class="field-label">來源名稱或場所</span><input class="text-input" data-node-field="sourceName" data-node="${n.id}" value="${esc(n.sourceName)}" placeholder="例如：○○股份有限公司"></label>
      ${n.sourceStatus==='confirmed'?`<label class="field"><span class="field-label">來源確認依據</span>${checkboxList(n.evidence,evidenceOptions,`evidence_${n.id}`)}</label>${n.evidence.includes('other')?`<label class="field"><span class="field-label">其他依據</span><input class="text-input" data-node-field="evidenceOther" data-node="${n.id}" value="${esc(n.evidenceOther)}"></label>`:''}${n.evidence.length===1&&n.evidence[0]==='screening'?'<div class="notice warn">目前只勾選快篩輔助。快篩結果不宜單獨作為來源確認唯一依據；系統不會阻止儲存，仍由稽查員判斷。</div>':''}`:''}${n.sourceStatus==='excluded'?'<div class="notice info">此對象已排除為本次污染來源；若先前已建立對象查核，查核資料仍會保留。</div>':''}
    </div>`;
  }

  function bindTraceEvents(){
    document.querySelectorAll('[data-node-field]').forEach(el=>{el.oninput=e=>{const n=state.traceNodes.find(x=>x.id===e.target.dataset.node);if(n){n[e.target.dataset.nodeField]=e.target.value;if(['sourceName','evidenceOther'].includes(e.target.dataset.nodeField))syncSources();}};});
    state.traceNodes.forEach(n=>{
      document.querySelectorAll(`input[name="hasFlow_${n.id}"]`).forEach(el=>el.onchange=e=>{n.hasFlow=e.target.value;});
      document.querySelectorAll(`input[name="nodeDir_${n.id}"]`).forEach(el=>el.onchange=e=>{n.directionKnown=e.target.value;if(e.target.value!=='yes')n.directionText='';renderPollution();});
      document.querySelectorAll(`input[name="stop_${n.id}"]`).forEach(el=>el.onchange=e=>{n.stopReason=e.target.value;});
      document.querySelectorAll(`input[name="sourceStatus_${n.id}"]`).forEach(el=>el.onchange=e=>{n.sourceStatus=e.target.value;syncSources();renderPollution();});
      document.querySelectorAll(`input[name="evidence_${n.id}"]`).forEach(el=>el.onchange=()=>{n.evidence=[...document.querySelectorAll(`input[name="evidence_${n.id}"]:checked`)].map(x=>x.value);syncSources();renderPollution();});
      bindScreening(`node:${n.id}`,n.screenings,n);
    });
    document.querySelectorAll('[data-add-child]').forEach(b=>b.onclick=()=>addTraceNode(b.dataset.addChild));
    document.querySelectorAll('[data-add-node-screen]').forEach(b=>b.onclick=()=>{const n=state.traceNodes.find(x=>x.id===b.dataset.addNodeScreen);n.screeningActive=true;const y=root.scrollY||0;renderPollution();root.scrollTo?.({top:y});});
    document.querySelectorAll('[data-stop-node]').forEach(b=>b.onclick=()=>{const n=state.traceNodes.find(x=>x.id===b.dataset.stopNode);n.result='stop';n.sourceStatus='';syncSources();renderPollution();});
    document.querySelectorAll('[data-source-node]').forEach(b=>b.onclick=()=>{const n=state.traceNodes.find(x=>x.id===b.dataset.sourceNode);n.result='source';if(!n.sourceStatus)n.sourceStatus='suspected';syncSources();renderPollution();});
    document.querySelectorAll('[data-remove-node]').forEach(b=>b.onclick=()=>{removeNodeCascade(b.dataset.removeNode);syncSources();renderPollution();});
  }
  function removeNodeCascade(id){
    const ids=[id];let added=true;while(added){added=false;state.traceNodes.forEach(n=>{if(n.parentId&&ids.includes(n.parentId)&&!ids.includes(n.id)){ids.push(n.id);added=true;}});}state.traceNodes=state.traceNodes.filter(n=>!ids.includes(n.id));
  }
  function syncSources(){
    state.sources=state.traceNodes.filter(n=>n.result==='source'&&n.sourceStatus).map(n=>({nodeId:n.id,status:n.sourceStatus,name:n.sourceName,evidence:[...n.evidence],evidenceOther:n.evidenceOther}));
  }
  function sourceStatusLabel(status){
    return ({suspected:'疑似來源，尚無法確認',confirmed:'已確認來源',excluded:'已排除'})[status]||'來源狀態未設定';
  }
  function renderSourceBox(s){
    const n=state.traceNodes.find(x=>x.id===s.nodeId);
    const evid=s.evidence.map(v=>(evidenceOptions.find(x=>x[0]===v)||['',v])[1]);
    const existing=state.inspections.find(i=>i.sourceNodeId===s.nodeId);
    const action=s.status==='excluded'
      ? (existing?`<div class="btn-row"><button class="btn btn-ghost" data-handoff-source="${s.nodeId}">查看對象查核</button></div>`:'')
      : `<div class="btn-row"><button class="btn btn-primary" data-handoff-source="${s.nodeId}">進行對象查核</button></div>`;
    const detail=s.status==='confirmed'
      ? (evid.length?`確認依據：${esc(evid.join('、'))}`:'尚未記錄來源確認依據')
      : s.status==='suspected'?'可先進入對象查核，以進一步確認或排除來源關聯。':'已排除為本次污染來源。';
    return `<div class="source-box"><h4>${sourceStatusLabel(s.status)}｜${esc(s.name||`節點 ${n?nodeNumber(n.id):''}`)}</h4><p>${detail}</p>${action}</div>`;
  }
  function bindSourceEvents(){
    document.querySelectorAll('[data-handoff-source]').forEach(b=>b.onclick=()=>{
      const s=state.sources.find(x=>x.nodeId===b.dataset.handoffSource);const existing=state.inspections.find(i=>i.sourceNodeId===s.nodeId);
      state.currentInspection=existing||createInspection({sourceNodeId:s.nodeId,name:s.name});
      if(!existing) state.inspections.push(state.currentInspection);
      setView('subject');
    });
  }

  function createInspection(prefill={}){
    return {
      id:newId('inspection'),sourceNodeId:prefill.sourceNodeId||'',name:prefill.name||'',subjectType:'',permitStatus:'',permitType:'',permitNotes:'',methods:[],
      topics:{B:newTopic(),C:newTopic(),D:newTopic(),E:newTopic(),F:newTopic()},
      details:{
        // 舊欄位暫留，讓 4.9.38 匯出案件仍可讀取；4.9.43 UI 不再逐題要求填寫。
        B:{meterRequired:'',meterInstalled:'',meterWorking:'',recordMatch:''},
        C:{shouldOperate:'',powerNormal:'',actuallyRunning:'',recordMatch:''},
        D:{recordRequired:'',recordAvailable:'',recordComplete:'',recordMatch:''},
        E:{needsTreatment:'',shouldOperate:'',actuallyRunning:'',alternativeTreatment:'',internalFlowMatch:''},
        F:{approvedRoute:'',routeMatch:'',actualDischarge:'',destinationKnown:'',destination:'',nonApprovedFinalOutlet:'',soilTreatmentAuthorized:'',sampled:'',sampleNote:'',dilutionNeedsTreatment:'',mixedWater:'',mixedWaterClean:'',mixedBeforeDischarge:''}
      },
      building:{facility:newTopic(),management:newTopic(),records:newTopic(),discharge:newTopic()},
      other:{article30:[],controlZone:'',soilDischarge:'',soilTreatmentAuthorized:'',groundwaterInjection:'',notes:''},
      notes:''
    };
  }
  function newTopic(){return {status:'',doubtTypes:[],permitText:'',factText:'',notes:''};}

  const topicIssueOptions={
    B:[['permit_mismatch','與許可／核准內容不一致'],['meter_missing','應設水量計測但未設置'],['meter_not_working','水量計測未正常計量'],['unknown','無法確認'],['other','其他']],
    C:[['permit_mismatch','與許可／核准內容不一致'],['should_not_running','應運轉設備未運轉'],['power_abnormal','供電狀態異常'],['operation_abnormal','設備運轉狀態異常'],['unknown','無法確認'],['other','其他']],
    D:[['permit_mismatch','與許可／核准內容不一致'],['record_unavailable','依法應有紀錄但無法提供'],['record_incomplete','依法應有紀錄但不完整'],['record_mismatch','紀錄與現場不一致'],['unknown','無法確認'],['other','其他']],
    E:[['permit_mismatch','與許可／核准內容不一致'],['treatment_not_running','應運轉之處理設施未正常運轉'],['operation_abnormal','處理設施運轉狀態異常'],['unknown','無法確認'],['other','其他']],
    F:[['permit_mismatch','放流位置／路徑與許可核准內容不一致'],['nonapproved_outlet','由非核准最終放流口／納管口排出'],['destination_unknown','最終去向無法確認'],['soil_discharge','排放於土壤'],['groundwater_discharge','注入地下水體'],['dilution','疑似於排放／納管前稀釋'],['unknown','其他事項無法確認'],['other','其他']]
  };
  function issueLabels(code,values=[]){
    const map=new Map((topicIssueOptions[code]||[]).map(x=>[x[0],x[1]]));
    return values.map(v=>map.get(v)||v);
  }
  function migrateTopicText(topic){
    if(!topic)return;
    const parts=[];
    if(topic.permitText)parts.push(`許可／核准內容：${topic.permitText}`);
    if(topic.factText)parts.push(topic.factText);
    if(topic.notes)parts.push(topic.notes);
    topic.factText=parts.filter(Boolean).join('\n');
    topic.permitText='';topic.notes='';
  }
  function clearTopic(i,code){
    const t=i.topics[code];
    t.doubtTypes=[];t.factText='';t.permitText='';t.notes='';
    const defaults=createInspection().details[code];
    i.details[code]=JSON.parse(JSON.stringify(defaults));
  }
  function cleanConditionalDetails(i,code){
    const t=i.topics[code], d=i.details[code];
    if(t.status!=='doubt')return;
    const has=v=>t.doubtTypes.includes(v);
    if(code==='E'&&!has('treatment_not_running'))d.alternativeTreatment='';
    if(code==='F'){
      if(!has('permit_mismatch'))d.nonApprovedFinalOutlet='';
      if(!has('dilution')){
        d.dilutionNeedsTreatment='';d.mixedWater='';d.mixedWaterClean='';d.mixedBeforeDischarge='';
      }
      if(has('soil_discharge')){d.actualDischarge='yes';d.destinationKnown='yes';d.destination='soil';}
      else if(has('groundwater_discharge')){d.actualDischarge='yes';d.destinationKnown='yes';d.destination='groundwater';d.soilTreatmentAuthorized='';}
      else if(has('destination_unknown')){d.actualDischarge='yes';d.destinationKnown='unknown';d.destination='';d.soilTreatmentAuthorized='';}
      else if(d.destination!=='soil')d.soilTreatmentAuthorized='';
    }
  }

  function renderSubject(){
    const i=state.currentInspection||createInspection();state.currentInspection=i;
    const sourceNode=i.sourceNodeId?state.traceNodes.find(n=>n.id===i.sourceNodeId):null;
    const relationStatus=sourceNode?sourceNode.sourceStatus:'';
    $app.innerHTML=`
      <div class="section-title"><div><h2>對象查核</h2><p>${i.sourceNodeId?'由污染排查的疑似／確認對象帶入；對象查核可作為確認或排除來源的查證手段。':'已知稽查對象可直接從這裡開始。'}</p></div><button class="btn btn-ghost" id="subjectHome">返回水污首頁</button></div>
      ${sourceNode?`<div class="notice info source-link-notice"><strong>來源排查：${esc(i.name||sourceNode.sourceName||sourceNode.location||'未命名對象')}</strong><span>來源關聯：<b>${sourceStatusLabel(relationStatus)}</b></span><button class="btn btn-ghost" id="viewSource">查看來源排查</button></div>
      <section class="card relation-card"><h3>來源關聯判斷</h3><p>可先完成對象查核，再依查核結果更新是否為本次污染來源。</p><label class="field"><span class="field-label">目前判斷</span>${ynu(relationStatus,'inspectionSourceStatus',{suspected:'仍無法確認',confirmed:'確認為來源',excluded:'排除此來源'})}</label>${relationStatus==='confirmed'&&!sourceNode.evidence.length?'<div class="notice warn">目前已標記為確認來源，但尚未記錄來源確認依據；可回「來源排查」補充。</div>':''}</section>`:''}
      <section class="card">
        <h3>確認管制主體</h3>
        <label class="field"><span class="field-label">稽查對象名稱／場所</span><input class="text-input" id="subjectName" value="${esc(i.name)}" placeholder="可先留白"></label>
        <div class="grid-2">${subjectTypes.map(([v,l,d])=>`<label class="entry-card card" style="margin:0"><div class="topic-title">${l}</div><p class="small">${d}</p><div class="choice-row"><label class="choice"><input type="radio" name="subjectType" value="${v}" ${i.subjectType===v?'checked':''}><span>選擇</span></label></div></label>`).join('')}</div>
      </section>
      ${i.subjectType==='industry'||i.subjectType==='sewer'?renderAF(i):''}
      ${i.subjectType==='building'?renderBuilding(i):''}
      ${i.subjectType==='other'?renderOther(i):''}
      ${!i.subjectType?`<div class="empty">先選擇管制主體，後續查核內容才會展開。</div>`:''}
      <div class="sticky-actions"><button class="btn btn-ghost" id="subjectBack">返回</button><button class="btn btn-primary" id="subjectSummary">整理目前內容</button></div>`;
    bindSubject(i);
  }

  function renderAF(i){
    const isSewer=i.subjectType==='sewer';
    ['B','C','D','E','F'].forEach(code=>migrateTopicText(i.topics[code]));
    const methods=[['ground','排放至地面水體'],['storage','貯留'],['recycle','全量回收'],['委託','全量委託'],['dilution','稀釋'],['sewer','納管'],['soil','土壤處理'],['none','無廢污水產生'],['other','其他']];
    return `<section class="card"><h3>A｜許可／核准</h3><p>只記錄法規判斷需要的結構化事實；許可證號、完整登記事項仍直接查閱原文件。</p>
      <label class="field"><span class="field-label">目前是否已確認具有有效水許可／核准？</span>${ynu(i.permitStatus,'permitStatus',{yes:'有',no:'無',unknown:'無法確認'})}</label>
      ${i.permitStatus==='yes'?`<label class="field"><span class="field-label">目前核對的是哪一類許可／核准？</span><select class="select-input" id="permitType">${selectValue([['discharge','排放許可／簡易排放許可'],['storage','貯留許可'],['dilution','稀釋許可'],['soil','土壤處理許可'],['other','其他水措／核准資料'],['unknown','無法確認許可類型']],i.permitType)}</select></label>`:''}
      ${i.permitStatus==='no'?`<label class="field"><span class="field-label">現場實際處理方式（可複選）</span>${checkboxList(i.methods,methods,'methods')}</label>`:''}
      <label class="field"><span class="field-label">自由文字補充（選填）</span><textarea class="text-area" id="permitNotes" placeholder="例如：文件來源、現場說明或需後續確認事項">${esc(i.permitNotes||'')}</textarea></label>
      ${i.permitStatus==='yes'?'<div class="notice info">請自行查看現有許可／核准內容，再依 B～F 核對現場。系統只使用結構化事實進行規則配對，不解析自由文字。</div>':''}
      ${i.permitStatus==='unknown'?'<div class="notice warn">「無法確認」不等同無許可；整理頁會列為尚待確認。</div>':''}
      ${isSewer?'<div class="notice info">污水下水道系統的第14、15、18條依第19條準用；第20條等則依各該條文直接判斷，不一律冠上第19條。</div>':''}
    </section>
    ${topicCard('B','水量／流量','先選具體疑點；特殊細節以自由文字補充。',i)}
    ${topicCard('C','用電／設備運轉','只留下可辨識的運轉事實，不要求逐項抄錄設備資料。',i)}
    ${topicCard('D','操作紀錄','紀錄缺漏、不完整或與現場不一致以結構化事實記錄。',i)}
    ${topicCard('E','處理設施','重點是是否有明確異常；不建立完整水路或設備模型。',i)}
    ${topicCard('F','放流／最終去向','保留排放、出口、去向及稀釋等會影響法規判斷的結構化事實。',i)}`;
  }
  function topicCard(code,title,desc,i){
    const t=i.topics[code], d=i.details[code];
    const issues=topicIssueOptions[code]||[];
    return `<section class="card topic-card"><div class="topic-head"><div><div class="topic-title">${code}｜${title}</div><div class="topic-desc">${desc}</div></div><div>${ynu(t.status,`topic_${code}`,{none:'無疑點',doubt:'有疑點',unchecked:'本次未查'})}</div></div>
      ${t.status==='doubt'?`<div class="details"><label class="field"><span class="field-label">結構化事實／疑點類型（可複選）</span>${checkboxList(t.doubtTypes,issues,`doubt_${code}`)}</label>${renderTopicStructured(code,t,d)}<label class="field"><span class="field-label">現場事實與自由文字補充</span><textarea class="text-area" data-topic="${code}" data-topic-field="factText" placeholder="記錄看到、聽到、文件核對或需保留的現場細節；系統不會解析此文字自動套法規。">${esc(t.factText)}</textarea></label></div>`:''}
    </section>`;
  }
  function renderTopicStructured(code,t,d){
    const f=(label,key,labels)=>`<label class="field"><span class="field-label">${label}</span>${ynu(d[key],`${code}_${key}`,labels||{yes:'是',no:'否',unknown:'無法確認'})}</label>`;
    const has=v=>t.doubtTypes.includes(v);
    if(code==='E'&&has('treatment_not_running')) return f('是否有其他有效替代處理方式','alternativeTreatment');
    if(code==='F'){
      let html=f('現場是否有廢污水實際排放','actualDischarge');
      if(d.actualDischarge==='yes'&&!has('soil_discharge')&&!has('groundwater_discharge')&&!has('destination_unknown')){
        html+=`<label class="field"><span class="field-label">實際最終去向</span><select class="select-input" data-detail-code="F" data-detail-key="destination">${selectValue([['ground','地面水體'],['sewer','納管'],['soil','排放於土壤'],['groundwater','注入地下水體'],['other','其他'],['unknown','無法確認']],d.destination)}</select></label>`;
      }
      if(has('permit_mismatch')&&!has('nonapproved_outlet')) html+=f('是否確認由非核准最終放流口／非核准納管口排出','nonApprovedFinalOutlet');
      if((has('soil_discharge')||d.destination==='soil')) html+=f('是否已確認符合土壤處理標準，且具有有效土壤處理許可','soilTreatmentAuthorized');
      if(has('dilution')) html+=`<div class="divider"></div><h4>稀釋事實</h4>${f('廢污水是否需處理才能符合標準','dilutionNeedsTreatment')}${f('是否與其他水混合','mixedWater')}${f('混入水是否無需處理即可符合標準','mixedWaterClean')}${f('是否在排放／納管前混合','mixedBeforeDischarge')}`;
      html+=f('本次是否現場採樣','sampled');
      if(d.sampled==='yes')html+=`<label class="field"><span class="field-label">採樣補充</span><input class="text-input" data-detail-code="F" data-detail-key="sampleNote" value="${esc(d.sampleNote)}" placeholder="採樣點／樣品資訊（不做實驗室結果判定）"></label>`;
      return html;
    }
    return '';
  }

  function renderBuilding(i){
    return `<section class="card"><h3>建築物污水處理設施</h3><p>不套 A～F，改以四個主題快速查核。</p>${buildingTopic('facility','1｜設施狀態',i)}${buildingTopic('management','2｜管理／清理',i)}${buildingTopic('records','3｜紀錄',i)}${buildingTopic('discharge','4｜排放情形',i)}</section>`;
  }
  function buildingTopic(key,title,i){const t=i.building[key];return `<div class="topic"><div class="topic-head"><div class="topic-title">${title}</div>${ynu(t.status,`building_${key}`,{none:'無疑點',doubt:'有疑點',unchecked:'本次未查'})}</div>${t.status==='doubt'?`<div class="details"><label class="field"><span class="field-label">現場查核事實</span><textarea class="text-area" data-building="${key}" data-building-field="factText">${esc(t.factText)}</textarea></label><label class="field"><span class="field-label">補充</span><textarea class="text-area" data-building="${key}" data-building-field="notes">${esc(t.notes)}</textarea></label></div>`:''}</div>`;}
  function renderOther(i){
    const a30=[['pesticide','農藥／肥料'],['discard','棄置污染物'],['kill_aquatic','捕殺水生物'],['livestock','飼養禽畜'],['other','其他污染水體行為']];
    return `<section class="card"><h3>非上述管制主體</h3><p>先記現場行為，不要求稽查員自己選第幾款。</p><label class="field"><span class="field-label">現場行為（可複選）</span>${checkboxList(i.other.article30,a30,'otherA30')}</label>${i.other.article30.length?`<label class="field"><span class="field-label">行為地點是否位於公告之水污染管制區？</span>${ynu(i.other.controlZone,'controlZone')}</label>`:''}<label class="field"><span class="field-label">是否有排放於土壤？</span>${ynu(i.other.soilDischarge,'soilDischarge')}</label>${i.other.soilDischarge==='yes'?`<label class="field"><span class="field-label">是否已確認符合土壤處理標準，且具有有效土壤處理許可？</span>${ynu(i.other.soilTreatmentAuthorized,'otherSoilTreatmentAuthorized')}</label>`:''}<label class="field"><span class="field-label">是否有注入地下水體？</span>${ynu(i.other.groundwaterInjection,'groundwaterInjection')}</label><label class="field"><span class="field-label">其他現場事實</span><textarea class="text-area" id="otherNotes">${esc(i.other.notes)}</textarea></label></section>`;
  }

  function bindSubject(i){
    document.getElementById('subjectHome').onclick=()=>setView('home');document.getElementById('subjectBack').onclick=()=>setView('home');document.getElementById('subjectSummary').onclick=()=>{saveInspection();setView('summary');};
    const vs=document.getElementById('viewSource');if(vs)vs.onclick=()=>setView('pollution');
    document.querySelectorAll('input[name="inspectionSourceStatus"]').forEach(el=>el.onchange=e=>{
      const n=state.traceNodes.find(x=>x.id===i.sourceNodeId);
      if(!n)return;
      n.sourceStatus=e.target.value;
      syncSources();saveInspection();renderSubject();
    });
    document.getElementById('subjectName').oninput=e=>{
      i.name=e.target.value;
      const n=state.traceNodes.find(x=>x.id===i.sourceNodeId);
      if(n){n.sourceName=e.target.value;syncSources();}
    };
    document.querySelectorAll('input[name="subjectType"]').forEach(el=>el.onchange=e=>{i.subjectType=e.target.value;saveInspection();renderSubject();});
    document.querySelectorAll('input[name="permitStatus"]').forEach(el=>el.onchange=e=>{i.permitStatus=e.target.value;if(e.target.value!=='no')i.methods=[];if(e.target.value!=='yes')i.permitType='';renderSubject();});
    const permitType=document.getElementById('permitType');if(permitType)permitType.onchange=e=>i.permitType=e.target.value;
    const permitNotes=document.getElementById('permitNotes');if(permitNotes)permitNotes.oninput=e=>i.permitNotes=e.target.value;
    document.querySelectorAll('input[name="methods"]').forEach(el=>el.onchange=()=>{i.methods=[...document.querySelectorAll('input[name="methods"]:checked')].map(x=>x.value);});
    ['B','C','D','E','F'].forEach(code=>{
      document.querySelectorAll(`input[name="topic_${code}"]`).forEach(el=>el.onchange=e=>{
        i.topics[code].status=e.target.value;
        if(e.target.value!=='doubt')clearTopic(i,code);
        renderSubject();
      });
      document.querySelectorAll(`input[name="doubt_${code}"]`).forEach(el=>el.onchange=()=>{
        i.topics[code].doubtTypes=[...document.querySelectorAll(`input[name="doubt_${code}"]:checked`)].map(x=>x.value);
        cleanConditionalDetails(i,code);
        renderSubject();
      });
      document.querySelectorAll(`[data-topic="${code}"]`).forEach(el=>el.oninput=e=>{i.topics[code][e.target.dataset.topicField]=e.target.value;});
      Object.keys(i.details[code]||{}).forEach(key=>document.querySelectorAll(`input[name="${code}_${key}"]`).forEach(el=>el.onchange=e=>{
        i.details[code][key]=e.target.value;
        if(code==='F'&&['actualDischarge','soilTreatmentAuthorized','sampled'].includes(key))renderSubject();
      }));
    });
    document.querySelectorAll('[data-detail-code]').forEach(el=>el.onchange=e=>{
      const code=e.target.dataset.detailCode,key=e.target.dataset.detailKey,d=i.details[code];
      d[key]=e.target.value;
      if(code==='F'&&key==='destination'){
        if(e.target.value==='unknown'){d.destinationKnown='unknown';d.destination='unknown';d.soilTreatmentAuthorized='';}
        else if(e.target.value){d.destinationKnown='yes';if(e.target.value!=='soil')d.soilTreatmentAuthorized='';}
        else {d.destinationKnown='';d.soilTreatmentAuthorized='';}
        renderSubject();
      }
    });
    document.querySelectorAll('[data-detail-code]').forEach(el=>{if(el.tagName==='INPUT'&&el.type==='text')el.oninput=e=>{i.details[e.target.dataset.detailCode][e.target.dataset.detailKey]=e.target.value;};});
    ['facility','management','records','discharge'].forEach(key=>{
      document.querySelectorAll(`input[name="building_${key}"]`).forEach(el=>el.onchange=e=>{i.building[key].status=e.target.value;renderSubject();});
      document.querySelectorAll(`[data-building="${key}"]`).forEach(el=>el.oninput=e=>{i.building[key][e.target.dataset.buildingField]=e.target.value;});
    });
    document.querySelectorAll('input[name="otherA30"]').forEach(el=>el.onchange=()=>{i.other.article30=[...document.querySelectorAll('input[name="otherA30"]:checked')].map(x=>x.value);if(!i.other.article30.length)i.other.controlZone='';renderSubject();});
    document.querySelectorAll('input[name="controlZone"]').forEach(el=>el.onchange=e=>i.other.controlZone=e.target.value);
    document.querySelectorAll('input[name="soilDischarge"]').forEach(el=>el.onchange=e=>{i.other.soilDischarge=e.target.value;if(e.target.value!=='yes')i.other.soilTreatmentAuthorized='';renderSubject();});
    document.querySelectorAll('input[name="otherSoilTreatmentAuthorized"]').forEach(el=>el.onchange=e=>i.other.soilTreatmentAuthorized=e.target.value);
    document.querySelectorAll('input[name="groundwaterInjection"]').forEach(el=>el.onchange=e=>i.other.groundwaterInjection=e.target.value);
    const on=document.getElementById('otherNotes');if(on)on.oninput=e=>i.other.notes=e.target.value;
  }
  function saveInspection(){
    const i=state.currentInspection;if(!i)return;const idx=state.inspections.findIndex(x=>x.id===i.id);if(idx>=0)state.inspections[idx]=i;else state.inspections.push(i);
  }

  function facts(){
    const out=[];const p=state.pollutionPoint;
    if(p.presence) out.push(`【目視】污染現象目前${p.presence==='yes'?'仍存在':p.presence==='no'?'已未見':'無法確認是否仍存在'}。`);
    if(p.location) out.push(`【目視】污染點位置：${p.location}。`);
    if(p.phenomena.length||p.otherPhenomenon) out.push(`【目視】污染現象：${[...p.phenomena.map(phenomenonLabel),p.otherPhenomenon].filter(Boolean).join('、')}。`);
    if(p.directionKnown==='yes'&&p.directionText) out.push(`【目視】現場可辨識水流方向：${p.directionText}。`);
    if(p.directionKnown==='no') out.push('【目視】現場無法辨識水流方向。');
    if(p.notes) out.push(`【目視】污染點補充：${p.notes}`);
    if(state.baseScreening.status==='yes'){
      if(state.baseScreening.ph!=='')out.push(`【快篩】污染點 pH：${state.baseScreening.ph}。`);
      if(state.baseScreening.temperature!=='')out.push(`【快篩】污染點水溫：${state.baseScreening.temperature} °C。`);
      state.baseScreening.records.map(r=>screeningAssist().normalizeRecord(r)).filter(r=>r.code||r.reaction).forEach(r=>{const d=screeningAssist().item(r.code);out.push(`【快篩】污染點 ${d?.label||r.code||'快篩項目'}：${screenReactionLabel(r.reaction)}。`);});
    }
    if(state.baseScreening.status==='unknown') out.push(`【快篩】污染點快篩無法進行${state.baseScreening.unavailableReason?`，原因：${state.baseScreening.unavailableReason}`:''}。`);
    state.traceNodes.forEach(n=>{
      const type=({ditch:'側溝',drain:'排水溝',outfall:'排水口',channel:'渠道',pipe:'管線',manhole:'人孔／陰井',site:'場址／場所',waterbody:'水體',other:'其他節點'})[n.type]||'追查節點';
      if(n.type||n.location) out.push(`【目視】追查至${n.location?`${n.location}之`:''}${type}${n.hasFlow==='yes'?'，現場有水流':n.hasFlow==='no'?'，現場未見水流':''}${n.directionKnown==='yes'&&n.directionText?`，流向為${n.directionText}`:''}。`);
      if(n.screeningActive||n.screenings?.length){
        const loc=n.location||`節點 ${nodeNumber(n.id)}`;
        if(n.screeningPh!=='')out.push(`【快篩】${loc} pH：${n.screeningPh}。`);
        if(n.screeningTemperature!=='')out.push(`【快篩】${loc}水溫：${n.screeningTemperature} °C。`);
        (n.screenings||[]).map(r=>screeningAssist().normalizeRecord(r)).filter(r=>r.code||r.reaction).forEach(r=>{const d=screeningAssist().item(r.code);out.push(`【快篩】${loc} ${d?.label||r.code||'快篩項目'}：${screenReactionLabel(r.reaction)}。`);});
      }
      if(n.result==='stop'&&n.stopReason) out.push(`【目視】${n.location||`節點 ${nodeNumber(n.id)}`}支線${n.stopReason==='excluded'?'已排除':'無法繼續追查'}${n.stopNotes?`：${n.stopNotes}`:'。'}`);
      if(n.sourceStatus==='suspected') out.push(`【現場研判】${n.sourceName||n.location||`節點 ${nodeNumber(n.id)}`}標記為疑似來源，尚無法確認。`);
      if(n.sourceStatus==='confirmed') out.push(`【現場研判】已確認來源為${n.sourceName||n.location||`節點 ${nodeNumber(n.id)}`}；依據：${n.evidence.map(v=>(evidenceOptions.find(x=>x[0]===v)||['',v])[1]).join('、')||'未填'}。`);
      if(n.sourceStatus==='excluded') out.push(`【現場研判】${n.sourceName||n.location||`節點 ${nodeNumber(n.id)}`}經查核後已排除為本次污染來源。`);
    });
    const inspections=[...state.inspections];if(state.currentInspection&&!inspections.some(x=>x.id===state.currentInspection.id))inspections.push(state.currentInspection);
    inspections.forEach(i=>{
      if(i.name) out.push(`【查核】稽查對象：${i.name}。`);
      const st=(subjectTypes.find(x=>x[0]===i.subjectType)||[])[1];if(st)out.push(`【查核】管制主體判斷：${st}。`);
      if((i.subjectType==='industry'||i.subjectType==='sewer')&&i.permitStatus) out.push(`【文件／查核】有效水許可／核准資料：${i.permitStatus==='yes'?'有':i.permitStatus==='no'?'無':'無法確認'}。`);
      if((i.subjectType==='industry'||i.subjectType==='sewer')&&i.permitStatus==='yes'&&i.permitType)out.push(`【文件／查核】目前核對之許可／核准類型：${permitTypeLabel(i.permitType)}。`);
      if(i.permitStatus==='no'&&i.methods.length) out.push(`【查核】現場實際處理方式：${i.methods.map(methodLabel).join('、')}。`);
      if((i.subjectType==='industry'||i.subjectType==='sewer')&&i.permitNotes)out.push(`【文件／查核】許可／核准補充：${i.permitNotes}`);
      if(i.subjectType==='industry'||i.subjectType==='sewer') ['B','C','D','E','F'].forEach(code=>{const t=i.topics[code];if(t.status==='doubt'&&t.doubtTypes.length)out.push(`【查核】${code} 項結構化事實：${issueLabels(code,t.doubtTypes).join('、')}。`);if(t.status==='doubt'&&t.factText)out.push(`【查核】${code} 項補充：${t.factText}`);if(t.status==='unchecked')out.push(`【查核】${code} 項本次未查。`);});
      const F=i.details.F;if(F.actualDischarge==='yes')out.push('【目視】現場有廢污水實際排放。');if(F.destinationKnown==='yes'&&F.destination)out.push(`【目視】最終去向：${destLabel(F.destination)}。`);if(F.destination==='soil'&&F.soilTreatmentAuthorized)out.push(`【文件／查核】土壤處理合法例外：${F.soilTreatmentAuthorized==='yes'?'已確認符合土壤處理標準且具有有效土壤處理許可':F.soilTreatmentAuthorized==='no'?'未具備完整合法例外條件':'尚無法確認'}。`);if(F.nonApprovedFinalOutlet==='yes')out.push('【目視】廢污水由非核准最終放流口／非核准納管口排出。');if(F.sampled==='yes')out.push(`【採樣】本次已進行現場採樣${F.sampleNote?`：${F.sampleNote}`:''}。`);
      if(i.subjectType==='other'){if(i.other.article30.length)out.push(`【目視】現場行為：${i.other.article30.map(a30Label).join('、')}。`);if(i.other.article30.length&&i.other.controlZone)out.push(`【文件／查核】行為地點${i.other.controlZone==='yes'?'位於':i.other.controlZone==='no'?'不位於':'尚無法確認是否位於'}公告水污染管制區。`);if(i.other.soilDischarge==='yes')out.push('【目視】現場有排放於土壤情形。');if(i.other.soilDischarge==='yes'&&i.other.soilTreatmentAuthorized)out.push(`【文件／查核】土壤處理合法例外：${i.other.soilTreatmentAuthorized==='yes'?'已確認符合土壤處理標準且具有有效土壤處理許可':i.other.soilTreatmentAuthorized==='no'?'未具備完整合法例外條件':'尚無法確認'}。`);if(i.other.groundwaterInjection==='yes')out.push('【目視】現場有注入地下水體情形。');if(i.other.notes)out.push(`【目視】其他事實：${i.other.notes}`);}
    });
    return out;
  }
  function methodLabel(v){return ({ground:'排放至地面水體',storage:'貯留',recycle:'全量回收','委託':'全量委託',dilution:'稀釋',sewer:'納管',soil:'土壤處理',none:'無廢污水產生',other:'其他'})[v]||v;}
  function permitTypeLabel(v){return ({discharge:'排放許可／簡易排放許可',storage:'貯留許可',dilution:'稀釋許可',soil:'土壤處理許可',other:'其他水措／核准資料',unknown:'無法確認許可類型'})[v]||v;}
  function destLabel(v){return ({ground:'地面水體',sewer:'納管',soil:'土壤',groundwater:'地下水體',other:'其他'})[v]||v;}
  function a30Label(v){return ({pesticide:'農藥／肥料',discard:'棄置污染物',kill_aquatic:'捕殺水生物',livestock:'飼養禽畜',other:'其他污染水體行為'})[v]||v;}

  function lawAssessment(){
    if(!root.WaterV2Assessment?.assess) throw new Error('WaterV2Assessment 尚未載入。');
    const inspections=[...state.inspections];
    if(state.currentInspection&&!inspections.some(x=>x.id===state.currentInspection.id)) inspections.push(state.currentInspection);
    return root.WaterV2Assessment.assess(inspections);
  }

  function renderScreeningSummary(){
    const entries=screeningSummaryEntries();
    const anyScreen=state.baseScreening.status==='yes'||state.traceNodes.some(n=>n.screeningActive||n.screenings?.length);
    if(!anyScreen)return '';
    if(!entries.length)return `<div class="screen-summary"><h4>快篩查源輔助</h4><div class="muted small">目前尚無足夠的「有反應」組合產生可能來源方向；可繼續沿水路以相同項目比較。</div></div>`;
    return `<div class="screen-summary"><h4>快篩查源輔助</h4>${entries.map(e=>`<div class="source-direction"><strong>${esc(e.location)}</strong>${e.dirs.map(d=>`<div><b>${esc(d.title)}</b>：${esc(d.reason)}</div>`).join('')}</div>`).join('')}<div class="notice warn">快篩相似 ≠ 來源確認；快篩異常 ≠ 法定超標。可能來源方向僅供污染查源參考。</div></div>`;
  }

  function renderSummary(){
    saveInspection();const fs=facts(), as=lawAssessment();
    $app.innerHTML=`<div class="section-title"><div><h2>整理目前內容</h2><p>不是結案；只把目前已經查到的內容整理出來。</p></div><button class="btn btn-ghost" id="summaryHome">返回水污首頁</button></div>
      <section class="card summary-section"><h3>1｜目前查核事實</h3>${fs.length?`<div class="summary-list">${fs.map(x=>`<div class="summary-item">${esc(x)}</div>`).join('')}</div>`:'<div class="empty">目前尚無可整理的查核事實。</div>'}${renderScreeningSummary()}</section>
      <section class="card summary-section"><h3>2｜目前可能法規</h3><div class="notice info">系統只做規則配對，不代表違規成立；最終適用由稽查員判斷。</div>${as.laws.length?`<div class="summary-list">${as.laws.map(x=>`<div class="summary-item"><strong>可能法條：${esc(x.law)}</strong><br><span>${esc(x.reason)}</span></div>`).join('')}</div>`:'<div class="empty">目前沒有足夠的結構化事實產生可能法規。</div>'}</section>
      <section class="card summary-section"><h3>3｜尚待確認</h3>${as.pending.length?`<div class="summary-list">${as.pending.map(x=>`<div class="summary-item">尚待確認：${esc(x)}</div>`).join('')}</div>`:'<div class="empty">目前沒有系統列出的尚待確認事項。</div>'}</section>
      <section class="card"><h3>稽查紀錄敘述草稿</h3><p>草稿只寫事實，不自動寫可能法條或違規研判。</p><div class="btn-row"><button class="btn btn-primary" id="makeDraft">產生稽查紀錄敘述草稿</button></div></section>
      <div class="sticky-actions"><button class="btn btn-ghost" id="summaryBack">返回</button><button class="btn btn-secondary" id="backPollution">污染排查</button>${state.currentInspection?'<button class="btn btn-secondary" id="backSubject">對象查核</button>':''}</div>`;
    document.getElementById('summaryHome').onclick=()=>setView('home');document.getElementById('summaryBack').onclick=()=>setView('home');document.getElementById('backPollution').onclick=()=>setView('pollution');const bs=document.getElementById('backSubject');if(bs)bs.onclick=()=>setView('subject');document.getElementById('makeDraft').onclick=()=>{state.draftText=makeDraftText(fs);setView('draft');};
  }

  function makeDraftText(fs){
    if(!fs.length)return '目前尚無足夠事實可產生草稿。';
    const cleaned=fs.map(x=>x.replace(/^【[^】]+】/,'').trim());
    return cleaned.join('');
  }
  function renderDraft(){
    $app.innerHTML=`<div class="section-title"><div><h2>稽查紀錄敘述草稿</h2><p>可自由修改；編輯草稿不會反向修改結構化事實，也不影響規則引擎。</p></div><button class="btn btn-ghost" id="draftSummary">返回整理頁</button></div>
      <section class="card"><div class="notice info">草稿只整理目前已記錄事實，不加入可能法條、超標或違規成立判斷。</div><textarea class="text-area draft-area" id="draftArea">${esc(state.draftText)}</textarea><div class="btn-row"><button class="btn btn-secondary" id="regenDraft">重新產生</button><button class="btn btn-primary" id="copyDraft">複製全文</button></div><div id="copyStatus" class="hint"></div></section>`;
    document.getElementById('draftSummary').onclick=()=>setView('summary');document.getElementById('draftArea').oninput=e=>state.draftText=e.target.value;document.getElementById('regenDraft').onclick=()=>{state.draftText=makeDraftText(facts());renderDraft();};document.getElementById('copyDraft').onclick=async()=>{const text=document.getElementById('draftArea').value;try{await navigator.clipboard.writeText(text);document.getElementById('copyStatus').textContent='已複製。';}catch{document.getElementById('draftArea').select();document.execCommand('copy');document.getElementById('copyStatus').textContent='已嘗試複製；若瀏覽器阻擋，可直接 Ctrl+C。';}};
  }

  function reset(){
    state.view='home';
    state.pollutionPoint={presence:'',phenomena:[],otherPhenomenon:'',location:'',directionKnown:'',directionText:'',notes:''};
    state.baseScreening={status:'',unavailableReason:'',ph:'',temperature:'',industry:'',processes:[],records:[]};
    state.traceNodes=[];
    state.sources=[];
    state.currentInspection=null;
    state.inspections=[];
    state.draftText='';
    if($app) render();
  }
  function mount(container){
    if(!container) throw new Error('WaterV2UI mount target is required.');
    $app=container;
    $app.classList.add('water-v2-shell');
    render();
  }
  root.WaterV2UI=Object.freeze({
    version:VERSION,
    provenance:PROVENANCE,
    mount,
    hasData,
    reset
  });
})(window);