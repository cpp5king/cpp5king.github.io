(function(root){
  'use strict';
  const PROVENANCE='PP-IA-41-7F3C9A21';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const now=()=>new Date().toISOString();
  const legacySubject={business:'business',sewerSystem:'sewer_system',buildingSewage:'building_sewage_facility',nonBusiness:'other',unknown:'unknown'};
  const legacyDestination={surfaceWater:'surface_water_body',sewer:'sewer_system',storage:'storage',reuse:'recycle',outsourced:'entrusted_treatment',soil:'soil',groundwater:'groundwater',unknown:'unknown'};

  function empty(input={}){
    return {
      schemaVersion:'2.0',
      provenance:PROVENANCE,
      session:{id:input.waterSessionId||'WATER-'+Date.now(),module:'water',incidentDate:input.waterInspectionDate||'',startedAt:input.waterSessionStartedAt||'',completedAt:null,status:'active'},
      workflow:{state:'initial_observation',returnState:null,history:[]},
      facts:[],statements:[],actions:[],evidence:[],points:[],flows:[],premises:[],subjects:[],relations:[],screenings:[],samplings:[],incidents:[],unknowns:[],conflicts:[],derivedFacts:[],inferences:[],recommendations:[],timeline:[]
    };
  }

  function nextId(prefix,list){return prefix+String((list||[]).length+1).padStart(3,'0');}
  function addFact(session,key,value,opts={}){
    if(value===undefined||value===null||value==='')return null;
    const f={id:opts.id||nextId('F',session.facts),key,category:opts.category||'observation',value,status:opts.status||'confirmed',temporalMode:opts.temporalMode||'static',description:opts.description||'',source:opts.source||{type:'legacy_form',ref:null},locationRef:opts.locationRef||null,incidentRefs:opts.incidentRefs||[],evidenceRefs:opts.evidenceRefs||[],createdAt:opts.createdAt||session.session.startedAt||now(),supersedes:opts.supersedes||null,correctionReason:opts.correctionReason||null};
    session.facts.push(f);return f;
  }
  function addUnknown(session,key,opts={}){
    const u={id:opts.id||nextId('U',session.unknowns),key,status:opts.status||'pending',reason:opts.reason||'',context:opts.context||{},createdAt:opts.createdAt||session.session.startedAt||now()};session.unknowns.push(u);return u;
  }
  function copyArray(input,key){return Array.isArray(input[key])?clone(input[key]):[];}

  function mapTri(value){return value==='yes'?'yes':value==='no'?'no':value==='unknown'?'unknown':'';}
  function mapPermit(value){
    if(value==='valid')return 'valid';
    if(value==='expired')return 'expired';
    if(value==='none')return 'not_obtained';
    if(value==='notFound')return 'not_found';
    if(value==='revoked')return 'revoked';
    if(value==='notRequired')return 'not_required';
    if(value==='unknown')return 'unknown';
    return '';
  }
  function mapCompare(value){return value==='mismatch'?'yes':value==='match'?'no':value==='unknown'?'unknown':'';}

  function fromLegacy(input={}){
    if(input.waterV2Session&&input.waterV2Session.schemaVersion==='2.0')return normalize(clone(input.waterV2Session));
    const s=empty(input);
    s.points=copyArray(input,'waterV2Points');
    s.flows=copyArray(input,'waterV2Flows');
    s.premises=copyArray(input,'waterV2Premises');
    s.subjects=copyArray(input,'waterV2Subjects');
    s.relations=copyArray(input,'waterV2Relations');
    s.statements=copyArray(input,'waterV2Statements');
    s.actions=copyArray(input,'waterV2Actions');
    s.evidence=copyArray(input,'waterV2Evidence');
    s.screenings=copyArray(input,'waterV2Screenings');
    s.samplings=copyArray(input,'waterV2Samplings');
    s.incidents=copyArray(input,'waterV2Incidents');
    s.unknowns=copyArray(input,'waterV2Unknowns');
    s.conflicts=copyArray(input,'waterV2Conflicts');

    const subject=legacySubject[input.waterSubjectType]||'';
    if(subject)addFact(s,'water.subject.type',subject,{category:'record'});
    const subjectConfirmed=mapTri(input.waterSubjectConfirmed);
    if(subjectConfirmed)addFact(s,'water.subject.identity_confirmed',subjectConfirmed,{category:'record'});
    if(input.waterRegulatedQueryResult)addFact(s,'water.regulated.query_result',input.waterRegulatedQueryResult,{category:'record'});
    if(input.waterIndustryType)addFact(s,'water.subject.activity_type',input.waterIndustryType,{category:'record'});
    if(input.waterRegulatoryScaleStatus)addFact(s,'water.subject.regulatory_scale_status',input.waterRegulatoryScaleStatus,{category:'record'});

    if(input.waterMatterType==='wastewater')addFact(s,'water.liquid.classification',input.waterWastewaterStatus==='no'?'other_water':'wastewater');
    else if(input.waterMatterType&&input.waterMatterType!=='unknown')addFact(s,'water.liquid.classification','other_water');
    if(input.waterWastewaterStatus)addFact(s,'water.wastewater.generated',mapTri(input.waterWastewaterStatus));
    if(input.waterActualDischarge)addFact(s,'water.discharge.occurred',mapTri(input.waterActualDischarge),{temporalMode:'stateful'});
    if(input.waterDischargeState)addFact(s,'water.discharge.state',input.waterDischargeState,{temporalMode:'stateful'});
    const dest=legacyDestination[input.waterDestination]||'';
    if(dest)addFact(s,'water.discharge.destination_type',dest);
    if(input.waterSurfaceWaterConfirmed)addFact(s,'water.destination.surface_water_confirmed',mapTri(input.waterSurfaceWaterConfirmed));
    if(input.waterDownstreamConfirmed)addFact(s,'water.flow.destination_confirmed',mapTri(input.waterDownstreamConfirmed));
    if(input.waterDrainageConnectionConfirmed)addFact(s,'water.premises.flow_connection_confirmed',mapTri(input.waterDrainageConnectionConfirmed));
    if(input.fieldUnknownSourceConnectionConfirmed)addFact(s,'water.premises.relation_status',input.fieldUnknownSourceConnectionConfirmed==='yes'?'confirmed_relation':input.fieldUnknownSourceConnectionConfirmed==='no'?'unresolved':'unknown');

    const dischargePermit=mapPermit(input.waterDischargePermit);
    if(dischargePermit){
      addFact(s,'water.permit.discharge_status',dischargePermit,{category:'record'});
      if(input.waterPermitDischargeRequired)addFact(s,'water.permit.discharge_required',mapTri(input.waterPermitDischargeRequired),{category:'record'});
      else if(['valid','expired','not_obtained','revoked'].includes(dischargePermit))addFact(s,'water.permit.discharge_required','yes',{category:'derived'});
    }
    if(input.waterPermitDifferenceStatus)addFact(s,'water.permit.review_status',input.waterPermitDifferenceStatus,{category:'record'});
    const compareMap={waterPermitSourceCompare:'water.permit.source_difference',waterPermitProcessCompare:'water.permit.process_difference',waterPermitOutletCompare:'water.permit.discharge_location_difference',waterPermitDestinationCompare:'water.permit.route_difference',waterPermitFacilityCompare:'water.permit.treatment_difference'};
    for(const [legacy,key] of Object.entries(compareMap)){
      const value=mapCompare(input[legacy]);if(value)addFact(s,key,value,{category:'record'});
    }

    if(input.waterTreatmentFacilityApplicable)addFact(s,'water.treatment.present',mapTri(input.waterTreatmentFacilityApplicable));
    if(input.waterTreatmentOperatingNormally)addFact(s,'water.treatment.operating',input.waterTreatmentOperatingNormally==='yes'?'operating':input.waterTreatmentOperatingNormally==='no'?'not_operating':'unknown',{temporalMode:'stateful'});
    if(input.waterFacilityFailureConfirmed)addFact(s,'water.treatment.failure_present',mapTri(input.waterFacilityFailureConfirmed),{temporalMode:'event'});
    if(input.waterFacilityFailureHours!==undefined&&input.waterFacilityFailureHours!=='')addFact(s,'water.treatment.failure_hours',Number(input.waterFacilityFailureHours),{category:'measurement',temporalMode:'event'});

    const storagePermit=mapPermit(input.waterStoragePermit);if(storagePermit)addFact(s,'water.storage.permit_status',storagePermit,{category:'record'});
    if(input.waterDestination==='storage')addFact(s,'water.storage.present','yes');
    if(input.waterStorageRegistrationMismatch)addFact(s,'water.storage.registration_difference',mapTri(input.waterStorageRegistrationMismatch),{category:'record'});
    const dilutionPermit=mapPermit(input.waterDilutionPermit);if(dilutionPermit)addFact(s,'water.dilution.permit_status',dilutionPermit,{category:'record'});
    if(input.waterDilutionObserved)addFact(s,'water.dilution.mixing_present',mapTri(input.waterDilutionObserved));

    if(input.waterTransportStorageEquipmentConfirmed)addFact(s,'water.leak.transport_storage_equipment',mapTri(input.waterTransportStorageEquipmentConfirmed));
    if(input.waterArticle28Scenario)addFact(s,'water.leak.present',mapTri(input.waterArticle28Scenario),{temporalMode:'event'});
    if(input.waterLeakRiskToWaterBodyConfirmed)addFact(s,'water.leak.risk_to_water_body',mapTri(input.waterLeakRiskToWaterBodyConfirmed));
    if(input.waterMaintenancePreventionTaken)addFact(s,'water.leak.preventive_measure_present',mapTri(input.waterMaintenancePreventionTaken));
    if(input.waterLeakPollutedWaterBody)addFact(s,'water.leak.reached_water_body',mapTri(input.waterLeakPollutedWaterBody),{temporalMode:'event'});
    if(input.waterEmergencyActionTaken)addFact(s,'water.emergency.response_performed',mapTri(input.waterEmergencyActionTaken),{category:'action',temporalMode:'event'});
    if(input.waterEmergencyIncidentTime)addFact(s,'water.emergency.incident_time',input.waterEmergencyIncidentTime,{category:'record',temporalMode:'event'});
    if(input.waterEmergencyNotificationTime)addFact(s,'water.emergency.notification_time',input.waterEmergencyNotificationTime,{category:'record',temporalMode:'event'});
    if(input.waterThreeHourNotice)addFact(s,'water.emergency.notice_within_3h',mapTri(input.waterThreeHourNotice),{category:'record'});

    if(input.waterControlZoneConfirmed)addFact(s,'water.control_zone.status',input.waterControlZoneConfirmed==='yes'?'inside':input.waterControlZoneConfirmed==='no'?'outside':'unknown',{category:'record'});
    if(input.waterBehaviorType)addFact(s,'water.behavior.type',input.waterBehaviorType);
    if(input.waterMatterType)addFact(s,'water.pollutant.material_type',input.waterMatterType);
    if(input.waterDesignatedWaterRangeConfirmed)addFact(s,'water.location.within_announced_distance',mapTri(input.waterDesignatedWaterRangeConfirmed),{category:'record'});
    if(input.waterDischargeAffectsWaterQuality)addFact(s,'water.discharge.affects_water_quality',input.waterDischargeAffectsWaterQuality,{category:'derived'});

    if(input.waterDestination==='soil')addFact(s,'water.soil.contact_mode',input.waterSoilContactMode||'unknown');
    const soilPermit=mapPermit(input.waterSoilTreatmentPermit);if(soilPermit)addFact(s,'water.soil_treatment.permit_status',soilPermit,{category:'record'});
    if(input.waterDestination==='groundwater')addFact(s,'water.groundwater.injection_confirmed',mapTri(input.waterGroundwaterBodyConfirmed));

    if(input.waterSampleTaken)addFact(s,'water.sampling.performed',mapTri(input.waterSampleTaken),{category:'action'});
    if(input.waterLabResultAvailable)addFact(s,'water.sampling.formal_result_available',mapTri(input.waterLabResultAvailable),{category:'measurement'});
    if(input.waterApplicableStandardConfirmed)addFact(s,'water.sampling.applicable_standard_confirmed',mapTri(input.waterApplicableStandardConfirmed),{category:'record'});
    if(input.waterEffluentExceeded)addFact(s,'water.sampling.standard_exceeded',mapTri(input.waterEffluentExceeded),{category:'measurement'});
    if(input.waterSampleRepresentative)addFact(s,'water.sampling.representative',mapTri(input.waterSampleRepresentative),{category:'measurement'});
    if(input.waterSampleBeforeReceivingWater)addFact(s,'water.sampling.before_receiving_water',mapTri(input.waterSampleBeforeReceivingWater),{category:'measurement'});

    if(input.fieldUnknownWaterObserved)addFact(s,'water.observation.water_present',mapTri(input.fieldUnknownWaterObserved));
    if(Array.isArray(input.fieldUnknownWaterSigns)&&input.fieldUnknownWaterSigns.length){
      const map={color:'water.observation.color_abnormal',odor:'water.observation.odor_present',foam:'water.observation.foam_present',turbid:'water.observation.turbidity_abnormal',continuous:'water.observation.active_discharge'};
      for(const sign of input.fieldUnknownWaterSigns){if(map[sign])addFact(s,map[sign],'yes',{temporalMode:sign==='continuous'?'stateful':'static'});}
    }
    if(input.waterObservationOverallStatus)addFact(s,'water.observation.overall_status',input.waterObservationOverallStatus);

    return normalize(s);
  }

  function normalize(session){
    const out=session||empty();
    const arrays=['facts','statements','actions','evidence','points','flows','premises','subjects','relations','screenings','samplings','incidents','unknowns','conflicts','derivedFacts','inferences','recommendations','timeline'];
    arrays.forEach(k=>{if(!Array.isArray(out[k]))out[k]=[];});
    if(!out.workflow)out.workflow={state:'initial_observation',returnState:null,history:[]};
    if(!Array.isArray(out.workflow.history))out.workflow.history=[];
    if(!out.session)out.session={id:'WATER-'+Date.now(),module:'water',incidentDate:'',startedAt:'',completedAt:null,status:'active'};
    out.schemaVersion='2.0';out.provenance=PROVENANCE;
    return out;
  }

  function factIndex(session){
    const index={};
    for(const f of (session&&session.facts)||[]){if(f.status==='superseded'||f.status==='retracted')continue;index[f.key]=f;}
    return index;
  }
  function value(session,key){const f=factIndex(session)[key];return f?f.value:undefined;}

  root.WaterV2Session={empty,fromLegacy,normalize,addFact,addUnknown,factIndex,value,provenance:PROVENANCE};
})(typeof window==='undefined'?globalThis:window);
