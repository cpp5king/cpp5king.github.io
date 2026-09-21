const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loaded}=require('./helpers.cjs');
const ROOT=path.join(__dirname,'..');

const legalLiteral=/§\s*\d|第\s*\d+\s*條|第\d+條|3小時|24小時|5日內|6個月|4立方公尺|200頭|1\.0\s*mg\/L|30公分|第19條準用|準用第/;

test('Core and Measure Rule Packs restore formal legal labels over neutral text fallbacks',async()=>{
  const {root}=await loaded();
  assert.match(root.WATER_TEXTS.main.permit,/§14/);
  assert.match(root.WATER_TEXTS.main.sublawApprovedMeasures,/水措管理辦法§4/);
  assert.match(root.WATER_FIELD_TEXTS.threeHourNotice,/3小時/);
  assert.match(root.WaterLaw.finalMessage('severeHazard'),/3小時通報/);
});

test('water text fallback files no longer own article numbers or legal deadlines',()=>{
  for(const rel of ['data/texts/water-main.js','data/texts/water-field.js']){
    const source=fs.readFileSync(path.join(ROOT,rel),'utf8');
    assert.doesNotMatch(source,legalLiteral,rel+' must remain a neutral fallback');
  }
});

test('integration and presentation layers do not own mutable article/deadline/threshold literals',()=>{
  for(const rel of [
    'src/water-assessment.js',
    'src/water-v2-ui.js',
    'src/water-documents.js',
    'src/water-industry-v485.js',
    'src/water-permit-check.js'
  ]){
    const source=fs.readFileSync(path.join(ROOT,rel),'utf8');
    assert.doesNotMatch(source,legalLiteral,rel+' must read mutable legal content from Rule Packs');
  }
});

test('water document industry wording remains backward-compatible through Measure catalog metadata',async()=>{
  const {root}=await loaded();
  const docs=root.WaterDocuments.build({
    waterInspectionDate:'2026-09-21',
    waterSubjectType:'business',
    waterIndustryType:'readyMix'
  },{});
  assert.match(docs.recordText,/實際業別初步確認為預拌混凝土（第9條所稱水泥業）/);
  const unknown=root.WaterDocuments.build({
    waterInspectionDate:'2026-09-21',
    waterSubjectType:'business',
    waterIndustryType:'unknown'
  },{});
  assert.match(unknown.recordText,/實際業別初步確認為業別尚待確認/);
});

test('Core and Measure integrity cover UI and document metadata',async()=>{
  const {root}=await loaded();
  assert.equal(root.WaterLaw.verifyIntegrity().ok,true);
  assert.equal(root.WaterMeasureLaw.verifyIntegrity().ok,true);
  assert.ok(root.WaterLaw.packInfo().packVersion);
  assert.ok(root.WaterMeasureLaw.packInfo().packVersion);
});


test('compatibility law-version aggregator reads source metadata only from Rule Packs',async()=>{
  const {root}=await loaded();
  const measureSource=root.WaterMeasureLaw.packInfo().officialSources[0];
  const permitSource=root.WaterPermitLaw.packInfo().officialSources[0];
  assert.deepEqual(
    JSON.parse(JSON.stringify(root.WaterLawVersions.sources.measures)),
    {name:measureSource.title,revision:measureSource.revision,sourceId:measureSource.sourceId}
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(root.WaterLawVersions.sources.permit)),
    {name:permitSource.title,revision:permitSource.revision,sourceId:permitSource.sourceId}
  );
  const source=fs.readFileSync(path.join(ROOT,'src/water-law-versions.js'),'utf8');
  assert.doesNotMatch(source,/2026-04-20|2026-03-24|FL040734|GL005950/);
});
