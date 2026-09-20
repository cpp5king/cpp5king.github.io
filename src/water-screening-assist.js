(function(root){
  'use strict';

  const VERSION='4.9.43';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  const ITEMS=Object.freeze([
    {code:'NI',label:'Ni｜鎳',model:'WAK-Ni',range:'0.5、1、2、5、10 mg/L',time:'約2分',unit:'mg/L',note:'主要測離子態 Ni²⁺；沉澱或錯合可能影響判讀。'},
    {code:'CU',label:'Cu｜銅',model:'WAK-Cu',range:'0.5、1、2、3、5、10以上 mg/L',time:'約1分',unit:'mg/L',note:'錯形成銅可能無法完整反映。'},
    {code:'NO3',label:'NO3｜硝酸',model:'WAK-NO3',range:'NO3⁻ 1～45；NO3-N 0.2～10 mg/L',time:'約3分',unit:'mg/L',note:'NO2⁻ 共存可能干擾。'},
    {code:'ZN',label:'Zn｜鋅',model:'WAK-Zn',range:'約0～5以上 mg/L',time:'約1分',unit:'mg/L',note:'主要測離子態 Zn²⁺。'},
    {code:'CL',label:'Cl｜氯化物',model:'WAK-Cl(200)',range:'100以下／150附近／200以上 mg/L',time:'約10秒',unit:'mg/L',note:'自然背景常有氯化物；以沿線差異比單純有反應更有意義。'},
    {code:'COD',label:'COD',model:'WAK-COD-2',range:'0、5、10、13、20、50、100 mg/L',time:'約5分',unit:'mg/L',note:'與公定法可能不同；只作現場查源輔助。'},
    {code:'S',label:'S｜硫化物',model:'WAK-S',range:'0.1～5 mg/L',time:'約3分',unit:'mg/L',note:'不代表硫酸鹽或亞硫酸鹽。'},
    {code:'FE',label:'Fe｜鐵',model:'WAK-Fe',range:'0.2、0.5、1、2、5、10 mg/L',time:'約2分',unit:'mg/L',note:'自然水或鏽蝕亦可能出現鐵。'},
    {code:'CRT',label:'Cr-T｜全鉻',model:'WAK-Cr-T',range:'0.5、1、2、5、10、20 mg/L',time:'約5.5分',unit:'mg/L',note:'含前處理步驟，依現場盒裝使用法操作。'},
    {code:'CR6',label:'Cr6｜六價鉻',model:'WAK-Cr6+',range:'0.05、0.1、0.2、0.5、1、2 mg/L',time:'約2分',unit:'mg/L',note:'與 Cr-T 並用可增加查源資訊。'},
    {code:'CN2',label:'CN-2｜遊離氰',model:'WAK-CN-2',range:'0.02以下～2 mg/L',time:'約8分',unit:'mg/L',note:'不等於全氰；金屬錯合氰可能無法反映。'},
    {code:'NH4',label:'NH4｜銨',model:'WAK-NH4-4',range:'0.2、0.5、1、2、5、10 mg/L',time:'約5分',unit:'mg/L',note:'工場排水共存物質多時需注意試劑適用性。'},
    {code:'F',label:'F｜游離氟',model:'WAK-F',range:'0、0.4、0.8、1.5、3、8以上 mg/L',time:'約7分',unit:'mg/L',note:'以現場盒裝／QR 使用法為準。'},
    {code:'DET',label:'陰離子界面活性劑',model:'WA-DET',range:'0.05以下～2 mg/L',time:'約2～3分',unit:'mg/L',note:'其他界面活性劑或油類可能干擾。'}
  ]);

  const PHENOMENA=Object.freeze({
    '變色':{codes:['NI','CU','ZN','FE','CRT','CR6'],reason:'先建立金屬類污染特徵；顏色本身不能辨識特定金屬。'},
    '異味':{codes:['COD','NH4','S'],reason:'可建立有機負荷、含氮或硫化物特徵；不以嗅覺推定特定化學物。'},
    '泡沫':{codes:['DET','COD'],reason:'優先確認洗滌／清潔劑特徵，再以 COD 補充有機負荷線索。'},
    '油膜':{codes:['COD'],reason:'現有庫存沒有油類專項快篩，COD 僅作一般有機污染線索。'},
    '混濁':{codes:['COD'],reason:'現有品項沒有 SS／濁度專項，COD 僅作一般污染負荷線索。'},
    '漂浮物／懸浮物':{codes:['COD'],reason:'先建立一般污染特徵，再依外觀與周邊線索選其他項目。'},
    '沉積物／污泥／浮渣':{codes:['FE','ZN','NI','CU','CRT'],reason:'若呈工業性沉積或顏色異常，可用金屬組作沿線比對。'},
    '異常水流':{codes:[],reason:'異常水流本身不是化學特徵；追水時優先重測前一節點有反應項目。'},
    '水生生物異常':{codes:['COD','NH4','S'],reason:'先確認 pH／水溫，再建立有機、含氮與硫化物特徵。'},
    '其他':{codes:[],reason:'由稽查員依周邊場所、製程、原料或其他客觀線索自行選擇。'}
  });


  const INDUSTRIES=Object.freeze([
    {code:'metal_surface',label:'金屬表面處理／電鍍',codes:['NI','CU','ZN','CRT','CR6','CN2'],reason:'金屬表面處理或電鍍場所可優先建立金屬與含氰特徵。',processes:[
      {code:'plating',label:'電鍍',codes:['NI','CU','ZN','CRT','CR6','CN2']},
      {code:'pickling',label:'酸洗',codes:['FE','ZN','NI','CU','CRT']},
      {code:'conversion',label:'化成／皮膜處理',codes:['ZN','CRT','CR6']},
      {code:'cleaning',label:'清洗／脫脂',codes:['COD','DET']}
    ]},
    {code:'metal_work',label:'金屬加工／酸洗',codes:['FE','ZN','NI','CU','CRT'],reason:'金屬加工若伴隨酸洗、清洗或表面處理，可優先建立金屬污染特徵。',processes:[
      {code:'pickling',label:'酸洗',codes:['FE','ZN','NI','CU','CRT']},
      {code:'cleaning',label:'清洗／脫脂',codes:['COD','DET']},
      {code:'surface',label:'表面處理',codes:['NI','CU','ZN','CRT','CR6']}
    ]},
    {code:'electronics',label:'半導體／電子製造',codes:['F','CU','NI'],reason:'電子製造差異很大，應再依蝕刻、清洗、表面處理等實際製程縮小快篩項目。',processes:[
      {code:'etch',label:'蝕刻',codes:['F','CU']},
      {code:'plating',label:'電鍍／表面處理',codes:['CU','NI','ZN','CRT','CR6']},
      {code:'cleaning',label:'清洗',codes:['COD','DET']}
    ]},
    {code:'washing',label:'清洗／洗滌／洗車',codes:['DET','COD'],reason:'清洗與洗滌相關場所可優先確認界面活性劑與有機負荷特徵。',processes:[
      {code:'detergent',label:'清潔劑／洗劑使用',codes:['DET','COD']},
      {code:'degrease',label:'脫脂／清洗',codes:['DET','COD']}
    ]},
    {code:'food',label:'食品製造／餐飲',codes:['COD','NH4'],reason:'食品與餐飲排水可優先建立有機負荷與含氮特徵。',processes:[
      {code:'processing',label:'食品加工',codes:['COD','NH4']},
      {code:'cleaning',label:'設備／場地清洗',codes:['COD','DET']}
    ]},
    {code:'livestock',label:'畜牧',codes:['COD','NH4','NO3'],reason:'畜牧排水可優先建立有機負荷及含氮特徵。',processes:[]},
    {code:'domestic',label:'生活污水／化糞池',codes:['COD','NH4','NO3'],reason:'生活污水或化糞池來源可優先建立有機負荷及含氮特徵。',processes:[]},
    {code:'fertilizer',label:'肥料／農業相關',codes:['NH4','NO3'],reason:'肥料與農業相關來源可優先確認銨與硝酸特徵。',processes:[]},
    {code:'refrigeration',label:'冷凍／冷藏相關',codes:['NH4'],reason:'若現場涉及含氨設備或疑似含氨排水，可優先確認 NH4。',processes:[
      {code:'ammonia',label:'含氨設備／冷媒',codes:['NH4']}
    ]},
    {code:'saline',label:'高鹽／鹽水使用製程',codes:['CL'],reason:'使用鹽水或高鹽製程時，可用 Cl 作沿線比較線索。',processes:[]},
    {code:'sulfide',label:'含硫化物製程',codes:['S'],reason:'使用或可能產生硫化物之製程，可優先確認 S。',processes:[]},
    {code:'other',label:'其他／尚不確定',codes:[],reason:'尚無法由行業／製程提供特定建議，可依現場情形與沿線結果選擇。',processes:[]}
  ]);

  function item(code){return ITEMS.find(x=>x.code===code)||null;}
  function unique(arr){return [...new Set(arr.filter(Boolean))];}
  function normalizeRecord(r={}){
    let code=(r.code||'').toUpperCase();
    if(!code&&r.item){
      const needle=String(r.item).trim().toLowerCase();
      const found=ITEMS.find(x=>x.code.toLowerCase()===needle||x.label.toLowerCase()===needle||x.label.split('｜')[0].toLowerCase()===needle);
      if(found)code=found.code;
    }
    const def=item(code);
    return {
      code:code||'',
      reaction:r.reaction||'',
      value:r.value||'',
      unit:r.unit||def?.unit||'mg/L',
      note:r.note||''
    };
  }
  function recommendations(phenomena=[]){
    const reasons=[];const codes=[];
    phenomena.forEach(name=>{
      const r=PHENOMENA[name];
      if(!r)return;
      codes.push(...r.codes);
      if(r.reason)reasons.push(`${name}：${r.reason}`);
    });
    return {codes:unique(codes),reasons:unique(reasons)};
  }

  function industry(code){return INDUSTRIES.find(x=>x.code===code)||null;}
  function industryRecommendations(industryCode='',processCodes=[]){
    const def=industry(industryCode);
    if(!def)return {codes:[],reasons:[]};
    const selected=new Set(processCodes||[]);
    const chosen=(def.processes||[]).filter(proc=>selected.has(proc.code));
    const codes=chosen.length?chosen.flatMap(proc=>proc.codes||[]):[...(def.codes||[])];
    const reasons=[];
    if(chosen.length){
      chosen.forEach(proc=>reasons.push(`製程「${proc.label}」：建議優先快篩 ${unique(proc.codes||[]).map(c=>item(c)?.label||c).join('、')}。`));
    }else if(def.reason){
      reasons.push(`行業／來源類型：${def.reason}`);
    }
    return {codes:unique(codes),reasons:unique(reasons)};
  }
  function reactedCodes(records=[]){return unique(records.map(normalizeRecord).filter(r=>r.reaction==='yes').map(r=>r.code));}
  function sourceDirections(records=[],context={}){
    const yes=new Set(reactedCodes(records));
    const out=[];
    const add=(id,title,reason,caution)=>{if(!out.some(x=>x.id===id))out.push({id,title,reason,caution});};
    const metals=['NI','CU','ZN','FE','CRT','CR6'].filter(x=>yes.has(x));
    const phRaw=context&&context.ph!==undefined?String(context.ph).trim():'';
    const ph=phRaw===''?NaN:Number(phRaw);
    if(yes.has('CN2'))add('CN','含氰製程方向','可優先留意電鍍、熱處理、含氰藥劑使用場所或其他可能產生含氰物質之場所。','CN-2 不等於全氰，仍需以製程、水路及其他事實查證。');
    if(metals.length>=2)add('METAL','金屬表面處理／金屬加工方向',`目前有多項金屬特徵同時反應（${metals.map(c=>item(c)?.label||c).join('、')}），可優先查找金屬表面處理、電鍍、金屬加工或相關藥劑使用場所。`,'多項反應仍只屬查源線索。');
    if(yes.has('CR6'))add('CR6','六價鉻／鉻化合物製程方向','可優先留意使用六價鉻或鉻化合物之製程及金屬表面處理相關場所。','仍需由製程、藥品及排水路徑確認。');
    if(yes.has('NH4')&&yes.has('COD'))add('ORG_N','高有機負荷＋含氮來源方向','可優先留意生活污水、食品製造、畜牧或其他高有機負荷且含氮之排水來源。','此為組合線索，不代表特定行業。');
    else if(yes.has('NH4'))add('NH4','含氨／含氮來源方向','可優先留意生活污水／糞尿、冷凍設施、肥料或含氮化學品相關來源。','自然背景與其他來源亦可能存在，應沿線比較。');
    if(yes.has('NH4')&&yes.has('NO3'))add('NITROGEN','含氮水路方向','銨與硝酸特徵同時出現，可優先追查生活污水、肥料／農業、畜牧或其他含氮來源。','NO3 可能具有背景值，建議重視相對差異。');
    if(yes.has('DET')&&yes.has('COD'))add('WASH','清洗／洗滌來源方向','可優先留意清洗、洗滌、清潔劑使用或生活污水等來源。','陰離子界面活性劑快篩可能受其他物質干擾。');
    if(yes.has('S')&&(yes.has('COD')||yes.has('NH4')))add('SULFIDE','厭氧污水／硫化物使用方向','可優先留意厭氧性有機污水、生活／糞尿污水或使用硫化物之製程。','不宜由臭味單獨推定硫化物。');
    if(yes.has('F')&&metals.length)add('FLUORIDE','含氟藥劑／表面處理方向','游離氟搭配金屬特徵時，可優先留意含氟藥劑、蝕刻、表面處理或其他含氟製程。','WAK-F 主要反映游離 F⁻。');
    // pH 僅作查源特徵，不與法定放流水標準比較。採保守門檻，避免自然水體的小幅偏離被過度解讀。
    if(Number.isFinite(ph)&&ph<=5)add('PH_ACID','酸性排水特徵',`現場 pH ${phRaw}，呈明顯酸性特徵；可優先留意使用酸液、酸洗、表面處理或其他可能產生酸性排水的場所。`,'此為查源提示，不等同法定超標、污染來源或違規認定。');
    if(Number.isFinite(ph)&&ph>=9)add('PH_ALKALI','鹼性排水特徵',`現場 pH ${phRaw}，呈明顯鹼性特徵；可優先留意使用鹼液、清洗／脫脂、化學處理或其他可能產生鹼性排水的場所。`,'此為查源提示，不等同法定超標、污染來源或違規認定。');
    if(!out.length&&yes.size){
      const labels=[...yes].map(code=>item(code)?.label||code);
      add('UNRESOLVED','尚不足形成特定來源方向',`目前有反應項目：${labels.join('、')}。現有快篩特徵尚不足以形成特定來源方向，建議沿水路持續比較相同項目。`,'保留未知狀態；不要因個別快篩反應直接推定污染來源或行業別。');
    }
    return out;
  }
  function repeatFrom(records=[]){return reactedCodes(records);}

  root.WaterScreeningAssist=Object.freeze({
    version:VERSION,provenance:PROVENANCE,items:ITEMS,phenomena:PHENOMENA,industries:INDUSTRIES,
    item,industry,normalizeRecord,recommendations,industryRecommendations,reactedCodes,sourceDirections,repeatFrom
  });
})(typeof window==='undefined'?globalThis:window);
