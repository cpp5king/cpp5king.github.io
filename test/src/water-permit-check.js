(function(root){
  'use strict';
  const bool=value=>value?'yes':'no';
  if(!root.WaterPermitLaw)throw new Error('WaterPermitLaw is required before WaterPermitCheck.');
  const items=root.WaterPermitLaw.comparisonItems();
  const stateLabel={
    match:'一致',
    mismatch:'不一致',
    unknown:'已查但仍無法確認',
    notChecked:'本次未查',
    notApplicable:'本案無此項／不適用'
  };
  function detailedActive(input={}){
    return input.waterPermitCheckMode==='detailed'||(input.waterPermitCheckMode==='quick'&&input.waterPermitQuickDifferenceObserved==='yes');
  }
  function comparableReference(input={}){
    return root.WaterPermitLaw.comparableReference(input);
  }
  function comparisonValues(input={}){return items.map(([key,label])=>({key,label,value:input[key]||''}));}
  function evaluated(input={}){
    const mode=input.waterPermitCheckMode||'';
    const quick=input.waterPermitQuickDifferenceObserved||'';
    const reference=input.waterPermitReferenceStatus||'';
    const values=comparisonValues(input);
    const mismatches=values.filter(x=>x.value==='mismatch');
    const unresolved=values.filter(x=>!['match','mismatch','notApplicable'].includes(x.value));
    const complete=values.every(x=>['match','mismatch','notApplicable'].includes(x.value));
    let status='unanswered';
    if(mode==='skip')status='skipped';
    else if(mode==='quick'&&quick==='no')status='quickNoAnomaly';
    else if(mode==='quick'&&quick==='unknown')status='insufficient';
    else if(detailedActive(input)){
      if(!comparableReference(input))status='insufficient';
      else if(mismatches.length)status='mismatch';
      else if(reference==='full'&&complete)status='match';
      else status='insufficient';
    }
    return {mode,quick,reference,values,mismatches,unresolved,complete,status};
  }
  function summary(input={}){
    const e=evaluated(input);
    if(e.status==='skipped')return '【許可／水措差異檢核】\n本次選擇跳過詳細差異檢核。此狀態僅代表本次未查，不代表現場與核准內容一致。';
    if(e.status==='quickNoAnomaly')return '【許可／水措差異檢核】\n本次採快速確認，未發現與既有許可／水措認知有明顯變更或異常；未進行逐項比對，不作為「全部一致」之認定。';
    if(e.mode==='quick'&&e.quick==='unknown')return '【許可／水措差異檢核】\n本次採快速確認，但是否存在與既有許可／水措內容不同之情形仍無法確認。';
    if(!detailedActive(input))return '【許可／水措差異檢核】\n尚未選擇本次檢核方式。';
    if(!comparableReference(input))return '【許可／水措差異檢核】\n已進入逐項檢核，但目前缺少可供比對之核准內容／許可資料，暫不判定一致或不一致。';
    const lines=e.values.filter(x=>x.value).map(x=>`• ${x.label}：${stateLabel[x.value]||x.value}`);
    if(e.mismatches.length){
      const mismatches=e.mismatches.map(x=>x.label).join('、');
      return `【許可／水措差異檢核】\n已確認下列項目與核准內容不一致：${mismatches}。\n${lines.join('\n')}`;
    }
    if(e.status==='match')return `【許可／水措差異檢核】\n已取得完整核准內容並完成逐項比對，本次所列核心項目未發現差異。\n${lines.join('\n')}`;
    return `【許可／水措差異檢核】\n已進行逐項比對，但仍有項目未查或無法確認；目前不足以認定全部一致。${lines.length?'\n'+lines.join('\n'):''}`;
  }
  function missing(input={}){
    const e=evaluated(input);
    if(e.status==='skipped'||e.status==='quickNoAnomaly'||e.status==='match')return '目前無因本模組新增的必要查證事項。';
    if(!e.mode)return '請選擇「詳細檢核／快速確認／本次跳過」其中一種方式。';
    if(e.mode==='quick'&&!e.quick)return '請完成快速確認：本次是否發現與既有許可／水措內容不同之設備、管線、排放口、處理方式或操作情形。';
    if(e.mode==='quick'&&e.quick==='unknown')return '若本案後續判斷需要依賴核准內容，建議改進行詳細差異檢核。';
    if(detailedActive(input)&&!e.reference)return '確認本次可取得之核准水措／許可資料完整程度。';
    if(detailedActive(input)&&!comparableReference(input))return '調閱水措計畫、許可證（文件）或其他核准登記事項；取得可比對資料前不宜判定一致／不一致。';
    if(e.mismatches.length){
      const note=String(input.waterPermitMismatchDetail||'').trim();
      return note?'已記錄差異內容；請依差異項目固定現場照片、管線／流程關係及核准資料。':'已確認有不一致項目；請補充差異內容並固定現場照片、流程／管線關係及核准資料。';
    }
    if(e.unresolved.length)return '尚待完成：'+e.unresolved.map(x=>`${x.label}（${x.value?stateLabel[x.value]:'尚未填寫'}）`).join('、')+'。';
    return '目前無因本模組新增的必要查證事項。';
  }
  function apply(input={},out=input){
    const e=evaluated(out);
    const subjectEligible=root.WaterPermitLaw.subjectEligible(out);
    out.waterShowPermitCheck=bool(subjectEligible&&out.waterWastewaterStatus==='yes');
    out.waterShowPermitQuick=bool(out.waterShowPermitCheck==='yes'&&out.waterPermitCheckMode==='quick');
    out.waterShowPermitDetailed=bool(out.waterShowPermitCheck==='yes'&&detailedActive(out));
    out.waterShowPermitReference=out.waterShowPermitDetailed;
    out.waterShowPermitComparison=bool(out.waterShowPermitDetailed==='yes'&&comparableReference(out));
    out.waterShowPermitMismatchNote=bool(e.mismatches.length>0);
    out.waterPermitDifferenceStatus=e.status;
    out.waterPermitCheckSummaryText=summary(out);
    out.waterPermitCheckMissingText=missing(out);
    out.waterPermitLegalComparisonActive=bool(out.waterShowPermitComparison==='yes');
    out.waterShowLegacySublawApprovedMeasures=bool(subjectEligible&&!out.waterPermitCheckMode);
    out.waterShowLegacySublawOperationMatches=bool(out.waterShowLegacySublawApprovedMeasures==='yes'&&out.waterSublawApprovedMeasuresConfirmed==='yes');

    // 4.8 以新差異檢核模組提供核准內容差異所需事實；舊案件未選新模式時保留舊欄位語意。
    if(out.waterPermitCheckMode){
      if(out.waterPermitLegalComparisonActive==='yes'){
        out.waterSublawApprovedMeasuresConfirmed='yes';
        if(e.mismatches.length)out.waterSublawOperationMatchesApprovedMeasures='no';
        else if(e.reference==='full'&&e.complete)out.waterSublawOperationMatchesApprovedMeasures='yes';
        else out.waterSublawOperationMatchesApprovedMeasures='unknown';
      }else{
        out.waterSublawApprovedMeasuresConfirmed='unknown';
        out.waterSublawOperationMatchesApprovedMeasures='unknown';
      }
    }
    return out;
  }
  function documentLine(input={}){
    const e=evaluated(input);
    if(e.status==='skipped')return '本次未進行許可／水措逐項差異檢核；該狀態不代表現場與核准內容一致。';
    if(e.status==='quickNoAnomaly')return '本次採許可／水措快速確認，未發現明顯變更或異常；未進行逐項比對。';
    if(e.status==='mismatch')return `許可／水措差異檢核已確認${e.mismatches.map(x=>x.label).join('、')}與核准內容不一致${input.waterPermitMismatchDetail?`，差異摘要：${String(input.waterPermitMismatchDetail).trim()}`:''}。`;
    if(e.status==='match')return '許可／水措差異檢核已完成核心項目逐項比對，本次所列項目未發現差異。';
    if(e.mode)return '許可／水措差異檢核尚有資料或項目待確認。';
    return '';
  }
  root.WaterPermitCheck={apply,evaluated,summary,missing,documentLine,items};
})(typeof window==='undefined'?globalThis:window);
