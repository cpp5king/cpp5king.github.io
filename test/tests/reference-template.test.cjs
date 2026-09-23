const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = { window: {} };
vm.createContext(context);
for (const file of ['data/templates/catalog.js', 'data/templates/restaurant-odor.js', 'src/draft-engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
const config = context.window.INSPECTION_CONFIG;
const template = config.templates[0];
const generate = input => context.window.DraftEngine.generate(config, template.id, input);
const baseInput = {
  date: '2026-01-01', time: '15', subject: 'XXX小吃店', operating: 'cooking',
  equipment: 'present', equipmentTypes: ['wash', 'static'], observation: 'no-odor',
  measurement: '0', handling: 'maintenance'
};
const record = '本局於115年1月1日15時許派員前往所陳地址，經查該址為XXX小吃店，稽查時營業中，進行烹飪作業，油煙收集後經由空污防制設備處理（洗滌式、靜電集塵）後排放至大氣，於周界外巡查未發現有明顯油煙逸散致空污異味之情形（電子鼻數值為0），本局仍勸導業者加強防制設備及增加維護保養設備頻率，爾後本局將不定期派員前往巡查，以維護環境品質。';
const reply = '有關臺端反映事項，本局於115年1月1日15時許派員前往所陳地址，經查該址為XXX小吃店，稽查時營業中，進行烹飪作業，油煙收集後經由空污防制設備處理後排放至大氣，於周界外巡查未發現有明顯油煙逸散致空污異味之情形，本局仍勸導業者加強防制設備及增加維護保養設備頻率，爾後本局將不定期派員前往巡查，以維護環境品質。若您再次發現污染情形，請撥打新北市政府1999市政服務專線反映，本局會再度派員依法查處。';

test('有設備範例保留句型，改用指定的設備名稱', () => {
  const output = generate(baseInput);
  assert.equal(output.record, record); assert.equal(output.reply, reply);
});

test('未選不推定可變事實，零有效、空白不是零', () => {
  const output = generate({});
  assert.match(output.record, /日期尚待確認/);
  assert.doesNotMatch(output.record, /營業中|靜電集塵|未發現有明顯|電子鼻數值為0|仍勸導/);
  assert.match(output.record, /爾後本局將不定期派員前往巡查/);
  assert.doesNotMatch(generate({ ...baseInput, measurement: '' }).record, /電子鼻/);
  for (const invalid of ['-1', 'abc']) assert.match(generate({ ...baseInput, measurement: invalid }).record, /電子鼻數值尚待確認/);
});

test('多選設備、自填其他及缺漏；回覆省略種類與數值', () => {
  const output = generate({ ...baseInput, equipmentTypes: ['bag', 'adsorption', 'other'], equipmentOther: '自填設備A', measurement: '2.5' });
  assert.match(output.record, /袋濾式、吸附、自填設備A/);
  assert.match(output.record, /電子鼻數值為2.5/);
  assert.doesNotMatch(output.reply, /袋濾式|吸附|自填設備A|電子鼻/);
  assert.match(generate({ ...baseInput, equipmentTypes: [] }).record, /設備種類尚待確認/);
  assert.match(generate({ ...baseInput, equipmentTypes: ['other'], equipmentOther: '' }).record, /其他設備名稱尚待確認/);
  assert.doesNotMatch(generate({ ...baseInput, equipmentTypes: ['wash'], equipmentOther: '殘留其他文字' }).record, /殘留其他文字/);
});

const noneInput = { ...baseInput, subject: 'XXXX', equipment: 'none', operating: 'closed', observation: 'no-odor', measurement: '', handling: 'install', handbook: 'yes' };
test('無設備重現現行範例，移除設備處理句', () => {
  const output = generate(noneInput);
  const expected = '該址為XXXX，稽查時未營業，於周界外巡查未發現有明顯油煙逸散致空污異味之情形，本局仍囑業者加裝空污防制措施，並當場交付新北市餐飲污染防制手冊供其參考，爾後本局將不定期派員前往巡查，以維護環境品質。';
  assert.ok(output.record.endsWith(expected)); assert.ok(output.reply.includes(expected));
  for (const text of Object.values(output)) assert.doesNotMatch(text, /油煙收集|靜電集塵|維護保養設備頻率|，，/);
});

test('手冊必須明確交付，切換有設備不沿用手冊或加裝句', () => {
  assert.doesNotMatch(generate({ ...noneInput, handbook: 'previous' }).record, /手冊|當場交付/);
  assert.match(generate({ ...noneInput, handbook: '' }).record, /手冊交付情形尚待確認/);
  assert.doesNotMatch(generate({ ...noneInput, handbook: '' }).record, /當場交付/);
  const switched = generate({ ...noneInput, equipment: 'present' });
  assert.doesNotMatch(switched.record, /手冊|當場交付|囑業者加裝/);
  assert.match(switched.record, /本局仍勸導業者加強防制設備/);
  assert.doesNotMatch(generate({ ...noneInput, handling: 'maintenance' }).record, /維護保養設備頻率/);
});

test('日期與時間只輸出幾時許，不接受分鐘輸入', () => {
  for (const hour of ['0', '15', '23']) assert.ok(generate({ date: '2026-01-01', time: hour }).record.includes('115年1月1日' + hour + '時許'));
  for (const hour of ['15:30', '24', '-1', '']) assert.match(generate({ time: hour }).record, /時間尚待確認/);
  assert.match(generate({ date: '2026-02-30' }).record, /日期尚待確認/);
});

test('自訂原文保持字面值，執行不改模板', () => {
  const before = JSON.stringify(config);
  const output = generate({ ...baseInput, equipmentTypes: ['other'], equipmentOther: '{{date}}設備' });
  assert.ok(output.record.includes('{{date}}設備'));
  assert.equal(JSON.stringify(config), before);
});
