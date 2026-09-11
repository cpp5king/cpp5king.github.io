const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');

test('同層兩模板點選直接進表單，往返不殘留輸入與草稿', async () => {
  const env = await loaded(); const doc = documentStub(); const app = doc.createElement('main');
  doc.getElementById = () => app; env.context.document = doc; env.root.confirm = () => true;
  env.root.TemplateLoader.load = async () => env.config;
  env.run('src/field-renderer.js'); env.run('src/sentence-app.js');
  await new Promise(resolve => setImmediate(resolve));
  const click = text => { const button = nodes(app).find(n => n.tagName === 'BUTTON' && n.textContent === text); assert.ok(button, text); button.dispatch('click'); };
  click('空氣污染');
  for (const title of ['餐飲異味', '周界異味採樣－待檢驗結果']) assert.ok(nodes(app).some(n => n.tagName === 'BUTTON' && n.textContent === title));
  for (const title of ['餐飲異味', '周界異味採樣－待檢驗結果', '餐飲異味']) {
    click(title);
    assert.ok(app.querySelector('form')); assert.ok(!app.textContent.includes('選擇處理情境／紀錄範本'));
    const inputs = nodes(app).filter(n => n.tagName === 'INPUT');
    assert.ok(inputs.every(n => !n.value || n.type === 'radio' || n.type === 'checkbox'));
    assert.ok(nodes(app).filter(n => n.tagName === 'TEXTAREA').every(n => n.value === ''));
    assert.equal(inputs.some(n => n.id === 'samplingDate'), title !== '餐飲異味');
    const subject = inputs.find(n => n.id === 'subject'); subject.value = '測試場所'; subject.dispatch('input');
    click('填入兩份草稿');
    assert.match(nodes(app).find(n => n.id === 'record').value, /測試場所/);
    click('重新選擇案件類型');
  }
});

test('設備兩選項初始未選，切換無設備清除種類及其他文字', async () => {
  const env = await loaded(); env.context.document = documentStub(); env.run('src/field-renderer.js');
  const template = env.config.templates.find(t => t.id === 'restaurant-odor-reference');
  const view = env.root.FieldRenderer.render(template, () => {});
  const list = nodes(view.element); const radios = list.filter(n => n.type === 'radio' && n.name === 'equipment');
  assert.equal(radios.length, 2); assert.ok(radios.every(n => !n.checked));
  assert.ok(view.element.textContent.includes('油煙經污染防制設備處理後排放'));
  assert.ok(view.element.textContent.includes('未設置污染防制設備'));
  const kinds = list.find(n => n.className === 'choice-items'); assert.equal(kinds.hidden, true);
  view.write({ equipment: 'present', equipmentTypes: ['other'], equipmentOther: '測試設備' });
  assert.equal(kinds.hidden, false);
  let output = env.root.DraftEngine.generate(env.config, template.id, view.read());
  assert.match(output.record, /處理（測試設備）後排放/); assert.doesNotMatch(output.record, /正常運轉/);
  radios.forEach(n => { n.checked = n.value === 'none'; }); radios.find(n => n.value === 'none').dispatch('change');
  assert.equal(kinds.hidden, true); assert.equal(view.read().equipmentTypes.length, 0); assert.equal(view.read().equipmentOther, '');
  output = env.root.DraftEngine.generate(env.config, template.id, view.read());
  assert.doesNotMatch(output.record, /設備處理|測試設備/);
});
