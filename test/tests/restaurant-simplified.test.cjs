const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loaded } = require('./helpers.cjs');
const { documentStub, nodes } = require('./dom-stub.cjs');

test('設備自動產生指定勸導；未知設備不補勸導；舊勸導輸入無效', async () => {
  const { root, config } = await loaded();
  for (const operating of ['cooking','open-not-cooking','closed']) {
    for (const equipment of ['present','none','']) {
      const out = root.DraftEngine.generate(config, 'restaurant-odor-reference', { operating, equipment, handling: 'custom', handlingCustom: '舊勸導' });
      for (const text of Object.values(out)) {
        assert.doesNotMatch(text, /舊勸導|勸導情形尚待確認|，，/);
        assert.equal(text.includes('本局仍勸導業者加強防制設備及增加維護保養設備頻率'), equipment === 'present');
        assert.equal(text.includes('本局仍囑業者加裝空污防制措施'), equipment === 'none');
      }
    }
  }
});

test('表單只有四種營業選項、純數值電子鼻及兩種手冊狀態，無勸導輸入', async () => {
  const env = await loaded(); env.context.document = documentStub(); env.run('src/field-renderer.js');
  const template = env.config.templates.find(t => t.id === 'restaurant-odor-reference');
  const view = env.root.FieldRenderer.render(template, () => {}); const list = nodes(view.element);
  assert.equal(list.find(n => n.id === 'operating').options.length, 5); // 含未選提示
  assert.ok(!list.some(n => n.id === 'handling' || n.id === 'handlingCustom'));
  const measurement = list.find(n => n.id === 'measurement'); assert.equal(measurement.type, 'number');
  assert.ok(!list.some(n => n.id === 'measurementCustom'));
  const handbook = list.find(n => n.id === 'handbook');
  assert.deepEqual(handbook.options.slice(1).map(n => n.textContent), ['本次已交付','先前已交付，本次不再重複交付']);
  view.write({operating:'cooking',equipment:'none',handbook:'previous',measurement:'0'});
  assert.equal(handbook.parentElement.hidden, false);
  let out = env.root.DraftEngine.generate(env.config, template.id, view.read());
  assert.match(out.record, /電子鼻數值為0/); assert.doesNotMatch(out.reply, /電子鼻/);
  assert.doesNotMatch(out.record, /交付|手冊/);
  view.write({...view.read(), equipment:'present'}); assert.equal(handbook.parentElement.hidden, true); assert.equal(view.read().handbook, '');
  measurement.value = ''; measurement.dispatch('input');
  out = env.root.DraftEngine.generate(env.config, template.id, view.read()); assert.doesNotMatch(out.record, /電子鼻/);
  view.write({...view.read(), equipment:'none',handbook:'yes'});
  out = env.root.DraftEngine.generate(env.config, template.id, view.read());
  for (const text of Object.values(out)) assert.match(text, /並當場交付新北市餐飲污染防制手冊/);
});
