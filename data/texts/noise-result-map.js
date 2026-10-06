// Stable mapping from rule outcomes to approved noise text assets.
// Rules decide the outcome; this table only selects wording.
(function(root){
  root.NOISE_RESULT_TEXT_MAP={
    'article8.established':{
      status:'active',record:'templates.article8RecordCurrent',reply:'templates.article8RecordCurrent',replyWrap:true
    },
    'article9.compliant':{
      status:'active',record:'article9Documents.compliant.record',reply:'article9Documents.compliant.reply'
    },
    'article9.exceeded':{
      status:'active',record:'article9Documents.exceeded.record',reply:'article9Documents.exceeded.reply'
    },
    'article9.weather.rain':{
      status:'active',record:'templates.text094',reply:'templates.text101',replyWrap:true
    },
    'article9.weather.wind':{
      status:'active',record:'article9Documents.windEnded.record',reply:'article9Documents.windEnded.reply'
    },
    'article9.differenceEnded':{
      status:'active',record:'article9Documents.differenceEnded.record',reply:'article9Documents.differenceEnded.reply'
    },
    'article9.sourceOff':{
      status:'active',record:'templates.text092',reply:'templates.text099'
    },
    'article9.noSpeaker':{
      status:'active',record:'templates.text093',reply:'templates.text100'
    }
  };
})(typeof window==='undefined'?globalThis:window);
