const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
function load(rel, context) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel });
}
function screening() {
  const context = { window: {}, console };
  vm.createContext(context);
  load('src/water-screening-assist.js', context);
  return context.window.WaterScreeningAssist;
}

test('quick-screen module remains wired into current offline app', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const meta = fs.readFileSync(path.join(ROOT, 'data/app-meta.js'), 'utf8');
  const version = meta.match(/version:\s*['\"]([^'\"]+)/)?.[1];
  assert.ok(version);
  assert.match(index, new RegExp('water-screening-assist\\.js\\?v='+version.replaceAll('.', '\\.')));
  assert.match(sw, /src\/water-screening-assist\.js/);
});

test('unknown reaction combination keeps unknown instead of guessing industry', () => {
  const a = screening();
  const dirs = a.sourceDirections([{ code: 'NI', reaction: 'yes' }, { code: 'NO3', reaction: 'yes' }]);
  assert.equal(dirs.length, 1);
  assert.equal(dirs[0].id, 'UNRESOLVED');
  assert.match(dirs[0].title, /尚不足形成特定來源方向/);
});

test('pH source hint is conservative and not a legal exceedance decision', () => {
  const a = screening();
  const acid = a.sourceDirections([], { ph: '2.3' });
  const alkali = a.sourceDirections([], { ph: '10.5' });
  const neutral = a.sourceDirections([], { ph: '7.2' });
  assert.ok(acid.some(x => x.id === 'PH_ACID'));
  assert.ok(alkali.some(x => x.id === 'PH_ALKALI'));
  assert.equal(neutral.length, 0);
  assert.match(acid.find(x => x.id === 'PH_ACID').caution, /不等同法定超標/);
});

test('industry/process selection only recommends tests and does not feed sourceDirections', () => {
  const a = screening();
  const rec = a.industryRecommendations('metal_surface', ['plating']);
  assert.ok(rec.codes.includes('CN2'));
  const dirs = a.sourceDirections([{ code: 'CU', reaction: 'yes' }]);
  assert.equal(dirs.length, 1);
  assert.equal(dirs[0].id, 'UNRESOLVED');
  assert.doesNotMatch(dirs[0].reason, /電鍍/);
});

test('field phenomenon recommendations and repeat-along-route behavior stay fact-first', () => {
  const a = screening();
  const foam = a.recommendations(['泡沫']);
  assert.deepEqual(new Set(foam.codes), new Set(['DET', 'COD']));
  assert.deepEqual(Array.from(a.repeatFrom([
    { code: 'COD', reaction: 'yes' },
    { code: 'NH4', reaction: 'no' },
    { code: 'CU', reaction: 'unclear' }
  ])), ['COD']);
});
