const fs=require('fs');
const vm=require('vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const rel of ['data/water-standard-rules.js','src/water-standard-law.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
}
function ok(cond,msg){if(!cond)throw new Error(msg);}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('Water Standard Rule Pack loads routing metadata',()=>{
  const p=context.window.WATER_STANDARD_RULE_PACK;
  ok(p?.meta?.packId==='WATER-STANDARD-TW','pack id');
  ok(p.defaultBusinessAppendix==='8','default business appendix');
  ok(p.buildingAppendix==='15','building appendix');
  ok(p.totalLoadControlAppendix==='16','total load appendix');
});

test('Water Standard Rule Pack integrity passes',()=>{
  const r=context.window.WaterStandardLaw.verifyIntegrity();
  ok(r.ok,'integrity failed '+JSON.stringify(r));
});

test('current standard version resolves from behavior date',()=>{
  const r=context.window.WaterStandardLaw.resolveVersion('2026-09-21');
  ok(r.status==='resolved','version');
  ok(r.version.id==='WES-2024-12-18','wrong version');
});

test('unknown behavior date stays unresolved',()=>{
  const r=context.window.WaterStandardLaw.resolveVersion('');
  ok(r.status==='dateUnknown','unknown date');
  ok(r.text.includes('行為發生日期尚未確認'),'date warning');
});

test('historical standard version is not back-applied',()=>{
  const r=context.window.WaterStandardLaw.resolveVersion('2024-12-17');
  ok(r.status==='historicalVersionMissing','historical missing');
  ok(r.text.includes('不以較新標準回溯判斷'),'no backdating');
});

test('known business industry routes to specific appendix',()=>{
  const r=context.window.WaterStandardLaw.routeAppendix({
    waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'semiconductor'
  });
  ok(r.status==='routed','route status');
  ok(r.appendix==='1','semiconductor appendix');
});

test('other confirmed business routes to appendix 8',()=>{
  const r=context.window.WaterStandardLaw.routeAppendix({
    waterSubjectType:'business',waterSubjectConfirmed:'yes',waterIndustryType:'construction'
  });
  ok(r.status==='routed','route status');
  ok(r.appendix==='8','other business appendix');
});

test('building sewage routes to appendix 15',()=>{
  const r=context.window.WaterStandardLaw.routeAppendix({waterSubjectType:'buildingSewage'});
  ok(r.status==='routed','route status');
  ok(r.appendix==='15','building appendix');
});

test('sewer system without subtype is never guessed',()=>{
  const r=context.window.WaterStandardLaw.routeAppendix({waterSubjectType:'sewerSystem'});
  ok(r.status==='subtypeRequired','sewer subtype should be required');
  ok(r.appendix===null,'must not guess appendix');
});

test('pack explicitly declares routing-only limitation',()=>{
  const info=context.window.WaterStandardLaw.packInfo();
  ok(info.status==='routing-only','status');
  ok(info.limitations.some(x=>x.includes('不含各水質項目數值限值')),'numeric limitation missing');
});

console.log(`water standard rule pack tests: ${count}/${count} PASS`);
