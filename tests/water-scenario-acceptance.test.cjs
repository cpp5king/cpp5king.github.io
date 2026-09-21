const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {loaded,runtime,plain}=require('./helpers.cjs');
const ROOT=path.join(__dirname,'..');

function v2Harness(){
  const env=runtime();
  env.run('src/water-v2-facts.js');
  env.run('src/water-v2-assessment.js');
  let src=fs.readFileSync(path.join(ROOT,'src/water-v2-ui.js'),'utf8');
  src=src.replace(
    "root.WaterV2UI=Object.freeze({",
    "root.__scenarioV2={state,createInspection,facts,lawAssessment,preserveReview};\n  root.WaterV2UI=Object.freeze({"
  );
  vm.runInContext(src,env.context,{filename:'src/water-v2-ui.js'});
  return {...env,v2:env.root.__scenarioV2};
}

function setTopicOk(i){
  for(const code of ['B','C','D','E','F'])i.topics[code].status='ok';
}
function lawNames(a){return a.laws.map(x=>x.law);}
function hasLaw(a,part){return lawNames(a).some(x=>x.includes(part));}
function hasPending(a,part){return a.pending.some(x=>x.includes(part));}

test('情境1｜來源不明：追水可停在疑似來源，確認來源後再進對象查核，不提前產生法規方向',()=>{
  const {v2}=v2Harness();
  const s=v2.state;
  s.caseInfo.behaviorDate='2026-09-21';
  s.caseInfo.inspectionDate='2026-09-21';
  s.pollutionPoint.presence='yes';
  s.pollutionPoint.location='產業道路旁側溝';
  s.pollutionPoint.phenomena=['colored'];
  s.pollutionPoint.directionKnown='yes';
  s.pollutionPoint.directionText='往上游工業區方向';

  s.traceNodes.push({
    id:'node_1',parentId:'',branchNo:1,type:'outfall',location:'上游排水口',
    hasFlow:'yes',directionKnown:'yes',directionText:'由廠區往側溝',
    notes:'',result:'source',stopReason:'',stopNotes:'',
    screeningActive:false,screeningPh:'',screeningTemperature:'',screeningIndustry:'',screeningProcesses:[],screenings:[],
    sourceStatus:'suspected',sourceName:'甲工廠',evidence:[],evidenceOther:''
  });
  s.sources=[{nodeId:'node_1',status:'suspected',name:'甲工廠',evidence:[],evidenceOther:''}];

  let fs=v2.facts();
  let a=v2.lawAssessment();
  assert.ok(fs.some(x=>x.includes('甲工廠')&&x.includes('疑似來源')));
  assert.equal(a.laws.length,0,'疑似來源尚未進對象查核時不應產生法規方向');

  const node=s.traceNodes[0];
  node.sourceStatus='confirmed';
  node.evidence=['direct_observation','document'];
  s.sources=[{nodeId:'node_1',status:'confirmed',name:'甲工廠',evidence:[...node.evidence],evidenceOther:''}];
  const i=v2.createInspection({sourceNodeId:'node_1',name:'甲工廠'});
  i.subjectType='industry';
  i.permitStatus='yes';
  i.permitType='discharge';
  setTopicOk(i);
  s.inspections.push(i);

  fs=v2.facts();
  a=v2.lawAssessment();
  assert.ok(fs.some(x=>x.includes('已確認來源為甲工廠')));
  assert.ok(fs.some(x=>x.includes('管制主體判斷：水污法事業')));
  assert.equal(a.laws.length,0,'正常查核且無異常事實不應硬列法規方向');
});

test('情境2｜已知事業＋有效排放許可＋A～F無異常：不把正常狀態誤判成違規方向',()=>{
  const {v2}=v2Harness();
  v2.state.caseInfo.behaviorDate='2026-09-21';
  const i=v2.createInspection({name:'乙工廠'});
  i.subjectType='industry';
  i.permitStatus='yes';
  i.permitType='discharge';
  setTopicOk(i);
  Object.assign(i.details.F,{actualDischarge:'yes',destinationKnown:'yes',destination:'ground',routeMatch:'yes',nonApprovedFinalOutlet:'no'});
  v2.state.inspections=[i];
  const a=v2.lawAssessment();
  assert.equal(a.laws.length,0);
  assert.equal(hasPending(a,'適用法規版本'),false);
  assert.equal(a.lawVersion.status,'resolved');
});

test('情境3｜事業無有效排放許可且以地面水體排放：只列可能法規方向，不輸出違規成立',()=>{
  const {v2}=v2Harness();
  v2.state.caseInfo.behaviorDate='2026-09-21';
  const i=v2.createInspection({name:'丙工廠'});
  i.subjectType='industry';
  i.permitStatus='no';
  i.methods=['ground'];
  setTopicOk(i);
  Object.assign(i.details.F,{actualDischarge:'yes',destinationKnown:'yes',destination:'ground'});
  v2.state.inspections=[i];
  const a=v2.lawAssessment();
  assert.ok(hasLaw(a,'第14條第1項'));
  assert.ok(a.laws.every(x=>!x.reason.includes('違規成立')));
  assert.ok(a.laws.every(x=>!x.law.includes('違規')));
});

test('情境4｜有效排放許可但現場與許可不一致：區分許可差異與非核准出口，不把§20混進來',()=>{
  const {v2}=v2Harness();
  v2.state.caseInfo.behaviorDate='2026-09-21';
  const i=v2.createInspection({name:'丁工廠'});
  i.subjectType='industry';
  i.permitStatus='yes';
  i.permitType='discharge';
  setTopicOk(i);
  i.topics.B.status='doubt';
  i.topics.B.doubtTypes=['permit_mismatch'];
  i.topics.B.factText='實際水量與核准資料不一致';
  Object.assign(i.details.F,{actualDischarge:'yes',routeMatch:'no',nonApprovedFinalOutlet:'yes',destinationKnown:'yes',destination:'ground'});
  v2.state.inspections=[i];
  const a=v2.lawAssessment();
  assert.ok(hasLaw(a,'第14條第1項'),'排放許可登記事項差異應保留第14條方向');
  assert.ok(hasLaw(a,'第18條之1第1項'),'非核准最終放流口應另列18-1方向');
  assert.equal(hasLaw(a,'第20條'),false,'沒有貯留／稀釋事實時不應混入第20條');
});

test('情境5｜污水下水道系統：§14、§18走§19準用，§20仍直接適用，不錯冠§19',()=>{
  const {v2}=v2Harness();
  v2.state.caseInfo.behaviorDate='2026-09-21';
  const i=v2.createInspection({name:'○○污水下水道系統'});
  i.subjectType='sewer';
  i.permitStatus='yes';
  i.permitType='discharge';
  setTopicOk(i);
  i.topics.B.status='doubt';
  i.topics.B.doubtTypes=['permit_mismatch','meter_missing'];
  i.details.B.meterRequired='yes';
  i.details.B.meterInstalled='no';
  v2.state.inspections=[i];
  let a=v2.lawAssessment();
  assert.ok(hasLaw(a,'第19條準用第14條第1項'));
  assert.ok(hasLaw(a,'第19條準用第18條'));

  const j=v2.createInspection({name:'○○污水下水道系統'});
  j.subjectType='sewer';
  j.permitStatus='no';
  j.methods=['storage'];
  setTopicOk(j);
  v2.state.inspections=[j];
  a=v2.lawAssessment();
  assert.ok(hasLaw(a,'第20條'));
  assert.equal(lawNames(a).some(x=>x.includes('第19條準用第20條')),false);
});

test('情境6｜特定業別：半導體§49-9分流題目、法規內容與Measure Pack版本一起出現',async()=>{
  const env=await loaded();
  env.run('src/water-industry-v485.js');
  env.run('src/water-industry-v485-final.js');
  await env.root.TemplateLoader.load(env.root.INSPECTION_CONFIG,file=>env.run('data/templates/'+file));
  const t=env.root.INSPECTION_CONFIG.templates.find(x=>x.id==='water-main');
  const out=plain(env.root.DraftEngine.normalize(t,{
    waterBehaviorDate:'2026-09-21',waterInspectionDate:'2026-09-21',
    waterSubjectType:'business',waterSubjectConfirmed:'yes',
    waterIndustryType:'semiconductor',
    waterHighTech49_9Trigger:'yes',
    waterHighTechSeparatedCollectionCompliant:'yes',
    waterSpecialOperationTypes:['none']
  }));
  assert.match(out.waterHighTechRequiredStreamsText,/TMAH/);
  assert.match(out.waterIndustryOverviewText,/§49-9/);
  assert.match(out.waterIndustryOverviewText,/已確認符合/);
  assert.match(out.waterMeasureRulePackVersionText,/2026\.09\.21\.6-test/);
});

test('情境7｜行為日期不明：不得用稽查日或目前日期代替，法規方向維持版本待確認',()=>{
  const {v2}=v2Harness();
  v2.state.caseInfo.behaviorDate='';
  v2.state.caseInfo.inspectionDate='2026-09-21';
  const i=v2.createInspection({name:'戊工廠'});
  i.subjectType='industry';
  i.permitStatus='no';
  i.methods=['ground'];
  setTopicOk(i);
  Object.assign(i.details.F,{actualDischarge:'yes',destinationKnown:'yes',destination:'ground'});
  v2.state.inspections=[i];
  const a=v2.lawAssessment();
  assert.equal(a.lawVersion.status,'dateUnknown');
  assert.equal(a.laws.length,0,'版本未確認前不應輸出具體法規方向');
  assert.ok(hasPending(a,'適用法規版本待確認'));
  const fs=v2.facts();
  assert.ok(fs.some(x=>x.includes('行為發生日期尚未確認')));
  assert.ok(fs.some(x=>x.includes('稽查日期：2026-09-21')));
});

test('情境8｜重新研判：第一次結果、Rule Pack版本與輸出快照保留，第二次新增而不覆寫',async()=>{
  const env=await loaded();
  const session=env.root.CaseSession.create(env.config);
  session.selectCategory('water');
  session.selectCaseType('water-inspection');
  session.selectTemplate('water-main');

  session.setInputs({
    waterBehaviorDate:'2026-09-21',waterInspectionDate:'2026-09-21',
    waterSubjectType:'nonBusiness',waterMatterType:'unknown',
    waterInvestigationComplete:'yes',waterSurfaceWaterPollutionEventConfirmed:'no'
  });
  session.generate();
  const first=plain(session.snapshot().legalReviews[0]);
  assert.equal(first.sequence,1);
  assert.equal(first.packSnapshot.core.packVersion,'2026.09.21.4-test');
  assert.equal(first.packSnapshot.measure.packVersion,'2026.09.21.6-test');

  session.setInputs({
    ...session.snapshot().inputs,
    waterSurfaceWaterPollutionEventConfirmed:'yes',
    waterPolluterIdentified:'yes'
  });
  session.generate();
  const reviews=plain(session.snapshot().legalReviews);
  assert.equal(reviews.length,2);
  assert.deepEqual(reviews[0],first);
  assert.equal(reviews[1].sequence,2);
  assert.notEqual(reviews[0].inputHash,reviews[1].inputHash);
  assert.ok(reviews[0].outputSnapshot?.record);
  assert.ok(reviews[1].outputSnapshot?.record);
});
