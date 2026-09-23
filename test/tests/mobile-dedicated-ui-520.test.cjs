const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('5.2 dedicated mobile flow is loaded and cached offline',()=>{
  const html=read('index.html');
  const sw=read('service-worker.js');
  assert.match(html,/src\/mobile-inspection-flow\.js\?v=5\.1\.1/);
  assert.match(sw,/src\/mobile-inspection-flow\.js/);
});

test('5.2 mobile flow covers Water Waste and Air without persistent storage',()=>{
  const js=read('src/mobile-inspection-flow.js');
  for(const token of ['water-v2-host','waste-v1-host','air-v1-host','ia-mobile-flow-shell','ia-mobile-flow-nav'])assert.ok(js.includes(token),token);
  assert.match(js,/污染排查\|對象查核/);
  assert.match(js,/來源待查\|稽查對象已知/);
  assert.match(js,/首頁／案件大類/);
  assert.match(js,/第 .*步/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB/);
  assert.doesNotThrow(()=>new vm.Script(js));
});

test('5.2 mobile CSS gives a real full-height step UI while desktop remains separate',()=>{
  const css=read('src/styles.css');
  assert.match(css,/5\.2 shared dedicated mobile UI for Water \/ Waste \/ Air/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/\.ia-mobile-flow-shell/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css,/\.ia-mobile-flow-content/);
  assert.match(css,/overflow-y:auto/);
});

test('Air restaurant templates also use dedicated mobile wizard steps',()=>{
  const regular=read('data/templates/restaurant-odor.js');
  const sampling=read('data/templates/restaurant-odor-sampling-pending.js');
  assert.match(regular,/mobileWizard/);
  assert.match(regular,/餐飲油煙手機逐步流程/);
  assert.match(sampling,/mobileWizard/);
  assert.match(sampling,/周界異味採樣手機逐步流程/);
});

test('Noise replaces useless bottom scroll-to-top with Home while restaurant keeps scroll-to-top',()=>{
  const app=read('src/sentence-app.js');
  assert.match(app,/active\.categoryId==='noise'[\s\S]*?\{label:'首頁',action:\(\)=>\{viewMode='home';render\(\);\}\}/);
  assert.match(app,/: \{label:'回到最上面',action:scrollToTop\}/);
});
