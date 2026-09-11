(function(root){
  'use strict';
  const ENGINE_PROVENANCE='PP-IA-41-7F3C9A21';
  function unique(items){return [...new Set(items)];}
  function evaluate(rule,facts){
    const satisfied=[],failed=[],missing=[],notApplicable=[],nextChecks=[];
    for(const element of rule.elements){
      const state=facts[element.id]||'unknown';
      if(state==='yes')satisfied.push(element);
      else if(state==='no'){
        if(element.noMeans==='insufficient'){missing.push(element);nextChecks.push(...(element.nextChecks||[]));}
        else if(element.noMeans==='notApplicable')notApplicable.push(element);
        else failed.push(element);
      } else {
        missing.push(element);
        nextChecks.push(...(element.nextChecks||[]));
        const context=element.contextChecks||{};
        for(const [factKey,groups] of Object.entries(context)){
          const key=facts[factKey];
          if(key&&groups[key])nextChecks.push(...groups[key]);
        }
      }
    }
    let status='insufficient';
    if(notApplicable.length)status='notApplicable';
    else if(failed.length)status='notEstablished';
    else if(!missing.length)status='established';
    return {ruleId:rule.id,version:rule.version,title:rule.title,legalBasis:rule.legalBasis,status,
      satisfiedFacts:satisfied.map(x=>x.id),failedFacts:failed.map(x=>x.id),missingFacts:missing.map(x=>x.id),notApplicableFacts:notApplicable.map(x=>x.id),
      satisfiedLabels:satisfied.map(x=>x.label),failedLabels:failed.map(x=>x.label),missingLabels:missing.map(x=>x.label),notApplicableLabels:notApplicable.map(x=>x.label),nextChecks:unique(nextChecks)};
  }
  root.WaterRuleEngine={evaluate,provenance:ENGINE_PROVENANCE};
})(typeof window==='undefined'?globalThis:window);
