(function(root){
  'use strict';
  const stateLabels={not_applicable:'目前不適用',facts_insufficient:'資料不足',possible_application:'可能適用',elements_substantially_met:'主要要件大致具備',exception_possible:'存在例外待確認',potential_violation:'可能不符合',no_issue_found:'目前未見不符',human_review_required:'建議人工確認',applicable_pending_test:'待正式檢驗'};
  const keyLabels={
    'session.incidentDate':'案件／稽查日期',
    'water.subject.type':'行為主體',
    'water.liquid.classification':'該股水性質',
    'water.discharge.occurred':'是否實際排放',
    'water.discharge.destination_type':'排放最終去向',
    'water.flow.bypass_direct_relation':'是否確認實際水流繞過核准收集／處理流程',
    'water.permit.discharge_required':'本案是否依法需排放許可',
    'water.permit.discharge_status':'排放許可狀態',
    'water.permit.source_difference':'污染來源與許可登記事項比對',
    'water.permit.process_difference':'製程與許可登記事項比對',
    'water.permit.discharge_location_difference':'放流位置與許可登記事項比對',
    'water.permit.route_difference':'水流路徑與許可登記事項比對',
    'water.permit.treatment_difference':'處理設施與許可登記事項比對',
    'water.sampling.formal_result_available':'正式檢驗結果',
    'water.sampling.applicable_standard_confirmed':'適用放流水標準',
    'water.sampling.standard_exceeded':'正式檢驗與標準比對',
    'water.leak.transport_storage_equipment':'是否涉及輸送或貯存設備',
    'water.leak.risk_to_water_body':'是否有疏漏至水體之虞',
    'water.leak.preventive_measure_present':'維護及防範措施',
    'water.leak.present':'是否發生疏漏',
    'water.leak.reached_water_body':'疏漏是否進入水體',
    'water.emergency.response_performed':'是否立即採取緊急應變',
    'water.emergency.incident_time':'事故發生時間',
    'water.emergency.notification_time':'通知主管機關時間',
    'water.control_zone.status':'是否位於水污染管制區',
    'water.subject.activity_type':'業別／製程',
    'water.subject.regulatory_scale_status':'管制規模',
    'water.discharge.affects_water_quality':'是否影響水體品質',
    'water.soil.contact_mode':'排放於土壤之行為型態',
    'water.soil_treatment.permit_status':'土壤處理許可'
  };
  const valueLabels={
    'water.discharge.destination_type':{surface_water_body:'地面水體',soil:'土壤',groundwater:'地下水體／注入地下',sewer_system:'污水下水道',storage:'貯留',recycle:'回收使用',entrusted_treatment:'委託處理',unknown:'尚無法確認'},
    'water.premises.relation_status':{candidate:'候選場所',nearby:'僅位置接近',supported_relation:'有支持關聯事實',confirmed_relation:'已確認關聯',excluded:'已排除',unresolved:'仍無法確認'},
    'water.liquid.classification':{wastewater:'事業廢水',sewage:'污水',runoff:'逕流／雨水',other_water:'其他已確認水體／水流',unknown:'尚無法確認'}
  };
  function missingFactLabel(item={}){
    if(item.displayLabel)return item.displayLabel;
    if(item.object==='flow'){
      if(item.kind==='authorized')return '核准收集／處理流程';
      if(item.kind==='actual')return '實際水流路徑';
      return '核准流程與實際水流關係';
    }
    if(item.legalSource==='NOTICE-WATER-POLLUTING-BEHAVIOR')return '案件日期有效之「禁止足使水污染行為」公告';
    if(item.key&&keyLabels[item.key])return keyLabels[item.key];
    return '待確認事實';
  }
  function missingFactLabels(items=[]){
    const seen=new Set(),out=[];
    for(const item of items){const label=missingFactLabel(item);if(!seen.has(label)){seen.add(label);out.push(label);}}
    return out;
  }
  function presentMissingFacts(items=[]){
    const seen=new Set(),out=[];
    for(const item of items){
      const label=missingFactLabel(item);if(seen.has(label))continue;seen.add(label);
      out.push({...item,rawKey:item.key||null,rawObject:item.object||null,rawKind:item.kind||null,key:label,object:null,kind:null,displayLabel:label});
    }
    return out;
  }
  function valueLabel(key,value){return valueLabels[key]?.[value]||value||'尚未確認';}
  function legalText(analysis){
    if(!analysis||!analysis.results)return '尚無法規研判結果。';
    const visible=analysis.results.filter(r=>!['not_applicable','no_issue_found'].includes(r.status));if(!visible.length)return '目前依已輸入事實，Batch A 核心規則未發現需優先處理的法規研判項目。';
    return visible.slice(0,5).map((r,i)=>{
      const missing=missingFactLabels(r.missingFacts||[]).slice(0,5).join('、');
      return `${i+1}. ${r.source.law}第${r.source.article}條｜${r.title}\n狀態：${stateLabels[r.status]||'需人工確認'}${missing?`\n尚缺：${missing}`:''}`;
    }).join('\n\n');
  }
  function factualText(session){
    const idx=root.WaterV2Session.factIndex(session),parts=[];
    const val=k=>idx[k]&&idx[k].value;
    if(val('water.discharge.occurred')==='yes')parts.push('本次已記錄有實際排放行為。');
    if(val('water.discharge.destination_type'))parts.push(`排放去向：${valueLabel('water.discharge.destination_type',val('water.discharge.destination_type'))}。`);
    if(val('water.premises.relation_status'))parts.push(`場所關聯狀態：${valueLabel('water.premises.relation_status',val('water.premises.relation_status'))}。`);
    if((session.flows||[]).length)parts.push(`目前建立 ${(session.flows||[]).length} 筆水流關係。`);
    if((session.incidents||[]).length)parts.push(`目前有 ${(session.incidents||[]).length} 個異常事項紀錄。`);
    return parts.length?parts.join('\n'):'目前尚未形成足以摘要的核心現場事實。';
  }
  root.WaterV2Summary={factualText,legalText,missingFactLabel,missingFactLabels,presentMissingFacts,valueLabel,keyLabels,stateLabels};

  // Water V2 interaction / presentation layer.
  // The structured data remains unchanged; this layer only controls user-facing flow,
  // conditional disclosure and viewport continuity.
  const doc=root.document;
  if(!doc)return;
  root.CustomRenderers=root.CustomRenderers||{};
  let pendingView=null;
  let rendererValue=root.CustomRenderers.waterV2;
  const activeFact=f=>f&&f.status!=='superseded'&&f.status!=='retracted';
  const now=()=>new Date().toISOString();

  function parseState(ctx){
    const raw=ctx?.session?.snapshot?.().inputs?.waterV2StateJson;
    if(!raw)return null;
    try{return root.WaterV2Session.normalize(JSON.parse(raw));}catch(_){return null;}
  }
  function fact(state,key){
    for(let i=(state?.facts||[]).length-1;i>=0;i--){const f=state.facts[i];if(f.key===key&&activeFact(f))return f;}
    return null;
  }
  function val(state,key){return fact(state,key)?.value;}
  function setFact(state,key,value,opts={}){
    if(!state||value===undefined||value===null||value==='')return;
    const current=fact(state,key);
    if(current&&JSON.stringify(current.value)===JSON.stringify(value))return current;
    if(current)current.status='superseded';
    return root.WaterV2Session.addFact(state,key,value,{category:opts.category||'observation',temporalMode:opts.temporalMode||'static',description:opts.description||'',source:{type:'inspector_input',ref:null},supersedes:current?.id||null,correctionReason:current?'user_update':null});
  }
  function action(state,type,label){
    let a=(state.actions||[]).find(x=>x.type===type&&x.status!=='cancelled');
    if(!a){a={id:'A'+String((state.actions||[]).length+1).padStart(3,'0'),type,label,purpose:type,status:'not_started',reason:null,pointRefs:[],incidentRefs:[],startedAt:null,completedAt:null};state.actions.push(a);}
    return a;
  }
  function setAction(state,type,status,reason,label){
    const a=action(state,type,label||type);a.status=status;a.reason=reason||null;
    if(status==='in_progress'&&!a.startedAt)a.startedAt=now();
    if(['completed','blocked','cancelled'].includes(status))a.completedAt=now();
    return a;
  }
  function workspace(state){return state?.ui?.workspace||'W00';}
  function captureView(ctx,target){
    const state=parseState(ctx);if(!state)return;
    pendingView={workspace:workspace(state),y:Number(root.scrollY||root.pageYOffset||0),anchor:target?.dataset?.waterV2Anchor||null};
  }
  function save(ctx,state,{restore=true}={}){
    if(!state)return;
    state.provenance='PP-IA-41-7F3C9A21';
    if(restore&&!pendingView)captureView(ctx,doc.activeElement);
    ctx.session.setInputs({waterV2StateJson:JSON.stringify(state)});
    ctx.render();
  }
  function humanActionStatus(a){
    if(!a||a.status==='not_started')return '尚未處理';
    if(a.status==='completed')return '已完成';
    if(a.status==='blocked')return '現場無法完成';
    if(a.status==='in_progress')return '處理中';
    if(a.status==='cancelled')return '本次未執行';
    return '尚未處理';
  }
  function h(tag,text,cls){const el=doc.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;return el;}
  function button(text,fn,secondary=false){const b=h('button',text,secondary?'secondary':'');b.type='button';b.addEventListener('click',fn);return b;}
  function chip(text,kind=''){return h('span',text,'water-v2-chip '+kind);}
  function paragraph(text,kind=''){return h('p',text,'water-v2-note '+kind);}
  function card(title){const el=h('div',null,'water-v2-action-card');el.append(h('strong',title));return el;}
  function headingPanel(prefix){
    const heads=[...doc.querySelectorAll('.water-v2-panel > h3')];
    const head=heads.find(x=>x.textContent.trim().startsWith(prefix));
    return head?.closest('.water-v2-panel')||null;
  }
  function fieldByLabel(panel,text){
    const labels=[...(panel?.querySelectorAll?.('.water-v2-field-label')||[])];
    return labels.find(x=>x.textContent.trim()===text)?.closest('.water-v2-field')||null;
  }
  function pointName(state,id){return (state.points||[]).find(p=>p.id===id)?.label||'未命名點位';}
  function assignAnchors(state){
    const app=doc.querySelector('.water-v2-app');if(!app)return;
    const ws=workspace(state);
    [...app.querySelectorAll('input,select,textarea,button')].forEach((el,i)=>{if(!el.dataset.waterV2Anchor)el.dataset.waterV2Anchor=`${ws}:${i}`;});
  }
  function restoreView(state){
    if(!pendingView||pendingView.workspace!==workspace(state)){pendingView=null;return;}
    const saved=pendingView;pendingView=null;
    const run=()=>{
      try{root.scrollTo({top:saved.y,left:0,behavior:'auto'});}catch(_){try{root.scrollTo(0,saved.y);}catch(__){/* no-op */}}
      if(saved.anchor){const el=doc.querySelector(`[data-water-v2-anchor="${saved.anchor}"]`);try{el?.focus?.({preventScroll:true});}catch(_){/* no-op */}}
    };
    if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(()=>root.requestAnimationFrame(run));else root.setTimeout?.(run,0);
  }

  function addUnableReasons(ctx,state,panel,afterField){
    const box=h('div',null,'water-v2-review-block');box.append(h('strong','無法確認原因'));
    const options=[['cannot_enter','無法進入現場'],['flow_stopped','排水已停止'],['cannot_approach','無法接近觀察'],['conditions_insufficient','現場條件不足'],['other','其他']];
    const selected=Array.isArray(val(state,'water.observation.unable_reasons'))?val(state,'water.observation.unable_reasons'):[];
    const grid=h('div',null,'water-v2-check-grid');
    for(const [code,label] of options){
      const lab=h('label',null,'check-choice'),input=h('input');input.type='checkbox';input.checked=selected.includes(code);
      input.addEventListener('change',()=>{
        captureView(ctx,input);const next=parseState(ctx);if(!next)return;
        const prev=Array.isArray(val(next,'water.observation.unable_reasons'))?val(next,'water.observation.unable_reasons'):[];
        const values=input.checked?[...new Set([...prev,code])]:prev.filter(x=>x!==code);
        setFact(next,'water.observation.unable_reasons',values);save(ctx,next);
      });
      lab.append(input,doc.createTextNode(label));grid.append(lab);
    }
    box.append(grid);
    if(selected.includes('other')){
      const row=h('div',null,'water-v2-field'),label=h('label','其他原因','water-v2-field-label'),input=h('input');input.type='text';input.placeholder='請簡要說明';input.value=val(state,'water.observation.unable_reason_other')||'';
      input.addEventListener('change',()=>{captureView(ctx,input);const next=parseState(ctx);if(!next)return;setFact(next,'water.observation.unable_reason_other',input.value.trim()||'未補充');save(ctx,next);});
      row.append(label,input);box.append(row);
    }
    afterField?.insertAdjacentElement?.('afterend',box);if(!afterField)panel.append(box);
  }

  function enhanceW01(ctx,state){
    const panel=headingPanel('W01｜');if(!panel)return;
    const overall=fieldByLabel(panel,'本次整體狀態'),overallSelect=overall?.querySelector('select');
    if(overallSelect){
      const labels={observed:'有發現需查情形',no_obvious_abnormality:'未發現明顯異常',unable_to_determine:'無法確認'};
      [...overallSelect.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value];});
    }
    const status=val(state,'water.observation.overall_status');
    const conditionLabel=[...panel.querySelectorAll('.water-v2-field-label')].find(x=>x.textContent.trim()==='本次確認到的情形');
    const conditionBox=conditionLabel?.nextElementSibling;
    const showFindings=status==='observed';
    if(conditionLabel)conditionLabel.hidden=!showFindings;
    if(conditionBox)conditionBox.hidden=!showFindings;
    if(conditionBox){
      const activeLabel=[...conditionBox.querySelectorAll('label')].find(x=>x.textContent.includes('持續／正在排水'));
      if(activeLabel){
        const textNode=[...activeLabel.childNodes].find(n=>n.nodeType===3);if(textNode)textNode.nodeValue='正在排水';
        const activeInput=activeLabel.querySelector('input');
        if(activeInput&&!activeInput.dataset.waterV2DischargeSync){
          activeInput.dataset.waterV2DischargeSync='1';
          activeInput.addEventListener('change',()=>{
            if(activeInput.checked)return;
            root.setTimeout?.(()=>{const next=parseState(ctx);if(!next)return;setFact(next,'water.discharge.occurred','unknown',{temporalMode:'event'});setFact(next,'water.discharge.state','unknown',{temporalMode:'stateful'});save(ctx,next);},0);
          });
        }
      }
      const otherLabel=h('label',null,'check-choice'),other=h('input');other.type='checkbox';other.checked=val(state,'water.observation.other_present')==='yes';
      other.addEventListener('change',()=>{captureView(ctx,other);const next=parseState(ctx);if(!next)return;setFact(next,'water.observation.other_present',other.checked?'yes':'unknown');save(ctx,next);});
      otherLabel.append(other,doc.createTextNode('其他'));conditionBox.append(otherLabel);
      if(other.checked){
        const row=h('div',null,'water-v2-field'),label=h('label','其他現場情形','water-v2-field-label'),input=h('input');input.type='text';input.placeholder='請簡要說明';input.value=val(state,'water.observation.other_description')||'';
        input.addEventListener('change',()=>{captureView(ctx,input);const next=parseState(ctx);if(!next)return;setFact(next,'water.observation.other_description',input.value.trim()||'未補充');save(ctx,next);});
        row.append(label,input);conditionBox.insertAdjacentElement('afterend',row);
      }
    }
    const dischargeField=fieldByLabel(panel,'是否確認有實際排放／排出行為');if(dischargeField)dischargeField.hidden=true;
    const dischargeState=fieldByLabel(panel,'排水狀態');if(dischargeState)dischargeState.hidden=!(showFindings&&val(state,'water.observation.active_discharge')==='yes');
    const liquid=fieldByLabel(panel,'目前可確認的水體／水流性質');
    if(liquid){
      liquid.hidden=!showFindings;
      const select=liquid.querySelector('select');if(select){const opt=[...select.options].find(o=>o.value==='other_water');if(opt)opt.textContent='其他已確認水體／水流';}
      if(showFindings)liquid.append(paragraph('「其他已確認水體／水流」表示已知道水的性質，只是不屬前述分類；若目前仍不知道是什麼水，請選「尚無法確認」。','info'));
    }
    if(status==='unable_to_determine')addUnableReasons(ctx,state,panel,overall);
  }

  function findingsSummary(state){
    const overall=val(state,'water.observation.overall_status');
    if(overall==='no_obvious_abnormality')return 'W01 已記錄：本次未發現明顯異常。';
    if(overall==='unable_to_determine'){
      const labels={cannot_enter:'無法進入現場',flow_stopped:'排水已停止',cannot_approach:'無法接近觀察',conditions_insufficient:'現場條件不足',other:'其他'};
      const reasons=(Array.isArray(val(state,'water.observation.unable_reasons'))?val(state,'water.observation.unable_reasons'):[]).map(x=>labels[x]||x);
      return `W01 已記錄：本次無法確認${reasons.length?'（'+reasons.join('、')+'）':''}。`;
    }
    if(overall!=='observed')return '';
    const map=[['water.observation.active_discharge','正在排水'],['water.observation.water_present','有水／積水'],['water.observation.discharge_trace_present','有排水痕跡'],['water.observation.color_abnormal','顏色異常'],['water.observation.turbidity_abnormal','混濁異常'],['water.observation.foam_present','泡沫'],['water.observation.odor_present','異味'],['water.observation.other_present','其他']];
    const items=map.filter(([k])=>val(state,k)==='yes').map(([,l])=>l);
    return `W01 已記錄${items.length?'：'+items.join('、'):'有發現需查情形'}。`;
  }
  function replaceW02(ctx,state){
    const panel=headingPanel('W02｜');if(!panel)return;
    const head=panel.querySelector(':scope > h3');[...panel.children].forEach(el=>{if(el!==head)el.remove();});
    panel.append(paragraph('先保留可能隨時間消失的現場情形。能完成的就記錄，現場無法完成的項目可留下原因後繼續。'));

    const conditionCard=card('固定目前排水／異常狀態'),summary=findingsSummary(state);
    if(summary){conditionCard.append(chip('現況已記錄','success'),paragraph(summary));}
    else{
      conditionCard.append(chip('尚未記錄','warning'),paragraph('尚未在 W01 留下本次現場整體狀態。'));
      const actions=h('div',null,'actions');actions.append(button('前往 W01 記錄',()=>{const next=parseState(ctx);if(!next)return;next.ui=next.ui||{};next.ui.workspace='W01';pendingView=null;save(ctx,next,{restore:false});},true));conditionCard.append(actions);
    }
    panel.append(conditionCard);

    const photo=action(state,'capture_evidence','拍攝照片／影片'),photoCard=card('拍攝照片／影片');
    photoCard.append(chip(humanActionStatus(photo),photo.status==='completed'?'success':photo.status==='blocked'?'warning':''));
    if(photo.reason)photoCard.append(paragraph(`原因：${photo.reason}`));
    const photoActions=h('div',null,'actions');
    photoActions.append(button('已拍攝',()=>{captureView(ctx);const next=parseState(ctx);if(!next)return;setAction(next,'capture_evidence','completed',null,'拍攝照片／影片');save(ctx,next);}),button('未拍攝／無法拍攝',()=>{captureView(ctx);const reason=root.prompt?.('請輸入未拍攝或無法拍攝原因（例如安全因素、無法接近）')||'未填寫原因';const next=parseState(ctx);if(!next)return;setAction(next,'capture_evidence','blocked',reason,'拍攝照片／影片');save(ctx,next);},true));
    photoCard.append(photoActions);panel.append(photoCard);

    const actual=(state.flows||[]).filter(f=>(f.kind||'actual')==='actual'&&f.status==='confirmed'),flowAction=action(state,'verify_flow_direction','確認水流方向'),flowCard=card('確認水流方向');
    if(actual.length){
      flowCard.append(chip('已確認','success'));
      const text=actual.slice(0,4).map(f=>`${pointName(state,f.from)} → ${pointName(state,f.to)}`).join('；');flowCard.append(paragraph(`已建立實際水流：${text}${actual.length>4?'…':''}`));
    }else{
      flowCard.append(chip(humanActionStatus(flowAction),flowAction.status==='blocked'?'warning':''));
      if(flowAction.reason)flowCard.append(paragraph(`原因：${flowAction.reason}`));
      const actions=h('div',null,'actions');
      actions.append(button('前往 W04 循線記錄',()=>{const next=parseState(ctx);if(!next)return;next.ui=next.ui||{};next.ui.workspace='W04';pendingView=null;save(ctx,next,{restore:false});},true),button('目前無法確認',()=>{captureView(ctx);const reason=root.prompt?.('請輸入目前無法確認水流方向的原因')||'未填寫原因';const next=parseState(ctx);if(!next)return;setAction(next,'verify_flow_direction','blocked',reason,'確認水流方向');save(ctx,next);},true));
      flowCard.append(actions);
    }
    panel.append(flowCard);

    const tools=card('必要時使用現場工具');tools.append(paragraph('快篩與正式採樣不要求在 W02 逐項完成；需要時直接進入對應工具。'));
    const toolActions=h('div',null,'actions');
    toolActions.append(button('前往 W09 快篩',()=>{const next=parseState(ctx);if(!next)return;next.ui=next.ui||{};next.ui.workspace='W09';pendingView=null;save(ctx,next,{restore:false});},true),button('前往 W10 正式採樣',()=>{const next=parseState(ctx);if(!next)return;next.ui=next.ui||{};next.ui.workspace='W10';pendingView=null;save(ctx,next,{restore:false});},true));tools.append(toolActions);panel.append(tools);
  }

  function enhance(ctx,state){
    if(!state)return;const ws=workspace(state);
    if(ws==='W01')enhanceW01(ctx,state);
    if(ws==='W02')replaceW02(ctx,state);
    assignAnchors(state);restoreView(state);
  }
  function wrapRenderer(renderer){
    if(!renderer||renderer.__waterV2InteractionWrapped||typeof renderer.render!=='function')return renderer;
    const original=renderer.render;
    const wrapped={...renderer,render(ctx){original(ctx);enhance(ctx,parseState(ctx));}};
    Object.defineProperty(wrapped,'__waterV2InteractionWrapped',{value:true});return wrapped;
  }

  doc.addEventListener('change',event=>{
    const target=event.target;if(!target?.closest?.('.water-v2-app'))return;
    const current=doc.querySelector('.water-v2-workspace-button[aria-current="page"]')?.textContent?.match(/^W\d{2}/)?.[0]||'W00';
    pendingView={workspace:current,y:Number(root.scrollY||root.pageYOffset||0),anchor:target.dataset?.waterV2Anchor||null};
  },true);
  doc.addEventListener('click',event=>{
    const target=event.target?.closest?.('button');if(!target?.closest?.('.water-v2-app')||target.classList.contains('water-v2-workspace-button'))return;
    const current=doc.querySelector('.water-v2-workspace-button[aria-current="page"]')?.textContent?.match(/^W\d{2}/)?.[0]||'W00';
    pendingView={workspace:current,y:Number(root.scrollY||root.pageYOffset||0),anchor:target.dataset?.waterV2Anchor||null};
  },true);

  Object.defineProperty(root.CustomRenderers,'waterV2',{
    configurable:true,enumerable:true,
    get(){return rendererValue;},
    set(value){rendererValue=wrapRenderer(value);}
  });
  if(rendererValue)rendererValue=wrapRenderer(rendererValue);
})(typeof window==='undefined'?globalThis:window);
