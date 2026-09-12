const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,flow:env.root.NoiseMain};
}

const base={noiseDate:'2026-09-13',noiseTime:'14:00',noiseZone:'2',noiseHoliday:'no',noiseA8Act:'none'};
const ordinary=(extra={})=>({...base,noiseSpecial:'ordinary',noiseNature:'measurable',...extra});

test('重建版契約：單一 NoiseMain 與 noiseMain workflow 已註冊',async()=>{
  const {root,flow}=await setup();
  assert.equal(typeof flow.prepare,'function');
  assert.equal(typeof flow.correction,'function');
  assert.equal(typeof flow.evaluateA8Exceptions,'function');
  assert.equal(typeof root.TemplateWorkflows.noiseMain.prepare,'function');
});

test('重建版表單：第8條改為具體例外欄位，不再使用籠統 noiseA8Exception',async()=>{
  const {root}=await setup();
  const tpl=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  const ids=tpl.fields.map(x=>x.id);
  assert.ok(ids.includes('noiseA8Ex_fireworks_government'));
  assert.ok(ids.includes('noiseA8Ex_karaoke_a8KaraokeRegistered'));
  assert.ok(ids.includes('noiseA8Ex_construction_approved_a8Notice'));
  assert.ok(!ids.includes('noiseA8Exception'));
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

test('第8條爆竹：任一例外未知時不得直接成立或排除',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',noiseA8Ex_fireworks_government:'no',noiseA8Ex_fireworks_festival:'unknown'});
  assert.equal(out.noiseShowA8Exception_fireworks,'yes');
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/例外|節慶/);
});

test('第8條爆竹：專案核准例外成立即不以該禁止行為成立',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',noiseA8Ex_fireworks_government:'yes',noiseSpecial:'vehicle'});
  assert.match(out.noiseA8ExceptionSummary,/例外成立/);
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/機動車輛/);
});

test('第8條爆竹：全部例外明確為否時可成立第8條路徑',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'fireworks',noiseA8Disturbance:'yes',noiseA8Ex_fireworks_government:'no',noiseA8Ex_fireworks_festival:'no'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條公告禁止行為成立/);
  assert.match(out.noiseA8ExceptionSummary,/未符合/);
});

test('第8條室外擴音：執行公務例外可直接排除該禁止行為',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'outdoorSpeaker',noiseA8Disturbance:'yes',noiseA8Ex_outdoorSpeaker_government:'no',noiseA8Ex_outdoorSpeaker_publicDuty:'yes',noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'no'});
  assert.match(out.noiseA8ExceptionSummary,/執行公務/);
  assert.match(out.noiseRouteText,/第6條要件未成立/);
});

test('第8條卡拉OK：兩項例外條件須全部成立，一項為否即無例外',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'karaoke',noiseA8Disturbance:'yes',noiseA8Ex_karaoke_a8KaraokeRegistered:'yes',noiseA8Ex_karaoke_a8KaraokeZoning:'no'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條公告禁止行為成立/);
  assert.match(out.noiseA8ExceptionSummary,/例外不成立/);
});

test('第8條卡拉OK：尚有一項例外條件未知時保持待確認',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'karaoke',noiseA8Disturbance:'yes',noiseA8Ex_karaoke_a8KaraokeRegistered:'yes',noiseA8Ex_karaoke_a8KaraokeZoning:'unknown'});
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/土地使用分區|例外/);
});

test('第8條營建：核准施工且公告事項六附帶規定全數符合時例外成立',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'construction',noiseA8Disturbance:'yes',noiseA8Ex_construction_emergency:'no',noiseA8Ex_construction_repair:'no',noiseA8Ex_construction_approved:'yes',noiseA8Ex_construction_approved_a8Notice:'yes',noiseA8Ex_construction_approved_a8Sign:'yes',noiseA8Ex_construction_approved_a8Documents:'yes',noiseSpecial:'vehicle'});
  assert.match(out.noiseA8ExceptionSummary,/例外成立/);
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/機動車輛/);
});

test('第8條營建：雖經核准但公告事項六附帶規定有缺失時仍進第8條成立路徑',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'construction',noiseA8Disturbance:'yes',noiseA8Ex_construction_emergency:'no',noiseA8Ex_construction_repair:'no',noiseA8Ex_construction_approved:'yes',noiseA8Ex_construction_approved_a8Notice:'no',noiseA8Ex_construction_approved_a8Sign:'yes',noiseA8Ex_construction_approved_a8Documents:'yes'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條公告禁止行為成立/);
  assert.match(out.noiseA8ExceptionSummary,/未符合公告事項六/);
});

test('第8條吹葉機：目的事業主管機關核准為任一成立即排除之例外',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseTime:'23:00',noiseA8Act:'leafBlower',noiseA8Disturbance:'yes',noiseA8Ex_leafBlower_safety:'no',noiseA8Ex_leafBlower_disaster:'no',noiseA8Ex_leafBlower_emergency:'no',noiseA8Ex_leafBlower_approved:'yes',noiseSpecial:'vehicle'});
  assert.match(out.noiseA8ExceptionSummary,/主管機關核准/);
  assert.match(out.noiseRouteText,/機動車輛/);
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
  assert.match(land.noiseGuide,/第14條/);assert.match(civil.noiseGuide,/第15條|第16條/);assert.match(military.noiseGuide,/第17條/);
  for(const out of [land,civil,military])assert.equal(out.noiseBlocked,'no');
});

test('重建版：第6條不自行補足妨害安寧事實',async()=>{
  const {flow}=await setup();
  const pending=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'unknown'});
  assert.equal(pending.noiseBlocked,'yes');assert.match(pending.noiseValidation,/尚待確認|暫不作成/);
  const established=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'yes'});
  assert.equal(established.noiseBlocked,'no');assert.match(established.noiseGuide,/警察機關/);
});

test('重建版：第6條妨害安寧明確為否時不硬轉第9條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({...base,noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'no'});
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRouteText,/不進第9條/);
});

test('重建版：不屬第9條不得直接推論沒有其他法規責任',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'outside'}));
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseGuide,/不得.*直接推論|重新確認/);
});

test('重建版：第9條第6款公告設施必須先確認設施種類',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'otherFacility'}));
  assert.equal(out.noiseShowOtherFacility,'yes');assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/公告設施種類/);
});

test('重建版：室內一般場所全頻量測不要求雨勢風速',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'}));
  assert.equal(out.noiseShowWeather,'no');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseResultText,/未超過標準/);
});

test('重建版：室外全頻量測風速超過5 m/s時阻擋判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'authority',noiseRain:'no',noiseWind:'6',noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'50'}));
  assert.equal(out.noiseShowWeather,'yes');assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/5 m\/s/);
});

test('重建版：室外量測有雨時不得進入合格與否判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'authority',noiseRain:'yes',noiseWind:'1',noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'50'}));
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/有雨|氣象條件/);
});

test('重建版：低頻量測為室內測點，不要求室外雨勢風速',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'low',noiseSubject:'受稽查場所',noiseSource:'低頻設備',noiseValueLow:'20'}));
  assert.equal(out.noiseShowWeather,'no');assert.match(out.noiseMeasurementPointText,/低頻.*室內|室內地點/);assert.equal(out.noiseBlocked,'no');
});

test('重建版：擴音設施不得選低頻評定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'low'}));
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/僅採.*全頻|全頻/);
});

test('重建版：擴音設施先確認實際測點室內外，室內不要求氣象資料',async()=>{
  const {flow}=await setup();
  const missing=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'moving'}));
  assert.equal(missing.noiseShowSpeakerLocation,'yes');assert.match(missing.noiseValidation,/是否位於室外/);
  const indoor=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'moving',noiseSpeakerOutdoor:'no',noiseSubject:'移動擴音車',noiseSource:'擴音器',noiseValueFull:'40'}));
  assert.equal(indoor.noiseShowWeather,'no');assert.equal(indoor.noiseBlocked,'no');assert.match(indoor.noiseResultText,/Lmax/);
});

test('重建版：室外移動擴音設施使用Lmax且適用氣象條件',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'moving',noiseSpeakerOutdoor:'yes',noiseRain:'no',noiseWind:'2',noiseSubject:'移動擴音車',noiseSource:'擴音器',noiseValueFull:'40'}));
  assert.equal(out.noiseShowFullPoint,'no');assert.equal(out.noiseShowWeather,'yes');assert.match(out.noiseMeasurementPointText,/3公尺/);assert.match(out.noiseResultText,/Lmax/);
});

test('重建版：固定或停止移動之擴音設施以Leq評定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'speaker',noiseBand:'full',noiseSpeakerMode:'fixed',noiseSpeakerOutdoor:'no',noiseSubject:'固定擴音設施',noiseSource:'喇叭',noiseValueFull:'40'}));
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseMeasurementPointText,/Leq/);assert.match(out.noiseResultText,/Leq/);
});

test('重建版：一般場所支援Lmax平均與L5兩種週期／間歇評定',async()=>{
  const {flow}=await setup();
  for(const [method,label] of [['lmaxMean','Lmax'],['l5','L5']]){
    const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:method,noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'間歇性設備',noiseValueFull:'50'}));
    assert.equal(out.noiseBlocked,'no');assert.match(out.noiseMeasurementPointText,new RegExp(label));assert.match(out.noiseResultText,new RegExp(label));
  }
});

test('重建版背景修正：差小於3 dB無效、10 dB以上免修正、3至10 dB採能量扣除',async()=>{
  const {flow}=await setup();
  assert.equal(flow.correction(60,59).status,'invalid');
  const ten=flow.correction(60,50);assert.equal(ten.status,'ok');assert.equal(ten.value,60);
  const five=flow.correction(60,55);assert.equal(five.status,'ok');assert.ok(five.value<60&&five.value>55);
});

test('重建版：高於標準但背景尚未處理時不得直接判定超標',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'90'}));
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/背景音量/);
});

test('重建版：背景差小於3 dB不得直接判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'冷氣設備',noiseValueFull:'60',noiseBgFullMode:'measured',noiseBgFull:'59'}));
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/小於3 dB/);
});

test('重建版：現場無法配合背景量測時依法不修正並註明',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'full',noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'90',noiseBgFullMode:'uncooperative'}));
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseResultText,/不修正|無法配合/);assert.match(out.noiseGuide,/第24條/);
});

test('重建版：全頻合格但低頻待背景確認時只顯示低頻背景欄位',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'business',noiseBand:'both',noiseGeneralMethod:'leq',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查場所',noiseSource:'設備',noiseValueFull:'40',noiseValueLow:'90'}));
  assert.equal(out.noiseShowBgFull,'no');assert.equal(out.noiseShowBgLow,'yes');assert.equal(out.noiseBlocked,'yes');
});

test('重建版：營建工程全頻同時檢查Leq與Lmax，超標進第24條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(ordinary({noiseA9Type:'construction',noiseBand:'full',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'施工場所',noiseSource:'破碎機',noiseValueLeq:'68',noiseBgFullMode:'uncooperative',noiseValueLmax:'80'}));
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseResultText,/全頻 Leq/);assert.match(out.noiseResultText,/Lmax/);assert.match(out.noiseGuide,/第24條/);
});
