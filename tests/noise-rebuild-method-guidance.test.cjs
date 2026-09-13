const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,flow:env.root.NoiseMain};
}

const base={
  noiseDate:'2026-09-13',noiseTime:'14:00',noiseZone:'2',noiseHoliday:'no',noiseA8Act:'none',
  noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'business',noiseBand:'full',
  noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'50'
};

test('評定方法導引：表單改問現場事實，不再讓使用者直接選 Leq／Lmax平均／L5',async()=>{
  const {root}=await setup();
  const tpl=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const byId=id=>tpl.fields.find(x=>x.id===id);
  assert.match(tpl.moduleVersion,/^4\.9-rebuild-\d+$/);
  assert.equal(byId('noiseGeneralPattern').type,'select');
  assert.equal(byId('noiseGeneralBg10').type,'select');
  assert.equal(byId('noiseGeneralSpread').type,'select');
  assert.equal(byId('noiseGeneralMethod').type,'computed');
  assert.equal(byId('noiseGeneralMethodText').type,'computed');
});

test('評定方法導引：發聲特性未知時不得自行選方法',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'unknown'});
  assert.equal(out.noiseBlocked,'yes');
  assert.equal(out.noiseGeneralMethod,'');
  assert.match(out.noiseValidation,/週期性|間歇性/);
});

test('評定方法導引：非週期／非間歇性自動導出 Leq',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'other'});
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseGeneralMethod,'leq');
  assert.match(out.noiseGeneralMethodText,/Leq/);
  assert.match(out.noiseMeasurementPointText,/Leq/);
});

test('評定方法導引：週期／間歇性但背景差未知時保持待確認',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'periodic',noiseGeneralBg10:'unknown'});
  assert.equal(out.noiseShowGeneralBg10,'yes');
  assert.equal(out.noiseShowGeneralSpread,'no');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/背景音量.*10 dB|10 dB.*背景音量/);
});

test('評定方法導引：週期／間歇性未達背景差10 dB時不得偷改套 Leq',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'periodic',noiseGeneralBg10:'no'});
  assert.equal(out.noiseBlocked,'yes');
  assert.equal(out.noiseGeneralMethod,'');
  assert.doesNotMatch(out.noiseGeneralMethodText,/Leq/);
  assert.match(out.noiseValidation,/未達.*10 dB|10 dB.*未達/);
  assert.match(out.noiseValidation,/不自行改套 Leq/);
});

test('評定方法導引：週期／間歇、背景差至少10 dB且最大值差不超過5 dB，自動導出10次Lmax平均',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'periodic',noiseGeneralBg10:'yes',noiseGeneralSpread:'lte5'});
  assert.equal(out.noiseShowGeneralBg10,'yes');
  assert.equal(out.noiseShowGeneralSpread,'yes');
  assert.equal(out.noiseGeneralMethod,'lmaxMean');
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseGeneralMethodText,/Lmax平均|10次/);
  assert.match(out.noiseResultText,/Lmax/);
});

test('評定方法導引：週期／間歇、背景差至少10 dB且最大值差超過5 dB，自動導出L5',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralPattern:'periodic',noiseGeneralBg10:'yes',noiseGeneralSpread:'gt5'});
  assert.equal(out.noiseGeneralMethod,'l5');
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseGeneralMethodText,/L5|20個/);
  assert.match(out.noiseResultText,/L5/);
});

test('評定方法導引：變更上游發聲事實會清除方法、量測值與背景資料',async()=>{
  const {flow}=await setup();
  const before={...base,noiseGeneralPattern:'periodic',noiseGeneralBg10:'yes',noiseGeneralSpread:'lte5',noiseGeneralMethod:'lmaxMean',noiseGeneralMethodText:'Lmax平均',noiseValueFull:'60',noiseBgFullMode:'measured',noiseBgFull:'40'};
  const after={...before,noiseGeneralSpread:'gt5'};
  const reset=flow.resetChange(before,after);
  assert.equal(reset.noiseGeneralMethod,'');
  assert.equal(reset.noiseGeneralMethodText,'');
  assert.equal(reset.noiseValueFull,'');
  assert.equal(reset.noiseBgFullMode,'');
  assert.equal(reset.noiseBgFull,'');
});

test('評定方法導引：舊案件只有既有方法欄位時維持相容，但新版表單不再提供手動選擇',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseGeneralMethod:'leq'});
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseGeneralMethod,'leq');
  assert.match(out.noiseGeneralMethodText,/舊案件相容/);
});
