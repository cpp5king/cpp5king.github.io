const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
global.window=global; global.globalThis=global;
const files=[
'data/texts/noise-common.js','data/texts/noise-templates.js','data/texts/noise-main.js','data/texts/noise-article8.js','data/texts/noise-article9.js','data/texts/noise-neighbor.js','data/texts/noise-ui.js','src/noise-format.js','data/texts/noise-documents.js','data/texts/noise-result-map.js','src/noise-text.js','data/rules/noise-article8.js','data/rules/noise-article9.js','src/noise-zone.js','src/noise-main.js','src/noise-method-guidance.js','src/noise-composite.js','src/noise-boundary.js','src/noise-priority-routing.js','src/noise-approved-drafts.js'
];
for(const f of files) vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
let pass=0,fail=0;
function ok(name,cond,detail=''){ if(cond){console.log('PASS',name);pass++;} else {console.error('FAIL',name,detail);fail++;} }
function eq(name,a,b){ok(name,a===b,`expected=${JSON.stringify(b)} actual=${JSON.stringify(a)}`)}
function base(extra={}){return {noiseDate:'2026-09-13',noiseTime:'13:00',noiseNature:'measurable',noiseSpecial:'ordinary',noiseZoneMode:'manual',noiseZone:'2',noiseA8Act:'none',noiseA9Type:'factory',...extra};}

// 1: A9 measure decision is available before subject/source.
let o=NoiseMain.prepare(base());
eq('A9 decision visible with blank subject/source',o.noiseShowMeasureDecision,'yes');
ok('blank subject/source no longer blocks measurement with subject validation',!/稽查對象代稱|主要噪音源/.test(o.noiseValidation||''),o.noiseValidation);

// 2: choosing measurement exposes point/value flow while subject/source blank.
o=NoiseMain.prepare(base({noiseMeasureDecision:'yes'}));
eq('measurement inputs visible before names',o.noiseShowMeasureInputs,'yes');
eq('full point visible before names',o.noiseShowFullPoint,'yes');

// 3: measurement can be entered and assessed while names still blank. Use clearly compliant value.
o=NoiseMain.prepare(base({noiseMeasureDecision:'yes',noiseFullPoint:'complainant',noiseValueFull:'40',noiseGeneralSpecialAssessment:'no',noiseGeneralMethod:'leq',noiseOperation:'作業中'}));
ok('measurement result calculated before names',String(o.noiseResultText||'').length>0,o.noiseResultText);
ok('after assessment asks to backfill subject, not erase result',/補填稽查對象代稱/.test(o.noiseValidation||''),o.noiseValidation);

// 4: backfilling source must preserve measurement data through resetChange.
const before=base({noiseMeasureDecision:'yes',noiseFullPoint:'authority',noiseWind:'1.5',noiseValueFull:'62',noiseValueLow:'35',noiseBgFullMode:'measured',noiseBgFull:'55',noiseBackgroundHistory:'[{"round":1}]',noiseDifferenceRetryState:'yes',noiseSubject:'工程A',noiseSource:''});
const after={...before,noiseSource:'切割機'};
const r=NoiseMain.resetChange(before,after);
eq('source backfill preserves measure decision',r.noiseMeasureDecision,'yes');
eq('source backfill preserves point',r.noiseFullPoint,'authority');
eq('source backfill preserves wind',r.noiseWind,'1.5');
eq('source backfill preserves full',r.noiseValueFull,'62');
eq('source backfill preserves low',r.noiseValueLow,'35');
eq('source backfill preserves bg',r.noiseBgFull,'55');
eq('source backfill preserves history',r.noiseBackgroundHistory,'[{"round":1}]');

// 5: A8 none -> actual prohibited act must clear A9 and downstream state.
const a8Before=base({noiseA8Act:'none',noiseA9Type:'factory',noiseSubject:'工程A',noiseSource:'切割機',noiseMeasureDecision:'yes',noiseOperation:'作業中',noiseFullPoint:'authority',noiseWind:'1.2',noiseValueFull:'65',noiseBgFullMode:'measured',noiseBgFull:'50',noiseBackgroundHistory:'[{"round":1}]'});
const a8After={...a8Before,noiseA8Act:'karaoke'};
const rr=NoiseMain.resetChange(a8Before,a8After);
eq('A8 actual act clears A9 type',rr.noiseA9Type,'');
eq('A8 actual act clears A9 subject',rr.noiseSubject,'');
eq('A8 actual act clears A9 source',rr.noiseSource,'');
eq('A8 actual act clears measure decision',rr.noiseMeasureDecision,'');
eq('A8 actual act clears measurement value',rr.noiseValueFull,'');
eq('A8 actual act clears background history',rr.noiseBackgroundHistory,'');

// 6: prepare with A8 act pending exception must not show A9.
o=NoiseMain.prepare({...a8After,noiseA9Type:'factory'});
eq('A8 pending exception hides A9',o.noiseShowA9,'no');
eq('A8 pending exception hides measure decision',o.noiseShowMeasureDecision,'no');

// 7: A8 karaoke not exempt -> direct Article 8, A9 hidden.
o=NoiseMain.prepare(base({noiseA8Act:'karaoke',noiseA8Ex_karaoke_a8KaraokeRegistered:'no'}));
eq('A8 not exempt outcome',o.noiseOutcomeId,'article8.established');
eq('A8 established hides A9',o.noiseShowA9,'no');

// 8: A8 karaoke exempt -> A9 can reopen.
o=NoiseMain.prepare(base({noiseA8Act:'karaoke',noiseA8Ex_karaoke_a8KaraokeRegistered:'yes',noiseA8Ex_karaoke_a8KaraokeZoning:'yes'}));
eq('A8 exempt reopens A9',o.noiseShowA9,'yes');

console.log(`RESULT ${pass}/${pass+fail} passed`); if(fail)process.exit(1);
