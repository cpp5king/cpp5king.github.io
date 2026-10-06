// 文字來源：使用者提供的噪音 V1 範本；不自動判定法規或量測結果。
window.INSPECTION_CONFIG.templates.push({
  "id": "noise-case",
  "categoryId": "noise",
  "caseTypeId": "noise-case",
  "title": window.NOISE_TEXTS.templates.text001,
  "version": "3.7.1",
  "formTitle": window.NOISE_TEXTS.templates.text001,
  "instructions": window.NOISE_TEXTS.templates.text002,
  "fields": [
    {
      "id": "scenario",
      "label": window.NOISE_TEXTS.templates.text003,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text004,
      "allowCustom": false,
      "options": [
        {
          "id": "neighbor",
          "label": window.NOISE_TEXTS.templates.text005,
          "value": window.NOISE_TEXTS.templates.text005
        },
        {
          "id": "article8",
          "label": window.NOISE_TEXTS.templates.text006,
          "value": window.NOISE_TEXTS.templates.text006
        },
        {
          "id": "article9",
          "label": window.NOISE_TEXTS.templates.text007,
          "value": window.NOISE_TEXTS.templates.text007
        },
        {
          "id": "unmeasured",
          "label": window.NOISE_TEXTS.templates.text008,
          "value": window.NOISE_TEXTS.templates.text008
        }
      ]
    },
    {
      "id": "noiseType",
      "label": window.NOISE_TEXTS.templates.text009,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text010,
      "showWhen": {
        "field": "scenario",
        "value": "neighbor"
      },
      "allowCustom": true,
      "options": [
        {
          "id": "water",
          "label": window.NOISE_TEXTS.templates.text011,
          "value": window.NOISE_TEXTS.templates.text011
        },
        {
          "id": "children",
          "label": window.NOISE_TEXTS.templates.text012,
          "value": window.NOISE_TEXTS.templates.text012
        },
        {
          "id": "fall",
          "label": window.NOISE_TEXTS.templates.text013,
          "value": window.NOISE_TEXTS.templates.text013
        },
        {
          "id": "pet",
          "label": window.NOISE_TEXTS.templates.text014,
          "value": window.NOISE_TEXTS.templates.text014
        },
        {
          "id": "furniture",
          "label": window.NOISE_TEXTS.templates.text015,
          "value": window.NOISE_TEXTS.templates.text015
        },
        {
          "id": "shouting",
          "label": window.NOISE_TEXTS.templates.text016,
          "value": window.NOISE_TEXTS.templates.text016
        }
      ],
      "customLabel": window.NOISE_TEXTS.templates.text017
    },
    {
      "id": "hasCommittee",
      "label": window.NOISE_TEXTS.templates.text018,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text019,
      "showWhen": {
        "field": "scenario",
        "value": "neighbor"
      },
      "allowCustom": false,
      "options": [
        {
          "id": "yes",
          "label": window.NOISE_TEXTS.templates.text020,
          "value": window.NOISE_TEXTS.templates.text020
        },
        {
          "id": "no",
          "label": window.NOISE_TEXTS.templates.text021,
          "value": window.NOISE_TEXTS.templates.text021
        }
      ]
    },
    {
      "id": "date",
      "label": window.NOISE_TEXTS.templates.text022,
      "type": "date",
      "missing": window.NOISE_TEXTS.templates.text023,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article8",
          "article9",
          "unmeasured"
        ]
      },
      "format": "roc"
    },
    {
      "id": "time",
      "label": window.NOISE_TEXTS.templates.text024,
      "type": "hour",
      "missing": window.NOISE_TEXTS.templates.text025,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article8",
          "article9",
          "unmeasured"
        ]
      },
      "suffix": window.NOISE_TEXTS.templates.text026
    },
    {
      "id": "subject",
      "label": window.NOISE_TEXTS.templates.text027,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text028,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article8",
          "article9",
          "unmeasured"
        ]
      }
    },
    {
      "id": "equipment",
      "label": window.NOISE_TEXTS.templates.text029,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text030,
      "showWhen": {
        "field": "scenario",
        "value": "article8"
      }
    },
    {
      "id": "operation",
      "label": window.NOISE_TEXTS.templates.text031,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text032,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article8",
          "article9",
          "unmeasured"
        ]
      }
    },
    {
      "id": "zone",
      "label": window.NOISE_TEXTS.templates.text033,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text034,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article8",
          "article9"
        ]
      }
    },
    {
      "id": "prohibitedAct",
      "label": window.NOISE_TEXTS.templates.text035,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text036,
      "showWhen": {
        "field": "scenario",
        "value": "article8"
      }
    },
    {
      "id": "legalBasis",
      "label": window.NOISE_TEXTS.templates.text037,
      "type": "textarea",
      "missing": window.NOISE_TEXTS.templates.text038,
      "showWhen": {
        "field": "scenario",
        "value": "article8"
      }
    },
    {
      "id": "noiseSource",
      "label": window.NOISE_TEXTS.templates.text039,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text040,
      "showWhen": {
        "field": "scenario",
        "operator": "in",
        "value": [
          "article9",
          "unmeasured"
        ]
      }
    },
    {
      "id": "sourceType",
      "label": window.NOISE_TEXTS.templates.text041,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text042,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      }
    },
    {
      "id": "period",
      "label": window.NOISE_TEXTS.templates.text043,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text044,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      }
    },
    {
      "id": "measurementType",
      "label": window.NOISE_TEXTS.templates.text045,
      "type": "checklist",
      "missing": window.NOISE_TEXTS.templates.text046,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "separator": "、",
      "items": [
        {
          "id": "general",
          "label": window.NOISE_TEXTS.templates.text047,
          "value": window.NOISE_TEXTS.templates.text047
        },
        {
          "id": "lowFrequency",
          "label": window.NOISE_TEXTS.templates.text048,
          "value": window.NOISE_TEXTS.templates.text048
        }
      ]
    },
    {
      "id": "measurementLocation",
      "label": window.NOISE_TEXTS.templates.text049,
      "type": "text",
      "missing": window.NOISE_TEXTS.templates.text050,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      }
    },
    {
      "id": "leq",
      "label": "Leq",
      "type": "number",
      "missing": window.NOISE_TEXTS.templates.text051,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "min": 0
    },
    {
      "id": "lmax",
      "label": "Lmax",
      "type": "number",
      "missing": window.NOISE_TEXTS.templates.text052,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "min": 0
    },
    {
      "id": "leqStandard",
      "label": window.NOISE_TEXTS.templates.text053,
      "type": "number",
      "missing": window.NOISE_TEXTS.templates.text054,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "min": 0
    },
    {
      "id": "lmaxStandard",
      "label": window.NOISE_TEXTS.templates.text055,
      "type": "number",
      "missing": window.NOISE_TEXTS.templates.text056,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "min": 0
    },
    {
      "id": "measurementResult",
      "label": window.NOISE_TEXTS.templates.text057,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text058,
      "showWhen": {
        "field": "scenario",
        "value": "article9"
      },
      "allowCustom": false,
      "options": [
        {
          "id": "compliant",
          "label": window.NOISE_TEXTS.templates.text059,
          "value": window.NOISE_TEXTS.templates.text059
        },
        {
          "id": "exceeded",
          "label": window.NOISE_TEXTS.templates.text060,
          "value": window.NOISE_TEXTS.templates.text060
        }
      ]
    },
    {
      "id": "background",
      "label": window.NOISE_TEXTS.templates.text061,
      "type": "number",
      "missing": window.NOISE_TEXTS.templates.text062,
      "showWhen": {
        "field": "measurementResult",
        "value": "exceeded"
      },
      "min": 0
    },
    {
      "id": "backgroundText",
      "label": window.NOISE_TEXTS.templates.text063,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text064,
      "showWhen": {
        "field": "measurementResult",
        "value": "exceeded"
      },
      "allowCustom": true,
      "options": [
        {
          "id": "noCorrection",
          "label": window.NOISE_TEXTS.templates.text065,
          "value": window.NOISE_TEXTS.templates.text065
        }
      ],
      "customLabel": window.NOISE_TEXTS.templates.text017
    },
    {
      "id": "explainedToComplainant",
      "label": window.NOISE_TEXTS.templates.text066,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text067,
      "showWhen": {
        "field": "measurementResult",
        "value": "compliant"
      },
      "allowCustom": false,
      "options": [
        {
          "id": "true",
          "label": window.NOISE_TEXTS.templates.text068,
          "value": window.NOISE_TEXTS.templates.text068
        },
        {
          "id": "false",
          "label": window.NOISE_TEXTS.templates.text069,
          "value": window.NOISE_TEXTS.templates.text069
        }
      ]
    },
    {
      "id": "complainantExplanation",
      "label": window.NOISE_TEXTS.templates.text070,
      "type": "fixed",
      "missing": window.NOISE_TEXTS.templates.text071,
      "showWhen": {
        "field": "explainedToComplainant",
        "value": "true"
      },
      "value": window.NOISE_TEXTS.templates.text072
    },
    {
      "id": "noMeasurementReason",
      "label": window.NOISE_TEXTS.templates.text073,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text074,
      "showWhen": {
        "field": "scenario",
        "value": "unmeasured"
      },
      "allowCustom": false,
      "options": [
        {
          "id": "inactive",
          "label": window.NOISE_TEXTS.templates.text075,
          "value": window.NOISE_TEXTS.templates.text075
        },
        {
          "id": "notFound",
          "label": window.NOISE_TEXTS.templates.text076,
          "value": window.NOISE_TEXTS.templates.text076
        },
        {
          "id": "rain",
          "label": window.NOISE_TEXTS.templates.text077,
          "value": window.NOISE_TEXTS.templates.text077
        },
        {
          "id": "other",
          "label": window.NOISE_TEXTS.templates.text078,
          "value": window.NOISE_TEXTS.templates.text078
        }
      ]
    },
    {
      "id": "inactiveWording",
      "label": window.NOISE_TEXTS.templates.text079,
      "type": "select",
      "missing": window.NOISE_TEXTS.templates.text080,
      "showWhen": {
        "field": "noMeasurementReason",
        "operator": "in",
        "value": [
          "inactive",
          "notFound"
        ]
      },
      "allowCustom": false,
      "options": [
        {
          "id": "sourceInactive",
          "label": window.NOISE_TEXTS.templates.text075,
          "value": window.NOISE_TEXTS.templates.text075
        },
        {
          "id": "amplifier",
          "label": window.NOISE_TEXTS.templates.text081,
          "value": window.NOISE_TEXTS.templates.text081
        }
      ]
    },
    {
      "id": "otherRecord",
      "label": window.NOISE_TEXTS.templates.text082,
      "type": "textarea",
      "missing": window.NOISE_TEXTS.templates.text083,
      "showWhen": {
        "field": "noMeasurementReason",
        "value": "other"
      }
    },
    {
      "id": "otherReply",
      "label": window.NOISE_TEXTS.templates.text084,
      "type": "textarea",
      "missing": window.NOISE_TEXTS.templates.text085,
      "showWhen": {
        "field": "noMeasurementReason",
        "value": "other"
      }
    }
  ],
  "record": [
    window.NOISE_TEXTS.templates.text086
  ],
  "reply": [
    window.NOISE_TEXTS.templates.text086
  ],
  "recordVariants": [
    {
      "when": {
        "field": "hasCommittee",
        "value": "yes"
      },
      "text": [
        window.NOISE_TEXTS.templates.committeeRecord
      ]
    },
    {
      "when": {
        "field": "hasCommittee",
        "value": "no"
      },
      "text": [
        window.NOISE_TEXTS.templates.policeRecord
      ]
    },
    {
      "when": {
        "field": "scenario",
        "value": "article8"
      },
      "text": [
        window.NOISE_TEXTS.templates.text089
      ]
    },
    {
      "when": {
        "field": "measurementResult",
        "value": "compliant"
      },
      "text": [
        window.NOISE_TEXTS.templates.text090
      ]
    },
    {
      "when": {
        "field": "measurementResult",
        "value": "exceeded"
      },
      "text": [
        window.NOISE_TEXTS.templates.text091
      ]
    },
    {
      "when": {
        "field": "inactiveWording",
        "value": "sourceInactive"
      },
      "text": [
        window.NOISE_TEXTS.templates.text092
      ]
    },
    {
      "when": {
        "field": "inactiveWording",
        "value": "amplifier"
      },
      "text": [
        window.NOISE_TEXTS.templates.text093
      ]
    },
    {
      "when": {
        "field": "noMeasurementReason",
        "value": "rain"
      },
      "text": [
        window.NOISE_TEXTS.templates.text094
      ]
    },
    {
      "when": {
        "field": "noMeasurementReason",
        "value": "other"
      },
      "text": [
        "{{otherRecord}}"
      ]
    }
  ],
  "replyVariants": [
    {
      "when": {
        "field": "scenario",
        "value": "neighbor"
      },
      "text": [
        window.NOISE_TEXTS.templates.neighborReply
      ]
    },
    {
      "when": {
        "field": "scenario",
        "value": "article8"
      },
      "text": [
        window.NOISE_TEXTS.templates.text096
      ]
    },
    {
      "when": {
        "field": "measurementResult",
        "value": "compliant"
      },
      "text": [
        window.NOISE_TEXTS.templates.text097
      ]
    },
    {
      "when": {
        "field": "measurementResult",
        "value": "exceeded"
      },
      "text": [
        window.NOISE_TEXTS.templates.text098
      ]
    },
    {
      "when": {
        "field": "inactiveWording",
        "value": "sourceInactive"
      },
      "text": [
        window.NOISE_TEXTS.templates.text099
      ]
    },
    {
      "when": {
        "field": "inactiveWording",
        "value": "amplifier"
      },
      "text": [
        window.NOISE_TEXTS.templates.text100
      ]
    },
    {
      "when": {
        "field": "noMeasurementReason",
        "value": "rain"
      },
      "text": [
        window.NOISE_TEXTS.templates.text101
      ]
    },
    {
      "when": {
        "field": "noMeasurementReason",
        "value": "other"
      },
      "text": [
        "{{otherReply}}"
      ]
    }
  ]
});

// V2.1：只調整第8條；所有禁止條件與例外選項均取自單一離線規則檔。
(function(root) {
  const t = root.INSPECTION_CONFIG.templates.find(item => item.id === 'noise-case');
  const rules = root.NOISE_ARTICLE8_RULES;
  const eq = (field, value) => ({field, value});
  const field = (id,label,type,extra={}) => ({id,label,type,missing:'（'+label+window.NOISE_TEXTS.templates.text102,...extra});
  const select = (id,label,options,showWhen) => field(id,label,'select',{allowCustom:false,options,showWhen});
  const a8 = eq('scenario','article8');
  t.article8Facts={structuredAct:'construction',pattern:window.NOISE_TEXTS.templates.text103,missing:{equipment:window.NOISE_TEXTS.templates.text104,article8Operation:window.NOISE_TEXTS.templates.text105}};
  t.workflow = 'noiseArticle8'; t.workflowStatus = 'a8Status';
  t.instructions = window.NOISE_TEXTS.templates.text106;
  t.fields.find(f=>f.id==='scenario').options.find(o=>o.id==='article8').label = window.NOISE_TEXTS.templates.text107;
  t.fields = t.fields.filter(f=>!['equipment','prohibitedAct','legalBasis'].includes(f.id));
  for (const id of ['time','operation','zone']) {
    const f=t.fields.find(f=>f.id===id);
    f.showWhen.value=f.showWhen.value.filter(value=>value!=='article8');
  }
  const subjectIndex=t.fields.findIndex(f=>f.id==='subject');
  t.fields.splice(subjectIndex,0,field('article8Time',window.NOISE_TEXTS.templates.text108,'time',{showWhen:a8}));
  const checks=rules.acts.flatMap(a=>[...(a.exceptionChecks||[]),...(a.exceptions||[]).flatMap(e=>e.checks||[])]);
  const computed=[...rules.acts.map(a=>'a8Candidate_'+a.id),'a8ShowActs','a8ShowSubject',...checks.map(c=>c.id+'Visible'),'factText','a8StructuredFacts','a8FreeFacts','a8Ready','a8NeedsHoliday','a8ShowZone','a8ShowException','a8Established','a8Status','article8TimeText','article8LegalBasis'].map(id=>field(id,id==='factText'?window.NOISE_TEXTS.templates.text109:window.NOISE_TEXTS.templates.text110,'computed'));
  const exceptions=[{id:'none',label:window.NOISE_TEXTS.templates.text111,value:window.NOISE_TEXTS.templates.text111}];
  for(const act of rules.acts)for(const ex of act.exceptions||[])exceptions.push({id:act.id+':'+ex.id,label:ex.label,value:ex.label,when:eq('prohibitedAct',act.id)});
  t.fields.splice(t.fields.findIndex(f=>f.id==='subject'),0,...computed,
    select('prohibitedAct',window.NOISE_TEXTS.templates.text112,rules.acts.map(act=>({id:act.id,label:act.label,value:act.recordValue||act.label,when:eq('a8Candidate_'+act.id,'yes')})),eq('a8ShowActs','yes')),
    select('article8Holiday',window.NOISE_TEXTS.templates.text113+rules.holidayDefinition+'）',[{id:'no',label:window.NOISE_TEXTS.templates.text069,value:window.NOISE_TEXTS.templates.text069},{id:'yes',label:window.NOISE_TEXTS.templates.text068,value:window.NOISE_TEXTS.templates.text068}],eq('a8NeedsHoliday','yes')),
    select('article8Zone',window.NOISE_TEXTS.templates.text114,rules.zones.map(z=>({...z,label:window.NOISE_TEXTS.templates.text115+z.id+window.NOISE_TEXTS.templates.text116,value:z.id})),eq('a8ShowZone','yes')),
    select('article8Exception',window.NOISE_TEXTS.templates.text117,exceptions,eq('a8ShowException','yes')),
    ...checks.map(c=>select(c.id,c.label,[{id:'yes',label:window.NOISE_TEXTS.templates.text068,value:window.NOISE_TEXTS.templates.text068},{id:'no',label:window.NOISE_TEXTS.templates.text069,value:window.NOISE_TEXTS.templates.text069}],eq(c.id+'Visible','yes'))),
    field('equipment',window.NOISE_TEXTS.templates.text118,'text',{showWhen:eq('a8StructuredFacts','yes')}),
    field('article8Operation',window.NOISE_TEXTS.templates.text119,'text',{showWhen:eq('a8StructuredFacts','yes')}),
    field('article8FactInput',window.NOISE_TEXTS.templates.text109,'textarea',{showWhen:eq('a8FreeFacts','yes')})
  );
  const take=id=>t.fields.splice(t.fields.findIndex(f=>f.id===id),1)[0];
  const zoneField=take('article8Zone'),holidayField=take('article8Holiday');
  t.fields.splice(t.fields.findIndex(f=>f.id==='prohibitedAct'),0,zoneField,holidayField);
  const subject=t.fields.find(f=>f.id==='subject');
  t.article8SubjectScenarios=subject.showWhen.value.filter(v=>v!=='article8');
  subject.showWhen=eq('a8ShowSubject','yes');
  const article8Record=window.NOISE_TEXTS.templates.article8Record;
  const article8Reply=window.NOISE_TEXTS.common.replyPrefix+article8Record+window.NOISE_TEXTS.common.replyEnding;
  for(const kind of ['record','reply']) {
    const branch=t[kind+'Variants'].find(v=>v.when.field==='scenario'&&v.when.value==='article8');
    branch.when=eq('a8Established','yes');
    branch.text=[kind==='record'?article8Record:article8Reply];
    t[kind+'Variants'].push({when:eq('a8Established','no'),text:['{{a8Status}}']});
  }
})(window);

// V2.5 第9條第一階段僅查詢適用標準，原公文模板保留。
(function(root){
 const t=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case'),r=root.NOISE_ARTICLE9_RULES;
 const a9={field:'scenario',value:'article9'},not9={field:'scenario',operator:'notEquals',value:'article9'};
 t.previewInstructions=window.NOISE_TEXTS.templates.text121;
 t.previewOnlyWhen=a9;t.previewOnlyMessage=window.NOISE_TEXTS.templates.text122;
 for(const f of t.fields)if(f.id!=='scenario')f.displayWhen=not9;
 const field=(id,label,type,extra={})=>({id,label,type,missing:window.NOISE_TEXTS.common.missing,showWhen:a9,...extra});
 const select=(id,label,options,extra={})=>field(id,label,'select',{allowCustom:false,options:options.map(o=>({id:o.id,label:o.label,value:o.label})),...extra});
 const list=[
 select('a9Type',window.NOISE_TEXTS.templates.text123,r.types),
 select('a9Facility',window.NOISE_TEXTS.templates.text124,r.facilities,{showWhen:{field:'a9Type',value:'other'}}),
 select('a9Zone',window.NOISE_TEXTS.templates.text114,r.zones),
 field('a9Date',window.NOISE_TEXTS.templates.text022,'date',{format:'roc'}),
 field('a9Time',window.NOISE_TEXTS.templates.text125,'time'),
 field('a9Period',window.NOISE_TEXTS.templates.text126,'computed',{display:true}),
 field('a9Standards',window.NOISE_TEXTS.templates.text127,'computed',{display:true})];
 t.fields.splice(t.fields.findIndex(f=>f.id==='scenario')+1,0,...list);
})(window);

// V2.6 第9條量測流程。規則、標準及文字分別從第9條單一資料來源載入。
(function(root){
 const t=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case'),rules=root.NOISE_ARTICLE9_RULES.measurement;
 const a9={field:'scenario',value:'article9'},eq=(field)=>({field,value:'yes'});
 const field=(id,label,type,extra={})=>({id,label,type,missing:window.NOISE_TEXTS.common.missing,showWhen:a9,...extra});
 const yesno=(id,label,showWhen,labels=[window.NOISE_TEXTS.templates.text069,window.NOISE_TEXTS.templates.text068])=>field(id,label,'select',{allowCustom:false,showWhen,options:[{id:'no',label:labels[0],value:labels[0]},{id:'yes',label:labels[1],value:labels[1]}]});
 const flags=['a9Blocked','a9Retry','a9ShowRain','a9ShowPoint','a9ShowValues','a9ShowBackground','a9ShowReason','a9ShowFactory','a9ShowAnnual',...rules.metrics.flatMap(m=>['a9ShowValue_'+m.id,'a9ShowBg_'+m.id,'a9ShowAnnual_'+m.id])];
 t.previewOnlyWhen=eq('a9Blocked');t.previewOnlyMessage=window.NOISE_TEXTS.templates.text128;
 t.previewInstructions=window.NOISE_TEXTS.templates.text129;
 t.instructionWhen=a9;
 t.retryWhen=eq('a9Retry');t.retryLabel=window.NOISE_TEXTS.article9.text016;
 const computed=[...flags,'a9Record','a9Reply'].map(id=>field(id,window.NOISE_TEXTS.templates.text130,'computed'));
 const fields=[...computed,
 field('a9Subject',window.NOISE_TEXTS.templates.text027,'text'),field('a9Operation',window.NOISE_TEXTS.templates.text131,'text'),field('a9Source',window.NOISE_TEXTS.templates.text039,'text'),
 yesno('a9Rain',window.NOISE_TEXTS.templates.text132,eq('a9ShowRain')),
 yesno('a9Home',window.NOISE_TEXTS.templates.text133,eq('a9ShowPoint')),
 field('a9Duration',window.NOISE_TEXTS.templates.text134,'computed',{display:true,showWhen:eq('a9ShowValues')}),
 ...rules.metrics.map(m=>field('a9Value_'+m.id,m.label+' '+root.NOISE_ARTICLE9_RULES.metrics[m.id],'number',{min:0,showWhen:eq('a9ShowValue_'+m.id)})),
 field('a9WindSpeed',window.NOISE_TEXTS.templates.text135,'number',{min:0,showWhen:eq('a9ShowValues')}),
 field('a9Unavailable',window.NOISE_TEXTS.templates.text136,'checklist',{items:[{id:'unavailable',label:window.NOISE_TEXTS.templates.text137,value:window.NOISE_TEXTS.templates.text137}],separator:'、',showWhen:eq('a9ShowBackground')}),
 field('a9CannotReason',window.NOISE_TEXTS.templates.text138,'textarea',{showWhen:eq('a9ShowReason')}),
 yesno('a9AllYear',window.NOISE_TEXTS.templates.text139,eq('a9ShowFactory')),
 yesno('a9AnnualValid',window.NOISE_TEXTS.templates.text140,eq('a9ShowAnnual')),
 ...rules.metrics.flatMap(m=>[
 field('a9Bg_'+m.id,m.label+window.NOISE_TEXTS.templates.text141,'number',{min:0,showWhen:eq('a9ShowBg_'+m.id)}),
 field('a9Annual_'+m.id,m.label+window.NOISE_TEXTS.templates.text142,'number',{min:0,showWhen:eq('a9ShowAnnual_'+m.id)})]),
 field('a9CorrectionDetails',window.NOISE_TEXTS.templates.text143,'computed',{display:true,showWhen:eq('a9ShowBackground')}),
 field('a9MeasurementStatus',window.NOISE_TEXTS.templates.text144,'computed',{display:true})];
 t.fields.splice(t.fields.findIndex(f=>f.id==='a9Standards')+1,0,...fields);
 for(const kind of ['record','reply'])t[kind+'Variants'].push({when:a9,text:['{{a9'+(kind==='record'?'Record':'Reply')+'}}']});
})(window);

(function(root){const t=root.INSPECTION_CONFIG.templates.find(t=>t.id==='noise-case');
 t.finishWhen=t.retryWhen;t.retryLabelField='a9RetryLabel';t.finishLabelField='a9FinishLabel';
 t.fields.push({id:'a9Exit',label:window.NOISE_TEXTS.templates.text145,type:'text',missing:window.NOISE_TEXTS.common.missing,showWhen:{field:'scenario',value:'article9'},displayWhen:{field:'scenario',value:'hidden'}},...['a9RetryLabel','a9FinishLabel'].map(id=>({id,label:window.NOISE_TEXTS.templates.text146,type:'computed',missing:window.NOISE_TEXTS.common.missing})));
})(window);
