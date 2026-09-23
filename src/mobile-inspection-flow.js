(function(root){
'use strict';
const MAX_WIDTH=760;
const stepState=new Map();
let scheduled=false;

function isMobile(){
  return !!root.matchMedia?.(`(max-width:${MAX_WIDTH}px)`)?.matches;
}
function textOf(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim();}
function cleanTitle(value){
  return String(value||'').replace(/^\s*(?:\d+[A-Z]?|[A-Z])\s*[｜|]\s*/,'').trim();
}
function findGlobalHomeButton(){
  return [...document.querySelectorAll('#app > nav.actions button')].find(b=>textOf(b)==='首頁／案件大類')||null;
}
function clickExistingAction(label){
  const selectors=['.module-sticky-actions button','.air-sticky button'];
  const buttons=[...document.querySelectorAll(selectors.join(','))];
  const button=buttons.find(b=>textOf(b)===label);
  button?.click();
}
function moduleInfo(host){
  if(host.classList.contains('water-v2-host')){
    const title=textOf(host.querySelector('.section-title h2'))||textOf(host.querySelector('.hero h2'))||'水污染';
    const wizard=/污染排查|對象查核/.test(title);
    const steps=wizard?[...host.children].filter(x=>x.matches?.('section.card')):[];
    return {module:'water',moduleTitle:'水污染',viewTitle:title,steps,accent:'水污染'};
  }
  if(host.classList.contains('waste-v1-host')){
    const title=textOf(host.querySelector('.section-title h2'))||textOf(host.querySelector('.hero h2'))||'廢棄物';
    const wizard=/來源待查|稽查對象已知/.test(title);
    const steps=wizard?[...host.children].filter(x=>x.matches?.('section.card')):[];
    return {module:'waste',moduleTitle:'廢棄物',viewTitle:title,steps,accent:'廢棄物'};
  }
  if(host.classList.contains('air-v1-host')){
    const rootEl=host.querySelector('.air-v1');
    const title=textOf(rootEl?.querySelector('.air-hero h2'))||'空氣污染';
    const steps=rootEl?[...rootEl.children].filter(x=>x.matches?.('.air-section')&&!x.classList.contains('air-summary')):[];
    return {module:'air',moduleTitle:'空氣污染',viewTitle:title,steps,accent:'空氣污染'};
  }
  return null;
}
function stepTitle(step,index){
  const h=step.querySelector?.('h3,h2,h4');
  return cleanTitle(textOf(h))||`步驟 ${index+1}`;
}
function stepHelp(step){
  const p=step.querySelector?.(':scope > p, .muted, .air-muted');
  return textOf(p);
}
function makeButton(label,className,action){
  const b=document.createElement('button');
  b.type='button';b.textContent=label;if(className)b.className=className;
  b.addEventListener('click',action);return b;
}
function makeHeader(info,hasSteps){
  const header=document.createElement('header');header.className='ia-mobile-flow-header';
  const top=document.createElement('div');top.className='ia-mobile-flow-top';
  const home=makeButton('首頁','ia-mobile-home',()=>findGlobalHomeButton()?.click());
  const brand=document.createElement('div');brand.className='ia-mobile-flow-brand';
  brand.innerHTML=`<strong>${info.moduleTitle}</strong><span>${cleanTitle(info.viewTitle)||info.moduleTitle}</span>`;
  top.append(home,brand);header.append(top);
  if(hasSteps){
    const progress=document.createElement('div');progress.className='ia-mobile-flow-progress';
    progress.innerHTML='<span class="ia-mobile-flow-progress-text"></span><div class="ia-mobile-flow-track"></div>';
    const heading=document.createElement('div');heading.className='ia-mobile-flow-heading';
    heading.innerHTML='<span class="ia-mobile-flow-step-icon"></span><div><h2 class="ia-mobile-flow-step-title"></h2><p class="ia-mobile-flow-step-help"></p></div>';
    header.append(progress,heading);
  }
  const tools=document.createElement('div');tools.className='ia-mobile-flow-tools';
  tools.append(
    makeButton('法規研判','ia-mobile-tool',()=>clickExistingAction('法規研判')),
    makeButton('整理目前內容','ia-mobile-tool',()=>clickExistingAction('整理目前內容'))
  );
  header.append(tools);
  return header;
}
function makeNav(){
  const nav=document.createElement('nav');nav.className='ia-mobile-flow-nav';nav.setAttribute('aria-label','手機查核步驟');
  const prev=makeButton('上一步','secondary',()=>{});
  const next=makeButton('下一步','',()=>{});
  nav.append(prev,next);return {nav,prev,next};
}
function renderStep(host,info,header,content,navParts,key){
  const steps=info.steps;
  let index=Math.min(Math.max(Number(stepState.get(key)||0),0),Math.max(0,steps.length-1));
  const update=()=>{
    index=Math.min(Math.max(index,0),Math.max(0,steps.length-1));
    stepState.set(key,index);
    steps.forEach((step,i)=>{step.hidden=i!==index;step.dataset.mobileFlowStep=String(i);});
    const title=stepTitle(steps[index],index),help=stepHelp(steps[index]);
    header.querySelector('.ia-mobile-flow-progress-text').textContent=`第 ${index+1} / ${steps.length} 步`;
    const track=header.querySelector('.ia-mobile-flow-track');track.replaceChildren();
    for(let i=0;i<steps.length;i++){const seg=document.createElement('span');seg.className='ia-mobile-flow-segment';seg.dataset.state=i<=index?'active':'pending';track.append(seg);}
    header.querySelector('.ia-mobile-flow-step-icon').textContent=String(index+1);
    header.querySelector('.ia-mobile-flow-step-title').textContent=title;
    const helpNode=header.querySelector('.ia-mobile-flow-step-help');helpNode.textContent=help;helpNode.hidden=!help;
    navParts.prev.disabled=index===0;
    navParts.next.textContent=index===steps.length-1?'整理目前內容':'下一步';
    content.scrollTop=0;
  };
  navParts.prev.onclick=()=>{if(index>0){index--;update();}};
  navParts.next.onclick=()=>{if(index<steps.length-1){index++;update();}else clickExistingAction('整理目前內容');};
  update();
}
function enhance(host){
  if(!isMobile()||host.classList.contains('ia-mobile-flow-shell'))return;
  const info=moduleInfo(host);if(!info)return;
  const originals=[...host.childNodes];
  if(!originals.length)return;
  const hasSteps=info.steps.length>1;
  const header=makeHeader(info,hasSteps);
  const content=document.createElement('div');content.className='ia-mobile-flow-content';
  originals.forEach(node=>content.append(node));
  host.classList.add('ia-mobile-flow-shell');
  host.dataset.mobileFlow='yes';
  host.dataset.flowMode=hasSteps?'wizard':'menu';
  host.dataset.flowModule=info.module;
  if(hasSteps){
    const navParts=makeNav();
    host.replaceChildren(header,content,navParts.nav);
    const key=`${info.module}|${info.viewTitle}`;
    renderStep(host,info,header,content,navParts,key);
  }else{
    host.replaceChildren(header,content);
  }
}
function run(){
  scheduled=false;
  if(!isMobile())return;
  document.querySelectorAll('.water-v2-host,.waste-v1-host,.air-v1-host').forEach(enhance);
}
function schedule(){
  if(scheduled)return;scheduled=true;
  root.requestAnimationFrame?root.requestAnimationFrame(run):setTimeout(run,0);
}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true});
root.addEventListener?.('resize',schedule);
root.addEventListener?.('orientationchange',schedule);
schedule();
root.MobileInspectionFlow=Object.freeze({refresh:schedule});
})(window);
