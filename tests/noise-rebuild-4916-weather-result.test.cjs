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
  const template=root.INSPECTION_CONFIG.templates.find(x=>x.id==='noise-main');root.DraftEngine.validate(template);return {root,template};
}
const base={noiseDate:'2026-09-13',noiseTime:'00:05',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'direct',noiseZone:'4',noiseA8Act:'none',noiseA9Type:'factory',noiseSubject:'測試工廠',noiseSource:'空調設備',noiseMeasureDecision:'yes',noiseOperation:'設備運轉中'};

test('實際量測流程已刪除室外是否下雨欄位',()=>{const {template}=loadRuntime();assert.equal(template.fields.some(x=>x.id==='noiseRain'),false);assert.ok(template.fields.some(x=>x.id==='noiseWind'));});
test('天雨路濕仍只存在於不進行量測原因',()=>{const {template}=loadRuntime();const f=template.fields.find(x=>x.id==='noiseNoMeasureReason');assert.ok(f.options.some(x=>x.id==='rain'));});
test('尚未輸入量測值時研判結果有明確待判狀態',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'complainant'});assert.match(out.noiseResultText,/尚無量測資料/);});
test('全頻值輸入後研判結果即時更新為未超標',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'complainant',noiseValueFull:'63.5'});assert.match(out.noiseResultText,/63\.5 dB/);assert.match(out.noiseResultText,/未超過標準/);assert.equal(out.noiseOutcomeId,'article9.compliant');});
test('高於標準但尚缺背景音時研判結果顯示待完成背景音',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'complainant',noiseValueFull:'100'});assert.match(out.noiseResultText,/高於標準/);assert.match(out.noiseResultText,/需完成背景音量確認/);assert.equal(out.noiseOutcomeId,'');});
test('室外量測尚未輸入風速時研判結果顯示氣象待確認',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'authority',noiseValueFull:'63.5'});assert.match(out.noiseResultText,/尚待輸入風速/);assert.match(out.noiseValidation,/輸入風速/);});
test('風速大於5即使噪音值很高也優先判定氣象條件不符',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'authority',noiseWind:'6',noiseValueFull:'100',noiseBgFullMode:'measured',noiseBgFull:'80'});assert.equal(out.noiseOutcomeId,'article9.weather.wind');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseResultText,/未符合噪音管制標準量測時氣象條件之規定/);assert.match(out.noiseResultText,/無法量測具代表性之數據/);assert.doesNotMatch(out.noiseResultText,/超過標準/);assert.doesNotMatch(out.noiseRecord,/第24條|限期改善|超過噪音管制標準/);assert.match(out.noiseRecord,/未符合噪音管制標準量測時氣象條件之規定/);assert.match(out.noiseRecord,/無法量測具代表性之數據/);});
test('舊 noiseRain 值不再影響已進入量測之案件',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseFullPoint:'authority',noiseRain:'yes',noiseWind:'2',noiseValueFull:'63.5'});assert.equal(out.noiseOutcomeId,'article9.compliant');assert.doesNotMatch(out.noiseValidation||'',/下雨/);});
test('不進行量測時研判結果明確顯示不作符合超標判定',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'doorLocked'});assert.match(out.noiseResultText,/不進行噪音量測/);assert.match(out.noiseResultText,/不作符合／超標判定/);});
test('天雨路濕不填補充說明仍可形成紀錄且不推定作業情形',()=>{const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'rain',noiseNoMeasureDetail:''});assert.equal(out.noiseOutcomeId,'article9.weather.rain');assert.equal(out.noiseBlocked,'no');assert.match(out.noiseRecord,/天雨路濕依法規定不宜量測噪音/);assert.match(out.noiseReply,/未符合噪音管制標準量測時氣象條件之規定/);assert.doesNotMatch(out.noiseRecord,/稽查時未確認|稽查時，/);assert.doesNotMatch(out.noiseReply,/稽查時未確認|稽查時，/);});
