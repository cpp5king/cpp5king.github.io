const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loaded } = require('./helpers.cjs');
test('首頁及清單內的本機依賴完整，無舊版或外部資源', async () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  const paths = refs.map(file => file.split('?')[0].split('#')[0]);
  assert.ok(paths.includes('data/templates/catalog.js'));
  for (let i=0;i<refs.length;i++) {
    const file=refs[i],local=paths[i];
    assert.doesNotMatch(file, /^(?:https?:|\/\/)|archive|demo\.js/);
    assert.ok(fs.existsSync(path.join(root, local)), '缺少 ' + local);
  }
  const { config } = await loaded();
  for (const entry of config.templateFiles) assert.ok(fs.existsSync(path.join(root, 'data/templates', entry.file)));
});