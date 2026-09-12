const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loaded}=require('./helpers.cjs');

const legacyBase={
  mainDate:'2026-09-11',mainTime:'10:00',mainZone:'3',mainAct:'none',
  mainMeasure:'yes',a9Type:'business',a9Subject:'88',a9Source:'77',
  a9Rain:'no',a9Home:'no',a9Value_leq:'20',a9WindSpeed:'1.4'
};

async function setup(){
  const e=await loaded();
  const template=e.config.templates.find(t=>t.id==='noise-main');
  const workflow=e.root.TemplateWorkflows.noiseMain;
  return {...e,template,workflow};
}

test('4.9.0 噪音 V2 先做第6條／特殊類型前置辨別',async()=>{
  const {root,workflow}=await setup();
  let out=workflow.prepare({});
  assert.equal(out.mainRoute,'routing');
  assert.match(out.mainGuide,/不具持續性或不易量測/);

  out=workflow.prepare({mainContinuity:'measurable'});
  assert.equal(out.mainRoute,'routing');
  assert.match(out.mainGuide,/交通、航空或軍事/);

  for(const mainSpecial of ['traffic','aviation','military']){
    out=workflow.prepare({mainContinuity:'measurable',mainSpecial});
    assert.equal(out.mainRoute,'special');
    assert.equal(out.mainBlocked,'yes');
    assert.match(out.mainGuide,/法定程序分流/);
    assert.equal(out.mainShowCore,'no');
  }
  assert.equal(root.NOISE_TEXTS.main.article6Guide.includes('噪音管制法第6條'),true);
});

test('4.9.0 第6條分流沿用既有近鄰案件文字，不進第8／9條量測',async()=>{
  const {workflow}=await setup();
  const out=workflow.prepare({mainContinuity:'article6',noiseType:'water',hasCommittee:'yes'});
  assert.equal(out.mainRoute,'article6');
  assert.equal(out.mainBlocked,'no');
  assert.ok(out.mainRecord);
  assert.ok(out.mainReply);
  assert.equal(out.mainShowCore,'no');
  assert.equal(out.mainShowArticle9Scope,'no');
  assert.equal(out.mainShowMeasure,'no');
  assert.match(out.mainGuide,/警察機關/);
});

test('4.9.0 一般案件第8條不成立後，先確認第9條適用範圍再量測',async()=>{
  const {workflow}=await setup();
  const common={...legacyBase,mainContinuity:'measurable',mainSpecial:'ordinary',mainArticle9Scope:''};
  const out=workflow.prepare({...common,mainMeasure:'',a9Type:'',a9Subject:'',a9Source:'',a9Rain:'',a9Home:'',a9Value_leq:'',a9WindSpeed:''});
  assert.equal(out.mainRoute,'article9');
  assert.equal(out.mainShowArticle9Scope,'yes');
  assert.equal(out.mainShowMeasure,'no');
  assert.match(out.mainGuide,/第9條/);

  const excluded=workflow.prepare({...common,mainArticle9Scope:'no',mainMeasure:'',a9Type:'',a9Subject:'',a9Source:'',a9Rain:'',a9Home:'',a9Value_leq:'',a9WindSpeed:''});
  assert.equal(excluded.mainShowMeasure,'no');
  assert.equal(excluded.mainBlocked,'yes');
  assert.match(excluded.mainGuide,/不進入第9條|回查音源性質/);

  const included=workflow.prepare({...legacyBase,mainContinuity:'measurable',mainSpecial:'ordinary',mainArticle9Scope:'yes'});
  assert.equal(included.mainRoute,'article9');
  assert.equal(included.mainShowMeasure,'yes');
  assert.equal(included.mainShowType,'yes');
});

test('4.9.0 舊 3.7.1 案件輸入自動遷移，不破壞既有第8／9條結果',async()=>{
  const {root,workflow}=await setup();
  const out=workflow.prepare(legacyBase);
  assert.equal(out.mainContinuity,'measurable');
  assert.equal(out.mainSpecial,'ordinary');
  assert.equal(out.mainArticle9Scope,'yes');
  assert.equal(out.mainRoute,'article9');
  assert.equal(out.mainBlocked,'no');
  const measure=root.NoiseArticle9Measurement.assess(root.NoiseMain.article9(out));
  assert.equal(measure.lookup.period,'day');
  assert.equal(measure.items[0].standard,67);
});

test('4.9.0 模組版本標記與穩定核心版本並存',async()=>{
  const {template,config}=await setup();
  assert.equal(template.version,'3.7.1');
  assert.equal(template.moduleVersion,'4.9.0');
  for(const id of ['noise-case','noise-neighbor'])assert.equal(config.templates.find(t=>t.id===id).version,'3.7.1');
});

test('4.9.0 前置分流不引入瀏覽器持久儲存',()=>{
  for(const file of ['src/noise-v490.js','data/templates/noise-main.js']){
    const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|IndexedDB/);
  }
});
