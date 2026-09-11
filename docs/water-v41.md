# 稽查助手 4.1

4.1 由 4.0-rc1 複製開發，保留既有 Windows 完全離線模式及水污染母法主體規則，新增手機 PWA／響應式介面。Windows 仍可直接雙擊 `start.cmd` 使用；手機版與 Windows 共用同一套模板、WaterFacts、WaterRuleEngine 與各條文規則，不另維護第二套判斷邏輯。

## 本版修正

「水的主要來源」由單選 `waterSourceType` 改為複選 `waterSourceTypes[]`，可同時記錄製程、操作、作業環境、生活污水、清洗水、冷卻水、雨水、地下水等多個來源。「來源尚待確認」為互斥選項；一旦選取任何已知來源即取消 unknown。舊版 `waterSourceType` 單值輸入在 workflow prepare 階段自動遷移成陣列，以維持相容性。

## 手機 PWA

新增 `manifest.webmanifest`、`service-worker.js`、`src/pwa.js` 與 180/192/512 圖示。手機寬度下，單選改為單欄大卡片、複選改為大觸控區，並處理安全區 padding。PWA App Shell 僅引用本機檔案，不使用遠端 API 或外部 CDN。

PWA 第一次安裝必須從 HTTPS 網址開啟；iPhone/iPad 需以 Safari 使用「分享 → 加入主畫面」，Android Chrome 在符合安裝條件時可使用頁面安裝按鈕或瀏覽器選單。安裝及 service worker 快取完成後，App Shell 可離線開啟。直接從手機 ZIP／Files 開啟 `index.html` 不視為正式 PWA 安裝方式。

Windows `file://` 模式不註冊 service worker，原有離線使用方式不受影響。

## 測試

Node 自動測試新增 4.1 專屬項目：複選、多來源保存、unknown 互斥、舊欄位遷移、PWA manifest、App Shell 本機資源與手機 CSS。Chromium headless 在目前開發容器因系統 D-Bus 環境無法正常完成啟動／關閉，因此不宣稱已完成 iPhone/Android 實機安裝驗證；需由實際手機確認一次安裝與主畫面啟動。
