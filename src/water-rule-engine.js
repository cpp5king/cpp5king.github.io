(function(root){
  'use strict';
  const ENGINE_PROVENANCE='PP-IA-41-7F3C9A21';

  function unique(items){return [...new Set(items)];}
  function stateOf(facts,id){return (facts&&facts[id])||'unknown';}

  function evaluateElement(element,facts){
    const state=stateOf(facts,element.id);
    const result={satisfied:[],failed:[],missing:[],notApplicable:[],nextChecks:[]};
    if(state==='yes')result.satisfied.push(element);
    else if(state==='no'){
      if(element.noMeans==='insufficient'){result.missing.push(element);result.nextChecks.push(...(element.nextChecks||[]));}
      else if(element.noMeans==='notApplicable')result.notApplicable.push(element);
      else result.failed.push(element);
    }else{
      result.missing.push(element);
      result.nextChecks.push(...(element.nextChecks||[]));
      const context=element.contextChecks||{};
      for(const [factKey,groups] of Object.entries(context)){
        const key=facts&&facts[factKey];
        if(key&&groups[key])result.nextChecks.push(...groups[key]);
      }
    }
    return result;
  }

  function merge(parts){
    const result={satisfied:[],failed:[],missing:[],notApplicable:[],nextChecks:[]};
    parts.forEach(part=>{
      result.satisfied.push(...part.satisfied);
      result.failed.push(...part.failed);
      result.missing.push(...part.missing);
      result.notApplicable.push(...part.notApplicable);
      result.nextChecks.push(...part.nextChecks);
    });
    result.nextChecks=unique(result.nextChecks);
    return result;
  }

  function nodeStatus(result){
    if(result.notApplicable.length)return 'notApplicable';
    if(result.failed.length)return 'notEstablished';
    if(result.missing.length)return 'insufficient';
    return 'established';
  }

  function evaluateNode(node,facts){
    if(!node)return {satisfied:[],failed:[],missing:[],notApplicable:[],nextChecks:[]};
    if(node.id&&!node.op)return evaluateElement(node,facts);
    const op=String(node.op||'AND').toUpperCase();
    const items=Array.isArray(node.items)?node.items:[];
    const evaluated=items.map(item=>evaluateNode(item,facts));
    if(op==='OR'){
      const winner=evaluated.find(part=>nodeStatus(part)==='established');
      if(winner)return winner;
      const pending=evaluated.find(part=>nodeStatus(part)==='insufficient');
      if(pending)return pending;
      const applicable=evaluated.find(part=>nodeStatus(part)==='notEstablished');
      if(applicable)return applicable;
      return merge(evaluated);
    }
    return merge(evaluated);
  }

  function evaluate(rule,facts){
    if(!rule)throw new Error('WaterRuleEngine.evaluate requires a rule.');
    const result=rule.logic
      ? evaluateNode(rule.logic,facts||{})
      : merge((rule.elements||[]).map(element=>evaluateElement(element,facts||{})));

    let status='insufficient';
    if(result.notApplicable.length)status='notApplicable';
    else if(result.failed.length)status='notEstablished';
    else if(!result.missing.length)status='established';

    return {
      ruleId:rule.id,
      version:rule.version,
      title:rule.title,
      legalBasis:rule.legalBasis,
      status,
      satisfiedFacts:result.satisfied.map(x=>x.id),
      failedFacts:result.failed.map(x=>x.id),
      missingFacts:result.missing.map(x=>x.id),
      notApplicableFacts:result.notApplicable.map(x=>x.id),
      satisfiedLabels:result.satisfied.map(x=>x.label),
      failedLabels:result.failed.map(x=>x.label),
      missingLabels:result.missing.map(x=>x.label),
      notApplicableLabels:result.notApplicable.map(x=>x.label),
      nextChecks:unique(result.nextChecks)
    };
  }

  root.WaterRuleEngine=Object.freeze({
    evaluate,
    provenance:ENGINE_PROVENANCE,
    schemaVersion:'2.0'
  });
})(typeof window==='undefined'?globalThis:window);
