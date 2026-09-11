# 重構檔案盤點與整理紀錄

日期：2026-09-09。先檢查 `index.html` 的 script/link 依賴及全部測試；重構前 14 項測試均通過，再進行歸檔。沒有永久刪除使用者原始文件或舊程式。

## 重構前實際使用

| 路徑 | 用途 | 整理結果 |
| --- | --- | --- |
| index.html、start.cmd | 首頁與 Windows 啟動 | 保留；更新首頁載入清單 |
| src/sentence-app.js | 單一案件介面 | 改為通用分類導覽；舊檔先複製至 archive/legacy/src |
| src/draft-engine.js | 混合舊示範與餐飲判斷的引擎 | 改為通用模板引擎；舊檔先複製至 archive/legacy/src |
| src/styles.css | 畫面樣式 | 保留；僅調整分類選擇及通用欄位所需樣式 |
| data/templates/restaurant-odor.js | 餐飲異味草稿、欄位與條件 | 轉換為通用格式；轉換前複製至 archive/legacy/data/templates |
| data/templates/demo.js | 舊示範及共用設定容器 | 解除執行依賴，移至 archive/legacy/data/templates |
| tests/*.test.cjs | 原有自動測試 | 保留測試內容；舊版測試更新為歸檔路徑，餐飲測試改用新設定容器 |

## 舊版程式

下列檔案原本就未被目前首頁載入，已移到對應的 `archive/legacy/` 路徑：

- src/app.js
- src/generator.js
- src/flow-engine.js
- data/flows/air-restaurant-odor.js

歸檔中的引擎與資料仍由歷史測試或新舊輸出比對使用，因此目前不建議刪除。歸檔不是另一個可執行產品，沒有列入正式分類或模板選單。

## 開發暫存

| 原路徑 | 內容 | 整理結果 |
| --- | --- | --- |
| tmp/pdfs | 空目錄；之前的 PDF 渲染中間檔已不存在 | 歸檔至 archive/development-tmp/pdfs |
| tmp/reading-deps | 舊 .xls 讀取套件 xlrd 與安裝資訊 | 歸檔至 archive/development-tmp/reading-deps |

部分讀檔套件子目錄存在本機權限限制，未修改其權限或重新讀取內容；整個 tmp 目錄已成功移入 archive。這些套件不是成品或測試依賴。

## 建議刪除與本次實際操作

- `archive/development-tmp`：不影響程式與自動測試，未來可以刪除；本次依要求先歸檔保留。
- `archive/legacy`：仍提供歷史回歸基準，現在不建議刪除。
- 若另有 `references`：屬使用者原始範本，應由使用者決定保留。本次盤點時該資料夾已不存在，未重建或刪除它。
- 本次永久刪除檔案：無。

## 重構後正式執行依賴

1. index.html、src/styles.css。
2. data/templates/catalog.js：大類、案件類型、模板檔名清單。
3. src/draft-engine.js、src/template-loader.js、src/case-session.js、src/field-renderer.js、src/sentence-app.js。
4. catalog.js 登記的 data/templates/restaurant-odor.js。

Windows 啟動器 start.cmd 可方便開啟；README 與 docs 是說明文件。archive、tests、references 均不會在一般啟動時載入。
