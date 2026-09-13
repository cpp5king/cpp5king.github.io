const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
global.window=global;global.globalThis=global;global.TemplatePatches={};
vm.runInThisContext(fs.readFileSync(path.join(root,'src/water-v482.js'),'utf8'),{filename:'src/water-v482.js'});
let pass=0,fail=0;
function ok(name,cond,detail=''){if(cond){console.log('PASS',name);pass++;}else{console.error('FAIL',name,detail);fail++;}}
function eq(name,a,b){ok(name,a===b,`expected=${JSON.stringify(b)} actual=${JSON.stringify(a)}`)}
const config={templates:[
  {id:'water-field',fields:[{id:'waterInspectionDate',label:'案件／稽查日期',type:'date',missing:'尚待確認'}]},
  {id:'water-main',fields:[{id:'waterInspectionDate',label:'稽查日期（用於判定子法施行版本）',type:'date',missing:'尚待確認'}]}
]};
TemplatePatches.waterInspectionTime482(config);
for(const t of config.templates){
  const d=t.fields.find(f=>f.id==='waterInspectionDate');
  const tm=t.fields.find(f=>f.id==='waterInspectionTime');
  eq(`${t.id} date label`,d.label,'稽查日期');
  eq(`${t.id} time label`,tm.label,'稽查時間（24小時制）');
  eq(`${t.id} time type`,tm.type,'time');
  eq(`${t.id} time picker hour`,tm.timePicker.hour,'時');
  eq(`${t.id} time picker minute`,tm.timePicker.minute,'分');
  ok(`${t.id} initialValues function`,typeof t.initialValues==='function');
  const v=t.initialValues();
  ok(`${t.id} date prefilled YYYY-MM-DD`,/^\d{4}-\d{2}-\d{2}$/.test(v.waterInspectionDate),v.waterInspectionDate);
  ok(`${t.id} time prefilled 24h HH:mm`,/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.waterInspectionTime),v.waterInspectionTime);
}
const config2={templates:[{id:'water-main',initialValues:()=>({foo:'bar',waterInspectionDate:'2026-01-02',waterInspectionTime:'03:04'}),fields:[{id:'waterInspectionDate',type:'date'}]}]};
TemplatePatches.waterInspectionTime482(config2);
const v2=config2.templates[0].initialValues();
eq('existing initial value preserved',v2.foo,'bar');
eq('existing water date not overwritten',v2.waterInspectionDate,'2026-01-02');
eq('existing water time not overwritten',v2.waterInspectionTime,'03:04');
console.log(`RESULT ${pass}/${pass+fail} passed`);if(fail)process.exit(1);
