(function(root){
  'use strict';

  const VERSION = '4.9.37';
  const PROVENANCE = 'PP-IA-41-7F3C9A21';
  let $app = null;

  const state = {
    view: 'home',
    pollutionPoint: {
      presence: '', phenomena: [], otherPhenomenon: '', location: '', directionKnown: '', directionText: '', notes: ''
    },
    baseScreening: { status: '', unavailableReason: '', records: [] },
    traceNodes: [],
    sources: [],
    currentInspection: null,
    inspections: [],
    draftText: ''
  };

  const phenomenaOptions = ['變色','異味','泡沫','油膜','混濁','異常水流','沉積物'];
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
  function selectValue(options, value, blank='請選擇'){
    return `<option value="">${blank}</option>`+options.map(([v,l])=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(l)}</option>`).join('');
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
        <label class="field"><span class="field-label">現場發現哪些情形？</span>${checkboxList(p.phenomena,phenomenaOptions,'phenomena')}</label>
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
        ${state.baseScreening.status==='yes'?screeningTable(state.baseScreening.records,'base'):''}
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

  function screeningTable(records, scope){
    return `<div class="table-wrap"><table class="table"><thead><tr><th>快篩項目</th><th>結果／數值</th><th>單位</th><th>補充</th><th></th></tr></thead><tbody>
      ${records.map((r,i)=>`<tr><td><input data-screen="item" data-scope="${scope}" data-index="${i}" value="${esc(r.item)}" placeholder="pH"></td><td><input data-screen="value" data-scope="${scope}" data-index="${i}" value="${esc(r.value)}"></td><td><input data-screen="unit" data-scope="${scope}" data-index="${i}" value="${esc(r.unit)}"></td><td><input data-screen="note" data-scope="${scope}" data-index="${i}" value="${esc(r.note)}"></td><td><button class="btn btn-danger" data-remove-screen="${scope}" data-index="${i}">刪除</button></td></tr>`).join('')}
      </tbody></table></div><div class="btn-row"><button class="btn btn-secondary" data-add-screen="${scope}">＋新增快篩項目</button></div>`;
  }

  function bindPollutionInputs(){
    document.querySelectorAll('input[name="pollutionPresence"]').forEach(el=>el.onchange=e=>{state.pollutionPoint.presence=e.target.value;});
    document.querySelectorAll('input[name="phenomena"]').forEach(el=>el.onchange=()=>{state.pollutionPoint.phenomena=[...document.querySelectorAll('input[name="phenomena"]:checked')].map(x=>x.value);});
    const bind=(id,key,rerender=false)=>{const el=document.getElementById(id);if(el) el.oninput=e=>{state.pollutionPoint[key]=e.target.value;if(rerender) renderPollution();};};
    bind('otherPhenomenon','otherPhenomenon');bind('pollutionLocation','location');bind('pollutionNotes','notes');bind('directionText','directionText');
    document.querySelectorAll('input[name="directionKnown"]').forEach(el=>el.onchange=e=>{state.pollutionPoint.directionKnown=e.target.value;if(e.target.value!=='yes')state.pollutionPoint.directionText='';renderPollution();});
    document.querySelectorAll('input[name="screeningStatus"]').forEach(el=>el.onchange=e=>{state.baseScreening.status=e.target.value;renderPollution();});
    const su=document.getElementById('screeningUnavailable');if(su)su.oninput=e=>state.baseScreening.unavailableReason=e.target.value;
  }

  function bindScreening(scope, records){
    document.querySelectorAll(`[data-add-screen="${scope}"]`).forEach(btn=>btn.onclick=()=>{records.push({item:'',value:'',unit:'',note:''});renderPollution();});
    document.querySelectorAll(`[data-remove-screen="${scope}"]`).forEach(btn=>btn.onclick=()=>{records.splice(Number(btn.dataset.index),1);renderPollution();});
    document.querySelectorAll(`[data-screen][data-scope="${scope}"]`).forEach(el=>el.oninput=e=>{records[Number(e.target.dataset.index)][e.target.dataset.screen]=e.target.value;});
  }

  function addTraceNode(parentId){
    const siblings=state.traceNodes.filter(n=>n.parentId===parentId).length;
    state.traceNodes.push({id:newId('node'),parentId,branchNo:siblings+1,type:'',location:'',hasFlow:'',directionKnown:'',directionText:'',notes:'',result:'',stopReason:'',stopNotes:'',screenings:[],sourceStatus:'',sourceName:'',evidence:[],evidenceOther:''});
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
      ${n.screenings.length?`<div class="divider"></div><h4>此節點快篩</h4>${screeningTable(n.screenings,`node:${n.id}`)}`:''}
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
      bindScreening(`node:${n.id}`,n.screenings);
    });
    document.querySelectorAll('[data-add-child]').forEach(b=>b.onclick=()=>addTraceNode(b.dataset.addChild));
    document.querySelectorAll('[data-add-node-screen]').forEach(b=>b.onclick=()=>{const n=state.traceNodes.find(x=>x.id===b.dataset.addNodeScreen);n.screenings.push({item:'',value:'',unit:'',note:''});renderPollution();});
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
      id:newId('inspection'),sourceNodeId:prefill.sourceNodeId||'',name:prefill.name||'',subjectType:'',permitStatus:'',permitType:'',methods:[],
      topics:{B:newTopic(),C:newTopic(),D:newTopic(),E:newTopic(),F:newTopic()},
      details:{
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
    const methods=[['ground','排放至地面水體'],['storage','貯留'],['recycle','全量回收'],['委託','全量委託'],['dilution','稀釋'],['sewer','納管'],['soil','土壤處理'],['none','無廢污水產生'],['other','其他']];
    return `<section class="card"><h3>A｜許可／核准</h3><p>只確認現場法規判斷需要的許可類型，不在系統建立許可證資料庫。</p>
      <label class="field"><span class="field-label">目前是否有有效水許可／核准資料？</span>${ynu(i.permitStatus,'permitStatus',{yes:'有',no:'無',unknown:'無法確認'})}</label>
      ${i.permitStatus==='yes'?`<label class="field"><span class="field-label">目前核對的是哪一類許可／核准？</span><select class="select-input" id="permitType">${selectValue([['discharge','排放許可／簡易排放許可'],['storage','貯留許可'],['dilution','稀釋許可'],['soil','土壤處理許可'],['other','其他水措／核准資料'],['unknown','無法確認許可類型']],i.permitType)}</select></label>`:''}
      ${i.permitStatus==='no'?`<label class="field"><span class="field-label">現場實際處理方式（可複選）</span>${checkboxList(i.methods,methods,'methods')}</label>`:''}
      ${i.permitStatus==='yes'?'<div class="notice info">請自行查看現有許可／核准內容，再依 B～F 核對現場。第14條只在排放許可／簡易排放許可的登記事項差異方向自動提示。</div>':''}
      ${i.permitStatus==='unknown'?'<div class="notice warn">「無法確認」不等同無許可；整理頁會列為尚待確認。</div>':''}
      ${isSewer?'<div class="notice info">污水下水道系統的第14、15、18條依第19條準用；第20條等則依各該條文直接判斷，不一律冠上第19條。</div>':''}
    </section>
    ${topicCard('B','水量／流量','核對水量計測設施、位置、讀值／計量狀況及相關紀錄。',i)}
    ${topicCard('C','用電／設備運轉','確認設備當時是否應運轉、供電、實際運轉及相關紀錄。',i)}
    ${topicCard('D','操作紀錄','確認是否應有紀錄、是否可提供、是否足以查核及與現場是否一致。',i)}
    ${topicCard('E','處理設施','確認是否有廢污水需要處理、設備是否應運轉、實際運轉及替代處理方式。',i)}
    ${topicCard('F','放流／最終去向','確認核准放流口／路徑、實際排放、最終去向及必要採樣。',i)}`;
  }
  function topicCard(code,title,desc,i){
    const t=i.topics[code], d=i.details[code];
    return `<section class="card topic-card"><div class="topic-head"><div><div class="topic-title">${code}｜${title}</div><div class="topic-desc">${desc}</div></div><div>${ynu(t.status,`topic_${code}`,{none:'無疑點',doubt:'有疑點',unchecked:'本次未查'})}</div></div>
      ${t.status==='doubt'?`<div class="details"><label class="field"><span class="field-label">疑點類型</span>${checkboxList(t.doubtTypes,[['permit_mismatch','與許可／核准內容不一致'],['unknown','無法確認'],['abnormal','現場狀態異常'],['other','其他']],`doubt_${code}`)}</label>${renderTopicStructured(code,d)}<label class="field"><span class="field-label">許可／核准內容（需要時再填）</span><textarea class="text-area" data-topic="${code}" data-topic-field="permitText">${esc(t.permitText)}</textarea></label><label class="field"><span class="field-label">現場查核事實</span><textarea class="text-area" data-topic="${code}" data-topic-field="factText">${esc(t.factText)}</textarea></label><label class="field"><span class="field-label">自由文字補充</span><textarea class="text-area" data-topic="${code}" data-topic-field="notes">${esc(t.notes)}</textarea></label></div>`:''}
    </section>`;
  }
  function renderTopicStructured(code,d){
    const f=(label,key)=>`<label class="field"><span class="field-label">${label}</span>${ynu(d[key],`${code}_${key}`)}</label>`;
    if(code==='B') return f('是否應設水量計測','meterRequired')+f('現場是否設置','meterInstalled')+f('是否正常計量','meterWorking')+f('紀錄與現場是否一致','recordMatch');
    if(code==='C') return f('設備當時是否應運轉','shouldOperate')+f('是否有正常供電','powerNormal')+f('是否實際運轉','actuallyRunning')+f('用電／操作紀錄與現場是否一致','recordMatch');
    if(code==='D') return f('是否應有紀錄','recordRequired')+f('是否可提供','recordAvailable')+f('是否完整到足以查核','recordComplete')+f('是否與現場一致','recordMatch');
    if(code==='E') return f('是否有廢污水需要處理','needsTreatment')+f('設備當時是否應運轉','shouldOperate')+f('是否實際正常運轉','actuallyRunning')+f('是否有其他替代處理方式','alternativeTreatment')+f('廠內水路／處理流程與許可是否一致','internalFlowMatch');
    if(code==='F') return f('是否有核准放流口／路徑','approvedRoute')+f('現場排放位置／路徑是否一致','routeMatch')+f('是否有廢污水實際排放','actualDischarge')+f('最終去向是否確認','destinationKnown')+`${d.destinationKnown==='yes'?`<label class="field"><span class="field-label">最終去向</span><select class="select-input" data-detail-code="F" data-detail-key="destination">${selectValue([['ground','地面水體'],['sewer','納管'],['soil','排放於土壤'],['groundwater','注入地下水體'],['other','其他']],d.destination)}</select></label>${d.destination==='soil'?`<label class="field"><span class="field-label">是否已確認符合土壤處理標準，且具有有效土壤處理許可？</span>${ynu(d.soilTreatmentAuthorized,'F_soilTreatmentAuthorized')}</label>`:''}`:''}`+f('是否由非核准最終放流口／非核准納管口排出','nonApprovedFinalOutlet')+f('本次是否現場採樣','sampled')+`${d.sampled==='yes'?`<label class="field"><span class="field-label">採樣補充</span><input class="text-input" data-detail-code="F" data-detail-key="sampleNote" value="${esc(d.sampleNote)}" placeholder="採樣點／樣品資訊（不做實驗室結果判定）"></label>`:''}`+`<div class="divider"></div><h4>禁止稀釋事實（需要時才填）</h4>${f('廢污水是否需處理才能符合標準','dilutionNeedsTreatment')+f('是否與其他水混合','mixedWater')+f('混入水是否無需處理即可符合標準','mixedWaterClean')+f('是否在排放／納管前混合','mixedBeforeDischarge')}`;
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
      syncSources();
      saveInspection();
      renderSubject();
    });
    document.getElementById('subjectName').oninput=e=>{
      i.name=e.target.value;
      const n=state.traceNodes.find(x=>x.id===i.sourceNodeId);
      if(n){n.sourceName=e.target.value;syncSources();}
    };
    document.querySelectorAll('input[name="subjectType"]').forEach(el=>el.onchange=e=>{i.subjectType=e.target.value;saveInspection();renderSubject();});
    document.querySelectorAll('input[name="permitStatus"]').forEach(el=>el.onchange=e=>{i.permitStatus=e.target.value;if(e.target.value!=='no')i.methods=[];if(e.target.value!=='yes')i.permitType='';renderSubject();});
    const permitType=document.getElementById('permitType');if(permitType)permitType.onchange=e=>i.permitType=e.target.value;
    document.querySelectorAll('input[name="methods"]').forEach(el=>el.onchange=()=>{i.methods=[...document.querySelectorAll('input[name="methods"]:checked')].map(x=>x.value);});
    ['B','C','D','E','F'].forEach(code=>{
      document.querySelectorAll(`input[name="topic_${code}"]`).forEach(el=>el.onchange=e=>{i.topics[code].status=e.target.value;renderSubject();});
      document.querySelectorAll(`input[name="doubt_${code}"]`).forEach(el=>el.onchange=()=>{i.topics[code].doubtTypes=[...document.querySelectorAll(`input[name="doubt_${code}"]:checked`)].map(x=>x.value);});
      document.querySelectorAll(`[data-topic="${code}"]`).forEach(el=>el.oninput=e=>{i.topics[code][e.target.dataset.topicField]=e.target.value;});
      Object.keys(i.details[code]||{}).forEach(key=>document.querySelectorAll(`input[name="${code}_${key}"]`).forEach(el=>el.onchange=e=>{i.details[code][key]=e.target.value;if(code==='F'&&(key==='destinationKnown'||key==='sampled'||key==='soilTreatmentAuthorized'))renderSubject();}));
    });
    document.querySelectorAll('[data-detail-code]').forEach(el=>el.oninput=e=>{i.details[e.target.dataset.detailCode][e.target.dataset.detailKey]=e.target.value;if(e.target.dataset.detailCode==='F'&&e.target.dataset.detailKey==='destination'){if(e.target.value!=='soil')i.details.F.soilTreatmentAuthorized='';renderSubject();}});
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
    if(p.phenomena.length||p.otherPhenomenon) out.push(`【目視】污染現象：${[...p.phenomena,p.otherPhenomenon].filter(Boolean).join('、')}。`);
    if(p.directionKnown==='yes'&&p.directionText) out.push(`【目視】現場可辨識水流方向：${p.directionText}。`);
    if(p.directionKnown==='no') out.push('【目視】現場無法辨識水流方向。');
    if(p.notes) out.push(`【目視】污染點補充：${p.notes}`);
    if(state.baseScreening.status==='yes') state.baseScreening.records.filter(r=>r.item||r.value).forEach(r=>out.push(`【快篩】污染點 ${r.item||'快篩項目'}：${r.value||'未填結果'}${r.unit?` ${r.unit}`:''}${r.note?`（${r.note}）`:''}。`));
    if(state.baseScreening.status==='unknown') out.push(`【快篩】污染點快篩無法進行${state.baseScreening.unavailableReason?`，原因：${state.baseScreening.unavailableReason}`:''}。`);
    state.traceNodes.forEach(n=>{
      const type=({ditch:'側溝',drain:'排水溝',outfall:'排水口',channel:'渠道',pipe:'管線',manhole:'人孔／陰井',site:'場址／場所',waterbody:'水體',other:'其他節點'})[n.type]||'追查節點';
      if(n.type||n.location) out.push(`【目視】追查至${n.location?`${n.location}之`:''}${type}${n.hasFlow==='yes'?'，現場有水流':n.hasFlow==='no'?'，現場未見水流':''}${n.directionKnown==='yes'&&n.directionText?`，流向為${n.directionText}`:''}。`);
      n.screenings.filter(r=>r.item||r.value).forEach(r=>out.push(`【快篩】${n.location||`節點 ${nodeNumber(n.id)}`} ${r.item||'快篩項目'}：${r.value||'未填結果'}${r.unit?` ${r.unit}`:''}。`));
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
      if(i.subjectType==='industry'||i.subjectType==='sewer') ['B','C','D','E','F'].forEach(code=>{const t=i.topics[code];if(t.status==='doubt'&&t.factText)out.push(`【查核】${code} 項現場事實：${t.factText}`); if(t.status==='unchecked')out.push(`【查核】${code} 項本次未查。`);});
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
    const laws=[], pending=[];
    const inspections=[...state.inspections];if(state.currentInspection&&!inspections.some(x=>x.id===state.currentInspection.id))inspections.push(state.currentInspection);
    inspections.forEach(i=>{
      if(i.subjectType==='industry'||i.subjectType==='sewer'){
        const F=i.details.F, subjectName=i.name||'稽查對象';
        const law14=i.subjectType==='sewer'?'水污染防治法第19條準用第14條第1項':'水污染防治法第14條第1項';
        const law18=i.subjectType==='sewer'?'水污染防治法第19條準用第18條':'水污染防治法第18條';
        const hasTopicEvidence=code=>{
          const t=i.topics[code], d=i.details[code]||{};
          return !!(t?.permitText?.trim()||t?.factText?.trim()||Object.values(d).some(v=>v!==''));
        };
        const permitMismatchCodes=['B','C','D','E'].filter(code=>{
          const t=i.topics[code];
          const directMismatch=code==='E'&&i.details.E.internalFlowMatch==='no';
          return directMismatch||(t.status==='doubt'&&t.doubtTypes.includes('permit_mismatch')&&hasTopicEvidence(code));
        });

        if(i.permitStatus==='unknown')pending.push(`${subjectName}：目前是否具有有效水許可／核准資料。`);
        if(i.permitStatus==='yes'&&!i.permitType)pending.push(`${subjectName}：確認目前核對的有效許可／核准類型。`);
        if(i.permitStatus==='yes'&&i.permitType==='unknown')pending.push(`${subjectName}：目前許可類型尚無法確認，暫不以許可登記事項差異直接指定第14條或第20條。`);

        // 無有效許可時，依實際處理方式判斷。第20條是事業或污水下水道系統直接適用，不經第19條準用。
        if(i.permitStatus==='no'&&i.methods.includes('ground')) laws.push({law:i.subjectType==='sewer'?'水污染防治法第19條準用第14條第1項':'水污染防治法第14條第1項',reason:'目前結構化事實為無有效排放許可／核准資料，且有排放廢污水至地面水體方向。'});
        if(i.permitStatus==='no'&&i.methods.some(m=>['storage','dilution'].includes(m))) laws.push({law:'水污染防治法第20條',reason:'目前結構化事實顯示採貯留或稀釋方式，但無有效許可／核准資料；第20條對事業及污水下水道系統直接適用。'});
        if(i.permitStatus==='no'&&i.methods.some(m=>['recycle','委託'].includes(m))) pending.push(`${subjectName}：全量回收／全量委託情境尚需確認是否涉及廢水貯留及相應許可義務，不直接僅因處理方式套用第20條。`);
        if(i.permitStatus==='no'&&i.methods.includes('soil')) laws.push({law:'水污染防治法第32條',reason:'目前結構化事實顯示廢污水排放於土壤，且未有有效水許可／核准資料可支持土壤處理合法例外。'});

        // B～E 許可差異：先依「許可類型」分流，避免把任何水許可都錯套第14條。
        if(permitMismatchCodes.length&&i.permitStatus==='yes'){
          if(i.permitType==='discharge'){
            permitMismatchCodes.forEach(code=>laws.push({law:law14,reason:`${code} 項已記錄與排放許可／簡易排放許可登記事項不一致，進入未依登記事項運作之查核方向。`}));
          }else if(i.permitType==='storage'||i.permitType==='dilution'){
            permitMismatchCodes.forEach(code=>laws.push({law:'水污染防治法第20條',reason:`${code} 項已記錄與${i.permitType==='storage'?'貯留':'稀釋'}許可登記事項不一致，進入第20條「依登記事項運作」之查核方向。`}));
          }else if(i.permitType){
            pending.push(`${subjectName}：B～E 已發現許可／核准差異，但目前許可類型為「${permitTypeLabel(i.permitType)}」，需再確認該差異所對應之具體法規義務。`);
          }
        }

        // F 非核准最終放流口／納管口屬第18條之1第1項；優先於一般許可差異。
        if(F.nonApprovedFinalOutlet==='yes') laws.push({law:'水污染防治法第18條之1第1項',reason:'結構化事實顯示由非核准最終放流口／非核准納管口排出，進入繞流排放方向。'});

        // F 一般路徑差異只有在「排放許可 + 地面水體 + 已確認不是非核准最終出口」時才自動進第14條。
        if(i.permitStatus==='yes'&&F.actualDischarge==='yes'&&F.routeMatch==='no'&&F.nonApprovedFinalOutlet==='no'){
          if(i.permitType==='discharge'&&F.destinationKnown==='yes'&&F.destination==='ground'){
            laws.push({law:law14,reason:'現場有實際排放至地面水體，排放位置／路徑與排放許可登記事項不一致，且已確認並非由非核准最終放流口排出，進入第14條第1項方向。'});
          }else if(F.destinationKnown==='yes'&&F.destination==='sewer'){
            pending.push(`${subjectName}：實際最終去向為納管，路徑與核准內容不一致時，不直接套用第14條；需釐清是否屬第18條之1繞流、下水道核准排放口差異或其他水措義務。`);
          }else{
            pending.push(`${subjectName}：排放路徑與許可／核准內容不一致，但尚缺「排放許可類型」及「排放至地面水體」等第14條前提，暫不直接指定第14條。`);
          }
        }else if(F.actualDischarge==='yes'&&F.routeMatch==='no'&&F.nonApprovedFinalOutlet!=='yes'&&F.nonApprovedFinalOutlet!=='no'){
          pending.push(`${subjectName}：排放路徑與許可不一致時，需確認是否屬非核准最終放流口／非核准納管口，以區分第18條之1第1項與其他許可差異。`);
        }

        // 第18條之1第2項：禁止稀釋。
        if(F.dilutionNeedsTreatment==='yes'&&F.mixedWater==='yes'&&F.mixedWaterClean==='yes'&&F.mixedBeforeDischarge==='yes') laws.push({law:'水污染防治法第18條之1第2項',reason:'結構化事實符合排放／納管前，將須處理之廢污水與無需處理即可符合標準之水混合稀釋的查核方向。'});

        // 第18條之1第4項：處理設施應具足夠功能與設備並維持正常操作。
        const E=i.details.E;
        if(E.needsTreatment==='yes'&&E.shouldOperate==='yes'&&E.actuallyRunning==='no'){
          if(E.alternativeTreatment==='no') laws.push({law:'水污染防治法第18條之1第4項',reason:'結構化事實顯示廢污水需要處理、處理設施當時應運轉但未正常運轉，且未記錄其他替代處理方式。'});
          else if(E.alternativeTreatment!=='yes') pending.push(`${subjectName}：處理設施應運轉但未正常運轉時，尚需確認是否有有效替代處理方式，以判斷第18條之1第4項方向。`);
        }

        // 第18條：只在既有結構化事實指出具體水措義務類型時提示。
        const B=i.details.B, D=i.details.D;
        if(B.meterRequired==='yes'&&(B.meterInstalled==='no'||B.meterWorking==='no')){
          const issue=B.meterInstalled==='no'?'應設水量計測但現場未設置':'應設之水量計測未正常計量';
          laws.push({law:law18,reason:`已記錄「${issue}」之具體事實，屬水污染防治措施中計測設施之查核方向；仍需依實際處理方式、設置位置及適用子法確認具體義務。`});
          pending.push(`${subjectName}：確認該水量計測設施之適用水措規定、法定設置位置及具體義務。`);
        }
        if(D.recordRequired==='yes'&&(D.recordAvailable==='no'||D.recordComplete==='no')){
          const issue=D.recordAvailable==='no'?'依法應有之紀錄無法提供':'依法應有之紀錄不完整';
          laws.push({law:law18,reason:`已記錄「${issue}」之具體事實，屬水污染防治措施中操作／管理紀錄義務之查核方向；仍需確認本案適用之具體子法規定。`});
          pending.push(`${subjectName}：確認本案應保存／提供之具體水措紀錄種類、頻率及保存義務。`);
        }

        // 第32條：地下水注入原則禁止；土壤排放須保留法定合法例外判斷。
        if(F.destinationKnown==='yes'&&F.destination==='groundwater') laws.push({law:'水污染防治法第32條第1項',reason:'最終去向記錄為注入地下水體，進入第32條第1項禁止方向。'});
        if(F.destinationKnown==='yes'&&F.destination==='soil'){
          if(F.soilTreatmentAuthorized==='no') laws.push({law:'水污染防治法第32條第1項',reason:'現場有排放廢污水於土壤，且已確認未具備「符合土壤處理標準並取得主管機關許可」之合法例外。'});
          else if(F.soilTreatmentAuthorized!=='yes'){
            laws.push({law:'水污染防治法第32條方向',reason:'現場有排放廢污水於土壤情形；第32條原則禁止，但法律另有符合土壤處理標準並經許可之例外。'});
            pending.push(`${subjectName}：確認土壤排放是否已處理符合土壤處理標準，且具有有效土壤處理許可。`);
          }
        }
        if(F.actualDischarge==='yes'&&F.destinationKnown!=='yes') pending.push(`${subjectName}：實際排放之最終去向。`);
        if(F.sampled==='yes') pending.push(`${subjectName}：本次僅記錄現場採樣；V2 不輸入實驗室結果，也不自動判定第7條超標。`);
      }

      if(i.subjectType==='building') laws.push({law:'水污染防治法第25條方向',reason:'本對象選定為建築物污水處理設施；應依設施狀態、管理／清理、紀錄及排放事實進一步判斷。'});

      if(i.subjectType==='other'){
        const subjectName=i.name||'稽查對象';
        if(i.other.article30.length){
          if(i.other.controlZone==='yes'){
            laws.push({law:'水污染防治法第30條方向',reason:`已確認行為地點位於水污染管制區，並記錄行為：${i.other.article30.map(a30Label).join('、')}；仍依各款具體要件進一步確認。`});
            if(i.other.article30.includes('pesticide'))pending.push(`${subjectName}：第30條第1款尚需確認是否涉及主管機關指定水體，且有污染之虞。`);
            if(i.other.article30.includes('discard'))pending.push(`${subjectName}：第30條第2款尚需確認棄置位置是否在水體或其沿岸規定距離內，及棄置物是否屬法定污染物。`);
            if(i.other.article30.includes('livestock'))pending.push(`${subjectName}：第30條第4款尚需確認是否位於主管機關指定水體或其沿岸規定距離內。`);
            if(i.other.article30.includes('other'))pending.push(`${subjectName}：第30條第5款尚需確認是否有主管機關公告禁止該類足使水污染之行為。`);
          }else if(i.other.controlZone!=='no'){
            pending.push(`${subjectName}：第30條適用前提為行為地點位於公告之水污染管制區，尚需先確認管制區範圍。`);
          }
        }
        if(i.other.groundwaterInjection==='yes') laws.push({law:'水污染防治法第32條第1項',reason:'現場結構化事實包含將廢污水注入地下水體，進入第32條第1項禁止方向。'});
        if(i.other.soilDischarge==='yes'){
          if(i.other.soilTreatmentAuthorized==='no') laws.push({law:'水污染防治法第32條第1項',reason:'現場有排放廢污水於土壤，且已確認未具備「符合土壤處理標準並取得主管機關許可」之合法例外。'});
          else if(i.other.soilTreatmentAuthorized!=='yes'){
            laws.push({law:'水污染防治法第32條方向',reason:'現場有排放廢污水於土壤情形；第32條原則禁止，但法律另有符合土壤處理標準並經許可之例外。'});
            pending.push(`${subjectName}：確認土壤排放是否已處理符合土壤處理標準，且具有有效土壤處理許可。`);
          }
        }
      }
    });
    return {laws:dedupeLaw(laws),pending:[...new Set(pending)]};
  }
  function dedupeLaw(arr){const m=new Map();arr.forEach(x=>{const k=x.law+'|'+x.reason;if(!m.has(k))m.set(k,x)});return [...m.values()];}

  function renderSummary(){
    saveInspection();const fs=facts(), as=lawAssessment();
    $app.innerHTML=`<div class="section-title"><div><h2>整理目前內容</h2><p>不是結案；只把目前已經查到的內容整理出來。</p></div><button class="btn btn-ghost" id="summaryHome">返回水污首頁</button></div>
      <section class="card summary-section"><h3>1｜目前查核事實</h3>${fs.length?`<div class="summary-list">${fs.map(x=>`<div class="summary-item">${esc(x)}</div>`).join('')}</div>`:'<div class="empty">目前尚無可整理的查核事實。</div>'}</section>
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
    state.baseScreening={status:'',unavailableReason:'',records:[]};
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