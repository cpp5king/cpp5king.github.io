(function(root){
  'use strict';

  const rules=()=>root.WaterSamplingW10954B;
  let app=null;
  let exitHandler=null;
  let step=0;
  let state=rules()?.empty?.()||{};
  const STEP_TITLES=['採樣規劃','採樣前確認','執行採樣','保存與紀錄','標籤封條與品管','最終檢核'];

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function get(path){
    return path.split('.').reduce(function(obj,key){return obj==null?undefined:obj[key];},state);
  }
  function set(path,value){
    const parts=path.split('.');let obj=state;
    for(let i=0;i<parts.length-1;i++){if(!obj[parts[i]]||typeof obj[parts[i]]!=='object')obj[parts[i]]={};obj=obj[parts[i]];}
    obj[parts[parts.length-1]]=value;
  }
  function options(items,value,placeholder){
    let out='<option value="">'+esc(placeholder||'請選擇')+'</option>';
    for(const item of items)out+='<option value="'+esc(item[0])+'" '+(item[0]===value?'selected':'')+'>'+esc(item[1])+'</option>';
    return out;
  }
  function selectField(label,path,items,hint){
    return '<label class="field"><span class="field-label">'+esc(label)+'</span><select class="select-input" data-path="'+esc(path)+'">'+options(items,get(path))+'</select>'+(hint?'<span class="hint">'+esc(hint)+'</span>':'')+'</label>';
  }
  function textField(label,path,placeholder,hint,type){
    return '<label class="field"><span class="field-label">'+esc(label)+'</span><input class="text-input" type="'+esc(type||'text')+'" data-path="'+esc(path)+'" value="'+esc(get(path)||'')+'" placeholder="'+esc(placeholder||'')+'">'+(hint?'<span class="hint">'+esc(hint)+'</span>':'')+'</label>';
  }
  function areaField(label,path,placeholder,hint){
    return '<label class="field"><span class="field-label">'+esc(label)+'</span><textarea class="text-input sampling-textarea" data-path="'+esc(path)+'" placeholder="'+esc(placeholder||'')+'">'+esc(get(path)||'')+'</textarea>'+(hint?'<span class="hint">'+esc(hint)+'</span>':'')+'</label>';
  }
  function check(label,path,hint){
    return '<label class="sampling-check"><input type="checkbox" data-check="'+esc(path)+'" '+(get(path)?'checked':'')+'><span><strong>'+esc(label)+'</strong>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</span></label>';
  }
  function tri(label,path,hint){
    return selectField(label,path,rules().tri(),hint);
  }
  function notice(type,title,text){
    return '<div class="notice '+esc(type||'info')+'"><strong>'+esc(title)+'</strong><br>'+esc(text)+'</div>';
  }
  function header(){
    const pct=Math.round(((step+1)/STEP_TITLES.length)*100);
    return '<div class="sampling-head"><div><h2>事業放流水採樣</h2><p>NIEA W109.54B｜113年12月15日生效</p></div><button type="button" class="btn btn-ghost" data-action="exit">返回水污染功能</button></div>'+
      '<div class="sampling-progress"><div class="sampling-progress-meta"><strong>'+(step+1)+'／'+STEP_TITLES.length+' '+esc(STEP_TITLES[step])+'</strong><span>'+pct+'%</span></div><div class="sampling-progress-track"><i style="width:'+pct+'%"></i></div></div>';
  }
  function stepPlan(){
    const sp=state.special||{};
    return '<section class="card sampling-card"><h3>1. 採樣規劃與樣品識別</h3>'+
      notice('info','適用範圍','本流程僅供事業、污水下水道系統及建築物污水處理設施放流水採集。')+
      '<div class="grid-2">'+
      selectField('適用對象','subjectType',rules().subjects())+
      selectField('採樣點性質','outletType',rules().outlets())+
      textField('採樣地點','samplingLocation','例如：D01 放流口／廠區東側排放口')+
      textField('座標','coordinates','例如：25.000000, 121.000000','採樣地點或座標至少記錄一項。')+
      textField('樣品編號','sampleId','例如：1151007-W01')+
      textField('樣品種類','sampleDescription','例如：放流水')+
      textField('採樣日期','sampleDate','','','date')+
      textField('採樣時間','sampleTime','','','time')+
      textField('樣品數量','sampleCount','例如：6 瓶／1 組')+
      selectField('採樣方式','samplingMode',rules().samplingModes(),'抓樣反映當時瞬間濃度；混樣反映一段時間平均濃度。')+
      '</div><div class="btn-row"><button type="button" class="btn btn-secondary" data-action="now">帶入現在日期時間</button></div>'+
      areaField('分析／檢測項目','analysisItems','例如：pH、COD、SS、氨氮、重金屬…','請依實際送驗項目記錄；本模組不自行推定應驗項目。')+
      '<div class="divider"></div><h4>待測項目特性</h4><p class="small muted">以下只用來觸發 W109.54B 的採樣方式、容器、現場處理與品管提醒；不是放流水標準判定。</p>'+
      '<div class="sampling-check-grid">'+
      check('總餘氯','special.totalResidualChlorine','屬須現場檢測項目；一般不適宜混樣。')+
      check('水溫','special.temperature','屬須現場檢測項目；一般不適宜混樣。')+
      check('pH','special.ph','屬須現場檢測項目；一般不適宜混樣。')+
      check('六價鉻','special.chromiumVI','方法列為最長保存期限24小時以下之例。')+
      check('氨氮（電極法）','special.ammoniaElectrode','方法列為最長保存期限24小時以下之例。')+
      check('鹼度','special.alkalinity','方法列為最長保存期限24小時以下之例。')+
      check('導電度','special.conductivity','不可攪動和混樣之項目。')+
      check('溶氧','special.dissolvedOxygen','不可攪動和混樣之項目。')+
      check('硫化物','special.sulfide','不可攪動和混樣之項目。')+
      check('油脂','special.oilGrease','不可攪動和混樣之項目。')+
      check('總有機碳','special.toc','不可攪動和混樣之項目。')+
      check('揮發性有機化合物 VOC','special.voc','影響混樣、容器、留空間及現場／運送空白。')+
      check('微生物樣品','special.microbiology','一般不適宜混樣，且需運送空白。')+
      check('溶解性鐵／錳等','special.dissolvedFeMn','須於採樣現場過濾。')+
      check('其他保存期限≤24小時項目','special.otherShortHolding','依個別檢測方法判斷。')+
      check('其他不穩定／不易混合均勻項目','special.otherNoMix','依個別檢測方法判斷。')+
      '</div></section>';
  }
  function stepPreflight(){
    let extra='';
    if(state.special?.temperature)extra+=tri('溫度計最小刻度可達0.1℃','preflight.temperatureMeter');
    if(state.special?.ph)extra+=tri('pH計最小刻度可達0.01 pH且附溫度補償','preflight.phMeter');
    if(state.special?.voc)extra+=tri('VOC使用約40 mL棕（褐）色玻璃瓶、中空螺旋蓋及鐵氟龍墊片','preflight.vocContainer');
    if(state.special?.microbiology)extra+=tri('微生物使用120 mL以上無菌硼矽玻璃瓶／無菌塑膠瓶或市售無菌容器','preflight.microbiologyContainer');
    if(state.special?.dissolvedFeMn)extra+=tri('已備妥0.4～0.45 μm適用現場過濾裝置','preflight.filterReady');
    return '<section class="card sampling-card"><h3>2. 採樣前確認</h3>'+
      notice('warn','不要由本模組猜保存條件','樣品容器、水樣需要量、保存劑、保存條件及期限應依各待測物檢測方法或 NIEA W102.5 確認。')+
      '<div class="grid-2">'+
      tri('已依採樣目的與待測物要求規劃代表性水樣','preflight.representativePlan')+
      tri('採樣器材／樣品容器已依適用方法完成清洗','preflight.equipmentClean','可依待測物方法、W102.5或NIEA PA-106；未使用過容器可依方法以試劑水淋洗後晾乾。')+
      tri('已依待測物方法確認正確樣品容器','preflight.containerConfirmed')+
      tri('已依待測物方法確認保存方式與保存劑','preflight.preservativeConfirmed')+
      tri('已規劃採集足量水樣','preflight.sufficientVolume')+
      tri('已評估採樣安全','preflight.safetyChecked','樣品可能具有毒性，安全優先。')+
      extra+
      '</div>'+
      '<details class="sampling-method-note"><summary>交互污染提醒</summary><p>採樣器材應避免交互污染；塑膠瓶可能造成鄰苯二甲酸酯污染；重金屬項目應避免使用含重金屬襯裏之蓋子。</p></details>'+
      '</section>';
  }
  function stepExecution(){
    let auto='';
    if(state.samplingEquipment==='autoGrab'||state.samplingEquipment==='autoComposite'){
      auto='<div class="divider"></div><h4>自動採水設備</h4><div class="grid-2">'+
        tri('採樣管已放置於採樣放流水中','execution.autoTubeInEffluent')+
        tri('收集管已放置於不受污染位置','execution.autoCollectionProtected')+
        tri('採樣瓶連結及自動取樣／混樣條件已確認','execution.autoSettingsConfirmed')+
        tri('採樣後已取出樣品瓶並蓋緊瓶蓋','execution.bottleTight')+'</div>';
    }
    let composite='';
    if(state.samplingMode==='composite'){
      const groups=rules().compositeRestrictions(state);
      composite='<div class="divider"></div><h4>混樣專項</h4>'+
        (groups.length?notice('warn','目前有不適宜混樣項目',groups.join('、')+'。請依方法改採適當採樣方式或再核對個別檢測方法。'):'')+
        '<div class="grid-2">'+tri('各子樣品均已冷藏','execution.compositeSubsamplesCold')+
        textField('最後一個子樣品採集時間','execution.compositeLastSampleTime','','本方法以此時間作為混樣樣品採樣時間。','time')+'</div>';
    }
    let special='';
    if(state.special?.voc)special+=tri('VOC樣品未預留運送膨脹空間','execution.vocNoHeadspace','本方法僅允許非VOC樣品容器預留適當緩衝空間。');
    if(state.special?.dissolvedFeMn)special+=tri('溶解性鐵／錳等水樣已於採樣現場過濾','execution.dissolvedFiltered');
    const split=get('execution.splitRequired');
    return '<section class="card sampling-card"><h3>3. 執行採樣</h3><div class="grid-2">'+
      selectField('採樣器材','samplingEquipment',rules().equipment())+
      tri('本次是否需要分裝樣品？','execution.splitRequired','需要分裝時，應先採取足量水樣混合均勻後再分裝。')+
      (split==='yes'?tri('分裝前已將足量水樣混合均勻','execution.splitMixed'):'')+
      special+'</div>'+auto+composite+
      '<div class="divider"></div><h4>現場檢測結果</h4><div class="grid-2">'+
      (state.special?.temperature?textField('水溫（℃）','execution.fieldTemperature','例如：26.4'):'')+
      (state.special?.ph?textField('pH','execution.fieldPh','例如：7.12'):'')+
      (state.special?.conductivity?textField('導電度','execution.fieldConductivity','依儀器單位記錄'):'')+
      (state.special?.dissolvedOxygen?textField('溶氧','execution.fieldDo','依儀器單位記錄'):'')+
      (state.special?.totalResidualChlorine?textField('總餘氯','execution.fieldResidualChlorine','依檢測方法單位記錄'):'')+
      ((!state.special?.temperature&&!state.special?.ph&&!state.special?.conductivity&&!state.special?.dissolvedOxygen&&!state.special?.totalResidualChlorine)?'<p class="muted">目前未勾選需記錄的現場檢測項目。</p>':'')+
      '</div></section>';
  }
  function stepPreservation(){
    return '<section class="card sampling-card"><h3>4. 樣品保存、運送與採樣紀錄</h3>'+
      '<div class="grid-2">'+
      textField('採樣人員姓名','samplerName','姓名')+
      textField('所屬單位','samplerUnit','單位名稱')+
      textField('實際樣品容器','preservation.sampleContainer','例如：棕色玻璃瓶／塑膠瓶','需依待測物檢測方法或W102.5確認。')+
      textField('實際保存方式','preservation.preservationMethod','例如：冷藏；另依檢測方法處理')+
      textField('添加保存劑情形','preservation.preservativeAdded','例如：未添加／已依方法添加…','未添加也要記錄。')+
      selectField('運送冷藏方式','preservation.coolingMode',[['iceWaterBath','足量冰塊＋水形成冰水浴'],['other','其他適當方法']])+
      (state.preservation?.coolingMode==='other'?textField('其他冷藏方式','preservation.coolingOther','請記錄實際方式'):'')+
      tri('樣品已移入冷藏設備保存及運送','preservation.chilled')+
      tri('運送時已包裝完妥置於適當容器','preservation.transportPackaged')+
      tri('確認未使用乾冰','preservation.noDryIce','方法註記應避免乾冰，以免冷凍樣品並影響pH。')+
      '</div>'+
      notice('info','採樣紀錄必備內容','採樣地點或座標、樣品編號、日期時間、樣品種類與數量、分析項目、採樣方式、採樣器材、樣品容器、保存方式、採樣人員及現場檢測結果等，應留下紀錄。')+
      '</section>';
  }
  function stepLabelQc(){
    const req=rules().requiredQc(state);
    let qc='';
    if(req.length){
      qc=req.map(function(item){return tri(item.label+'是否已製備？','qc.'+item.key,item.reason);}).join('');
    }else qc='<p class="muted">依目前勾選的待測項目與設備使用情形，未觸發 W109.54B 的特定空白樣品要求。</p>';
    return '<section class="card sampling-card"><h3>5. 樣品標籤、封條與現場品管</h3>'+
      '<h4>樣品標籤至少應包含</h4><div class="sampling-check-grid">'+
      check('樣品編號','label.sampleId')+
      check('採樣者姓名及所屬單位','label.samplerUnit')+
      check('採樣日期及時間','label.dateTime')+
      check('採樣地點','label.location')+
      check('添加保存劑','label.preservative')+
      check('檢測項目','label.analysisItems')+
      '</div><div class="divider"></div><h4>樣品封條</h4><div class="sampling-check-grid">'+
      check('樣品容器已加上封條','seal.attached')+
      check('開啟容器後會撕毀／改變封條原狀或留下開封記號','seal.tamperEvident')+
      check('現場採樣人員已於封條簽章','seal.signed')+
      '</div><div class="divider"></div><h4>現場品管樣品</h4>'+
      check('同一採樣行程有重複使用採樣容器或圓筒，且過程無法依規定清洗','qc.equipmentReused','勾選後會要求設備空白樣品。')+
      '<div class="grid-2">'+qc+'</div>'+
      notice('info','後續檢驗提醒','除檢測方法另有規定外，放流水檢測值介於法規標準值100%至120%時，應執行已製備空白樣品檢測。')+
      '</section>';
  }
  function listBlock(title,items,cls){
    if(!items?.length)return '';
    return '<section class="sampling-result-block '+esc(cls||'')+'"><h4>'+esc(title)+'</h4><ul>'+items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></section>';
  }
  function stepSummary(){
    const result=rules().evaluate(state);
    const label=result.status==='complete'?'程序檢核完整':result.status==='risk'?'有已確認程序風險':'尚有程序事項待確認';
    const cls=result.status==='complete'?'sampling-status-ok':result.status==='risk'?'sampling-status-risk':'sampling-status-pending';
    return '<section class="card sampling-card"><h3>6. 最終程序檢核</h3>'+
      '<div class="sampling-status '+cls+'"><strong>'+esc(label)+'</strong><span>此狀態只反映 NIEA W109.54B 程序檢核，不代表檢驗結果、違規成立或證據效力之法律結論。</span></div>'+
      listBlock('已確認程序風險',result.issues,'risk')+
      listBlock('尚待確認',result.missing,'pending')+
      listBlock('方法提醒',result.warnings,'warn')+
      listBlock('後續提醒',result.reminders,'info')+
      '<div class="divider"></div><h4>採樣作業摘要</h4><pre class="sampling-summary">'+esc(rules().summary(state))+'</pre>'+
      '<div class="btn-row"><button type="button" class="btn btn-secondary" data-action="copy">複製採樣摘要</button><button type="button" class="btn btn-ghost" data-action="reset">重新開始</button></div>'+
      '</section>';
  }
  function body(){
    if(step===0)return stepPlan();
    if(step===1)return stepPreflight();
    if(step===2)return stepExecution();
    if(step===3)return stepPreservation();
    if(step===4)return stepLabelQc();
    return stepSummary();
  }
  function footer(){
    return '<div class="sampling-sticky">'+
      '<button type="button" class="btn btn-ghost" data-action="prev" '+(step===0?'disabled':'')+'>上一步</button>'+
      (step<STEP_TITLES.length-1?'<button type="button" class="btn btn-primary" data-action="next">下一步</button>':'<button type="button" class="btn btn-primary" data-action="exit">完成／返回</button>')+
      '</div>';
  }
  function render(){
    if(!app)return;
    app.classList.add('water-sampling-shell');
    app.innerHTML=header()+body()+footer();
    bind();
  }
  function bind(){
    app.querySelectorAll('[data-path]').forEach(function(node){
      const event=node.tagName==='SELECT'?'change':'input';
      node.addEventListener(event,function(e){set(node.dataset.path,e.target.value);if(node.dataset.path==='samplingMode'||node.dataset.path==='samplingEquipment'||node.dataset.path==='execution.splitRequired'||node.dataset.path==='preservation.coolingMode')render();});
    });
    app.querySelectorAll('[data-check]').forEach(function(node){
      node.addEventListener('change',function(e){set(node.dataset.check,!!e.target.checked);render();});
    });
    app.querySelectorAll('[data-action]').forEach(function(node){
      node.addEventListener('click',async function(){
        const action=node.dataset.action;
        if(action==='next'){step=Math.min(STEP_TITLES.length-1,step+1);render();root.scrollTo?.({top:0,behavior:'smooth'});}
        else if(action==='prev'){step=Math.max(0,step-1);render();root.scrollTo?.({top:0,behavior:'smooth'});}
        else if(action==='exit'){exitHandler?.();}
        else if(action==='now'){
          const d=new Date(),pad=function(n){return String(n).padStart(2,'0');};
          state.sampleDate=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
          state.sampleTime=pad(d.getHours())+':'+pad(d.getMinutes());render();
        }else if(action==='reset'){
          if(root.confirm?.('重新開始會清除目前採樣流程輸入，是否繼續？')===false)return;
          state=rules().empty();step=0;render();
        }else if(action==='copy'){
          const txt=rules().summary(state);
          try{await root.navigator?.clipboard?.writeText?.(txt);root.alert?.('採樣摘要已複製。');}
          catch(_){root.prompt?.('請複製以下採樣摘要：',txt);}
        }
      });
    });
  }
  function mount(container,opts){
    if(!container)throw new Error('WaterSamplingUI mount target is required.');
    app=container;exitHandler=typeof opts?.onExit==='function'?opts.onExit:null;render();
  }
  function hasData(){
    const copy=JSON.parse(JSON.stringify(state||{}));
    const base=rules().empty();
    copy.sampleDescription='放流水';base.sampleDescription='放流水';
    return JSON.stringify(copy)!==JSON.stringify(base);
  }
  function snapshot(){return JSON.parse(JSON.stringify(state));}
  function restore(value){
    const base=rules().empty();
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('事業放流水採樣資料格式無效。');
    const copy=JSON.parse(JSON.stringify(value));
    state=Object.assign({},base,copy,{
      special:Object.assign({},base.special,copy.special||{}),
      preflight:Object.assign({},base.preflight,copy.preflight||{}),
      execution:Object.assign({},base.execution,copy.execution||{}),
      preservation:Object.assign({},base.preservation,copy.preservation||{}),
      label:Object.assign({},base.label,copy.label||{}),
      seal:Object.assign({},base.seal,copy.seal||{}),
      qc:Object.assign({},base.qc,copy.qc||{})
    });
    if(app)render();
  }
  function reset(){state=rules().empty();step=0;if(app)render();}

  root.WaterSamplingUI=Object.freeze({
    version:'5.2.12',
    method:'NIEA W109.54B',
    mount,
    hasData,
    snapshot,
    restore,
    reset,
    evaluate:function(){return rules().evaluate(state);}
  });
})(window);
