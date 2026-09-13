const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function loadRuntime(){
  const root={console,Date};root.window=root;root.globalThis=root;root.TemplateWorkflows={};root.TemplatePatches={};root.INSPECTION_CONFIG={templates:[]};
  const context=vm.createContext(root);
  const files=[
    'data/texts/noise-common.js','data/texts/noise-templates.js','data/texts/noise-main.js','data/texts/noise-article8.js','data/texts/noise-article9.js','data/texts/noise-neighbor.js','data/texts/noise-ui.js','data/texts/noise-documents.js','data/texts/noise-result-map.js','src/noise-text.js',
    'data/rules/noise-article8.js','data/rules/noise-article9.js','src/noise-zone.js','src/noise-main.js','src/noise-method-guidance.js','src/noise-composite.js','src/noise-boundary.js','src/noise-priority-routing.js','src/noise-approved-drafts.js','data/templates/noise-main.js','src/draft-engine.js'
  ];
  for(const rel of files)vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
  for(const patch of Object.values(root.TemplatePatches))if(typeof patch==='function')patch(root.INSPECTION_CONFIG);
  const template=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');
  root.DraftEngine.validate(template);
  return {root,template};
}
const base={noiseDate:'2026-09-13',noiseTime:'00:05',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'direct',noiseZone:'4',noiseA8Act:'none',noiseA9Type:'factory',noiseSubject:'測試工廠',noiseSource:'空調設備'};

test('不易量測音源範例改為寵物／鄰居偶發／家具落地，移除冷氣低頻例子',()=>{
  const {template}=loadRuntime(),f=template.fields.find(x=>x.id==='noiseDifficultSource');
  assert.match(f.placeholder,/寵物吠叫/);assert.match(f.placeholder,/鄰居偶發聲響/);assert.match(f.placeholder,/家具落地聲/);assert.doesNotMatch(f.placeholder,/冷氣/);
});

test('新案件日期時間有現在值預填函式且欄位仍可編輯',()=>{
  const {template}=loadRuntime(),v=template.initialValues();
  assert.match(v.noiseDate,/^\d{4}-\d{2}-\d{2}$/);assert.match(v.noiseTime,/^(?:[01]\d|2[0-3]):[0-5]\d$/);
  const date=template.fields.find(x=>x.id==='noiseDate'),time=template.fields.find(x=>x.id==='noiseTime');
  assert.equal(date.lockWhen,undefined);assert.equal(time.lockWhen,undefined);
});

test('第8條不再要求現場事實描述欄位，禁止行為直接成為現場事實',()=>{
  const {root,template}=loadRuntime();
  assert.equal(template.fields.some(x=>x.id==='noiseA8FactText'),false);
  const out=root.NoiseMain.prepare({noiseDate:'2026-09-13',noiseTime:'00:05',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'direct',noiseZone:'1',noiseA8Act:'vehicleBusiness',noiseA8Subject:'測試場所'});
  assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRecord,/從事運轉引擎或使用動力機械從事清洗、修理、改裝車輛之商業行為/);
  assert.doesNotMatch(out.noiseValidation||'',/現場事實描述/);
});

test('主要噪音源填完後先詢問是否進行量測',()=>{
  const {root}=loadRuntime(),out=root.NoiseMain.prepare(base);
  assert.equal(out.noiseShowMeasureDecision,'yes');assert.equal(out.noiseShowMeasureInputs,'no');
  assert.match(out.noiseValidation,/是否進行噪音量測/);
});

test('選擇進行量測後先選測點，再開放 number 全頻數值欄位',()=>{
  const {root,template}=loadRuntime();
  const full=template.fields.find(x=>x.id==='noiseValueFull');
  assert.equal(full.type,'number');assert.equal(full.min,0);
  let out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes'});
  assert.equal(out.noiseShowMeasureInputs,'yes');assert.equal(out.noiseShowFullPoint,'yes');assert.equal(out.noiseShowInputFull,'no');
  assert.match(out.noiseValidation,/先選擇全頻測點/);
  out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseFullPoint:'complainant'});
  assert.equal(out.noiseShowInputFull,'yes');assert.match(out.noiseValidation,/尚無量測資料/);
});

test('全頻小數值可正常保留並完成一般2分鐘 Leq 判斷',()=>{
  const {root}=loadRuntime();
  const input={...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueFull:'63.5',noiseFullPoint:'complainant',noiseFullIndoor:'yes'};
  const facts=root.DraftEngine.normalize(root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main'),input);
  assert.equal(facts.noiseValueFull,'63.5');
  const out=root.NoiseMain.prepare(input);
  assert.equal(out.noiseGeneralMethod,'leq');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/63.5分貝/);
});

test('選擇不量測後不展開量測值，改進不量測原因',()=>{
  const {root}=loadRuntime(),out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no'});
  assert.equal(out.noiseShowMeasureInputs,'no');assert.equal(out.noiseShowNoMeasureReason,'yes');assert.equal(out.noiseShowInputFull,'no');
  assert.match(out.noiseValidation,/不進行量測的原因/);
});

test('不量測原因：噪音源未運轉，套用既有核定文字',()=>{
  const {root}=loadRuntime(),out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'sourceOff'});
  assert.equal(out.noiseOutcomeId,'article9.sourceOff');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/空調設備未運轉/);assert.match(out.noiseReply,/空調設備未運轉/);
});

test('不量測原因：擴音設施未發現擴音設備，套用既有核定文字',()=>{
  const {root}=loadRuntime();
  const speaker={...base,noiseA9Type:'speaker',noiseSource:'擴音設備',noiseMeasureDecision:'no',noiseNoMeasureReason:'noSpeaker'};
  const out=root.NoiseMain.prepare(speaker);
  assert.equal(out.noiseOutcomeId,'article9.noSpeaker');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/未發現有使用擴音設備/);
});

test('不量測原因刪除無代表性數據，新增大門深鎖且可直接形成不量測事實',()=>{
  const {root,template}=loadRuntime();
  const reason=template.fields.find(x=>x.id==='noiseNoMeasureReason');
  assert.equal(reason.options.some(x=>x.id==='representative'),false);
  assert.equal(reason.options.some(x=>x.id==='doorLocked'&&x.label==='大門深鎖'),true);
  const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'doorLocked'});
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/大門深鎖/);assert.match(out.noiseReply,/大門深鎖/);
  assert.doesNotMatch(out.noiseRecord,/具代表性之量測值/);
});

test('其他不量測原因必須由稽查員自行說明，不自行推定',()=>{
  const {root}=loadRuntime();
  let out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'other'});
  assert.equal(out.noiseBlocked,'yes');assert.match(out.noiseValidation,/不量測原因說明/);
  out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'other',noiseNoMeasureDetail:'現場其他設備干擾，無法取得具代表性數據'});
  assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/現場其他設備干擾/);assert.doesNotMatch(out.noiseRecord,/符合|超過噪音管制標準/);
});

test('改變主要噪音源會清除量測決定及其下游，避免沿用舊狀態',()=>{
  const {root}=loadRuntime();
  const before={...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉',noiseValueFull:'63.5'};
  const after={...before,noiseSource:'另一設備'};
  const next=root.NoiseMain.resetChange(before,after);
  assert.equal(next.noiseMeasureDecision,'');assert.equal(next.noiseValueFull,'');assert.equal(next.noiseOperation,'');
});

test('進行量測之超標案件仍走第24條限期改善',()=>{
  const {root}=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueFull:'90',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseBgFullMode:'uncooperative'});
  assert.equal(out.noiseOutcomeId,'article9.exceeded');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/限期改善/);assert.doesNotMatch(out.noiseReply,/立即告發/);
});

test('進入量測後不再重複判斷下雨，舊雨天值不影響量測',()=>{
  const {root}=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueFull:'60',noiseFullPoint:'authority',noiseRain:'yes',noiseWind:'2'});
  assert.equal(out.noiseOutcomeId,'article9.compliant');assert.doesNotMatch(out.noiseValidation||'',/下雨|天雨/);
});

test('不量測原因直接選天雨時不需要先輸入量測值',()=>{
  const {root}=loadRuntime();
  const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'rain',noiseNoMeasureDetail:'現場設備持續運轉'});
  assert.equal(out.noiseOutcomeId,'article9.weather.rain');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/天雨路濕/);assert.doesNotMatch(out.noiseRecord,/未超過.*標準|超過.*標準/);
});

test('特殊週期／間歇評定仍只在主動選用後展開',()=>{
  const {root}=loadRuntime();
  let out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueFull:'60',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseGeneralSpecialAssessment:'periodic'});
  assert.equal(out.noiseShowGeneralBg10,'yes');assert.match(out.noiseValidation,/相差10 dB以上/);
  out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueFull:'60',noiseFullPoint:'complainant',noiseFullIndoor:'yes',noiseGeneralSpecialAssessment:'periodic',noiseGeneralBg10:'yes',noiseGeneralSpread:'lte5'});
  assert.equal(out.noiseGeneralMethod,'lmaxMean');
});
