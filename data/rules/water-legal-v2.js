(function(root){
  'use strict';
  const SOURCE_ACT='https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL015486';
  const SOURCE_ANN='https://oaout.moenv.gov.tw/Law/LawContent.aspx?id=GL007083';
  const R={
    'LAW-WATER-007-01':{
      id:'LAW-WATER-007-01',title:'排放廢（污）水於地面水體應符合放流水標準',ruleType:'obligation',priority:700,source:{law:'水污染防治法',article:'7',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system','building_sewage_facility'],candidate:{anyFacts:['water.discharge.occurred','water.discharge.destination_type','water.sampling.performed']},
      prerequisites:[['factIn','water.liquid.classification',['wastewater','sewage'],'確認該股水性質'],['factEquals','water.discharge.occurred','yes','確認是否實際排放'],['factEquals','water.discharge.destination_type','surface_water_body','確認最終排放去向']],
      elements:[['formalLabResult','正式檢驗結果'],['applicableStandard','適用放流水標準'],['standardComparison','放流水標準比對']],relatedRules:[]
    },
    'LAW-WATER-014-01-A':{
      id:'LAW-WATER-014-01-A',title:'未取得有效排放許可而排放',ruleType:'obligation',priority:750,source:{law:'水污染防治法',article:'14',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system'],candidate:{anyFacts:['water.discharge.occurred','water.permit.discharge_status']},
      prerequisites:[['factIn','water.liquid.classification',['wastewater','sewage'],'確認該股水性質'],['factEquals','water.discharge.occurred','yes','確認是否實際排放'],['factEquals','water.discharge.destination_type','surface_water_body','確認最終排放去向'],['permitRequirement','本案排放許可適用性']],
      elements:[['permitStatus','water.permit.discharge_status','排放許可狀態']],relatedRules:[]
    },
    'LAW-WATER-014-01-B':{
      id:'LAW-WATER-014-01-B',title:'未依排放許可登記事項運作',ruleType:'obligation',priority:720,source:{law:'水污染防治法',article:'14',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system'],candidate:{anyFacts:['water.permit.discharge_status','water.permit.route_difference','water.permit.discharge_location_difference','water.permit.treatment_difference','water.permit.process_difference']},
      prerequisites:[['factEquals','water.permit.discharge_status','valid','確認有效排放許可'],['factEquals','water.discharge.occurred','yes','確認是否實際排放']],
      elements:[['permitComparison','許可登記事項與現場運作比對']],relatedRules:['LAW-WATER-018-1-01-C']
    },
    'LAW-WATER-018-1-01-C':{
      id:'LAW-WATER-018-1-01-C',title:'繞流排放',ruleType:'prohibition',priority:900,source:{law:'水污染防治法',article:'18-1',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system'],candidate:{anyFacts:['water.discharge.occurred'],orObjects:['flows']},
      prerequisites:[['factIn','water.liquid.classification',['wastewater','sewage'],'確認該股水性質'],['factEquals','water.discharge.occurred','yes','確認是否實際排放']],
      elements:[['authorizedFlow','核准收集／處理流程'],['actualFlow','實際水流路徑'],['flowBypass','是否繞過核准收集／處理流程']],exceptions:['LAW-WATER-018-1-03'],relatedRules:['LAW-WATER-014-01-B','LAW-WATER-007-01']
    },
    'LAW-WATER-028-01':{
      id:'LAW-WATER-028-01',title:'輸送或貯存設備疏漏之防範及緊急應變',ruleType:'obligation',priority:950,source:{law:'水污染防治法',article:'28',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system'],candidate:{anyFacts:['water.leak.present','water.leak.risk_to_water_body','water.leak.transport_storage_equipment']},
      prerequisites:[['factEquals','water.leak.transport_storage_equipment','yes','確認涉案設備是否屬輸送或貯存設備']],
      elements:[['leakRisk','疏漏至水體之虞及防範措施'],['leakIncident','疏漏致污染水體'],['emergencyResponse','立即緊急應變'],['threeHourNotice','事故後三小時通知']],relatedRules:[]
    },
    'LAW-WATER-030-05':{
      id:'LAW-WATER-030-05',title:'公告禁止足使水污染之行為',ruleType:'prohibition',priority:650,source:{law:'水污染防治法',article:'30',paragraph:'1',subparagraph:'5',url:SOURCE_ACT},subjects:['any'],candidate:{anyFacts:['water.control_zone.status','water.subject.regulatory_scale_status']},
      prerequisites:[['factEquals','water.control_zone.status','inside','確認行為地點是否位於水污染管制區']],
      elements:[['announcementMatch','依案件日期比對「禁止足使水污染行為」公告']],relatedRules:[]
    },
    'LAW-WATER-032-01-B1':{
      id:'LAW-WATER-032-01-B1',title:'未經合法土壤處理而排放廢（污）水於土壤',ruleType:'prohibition',priority:800,source:{law:'水污染防治法',article:'32',paragraph:'1',url:SOURCE_ACT},subjects:['business','sewer_system','other'],candidate:{factEquals:['water.discharge.destination_type','soil']},
      prerequisites:[['factIn','water.liquid.classification',['wastewater','sewage'],'確認該股水性質'],['factEquals','water.discharge.destination_type','soil','確認是否排放於土壤']],
      elements:[['soilContactMode','排放於土壤之行為型態'],['soilPermit','土壤處理許可狀態']],relatedRules:['LAW-WATER-028-01']
    }
  };
  const announcements={
    'NOTICE-WATER-POLLUTING-BEHAVIOR@2025-03-01':{id:'NOTICE-WATER-POLLUTING-BEHAVIOR@2025-03-01',source:{name:'禁止足使水污染行為',url:SOURCE_ANN},validFrom:'2025-03-01',validTo:null,profiles:[
      {id:'below_scale_food_fermentation_slaughter',activities:['food_manufacturing','fermentation','slaughter'],scale:'below_regulated_scale',requiresSurfaceDischarge:true,requiresWaterQualityImpact:true},
      {id:'nonregulated_named_processes',activities:['incense_manufacturing','printing','dyeing','chemical_preparation','tank_cleaning'],scale:'below_regulated_scale_or_nonregulated',requiresSurfaceDischarge:true,requiresWaterQualityImpact:true}
    ]}
  };
  root.WATER_LEGAL_V2_RULES=Object.freeze(R);
  root.WATER_LEGAL_V2_ANNOUNCEMENTS=Object.freeze(announcements);
})(typeof window==='undefined'?globalThis:window);
