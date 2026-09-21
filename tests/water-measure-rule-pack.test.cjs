const fs=require('fs');
const vm=require('vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const rel of ['data/water-measure-rules.js','src/water-rule-engine.js','src/water-measure-law.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
}
function ok(cond,msg){if(!cond)throw new Error(msg);}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('single Water Measure Rule Pack loads common, industry and catalog contracts',()=>{
  const p=context.window.WATER_MEASURE_RULE_PACK;
  ok(p?.packId==='WATER-MEASURE-TW','pack id');
  ok(Object.keys(p.commonRules||{}).length>=19,'common rules missing');
  ok(Object.keys(p.industryRules||{}).length>=10,'industry rules missing');
  ok(Object.keys(p.industryCatalog?.industries||{}).length>=10,'industry catalog missing');
});

test('Water Measure Rule Pack integrity passes',()=>{
  const r=context.window.WaterMeasureLaw.verifyIntegrity();
  ok(r.ok,'integrity failed '+JSON.stringify(r));
});

test('measure version resolves from behavior date',()=>{
  const r=context.window.WaterMeasureLaw.resolveVersion('2026-09-21');
  ok(r.status==='resolved','measure version not resolved');
  ok(r.version.id==='WMR-2026-04-20-EFFECTIVE','wrong measure version');
});

test('unknown behavior date never falls back to inspection/current date',()=>{
  const r=context.window.WaterMeasureLaw.resolveVersion('');
  ok(r.status==='dateUnknown','unknown date should stay unresolved');
  ok(r.text.includes('行為發生日期尚未確認'),'missing date warning');
});

test('pre-2026-04-20 behavior date does not back-apply current measure pack',()=>{
  const r=context.window.WaterMeasureLaw.resolveVersion('2026-04-19');
  ok(r.status==='historicalVersionMissing','historical version must remain unloaded');
  ok(r.text.includes('不以115年4月20日規則回溯判斷'),'missing no-backdating message');
});

test('common measure rule evaluates when version is resolved',()=>{
  const version=context.window.WaterMeasureLaw.resolveVersion('2026-09-21');
  const r=context.window.WaterMeasureLaw.evaluate('storageMeter',{
    sublawStorageApplicable:'yes',sublawStorageMeterNoncompliance:'yes'
  },'common',{version});
  ok(r.status==='established','common rule should establish factual direction');
});

test('measure rule is gated when law version is unresolved',()=>{
  const version=context.window.WaterMeasureLaw.resolveVersion('');
  const r=context.window.WaterMeasureLaw.evaluate('storageMeter',{
    sublawStorageApplicable:'yes',sublawStorageMeterNoncompliance:'yes'
  },'common',{version});
  ok(r.baseStatus==='insufficient'||r.baseStatus==='established','base status missing');
  ok(r.status==='insufficient','unresolved version must stay pending');
  ok(r.missingFacts.includes('measureLawVersion'),'version fact missing');
});

test('industry rules are evaluated through same pack facade',()=>{
  const version=context.window.WaterMeasureLaw.resolveVersion('2026-09-21');
  const r=context.window.WaterMeasureLaw.evaluate('constructionPlan',{
    industryConstructionApplicable:'yes',constructionReductionPlanViolation:'yes'
  },'industry',{version});
  ok(r.status==='established','industry rule failed');
});

test('legacy global rule names remain available for compatibility',()=>{
  ok(!!context.window.WATER_SUBLAW_RULES?.outletLocation,'legacy common global missing');
  ok(!!context.window.WATER_INDUSTRY_RULES?.article9RainProtection,'legacy industry global missing');
  ok(!!context.window.WATER_INDUSTRY_CATALOG_V485?.industries?.construction,'legacy catalog global missing');
});

console.log(`water measure rule pack tests: ${count}/${count} PASS`);
