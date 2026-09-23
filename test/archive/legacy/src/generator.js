(function () {
  "use strict";
  const app = document.getElementById("app");
  const config = window.DRAFT_CONFIG;
  if (!config) { app.textContent = "找不到模板資料，請確認 data/templates/demo.js 存在。"; return; }
  const fields = {};
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, secondary) {
    const node = el("button", text, secondary ? "secondary" : "");
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  const form = el("form");
  form.autocomplete = "off";
  form.addEventListener("submit", event => event.preventDefault());
  app.append(form);
  function field(parent, spec) {
    const wrap = el("div", "", "field");
    const label = el("label", spec.label);
    label.htmlFor = spec.id;
    const control = el(spec.type === "select" ? "select" : spec.type === "textarea" ? "textarea" : "input");
    control.id = spec.id;
    control.name = spec.id;
    control.autocomplete = "off";
    if (control.tagName === "INPUT") control.type = spec.type;
    if (control.tagName === "TEXTAREA") control.rows = 3;
    if (spec.type === "select") {
      const blank = el("option", "尚待確認／未填"); blank.value = ""; control.append(blank);
      spec.options.forEach(item => {
        const option = el("option", typeof item === "string" ? item : item.label);
        option.value = typeof item === "string" ? item : item.id;
        control.append(option);
      });
    }
    fields[spec.id] = control;
    wrap.append(label, control); parent.append(wrap);
    return control;
  }
  field(form, { id: "template", label: "使用模板", type: "select", options: config.templates.map(item => ({ id: item.id, label: item.title })) });
  fields.template.remove(0);
  for (const group of config.groups) {
    const section = el("fieldset", "", "panel");
    section.append(el("legend", group.title));
    const grid = el("div", "", "form-grid"); section.append(grid);
    group.fields.forEach(spec => field(grid, spec)); form.append(section);
  }
  const resultSection = el("fieldset", "", "panel");
  resultSection.append(el("legend", "三、處理結果"));
  field(resultSection, { id: "result", label: "請選擇本次實際處理結果", type: "select", options: config.results });
  field(resultSection, { id: "resultDetails", label: "其他處理結果說明", type: "textarea" });
  function toggleOther() { fields.resultDetails.parentElement.hidden = fields.result.value !== "other"; }
  fields.result.addEventListener("change", toggleOther); toggleOther(); form.append(resultSection);
  const status = el("p"); status.setAttribute("role", "status");
  const outputs = el("div"); outputs.hidden = true;
  const drafts = {};
  for (const [key, title] of [["record", "稽查紀錄草稿"], ["reply", "民眾回覆草稿"]]) {
    const section = el("section", "", "panel");
    section.append(el("h2", title));
    const label = el("label", "可直接修改下方文字，不會變更原始模板。"); label.htmlFor = key;
    const area = el("textarea"); area.id = key; area.rows = 14; area.autocomplete = "off"; area.spellcheck = false;
    drafts[key] = area;
    const copyStatus = el("p"); copyStatus.setAttribute("role", "status");
    const copy = button("複製文字", async () => {
      copyStatus.textContent = "";
      try {
        if (!navigator.clipboard?.writeText) throw new Error("fallback");
        await navigator.clipboard.writeText(area.value);
        copyStatus.textContent = "已複製目前草稿。";
      } catch (_) {
        area.focus(); area.select();
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (_) { /* 使用手動複製 */ }
        copyStatus.textContent = copied ? "已複製目前草稿。" : "瀏覽器未允許自動複製，已選取文字，請按 Ctrl+C。";
      }
    }, true);
    area.addEventListener("input", () => { copyStatus.textContent = ""; });
    section.append(label, area, copy, copyStatus); outputs.append(section);
  }
  const actions = el("div", "", "actions");
  actions.append(button("填入假資料", () => {
    for (const [key, value] of Object.entries(config.demo)) fields[key].value = value;
    toggleOther(); markChanged(); status.textContent = "已填入虛構資料，請按產生草稿。";
  }, true));
  actions.append(button("產生兩份草稿", () => {
    if (!outputs.hidden && !window.confirm("重新產生將覆蓋下方兩份草稿及手動修改，是否繼續？")) return;
    try {
      const input = Object.fromEntries(Object.entries(fields).map(([key, control]) => [key, control.value]));
      const generated = DraftEngine.generate(config, fields.template.value, input);
      drafts.record.value = generated.record; drafts.reply.value = generated.reply;
      outputs.querySelectorAll('[role="status"]').forEach(node => { node.textContent = ""; });
      outputs.hidden = false; status.textContent = "兩份草稿已產生，請核對事實及處理結果後使用。";
      drafts.record.focus();
    } catch (error) { status.textContent = "無法產生草稿：" + error.message; }
  }));
  function markChanged() {
    if (!outputs.hidden) status.textContent = "輸入已修改，下方仍為上次草稿；請重新產生以更新內容。";
  }
  form.addEventListener("input", markChanged);
  form.addEventListener("change", markChanged);
  form.append(actions); app.append(status, outputs);
})();
