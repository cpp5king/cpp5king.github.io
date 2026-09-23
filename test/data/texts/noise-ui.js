(function(root){root.NOISE_TEXTS.ui={
  subject:'稽查場所／被陳情對象',subjectRequired:'請填寫稽查場所／被陳情對象',
  optional:'（選填）',factSupplement:'現場事實描述（選填）',supplementPattern:'補充現場事實：{{text}}',
  equipmentPattern:'使用機具：{{text}}',operationPattern:'作業內容：{{text}}',
  constructionDetails:'使用{{equipment}}進行{{operation}}',
  standardFacts:{construction:'使用動力機械／手持工具從事營建工程施工',outdoorSpeaker:'於室外使用擴音設施'},
  timeHint:'HH:mm，例如23:30',timeInvalid:'請以24小時制HH:mm輸入稽查時間',zoneRequired:'請選擇噪音管制區',
  metricsHint:'量測數值至少填寫一項；未量測的項目留空。',
  retryWind:'重新量測',retryDifference:'再次量測背景音量',finish:'結束本次量測',
  historyTitle:'歷次量測紀錄',attempt:'第{{number}}次量測',currentAttempt:'目前為第{{number}}次量測',
  historyContext:'稽查日期：{{date}}　稽查時間：{{time}}　噪音管制區：第{{zone}}類',
  historyPoint:'測點：{{point}}',historyWind:'風速：{{value}} m/s',historyValue:'{{label}}：{{value}} dB',
  historyBackground:'背景音量：{{value}} dB',historyDifference:'差值D：{{value}} dB',historyCorrected:'修正後音量：{{value}} dB',
  historyResult:'結果：{{value}}',historyNote:'歷史資料僅供查看；本案判定使用目前這次量測，不使用歷史無效數據。'
};})(window);

Object.assign(window.NOISE_TEXTS.ui,{
 homeInstructions:'請依現場實際情形選擇或填寫，必要欄位未完成時系統將提示。',
 backgroundGuide:'原噪音源量測值已保留，請再次量測背景音量並輸入背景值。',
 backgroundFailure:'整體音量與背景音量差值小於3分貝。請選擇再次量測背景音量，或結束本次量測；原噪音源量測值保留。',
 backgroundHistoryTitle:'背景音量歷次紀錄',
 backgroundHistoryRow:'第{{number}}次背景音量：{{label}} {{value}} dB｜差值{{difference}} dB｜{{status}}{{selected}}',
 backgroundUsable:'可使用',backgroundInvalid:'小於3 dB',backgroundSelected:'（最終採用）',
 repeatedBackgroundFact:'經量測整體音量後，另多次量測背景音量，其與整體音量差值均小於3分貝，依噪音管制標準規定無法取得可作為執法依據之量測值。'
});

Object.assign(window.NOISE_TEXTS.ui,{
 timePicker:{hour:'時',minute:'分',empty:'—'},
 endedBackground:{labels:{leq:'均能音量',lmax:'最大音量',leqLF:'低頻均能音量'},
 source:'經量測{{label}}為{{value}}分貝',single:'另量測背景音量為{{value}}分貝，其與整體音量之差值小於3分貝',
 multiple:'另量測背景音量，{{series}}，其與整體音量之差值均小於3分貝',item:'第{{number}}次為{{value}}分貝',
 conclusion:'依噪音管制標準規定無法取得可作為執法依據之量測值。',
 record:'{{facts}}，{{conclusion}}'}
});
