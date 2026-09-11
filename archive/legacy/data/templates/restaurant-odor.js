// 依使用者於本次對話逐字提供的兩段草稿。
// label 是畫面選項；value 是稽查紀錄用字；replyValue（若有）是民眾回覆用字。
// 未選使用 missing；只有明確選擇「不填」才使用空字串。
window.DRAFT_CONFIG.templates.unshift({
  id: "restaurant-odor-reference", title: "餐飲異味草稿填空", version: "0.5.0", fillIn: true,
  fields: [
    { id: "date", label: "稽查日期（輸出為民國年）", type: "date", missing: "（日期尚待確認）" },
    { id: "time", label: "稽查時間（只選小時）", type: "hour", suffix: "時許", missing: "（時間尚待確認）" },
    { id: "subject", label: "店名（請使用代稱）", type: "text", missing: "（店名尚待確認）" },
    { id: "operating", label: "營業狀態", type: "select", options: [
      { id: "open", label: "營業中", value: "營業中" },
      { id: "cooking", label: "進行烹飪作業中", value: "進行烹飪作業中" },
      { id: "open-not-cooking", label: "營業中，惟未進行烹飪作業", value: "營業中惟未進行烹飪作業" },
      { id: "closed", label: "未營業", value: "未營業" },
      { id: "prep", label: "未作業，現場僅整理環境與備料", value: "未作業現場僅整理環境與備料" }
    ], missing: "（營業狀態尚待確認）" },
    { id: "equipment", label: "防制設備（種類可複選）", type: "equipment",
      modes: [{ id: "", label: "尚待確認" }, { id: "none", label: "無設備" }, { id: "present", label: "有設備" }],
      options: [
        { id: "bag", label: "袋濾式" }, { id: "wash", label: "洗滌式" },
        { id: "static", label: "靜電集塵" }, { id: "cyclone", label: "旋風集塵" },
        { id: "adsorption", label: "吸附" }, { id: "absorption", label: "吸收" },
        { id: "combustion", label: "燃燒" }, { id: "other", label: "其他" }
      ],
      otherLabel: "其他設備名稱", typesMissing: "設備種類尚待確認", otherMissing: "其他設備名稱尚待確認",
      recordText: "油煙收集後經由空污防制設備處理（{{types}}）後排放至大氣，",
      replyText: "油煙收集後經由空污防制設備處理後排放至大氣，",
      noneText: "", missing: "（油煙處理及防制設備情形尚待確認），"
    },
    { id: "observation", label: "周界查察結果", type: "select", options: [
      { id: "no-odor", label: "未發現明顯油煙逸散致空污異味之情事", value: "於周界外巡查未發現有明顯油煙逸散致空污異味之情事" },
      { id: "smoke", label: "發現油煙逸散情形", value: "於周界外巡查發現有油煙逸散情形" },
      { id: "no-smoke", label: "未發現明顯油煙逸散情事", value: "於周界外巡查未發現明顯油煙逸散情事" }
    ], missing: "（周界查察結果尚待確認）" },
    { id: "measurement", label: "電子鼻量測（只填入稽查紀錄）", type: "select", options: [
      { id: "omit", label: "不填電子鼻句", value: "" }
    ], customLabel: "已量測，填入電子鼻數值", customType: "number", customPrefix: "（電子鼻數值為", customSuffix: "）", missing: "（電子鼻數值尚待確認）" },
    { id: "handling", label: "是否已依草稿內容勸導", type: "select", options: [
      { id: "maintenance", equipmentMode: "present", label: "是，已勸導加強設備及增加維護保養頻率", value: "本局仍勸導業者加強防制設備及增加維護保養設備頻率" },
      { id: "install", equipmentMode: "none", label: "是，已囑業者加裝空污防制措施", value: "本局仍囑業者加裝空污防制措施" },
      { id: "not-guided", label: "否，本次未勸導", value: "本次未進行勸導" }
    ], missing: "（勸導情形尚待確認）" },
    { id: "handbook", label: "是否已交付新北市餐飲污染防制手冊", type: "select", allowCustom: false,
      showWhen: { field: "equipment", value: "none" }, options: [
        { id: "yes", label: "是，已當場交付", value: "，並當場交付新北市餐飲污染防制手冊供其參考，以維環境品質" },
        { id: "no", label: "否，未交付（不填交付句）", value: "" }
      ], missing: "，（手冊交付情形尚待確認）"
    },
    { id: "followup", label: "是否填入不定期巡查安排", type: "select", options: [
      { id: "patrol", label: "是，已決定不定期派員巡查", value: "，爾後本局將不定期派員前往巡查，以維護環境品質" },
      { id: "omit", label: "否，不填後續巡查句", value: "" }
    ], missing: "，（後續巡查安排尚待確認）", customPrefix: "，" }
  ],
  record: ["本局於{{date}}{{time}}派員前往所陳地址，經查該址為{{subject}}，稽查時{{operating}}，{{equipment}}{{observation}}{{measurement}}，{{handling}}{{handbook}}{{followup}}。"],
  reply: ["有關臺端反映事項，本局於{{date}}{{time}}派員前往所陳地址，經查該址為{{subject}}，稽查時{{operating}}，{{equipment}}{{observation}}，{{handling}}{{handbook}}{{followup}}。若您再次發現污染情形，請撥打新北市政府1999市政服務專線反映，本局會再度派員依法查處。"],
  demoLabel: "套用你提供的草稿",
  demo: { date: "2026-01-01", time: "15", subject: "XXX小吃店", operating: "open", equipment: "present", equipmentTypes: ["wash", "static"], equipmentOther: "", observation: "no-odor", measurement: "custom", measurementCustom: "0", handling: "maintenance", handbook: "", followup: "patrol" }
});
