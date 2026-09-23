const fs=require('fs');
const vm=require('vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const rel of ['data/water-permit-rules.js','src/water-permit-law.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
}
function ok(cond,msg){if(!cond)throw new Error(msg);}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('Water Permit Rule Pack loads metadata and comparison contract',()=>{
  const p=context.window.WATER_PERMIT_RULE_PACK;
  ok(p?.meta?.packId==='WATER-PERMIT-TW','pack id');
  ok(p.comparisonItems.length===6,'comparison items');
  ok(p.referenceStates.includes('full')&&p.referenceStates.includes('partial'),'reference states');
});

test('Water Permit Rule Pack integrity passes',()=>{
  const r=context.window.WaterPermitLaw.verifyIntegrity();
  ok(r.ok,'integrity failed '+JSON.stringify(r));
});

test('permit version before 2026-03-24 resolves to 2024 regime',()=>{
  const r=context.window.WaterPermitLaw.resolveVersion('2026-03-23');
  ok(r.status==='resolved','version');
  ok(r.regime==='2024-01-11-general','regime');
});

test('permit version 2026-03-24 through 2026-09-30 keeps old general rules with article 57 immediate',()=>{
  const r=context.window.WaterPermitLaw.resolveVersion('2026-09-21');
  ok(r.status==='resolved','version');
  ok(r.regime==='2024-01-11-general-with-2026-art57','mixed regime');
  ok(r.text.includes('第57條'),'article 57 note');
});

test('permit version from 2026-10-01 uses 2026 revision',()=>{
  const r=context.window.WaterPermitLaw.resolveVersion('2026-10-01');
  ok(r.status==='resolved','version');
  ok(r.regime==='2026-03-24-revision-effective','new regime');
});

test('unknown behavior date stays unresolved',()=>{
  const r=context.window.WaterPermitLaw.resolveVersion('');
  ok(r.status==='dateUnknown','unknown date');
  ok(r.text.includes('行為發生日期尚未確認'),'date message');
});

test('dates before loaded historical coverage never back-apply newer permit law',()=>{
  const r=context.window.WaterPermitLaw.resolveVersion('2024-01-10');
  ok(r.status==='historicalVersionMissing','historical missing');
  ok(r.text.includes('不以較新版本回溯判斷'),'no backdating');
});

test('permit subject eligibility comes from pack',()=>{
  ok(context.window.WaterPermitLaw.subjectEligible({waterSubjectType:'sewerSystem'}),'sewer eligible');
  ok(context.window.WaterPermitLaw.subjectEligible({waterSubjectType:'business',waterSubjectConfirmed:'yes'}),'confirmed business eligible');
  ok(!context.window.WaterPermitLaw.subjectEligible({waterSubjectType:'business',waterSubjectConfirmed:'unknown'}),'unconfirmed business not eligible');
  ok(!context.window.WaterPermitLaw.subjectEligible({waterSubjectType:'nonBusiness'}),'nonbusiness not eligible');
});

test('permit comparable reference policy comes from pack',()=>{
  ok(context.window.WaterPermitLaw.comparableReference({waterPermitReferenceStatus:'full'}),'full');
  ok(context.window.WaterPermitLaw.comparableReference({waterPermitReferenceStatus:'partial'}),'partial');
  ok(!context.window.WaterPermitLaw.comparableReference({waterPermitReferenceStatus:'unavailable'}),'unavailable');
});

console.log(`water permit rule pack tests: ${count}/${count} PASS`);
