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

test('第9條類型刪除裝修工程與不屬第9條兩個前端選項',()=>{
  const {template}=loadRuntime();const f=template.fields.find(x=>x.id==='noiseA9Type');const ids=f.options.map(x=>x.id);
  assert.equal(ids.includes('renovation'),false);assert.equal(ids.includes('outside'),false);
});

test('全頻測點在是否量測之後、全頻數值之前',()=>{
  const {template}=loadRuntime();const idx=id=>template.fields.findIndex(x=>x.id===id);
  assert.ok(idx('noiseMeasureDecision')<idx('noiseFullPoint'));
  assert.ok(idx('noiseFullPoint')<idx('noiseValueFull'));
});

test('刪除全頻測點是否位於室內獨立欄位，測點標籤自行帶室內外語意',()=>{
  const {template}=loadRuntime();assert.equal(template.fields.some(x=>x.id==='noiseFullIndoor'),false);
  const point=template.fields.find(x=>x.id==='noiseFullPoint');
  assert.match(point.options.find(x=>x.id==='complainant').label,/室內/);
  assert.match(point.options.find(x=>x.id==='authority').label,/室外/);
});

test('決定量測後先要求全頻測點，選測點後才開放全頻數值',()=>{
  const {root}=loadRuntime();
  let out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes'});
  assert.equal(out.noiseShowFullPoint,'yes');assert.equal(out.noiseShowInputFull,'no');assert.match(out.noiseValidation,/先選擇全頻測點/);
  out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseFullPoint:'complainant'});
  assert.equal(out.noiseShowInputFull,'yes');assert.match(out.noiseValidation,/尚無量測資料/);
});

test('陳情人指定測點自動視為室內，不再要求室內外第二題',()=>{
  const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseFullPoint:'complainant',noiseValueFull:'63.5'});
  assert.doesNotMatch(out.noiseValidation||'',/是否位於室內/);assert.equal(out.noiseOutcomeId,'article9.compliant');
  assert.match(out.noiseMeasurementPointText,/室內居住生活地點/);
});

test('低頻量測不要求全頻室內外欄位並可直接判斷',()=>{
  const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseValueLow:'40'});
  assert.equal(out.noiseOutcomeId,'article9.compliant');assert.doesNotMatch(out.noiseValidation||'',/全頻測點|室內/);
});

test('天雨路濕不量測套用既有核定稽查紀錄與民眾回覆',()=>{
  const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseMeasureDecision:'no',noiseNoMeasureReason:'rain',noiseNoMeasureDetail:'設備持續運轉'});
  assert.equal(out.noiseOutcomeId,'article9.weather.rain');assert.match(out.noiseRecord,/現場適逢天雨路濕依法規定不宜量測噪音/);assert.match(out.noiseReply,/未符合噪音管制標準量測時氣象條件之規定/);
});

test('大門深鎖沿用噪音源未運轉模板骨架並只替換現場狀態',()=>{
  const {root}=loadRuntime();const out=root.NoiseMain.prepare({...base,noiseTime:'12:37',noiseSubject:'11',noiseSource:'22',noiseMeasureDecision:'no',noiseNoMeasureReason:'doorLocked'});
  assert.equal(out.noiseOutcomeId,'article9.doorLocked');
  assert.match(out.noiseRecord,/稽查時現場大門深鎖，於周界外亦未發現有明顯噪音擾鄰之情事/);
  assert.doesNotMatch(out.noiseRecord,/未運轉/);assert.match(out.noiseReply,/稽查時現場大門深鎖/);
});

test('整體與背景差小於3dB時顯示再次量測或結束量測選項',()=>{
  const {root,template}=loadRuntime();const f=template.fields.find(x=>x.id==='noiseDifferenceAction');
  assert.ok(f);assert.deepEqual(Array.from(f.options,x=>x.id),['retry','finish']);
  const input={...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseFullPoint:'complainant',noiseValueFull:'80',noiseBgFullMode:'measured',noiseBgFull:'78'};
  const out=root.NoiseMain.prepare(input);
  assert.equal(out.noiseShowDifferenceAction,'yes');assert.match(out.noiseValidation,/再次量測或結束本次量測/);assert.equal(out.noiseOutcomeId,'');
});

test('小於3dB選再次量測會保留案件與量測決定但清除測點和量測資料',()=>{
  const {root}=loadRuntime();const before={...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseFullPoint:'complainant',noiseValueFull:'80',noiseBgFullMode:'measured',noiseBgFull:'78',noiseDifferenceAction:''};
  const next=root.NoiseMain.resetChange(before,{...before,noiseDifferenceAction:'retry'});
  assert.equal(next.noiseMeasureDecision,'yes');assert.equal(next.noiseSource,'空調設備');assert.equal(next.noiseOperation,'設備運轉中');
  assert.equal(next.noiseFullPoint,'');assert.equal(next.noiseValueFull,'');assert.equal(next.noiseBgFull,'');assert.equal(next.noiseDifferenceAction,'');
});

test('小於3dB選結束量測產生不作符合超標判定的既有結束文字',()=>{
  const {root}=loadRuntime();const input={...base,noiseMeasureDecision:'yes',noiseOperation:'設備運轉中',noiseFullPoint:'complainant',noiseValueFull:'80',noiseBgFullMode:'measured',noiseBgFull:'78',noiseDifferenceAction:'finish'};
  const out=root.NoiseMain.prepare(input);
  assert.equal(out.noiseOutcomeId,'article9.differenceEnded');assert.equal(out.noiseBlocked,'no');
  assert.match(out.noiseRecord,/相差小於3分貝/);assert.match(out.noiseRecord,/無法作為執法依據/);assert.doesNotMatch(out.noiseRecord,/符合噪音管制標準|超過噪音管制標準/);
});
