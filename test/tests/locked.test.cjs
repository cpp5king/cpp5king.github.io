const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain, fixture } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');
// 修改前快照，只用於確認本次未改動其他營業狀態，不載入正式產品。
const before = require('./fixtures/restaurant-before-locked.json');
const sentence = '稽查時現場大門深鎖無人回應，於周界外巡查未發現有排放油煙致空污異味之情事，爾後本局將不定期派員前往巡查。';
const facts = { date: '2026-01-01', time: '15', subject: '測試店', operating: 'close', equipment: 'present', equipmentTypes: ['other'], equipmentOther: '殘留設備', observation: 'custom', observationCustom: '殘留查察', measurement: 'custom', measurementCustom: '99', handling: 'custom', handlingCustom: '殘留勸導', handbook: 'yes' };

test('大門深鎖兩份輸出使用指定事實，忽略隱藏欄位及自填值', async () => {
  const { root, config } = await loaded();
  const output = root.DraftEngine.generate(config, before.id, facts);
  assert.equal(output.record, '本局於115年1月1日15時許派員前往所陳地址，經查該址為測試店，' + sentence);
  assert.equal(output.reply, '有關臺端反映事項，' + output.record + '若您再次發現污染情形，請撥打新北市政府1999市政服務專線反映，本局會再度派員依法查處。');
  for (const text of Object.values(output)) assert.doesNotMatch(text, /殘留|設備|電子鼻|勸導|手冊|，，/);
});

test('切換深鎖隱藏五組欄位並清除內容，切回不恢復舊值', async () => {
  const env = await loaded(); env.context.document = documentStub(); env.run('src/field-renderer.js');
  const template = env.config.templates.find(t => t.id === before.id);
  const view = env.root.FieldRenderer.render(template, () => {}); const all = nodes(view.element);
  const operating = all.find(n => n.id === 'operating');
  view.write({ ...facts, operating: 'cooking', equipment: 'none' });
  const handbook = all.find(n => n.id === 'handbook'); assert.equal(handbook.parentElement.hidden, false);
  operating.value = 'close'; operating.dispatch('change');
  for (const id of ['observation', 'measurement', 'handbook']) {
    const control = all.find(n => n.id === id); assert.equal(control.parentElement.hidden, true); assert.equal(control.value, '');
  }
  const equipment = all.find(n => n.type === 'radio' && n.name === 'equipment');
  assert.equal(equipment.parentElement.parentElement.parentElement.hidden, true);
  assert.equal(view.read().equipment, ''); assert.equal(view.read().equipmentOther, '');
  assert.equal(view.read().equipmentTypes.length, 0);
  operating.value = 'cooking'; operating.dispatch('change');
  assert.equal(all.find(n => n.id === 'observation').parentElement.hidden, false);
  assert.equal(view.read().observationCustom, ''); assert.equal(view.read().measurementCustom, undefined);
  assert.equal(view.read().handlingCustom, undefined); assert.equal(view.read().equipment, '');
});

// 使用者已核定一般狀態新流程，改驗證四種狀態及移除選項。
test('營業狀態只保留四種，不接受舊選項或自行填寫', async () => {
  const { root, config } = await loaded(); const t = config.templates.find(t => t.id === before.id);
  const f = t.fields.find(f => f.id === 'operating');
  assert.deepEqual(plain(f.options.map(o => o.label)), ['營業中，進行烹飪作業','營業中，未進行烹飪作業','未營業','大門深鎖']);
  for (const operating of ['open','prep','custom']) assert.equal(root.DraftEngine.normalize(t, {operating, operatingCustom:'不應出現'}).operating, '');
});

test('通用不等於及固定文字依資料生效，拒絕無效條件，不接受固定值注入', async () => {
  const { root } = await loaded(); const t = fixture();
  t.fields.push({ id: 'ending', label: '測試固定文字', type: 'fixed', value: '固定', missing: '未知', showWhen: { field: 'phase', operator: 'notEquals', value: 'a' } }); t.record = ['{{ending}}'];
  const generate = phase => root.DraftEngine.generate({ templates: [t] }, t.id, { phase, ending: '注入' }).record;
  assert.equal(generate('a'), ''); assert.equal(generate('b'), '固定'); assert.equal(generate(''), '固定');
  t.fields.at(-1).showWhen.operator = 'typo'; assert.throws(() => root.DraftEngine.validate(t), /運算子/);
});
