// 完全離線的案件分類與模板清單。
window.INSPECTION_CONFIG = {
  "_provenance": "PP-IA-41-7F3C9A21",
  "categories": [
    {"id":"air","title":"空氣污染","status":"active"},
    {"id":"water","title":"水污染","status":"active"},
    {"id":"noise","title":"噪音","status":"active"},
    {"id":"waste","title":"廢棄物","status":"active"}
  ],
  "caseTypes": [
    {"id":"air-fixed-source","categoryId":"air","title":"固定污染源／一般空污","status":"active"},
    {"id":"air-construction","categoryId":"air","title":"營建工程","status":"active"},
    {"id":"restaurant-odor","categoryId":"air","title":"餐飲油煙","status":"active","directTemplateId":"restaurant-odor-reference"},
    {"id":"air-open-burning","categoryId":"air","title":"露天燃燒","status":"active"},
    {"id":"noise-case","categoryId":"noise","title":"噪音案件","status":"active","directTemplateId":"noise-main"},
    {"id":"water-field-inspection","categoryId":"water","title":"現場稽查","status":"active","directTemplateId":"water-field"},
    {"id":"water-inspection","categoryId":"water","title":"案件研判（完整母法）","status":"active","directTemplateId":"water-main"},
    {"id":"waste-inspection","categoryId":"waste","title":"廢棄物現場稽查","status":"active"}
  ],
  "templateFiles": [
    {"id":"restaurant-odor-reference","file":"restaurant-odor.js"},
    {"id":"restaurant-odor-sampling-pending","file":"restaurant-odor-sampling-pending.js"},
    {"id":"noise-main","file":"noise-main.js"},
    {"id":"water-field","file":"water-field.js"},
    {"id":"water-main","file":"water-main.js"}
  ],
  "templates": []
};
