(function(root){
  'use strict';
  root.TemplatePatches=root.TemplatePatches||{};

  root.TemplatePatches.waterInspectionTime482=function(config){
    for(const templateId of ['water-field','water-main']){
      const template=(config.templates||[]).find(item=>item.id===templateId);
      if(!template)continue;
      template.version='4.8.2';
      const dateIndex=template.fields.findIndex(item=>item.id==='waterInspectionDate');
      if(dateIndex<0||template.fields.some(item=>item.id==='waterInspectionTime'))continue;
      const dateField=template.fields[dateIndex];
      dateField.label='稽查日期';
      template.fields.splice(dateIndex+1,0,{
        id:'waterInspectionTime',
        label:'稽查時間',
        type:'time',
        missing:dateField.missing||'尚待確認',
        timePicker:{empty:'請選擇',hour:'時',minute:'分'}
      });
    }
  };

  const baseBuild=root.WaterDocuments?.build;
  if(typeof baseBuild==='function'&&!root.WaterDocuments.__inspectionTime482){
    const rocDate=value=>{
      const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
      if(!m)return '';
      return `${Number(m[1])-1911}年${Number(m[2])}月${Number(m[3])}日`;
    };
    const rocTime=value=>{
      const m=/^(\d{2}):(\d{2})$/.exec(String(value||''));
      if(!m)return '';
      return `${Number(m[1])}時${Number(m[2])}分`;
    };
    root.WaterDocuments.build=function(input={},facts={}){
      const result=baseBuild(input,facts);
      const date=rocDate(input.waterInspectionDate);
      const time=rocTime(input.waterInspectionTime);
      if(!time)return result;
      if(date){
        result.recordText=String(result.recordText||'').replace(
          `本局於${date}派員進行水污染查察。`,
          `本局於${date}${time}派員進行水污染查察。`
        );
        result.replyText=String(result.replyText||'').replace(
          '本局已派員進行查察。',
          `本局已於${date}${time}派員進行查察。`
        );
      }else{
        result.recordText=String(result.recordText||'').replace(
          '本次進行水污染查察。',
          `本局於${time}派員進行水污染查察。`
        );
        result.replyText=String(result.replyText||'').replace(
          '本局已派員進行查察。',
          `本局已於${time}派員進行查察。`
        );
      }
      return result;
    };
    root.WaterDocuments.__inspectionTime482=true;
  }
})(typeof window==='undefined'?globalThis:window);