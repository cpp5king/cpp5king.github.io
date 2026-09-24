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
  assert.match(html,/src\/mobile-inspection-flow\.js\?v=5\.2\.6/);
  assert.match(html,/src\/mobile-wizard\.js\?v=5\.2\.6/);
  assert.match(html,/src\/styles\.css\?v=5\.2\.6/);
  assert.match(html,/src\/sentence-app\.js\?v=5\.2\.6/);
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
  assert.match(js,/root\.scrollTo/);
  assert.doesNotThrow(()=>new vm.Script(js));
});

test('5.2 mobile CSS gives a real full-height step UI while desktop remains separate',()=>{
  const css=read('src/styles.css');
  assert.match(css,/5\.2 shared dedicated mobile UI for Water \/ Waste \/ Air/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/\.ia-mobile-flow-shell/);
  assert.match(css,/\.ia-mobile-flow-content/);
  assert.match(css,/overflow:visible/);
  assert.match(css,/position:fixed;left:0;right:0;bottom:0/);
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

test('all mobile flows expose Air-style legal assessment and current-content actions',()=>{
  const wizard=read('src/mobile-wizard.js');
  const shared=read('src/mobile-inspection-flow.js');
  const css=read('src/styles.css');
  for(const label of ['法規研判','整理目前內容']){
    assert.match(wizard,new RegExp(label));
    assert.match(shared,new RegExp(label));
  }
  assert.match(wizard,/ia-mobile-flow-tools/);
  assert.match(wizard,/ia-mobile-tool/);
  assert.match(wizard,/首頁／案件大類/);
  assert.match(css,/body:has\(\.sentence-form\[data-mobile-wizard="yes"\]\) \.module-sticky-actions\{[\s\S]*?display:none!important/);
});

test('mobile shell reattaches after Water Waste or Air rerenders replace host contents',()=>{
  const js=read('src/mobile-inspection-flow.js');
  assert.match(js,/const mounted=host\.classList\.contains\('ia-mobile-flow-shell'\)/);
  assert.match(js,/const shellAlive=!!host\.querySelector\(':scope > \.ia-mobile-flow-header'\)/);
  assert.match(js,/if\(mounted&&!shellAlive\)/);
  assert.match(js,/host\.classList\.remove\('ia-mobile-flow-shell'\)/);
});

test('5.2 mobile home keeps current case and module choices above the fold',()=>{
  const app=read('src/sentence-app.js');
  const css=read('src/styles.css');
  assert.match(app,/mobile-home-shell/);
  assert.match(app,/繼續查核/);
  assert.match(app,/mobile-home-module-grid/);
  assert.match(app,/mobile-home-minor-actions/);
  assert.match(app,/📱 可加入主畫面離線使用/);
  assert.match(app,/matchMedia\?\.\('\(max-width:760px\)'\)/);
  assert.match(app,/testSite\?'稽查助手 5\.2\.1 視覺測試版':appMeta\.label/);
  assert.match(css,/5\.2 compact mobile home: keep primary actions above the fold/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/main>\.mobile-install\{[\s\S]*?display:none!important/);
});

test('5.2 mobile category and template pages use compact intermediary navigation',()=>{
  const app=read('src/sentence-app.js');
  const css=read('src/styles.css');
  assert.match(app,/mobileIntermediaryHeader/);
  assert.match(app,/mobile-stage-shell/);
  assert.match(app,/mobile-stage-choice-grid/);
  assert.match(app,/mobile-stage-template-list/);
  assert.match(app,/mobile-stage-quicknav/);
  assert.doesNotMatch(app,/mobile-stage-more/);
  assert.doesNotMatch(app,/canExportCurrentCase/);
  assert.match(app,/viewMode==='case'[\s\S]*?匯出案件/);
  assert.match(app,/const mobileIntermediary=isMobileViewport\(\)&&\['category','template'\]\.includes\(viewMode\)/);
  assert.match(css,/5\.2 compact mobile intermediary pages: category \/ template/);
  assert.match(css,/body\[data-view="category"\]>header/);
  assert.match(css,/body\[data-view="template"\] main>\.mobile-install/);
  assert.match(css,/\.mobile-stage-choice-grid\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('mobile intermediary shows Home New Law and Import directly without More menu',()=>{
  const app=read('src/sentence-app.js');
  const css=read('src/styles.css');
  assert.match(app,/mobile-stage-quicknav/);
  for(const label of ['首頁','新增案件','法規','匯入案件'])assert.match(app,new RegExp(`button\\('${label}'`));
  assert.doesNotMatch(app,/const more=el\('details','', 'mobile-stage-more'\)/);
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test('5.2.1 visual polish uses stone canvas and a graphite Home identity',()=>{
  const css=read('src/styles.css');
  assert.match(css,/5\.2\.1 visual polish: warm-stone canvas \+ graphite home identity/);
  assert.match(css,/--ia-bg:#efede8/);
  assert.match(css,/body\[data-module="home"\][\s\S]*?--module-color:#57534e/);
  assert.match(css,/\.mobile-home-module-grid button\[data-module="air"\]/);
  assert.match(css,/\.mobile-home-module-grid button\[data-module="water"\]/);
  assert.match(css,/\.mobile-home-module-grid button\[data-module="noise"\]/);
  assert.match(css,/\.mobile-home-module-grid button\[data-module="waste"\]/);
  assert.match(css,/\.ia-mobile-flow-content[\s\S]*?background:#efede8!important/);
  assert.match(css,/\.mobile-wizard-content,[\s\S]*?background:#efede8!important/);
});

test('5.2.1 Air update-now is attached to datetime fields instead of a standalone row',()=>{
  const air=read('src/air-v1-ui.js');
  const css=read('src/air-v1-ui.css');
  assert.match(air,/function dateTimeField\(/);
  assert.ok((air.match(/dateTimeField\(/g)||[]).length>=5);
  assert.doesNotMatch(air,/air-row-actions[^\n]{0,220}更新為現在/);
  assert.match(css,/air-datetime-row/);
  assert.match(css,/air-now-btn/);
  assert.match(air,/out\.version='5\.2\.1'/);
});

test('5.2.1 Home exposes a standalone law library chooser',()=>{
  const app=read('src/sentence-app.js');
  const css=read('src/styles.css');
  assert.match(app,/function openHomeLawLibrary\(\)/);
  assert.match(app,/先選擇法規類別/);
  for(const id of ['water','noise','waste','air'])assert.match(app,new RegExp(`id:'${id}'`));
  assert.match(app,/viewMode==='home'&&root\.LawReferenceUI\?\.open/);
  assert.match(app,/minor\.append\(button\('法規',openHomeLawLibrary,true\)\)/);
  assert.match(css,/5\.2\.1 Home law entry/);
  assert.match(css,/\.home-law-grid/);
});
