const FIXED_TEXT=require('./fixtures/noise-fixed-texts.json');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loaded,plain}=require('./helpers.cjs');
const {documentStub,nodes}=require('./dom-stub.cjs');
const base={scenario:'article8',date:'2026-03-05',subject:'測試工區',article8Time:'22:00',prohibitedAct:'commercialMachinery',article8Zone:'1'};
async function setup(){const env=await loaded();return {...env,rule:env.root.NoiseArticle8,t:env.config.templates.find(t=>t.id==='noise-case'),generate:input=>env.root.DraftEngine.generate(env.config,'noise-case',input)};}

test('第8條時間不符合時停止，不帶出管制區、現場事實及告發原稿',async()=>{
  const {rule,generate}=await setup();const input={...base,article8Time:'10:00',equipment:'殘留機具',article8Operation:'殘留作業'};
  const r=rule.evaluate(input);assert.equal(r.showZone,true);assert.equal(r.established,false);
  for(const text of Object.values(generate(input)))assert.equal(text,'請選擇現場禁止行為。');
  const normalized=rule.prepare(input);assert.equal(normalized.article8Zone,'1');assert.equal(normalized.equipment,'');
});
test('第8條時間符合但區域不符時停止',async()=>{
  const {rule,generate}=await setup();const input={...base,article8Zone:'3'};
  assert.equal(rule.evaluate(input).showException,false);
  assert.equal(generate(input).record,'請選擇現場禁止行為。');
});
test('無例外規定之行為時區符合，產生指定固定法規及既有處理原稿',async()=>{
  const {generate}=await setup();const out=generate({...base,article8FactInput:'使用測試機具進行測試作業',legalBasis:'113年舊字號'});
  assert.match(out.record,/補充現場事實：使用測試機具進行測試作業/);
  for(const text of Object.values(out)){
    assert.match(text,/已違反噪音管制法第8條暨本府現行公告相關規定/);
    assert.match(text,/本局依法告發並令其立即停止改善/);
    assert.doesNotMatch(text,/113年|舊字號/);
  }
});
test('公告例外依行為隔離，完整設定仍拒絕其他行為的例外',async()=>{
  const {rule,root}=await setup();
  const input={...base,prohibitedAct:'outdoorSpeaker',article8Exception:'outdoorSpeaker:publicDuty'};
  assert.equal(rule.evaluate(input).status,root.NOISE_ARTICLE8_RULES.messages.exempt);
  assert.equal(rule.evaluate({...input,article8Exception:'construction:approved'}).established,false);
  for(const act of root.NOISE_ARTICLE8_RULES.acts.filter(a=>a.hasExceptions&&!a.exceptionsComplete)) {
    assert.equal(rule.evaluate({...base,prohibitedAct:act.id,article8Holiday:'no',article8Exception:'none'}).established,false);
  }
});
test('一般日營建工程22至翌08，假日選項未確認不得前進',async()=>{
  const {rule}=await setup();const input={...base,prohibitedAct:'construction'};
  assert.equal(rule.evaluate(input).needsHoliday,false);
  for(const [article8Time,showZone] of [['21:59',false],['22:00',true],['23:59',true],['00:00',true],['07:59',true],['08:00',false]])assert.equal(rule.filterActs({...input,article8Time,article8Holiday:'no'}).candidates.some(a=>a.id==='construction'),showZone,article8Time);
});
test('例假日營建工程12至14及20至翌08，適用第一至第四類',async()=>{
  const {rule}=await setup();const input={...base,prohibitedAct:'construction',article8Holiday:'yes'};
  for(const [article8Time,showZone] of [['11:59',false],['12:00',true],['13:59',true],['14:00',false],['19:59',false],['20:00',true],['07:59',true],['08:00',false]])assert.equal(rule.filterActs({...input,article8Time}).candidates.some(a=>a.id==='construction'),showZone,article8Time);
  assert.equal(rule.evaluate({...input,article8Time:'20:00',article8Zone:'4',article8Exception:'none'}).established,true);
  assert.equal(rule.evaluate({...input,article8Time:'20:00',article8Zone:'3',article8Exception:'none'}).established,true);
});
test('不限時段排氣管全天適用且不需要假日確認',async()=>{
  const {rule}=await setup();for(const article8Time of ['00:00','08:00','12:00','20:00','23:59']){
    const r=rule.evaluate({...base,prohibitedAct:'exhaust',article8Time,article8Zone:'4',article8Holiday:'no'});assert.equal(r.established,true);assert.equal(r.showException,false);
  }
});
test('吹葉機06時截止與伴唱假日午間時段僅由資料定義',async()=>{
  const {rule}=await setup();
  assert.equal(rule.filterActs({...base,article8Time:'05:59'}).candidates.some(a=>a.id==='leafBlower'),true);
  assert.equal(rule.filterActs({...base,article8Time:'06:00'}).candidates.some(a=>a.id==='leafBlower'),false);
  for(const article8Holiday of ['yes','no'])assert.equal(rule.filterActs({...base,article8Time:'12:30',article8Holiday}).candidates.some(a=>a.id==='karaoke'),article8Holiday==='yes');
});
test('缺漏、無效日期時間、自由輸入行為／管制區與偽造判斷均不能告發',async()=>{
  const {generate,rule}=await setup();
  for(const input of [{...base,date:''},{...base,date:'2026-02-30'},{...base,article8Time:'24:00'},{...base,article8Time:'22'},{...base,prohibitedAct:'自由行為'},{...base,article8Zone:'自訂'},{}]){
    assert.equal(rule.evaluate(input).established,false);
    const out=generate({...input,scenario:'article8',a8Established:'yes',article8LegalBasis:'偽造條款'});assert.doesNotMatch(out.record,/已違反|依法告發並令/);
  }
});
test('逐步欄位、各自行為例外及成立後事實，變更上游清空下游',async()=>{
  const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const list=nodes(view.element),get=id=>list.find(n=>n.id===id);
  const visible=id=>!get(id).parentElement.hidden;
  view.write({scenario:'article8'});assert.equal(visible('date'),true);assert.equal(visible('article8Time'),true);assert.equal(visible('subject'),false);
  for(const id of ['prohibitedAct','article8Zone','article8Exception','equipment'])assert.equal(visible(id),false,id);
  assert.ok(!get('legalBasis'));assert.equal(get('prohibitedAct').options.length,11);assert.equal(get('article8Zone').options.length,5);
  view.write({...base,article8Zone:''});assert.equal(visible('prohibitedAct'),false);assert.equal(visible('article8Holiday'),false);assert.equal(visible('article8Zone'),true);assert.equal(visible('equipment'),false);
  view.write({...base,prohibitedAct:'construction',article8Holiday:'no'});assert.equal(visible('article8Exception'),true);
  const options=get('article8Exception').options.filter(o=>!o.hidden).map(o=>o.value);
  assert.ok(options.includes('none'));assert.ok(options.includes('construction:approved'));assert.ok(!options.includes('outdoorSpeaker:publicDuty'));
  view.write({...base,equipment:'舊機具',article8Operation:'舊作業'});assert.equal(visible('equipment'),false);assert.equal(visible('article8FactInput'),true);
  get('article8Time').value='12:00';get('article8Time').dispatch('change');
  assert.equal(visible('article8Zone'),true);assert.equal(view.read().article8Zone,'');assert.equal(view.read().equipment,'');assert.equal(view.read().article8Operation,'');
  assert.doesNotMatch(view.element.textContent,/本局於|已違反噪音/);
});
test('使用者補齊的營建工程例外可直接判斷',async()=>{
  const {root,rule}=await setup();const act=root.NOISE_ARTICLE8_RULES.acts.find(a=>a.id==='construction');
  assert.equal(act.exceptionsComplete,true);
  assert.equal(rule.evaluate({...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'none'}).established,true);
  assert.equal(rule.evaluate({...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'construction:approved'}).established,false);
});
test('第8條修改條件立即清除舊草稿，包含手動修改內容',async()=>{
  const {root,config}=await setup();const session=root.CaseSession.create(config);session.selectCategory('noise');session.selectCaseType('noise-case');session.selectTemplate('noise-case');
  session.setInputs(base);session.generate();session.editOutput('record','手動告發草稿');
  session.setInputs({...session.snapshot().inputs,article8Time:'12:00'});assert.equal(session.snapshot().outputs,null);assert.equal(session.snapshot().inputs.equipment,'');
  assert.equal(session.generate().record,'請選擇噪音管制區。');
});
test('相同輸入結果一致，沒有修改輸入或規則資料',async()=>{
  const {root,rule,generate}=await setup();const before=JSON.stringify(root.NOISE_ARTICLE8_RULES),input=JSON.stringify(base),expected=plain(rule.evaluate(base));
  for(let i=0;i<50;i++){assert.deepEqual(plain(rule.evaluate(base)),expected);assert.deepEqual(plain(generate(base)),plain(generate(base)));}
  assert.equal(JSON.stringify(root.NOISE_ARTICLE8_RULES),before);assert.equal(JSON.stringify(base),input);
});
test('第6條、未量測、餐飲及周界異味與2.0逐字一致（第9條改用2.6核定流程）',async()=>{
  const {root,config}=await setup();
  const cases=require('./fixtures/version20-output-baseline.json');
  for(const item of cases.filter(item=>item.input.scenario!=='article9'))assert.deepEqual(plain(root.DraftEngine.generate(config,item.id,item.input)),item.output);
});
test('介面變更第8條條件後舊告發文字立即清空，不保留可複製內容',async()=>{
  const env=await setup(),doc=documentStub(),app=doc.createElement('main');doc.getElementById=()=>app;env.context.document=doc;env.root.confirm=()=>true;env.root.TemplateLoader.load=async()=>env.config;
  env.run('src/field-renderer.js');/* Internal legacy UI regression fixture; not a production entry. */ env.config.caseTypes.find(t=>t.id==='noise-case').directTemplateId='noise-case';env.run('src/sentence-app.js');await new Promise(resolve=>setImmediate(resolve));
  const click=text=>nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===text).dispatch('click');
  const fill=(id,value)=>{const el=nodes(app).find(n=>n.id===id);el.value=value;el.dispatch('change');};
  click('噪音');click('噪音案件');
  for(const id of ['scenario','date','article8Time','article8Zone','prohibitedAct','subject'])fill(id,base[id]);
  click('填入兩份草稿');assert.match(nodes(app).find(n=>n.id==='record').value,/依法告發/);
  fill('article8Time','12:00');assert.equal(nodes(app).find(n=>n.id==='record').value,'');assert.equal(nodes(app).find(n=>n.id==='reply').value,'');
  assert.equal(nodes(app).find(n=>n.id==='record').parentElement.parentElement.hidden,true);
});

test('五項公告例外完整且每個選项皆排除告發，無例外可成立',async()=>{
 const {root,rule}=await setup();
 for(const id of ['fireworks','outdoorSpeaker','construction','leafBlower']) {
  const act=root.NOISE_ARTICLE8_RULES.acts.find(a=>a.id===id);
  assert.equal(act.exceptionsComplete,true);
  const input={...base,prohibitedAct:id,article8Holiday:'no'};
  assert.equal(rule.evaluate({...input,article8Exception:'none'}).established,true);
  for(const e of act.exceptions)assert.equal(rule.evaluate({...input,article8Exception:id+':'+e.id}).status,root.NOISE_ARTICLE8_RULES.messages.exempt);
 }
 assert.deepEqual(plain(root.NOISE_ARTICLE8_RULES.acts.filter(a=>a.hasExceptions).map(a=>[a.id,a.exceptions.length])),[['fireworks',2],['outdoorSpeaker',4],['karaoke',0],['construction',3],['leafBlower',4]]);
});
test('卡拉OK兩項均是才為例外；未確認不告發，已確認有否才成立',async()=>{
 const {rule,root,generate}=await setup();const input={...base,prohibitedAct:'karaoke',article8Holiday:'no',article8Exception:'none'};
 for(const a of ['', 'yes','no'])for(const b of ['', 'yes','no']) {
  const facts={...input,a8KaraokeRegistered:a,a8KaraokeZoning:b},r=rule.evaluate(facts);
  assert.equal(r.showException,false);
  assert.equal(r.established,!!a&&!!b&&(a==='no'||b==='no'));
  if(a==='yes'&&b==='yes')assert.equal(r.status,root.NOISE_ARTICLE8_RULES.messages.exempt);
  if(!r.established)assert.doesNotMatch(generate(facts).record,/已違反|依法告發並令/);
 }
});
test('核准工程顯示三項附加查核；切換例外及模板清除查核資料',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);
 const input={...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'construction:approved'};
 view.write(input);
 for(const id of ['a8Notice','a8Sign','a8Documents']) {
  assert.equal(get(id).parentElement.hidden,false);assert.equal(view.read()[id],'');
  get(id).value='yes';get(id).dispatch('change');assert.equal(view.read()[id],'yes');
 }
 assert.equal(env.rule.evaluate(view.read()).established,false);
 get('article8Exception').value='none';get('article8Exception').dispatch('change');
 for(const id of ['a8Notice','a8Sign','a8Documents']) {assert.equal(get(id).parentElement.hidden,true);assert.equal(view.read()[id],'');}
 assert.equal(env.rule.evaluate(view.read()).established,true);
 view.write({...input,a8Notice:'yes',scenario:'article9'});assert.equal(view.read().a8Notice,'');
});
test('卡拉OK確認欄位不被單一無例外取代，假日定義來自規則檔',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);
 view.write({...base,prohibitedAct:'karaoke',article8Holiday:'no'});
 assert.equal(get('article8Exception').parentElement.hidden,true);
 assert.equal(get('a8KaraokeRegistered').parentElement.hidden,false);
 assert.equal(get('a8KaraokeZoning').parentElement.hidden,false);
 assert.ok(env.t.fields.find(f=>f.id==='article8Holiday').label.includes(env.root.NOISE_ARTICLE8_RULES.holidayDefinition));
 get('a8KaraokeRegistered').value='yes';get('a8KaraokeRegistered').dispatch('change');
 get('prohibitedAct').value='fireworks';get('prohibitedAct').dispatch('change');
 assert.equal(view.read().a8KaraokeRegistered,'');assert.equal(get('a8KaraokeRegistered').parentElement.hidden,true);
});

test('2.3工程選項唯一，兩份公文逐字符合核定營建工程文字',async()=>{
 const {t,generate}=await setup();const options=t.fields.find(f=>f.id==='prohibitedAct').options;
 assert.equal(options.filter(o=>o.label.includes('營建工程')).length,1);
 assert.ok(!options.some(o=>o.label.includes('裝修工程')));
 const input={...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'none',equipment:'挖土機',article8Operation:'出土作業'};
 const record='本局於115年3月5日22時許派員前往所陳地點，現場查為測試工區，現場使用動力機械／手持工具從事營建工程施工，使用挖土機進行出土作業，查該址位處本府公告之第1類噪音管制區，於管制區內公告禁止時段從事營建工程之行為，已違反噪音管制法第8條暨本府現行公告相關規定，本局依法告發並令其立即停止改善。';
 assert.equal(generate(input).record,record);
 assert.equal(generate(input).reply,'有關臺端反映事項，'+record+(FIXED_TEXT.replyEnding));
 assert.doesNotMatch(generate({...input,prohibitedAct:'renovation'}).record,/裝修工程|依法告發/);
});
test('營建工程只有時間區域例外均成立才顯示機具作業欄位',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);
 const input={...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'none'};
 for(const [change,visible] of [[{article8Time:'12:00'},false],[{article8Zone:''},false],[{article8Exception:''},false],[{article8Exception:'construction:emergency'},false],[{},true]]){
 view.write({...input,...change});for(const id of ['equipment','article8Operation'])assert.equal(!get(id).parentElement.hidden,visible);
 }
});
test('3.2第8條實體規則與3.1.2完全一致',async()=>{const {root}=await setup();assert.deepEqual(JSON.parse(JSON.stringify(root.NOISE_ARTICLE8_RULES)),require('./fixtures/noise-v312-baseline.json').rules8);});

test('全部第8條行為共用模板，四類管制區均輸出阿拉伯數字',async()=>{
 const {root,generate}=await setup();
 for(const act of root.NOISE_ARTICLE8_RULES.acts)for(const zone of act.zones){
 const input={...base,prohibitedAct:act.id,article8Zone:zone,article8Holiday:'no',article8Exception:'none',a8KaraokeRegistered:'no',a8KaraokeZoning:'no',equipment:'挖土機',article8Operation:'出土作業',article8FactInput:'使用現場設備作業'};
 const fact=(root.NOISE_TEXTS.ui.standardFacts[act.id]||act.label)+(act.id==='construction'?'，使用挖土機進行出土作業':'')+'，補充現場事實：使用現場設備作業';
 const expected=`本局於115年3月5日22時許派員前往所陳地點，現場查為測試工區，現場${fact}，查該址位處本府公告之第${zone}類噪音管制區，於管制區內公告禁止時段從事${act.recordValue||act.label}之行為，已違反噪音管制法第8條暨本府現行公告相關規定，本局依法告發並令其立即停止改善。`;
 const out=generate(input);assert.equal(out.record,expected);assert.equal(out.reply,'有關臺端反映事項，'+expected+(FIXED_TEXT.replyEnding));assert.doesNotMatch(out.record,/該工區|第[一二三四]類/);
 }
});
test('factText只取適用輸入，缺漏不補事實，自填內容不二次展開',async()=>{
 const {rule,generate}=await setup();
 const construction={...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'none'};
 assert.equal(rule.prepare({...construction,equipment:'挖土機',article8Operation:'出土作業',article8FactInput:'不得帶入'}).factText,'使用動力機械／手持工具從事營建工程施工，使用挖土機進行出土作業，補充現場事實：不得帶入');
 assert.match(generate({...construction,equipment:'挖土機'}).record,/使用動力機械／手持工具從事營建工程施工，使用機具：挖土機/);
 assert.match(generate({...base,equipment:'舊機具',article8Operation:'舊作業',factText:'偽造事實'}).record,/現場使用動力機械從事餐飲、洗染、乾燥、印刷商業行為/);
 const out=generate({...base,article8FactInput:'使用{{subject}}設備'});assert.match(out.record,/使用\{\{subject\}\}設備/);
 assert.doesNotMatch(generate({...base,article8Time:'12:00',article8FactInput:'隱藏事實'}).record,/隱藏事實/);
});
test('營建與其他行為欄位互斥，切換後清除事實描述及機具作業',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);
 view.write({...base,article8FactInput:'先前事實'});assert.equal(get('equipment').parentElement.hidden,true);assert.equal(get('article8FactInput').parentElement.hidden,false);
 get('prohibitedAct').value='construction';get('prohibitedAct').dispatch('change');assert.equal(view.read().article8FactInput,'');
 view.write({...base,prohibitedAct:'construction',article8Holiday:'no',article8Exception:'none',equipment:'挖土機',article8Operation:'出土作業'});
 assert.equal(get('equipment').parentElement.hidden,false);assert.equal(get('article8FactInput').parentElement.hidden,false);
 get('prohibitedAct').value='commercialMachinery';get('prohibitedAct').dispatch('change');assert.equal(view.read().equipment,'');assert.equal(view.read().article8Operation,'');
});

test('2.4夜間依第一至第四類篩選，場所不參與篩選',async()=>{
 const {rule}=await setup();
 const list=zone=>rule.filterActs({...base,article8Time:'23:00',article8Zone:zone,subject:''}).candidates.map(a=>a.id);
 assert.equal(list('1').length,10);
 for(const id of ['commercialMachinery','religious','instrument'])assert.ok(!list('3').includes(id));
 assert.ok(list('3').includes('vehicleBusiness'));assert.ok(!list('4').includes('vehicleBusiness'));
 assert.ok(list('4').includes('construction'));assert.ok(!list('1').includes('renovation'));
 assert.equal(rule.evaluate({...base,subject:''}).established,true);
});
test('2.4假日僅在候選清單不同時詢問，13時及21時正確篩選',async()=>{
 const {rule}=await setup();
 for(const time of ['13:00','21:00']){
 const input={...base,article8Time:time};assert.equal(rule.filterActs(input).needsHoliday,true);assert.equal(rule.filterActs(input).candidates.length,0);
 const weekday=rule.filterActs({...input,article8Holiday:'no'}).candidates.map(a=>a.id),holiday=rule.filterActs({...input,article8Holiday:'yes'}).candidates.map(a=>a.id);
 assert.deepEqual(plain(weekday),['exhaust']);assert.ok(holiday.includes('construction'));assert.equal(holiday.includes('karaoke'),time==='13:00');
 }
 for(const time of ['23:00','10:00','07:59'])assert.equal(rule.filterActs({...base,article8Time:time}).needsHoliday,false);
});
test('2.4無候選清單提示可用，不限時排氣管依原規則列出',async()=>{
 const {rule,root}=await setup();for(const time of ['00:00','10:00','13:00','21:00','23:59'])for(const holiday of ['yes','no'])assert.ok(rule.filterActs({...base,article8Time:time,article8Holiday:holiday}).candidates.some(a=>a.id==='exhaust'));
 // 原規則有全天排氣管；僅測試記憶體移除該項，驗證零結果顯示，不修改正式資料。
 root.NOISE_ARTICLE8_RULES.acts=root.NOISE_ARTICLE8_RULES.acts.filter(a=>a.id!=='exhaust');
 assert.equal(rule.evaluate({...base,article8Time:'10:00'}).status,'目前時間及管制區未篩得適用之第8條禁止行為。');
});
test('2.4介面順序為日期時間區域假日行為，再顯示專屬例外及場所',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{});const get=id=>nodes(view.element).find(n=>n.id===id);const visible=id=>!get(id).parentElement.hidden;
 const index=id=>env.t.fields.findIndex(f=>f.id===id);
 for(const [a,b] of [['date','article8Time'],['article8Time','article8Zone'],['article8Zone','article8Holiday'],['article8Holiday','prohibitedAct'],['prohibitedAct','subject']])assert.ok(index(a)<index(b));
 view.write({scenario:'article8'});assert.equal(visible('prohibitedAct'),false);assert.equal(visible('subject'),false);
 view.write({...base,article8Time:'13:00',article8Holiday:'',prohibitedAct:''});assert.equal(visible('article8Holiday'),true);assert.equal(visible('prohibitedAct'),false);
 view.write({...base,article8Time:'13:00',article8Holiday:'no',prohibitedAct:''});assert.deepEqual(get('prohibitedAct').options.filter(o=>!o.hidden&&o.value).map(o=>o.value),['exhaust']);
 view.write({...base,article8Time:'23:00',article8Zone:'4',prohibitedAct:'outdoorSpeaker'});assert.equal(visible('article8Holiday'),false);assert.equal(visible('article8Exception'),true);assert.equal(visible('subject'),true);
 const opts=get('article8Exception').options.filter(o=>!o.hidden).map(o=>o.value);assert.ok(opts.includes('outdoorSpeaker:publicDuty'));assert.ok(!opts.includes('construction:approved'));
});
test('2.4變更篩選條件清除旧行為例外與事實，修改場所保留篩選',async()=>{
 const {rule}=await setup();const input={...base,prohibitedAct:'outdoorSpeaker',article8Exception:'none',article8FactInput:'播放音樂'};
 for(const change of [{article8Zone:'3'},{article8Time:'10:00'},{date:'2026-03-06'},{article8Holiday:'yes'}]){
 const next=rule.resetChange(input,{...input,...change});assert.equal(next.prohibitedAct,'');assert.equal(next.article8Exception,'');assert.equal(next.article8FactInput,'');
 }
 const next=rule.resetChange(input,{...input,subject:'更新場所'});assert.equal(next.prohibitedAct,input.prohibitedAct);assert.equal(next.article8FactInput,input.article8FactInput);
});
