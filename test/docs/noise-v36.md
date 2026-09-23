# 稽查助手3.6：背景音量重測

以3.5完整複製建立，只在3.6修改。雙擊本版本 `start.cmd` 啟動；正式程式以本機HTML、JS、CSS及資料檔執行，沒有新增外部依賴。

## 流程與資料

3.5的 `NoiseAttempts.restart` 原本把風速不符與背景差值不足都存成完整attempt，再清除量測欄位。3.6保留該入口，依既有評估器結果分流：

- `wind`：封存完整量測快照，清除量測與背景欄位，開始下一組完整量測。
- `difference`：交給 `NoiseBackgrounds.restart`，封存目前背景回合，只清除該回合D＜3的背景值，保留原始Leq、Lmax、低頻、風速及測點，不新增完整attempt。

`measurementAttempts` 保留歷次完整量測快照；每份快照增加其 `backgroundMeasurements`。目前正在操作的完整量測沿用既有a9欄位，背景歷程存於同一表單狀態的 `backgroundMeasurements`。兩者採JSON字串以符合既有表單儲存介面，僅存於記憶體，不寫入案件檔案或資料庫。

背景列包含 `round/number`（背景回合）、`id/label`（量測項目）、`key`（一般或核備背景欄位）、`value`、`sourceValue`、`difference`、`valid`、`selected`。同一回合可有全頻、最大、低頻各自的背景列。輸入時更新當回合資料；按背景重測才推進回合，因此每個按鍵不會被誤存成一次背景量測。其他項目已有可用背景時保留，不要求重填。

`src/noise-backgrounds.js` 直接呼叫原 `NoiseArticle9Measurement.correct` 計算D及有效性，未建立第二套背景修正式。原引擎、標準資料、風速門檻、時段及法條款次未修改。

## 原值保留及草稿

背景重測後，數值欄位唯讀、測點卡片鎖定，隱藏重做完整2分鐘量測的提示。內部事件也保護原始量測欄位。場所及音源等案件資料保持原值；上游時區及類型修改仍由原智慧保留機制重新套用標準，只清除不適用項目。若不再需要背景，歷史列不再標示採用。

每次修改或重測仍立即使舊草稿失效。真正重新開始案件會清除兩類歷史。

## 公文

- 後續取得有效背景：既有引擎只收到目前採用的背景欄位；前次D＜3歷史不傳入修正式或正常公文。沿用合格／超標紀錄與精簡回覆。
- 多次背景仍不足並結束：稽查紀錄改用集中模板摘要多次背景均未能取得執法依據；民眾回覆仍用既有D＜3精簡文字。單次失敗不寫成多次。
- 風速不符：維持既有完整重測及結束模板。

新增提示、背景歷史標籤及首頁說明位於 `data/texts/noise-ui.js`。多次失敗模板由 `data/texts/noise-documents.js` 組合，`src/noise-article9-documents.js` 僅選取模板。1999結尾保持原文。

## 測試與版本保護

執行 `node --test tests/*.test.cjs`，398項全數通過、0失敗、0跳過。新增 `tests/noise-v36.test.cjs` 37項；更新舊D＜3整組重測預期及當前版本預期，其餘回歸測試保留。

涵蓋多次背景、有效背景採用、全部失敗、獨立量測項目、DOM按鈕事件及鎖定、工廠核備背景、智慧保留、草稿失效、首頁繫結、法規與餐飲異味原檔雜湊。DOM測試使用本機測試替身，未宣稱已做Windows瀏覽器視覺驗收。

`tests/fixtures/version35-manifest.json` 記錄複製前3.5共153個檔案SHA-256；完成時原版本仍153個檔案，全部雜湊一致。日常測試使用此本機fixture檢查受保護檔案，不依賴電腦上存在舊版本。

## 本次檔案清單

新增：

- `src/noise-backgrounds.js`
- `tests/noise-v36.test.cjs`
- `tests/fixtures/version35-manifest.json`
- `docs/noise-v36.md`

修改：

- `index.html`：載入背景模組、首頁說明位置、版本。
- `data/templates/noise-main.js`：背景歷史內部欄位、顯示及鎖定設定。
- `data/templates/noise-case.js`、`data/templates/noise-neighbor.js`：只更新目前版本metadata。
- `data/texts/noise-ui.js`、`data/texts/noise-documents.js`：集中提示與多次背景失敗公文。
- `src/noise-attempts.js`、`src/noise-main.js`：分流背景與完整重測、保存及顯示歷程。
- `src/noise-article9-documents.js`：多次背景失敗時選取摘要模板。
- `src/field-renderer.js`：資料設定可選用的唯讀／卡片鎖定功能；既有其他欄位不受影響。
- `src/sentence-app.js`：首頁集中文字繫結。
- `tests/helpers.cjs`、`tests/noise-main.test.cjs`、`tests/noise-v33.test.cjs`、`tests/noise-v35.test.cjs`：載入新模組及更新本版正式變更預期。
- `README.md`、`DESIGN.md`、`docs/architecture-review.md`：增列目前版本說明，保留歷史。
- `test-results.txt`：完整398項日常測試輸出。
