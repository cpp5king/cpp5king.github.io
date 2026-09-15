const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('4.9.33 水污主入口改為獨立 V2，舊入口只保留隱藏相容',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(read('data/templates/catalog.js'),context);
  const water=context.window.INSPECTION_CONFIG.caseTypes.filter(x=>x.categoryId==='water');
  assert.equal(water.filter(x=>!x.hidden).length,1);
  assert.equal(water.find(x=>!x.hidden).id,'water-v2-inspection');
  assert.equal(water.find(x=>!x.hidden).directTemplateId,'water-v2');
  assert.deepEqual(Array.from(water.filter(x=>x.hidden).map(x=>x.id)),['water-field-inspection','water-inspection']);
});

test('主頁載入全新 Water V2 app/css，不再載入舊 bridge',()=>{
  const html=read('index.html');
  assert.match(html,/src\/water-v2\.css\?v=4\.9\.33/);
  assert.match(html,/src\/water-v2-app\.js\?v=4\.9\.33/);
  assert.doesNotMatch(html,/src\/water-v2-ui\.js/);
  assert.ok(html.indexOf('water-v2-app.js')<html.indexOf('sentence-app.js'));
});

test('主 App 支援 custom renderer 並隱藏 legacy case type',()=>{
  const app=read('src/sentence-app.js');
  assert.match(app,/!item\.hidden/);
  assert.match(app,/template\.customRenderer/);
  assert.match(app,/CustomRenderers/);
});

test('Water V2 為 W00-W11 單一 structured session 工作區',()=>{
  const src=read('src/water-v2-app.js');
  for(let i=0;i<=11;i++)assert.match(src,new RegExp(`W${String(i).padStart(2,'0')}`));
  assert.match(src,/waterV2StateJson/);
  assert.match(src,/WaterV2Session/);
  assert.match(src,/WaterV2Workflow/);
  assert.match(src,/WaterLegalAdapter/);
  assert.match(src,/water\.flow\.bypass_direct_relation/);
  assert.match(src,/water\.control_zone\.status/);
  assert.match(src,/water\.soil\.contact_mode/);
  assert.match(src,/water\.emergency\.notification_time/);
  assert.match(src,/快篩只用於查源/);
  assert.match(src,/未知 ≠ 否定/);
});

test('離線 app shell 包含 Water V2 新入口、樣式與模板',()=>{
  const sw=read('service-worker.js');
  for(const file of ['src/water-v2.css','src/water-v2-app.js','data/templates/water-v2.js'])assert.ok(sw.includes(file),file);
  assert.ok(!sw.includes('src/water-v2-ui.js'));
  assert.match(sw,/test-water-v2-rebuild-4\.9\.33/);
});

test('Water V2 template 使用 custom renderer，不 handoff 到舊水污流程',()=>{
  const context=vm.createContext({window:{INSPECTION_CONFIG:{templates:[]}}});
  vm.runInContext(read('data/templates/water-v2.js'),context);
  const t=context.window.INSPECTION_CONFIG.templates[0];
  assert.equal(t.id,'water-v2');
  assert.equal(t.customRenderer,'waterV2');
  assert.equal(t.handoff,undefined);
  assert.equal(t.fields[0].id,'waterV2StateJson');
});
