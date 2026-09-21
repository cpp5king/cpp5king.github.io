(function(root){
  'use strict';
  root.WATER_TEXTS={
    common:{missing:'尚待確認'},
    main:{
      title:'水污染稽查',formTitle:'水污染案件－母法主流程',
      instructions:'依序確認管制主體、現場物質、廢（污）水去向，再依已確認事實平行檢核母法各條文。必要構成要件未確認時，只輸出尚有要件待確認與下一步查證；涉及水措管理辦法、檢測申報細節者，僅提示進入第二階段子法模組。',
      subjectType:'Node 001｜現場被稽查對象屬於何種身分？',
      subjectConfirmed:'是否已依實際作業內容、業別、規模及列管資料確認其屬水污法事業？',
      industryCheckMode:'特定業別附加檢核｜本次是否需要進行？',
      article13NewOrChange:'本案是否涉及事業設立或變更？',article13Designated:'是否已確認屬指定之種類、範圍及規模？',measuresPlanApproval:'設立或變更前水污染防治措施計畫核准狀態？',
      matterType:'Node 002｜本案主要物質／污染態樣為何？',
      wastewater:'是否已確認本案水體屬廢（污）水？',sourceType:'水的主要來源（可複選）',
      actualDischarge:'Node 003｜是否已證明廢（污）水有實際向外排出？',destination:'Node 004｜該股廢（污）水實際最終去向／處理方式為何？',
      surfaceType:'Node 005｜疑似地面水體的類型為何？',surfaceConfirmed:'是否已確認該去向符合「地面水體」要件？',
      drainageFunction:'道路側溝是否已確認具有排水功能？',downstream:'是否已確認下游流向？',drainageConnection:'是否已確認與雨水下水道、排水路、箱涵、溪流或其他排水體系連通？',
      permit:'稽查當時排放許可狀態為何？',
      permitCheckMode:'許可／水措內容差異檢核｜本次要採哪一種方式？',
      permitQuickDifference:'快速確認｜本次有無發現與既有許可／水措內容不同之設備、管線、排放口、處理方式或操作情形？',
      permitReferenceStatus:'詳細檢核｜本次可取得的核准水措／許可資料完整程度？',
      permitSourceCompare:'廢（污）水來源與核准內容是否一致？',
      permitProcessCompare:'收集／處理流程與核准內容是否一致？',
      permitOutletCompare:'排放口／納管口與核准內容是否一致？',
      permitDestinationCompare:'最終去向／處理方式與核准內容是否一致？',
      permitFacilityCompare:'設施、槽體及管線與核准內容是否一致？',
      permitOperationCompare:'操作方式／登記事項與核准內容是否一致？',
      permitMismatchDetail:'差異內容摘要（只記本案相關差異）',
      permitCheckSummary:'許可／水措差異檢核結果',permitCheckMissing:'本模組尚缺查證事項',
      storageActivity:'是否已確認現場實際以貯留方式處理廢水？',storagePermit:'貯留許可狀態為何？',storageMismatch:'有有效貯留許可時，現場是否已確認未依登記事項運作？',
      sampleTaken:'是否已有可供本案判斷之放流水採樣？',sampleRepresentative:'採樣是否可代表該股放流水？',sampleBeforeReceivingWater:'採樣位置是否位於廢（污）水進入承受水體前？',
      applicableStandard:'是否已確認本案適用之放流水標準？',labResult:'是否已有有效檢測結果？',effluentExceeded:'檢測結果是否超過適用放流水標準？',
      approvedRoute:'是否已確認核准登記之收集、處理流程與放流／納管出口？',actualRoute:'是否已確認現場實際水路？',bypass:'是否已確認實際水路避開核准收集、處理流程，或由非核准出口排放？',bypassEmergency:'該繞流是否屬法定急迫搶救例外，且已於規定期限內通知？',
      dilutionObserved:'現場是否發現廢水有稀釋行為？',requiresTreatment:'原廢（污）水是否須經處理始能符合管制標準？',mixedCleanWater:'所混入的水是否無需處理即能符合標準？',dilutionPermit:'稀釋許可狀態為何？',dilutionMismatch:'有有效稀釋許可時，現場是否已確認未依登記事項運作？',dilutionEmergency:'該稀釋是否屬法定急迫搶救例外，且已於規定期限內通知？',
      treatmentApplicable:'現場是否設有廢（污）水（前）處理設施，且本案需檢視其功能與操作？',treatmentFunction:'處理設施是否具備足夠功能與設備？',treatmentOperating:'處理設施是否維持正常操作？',
      article18SpecificDuty:'是否已依水措管理相關規定確認本案存在某項具體水措義務？',article18Noncompliance:'是否已確認現場不符合該項具體水措義務？',

      article28Scenario:'是否發現輸送或貯存設備有疏漏、溢流、滲漏至水體之虞，或已發生疏漏？',
      transportStorageEquipment:'是否已確認涉案設施屬輸送或貯存設備？',leakCause:'疏漏／排放原因為何？',leakRisk:'是否已確認有疏漏污染物或廢（污）水至水體之虞？',maintenancePrevention:'事業是否已採取必要維護及防範措施？',leakPollutedWater:'是否已確認疏漏已致污染水體？',emergencyAction:'污染／重大危害發生後，是否已立即採取緊急應變措施？',threeHourNotice:'是否於法定期限內通知當地主管機關？',
      severeHazard:'本案排放是否已確認有嚴重危害人體健康、農漁業生產或飲用水水源之虞？',

      soilPermit:'排放於土壤時，是否具有有效土壤處理許可？',groundwaterBody:'是否已確認廢（污）水實際進入地下水體／地下含水層？',
      dumping:'是否已確認存在污染物「棄置」行為？',controlZone:'行為地點是否已確認位於水污染管制區？',designatedRange:'是否已依公告確認行為位於指定水體或其沿岸規定距離內？',

      reportingDuty:'是否已依適用規定確認本案具有申報義務？',reportingNoncompliance:'是否已確認未依規定格式、內容、頻率或方式完成申報？',reportedMismatch:'申報資料／業務文書與客觀資料是否存在重大不一致？',falseReportRecord:'是否已確認存在不實申報或業務文書虛偽記載？',knowingFalse:'是否已有證據支持行為人「明知不實」仍申報／記載？',
      inspectionBasis:'本次是否已確認稽查人員攜帶證明文件並就法定事項執行查證？',obstruction:'是否已確認受檢者有規避、妨礙或拒絕查證行為？',

      facilityFailure:'是否已確認廢（污）水處理設施發生故障，並主張／需檢核法定故障例外？',a59Repair:'是否立即修復或啟用備份裝置，並採減產、停產或其他應變？',a59Record:'是否立即記錄故障並依規定報備，且留存報備人員資料？',a59Recover:'是否於法定期限內恢復正常，或恢復前持續減少／停止生產服務？',a59Report5:'是否於法定期限內提出書面報告？',a59Causation:'故障與所違反之放流水標準是否具有直接關係？',a59SixMonths:'是否符合故障例外之重複發生限制？',
      surfacePollutionEvent:'是否已確認地面水體發生污染事件？',polluterIdentified:'是否已確認污染行為人？',investigationComplete:'最終檢核｜本次案件需要查證的事項是否已完成？',

      behaviorDate:'行為發生日期（用於法規版本；不明可留空）',inspectionDate:'稽查日期（案件紀錄）',rulePackVersion:'Water Rule Pack 版本',coreLawVersion:'母法適用版本',measureRulePackVersion:'Water Measure Rule Pack 版本',measureLawVersion:'水措管理辦法適用版本',permitRulePackVersion:'Water Permit Rule Pack 版本',permitLawVersion:'許可審查辦法適用版本',standardRulePackVersion:'Water Standard Rule Pack 版本',standardLawVersion:'放流水標準適用版本',standardRoute:'放流水標準附表路由',localRulePackVersion:'Water Local Rule Pack 版本',localRuleStatus:'地方加嚴標準適用提醒',lawVersion:'子法版本／施行日判定（相容顯示）',
      sublawSection:'子法核心檢核',
      sublawApprovedMeasures:'水措管理辦法§4｜是否已取得並確認本案核准水措內容？',sublawOperationMatches:'現場製程、收集、處理、管線、槽體及最終去向是否與核准水措一致？',
      sublawRainCombined:'水措管理辦法§7｜是否發現廢（污）水與雨水合流收集？',sublawRainException:'如有合流，是否已有主管機關核准之既設技術困難例外及防止直接排放設施？',
      sublawRunoffApplicable:'水措管理辦法§8｜是否已確認屬第8條所列戶外貯存／堆置物質而應收集處理逕流廢水？',sublawRunoffCompliant:'應收集處理之逕流廢水是否已依規定收集處理？',
      sublawOutsourceStorage:'水措管理辦法§31｜採委託處理前，是否已依規定設置廢（污）水處理設施或貯留設施？',sublawOutsourceMeter:'委託／受託管線或溝渠進、出流水端水量計測是否符合規定？',
      sublawStorageMeter:'水措管理辦法§39｜貯留設施水量計測是否符合規定？',sublawStorageRecords:'是否有逐日逐批記錄貯留時間、輸運方式、水量與處理水量，並依規定保存？',sublawStorageCapacity:'水措管理辦法§40｜貯留設施容量是否足以因應緊急應變？',
      sublawReuseStandard:'水措管理辦法§41｜回收使用水質是否符合要求，或已確認屬法定例外？',sublawReuseSampling:'依法應設回收使用前採樣口者，採樣口是否符合規定？',
      sublawOutletLocation:'水措管理辦法§53｜放流口位置是否符合規定？',sublawOutletAccess:'採樣道路及一平方公尺以上採樣平台是否符合規定？',sublawOutletMeter:'放流水量計測設施是否符合規定？',sublawOutletSign:'放流口告示牌及座標標示是否符合規定？',sublawOutletSampling:'放流口是否可供直接採樣，且無未核准妨礙採樣設施？',sublawOutletManhole:'放流口是否為陰井？',sublawOutletMixing:'陰井水質是否充分均勻混合？',
      sublawMeterApplicable:'水措管理辦法§65｜本案是否有依規定設置之累計型水量計測設施需檢核？',sublawMeterCalibration:'水量計校正、維護頻率與紀錄是否符合規定？',
      sublawReportingEvidenceMismatch:'水措管理辦法§89-1｜申報資料是否已確認與單據、檢測報告、紀錄或照片不一致？',sublawReportingSiteMismatch:'申報資料是否已確認與現場製程、用電、加藥、水量或操作參數不一致？',
      sublawOverview:'子法核心研判總覽',

      overview:'多條文研判總覽',article13:'水措計畫',article14:'排放許可',article7:'放流水標準',article18:'水污染防治措施',article181:'異常排放／處理設施',article20:'貯留／稀釋',article22:'申報',article35:'疑似不實申報／虛偽紀錄',article26:'查證／拒檢',article27:'重大危害',article28:'輸送／貯存設備疏漏',article32:'土壤／地下水體',article30:'污染物棄置',article59:'設備故障例外',article71:'污染清除後續',finalConclusion:'全案最終研判',missing:'缺少／不成立要件',next:'下一步查證建議'
    }
  };
})(window);
