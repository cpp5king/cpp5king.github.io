const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,runtime,plain}=require('./helpers.cjs');

async function waterSession(){
  const env=await loaded();
  const session=env.root.CaseSession.create(env.config);
  session.selectCategory('water');
  session.selectCaseType('water-inspection');
  session.selectTemplate('water-main');
  return {...env,session};
}

test('WaterReview records all five Rule Pack identities',async()=>{
  const {root}=await loaded();
  const packs=plain(root.WaterReview.packSnapshot());
  assert.equal(packs.core.packId,'WATER-CORE-TW');
  assert.equal(packs.measure.packId,'WATER-MEASURE-TW');
  assert.equal(packs.permit.packId,'WATER-PERMIT-TW');
  assert.equal(packs.standard.packId,'WATER-STANDARD-TW');
  assert.equal(packs.local.packId,'WATER-LOCAL-NTPC');
  for(const value of Object.values(packs)){
    assert.ok(value.packVersion);
    assert.ok(value.integrity?.value);
  }
});

test('water template generate appends review snapshots instead of overwriting prior review',async()=>{
  const {session}=await waterSession();
  session.setInputs({
    waterBehaviorDate:'2026-09-21',waterInspectionDate:'2026-09-21',
    waterSubjectType:'nonBusiness',waterMatterType:'unknown',waterInvestigationComplete:'yes',
    waterSurfaceWaterPollutionEventConfirmed:'no'
  });
  session.generate();
  const first=plain(session.snapshot().legalReviews);
  assert.equal(first.length,1);
  assert.equal(first[0].sequence,1);
  assert.equal(first[0].behaviorDate,'2026-09-21');
  assert.match(first[0].assessment.finalConclusion,/目前不支持/);

  session.setInputs({...session.snapshot().inputs,waterSurfaceWaterPollutionEventConfirmed:'yes',waterPolluterIdentified:'yes'});
  session.generate();
  const reviews=plain(session.snapshot().legalReviews);
  assert.equal(reviews.length,2);
  assert.equal(reviews[1].sequence,2);
  assert.deepEqual(reviews[0],first[0]);
  assert.notEqual(reviews[0].inputHash,reviews[1].inputHash);
});

test('manual draft edits never mutate preserved review output snapshot',async()=>{
  const {session}=await waterSession();
  session.setInputs({
    waterBehaviorDate:'2026-09-21',waterInspectionDate:'2026-09-21',
    waterSubjectType:'nonBusiness',waterMatterType:'unknown',waterInvestigationComplete:'yes',
    waterSurfaceWaterPollutionEventConfirmed:'no'
  });
  const generated=session.generate();
  const before=plain(session.snapshot().legalReviews[0].outputSnapshot);
  session.editOutput('record','人工修改後文字');
  assert.equal(session.snapshot().outputs.record,'人工修改後文字');
  assert.deepEqual(plain(session.snapshot().legalReviews[0].outputSnapshot),before);
  assert.equal(before.record,generated.record);
});

test('case JSON serialize and parse preserves water review history',async()=>{
  const {root,config,session}=await waterSession();
  session.setInputs({
    waterBehaviorDate:'2026-09-21',waterInspectionDate:'2026-09-21',
    waterSubjectType:'nonBusiness',waterMatterType:'unknown',waterInvestigationComplete:'yes',
    waterSurfaceWaterPollutionEventConfirmed:'no'
  });
  session.generate();
  const before=plain(session.snapshot());
  const text=root.CaseFile.serialize(before,{version:'test'});
  const parsed=root.CaseFile.parse(text,config);
  assert.deepEqual(plain(parsed.state.legalReviews),before.legalReviews);
});

test('case JSON rejects malformed water legal review history',async()=>{
  const {root,config}=await loaded();
  const text=JSON.stringify({
    schema:root.CaseFile.SCHEMA,schemaVersion:root.CaseFile.SCHEMA_VERSION,
    state:{
      categoryId:'water',caseTypeId:'water-inspection',templateId:'water-main',
      inputs:{},outputs:null,stale:false,legalReviews:[{}]
    }
  });
  assert.throws(()=>root.CaseFile.parse(text,config),/法規研判快照|快照/);
});

test('old schema-v1 case without review history remains compatible',async()=>{
  const {root,config}=await loaded();
  const text=JSON.stringify({
    schema:root.CaseFile.SCHEMA,schemaVersion:1,
    state:{categoryId:'water',caseTypeId:'water-inspection',templateId:'water-main',inputs:{},outputs:null,stale:false}
  });
  const parsed=root.CaseFile.parse(text,config);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.state,'legalReviews'),false);
});

test('non-water cases do not gain water review history',async()=>{
  const env=await loaded();
  const session=env.root.CaseSession.create(env.config);
  session.selectCategory('air');session.selectCaseType('restaurant-odor');session.selectTemplate('restaurant-odor-reference');
  session.setInputs({});
  session.generate();
  assert.equal(Object.prototype.hasOwnProperty.call(session.snapshot(),'legalReviews'),false);
});

test('Water V2 snapshot/restore preserves explicit review history and case data',()=>{
  const env=runtime();
  env.run('src/water-v2-ui.js');
  const root=env.root;
  const original=root.WaterV2UI.snapshot();
  original.caseInfo={behaviorDate:'2026-09-21',inspectionDate:'2026-09-21'};
  const review=root.WaterReview.captureV2({
    caseInfo:original.caseInfo,
    factLines:['【目視】測試事實。'],
    assessment:{laws:[],pending:['測試待確認']},
    rawState:original,
    draftText:'測試草稿'
  },1);
  original.legalReviews=[review];
  original.pollutionPoint.location='測試位置';
  root.WaterV2UI.restore(original);
  const restored=plain(root.WaterV2UI.snapshot());
  assert.equal(restored.caseInfo.behaviorDate,'2026-09-21');
  assert.equal(restored.pollutionPoint.location,'測試位置');
  assert.equal(restored.legalReviews.length,1);
  assert.equal(restored.legalReviews[0].packSnapshot.core.packId,'WATER-CORE-TW');
});

test('case JSON can validate and preserve Water V2 state',async()=>{
  const env=await loaded();
  env.run('src/water-v2-ui.js');
  const {root,config}=env;
  const v2=plain(root.WaterV2UI.snapshot());
  v2.caseInfo={behaviorDate:'2026-09-21',inspectionDate:'2026-09-21'};
  const review=root.WaterReview.captureV2({caseInfo:v2.caseInfo,factLines:[],assessment:{laws:[],pending:[]},rawState:v2},1);
  v2.legalReviews=[review];
  const text=JSON.stringify({
    schema:root.CaseFile.SCHEMA,schemaVersion:1,
    state:{categoryId:'water',caseTypeId:'water-field-inspection',templateId:'water-field',inputs:{},outputs:null,stale:false,waterV2State:v2}
  });
  const parsed=root.CaseFile.parse(text,config);
  assert.equal(parsed.state.waterV2State.legalReviews.length,1);
  assert.equal(parsed.state.waterV2State.legalReviews[0].sequence,1);
});
