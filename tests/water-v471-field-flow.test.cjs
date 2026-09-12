const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loaded,plain}=require('./helpers.cjs');

test('4.7.1 現場模式先分污染源已知與不明，未知時先從異常水追源',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  let facts=plain(e.root.DraftEngine.normalize(t,{}));
  assert.equal(facts.fieldShowKnownSubject,'no');
  assert.match(facts.fieldLiveDecisionText,/尚未選擇案件起點/);
  facts=plain(e.root.DraftEngine.normalize(t,{fieldSourceMode:'unknown',fieldUnknownWaterObserved:'yes',fieldUnknownWaterSigns:['color'],fieldUnknownFlowDirectionConfirmed:'yes'}));
  assert.equal(facts.fieldShowUnknownTrace,'yes');
  assert.equal(facts.fieldShowKnownSubject,'no');
  assert.match(facts.fieldCurrentGuidanceText,/上游|岔流/);
});

test('4.7.1 不明源建立出口與場所連通後才接回管制主體流程',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const base={fieldSourceMode:'unknown',fieldUnknownWaterObserved:'yes',fieldUnknownWaterSigns:['color','odor'],fieldUnknownFlowDirectionConfirmed:'yes',fieldUnknownUpstreamTraceStatus:'sourceArea',fieldUnknownBranchStatus:'checked',fieldUnknownOutletFound:'yes'};
  let facts=plain(e.root.DraftEngine.normalize(t,base));
  assert.equal(facts.fieldShowUnknownConnection,'yes');
  assert.equal(facts.fieldShowKnownSubject,'no');
  facts=plain(e.root.DraftEngine.normalize(t,{...base,fieldUnknownSourceConnectionConfirmed:'yes'}));
  assert.equal(facts.fieldShowKnownSubject,'yes');
  assert.match(facts.fieldLiveDecisionText,/已建立疑似污染來源連結/);
});

test('4.7.1 可在流程未走完時結束本次查察並保留事證不足結論',async()=>{
  const e=await loaded(); const t=e.config.templates.find(x=>x.id==='water-field');
  const input={fieldSourceMode:'unknown',fieldUnknownWaterObserved:'yes',fieldUnknownWaterSigns:['turbid'],fieldUnknownFlowDirectionConfirmed:'yes',fieldUnknownUpstreamTraceStatus:'notFound',fieldUnknownBranchStatus:'checked',fieldUnknownOutletFound:'no',waterEvidenceTypes:['overviewPhoto','downstreamPhoto']};
  const ended=e.root.TemplateWorkflows.waterField.endEarly(input);
  assert.equal(ended.waterInvestigationComplete,'yes');
  const facts=plain(e.root.DraftEngine.normalize(t,ended));
  assert.equal(facts.fieldShowAssessment,'yes');
  assert.match(facts.fieldFinalConclusionText,/C｜事證不足/);
  assert.match(facts.fieldFinalConclusionText,/污染來源/);
});

test('4.7.1 已確認來源與管制主體時可不等完整流程直接進案件研判',async()=>{
  const e=await loaded();
  assert.equal(e.root.TemplateWorkflows.waterField.canHandoff({fieldSourceMode:'known',waterSubjectType:'business'}),true);
  assert.equal(e.root.TemplateWorkflows.waterField.canHandoff({fieldSourceMode:'unknown',fieldUnknownSourceConnectionConfirmed:'yes',waterSubjectType:'business'}),true);
  assert.equal(e.root.TemplateWorkflows.waterField.canHandoff({fieldSourceMode:'unknown',fieldUnknownSourceConnectionConfirmed:'no',waterSubjectType:'business'}),false);
});

test('4.7.1 現場模板啟用浮動操作列且桌機兩側、窄螢幕底部樣式存在',async()=>{
  const {config}=await loaded(); const t=config.templates.find(x=>x.id==='water-field');
  assert.equal(t.floatingFieldActions,true);
  const css=fs.readFileSync('src/styles.css','utf8');
  assert.match(css,/\.field-action-left/);
  assert.match(css,/\.field-action-right/);
  assert.match(css,/@media \(max-width:1049px\)[\s\S]*\.field-floating-actions \{ position:fixed/);
});

test('4.7.1 現場頁面實際建立浮動快速操作按鈕',async()=>{
  const {documentStub,nodes}=require('./dom-stub.cjs');
  const env=await loaded(); const doc=documentStub(),app=doc.createElement('main');
  doc.getElementById=()=>app; env.context.document=doc; env.root.confirm=()=>true; env.root.TemplateLoader.load=async()=>env.config;
  env.run('src/field-renderer.js'); env.run('src/sentence-app.js'); await new Promise(r=>setImmediate(r));
  const button=text=>nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===text);
  button('水污染').dispatch('click'); button('現場稽查').dispatch('click');
  for(const label of ['← 上一步','目前判定','下一步 →','進入案件研判','結束本次查察'])assert.ok(button(label),label+' 未建立');
});
