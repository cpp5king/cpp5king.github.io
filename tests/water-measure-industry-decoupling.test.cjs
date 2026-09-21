const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');

function env(){
  const context={window:{},console};vm.createContext(context);
  for(const rel of ['data/water-measure-rules.js','src/water-rule-engine.js','src/water-measure-law.js']){
    vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),context,{filename:rel});
  }
  return context.window;
}
const plain=v=>JSON.parse(JSON.stringify(v));

test('Measure Pack owns extended industry field metadata and legal thresholds',()=>{
  const root=env();
  const fields=plain(root.WaterMeasureLaw.industryFieldDefinitions());
  assert.equal(fields.length,56);
  const byId=new Map(fields.map(f=>[f.id,f]));
  assert.match(byId.get('waterLivestockFishDailyVolumeCompliant').label,/4立方公尺/);
  assert.match(byId.get('waterLivestockFishStockingCompliant').label,/200頭/);
  assert.match(byId.get('waterLivestockFishDOCompliant').label,/1\.0 mg\/L/);
  assert.match(byId.get('waterLivestockFishFreeboardCompliant').label,/30公分/);
  assert.match(byId.get('waterHighTech49_9Trigger').label,/第49條之9/);
});

test('water-industry-v485 no longer owns extended legal strings or threshold text',()=>{
  const source=fs.readFileSync(path.join(ROOT,'src/water-industry-v485.js'),'utf8');
  for(const pattern of [/§45/,/§46/,/§47/,/§48/,/§49-8/,/§49-9/,/4立方公尺/,/200頭/,/1\.0 mg\/L/,/30公分/,/TMAH/,/油脂截留/]){
    assert.doesNotMatch(source,pattern);
  }
  assert.match(source,/WaterMeasureLaw\.evaluateIndustryExtensions/);
  assert.match(source,/WaterMeasureLaw\.industryFieldDefinitions/);
  assert.match(source,/WaterMeasureLaw\.industryOptions/);
});

test('industry option labels are supplied by Measure Pack catalog',()=>{
  const root=env();
  const options=plain(root.WaterMeasureLaw.industryOptions());
  assert.ok(options.some(x=>x.id==='shipDismantling'&&x.label==='船舶解體業'));
  assert.ok(options.some(x=>x.id==='semiconductor'&&x.label==='晶圓製造及半導體製造業'));
  assert.ok(options.some(x=>x.id==='unknown'&&x.label==='尚待確認'));
});

test('extended ship rule evaluation is supplied by WaterMeasureLaw',()=>{
  const root=env();
  const out=plain(root.WaterMeasureLaw.evaluateIndustryExtensions({
    waterIndustryType:'shipDismantling',
    waterShipContainmentCompliant:'yes',
    waterShipOilBoomCompliant:'no',
    waterShipReceivingFacilitiesCompliant:'yes',
    waterSpecialOperationTypes:['none']
  },{lawReady:true}));
  assert.ok(out.sections.some(x=>x.includes('§45')&&x.includes('浮油攔除設備：疑似不符')));
  assert.ok(out.concerns.some(x=>x.includes('§45 浮油攔除設備')));
});

test('high-tech guidance and §49-9 evaluation come from Measure Pack',()=>{
  const root=env();
  const guide=plain(root.WaterMeasureLaw.industryGuidance({waterIndustryType:'semiconductor'}));
  assert.match(guide.highTechRequiredStreamsText,/TMAH/);
  const out=plain(root.WaterMeasureLaw.evaluateIndustryExtensions({
    waterIndustryType:'semiconductor',
    waterHighTech49_9Trigger:'yes',
    waterHighTechSeparatedCollectionCompliant:'no',
    waterSpecialOperationTypes:['none']
  },{lawReady:true}));
  assert.ok(out.overview.some(x=>x.includes('§49-9')&&x.includes('疑似不符')));
});

test('extended industry rules remain version-gated',()=>{
  const root=env();
  const out=plain(root.WaterMeasureLaw.evaluateIndustryExtensions({
    waterIndustryType:'shipDismantling',
    waterShipContainmentCompliant:'no',
    waterShipOilBoomCompliant:'no',
    waterShipReceivingFacilitiesCompliant:'no',
    waterSpecialOperationTypes:['none']
  },{lawReady:false}));
  assert.ok(out.sections.some(x=>x.includes('版本尚待確認')));
  assert.equal(out.concerns.length,0);
});

test('Measure Pack integrity includes industry extension and field metadata',()=>{
  const root=env();
  const result=plain(root.WaterMeasureLaw.verifyIntegrity());
  assert.equal(result.ok,true);
  assert.match(root.WaterMeasureLaw.packInfo().packVersion,/^2026\.09\.21\.\d+$/);
});
