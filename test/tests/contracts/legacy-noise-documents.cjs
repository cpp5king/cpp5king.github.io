const FIXED_TEXT=require('../fixtures/noise-fixed-texts.json');
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loaded, plain} = require('../helpers.cjs');
const {documentStub, nodes} = require('../dom-stub.cjs');
async function setup() {
  const env = await loaded(); const t = env.config.templates.find(t => t.id === 'noise-case');
  return {...env,t,generate:input=>env.root.DraftEngine.generate(env.config,t.id,input)};
}
const base={date:'2026-01-01',time:'15',subject:'測試場所',operation:'測試作業',noiseSource:'測試音源',sourceType:'人工音源別',zone:'二',period:'人工時段',measurementLocation:'測試測點',leq:'50',lmax:'60',leqStandard:'55',lmaxStandard:'65'};
test('近鄰有無管委會逐字符合原稿，未選不預設管委會',async()=>{
  const {generate}=await setup();
  assert.equal(generate({scenario:'neighbor',hasCommittee:'yes'}).record,'非屬噪音管制法管制範疇，應由本府工務局公寓大廈管理科依法處理之，本局仍囑管委會加強社區自主管理，以維護居住品質。');
  assert.equal(generate({scenario:'neighbor',hasCommittee:'no'}).record,'因非屬目前環保法規－噪音管制法管制範圍，依據噪音管制法第6條規定，製造不具持續性或不易量測而足以妨害他人生活安寧之聲音者，由警察機關依有關法規處理之。');
  assert.match(generate({scenario:'neighbor'}).record,/尚待確認/);
  assert.match(generate({scenario:'neighbor',noiseType:'custom',noiseTypeCustom:'自訂聲音'}).reply,/自訂聲音致妨礙安寧一案/);
  assert.doesNotMatch(generate({}).record,/違反|告發|警察/);
});

test('第8條成立後沿用原稿並套入固定法規文字',async()=>{
  const {generate}=await setup();const input={...base,scenario:'article8',article8Time:'22:00',article8FactInput:'使用測試設備進行測試作業',equipment:'測試設備',article8Operation:'測試作業',prohibitedAct:'commercialMachinery',article8Zone:'2'};
  const record='本局於115年1月1日22時許派員前往所陳地點，現場查為測試場所，現場使用動力機械從事餐飲、洗染、乾燥、印刷商業行為，補充現場事實：使用測試設備進行測試作業，查該址位處本府公告之第2類噪音管制區，於管制區內公告禁止時段從事使用動力機械從事餐飲、洗染、乾燥、印刷商業行為之行為，已違反噪音管制法第8條暨本府現行公告相關規定，本局依法告發並令其立即停止改善。';
  assert.equal(generate(input).record,record);
  assert.equal(generate(input).reply,'有關臺端反映事項，'+record+(FIXED_TEXT.replyEnding));
  const blank=generate({scenario:'article8'});assert.match(blank.record,/請先填寫/);assert.doesNotMatch(blank.record,/已違反|依法告發/);
});

test('未量測四種原因及擴音用字，其他只取自填，天雨回覆不擅加結尾',async()=>{
  const {generate}=await setup();const input={...base,scenario:'unmeasured'};
  for(const reason of ['inactive','notFound']) {
    assert.match(generate({...input,noMeasurementReason:reason,inactiveWording:'sourceInactive'}).record,/稽查時測試音源未運轉/);
    assert.match(generate({...input,noMeasurementReason:reason,inactiveWording:'amplifier'}).record,/現場未發現有使用擴音設備之情形/);
  }
  const rain=generate({...input,noMeasurementReason:'rain',inactiveWording:'amplifier'});
  assert.match(rain.record,/惟現場適逢天雨路濕依法規定不宜量測噪音/);
  assert.equal(rain.reply,'經查該址為測試場所，稽查時測試作業，噪音源為測試音源，惟適逢天雨路濕未符合噪音管制標準量測時氣象條件之規定，無法量測具代表性之數據，現場勸導業者應加強噪音防制措施及注意作業時間，以維環境品質。');
  const other=generate({...input,noMeasurementReason:'other',otherRecord:'自填紀錄',otherReply:'自填回覆'});assert.equal(other.record,'自填紀錄');assert.equal(other.reply,'自填回覆');
  assert.match(generate({...input,noMeasurementReason:'other'}).record,/尚待確認/);
});
