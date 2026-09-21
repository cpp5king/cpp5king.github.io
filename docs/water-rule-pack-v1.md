# Water Rule Pack V1 重構摘要

## 定位

水污染母法規則已由既有 UI／workflow／assessment 抽離，建立可獨立更新的 Water Rule Pack。

- Rule Pack：2026.09.21.2-test
- Pack ID：WATER-CORE-TW
- provenance：PP-IA-41-7F3C9A21
- 官方來源：環境部主管法規共用系統 FL015486
- 狀態：test
- 正式 main：尚未合併

## 目前架構

```text
既有水污染客觀事實
        ↓
data/water-rules.js
  ├─ coreRules
  ├─ fieldRules
  ├─ legal navigation / guidance
  ├─ core presentation / groups / exceptions
  ├─ core bindings
  ├─ fact adapters
  └─ law versions / metadata / integrity
        ↓
src/water-law.js
        ↓
src/water-rule-engine.js
        ↓
water-main / water-v2-assessment
        ↓
既有 UI / 摘要
```

App Shell 不再載入個別 `water-article*.js` 或 `water-v2-core.js`。

## 已完成解耦

### 1. 法規資料集中

母法與 V2 法規規則集中於 `data/water-rules.js`。舊 `WATER_RULES` / `WATER_V2_RULES` 名稱仍輸出作相容層，但正式 App 不再直接載入舊規則檔。

### 2. 法規執行入口

`src/water-law.js` 為唯一母法規則入口，提供：

- Rule Pack 讀取。
- 規則評估。
- 法條方向與理由。
- 待確認提示。
- §19 準用等主體關係。
- §7 × §59 等例外關係。
- §18-1、§20、§27、§28、§32 群組分流。
- 法規顯示條件。
- Rule Pack fact adapters。
- 法規版本解析。
- 完整性驗證。

### 3. workflow 不再決定法條

`water-workflow.js` 保留追水、認人、認水、水路、許可、事故、採樣等事實流程。

母法 `waterShowArticleXX` 相關啟動條件改由 `WaterLaw.visibility()` 提供。

### 4. assessment 不再保存第二份法規表

`water-v2-assessment.js` 已移除硬編碼之：

- 第14、18、19、20、25、30、32條法條名稱。
- 第19條準用關係。
- 法規方向 reason。
- 主要待確認提示。

`water-assessment.js` 已改由 Rule Pack 提供入口 guard、群組分流、例外關係、摘要標籤與法律狀態文字。

### 5. water-main 不再手寫母法清單

`water-main.js` 不再列出 24 個 rule key，由 Rule Pack `coreBindings` 決定要評估哪些規則。

新增／調整母法規則時，不需再同步修改主程式的規則清單。

### 6. 法律適用前提改由 Rule Pack adapter 決定

舊 `water-facts.js` 仍保留 `article7SubjectEligible` 等欄位作舊案件／舊測試相容，但 `WaterLaw` 不再信任其值。

Rule Pack `factAdapters` 會依中性事實重新計算：

- 第7條適用主體。
- 第18條之1／20／22／27／28條適用主體。
- 第26條查證對象。
- 第28條物質範圍。
- 第30條污染物範圍。

因此未來法律適用主體或物質範圍變更，可改 Rule Pack，不需改 `water-facts.js`。

## 規則引擎

`WaterRuleEngine schemaVersion 2.0`：

- 相容舊 `elements[]` 全 AND 規則。
- 支援 AND。
- 支援 OR。
- 支援巢狀 AND + OR。

## 法律研判狀態

對外文字統一為：

- 構成要件事實已完整。
- 尚有要件待確認。
- 目前不支持。
- 無法確認（資料模型預留）。
- 本次未查（資料模型／事實層使用）。
- 本案不適用。

系統不再以「違規成立」、「違反法規」作為母法最終研判文字。

## 法規版本

新案件新增：

- `waterBehaviorDate`：行為發生日期，供法規版本解析。
- `waterInspectionDate`：稽查日期，只作案件紀錄。

`WaterLaw.resolveLawVersion()` 不以裝置日期或稽查日期替代行為日期。

行為日期不明時：

> 行為發生日期尚未確認，適用法規版本待確認。

且版本未解析時，即使事實本身符合目前規則，正式法律狀態仍降為「尚有要件待確認」；系統保留 `baseStatus` 供內部知道事實匹配程度，但不輸出現行法方向。

舊案件若資料結構中完全不存在 `waterBehaviorDate`，才走明示 legacy fallback，以避免既有案件在載入新版程式後被默默改寫。

目前母法 Rule Pack 完整掛載：

- WPA-2018-06-13

更早行為日期若無對應歷史 revision，不應硬套現行規則。

## 完整性

Rule Pack 內建：

- algorithm：fnv1a32-json
- checksum：c2b9e4aa

checksum 涵蓋：

- coreRules
- fieldRules
- fieldNavigation
- pendingGuidance
- coreRelations
- corePresentation
- coreBindings
- factAdapters

`WaterLaw.verifyIntegrity()` 可檢查規則包核心資料是否被意外改動。

## 本次刻意不改

- 不重做追水。
- 不重做認人／認水。
- 不重做水路節點與連線。
- 不重做許可核對。
- 不重做採樣流程。
- 不刪除既有事實欄位。
- 不把水措管理辦法、許可審查辦法、放流水標準、地方公告混進 Water Core Rules。
- 不更新正式 main。
- 不變更正式 App 版本號。

舊 `data/rules/water-article*.js` 仍暫留 repository 作歷史相容／參考，但正式 App Shell 與共用測試 runtime 已改用單一 Water Rule Pack。

## 驗證

Draft PR：#24 `Refactor water law into independent Rule Pack`

GitHub Actions active regression tests 已通過；Rule Pack 專用測試包含：

- 單一 Rule Pack 載入。
- integrity。
- 行為日期版本解析。
- 日期不明不回退最新法。
- 舊 `elements[]` 相容。
- 巢狀 AND + OR。
- V2 經 WaterLaw 產生既有法規方向。
- 版本未確認時 suppression。
- Rule Pack fact adapter 覆蓋舊法律衍生欄位。

## 下一階段

以下不是本次合併前必要條件，可獨立續做：

1. 逐版補入仍可能適用的歷史母法 revisions。
2. 將 Water Measure Rules、Permit Rules、Standard Rules、Local Rules 各自拆成獨立 Rule Pack。
3. 將 UI 上仍保留的「§條號提示文字」逐步改為由 Rule Pack 提供顯示 metadata；不改事實題目的本質。
4. 建立「重新檢視結果」資料契約，使規則包更新後可另產生新研判而不覆寫舊結果。
