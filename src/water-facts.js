(function(root){
  'use strict';
  const tri=value=>value==='yes'?'yes':value==='no'?'no':'unknown';
  const inverseTri=value=>value==='yes'?'no':value==='no'?'yes':'unknown';
  const knownPollutants=['sludge','acidAlkaliWasteLiquid','garbage','constructionWaste','waterFertilizer','otherPollutant'];
  function sourceTypes(input){
    const values=Array.isArray(input.waterSourceTypes)?input.waterSourceTypes.filter(Boolean):(input.waterSourceType?[input.waterSourceType]:[]);
    const unique=[...new Set(values)];
    return unique.length>1?unique.filter(value=>value!=='unknown'):unique;
  }
  function matterType(input){
    if(input.waterMatterType)return input.waterMatterType;
    if(input.waterWastewaterStatus)return 'wastewater';
    return '';
  }
  function subjectIsBusiness(input){
    if(input.waterSubjectType==='business')return tri(input.waterSubjectConfirmed);
    if(['sewerSystem','buildingSewage','nonBusiness'].includes(input.waterSubjectType))return 'no';
    return 'unknown';
  }
  function article7Subject(input){
    if(input.waterSubjectType==='business')return tri(input.waterSubjectConfirmed);
    if(['sewerSystem','buildingSewage'].includes(input.waterSubjectType))return 'yes';
    if(input.waterSubjectType==='nonBusiness')return 'no';
    return 'unknown';
  }
  function businessOrSewer(input){
    if(input.waterSubjectType==='business')return tri(input.waterSubjectConfirmed);
    if(input.waterSubjectType==='sewerSystem')return 'yes';
    if(['buildingSewage','nonBusiness'].includes(input.waterSubjectType))return 'no';
    return 'unknown';
  }
  function article26Target(input){
    if(input.waterSubjectType==='business')return tri(input.waterSubjectConfirmed);
    if(['sewerSystem','buildingSewage'].includes(input.waterSubjectType))return 'yes';
    if(input.waterSubjectType==='nonBusiness')return 'no';
    return 'unknown';
  }
  function surface(input){
    if(input.waterDestination&&input.waterDestination!=='surfaceWater'&&input.waterDestination!=='unknown')return 'no';
    if(input.waterDestination==='surfaceWater')return tri(input.waterSurfaceWaterConfirmed);
    return 'unknown';
  }
  function noPermit(input,key){
    const value=input[key];
    if(['none','expired'].includes(value))return 'yes';
    if(value==='valid')return 'no';
    return 'unknown';
  }
  function validPermit(input,key){
    const value=input[key];
    if(value==='valid')return 'yes';
    if(['none','expired'].includes(value))return 'no';
    return 'unknown';
  }
  function noApproval(input,key){
    const value=input[key];
    if(['none','notApproved'].includes(value))return 'yes';
    if(value==='approved')return 'no';
    return 'unknown';
  }
  function treatmentNonCompliant(input){
    const functionOk=tri(input.waterTreatmentFunctionSufficient);
    const operatingOk=tri(input.waterTreatmentOperatingNormally);
    if(functionOk==='no'||operatingOk==='no')return 'yes';
    if(functionOk==='yes'&&operatingOk==='yes')return 'no';
    return 'unknown';
  }
  function article28Matter(input){
    const type=matterType(input);
    if(type==='wastewater')return tri(input.waterWastewaterStatus);
    if(knownPollutants.includes(type))return 'yes';
    return 'unknown';
  }
  function article30Matter(input){
    const type=matterType(input);
    if(knownPollutants.includes(type))return 'yes';
    if(type==='wastewater')return 'no';
    return 'unknown';
  }
  function equipmentLeakEligible(input){
    const scenario=tri(input.waterArticle28Scenario);
    if(scenario==='no')return 'no';
    if(scenario==='unknown')return 'unknown';
    if(input.waterLeakCause==='humanDischarge')return 'no';
    if(['tankFailure','pipeFailure','overflow','levelFailure','otherEquipmentFailure'].includes(input.waterLeakCause))return 'yes';
    return 'unknown';
  }
  function soilDischarge(input){
    if(input.waterDestination==='soil')return tri(input.waterActualDischarge);
    if(input.waterDestination&&input.waterDestination!=='unknown')return 'no';
    return 'unknown';
  }
  function groundwaterInjection(input){
    if(input.waterDestination==='groundwater')return tri(input.waterGroundwaterBodyConfirmed);
    if(input.waterDestination&&input.waterDestination!=='unknown')return 'no';
    return 'unknown';
  }
  function storageActivity(input){
    if(input.waterDestination==='storage')return tri(input.waterStorageActivityConfirmed);
    if(input.waterDestination&&input.waterDestination!=='unknown')return 'no';
    return 'unknown';
  }
  function article13NoPlan(input){
    return noApproval(input,'waterMeasuresPlanApproval');
  }
  function build(input={}){
    const type=matterType(input);
    return {
      subjectIsBusiness:subjectIsBusiness(input),
      article7SubjectEligible:article7Subject(input),
      article181SubjectEligible:businessOrSewer(input),
      article20SubjectEligible:businessOrSewer(input),
      article22SubjectEligible:businessOrSewer(input),
      article27SubjectEligible:businessOrSewer(input),
      article28SubjectEligible:businessOrSewer(input),
      article26TargetEligible:article26Target(input),
      matterType:type,
      wastewaterConfirmed:tri(input.waterWastewaterStatus),
      article28MatterEligible:article28Matter(input),
      article30MatterEligible:article30Matter(input),
      actualDischargeConfirmed:tri(input.waterActualDischarge),
      surfaceWaterConfirmed:surface(input),
      noValidDischargePermit:noPermit(input,'waterDischargePermit'),

      article13DesignatedSubjectConfirmed:tri(input.waterArticle13DesignatedSubjectConfirmed),
      article13NewOrChangeConfirmed:tri(input.waterArticle13NewOrChangeConfirmed),
      noApprovedMeasuresPlanBeforeAction:article13NoPlan(input),

      article18SpecificDutyConfirmed:tri(input.waterArticle18SpecificDutyConfirmed),
      article18NoncomplianceConfirmed:tri(input.waterArticle18NoncomplianceConfirmed),

      sampleTaken:tri(input.waterSampleTaken),
      sampleRepresentative:tri(input.waterSampleRepresentative),
      sampleBeforeReceivingWater:tri(input.waterSampleBeforeReceivingWater),
      applicableStandardConfirmed:tri(input.waterApplicableStandardConfirmed),
      labResultAvailable:tri(input.waterLabResultAvailable),
      effluentExceeded:tri(input.waterEffluentExceeded),
      approvedRouteConfirmed:tri(input.waterApprovedRouteConfirmed),
      actualRouteConfirmed:tri(input.waterActualRouteConfirmed),
      bypassConfirmed:tri(input.waterBypassConfirmed),
      noBypassEmergencyException:inverseTri(input.waterBypassEmergencyException),
      requiresTreatmentToMeetStandard:tri(input.waterRequiresTreatmentToMeetStandard),
      dilutionObserved:tri(input.waterDilutionObserved),
      mixedWithNoTreatmentNeededWater:tri(input.waterMixedWithNoTreatmentNeededWater),
      noValidDilutionPermit:noPermit(input,'waterDilutionPermit'),
      validDilutionPermitConfirmed:validPermit(input,'waterDilutionPermit'),
      dilutionRegistrationMismatch:tri(input.waterDilutionRegistrationMismatch),
      noDilutionEmergencyException:inverseTri(input.waterDilutionEmergencyException),
      treatmentFacilityApplicable:tri(input.waterTreatmentFacilityApplicable),
      treatmentFacilityNonCompliant:treatmentNonCompliant(input),

      storageActivityConfirmed:storageActivity(input),
      noValidStoragePermit:noPermit(input,'waterStoragePermit'),
      validStoragePermitConfirmed:validPermit(input,'waterStoragePermit'),
      storageRegistrationMismatch:tri(input.waterStorageRegistrationMismatch),

      article22ReportingDutyConfirmed:tri(input.waterArticle22ReportingDutyConfirmed),
      article22ReportingNoncomplianceConfirmed:tri(input.waterArticle22ReportingNoncomplianceConfirmed),
      falseReportOrBusinessRecordConfirmed:tri(input.waterFalseReportOrBusinessRecordConfirmed),
      knowingFalseEvidenceConfirmed:tri(input.waterKnowingFalseEvidenceConfirmed),

      article26InspectionBasisConfirmed:tri(input.waterArticle26InspectionBasisConfirmed),
      article26ObstructionConfirmed:tri(input.waterArticle26ObstructionConfirmed),

      severeHazardRiskConfirmed:tri(input.waterSevereHazardRiskConfirmed),
      noImmediateEmergencyAction:inverseTri(input.waterEmergencyActionTaken),
      noThreeHourNotice:inverseTri(input.waterThreeHourNotice),

      transportStorageEquipmentConfirmed:tri(input.waterTransportStorageEquipmentConfirmed),
      equipmentLeakScenarioEligible:equipmentLeakEligible(input),
      leakRiskToWaterBodyConfirmed:tri(input.waterLeakRiskToWaterBodyConfirmed),
      noMaintenancePrevention:inverseTri(input.waterMaintenancePreventionTaken),
      leakPollutedWaterBodyConfirmed:tri(input.waterLeakPollutedWaterBody),

      controlZoneConfirmed:tri(input.waterControlZoneConfirmed),
      dumpingConfirmed:tri(input.waterDumpingConfirmed),
      designatedWaterRangeConfirmed:tri(input.waterDesignatedWaterRangeConfirmed),

      dischargedToSoilConfirmed:soilDischarge(input),
      noValidSoilTreatmentPermit:noPermit(input,'waterSoilTreatmentPermit'),
      injectedIntoGroundwaterBodyConfirmed:groundwaterInjection(input),

      facilityFailureConfirmed:tri(input.waterFacilityFailureConfirmed),
      a59ImmediateRepairAndResponse:tri(input.waterA59ImmediateRepairAndResponse),
      a59ImmediateRecordAndReport:tri(input.waterA59ImmediateRecordAndReport),
      a59RecoveredWithin24Hours:tri(input.waterA59RecoveredWithin24Hours),
      a59WrittenReportWithin5Days:tri(input.waterA59WrittenReportWithin5Days),
      a59DirectCausation:tri(input.waterA59DirectCausation),
      a59NotSameFailureWithin6Months:tri(input.waterA59NotSameFailureWithin6Months),

      surfaceWaterPollutionEventConfirmed:tri(input.waterSurfaceWaterPollutionEventConfirmed),
      polluterIdentified:tri(input.waterPolluterIdentified),

      subjectType:input.waterSubjectType||'',sourceTypes:sourceTypes(input),sourceType:sourceTypes(input)[0]||'',destination:input.waterDestination||'',surfaceType:input.waterSurfaceType||'',
      drainageFunction:tri(input.waterDrainageFunctionConfirmed),downstreamConfirmed:tri(input.waterDownstreamConfirmed),drainageConnection:tri(input.waterDrainageConnectionConfirmed),
      dischargePermit:input.waterDischargePermit||'',storagePermit:input.waterStoragePermit||'',dilutionPermit:input.waterDilutionPermit||'',soilTreatmentPermit:input.waterSoilTreatmentPermit||'',leakCause:input.waterLeakCause||''
    };
  }
  root.WaterFacts={build};
})(typeof window==='undefined'?globalThis:window);
