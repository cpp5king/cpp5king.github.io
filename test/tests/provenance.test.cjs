const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const marker = 'PP-IA-41-7F3C9A21';

function read(file){ return fs.readFileSync(path.join(root,file),'utf8'); }
function appMeta(){
  const context=vm.createContext({window:{}});
  vm.runInContext(read('data/app-meta.js'),context);
  return context.window.INSPECTION_APP_META;
}

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

test('版本與PWA識別同步且含PP來源身分', () => {
  const meta=appMeta();
  assert.match(meta.version,/^\d+\.\d+\.\d+$/);
  assert.equal(meta.ownerTag,'PP');
  assert.equal(meta.provenance,marker);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, meta.label);
  assert.equal(manifest.id, './inspection-assistant-pp');
  assert.match(read('service-worker.js'),new RegExp("const VERSION='"+meta.version.replaceAll('.','\\.')+"'"));
});