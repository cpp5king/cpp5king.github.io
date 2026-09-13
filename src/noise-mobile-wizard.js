(function(root){
  'use strict';
  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noiseMobileWizard=config=>{
    const template=config?.templates?.find(item=>item.id==='noise-main');
    if(!template||template.__mobileWizardPatched)return;

    // 只替換手機呈現方式；規則、showWhen/displayWhen、workflow 與 resetChange 均沿用既有實作。
    template.mobileFocusMode=false;
    template.mobileWizard={
      ariaLabel:'噪音手機逐步流程',
      fallbackTitle:'其他必要事項',
      statusFields:[
        {id:'noiseQuickDecisionText',label:'目前判斷'},
        {id:'noiseRouteText',label:'目前路徑'}
      ],
      steps:[
        {id:'datetime',title:'稽查日期與時間',fields:['noiseDate','noiseTime']},
        {id:'nature',title:'聲音特性與主管機關前置分流',fields:['noiseNature','noiseDifficultSource','noiseCommunityCommittee']},
        {id:'source',title:'主要噪音來源／主管機關分流',fields:['noiseSpecial','noiseVehicleExhaustA8']},
        {id:'zone',title:'噪音管制區與日曆條件',fields:['noiseHolidayAutoText','noiseHolidayOverride'],prefixes:['noiseZone']},
        {id:'article8',title:'第8條禁止行為確認',prefixes:['noiseA8']},
        {id:'article9',title:'第9條場所／工程／設施確認',fields:['noiseA9Type','noiseFacility'],prefixes:['noiseComposite']},
        {
          id:'measurement',title:'量測設定與量測資料',
          fields:[
            'noiseSubject','noiseSource','noiseMeasureDecision','noiseNoMeasureReason','noiseNoMeasureDetail','noiseOperation',
            'noiseGeneralSpecialAssessment','noiseGeneralBg10','noiseGeneralSpread','noiseGeneralMethod','noiseGeneralMethodText',
            'noiseSpeakerMode','noiseFullPoint','noiseSpeakerOutdoor','noiseWind','noiseDifferenceAction','noiseBackgroundHistoryText',
            'noiseStandardText','noiseMeasurementPointText','noiseResultText'
          ],
          prefixes:['noiseValue','noiseBg']
        }
      ]
    };
    template.__mobileWizardPatched=true;
  };
})(typeof window==='undefined'?globalThis:window);