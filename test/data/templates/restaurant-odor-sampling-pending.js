// 文字來源：使用者提供的「周界異味採樣－待檢驗結果」參考紀錄及回覆。
// 不含個案店名、公司名、日期、時間或袋數預設。程序依使用者核定為本模板固定文字。
window.INSPECTION_CONFIG.templates.push({
  id: "restaurant-odor-sampling-pending", categoryId: "air", caseTypeId: "restaurant-odor",
  title: "周界異味採樣－待檢驗結果", version: "1.0.0",
  formTitle: "周界異味採樣資料",
  instructions: "本樣態以現場作業中為使用前提，限現場已執行周界異味採樣、採樣程序完成且檢驗結果尚未下達。請依實際資料填寫；稽查日期與採樣日期分開，本模板固定包含採樣位置、程序、拍照簽名及標準作業程序文字。",
  fields: [
    { id: "date", label: "稽查日期", type: "date", format: "roc", missing: "（稽查日期尚待確認）" },
    { id: "time", label: "稽查時間（小時）", type: "hour", suffix: "時許", missing: "（稽查時間尚待確認）" },
    { id: "subject", label: "稽查對象／場所描述", type: "text", missing: "（稽查對象／場所描述尚待確認）" },
    { id: "attendees", label: "會同人員（依實際情形勾選）", type: "checklist", separator: "、",
      items: [
        { id: "operator", label: "業者／該業人員", value: "該業人員" },
        { id: "contractor", label: "委辦公司", customKey: "contractorName", customLabel: "委辦公司名稱", valuePrefix: "委辦公司", missing: "（名稱尚待確認）" },
        { id: "laboratory", label: "檢測公司", customKey: "laboratoryName", customLabel: "檢測公司名稱", valuePrefix: "檢測公司", missing: "（名稱尚待確認）" },
        { id: "other", label: "其他", customKey: "otherAttendees", customLabel: "其他會同人員", missing: "（其他會同人員尚待確認）" }
      ], missing: "（會同人員尚待確認）"
    },
    { id: "samplingDate", label: "採樣日期（與稽查日期分開）", type: "date", format: "month-day", missing: "（採樣日期尚待確認）" },
    { id: "samplingStart", label: "採樣開始時間", type: "time", missing: "（開始時間尚待確認）" },
    { id: "samplingEnd", label: "採樣結束時間", type: "time", missing: "（結束時間尚待確認）" },
    { id: "bagCount", label: "採樣袋數", type: "number", integer: true, min: 1, missing: "（袋數尚待確認）" }
  ],
  record: ["本局於{{date}}{{time}}派員前往稽查，經查該址為{{subject}}，現場會同{{attendees}}，稽查時現場作業中，於該店排風管下風處適當距離進行周界異味採樣（採樣時間{{samplingDate}}{{samplingStart}}-{{samplingEnd}}，共{{bagCount}}袋）相關程序皆符合環境部規定，待檢驗結果下達，辦理後續事宜，以上過程均拍照存證並經業者確認無誤後簽名。本案已依環境部訂定之標準作業程序進行採驗（檢測），並已對當事人有利及不利事項注意，且排除相關干擾因素，採樣檢測結果如超過法定標準，本案後續將依法告發。"],
  reply: ["有關臺端反映事項，本局已於{{date}}{{time}}派員前往稽查，並於現場執行周界異味採樣，相關樣品刻正辦理檢驗作業，待檢驗結果下達後，本局將依結果辦理後續事宜；如檢測結果不符法定標準，將依法辦理。"]
});
