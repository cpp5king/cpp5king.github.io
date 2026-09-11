# 3.2 噪音選項與文字維護

本版由3.1.2完整複製，只整理噪音介面及文字來源。規則式、完全離線；不增加執行依賴。雙擊本版本的 `start.cmd` 開啟 `index.html`。

## 選項元件

`src/choice-controls.js` 提供 `ChoiceControls.single`，支援 id、文字、選中、停用、點擊及方向鍵／Home／End；原生按鈕提供 Enter／空白鍵操作。`src/choice-cards.css` 提供換欄、選中勾號與焦點樣式。`src/field-renderer.js` 透過模板 `choiceStyle: 'cards'` 使用元件，保留原有共用 checkbox 渲染、條件顯示及取消勾選機制。

噪音主流程與近鄰生活噪音中的管制區、行為、是／否、場所類型、八類公告設施及其他單選全部展開為卡片。未量測原因、背景音例外及原有複選仍是 checkbox。重測、結束、產稿、複製等操作仍為按鈕。餐飲、異味沒有啟用此卡片設定。

## 文字資料

所有檔案在 `data/texts/`，由本機 script 順序載入：

| 檔案 | 維護內容 |
| --- | --- |
| noise-common.js | 共用1999結尾、未量測巡查尾段、模板錯誤提示 |
| noise-templates.js | 第6條公文、原第8條共用公文、原噪音欄位文字及歷史模板 |
| noise-main.js | 主流程導引、未量測原因片段與公文外框、必填提示 |
| noise-article8.js | 第8條操作提示 |
| noise-article9.js | 第9條合格、超標、天雨、風速、背景差值、背景修正文字與提示 |
| noise-neighbor.js | 近鄰生活噪音入口及提示 |
| noise-documents.js | 將上述文字組成第9條文件設定 |

程式以 `window.NOISE_TEXTS.common.replyEnding`、`NOISE_TEXTS.main.placeRecord`、`NOISE_TEXTS.article9.compliantRecordBody` 等代號取得文字。`textNNN` 是既有欄位／短句的固定代號，修改其字串即可，不應重編代號。相同1999及未量測尾段只在 common 中定義一次。

一般文案可直接改上述文字檔，儲存後重新開啟頁面。請保留 JavaScript 引號與串接語法、原有 `{{變數名稱}}`，不要把法規判斷放入文字檔。`src/noise-text.js` 負責變數替換，遇到未知變數或非文字／數字資料會拒絕；主流程仍先檢查分支必要事實。使用者自行輸入的文字不當成另一層模板執行。

`data/rules/noise-article8.js`、`noise-article9.js` 保留法規條件與標準，僅將操作訊息改成文字代號。載入後完整規則物件與3.1.2相同。`src/noise-*.js` 保留原有運算及流程。不要為修改公文而改標準表、背景修正、路由或法條款次。

3.1.2核定之未量測固定周界尾段照原文保留，這是該分支固定模板內容；不恢復「未發現所陳噪音情形」勾選題。

## 測試

完整執行：`node --test tests/*.test.cjs`，不需要安裝套件。

- `tests/noise-cards.test.cjs`：DOM事件、卡片單選、鍵盤、停用、條件、checkbox、產稿與複製操作。
- `tests/noise-logic-v32.test.cjs`：規則物件、路由、判定、修改一般文案不影響結果、必填及模板變數安全。
- `tests/noise-text-contracts.test.cjs`：1999、固定尾段、條項款、文字集中，以及61組3.1.2輸出遷移比對。
- `tests/contracts/`：原有完整公文及未量測文字測試；根目錄入口仍會執行它們。
- `tests/fixtures/`：固定文字契約、3.1.2案例與來源檔案SHA256。

一般文字調整不需修改規則或無關邏輯測試；對應文字契約／遷移快照會反映有意的文案差異，應確認後只更新相關文字預期，不用舊文字鎖死判斷。UI自動測試使用本機DOM測試替身，並非完整瀏覽器引擎。

## 主要修改範圍

新增上述七個文字檔、choice-controls.js、choice-cards.css、noise-text.js、三個測試入口及契約／參考資料。本版修改 index.html 載入順序與版本標題、field-renderer.js、noise-main／article8／article9／article9-measurement／article9-documents 程式，以及噪音模板和規則中的文字引用。既有測試載入器、DOM替身、噪音測試同步更新。餐飲與異味正式檔案不變。
