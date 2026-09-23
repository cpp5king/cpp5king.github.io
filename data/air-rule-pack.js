(function(root){
'use strict';
const P='PP-IA-41-7F3C9A21';
const META=Object.freeze({
  provenance:P,
  identity:'air-rule-pack-2026.09.23-v1.0',
  compatibleApp:'5.1.0',
  verifiedAt:'2026-09-23',
  status:Object.freeze({core:'implemented-v1',fixedSource:'implemented-v1',construction:'implemented-v1',restaurant:'implemented-v1',openBurning:'implemented-v1'}),
  note:'空氣污染法規研判只整理法規方向、已有事實、相反事實與待確認要件；不自動認定違法或裁處。'
});
const has=(arr,v)=>Array.isArray(arr)&&arr.includes(v);
const yes=v=>v==='yes';
const nonEmpty=v=>String(v??'').trim()!=='';
const clean=a=>[...new Set((a||[]).filter(Boolean))];
function direction({id,title,basis,lawIds=[],facts=[],opposing=[],missing=[],nextChecks=[],status}){
  const f=clean(facts),o=clean(opposing),m=clean(missing),n=clean(nextChecks);
  let s=status;
  if(!s)s=o.length?'opposed':m.length?'needs':f.length?'supported':'reference';
  return {id,title,basis,lawIds,facts:f,opposing:o,missing:m,nextChecks:n,status:s};
}
function fixedAssess(full){
  const f=full.fixed||{}; const obs=Array.isArray(f.observations)?f.observations:[]; const dirs=[];
  const actualPollution=obs.filter(o=>o.occurrence!=='none'&&(o.pollutants||[]).some(x=>x!=='本次未發現明顯污染現象'));
  const confirmedSource=obs.flatMap(o=>o.links||[]).filter(x=>['已確認來源','已有部分事實支持','確認有相關作業，但來源關聯尚未確認'].includes(x.status));
  const controls=f.controls||{}; const emission=f.emission||{}; const permit=f.permitBasic||{}; const responsible=f.responsible||{};
  if(actualPollution.length||controls.presence!=='unreviewed'||confirmedSource.length){
    const facts=[];const opposing=[];const missing=[];
    if(actualPollution.length)facts.push(`已有 ${actualPollution.length} 筆現場觀察記錄污染現象`);
    if(controls.presence==='present')facts.push('現場有防制設備');
    if(controls.operation==='normal')facts.push('防制設備當下記錄為正常運轉');
    if(controls.collection==='effective')facts.push('污染物有明顯收集並進入設備');
    if(controls.operation==='stopped')opposing.push('防制設備當下記錄為未運轉');
    if(controls.operation==='fault')opposing.push('防制設備當下記錄為故障');
    if(controls.collection==='ineffective')opposing.push('有設備但疑似未有效收集');
    if(controls.collection==='bypass')opposing.push('現場記錄明顯逸散／旁通');
    if(controls.presence==='unreviewed'||controls.presence==='unknown')missing.push('確認是否設有應使用之收集／防制設施');
    if(controls.operation==='unreviewed'||controls.operation==='unknown')missing.push('確認防制設備當下運轉狀態');
    if(controls.collection==='unreviewed'||controls.collection==='unknown')missing.push('確認污染物是否被有效收集並進入防制設備');
    dirs.push(direction({id:'air23-control',title:'空污法第23條｜固定污染源收集與防制設施運作',basis:['空氣污染防制法第23條'],lawIds:['air-act'],facts,opposing,missing,nextChecks:['必要時核對固定污染源相關設施設置、操作、檢查、保養及記錄規定']}));
  }
  if(permit.status!=='unreviewed'||(f.permits||[]).length){
    const facts=[],opposing=[],missing=[];
    if(permit.status==='not-required')opposing.push('本次記錄為無須申請許可');
    if(permit.status==='missing')facts.push('本次記錄為應申請但未取得許可');
    if(permit.status==='obtained')facts.push(`已取得許可${(permit.types||[]).length?'：'+permit.types.join('、'):''}`);
    if(permit.status==='unknown')missing.push('確認該固定污染源是否屬應申請設置／操作許可之公告對象');
    const differences=[];
    for(const p of f.permits||[])for(const [k,v] of Object.entries(p.checks||{}))if(v==='different')differences.push(`${p.number||p.type||'許可證'}－${({process:'製程',equipment:'主要設備',control:'防制設備',stack:'排放管道',material:'原物料／燃料',condition:'操作條件'})[k]||k}發現差異`);
    facts.push(...differences);
    if(permit.status==='obtained'&&!permit.types?.length)missing.push('確認許可種類及適用製程／設備');
    const knownTypes=clean([...(permit.types||[]),...(f.permits||[]).map(p=>p.type)]);
    const nextChecks=['以行為時點及公告批次確認是否屬應申請對象'];
    if(!knownTypes.length&&['missing','unknown'].includes(permit.status))missing.push('確認涉及的是設置／操作許可、燃料使用許可或易致空氣污染物質使用許可');
    if(knownTypes.some(x=>['設置許可','操作許可'].includes(x)))nextChecks.push('依空污法第24條逐項核對固定污染源設置／操作許可內容');
    if(knownTypes.includes('燃料使用許可'))nextChecks.push('依空污法第28條確認指定燃料之使用許可、成分及記錄／申報事項');
    if(knownTypes.includes('易致空氣污染物質使用許可'))nextChecks.push('依空污法第29條確認易致空氣污染物質之使用許可、記錄／申報事項');
    if(permit.status==='obtained')nextChecks.push('如有許可，逐項比對製程、設備、防制設備、排放口、原物料／燃料與操作條件');
    dirs.push(direction({id:'air-permit',title:'空污法第24、28、29條｜固定污染源相關許可',basis:['空氣污染防制法第24、28、29條','固定污染源設置操作及燃料使用許可證管理辦法'],lawIds:['air-act','fixed-permit-reg'],facts,opposing,missing,nextChecks}));
  }
  const odorObs=actualPollution.filter(o=>has(o.pollutants,'異味污染物（含惡臭）')||has(o.pollutants,'VOC'));
  if(odorObs.length||['fugitive','both'].includes(emission.mode)){
    const facts=[],opposing=[],missing=[];
    if(odorObs.length)facts.push(`已有 ${odorObs.length} 筆異味／VOC 現場觀察`);
    if(['fugitive','both'].includes(emission.mode))facts.push('現場記錄有未經排放管道逸散');
    if(emission.mode==='pipe')opposing.push('目前排放方式記錄為經排放管道；第32條行為管制原則上針對未經排放管道排放');
    if(controls.presence==='none')facts.push('現場記錄無防制設備');
    if(['ineffective','bypass'].includes(controls.collection))facts.push('現場記錄收集處理疑似無效或有逸散／旁通');
    if(!['none','ineffective','bypass'].includes(controls.presence==='none'?'none':controls.collection))missing.push('確認異味／揮發性物質是否未被有效收集及處理，或貯放／輸送設施是否未密封加蓋');
    if(emission.mode==='unreviewed'||emission.mode==='unknown')missing.push('確認污染行為是否屬未經排放管道逸散');
    dirs.push(direction({id:'air32-odor',title:'空污法第32條第1項第3、4款｜異味／揮發性物質逸散方向',basis:['空氣污染防制法第32條第1項第3、4款','空氣污染行為管制執行準則第3、4、8條'],lawIds:['air-act','air-behavior-guideline'],facts,opposing,missing,nextChecks:['記錄異味發生源位置與現場氣味描述','確認污染來源可由判定位置明確辨識','確認收集處理或密閉措施']}));
  }
  if(responsible.duty!=='unreviewed'){
    const facts=[],opposing=[],missing=[];
    if(responsible.duty==='required')facts.push('本次記錄為依法應設置專責單位／人員');
    if(responsible.duty==='not-required')opposing.push('本次記錄為不須設置');
    if(responsible.duty==='unknown')missing.push('確認是否屬中央主管機關指定公告應設專責單位／人員之公私場所');
    if(responsible.duty==='required'&&responsible.actual==='yes')facts.push('現場記錄已設置');
    if(responsible.duty==='required'&&responsible.actual==='no')facts.push('現場記錄未設置');
    if(responsible.duty==='required'&&['unreviewed','unknown'].includes(responsible.actual))missing.push('確認實際專責單位／人員設置狀況');
    dirs.push(direction({id:'air34-responsible',title:'空污法第34條｜空污專責單位／人員',basis:['空氣污染防制法第34條'],lawIds:['air-act'],facts,opposing,missing,nextChecks:['必要時核對指定公告、設置等級及資格']}));
  }
  return dirs;
}
function constructionAssess(full){
  const c=full.construction||{};const dirs=[];const cfg=root.AIR_V1_CONFIG?.construction||{};
  const articleMap=new Map((cfg.articleChecks||[]).map(x=>[String(x.article),x]));
  for(const [article,x] of Object.entries(c.articleChecks||{})){
    if(!x||x.status==='unreviewed')continue;const def=articleMap.get(String(article));if(!def)continue;
    const facts=[],opposing=[],missing=[];
    if(x.status==='ok')opposing.push('本次查核記錄為已查－無缺失');
    if(x.status==='no-operation')opposing.push('本次查核記錄為本項無作業');
    if(x.status==='unknown')missing.push('本項適用性尚待確認');
    if(x.status==='defect'){
      for(const id of x.selectedDefects||[]){const d=def.items.find(y=>y.id===id);if(d)facts.push(`${d.label}（${d.points}點）`);}
      if(!(x.selectedDefects||[]).length)missing.push('已選「發現缺失」，但尚未勾選具體缺失項目');
      if(c.basic?.legalGrade==='unknown')missing.push('管理辦法工程分級尚待確認');
      if(x.alt?.used==='yes'){
        facts.push('現場記錄有採替代防制措施');
        if(x.alt.approval!=='yes')missing.push('確認替代防制措施是否經主管機關同意');
        if(x.alt.approval==='yes'&&x.alt.match==='different')facts.push('現場記錄與主管機關同意之替代措施有差異');
      }
    }
    dirs.push(direction({id:`construction-art${article}`,title:`營建管理辦法第${article}條｜${def.title}`,basis:[`營建工程空氣污染防制設施管理辦法第${article}條`],lawIds:['construction-air-reg'],facts,opposing,missing,nextChecks:['以現場實際作業、工程分級及替代措施同意內容確認適用性']}));
  }
  const dustTypes=['營建作業造成塵土飛揚','粉粒狀物堆置造成塵土飛揚','運送工程材料／廢棄物造成塵土飛揚','其他工事造成塵土飛揚'];
  const observed=(c.pollutionObservations||[]).filter(o=>dustTypes.includes(o.type)&&o.status==='observed');
  const notObserved=(c.pollutionObservations||[]).filter(o=>dustTypes.includes(o.type)&&o.status==='not-observed');
  const defectCount=Object.values(c.articleChecks||{}).filter(x=>x?.status==='defect'&&(x.selectedDefects||[]).length).length;
  if(observed.length||notObserved.length||defectCount){
    const facts=[],opposing=[],missing=[];
    if(observed.length)facts.push(`已有 ${observed.length} 筆塵土飛揚／污染現象觀察`);
    if(notObserved.length&&!observed.length)opposing.push(`已有 ${notObserved.length} 筆記錄未觀察到塵土飛揚`);
    if(defectCount)facts.push(`已有 ${defectCount} 個管理辦法條文記錄具體缺失`);
    const hasControlDetail=observed.some(o=>nonEmpty(o.control));
    if(!hasControlDetail&&!defectCount)missing.push('確認是否缺乏適當防制措施或既有措施無法有效抑制塵土飛揚');
    dirs.push(direction({id:'air32-construction',title:'空污法第32條第1項第2款｜營建／堆置／運輸引起塵土飛揚',basis:['空氣污染防制法第32條第1項第2款','空氣污染行為管制執行準則第7條'],lawIds:['air-act','air-behavior-guideline'],facts,opposing,missing,nextChecks:['確認污染物由受稽查工地／作業逸散','確認當下防制措施及其有效性','必要時與管理辦法第5～18條缺失事實互相引用']}));
  }
  return dirs;
}
function burningAssess(full){
  const b=full.burning||{};const obs=Array.isArray(b.observations)?b.observations:[];const dirs=[];
  const burnObs=obs.filter(o=>o.burning==='yes');const visible=obs.filter(o=>o.visibleParticle==='yes');const spread=obs.filter(o=>o.spread==='yes');const noVisible=obs.filter(o=>o.visibleParticle==='no');
  const facts=[],opposing=[],missing=[];
  if(b.basic?.burningState==='burning'||burnObs.length)facts.push('有到場／時間軸記錄顯示正在燃燒');
  else if(['embers','stopped'].includes(b.basic?.burningState))opposing.push('到場時僅餘火／餘燼或已停止，不能僅憑跡證取代當時污染行為事實');
  if(visible.length)facts.push(`有 ${visible.length} 筆目視記錄明顯粒狀污染物`);
  if(noVisible.length&&!visible.length)opposing.push(`有 ${noVisible.length} 筆記錄未見明顯粒狀污染物`);
  if(spread.length)facts.push(`有 ${spread.length} 筆記錄污染物散布於空氣或他人財物`);
  if((b.evidence||[]).length)facts.push(`現場另有燃燒跡證：${b.evidence.join('、')}`);
  const actors=(b.persons||[]).filter(p=>p.status==='已確認行為人');
  if(actors.length)facts.push(`已確認行為人 ${actors.length} 名`); else missing.push('確認實際燃燒行為人；地主／管理人身分本身不能直接代替行為事實');
  if(!burnObs.length&&b.basic?.burningState!=='burning')missing.push('若要判斷本次燃燒行為，補強實際燃燒時間點或其他可證明燃燒行為之資料');
  if(!visible.length)missing.push('確認是否有明顯可見粒狀污染物；灰燼或焦黑跡證本身不是此要件');
  if(!spread.length)missing.push('確認粒狀污染物是否散布於空氣或他人財物');
  dirs.push(direction({id:'air32-burning',title:'空污法第32條第1項第1款｜燃燒致明顯粒狀污染物散布',basis:['空氣污染防制法第32條第1項第1款','空氣污染行為管制執行準則第3、4條'],lawIds:['air-act','air-behavior-guideline'],facts,opposing,missing,nextChecks:['以現場時間軸優先保存正在燃燒、明顯粒狀污染物及散布情形','燃燒物與灰燼等跡證作為補強，不取代當下污染現象']}));
  if(b.disposalLink?.enabled||has(b.materials,'一般垃圾')||has(b.materials,'事業廢棄物')||has(b.materials,'建築／裝修廢料'))dirs.push(direction({id:'burning-waste-cross',title:'跨模組方向｜可能同時涉及廢棄物查核',basis:['空污法與廢棄物清理法分別判斷'],lawIds:['air-act'],facts:['燃燒物或現場標記顯示可能涉及廢棄物'],missing:[],nextChecks:['空氣污染模組保存燃燒與污染事實；廢棄物模組另查物質批次、產生者、持有人、清除處理及流向'],status:'reference'}));
  return dirs;
}
function restaurantAssess(inputs){
  const r=inputs||{};const dirs=[];
  const cooking=r.operating==='cooking';const odor=r.observation==='smoke';const noOdor=r.observation==='no-odor';
  if(cooking||odor||noOdor){
    const facts=[],opposing=[],missing=[];
    if(cooking)facts.push('稽查時正在進行烹飪作業');else missing.push('確認污染發生時是否有烹飪作業');
    if(odor)facts.push('周界外巡查記錄有油煙／異味情形');
    if(noOdor)opposing.push('本次周界外巡查未發現明顯油煙逸散致異味');
    if(r.equipment==='none')facts.push('本次記錄未設置污染防制設備');
    if(r.equipment==='present')facts.push('本次記錄油煙經污染防制設備處理後排放');
    if(r.equipment==='present'&&odor)missing.push('確認油煙／異味是否未被完全有效收集及處理');
    if(!r.equipment)missing.push('確認油煙／異味收集與處理設備狀況');
    dirs.push(direction({id:'air32-restaurant',title:'空污法第32條第1項第5款｜餐飲烹飪散布油煙／異味',basis:['空氣污染防制法第32條第1項第5款','空氣污染行為管制執行準則第9條'],lawIds:['air-act','air-behavior-guideline'],facts,opposing,missing,nextChecks:['確認污染來源可由周界外判定位置明確辨識','有設備時確認是否完整有效收集及處理']}));
  }
  if(cooking||r.equipment){
    const facts=[],missing=[];
    if(r.equipment==='none')facts.push('現場記錄未設油煙污染防制設備');
    if(r.equipment==='present')facts.push('現場記錄有油煙污染防制設備');
    missing.push('先確認是否屬餐飲業空氣污染防制設施管理辦法附表列管行政區域、條件及規模');
    if(r.equipment==='present')missing.push('本範本尚未完整記錄氣罩尺寸／集氣流速、處理風量、操作參數及保養紀錄');
    dirs.push(direction({id:'restaurant-management',title:'餐飲業空氣污染防制設施管理辦法｜列管餐飲業設備管理',basis:['餐飲業空氣污染防制設施管理辦法第3～6條'],lawIds:['restaurant-air-reg'],facts,missing,nextChecks:['確認列管資格後，再查集氣系統、油煙處理設備、操作參數及清潔保養紀錄']}));
  }
  return dirs;
}
function assess(arg={}){
  const mode=arg.mode||arg.state?.activeMode||'';let dirs=[];
  if(mode==='air-fixed-source')dirs=fixedAssess(arg.state||{});
  else if(mode==='air-construction')dirs=constructionAssess(arg.state||{});
  else if(mode==='air-open-burning')dirs=burningAssess(arg.state||{});
  else if(mode==='restaurant-odor'||mode==='air-restaurant')dirs=restaurantAssess(arg.inputs||arg.restaurant||{});
  return {provenance:P,packVersion:META.identity,mode,directions:dirs,notice:'系統只整理可能法規方向、已有事實、相反事實與待確認要件；是否違反法規仍由稽查員依完整事證與適用版本判斷。'};
}
root.AIR_RULE_PACK_META=META;
root.AIR_RULE_PACK=Object.freeze({meta:META,assess});
})(window);
