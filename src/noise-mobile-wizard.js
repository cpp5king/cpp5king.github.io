(function(root){
  'use strict';
  root.TemplatePatches=root.TemplatePatches||{};
  root.TemplatePatches.noiseMobileWizard=config=>{
    const template=config?.templates?.find(item=>item.id==='noise-main');
    if(!template||template.__mobileWizardPatched)return;

    // 只替換手機呈現方式；規則、showWhen/displayWhen、workflow 與 resetChange 均沿用既有實作。
    template.mobileFocusMode=false;

    // 手機版採精簡輸入元件：多選項欄位使用原生下拉；
    // 是／否、少量判斷題仍維持大按鈕卡片。桌機不受影響。
    const mobileDropdownFields=new Set([
      'noiseSpecial',
      'noiseZoneMode','noiseZone','noiseZoneAssistType','noiseZoneLandClass','noiseZoneSourceZone',
      'noiseZoneSideA','noiseZoneSideB','noiseZonePointSide','noiseZoneMajorPosition','noiseZoneUnderlying','noiseZoneBoundaryPair',
      'noiseA8Act','noiseA9Type','noiseFacility','noiseCompositeSourceCount',
      'noiseNoMeasureReason','noiseGeneralSpecialAssessment','noiseGeneralSpread','noiseSpeakerMode','noiseFullPoint',
      'noiseBgFullMode','noiseBgLmaxMode','noiseBgLowMode','noiseDifferenceAction'
    ]);
    for(const field of template.fields||[]){
      if(mobileDropdownFields.has(field.id))field.mobileControl='select';
    }

    template.mobileWizard={
      ariaLabel:'噪音手機逐步流程',
      brandLabel:'稽查助手',
      brandSlogan:'專業稽查・守護安寧',
      dropdownFields:[...mobileDropdownFields],
      fallbackTitle:'其他必要事項',
      statusFields:[
        {id:'noiseQuickDecisionText',label:'目前判斷'},
        {id:'noiseRouteText',label:'目前路徑'}
      ],
      steps:[
        {id:'datetime',title:'稽查日期與時間',help:'請填寫本次現場稽查的實際日期與時間，作為後續時段與標準判定依據。',fields:['noiseDate','noiseTime']},
        {id:'nature',title:'聲音特性與主管機關前置分流',help:'先確認聲音是否具持續性且可量測；不具持續性或不易量測時，直接依主管機關路徑處理。',fields:['noiseNature','noiseDifficultSource','noiseCommunityCommittee']},
        {id:'source',title:'主要噪音來源／主管機關分流',help:'依現場主要噪音來源選擇處理類型；特殊交通或航空噪音會直接分流。',fields:['noiseSpecial','noiseVehicleExhaustA8']},
        {id:'zone',title:'噪音管制區與日曆條件',help:'確認管制區類別與當日屬性；必要時可使用道路、交界或特殊日曆條件協助判定。',fields:['noiseHolidayAutoText','noiseHolidayOverride'],prefixes:['noiseZone']},
        {id:'article8',title:'第8條禁止行為確認',help:'系統依日期、時間與管制區篩選候選行為；請依現場實際行為及例外條件逐項確認。',prefixes:['noiseA8']},
        {id:'article9',title:'第9條場所／工程／設施確認',help:'確認現場屬於第9條所列場所、工程或設施類型，並依需要完成公告設施與複合音量判斷。',fields:['noiseA9Type','noiseFacility'],prefixes:['noiseComposite']},
        {
          id:'measurement',title:'量測設定與量測資料',help:'依現場情形完成測點、方法、風速、全頻／低頻及背景音量資料；僅顯示本案必要欄位。',
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
