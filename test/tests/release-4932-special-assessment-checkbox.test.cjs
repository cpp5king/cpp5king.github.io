const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loaded}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');
const base={noiseDate:'2026-09-14',noiseTime:'00:30',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'manual',noiseZone:'2',noiseA8Act:'none',noiseA9Type:'business',noiseMeasureDecision:'yes'};

test('4.9.32 特殊評定改為單一 checkbox，沿用 periodic 語意',async()=>{
  const {config}=await loaded();
  const special=config.templates.find(x=>x.id==='noise-main').fields.find(x=>x.id==='noiseGeneralSpecialAssessment');
  assert.equal(special.type,'checklist');
  assert.equal(special.label,'特殊評定');
  assert.equal(JSON.stringify(special.items.map(x=>({id:x.id,label:x.label}))),JSON.stringify([{id:'periodic',label:'使用特殊評定'}]));
  assert.equal(special.displayWhen.field,'noiseShowGeneralMethod');
});

test('4.9.32 勾選特殊評定後仍展開既有 10 dB 判斷',async()=>{
  const {root}=await loaded();
  for(const value of ['periodic',['periodic']]){
    const out=root.NoiseMain.prepare({...base,noiseGeneralSpecialAssessment:value});
    assert.equal(out.noiseShowGeneralBg10,'yes');
    assert.match(out.noiseValidation,/10 dB/);
  }
});

test('4.9.32 取消特殊評定會清除特殊子欄位與舊量測資料',async()=>{
  const {root}=await loaded();
  const before={...base,noiseGeneralSpecialAssessment:['periodic'],noiseGeneralBg10:'yes',noiseGeneralSpread:'gt5',noiseGeneralMethod:'l5',noiseGeneralMethodText:'old',noiseValueFull:'65',noiseBgFullMode:'measured',noiseBgFull:'45'};
  const after=root.NoiseMain.resetChange(before,{...before,noiseGeneralSpecialAssessment:[]});
  for(const key of ['noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText','noiseValueFull','noiseBgFullMode','noiseBgFull'])assert.equal(after[key],'',key);
});

test('4.9.32 既有 checklist renderer 未勾選讀空陣列、勾選讀 periodic',async()=>{
  const env=await loaded();env.context.document=documentStub();env.run('src/field-renderer.js');
  const template={id:'checkbox-fixture',fields:[{id:'special',label:'特殊評定',type:'checklist',missing:'尚待確認',separator:'、',emptyValue:'',items:[{id:'periodic',label:'使用特殊評定'}]}]};
  const view=env.root.FieldRenderer.render(template,()=>{});
  const box=nodes(view.element).find(n=>n.tagName==='INPUT'&&n.value==='periodic');
  assert.ok(box);assert.deepEqual(Array.from(view.read().special),[]);
  box.checked=true;box.dispatch('change',{target:box});assert.deepEqual(Array.from(view.read().special),['periodic']);
  box.checked=false;box.dispatch('change',{target:box});assert.deepEqual(Array.from(view.read().special),[]);
});

test('4.9.32 手機 Wizard 仍將特殊評定置於 Leq 前，且不再把它視為 select 下拉',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','src','noise-mobile-wizard.js'),'utf8');
  const start=source.indexOf("id:'measurement'");const section=source.slice(start,start+1800);
  assert.ok(section.indexOf("'noiseGeneralSpecialAssessment'")>=0);
  assert.ok(section.indexOf("'noiseGeneralSpecialAssessment'")<section.indexOf("prefixes:['noiseValue'"));
  const guidance=fs.readFileSync(path.join(__dirname,'..','src','noise-method-guidance.js'),'utf8');
  assert.match(guidance,/checklist\('noiseGeneralSpecialAssessment','特殊評定',\[\{id:'periodic',label:'使用特殊評定'\}\]/);
  const dropdownBlock=source.slice(source.indexOf('mobileDropdownFields'),source.indexOf('for(const field'));
  assert.doesNotMatch(dropdownBlock,/noiseGeneralSpecialAssessment/);
});
