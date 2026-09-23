const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loaded, plain} = require('./helpers.cjs');
const {documentStub, nodes} = require('./dom-stub.cjs');
async function setup() {
  const env = await loaded(); const t = env.config.templates.find(t => t.id === 'noise-case');
  return {...env,t,generate:input=>env.root.DraftEngine.generate(env.config,t.id,input)};
}
const base={date:'2026-01-01',time:'15',subject:'測試場所',operation:'測試作業',noiseSource:'測試音源',sourceType:'人工音源別',zone:'二',period:'人工時段',measurementLocation:'測試測點',leq:'50',lmax:'60',leqStandard:'55',lmaxStandard:'65'};
test('第9條不再採用舊人工結果欄位，缺漏時不得告發',async()=>{
 const {generate}=await setup();for(const measurementResult of ['compliant','exceeded']){
 const out=generate({...base,scenario:'article9',measurementResult});assert.doesNotMatch(out.record,/已違反|依法告發|符合噪音管制標準/);
 }
});
test('第9條不由舊陳情人說明選項推定已說明',async()=>{
 const {generate}=await setup();assert.doesNotMatch(generate({...base,scenario:'article9',measurementResult:'compliant',explainedToComplainant:'yes'}).reply,/現場已與臺端說明/);
});
test('條件表單只顯示所選樣態，切換清除隱藏資料，固定公文不在表單',async()=>{
  const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const list=nodes(view.element);
  const control=id=>list.find(n=>n.id===id);
  assert.doesNotMatch(view.element.textContent,/本局於|已違反|依法告發並令其/);
  for(const [scenario,visible,hidden] of [['neighbor','noiseType','date'],['article8','article8Time','measurementLocation'],['article9','a9Type','measurementLocation'],['unmeasured','noMeasurementReason','noiseType']]){
    view.write({scenario});assert.equal(control(visible).parentElement.hidden,false);assert.equal(control(hidden).parentElement.hidden,true);
  }
  view.write({scenario:'article9',measurementResult:'exceeded',background:'40',backgroundText:'custom',backgroundTextCustom:'舊背景',measurementType:['lowFrequency']});
  const selector=control('scenario');selector.value='neighbor';selector.dispatch('change');
  assert.equal(view.read().background,'');assert.equal(view.read().backgroundTextCustom,'');assert.equal(view.read().measurementType.length,0);assert.equal(view.read().measurementResult,'');
});
test('通用條件段落驗證、歧義拒絕及輸入不二次展開',async()=>{
  const {root,t,config,generate}=await setup();
  const invalid=plain(t);invalid.recordVariants[0].text=['{{unknown}}'];assert.throws(()=>root.DraftEngine.validate(invalid),/未定義/);
  const ambiguous=plain(t);ambiguous.recordVariants.push(ambiguous.recordVariants[0]);assert.throws(()=>root.DraftEngine.generate({templates:[ambiguous]},t.id,{scenario:'neighbor',hasCommittee:'yes'}),/多個分支/);
  const before=JSON.stringify(config);const input={scenario:'unmeasured',noMeasurementReason:'other',otherRecord:'{{date}}'};assert.equal(generate(input).record,'{{date}}');assert.deepEqual(plain(generate(input)),plain(generate(input)));assert.equal(JSON.stringify(config),before);
});
test('首頁可進入噪音案件，往返餐飲與噪音清除輸入及草稿',async()=>{
  const env=await setup();const doc=documentStub(), app=doc.createElement('main');doc.getElementById=()=>app;env.context.document=doc;env.root.confirm=()=>true;env.root.TemplateLoader.load=async()=>env.config;env.run('src/field-renderer.js');/* Internal legacy UI regression fixture; not a production entry. */ env.config.caseTypes.find(t=>t.id==='noise-case').directTemplateId='noise-case';env.run('src/sentence-app.js');await new Promise(resolve=>setImmediate(resolve));
  const click=text=>{const b=nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===text);assert.ok(b,text);b.dispatch('click');};
  click('噪音');click('噪音案件');assert.ok(nodes(app).some(n=>n.id==='scenario'));
  const fill=(id,value)=>{const input=nodes(app).find(n=>n.id===id);input.value=value;input.dispatch('change');};
  fill('scenario','article8');fill('date','2026-01-01');fill('article8Time','22:00');fill('article8Zone','2');fill('prohibitedAct','commercialMachinery');fill('subject','測試條款');click('填入兩份草稿');assert.match(nodes(app).find(n=>n.id==='record').value,/測試條款/);
  click('首頁／案件大類');click('空氣污染');click('餐飲異味');click('填入兩份草稿');assert.doesNotMatch(nodes(app).find(n=>n.id==='record').value,/測試條款/);
  click('首頁／案件大類');click('噪音');click('噪音案件');assert.equal(nodes(app).find(n=>n.id==='subject').value,'');assert.equal(nodes(app).find(n=>n.id==='record').value,'');
});

require('./contracts/legacy-noise-documents.cjs');
