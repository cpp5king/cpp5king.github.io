(function (root) {
  "use strict";
  const copy = value => JSON.parse(JSON.stringify(value));
  function create(config) {
    let state = { categoryId: "", caseTypeId: "", templateId: "", inputs: {}, outputs: null, stale: false };
    function clearDraft() { state.inputs = {}; state.outputs = null; state.stale = false; delete state.legalReviews; }
    function template() {
      const found = config.templates.find(item => item.id === state.templateId);
      if (!found) throw new Error("請先選擇模板。");
      return found;
    }
    return {
      snapshot: () => copy(state),
      restore(nextState) { state = root.CaseFile.validateState(config, copy(nextState)); },
      home() { state = { categoryId: "", caseTypeId: "", templateId: "", inputs: {}, outputs: null, stale: false }; },
      selectCategory(id) {
        if (!config.categories.some(item => item.id === id && item.status === "active")) throw new Error("此案件大類尚未開放。");
        state.categoryId = id; state.caseTypeId = ""; state.templateId = ""; clearDraft();
      },
      selectCaseType(id) {
        if (!config.caseTypes.some(item => item.id === id && item.categoryId === state.categoryId && item.status === "active")) throw new Error("案件類型與目前大類不符。");
        state.caseTypeId = id; state.templateId = ""; clearDraft();
      },
      selectTemplate(id) {
        if (!config.templates.some(item => item.id === id && item.categoryId === state.categoryId && item.caseTypeId === state.caseTypeId)) throw new Error("模板與目前案件類型不符。");
        state.templateId = id; clearDraft();
      },
      handoff(caseTypeId, templateId, input = {}) {
        const targetCase = config.caseTypes.find(item => item.id === caseTypeId && item.status === "active");
        if (!targetCase) throw new Error("找不到可接續的案件類型。");
        const targetTemplate = config.templates.find(item => item.id === templateId && item.categoryId === targetCase.categoryId && item.caseTypeId === targetCase.id);
        if (!targetTemplate) throw new Error("找不到可接續的案件模板。");
        state.categoryId = targetCase.categoryId;
        state.caseTypeId = targetCase.id;
        state.templateId = targetTemplate.id;
        state.outputs = null;
        state.stale = false;
        state.inputs = root.DraftEngine.normalize(targetTemplate, copy(input));
      },
      setInputs(input) {
        const workflow = root.TemplateWorkflows?.[template().workflow];
        if (workflow?.clearDraft?.(state.inputs, input)) { state.outputs = null; state.stale = false; }
        if (workflow?.resetChange) input = workflow.resetChange(state.inputs, input);
        state.inputs = root.DraftEngine.normalize(template(), input);
        if (state.outputs) state.stale = true;
      },
      generate() {
        const current=template();
        if(current.previewOnlyWhen && root.DraftEngine.matches(current.previewOnlyWhen,state.inputs))throw new Error(state.inputs[current.validationMessageField] || current.previewOnlyMessage);
        state.outputs = root.DraftEngine.generate(config, state.templateId, state.inputs);
        state.stale = false;
        if(state.categoryId==='water'&&root.WaterReview?.captureTemplate){
          const reviews=Array.isArray(state.legalReviews)?state.legalReviews:[];
          reviews.push(root.WaterReview.captureTemplate(state,reviews.length+1));
          state.legalReviews=reviews;
        }
        return copy(state.outputs);
      },
      editOutput(kind, text) {
        if (!state.outputs || !["record", "reply"].includes(kind)) throw new Error("尚無可修改的草稿。");
        state.outputs[kind] = String(text);
      }
    };
  }
  root.CaseSession = { create };
})(typeof window === "undefined" ? globalThis : window);
