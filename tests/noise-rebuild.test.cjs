const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,flow:env.root.NoiseMain};
}

const base={
  noiseDate:'2026-09-13',
  noiseTime:'14:00',
  noiseZone:'2',
  noiseHoliday:'no',
  noiseA8Act:'none'
};

test('重建版：第8條排氣管公告行為優先於機動車輛專章分流',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseA8Act:'exhaust',noiseA8Disturbance:'yes'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條/);
  assert.match(out.noiseRecord,/排氣管|第8條/);
});

test('重建版：非第8條之使用中機動車輛走車輛專章',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseSpecial:'vehicle'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/機動車輛/);
  assert.doesNotMatch(out.noiseRouteText,/第9條第1項/);
});

test('重建版：第6條不自行補足妨害安寧事實',async()=>{
  const {flow}=await setup();
  const pending=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'unknown'});
  assert.equal(pending.noiseBlocked,'yes');
  assert.match(pending.noiseValidation,/尚待確認|暫不作成/);
  const yes=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'yes'});
  assert.equal(yes.noiseBlocked,'no');
  assert.match(yes.noiseRouteText,/第6條/);
  assert.match(yes.noiseGuide,/警察機關/);
});

test('重建版：室內一般場所全頻量測不要求雨勢風速',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'business',noiseBand:'full',
    noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'
  });
  assert.equal(out.noiseShowWeather,'no');
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/未超過標準/);
});

test('重建版：室外全頻量測風速超過5 m/s時阻擋判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'business',noiseBand:'full',
    noiseGeneralMethod:'leq',noiseFullPoint:'authority',noiseRain:'no',noiseWind:'6',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'
  });
  assert.equal(out.noiseShowWeather,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/5 m\/s/);
});

test('重建版：移動性擴音設施以Lmax評定且不顯示一般全頻測點',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'speaker',noiseBand:'full',
    noiseSpeakerMode:'moving',noiseRain:'no',noiseWind:'2',
    noiseSubject:'移動擴音車',noiseSource:'擴音器',noiseValueFull:'40'
  });
  assert.equal(out.noiseShowFullPoint,'no');
  assert.match(out.noiseMeasurementPointText,/3公尺/);
  assert.match(out.noiseResultText,/Lmax/);
});

test('重建版：一般場所可用L5評定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'business',noiseBand:'full',
    noiseGeneralMethod:'l5',noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'間歇性設備',noiseValueFull:'50'
  });
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseMeasurementPointText,/L5/);
  assert.match(out.noiseResultText,/L5/);
});

test('重建版：背景差小於3 dB不得直接判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'business',noiseBand:'full',
    noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'60',
    noiseBgFullMode:'measured',noiseBgFull:'59'
  });
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/小於3 dB/);
});

test('重建版：營建工程全頻同時檢查Leq與Lmax，超標進第24條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,
    noiseSpecial:'ordinary',noiseNature:'measurable',noiseA9Type:'construction',noiseBand:'full',
    noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'施工場所',noiseSource:'破碎機',
    noiseValueLeq:'68',noiseBgFullMode:'uncooperative',noiseValueLmax:'80'
  });
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/全頻 Leq/);
  assert.match(out.noiseResultText,/Lmax/);
  assert.match(out.noiseGuide,/第24條/);
});
