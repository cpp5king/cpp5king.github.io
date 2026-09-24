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
  noisePlaceType:'nonListed',noiseSourceCategory:'equipment',noiseEquipmentType:'pump',
  noiseTargetRunning:'yes'
};
const measured={
  ...base,noiseMeasureBands:['full'],noiseMeasurementPlace:'complainant',
  noiseDate:'2026-09-24',noiseTime:'13:00',noiseSubject:'測試社區',
  noiseBehavior:'none',noiseBoundaryInvolved:'no',noiseDirectZone:'2',
  noiseFullStart:'13:01',noiseFullEnd:'13:04'
};


test('場所工程屬性只保留直接法規分類與非上述、尚待確認',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const f=t.fields.find(x=>x.id==='noisePlaceType');
  assert.deepEqual(JSON.parse(JSON.stringify(f.options.map(x=>x.label))),['工廠（場）','娛樂場所','營業場所','營建工程','非上述場所／工程','尚待確認']);
});

test('主要噪音來源簡化為機械設備、擴音設備、車輛相關、其他、尚待確認',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const f=t.fields.find(x=>x.id==='noiseSourceCategory');
  assert.deepEqual(JSON.parse(JSON.stringify(f.options.map(x=>x.label))),['機械設備','擴音設備','車輛相關','其他','尚待確認']);
});

test('查核對象名稱、稽查日期及時間置於噪音流程最上方',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const visible=t.fields.filter(x=>x.type!=='computed'&&!(x.displayWhen&&x.displayWhen.field==='noise522Never'));
  assert.equal(visible[0].id,'noiseSubject');
  assert.equal(visible[1].id,'noiseDate');
  assert.equal(visible[2].id,'noiseTime');
  assert.equal(t.mobileWizard.steps[0].id,'basic');
  assert.deepEqual(JSON.parse(JSON.stringify(t.mobileWizard.steps[0].fields)),['noiseSubject','noiseDate','noiseTime']);
});


test('一般案件直接選第1至4類噪音管制區或尚待確認，不再要求一般使用分區',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const direct=t.fields.find(x=>x.id==='noiseDirectZone');
  assert.ok(direct);
  assert.deepEqual(JSON.parse(JSON.stringify(direct.options.map(x=>x.label))),['第1類','第2類','第3類','第4類','尚待確認']);
  assert.equal(t.fields.some(x=>x.id==='noiseLandUseType'),false);
  assert.equal(t.fields.some(x=>x.id==='noiseNonUrbanFourth'),false);
  const out=root.NoiseMain.prepare({
    ...measured,noiseValueFull:'40',noiseDirectZone:'3'
  });
  assert.doesNotMatch(out.noiseValidation||'',/使用分區/);
});

test('補充現場事實明確標示選填且空白不阻擋量測或法規研判',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const observation=t.fields.find(x=>x.id==='noiseObservation');
  assert.equal(observation.label,'補充現場事實（選填）');
  assert.equal(observation.required,false);
  assert.match(observation.placeholder,/其他欄位未涵蓋/);
  const out=root.NoiseMain.prepare({...measured,noiseObservation:'',noiseValueFull:'40'});
  assert.doesNotMatch(out.noiseValidation||'',/補充現場事實/);
  assert.doesNotMatch(out.noise522PendingText||'',/補充現場事實/);
});

test('噪音管制區排在道路交界之前，第8條查核再排在量測之前',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const ids=t.fields.map(x=>x.id);
  assert.ok(ids.indexOf('noiseDirectZone')<ids.indexOf('noiseBoundaryInvolved'));
  assert.ok(ids.indexOf('noiseBoundaryInvolved')<ids.indexOf('noiseBehavior'));
  assert.ok(ids.indexOf('noiseBehavior')<ids.indexOf('noiseMeasureBands'));
  assert.ok(ids.indexOf('noiseBehavior')<ids.indexOf('noiseMeasurementPlace'));
  const site=t.mobileWizard.steps.find(x=>x.id==='site');
  assert.equal(site.fields[0],'noiseDirectZone');
  assert.equal(site.fields[1],'noiseBoundaryInvolved');
  assert.equal(site.fields.at(-1),'noiseBehavior');
});

test('第8條現場行為只在目前日期時間與管制區存在公告候選時顯示',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({
    ...base,noiseDate:'2026-09-24',noiseTime:'13:00',noiseDirectZone:'2',noiseBoundaryInvolved:'no'
  });
  assert.equal(out.noise522ShowA8Behavior,'no');
  out=root.NoiseMain.prepare({
    ...base,noiseDate:'2026-09-24',noiseTime:'23:00',noiseDirectZone:'2',noiseBoundaryInvolved:'no'
  });
  assert.equal(out.noise522ShowA8Behavior,'yes');
  assert.equal(out.noise522A8Candidate_instrument,'yes');
  assert.equal(out.noise522A8Candidate_construction,'yes');
  assert.equal(out.noise522A8Candidate_exhaust,'no');
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.match(out.noiseValidation,/量測類型/);
});

test('第8條查核選單只提供目前可適用候選與無上述行為',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const behavior=t.fields.find(x=>x.id==='noiseBehavior');
  assert.equal(behavior.label,'第8條現場行為查核');
  const instrument=behavior.options.find(x=>x.id==='instrument');
  const none=behavior.options.find(x=>x.id==='none');
  const other=behavior.options.find(x=>x.id==='other');
  assert.deepEqual(JSON.parse(JSON.stringify(instrument.when)),{field:'noise522A8Candidate_instrument',value:'yes'});
  assert.ok(none);
  assert.equal(other,undefined);
});

test('非上述場所工程進入主管機關公告內容，前四類場所不重複詢問',()=>{
  const root=loadRuntime();
  for(const source of ['equipment','speaker','other']){
    const out=root.NoiseMain.prepare({noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'nonListed',noiseSourceCategory:source});
    assert.equal(out.noise522ShowEquipment,'yes');
    assert.match(out.noiseRouteText,/其他經主管機關公告之場所、工程及設施/);
  }
  const out=root.NoiseMain.prepare({noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'factory',noiseSourceCategory:'equipment'});
  assert.equal(out.noise522ShowEquipment,'no');
  assert.equal(out.noise522TargetText,'工廠（場）整體噪音');
});

test('公告內容完整列出八類設施、非前四類裝修工程、以上皆非與尚待確認',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const f=t.fields.find(x=>x.id==='noiseEquipmentType');
  assert.deepEqual(JSON.parse(JSON.stringify(f.options.map(x=>x.label))),[
    '空調（通風、冷暖氣機）系統','冷卻水塔','抽水（加壓）馬達','抽排風機','冷凍（冷藏）櫃',
    '發電機（含固定及移動式）','變壓器','非營業用卡拉 OK','非屬前四類場所／工程範圍內之裝修工程',
    '以上公告項目皆非','尚待確認'
  ]);
});

test('非上述場所公告項目選以上皆非時，不得手動硬指定第9條查核對象',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseDate:'2026-09-24',noiseTime:'13:00',noiseContinuity:'yes',noiseMeasurability:'yes',
    noisePlaceType:'nonListed',noiseSourceCategory:'equipment',noiseEquipmentType:'none',
    noiseBehavior:'none',noiseBoundaryInvolved:'no',noiseDirectZone:'2'
  });
  assert.equal(out.noise522ShowTargetManual,'no');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.equal(out.noiseRouteText,'未形成噪音管制法管制路徑');
  assert.equal(out.noiseOutcomeId,'noise.no-regulated-route');
  assert.match(out.noise522Article9Text,/不適用第9條量測標準/);
});

test('第9條公告項目皆非時仍繼續第8條研判，第8條成立可獨立形成處理路徑',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseDate:'2026-09-24',noiseTime:'23:00',noiseContinuity:'yes',noiseMeasurability:'yes',
    noisePlaceType:'nonListed',noiseSourceCategory:'equipment',noiseEquipmentType:'none',
    noiseSourceDescription:'一般設備',noiseBehavior:'instrument',
    noiseBoundaryInvolved:'no',noiseDirectZone:'2',noiseSubject:'測試場所'
  });
  assert.equal(out.noiseRouteText,'第8條公告禁止行為成立');
  assert.equal(out.noiseOutcomeId,'article8.established');
  assert.match(out.noiseRecord,/噪音管制法第8條/);
  assert.equal(out.noise522ShowMeasurement,'no');
});

test('非營業用卡拉OK屬公告設施，形成其他經主管機關公告之場所工程及設施路徑',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'nonListed',
    noiseSourceCategory:'speaker',noiseEquipmentType:'nonBusinessKaraoke',noiseTargetRunning:'yes'
  });
  assert.equal(out.noise522TargetText,'其他經主管機關公告之場所、工程及設施');
  assert.equal(out.noise522ShowMeasurement,'yes');
});

test('非前四類裝修工程由公告內容直接形成公告裝修工程第9條路徑',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'nonListed',
    noiseSourceCategory:'other',noiseEquipmentType:'renovation',noiseTargetRunning:'yes'
  });
  assert.equal(out.noise522TargetText,'其他經主管機關公告之裝修工程');
  assert.equal(out.noise522ShowMeasurement,'yes');
});

test('非上述場所擴音設備若不屬第6款公告項目，仍保留第9條擴音設施法定路徑',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'nonListed',
    noiseSourceCategory:'speaker',noiseEquipmentType:'none',noiseTargetRunning:'yes'
  });
  assert.equal(out.noise522TargetText,'擴音設施');
  assert.equal(out.noise522ShowMeasurement,'yes');
});

test('5.2.2 第6條拆成持續性與可有效量測性兩題，任一為否即分流警察方向',()=>{
  const root=loadRuntime();
  for(const input of [{noiseContinuity:'no',noiseMeasurability:'unknown'},{noiseContinuity:'yes',noiseMeasurability:'no'}]){
    const out=root.NoiseMain.prepare(input);
    assert.equal(out.noiseRouteText,'第6條型態／警察機關處理方向');
    assert.equal(out.noise522ShowMeasurement,'no');
    assert.equal(out.noiseBlocked,'no');
  }
});

test('非上述場所加抽水馬達形成主管機關公告場所工程設施路徑，且量測不被日期時間或管制區前置阻擋',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare(base);
  assert.equal(out.noise522TargetText,'其他經主管機關公告之場所、工程及設施');
  assert.equal(out.noise522ShowMeasurement,'yes');
  assert.match(out.noiseValidation,/量測類型/);
  assert.doesNotMatch(out.noiseValidation,/日期|管制區/);
});

test('營業場所加機械設備直接走營業場所整體噪音，不再要求公告設備種類',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noisePlaceType:'business',noiseEquipmentType:''});
  assert.equal(out.noise522TargetText,'營業場所整體噪音');
  assert.equal(out.noise522ShowEquipment,'no');
});

test('營業場所加擴音設備同時提供營業場所整體與擴音設施兩條合法路徑',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({...base,noisePlaceType:'business',noiseSourceCategory:'speaker',noiseEquipmentType:''});
  assert.equal(out.noise522ShowTargetChoice,'yes');
  assert.match(out.noiseValidation,/選擇本次查核對象/);
  out=root.NoiseMain.prepare({...base,noisePlaceType:'business',noiseSourceCategory:'speaker',noiseEquipmentType:'',noiseTargetChoice:'speaker'});
  assert.equal(out.noise522TargetText,'擴音設施');
});

test('到場未運轉只記錄未運轉，不反推聲音不具持續性',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noiseTargetRunning:'no'});
  assert.equal(out.noiseRouteText,'到場時未運轉／未發生');
  assert.equal(out.noiseContinuity,'yes');
  assert.equal(out.noise522ShowMeasurement,'no');
  assert.match(out.noiseGuide,/不得推論為聲音不具持續性/);
});

test('量測類型為複選且全頻與低頻結果獨立，不產生整體合格不合格',()=>{
  const root=loadRuntime();
  const out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'business',noiseSourceCategory:'equipment',noiseEquipmentType:'',
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
    ...measured,noisePlaceType:'business',noiseSourceCategory:'equipment',noiseEquipmentType:'',
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
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'complainant',
    noiseDate:'2026-09-24',noiseTime:'13:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'none',
    noiseBoundaryInvolved:'no',noiseDirectZone:'2',noiseFullStart:'13:01',noiseFullEnd:'13:04',
    noiseValueLeq:'60',noiseValueLmax:'70'
  });
  assert.equal(out.noiseMeasureResultFull,'未高於適用標準');
});

test('室外風速大於5m/s使第9條無法有效判定，但不阻斷第8條成立',()=>{
  const root=loadRuntime();
  const input={
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'boundary',noiseRain:'no',noiseWind:'6',
    noiseDate:'2026-09-24',noiseTime:'23:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'construction',
    noiseBoundaryInvolved:'no',noiseDirectZone:'2',
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
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'construction',noiseSourceCategory:'equipment',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'boundary',noiseRain:'no',noiseWind:'1.6',
    noiseDate:'2026-09-24',noiseTime:'23:00',noiseSubject:'○○集合住宅新建工程',noiseBehavior:'construction',
    noiseBoundaryInvolved:'no',noiseDirectZone:'2',noiseFullStart:'23:01',noiseFullEnd:'23:04',
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
    ...measured,noisePlaceType:'construction',noiseSourceCategory:'equipment',noiseEquipmentType:'',
    noiseValueLeq:'40',noiseValueLmax:'50'
  });
  assert.equal(out.noiseShowGeneralMethod,'no');
  out=root.NoiseMain.prepare({
    ...measured,noisePlaceType:'nonListed',noiseSourceCategory:'speaker',noiseEquipmentType:'none',
    noiseValueFull:'40',noiseSpeakerMode:'fixed'
  });
  assert.equal(out.noiseShowGeneralMethod,'no');
  assert.equal(out.noiseShowSpeakerMode,'yes');
});

test('室外量測天候改為是否天雨直接選項，不再使用自由文字天候欄位',()=>{
  const root=loadRuntime();
  const t=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const rain=t.fields.find(x=>x.id==='noiseRain');
  assert.ok(rain);
  assert.equal(rain.label,'是否天雨？');
  assert.equal(rain.type,'select');
  assert.deepEqual(JSON.parse(JSON.stringify(rain.options.map(x=>x.label))),['是','否']);
  assert.equal(t.choiceStyle,'cards');
  assert.equal(t.fields.some(x=>x.id==='noiseWeatherText'),false);
  const measurement=t.mobileWizard.steps.find(x=>x.id==='measurement');
  assert.ok(measurement.fields.indexOf('noiseRain')<measurement.fields.indexOf('noiseWind'));
});

test('室外量測未回答是否天雨或風速時才列待補，室內量測不誤列',()=>{
  const root=loadRuntime();
  let out=root.NoiseMain.prepare({
    noiseContinuity:'yes',noiseMeasurability:'yes',noisePlaceType:'business',noiseSourceCategory:'equipment',
    noiseTargetRunning:'yes',noiseMeasureBands:['full'],noiseMeasurementPlace:'boundary',
    noiseDate:'2026-09-24',noiseTime:'13:00',noiseSubject:'測試場所',noiseBoundaryInvolved:'no',noiseDirectZone:'2',
    noiseFullStart:'13:01',noiseFullEnd:'13:04',noiseValueFull:'40'
  });
  assert.match(out.noise522PendingText,/是否天雨／風速/);
  out=root.NoiseMain.prepare({...measured,noiseBehavior:'none',noiseValueFull:'40'});
  assert.doesNotMatch(out.noise522PendingText||'',/是否天雨／風速/);
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
