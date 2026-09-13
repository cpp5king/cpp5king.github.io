const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');global.window=global;global.globalThis=global;
for(const f of ['data/texts/noise-common.js','data/texts/noise-templates.js','data/texts/noise-main.js','data/texts/noise-article8.js','data/texts/noise-article9.js','data/texts/noise-neighbor.js','data/texts/noise-ui.js','src/noise-format.js','data/texts/noise-documents.js','data/texts/noise-result-map.js','src/noise-text.js','data/rules/noise-article8.js','data/rules/noise-article9.js','src/noise-zone.js','src/noise-main.js','src/noise-method-guidance.js','src/noise-composite.js','src/noise-boundary.js','src/noise-priority-routing.js','src/noise-approved-drafts.js']) vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
let pass=0,fail=0; const ok=(n,c,d='')=>{if(c){console.log('PASS',n);pass++}else{console.error('FAIL',n,d);fail++}}; const eq=(n,a,b)=>ok(n,a===b,`${a} !== ${b}`);
const base=(e={})=>({noiseDate:'2026-09-13',noiseTime:'13:00',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'manual',noiseZone:'2',noiseA8Act:'none',noiseA9Type:'factory',...e});
// A8 exception switching
let b=base({noiseA8Act:'karaoke',noiseA8Ex_karaoke_a8KaraokeRegistered:'yes',noiseA8Ex_karaoke_a8KaraokeZoning:'yes'}), a={...b,noiseA8Act:'construction'};
let r=NoiseMain.resetChange(b,a);eq('switch A8 clears karaoke reg',r.noiseA8Ex_karaoke_a8KaraokeRegistered,'');eq('switch A8 clears karaoke zoning',r.noiseA8Ex_karaoke_a8KaraokeZoning,'');
// weather visibility
let o=NoiseMain.prepare(base({noiseMeasureDecision:'yes',noiseFullPoint:'complainant'}));eq('indoor point hides wind',o.noiseShowWeather,'no');
o=NoiseMain.prepare(base({noiseMeasureDecision:'yes',noiseFullPoint:'authority'}));eq('outdoor point shows wind before full value',o.noiseShowWeather,'yes');
// wind invalid
 o=NoiseMain.prepare(base({noiseSubject:'A',noiseSource:'機台',noiseMeasureDecision:'yes',noiseOperation:'作業中',noiseFullPoint:'authority',noiseWind:'5.1',noiseValueFull:'70',noiseGeneralMethod:'leq'}));eq('wind >5 outcome',o.noiseOutcomeId,'article9.weather.wind');
// A9 type switch preserves common measurement
b=base({noiseA9Type:'factory',noiseSubject:'A',noiseSource:'設備',noiseMeasureDecision:'yes',noiseOperation:'作業中',noiseFullPoint:'authority',noiseWind:'2',noiseValueFull:'60',noiseValueLow:'30',noiseBgFullMode:'measured',noiseBgFull:'50',noiseBackgroundHistory:'[{"round":1}]'});a={...b,noiseA9Type:'business'};r=NoiseMain.resetChange(b,a);
eq('A9 switch preserves subject',r.noiseSubject,'A');eq('A9 switch preserves source',r.noiseSource,'設備');eq('A9 switch preserves full',r.noiseValueFull,'60');eq('A9 switch preserves wind',r.noiseWind,'2');eq('A9 switch preserves history',r.noiseBackgroundHistory,'[{"round":1}]');
// entering measurement defaults operation
b=base({noiseMeasureDecision:''});a={...b,noiseMeasureDecision:'yes'};r=NoiseMain.resetChange(b,a);eq('measure yes defaults operation',r.noiseOperation,'作業中');
// source edit doesn't reset no-measure facts
b=base({noiseMeasureDecision:'no',noiseNoMeasureReason:'doorLocked',noiseNoMeasureDetail:'鐵門關閉',noiseSource:''});a={...b,noiseSource:'冷氣設備'};r=NoiseMain.resetChange(b,a);eq('source backfill preserves no-measure reason',r.noiseNoMeasureReason,'doorLocked');eq('source backfill preserves no-measure detail',r.noiseNoMeasureDetail,'鐵門關閉');
// <3 retry preservation
b=base({noiseSubject:'A',noiseSource:'設備',noiseMeasureDecision:'yes',noiseOperation:'作業中',noiseFullPoint:'authority',noiseWind:'1.1',noiseValueFull:'70',noiseBgFullMode:'measured',noiseBgFull:'68',noiseDifferenceAction:''});
o=NoiseMain.prepare(b);eq('<3 exposes retry action',o.noiseShowDifferenceAction,'yes');
a={...b,noiseDifferenceAction:'retry'};r=NoiseMain.resetChange(b,a);eq('retry keeps wind',r.noiseWind,'1.1');eq('retry keeps full',r.noiseValueFull,'70');eq('retry keeps bg mode',r.noiseBgFullMode,'measured');eq('retry clears bg value',r.noiseBgFull,'');eq('retry enables state',r.noiseDifferenceRetryState,'yes');ok('retry records history',/"round":1/.test(r.noiseBackgroundHistory||''),r.noiseBackgroundHistory);
// changing point during retry preserves source measure
b={...r,noiseFullPoint:'authority'};a={...b,noiseFullPoint:'complainant'};r=NoiseMain.resetChange(b,a);eq('retry point change keeps full',r.noiseValueFull,'70');eq('retry point change keeps bg mode',r.noiseBgFullMode,'measured');
console.log(`RESULT ${pass}/${pass+fail} passed`);if(fail)process.exit(1);
