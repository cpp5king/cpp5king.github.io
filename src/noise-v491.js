(function(root){
  'use strict';
  const workflow=root.TemplateWorkflows.noiseMain;
  const noiseMain=root.NoiseMain;
  const texts=root.NOISE_TEXTS.main;
  const trim=value=>typeof value==='string'?value.trim():'';
  const pointRules=root.NOISE_ARTICLE9_RULES.measurement.points;

  // Correct a long-standing ambiguous wording: the 1 m requirement is from the
  // measurement point to the nearest building wall, not 1 m outside the source boundary.
  pointRules.yes={
    record:'陳情人指定之居住生活地點',
    reply:'臺端指定之居住生活地點'
  };
  pointRules.no={
    record:'主管機關指定之噪音源周界外適當地點（距最近建築物牆面線1公尺以上）',
    reply:'主管機關指定之噪音源周界外適當地點（距最近建築物牆面線1公尺以上）'
  };
  // The dynamic Article 9 template is loaded later, so changing the shared text now
  // updates both the legacy field and the integrated noise-main field without duplicating UI.
  root.NOISE_TEXTS.templates.text133=texts.pointChoiceQuestion;

  const speakerPoint={
    record:'距噪音源水平投影3公尺以上之主管機關指定位置',
    reply:'距噪音源水平投影3公尺以上之主管機關指定位置'
  };

  function lowPointInvalid(input){
    return input?.a9Home==='no'&&trim(input?.a9Value_leqLF)!=='';
  }
  function pointGuide(input,prepared){
    if(prepared?.a9ShowPoint!=='yes')return '';
    if(input?.a9Type==='speaker')return texts.pointGuideSpeaker;
    if(input?.a9Home==='yes')return texts.pointGuideHome;
    if(input?.a9Home==='no')return texts.pointGuideAuthority;
    return texts.pointGuidePending;
  }
  function speakerDocuments(input){
    const article9=noiseMain.article9(input);
    const state=root.NoiseArticle9Measurement.assess(article9);
    if(!state.ready)return null;
    const key=input.a9Home;
    if(!pointRules[key])return null;
    const previous=pointRules[key];
    try{
      pointRules[key]=speakerPoint;
      return root.NoiseArticle9Documents.generate(article9,state);
    }finally{
      pointRules[key]=previous;
    }
  }
  function validate(input){
    if(lowPointInvalid(input))return [texts.pointGuideLowInvalid];
    return workflow.validate(input);
  }
  function prepare(input){
    const out=workflow.prepare(input);
    const guide=pointGuide(input,out);
    out.a9PointGuide=guide;
    if(guide&&out.mainRoute==='article9'&&input.mainMeasure==='yes'){
      out.mainGuide=(out.mainGuide?out.mainGuide+'\n':'')+guide;
    }
    if(lowPointInvalid(input)){
      out.mainBlocked='yes';
      out.mainValidation=texts.pointGuideLowInvalid;
      out.mainGuide=texts.pointGuideLowInvalid;
      out.mainRecord='';out.mainReply='';out.a9Record='';out.a9Reply='';
      return out;
    }
    if(input.a9Type==='speaker'&&out.mainRoute==='article9'&&input.mainArticle9Scope==='yes'&&input.mainMeasure==='yes'&&out.mainBlocked==='no'){
      const documents=speakerDocuments(input);
      if(documents){
        out.a9Record=documents.record;out.a9Reply=documents.reply;
        out.mainRecord=documents.record;out.mainReply=documents.reply;
      }
    }
    return out;
  }
  root.NoisePointV491=Object.freeze({version:'4.9.1',lowPointInvalid,pointGuide,speakerPoint:Object.freeze({...speakerPoint})});
  root.NoiseMain={...noiseMain,validate,prepare};
  root.TemplateWorkflows.noiseMain={...workflow,validate,prepare};
})(window);
