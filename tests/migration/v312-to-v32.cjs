// Historical migration only. Run against a 3.2 checkout, not the current 3.3 contract.
const {test}=require('node:test'),assert=require('node:assert/strict');
const base=process.env.INSPECTION_MIGRATION_BASE;
const {loaded,plain}=base?require(require('node:path').join(base,'tests/helpers.cjs')):require('../helpers.cjs');
test('遷移文字契約：61份代表案例與3.1.2原公文逐字相同',{skip:!base},async()=>{const {root,config}=await loaded(),ref=require('../fixtures/noise-v312-baseline.json');for(const item of ref.cases){const out=root.DraftEngine.generate(config,item.id,item.input);assert.deepEqual(plain(out),item.output);for(const s of Object.values(out))assert.doesNotMatch(s,/undefined|null|\[object Object\]|\{\{\w+\}\}|尚待確認/);}});
