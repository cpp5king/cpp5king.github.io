const fs=require('fs');
const vm=require('vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const rel of ['data/water-local-rules.js','src/water-local-law.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
}
function ok(cond,msg){if(!cond)throw new Error(msg);}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('New Taipei Water Local Rule Pack loads three stricter-standard entries',()=>{
  const p=context.window.WATER_LOCAL_RULE_PACK;
  ok(p?.meta?.packId==='WATER-LOCAL-NTPC','pack id');
  ok(p.standards.length===3,'standard count');
  ok(p.standards.some(x=>x.areaKey==='daanMain'),'Daan missing');
  ok(p.standards.some(x=>x.areaKey==='taliao'),'Taliao missing');
  ok(p.standards.some(x=>x.areaKey==='dahan'),'Dahan missing');
});

test('Water Local Rule Pack integrity passes',()=>{
  const r=context.window.WaterLocalLaw.verifyIntegrity();
  ok(r.ok,'integrity failed '+JSON.stringify(r));
});

test('unknown receiving-water area never auto-applies a local standard',()=>{
  const r=context.window.WaterLocalLaw.resolveArea('', '2026-09-21');
  ok(r.status==='areaUnknown','area should stay unknown');
  ok(r.standard===null,'must not auto select local standard');
});

test('explicit Dahan area returns only a candidate pending scope verification',()=>{
  const r=context.window.WaterLocalLaw.resolveArea('dahan','2026-09-21');
  ok(r.status==='candidate','candidate status');
  ok(r.standard?.id==='NTPC-DAHAN-2025','wrong standard');
  ok(r.message.includes('仍須確認'),'scope verification warning');
});

test('local rule is not back-applied before its publication date',()=>{
  const r=context.window.WaterLocalLaw.resolveArea('dahan','2025-08-19');
  ok(r.status==='notYetPublished','publication gate');
  ok(r.message.includes('不以該地方標準回溯判斷'),'no backdating');
});

test('unknown local area key is not guessed',()=>{
  const r=context.window.WaterLocalLaw.resolveArea('someOtherWater','2026-09-21');
  ok(r.status==='areaUnrecognized','unrecognized area');
  ok(r.standard===null,'must not guess');
});

test('local precedence reminds caller to check local stricter standard before national fallback',()=>{
  const m=context.window.WaterLocalLaw.precedenceMessage();
  ok(m.includes('地方')&&m.includes('中央放流水標準'),'precedence message');
});

test('Local Pack declares no numeric limits and no automatic geographic inference',()=>{
  const info=context.window.WaterLocalLaw.packInfo();
  ok(info.status==='test-routing-only','status');
  ok(info.limitations.some(x=>x.includes('不內建地方加嚴數值限值')),'numeric limitation');
  ok(info.limitations.some(x=>x.includes('不依地址')||x.includes('不依地址、里別或座標')),'geographic limitation');
});

console.log(`water local rule pack tests: ${count}/${count} PASS`);
