const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loaded}=require('./helpers.cjs');

const base={
  mainContinuity:'measurable',mainSpecial:'ordinary',
  mainDate:'2026-09-12',mainTime:'10:00',mainZone:'3',mainAct:'none',
  mainArticle9Scope:'yes',mainMeasure:'yes',
  a9Type:'business',a9Subject:'測試場所',a9Source:'測試設備',
  a9Rain:'no',a9Home:'no',a9Value_leq:'20',a9WindSpeed:'1.0'
};

async function setup(){
  const e=await loaded();
  const template=e.config.templates.find(t=>t.id==='noise-main');
  const workflow=e.root.TemplateWorkflows.noiseMain;
  return {...e,template,workflow};
}

test('4.9.1 收掉重複近鄰生活噪音入口，但第6條內建分流仍可使用',async()=>{
  const {template,workflow}=await setup();
  assert.equal(template.moduleVersion,'4.9.1');
  assert.ok(!template.relatedTemplates||template.relatedTemplates.length===0);
  const out=workflow.prepare({mainContinuity:'article6',noiseType:'water',hasCommittee:'yes'});
  assert.equal(out.mainRoute,'article6');
  assert.equal(out.mainBlocked,'no');
  assert.ok(out.mainRecord);
  assert.ok(out.mainReply);
});

test('4.9.1 主管機關指定全頻測點不是周界1公尺外，1公尺是最近建築物牆面線距離',async()=>{
  const {root,workflow}=await setup();
  const point=root.NOISE_ARTICLE9_RULES.measurement.points.no.record;
  assert.match(point,/噪音源周界外/);
  assert.match(point,/最近建築物牆面線1公尺以上/);
  assert.doesNotMatch(point,/周界1公尺外/);
  const out=workflow.prepare(base);
  assert.equal(out.mainBlocked,'no');
  assert.match(out.mainRecord,/最近建築物牆面線1公尺以上/);
  assert.match(out.mainGuide,/主管機關指定/);
});

test('4.9.1 低頻不得以主管機關指定周界外測點取代陳情人指定室內地點',async()=>{
  const {workflow,root}=await setup();
  const out=workflow.prepare({...base,a9Value_leqLF:'20'});
  assert.equal(root.NoisePointV491.lowPointInvalid({...base,a9Value_leqLF:'20'}),true);
  assert.equal(out.mainBlocked,'yes');
  assert.equal(out.mainRecord,'');
  assert.equal(out.mainReply,'');
  assert.match(out.mainValidation,/低頻.*室內地點/);
});

test('4.9.1 低頻於陳情人指定居住生活室內地點可繼續既有量測核心',async()=>{
  const {workflow}=await setup();
  const out=workflow.prepare({...base,a9Home:'yes',a9Value_leq:'',a9Value_leqLF:'20'});
  assert.equal(out.mainBlocked,'no');
  assert.match(out.mainRecord,/陳情人指定之居住生活地點/);
  assert.match(out.mainGuide,/室內地點/);
});

test('4.9.1 擴音設施公文改用3公尺以上主管機關指定位置',async()=>{
  const {workflow}=await setup();
  const out=workflow.prepare({...base,a9Type:'speaker',a9Home:'no',a9Value_leq:'20'});
  assert.equal(out.mainBlocked,'no');
  assert.match(out.mainRecord,/水平投影3公尺以上/);
  assert.match(out.mainGuide,/擴音設施/);
});

test('4.9.1 測點層不引入瀏覽器持久儲存',()=>{
  for(const file of ['src/noise-v491.js','data/templates/noise-main.js']){
    const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|IndexedDB/);
  }
});
