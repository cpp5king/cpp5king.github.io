# 水污染 Core 架構重構（4.3 功能基準）

本次為純架構重構。可見版本仍為 4.3；不新增功能、不修改欄位、不修改法律判斷、不修改顯示文字、不修改 Windows／PWA 離線方式。

## 重構後核心

```text
UI / Template / Field Renderer
          ↓
src/water-main.js        Facade / 協調層
          ↓
 ┌──────────────────────────────────────────┐
 │ water-facts.js        事實標準化          │
 │ water-rule-engine.js  通用規則判斷        │
 │ water-workflow.js     流程／顯示／下一步   │
 │ water-assessment.js   法規結果／A-B-C-D    │
 │ water-dependencies.js 欄位相依／清除       │
 └──────────────────────────────────────────┘
```

`water-law-versions.js` 與 `data/rules/water-*.js` 的既有責任不變。

## 模組責任

### `src/water-facts.js`
保留 4.3 的 WaterFacts 對外行為與事實標準化，不改既有 `build()` 判斷。

### `src/water-rule-engine.js`
保留 4.3 的 WaterRuleEngine 對外行為與四態規則判斷，不改既有 `evaluate()`。

### `src/water-workflow.js`
負責：
- 完整案件研判模式的 `waterShow*` 顯示條件。
- 現場稽查模式的目前步驟 `currentFieldStep()`。
- 現場稽查模式的下一步提示 `fieldGuidance()`。
- 不判斷法律成立、不成立或刑事責任。

### `src/water-dependencies.js`
負責：
- 原 `water-main.js/resetChange()` 的欄位相依清除。
- 上游欄位改變時，使既有下游答案失效。
- 清除條件與 4.3 原版完全相同。

### `src/water-assessment.js`
負責：
- Rule Engine 結果轉成既有顯示文字。
- §7、§13、§14、§18、§18-1、§20、§22、§26、§27、§28、§30、§32、§35、§59、§71 結果組合。
- 水措管理辦法共通子法結果彙整。
- 規則摘要、缺漏、下一步文字。
- 最終 A／B／C／D 全案研判。
- 所有既有輸出文字保持不變。

### `src/water-main.js`
只保留 Facade／協調責任：
1. 接收 Inputs。
2. 做既有來源欄位相容正規化。
3. 呼叫 WaterFacts。
4. 解析案件日期法規版本。
5. 呼叫 WaterRuleEngine 執行既有母法及子法規則。
6. 呼叫 WaterWorkflow 產生流程／顯示狀態。
7. 呼叫 WaterAssessment 產生輸出。
8. `resetChange()` 委派給 WaterDependencies。

重構前約 446 行；重構後約 98 行，且不再包含實際法規研判文字或欄位清除表。

## 原 `water-main.js` 邏輯搬移對照

| 原責任 | 重構後位置 |
| --- | --- |
| `ruleLines / missingText / nextText / resultBlock` | `water-assessment.js` |
| `assess14 / assess7 / assess35 / assess59 / assess71 / assessGeneric` | `water-assessment.js` |
| `combined181 / combined20 / combined27 / combined28 / combined32` | `water-assessment.js` |
| `article13Text / article18Text / article22Text / article26Text / article59Text / article71Text` | `water-assessment.js` |
| `finalConclusion` A/B/C/D | `water-assessment.js` |
| 子法 `sublawOverview` 與子法結果彙整 | `water-assessment.js` |
| `waterShow*` 完整案件顯示條件 | `water-workflow.js` |
| 現場模式步驟／下一步提示（原在 `water-field.js`） | `water-workflow.js` |
| `resetChange()` 與全部清除分支 | `water-dependencies.js` |
| Facts、法規版本、規則執行、模組串接 | `water-main.js` Facade |

## 必要技術調整

只有載入順序需要加入三個新 Core 檔案：
- `water-workflow.js`
- `water-dependencies.js`
- `water-assessment.js`

因此同步更新 `index.html`、PWA `service-worker.js` App Shell 與測試 runtime 載入清單。這些調整不改使用方式與畫面結果。

## 刻意保留、未順便修正的既有行為

以下在重構時發現具有技術上可疑或可再整理之處，但依本次限制完整保留：

1. `§18-1` 結果組合中，部分判斷使用字串 truthy 檢查（例如 `waterDilutionObserved`、`waterTreatmentFacilityApplicable`），因此值為 `"no"` 時仍可能把該子區塊納入組合文字／最終 active list。現有測試亦鎖定相關輸出，本次未改。
2. 欄位相依清除使用 `else if` 鏈；一次呼叫若同時變更多個上游欄位，只執行第一個命中的清除分支。現行 UI 通常逐欄觸發，本次不更動。
3. `sublawVersionResolved` 仍在 Facade 取得 WaterFacts 後依案件日期補入 facts 物件，未改寫 WaterFacts 對外契約。
4. `waterSourceTypes` 的舊單選相容正規化仍同時存在完整案件 Facade 與現場模式 adapter；本次不為了去重而改變資料契約。

這些只列為後續技術債，不代表本次要修改的業務或法律結論。

## 本次刻意未處理

- SQLite。
- IndexedDB／LocalStorage 等新的永久 Storage。
- 案件永久保存。
- UI 改版或欄位改名。
- Windows／手機 PWA 操作流程變更。
- 新法律規則、法規文字或水措義務。
- AI／LLM／遠端 API。
- 新的公文或案件文字模板。
- 規則引擎語意重寫。
- 上述「既有可疑行為」的修正。

## 驗證

- 原 4.3：510 / 510 測試通過。
- Core 重構版：510 / 510 測試通過。
- 額外差異驗證：使用 1,004 組相同輸入，比對原版與重構版 `DraftEngine.normalize(water-main)` 完整輸出，1,004 / 1,004 完全一致。
