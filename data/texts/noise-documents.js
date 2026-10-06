(function(root){
 const prefix=window.NOISE_TEXTS.article9.inspectionPrefix;
 const ending=window.NOISE_TEXTS.common.replyEnding;
 root.NOISE_TEXTS.article9Documents={
 rain:{record:prefix+window.NOISE_TEXTS.article9.rainRecordBody,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+window.NOISE_TEXTS.article9.rainReplyBody+ending},
 compliant:{record:prefix+window.NOISE_TEXTS.article9.compliantRecordBody,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+window.NOISE_TEXTS.article9.compliantReplyBody+ending},
 exceeded:{record:prefix+window.NOISE_TEXTS.article9.exceededRecordBody,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+window.NOISE_TEXTS.article9.exceededReplyBody+ending},
 background:{measured:window.NOISE_TEXTS.article9.backgroundMeasured,annual:window.NOISE_TEXTS.article9.backgroundAnnual,unavailable:window.NOISE_TEXTS.article9.backgroundUnavailableRecord,uncorrected:window.NOISE_TEXTS.article9.backgroundUncorrected,corrected:window.NOISE_TEXTS.article9.backgroundCorrected},
 value:window.NOISE_TEXTS.article9.text013,correctedValue:window.NOISE_TEXTS.article9.text014,standard:window.NOISE_TEXTS.article9.text015
 };
})(window);

(function(root){const d=root.NOISE_TEXTS.article9Documents;
 d.exitActions={wind:{retry:root.NOISE_TEXTS.ui.retryWind,finish:root.NOISE_TEXTS.ui.finish},difference:{retry:root.NOISE_TEXTS.ui.retryDifference,finish:root.NOISE_TEXTS.ui.finish}};
 const prefix=window.NOISE_TEXTS.article9.text020;
 const recordEnd=window.NOISE_TEXTS.article9.text021;
 const replyEnd=window.NOISE_TEXTS.article9.text022;
 const wind=window.NOISE_TEXTS.article9.windInvalidFact;
 const difference=window.NOISE_TEXTS.article9.differenceInvalidFact;
 d.windEnded={record:prefix+wind+recordEnd,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+wind+replyEnd};
 d.differenceRepeatedEnded={record:prefix+root.NOISE_TEXTS.ui.repeatedBackgroundFact+recordEnd,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+difference+replyEnd};
 d.differenceHistoryEnded={record:prefix+'{{backgroundHistoryFact}}'+recordEnd,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+difference+replyEnd};
 d.differenceEnded={record:prefix+difference+recordEnd,reply:window.NOISE_TEXTS.common.replyPrefix+prefix+difference+replyEnd};
})(window);
