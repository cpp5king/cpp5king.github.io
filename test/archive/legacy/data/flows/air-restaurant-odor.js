// 獨立流程資料。使用 JS 包裝，讓瀏覽器可在 file:// 下離線載入。
// 僅修改下方資料物件即可調整內容；不需修改主程式。
window.INSPECTION_FLOWS = [
  {
    id: "air-restaurant-odor",
    version: "0.1.0-demo",
    title: "餐飲異味示範流程",
    category: ["空氣污染", "餐飲業", "異味案件"],
    description: "以虛構情境示範逐步選擇、查看提示及產生摘要。",
    start: "source",
    nodes: {
      source: {
        title: "是否已確認示範異味來源與餐飲作業有關？",
        checks: ["【假資料】查看示範情境中是否有餐飲作業。", "【假資料】確認異味來源是否仍有不確定之處。"],
        evidence: ["【假資料】確認是否有不含個人資料的現場觀察紀錄；本工具不收集紀錄或照片。"],
        direction: "【假資料】已確認則進入作業狀態；未確認則結束並提示補充確認。",
        legal: "待使用者提供及確認；本示範未載入任何法規內容。",
        options: [{ label: "是，已確認", next: "operation" }, { label: "否／尚無法確認", next: "need-source" }]
      },
      operation: {
        title: "示範現場是否正在進行餐飲作業？",
        checks: ["【假資料】查看示範現場當下是否正在烹調。"],
        evidence: ["【假資料】確認是否有當下作業狀態的觀察資料；不記錄人員身分。"],
        direction: "【假資料】有作業則繼續觀察；未作業則提示另行確認。",
        legal: "待使用者提供及確認；本示範未載入任何法規內容。",
        options: [{ label: "是，正在作業", next: "odor" }, { label: "否／尚無法確認", next: "need-operation" }]
      },
      odor: {
        title: "示範觀察中是否感受到異味？",
        checks: ["【假資料】檢視示範觀察結果是否描述異味。", "【假資料】區分觀察結果與尚未確認的推測。"],
        evidence: ["【假資料】確認是否有異味觀察及作業狀態的對照資料；本工具不接受附件。"],
        direction: "【假資料】依選項彙整示範結果，不進行違規或裁處判斷。",
        legal: "待使用者提供及確認；本示範未載入任何法規內容。",
        options: [{ label: "是，有異味", next: "observed" }, { label: "否，未感受到", next: "not-observed" }, { label: "無法確認", next: "uncertain" }]
      }
    },
    outcomes: {
      "need-source": { title: "尚待確認來源", direction: "【假資料】補充確認示範來源後，再進行流程。" },
      "need-operation": { title: "尚待確認作業狀態", direction: "【假資料】另行確認示範作業狀態後，再進行流程。" },
      observed: { title: "已記錄示範異味觀察", direction: "【假資料】提示後續由承辦人依已確認的正式 SOP 與法規另行研判；此結果不代表違規。" },
      "not-observed": { title: "本次示範未觀察到異味", direction: "【假資料】僅代表本次示範選項，不代表排除污染或認定案件結案。" },
      uncertain: { title: "示範觀察結果待確認", direction: "【假資料】補充觀察資訊後，再進行流程。" }
    }
  }
];
