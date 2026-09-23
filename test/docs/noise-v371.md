# 稽查助手3.7.1

由3.6完整複製建立；所有修改只在此版本。雙擊本資料夾的 `start.cmd` 完全離線啟動。

## D＜3結束紀錄

正式稽查紀錄使用 `data/texts/noise-ui.js` 的 `endedBackground` 文字集合，完整文件由 `data/texts/noise-documents.js` 的 `differenceHistoryEnded` 組合。

`src/noise-main.js` 將背景歷史送入文件資料；`src/noise-article9-documents.js` 只在最終狀態為 `differenceEnded` 時，依目前仍無效的量測項目，取得相同原噪音源值之歷次無效背景。背景資料及量測判斷本身未改。

- 一筆：`另量測背景音量為79分貝，其與整體音量之差值小於3分貝`。
- 兩筆以上：依實際紀錄順序產生 `第1次為…、第2次為…`，不限制次數；末段使用 `其與整體音量之差值均小於3分貝`。
- 不逐次列差值。多個量測項目分開敘述，避免把不同音量的背景混為一組。
- 後續取得有效背景時仍走既有合格／超標模板，只使用目前有效背景，不列舊無效歷程。
- 民眾回覆仍使用3.6精簡文字，不列歷次背景數字。

結論句號屬 `endedBackground.conclusion` 文字的一部分，固定形成 `量測值。現場已責成…`，不是事後對單一案例補字。保留的舊摘要文字亦補上句號。

## 24小時時間選擇器

`data/templates/noise-main.js` 的 `mainTime` 保留原 `time` 資料型別，改用 `timePicker` 顯示設定。`src/field-renderer.js` 依此設定渲染兩個HTML select：小時00～23、分鐘00～59。另有未選空白項，不自動假定現在時間或分鐘00。

時間欄位仍以既有 `mainTime` 存放。兩項選好後組成補零的 `HH:mm`；只選其中一項時不產生完整時間。介面數字由程式明列，不依賴瀏覽器locale，不顯示AM／PM。標籤集中於 `NOISE_TEXTS.ui.timePicker`。這是時間專用的select例外，其他噪音單選卡及複選checkbox不变。

小時／分鐘change事件沿用原智慧保留、候選重算、標準重算及草稿失效機制。第8條、第9條仍收到完整HH:mm。公文仍呼叫原 `NoiseFormat.inspectionHour`，23:40→23時許、00:40→0時許、08:05→8時許。其餘模組沒有套用此新控制項。

## 測試與版本保護

命令：`node --test tests/*.test.cjs`。429項通過，0失敗、0跳過；其中新增31項3.7.1測試。舊UI及D＜3結案文案測試更新為本次核定規格，數值／法規回歸繼續執行。使用DOM測試替身驗證select事件、背景重測及產稿；不宣稱已做Windows瀏覽器視覺驗收。

涵蓋1、2、3、4、5次背景、完整核定範例、句號、有效背景優先、精簡回覆、多項獨立背景、全部時間選項、24小時格式、選取事件、分鐘重算、資料保留、草稿失效及原規則檔雜湊。

複製前保存3.6的157個檔案SHA-256於 `tests/fixtures/version36-manifest.json`；完成時再次確認原版本仍157個檔案，所有雜湊一致。第8／9條規則、噪音標準、公式、背景重測、風速attempt模組、餐飲與異味原檔均保持不變。

## 檔案清單

新增：

- `tests/noise-v371.test.cjs`
- `tests/fixtures/version36-manifest.json`
- `docs/noise-v371.md`

修改：

- `src/field-renderer.js`：可由設定啟用雙select時間控制項。
- `src/noise-main.js`：將背景歷史傳給文件產生器。
- `src/noise-article9-documents.js`：動態組合結束紀錄。
- `data/texts/noise-ui.js`、`data/texts/noise-documents.js`：時間標籤、背景歷程模板與標點。
- `data/templates/noise-main.js`：時間控制項設定及版本。
- `data/templates/noise-case.js`、`data/templates/noise-neighbor.js`：僅當前版本metadata。
- `index.html`：當前版本標示。
- `tests/article9-background-flow.test.cjs`、`tests/article9-exits.test.cjs`、`tests/noise-cards.test.cjs`、`tests/noise-main.test.cjs`、`tests/noise-v33.test.cjs`、`tests/noise-v35.test.cjs`、`tests/noise-v36.test.cjs`：更新核定文字／時間UI／當前版本預期。
- `README.md`、`DESIGN.md`、`docs/architecture-review.md`：增列3.7.1說明，保留歷史紀錄。
- `test-results.txt`：完整日常測試結果。
