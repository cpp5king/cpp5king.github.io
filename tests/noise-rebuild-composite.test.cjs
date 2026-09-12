const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,flow:env.root.NoiseMain};
}

const base=(extra={})=>({
  noiseSpecial:'ordinary',noiseDate:'2026-09-13',noiseTime:'14:00',noiseZone:'2',noiseHoliday:'no',noiseA8Act:'none',
  noiseNature:'measurable',noiseA9Type:'otherFacility',noiseFacility:'1',noiseBand:'full',noiseGeneralMethod:'leq',
  noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseSubject:'受稽查設施',noiseSource:'空調設備',...extra
});

test('複合音量契約：NoiseMain 已載入標準第9條修正包裝器',async()=>{
  const {flow}=await setup();
  assert.equal(flow.__compositeWrapped,true);
});

test('複合音量 unknown：不同主體事實未確認時不得使用原標準直接判定',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({noiseValueFull:'50'}));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/非同一行為人|共同產生複合音量/);
  assert.equal(out.noiseStandardText,'');
  assert.equal(out.noiseResultText,'');
});

test('複合音量：明確非不同主體共同產生時維持第8條原標準',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({noiseCompositeDifferentActors:'no',noiseValueFull:'56'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseStandardText,/57 dB/);
  assert.match(out.noiseCompositeText,/不適用.*第9條修正/);
});

test('複合音量：不同主體但複合音量未超過原標準時不啟動修正',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'no',noiseValueFull:'56'}));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseStandardText,/57 dB/);
  assert.match(out.noiseCompositeText,/未超過.*不啟動第9條修正/);
});

test('複合音量：已超過原標準但音源數未知時保持待確認',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseValueFull:'50'}));
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseValidation,/音源數/);
});

test('複合音量：2、3、4、5、6以上音源分別降低3、4、6、7、8 dB',async()=>{
  const {flow}=await setup();
  const cases=[['two',54,3],['three',53,4],['four',51,6],['five',50,7],['sixPlus',49,8]];
  for(const [count,standard,drop] of cases){
    const out=flow.prepare(base({
      noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseCompositeSourceCount:count,noiseValueFull:'0'
    }));
    assert.equal(out.noiseBlocked,'no');
    assert.match(out.noiseCompositeText,new RegExp(`降低${drop} dB`));
    assert.match(out.noiseStandardText,new RegExp(`全頻評定值 ${standard} dB`));
  }
});

test('複合音量：2個不同主體時第二類日間57 dB修正為54 dB，56 dB需進背景處理',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({
    noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseCompositeSourceCount:'two',noiseValueFull:'56'
  }));
  assert.equal(out.noiseBlocked,'yes');
  assert.equal(out.noiseShowBgFull,'yes');
  assert.match(out.noiseStandardText,/54 dB/);
  assert.match(out.noiseValidation,/背景音量/);
});

test('複合音量：修正同時適用低頻標準',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({
    noiseBand:'low',noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseCompositeSourceCount:'two',noiseValueLow:'33'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseStandardText,/低頻 Leq,LF 34 dB/);
  assert.match(out.noiseResultText,/33 dB.*34 dB.*未超過標準/);
});

test('複合音量＋交界：先做第9條修正，再分別套兩區各自時段標準',async()=>{
  const {flow}=await setup();
  const out=flow.prepare(base({
    noiseTime:'22:30',noiseZone:'',noiseZoneMode:'assist',noiseZoneAssistType:'boundary',noiseZoneBoundaryPair:'2-3',
    noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseCompositeSourceCount:'two',noiseValueFull:'38'
  }));
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseBoundaryZones,'2-3');
  assert.match(out.noiseStandardText,/第2類[^\n]*(?:夜間[^\n]*)?39 dB/);
  assert.match(out.noiseStandardText,/第3類[^\n]*(?:晚間[^\n]*)?54 dB/);
});

test('複合音量 reset：上游事實改為不適用時清除下游超標與音源數',async()=>{
  const {flow}=await setup();
  const before=base({noiseCompositeDifferentActors:'yes',noiseCompositeOverallExceeded:'yes',noiseCompositeSourceCount:'four'});
  const after={...before,noiseCompositeDifferentActors:'no'};
  const out=flow.resetChange(before,after);
  assert.equal(out.noiseCompositeOverallExceeded,'');
  assert.equal(out.noiseCompositeSourceCount,'');
});
