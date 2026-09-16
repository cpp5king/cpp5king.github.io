# 水污染 V2＋法規研判原型（4.9.33 TEST）

## 定位

本測試版採「事實層」與「法律研判層」分離：

1. 水污染現場模組負責記錄觀察、量測、陳述、文件、行動、點位與水流。
2. Legal Adapter 將既有水污欄位轉為結構化 Water V2 Session。
3. Legal Analysis Engine 只讀案件事實，依案件日期、主體、行為、去向及規則庫進行研判。
4. 法規研判結果不得反寫或創造現場 Fact；缺少法律要件時只回傳 Missing Fact／建議補查。

核心原則：事實優先、未知不等於否定、查無資料不等於確認不存在。

## 相容策略

4.9.33 TEST 採加法式整合，不拆除 4.9.32 已有的 `WaterFacts`、母法 Rule Engine、子法規則、Workflow、Assessment 與 Documents。

新增：

- `src/water-v2-session.js`：V2 結構化案件資料。
- `src/water-v2-workflow.js`：V2 主流程狀態與下一步建議。
- `data/rules/water-legal-v2.js`：法規研判 Batch A 規則庫。
- `src/water-legal-engine.js`：確定性 Legal Analysis Engine。
- `src/water-v2-summary.js`：事實／法規研判摘要。
- `src/water-legal-adapter.js`：既有水污資料與 V2／Legal Engine 介面。
- `src/water-v2-ui.js`：非侵入式 UI Bridge。

現有 `water-main` 仍先執行原本的規則、子法、業別、評估與文件流程，再附加 V2 Session／Workflow／Legal Analysis 結果。

## Water V2 Session

資料層包含：

- Facts
- Statements
- Actions
- Evidence
- Points
- Flows
- Premises
- Subjects
- Relations
- Screenings
- Samplings
- Incidents
- Unknowns
- Conflicts
- Derived Facts
- Inferences
- Recommendations
- Timeline

Workflow V1 狀態：

- `initial_observation`
- `fact_preservation`
- `source_tracing`
- `subject_confirmation`
- `regulated_status`
- `regulated_inspection`
- `fact_review`
- `completed`

UI 頁面位置不等於 Workflow State。

## 法規研判 Batch A

第一批可執行規則：

- 水污染防治法第 7 條第 1 項：放流水標準。
- 第 14 條第 1 項：未取得有效排放許可而排放。
- 第 14 條第 1 項：未依排放許可登記事項運作。
- 第 18-1 條第 1 項：繞流排放。
- 第 28 條第 1 項：輸送／貯存設備疏漏、防範、緊急應變及三小時通知。
- 第 30 條第 1 項第 5 款：公告禁止足使水污染之行為。
- 第 32 條第 1 項：未經合法土壤處理而排放廢污水於土壤。

Rule 結果僅表示目前事實對法規要件的研判狀態，不等同告發或裁處決定。

## 防錯約束

- `permit not found` 不得當成 `permit not obtained`。
- 發現額外管線不得直接推論為繞流；需核准 Flow、實際 Flow 及直接繞流關係。
- 快篩結果不得用於第 7 條放流水正式標準判定。
- Statement 不得自動升格為客觀 Fact。
- 法規研判 Derived Result 不得寫回 Fact。
- 意外洩漏至土壤不得自動等同第 32 條的主動排放於土壤。
- 案件日期變動時，法規版本必須重新解析。

## UI 整合

目前先以既有現場模式做低風險接軌：

- 「即時判定」增加 V2 目前狀態、完成狀態與主要建議。
- 「現場下一步」增加 Legal Engine 回傳的最重要 Missing Fact。
- 案件完成後，在既有法規研判摘要底部增加「法規研判 V1｜Batch A」。

本版本尚未重建成完整 W00～W11 視覺工作區；本輪目的先驗證資料架構、Workflow、Legal Adapter 與 Rule Engine 是否能和現行水污模組共存。

## 測試基準

`tests/water-v2-legal.test.cjs` 包含十組代表性案件與防錯測試，包括：

- 核准放流且正式檢驗合格。
- 額外管線但尚未確認繞流。
- 已確認繞流。
- 處理設施故障但尚無排放事實。
- 查無排放許可資料。
- 貯留許可差異。
- 輸送設備破裂且逾三小時通知。
- 未達規模食品製造排放。
- 主動排放廢污水於土壤。
- 異常水來源／性質／去向均未知。
- 快篩不得替代正式檢驗。
- 意外洩漏不得自動套用主動土壤排放。

## 目前限制

- §30 第 1 項第 5 款公告目前只收錄第一批高頻態樣，尚非公告全文規則化。
- 尚未建立 Point／Flow 的完整前端編輯器；V2 可接受結構化 `waterV2Flows`，現場 UI 仍以既有循線欄位為主。
- Batch B（§13、§15、§18 管理辦法完整細項、§20）尚未納入新 Legal Engine。
- 尚未實作行政罰法、故意過失、法規競合、裁罰額度或自動告發。
- 本版本不使用 AI，全部為離線規則式運算。

## 發布狀態

本檔對應 `test/4.9.33-water-v2-legal` 測試分支。不得視為正式版；未經使用者明確指示「上線」不得合併至 `main`。

Provenance: `PP-IA-41-7F3C9A21`
