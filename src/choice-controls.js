(function(root){
  'use strict';
  // A value-based single-choice control. Native buttons provide Enter/Space;
  // arrow keys follow the radiogroup pattern. No hidden select is involved.
  function single({id,label,options,onChange}){
    const group=document.createElement('div');group.id=id;group.className='single-choice';
    group.setAttribute('role','radiogroup');group.setAttribute('aria-label',label);
    let value='';const buttons=[];
    function sync(){
      const available=buttons.filter(b=>!b.disabled&&!b.hidden);
      const focus=available.find(b=>b.value===value)||available[0];
      for(const b of buttons){b.setAttribute('aria-checked',String(b.value===value));b.tabIndex=b===focus?0:-1;}
    }
    function choose(button){if(button.disabled||button.hidden)return;value=button.value;sync();onChange();}
    for(const option of options){
      const b=document.createElement('button');b.type='button';b.className='choice-card';b.value=option.id;b.textContent=option.label;
      b.disabled=!!option.disabled;b.hidden=!!option.hidden;
      b.setAttribute('role','radio');
      b.addEventListener('click',()=>choose(b));
      b.addEventListener('keydown',event=>{
        const list=buttons.filter(item=>!item.disabled&&!item.hidden),index=list.indexOf(b);
        const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
        if(direction || event.key==='Home'||event.key==='End'){
          event.preventDefault();const next=event.key==='Home'?list[0]:event.key==='End'?list[list.length-1]:list[(index+direction+list.length)%list.length];
          if(next){choose(next);next.focus();}
        }
      });
      group.append(b);buttons.push(b);
    }
    Object.defineProperty(group,'value',{get:()=>value,set:next=>{value=options.some(o=>o.id===next)?next:'';sync();}});
    Object.defineProperty(group,'options',{get:()=>buttons});
    sync();return {element:group,refresh:sync};
  }
  root.ChoiceControls={single};
})(window);
