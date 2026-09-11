(function(root){
  'use strict';
  root.WATER_TEXTS={
    common:{missing:'尚待確認'},
    main:{
      title:'水污染稽查',formTitle:'水污染案件－母法主流程',
      instructions:'依序確認管制主體、現場物質、廢（污）水去向，再依已確認事實平行檢核母法各條文。必要構成要件未確認時，只輸出事證不足與下一步查證；涉及水措管理辦法、檢測申報細節者，僅提示進入第二階段子法模組。',
      subjectType:'Node 001｜現場被稽查對象屬於何種身分？',
      subjectConfirmed:'是否已依實際作業內容、業別、規模及列管資料確認其屬水污法事業？',
      article13NewOrChange:'§13｜本案是否涉及事業設立或變更？',article13Designated:'是否已確認屬第13條指定之種類、範圍及規模？',measuresPlanApproval:'設立或變更前水污染防治措施計畫核准狀態？',
      matterType:'Node 002｜本案主要物質／污染態樣為何？',
      wastewater:'是否已確認本案水體屬廢（污）水？',sourceType:'水的主要來源（可複選）',
      actualDischarge:'Node 003｜是否已證明廢（污）水有實際向外排出？',destination:'Node 004｜該股廢（污）水實際最終去向／處理方式為何？',
      surfaceType:'Node 005｜疑似地面水體的類型為何？',surfaceConfirmed:'是否已確認該去向符合「地面水體」要件？',
      drainageFunction:'道路側溝是否已確認具有排水功能？',downstream:'是否已確認下游流向？',drainageConnection:'是否已確認與雨水下水道、排水路、箱涵、溪流或其他排水體系連通？',
      permit:'§14｜稽查當時排放許可狀態為何？',
      storageActivity:'§20｜是否已確認現場實際以貯留方式處理廢水？',storagePermit:'貯留許可狀態為何？',storageMismatch:'有有效貯留許可時，現場是否已確認未依登記事項運作？',
      sampleTaken:'§7｜是否已有可供本案判斷之放流水採樣？',sampleRepresentative:'採樣是否可代表該股放流水？',sampleBeforeReceivingWater:'採樣位置是否位於廢（污）水進入承受水體前？',
      applicableStandard:'是否已確認本案適用之放流水標準？',labResult:'是否已有有效檢測結果？',effluentExceeded:'檢測結果是否超過適用放流水標準？',
      approvedRoute:'§18-1｜是否已確認核准登記之收集、處理流程與放流／納管出口？',actualRoute:'是否已確認現場實際水路？',bypass:'是否已確認實際水路避開核准收集、處理流程，或由非核准出口排放？',bypassEmergency:'該繞流是否屬第18條之1第3項急迫搶救例外，且已於3小時內通知？',
      dilutionObserved:'現場是否發現廢水有稀釋行為？',requiresTreatment:'原廢（污）水是否須經處理始能符合管制標準？',mixedCleanWater:'所混入的水是否無需處理即能符合標準？',dilutionPermit:'第20條稀釋許可狀態為何？',dilutionMismatch:'有有效稀釋許可時，現場是否已確認未依登記事項運作？',dilutionEmergency:'該稀釋是否屬第18條之1第3項急迫搶救例外，且已於3小時內通知？',
      treatmentApplicable:'現場是否設有廢（污）水（前）處理設施，且本案需檢視其功能與操作？',treatmentFunction:'處理設施是否具備足夠功能與設備？',treatmentOperating:'處理設施是否維持正常操作？',
      article18SpecificDuty:'§18｜是否已依水措管理相關規定確認本案存在某項具體水措義務？',article18Noncompliance:'是否已確認現場不符合該項具體水措義務？',

      article28Scenario:'§28｜是否發現輸送或貯存設備有疏漏、溢流、滲漏至水體之虞，或已發生疏漏？',
      transportStorageEquipment:'是否已確認涉案設施屬輸送或貯存設備？',leakCause:'疏漏／排放原因為何？',leakRisk:'是否已確認有疏漏污染物或廢（污）水至水體之虞？',maintenancePrevention:'事業是否已採取必要維護及防範措施？',leakPollutedWater:'是否已確認疏漏已致污染水體？',emergencyAction:'污染／重大危害發生後，是否已立即採取緊急應變措施？',threeHourNotice:'是否於法定3小時內通知當地主管機關？',
      severeHazard:'§27｜本案排放是否已確認有嚴重危害人體健康、農漁業生產或飲用水水源之虞？',

      soilPermit:'§32｜排放於土壤時，是否具有有效土壤處理許可？',groundwaterBody:'§32｜是否已確認廢（污）水實際進入地下水體／地下含水層？',
      dumping:'§30｜是否已確認存在污染物「棄置」行為？',controlZone:'行為地點是否已確認位於水污染管制區？',designatedRange:'是否已依公告確認行為位於指定水體或其沿岸規定距離內？',

      reportingDuty:'§22｜是否已依適用規定確認本案具有申報義務？',reportingNoncompliance:'是否已確認未依規定格式、內容、頻率或方式完成申報？',reportedMismatch:'申報資料／業務文書與客觀資料是否存在重大不一致？',falseReportRecord:'§35｜是否已確認存在不實申報或業務文書虛偽記載？',knowingFalse:'是否已有證據支持行為人「明知不實」仍申報／記載？',
      inspectionBasis:'§26｜本次是否已確認稽查人員攜帶證明文件並就法定事項執行查證？',obstruction:'是否已確認受檢者有規避、妨礙或拒絕查證行為？',

      facilityFailure:'§59｜是否已確認廢（污）水處理設施發生故障，並主張／需檢核24小時標準例外？',a59Repair:'是否立即修復或啟用備份裝置，並採減產、停產或其他應變？',a59Record:'是否立即記錄故障並以電話或電傳報備，且留存報備人員資料？',a59Recover:'是否24小時內恢復正常，或恢復前持續減少／停止生產服務？',a59Report5:'是否於5日內提出書面報告？',a59Causation:'故障與所違反之放流水標準是否具有直接關係？',a59SixMonths:'是否不屬6個月內相同故障？',
      surfacePollutionEvent:'§71｜是否已確認地面水體發生污染事件？',polluterIdentified:'是否已確認污染行為人？',investigationComplete:'最終檢核｜本次案件需要查證的事項是否已完成？',

      overview:'多條文研判總覽',article13:'§13 水措計畫',article14:'§14 排放許可',article7:'§7 放流水標準',article18:'§18 水污染防治措施',article181:'§18-1 異常排放／處理設施',article20:'§20 貯留／稀釋',article22:'§22 申報',article35:'§35 疑似不實申報／虛偽紀錄',article26:'§26 查證／拒檢',article27:'§27 重大危害',article28:'§28 輸送／貯存設備疏漏',article32:'§32 土壤／地下水體',article30:'§30 污染物棄置',article59:'§59 設備故障例外',article71:'§71 污染清除後續',finalConclusion:'全案最終研判',missing:'缺少／不成立要件',next:'下一步查證建議'
    }
  };
})(window);
