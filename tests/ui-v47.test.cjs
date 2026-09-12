const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {loaded}=require('./helpers.cjs');
test('4.7 UI profile 依寬度區分手機、平板、桌機',()=>{const code=fs.readFileSync('src/ui-profile.js','utf8');for(const [w,expected] of [[390,'mobile'],[900,'tablet'],[1400,'desktop']]){const c={window:{innerWidth:w}};vm.createContext(c);vm.runInContext(code,c);assert.equal(c.window.UiProfile.current(),expected);}});
test('4.7 水污兩種介面共用原 workflow 並啟用手機聚焦模式',async()=>{const {config}=await loaded();for(const id of ['water-main','water-field']){const t=config.templates.find(x=>x.id===id);assert.equal(t.mobileFocusMode,true);assert.ok(['waterMain','waterField'].includes(t.workflow));}});
test('4.7 手機聚焦只屬呈現層，不改 Water Core 規則結果',async()=>{const {root,config}=await loaded();const t=config.templates.find(x=>x.id==='water-main');const input={waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes',waterMatterType:'wastewater',waterWastewaterStatus:'yes',waterActualDischarge:'yes',waterDestination:'surfaceWater',waterSurfaceWaterConfirmed:'unknown',waterInvestigationComplete:'yes'};const n=root.DraftEngine.normalize(t,input);assert.equal(n.waterRuleStatus,'insufficient');assert.match(n.waterFinalConclusionText,/C｜事證不足/);});
const {documentStub,nodes}=require('./dom-stub.cjs');
test('4.7 手機聚焦模式實際折疊已完成題並標示下一題',async()=>{
  const e=await loaded();e.root.innerWidth=390;const doc=documentStub();e.context.document=doc;e.run('src/field-renderer.js');
  const t=e.config.templates.find(x=>x.id==='water-field');
  const rendered=e.root.FieldRenderer.render(t,()=>{});
  rendered.write({waterInspectionDate:'2026-09-11',waterSubjectType:'nonBusiness'});
  const all=nodes(rendered.element);
  const completed=all.filter(n=>n['data-ui-completed']==='yes');
  const current=all.filter(n=>n['data-ui-current']==='yes');
  assert.ok(completed.length>=2);
  assert.equal(current.length,1);
  assert.ok(completed.some(n=>n['data-ui-hidden']==='yes'));
});
