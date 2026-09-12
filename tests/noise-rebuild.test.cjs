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

function ordinary(extra={}){
  return {...base,noiseSpecial:'ordinary',noiseNature:'measurable',...extra};
}

test('重建版契約：單一 NoiseMain 與 noiseMain workflow 已註冊',async()=>{
  const {root,flow}=await setup();
  assert.equal(typeof flow.prepare,'function');
  assert.equal(typeof flow.correction,'function');
  assert.equal(typeof root.TemplateWorkflows.noiseMain.prepare,'function');
});

test('重建版法規事實：第二類22時進夜間、第三類22時30分仍屬晚間',async()=>{
  const {flow}=await setup();
  assert.equal(flow.period('2','22:00'),'night');
  assert.equal(flow.period('3','22:30'),'evening');
  assert.equal(flow.period('3','23:00'),'night');
});

test('重建版法規事實：例假日卡拉OK中午12至14時納入第8條時段',async()=>{
  const {root,flow}=await setup();
  const act=root.NOISE_ARTICLE8_RULES.acts.find(x=>x.id==='karaoke');
  assert.equal(flow.actApplicable(act,'2','13:00','yes'),true);
  assert.equal(flow.actApplicable(act,'2','13:00','no'),false);
});

test('重建版：第8條排氣管公告行為優先於機動車輛專章分流',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseA8Act:'exhaust',noiseA8Disturbance:'yes'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條/);
  assert.match(out.noiseRecord,/排氣管|第8條/);
});

test('重建版 unknown 契約：第8條妨害安寧未知不得視為未成立',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'instrument',noiseA8Disturbance:'unknown'});
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/尚待確認|暫不作成/);
  assert.notEqual(out.noiseA8Disturbance,'no');
});

test('重建版 unknown 契約：第8條公告例外未知不得直接告發或排除',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',noiseA8Exception:'unknown'});
  assert.equal(out.noiseShowA8Exception,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/例外條件尚待確認|暫不作成/);
});

test('重建版：非第8條之使用中機動車輛走車輛專章',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseSpecial:'vehicle'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/機動車輛/);
  assert.doesNotMatch(out.noiseRouteText,/第9條第1項/);
});

test('重建版：陸上運輸、民航、軍航各自離開一般第9條流程',async()=>{
  const {flow}=await setup();
  const land=flow.prepare({...base,noiseSpecial:'landTransport'});
  const civil=flow.prepare({...base,noiseSpecial:'civilAviation'});
  const military=flow.prepare({...base,noiseSpecial:'militaryAviation'});
  assert.match(land.noiseGuide,/第14條/);
  assert.match(civil.noiseGuide,/第15條|第16條/);
  assert.match(military.noiseGuide,/第17條/);
  for(const out of [land,civil,military]){
    assert.equal(out.noiseBlocked,'no');
    assert.doesNotMatch(out.noiseRouteText,/第9條第1項/);
  }
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

test('重建版：第6條妨害安寧要件明確為否時不硬轉第9條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'no'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/不進第9條/);
});

test('重建版：不屬第9條不得直接推論沒有其他法規責任',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'outside'}));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseGuide,/不得.*直接推論|重新確認/);
});

test('重建版：第9條第6款公告設施必須先確認設施種類',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'otherFacility'}));
  assert.equal(out.noiseShowOtherFacility,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/公告設施種類/);
});

test('重建版：室內一般場所全頻量測不要求雨勢風速',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'
  }));
  assert.equal(out.noiseShowWeather,'no');
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/未超過標準/);
});

test('重建版：室外全頻量測風速超過5 m/s時阻擋判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'authority',noiseRain:'no',noiseWind:'6',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'
  }));
  assert.equal(out.noiseShowWeather,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/5 m\/s/);
});

test('重建版：室外量測有雨時不得進入合格與否判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'authority',noiseRain:'yes',noiseWind:'1',
    noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'50'
  }));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/有雨|氣象條件/);
});

test('重建版：低頻量測為室內測點，不要求室外雨勢風速',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'low',
    noiseSubject:'受稽查場所',noiseSource:'低頻設備',noiseValueLow:'20'
  }));
  assert.equal(out.noiseShowWeather,'no');
  assert.match(out.noiseMeasurementPointText,/低頻.*室內|室內地點/);
  assert.equal(out.noiseBlocked,'no');
});

test('重建版：擴音設施不得選低頻評定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'low'}));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/僅採.*全頻|全頻/);
});

test('重建版：移動性擴音設施以Lmax評定且不顯示一般全頻測點',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'moving',
    noiseRain:'no',noiseWind:'2',noiseSubject:'移動擴音車',noiseSource:'擴音器',noiseValueFull:'40'
  }));
  assert.equal(out.noiseShowFullPoint,'no');
  assert.match(out.noiseMeasurementPointText,/3公尺/);
  assert.match(out.noiseResultText,/Lmax/);
});

test('重建版：固定或停止移動之擴音設施以Leq評定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'fixed',
    noiseRain:'no',noiseWind:'2',noiseSubject:'固定擴音設施',noiseSource:'喇叭',noiseValueFull:'40'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseMeasurementPointText,/Leq/);
  assert.match(out.noiseResultText,/Leq/);
});

test('重建版：一般場所支援Lmax平均與L5兩種週期／間歇評定',async()=>{
  const {flow}=await setup();
  for(const [method,label] of [['lmaxMean','Lmax'],['l5','L5']]){
    const out=flow.prepare(ordinary({
      noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:method,
      noiseFullPoint:'complainant',noiseFullIndoor:'yes',
      noiseSubject:'受稽查場所',noiseSource:'間歇性設備',noiseValueFull:'50'
    }));
    assert.equal(out.noiseBlocked,'no');
    assert.match(out.noiseMeasurementPointText,new RegExp(label));
    assert.match(out.noiseResultText,new RegExp(label));
  }
});

test('重建版背景修正：差小於3 dB無效、10 dB以上免修正、3至10 dB採能量扣除',async()=>{
  const {flow}=await setup();
  assert.equal(flow.correction(60,59).status,'invalid');
  const ten=flow.correction(60,50);
  assert.equal(ten.status,'ok');
  assert.equal(ten.value,60);
  const five=flow.correction(60,55);
  assert.equal(five.status,'ok');
  assert.ok(five.value<60);
  assert.ok(five.value>55);
});

test('重建版：高於標準但背景尚未處理時不得直接判定超標',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'90'
  }));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/背景音量/);
});

test('重建版：背景差小於3 dB不得直接判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'60',
    noiseBgFullMode:'measured',noiseBgFull:'59'
  }));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/小於3 dB/);
});

test('重建版：現場無法配合背景量測時依規定不修正並註明',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',
    noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'90',noiseBgFullMode:'uncooperative'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/不修正|無法配合/);
  assert.match(out.noiseGuide,/第24條/);
});

test('重建版：營建工程全頻同時檢查Leq與Lmax，超標進第24條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({
    noiseA9Type:'construction',noiseBand:'full',noiseFullPoint:'complainant',noiseFullIndoor:'yes',
    noiseSubject:'施工場所',noiseSource:'破碎機',noiseValueLeq:'68',noiseBgFullMode:'uncooperative',noiseValueLmax:'80'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/全頻 Leq/);
  assert.match(out.noiseResultText,/Lmax/);
  assert.match(out.noiseGuide,/第24條/);
});
