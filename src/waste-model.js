(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.WasteModel=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const VERSION='waste-v0.1.7';
  const roles=[
    '物質／廢棄物產生者','所有人','實際排出者','實際搬運／清運者','委託者','受託者','收受者','處理者','再利用者','土地所有人','土地使用人','土地提供者','現場管理人','其他','無法確認'
  ];
  const materialKinds=['生活垃圾／一般垃圾','廢木材','廢塑膠','廢金屬','廢紙','廢玻璃','廢家具','營建混合物','混凝土／磚瓦','土石類','污泥','廢液','廢油','化學品／容器','熱灰燼','危險化學物品／爆炸性物品','動物屍體','食品／動植物性殘渣','廢機械／設備','廢電子電器','不明混合物','其他','現場無法辨識'];
  const objectiveActions=['排出','收集','裝載','運輸','卸載','放置','搬運','堆放','推平','回填','分類','搜揀','破碎／加工','焚燒','掩埋','離場','清理／撿拾','裝袋','沖洗','抽除積液','覆蓋','設置圍擋','其他'];
  const legalDirections=['貯存','清除','處理','再利用','棄置','堆置','回填','收受','排出'];
  const evidenceTypes=['現場所見','當事人陳述','第三人陳述','文件','主管機關系統','影像','其他'];
  const reviewStates=['相符','有疑點','無法確認','本次未查','不適用'];
  const legalStates=['構成要件事實已完整','尚有要件待確認','目前不支持','無法確認','本次未查','本案不適用'];
  const pendingStates=['待查','查證中','已確認','無法確認','不再需要確認'];
  const sourceStates=['無來源線索','有來源線索，待查證','疑似來源','來源已確認','本次無法確認來源'];
  const wasteIdentityStates=['已有事實支持','尚有要件待確認','目前不支持','無法確認'];
  const classificationOptions=['一般廢棄物','事業廢棄物','尚待確認','無法確認'];
  const detailClassificationOptions=['一般事業廢棄物','可能屬有害事業廢棄物','應回收廢棄物','聲稱為再利用物／產品','剩餘土石方或其他法規管理物','其他','尚無法細分'];
  const producerRelationStates=['已確認產生者','疑似產生者','產生者線索','尚待查證','無法確認','已排除'];
  const useOptions=['暫時貯存','等待清運','工程填築','整地','回填','再利用','作為原料','作為燃料','最終處置','不明用途','其他'];
  const environmentPhenomena=['廢棄物／物質散落','堆置／留置','覆蓋地面','液體流出／滲出','飛散','粉塵','惡臭','燃燒／煙','病媒跡象','污漬／變色','油膜','不明液體','不明固體','隨地吐痰／檳榔汁／拋棄一般廢棄物','水溝棄置雜物','隨地便溺','飼養禽畜影響環境衛生','張貼／噴漆廣告污染定著物','其他公告污染環境行為','無明顯異常','無法確認','本次未查','其他'];
  const environmentMedia=['地面／土地','道路','路旁','水溝／側溝','河川／溪流','池塘／湖潭','其他水體','公共場所','建築物周邊','空地','農地','牆壁／樑柱／電桿／樹木／橋樑／其他土地定著物','屋外／屋頂','廢棄物貯存設備','其他','無法確認'];
  const environmentExtentBases=['精確量測','目視估計','陳述／文件記載','無法確認','本次未量測'];
  const environmentCurrentStates=['當下持續中','當下已停止','僅見殘留／痕跡','歷史事件','無法確認'];
  const environmentReviewStates=['已發現相關環境異常事實','未發現明顯環境異常','無法確認','本次未查','不適用'];
  const crossModuleDispositionStates=['尚未處理','進入查核','暫不處理','不適用'];

  function createState(){
    return ensureState({
      meta:{version:VERSION,provenance:PROVENANCE,nextId:1},
      view:'home',entryMode:'',
      preservation:{people:'',vehicles:'',materials:'',actions:'',placeTime:''},
      sourceTrace:{status:'',clues:[],notes:'',confirmedSubjectId:'',handoffCompleted:false,checks:[]},
      subjects:[],vehicles:[],places:[],batches:[],producerRelations:[],environmentObservations:[],events:[],documents:[],flows:[],questions:[],doubts:[],assessments:[],hintsDismissed:[],draftText:'',
      environmentReview:{state:'本次未查',observationIds:[],notes:''},
      crossModule:{dispositions:{}}
    });
  }
  function id(state,prefix){const n=state.meta.nextId++;return `${prefix}-${n}`;}
  function ensureState(state){
    if(!state||typeof state!=='object')return state;
    state.meta=state.meta||{version:VERSION,provenance:PROVENANCE,nextId:1};
    state.meta.version=VERSION;state.meta.provenance=PROVENANCE;if(!Number.isFinite(state.meta.nextId))state.meta.nextId=1;
    for(const k of ['subjects','vehicles','places','batches','producerRelations','environmentObservations','events','documents','flows','questions','doubts','assessments','hintsDismissed'])if(!Array.isArray(state[k]))state[k]=[];
    state.preservation=state.preservation||{people:'',vehicles:'',materials:'',actions:'',placeTime:''};
    state.sourceTrace=state.sourceTrace||{};if(!Array.isArray(state.sourceTrace.clues))state.sourceTrace.clues=[];if(!Array.isArray(state.sourceTrace.checks))state.sourceTrace.checks=[];
    state.environmentReview=state.environmentReview||{state:'本次未查',observationIds:[],notes:''};if(!Array.isArray(state.environmentReview.observationIds))state.environmentReview.observationIds=[];
    state.crossModule=state.crossModule||{dispositions:{}};state.crossModule.dispositions=state.crossModule.dispositions||{};
    for(const b of state.batches){
      if(!Array.isArray(b.history))b.history=[];
      if(typeof b.detailClassification!=='string')b.detailClassification='';
      if(typeof b.generationContext!=='string')b.generationContext=b.process||'';
      const legacy=b.classification;
      if(['一般事業廢棄物','可能屬有害事業廢棄物'].includes(legacy)){
        if(!b.detailClassification)b.detailClassification=legacy;b.classification='事業廢棄物';
      }else if(legacy==='尚無法分類')b.classification='尚待確認';
      else if(['應回收廢棄物','聲稱為再利用物／產品','剩餘土石方或其他法規管理物'].includes(legacy)){
        if(!b.detailClassification)b.detailClassification=legacy;b.classification='尚待確認';
      }else if(!classificationOptions.includes(legacy))b.classification=legacy||'';
      if(b.originSubjectId&&!state.producerRelations.some(r=>r.batchId===b.id&&r.subjectId===b.originSubjectId)){
        state.producerRelations.push({id:id(state,'PR'),batchId:b.id,subjectId:b.originSubjectId,placeId:b.originPlaceId||'',status:'尚待查證',generationActivity:b.process||'',evidence:'',basisText:'由舊版「原始產源主體」欄位移轉，請重新確認。',relatedIds:[],notes:'',history:[],migrated:true});
      }
    }
    return state;
  }
  function addSubject(state,data={}){ensureState(state);const x={id:id(state,'S'),name:'',kind:'人員／事業',roles:[],identitySource:'',notes:'',...data};state.subjects.push(x);return x;}
  function addVehicle(state,data={}){ensureState(state);const x={id:id(state,'V'),plate:'',vehicleType:'',ownerText:'',marking:'',source:'',notes:'',history:[],...data};state.vehicles.push(x);return x;}
  function addPlace(state,data={}){ensureState(state);const x={id:id(state,'P'),name:'',address:'',roles:[],subjectId:'',landRelation:'',notes:'',history:[],...data};state.places.push(x);return x;}
  function addBatch(state,data={}){ensureState(state);const x={id:id(state,'B'),label:'',materialKind:'',appearance:'',quantity:'',quantityUnit:'',quantitySource:'',locationId:'',originSubjectId:'',originPlaceId:'',process:'',generationContext:'',wasteIdentity:'',sourceStatus:'',classification:'',detailClassification:'',wasteCode:'',codeReview:'',claimUse:'',documentUse:'',actualUse:'',notes:'',history:[],reviewRequired:false,...data};if(!x.generationContext)x.generationContext=x.process||'';state.batches.push(x);return x;}

  function scalarEqual(a,b){return String(a??'')===String(b??'');}
  function arrayEqual(a,b){const aa=Array.isArray(a)?a:[],bb=Array.isArray(b)?b:[];return aa.length===bb.length&&aa.every((x,i)=>x===bb[i]);}
  function updateEntity(list,itemId,data={},opts={}){
    const item=list.find(x=>x.id===itemId);if(!item)return null;
    if(!Array.isArray(item.history))item.history=[];
    const changes=[];let correction=false;
    const tracked=opts.trackedFields||Object.keys(data);
    for(const key of tracked){
      if(!(key in data))continue;
      const oldValue=item[key];const newValue=data[key];
      const same=Array.isArray(oldValue)||Array.isArray(newValue)?arrayEqual(oldValue,newValue):scalarEqual(oldValue,newValue);
      if(same)continue;
      const hadValue=Array.isArray(oldValue)?oldValue.length>0:String(oldValue??'').trim()!=='';
      if(hadValue&&opts.reviewFields?.includes(key))correction=true;
      changes.push({field:key,from:Array.isArray(oldValue)?oldValue.slice():oldValue??'',to:Array.isArray(newValue)?newValue.slice():newValue??''});
      item[key]=Array.isArray(newValue)?newValue.slice():newValue;
    }
    if(changes.length)item.history.push({seq:item.history.length+1,type:correction?'修正':'補充',changes});
    if(correction&&opts.markReview)item.reviewRequired=true;
    return item;
  }
  function updateBatch(state,itemId,data={}){
    ensureState(state);
    const tracked=['label','materialKind','appearance','quantity','quantityUnit','quantitySource','locationId','originSubjectId','originPlaceId','process','generationContext','wasteIdentity','sourceStatus','classification','detailClassification','wasteCode','codeReview','claimUse','documentUse','actualUse','notes'];
    const reviewFields=['materialKind','quantity','quantityUnit','quantitySource','originSubjectId','originPlaceId','process','generationContext','wasteIdentity','sourceStatus','classification','detailClassification','wasteCode','codeReview','claimUse','documentUse','actualUse'];
    return updateEntity(state.batches,itemId,data,{trackedFields:tracked,reviewFields,markReview:true});
  }
  function updateVehicle(state,itemId,data={}){ensureState(state);return updateEntity(state.vehicles,itemId,data,{trackedFields:['plate','vehicleType','ownerText','marking','source','notes'],reviewFields:[]});}
  function updatePlace(state,itemId,data={}){ensureState(state);return updateEntity(state.places,itemId,data,{trackedFields:['name','address','roles','subjectId','landRelation','notes'],reviewFields:[]});}

  function addProducerRelation(state,data={}){ensureState(state);const x={id:id(state,'PR'),batchId:'',subjectId:'',placeId:'',status:'尚待查證',generationActivity:'',evidence:'',basisText:'',relatedIds:[],notes:'',history:[],...data};state.producerRelations.push(x);return x;}
  function updateProducerRelation(state,itemId,data={}){ensureState(state);return updateEntity(state.producerRelations,itemId,data,{trackedFields:['batchId','subjectId','placeId','status','generationActivity','evidence','basisText','relatedIds','notes'],reviewFields:['batchId','subjectId','placeId','status','generationActivity','evidence','basisText'],markReview:false});}
  function producerRelationsForBatch(state,batchId){ensureState(state);return state.producerRelations.filter(x=>x.batchId===batchId);}
  function confirmedProducerRelations(state,batchId){return producerRelationsForBatch(state,batchId).filter(x=>x.status==='已確認產生者');}

  function addEnvironmentObservation(state,data={}){ensureState(state);const x={id:id(state,'O'),recordedAt:'',occurrenceTime:'',placeId:'',locationText:'',phenomena:[],media:[],extentText:'',extentBasis:'',currentStatus:'',evidence:'現場所見',sourceDetail:'',batchIds:[],eventIds:[],subjectIds:[],vehicleIds:[],sourceLeadIds:[],notes:'',previousObservationId:'',history:[],...data};state.environmentObservations.push(x);return x;}
  function updateEnvironmentObservation(state,itemId,data={}){ensureState(state);return updateEntity(state.environmentObservations,itemId,data,{trackedFields:['recordedAt','occurrenceTime','placeId','locationText','phenomena','media','extentText','extentBasis','currentStatus','evidence','sourceDetail','batchIds','eventIds','subjectIds','vehicleIds','sourceLeadIds','notes','previousObservationId'],reviewFields:['recordedAt','occurrenceTime','placeId','locationText','phenomena','media','extentText','extentBasis','currentStatus','evidence','sourceDetail','batchIds'],markReview:false});}
  function environmentObservationSummary(state,o){
    const parts=[];if(o.occurrenceTime||o.recordedAt)parts.push(o.occurrenceTime||o.recordedAt);
    const p=labelById(state.places,o.placeId,['name','address']);parts.push(p||o.locationText||'地點未確認');
    if(o.phenomena?.length)parts.push(o.phenomena.join('、'));if(o.media?.length)parts.push(`位置／介質：${o.media.join('、')}`);if(o.extentText)parts.push(`範圍：${o.extentText}`);if(o.currentStatus)parts.push(o.currentStatus);return parts.join('｜');
  }
  function addSourceLead(state,data={}){ensureState(state);const x={id:id(state,'SL'),type:'來源線索',text:'',status:'待查證',environmentObservationId:'',relatedIds:[],createdFrom:'environment',notes:'',...data};state.sourceTrace.checks.push(x);return x;}

  function addEvent(state,data={}){ensureState(state);const x={id:id(state,'E'),time:'',eventType:'現場事實',subjectId:'',vehicleId:'',batchId:'',placeId:'',action:'',description:'',evidence:'現場所見',notes:'',...data};state.events.push(x);return x;}
  function addDocument(state,data={}){ensureState(state);const x={id:id(state,'D'),type:'',title:'',sourceType:'',recordedContent:'',reviewState:'本次未查',reviewIssue:'',batchId:'',subjectId:'',flowId:'',notes:'',...data};state.documents.push(x);return x;}
  function addFlow(state,data={}){ensureState(state);const x={id:id(state,'F'),batchId:'',fromPlaceId:'',toPlaceId:'',carrierSubjectId:'',vehicleId:'',time:'',quantity:'',quantityUnit:'',claimUse:'',documentUse:'',actualUse:'',evidence:'',status:'待確認',notes:'',...data};state.flows.push(x);return x;}
  function addPending(state,data={}){ensureState(state);const x={id:id(state,'Q'),type:'其他',text:'',status:'待查',result:'',relatedIds:[],createdFrom:'manual',createdFromKey:'',sourceReason:'',...data};state.questions.push(x);return x;}
  function addDoubt(state,data={}){ensureState(state);const x={id:id(state,'X'),type:'其他',text:'',status:'待釐清',relatedIds:[],verification:'',result:'',...data};state.doubts.push(x);return x;}
  function addAssessment(state,data={}){ensureState(state);const x={id:id(state,'A'),direction:'',legalState:'尚有要件待確認',requiredFacts:[],supportingFacts:[],notes:'',...data};state.assessments.push(x);return x;}
  function canSourceHandoff(state){ensureState(state);const s=state.sourceTrace||{};return s.status==='來源已確認'&&!!s.confirmedSubjectId&&state.subjects.some(x=>x.id===s.confirmedSubjectId);}
  function handoffConfirmedSource(state){if(!canSourceHandoff(state))return false;state.sourceTrace.handoffCompleted=true;state.entryMode='known';state.view='known';return true;}
  function labelById(list,idValue,keys=['name','label','plate','title']){const x=(list||[]).find(v=>v.id===idValue);if(!x)return '';for(const k of keys)if(x[k])return x[k];return x.id;}
  function eventSummary(state,e){const parts=[];if(e.time)parts.push(e.time);const s=labelById(state.subjects,e.subjectId);if(s)parts.push(s);const v=labelById(state.vehicles,e.vehicleId,['plate']);if(v)parts.push(v);const b=labelById(state.batches,e.batchId,['label','materialKind']);if(b)parts.push(b);if(e.action)parts.push(e.action);const p=labelById(state.places,e.placeId);if(p)parts.push(`@${p}`);if(e.description)parts.push(e.description);return parts.join('｜');}
  function sortedTimeline(state){ensureState(state);return state.events.slice().sort((a,b)=>String(a.time||'9999').localeCompare(String(b.time||'9999')));}

  function detectCrossModuleHints(state){
    ensureState(state);const out=[];const waterMedia=new Set(['水溝／側溝','河川／溪流','池塘／湖潭','其他水體']);const liquid=new Set(['液體流出／滲出','不明液體','油膜','污漬／變色']);
    for(const o of state.environmentObservations){
      const media=o.media||[],phen=o.phenomena||[];
      if(media.some(x=>waterMedia.has(x))&&phen.some(x=>liquid.has(x)))out.push({key:`cross:water:${o.id}`,module:'水污染',observationId:o.id,title:'可能涉及水污染查核',reason:'環境觀察同時記錄水溝／水體等受影響位置與液體／油膜等現象。'});
      if(phen.some(x=>['燃燒／煙','粉塵','飛散','惡臭'].includes(x))&&['當下持續中','當下已停止','僅見殘留／痕跡'].includes(o.currentStatus||''))out.push({key:`cross:air:${o.id}`,module:'空氣污染',observationId:o.id,title:'可能涉及空氣污染查核',reason:'環境觀察同時記錄空氣相關現象與當下／近期狀態。'});
    }
    return out;
  }
  function setCrossModuleDisposition(state,key,status,reason=''){ensureState(state);if(!crossModuleDispositionStates.includes(status))return null;state.crossModule.dispositions[key]={status,reason,updatedAt:new Date().toISOString()};return state.crossModule.dispositions[key];}

  function detectHints(state){
    ensureState(state);const hints=[];const byBatch=new Map();
    for(const e of state.events){if(!e.batchId)continue;if(!byBatch.has(e.batchId))byBatch.set(e.batchId,[]);byBatch.get(e.batchId).push(e.action);}
    for(const [batchId,acts] of byBatch){const set=new Set(acts);if(set.has('卸載')&&set.has('推平'))hints.push({key:`fill:${batchId}`,title:'可能需要確認：是否涉及回填／堆置',reason:'同一物質批次已記錄「卸載＋推平」客觀動作。',batchId,direction:'回填'});if(set.has('裝載')&&set.has('運輸')&&set.has('卸載'))hints.push({key:`clear:${batchId}`,title:'可能需要確認：清除／運輸流向',reason:'同一物質批次已記錄「裝載＋運輸＋卸載」。',batchId,direction:'清除'});if((set.has('破碎／加工')||set.has('分類'))&&state.batches.find(b=>b.id===batchId)?.actualUse)hints.push({key:`process:${batchId}`,title:'可能需要確認：處理／再利用行為',reason:'已記錄加工或分類動作，且物質已有後續實際用途。',batchId,direction:'處理'});}
    for(const b of state.batches){if(b.claimUse==='再利用'||b.documentUse==='再利用')hints.push({key:`reuse:${b.id}`,title:'聲稱再利用：建議核對實際用途與資格',reason:'聲稱用途或文件用途含再利用；不代表已排除廢棄物管理。',batchId:b.id,direction:'再利用'});if(b.materialKind&&['土石類','混凝土／磚瓦','營建混合物'].includes(b.materialKind)&&!b.wasteIdentity)hints.push({key:`nature:${b.id}`,title:'物質法律性質尚待確認',reason:'土石／營建類物質不宜僅依外觀直接認定為廢棄物。',batchId:b.id,direction:'認廢'});if(b.wasteIdentity==='已有事實支持'&&!confirmedProducerRelations(state,b.id).length&&b.classification!=='無法確認')hints.push({key:`producer:${b.id}`,title:'廢棄物分類前建議確認產生者／產生來源',reason:'本批已有廢棄物身分事實，但尚無「已確認產生者」關係；一般／事業分類應以產生者及產生情境為主要基礎。',batchId:b.id,direction:'產生者'});}
    if(state.entryMode==='unknown'&&['有來源線索，待查證','疑似來源'].includes(state.sourceTrace.status))hints.push({key:'source:verify',title:'來源尚待查證',reason:'目前已有來源線索，但尚未達到「來源已確認」。',direction:'來源'});
    if(state.entryMode==='unknown'&&state.sourceTrace.status==='本次無法確認來源')hints.push({key:'art11',title:'可能後續法規方向：廢棄物清理法第 11 條',reason:'實際排出／棄置者本次仍無法確認時，可再檢視一般廢棄物清除義務；由稽查員自行決定是否深入。',direction:'第11條'});
    return hints.filter(h=>!state.hintsDismissed.includes(h.key));
  }
  function detectGaps(state){
    ensureState(state);const gaps=[];
    for(const b of state.batches){
      if(b.sourceStatus==='來源已確認'&&!state.flows.some(f=>f.batchId===b.id&&f.toPlaceId))gaps.push({key:`dest:${b.id}`,text:`${b.label||b.id} 已確認來源，但尚未建立後續去向。`,type:'最終去向',relatedIds:[b.id]});
      if(b.classification==='事業廢棄物'&&!state.documents.some(d=>d.batchId===b.id&&['申報資料','清理計畫書','聯單／清運憑證'].includes(d.type)))gaps.push({key:`doc:${b.id}`,text:`${b.label||b.id} 已分類為事業廢棄物，但尚未記錄申報／計畫／聯單核對。`,type:'文件',relatedIds:[b.id]});
      if(b.wasteIdentity==='已有事實支持'&&!producerRelationsForBatch(state,b.id).length)gaps.push({key:`producer:${b.id}`,text:`${b.label||b.id} 尚未建立產生者／產生來源關係。`,type:'產生者',relatedIds:[b.id]});
    }
    for(const f of state.flows){if(f.fromPlaceId&&!f.toPlaceId)gaps.push({key:`flow:${f.id}`,text:`流向 ${f.id} 已有來源節點，但去向尚未建立。`,type:'流向',relatedIds:[f.id,f.batchId].filter(Boolean)});}
    return gaps;
  }
  function simpleSummary(state){ensureState(state);return {entryMode:state.entryMode==='unknown'?'來源待查':state.entryMode==='known'?'稽查對象已知':'未選',subjects:state.subjects.length,batches:state.batches.length,environmentObservations:state.environmentObservations.length,events:state.events.length,flows:state.flows.length,documents:state.documents.length,doubts:state.doubts.filter(x=>!['已釐清','排除'].includes(x.status)).length,pending:state.questions.filter(x=>!['已確認','不再需要確認'].includes(x.status)).length,unresolvedBatches:state.batches.filter(b=>!b.wasteIdentity||b.wasteIdentity==='尚有要件待確認'||b.wasteIdentity==='無法確認').length,unresolvedClassification:state.batches.filter(b=>!b.classification||['尚待確認','無法確認'].includes(b.classification)).length};}
  function buildDraft(state){
    ensureState(state);const lines=[];
    if(state.entryMode==='unknown')lines.push('本案以來源待查方式進行現場查察。');if(state.entryMode==='known')lines.push('本案已知稽查對象，依現場事實進行查核。');
    if(state.environmentObservations.length){lines.push('環境觀察：');state.environmentObservations.forEach(o=>lines.push(`－${environmentObservationSummary(state,o)}；資料來源：${o.evidence||'未填'}${o.sourceDetail?`（${o.sourceDetail}）`:''}`));}
    const timeline=sortedTimeline(state);if(timeline.length){lines.push('現場／歷史事件：');timeline.forEach(e=>lines.push(`－${eventSummary(state,e)}`));}
    if(state.batches.length){lines.push('物質批次：');state.batches.forEach(b=>{const arr=[b.label||b.id,b.materialKind||'物質未辨識'];if(b.wasteIdentity)arr.push(`廢棄物身分：${b.wasteIdentity}`);if(b.classification)arr.push(`分類：${b.classification}`);const confirmed=confirmedProducerRelations(state,b.id);if(confirmed.length)arr.push(`已確認產生者：${confirmed.map(r=>labelById(state.subjects,r.subjectId,['name'])||r.basisText||'未命名').join('、')}`);if(b.actualUse)arr.push(`實際用途：${b.actualUse}`);lines.push(`－${arr.join('；')}`);});}
    if(state.sourceTrace.status)lines.push(`來源追查結果：${state.sourceTrace.status}。`);
    const active=state.doubts.filter(x=>!['已釐清','排除'].includes(x.status));if(active.length){lines.push('目前疑點：');active.forEach(x=>lines.push(`－${x.text||x.type}（${x.status}）`));}
    const pending=state.questions.filter(x=>!['已確認','不再需要確認'].includes(x.status));if(pending.length){lines.push('尚待確認：');pending.forEach(x=>lines.push(`－${x.text||x.type}（${x.status}）`));}
    if(!lines.length)return '目前尚無足夠事實可產生案件文字。';return lines.join('\n');
  }
  function validateImport(obj){return !!(obj&&obj.meta&&obj.meta.provenance===PROVENANCE&&Array.isArray(obj.batches)&&Array.isArray(obj.events));}
  return {PROVENANCE,VERSION,roles,materialKinds,objectiveActions,legalDirections,evidenceTypes,reviewStates,legalStates,pendingStates,sourceStates,wasteIdentityStates,classificationOptions,detailClassificationOptions,producerRelationStates,useOptions,environmentPhenomena,environmentMedia,environmentExtentBases,environmentCurrentStates,environmentReviewStates,crossModuleDispositionStates,createState,ensureState,id,addSubject,addVehicle,addPlace,addBatch,updateBatch,updateVehicle,updatePlace,addProducerRelation,updateProducerRelation,producerRelationsForBatch,confirmedProducerRelations,addEnvironmentObservation,updateEnvironmentObservation,environmentObservationSummary,addSourceLead,addEvent,addDocument,addFlow,addPending,addDoubt,addAssessment,canSourceHandoff,handoffConfirmedSource,labelById,eventSummary,sortedTimeline,detectCrossModuleHints,setCrossModuleDisposition,detectHints,detectGaps,simpleSummary,buildDraft,validateImport};
});
