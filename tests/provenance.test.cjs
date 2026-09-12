const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const marker = 'PP-IA-41-7F3C9A21';

function read(file){ return fs.readFileSync(path.join(root,file),'utf8'); }

test('PP來源指紋分散存在多個核心檔案', () => {
  for (const file of [
    'data/provenance.js',
    'data/app-meta.js',
    'index.html',
    'service-worker.js',
    'src/water-rule-engine.js',
    'data/templates/catalog.js'
  ]) assert.match(read(file), new RegExp(marker.replaceAll('-','\\-')), file+' 缺少來源指紋');
});

test('版本與PWA識別同步為4.7且含PP來源身分', () => {
  assert.match(read('data/app-meta.js'), /version:'4\.7'/);
  assert.match(read('data/app-meta.js'), /ownerTag:'PP'/);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, '稽查助手4.7');
  assert.equal(manifest.id, './inspection-assistant-pp');
});
