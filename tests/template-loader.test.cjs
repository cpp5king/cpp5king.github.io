const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, loaded, plain, fixture } = require('./helpers.cjs');
test('正確載入大類與類型；水污染只顯示 V2 主入口，舊版保留相容', async () => {
  const { config } = await loaded();
  assert.deepEqual(plain(config.categories.map(item => [item.title, item.status])), [['空氣污染','active'], ['水污染','active'], ['噪音','active'], ['廢棄物','development']]);
  assert.equal(config.caseTypes.length, 6); assert.equal(config.caseTypes[0].title, '餐飲異味');
  const water=config.caseTypes.filter(item=>item.categoryId==='water');
  assert.equal(water.filter(item=>!item.hidden).length,1);
  assert.equal(water.find(item=>!item.hidden).id,'water-v2-inspection');
  assert.equal(water.filter(item=>item.hidden).length,2);
  assert.ok(water.filter(item=>item.hidden).every(item=>item.status==='active'));
});
test('依清單載入現有範本，V2 與舊水污相容模板都可離線載入', async () => {
  const { root, run } = runtime(); const config = root.INSPECTION_CONFIG; const requested = [];
  await root.TemplateLoader.load(config, file => { requested.push(file); run('data/templates/' + file); });
  assert.deepEqual(requested, ['restaurant-odor.js', 'restaurant-odor-sampling-pending.js', 'noise-main.js', 'water-v2.js', 'water-field.js', 'water-main.js']);
  assert.equal(config.templates.length, 6); assert.equal(config.templates[0].title, '現有範本');
  assert.equal(config.templates[1].title, '周界異味採樣－待檢驗結果');
  assert.equal(config.templates.find(item=>item.id==='water-v2').customRenderer,'waterV2');
  assert.equal(config.templates[0].caseTypeId, config.caseTypes[0].id);
});
test('新增純測試資料只需登記清單，載入器可載入多模板', async () => {
  const { root, run } = runtime(); const config = root.INSPECTION_CONFIG;
  config.templateFiles.push({ id: 'unit-fixture', file: 'unit-fixture.js' });
  await root.TemplateLoader.load(config, file => {
    if (file === 'unit-fixture.js') config.templates.push(fixture());
    else run('data/templates/' + file);
  });
  assert.equal(config.templates.length, 7);
});
test('模板檔缺漏、重複 id 或不合法分類會明確報錯', async () => {
  const { root } = runtime();
  await assert.rejects(root.TemplateLoader.load(root.INSPECTION_CONFIG, () => { throw new Error('找不到檔案'); }), /restaurant-odor.js.*找不到檔案/);
  const { config, root: api } = await loaded();
  const duplicate = plain(config); duplicate.categories.push(duplicate.categories[0]);
  assert.throws(() => api.TemplateLoader.validateLoaded(duplicate), /重複/);
  const invalid = plain(config); invalid.templates[0].categoryId = 'water';
  assert.throws(() => api.TemplateLoader.validateLoaded(invalid), /分類/);
  const remote = plain(config); remote.templateFiles[0].file = 'https://example.test/remote.js';
  assert.throws(() => api.TemplateLoader.validateCatalog(remote), /檔名/);
});