const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

async function setup(){
  const env=await loaded();
  return {...env,zone:env.root.NoiseZone,flow:env.root.NoiseMain};
}

const assist=(extra={})=>({noiseZoneMode:'assist',noiseDate:'2026-09-13',...extra});

test('管制區重建契約：NoiseZone 模組與現行公告生效日已註冊',async()=>{
  const {zone}=await setup();
  assert.equal(typeof zone.resolve,'function');
  assert.equal(zone.EFFECTIVE_DATE,'2026-03-05');
});

test('管制區：未啟用輔助時仍可直接使用已知第一至第四類',async()=>{
  const {zone}=await setup();
  for(const z of ['1','2','3','4']){
    const out=zone.resolve({noiseDate:'2026-09-13',noiseZone:z});
    assert.equal(out.status,'resolved');
    assert.equal(out.zone,z);
    assert.equal(out.basis,'manual');
  }
});

test('管制區：115年3月5日前案件不套用現行公告輔助',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseDate:'2026-03-04',noiseZoneAssistType:'land',noiseZoneLandClass:'residentialSchool'}));
  assert.equal(out.status,'pending');
  assert.equal(out.zone,null);
  assert.match(out.message,/115年3月5日|較早案件|當時有效公告/);
});

test('管制區：一般土地依公告可判第一、二、三、四類',async()=>{
  const {zone}=await setup();
  const cases=[['nationalPark','1'],['residentialSchool','2'],['other','3'],['fourth','4']];
  for(const [landClass,expected] of cases){
    const out=zone.resolve(assist({noiseZoneAssistType:'land',noiseZoneLandClass:landClass}));
    assert.equal(out.status,'resolved');
    assert.equal(out.zone,expected);
  }
});

test('管制區：6公尺以上未滿15公尺道路，非交通噪音依音源所在位置',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'road6to15',noiseZoneTrafficSource:'no',noiseZoneSourceZone:'2'}));
  assert.equal(out.status,'resolved');
  assert.equal(out.zone,'2');
  assert.match(out.note,/6公尺以上未滿15公尺|音源所在位置/);
});

test('管制區：6至15公尺道路若為交通噪音源不得套用非交通簡化規則',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'road6to15',noiseZoneTrafficSource:'yes',noiseZoneSourceZone:'2'}));
  assert.equal(out.status,'pending');
  assert.equal(out.zone,null);
  assert.match(out.message,/交通噪音源|專章分流/);
});

test('管制區 unknown：6至15公尺道路不確定是否交通噪音時不得自動判區',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'road6to15',noiseZoneTrafficSource:'unknown',noiseZoneSourceZone:'2'}));
  assert.equal(out.status,'pending');
  assert.equal(out.zone,null);
});

test('管制區：未滿6公尺道路兩側同類時維持該類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'2',noiseZoneSideB:'2',noiseZonePointSide:'a'}));
  assert.equal(out.status,'resolved');
  assert.equal(out.zone,'2');
});

test('管制區：未滿6公尺道路第一類與第三類之退縮範圍判第二類',async()=>{
  const {zone}=await setup();
  for(const side of ['a','b']){
    const out=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'1',noiseZoneSideB:'3',noiseZonePointSide:side}));
    assert.equal(out.status,'resolved');
    assert.equal(out.zone,'2');
    assert.match(out.note,/15公尺|第二類/);
  }
});

test('管制區：未滿6公尺道路第二類與第四類之退縮範圍判第三類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'2',noiseZoneSideB:'4',noiseZonePointSide:'a'}));
  assert.equal(out.zone,'3');
  assert.match(out.note,/15公尺|第三類/);
});

test('管制區：未滿6公尺道路第一類與第四類依所在側分別退縮為第二、第三類',async()=>{
  const {zone}=await setup();
  const firstSide=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'1',noiseZoneSideB:'4',noiseZonePointSide:'a'}));
  const fourthSide=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'1',noiseZoneSideB:'4',noiseZonePointSide:'b'}));
  assert.equal(firstSide.zone,'2');
  assert.equal(fourthSide.zone,'3');
});

test('管制區：未滿6公尺道路其他跨類組合以道路中心線分側',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'roadUnder6',noiseZoneSideA:'2',noiseZoneSideB:'3',noiseZonePointSide:'b'}));
  assert.equal(out.status,'resolved');
  assert.equal(out.zone,'3');
  assert.match(out.note,/中心線/);
});

test('管制區：15公尺以上道路或正式通車運輸設施本體屬第四類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'on'}));
  assert.equal(out.status,'resolved');
  assert.equal(out.zone,'4');
});

test('管制區：交通設施周界外30公尺內若原屬第四類仍維持第四類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'within15',noiseZoneOriginalFourth:'yes'}));
  assert.equal(out.zone,'4');
  assert.match(out.note,/原屬第四類|維持第四類/);
});

test('管制區：交通設施緊鄰第一類，周界外15公尺內判第三類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'within15',noiseZoneOriginalFourth:'no',noiseZoneAdjacentFirst:'yes'}));
  assert.equal(out.zone,'3');
});

test('管制區：交通設施緊鄰第一類，逾15至30公尺判第二類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'from15to30',noiseZoneOriginalFourth:'no',noiseZoneAdjacentFirst:'yes'}));
  assert.equal(out.zone,'2');
});

test('管制區：交通設施周界外30公尺內非原第四類且未緊鄰第一類判第三類',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'from15to30',noiseZoneOriginalFourth:'no',noiseZoneAdjacentFirst:'no'}));
  assert.equal(out.zone,'3');
});

test('管制區：交通設施周界外超過30公尺回歸原土地管制區',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'beyond30',noiseZoneUnderlying:'2'}));
  assert.equal(out.status,'resolved');
  assert.equal(out.zone,'2');
});

test('管制區 unknown：主要交通設施周邊原是否第四類未知時不得自動改劃',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'majorTransport',noiseZoneMajorPosition:'within15',noiseZoneOriginalFourth:'unknown',noiseZoneAdjacentFirst:'no'}));
  assert.equal(out.status,'pending');
  assert.equal(out.zone,null);
});

test('管制區交界：不得強行簡化成單一類別',async()=>{
  const {zone}=await setup();
  const out=zone.resolve(assist({noiseZoneAssistType:'boundary',noiseZoneBoundaryPair:'2-3'}));
  assert.equal(out.status,'boundary');
  assert.equal(out.zone,null);
  assert.deepEqual(Array.from(out.zones),['2','3']);
  assert.match(out.message,/同時套用兩區標準|單一管制區/);
});

test('主流程整合：一般噪音源由管制區輔助判得第二類後才進第8／6／9條流程',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({
    ...assist({noiseZoneAssistType:'road6to15',noiseZoneTrafficSource:'no',noiseZoneSourceZone:'2'}),
    noiseTime:'14:00',noiseHoliday:'no',noiseA8Act:'none',noiseSpecial:'ordinary',noiseNature:'difficult',noiseA6Disturbance:'no'
  });
  assert.equal(out.noiseZone,'2');
  assert.match(out.noiseZoneResultText,/第2類/);
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRouteText,/第6條要件未成立/);
});

test('主流程整合：特殊來源先分流，不應要求一般噪音管制區資料',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({noiseSpecial:'landTransport'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseGuide,/第14條/);
  assert.equal(out.noiseZoneResultText,'');
});

test('主流程整合：交界案件停在管制區判定，不自行選較寬鬆或較嚴格單一區',async()=>{
  const {flow}=await setup();
  const out=flow.prepare({
    ...assist({noiseZoneAssistType:'boundary',noiseZoneBoundaryPair:'1-2'}),
    noiseTime:'23:00',noiseHoliday:'no',noiseA8Act:'none',noiseSpecial:'ordinary',noiseNature:'measurable'
  });
  assert.equal(out.noiseBlocked,'yes');
  assert.match(out.noiseRouteText,/噪音管制區判定/);
  assert.match(out.noiseValidation,/同時套用兩區標準|單一管制區/);
  assert.equal(out.noiseZone,'');
});
