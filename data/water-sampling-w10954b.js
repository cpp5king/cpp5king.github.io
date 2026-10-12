(function(root){
'use strict';
const META=Object.freeze({id:'NIEA-W109.54B',title:'事業放流水採樣方法',code:'NIEA W109.54B',announcedAt:'2024-09-12',effectiveFrom:'2024-12-15',source:'使用者提供之環境部公告方法 PDF',scope:['事業','污水下水道系統','建築物污水處理設施'],externalReferences:['水質檢測方法總則(NIEA W102.5)','各待測物檢測方法'],policy:'本模組僅規則化採樣程序；容器、水樣量、保存劑、保存條件與期限依 W102.5 或個別檢測方法確認，不自行補值。'});
const SUBJECTS=[['industry','事業'],['sewer','污水下水道系統'],['building','建築物污水處理設施']];
const OUTLETS=[['permitted','許可排放口'],['nonPermitted','非許可排放口']];
const MODES=[['grab','抓樣'],['composite','混樣']];
const EQUIP=[['manual','手動採水設備'],['autoGrab','自動抓樣設備'],['autoComposite','自動混樣採水設備']];
const TRI=[['yes','是，已確認'],['no','否，已確認未完成／不符合'],['unknown','尚待確認']];
const text=v=>String(v??'').trim();
const clone=v=>JSON.parse(JSON.stringify(v));
function empty(){
 return {subjectType:'',industryType:'',sewerType:'',outletType:'',samplingLocation:'',coordinates:'',sampleDate:'',sampleTime:'',sampleDescription:'放流水',samplingMode:'',samplingEquipment:'',selectedItems:[],fieldItems:[],otherItems:'',samples:[],samplerName:'',samplerUnit:'',special:{totalResidualChlorine:false,temperature:false,ph:false,chromiumVI:false,ammoniaElectrode:false,alkalinity:false,conductivity:false,dissolvedOxygen:false,sulfide:false,oilGrease:false,toc:false,voc:false,microbiology:false,dissolvedFeMn:false,otherShortHolding:false,otherNoMix:false},preflight:{representativePlan:'',equipmentClean:'',safetyChecked:''},execution:{fieldTemperature:'',fieldPh:'',fieldDo:'',fieldConductivity:'',fieldResidualChlorine:'',compositeSubsamplesCold:'',compositeLastSampleTime:'',dissolvedFiltered:''},qc:{equipmentReused:false,fieldBlank:'',equipmentBlank:'',tripBlank:''},notes:'',sampleId:'',sampleCount:'',analysisItems:'',preservation:{sampleContainer:'',preservationMethod:'',preservativeAdded:'',chilled:'',transportPackaged:'',coolingMode:'',coolingOther:'',noDryIce:''},label:{sampleId:false,samplerUnit:false,dateTime:false,location:false,preservative:false,analysisItems:false},seal:{attached:false,tamperEvident:false,signed:false}};
}
function compositeRestrictions(s){const x=s.special||{},g=[];if(x.totalResidualChlorine||x.temperature||x.ph)g.push('須現場檢測項目');if(x.chromiumVI||x.ammoniaElectrode||x.alkalinity||x.otherShortHolding)g.push('最長保存期限24小時以下項目');if(x.conductivity||x.dissolvedOxygen||x.sulfide||x.oilGrease||x.toc||x.voc||x.otherNoMix)g.push('不可攪動或不適宜混樣項目');if(x.microbiology)g.push('微生物樣品');return g;}
function requiredQc(s){const r=[];if(s.special?.voc)r.push({key:'fieldBlank',label:'現場空白樣品',reason:'VOC 每批次採樣行程至少製備1件。'});if(s.qc?.equipmentReused)r.push({key:'equipmentBlank',label:'設備空白樣品',reason:'重複使用採樣容器或圓筒且無法依規定清洗時。'});if(s.special?.voc||s.special?.microbiology)r.push({key:'tripBlank',label:'運送空白樣品',reason:'VOC或微生物樣品每批次採樣行程至少製備1件。'});return r;}
function allSelected(s){return [...(s.selectedItems||[]),...(s.fieldItems||[])];}
function evaluate(input){
 const s=input||empty(),missing=[],issues=[],warnings=[],reminders=[];
 if(!SUBJECTS.some(x=>x[0]===s.subjectType))missing.push('適用對象尚未確認。');
 if(s.subjectType==='industry'&&!s.industryType)missing.push('事業類型尚未確認，無法路由放流水標準附表。');
 if(s.subjectType==='sewer'&&!s.sewerType)missing.push('污水下水道系統類型尚未確認。');
 if(!OUTLETS.some(x=>x[0]===s.outletType))missing.push('採樣點性質尚未確認。');
 if(!text(s.samplingLocation)&&!text(s.coordinates))missing.push('採樣地點或座標至少需記錄一項。');
 if(!text(s.sampleDate)||!text(s.sampleTime))missing.push('採樣日期及時間尚未完整記錄。');
 if(!MODES.some(x=>x[0]===s.samplingMode))missing.push('採樣方式尚未確認。');
 if(!EQUIP.some(x=>x[0]===s.samplingEquipment))missing.push('採樣器材尚未記錄。');
 if(!text(s.samplerName)||!text(s.samplerUnit))missing.push('採樣人員姓名及所屬單位尚未完整記錄。');
 if(!allSelected(s).length&&!text(s.otherItems))missing.push('本次檢測項目尚未選擇。');
 const assigned=new Set();
 for(const sample of (s.samples||[])){
   if(!text(sample.id))missing.push('有實際樣品尚未填寫樣品編號。');
   if(!(sample.items||[]).length)missing.push('樣品 '+(sample.id||'未編號')+' 尚未指定送驗項目。');
   (sample.items||[]).forEach(x=>assigned.add(x));
   if(!text(sample.container))missing.push('樣品 '+(sample.id||'未編號')+' 容器尚未記錄。');
   if(!text(sample.preservation))missing.push('樣品 '+(sample.id||'未編號')+' 保存方式尚未記錄。');
   if(sample.chilled!=='yes')missing.push('樣品 '+(sample.id||'未編號')+' 冷藏狀態尚待確認。');
   if(sample.label!=='yes')missing.push('樣品 '+(sample.id||'未編號')+' 標籤尚待確認。');
   if(sample.seal!=='yes')missing.push('樣品 '+(sample.id||'未編號')+' 封條尚待確認。');
 }
 for(const item of (s.selectedItems||[])) if(!assigned.has(item)) missing.push('已選送驗項目「'+item+'」尚未分配至任何實際樣品。');
 if((s.selectedItems||[]).length&&!(s.samples||[]).length)missing.push('已有送驗項目，但尚未新增任何實際樣品。');
 if(s.samplingMode==='composite'&&compositeRestrictions(s).length)warnings.push('混樣風險：本次包含一般不適宜混樣項目，請依個別檢測方法確認或改採適當方式。');
 if(s.special?.oilGrease)warnings.push('油脂類項目不可攪動或混樣，採樣時應避免不必要擾動。');
 if(s.special?.dissolvedFeMn&&s.execution?.dissolvedFiltered!=='yes')missing.push('溶解性鐵／錳等水樣尚未確認於採樣現場過濾。');
 for(const req of requiredQc(s)){const v=s.qc?.[req.key];if(v==='no')issues.push(req.label+'：已確認未製備。');else if(v!=='yes')missing.push(req.label+'：尚未確認是否已製備。');}
 reminders.push('離場檢核僅提示程序待確認或風險，不判定樣品有效或無效。');
 reminders.push('容器、水樣需要量、保存劑、保存條件及保存期限依 W102.5 或各待測物檢測方法確認。');
 return {status:issues.length?'risk':missing.length?'pending':'complete',issues,missing,warnings,reminders,requiredQc:requiredQc(s),compositeRestrictions:compositeRestrictions(s)};
}
function summary(s){
 const e=evaluate(s),route=root.WaterDischargeSamplingItems?.appendixFor?.(s),lines=['事業放流水採樣｜NIEA W109.54B'];
 if(route?.appendix)lines.push('放流水標準：附表'+route.appendix);
 lines.push('採樣地點：'+(text(s.samplingLocation)||'未填'),'採樣日期時間：'+(text(s.sampleDate)||'未填')+' '+(text(s.sampleTime)||'未填'),'本次送驗項目：'+((s.selectedItems||[]).join('、')||'未選'));
 for(const x of (s.samples||[]))lines.push('樣品 '+(x.id||'未編號')+'：'+((x.items||[]).join('、')||'未指定'));
 lines.push('程序檢核：'+(e.status==='complete'?'程序檢核完整':e.status==='risk'?'有已確認程序風險':'尚有程序事項待確認'));
 if(e.missing.length)lines.push('【待確認】',...e.missing.map(x=>'• '+x));if(e.warnings.length)lines.push('【方法提醒】',...e.warnings.map(x=>'• '+x));return lines.join('\n');
}
root.WaterSamplingW10954B=Object.freeze({meta:()=>META,subjects:()=>clone(SUBJECTS),outlets:()=>clone(OUTLETS),samplingModes:()=>clone(MODES),equipment:()=>clone(EQUIP),tri:()=>clone(TRI),empty,evaluate,summary,requiredQc,compositeRestrictions});
})(window);