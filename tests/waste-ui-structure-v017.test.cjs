const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync(require('node:path').join(__dirname,'../src/waste-v01-ui.js'),'utf8');

test('summary provides separate return paths',()=>{
  assert.match(ui,/id="backKnown">返回對象查核/);
  assert.match(ui,/id="backUnknownSummary">返回來源待查/);
});

test('unfinished work can always go to current summary',()=>{
  assert.match(ui,/整理目前內容／結束本次查核/);
  assert.match(ui,/任何步驟未完成也可以在此結束本次查核/);
});

test('batch supports editing and separate producer relation workflow',()=>{
  assert.match(ui,/data-edit="batch"/);
  assert.match(ui,/data-add-producer/);
  assert.match(ui,/function producerRelationDialog/);
  assert.match(ui,/產生者／產生來源/);
  assert.match(ui,/M\.producerRelationStates/);
  assert.match(ui,/確認狀態/);
  assert.match(ui,/data-exclude-producer/);
});

test('vehicles and places are visible and editable after creation',()=>{
  assert.match(ui,/已建立車輛/);
  assert.match(ui,/已建立地點/);
  assert.match(ui,/data-edit="vehicle"/);
  assert.match(ui,/data-edit="place"/);
});


test('subject and place can be linked and flow can quick-add places',()=>{
  assert.match(ui,/同時建立這個主體的本案相關地點/);
  assert.match(ui,/關聯主體（選填）/);
  assert.match(ui,/mAddFromPlace/);
  assert.match(ui,/mAddToPlace/);
  assert.match(ui,/quickPlaceDialog/);
});

test('system hint conversion preserves relations and reasons',()=>{
  assert.match(ui,/hintRelatedIds/);
  assert.match(ui,/sourceReason:h\.reason/);
  assert.match(ui,/createdFromKey:h\.key/);
  assert.match(ui,/renderRelatedIds/);
});

test('law navigation is available as a separate onsite layer',()=>{
  assert.match(ui,/id="toolLaw"/);
  assert.match(ui,/function renderLaw\(/);
  assert.match(ui,/現場法規導航/);
  assert.match(ui,/不是正式稽查紀錄/);
});

test('law layer can route back to original fact recording sections',()=>{
  assert.match(ui,/data-law-goto/);
  assert.match(ui,/本次查核目的/);
  assert.match(ui,/known-events/);
  assert.match(ui,/known-documents/);
});

test('summary keeps law directions separate from factual draft',()=>{
  assert.match(ui,/可能法規方向／後續查核/);
  assert.match(ui,/不會寫入下方稽查紀錄敘述草稿/);
  assert.match(ui,/renderDepartureCheckBlock/);
});

test('law requirements allow support and counter evidence without auto legal conclusion',()=>{
  assert.match(ui,/列為支持/);
  assert.match(ui,/列為相反/);
  assert.match(ui,/data-law-req-state/);
});


test('environment observation is a common first-class section in both entry flows',()=>{
  assert.match(ui,/2B｜環境狀態／污染現象：環境觀察/);
  assert.match(ui,/2A｜環境觀察（共用事實）/);
  assert.match(ui,/function environmentObservationDialog/);
  assert.match(ui,/即使來源、行為人或物質批次未知/);
});

test('environment dialog keeps phenomena medium extent status and evidence separate',()=>{
  assert.match(ui,/現象類型（可複選）/);
  assert.match(ui,/受影響位置／環境介質（可複選）/);
  assert.match(ui,/範圍／程度/);
  assert.match(ui,/資料性質/);
  assert.match(ui,/當下狀態/);
  assert.match(ui,/資料來源/);
  assert.match(ui,/可能來源線索／追查方向/);
});

test('environment source clue reuses source trace instead of confirming source',()=>{
  assert.match(ui,/M\.addSourceLead/);
  assert.match(ui,/由環境觀察帶入的可能來源線索/);
  assert.match(ui,/待查證/);
});

test('general and business classification are per batch facts',()=>{
  assert.match(ui,/M\.classificationOptions/);
  assert.match(ui,/廢棄物分類/);
  assert.match(ui,/一般／事業的分水嶺/);
});

test('environment effect overview stays separate from objective phenomena',()=>{
  assert.match(ui,/環境影響研判／總覽/);
  assert.match(ui,/只彙整既有環境觀察，不重複輸入/);
  assert.match(ui,/不等同法律上的「污染環境」成立/);
});

test('cross-module routing remains lightweight and non-conclusive',()=>{
  assert.match(ui,/可能涉及其他查核模組/);
  assert.match(ui,/只做導流，不代表法規適用或違規成立/);
  assert.match(ui,/data-cross-status=\"進入查核\"/);
  assert.match(ui,/data-cross-status=\"暫不處理\"/);
  assert.match(ui,/data-cross-status=\"不適用\"/);
});


test('V0.1.7 exposes full Waste Disposal Act index and search without making every article an auto hint',()=>{
  assert.match(ui,/廢棄物清理法全條文索引/);
  assert.match(ui,/lawArticleSearch/);
  assert.match(ui,/renderArticleCatalog/);
  assert.match(ui,/全法索引/);
  assert.match(ui,/不會為了「全收錄」而一直跳提示/);
});

test('article catalog can start a linked field check direction manually',()=>{
  assert.match(ui,/data-article-rule/);
  assert.match(ui,/lawCreateDialog\(null,b\.dataset\.articleRule\)/);
});
