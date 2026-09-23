(function(root){
'use strict';
let overlay=null;
const label={supported:'已有事實支持',needs:'要件待確認',opposed:'有相反事實／需再判斷',reference:'相關查核方向'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;return n;}
function close(){overlay?.remove();overlay=null;}
function list(title,items,cls=''){
  if(!items?.length)return null;const d=el('div','',`air-rule-list ${cls}`.trim());d.append(el('strong',title));const ul=el('ul');for(const x of items)ul.append(el('li',x));d.append(ul);return d;
}
function open(arg={}){
  close();
  const result=root.AIR_RULE_PACK?.assess?.(arg);if(!result){window.alert?.('空氣污染法規研判資料尚未載入。');return;}
  overlay=el('div','', 'air-rule-overlay');const panel=el('section','', 'air-rule-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  const head=el('div','', 'air-rule-head');const left=el('div');left.append(el('h2','空污法規研判'),el('p',result.notice,'air-rule-muted'));const x=el('button','關閉','secondary');x.type='button';x.onclick=close;head.append(left,x);panel.append(head);
  if(!result.directions.length)panel.append(el('div','目前輸入事實尚不足以產生特定法規方向；仍可直接使用「法規」按鈕查閱法規。','air-rule-empty'));
  for(const d of result.directions){const card=el('article','',`air-rule-card ${d.status}`);const top=el('div','', 'air-rule-card-head');top.append(el('h3',d.title),el('span',label[d.status]||d.status,`air-rule-status ${d.status}`));card.append(top,el('div',`依據：${(d.basis||[]).join('、')}`,'air-rule-basis'));for(const block of [list('已有事實',d.facts,'facts'),list('相反／限制事實',d.opposing,'opposing'),list('仍待確認',d.missing,'missing'),list('建議下一步',d.nextChecks,'next')])if(block)card.append(block);panel.append(card);}
  const foot=el('div',`規則包：${result.packVersion}`,'air-rule-foot');panel.append(foot);overlay.append(panel);document.body.append(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});x.focus();
}
root.AirRuleUI={open,close};
})(window);
