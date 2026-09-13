const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,flow:env.root.NoiseMain};
}

const boundary=(extra={})=>({
  noiseSpecial:'ordinary',
  noiseDate:'2026-09-13',
  noiseTime:'22:30',
  noiseZoneMode:'assist',
  noiseZoneAssistType:'boundary',
  noiseZoneBoundaryPair:'2-3',
  noiseHoliday:'no',
  noiseA8Act:'none',
  noiseNature:'measurable',
  noiseA9Type:'business',
  noiseBand:'full',
  noiseGeneralMethod:'leq',
  noiseFullPoint:'complainant',
  noiseFullIndoor:'yes',
  noiseSubject:'受稽查場所',
  noiseSource:'冷氣設備',
  ...extra
});

test('交界契約：NoiseMain 已載入雙區包裝器',async()=>{
  const {flow}=await setup();
  assert.equal(flow.__boundaryWrapped,true);
});

test('交界雙區：22時30分第二類用夜間47 dB、第三類用晚間57 dB',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({noiseValueFull:'45'}));
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseZone,'');
  assert.equal(out.noiseBoundaryZones,'2-3');
  assert.match(out.noiseStandardText,/第2類[^\n]*夜間[^\n]*47/);
  assert.match(out.noiseStandardText,/第3類[^\n]*晚間[^\n]*57/);
  assert.match(out.noiseGuide,/兩區.*均未超過/);
});

test('交界雙區：只有較嚴區高於標準時仍須先完成該區背景音量處理',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({noiseValueFull:'50'}));
  assert.equal(out.noiseBlocked,'yes');
  assert.equal(out.noiseShowBgFull,'yes');
  assert.match(out.noiseValidation,/第2類.*背景音量/);
  assert.match(out.noiseResultText,/第2類.*高於標準 47/);
  assert.match(out.noiseResultText,/第3類.*未超過標準/);
});

test('交界雙區：任一區超標即不符合公告「不得超過任何一區」要求',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({noiseValueFull:'50',noiseBgFullMode:'uncooperative'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/第2類.*超過標準/);
  assert.match(out.noiseResultText,/第3類.*未超過標準/);
  assert.match(out.noiseGuide,/至少一區超過.*第24條/);
  assert.match(out.noiseReply,/交界.*至少一區.*超過標準/);
});

test('交界雙區：背景修正後兩區均合格時可判未超標',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({noiseValueFull:'49',noiseBgFullMode:'measured',noiseBgFull:'45'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseResultText,/第2類.*修正後 46\.8 dB.*未超過標準/);
  assert.match(out.noiseResultText,/第3類.*未超過標準/);
  assert.match(out.noiseGuide,/兩區.*均未超過/);
});

test('交界第8條：同一公告行為在兩區適用性不同時保持待確認',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({
    noiseTime:'23:00',
    noiseA8Act:'instrument',
    noiseNature:'measurable'
  }));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseRouteText,/第8條交界適用性待確認/);
  assert.match(out.noiseValidation,/第2類.*落入.*第3類.*未落入|適用結果不同/);
});

test('交界第8條：兩區均落入同一禁止行為時可成立且紀錄標示交界',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({
    noiseTime:'23:00',
    noiseA8Act:'fireworks',
    noiseA8Disturbance:'yes',
    noiseA8Ex_fireworks_government:'no',
    noiseA8Ex_fireworks_festival:'no'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第8條公告禁止行為成立/);
  assert.match(out.noiseRecord,/第2類與第3類噪音管制區交界/);
});

test('交界案件若第一關為不具持續性或不易量測，不再判交界與第8／9條',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(boundary({
    noiseTime:'14:00',
    noiseA8Act:'none',
    noiseNature:'difficult'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseShowA8,'no');
  assert.equal(out.noiseShowA9,'no');
  assert.match(out.noiseRouteText,/第6條.*警察機關/);
  assert.match(out.noiseQuickDecisionText,/第9條量測流程停止/);
});
