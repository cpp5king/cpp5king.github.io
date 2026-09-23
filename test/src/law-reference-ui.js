(function(root){
'use strict';
let overlay=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const fmtDate=v=>{const s=String(v||'');const m=s.match(/^(\d{4})(\d{2})(\d{2})$/);if(!m)return s;const y=Number(m[1])-1911;return `${y}.${m[2]}.${m[3]}`;};
function close(){overlay?.remove();overlay=null;}
function normalizeArticleNo(v){
  return String(v||'').replace(/第|條|\s/g,'').replace('之','-');
}
function articleNosFromText(text){
  const out=[];const s=String(text||'');
  const re=/第\s*([0-9０-９]+(?:[-之][0-9０-９]+)?(?:\s*[、,]\s*[0-9０-９]+(?:[-之][0-9０-９]+)?)*|[0-9０-９]+\s*(?:[～~]|至)\s*[0-9０-９]+)\s*條/g;
  const digit=x=>String(x||'').replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0));
  let m;while((m=re.exec(s))){
    const raw=digit(m[1]).replace(/\s/g,'');
    const range=raw.match(/^(\d+)(?:[～~]|至)(\d+)$/);
    if(range){const a=Number(range[1]),b=Number(range[2]);if(Number.isFinite(a)&&Number.isFinite(b)&&b>=a&&b-a<=50){for(let n=a;n<=b;n++)out.push(String(n));}continue;}
    for(const x of raw.split(/[、,]/)){if(x)out.push(x.replace('之','-'));}
  }
  return uniq(out);
}
function relatedIndex(context,lib){
  const out=new Map();
  const entryById=new Map((lib?.entries||[]).map(e=>[e.id,e]));
  const aliases={
    'air-act':['空氣污染防制法','空污法'],
    'water-act':['水污染防治法','水污法'],
    'noise-act':['噪音管制法'],
    'waste-act':['廢棄物清理法','廢清法']
  };
  const directions=context?.related?.directions||context?.directions||[];
  for(const d of directions){
    for(const id of d.lawIds||[]){
      if(!out.has(id))out.set(id,{directions:[],facts:[],missing:[],articleRefs:[]});
      const row=out.get(id);row.directions.push(d.title||d.id||'可能相關');
      row.facts.push(...(d.facts||[]),...(d.opposing||[]).map(x=>'限制／相反事實：'+x));
      row.missing.push(...(d.missing||[]));
      const entry=entryById.get(id);const names=aliases[id]||[entry?.name].filter(Boolean);
      for(const text of [...(d.basis||[]),d.title||'']){
        if((d.lawIds||[]).length===1||names.some(n=>String(text||'').includes(n)))row.articleRefs.push(...articleNosFromText(text));
      }
    }
  }
  for(const x of context?.relatedLaws||[]){
    if(!out.has(x.id))out.set(x.id,{directions:[],facts:[],missing:[],articleRefs:[]});
    const row=out.get(x.id);row.directions.push(x.title||'可能相關');row.facts.push(...(x.facts||[]));row.missing.push(...(x.missing||[]));row.articleRefs.push(...(x.articleRefs||[]).map(normalizeArticleNo));
  }
  for(const row of out.values()){row.directions=uniq(row.directions);row.facts=uniq(row.facts);row.missing=uniq(row.missing);row.articleRefs=uniq(row.articleRefs);}
  return out;
}
function renderRelatedBox(entry,rel){
  if(!rel)return null;
  const box=document.createElement('div');box.className='law-ref-related-box';
  box.innerHTML=`<strong>可能相關</strong><div class="law-ref-related-title">${esc(rel.directions.join('／'))}</div>`;
  const f=document.createElement('div');f.className='law-ref-related-grid';
  const left=document.createElement('div');left.innerHTML='<b>觸發事實</b>';
  const lf=document.createElement('ul');(rel.facts.length?rel.facts:['目前案件已有規則方向連到本法規；請回到事實頁確認觸發內容。']).forEach(x=>{const li=document.createElement('li');li.textContent=x;lf.append(li);});left.append(lf);
  const right=document.createElement('div');right.innerHTML='<b>仍待確認事項</b>';
  const rm=document.createElement('ul');(rel.missing.length?rel.missing:['目前沒有額外待確認項目；仍須依行為日期與完整事證確認適用。']).forEach(x=>{const li=document.createElement('li');li.textContent=x;rm.append(li);});right.append(rm);
  f.append(left,right);box.append(f);return box;
}
function fullEntry(entry){return root.INSPECTION_LAW_FULLTEXT?.entries?.[entry.id]||null;}
function articleRecords(full){
  if(Array.isArray(full?.articles)&&full.articles.length)return full.articles;
  return [];
}
function matchesQuery(rec,q){
  if(!q)return true;
  const hay=[rec.no,rec.text,rec.chapter,...(rec.headingPath||[])].join(' ').toLowerCase();return hay.includes(q.toLowerCase());
}
function noisePipeCells(line){
  const parts=String(line||'').split('│');
  if(parts.length<3)return [];
  return parts.slice(1,-1).map(x=>x.replace(/[┌┐└┘├┤┬┴┼─]/g,'').replace(/\s+/g,' ').trim());
}
function noiseBoxBlocks(text){
  const lines=String(text||'').split('\n'),blocks=[];let start=-1;
  for(let i=0;i<lines.length;i++){
    if(start<0&&lines[i].includes('┌'))start=i;
    if(start>=0&&lines[i].includes('┘')){blocks.push({start,end:i,lines:lines.slice(start,i+1)});start=-1;}
  }
  return {lines,blocks};
}
function noiseRows(blockLines){
  const out=[];
  for(const line of blockLines||[]){
    const cells=noisePipeCells(line);if(!cells.length)continue;
    const classIndex=cells.findIndex(x=>/^(第一類|第二類|第三類|第四類|第一、二類|第三、四類)$/.test(x));
    if(classIndex>=0){
      const vals=cells.slice(classIndex+1).map(x=>x.replace(/\s+/g,'')).filter(x=>/^[-－]?\d+(?:\.\d+)?$/.test(x)||x==='－');
      out.push({label:cells[classIndex],values:vals});continue;
    }
    if(cells.length>=2&&/^(?:\d+|6以上|6 以上)$/.test(cells[0].replace(/\s+/g,''))&&/^-\d+$/.test(cells[1].replace(/\s+/g,''))){
      out.push({label:cells[0].replace(/\s+/g,' '),values:[cells[1].replace(/\s+/g,'')]});
    }
  }
  return out;
}
function appendNoiseTable(parent,{title='',groups=[],columns=[],rows=[]}={}){
  if(!rows.length)return;
  if(title){const h=document.createElement('h5');h.className='law-ref-table-title';h.textContent=title;parent.append(h);}
  const wrap=document.createElement('div');wrap.className='law-ref-table-wrap';
  const table=document.createElement('table');table.className='law-ref-data-table';
  const thead=document.createElement('thead');
  if(groups.length){
    const tr=document.createElement('tr');const th=document.createElement('th');th.rowSpan=2;th.textContent='管制區';tr.append(th);
    for(const g of groups){const x=document.createElement('th');x.colSpan=g.span;x.textContent=g.label;tr.append(x);}thead.append(tr);
    const tr2=document.createElement('tr');for(const c of columns){const th2=document.createElement('th');th2.textContent=c;tr2.append(th2);}thead.append(tr2);
  }else{
    const tr=document.createElement('tr');for(const c of columns){const th=document.createElement('th');th.textContent=c;tr.append(th);}thead.append(tr);
  }
  table.append(thead);const tbody=document.createElement('tbody');
  for(const row of rows){const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=row.label;tr.append(th);for(const v of row.values){const td=document.createElement('td');td.textContent=v;tr.append(td);}tbody.append(tr);}table.append(tbody);wrap.append(table);parent.append(wrap);
}
function appendNoiseProse(parent,text){
  const t=String(text||'').trim();if(!t)return;const p=document.createElement('div');p.className='law-ref-readable-prose';p.textContent=t;parent.append(p);
}
function renderNoiseStandardText(rec){
  const no=normalizeArticleNo(rec.no),supported=['4','5','6','7','8','9'];
  if(!supported.includes(no)||!String(rec.text||'').includes('┌'))return null;
  const {lines,blocks}=noiseBoxBlocks(rec.text);if(!blocks.length)return null;
  const rootEl=document.createElement('div');rootEl.className='law-ref-readable';
  const note=document.createElement('div');note.className='law-ref-readable-note';note.textContent='以下為閱讀版排版；數值與文字取自本機法規快照。可展開下方原始條文格式核對。';rootEl.append(note);
  let cursor=0;
  blocks.forEach((block,index)=>{
    appendNoiseProse(rootEl,lines.slice(cursor,block.start).join('\n'));
    const rows=noiseRows(block.lines);
    if(no==='6'){
      const leq=rows.filter(r=>/^第[一二三四]類$/.test(r.label)&&r.values.length>=6).map(r=>({label:r.label,values:r.values.slice(-6)}));
      const lmax=rows.filter(r=>/第一、二類|第三、四類/.test(r.label)).map(r=>({label:r.label,values:['－','－','－',...r.values.slice(-3)]}));
      appendNoiseTable(rootEl,{title:'均能音量（Leq／Leq,LF）',groups:[{label:'20 Hz 至 200 Hz',span:3},{label:'20 Hz 至 20 kHz',span:3}],columns:['日間','晚間','夜間','日間','晚間','夜間'],rows:leq});
      appendNoiseTable(rootEl,{title:'最大音量（Lmax）',groups:[{label:'20 Hz 至 200 Hz',span:3},{label:'20 Hz 至 20 kHz',span:3}],columns:['日間','晚間','夜間','日間','晚間','夜間'],rows:lmax});
    }else if(no==='9'){
      appendNoiseTable(rootEl,{columns:['非屬同一行為人、法人或非法人之音源數','各設施應符合之噪音管制標準修正值'],rows});
    }else{
      const six=rows.filter(r=>r.values.length>=6).map(r=>({label:r.label,values:r.values.slice(-6)}));
      const three=rows.filter(r=>r.values.length===3);
      if(six.length)appendNoiseTable(rootEl,{groups:[{label:'20 Hz 至 200 Hz',span:3},{label:'20 Hz 至 20 kHz',span:3}],columns:['日間','晚間','夜間','日間','晚間','夜間'],rows:six});
      if(three.length){
        const lowOnly=no==='8'&&index>0;
        appendNoiseTable(rootEl,{title:lowOnly?'20 Hz 至 200 Hz':'',groups:lowOnly?[{label:'20 Hz 至 200 Hz',span:3}]:[],columns:lowOnly?['日間','晚間','夜間']:['管制區','日間','晚間','夜間'],rows:three});
      }
    }
    cursor=block.end+1;
  });
  appendNoiseProse(rootEl,lines.slice(cursor).join('\n'));
  const original=document.createElement('details');original.className='law-ref-original';const sum=document.createElement('summary');sum.textContent='查看原始條文格式';original.append(sum);const raw=document.createElement('div');raw.className='law-ref-full-text law-ref-original-text';raw.textContent=rec.text||'';original.append(raw);rootEl.append(original);
  return rootEl;
}
function renderArticleText(card,rec,entryId){
  if(entryId==='noise-standard'){
    const readable=renderNoiseStandardText(rec);if(readable){card.append(readable);return;}
  }
  const p=document.createElement('div');p.className='law-ref-full-text';p.textContent=rec.text||'';card.append(p);
}
function renderArticleList(container,records,q,articleRefs=[],entryId=''){
  let count=0;let current=null;
  const ensureChapter=title=>{
    const d=document.createElement('details');d.className='law-ref-chapter';d.open=!!q;
    const s=document.createElement('summary');s.textContent=title||'一般條文';d.append(s);
    const body=document.createElement('div');body.className='law-ref-chapter-body';d.append(body);container.append(d);current=body;
  };
  for(const rec of records){
    if(rec.type==='C'){if(!q||matchesQuery(rec,q))ensureChapter(rec.text||rec.chapter||'章節');else current=null;continue;}
    if(articleRefs.length&&!articleRefs.includes(normalizeArticleNo(rec.no)))continue;
    if(!matchesQuery(rec,q))continue;
    if(!current)ensureChapter((rec.headingPath||[]).slice(-1)[0]||rec.chapter||'一般條文');
    const card=document.createElement('article');card.className='law-ref-full-article';
    const h=document.createElement('h4');h.textContent=rec.no||'條文';
    card.append(h);renderArticleText(card,rec,entryId);current.append(card);count++;
  }
  return count;
}
function open(moduleId,context={}){
  close();
  const library=root.INSPECTION_LAW_LIBRARY;const lib=library?.modules?.[moduleId];
  if(!lib){window.alert?.('目前沒有此模組的法規速查資料。');return;}
  const related=relatedIndex(context,lib);
  overlay=document.createElement('div');overlay.className='law-ref-overlay';
  const panel=document.createElement('section');panel.className='law-ref-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',lib.title);
  const head=document.createElement('div');head.className='law-ref-head';
  const completeCount=(lib.entries||[]).filter(e=>articleRecords(fullEntry(e)).length).length;
  const snapshot=root.INSPECTION_LAW_FULLTEXT;
  const snapshotLabel=snapshot?.lawUpdateDate||snapshot?.orderUpdateDate||snapshot?.verifiedAt||library.verifiedAt;
  const h=document.createElement('div');h.innerHTML=`<h2>${esc(lib.title)}</h2><p>中央法規來源：全國法規資料庫（law.moj.gov.tw）｜內建快照 ${esc(snapshotLabel)}｜完整法規 ${completeCount}/${lib.entries.length}</p>`;
  const actions=document.createElement('div');actions.className='law-ref-head-actions';
  const x=document.createElement('button');x.type='button';x.className='secondary law-ref-close';x.textContent='關閉';x.onclick=close;actions.append(x);head.append(h,actions);panel.append(head);
  const notice=document.createElement('div');notice.className='law-ref-notice';notice.textContent='法規提示只用來協助查找，不代表系統已認定適用或違規。行為日期、施行日期、地方公告及特別規定仍須分開確認。';panel.append(notice);
  if(lib.localNotice){const local=document.createElement('div');local.className='law-ref-local-note';local.textContent=lib.localNotice;panel.append(local);}
  const tabs=document.createElement('div');tabs.className='law-ref-tabs';
  const quickBtn=document.createElement('button');quickBtn.type='button';quickBtn.textContent='法規速查';
  const fullBtn=document.createElement('button');fullBtn.type='button';fullBtn.textContent='完整法規';
  tabs.append(quickBtn,fullBtn);panel.append(tabs);
  const toolbar=document.createElement('div');toolbar.className='law-ref-toolbar';toolbar.hidden=true;
  const search=document.createElement('input');search.type='search';search.placeholder='搜尋條號或關鍵字，例如：32、異味、排放管道';search.setAttribute('aria-label','搜尋法規全文');
  const relatedOnly=document.createElement('label');relatedOnly.className='law-ref-related-toggle';const cb=document.createElement('input');cb.type='checkbox';relatedOnly.append(cb,document.createTextNode(' 只顯示與目前案件相關'));
  toolbar.append(search,relatedOnly);panel.append(toolbar);
  const content=document.createElement('div');content.className='law-ref-content';panel.append(content);
  function renderQuick(){
    quickBtn.classList.add('active');fullBtn.classList.remove('active');toolbar.hidden=true;content.replaceChildren();
    for(const entry of lib.entries){
      const d=document.createElement('details');d.className='law-ref-entry';d.open=related.has(entry.id)||(moduleId==='air'&&['air-act','air-behavior-guideline'].includes(entry.id));
      const s=document.createElement('summary');s.innerHTML=`<strong>${esc(entry.name)}</strong><span>${esc(fmtDate(fullEntry(entry)?.amended||entry.amended||''))}</span>`;d.append(s);
      const body=document.createElement('div');body.className='law-ref-body';
      const rel=renderRelatedBox(entry,related.get(entry.id));if(rel)body.append(rel);
      if(entry.notes){const p=document.createElement('p');p.textContent=entry.notes;body.append(p);}
      for(const art of entry.articles||[]){const card=document.createElement('div');card.className='law-ref-article';card.innerHTML=`<strong>${esc(art.label)}</strong><div>${esc(art.summary)}</div>`;body.append(card);}
      const a=document.createElement('a');a.href=entry.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.className='law-ref-link';a.textContent='查看全國法規資料庫官方最新版（需網路）';body.append(a);
      const meta=document.createElement('div');meta.className='law-ref-meta';meta.textContent=`官方來源：${entry.sourceName}｜本機核對：${entry.verifiedAt}`;body.append(meta);
      d.append(body);content.append(d);
    }
  }
  function renderFull(){
    fullBtn.classList.add('active');quickBtn.classList.remove('active');toolbar.hidden=false;content.replaceChildren();const q=search.value.trim();const only=cb.checked;
    const chosen=lib.entries.filter(e=>!only||related.has(e.id));
    if(only&&!chosen.length){const empty=document.createElement('div');empty.className='law-ref-empty';empty.textContent='目前案件尚沒有法規研判指向特定法規；可取消篩選查看全部法規。';content.append(empty);return;}
    for(const entry of chosen){
      const full=fullEntry(entry);const d=document.createElement('details');d.className='law-ref-entry law-ref-full-law';d.open=!!q||related.has(entry.id);
      const s=document.createElement('summary');s.innerHTML=`<strong>${esc(entry.name)}</strong><span>${esc(fmtDate(fullEntry(entry)?.amended||entry.amended||''))}</span>`;d.append(s);
      const body=document.createElement('div');body.className='law-ref-body';const rel=renderRelatedBox(entry,related.get(entry.id));if(rel)body.append(rel);
      const records=articleRecords(full);
      if(records.length){
        if(full?.foreword){const fw=document.createElement('div');fw.className='law-ref-foreword';fw.innerHTML='<strong>序文／前言</strong>';const fwt=document.createElement('div');fwt.className='law-ref-full-text';fwt.textContent=full.foreword;fw.append(fwt);body.append(fw);}
        const refs=only?(related.get(entry.id)?.articleRefs||[]):[];
        if(only&&related.has(entry.id)&&!refs.length){const n=document.createElement('div');n.className='law-ref-related-scope-note';n.textContent='目前只能確認到法規層級的關聯，尚無足夠事實縮小到特定條文；因此顯示本法全部條文。';body.append(n);}
        const count=renderArticleList(body,records,q,refs,entry.id);
        if(!count){const n=document.createElement('div');n.className='law-ref-empty';n.textContent='這部法規沒有符合搜尋條件的條文。';body.append(n);}
        if(Array.isArray(full.attachments)&&full.attachments.length){
          const att=document.createElement('div');att.className='law-ref-attachment-note';att.innerHTML='<strong>附件／附表</strong>';
          const list=document.createElement('ul');
          for(const item of full.attachments){const li=document.createElement('li');const a=document.createElement('a');a.textContent=item.name||'附件';a.href=item.localPath||item.sourceUrl||'#';if(!item.localPath){a.target='_blank';a.rel='noopener noreferrer';a.textContent+='（需網路）';}else a.textContent+='（離線）';li.append(a);list.append(li);}att.append(list);body.append(att);
        }else if(full.attachmentNote){const att=document.createElement('div');att.className='law-ref-attachment-note';att.textContent=full.attachmentNote+' 本測試包尚未有可離線開啟的附件檔。';body.append(att);}
      }else{
        const pending=document.createElement('div');pending.className='law-ref-fulltext-pending';
        pending.innerHTML='<strong>此版本未內建這部法規的完整快照</strong><p>來源政策已鎖定全國法規資料庫；本系統不會用第三方鏡像或摘要冒充法規全文。</p><p>請改用更新版稽查助手；法規資料由系統發布版本統一更新，不要求使用者自行下載或匯入。</p>';
        body.append(pending);
      }
      if(full?.sourceUpdateDate||full?.downloadedAt){const meta=document.createElement('div');meta.className='law-ref-meta';meta.textContent=`官方資料更新：${full.sourceUpdateDate||'未提供'}｜本機快照：${full.downloadedAt||'未提供'}`;body.append(meta);}
      const a=document.createElement('a');a.href=entry.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.className='law-ref-link';a.textContent='查看全國法規資料庫官方最新版（需網路）';body.append(a);
      d.append(body);content.append(d);
    }
  }
  quickBtn.onclick=renderQuick;fullBtn.onclick=renderFull;search.addEventListener('input',renderFull);cb.addEventListener('change',renderFull);
  overlay.append(panel);document.body.append(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',function handler(e){if(e.key==='Escape'&&overlay){close();document.removeEventListener('keydown',handler);}});
  renderQuick();x.focus();
}
root.LawReferenceUI={open,close};
})(window);
