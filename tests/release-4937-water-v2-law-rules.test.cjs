const fs=require('fs');
const vm=require('vm');
const path=require('node:path').join(__dirname,'..','src','water-v2-ui.js');
let src=fs.readFileSync(path,'utf8');
src=src.replace("root.WaterV2UI=Object.freeze({", "root.__test={state,createInspection,lawAssessment};\n  root.WaterV2UI=Object.freeze({");
const context={window:{},console};vm.createContext(context);vm.runInContext(src,context);
const {state,createInspection,lawAssessment}=context.window.__test;
function reset(){state.inspections=[];state.currentInspection=null;}
function assess(i){reset();state.inspections.push(i);return lawAssessment();}
function lawNames(a){return a.laws.map(x=>x.law);}
function hasLaw(a,name){return lawNames(a).includes(name);}
function hasPending(a,part){return a.pending.some(x=>x.includes(part));}
function ok(cond,msg){if(!cond)throw new Error(msg);}
function base(type='industry',name='AA'){const i=createInspection({name});i.subjectType=type;return i;}
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}

test('B排放許可差異→14Ⅰ',()=>{const i=base();i.permitStatus='yes';i.permitType='discharge';i.topics.B.status='doubt';i.topics.B.doubtTypes=['permit_mismatch'];i.topics.B.factText='水量與許可不符';const a=assess(i);ok(hasLaw(a,'水污染防治法第14條第1項'),'missing 14');});
test('B貯留許可差異→20，不出14',()=>{const i=base();i.permitStatus='yes';i.permitType='storage';i.topics.B.status='doubt';i.topics.B.doubtTypes=['permit_mismatch'];i.topics.B.factText='水量不符';const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing 20');ok(!hasLaw(a,'水污染防治法第14條第1項'),'unexpected14');});
test('B稀釋許可差異→20',()=>{const i=base();i.permitStatus='yes';i.permitType='dilution';i.topics.B.status='doubt';i.topics.B.doubtTypes=['permit_mismatch'];i.topics.B.factText='操作不符';const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing20');});
test('許可類型未知不直接套14/20',()=>{const i=base();i.permitStatus='yes';i.permitType='unknown';i.topics.B.status='doubt';i.topics.B.doubtTypes=['permit_mismatch'];i.topics.B.factText='差異';const a=assess(i);ok(!hasLaw(a,'水污染防治法第14條第1項'),'bad14');ok(!hasLaw(a,'水污染防治法第20條'),'bad20');ok(hasPending(a,'許可類型尚無法確認'),'no pending');});
test('有許可但未選類型→待確認',()=>{const i=base();i.permitStatus='yes';const a=assess(i);ok(hasPending(a,'核對的有效許可／核准類型'),'no permit type pending');});
test('其他水措核准差異→待確認不硬套',()=>{const i=base();i.permitStatus='yes';i.permitType='other';i.topics.C.status='doubt';i.topics.C.doubtTypes=['permit_mismatch'];i.topics.C.factText='差異';const a=assess(i);ok(!hasLaw(a,'水污染防治法第14條第1項'),'bad14');ok(hasPending(a,'具體法規義務'),'no pending');});

test('F地面水體一般路徑差異+排放許可→14Ⅰ',()=>{const i=base();i.permitStatus='yes';i.permitType='discharge';Object.assign(i.details.F,{actualDischarge:'yes',routeMatch:'no',nonApprovedFinalOutlet:'no',destinationKnown:'yes',destination:'ground'});const a=assess(i);ok(hasLaw(a,'水污染防治法第14條第1項'),'missing14');});
test('F納管一般路徑差異不套14',()=>{const i=base();i.permitStatus='yes';i.permitType='discharge';Object.assign(i.details.F,{actualDischarge:'yes',routeMatch:'no',nonApprovedFinalOutlet:'no',destinationKnown:'yes',destination:'sewer'});const a=assess(i);ok(!hasLaw(a,'水污染防治法第14條第1項'),'bad14');ok(hasPending(a,'實際最終去向為納管'),'no pending');});
test('F非核准出口→18-1Ⅰ且不自動14',()=>{const i=base();i.permitStatus='yes';i.permitType='discharge';Object.assign(i.details.F,{actualDischarge:'yes',routeMatch:'no',nonApprovedFinalOutlet:'yes',destinationKnown:'yes',destination:'ground'});const a=assess(i);ok(hasLaw(a,'水污染防治法第18條之1第1項'),'missing18-1-1');ok(!hasLaw(a,'水污染防治法第14條第1項'),'bad14');});
test('F路徑差異但出口是否核准未知→待確認',()=>{const i=base();Object.assign(i.details.F,{actualDischarge:'yes',routeMatch:'no'});const a=assess(i);ok(hasPending(a,'非核准最終放流口'),'no pending');});
test('禁止稀釋四事實完整→18-1Ⅱ',()=>{const i=base();Object.assign(i.details.F,{dilutionNeedsTreatment:'yes',mixedWater:'yes',mixedWaterClean:'yes',mixedBeforeDischarge:'yes'});const a=assess(i);ok(hasLaw(a,'水污染防治法第18條之1第2項'),'missing18-1-2');});
test('處理設施應運轉未運轉且無替代→18-1Ⅳ',()=>{const i=base();Object.assign(i.details.E,{needsTreatment:'yes',shouldOperate:'yes',actuallyRunning:'no',alternativeTreatment:'no'});const a=assess(i);ok(hasLaw(a,'水污染防治法第18條之1第4項'),'missing18-1-4');});
test('處理設施未運轉替代方式未知→先待確認',()=>{const i=base();Object.assign(i.details.E,{needsTreatment:'yes',shouldOperate:'yes',actuallyRunning:'no'});const a=assess(i);ok(!hasLaw(a,'水污染防治法第18條之1第4項'),'premature18-1-4');ok(hasPending(a,'替代處理方式'),'no pending');});

test('應設水量計未設→18',()=>{const i=base();Object.assign(i.details.B,{meterRequired:'yes',meterInstalled:'no'});const a=assess(i);ok(hasLaw(a,'水污染防治法第18條'),'missing18');ok(hasPending(a,'法定設置位置'),'no pending');});
test('應有紀錄無法提供→18',()=>{const i=base();Object.assign(i.details.D,{recordRequired:'yes',recordAvailable:'no'});const a=assess(i);ok(hasLaw(a,'水污染防治法第18條'),'missing18');});
test('污水下水道水量計義務→19準用18',()=>{const i=base('sewer');Object.assign(i.details.B,{meterRequired:'yes',meterInstalled:'no'});const a=assess(i);ok(hasLaw(a,'水污染防治法第19條準用第18條'),'missing19/18');});
test('污水下水道排放許可差異→19準用14Ⅰ',()=>{const i=base('sewer');i.permitStatus='yes';i.permitType='discharge';i.topics.B.status='doubt';i.topics.B.doubtTypes=['permit_mismatch'];i.topics.B.factText='差異';const a=assess(i);ok(hasLaw(a,'水污染防治法第19條準用第14條第1項'),'missing19/14');});
test('污水下水道無貯留許可→直接20，不冠19準用',()=>{const i=base('sewer');i.permitStatus='no';i.methods=['storage'];const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing20');ok(!lawNames(a).some(x=>x.includes('第19條準用第20條')),'bad19/20');});
test('污水下水道稀釋許可差異→直接20',()=>{const i=base('sewer');i.permitStatus='yes';i.permitType='dilution';i.topics.C.status='doubt';i.topics.C.doubtTypes=['permit_mismatch'];i.topics.C.factText='差異';const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing20');ok(!lawNames(a).some(x=>x.includes('19條準用第20')),'bad19/20');});
test('事業無貯留許可→20',()=>{const i=base();i.permitStatus='no';i.methods=['storage'];const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing20');});
test('事業無稀釋許可→20',()=>{const i=base();i.permitStatus='no';i.methods=['dilution'];const a=assess(i);ok(hasLaw(a,'水污染防治法第20條'),'missing20');});
test('全量回收不單憑方式直接套20',()=>{const i=base();i.permitStatus='no';i.methods=['recycle'];const a=assess(i);ok(!hasLaw(a,'水污染防治法第20條'),'bad20');ok(hasPending(a,'是否涉及廢水貯留'),'no pending');});
test('全量委託不單憑方式直接套20',()=>{const i=base();i.permitStatus='no';i.methods=['委託'];const a=assess(i);ok(!hasLaw(a,'水污染防治法第20條'),'bad20');ok(hasPending(a,'是否涉及廢水貯留'),'no pending');});

test('F排土壤+合法例外未知→32方向+待確認',()=>{const i=base();Object.assign(i.details.F,{destinationKnown:'yes',destination:'soil',soilTreatmentAuthorized:'unknown'});const a=assess(i);ok(hasLaw(a,'水污染防治法第32條方向'),'missing32dir');ok(hasPending(a,'土壤排放是否已處理符合'),'no pending');});
test('F排土壤+合法例外已確認→不列32違規方向',()=>{const i=base();Object.assign(i.details.F,{destinationKnown:'yes',destination:'soil',soilTreatmentAuthorized:'yes'});const a=assess(i);ok(!lawNames(a).some(x=>x.includes('第32條')),'unexpected32');});
test('F排土壤+合法例外不具備→32Ⅰ',()=>{const i=base();Object.assign(i.details.F,{destinationKnown:'yes',destination:'soil',soilTreatmentAuthorized:'no'});const a=assess(i);ok(hasLaw(a,'水污染防治法第32條第1項'),'missing32');});
test('F注入地下水→32Ⅰ',()=>{const i=base();Object.assign(i.details.F,{destinationKnown:'yes',destination:'groundwater'});const a=assess(i);ok(hasLaw(a,'水污染防治法第32條第1項'),'missing32');});

test('第30行為但管制區未知→不先列30，改待確認',()=>{const i=base('other');i.other.article30=['kill_aquatic'];i.other.controlZone='unknown';const a=assess(i);ok(!hasLaw(a,'水污染防治法第30條方向'),'premature30');ok(hasPending(a,'水污染管制區'),'no pending');});
test('第30行為但明確不在管制區→不列30',()=>{const i=base('other');i.other.article30=['kill_aquatic'];i.other.controlZone='no';const a=assess(i);ok(!hasLaw(a,'水污染防治法第30條方向'),'bad30');});
test('在管制區捕殺水生物→30方向',()=>{const i=base('other');i.other.article30=['kill_aquatic'];i.other.controlZone='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第30條方向'),'missing30');});
test('在管制區使用農藥→30方向且補指定水體/污染之虞',()=>{const i=base('other');i.other.article30=['pesticide'];i.other.controlZone='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第30條方向'),'missing30');ok(hasPending(a,'指定水體'),'no specific pending');});
test('在管制區棄置→30方向且補位置/物質要件',()=>{const i=base('other');i.other.article30=['discard'];i.other.controlZone='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第30條方向'),'missing30');ok(hasPending(a,'沿岸規定距離'),'no specific pending');});
test('在管制區禽畜→30方向且補指定水體/距離',()=>{const i=base('other');i.other.article30=['livestock'];i.other.controlZone='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第30條方向'),'missing30');ok(hasPending(a,'指定水體或其沿岸'),'no pending');});
test('第30其他行為→補公告禁止要件',()=>{const i=base('other');i.other.article30=['other'];i.other.controlZone='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第30條方向'),'missing30');ok(hasPending(a,'公告禁止'),'no pending');});

test('非管制主體土壤排放合法例外未知→32方向+待確認',()=>{const i=base('other');i.other.soilDischarge='yes';i.other.soilTreatmentAuthorized='unknown';const a=assess(i);ok(hasLaw(a,'水污染防治法第32條方向'),'missing32dir');ok(hasPending(a,'土壤排放是否已處理符合'),'no pending');});
test('非管制主體土壤排放合法例外成立→不列32',()=>{const i=base('other');i.other.soilDischarge='yes';i.other.soilTreatmentAuthorized='yes';const a=assess(i);ok(!lawNames(a).some(x=>x.includes('第32條')),'unexpected32');});
test('非管制主體土壤排放無合法例外→32Ⅰ',()=>{const i=base('other');i.other.soilDischarge='yes';i.other.soilTreatmentAuthorized='no';const a=assess(i);ok(hasLaw(a,'水污染防治法第32條第1項'),'missing32');});
test('非管制主體注入地下水→32Ⅰ',()=>{const i=base('other');i.other.groundwaterInjection='yes';const a=assess(i);ok(hasLaw(a,'水污染防治法第32條第1項'),'missing32');});

test('許可狀態無法確認→待確認，不視為無許可',()=>{const i=base();i.permitStatus='unknown';const a=assess(i);ok(hasPending(a,'是否具有有效水許可'),'no pending');ok(!hasLaw(a,'水污染防治法第14條第1項'),'bad14');});
test('有排放但去向未知→待確認最終去向',()=>{const i=base();i.details.F.actualDischarge='yes';const a=assess(i);ok(hasPending(a,'實際排放之最終去向'),'no pending');});
test('現場採樣不直接判第7條',()=>{const i=base();i.details.F.sampled='yes';const a=assess(i);ok(!lawNames(a).some(x=>x.includes('第7條')),'bad7');ok(hasPending(a,'不自動判定第7條超標'),'no pending');});

const text=fs.readFileSync(path,'utf8');
test('程式不再產生第19條準用第20條',()=>ok(!text.includes('第19條準用第20條'),'bad literal remains'));
test('A區已加入許可類型欄位',()=>ok(text.includes('目前核對的是哪一類許可／核准？'),'permitType UI missing'));
test('第30已加入水污染管制區前提欄位',()=>ok(text.includes('行為地點是否位於公告之水污染管制區？'),'controlZone UI missing'));
test('第32已加入土壤處理合法例外欄位',()=>ok(text.includes('是否已確認符合土壤處理標準，且具有有效土壤處理許可？'),'soil exception UI missing'));

console.log(`water-v2 4.9.37 legal rule tests: ${count}/${count} PASS`);