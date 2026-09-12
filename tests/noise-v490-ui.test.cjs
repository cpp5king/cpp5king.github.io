const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');

test('4.9.0 新案件入口先完成法規分流，再顯示日期與第8條核心欄位',async()=>{
  const e=await loaded();
  const template=e.config.templates.find(t=>t.id==='noise-main');
  e.context.document=documentStub();
  e.run('src/field-renderer.js');
  const view=e.root.FieldRenderer.render(template,()=>{});
  const get=id=>nodes(view.element).find(n=>n.id===id);
  const write=input=>view.write(e.root.DraftEngine.normalize(template,input));

  write({});
  assert.equal(get('mainContinuity').parentElement.hidden,false);
  assert.equal(get('mainSpecial').parentElement.hidden,true);
  assert.equal(get('mainDate').parentElement.hidden,true);
  assert.equal(get('mainZone').parentElement.hidden,true);
  assert.equal(get('mainAct').parentElement.hidden,true);
  assert.equal(get('mainMeasure').parentElement.hidden,true);

  write({mainContinuity:'measurable'});
  assert.equal(get('mainContinuity').parentElement.hidden,false);
  assert.equal(get('mainSpecial').parentElement.hidden,false);
  assert.equal(get('mainDate').parentElement.hidden,true);

  write({mainContinuity:'measurable',mainSpecial:'ordinary'});
  assert.equal(get('mainDate').parentElement.hidden,false);
  assert.equal(get('mainZone').parentElement.hidden,true);
  assert.equal(get('mainAct').parentElement.hidden,true);
});

test('4.9.0 第8條未成立時先顯示第9條適用範圍確認，不先顯示量測選項',async()=>{
  const e=await loaded();
  const template=e.config.templates.find(t=>t.id==='noise-main');
  e.context.document=documentStub();
  e.run('src/field-renderer.js');
  const view=e.root.FieldRenderer.render(template,()=>{});
  const get=id=>nodes(view.element).find(n=>n.id===id);
  const input={mainContinuity:'measurable',mainSpecial:'ordinary',mainDate:'2026-09-12',mainTime:'10:00',mainZone:'3',mainAct:'none'};
  const normalized=e.root.DraftEngine.normalize(template,input);
  view.write(normalized);

  assert.equal(normalized.mainRoute,'article9');
  assert.equal(normalized.mainShowArticle9Scope,'yes');
  assert.equal(get('mainArticle9Scope').parentElement.hidden,false);
  assert.equal(get('mainMeasure').parentElement.hidden,true);
});
