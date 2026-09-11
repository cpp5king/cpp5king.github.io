const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.createContext(context);
for (const file of ['archive/legacy/data/templates/demo.js', 'archive/legacy/src/draft-engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
const config = context.window.DRAFT_CONFIG;
const generate = input => context.window.DraftEngine.generate(config, config.templates[0].id, input);
test('空白輸入不自行推定日期、現場事實或結果', () => {
  const output = generate({});
  assert.match(output.record, /稽查日期：尚待確認/);
  assert.match(output.record, /處理結果：尚待確認/);
  assert.doesNotMatch(output.record, /現場未發現污染情形/);
  assert.doesNotMatch(output.reply, /已執行檢測/);
});
test('六種處理結果分別產生兩份草稿', () => {
  for (const result of config.results) {
    const output = generate({ ...config.demo, result: result.id, resultDetails: '使用者提供的其他處理。' });
    assert.ok(output.record.length > 0 && output.reply.length > 0);
    if (result.id === 'other') assert.match(output.reply, /使用者提供的其他處理/);
    else assert.ok(output.record.includes(result.record));
  }
});
test('條件選項、文字原樣保留及模板不變', () => {
  const before = JSON.stringify(config);
  const output = generate({ ...config.demo, operating: '否', pollution: '是', observation: '{{date}} <script>假資料</script>' });
  assert.match(output.record, /現場未營業或作業/);
  assert.match(output.record, /現場有發現污染情形/);
  assert.ok(output.record.includes('{{date}} <script>假資料</script>'));
  output.record = '手動修改';
  assert.equal(JSON.stringify(config), before);
});
test('其他說明留白、不沿用非其他結果的文字', () => {
  assert.match(generate({ result: 'other' }).reply, /其他處理結果：尚待確認/);
  assert.doesNotMatch(generate({ result: 'schedule', resultDetails: '不應出現' }).reply, /不應出現/);
});
