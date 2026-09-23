const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runtime,loaded,plain}=require('./helpers.cjs');

const ordinary={
  noiseSpecial:'ordinary',noiseDate:'2026-09-13',noiseTime:'15:00',
  noiseZoneMode:'direct',noiseZone:'2',noiseHoliday:'no'
};
const timed={noiseDate:'2026-09-13',noiseTime:'15:00'};

test('4.9.4 噪音表單：日期時間後一般案件直接進管制區與第8條候選',async()=>{
  const {config}=await loaded();
  const t=config.templates.find(x=>x.id==='noise-main');
  assert.equal(t.floatingFieldActions,true);
  assert.equal(t.mobileFocusMode,true);
  assert.equal(t.quickActions.summaryField,'noiseQuickDecisionText');
  assert.deepEqual(Array.from(t.quickActions.startFields),['noiseDate','noiseTime']);
  const ids=t.fields.map(f=>f.id);
  assert.ok(ids.indexOf('noiseQuickDecisionText')<ids.indexOf('noiseDate'));
  assert.ok(ids.indexOf('noiseDate')<ids.indexOf('noiseTime'));
  assert.ok(ids.indexOf('noiseTime')<ids.indexOf('noiseZoneMode'));
  assert.ok(ids.indexOf('noiseA8CandidateText')<ids.indexOf('noiseA8Act'));
  assert.ok(ids.indexOf('noiseA8Act')<ids.indexOf('noiseNature'));
  assert.ok(ids.includes('noiseCommunityCommittee'));
  assert.ok(!ids.includes('noiseA6Disturbance'));
  assert.match(t.fields.find(f=>f.id==='noiseDate').label,/第一步/);
  assert.match(t.fields.find(f=>f.id==='noiseZoneMode').label,/第二步/);
  assert.match(t.fields.find(f=>f.id==='noiseA8CandidateText').label,/第三步/);
  assert.match(t.fields.find(f=>f.id==='noiseNature').label,/第四步/);
  assert.match(t.fields.find(f=>f.id==='noiseSpecial').label,/特殊來源快速分流/);
});

test('4.9.4 UI 不再提供尚待確認選項，未填本身即為待確認',async()=>{
  const {config}=await loaded();
  const t=config.templates.find(x=>x.id==='noise-main');
  for(const field of t.fields){
    if(!Array.isArray(field.options))continue;
    assert.equal(field.options.some(option=>option.id==='unknown'),false,`${field.id} should not expose unknown`);
  }
  const nature=t.fields.find(f=>f.id==='noiseNature');
  assert.deepEqual(Array.from(nature.options,x=>x.id),['measurable','difficult']);
  const committee=t.fields.find(f=>f.id==='noiseCommunityCommittee');
  assert.deepEqual(Array.from(committee.options,x=>x.id),['yes','no']);
});

test('4.9.4 第一關：未輸入稽查日期時間時不先做其他判斷',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({noiseNature:'difficult',noiseZone:'2',noiseHoliday:'no'}));
  assert.match(out.noiseRouteText,/第一步.*稽查日期與時間/);
  assert.match(out.noiseValidation,/稽查日期與時間/);
  assert.equal(out.noiseShowA8,'no');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseQuickDecisionText,/第一步先輸入實際稽查日期與時間/);
});

test('4.9.4 日期時間完成後未選特殊來源時自動視為一般案件，直接要求管制區',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare(timed));
  assert.equal(out.noiseSpecial,'ordinary');
  assert.equal(out.noiseShowGeneralSetup,'yes');
  assert.match(out.noiseValidation,/管制區|判定方式/);
  assert.match(out.noiseQuickDecisionText,/一般噪音案件/);
  assert.doesNotMatch(out.noiseValidation,/主要噪音來源/);
});

test('4.9.4 特殊運輸與航空來源仍可直接走專章，不要求一般管制區',()=>{
  const {root}=runtime();
  const cases=[
    ['landTransport',/第14條/],
    ['civilAviation',/第15條|第16條/],
    ['militaryAviation',/第17條/]
  ];
  for(const [noiseSpecial,law] of cases){
    const out=plain(root.NoiseMain.prepare({...timed,noiseSpecial}));
    assert.equal(out.noiseBlocked,'no');
    assert.match(out.noiseGuide,law);
    assert.equal(out.noiseZoneResultText,'');
    assert.equal(out.noiseShowA9,'no');
    assert.equal(out.noiseShowGeneralSetup,'no');
  }
});

test('4.9.4 車輛路徑仍保留排氣管第8條前置檢查，舊 unknown 匯入仍安全阻擋',()=>{
  const {root}=runtime();
  const unknown=plain(root.NoiseMain.prepare({...timed,noiseSpecial:'vehicle',noiseVehicleExhaustA8:'unknown'}));
  assert.equal(unknown.noiseBlocked,'yes');
  assert.match(unknown.noiseValidation,/尚待確認|不得直接略過/);

  const normal=plain(root.NoiseMain.prepare({...timed,noiseSpecial:'vehicle',noiseVehicleExhaustA8:'no'}));
  assert.equal(normal.noiseBlocked,'no');
  assert.match(normal.noiseGuide,/第11條至第13條/);
  assert.equal(normal.noiseShowA9,'no');

  const a8=plain(root.NoiseMain.prepare({...timed,noiseSpecial:'vehicle',noiseVehicleExhaustA8:'yes',noiseA8Disturbance:'yes'}));
  assert.equal(a8.noiseBlocked,'no');
  assert.match(a8.noiseRouteText,/第8條.*排氣管|排氣管.*第8條/);
  assert.equal(a8.noiseShowA9,'no');
});

test('4.9.4 一般案件在無第8條候選時自動往持續性／可量測判斷',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare(ordinary));
  assert.equal(out.noiseShowAfterA8,'yes');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseValidation,/持續性且可量測/);
  assert.match(out.noiseA8CandidateText,/沒有第8條公告禁止行為候選/);
  assert.match(out.noiseQuickDecisionText,/下一步判斷聲音是否具持續性且可量測/);
});

test('4.9.4 夜間由系統直接列出該時段第8條候選，選單只保留候選與無上述行為',async()=>{
  const env=await loaded();
  const {root,config}=env;
  const input={...ordinary,noiseTime:'22:30'};
  const expected=Array.from(root.NoiseMain.article8Candidates(input).acts,a=>a.id);
  const out=plain(root.NoiseMain.prepare(input));
  assert.ok(expected.length>0);
  assert.match(out.noiseA8CandidateText,/可能適用的第8條公告禁止行為/);
  assert.match(out.noiseA8CandidateText,/使用樂器發聲/);
  const field=config.templates.find(x=>x.id==='noise-main').fields.find(x=>x.id==='noiseA8Act');
  const ids=Array.from(field.options,x=>x.id);
  assert.deepEqual(ids,[...expected,'none']);
  assert.equal(ids.includes('unknown'),false);
});

test('4.9.4 禁止時段爆竹煙火即使屬不易量測，也先走第8條環保局路徑',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({
    ...ordinary,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',noiseNature:'difficult',
    noiseA8Ex_fireworks_government:'no',noiseA8Ex_fireworks_festival:'no'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條公告禁止行為成立/);
  assert.doesNotMatch(out.noiseRouteText,/警察機關|管委會/);
  assert.match(out.noiseQuickDecisionText,/目前走第8條.*環保局/);
});

test('4.9.4 不易量測且第8條未成立：未填管委會即保持待確認，不需另選尚待確認',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({...ordinary,noiseNature:'difficult'}));
  assert.equal(out.noiseShowA6Disturbance,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/管理委員會/);
  assert.match(out.noiseQuickDecisionText,/是否為設有管理委員會之社區/);
});

test('4.9.4 不易量測且有管委會：交由管委會，主管機關為工務局公寓大廈管理科',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({...ordinary,noiseNature:'difficult',noiseCommunityCommittee:'yes'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/有管委會社區.*管理委員會.*工務局公寓大廈管理科/);
  assert.match(out.noiseRecord,/管理委員會.*工務局公寓大廈管理科/);
  assert.doesNotMatch(out.noiseRouteText,/警察機關/);
});

test('4.9.4 不易量測且無管委會：轉警察機關，不進第9條量測',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({...ordinary,noiseNature:'difficult',noiseCommunityCommittee:'no'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/無管委會.*警察機關/);
  assert.match(out.noiseRouteText,/不進第9條/);
  assert.equal(out.noiseShowA9,'no');
});

test('4.9.4 交界案件仍先做第8條，再依無管委會轉警察，不簡化單一管制區',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({
    noiseDate:'2026-09-13',noiseTime:'14:00',noiseSpecial:'ordinary',noiseHoliday:'no',
    noiseZoneMode:'assist',noiseZoneAssistType:'boundary',noiseZoneBoundaryPair:'2-3',
    noiseA8Act:'none',noiseNature:'difficult',noiseCommunityCommittee:'no'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseRouteText,/無管委會.*警察機關/);
  assert.match(out.noiseZoneResultText,/交界|任何一區/);
});

test('4.9.4 具持續性且可量測：第8條未成立後進第9條',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({...ordinary,noiseNature:'measurable'}));
  assert.equal(out.noiseShowA9,'yes');
  assert.match(out.noiseValidation,/第9條噪音源類型/);
  assert.match(out.noiseQuickDecisionText,/進入第9條/);
});

test('4.9.4 第8條例外成立後仍回到後續可量測性判斷',()=>{
  const {root}=runtime();
  const out=plain(root.NoiseMain.prepare({
    ...ordinary,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',
    noiseA8Ex_fireworks_government:'yes'
  }));
  assert.match(out.noiseA8ExceptionSummary,/例外成立/);
  assert.equal(out.noiseShowAfterA8,'yes');
  assert.match(out.noiseValidation,/持續性且可量測/);
});

test('4.9.4 reset：上游時間、特殊來源、第8條或量測性質變更會清除管委會分流答案',()=>{
  const {root}=runtime();
  const before={...ordinary,noiseNature:'difficult',noiseCommunityCommittee:'yes'};
  const changedTime=root.NoiseMain.resetChange(before,{...before,noiseTime:'16:00'});
  assert.equal(changedTime.noiseCommunityCommittee,'');
  const changedNature=root.NoiseMain.resetChange(before,{...before,noiseNature:'measurable'});
  assert.equal(changedNature.noiseCommunityCommittee,'');
  assert.equal(changedNature.noiseA6Disturbance,'');
});

test('4.9.4 依賴：首頁與PWA仍載入 priority routing 模組',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  assert.match(read('index.html'),/src\/noise-priority-routing\.js/);
  assert.match(read('service-worker.js'),/src\/noise-priority-routing\.js/);
});
