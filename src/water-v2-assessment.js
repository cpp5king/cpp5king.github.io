(function(root){
  'use strict';
  const VERSION='4.9.43';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  function permitTypeLabel(v){return ({discharge:'排放許可／簡易排放許可',storage:'貯留許可',dilution:'稀釋許可',soil:'土壤處理許可',other:'其他水措／核准資料',unknown:'無法確認許可類型'})[v]||v;}
  function a30Label(v){return ({pesticide:'農藥／肥料',discard:'棄置污染物',kill_aquatic:'捕殺水生物',livestock:'飼養禽畜',other:'其他污染水體行為'})[v]||v;}
  function dedupeLaw(arr){const m=new Map();arr.forEach(x=>{const k=x.law+'|'+x.reason;if(!m.has(k))m.set(k,x)});return [...m.values()];}

  function assess(inspections=[],options){
    if(!root.WaterLaw?.evaluate) throw new Error('WaterLaw is required before WaterV2Assessment.');
    if(!root.WaterV2Facts?.fromInspections) throw new Error('WaterV2Facts is required before WaterV2Assessment.');
    const rules=root.WATER_V2_RULES||{};
    const normalized=root.WaterV2Facts.fromInspections(inspections);
    const laws=[],pending=[],evaluations=[];
    const versionAware=arguments.length>=2;
    const lawVersion=versionAware?root.WaterLaw.resolveLawVersion(options?.behaviorDate||''):null;
    if(versionAware&&lawVersion.status!=='resolved'){
      const message=root.WaterLaw.pending('lawVersion');
      if(message)pending.push(message);
    }

    normalized.forEach(item=>{
      const f=item.facts;
      const subjectName=item.subjectName||'稽查對象';
      const established=ruleKey=>{
        const rule=rules[ruleKey];
        if(!rule) throw new Error('Missing Water V2 rule: '+ruleKey);
        const result=root.WaterLaw.evaluate(ruleKey,f,'field',lawVersion?{version:lawVersion}:{});
        evaluations.push({inspectionId:item.id,ruleKey,...result});
        return result.status==='established';
      };
      const pushDirection=(ruleKey,context={})=>{
        const d=root.WaterLaw.direction(ruleKey,{subjectType:item.subjectType,...context});
        if(d)laws.push(d);
      };
      const addPending=(key,context={})=>{
        const value=root.WaterLaw.pending(key,{subject:subjectName,...context});
        if(value)pending.push(value);
      };

      if(item.subjectType==='industry'||item.subjectType==='sewer'){
        if(item.permitStatus==='unknown')addPending('permitUnknown');
        if(item.permitStatus==='yes'&&!item.permitType)addPending('permitTypeMissing');
        if(item.permitStatus==='yes'&&item.permitType==='unknown')addPending('permitTypeUnknown');

        if(established('article14NoPermitGround'))pushDirection('article14NoPermitGround');

        const noPermitStorage=established('article20NoPermitStorage');
        const noPermitDilution=established('article20NoPermitDilution');
        if(noPermitStorage)pushDirection('article20NoPermitStorage');
        if(noPermitDilution)pushDirection('article20NoPermitDilution');

        if(item.permitStatus==='no'&&(item.methods.includes('recycle')||item.methods.includes('委託')))addPending('recycleOutsourceStorage');
        if(established('article32NoPermitSoilMethod'))pushDirection('article32NoPermitSoilMethod');

        if(established('article14PermitMismatch')){
          item.permitMismatchCodes.forEach(code=>pushDirection('article14PermitMismatch',{code}));
        }else if(established('article20StorageMismatch')){
          item.permitMismatchCodes.forEach(code=>pushDirection('article20StorageMismatch',{code}));
        }else if(established('article20DilutionMismatch')){
          item.permitMismatchCodes.forEach(code=>pushDirection('article20DilutionMismatch',{code}));
        }else if(item.permitMismatchCodes.length&&item.permitStatus==='yes'&&item.permitType){
          addPending('permitMismatchOther',{permitType:permitTypeLabel(item.permitType)});
        }

        if(established('article181Bypass'))pushDirection('article181Bypass');

        if(established('article14RouteMismatch')){
          pushDirection('article14RouteMismatch');
        }else if(item.permitStatus==='yes'&&item.F.actualDischarge==='yes'&&item.F.routeMatch==='no'&&item.F.nonApprovedFinalOutlet==='no'){
          if(item.F.destinationKnown==='yes'&&item.F.destination==='sewer')addPending('routeMismatchSewer');
          else addPending('routeMismatchGroundPrerequisite');
        }else if(item.F.actualDischarge==='yes'&&item.F.routeMatch==='no'&&item.F.nonApprovedFinalOutlet!=='yes'&&item.F.nonApprovedFinalOutlet!=='no'){
          addPending('finalOutletUnknown');
        }

        if(established('article181Dilution'))pushDirection('article181Dilution');

        if(established('article181Treatment'))pushDirection('article181Treatment');
        else if(item.E.needsTreatment==='yes'&&item.E.shouldOperate==='yes'&&item.E.actuallyRunning==='no'&&item.E.alternativeTreatment!=='yes'&&item.E.alternativeTreatment!=='no')addPending('alternativeTreatmentUnknown');

        if(established('article18Meter')){
          const issue=item.B.meterInstalled==='no'?'應設水量計測但現場未設置':'應設之水量計測未正常計量';
          pushDirection('article18Meter',{issue});
          addPending('meterDuty');
        }
        if(established('article18Record')){
          const issue=item.D.recordAvailable==='no'?'依法應有之紀錄無法提供':'依法應有之紀錄不完整';
          pushDirection('article18Record',{issue});
          addPending('recordDuty');
        }

        if(established('article32Groundwater'))pushDirection('article32Groundwater');
        if(established('article32SoilNoException'))pushDirection('article32SoilNoException');
        else if(established('article32SoilPending')){
          pushDirection('article32SoilPending');
          addPending('soilException');
        }

        if(item.F.actualDischarge==='yes'&&item.F.destinationKnown!=='yes')addPending('destinationUnknown');
        if(item.F.sampled==='yes')addPending('sampledNoLab');
      }

      if(established('article25Building'))pushDirection('article25Building');

      if(item.subjectType==='other'){
        if(established('article30Direction')){
          pushDirection('article30Direction',{actions:item.article30.map(a30Label).join('、')});
          if(item.article30.includes('pesticide'))addPending('a30Pesticide');
          if(item.article30.includes('discard'))addPending('a30Discard');
          if(item.article30.includes('livestock'))addPending('a30Livestock');
          if(item.article30.includes('other'))addPending('a30Other');
        }else if(item.article30.length&&item.controlZone!=='no'){
          addPending('controlZone');
        }

        if(established('article32Groundwater'))pushDirection('article32Groundwater');
        if(established('article32SoilNoException'))pushDirection('article32SoilNoException');
        else if(established('article32SoilPending')){
          pushDirection('article32SoilPending');
          addPending('soilException');
        }
      }
    });

    return {laws:dedupeLaw(laws),pending:[...new Set(pending)],evaluations,lawVersion};
  }

  root.WaterV2Assessment=Object.freeze({version:VERSION,provenance:PROVENANCE,assess});
})(typeof window==='undefined'?globalThis:window);
