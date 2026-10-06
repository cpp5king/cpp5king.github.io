(function(root){
  'use strict';
  const validTime=value=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  function inspectionHour(value){return validTime(value)?Number(value.slice(0,2))+root.NOISE_TEXTS.main.text025+root.NOISE_TEXTS.main.text026:root.NOISE_TEXTS.common.missing;}
  // Presentation only. Never feed this rounded value back into assess/correct.
  const correctedVolume=value=>Number.isFinite(value)?value.toFixed(1):root.NOISE_TEXTS.common.missing;
  root.NoiseFormat={validTime,inspectionHour,correctedVolume};
})(window);
