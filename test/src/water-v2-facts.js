(function(root){
  'use strict';
  const VERSION='4.9.43';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  const yesNo=value=>value==='yes'?'yes':value==='no'?'no':'unknown';
  const flag=condition=>condition?'yes':'no';
  const text=value=>String(value||'').trim();

  function issueSet(inspection,code){
    const topic=inspection?.topics?.[code]||{};
    return new Set(topic.status==='doubt'&&Array.isArray(topic.doubtTypes)?topic.doubtTypes:[]);
  }

  function permitMismatchCodes(inspection){
    return ['B','C','D','E'].filter(code=>{
      const issues=issueSet(inspection,code);
      const directMismatch=code==='E'&&inspection?.details?.E?.internalFlowMatch==='no';
      return directMismatch||issues.has('permit_mismatch');
    });
  }

  function fromInspection(inspection={}){
    const B=inspection.details?.B||{};
    const D=inspection.details?.D||{};
    const E=inspection.details?.E||{};
    const F=inspection.details?.F||{};
    const bIssues=issueSet(inspection,'B'), dIssues=issueSet(inspection,'D'), eIssues=issueSet(inspection,'E'), fIssues=issueSet(inspection,'F');
    const meterRequired=B.meterRequired||((bIssues.has('meter_missing')||bIssues.has('meter_not_working'))?'yes':'');
    const meterInstalled=B.meterInstalled||(bIssues.has('meter_missing')?'no':(bIssues.has('meter_not_working')?'yes':''));
    const meterWorking=B.meterWorking||(bIssues.has('meter_not_working')?'no':'');
    const recordRequired=D.recordRequired||((dIssues.has('record_unavailable')||dIssues.has('record_incomplete'))?'yes':'');
    const recordAvailable=D.recordAvailable||(dIssues.has('record_unavailable')?'no':'');
    const recordComplete=D.recordComplete||(dIssues.has('record_incomplete')?'no':'');
    const treatmentNeeded=E.needsTreatment||(eIssues.has('treatment_not_running')?'yes':'');
    const treatmentShouldOperate=E.shouldOperate||(eIssues.has('treatment_not_running')?'yes':'');
    const treatmentActuallyRunning=E.actuallyRunning||(eIssues.has('treatment_not_running')?'no':'');
    const actualDischarge=F.actualDischarge||((fIssues.has('nonapproved_outlet')||fIssues.has('destination_unknown')||fIssues.has('soil_discharge')||fIssues.has('groundwater_discharge'))?'yes':'');
    const routeMatch=F.routeMatch||(fIssues.has('permit_mismatch')?'no':'');
    const nonApprovedFinalOutlet=F.nonApprovedFinalOutlet||(fIssues.has('nonapproved_outlet')?'yes':'');
    const derivedDestination=fIssues.has('soil_discharge')?'soil':(fIssues.has('groundwater_discharge')?'groundwater':F.destination);
    const destinationKnown=fIssues.has('destination_unknown')?'unknown':(derivedDestination&&derivedDestination!=='unknown'?'yes':F.destinationKnown);
    const other=inspection.other||{};
    const methods=Array.isArray(inspection.methods)?inspection.methods:[];
    const article30=Array.isArray(other.article30)?other.article30:[];
    const mismatchCodes=permitMismatchCodes(inspection);
    const subjectType=inspection.subjectType||'';
    const subjectRegulated=subjectType==='industry'||subjectType==='sewer';
    const fSoil=subjectRegulated&&destinationKnown==='yes'&&derivedDestination==='soil';
    const otherSoil=subjectType==='other'&&other.soilDischarge==='yes';
    const fGroundwater=subjectRegulated&&destinationKnown==='yes'&&derivedDestination==='groundwater';
    const otherGroundwater=subjectType==='other'&&other.groundwaterInjection==='yes';
    const soilStatus=fSoil?F.soilTreatmentAuthorized:(otherSoil?other.soilTreatmentAuthorized:'');

    const facts={
      subject_industry:flag(subjectType==='industry'),
      subject_sewer:flag(subjectType==='sewer'),
      subject_regulated:flag(subjectRegulated),
      subject_building:flag(subjectType==='building'),
      subject_other:flag(subjectType==='other'),

      permit_valid:flag(inspection.permitStatus==='yes'),
      permit_missing:flag(inspection.permitStatus==='no'),
      permit_unknown:flag(inspection.permitStatus==='unknown'),
      permit_type_discharge:flag(inspection.permitType==='discharge'),
      permit_type_storage:flag(inspection.permitType==='storage'),
      permit_type_dilution:flag(inspection.permitType==='dilution'),
      permit_type_soil:flag(inspection.permitType==='soil'),
      permit_type_other:flag(inspection.permitType==='other'),
      permit_type_unknown:flag(inspection.permitType==='unknown'||(inspection.permitStatus==='yes'&&!inspection.permitType)),

      method_ground:flag(methods.includes('ground')),
      method_storage:flag(methods.includes('storage')),
      method_recycle:flag(methods.includes('recycle')),
      method_outsource:flag(methods.includes('委託')),
      method_dilution:flag(methods.includes('dilution')),
      method_sewer:flag(methods.includes('sewer')),
      method_soil:flag(methods.includes('soil')),

      permit_mismatch_any:flag(mismatchCodes.length>0),

      actual_discharge:yesNo(actualDischarge),
      route_mismatch:flag(routeMatch==='no'),
      approved_final_outlet_confirmed:flag(nonApprovedFinalOutlet==='no'),
      non_approved_final_outlet:flag(nonApprovedFinalOutlet==='yes'),
      final_outlet_unknown:flag(nonApprovedFinalOutlet!=='yes'&&nonApprovedFinalOutlet!=='no'),
      destination_known:yesNo(destinationKnown),
      destination_ground:flag(destinationKnown==='yes'&&derivedDestination==='ground'),
      destination_sewer:flag(destinationKnown==='yes'&&derivedDestination==='sewer'),
      destination_soil:flag(fSoil),
      destination_groundwater:flag(fGroundwater),

      dilution_needs_treatment:yesNo(F.dilutionNeedsTreatment),
      mixed_water:yesNo(F.mixedWater),
      mixed_water_clean:yesNo(F.mixedWaterClean),
      mixed_before_discharge:yesNo(F.mixedBeforeDischarge),

      treatment_needed:yesNo(treatmentNeeded),
      treatment_should_operate:yesNo(treatmentShouldOperate),
      treatment_not_running:flag(treatmentActuallyRunning==='no'),
      no_alternative_treatment:flag(E.alternativeTreatment==='no'),
      alternative_treatment_unknown:flag(E.alternativeTreatment!=='yes'&&E.alternativeTreatment!=='no'),

      meter_required:yesNo(meterRequired),
      meter_noncompliance:flag(meterRequired==='yes'&&(meterInstalled==='no'||meterWorking==='no')),
      record_required:yesNo(recordRequired),
      record_noncompliance:flag(recordRequired==='yes'&&(recordAvailable==='no'||recordComplete==='no')),

      soil_discharge:flag(fSoil||otherSoil),
      groundwater_discharge:flag(fGroundwater||otherGroundwater),
      soil_exception_yes:flag((fSoil||otherSoil)&&soilStatus==='yes'),
      soil_exception_no:flag((fSoil||otherSoil)&&soilStatus==='no'),
      soil_exception_unknown:flag((fSoil||otherSoil)&&soilStatus!=='yes'&&soilStatus!=='no'),

      article30_action_any:flag(subjectType==='other'&&article30.length>0),
      control_zone_yes:flag(other.controlZone==='yes'),
      control_zone_no:flag(other.controlZone==='no'),
      control_zone_unknown:flag(subjectType==='other'&&article30.length>0&&other.controlZone!=='yes'&&other.controlZone!=='no'),

      sampled:flag(F.sampled==='yes')
    };

    return {
      id:inspection.id||'',
      subjectName:inspection.name||'稽查對象',
      subjectType,
      permitStatus:inspection.permitStatus||'',
      permitType:inspection.permitType||'',
      methods:[...methods],
      permitMismatchCodes:mismatchCodes,
      article30:[...article30],
      controlZone:other.controlZone||'',
      soilTreatmentAuthorized:soilStatus||'',
      F:{
        actualDischarge:actualDischarge||'',routeMatch:routeMatch||'',nonApprovedFinalOutlet:nonApprovedFinalOutlet||'',
        destinationKnown:destinationKnown||'',destination:derivedDestination||'',sampled:F.sampled||'',
        dilutionNeedsTreatment:F.dilutionNeedsTreatment||'',mixedWater:F.mixedWater||'',mixedWaterClean:F.mixedWaterClean||'',mixedBeforeDischarge:F.mixedBeforeDischarge||''
      },
      E:{needsTreatment:treatmentNeeded||'',shouldOperate:treatmentShouldOperate||'',actuallyRunning:treatmentActuallyRunning||'',alternativeTreatment:E.alternativeTreatment||''},
      B:{meterRequired:meterRequired||'',meterInstalled:meterInstalled||'',meterWorking:meterWorking||''},
      D:{recordRequired:recordRequired||'',recordAvailable:recordAvailable||'',recordComplete:recordComplete||''},
      facts
    };
  }

  function fromInspections(inspections=[]){
    return inspections.filter(Boolean).map(fromInspection);
  }

  root.WaterV2Facts=Object.freeze({version:VERSION,provenance:PROVENANCE,fromInspection,fromInspections});
})(typeof window==='undefined'?globalThis:window);
