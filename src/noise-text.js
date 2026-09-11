(function(root){
  'use strict';
  function render(template,values){
    if(typeof template!=='string')throw new Error(root.NOISE_TEXTS.common.invalidTemplate);
    // Validate names against supplied data, then substitute once. User text is never parsed again.
    for(const match of template.matchAll(/\{\{([^{}]+)\}\}/g)){
      if(!/^\w+$/.test(match[1])||!Object.prototype.hasOwnProperty.call(values,match[1])||values[match[1]]==null||typeof values[match[1]]==='object')throw new Error(root.NOISE_TEXTS.common.invalidVariable+match[1]);
    }
    return template.replace(/\{\{(\w+)\}\}/g,(_,key)=>String(values[key]));
  }
  root.NoiseText={render};
})(window);
