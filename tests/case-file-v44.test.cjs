const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');

test('4.4 案件 JSON 可匯出並在同版本還原',async()=>{
  const {root,config}=await loaded();
  const session=root.CaseSession.create(config);
  session.selectCategory('water');session.selectCaseType('water-field-inspection');session.selectTemplate('water-field');
  session.setInputs({waterInspectionDate:'2026-09-11',waterSubjectType:'business',waterSubjectConfirmed:'yes'});
  const before=session.snapshot();
  const text=root.CaseFile.serialize(before,{version:'4.4'});
  const {state}=root.CaseFile.parse(text,config);
  const restored=root.CaseSession.create(config);restored.restore(state);
  assert.deepEqual(plain(restored.snapshot()),plain(before));
});

test('4.4 案件檔拒絕未知模板與錯誤 schema',async()=>{
  const {root,config}=await loaded();
  assert.throws(()=>root.CaseFile.parse('{"schema":"x","schemaVersion":1,"state":{}}',config),/格式或版本/);
  const text=JSON.stringify({schema:root.CaseFile.SCHEMA,schemaVersion:1,state:{categoryId:'water',caseTypeId:'water-field-inspection',templateId:'missing',inputs:{},outputs:null,stale:false}});
  assert.throws(()=>root.CaseFile.parse(text,config),/模板/);
});

test('4.4 不使用任何永久 Storage API',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const source=['src/case-file.js','src/case-session.js','src/sentence-app.js'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|SQLite/i);
});
