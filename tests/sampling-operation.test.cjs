const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');

test('採樣以作業中為前提，沒有作業選項，舊值不影響固定文字', async () => {
  const env = await loaded(); env.context.document = documentStub(); env.run('src/field-renderer.js');
  const t = env.config.templates.find(t => t.id === 'restaurant-odor-sampling-pending');
  const view = env.root.FieldRenderer.render(t, () => {});
  assert.ok(!nodes(view.element).some(n => n.id === 'operation' || n.id === 'operationCustom'));
  const baseline = env.root.DraftEngine.generate(env.config, t.id, {});
  assert.match(baseline.record, /稽查時現場作業中，/);
  for (const operation of ['', 'closed', 'preparing', 'cooking', 'custom']) {
    const out = env.root.DraftEngine.generate(env.config, t.id, { operation, operationCustom: '未作業' });
    assert.equal(out.record, baseline.record); assert.equal(out.reply, baseline.reply);
  }
});
