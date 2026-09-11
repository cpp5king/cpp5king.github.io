const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded, plain } = require('./helpers.cjs');
const { input, confirmed } = require('./fixtures/sampling-case.cjs');
const id = 'restaurant-odor-sampling-pending';
async function setup() {
  const env = await loaded();
  return { ...env, template: env.config.templates.find(item => item.id === id), generate: facts => env.root.DraftEngine.generate(env.config, id, facts) };
}
test('兩個獨立模板同屬空氣污染，原模板保留', async () => {
  const { config, template } = await setup();
  assert.equal(config.caseTypes.filter(t => t.categoryId === 'air').length, 2);
  assert.equal(config.templates.filter(t => t.categoryId === 'air').length, 2);
  assert.equal(template.caseTypeId, 'odor-sampling-pending');
  assert.ok(config.templates.some(item => item.id === 'restaurant-odor-reference'));
  assert.doesNotMatch(config.templates.map(item => item.title).join(' '), /檢測合格|檢測不合格/);
});
test('稽查與採樣日期獨立，可重現跨日凌晨採樣', async () => {
  const { generate } = await setup(); const output = generate(input);
  assert.match(output.record, /115年8月13日23時許/);
  assert.match(output.record, /採樣時間8月14日00:07-00:09，共1袋/);
  assert.doesNotMatch(output.record, /採樣時間8月13日/);
  assert.match(generate({ ...input, samplingDate: '' }).record, /採樣日期尚待確認/);
});
test('未填或無效採樣時間不自行補值', async () => {
  const { generate } = await setup();
  for (const time of ['', '24:00', '00:60', '7:9']) {
    const output = generate({ ...input, samplingStart: time, samplingEnd: time });
    assert.match(output.record, /開始時間尚待確認/); assert.match(output.record, /結束時間尚待確認/);
    assert.doesNotMatch(output.record, /00:07|00:09/);
  }
});
test('公司名稱由勾選與自填決定，未填不使用參考公司名', async () => {
  const { generate } = await setup();
  const output = generate({ ...input, contractorName: '', laboratoryName: '' });
  assert.doesNotMatch(output.record, /慧群|衛宇/);
  assert.match(output.record, /檢測公司（名稱尚待確認）/);
  const unselected = generate({ ...input, attendees: ['operator'] });
  assert.doesNotMatch(unselected.record, /委辦公司|檢測公司|慧群|衛宇/);
  const other = generate({ ...input, attendees: ['other'], otherAttendees: '自填會同代稱' });
  assert.match(other.record, /現場會同自填會同代稱/);
});
test('拍照與簽名為核定固定文字，不受舊欄位控制', async () => {
  const { generate } = await setup();
  assert.match(generate(input).record, /以上過程均拍照存證並經業者確認無誤後簽名/);
  assert.equal(generate(input).record, generate({ ...input, documentation: ['signature'] }).record);
});
test('符合規定程序為固定文字', async () => {
  const { generate } = await setup();
  assert.match(generate(input).record, /相關程序皆符合環境部規定，待檢驗結果下達，辦理後續事宜/);
});
test('標準作業程序及注意事項為完整固定文字', async () => {
  const { generate, template } = await setup();
  assert.match(generate(input).record, /本案已依環境部訂定之標準作業程序進行採驗（檢測），並已對當事人有利及不利事項注意，且排除相關干擾因素/);
  assert.ok(!template.fields.some(f => ['compliance','documentation','procedure','samplingLocation'].includes(f.id)));
});
test('未填日期時間不使用現在值，完成稽查為既定前提', async () => {
  const { generate } = await setup();
  assert.match(generate({}).record, /本局於（稽查日期尚待確認）（稽查時間尚待確認）派員前往稽查/);
});

test('袋數處理正整數，空白、零、小數及非數字不造假', async () => {
  const { generate } = await setup();
  assert.match(generate({ ...input, bagCount: '02' }).record, /共2袋/);
  for (const count of ['', '0', '-1', '1.5', '1袋', 'abc', '9007199254740992']) assert.match(generate({ ...input, bagCount: count }).record, /袋數尚待確認/);
});
test('位置固定，舊位置輸入不再作用', async () => {
  const { generate } = await setup();
  assert.match(generate({}).record, /於該店排風管下風處適當距離進行周界異味採樣/);
  assert.equal(generate(input).record, generate({ ...input, samplingLocation: '其他位置' }).record);
});

test('產生待結果紀錄，不推定合格、不合格或加入法條', async () => {
  const { generate } = await setup(); const output = generate(input);
  assert.match(output.record, /待檢驗結果下達，辦理後續事宜/);
  assert.match(output.record, /採樣檢測結果如超過法定標準，本案後續將依法告發/);
  assert.doesNotMatch(output.record, /檢測結果為|判定合格|已超過|違反.*第.*條/);
});
test('民眾回覆逐字符合提供模板，不帶內部採樣細節', async () => {
  const { generate } = await setup(); const output = generate(confirmed);
  assert.equal(output.reply, '有關臺端反映事項，本局已於115年8月13日23時許派員前往稽查，並於現場執行周界異味採樣，相關樣品刻正辦理檢驗作業，待檢驗結果下達後，本局將依結果辦理後續事宜；如檢測結果不符法定標準，將依法辦理。');
  assert.doesNotMatch(output.reply, /慧群|衛宇|1袋|00:07|00:09|拍照|簽名|有利及不利|干擾因素/);
});
test('固定程序產生參考紀錄，標點完整', async () => {
  const { generate } = await setup(); const output = generate(confirmed);
  for (const text of ['該業人員', '委辦公司慧群環境科技股份有限公司', '檢測公司衛宇檢驗科技股份有限公司', '相關程序皆符合環境部規定', '以上過程均拍照存證並經業者確認無誤後簽名', '本案已依環境部訂定之標準作業程序進行採驗（檢測）', '已對當事人有利及不利事項注意', '且排除相關干擾因素']) assert.ok(output.record.includes(text));
  assert.doesNotMatch(output.record, /，，|。。|，。|尚待確認/);
});
test('切換回原樣態再回採樣時，輸入與手動草稿皆清空', async () => {
  const { root, config } = await setup(); const session = root.CaseSession.create(config);
  session.selectCategory('air'); session.selectCaseType('odor-sampling-pending'); session.selectTemplate(id);
  session.setInputs(confirmed); session.generate(); session.editOutput('record', '修改的採樣草稿');
  session.selectCaseType('restaurant-odor'); session.selectTemplate('restaurant-odor-reference');
  assert.deepEqual(plain(session.snapshot().inputs), {}); assert.equal(session.snapshot().outputs, null);
  const output = session.generate(); assert.doesNotMatch(output.record, /慧群|衛宇|採樣時間|修改的採樣草稿/);
  session.selectCaseType('odor-sampling-pending'); session.selectTemplate(id); assert.deepEqual(plain(session.snapshot().inputs), {}); assert.equal(session.snapshot().outputs, null);
});
test('範例名稱與數值只在測試資料中，模板不包含案例常數', async () => {
  const { template, generate, config } = await setup(); const source = JSON.stringify(template);
  for (const value of ['無市招芋頭粿小作坊','慧群環境科技股份有限公司','衛宇檢驗科技股份有限公司','2026-08-13','2026-08-14','00:07','00:09']) assert.ok(!source.includes(value));
  const before = JSON.stringify(config); assert.deepEqual(plain(generate(input)), plain(generate(input))); assert.equal(JSON.stringify(config), before);
});
