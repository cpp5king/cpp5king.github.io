(function(root){
  'use strict';
  const R=root.WATER_V2_RULES=root.WATER_V2_RULES||{};
  const e=(id,label)=>({id,label});
  const rule=(id,title,legalBasis,elements)=>({id,version:'1.0',title,legalBasis,elements});

  R.article14NoPermitGround=rule(
    'WATER-V2-A14-NO-PERMIT-GROUND','第14條第1項－無有效排放許可而排放至地面水體','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_ground','實際處理方式包含排放至地面水體')
    ]
  );
  R.article14PermitMismatch=rule(
    'WATER-V2-A14-PERMIT-MISMATCH','第14條第1項－排放許可登記事項差異','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_discharge','核對類型為排放許可／簡易排放許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );
  R.article14RouteMismatch=rule(
    'WATER-V2-A14-ROUTE-MISMATCH','第14條第1項－排放路徑與排放許可登記事項差異','水污染防治法第14條第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_discharge','核對類型為排放許可／簡易排放許可'),
      e('actual_discharge','現場有實際排放'),
      e('route_mismatch','現場排放位置／路徑與核准內容不一致'),
      e('approved_final_outlet_confirmed','已確認不是由非核准最終放流口／納管口排出'),
      e('destination_ground','最終去向為地面水體')
    ]
  );

  R.article18Meter=rule(
    'WATER-V2-A18-METER','第18條－水量計測設施義務','水污染防治法第18條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('meter_required','依法應設水量計測'),
      e('meter_noncompliance','水量計測未設置或未正常計量')
    ]
  );
  R.article18Record=rule(
    'WATER-V2-A18-RECORD','第18條－操作／管理紀錄義務','水污染防治法第18條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('record_required','依法應有操作／管理紀錄'),
      e('record_noncompliance','紀錄無法提供或不足以查核')
    ]
  );

  R.article181Bypass=rule(
    'WATER-V2-A181-BYPASS','第18條之1第1項－非核准最終出口','水污染防治法第18條之1第1項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('non_approved_final_outlet','由非核准最終放流口／非核准納管口排出')
    ]
  );
  R.article181Dilution=rule(
    'WATER-V2-A181-DILUTION','第18條之1第2項－禁止稀釋方向','水污染防治法第18條之1第2項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('dilution_needs_treatment','廢污水需處理才能符合標準'),
      e('mixed_water','排放／納管前與其他水混合'),
      e('mixed_water_clean','混入水無需處理即可符合標準'),
      e('mixed_before_discharge','混合發生於排放／納管前')
    ]
  );
  R.article181Treatment=rule(
    'WATER-V2-A181-TREATMENT','第18條之1第4項－處理設施未維持正常操作','水污染防治法第18條之1第4項',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('treatment_needed','現場有廢污水需要處理'),
      e('treatment_should_operate','處理設施當時應運轉'),
      e('treatment_not_running','處理設施未正常運轉'),
      e('no_alternative_treatment','未記錄其他替代處理方式')
    ]
  );

  R.article20NoPermitStorage=rule(
    'WATER-V2-A20-NO-PERMIT-STORAGE','第20條－無有效許可而採貯留','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_storage','實際處理方式包含貯留')
    ]
  );
  R.article20NoPermitDilution=rule(
    'WATER-V2-A20-NO-PERMIT-DILUTION','第20條－無有效許可而採稀釋','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_dilution','實際處理方式包含稀釋')
    ]
  );
  R.article20StorageMismatch=rule(
    'WATER-V2-A20-STORAGE-MISMATCH','第20條－貯留許可登記事項差異','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_storage','核對類型為貯留許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );
  R.article20DilutionMismatch=rule(
    'WATER-V2-A20-DILUTION-MISMATCH','第20條－稀釋許可登記事項差異','水污染防治法第20條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_valid','具有有效水許可／核准資料'),
      e('permit_type_dilution','核對類型為稀釋許可'),
      e('permit_mismatch_any','B～E 存在具體許可登記事項差異')
    ]
  );

  R.article30Direction=rule(
    'WATER-V2-A30-DIRECTION','第30條－水污染管制區禁止行為方向','水污染防治法第30條方向',[
      e('subject_other','非上述管制主體'),
      e('article30_action_any','已記錄第30條相關行為'),
      e('control_zone_yes','行為地點位於公告水污染管制區')
    ]
  );

  R.article32NoPermitSoilMethod=rule(
    'WATER-V2-A32-NO-PERMIT-SOIL-METHOD','第32條－無有效許可而採土壤處理方向','水污染防治法第32條',[
      e('subject_regulated','屬事業或污水下水道系統'),
      e('permit_missing','無有效水許可／核准資料'),
      e('method_soil','實際處理方式包含土壤處理')
    ]
  );
  R.article32Groundwater=rule(
    'WATER-V2-A32-GROUNDWATER','第32條第1項－注入地下水體','水污染防治法第32條第1項',[
      e('groundwater_discharge','已記錄廢污水注入地下水體')
    ]
  );
  R.article32SoilNoException=rule(
    'WATER-V2-A32-SOIL-NO-EXCEPTION','第32條第1項－排放於土壤且不具合法例外','水污染防治法第32條第1項',[
      e('soil_discharge','已記錄廢污水排放於土壤'),
      e('soil_exception_no','已確認不具完整土壤處理合法例外')
    ]
  );
  R.article32SoilPending=rule(
    'WATER-V2-A32-SOIL-PENDING','第32條－土壤處理合法例外待確認','水污染防治法第32條方向',[
      e('soil_discharge','已記錄廢污水排放於土壤'),
      e('soil_exception_unknown','土壤處理合法例外尚未確認')
    ]
  );

  R.article25Building=rule(
    'WATER-V2-A25-BUILDING','第25條－建築物污水處理設施方向','水污染防治法第25條方向',[
      e('subject_building','管制主體為建築物污水處理設施')
    ]
  );
})(typeof window==='undefined'?globalThis:window);
