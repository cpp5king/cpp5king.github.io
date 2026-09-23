const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');

class FakeNode {
  constructor(tag=''){
    this.tagName=tag?tag.toUpperCase():''; this.children=[]; this.parentElement=null; this.attributes={}; this.listeners={};
    this.hidden=false; this.className=''; this.textContent=''; this.value=''; this.type=''; this.id=''; this.autocomplete=''; this.rows=0;
    this.options=[];
  }
  append(...nodes){for(const node of nodes){if(node==null)continue;const n=typeof node==='string'?new FakeText(node):node;n.parentElement=this;this.children.push(n);if(this.tagName==='SELECT'&&n.tagName==='OPTION')this.options.push(n);}}
  setAttribute(k,v){this.attributes[k]=String(v);} getAttribute(k){return this.attributes[k]??null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);} dispatch(type,target=this,extra={}){const ev={type,target,...extra};for(const fn of this.listeners[type]||[])fn(ev);}
  querySelector(sel){const tags=sel.split(',').map(s=>s.trim().toUpperCase());const stack=[...this.children];while(stack.length){const n=stack.shift();if(tags.includes(n.tagName))return n;stack.unshift(...(n.children||[]));}return null;}
  closest(sel){if(sel!=='.sentence-slot')return null;let n=this;while(n){if((n.className||'').split(/\s+/).includes('sentence-slot'))return n;n=n.parentElement;}return null;}
  focus(){document.activeElement=this;} scrollIntoView(){}
}
class FakeText extends FakeNode{constructor(text){super('');this.textContent=text;}}
const document={documentElement:{clientWidth:390},activeElement:null,createElement(tag){return new FakeNode(tag);},createTextNode(text){return new FakeText(text);}};
const window={document,innerWidth:390};window.window=window;window.globalThis=window;
window.DraftEngine={normalize(_template,input){return {...input};},matches(cond,facts){if(!cond)return true;if(cond.field)return facts?.[cond.field]===cond.value;return true;}};
const ctx=vm.createContext({window,document,globalThis:window,console});
function run(file){vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});}
const root=path.join(__dirname,'..');
run(path.join(root,'src/ui-profile.js'));run(path.join(root,'src/field-renderer.js'));

const template={id:'mobile-measurement-visibility',mobileFocusMode:true,fields:[
  {id:'earlier',label:'前一步',type:'text'},
  {id:'noiseWind',label:'風速',type:'text',inputMode:'decimal',mobileKeepVisible:true},
  {id:'noiseValueFull',label:'全頻',type:'text',inputMode:'decimal',mobileKeepVisible:true},
  {id:'noiseBgFullMode',label:'背景音處理',type:'select',allowCustom:false,mobileKeepVisible:true,options:[{id:'measured',label:'已量測'}]},
  {id:'noiseBgFull',label:'背景音',type:'text',inputMode:'decimal',mobileKeepVisible:true},
  {id:'after',label:'後續一般欄位',type:'text'}
]};
const renderer=window.FieldRenderer.render(template,()=>{});const container=renderer.element;
function findById(node,id){if(node.id===id)return node;for(const c of node.children||[]){const r=findById(c,id);if(r)return r;}return null;}
const ctl=id=>findById(container,id);const slot=id=>ctl(id).closest('.sentence-slot');

// 先完成一般欄位：一般完成題仍應折疊。
document.activeElement=ctl('earlier');ctl('earlier').value='done';container.dispatch('input',ctl('earlier'));
document.activeElement=ctl('noiseWind');ctl('noiseWind').value='2.3';container.dispatch('input',ctl('noiseWind'));
assert.equal(slot('earlier').getAttribute('data-ui-hidden'),'yes','一般已完成步驟仍折疊');
assert.equal(slot('noiseWind').getAttribute('data-ui-hidden'),'no','風速輸入時保持可見');

// 從風速移到全頻並輸入：風速已完成但必須持續顯示。
document.activeElement=ctl('noiseValueFull');ctl('noiseValueFull').value='6';container.dispatch('input',ctl('noiseValueFull'));
assert.equal(slot('noiseWind').getAttribute('data-ui-hidden'),'no','輸入全頻時風速不得消失');
assert.equal(slot('noiseWind').getAttribute('data-ui-completed'),'yes','風速可標記完成但仍可見');
for(const v of ['65','65.3']){ctl('noiseValueFull').value=v;container.dispatch('input',ctl('noiseValueFull'));}
assert.equal(slot('noiseValueFull').getAttribute('data-ui-hidden'),'no','全頻編輯中保持可見');

// 進入背景音處理與背景音輸入後，前面的量測數值仍應留在畫面。
document.activeElement=ctl('noiseBgFullMode');ctl('noiseBgFullMode').value='measured';container.dispatch('change',ctl('noiseBgFullMode'));
assert.equal(slot('noiseWind').getAttribute('data-ui-hidden'),'no');
assert.equal(slot('noiseValueFull').getAttribute('data-ui-hidden'),'no');
assert.equal(slot('noiseBgFullMode').getAttribute('data-ui-hidden'),'no');
document.activeElement=ctl('noiseBgFull');ctl('noiseBgFull').value='47.8';container.dispatch('input',ctl('noiseBgFull'));
assert.equal(slot('noiseWind').getAttribute('data-ui-hidden'),'no');
assert.equal(slot('noiseValueFull').getAttribute('data-ui-hidden'),'no');
assert.equal(slot('noiseBgFullMode').getAttribute('data-ui-hidden'),'no');
assert.equal(slot('noiseBgFull').getAttribute('data-ui-hidden'),'no');

// 實際 noise template 必須對量測數值與背景音處理標記保留顯示。
const noiseTemplate=fs.readFileSync(path.join(root,'data/templates/noise-main.js'),'utf8');
for(const id of ['noiseWind','noiseValueFull','noiseValueLeq','noiseValueLmax','noiseValueLow','noiseBgFullMode','noiseBgFull','noiseBgLmaxMode','noiseBgLmax','noiseBgLowMode','noiseBgLow']){
  const re=new RegExp(`(?:field|select)\\('${id}'[\\s\\S]{0,420}?mobileKeepVisible:true`);
  assert(re.test(noiseTemplate),`${id} is mobileKeepVisible`);
}
console.log('RESULT mobile measurement visibility 22/22 passed');
