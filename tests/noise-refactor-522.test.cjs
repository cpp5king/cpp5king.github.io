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
  noiseContinuity:'yes',noiseMeasurability:'yes',
  noisePlaceType:'residential',noiseSourceCategory:'equipment',noiseEquipmentType:'pump',
  noiseTargetRunning:'yes'
};
const measured={
  ...base,noiseMeasureBands:['full'],noiseMeasurementPlace:'complainant',
  noiseDate:'2026-09-24',noiseTime:'13:00',noiseSubject:'測試社區',
  noiseBehavior:'none',noiseBoundaryInvolved:'no',noiseLandUseType:'residential',
  noiseFullStart:'13:01',noiseFullEnd:'13:04'
};

test('5.2.2 第6條拆成持續性與可有效量測性兩題，任一為否即分流警察方向',()=>{
  const root=loadRuntime();
  for(const input of [{noiseContinuity:'no',noiseMeasurability:'unknown'},{noiseContinuity:'yes',noiseMeasurability:'no'}]){
    const out=root.NoiseMain.prepare(input);
    assert.equal(out.noiseRouteText,'第6條型態／警察機關處理方向');
    assert.equal(out.noise522ShowMeasurement,'no');
    assert.equal(out.noiseBlocked,'no');
  }
});

test('住宅社區加抽水馬達形成公告特定設施，且量測不被日期時間或管制區前置阻擋',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare(base);
  assert.equal(out.noise522TargetText,'新北市公告特定設施');
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.match(out.noiseValidation,/量測類型/);
  assert.doesNotMatch(out.noiseValidation,/日期|管制區/);
});

test('餐飲店加抽排風機應走營業場所整體噪音，不誤走公告特定設施',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noisePlaceType:'restaurant',noiseEquipmentType:'exhaustFan'});
  assert.equal(out.noise522TargetText,'娛樂／營業場所整體噪音');
});

test('餐飲店加擴音設備同時提供營業場所整體與擴音設施兩條合法路徑',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({...base,noisePlaceType:'restaurant',noiseSourceCategory:'speaker',noiseEquipmentType:''});
  assert.equal(out.noise522ShowTargetChoice,'yes');
  assert.match(out.noiseValidation,/選擇本次查核對象/);
  out=root.NoiseMain.prepare({...base,noisePlaceType:'restaurant',noiseSourceCategory:'speaker',noiseEquipmentType:'',noiseTargetChoice:'speaker'});
  assert.equal(out.noise522TargetText,'擴音設施');
});

test('到場未運轉只記錄未運轉，不反推聲音不具持續性',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noiseTargetRunning:'no'});
  assert.equal(out.noiseRouteText,'到場時未運轉／未發生');
  assert.equal(out.noiseContinuity,'yes');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.doesNotMatch(out.noiseGuide,/不具持續性/);
});

test('量測類型為複選且全頻與低頻結果獨立，不產生整體合格不合格',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'restaurant',noiseSourceCategory:'equipment',noiseEquipmentType:'exhaustFan',
    noiseMeasureBands:['full','low'],noiseValueFull:'60',noiseBgFullMode:'measured',noiseBgFull:'40',
    noiseLowStart:'13:05',noiseLowEnd:'13:08',noiseValueLow:'30'
  });
  assert.equal(out.noiseMeasureResultFull,'高於適用標準');
  assert.equal(out.noiseMeasureResultLow,'未高於適用標準');
  assert.match(out.noiseResultText,/全頻：高於適用標準/);
  assert.match(out.noiseResultText,/低頻：未高於適用標準/);
  assert.doesNotMatch(out.noiseResultText,/整體合格|整體不合格/);
});

test('背景差值小於3dB時量測結果為無法完成有效判定，不使用資料不足作結果',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'restaurant',noiseSourceCategory:'equipment',noiseEquipmentType:'exhaustFan',
    noiseValueFull:'60',noiseBgFullMode:'measured',noiseBgFull:'58'
  });
  assert.equal(out.noiseMeasureResultFull,'本次無法完成有效判定');
  assert.doesNotMatch(out.noiseMeasureResultFull,/資料不足/);
});

test('營建工程只使用單一背景音處理Leq，不再要求背景Lmax欄位',()=>{
  const root=loadRuntime();
  const template=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  assert.deepEqual(JSON.parse(JSON.stringify(template.fields.find(x=>x.id==='noiseBgLmaxMode').displayWhen)),{field:'noise522Never',value:'yes'});
  assert.deepEqual(JSON.parse(JSON.stringify(template.fields.find(x=>x.id==='noiseBgLmax').displayWhen)),{field:'noise522Never',value:'yes'});
  const out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'constructionMachinery',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'complainant',
    noiseDate:'2026-09-24',noiseTime:'13:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'none',
    noiseBoundaryInvolved:'no',noiseLandUseType:'residential',noiseFullStart:'13:01',noiseFullEnd:'13:04',
    noiseValueLeq:'60',noiseValueLmax:'70'
  });
  assert.equal(out.noiseMeasureResultFull,'未高於適用標準');
});

test('室外風速大於5m/s使第9條無法有效判定，但不阻斷第8條成立',()=>{
  const root=loadRuntime();
  const input={
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'constructionMachinery',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'boundary',noiseWeatherText:'無雨',noiseWind:'6',
    noiseDate:'2026-09-24',noiseTime:'23:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'construction',
    noiseBoundaryInvolved:'no',noiseLandUseType:'residential',
    noiseA8Ex_construction_emergency:'no',noiseA8Ex_construction_repair:'no',noiseA8Ex_construction_approved:'no'
  };
  const out=root.NoiseMain.prepare(input);
  assert.equal(out.noiseMeasureResultFull,'本次無法完成有效判定');
  assert.equal(out.noiseRouteText,'第8條公告禁止行為成立');
  assert.equal(out.noiseOutcomeId,'article8.established');
  assert.match(out.noiseRecord,/噪音管制法第8條/);
  assert.doesNotMatch(out.noiseRecord,/6m\/s|Leq|Lmax|第9條/);
});

test('第8條例外成立後使用已保全的第9條量測資料繼續研判',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'constructionMachinery',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'boundary',noiseWeatherText:'無雨',noiseWind:'1.6',
    noiseDate:'2026-09-24',noiseTime:'23:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'construction',
    noiseBoundaryInvolved:'no',noiseLandUseType:'residential',noiseFullStart:'23:01',noiseFullEnd:'23:04',
    noiseValueLeq:'68.4',noiseValueLmax:'82.1',noiseBgFullMode:'measured',noiseBgFull:'54.2',
    noiseA8Ex_construction_emergency:'yes'
  });
  assert.equal(out.noiseRouteText,'第8條例外排除 → 第9條研判');
  assert.equal(out.noiseMeasureResultFull,'高於適用標準');
  assert.match(out.noiseRecord,/第9條/);
  assert.match(out.noiseRecord,/68\.4/);
  assert.match(out.noiseRecord,/82\.1/);
});

test('現行第8條規則補入第一至第三類裝修工程，第四類不適用該項',()=>{
  const root=loadRuntime();
  const act=root.NOISE_ARTICLE8_RULES.acts.find(x=>x.id==='renovation');
  assert.ok(act);
  assert.deepEqual(JSON.parse(JSON.stringify(act.zones)),['1','2','3']);
  assert.equal(root.NoiseMain.actApplicable(act,'2','23:00','no'),true);
  assert.equal(root.NoiseMain.actApplicable(act,'4','23:00','no'),false);
});

test('特殊評定只有一般場所類型顯示，營建與擴音不顯示',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({...measured,noiseValueFull:'40'});
  assert.equal(out.noiseShowGeneralMethod,'yes');
  out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'construction',noiseSourceCategory:'constructionMachinery',noiseEquipmentType:'',
    noiseValueLeq:'40',noiseValueLmax:'50'
  });
  assert.equal(out.noiseShowGeneralMethod,'no');
  out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'residential',noiseSourceCategory:'speaker',noiseEquipmentType:'',
    noiseTargetChoice:'speaker',noiseValueFull:'40',noiseSpeakerMode:'fixed'
  });
  assert.equal(out.noiseShowGeneralMethod,'no');
  assert.equal(out.noiseShowSpeakerMode,'yes');
});

test('量測地點介面只保留周界外與陳情人指定之住居所兩個主要選項',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const f=t.fields.find(x=>x.id==='noiseMeasurementPlace');
  assert.deepEqual(JSON.parse(JSON.stringify(f.options.map(x=>x.label))),['周界外','陳情人指定之住居所']);
});

test('測試版離線殼載入新規則與流程檔，版本不再標成正式5.2.1',()=>{
  const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
  const meta=fs.readFileSync(path.join(ROOT,'data/app-meta.js'),'utf8');
  assert.match(index,/noise-refactor-522\.js/);
  assert.match(sw,/noise-refactor-522\.js/);
  assert.match(meta,/5\.2\.2/);
});
