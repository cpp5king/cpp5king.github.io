const fs=require('fs');
const vm=require('vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const rel of ['data/water-rules.js','src/water-rule-engine.js','src/water-law.js','src/water-v2-facts.js','src/water-v2-assessment.js']){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
}
function ok(cond,msg){if(!cond)throw new Error(msg);}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('single Water Rule Pack loads both legacy and V2 rule contracts',()=>{
  ok(context.window.WATER_RULE_PACK?.packId==='WATER-CORE-TW','pack id');
  ok(Object.keys(context.window.WATER_RULES||{}).length>=24,'legacy rules missing');
  ok(Object.keys(context.window.WATER_V2_RULES||{}).length>=18,'field rules missing');
});

test('Rule Pack integrity checksum passes',()=>{const r=context.window.WaterLaw.verifyIntegrity();ok(r.ok,'integrity failed');});

test('WaterLaw resolves current mother-law version by behavior date',()=>{
  const r=context.window.WaterLaw.resolveLawVersion('2026-09-21');
  ok(r.status==='resolved','version not resolved');
  ok(r.version.id==='WPA-2018-06-13','wrong version');
});

test('unknown behavior date does not fall back to current or inspection date',()=>{
  const r=context.window.WaterLaw.resolveLawVersion('');
  ok(r.status==='dateUnknown','unknown date must remain unresolved');
  ok(r.message.includes('適用法規版本待確認'),'missing warning');
});

test('rule engine remains backward compatible with elements[]',()=>{
  const r=context.window.WaterLaw.evaluate('article14NoPermitGround',{
    subject_regulated:'yes',permit_missing:'yes',method_ground:'yes'
  },'field');
  ok(r.status==='established','legacy element rule failed');
});

test('rule engine supports nested AND + OR',()=>{
  const rule={id:'NEST',version:'1',title:'nested',legalBasis:'test',logic:{op:'AND',items:[
    {id:'a',label:'A'},
    {op:'OR',items:[{id:'b',label:'B'},{id:'c',label:'C'}]}
  ]}};
  const r=context.window.WaterRuleEngine.evaluate(rule,{a:'yes',b:'no',c:'yes'});
  ok(r.status==='established','nested OR failed');
});

test('V2 legal assessment routes through WaterLaw and keeps existing result',()=>{
  const i={
    id:'I1',name:'測試場所',subjectType:'industry',permitStatus:'no',permitType:'',methods:['ground'],
    topics:{B:{status:'',doubtTypes:[]},C:{status:'',doubtTypes:[]},D:{status:'',doubtTypes:[]},E:{status:'',doubtTypes:[]},F:{status:'',doubtTypes:[]}},
    details:{B:{},C:{},D:{},E:{},F:{actualDischarge:'yes',destinationKnown:'yes',destination:'ground',sampled:'no'}},
    building:{facility:{},management:{},records:{},discharge:{}},
    other:{article30:[],controlZone:'',soilDischarge:'',soilTreatmentAuthorized:'',groundwaterInjection:'',notes:''}
  };
  const a=context.window.WaterV2Assessment.assess([i]);
  ok(a.laws.some(x=>x.law==='水污染防治法第14條第1項'),'existing §14 direction changed');
});

console.log(`water rule pack tests: ${count}/${count} PASS`);
