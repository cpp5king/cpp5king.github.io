const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain, fixture } = require('./helpers.cjs');

const baseInput = {
  date: '2026-01-01', time: '15', subject: 'XXX小吃店', operating: 'cooking',
  equipment: 'present', equipmentTypes: ['wash', 'static'], observation: 'no-odor',
  measurement: '0', handling: 'maintenance'
};

async function setup() {
  const env = await loaded(); const session = env.root.CaseSession.create(env.config);
  session.selectCategory('air'); session.selectCaseType('restaurant-odor');
  session.selectTemplate('restaurant-odor-reference');
  return { ...env, session };
}

test('切換模板清除所有輸入、自填、勾選及手動修改草稿', async () => {
  const { config, session } = await setup(); config.templates.push(fixture());
  session.setInputs({ ...baseInput, equipmentTypes: ['other'], equipmentOther: '上一模板自填' });
  session.generate(); session.editOutput('record', '手動紀錄'); session.editOutput('reply', '手動回覆');
  session.selectTemplate('unit-fixture');
  assert.deepEqual(plain(session.snapshot().inputs), {}); assert.equal(session.snapshot().outputs, null);
  session.setInputs({ phase: 'a', details: '測試內容', bundle: 'use', selected: ['free'], extra: '自填' }); session.generate();
  session.selectTemplate('restaurant-odor-reference');
  const state = session.snapshot(); assert.deepEqual(plain(state.inputs), {}); assert.equal(state.outputs, null); assert.equal(state.stale, false);
  const output = session.generate(); assert.doesNotMatch(output.record, /測試內容|上一模板自填|手動紀錄|電子鼻數值為0/);
});

test('同模板重新選擇與回到首頁也不保留資料', async () => {
  const { session } = await setup();
  session.setInputs(baseInput); session.generate();
  session.selectTemplate('restaurant-odor-reference'); assert.deepEqual(plain(session.snapshot().inputs), {});
  session.home(); assert.deepEqual(plain(session.snapshot()), { categoryId: '', caseTypeId: '', templateId: '', inputs: {}, outputs: null, stale: false });
  session.selectCategory('water'); assert.equal(session.snapshot().categoryId, 'water');
});

test('選項變更清除不適用的子項與條件值，草稿標記過期', async () => {
  const { session } = await setup();
  session.setInputs({ ...baseInput, equipmentTypes: ['other'], equipmentOther: '舊設備' }); session.generate();
  session.setInputs({ ...session.snapshot().inputs, equipment: 'none' });
  const state = session.snapshot(); assert.equal(state.stale, true);
  assert.equal(state.inputs.equipmentOther, undefined); assert.equal(state.inputs.equipmentTypes, undefined); assert.equal(state.inputs.handling, undefined);
  const output = session.generate(); assert.doesNotMatch(output.record, /舊設備|維護保養設備頻率/);
});

test('手動修改輸出不改模板、輸入快照也不外洩可變狀態', async () => {
  const { config, session } = await setup(); const before = JSON.stringify(config);
  session.setInputs(baseInput); session.generate(); session.editOutput('reply', '自行修改');
  const snapshot = session.snapshot(); snapshot.inputs.equipmentTypes.push('bag');
  assert.equal(JSON.stringify(config), before); assert.equal(session.snapshot().outputs.reply, '自行修改');
  assert.ok(!session.snapshot().inputs.equipmentTypes.includes('bag'));
});
