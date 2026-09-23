const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, loaded, fixture, plain } = require('./helpers.cjs');
test('沒有餐飲欄位名稱的模板可用多段、條件與複選', () => {
  const { root } = runtime(); const template = fixture();
  const output = root.DraftEngine.generate({ templates: [template] }, template.id, { phase: 'a', details: '內容', pick: 'onlyA', bundle: 'use', selected: ['one', 'free'], extra: '自填', replyOnly: '回覆專用' });
  assert.equal(output.record, '測試A內容\n\n條件文字群組：一、自填測試A');
  assert.equal(output.reply, '回覆專用群組已選');
});
test('缺少資料不推測；隱藏的條件內容不被注入輸出', () => {
  const { root } = runtime(); const template = fixture(); const config = { templates: [template] };
  const blank = root.DraftEngine.generate(config, template.id, {});
  assert.equal(blank.record, '尚待確認\n\n尚待確認尚待確認尚待確認');
  const hidden = root.DraftEngine.generate(config, template.id, { phase: 'b', details: '不應出現', pick: 'onlyA', bundle: 'skip', selected: ['free'], extra: '不應出現' });
  assert.doesNotMatch(hidden.record, /不應出現|條件文字/);
});
test('未知欄位、重複識別碼、無效條件指向及不支援類型會被拒絕', () => {
  const { root } = runtime(); const base = fixture();
  for (const mutate of [t => t.record.push('{{unknown}}'), t => t.fields.push(t.fields[0]), t => t.fields[1].showWhen.field = 'later', t => t.fields[0].type = 'execute']) {
    const invalid = plain(base); mutate(invalid); assert.throws(() => root.DraftEngine.validate(invalid));
  }
});
test('現行餐飲模板所有選項均可產生，且執行不改模板設定', async () => {
  const { config, root } = await loaded();
  const template = config.templates.find(item => item.id === 'restaurant-odor-reference');
  const before = JSON.stringify(config);
  const base = {
    date: '2026-01-01', time: '15', subject: '測試店', operating: 'cooking',
    equipment: 'present', equipmentTypes: ['wash'], observation: 'no-odor',
    measurement: '', handling: 'maintenance'
  };
  const cases = [{}, base];
  for (const field of template.fields) {
    for (const option of field.options || []) {
      const input = { ...base, [field.id]: option.id };
      if (option.when) input[option.when.field] = option.when.value;
      cases.push(input);
    }
    for (const item of field.items || []) {
      cases.push({ ...base, [field.itemsKey]: [item.id], ...(item.customKey ? { [item.customKey]: '自填設備' } : {}) });
    }
  }
  for (const input of cases) {
    const first = plain(root.DraftEngine.generate(config, template.id, input));
    const second = plain(root.DraftEngine.generate(config, template.id, input));
    assert.deepEqual(first, second);
  }
  assert.equal(JSON.stringify(config), before);
});
