(function(root){
  'use strict';
  const old=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case');
  const fields=JSON.parse(JSON.stringify(old.fields.filter(f=>['noiseType','hasCommittee'].includes(f.id))));
  for(const f of fields){delete f.showWhen;delete f.displayWhen;}
  const t={id:'noise-neighbor',categoryId:'noise',caseTypeId:'noise-case',title:window.NOISE_TEXTS.main.text013,formTitle:window.NOISE_TEXTS.main.text013,version:'3.7.1',workflow:'noiseNeighbor',choiceStyle:'cards',
    relatedTemplates:[{id:'noise-main',label:window.NOISE_TEXTS.neighbor.text001}],
    fields:[...fields,...['neighborRecord','neighborReply','neighborBlocked','neighborValidation'].map(id=>({id,label:id,type:'computed',missing:window.NOISE_TEXTS.common.missing}))],
    initialGate:true,validateOnSubmit:true,workflowStatus:'neighborValidation',validationMessageField:'neighborValidation',previewOnlyWhen:{field:'neighborBlocked',value:'yes'},previewOnlyMessage:window.NOISE_TEXTS.neighbor.text002,
    record:['{{neighborRecord}}'],reply:['{{neighborReply}}']};
  function validate(input){const errors=[];const spec=fields.find(f=>f.id==='noiseType');if(!spec.options.some(o=>o.id===input.noiseType)&&!(input.noiseType==='custom'&&String(input.noiseTypeCustom||'').trim()))errors.push(window.NOISE_TEXTS.neighbor.text003);if(!['yes','no'].includes(input.hasCommittee))errors.push(window.NOISE_TEXTS.neighbor.text004);return errors;}
  root.TemplateWorkflows.noiseNeighbor={validate,prepare(input){const errors=validate(input);const result=errors.length?{record:'',reply:''}:root.DraftEngine.generate(root.INSPECTION_CONFIG,'noise-case',{...input,scenario:'neighbor'});return {...input,neighborBlocked:errors.length?'yes':'no',neighborValidation:errors[0]||'',neighborRecord:result.record,neighborReply:result.reply};},clearDraft:()=>true};
  root.INSPECTION_CONFIG.templates.push(t);
})(window);
