const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.createContext(context);
for (const file of ['archive/legacy/data/flows/air-restaurant-odor.js', 'archive/legacy/src/flow-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const flow = context.window.INSPECTION_FLOWS[0];
const engine = context.window.FlowEngine;
test('所有五個示範分支均可完成', () => {
  engine.validate(flow);
  for (const [choices, expected] of [[[1], 'need-source'], [[0, 1], 'need-operation'], [[0, 0, 0], 'observed'], [[0, 0, 1], 'not-observed'], [[0, 0, 2], 'uncertain']]) {
    let history = [];
    for (const choice of choices) history = engine.choose(flow, history, choice);
    assert.equal(engine.current(flow, history), expected);
    assert.equal(history.length, choices.length);
  }
});
test('回退更改答案不保留舊分支', () => {
  let history = engine.choose(flow, [], 0);
  history = engine.choose(flow, history, 0);
  history = engine.choose(flow, history, 0);
  history = history.slice(0, -2);
  history = engine.choose(flow, history, 1);
  assert.equal(engine.current(flow, history), 'need-operation');
  assert.equal(history.length, 2);
  assert.equal(engine.current(flow, []), 'source');
});
test('錯誤目標及循環會顯示資料錯誤', () => {
  const invalid = JSON.parse(JSON.stringify(flow));
  invalid.nodes.source.options[0].next = 'missing';
  assert.throws(() => engine.validate(invalid), /不存在/);
  invalid.nodes.source.options[0].next = 'source';
  assert.throws(() => engine.validate(invalid), /循環/);
});
