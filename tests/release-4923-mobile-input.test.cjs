const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');

class FakeNode {
  constructor(tag=''){
    this.tagName=tag?tag.toUpperCase():''; this.children=[]; this.parentElement=null; this.attributes={}; this.listeners={};
    this.hidden=false; this.className=''; this.textContent=''; this.value=''; this.type=''; this.id=''; this.autocomplete=''; this.rows=0;
    this.options=[];
  }
  append(...nodes){ for(const node of nodes){ if(node==null)continue; const n=typeof node==='string'?new FakeText(node):node; n.parentElement=this; this.children.push(n); if(this.tagName==='SELECT'&&n.tagName==='OPTION')this.options.push(n);} }
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type,target=this,extra={}){const ev={type,target,...extra}; for(const fn of this.listeners[type]||[])fn(ev);}
  querySelector(sel){
    const tags=sel.split(',').map(s=>s.trim().toUpperCase());
    const stack=[...this.children];
    while(stack.length){const n=stack.shift(); if(tags.includes(n.tagName))return n; stack.unshift(...(n.children||[]));}
    return null;
  }
  closest(sel){ if(sel!=='.sentence-slot')return null; let n=this; while(n){ if((n.className||'').split(/\s+/).includes('sentence-slot'))return n; n=n.parentElement;} return null; }
  focus(){ document.activeElement=this; }
  scrollIntoView(){}
}
class FakeText extends FakeNode { constructor(text){super(''); this.textContent=text;} }
const document={
  documentElement:{clientWidth:390}, activeElement:null,
  createElement(tag){return new FakeNode(tag);}, createTextNode(text){return new FakeText(text);}
};
const window={document,innerWidth:390};
window.window=window; window.globalThis=window;
window.DraftEngine={
  normalize(_template,input){return {...input};},
  matches(cond,facts){ if(!cond)return true; if(cond.field)return facts?.[cond.field]===cond.value; return true; }
};
const ctx=vm.createContext({window,document,globalThis:window,console});
function run(file){vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});}
const root=path.join(__dirname,'..');
run(path.join(root,'src/ui-profile.js'));
run(path.join(root,'src/field-renderer.js'));

const template={
  id:'mobile-edit-test', mobileFocusMode:true,
  fields:[
    {id:'noiseValueFull',label:'全頻量測值',type:'text',inputMode:'decimal'},
    {id:'noiseBgFull',label:'全頻背景音量',type:'text',inputMode:'decimal'}
  ]
};
let latest={};
const renderer=window.FieldRenderer.render(template,f=>{latest={...f};});
const container=renderer.element;
const first=renderer.element.children.find?.(()=>false); // no-op to keep structure generic
function findById(node,id){if(node.id===id)return node; for(const c of node.children||[]){const r=findById(c,id); if(r)return r;} return null;}
function slotFor(control){return control.closest('.sentence-slot');}
const full=findById(container,'noiseValueFull');
const bg=findById(container,'noiseBgFull');
assert(full&&bg,'controls exist');
const fullSlot=slotFor(full), bgSlot=slotFor(bg);
assert.equal(fullSlot.getAttribute('data-ui-current'),'yes');

// 開始編輯全頻欄位。
document.activeElement=full;
container.dispatch('focusin',full);
for(const v of ['6','65','65.3']){
  full.value=v;
  container.dispatch('input',full);
  assert.equal(renderer.read().noiseValueFull,v,`value ${v} preserved`);
  assert.equal(fullSlot.getAttribute('data-ui-hidden'),'no',`full stays visible while typing ${v}`);
  assert.equal(fullSlot.getAttribute('data-ui-current'),'yes',`full stays current while typing ${v}`);
  assert.equal(fullSlot.getAttribute('data-ui-completed'),'no',`full not folded while typing ${v}`);
}
assert.equal(latest.noiseValueFull,'65.3');

// 焦點離開後，才允許把已完成欄位折疊並把下一題設為 current。
document.activeElement=bg;
container.dispatch('focusout',full,{relatedTarget:bg});
container.dispatch('focusin',bg);
// 下一個欄位開始輸入時，上一個已完成欄位才可折疊；目前編輯欄仍保持可見。
bg.value='4'; container.dispatch('input',bg);
assert.equal(fullSlot.getAttribute('data-ui-hidden'),'yes');
assert.equal(fullSlot.getAttribute('data-ui-completed'),'yes');
assert.equal(bgSlot.getAttribute('data-ui-hidden'),'no');
assert.equal(bgSlot.getAttribute('data-ui-current'),'yes');
bg.value='47.8'; container.dispatch('input',bg);
assert.equal(renderer.read().noiseBgFull,'47.8');
assert.equal(bgSlot.getAttribute('data-ui-hidden'),'no');

console.log('RESULT mobile editing protection 15/15 passed');
