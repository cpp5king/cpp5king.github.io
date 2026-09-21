const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/waste-model.js');

test('provenance is preserved',()=>{
  const s=M.createState();
  assert.equal(s.meta.provenance,'PP-IA-41-7F3C9A21');
  assert.equal(M.validateImport(s),true);
});

test('unknown source does not become a confirmed source',()=>{
  const s=M.createState();s.entryMode='unknown';s.sourceTrace.status='有來源線索，待查證';
  const hints=M.detectHints(s);
  assert.equal(hints.some(h=>h.key==='art11'),false);
});

test('article 11 is only a possible direction after source cannot be confirmed',()=>{
  const s=M.createState();s.entryMode='unknown';s.sourceTrace.status='本次無法確認來源';
  const hints=M.detectHints(s);
  assert.equal(hints.some(h=>h.key==='art11'),true);
  assert.match(hints.find(h=>h.key==='art11').title,/可能後續法規方向/);
});

test('unload plus flatten only creates a system hint, not a doubt',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批'});
  M.addEvent(s,{batchId:b.id,action:'卸載'});M.addEvent(s,{batchId:b.id,action:'推平'});
  assert.equal(s.doubts.length,0);
  assert.equal(M.detectHints(s).some(h=>h.key===`fill:${b.id}`),true);
});

test('timeline is sorted without inventing missing fields',()=>{
  const s=M.createState();
  M.addEvent(s,{time:'10:30',action:'卸載'});M.addEvent(s,{time:'09:10',action:'裝載'});
  assert.deepEqual(M.sortedTimeline(s).map(e=>e.time),['09:10','10:30']);
  assert.equal(s.events.some(e=>e.subjectId),false);
});

test('batch can keep uncertain waste identity',()=>{
  const s=M.createState();const b=M.addBatch(s,{materialKind:'土石類',wasteIdentity:'尚有要件待確認'});
  assert.equal(b.wasteIdentity,'尚有要件待確認');
  assert.equal(M.detectHints(s).some(h=>h.key===`nature:${b.id}`),false);
});

test('material nature hint appears if soil-like batch has no waste identity conclusion',()=>{
  const s=M.createState();const b=M.addBatch(s,{materialKind:'土石類'});
  assert.equal(M.detectHints(s).some(h=>h.key===`nature:${b.id}`),true);
});

test('source and destination gap is a suggestion, not an auto pending item',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批',sourceStatus:'來源已確認'});
  const gaps=M.detectGaps(s);
  assert.equal(gaps.some(g=>g.key===`dest:${b.id}`),true);
  assert.equal(s.questions.length,0);
});

test('document content and review result remain separate',()=>{
  const s=M.createState();const d=M.addDocument(s,{recordedContent:'去向：甲處理場',reviewState:'有疑點',reviewIssue:'去向不同'});
  assert.equal(d.recordedContent,'去向：甲處理場');
  assert.equal(d.reviewState,'有疑點');
  assert.equal(d.reviewIssue,'去向不同');
});

test('draft uses entered facts but not system hints',()=>{
  const s=M.createState();s.entryMode='known';const b=M.addBatch(s,{label:'A批',materialKind:'營建混合物'});
  M.addEvent(s,{time:'10:15',batchId:b.id,action:'卸載'});M.addEvent(s,{time:'10:20',batchId:b.id,action:'推平'});
  const text=M.buildDraft(s);
  assert.match(text,/卸載/);assert.match(text,/推平/);
  assert.doesNotMatch(text,/可能需要確認/);
  assert.doesNotMatch(text,/違反/);
});

test('confirmed source cannot hand off without an identified subject',()=>{
  const s=M.createState();s.entryMode='unknown';s.sourceTrace.status='來源已確認';
  assert.equal(M.canSourceHandoff(s),false);
  assert.equal(M.handoffConfirmedSource(s),false);
  assert.equal(s.entryMode,'unknown');
});

test('confirmed source can hand off after selecting an existing subject',()=>{
  const s=M.createState();s.entryMode='unknown';s.sourceTrace.status='來源已確認';
  const subject=M.addSubject(s,{name:'A來源'});s.sourceTrace.confirmedSubjectId=subject.id;
  assert.equal(M.canSourceHandoff(s),true);
  assert.equal(M.handoffConfirmedSource(s),true);
  assert.equal(s.entryMode,'known');
  assert.equal(s.sourceTrace.handoffCompleted,true);
});

test('source handoff preserves facts and does not assign producer role or batch origin automatically',()=>{
  const s=M.createState();s.entryMode='unknown';s.sourceTrace.status='來源已確認';
  const subject=M.addSubject(s,{name:'A來源'});const b=M.addBatch(s,{label:'A批'});M.addEvent(s,{batchId:b.id,action:'卸載'});
  s.sourceTrace.confirmedSubjectId=subject.id;
  M.handoffConfirmedSource(s);
  assert.equal(s.batches.length,1);assert.equal(s.events.length,1);
  assert.deepEqual(subject.roles,[]);
  assert.equal(b.originSubjectId,'');
});

test('batch can be supplemented without marking prior confirmed facts as changed',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批',materialKind:'營建混合物'});
  M.updateBatch(s,b.id,{originSubjectId:'S-99'});
  assert.equal(b.originSubjectId,'S-99');
  assert.equal(b.reviewRequired,false);
  assert.equal(b.history.length,1);
  assert.equal(b.history[0].type,'補充');
});

test('changing an existing substantive batch classification preserves history and requests recheck',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批',materialKind:'營建混合物',classification:'事業廢棄物'});
  M.updateBatch(s,b.id,{classification:'尚待確認'});
  assert.equal(b.classification,'尚待確認');
  assert.equal(b.reviewRequired,true);
  assert.equal(b.history.length,1);
  assert.equal(b.history[0].type,'修正');
  assert.equal(b.history[0].changes[0].from,'事業廢棄物');
});

test('vehicle and place can be edited while keeping revision history',()=>{
  const s=M.createState();const v=M.addVehicle(s,{plate:'ABC-1234'});const p=M.addPlace(s,{name:'路旁空地'});
  M.updateVehicle(s,v.id,{plate:'ABC-1234',vehicleType:'大貨車'});
  M.updatePlace(s,p.id,{name:'路旁空地',address:'○○路旁'});
  assert.equal(v.vehicleType,'大貨車');assert.equal(p.address,'○○路旁');
  assert.equal(v.history.length,1);assert.equal(p.history.length,1);
});


test('place can link to subject without turning subject into place',()=>{
  const s=M.createState();
  const subj=M.addSubject(s,{name:'甲營造'});
  const place=M.addPlace(s,{name:'A 工地',subjectId:subj.id,roles:['原始產生地']});
  assert.equal(place.subjectId,subj.id);
  assert.equal(s.subjects.length,1);
  assert.equal(s.places.length,1);
});

test('source clue status produces verification hint only',()=>{
  const s=M.createState();
  s.entryMode='unknown';
  s.sourceTrace.status='有來源線索，待查證';
  const h=M.detectHints(s).find(x=>x.key==='source:verify');
  assert.ok(h);
  assert.equal(h.direction,'來源');
  assert.match(h.reason,/尚未達到「來源已確認」/);
});

test('gap hints carry related record ids',()=>{
  const s=M.createState();
  const b=M.addBatch(s,{label:'批次A',sourceStatus:'來源已確認'});
  const g=M.detectGaps(s).find(x=>x.key===`dest:${b.id}`);
  assert.deepEqual(g.relatedIds,[b.id]);
});


test('shared environment observation can exist without batch actor or source',()=>{
  const s=M.createState();
  const o=M.addEnvironmentObservation(s,{recordedAt:'10:20',locationText:'道路側溝',phenomena:['不明液體'],media:['水溝／側溝'],currentStatus:'當下持續中'});
  assert.equal(s.environmentObservations.length,1);
  assert.equal(o.batchIds.length,0);
  assert.equal(o.subjectIds.length,0);
  assert.match(M.environmentObservationSummary(s,o),/道路側溝/);
});

test('one environment observation can link multiple material batches',()=>{
  const s=M.createState();const a=M.addBatch(s,{label:'A批'});const b=M.addBatch(s,{label:'B批'});
  const o=M.addEnvironmentObservation(s,{locationText:'空地',phenomena:['堆置／留置','廢棄物／物質散落'],media:['空地'],batchIds:[a.id,b.id]});
  assert.deepEqual(o.batchIds,[a.id,b.id]);
});

test('environment change is recorded as a follow-up observation without overwriting original',()=>{
  const s=M.createState();
  const first=M.addEnvironmentObservation(s,{occurrenceTime:'10:20',locationText:'側溝',phenomena:['不明液體'],media:['水溝／側溝'],currentStatus:'當下持續中'});
  const later=M.addEnvironmentObservation(s,{occurrenceTime:'10:45',locationText:'側溝',phenomena:['污漬／變色'],media:['水溝／側溝'],currentStatus:'僅見殘留／痕跡',previousObservationId:first.id});
  assert.equal(first.currentStatus,'當下持續中');
  assert.equal(later.previousObservationId,first.id);
  assert.equal(s.environmentObservations.length,2);
});

test('environment possible source stays a source lead and not a confirmed source',()=>{
  const s=M.createState();const o=M.addEnvironmentObservation(s,{locationText:'側溝',phenomena:['不明液體'],media:['水溝／側溝']});
  const lead=M.addSourceLead(s,{text:'上游排水孔 A',environmentObservationId:o.id,relatedIds:[o.id]});
  o.sourceLeadIds.push(lead.id);
  assert.equal(s.sourceTrace.status,'');
  assert.equal(lead.status,'待查證');
  assert.equal(s.sourceTrace.confirmedSubjectId,'');
});

test('producer relation supports multiple candidates and does not auto classify batch',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批',wasteIdentity:'已有事實支持'});
  const a=M.addSubject(s,{name:'甲工地'});const c=M.addSubject(s,{name:'乙公司'});
  M.addProducerRelation(s,{batchId:b.id,subjectId:a.id,status:'疑似產生者',basisText:'駕駛陳述'});
  M.addProducerRelation(s,{batchId:b.id,subjectId:c.id,status:'產生者線索',basisText:'車身標示'});
  assert.equal(M.producerRelationsForBatch(s,b.id).length,2);
  assert.equal(M.confirmedProducerRelations(s,b.id).length,0);
  assert.equal(b.classification,'');
});

test('confirmed producer relation still does not automatically decide general or business classification',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批',wasteIdentity:'已有事實支持'});const subject=M.addSubject(s,{name:'甲'});
  M.addProducerRelation(s,{batchId:b.id,subjectId:subject.id,status:'已確認產生者',generationActivity:'住戶整理'});
  assert.equal(M.confirmedProducerRelations(s,b.id).length,1);
  assert.equal(b.classification,'');
});

test('producer candidate can be excluded while history is retained',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'A批'});const subject=M.addSubject(s,{name:'甲'});
  const r=M.addProducerRelation(s,{batchId:b.id,subjectId:subject.id,status:'疑似產生者',basisText:'初步陳述'});
  M.updateProducerRelation(s,r.id,{status:'已排除',notes:'後續查證與本批無關'});
  assert.equal(r.status,'已排除');
  assert.equal(r.history.length,1);
  assert.equal(r.history[0].type,'修正');
});

test('legacy business classification migrates to top-level business waste plus detail classification',()=>{
  const s=M.createState();const b=M.addBatch(s,{label:'舊批次'});b.classification='一般事業廢棄物';b.detailClassification='';
  M.ensureState(s);
  assert.equal(b.classification,'事業廢棄物');
  assert.equal(b.detailClassification,'一般事業廢棄物');
});

test('legacy origin subject migrates to a pending producer relation',()=>{
  const s=M.createState();const subject=M.addSubject(s,{name:'舊產源'});const b=M.addBatch(s,{label:'舊批次'});b.originSubjectId=subject.id;
  M.ensureState(s);
  const rel=M.producerRelationsForBatch(s,b.id)[0];
  assert.ok(rel);
  assert.equal(rel.status,'尚待查證');
  assert.match(rel.basisText,/舊版/);
});

test('cross-module water hint needs a combination of liquid phenomenon and water medium',()=>{
  const s=M.createState();
  M.addEnvironmentObservation(s,{locationText:'地面',phenomena:['不明液體'],media:['地面／土地'],currentStatus:'當下持續中'});
  assert.equal(M.detectCrossModuleHints(s).some(x=>x.module==='水污染'),false);
  M.addEnvironmentObservation(s,{locationText:'側溝',phenomena:['液體流出／滲出'],media:['水溝／側溝'],currentStatus:'當下持續中'});
  assert.equal(M.detectCrossModuleHints(s).some(x=>x.module==='水污染'),true);
});

test('cross-module disposition is routing state only',()=>{
  const s=M.createState();const o=M.addEnvironmentObservation(s,{phenomena:['不明液體'],media:['水溝／側溝']});
  const hint=M.detectCrossModuleHints(s)[0];
  M.setCrossModuleDisposition(s,hint.key,'暫不處理','本次非查核重點');
  assert.equal(s.crossModule.dispositions[hint.key].status,'暫不處理');
  assert.equal(s.assessments.length,0);
  assert.equal(o.phenomena[0],'不明液體');
});

test('draft includes objective environment observation and confirmed producer but excludes suspected producer and routing hint',()=>{
  const s=M.createState();s.entryMode='known';const b=M.addBatch(s,{label:'A批',materialKind:'廢家具',classification:'一般廢棄物'});
  const confirmed=M.addSubject(s,{name:'甲住戶'}), suspected=M.addSubject(s,{name:'乙公司'});
  M.addProducerRelation(s,{batchId:b.id,subjectId:confirmed.id,status:'已確認產生者'});
  M.addProducerRelation(s,{batchId:b.id,subjectId:suspected.id,status:'疑似產生者'});
  M.addEnvironmentObservation(s,{occurrenceTime:'10:00',locationText:'道路旁',phenomena:['堆置／留置'],media:['路旁']});
  const text=M.buildDraft(s);
  assert.match(text,/環境觀察/);assert.match(text,/甲住戶/);assert.doesNotMatch(text,/乙公司/);assert.doesNotMatch(text,/可能涉及水污染查核/);
});


test('V0.1.7 shared facts include Article 27 environment phenomena and media',()=>{
  assert.equal(M.VERSION,'waste-v0.1.7');
  assert.ok(M.environmentPhenomena.includes('水溝棄置雜物'));
  assert.ok(M.environmentPhenomena.includes('隨地便溺'));
  assert.ok(M.environmentPhenomena.includes('張貼／噴漆廣告污染定著物'));
  assert.ok(M.environmentMedia.includes('牆壁／樑柱／電桿／樹木／橋樑／其他土地定著物'));
  assert.ok(M.objectiveActions.includes('搜揀'));
});
