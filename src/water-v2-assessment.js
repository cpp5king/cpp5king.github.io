(function(root){
  'use strict';
  const VERSION='4.9.43';
  const PROVENANCE='PP-IA-41-7F3C9A21';

  function permitTypeLabel(v){return ({discharge:'排放許可／簡易排放許可',storage:'貯留許可',dilution:'稀釋許可',soil:'土壤處理許可',other:'其他水措／核准資料',unknown:'無法確認許可類型'})[v]||v;}
  function a30Label(v){return ({pesticide:'農藥／肥料',discard:'棄置污染物',kill_aquatic:'捕殺水生物',livestock:'飼養禽畜',other:'其他污染水體行為'})[v]||v;}
  function dedupeLaw(arr){const m=new Map();arr.forEach(x=>{const k=x.law+'|'+x.reason;if(!m.has(k))m.set(k,x)});return [...m.values()];}

  function assess(inspections=[]){
    if(!root.WaterRuleEngine?.evaluate) throw new Error('WaterRuleEngine is required before WaterV2Assessment.');
    if(!root.WaterV2Facts?.fromInspections) throw new Error('WaterV2Facts is required before WaterV2Assessment.');
    const rules=root.WATER_V2_RULES||{};
    const normalized=root.WaterV2Facts.fromInspections(inspections);
    const laws=[],pending=[],evaluations=[];

    normalized.forEach(item=>{
      const f=item.facts;
      const subjectName=item.subjectName||'稽查對象';
      const isSewer=item.subjectType==='sewer';
      const law14=isSewer?'水污染防治法第19條準用第14條第1項':'水污染防治法第14條第1項';
      const law18=isSewer?'水污染防治法第19條準用第18條':'水污染防治法第18條';
      const established=ruleKey=>{
        const rule=rules[ruleKey];
        if(!rule) throw new Error('Missing Water V2 rule: '+ruleKey);
        const result=root.WaterRuleEngine.evaluate(rule,f);
        evaluations.push({inspectionId:item.id,ruleKey,...result});
        return result.status==='established';
      };

      if(item.subjectType==='industry'||item.subjectType==='sewer'){
        if(item.permitStatus==='unknown')pending.push(`${subjectName}：目前是否具有有效水許可／核准資料。`);
        if(item.permitStatus==='yes'&&!item.permitType)pending.push(`${subjectName}：確認目前核對的有效許可／核准類型。`);
        if(item.permitStatus==='yes'&&item.permitType==='unknown')pending.push(`${subjectName}：目前許可類型尚無法確認，暫不以許可登記事項差異直接指定第14條或第20條。`);

        if(established('article14NoPermitGround')) laws.push({law:law14,reason:'目前結構化事實為無有效排放許可／核准資料，且有排放廢污水至地面水體方向。'});

        const noPermitStorage=established('article20NoPermitStorage');
        const noPermitDilution=established('article20NoPermitDilution');
        if(noPermitStorage||noPermitDilution) laws.push({law:'水污染防治法第20條',reason:'目前結構化事實顯示採貯留或稀釋方式，但無有效許可／核准資料；第20條對事業及污水下水道系統直接適用。'});

        if(item.permitStatus==='no'&&(item.methods.includes('recycle')||item.methods.includes('委託'))) pending.push(`${subjectName}：全量回收／全量委託情境尚需確認是否涉及廢水貯留及相應許可義務，不直接僅因處理方式套用第20條。`);
        if(established('article32NoPermitSoilMethod')) laws.push({law:'水污染防治法第32條',reason:'目前結構化事實顯示廢污水排放於土壤，且未有有效水許可／核准資料可支持土壤處理合法例外。'});

        if(established('article14PermitMismatch')){
          item.permitMismatchCodes.forEach(code=>laws.push({law:law14,reason:`${code} 項已記錄與排放許可／簡易排放許可登記事項不一致，進入未依登記事項運作之查核方向。`}));
        }else if(established('article20StorageMismatch')){
          item.permitMismatchCodes.forEach(code=>laws.push({law:'水污染防治法第20條',reason:`${code} 項已記錄與貯留許可登記事項不一致，進入第20條「依登記事項運作」之查核方向。`}));
        }else if(established('article20DilutionMismatch')){
          item.permitMismatchCodes.forEach(code=>laws.push({law:'水污染防治法第20條',reason:`${code} 項已記錄與稀釋許可登記事項不一致，進入第20條「依登記事項運作」之查核方向。`}));
        }else if(item.permitMismatchCodes.length&&item.permitStatus==='yes'&&item.permitType){
          pending.push(`${subjectName}：B～E 已發現許可／核准差異，但目前許可類型為「${permitTypeLabel(item.permitType)}」，需再確認該差異所對應之具體法規義務。`);
        }

        if(established('article181Bypass')) laws.push({law:'水污染防治法第18條之1第1項',reason:'結構化事實顯示由非核准最終放流口／非核准納管口排出，進入繞流排放方向。'});

        if(established('article14RouteMismatch')){
          laws.push({law:law14,reason:'現場有實際排放至地面水體，排放位置／路徑與排放許可登記事項不一致，且已確認並非由非核准最終放流口排出，進入第14條第1項方向。'});
        }else if(item.permitStatus==='yes'&&item.F.actualDischarge==='yes'&&item.F.routeMatch==='no'&&item.F.nonApprovedFinalOutlet==='no'){
          if(item.F.destinationKnown==='yes'&&item.F.destination==='sewer') pending.push(`${subjectName}：實際最終去向為納管，路徑與核准內容不一致時，不直接套用第14條；需釐清是否屬第18條之1繞流、下水道核准排放口差異或其他水措義務。`);
          else pending.push(`${subjectName}：排放路徑與許可／核准內容不一致，但尚缺「排放許可類型」及「排放至地面水體」等第14條前提，暫不直接指定第14條。`);
        }else if(item.F.actualDischarge==='yes'&&item.F.routeMatch==='no'&&item.F.nonApprovedFinalOutlet!=='yes'&&item.F.nonApprovedFinalOutlet!=='no'){
          pending.push(`${subjectName}：排放路徑與許可不一致時，需確認是否屬非核准最終放流口／非核准納管口，以區分第18條之1第1項與其他許可差異。`);
        }

        if(established('article181Dilution')) laws.push({law:'水污染防治法第18條之1第2項',reason:'結構化事實符合排放／納管前，將須處理之廢污水與無需處理即可符合標準之水混合稀釋的查核方向。'});

        if(established('article181Treatment')) laws.push({law:'水污染防治法第18條之1第4項',reason:'結構化事實顯示廢污水需要處理、處理設施當時應運轉但未正常運轉，且未記錄其他替代處理方式。'});
        else if(item.E.needsTreatment==='yes'&&item.E.shouldOperate==='yes'&&item.E.actuallyRunning==='no'&&item.E.alternativeTreatment!=='yes'&&item.E.alternativeTreatment!=='no') pending.push(`${subjectName}：處理設施應運轉但未正常運轉時，尚需確認是否有有效替代處理方式，以判斷第18條之1第4項方向。`);

        if(established('article18Meter')){
          const issue=item.B.meterInstalled==='no'?'應設水量計測但現場未設置':'應設之水量計測未正常計量';
          laws.push({law:law18,reason:`已記錄「${issue}」之具體事實，屬水污染防治措施中計測設施之查核方向；仍需依實際處理方式、設置位置及適用子法確認具體義務。`});
          pending.push(`${subjectName}：確認該水量計測設施之適用水措規定、法定設置位置及具體義務。`);
        }
        if(established('article18Record')){
          const issue=item.D.recordAvailable==='no'?'依法應有之紀錄無法提供':'依法應有之紀錄不完整';
          laws.push({law:law18,reason:`已記錄「${issue}」之具體事實，屬水污染防治措施中操作／管理紀錄義務之查核方向；仍需確認本案適用之具體子法規定。`});
          pending.push(`${subjectName}：確認本案應保存／提供之具體水措紀錄種類、頻率及保存義務。`);
        }

        if(established('article32Groundwater')) laws.push({law:'水污染防治法第32條第1項',reason:'最終去向記錄為注入地下水體，進入第32條第1項禁止方向。'});
        if(established('article32SoilNoException')) laws.push({law:'水污染防治法第32條第1項',reason:'現場有排放廢污水於土壤，且已確認未具備「符合土壤處理標準並取得主管機關許可」之合法例外。'});
        else if(established('article32SoilPending')){
          laws.push({law:'水污染防治法第32條方向',reason:'現場有排放廢污水於土壤情形；第32條原則禁止，但法律另有符合土壤處理標準並經許可之例外。'});
          pending.push(`${subjectName}：確認土壤排放是否已處理符合土壤處理標準，且具有有效土壤處理許可。`);
        }

        if(item.F.actualDischarge==='yes'&&item.F.destinationKnown!=='yes') pending.push(`${subjectName}：實際排放之最終去向。`);
        if(item.F.sampled==='yes') pending.push(`${subjectName}：本次僅記錄現場採樣；V2 不輸入實驗室結果，也不自動判定第7條超標。`);
      }

      if(established('article25Building')) laws.push({law:'水污染防治法第25條方向',reason:'本對象選定為建築物污水處理設施；應依設施狀態、管理／清理、紀錄及排放事實進一步判斷。'});

      if(item.subjectType==='other'){
        if(established('article30Direction')){
          laws.push({law:'水污染防治法第30條方向',reason:`已確認行為地點位於水污染管制區，並記錄行為：${item.article30.map(a30Label).join('、')}；仍依各款具體要件進一步確認。`});
          if(item.article30.includes('pesticide'))pending.push(`${subjectName}：第30條第1款尚需確認是否涉及主管機關指定水體，且有污染之虞。`);
          if(item.article30.includes('discard'))pending.push(`${subjectName}：第30條第2款尚需確認棄置位置是否在水體或其沿岸規定距離內，及棄置物是否屬法定污染物。`);
          if(item.article30.includes('livestock'))pending.push(`${subjectName}：第30條第4款尚需確認是否位於主管機關指定水體或其沿岸規定距離內。`);
          if(item.article30.includes('other'))pending.push(`${subjectName}：第30條第5款尚需確認是否有主管機關公告禁止該類足使水污染之行為。`);
        }else if(item.article30.length&&item.controlZone!=='no'){
          pending.push(`${subjectName}：第30條適用前提為行為地點位於公告之水污染管制區，尚需先確認管制區範圍。`);
        }

        if(established('article32Groundwater')) laws.push({law:'水污染防治法第32條第1項',reason:'現場結構化事實包含將廢污水注入地下水體，進入第32條第1項禁止方向。'});
        if(established('article32SoilNoException')) laws.push({law:'水污染防治法第32條第1項',reason:'現場有排放廢污水於土壤，且已確認未具備「符合土壤處理標準並取得主管機關許可」之合法例外。'});
        else if(established('article32SoilPending')){
          laws.push({law:'水污染防治法第32條方向',reason:'現場有排放廢污水於土壤情形；第32條原則禁止，但法律另有符合土壤處理標準並經許可之例外。'});
          pending.push(`${subjectName}：確認土壤排放是否已處理符合土壤處理標準，且具有有效土壤處理許可。`);
        }
      }
    });

    return {laws:dedupeLaw(laws),pending:[...new Set(pending)],evaluations};
  }

  root.WaterV2Assessment=Object.freeze({version:VERSION,provenance:PROVENANCE,assess});
})(typeof window==='undefined'?globalThis:window);
