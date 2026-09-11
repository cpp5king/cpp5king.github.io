const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loaded } = require('./helpers.cjs');
test('首頁及清單內的本機依賴完整，無舊版或外部資源', async () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(paths.includes('data/templates/catalog.js'));
  for (const file of paths) {
    assert.doesNotMatch(file, /^(?:https?:|\/\/)|archive|demo\.js/);
    assert.ok(fs.existsSync(path.join(root, file)), '缺少 ' + file);
  }
  const { config } = await loaded();
  for (const entry of config.templateFiles) assert.ok(fs.existsSync(path.join(root, 'data/templates', entry.file)));
});
