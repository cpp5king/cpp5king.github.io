(function(root){
  'use strict';
  const template={
    id:'water-v2',
    categoryId:'water',
    caseTypeId:'water-v2-inspection',
    title:'水污染稽查 V2',
    version:'4.9.34-test',
    customRenderer:'waterV2',
    fields:[
      {id:'waterV2StateJson',label:'水污染 V2 案件資料',type:'textarea',missing:'尚未建立案件資料'}
    ],
    record:['{{waterV2StateJson}}'],
    reply:['{{waterV2StateJson}}']
  };
  root.INSPECTION_CONFIG.templates.push(template);
})(window);
