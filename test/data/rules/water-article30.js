(function(root){
  'use strict';
  root.WATER_RULES=root.WATER_RULES||{};
  root.WATER_RULES.article30Dumping={
    id:'WATER-A30-DUMPING',version:'1.0',title:'第30條第1項第2款－污染物棄置',legalBasis:'水污染防治法第30條第1項第2款',
    elements:[
      {id:'controlZoneConfirmed',label:'已確認行為地點位於水污染管制區',nextChecks:['查核水污染管制區公告及行為地點']},
      {id:'article30MatterEligible',label:'棄置物屬垃圾、水肥、污泥、酸鹼廢液、建築廢料或其他污染物',nextChecks:['確認棄置物性質；必要時採樣或查來源']},
      {id:'dumpingConfirmed',label:'已確認存在棄置行為',nextChecks:['以現場影像、行為人陳述、運載紀錄或其他客觀證據固定棄置事實']},
      {id:'designatedWaterRangeConfirmed',label:'已確認位於公告指定水體或其沿岸規定距離內',nextChecks:['查核主管機關公告之指定水體與沿岸管制距離','確認實際位置與距離']}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
