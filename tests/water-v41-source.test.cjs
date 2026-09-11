const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');

test('4.1 水的主要來源改為複選，並可同時保存多個來源',async()=>{
  const e=await loaded();
  const t=e.config.templates.find(item=>item.id==='water-main');
  const spec=t.fields.find(field=>field.id==='waterSourceTypes');
  assert.equal(spec.type,'checklist');
  assert.match(spec.label,/可複選/);
  const facts=plain(e.root.DraftEngine.normalize(t,{waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceTypes:['manufacturing','cleaning','cooling']}));
  assert.deepEqual(facts.waterSourceTypes,['manufacturing','cleaning','cooling']);
  const wf=plain(e.root.WaterFacts.build(facts));
  assert.deepEqual(wf.sourceTypes,['manufacturing','cleaning','cooling']);
});

test('4.1 舊 waterSourceType 單值資料會自動遷移成 waterSourceTypes 陣列',async()=>{
  const e=await loaded();
  const t=e.config.templates.find(item=>item.id==='water-main');
  const facts=plain(e.root.DraftEngine.normalize(t,{waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceType:'cleaning'}));
  assert.deepEqual(facts.waterSourceTypes,['cleaning']);
});

test('4.1 來源尚待確認與已知來源互斥，資料層也會移除衝突 unknown',async()=>{
  const e=await loaded();
  const t=e.config.templates.find(item=>item.id==='water-main');
  const facts=plain(e.root.DraftEngine.normalize(t,{waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterSourceTypes:['unknown','rain','cleaning']}));
  assert.deepEqual(facts.waterSourceTypes,['cleaning','rain']);
});

test('4.1 複選介面勾選已知來源時會自動取消來源尚待確認',async()=>{
  const e=await loaded();
  e.context.document=documentStub();
  e.run('src/field-renderer.js');
  const t=e.config.templates.find(item=>item.id==='water-main');
  const view=e.root.FieldRenderer.render(t,()=>{});
  view.write({waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes'});
  const boxes=nodes(view.element).filter(n=>n.type==='checkbox');
  const unknown=boxes.find(n=>n.value==='unknown');
  const cleaning=boxes.find(n=>n.value==='cleaning');
  unknown.checked=true;unknown.dispatch('change');
  assert.deepEqual(Array.from(view.read().waterSourceTypes),['unknown']);
  cleaning.checked=true;cleaning.dispatch('change');
  assert.deepEqual(Array.from(view.read().waterSourceTypes),['cleaning']);
});
