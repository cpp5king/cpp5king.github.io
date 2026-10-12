(function(root){
'use strict';
const rules=()=>root.WaterSamplingW10954B, catalog=()=>root.WaterDischargeSamplingItems;
let app=null,exitHandler=null,step=0,state=rules()?.empty?.()||{};
const TITLES=['本次檢測項目','採樣前確認','實際採樣','樣品處理','離場前檢核'];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const get=p=>p.split('.').reduce((o,k)=>o==null?undefined:o[k],state);
function set(p,v){const a=p.split('.');let o=state;for(let i=0;i<a.length-1;i++){if(!o[a[i]]||typeof o[a[i]]!=='object')o[a[i]]={};o=o[a[i]];}o[a.at(-1)]=v;}
function options(items,value,ph='請選擇'){return '<option value="">'+esc(ph)+'</option>'+items.map(x=>'<option value="'+esc(x[0])+'" '+(x[0]===value?'selected':'')+'>'+esc(x[1])+'</option>').join('');}
function sel(label,path,items,hint=''){return '<label class="field"><span class="field-label">'+esc(label)+'</span><select class="select-input" data-path="'+esc(path)+'">'+options(items,get(path))+'</select>'+(hint?'<span class="hint">'+esc(hint)+'</span>':'')+'</label>';}
function txt(label,path,ph='',type='text'){return '<label class="field"><span class="field-label">'+esc(label)+'</span><input class="text-input" type="'+type+'" data-path="'+esc(path)+'" value="'+esc(get(path)||'')+'" placeholder="'+esc(ph)+'"></label>';}
function tri(label,path){return sel(label,path,rules().tri());}
function notice(cls,title,text){return '<div class="notice '+cls+'"><strong>'+esc(title)+'</strong><br>'+esc(text)+'</div>';}
function header(){const pct=Math.round((step+1)/TITLES.length*100);return '<div class="section-title sampling-head"><div><h2>事業放流水採樣</h2><p>放流水標準 → 本次檢測項目 → 實際樣品｜NIEA W109.54B</p></div></div><div class="sampling-progress"><div class="sampling-progress-meta"><strong>'+(step+1)+'／'+TITLES.length+' '+esc(TITLES[step])+'</strong><span>'+pct+'%</span></div><div class="sampling-progress-track"><i style="width:'+pct+'%"></i></div></div>';}
function standardContext(){
 const route=catalog()?.appendixFor?.(state)||{};
 let h='<div class="grid-2">'+sel('適用對象','subjectType',rules().subjects());
 if(state.subjectType==='industry')h+=sel('事業類型','industryType',catalog().industries());
 if(state.subjectType==='sewer')h+=sel('下水道系統類型','sewerType',catalog().sewerTypes());
 h+='</div>';
 if(route.appendix)h+=notice('info','放流水標準路由','目前基礎路由：附表'+route.appendix+'。'+(route.message||''));
 else if(state.subjectType)h+=notice('warn','附表尚待確認',route.message||'請先完成主體／類型選擇。');
 return h;
}
function itemCheck(item,field){
 const arr=field==='fieldItems'?(state.fieldItems||[]):(state.selectedItems||[]);
 return '<label class="sampling-check"><input type="checkbox" data-item="'+esc(item.id)+'" data-item-field="'+field+'" '+(arr.includes(item.id)?'checked':'')+'><span><strong>'+esc(item.label)+'</strong></span></label>';
}
function stepItems(){
 const c=catalog().candidates(state),lab=c.items.filter(x=>x.group==='lab'),field=c.items.filter(x=>x.group==='field');
 return '<section class="card sampling-card"><h3>1. 本次檢測項目</h3>'+standardContext()+
 notice('info','目前版本的範圍',c.note)+
 '<h4>送實驗室檢測</h4><div class="sampling-check-grid">'+lab.map(x=>itemCheck(x,'selectedItems')).join('')+'</div>'+
 '<div class="btn-row"><button class="btn btn-secondary" type="button" data-action="metals">八大重金屬一鍵選取</button></div>'+
 '<h4>現場檢測</h4><div class="sampling-check-grid">'+field.map(x=>itemCheck(x,'fieldItems')).join('')+'</div>'+
 txt('其他／自訂檢測項目','otherItems','例如：六價鉻、VOC、微生物…')+
 '</section>';
}
function stepPre(){
 return '<section class="card sampling-card"><h3>2. 採樣前確認</h3><div class="grid-2">'+
 txt('採樣地點','samplingLocation','例如：D01 放流口')+txt('座標','coordinates','例如：25.000000, 121.000000')+
 txt('採樣日期','sampleDate','','date')+txt('採樣時間','sampleTime','','time')+
 sel('採樣點性質','outletType',rules().outlets())+sel('採樣方式','samplingMode',rules().samplingModes())+
 sel('採樣器材','samplingEquipment',rules().equipment())+
 tri('已依採樣目的規劃代表性水樣','preflight.representativePlan')+
 tri('採樣器材已依適用方法完成清洗','preflight.equipmentClean')+
 tri('已評估採樣安全','preflight.safetyChecked')+
 '</div><div class="btn-row"><button class="btn btn-secondary" type="button" data-action="now">帶入現在日期時間</button></div>'+
 notice('warn','容器與保存條件','不由系統推定瓶數；容器、樣品量、保存劑、保存條件與期限依 W102.5 或各待測物方法確認。')+'</section>';
}
function sampleCard(s,i){
 const all=(state.selectedItems||[]),items=catalog().basicItems().filter(x=>x.group==='lab');
 return '<div class="card sampling-card" style="margin-top:12px"><div class="section-title"><h4>樣品 '+(i+1)+'</h4><button class="btn btn-ghost" type="button" data-remove-sample="'+i+'">刪除</button></div>'+
 '<div class="grid-2"><label class="field"><span class="field-label">樣品編號</span><input class="text-input" data-sample-index="'+i+'" data-sample-key="id" value="'+esc(s.id||'')+'"></label>'+
 '<label class="field"><span class="field-label">樣品種類</span><input class="text-input" data-sample-index="'+i+'" data-sample-key="description" value="'+esc(s.description||'放流水')+'"></label></div>'+
 '<div class="sampling-check-grid">'+items.map(x=>'<label class="sampling-check"><input type="checkbox" data-sample-item="'+esc(x.id)+'" data-sample-index="'+i+'" '+((s.items||[]).includes(x.id)?'checked':'')+'><span><strong>'+esc(x.label)+'</strong></span></label>').join('')+'</div>'+
 (all.length?'<p class="hint">本次已選送驗：'+esc(all.join('、'))+'</p>':'')+'</div>';
}
function stepSampling(){
 return '<section class="card sampling-card"><h3>3. 實際採樣</h3>'+notice('info','實際用了幾個容器，就建立幾個樣品','系統不計算「應採幾瓶」。同一檢測項目可分配到多個樣品。')+
 '<div class="btn-row"><button class="btn btn-primary" type="button" data-action="addSample">＋新增樣品</button></div></section>'+
 (state.samples||[]).map(sampleCard).join('')+
 '<section class="card sampling-card"><h4>現場檢測結果</h4><div class="grid-2">'+
 ((state.fieldItems||[]).includes('ph')?txt('pH','execution.fieldPh','例如：7.12'):'')+
 ((state.fieldItems||[]).includes('temperature')?txt('水溫（℃）','execution.fieldTemperature','例如：26.4'):'')+
 ((state.fieldItems||[]).includes('do')?txt('DO（mg/L）','execution.fieldDo','例如：6.5'):'')+
 '</div></section>';
}
function stepHandling(){
 if(!(state.samples||[]).length)return '<section class="card sampling-card"><h3>4. 樣品處理</h3>'+notice('warn','尚無實際樣品','請先回到上一步新增樣品。')+'</section>';
 return '<section class="card sampling-card"><h3>4. 樣品處理、標籤、封條及保存</h3><div class="grid-2">'+txt('採樣人員姓名','samplerName','姓名')+txt('所屬單位','samplerUnit','單位名稱')+'</div></section>'+
 state.samples.map((s,i)=>'<section class="card sampling-card"><h4>'+esc(s.id||('樣品 '+(i+1)))+'</h4><div class="grid-2">'+
 '<label class="field"><span class="field-label">實際樣品容器</span><input class="text-input" data-sample-index="'+i+'" data-sample-key="container" value="'+esc(s.container||'')+'" placeholder="依實際使用容器記錄"></label>'+
 '<label class="field"><span class="field-label">保存方式／保存劑</span><input class="text-input" data-sample-index="'+i+'" data-sample-key="preservation" value="'+esc(s.preservation||'')+'" placeholder="依實際情形記錄"></label>'+
 sampleTri(i,'chilled','已冷藏保存／運送')+sampleTri(i,'label','標籤已完成')+sampleTri(i,'seal','封條已完成')+
 '</div></section>').join('');
}
function sampleTri(i,key,label){const v=state.samples[i]?.[key]||'';return '<label class="field"><span class="field-label">'+esc(label)+'</span><select class="select-input" data-sample-index="'+i+'" data-sample-key="'+key+'">'+options(rules().tri(),v)+'</select></label>';}
function stepSummary(){
 const r=rules().evaluate(state),cls=r.status==='complete'?'sampling-status-ok':r.status==='risk'?'sampling-status-risk':'sampling-status-pending';
 return '<section class="card sampling-card"><h3>5. 離場前檢核</h3><div class="sampling-status '+cls+'"><strong>'+(r.status==='complete'?'目前無待確認事項':r.status==='risk'?'有已確認程序風險':'尚有待確認事項')+'</strong><span>只做防漏，不判定樣品有效或無效。</span></div>'+
 block('已確認程序風險',r.issues)+block('待確認／遺漏',r.missing)+block('方法提醒',r.warnings)+
 '<h4>採樣作業摘要</h4><pre class="sampling-summary">'+esc(rules().summary(state))+'</pre><div class="btn-row"><button class="btn btn-secondary" type="button" data-action="copy">複製採樣摘要</button></div></section>';
}
function block(t,a){return a?.length?'<div class="sampling-result-block"><h4>'+esc(t)+'</h4><ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'';}
function body(){return [stepItems,stepPre,stepSampling,stepHandling,stepSummary][step]();}
function footer(){return '<div class="sampling-sticky"><button class="btn btn-ghost" data-action="prev" '+(step===0?'disabled':'')+'>上一步</button>'+(step<4?'<button class="btn btn-primary" data-action="next">下一步</button>':'<button class="btn btn-primary" data-action="exit">完成／返回</button>')+'</div>';}
function syncSpecial(){
 const ids=new Set([...(state.selectedItems||[]),...(state.fieldItems||[])]);
 state.special.ph=ids.has('ph');state.special.temperature=ids.has('temperature');state.special.dissolvedOxygen=ids.has('do');
 state.special.oilGrease=ids.has('mineralOil')||ids.has('totalOil');
}
function render(){if(!app)return;syncSpecial();app.classList.add('water-sampling-shell','water-v2-shell');app.innerHTML=header()+body()+footer();bind();}
function bind(){
 app.querySelectorAll('[data-path]').forEach(n=>n.addEventListener(n.tagName==='SELECT'?'change':'input',e=>{set(n.dataset.path,e.target.value);if(['subjectType','industryType','sewerType','samplingMode','samplingEquipment'].includes(n.dataset.path))render();}));
 app.querySelectorAll('[data-item]').forEach(n=>n.onchange=e=>{const k=n.dataset.itemField,a=[...(state[k]||[])],id=n.dataset.item;if(e.target.checked&&!a.includes(id))a.push(id);if(!e.target.checked)state[k]=a.filter(x=>x!==id);else state[k]=a;render();});
 app.querySelectorAll('[data-sample-index][data-sample-key]').forEach(n=>n.addEventListener(n.tagName==='SELECT'?'change':'input',e=>{state.samples[+n.dataset.sampleIndex][n.dataset.sampleKey]=e.target.value;}));
 app.querySelectorAll('[data-sample-item]').forEach(n=>n.onchange=e=>{const s=state.samples[+n.dataset.sampleIndex],id=n.dataset.sampleItem,a=[...(s.items||[])];s.items=e.target.checked?(a.includes(id)?a:[...a,id]):a.filter(x=>x!==id);});
 app.querySelectorAll('[data-remove-sample]').forEach(n=>n.onclick=()=>{state.samples.splice(+n.dataset.removeSample,1);render();});
 app.querySelectorAll('[data-action]').forEach(n=>n.onclick=async()=>{const a=n.dataset.action;if(a==='next'){step=Math.min(4,step+1);render();scrollTo(0,0);}else if(a==='prev'){step=Math.max(0,step-1);render();scrollTo(0,0);}else if(a==='exit')exitHandler?.();else if(a==='addSample'){state.samples.push({id:'',description:'放流水',items:[],container:'',preservation:'',chilled:'',label:'',seal:''});render();}else if(a==='metals'){const m=['copper','zinc','nickel','chromium','cadmium','arsenic','lead','mercury'];state.selectedItems=Array.from(new Set([...(state.selectedItems||[]),...m]));render();}else if(a==='now'){const d=new Date(),p=x=>String(x).padStart(2,'0');state.sampleDate=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());state.sampleTime=p(d.getHours())+':'+p(d.getMinutes());render();}else if(a==='copy'){const t=rules().summary(state);try{await navigator.clipboard.writeText(t);alert('採樣摘要已複製。');}catch{prompt('請複製以下採樣摘要：',t);}}};
 }
}
function mount(container,opts){if(!container)throw new Error('WaterSamplingUI mount target is required.');app=container;exitHandler=typeof opts?.onExit==='function'?opts.onExit:null;render();}
function hasData(){return JSON.stringify(state)!==JSON.stringify(rules().empty());}
function snapshot(){return JSON.parse(JSON.stringify(state));}
function restore(v){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('事業放流水採樣資料格式無效。');state=Object.assign(rules().empty(),JSON.parse(JSON.stringify(v)));state.samples=Array.isArray(v.samples)?JSON.parse(JSON.stringify(v.samples)):[];render();}
function reset(){state=rules().empty();step=0;render();}
function showSummary(){step=4;render();root.scrollTo?.({top:0,behavior:'smooth'});}\nroot.WaterSamplingUI=Object.freeze({version:'5.2.16',mount,hasData,snapshot,restore,reset,showSummary});
})(window);