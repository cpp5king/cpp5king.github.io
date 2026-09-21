# Water Rule Pack V1 重構摘要

## 定位

本次將水污染母法規則從既有 UI／流程載入結構抽離，建立可獨立更新的 Water Rule Pack。

- Rule Pack：2026.09.21.1-test
- Pack ID：WATER-CORE-TW
- provenance：PP-IA-41-7F3C9A21
- 官方來源：環境部主管法規共用系統 FL015486
- 狀態：test

## 新架構

```text
既有水污染事實層
        ↓
data/water-rules.js
        ↓
src/water-rule-engine.js
        ↓
src/water-law.js
        ↓
water-main / water-v2-assessment
        ↓
既有 UI / 摘要
```

水污 UI 與現場流程不再直接載入各個 water-article*.js 或 water-v2-core.js。

## 相容策略

第一階段不改成熟事實流程，Rule Pack 同時輸出：

- WATER_RULES：既有完整案件研判相容介面。
- WATER_V2_RULES：既有 V2 現場查核相容介面。
- WATER_RULE_PACK：新規則包介面。

因此可先完成法規資料解耦，再逐步將舊 assessment 內殘留的法條文字與分流搬入 WaterLaw／Rule Pack。

## 規則引擎

WaterRuleEngine schemaVersion 2.0 保留既有 elements[] 全 AND 規則，並新增巢狀：

- AND
- OR
- AND + OR

舊規則不需改寫即可繼續運作。

## 法規版本

WaterLaw.resolveLawVersion() 只接受行為發生日期概念；日期未提供時回傳：

> 行為發生日期尚未確認，適用法規版本待確認。

不以裝置日期或稽查日期替代。

目前 Rule Pack 僅完整掛載現行母法規則集（WPA-2018-06-13）。更早行為日期不應硬套現行規則；後續應依需求逐版增加歷史 revision。

## 完整性

Rule Pack 內建 integrity：

- algorithm：fnv1a32-json
- checksum：7c0a77be

WaterLaw.verifyIntegrity() 可於載入後檢查 coreRules 與 fieldRules 是否與規則包 metadata 相符。

## 本次未處理

- 不改水污事實欄位。
- 不改追水、認人、認水、水路、許可核對、採樣流程。
- 不把水措管理辦法、許可審查辦法、放流水標準併入母法 Rule Pack。
- 不更新正式 main。
- 不變更 App 正式版本號。
- 舊 data/rules/water-article*.js 暫保留於 repo 作歷史相容／測試參考，但正式 App Shell 已不再載入。

## 後續第二階段

1. 將 water-v2-assessment.js 內法規 reason／準用關係／待確認文字逐步資料化。
2. 將 water-assessment.js 內條文式顯示條件與例外關係搬入 WaterLaw。
3. 新增行為發生日期／期間與重新檢視結果資料契約。
4. 逐版補入仍可能使用的歷史母法 revision。
5. 再拆 Water Measure / Permit / Standard / Local Rule Packs。
