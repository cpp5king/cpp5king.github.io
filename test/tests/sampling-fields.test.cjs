const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');
async function render() {
  const env = await loaded(); env.context.document = documentStub(); env.run('src/field-renderer.js');
  const session = env.root.CaseSession.create(env.config);
  session.selectCategory('air'); session.selectCaseType('odor-sampling-pending'); session.selectTemplate('restaurant-odor-sampling-pending');
  const template = env.config.templates.find(item => item.id === session.snapshot().templateId);
  return { ...env, session, view: env.root.FieldRenderer.render(template, facts => session.setInputs(facts)) };
}
test('選擇採樣樣態後實際渲染日期、分鐘時間、袋數、公司欄位且不提供程序控制欄位', async () => {
  const { view } = await render(); const list = nodes(view.element);
  for (const id of ['date','time','subject','samplingDate','samplingStart','samplingEnd','bagCount','contractorName','laboratoryName','otherAttendees']) assert.ok(list.some(node => node.id === id), id);
  assert.equal(list.find(node => node.id === 'samplingStart').type, 'time');
  assert.equal(list.find(node => node.id === 'bagCount').step, '1');
  assert.ok(list.filter(node => node.type === 'checkbox').every(node => !node.checked));
  assert.equal(list.find(node => node.id === 'laboratoryName').parentElement.hidden, true);
  assert.equal(view.read().samplingDate, ''); assert.equal(view.read().samplingLocation, undefined);
  assert.equal(list.filter(node => node.type === 'checkbox').length, 4);
});
test('勾選才顯示公司名稱，取消勾選清除名稱', async () => {
  const { view, session } = await render(); const list = nodes(view.element);
  const box = list.find(node => node.type === 'checkbox' && node.value === 'laboratory');
  const name = list.find(node => node.id === 'laboratoryName');
  box.checked = true; box.dispatch('change'); assert.equal(name.parentElement.hidden, false);
  name.value = '測試公司'; name.dispatch('input'); assert.equal(session.snapshot().inputs.laboratoryName, '測試公司');
  box.checked = false; box.dispatch('change'); assert.equal(name.value, ''); assert.equal(name.parentElement.hidden, true);
  assert.ok(!list.some(node => node.id === 'samplingLocation'));
});
