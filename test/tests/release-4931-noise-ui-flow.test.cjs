const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded}=require('./helpers.cjs');

const base={
  noiseDate:'2026-09-13',noiseTime:'13:00',noiseNature:'measurable',noiseSpecial:'ordinary',
  noiseZoneMode:'manual',noiseZone:'2',noiseA8Act:'none',noiseA9Type:'business'
};

test('4.9.31 文字：稽查對象／場所與測定均能音量 Leq dB(A)',async()=>{
  const {config}=await loaded();
  const t=config.templates.find(x=>x.id==='noise-main');
  assert.equal(t.fields.find(x=>x.id==='noiseSubject').label,'稽查對象／場所');
  assert.equal(t.fields.find(x=>x.id==='noiseValueFull').label,'測定均能音量 Leq dB(A)');
});

test('4.9.31 特殊評定在輸入 Leq 前即可顯示並展開',async()=>{
  const {root,config}=await loaded();
  let out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes'});
  assert.equal(out.noiseValueFull||'','');
  assert.equal(out.noiseShowGeneralMethod,'yes');
  const special=config.templates.find(x=>x.id==='noise-main').fields.find(x=>x.id==='noiseGeneralSpecialAssessment');
  assert.equal(special.displayWhen.field,'noiseShowGeneralMethod');
  assert.equal(special.displayWhen.value,'yes');
  out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseGeneralSpecialAssessment:'periodic'});
  assert.equal(out.noiseShowGeneralBg10,'yes');
  assert.match(out.noiseValidation,/10 dB/);
});

test('4.9.31 手機 Wizard 量測頁把特殊評定排在 Leq 輸入之前',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const source=fs.readFileSync(path.join(__dirname,'..','src','noise-mobile-wizard.js'),'utf8');
  const start=source.indexOf("id:'measurement'");
  assert.ok(start>=0);
  const section=source.slice(start,start+1800);
  assert.ok(section.indexOf("'noiseGeneralSpecialAssessment'")>=0);
  assert.ok(section.indexOf("'noiseGeneralSpecialAssessment'")<section.indexOf("prefixes:['noiseValue'"));
});

test('4.9.31 擴音設施不顯示／不要求主要噪音源，且切換時清除舊值',async()=>{
  const {root,config}=await loaded();
  const t=config.templates.find(x=>x.id==='noise-main');
  const source=t.fields.find(x=>x.id==='noiseSource');
  assert.equal(source.displayWhen.field,'noiseA9Type');
  assert.equal(source.displayWhen.value,'speaker');
  assert.equal(source.displayWhen.operator,'notEquals');
  const out=root.NoiseMain.prepare({...base,noiseA9Type:'speaker',noiseMeasureDecision:'yes',noiseOperation:'使用擴音設施中',noiseSpeakerMode:'fixed',noiseSpeakerOutdoor:'no',noiseValueFull:'40',noiseSubject:'測試場所'});
  assert.equal(out.noiseBlocked,'no');
  assert.equal(out.noiseOutcomeId,'article9.compliant');
  assert.doesNotMatch(out.noiseValidation||'',/主要噪音源/);
  const reset=root.NoiseMain.resetChange({...base,noiseA9Type:'business',noiseSource:'空壓機'},{...base,noiseA9Type:'speaker',noiseSource:'空壓機'});
  assert.equal(reset.noiseSource,'');
});