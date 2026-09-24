const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');

function loadRuntime(){
  const root={console,Date};root.window=root;root.globalThis=root;
  root.TemplateWorkflows={};root.TemplatePatches={};root.INSPECTION_CONFIG={templates:[]};
  const context=vm.createContext(root);
  const files=[
    'data/texts/noise-common.js','data/texts/noise-templates.js','data/texts/noise-main.js','data/texts/noise-article8.js','data/texts/noise-article9.js',
    'data/texts/noise-neighbor.js','data/texts/noise-ui.js','data/texts/noise-documents.js','data/texts/noise-result-map.js','src/noise-text.js',
    'data/rules/noise-article8.js','data/rules/noise-article9.js','data/rules/noise-refactor-522.js',
    'src/noise-zone.js','src/noise-main.js','src/noise-method-guidance.js','src/noise-composite.js','src/noise-boundary.js',
    'src/noise-priority-routing.js','src/noise-mobile-wizard.js','src/noise-approved-drafts.js','src/noise-refactor-522.js',
    'data/templates/noise-main.js','src/draft-engine.js'
  ];
  for(const rel of files)vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
  for(const patch of Object.values(root.TemplatePatches))if(typeof patch==='function')patch(root.INSPECTION_CONFIG);
  return root;
}
const base={
  noiseContinuity:'yes',noiseMeasurability:'yes',noiseDate:'2026-09-24',noiseTime:'23:00',
  noiseSubject:'測試場所',noiseDirectZone:'2',noiseBoundaryInvolved:'no',noiseTargetRunning:'yes'
};

test('5.2.4 量測不再先選類型，直接顯示量測欄位',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.some(x=>x.id==='noiseMeasureBands'),false);
  assert.equal(t.mobileWizard.steps.some(step=>(step.fields||[]).includes('noiseMeasureBands')),false);
  assert.equal(t.fields.find(x=>x.id==='noiseValueFull').label,'測定均能音量（dB）');
  assert.equal(t.fields.find(x=>x.id==='noiseValueLeq').label,'測定均能音量（dB）');
  assert.equal(t.fields.find(x=>x.id==='noiseValueLmax').label,'測定最大音量（dB）');
  assert.equal(t.fields.find(x=>x.id==='noiseValueLow').label,'測定低頻音量（dB）');
});

test('稽查時間使用24小時制且移除左側舊簡易判斷',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.find(x=>x.id==='noiseTime').label,'稽查時間（24小時制）');
  assert.equal(t.fields.some(x=>x.id==='noiseQuickDecisionText'),false);
  assert.equal(t.quickActions.summaryField,null);
});

test('多重第9條查核方式只顯示本案候選',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noisePlaceType:'business',noiseSourceCategory:'speaker'});
  assert.equal(out.noise522ShowTargetChoice,'yes');
  assert.equal(out.noise522TargetCandidate_business,'yes');
  assert.equal(out.noise522TargetCandidate_speaker,'yes');
  for(const id of ['factory','entertainment','construction','renovation','otherFacility'])assert.equal(out['noise522TargetCandidate_'+id],'no');
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const f=t.fields.find(x=>x.id==='noiseTargetChoice');
  assert.equal(f.label,'本次查核方式');
  const visible=f.options.filter(x=>out[x.when.field]===x.when.value).map(x=>x.id);
  assert.deepEqual(JSON.parse(JSON.stringify(visible)),['business','speaker']);
});

test('第8條無例外禁止行為成立時不進量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'business',noiseSourceCategory:'equipment',
    noiseBehavior:'vehicleBusiness',noiseA8Disturbance:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條公告禁止行為成立');
  assert.equal(out.noiseOutcomeId,'article8.established');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.match(out.noise522Article8Text,/無公告例外條件/);
});

test('第8條先確認妨害安寧，未確認前不提前進量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'business',noiseSourceCategory:'equipment',
    noiseBehavior:'vehicleBusiness'
  });
  assert.equal(out.noise522ShowA8Disturbance,'yes');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.equal(out.noiseRouteText,'第8條妨害安寧事實待查');
});

test('第8條有例外且同時屬第9條時先保全量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'construction',noiseA8Disturbance:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條例外前量測證據保全');
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.equal(out.noiseShowA8Exception,'no');
  assert.match(out.noiseGuide,/先保全第9條量測證據/);
});

test('有例外案件完成量測後才顯示例外查核',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'construction',noiseA8Disturbance:'yes',
    noiseMeasurementPlace:'boundary',noiseRain:'no',noiseWind:'1',
    noiseValueLeq:'40',noiseValueLmax:'60'
  });
  assert.equal(out.noiseRouteText,'第8條例外事項待查');
  assert.equal(out.noiseShowA8Exception,'yes');
  assert.equal(out.noise522ShowMeasurement,'yes');
});

test('第8條例外成立後使用已保全資料續走第9條',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'construction',noiseA8Disturbance:'yes',
    noiseMeasurementPlace:'boundary',noiseRain:'no',noiseWind:'1',
    noiseValueLeq:'40',noiseValueLmax:'60',
    noiseA8Ex_construction_emergency:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條例外排除 → 第9條研判');
  assert.equal(out.noiseOutcomeId,'article9.compliant');
  assert.equal(out.noiseMeasureResultFull,'未高於適用標準');
});

test('第8條例外不成立時以第8條作主要處理',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'construction',noiseA8Disturbance:'yes',
    noiseMeasurementPlace:'boundary',noiseRain:'no',noiseWind:'1',
    noiseValueLeq:'40',noiseValueLmax:'60',
    noiseA8Ex_construction_emergency:'no',noiseA8Ex_construction_repair:'no',noiseA8Ex_construction_approved:'no'
  });
  assert.equal(out.noiseRouteText,'第8條公告禁止行為成立');
  assert.equal(out.noiseOutcomeId,'article8.established');
  assert.match(out.noiseRecord,/第8條/);
});

test('第9條只判斷實際填入的量測項目',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noiseTime:'13:00',noisePlaceType:'business',noiseSourceCategory:'equipment',
    noiseBehavior:'none',noiseMeasurementPlace:'complainant',noiseValueFull:'40'
  });
  assert.equal(out.noiseMeasureResultFull,'未高於適用標準');
  assert.equal(out.noiseMeasureResultLow,'');
  assert.doesNotMatch(out.noise522PendingText||'',/低頻判定所需資料/);
});

test('24小時制使用自製00到23時選擇器，不再依手機原生上午下午介面',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const time=t.fields.find(x=>x.id==='noiseTime');
  assert.deepEqual(JSON.parse(JSON.stringify(time.timePicker)),{empty:'—',hour:'時',minute:'分'});
  assert.match(time.help,/00～23/);
});

test('第8條例外欄位在表單與手機流程均排在量測之後',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const measurementIds=['noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFull','noiseBgLow'];
  const lastMeasure=Math.max(...measurementIds.map(id=>t.fields.findIndex(x=>x.id===id)));
  for(const id of ['noiseA8Ex_fireworks_government','noiseA8Ex_fireworks_festival']){
    assert.ok(t.fields.findIndex(x=>x.id===id)>lastMeasure,id);
  }
  const ids=t.mobileWizard.steps.map(x=>x.id);
  assert.ok(ids.indexOf('article8-exceptions')>ids.indexOf('measurement'));
  assert.ok(ids.indexOf('law')>ids.indexOf('article8-exceptions'));
  const exStep=t.mobileWizard.steps.find(x=>x.id==='article8-exceptions');
  assert.ok(exStep.fields.includes('noiseA8Ex_fireworks_government'));
  assert.ok(exStep.fields.includes('noiseA8Ex_fireworks_festival'));
});

test('營建工程機械設備遇到施放爆竹煙火，不因場所屬第9條而提前跳量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'fireworks',noiseA8Disturbance:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條例外事項待查');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.equal(out.noiseShowA8Exception,'yes');
  assert.match(out.noise522Article8Text,/不是同一噪音來源／作業/);
});

test('與第9條同一作業的營建工程第8條行為仍先保全量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'construction',noiseA8Disturbance:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條例外前量測證據保全');
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.equal(out.noiseShowA8Exception,'no');
  assert.match(out.noiseGuide,/同一噪音來源／作業/);
});

test('爆竹煙火例外成立後，才回到獨立的營建工程第9條量測',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...base,noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseBehavior:'fireworks',noiseA8Disturbance:'yes',
    noiseA8Ex_fireworks_government:'yes'
  });
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.equal(out.noiseRouteText,'第9條現場量測');
  assert.match(out.noise522Article8Text,/例外成立/);
});

test('版本為5.2.4且離線殼不再使用5.2.2檔號',()=>{
  const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
  const meta=fs.readFileSync(path.join(ROOT,'data/app-meta.js'),'utf8');
  assert.doesNotMatch(index,/v=5\.2\.2/);
  assert.match(sw,/VERSION='5\.2\.4'/);
  assert.match(meta,/version:'5\.2\.4'/);
});
