const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/waste-model.js');
const R=require('../data/waste-rules.js');
const L=require('../src/waste-law.js');

test('rule pack preserves provenance and passes integrity check',()=>{
  assert.equal(R.meta.provenance,'PP-IA-41-7F3C9A21');
  assert.equal(R.verify(),true);
  assert.equal(R.meta.status,'active');
});

test('unload plus flatten suggests land fill stack direction without auto assessment',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批'});
  M.addEvent(s,{batchId:b.id,action:'卸載'});
  M.addEvent(s,{batchId:b.id,action:'推平'});
  const h=L.detectDirections(s).find(x=>x.ruleId==='land_fill_stack');
  assert.ok(h);
  assert.match(h.reason,/卸載/);
  assert.equal(s.assessments.length,0);
});

test('law assessment keeps one batch subject role and direction',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批'});const sub=M.addSubject(s,{name:'甲公司',roles:['實際搬運／清運者']});
  const a=L.createAssessment(s,{ruleId:'clear_business',primaryBatchId:b.id,subjectId:sub.id,role:'實際搬運／清運者',behaviorDate:'2026-09-21'});
  assert.equal(a.primaryBatchId,b.id);assert.equal(a.subjectId,sub.id);assert.equal(a.role,'實際搬運／清運者');assert.equal(a.ruleId,'clear_business');
});

test('missing behavior date never silently selects latest rule version',()=>{
  const s=M.createState();L.ensureState(s);const a=L.createAssessment(s,{ruleId:'clear_business'});
  const ctx=L.getRequirements(s,a);
  assert.equal(ctx.resolved.status,'date_missing');
  assert.equal(a.legalState,'尚有要件待確認');
});

test('covered behavior date resolves rule version',()=>{
  const s=M.createState();L.ensureState(s);const a=L.createAssessment(s,{ruleId:'clear_business',behaviorDate:'2026-09-21'});
  const ctx=L.getRequirements(s,a);
  assert.equal(ctx.resolved.status,'ok');
  assert.match(a.ruleVersionId,/2026-07-15/);
  assert.ok(ctx.requirements.length>=4);
});

test('older date not covered by test pack remains unresolved instead of using current rules',()=>{
  const s=M.createState();L.ensureState(s);const a=L.createAssessment(s,{ruleId:'clear_business',behaviorDate:'2025-01-01'});
  const ctx=L.getRequirements(s,a);
  assert.equal(ctx.resolved.status,'not_covered');
  assert.equal(a.legalState,'尚有要件待確認');
});

test('inspector confirms requirements and system only aggregates overall legal state',()=>{
  const s=M.createState();L.ensureState(s);const a=L.createAssessment(s,{ruleId:'land_fill_stack',behaviorDate:'2026-09-21'});
  const reqs=L.getRequirements(s,a).requirements.filter(r=>r.required&&r.kind!=='exception'&&r.kind!=='supplement');
  for(const r of reqs)L.setRequirementState(s,a.id,r.id,'已有事實支持');
  assert.equal(a.legalState,'構成要件事實已完整');
  assert.notEqual(a.legalState,'違法成立');
});

test('confirmed exception changes overall state to not applicable',()=>{
  const s=M.createState();L.ensureState(s);const a=L.createAssessment(s,{ruleId:'clear_business',behaviorDate:'2026-09-21'});
  L.setRequirementState(s,a.id,'art41_exception','已有事實支持');
  assert.equal(a.legalState,'本案不適用');
});

test('support and counter evidence can coexist for one requirement',()=>{
  const s=M.createState();L.ensureState(s);const b=M.addBatch(s,{label:'A批'});const e1=M.addEvent(s,{batchId:b.id,action:'運輸'});const e2=M.addEvent(s,{batchId:b.id,action:'卸載'});
  const a=L.createAssessment(s,{ruleId:'clear_business',primaryBatchId:b.id,behaviorDate:'2026-09-21'});
  L.addEvidenceLink(s,a.id,'clear_action',e1.id,'support');L.addEvidenceLink(s,a.id,'clear_action',e2.id,'counter');
  assert.deepEqual(a.supportLinks.clear_action,[e1.id]);assert.deepEqual(a.counterLinks.clear_action,[e2.id]);
});

test('new facts do not overwrite inspector requirement state',()=>{
  const s=M.createState();L.ensureState(s);const b=M.addBatch(s,{label:'A批'});const a=L.createAssessment(s,{ruleId:'clear_business',primaryBatchId:b.id,behaviorDate:'2026-09-21'});
  L.setRequirementState(s,a.id,'clear_action','已有事實支持');
  M.addEvent(s,{batchId:b.id,action:'卸載'});L.refreshAssessment(s,a);
  assert.equal(a.requirementStates.clear_action,'已有事實支持');
});

test('departure check deduplicates shared onsite fact questions',()=>{
  const s=M.createState();L.ensureState(s);const b=M.addBatch(s,{label:'A批'});
  L.createAssessment(s,{ruleId:'land_fill_stack',primaryBatchId:b.id,behaviorDate:'2026-09-21'});
  L.createAssessment(s,{ruleId:'clear_business',primaryBatchId:b.id,behaviorDate:'2026-09-21'});
  const d=L.departureCheck(s);
  const waste=d.onsite.filter(x=>x.key==='waste_identity');
  assert.equal(waste.length,1);
});

test('reuse direction selects the law version by behavior date instead of silently using future reform',()=>{
  const s=M.createState();L.ensureState(s);
  const current=L.createAssessment(s,{ruleId:'reuse_related',behaviorDate:'2026-09-21'});
  const c=L.getRequirements(s,current);
  assert.equal(c.resolved.status,'ok');
  assert.equal(c.resolved.version.id,'waste-act-current-reuse-until-2028-07-14');
  assert.ok(c.requirements.length>0);
  const future=L.createAssessment(s,{ruleId:'reuse_related',behaviorDate:'2028-07-15'});
  const f=L.getRequirements(s,future);
  assert.equal(f.resolved.status,'ok');
  assert.equal(f.resolved.version.id,'waste-act-2028-07-15-reuse-reform');
});

test('law related-fact pool can reference producer relations and shared environment observations',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批'});const sub=M.addSubject(s,{name:'甲'});
  const producer=M.addProducerRelation(s,{batchId:b.id,subjectId:sub.id,status:'疑似產生者'});
  const env=M.addEnvironmentObservation(s,{locationText:'路旁',phenomena:['堆置／留置'],media:['路旁'],batchIds:[b.id]});
  const a=L.createAssessment(s,{ruleId:'land_fill_stack',primaryBatchId:b.id,subjectId:sub.id,behaviorDate:'2026-09-21'});
  const facts=L.allRelatedFacts(s,a);
  assert.ok(facts.some(x=>x.id===producer.id&&/產生者關係/.test(x.label)));
  assert.ok(facts.some(x=>x.id===env.id&&/環境觀察/.test(x.label)));
});


test('full Waste Disposal Act catalog is included and keeps future/deleted article status',()=>{
  const list=L.articleCatalog();
  assert.equal(list.length,91);
  assert.ok(list.some(x=>x.article==='1'));
  assert.ok(list.some(x=>x.article==='27'));
  assert.ok(list.some(x=>x.article==='39-5'&&x.status==='future'));
  assert.ok(list.some(x=>x.article==='77'));
  assert.ok(list.some(x=>x.article==='21'&&x.status==='deleted'));
});

test('powder plus road environment observation suggests Article 27 paragraph 2 without needing a batch',()=>{
  const s=M.createState();L.ensureState(s);
  const o=M.addEnvironmentObservation(s,{locationText:'道路',phenomena:['粉塵'],media:['道路'],currentStatus:'當下持續中'});
  const h=L.detectDirections(s).find(x=>x.ruleId==='art27_2_pollute_surface'&&x.relatedIds.includes(o.id));
  assert.ok(h);
  assert.match(h.reason,/粉塵/);
  assert.match(h.reason,/道路/);
  assert.equal(h.batchId,'');
});

test('Article 27 road-pollution hint never auto concludes elements or violation',()=>{
  const s=M.createState();L.ensureState(s);
  const o=M.addEnvironmentObservation(s,{locationText:'道路',phenomena:['粉塵'],media:['道路'],extentText:'約10公尺',extentBasis:'目視估計'});
  const h=L.detectDirections(s).find(x=>x.ruleId==='art27_2_pollute_surface');
  assert.ok(h);
  const a=L.createAssessment(s,{ruleId:h.ruleId,source:'system',suggestionKey:h.key,triggerReason:h.reason,triggerRelatedIds:h.relatedIds,behaviorDate:'2026-09-21'});
  const ctx=L.getRequirements(s,a);
  assert.equal(ctx.resolved.status,'ok');
  assert.ok(ctx.requirements.some(r=>r.id==='designated_area'));
  assert.ok(ctx.requirements.some(r=>r.id==='affected_object'));
  assert.ok(ctx.requirements.some(r=>r.id==='pollution_relation'));
  assert.equal(a.legalState,'尚有要件待確認');
  assert.notEqual(a.legalState,'違法成立');
  assert.ok(L.candidateFacts(s,a,ctx.requirements.find(r=>r.id==='affected_object')).some(x=>x.id===o.id));
});

test('solid matter in drain can suggest both surface-pollution and drain-litter directions',()=>{
  const s=M.createState();L.ensureState(s);
  M.addEnvironmentObservation(s,{locationText:'側溝',phenomena:['不明固體'],media:['水溝／側溝']});
  const ids=new Set(L.detectDirections(s).map(x=>x.ruleId));
  assert.ok(ids.has('art27_2_pollute_surface'));
  assert.ok(ids.has('art27_8_drain_litter'));
});

test('roadside retained materials suggests Article 27 paragraph 3 as a check direction',()=>{
  const s=M.createState();L.ensureState(s);
  M.addEnvironmentObservation(s,{locationText:'道路旁',phenomena:['堆置／留置'],media:['路旁']});
  assert.ok(L.detectDirections(s).some(x=>x.ruleId==='art27_3_roadside_stack'));
});

test('Article 27 directions carry designated clearing area premise and Article 50 paragraph 3 reference',()=>{
  for(const id of ['art27_1_litter','art27_2_pollute_surface','art27_3_roadside_stack','art27_8_drain_litter']){
    const r=L.ruleById(id);assert.ok(r);
    const v=L.resolveVersion(r,'2026-09-21');assert.equal(v.status,'ok');
    assert.ok(v.version.requirements.some(x=>x.id==='designated_area'));
    assert.ok((r.penaltyRefs||[]).some(x=>/第50條第3款/.test(x)));
  }
});

test('transport event suggests Article 49 document direction',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批'});M.addEvent(s,{batchId:b.id,action:'運輸'});
  assert.ok(L.detectDirections(s).some(x=>x.ruleId==='art49_vehicle_documents'));
});

test('role triggers are scoped to subjects explicitly related to the current batch',()=>{
  const s=M.createState();L.ensureState(s);
  const a=M.addBatch(s,{label:'A批',classification:'事業廢棄物'});
  const b=M.addBatch(s,{label:'B批',classification:'事業廢棄物'});
  const entrustor=M.addSubject(s,{name:'乙公司',roles:['委託者']});
  M.addDocument(s,{batchId:b.id,subjectId:entrustor.id,type:'契約／委託文件',title:'B批委託資料'});
  const hints=L.detectDirections(s);
  assert.ok(hints.some(x=>x.ruleId==='entrust_business_waste'&&x.batchId===b.id));
  assert.ok(hints.some(x=>x.ruleId==='art30_joint_cleanup'&&x.batchId===b.id));
  assert.ok(!hints.some(x=>x.ruleId==='entrust_business_waste'&&x.batchId===a.id));
  assert.ok(!hints.some(x=>x.ruleId==='art30_joint_cleanup'&&x.batchId===a.id));
});

test('carrier role linked by flow only triggers the related batch',()=>{
  const s=M.createState();L.ensureState(s);
  const a=M.addBatch(s,{label:'A批',classification:'事業廢棄物'});
  const b=M.addBatch(s,{label:'B批',classification:'事業廢棄物'});
  const carrier=M.addSubject(s,{name:'清運公司',roles:['受託者','實際搬運／清運者']});
  M.addFlow(s,{batchId:b.id,carrierSubjectId:carrier.id});
  M.addEvent(s,{batchId:a.id,action:'運輸'});
  M.addEvent(s,{batchId:b.id,action:'運輸',subjectId:carrier.id});
  const hints=L.detectDirections(s);
  assert.ok(hints.some(x=>x.ruleId==='art46_4_unlicensed_business'&&x.batchId===b.id));
  assert.ok(!hints.some(x=>x.ruleId==='art46_4_unlicensed_business'&&x.batchId===a.id));
});

test('neutral stack or retention observation alone does not trigger Article 46 paragraph 2 pollution-risk direction',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批',classification:'事業廢棄物'});
  M.addEvent(s,{batchId:b.id,action:'堆放'});
  M.addEnvironmentObservation(s,{batchIds:[b.id],phenomena:['堆置／留置'],media:['空地']});
  assert.ok(!L.detectDirections(s).some(x=>x.ruleId==='art46_2_pollution_risk'&&x.batchId===b.id));
});

test('explicit abnormal environment phenomenon linked to the batch can still suggest Article 46 paragraph 2 for checking',()=>{
  const s=M.createState();L.ensureState(s);
  const b=M.addBatch(s,{label:'A批',classification:'事業廢棄物'});
  M.addEvent(s,{batchId:b.id,action:'堆放'});
  M.addEnvironmentObservation(s,{batchIds:[b.id],phenomena:['液體流出／滲出'],media:['地面／土地']});
  const h=L.detectDirections(s).find(x=>x.ruleId==='art46_2_pollution_risk'&&x.batchId===b.id);
  assert.ok(h);
  assert.match(h.reason,/液體流出／滲出|環境/);
});
