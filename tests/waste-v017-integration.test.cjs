const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');

function runtime(){
  const context={window:{},globalThis:{},console};
  context.globalThis=context.window;
  vm.createContext(context);
  for(const f of ['data/waste-rules.js','src/waste-model.js','src/waste-law.js','src/waste-v1-ui.js','src/case-file.js']){
    vm.runInContext(read(f),context,{filename:f});
  }
  return context.window;
}

test('5.0 shell loads original Waste V0.1.7 runtime in dependency order and caches it offline',()=>{
  const index=read('index.html'),sw=read('service-worker.js'),catalog=read('data/templates/catalog.js');
  for(const f of ['data/waste-rules.js','src/waste-model.js','src/waste-law.js','src/waste-v1-ui.js','src/waste-v1-ui.css'])assert.ok(fs.existsSync(path.join(ROOT,f)),f);
  const order=['data/waste-rules.js','src/waste-model.js','src/waste-law.js','src/waste-v1-ui.js'].map(x=>index.indexOf(x));
  assert.ok(order.every(x=>x>=0));
  assert.deepEqual(order.slice().sort((a,b)=>a-b),order);
  for(const f of ['data/waste-rules.js','src/waste-model.js','src/waste-law.js','src/waste-v1-ui.js','src/waste-v1-ui.css'])assert.match(sw,new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(catalog,/"id": "waste"[\s\S]*?"status": "active"/);
});

test('integrated Waste runtime is the supplied 4.9.51 V0.1.7 P1 build',()=>{
  const root=runtime();
  assert.equal(root.WasteModel.VERSION,'waste-v0.1.7');
  const status=root.WasteLaw.rulePackStatus();
  assert.equal(status.valid,true);
  assert.equal(status.meta.version,'2026.09.21-v0.3-p1-fix');
  assert.equal(status.articleCount,91);
  assert.equal(root.WasteV1UI.version,'waste-v0.1.7');
});

test('5.0 adapter preserves actual Waste state through integrated case JSON',()=>{
  const root=runtime();
  const state=root.WasteModel.createState();
  state.entryMode='known';
  const subject=root.WasteModel.addSubject(state,{name:'甲事業',roles:['物質／廢棄物產生者']});
  const batch=root.WasteModel.addBatch(state,{label:'A批',materialKind:'廢塑膠',wasteIdentity:'已有事實支持',classification:'事業廢棄物'});
  root.WasteModel.addProducerRelation(state,{batchId:batch.id,subjectId:subject.id,status:'已確認產生者'});
  root.WasteV1UI.restore(state);
  const config={categories:[{id:'waste',status:'active'}],caseTypes:[],templates:[]};
  const payload={categoryId:'waste',caseTypeId:'',templateId:'',inputs:{},outputs:null,stale:false,wasteV1State:root.WasteV1UI.snapshot()};
  const text=root.CaseFile.serialize(payload,{version:'5.0.0'});
  const parsed=root.CaseFile.parse(text,config).state.wasteV1State;
  assert.equal(parsed.entryMode,'known');
  assert.equal(parsed.batches[0].classification,'事業廢棄物');
  assert.equal(parsed.producerRelations[0].status,'已確認產生者');
});

test('Waste UI adapter adds mount/snapshot contract without persistent browser storage',()=>{
  const ui=read('src/waste-v1-ui.js');
  assert.match(ui,/root\.WasteV1UI=Object\.freeze/);
  assert.match(ui,/mount,unmount,hasData,snapshot,restore,reset,validateState/);
  assert.doesNotMatch(ui,/localStorage\s*[.(]/);
  assert.doesNotMatch(ui,/indexedDB\s*[.(]/);
  assert.match(ui,/PP-IA-41-7F3C9A21|M\.validateImport/);
});

test('Waste 4.9.51 CSS is namespaced so it does not globally restyle Water or Noise',()=>{
  const css=read('src/waste-v1-ui.css');
  assert.match(css,/\.waste-v017-host \.card/);
  assert.match(css,/\.waste-v017-host button/);
  assert.doesNotMatch(css,/(^|})button\s*\{/m);
  assert.doesNotMatch(css,/(^|})\.card\s*\{/m);
});
