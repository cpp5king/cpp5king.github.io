(function(root){
  'use strict';
  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.waterIndustry485Final=function(config){
    for(const templateId of ['water-field','water-main']){
      const template=(config.templates||[]).find(item=>item.id===templateId);
      const industry=template?.fields?.find(field=>field.id==='waterIndustryType');
      if(!industry||!Array.isArray(industry.options))continue;
      const byId=new Map(industry.options.map(option=>[option.id,option]));
      const preferred=['other','unknown'];
      industry.options=[
        ...preferred.map(id=>byId.get(id)).filter(Boolean),
        ...industry.options.filter(option=>!preferred.includes(option.id))
      ];
    }
  };
})(typeof window==='undefined'?globalThis:window);
