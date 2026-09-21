# Water Rule Pack V1 重構摘要

## 定位

水污染法規層已由既有 UI／workflow／assessment 抽離，改為可獨立更新的多層 Rule Pack 架構。

正式 `main` 尚未合併；目前工作位於：

- branch：`refactor/water-rule-pack-v1`
- Draft PR：#24
- provenance：`PP-IA-41-7F3C9A21`

## Rule Pack 架構

```text
水污染客觀事實
      ↓
┌──────────────────────────────────────┐
│ Water Core Rules                     │  水污染防治法
│ Water Measure Rules                  │  水措管理辦法
│ Water Permit Rules                   │  水措計畫／許可申請審查管理辦法
│ Water Standard Rules                 │  放流水標準
│ Water Local Rules                    │  地方加嚴標準／公告
└──────────────────────────────────────┘
      ↓
各自的 Law Facade
      ↓
WaterRuleEngine / routing
      ↓
water-main / water-v2-assessment
      ↓
既有 UI / 摘要 / 現場流程
```

原則：**事實層負責記錄現場，法規包負責適用關係與版本；UI 不保存第二份法律知識。**

## 1. Water Core Rules

- 檔案：`data/water-rules.js`
- Facade：`src/water-law.js`
- Pack ID：`WATER-CORE-TW`
- 版本：`2026.09.21.4-test`
- checksum：`579d6184`
- 法規：水污染防治法
- 官方來源：FL015486

已完成：

- 母法與 V2 規則集中。
- §19 準用關係資料化。
- §7 × §59 例外資料化。
- §18-1、§20、§27、§28、§32 分流資料化。
- legal navigation / guidance / presentation / bindings 集中。
- Rule Pack fact adapters 接管法律適用前提。
- `water-main.js` 不再手寫母法 rule key 清單。
- `water-workflow.js` 不再自行決定母法啟動條件。
- `water-v2-assessment.js` 不再硬編碼主要法條名稱與理由。
- Core 欄位條號、§19 準用說明、重大污染 3 小時通報提示等法規顯示文字已移入 Rule Pack；UI／assessment 僅保留中性 fallback。

目前完整掛載母法版本：

- `WPA-2018-06-13`

更早歷史版本尚未收錄，不得回退使用現行版本。

## 2. Water Measure Rules

- 檔案：`data/water-measure-rules.js`
- Facade：`src/water-measure-law.js`
- Pack ID：`WATER-MEASURE-TW`
- 版本：`2026.09.21.6-test`
- checksum：`36264c79`
- 法規：水污染防治措施及檢測申報管理辦法
- 官方來源：FL040734
- 現行修正基準：2026-04-20

包含：

- 共通水措規則。
- 特定業別規則。
- 業別 catalog。
- 水措版本解析。
- 行為日期版本 gate。
- 延伸業別 §45、§46、§46-1、§47、§48～49、§49-1～49-12 等法規 metadata 與評估邏輯。
- 56 個法規驅動業別欄位定義，包含依法規可能變動之門檻與提示文字。
- 共通水措 19 項 assessment bindings。
- 業別水措 10 項 assessment bindings。

`water-industry-v485.js` 現在只保留 UI patch、欄位切換清除與結果拼接；不再保存上述延伸業別法規判斷或門檻字串。

`water-assessment.js` 不再手寫共通水措／業別水措條文清單，改由 `WaterMeasureLaw.assessmentItems()` 取得 active items。

水措 §4／7／8／31／39／40／41／53／65／89-1 等正式欄位 label 已移入 Measure Pack；`data/texts/water-main.js` 只保留中性 fallback。案件敘述之業別名稱亦改讀 Measure catalog，並以 `documentLabel` 保持既有輸出相容。

正式 App Shell 不再直接載入：

- `data/rules/water-sublaw-core.js`
- `data/rules/water-industry.js`
- `data/rules/water-industry-catalog-v485.js`

舊檔暫留 repository 作歷史／相容參考。

## 3. Water Permit Rules

- 檔案：`data/water-permit-rules.js`
- Facade：`src/water-permit-law.js`
- Pack ID：`WATER-PERMIT-TW`
- 版本：`2026.09.21.1-test`
- checksum：`cb981d95`
- 法規：水污染防治措施計畫及許可申請審查管理辦法
- 官方來源：GL005950
- 修正基準：2026-03-24

目前版本區間：

- `WPR-2024-01-11`
- `WPR-2024-01-11-WITH-2026-A57`
- `WPR-2026-03-24`

115年3月24日修正之第57條自發布日施行，其餘修正條文自115年10月1日施行。

Permit Pack 目前接管：

- 許可版本解析。
- 可進許可／水措差異核對之主體。
- 六項核心比對欄位 metadata。
- 可供比對之 reference state。

`WaterPermitCheck` 保留事實核對流程，但不再自己保存這些法律 metadata。

相容聚合器 `water-law-versions.js` 不再寫死水措／許可修正日期或 sourceId，改由 Measure / Permit Pack 的官方來源 metadata 動態提供。

## 4. Water Standard Rules

- 檔案：`data/water-standard-rules.js`
- Facade：`src/water-standard-law.js`
- Pack ID：`WATER-STANDARD-TW`
- 版本：`2026.09.21.1-test`
- checksum：`379aceb7`
- 狀態：`test-routing-only`
- 法規：放流水標準
- 官方來源：FL015489
- 現行修正基準：2024-12-18

目前只做：

- 行為日期版本解析。
- 事業附表一至八之基礎路由。
- 污水下水道系統附表九至十四之路由介面。
- 建築物污水處理設施附表十五。
- 總量管制區附表十六 metadata。
- 地方加嚴／特定業別標準優先提醒。

**本版不含放流水水質項目數值限值。**

因此現有：

- `waterApplicableStandardConfirmed`
- `waterEffluentExceeded`

仍是稽查員／檢測結果確認之事實，不由程式自動推算。

## 5. Water Local Rules

- 檔案：`data/water-local-rules.js`
- Facade：`src/water-local-law.js`
- Pack ID：`WATER-LOCAL-NTPC`
- 版本：`2026.09.21.1-test`
- checksum：`13d2c6eb`
- 狀態：`test-routing-only`
- jurisdiction：新北市

目前收錄地方標準入口：

- 新北市大安圳幹線加嚴放流水標準。
- 新北市塔寮坑溪及其支流加嚴放流水標準。
- 新北市大漢溪及其支流加嚴放流水標準。

Local Pack 安全限制：

- 不依地址、里別、座標自動判公告範圍。
- 不內建地方加嚴數值限值。
- 未確認承受水體／公告範圍時不自動套用。
- 指定某地方標準時也只列為 candidate，仍需確認直接／間接排放關係、適用對象、公告範圍及行為時施行規定。
- 行為日期早於地方標準公布日時不回溯。

目前沒有新增現場必填欄位，避免改動成熟追水流程。

## 行為日期與版本原則

新案件區分：

- `waterBehaviorDate`：行為發生日期，用於法規版本。
- `waterInspectionDate`：稽查日期，只作案件紀錄。

不得使用：

- 裝置今日日期。
- 稽查日期。
- 最新法規版本。

來替代未知的行為日期。

如果行為日期不明：

> 適用法規版本待確認。

Core / Measure 等會保留事實匹配程度，但法律結果不得因此直接升為完整成立方向。

舊案件若根本不存在 `waterBehaviorDate` 欄位，才走明示 legacy fallback，避免載入新版時偷偷改寫過去結果。

## 法規研判快照／重新檢視

已建立 `WaterReview` 契約：

- 每次一般水污案件產生紀錄時，自動追加一筆 `legalReviews`。
- Water V2 摘要頁可明確按「保留本次研判快照」。
- 快照保存：
  - 行為日期／稽查日期。
  - 當時事實快照與 input hash。
  - Core / Measure / Permit / Standard / Local 五個 Rule Pack 版本與 integrity。
  - 當時法律研判／待確認事項。
  - 當時自動產生之草稿快照。
- 後續重新研判會新增第 2、3…筆，不覆寫舊結果。
- 手動修改草稿不反向改寫舊 review snapshot。
- Water V2 完整記憶體狀態與 review history 可隨既有案件 JSON 匯出／匯入。
- 仍不使用 localStorage、IndexedDB 或其他永久儲存。
- 舊 schema v1 案件沒有 review history 時仍可正常匯入。

## 規則引擎

`WaterRuleEngine schemaVersion 2.0`：

- 相容舊 `elements[]` 全 AND。
- AND。
- OR。
- 巢狀 AND + OR。

## 法律研判狀態

對外法律研判統一為：

- 構成要件事實已完整。
- 尚有要件待確認。
- 目前不支持。
- 無法確認。
- 本次未查。
- 本案不適用。

不以「違規成立」作為系統終局輸出。

## 事實流程保持不變

本次沒有重做：

- 來源不明追水。
- 主體確認。
- 水路節點／連線。
- 許可核對的事實填寫流程。
- 採樣流程。
- 事故／疏漏流程。
- 既有事實欄位。

## 離線載入

App Shell / Service Worker 現在正式載入：

- `data/water-rules.js`
- `data/water-measure-rules.js`
- `data/water-permit-rules.js`
- `data/water-standard-rules.js`
- `data/water-local-rules.js`
- 對應五個 Law Facade。

## 驗證

Draft PR：#24 `Refactor water law into independent Rule Pack`

最新 GitHub Actions：

- active tests：307 / 307 PASS
- fail：0
- skipped：0
- Water Core Rule Pack：10 / 10 PASS
- Water Measure Rule Pack：9 / 9 PASS
- Water Permit Rule Pack：9 / 9 PASS
- Water Standard Rule Pack：10 / 10 PASS
- Water Local Rule Pack：8 / 8 PASS

## 後續工作

法規層「可獨立更新」的基本架構已完成。後續可分開進行：

1. 補母法 2018 年以前仍可能適用的歷史 revisions。
2. 補水措管理辦法 2026-04-20 以前的歷史 revisions。
3. 補許可審查辦法 2024-01-11 以前歷史 revisions。
4. Standard Pack 再逐步加入正式結構化限值資料；在資料完整前不得自動判超標。
5. Local Pack 再加入公告範圍／里別／承受水體結構化資料；完成前不得以地址自動認定地方標準。
6. 逐步將 Core／Permit 等仍屬純顯示用途的 §條號文字改由各自 Rule Pack metadata 提供；不改事實題目本質。
7. 維持防退化測試：Rule Pack 外的 UI／assessment／文件整合層不得重新出現可變條號、法定期限或法規數值門檻。

## 上線原則

本分支仍為測試重構。

未經明確「上線」指示：

- 不 merge `main`。
- 不變更正式 App 版本號。
- 不覆蓋正式網站。
