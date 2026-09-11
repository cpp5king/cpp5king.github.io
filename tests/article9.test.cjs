const {test}=require('node:test');const assert=require('node:assert/strict');const {loaded,plain}=require('./helpers.cjs');const {documentStub,nodes}=require('./dom-stub.cjs');
const base={scenario:'article9',a9Type:'construction',a9Zone:'3',a9Date:'2026-03-05',a9Time:'10:00',a9Frequency:'full'};
async function setup(){const env=await loaded();return {...env,judge:env.root.NoiseArticle9,t:env.config.templates.find(t=>t.id==='noise-case')};}
for(const [zone,time,expected] of [['1','21:00','evening'],['1','22:00','night'],['3','22:00','evening'],['3','23:00','night']])test(`第9條第${zone}類${time}為${expected}`,async()=>{const {judge}=await setup();assert.equal(judge.period(time,zone),expected);});
for(const [name,patch,values] of [
 ['營建工程第三類日間全頻',{}, {leq:72,lmax:100}],
 ['營建工程第三類夜間全頻',{a9Time:'23:00'},{leq:62,lmax:75}],
 ['營建工程第三類夜間低頻',{a9Time:'23:00',a9Frequency:'low'},{leqLF:41}],
 ['營業場所第二類晚間全頻',{a9Type:'business',a9Zone:'2',a9Time:'20:00'},{leq:52}],
 ['其他公告設施第三類夜間全頻',{a9Type:'other',a9Facility:'1',a9Time:'23:00'},{leq:47}]
])test(name,async()=>{const {judge}=await setup();assert.deepEqual(plain(judge.evaluate({...base,...patch}).standards[0].values),values);});
test('全頻低頻同案為兩組獨立標準；低頻沒有Lmax',async()=>{const {judge}=await setup();const out=judge.evaluate({...base,a9Frequency:'both',a9Time:'23:00'});assert.deepEqual(plain(out.standards),[{band:'full',available:true,values:{leq:62,lmax:75}},{band:'low',available:true,values:{leqLF:41}}]);out.standards[0].values.leq=0;assert.equal(out.standards[1].values.leqLF,41);assert.equal(judge.evaluate(base).standards[0].values.leq,72);});
test('娛樂與營業法定類型分開但共用表；地方設施僅八項',async()=>{const {root,judge}=await setup(),r=root.NOISE_ARTICLE9_RULES;assert.equal(r.types.length,6);assert.deepEqual(plain(r.facilities.map(f=>f.label)),['空調（通風、冷暖氣機）系統','冷卻水塔','抽水（加壓）馬達','抽排風機','冷凍（冷藏）櫃','發電機（含固定及移動式）','變壓器','非營業用卡拉OK']);assert.equal(r.types.find(t=>t.id==='entertainment').table,r.types.find(t=>t.id==='business').table);assert.deepEqual(plain(judge.evaluate({...base,a9Type:'business'})),plain(judge.evaluate({...base,a9Type:'entertainment'})));});
test('擴音設施不捏造低頻标准，兩頻率仍分開標示',async()=>{const {judge}=await setup();assert.deepEqual(plain(judge.evaluate({...base,a9Type:'speaker',a9Frequency:'both'}).standards),[{band:'full',available:true,values:{leq:77}},{band:'low',available:false,values:{}}]);});
test('所有時段邊界、跨日、無效時間區域與缺漏不補值',async()=>{const {judge}=await setup();for(const zone of ['1','2','3','4']){assert.equal(judge.period('06:59',zone),'night');assert.equal(judge.period('07:00',zone),'day');assert.equal(judge.period('18:59',zone),'day');assert.equal(judge.period('19:00',zone),'evening');assert.equal(judge.period('00:00',zone),'night');}for(const time of ['',null,'24:00','7:00','12:60'])assert.equal(judge.period(time,'1'),null);assert.equal(judge.period('12:00','5'),null);for(const patch of [{a9Type:''},{a9Zone:''},{a9Time:''},{a9Frequency:''},{a9Type:'other',a9Facility:''},{a9Type:'other',a9Facility:'自填'}])assert.equal(judge.evaluate({...base,...patch}).standards.length,0);});
test('第9條表單順序、唯讀時段標準、隱藏舊實測及結果輸入',async()=>{
 const env=await setup();env.context.document=documentStub();env.run('src/field-renderer.js');const view=env.root.FieldRenderer.render(env.t,()=>{}),get=id=>nodes(view.element).find(n=>n.id===id);
 view.write(base);for(const id of ['a9Type','a9Zone','a9Date','a9Time','a9Period','a9Standards'])assert.equal(get(id).parentElement.hidden,false,id);
 for(const id of ['leq','lmax','background','measurementLocation','measurementResult','leqStandard','lmaxStandard','period'])assert.equal(get(id).parentElement.hidden,true,id);
 assert.equal(get('a9Period').tagName,'P');assert.equal(get('a9Standards').tagName,'P');assert.match(get('a9Standards').textContent,/Leq 72 分貝、Lmax 100 分貝/);
 const order=['a9Type','a9Facility','a9Zone','a9Date','a9Time','a9Period','a9Standards'].map(id=>env.t.fields.findIndex(f=>f.id===id));assert.deepEqual(order,[...order].sort((a,b)=>a-b));
 view.write({...base,a9Type:'other',a9Facility:'1'});assert.equal(get('a9Facility').parentElement.hidden,false);get('a9Type').value='factory';get('a9Type').dispatch('change');assert.equal(get('a9Facility').value,'');assert.equal(get('a9Facility').parentElement.hidden,true);
 view.write({scenario:'neighbor'});assert.equal(get('a9Time').value,'');assert.equal(get('a9Standards').parentElement.hidden,true);
});
test('第9條尚未完成量測前禁止會話產生公文',async()=>{const {root,config}=await setup(),session=root.CaseSession.create(config);session.selectCategory('noise');session.selectCaseType('noise-case');session.selectTemplate('noise-case');session.setInputs(base);assert.throws(()=>session.generate(),/尚未完成或不宜採用/);assert.equal(session.snapshot().outputs,null);});
test('相同輸入確定一致，不修改輸入規則且每次結果獨立',async()=>{const {root,judge}=await setup();const r=JSON.stringify(root.NOISE_ARTICLE9_RULES),input=JSON.stringify(base),out=plain(judge.evaluate(base));for(let i=0;i<20;i++)assert.deepEqual(plain(judge.evaluate(base)),out);assert.equal(JSON.stringify(base),input);assert.equal(JSON.stringify(root.NOISE_ARTICLE9_RULES),r);});

test('第9條未完成量測前隱藏公文按鈕與舊草稿，切回原模組恢復',async()=>{
 const env=await setup(),doc=documentStub(),app=doc.createElement('main');doc.getElementById=()=>app;env.context.document=doc;env.root.confirm=()=>true;env.root.TemplateLoader.load=async()=>env.config;
 env.run('src/field-renderer.js');/* Internal legacy UI regression fixture; not a production entry. */ env.config.caseTypes.find(t=>t.id==='noise-case').directTemplateId='noise-case';env.run('src/sentence-app.js');await new Promise(resolve=>setImmediate(resolve));
 const click=label=>nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent===label).dispatch('click');
 const fill=(id,value)=>{const n=nodes(app).find(n=>n.id===id);n.value=value;n.dispatch('change');};
 click('噪音');click('噪音案件');fill('scenario','neighbor');fill('hasCommittee','yes');click('填入兩份草稿');
 fill('scenario','article9');const button=nodes(app).find(n=>n.tagName==='BUTTON'&&n.textContent==='填入兩份草稿');assert.equal(button.parentElement.hidden,true);assert.equal(nodes(app).find(n=>n.id==='record').value,'');
 for(const [id,value]of Object.entries(base))if(!['scenario','a9Frequency'].includes(id))fill(id,value);
 assert.match(nodes(app).find(n=>n.id==='a9Standards').textContent,/72/);
 fill('scenario','neighbor');assert.equal(button.parentElement.hidden,false);assert.equal(nodes(app).find(n=>n.id==='a9Standards').parentElement.hidden,true);
});
