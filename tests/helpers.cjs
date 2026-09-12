const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function runtime() {
  const context = { window: {} }; vm.createContext(context);
  const run = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  ["data/texts/noise-common.js","data/texts/noise-templates.js","data/texts/noise-main.js","data/texts/noise-article8.js","data/texts/noise-article9.js","data/texts/noise-neighbor.js","data/texts/noise-ui.js","data/texts/water-main.js","data/texts/water-field.js","src/noise-format.js","data/texts/noise-documents.js", 'src/noise-text.js', 'data/templates/catalog.js', 'data/rules/noise-article8.js', 'src/noise-article8.js', 'data/rules/noise-article9.js', 'src/noise-article9.js', 'data/templates/noise-article9-documents.js', 'src/noise-article9-documents.js', 'src/noise-article9-measurement.js', 'src/noise-backgrounds.js', 'src/noise-attempts.js','src/noise-main.js','src/noise-v490.js','data/rules/water-article13.js','data/rules/water-article14.js','data/rules/water-article18.js','data/rules/water-article20.js','data/rules/water-article22-35.js','data/rules/water-article26.js','data/rules/water-article27.js','data/rules/water-article7.js','data/rules/water-article18-1.js','data/rules/water-article28.js','data/rules/water-article30.js','data/rules/water-article32.js','data/rules/water-article59.js','data/rules/water-article71.js','data/rules/water-sublaw-core.js','data/rules/water-industry.js','src/water-law-versions.js','src/water-facts.js','src/water-rule-engine.js','src/water-industry.js','src/water-workflow.js','src/water-dependencies.js','src/water-assessment.js','src/water-documents.js','src/water-main.js','src/water-field.js', 'src/draft-engine.js', 'src/template-loader.js', 'src/case-file.js', 'src/case-session.js', 'src/choice-controls.js', 'src/ui-profile.js'].forEach(run);
  return { root: context.window, run, context };
}
async function loaded() {
  const env = runtime();
  await env.root.TemplateLoader.load(env.root.INSPECTION_CONFIG, file => env.run('data/templates/' + file));
  return { ...env, config: env.root.INSPECTION_CONFIG };
}
const plain = value => JSON.parse(JSON.stringify(value));
// 純測試資料，沒有任何稽查文字，也不登記在正式 catalog 中。
function fixture(id = 'unit-fixture') {
  return {
    id, categoryId: 'air', caseTypeId: 'restaurant-odor', title: '測試用途', version: 'test',
    fields: [
      { id: 'phase', label: '測試選項', type: 'select', allowCustom: false, missing: '尚待確認', options: [{ id: 'a', label: 'A', value: '測試A' }, { id: 'b', label: 'B', value: '測試B' }] },
      { id: 'details', label: '測試內容', type: 'textarea', missing: '尚待確認', showWhen: { field: 'phase', value: 'a' } },
      { id: 'pick', label: '測試條件選項', type: 'select', missing: '尚待確認', options: [{ id: 'onlyA', label: '限A', value: '條件文字', when: { field: 'phase', value: 'a' } }] },
      { id: 'bundle', label: '測試群組', type: 'choiceGroup', missing: '尚待確認',
        options: [{ id: 'skip', label: '略過', value: '' }, { id: 'use', label: '使用', value: '群組：{{items}}', replyValue: '群組已選', usesItems: true }],
        itemsKey: 'selected', itemsLabel: '測試複選', separator: '、', itemsMissing: '尚待確認',
        items: [{ id: 'one', label: '一' }, { id: 'free', label: '自填', customKey: 'extra', customLabel: '自填文字', missing: '尚待確認' }] },
      { id: 'replyOnly', label: '只用於回覆', type: 'text', missing: '尚待確認' }
    ],
    record: ['{{phase}}{{details}}', '{{pick}}{{bundle}}{{phase}}'], reply: ['{{replyOnly}}{{bundle}}']
  };
}
module.exports = { runtime, loaded, plain, fixture };
