// UTF-8 獨立模板資料；以 JS 包裝支援直接開啟本機 HTML。
// {{欄位名稱}} 為替換位置。請保留引號、逗號及括號。
window.DRAFT_CONFIG = {
  missing: "尚待確認",
  groups: [
    { title: "一、案件基本資料", fields: [
      { id: "date", label: "稽查日期", type: "date" },
      { id: "time", label: "稽查時間", type: "time" },
      { id: "caseType", label: "案件類型", type: "select", options: ["空氣污染／餐飲異味（示範）"] },
      { id: "location", label: "稽查地點（請使用代稱）", type: "text" },
      { id: "subject", label: "稽查對象（請使用代稱）", type: "text" },
      { id: "complaint", label: "陳情內容", type: "textarea" }
    ] },
    { title: "二、現場查察資料", fields: [
      { id: "operating", label: "現場是否營業或作業", type: "select", options: ["是", "否"] },
      { id: "source", label: "污染源或陳情標的", type: "text" },
      { id: "observation", label: "現場查察情形", type: "textarea" },
      { id: "pollution", label: "是否發現污染情形", type: "select", options: ["是", "否"] },
      { id: "equipment", label: "污染防制設備狀況", type: "textarea" },
      { id: "operatorStatement", label: "業者說明", type: "textarea" },
      { id: "accompanied", label: "是否會同陳情人", type: "select", options: ["是", "否"] },
      { id: "notes", label: "其他補充事項", type: "textarea" }
    ] }
  ],
  // 條件文字只依使用者選擇替換，不從敘述推論。
  conditions: {
    operating: { "是": "現場有營業或作業", "否": "現場未營業或作業" },
    pollution: { "是": "現場有發現污染情形", "否": "現場未發現污染情形" },
    accompanied: { "是": "本次有會同陳情人", "否": "本次未會同陳情人" }
  },
  results: [
    { id: "none", label: "未發現陳情所述污染情形", record: "本次未發現陳情所述污染情形。", reply: "本次查察未發現您反映之污染情形。" },
    { id: "guidance", label: "現場勸導改善", record: "本次已於現場勸導改善。", reply: "本次已於現場勸導改善。" },
    { id: "schedule", label: "後續安排檢測", record: "後續安排檢測。", reply: "後續將安排檢測。" },
    { id: "tested", label: "已執行檢測", record: "本次已執行檢測；檢測結果以實際檢測資料為準，本草稿不判定是否合格。", reply: "本次已執行檢測；檢測結果以實際檢測資料為準，本草稿不判定是否合格。" },
    { id: "suspected", label: "涉嫌違規，後續依法辦理", record: "依本次所選處理結果，案件涉嫌違規，後續依法辦理；本草稿未認定違規事實或適用法規。", reply: "本案處理結果為涉嫌違規，後續依法辦理；本草稿未認定違規事實或適用法規。" },
    { id: "other", label: "其他", record: "其他處理結果：{{resultDetails}}", reply: "其他處理結果：{{resultDetails}}" }
  ],
  templates: [
    {
      id: "air-odor-demo", title: "空氣污染／餐飲異味（示範模板）", version: "0.1.0",
      record: [
        "稽查日期：{{date}}；稽查時間：{{time}}。案件類型：{{caseType}}；稽查地點：{{location}}；稽查對象：{{subject}}。本案陳情內容：{{complaint}}",
        "本次現場營業或作業情形：{{operating}}。污染源或陳情標的：{{source}}。現場查察情形：{{observation}}",
        "污染查察結果：{{pollution}}。污染防制設備狀況：{{equipment}}。業者說明：{{operatorStatement}}。會同情形：{{accompanied}}。其他補充事項：{{notes}}",
        "處理結果：{{resultRecord}}"
      ],
      reply: [
        "有關您反映「{{complaint}}」一事，查察情形說明如下：",
        "本次稽查日期為{{date}}，時間為{{time}}，查察地點為{{location}}，查察對象為{{subject}}。現場營業或作業情形：{{operating}}；查察標的：{{source}}。現場查察情形：{{observation}}",
        "污染查察結果：{{pollution}}。污染防制設備狀況：{{equipment}}。業者說明：{{operatorStatement}}",
        "本案處理情形：{{resultReply}}"
      ]
    }
  ],
  demo: {
    date: "2026-09-09", time: "14:30", caseType: "空氣污染／餐飲異味（示範）",
    location: "示範地點 A（虛構代稱）", subject: "示範餐飲場所 A（虛構代稱）",
    complaint: "反映烹調期間有異味傳出（假資料）。", operating: "是", source: "示範排氣口（假資料）",
    observation: "查察時現場正在烹調，於示範觀察位置感受到烹調氣味（假資料）。",
    pollution: "", equipment: "可見示範設備，運作效能尚待確認（假資料）。",
    operatorStatement: "業者表示有定期清潔設備（假資料，未經查證）。", accompanied: "否",
    notes: "本案全部內容僅供介面測試。", result: "schedule", resultDetails: ""
  }
};
