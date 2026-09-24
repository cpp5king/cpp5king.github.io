const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const ROOT=path.resolve(__dirname,'..');
function loadRuntime(){
  const root={console,Date};
  root.window=root; root.globalThis=root;
  root.TemplateWorkflows={}; root.TemplatePatches={}; root.INSPECTION_CONFIG={templates:[]};
  const context=vm.createContext(root);
  const files=[
    'data/texts/noise-common.js','data/texts/noise-templates.js','data/texts/noise-main.js',
    'data/texts/noise-article8.js','data/texts/noise-article9.js','data/texts/noise-neighbor.js','data/texts/noise-ui.js','data/texts/noise-documents.js','data/texts/noise-result-map.js','src/noise-text.js',
    'data/rules/noise-article8.js','data/rules/noise-article9.js','src/noise-zone.js','src/noise-main.js',
    'src/noise-method-guidance.js','src/noise-composite.js','src/noise-boundary.js','src/noise-priority-routing.js','src/noise-approved-drafts.js',
    'data/templates/noise-main.js','src/draft-engine.js'
  ];
  for(const rel of files)vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
  for(const patch of Object.values(root.TemplatePatches))if(typeof patch==='function')patch(root.INSPECTION_CONFIG);
  return root;
}
const base=(date,time,zone='4',extra={})=>({noiseNature:'measurable',noiseSpecial:'ordinary',noiseDate:date,noiseTime:time,noiseZoneMode:'direct',noiseZone:zone,...extra});

function optionIds(root){
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  return t.fields.find(x=>x.id==='noiseA8Act').options.map(x=>x.id);
}

test('第8條前端移除例假日主要問項與重複候選摘要，只保留篩選後選項',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.some(x=>x.id==='noiseA8CandidateText'),false);
  const holiday=t.fields.find(x=>x.id==='noiseHoliday');
  assert.equal(holiday.type,'computed');
  assert.equal(holiday.display,false);
  const a8=t.fields.find(x=>x.id==='noiseA8Act');
  assert.equal(a8.label,'依目前日期、時間及管制區可能適用之第8條禁止行為');
  assert.deepEqual(JSON.parse(JSON.stringify(a8.displayWhen)),{field:'noiseShowA8Choice',value:'yes'});
});

test('稽查時間明確使用24小時制00至23時選擇器',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const time=t.fields.find(x=>x.id==='noiseTime');
  assert.equal(time.label,'稽查時間（24小時制）');
  assert.equal(time.type,'time');
  assert.deepEqual(JSON.parse(JSON.stringify(time.timePicker)),{empty:'—',hour:'時',minute:'分'});
  const renderer=fs.readFileSync(path.join(ROOT,'src/field-renderer.js'),'utf8');
  assert.match(renderer,/make\('Hour',24/);
});

test('一般週末／平日由日期自動判斷，不要求手動回答假日',()=>{
  const root=loadRuntime();
  let state=root.NoiseMain.holidayState(base('2026-09-06','13:00'));
  assert.equal(state.auto,'yes');
  assert.equal(state.effective,'yes');
  state=root.NoiseMain.holidayState(base('2026-09-07','13:00'));
  assert.equal(state.auto,'no');
  assert.equal(state.effective,'no');
});

test('特殊日曆修正只在假日會影響第8條候選的時段顯示',()=>{
  const root=loadRuntime();
  assert.equal(root.NoiseMain.prepare(base('2026-09-07','00:00')).noiseShowHolidayOverride,'no');
  assert.equal(root.NoiseMain.prepare(base('2026-09-07','13:00')).noiseShowHolidayOverride,'yes');
  assert.equal(root.NoiseMain.prepare(base('2026-09-07','21:00')).noiseShowHolidayOverride,'yes');
  assert.equal(root.NoiseMain.prepare(base('2026-09-07','15:00')).noiseShowHolidayOverride,'no');
});

test('平日13時第四類無候選；特殊假日修正後只顯示伴唱與營建工程',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare(base('2026-09-07','13:00'));
  assert.equal(out.noiseHoliday,'no');
  assert.equal(out.noiseShowA8Choice,'no');
  assert.equal(out.noiseA8Act,'none');
  out=root.NoiseMain.prepare(base('2026-09-07','13:00','4',{noiseHolidayOverride:'yes'}));
  assert.equal(out.noiseHoliday,'yes');
  assert.equal(out.noiseShowA8Choice,'yes');
  assert.deepEqual(JSON.parse(JSON.stringify(optionIds(root))),['karaoke','construction','none']);
});

test('週日13時自動套用假日候選；補班修正後候選歸零',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare(base('2026-09-06','13:00'));
  assert.equal(out.noiseHoliday,'yes');
  assert.equal(out.noiseShowA8Choice,'yes');
  assert.deepEqual(JSON.parse(JSON.stringify(optionIds(root))),['karaoke','construction','none']);
  out=root.NoiseMain.prepare(base('2026-09-06','13:00','4',{noiseHolidayOverride:'no'}));
  assert.equal(out.noiseHoliday,'no');
  assert.equal(out.noiseShowA8Choice,'no');
});

test('00時第一類與第四類只呈現系統篩選後選項，末項為以上皆非',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare(base('2026-09-07','00:00','1'));
  assert.equal(out.noiseShowA8Choice,'yes');
  let ids=optionIds(root);
  assert.equal(ids.length,11);
  assert.equal(ids.at(-1),'none');
  let t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.find(x=>x.id==='noiseA8Act').options.at(-1).label,'以上皆非');
  out=root.NoiseMain.prepare(base('2026-09-07','00:00','4'));
  ids=optionIds(root);
  assert.deepEqual(JSON.parse(JSON.stringify(ids)),['fireworks','outdoorSpeaker','karaoke','construction','leafBlower','none']);
});

test('日期改變時清除特殊日曆修正，避免沿用到另一案件日期',()=>{
  const root=loadRuntime();
  const before=base('2026-09-07','13:00','4',{noiseHolidayOverride:'yes'});
  const after={...before,noiseDate:'2026-09-08'};
  const next=root.NoiseMain.resetChange(before,after);
  assert.equal(next.noiseHolidayOverride,'');
});
