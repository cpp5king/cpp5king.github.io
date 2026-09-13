const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function loadRuntime(){
  const root={console,Date}; root.window=root; root.globalThis=root;
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
const dateTime={noiseDate:'2026-09-13',noiseTime:'00:05'};
const ordinary={...dateTime,noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'direct',noiseZone:'1'};

test('日期時間後第一個實質題目是可量測性，特殊來源在其後',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const ids=t.fields.filter(f=>!['computed','fixed'].includes(f.type)).map(f=>f.id);
  assert.deepEqual(JSON.parse(JSON.stringify(ids.slice(0,5))),['noiseDate','noiseTime','noiseNature','noiseDifficultSource','noiseCommunityCommittee']);
  assert.ok(ids.indexOf('noiseSpecial')>ids.indexOf('noiseNature'));
  const nature=t.fields.find(f=>f.id==='noiseNature');
  assert.equal(nature.displayWhen.field,'noiseShowNatureFront');
  const special=t.fields.find(f=>f.id==='noiseSpecial');
  assert.equal(special.displayWhen.field,'noiseShowSourceRouting');
});

test('第8條妨害安寧獨立欄位已從前端移除',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.some(f=>f.id==='noiseA8Disturbance'),false);
});

test('只有日期時間時先要求判斷可量測性，不先問來源或管制區',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare(dateTime);
  assert.equal(out.noiseShowNatureFront,'yes');
  assert.equal(out.noiseShowSourceRouting,'no');
  assert.match(out.noiseValidation,/不具持續性或不易量測/);
  assert.equal(out.noiseShowGeneralSetup,'no');
});

test('不具持續性或不易量測直接進主管機關分流，不需來源、管制區、第8條',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({...dateTime,noiseNature:'difficult'});
  assert.equal(out.noiseShowSourceRouting,'no');
  assert.equal(out.noiseShowGeneralSetup,'no');
  assert.equal(out.noiseShowA8Choice,'no');
  assert.match(out.noiseValidation,/音源／聲音描述/);
  out=root.NoiseMain.prepare({...dateTime,noiseNature:'difficult',noiseDifficultSource:'水錘聲',noiseCommunityCommittee:'yes'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/工務局公寓大廈管理科/);
  assert.doesNotMatch(out.noiseGuide,/第8條未成立/);
});

test('具持續性且可量測後才要求主要噪音來源',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...dateTime,noiseNature:'measurable'});
  assert.equal(out.noiseShowSourceRouting,'yes');
  assert.match(out.noiseValidation,/主要噪音來源/);
  assert.equal(out.noiseShowGeneralSetup,'no');
});

test('一般可量測案件才進管制區與第8條動態候選',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare(ordinary);
  assert.equal(out.noiseShowGeneralSetup,'yes');
  assert.equal(out.noiseShowA8Choice,'yes');
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const ids=t.fields.find(f=>f.id==='noiseA8Act').options.map(o=>o.id);
  assert.ok(ids.includes('vehicleBusiness'));
});

test('選取第8條禁止行為後不再要求妨害安寧二次確認',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...ordinary,noiseA8Act:'vehicleBusiness'});
  assert.doesNotMatch(out.noiseValidation||'',/妨害他人生活環境安寧/);
  assert.ok(out.noiseBlocked==='no'||/例外|稽查對象|現場事實/.test(out.noiseValidation||''));
});

test('第8條以上皆非後直接進第9條，不再重問可量測性',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...ordinary,noiseA8Act:'none'});
  assert.equal(out.noiseShowA9,'yes');
  assert.match(out.noiseValidation,/第9條噪音源類型/);
});

test('特殊來源在可量測性之後仍維持專章分流',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...dateTime,noiseNature:'measurable',noiseSpecial:'landTransport'});
  assert.equal(out.noiseShowGeneralSetup,'no');
  assert.equal(out.noiseShowA8Choice,'no');
  assert.match(out.noiseRouteText,/第14條|陸上運輸/);
});

test('從可量測改成不易量測會清除舊的特殊來源與下游答案',()=>{
  const root=loadRuntime();
  const before={...ordinary,noiseA8Act:'none',noiseA9Type:'factory'};
  const after={...before,noiseNature:'difficult'};
  const next=root.NoiseMain.resetChange(before,after);
  assert.equal(next.noiseSpecial,'');
  assert.equal(next.noiseA8Act,'');
  assert.equal(next.noiseA9Type,'');
});

test('第一步選否後選主要噪音來源，不得清除可量測性或跳回第一步',()=>{
  const root=loadRuntime();
  const before={noiseDate:'2026-09-13',noiseTime:'00:05',noiseNature:'measurable',noiseSpecial:''};
  const after={...before,noiseSpecial:'ordinary'};
  const next=root.NoiseMain.resetChange(before,after);
  assert.equal(next.noiseNature,'measurable');
  assert.equal(next.noiseSpecial,'ordinary');
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const normalized=root.DraftEngine.normalize(t,next);
  assert.equal(normalized.noiseNature,'measurable');
  assert.equal(normalized.noiseSpecial,'ordinary');
  assert.equal(normalized.noiseShowNatureFront,'yes');
  assert.equal(normalized.noiseShowSourceRouting,'yes');
  assert.equal(normalized.noiseShowGeneralSetup,'yes');
});

test('可量測案件切換不同主要噪音來源仍保留第一步答案',()=>{
  const root=loadRuntime();
  for(const source of ['ordinary','vehicle','landTransport','civilAviation','militaryAviation']){
    const before={noiseDate:'2026-09-13',noiseTime:'00:05',noiseNature:'measurable',noiseSpecial:''};
    const next=root.NoiseMain.resetChange(before,{...before,noiseSpecial:source});
    assert.equal(next.noiseNature,'measurable',source);
    assert.equal(next.noiseSpecial,source,source);
  }
});
