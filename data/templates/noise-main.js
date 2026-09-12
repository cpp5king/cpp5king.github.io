(function(root){
  'use strict';
  const legacy=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case');
  const clone=x=>JSON.parse(JSON.stringify(x));
  const when=(field,value='yes')=>({field,value});
  const computed=id=>({id,label:id,type:'computed',missing:window.NOISE_TEXTS.common.missing});
  const field=(id,label,type,extra={})=>({id,label,type,missing:window.NOISE_TEXTS.common.missing,...extra});
  const select=(id,label,options,extra={})=>field(id,label,'select',{allowCustom:false,options:options.map(([id,label])=>({id,label,value:label})),...extra});
  const yn=[['yes',window.NOISE_TEXTS.templates.text068],['no',window.NOISE_TEXTS.templates.text069]];
  const checks=root.NOISE_ARTICLE8_RULES.acts.flatMap(a=>[...(a.exceptionChecks||[]),...(a.exceptions||[]).flatMap(e=>e.checks||[])]).map(c=>c.id);
  const flags=['mainShowDuration','mainRoute','mainBlocked','mainGuide','mainValidation','mainShowCore','mainShowZone','mainShowHoliday','mainShowActs','mainShowArticle9Scope','mainShowMeasure','mainShowType','mainShowFacts','mainShowSource','mainUnmeasured','mainOtherReason','mainRecord','mainReply'];
  const internal=legacy.fields.filter(f=>f.type==='computed').map(f=>{
    const copy=clone(f);
    if(copy.showWhen)copy.displayWhen=copy.showWhen;
    delete copy.showWhen;
    return copy;
  });
  const aliases=['scenario','date','article8Time','article8Zone','article8Holiday','prohibitedAct','a9Date','a9Time','a9Zone','a9Exit','measurementAttempts','backgroundMeasurements','backgroundRound','backgroundLocked','backgroundRepeated'].map(computed);
  const controls=legacy.fields.filter(f=>f.type!=='computed'&&(checks.includes(f.id)||['article8Exception','equipment','article8Operation','article8FactInput','subject'].includes(f.id)||f.id.startsWith('a9'))&&!aliases.some(a=>a.id===f.id)).map(clone);
  const neighborControls=legacy.fields.filter(f=>['noiseType','hasCommittee'].includes(f.id)).map(clone);
  for(const f of neighborControls){delete f.showWhen;delete f.displayWhen;f.showWhen=when('mainRoute','article6');}
  for(const f of controls){
    delete f.displayWhen;
    if(f.id==='subject')f.showWhen=when('a8Established');
    if(f.id==='a9Type')f.showWhen=when('mainShowType');
    if(['a9Subject','a9Source'].includes(f.id))f.showWhen=when('mainShowFacts');
    if(f.id==='a9Source')f.showWhen=when('mainShowSource');
    if(['subject','a9Subject'].includes(f.id))f.label=root.NOISE_TEXTS.ui.subject;
    if(f.id==='article8FactInput'){f.optional=true;f.label=root.NOISE_TEXTS.ui.factSupplement;f.showWhen=when('a8Established');}
    if(['equipment','article8Operation'].includes(f.id)||f.id.startsWith('a9Value_')||f.id==='a9Unavailable'||root.NOISE_ARTICLE8_RULES.acts.some(a=>(a.exceptions||[]).some(e=>(e.checks||[]).some(c=>c.id===f.id)))){
      f.optional=true;f.label+=root.NOISE_TEXTS.ui.optional;
    }
    if(['a9Home','a9WindSpeed'].includes(f.id)||f.id.startsWith('a9Value_'))f.lockWhen=when('backgroundLocked');
    if(f.type==='number'){f.inputType='text';f.inputMode='decimal';}
  }
  const take=ids=>controls.filter(f=>ids.includes(f.id));
  const reasons=[
    {id:'locked',label:window.NOISE_TEXTS.main.text001,phrase:window.NOISE_TEXTS.main.text002,types:['factory','entertainment','business','speaker','other']},
    {id:'notWorking',label:window.NOISE_TEXTS.main.text003,phrase:window.NOISE_TEXTS.main.text004,types:['factory']},
    {id:'notOpen',label:window.NOISE_TEXTS.main.text005,phrase:window.NOISE_TEXTS.main.text006,types:['entertainment','business']},
    {id:'notBuilding',label:window.NOISE_TEXTS.main.text007,phrase:window.NOISE_TEXTS.main.text008,types:['construction']},
    {id:'source',label:window.NOISE_TEXTS.main.text009,types:['factory','entertainment','business','speaker','other']},
    {id:'other',label:window.NOISE_TEXTS.templates.text078}
  ];
  const main={id:'noise-main',categoryId:'noise',caseTypeId:'noise-case',title:window.NOISE_TEXTS.main.text010,version:'3.7.1',moduleVersion:'4.9.1',workflow:'noiseMain',choiceStyle:'cards',
    formTitle:window.NOISE_TEXTS.main.text011,instructions:window.NOISE_TEXTS.main.text012,workflowStatus:'mainGuide',
    scope:{excludedActIds:['exhaust']},
    validationMessageField:'mainValidation',
    initialGate:true,
    validateOnSubmit:true,
    persistedKeys:['a9Exit','measurementAttempts','backgroundMeasurements','backgroundRound','backgroundLocked'],
    fields:[...flags.map(computed),...aliases,...internal.filter(f=>!f.display),
      select('mainContinuity',window.NOISE_TEXTS.main.routingQuestion,[['article6',window.NOISE_TEXTS.main.routingArticle6],['measurable',window.NOISE_TEXTS.main.routingMeasurable]]),
      select('mainSpecial',window.NOISE_TEXTS.main.specialQuestion,[['ordinary',window.NOISE_TEXTS.main.specialOrdinary],['traffic',window.NOISE_TEXTS.main.specialTraffic],['aviation',window.NOISE_TEXTS.main.specialAviation],['military',window.NOISE_TEXTS.main.specialMilitary]],{showWhen:when('mainContinuity','measurable')}),
      ...neighborControls,
      field('mainDate',window.NOISE_TEXTS.templates.text022,'date',{format:'roc',showWhen:when('mainShowCore')}),field('mainTime',window.NOISE_TEXTS.templates.text125,'time',{timePicker:root.NOISE_TEXTS.ui.timePicker,showWhen:when('mainShowCore')}),
      select('mainZone',window.NOISE_TEXTS.main.text014,root.NOISE_ARTICLE8_RULES.zones.map(z=>[z.id,z.label]),{showWhen:when('mainShowZone')}),
      select('mainHoliday',window.NOISE_TEXTS.main.text015,yn,{showWhen:when('mainShowHoliday')}),
      select('mainAct',window.NOISE_TEXTS.templates.text112,[],{showWhen:when('mainShowActs')}),
      ...take(['article8Exception',...checks,'equipment','article8Operation','article8FactInput','subject']),
      select('mainArticle9Scope',window.NOISE_TEXTS.main.article9ScopeQuestion,[['yes',window.NOISE_TEXTS.main.article9ScopeYes],['no',window.NOISE_TEXTS.main.article9ScopeNo]],{showWhen:when('mainShowArticle9Scope')}),
      select('mainMeasure',window.NOISE_TEXTS.main.text016,yn,{showWhen:when('mainShowMeasure')}),
      ...take(['a9Type','a9Facility']),
      field('mainReasons',window.NOISE_TEXTS.main.text017,'checklist',{showWhen:when('mainUnmeasured'),separator:'，',emptyValue:'',items:reasons.map(r=>({id:r.id,label:r.label,...(r.types?{when:{field:'a9Type',operator:'in',value:r.types}}:{})}))}),
      field('mainReasonOther',window.NOISE_TEXTS.main.text018,'textarea',{showWhen:when('mainOtherReason')}),
      ...take(['a9Subject','a9Source']),
      field('mainSummary',window.NOISE_TEXTS.main.text019,'computed',{display:true,displayWhen:when('mainShowFacts')}),
      ...internal.filter(f=>f.display&&['a9Period','a9Standards'].includes(f.id)),
      ...controls.filter(f=>f.id.startsWith('a9')&&!['a9Type','a9Facility','a9Subject','a9Operation','a9Source'].includes(f.id)).flatMap(f=>f.id==='a9Value_leq'?[...internal.filter(c=>c.id==='a9Duration'),f]:[f]),
      ...internal.filter(f=>f.display&&!['a9Period','a9Standards','a9Duration'].includes(f.id)),
      field('backgroundHistoryText',root.NOISE_TEXTS.ui.backgroundHistoryTitle,'computed',{display:true,displayWhen:when('mainShowMeasure')}),
      field('attemptHistoryText',root.NOISE_TEXTS.ui.historyTitle,'computed',{display:true,displayWhen:when('mainShowMeasure')})
    ],record:['{{mainRecord}}'],reply:['{{mainReply}}'],previewOnlyWhen:when('mainBlocked'),previewOnlyMessage:window.NOISE_TEXTS.main.text020,
    retryWhen:when('a9Retry'),finishWhen:when('a9Retry'),retryLabelField:'a9RetryLabel',finishLabelField:'a9FinishLabel',
    unmeasured:{
      reasons,
      prefix:window.NOISE_TEXTS.common.replyPrefix,suffix:window.NOISE_TEXTS.common.replyEnding,
      place:window.NOISE_TEXTS.main.placeRecord,
      source:window.NOISE_TEXTS.main.equipmentRecord,
      sourceFact:window.NOISE_TEXTS.main.text023,
      ending:window.NOISE_TEXTS.common.noMeasurementPatrol
    }
  };
  main.fields.find(f=>f.id==='mainAct').options=[...root.NOISE_ARTICLE8_RULES.acts.filter(a=>!main.scope.excludedActIds.includes(a.id)).map(a=>({id:a.id,label:a.label,value:a.label,when:when('a8Candidate_'+a.id)})),{id:'none',label:window.NOISE_TEXTS.main.text024,value:window.NOISE_TEXTS.main.text024}];
  // The noise workflow validates dependencies itself; visibility alone must not erase facts.
  for(const f of main.fields)if(f.showWhen&&f.type!=='computed'){f.displayWhen=f.showWhen;delete f.showWhen;}
  main.fields.find(f=>f.id==='a9Duration').displayWhen=when('mainShowDuration');
  root.INSPECTION_CONFIG.templates.push(main);
})(window);
