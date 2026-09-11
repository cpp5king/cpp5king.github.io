(function () {
  "use strict";
  const app = document.getElementById("app");
  const config = window.DRAFT_CONFIG;
  const template = config?.templates.find(item => item.fillIn);
  if (!template) { app.textContent = "找不到草稿填空模板，請確認 data/templates/restaurant-odor.js。"; return; }
  const controls = {};
  const customWrappers = [];
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, secondary = false) {
    const node = el("button", text, secondary ? "secondary" : "");
    node.type = "button"; node.addEventListener("click", action); return node;
  }
  const form = el("form"); form.autocomplete = "off";
  form.addEventListener("submit", event => event.preventDefault());
  form.append(el("h2", "依草稿順序選填"));
  form.append(el("p", "依你提供的草稿選填，時間只選小時；設備可複選。選無設備時可選擇是否已交付手冊。"));
  const sentence = el("div", "", "panel sentence-form");
  const specs = Object.fromEntries(template.fields.map(field => [field.id, field]));
  for (const piece of template.record[0].split(/(\{\{\w+\}\})/g)) {
    const match = /^\{\{(\w+)\}\}$/.exec(piece);
    if (!match) { sentence.append(el("span", piece, "fixed-text")); continue; }
    const spec = specs[match[1]];
    const wrap = el("span", "", "sentence-slot");
    if (spec.type === "equipment") {
      const group = el("fieldset", "", "equipment-group"); group.append(el("legend", spec.label));
      const radios = [];
      for (const mode of spec.modes) {
        const row = el("label", "", "check-choice");
        const radio = el("input"); radio.type = "radio"; radio.name = spec.id; radio.value = mode.id; radio.checked = mode.id === "";
        row.append(radio, document.createTextNode(mode.label)); group.append(row); radios.push(radio);
      }
      controls[spec.id] = {
        get value() { return radios.find(radio => radio.checked)?.value || ""; },
        set value(value) { radios.forEach(radio => { radio.checked = radio.value === value; }); }
      };
      const types = el("fieldset", "", "equipment-types"); types.append(el("legend", "有設備：勾選種類"));
      const boxes = [];
      for (const option of spec.options) {
        const row = el("label", "", "check-choice");
        const box = el("input"); box.type = "checkbox"; box.value = option.id;
        row.append(box, document.createTextNode(option.label)); types.append(row); boxes.push(box);
      }
      controls[spec.id + "Types"] = {
        get value() { return boxes.filter(box => box.checked).map(box => box.value); },
        set value(value) { boxes.forEach(box => { box.checked = Array.isArray(value) && value.includes(box.value); }); }
      };
      const otherWrap = el("span", "", "custom-slot");
      const otherLabel = el("label", spec.otherLabel); otherLabel.htmlFor = spec.id + "Other";
      const other = el("input"); other.id = spec.id + "Other"; other.type = "text"; other.autocomplete = "off";
      controls[other.id] = other; otherWrap.append(otherLabel, other); types.append(otherWrap);
      const toggle = () => {
        types.hidden = controls[spec.id].value !== "present";
        types.disabled = types.hidden;
        otherWrap.hidden = !boxes.find(box => box.value === "other").checked;
      };
      customWrappers.push(toggle); toggle();
      group.append(types); wrap.append(group); sentence.append(wrap);
      continue;
    }
    const label = el("label", spec.label); label.htmlFor = spec.id;
    const control = el(["select", "hour"].includes(spec.type) ? "select" : "input");
    control.id = spec.id; control.autocomplete = "off";
    if (!["select", "hour"].includes(spec.type)) control.type = spec.type;
    controls[spec.id] = control; wrap.append(label, control);
    if (spec.type === "hour") {
      const blank = el("option", "請選擇／尚待確認"); blank.value = ""; control.append(blank);
      for (let hour = 0; hour < 24; hour++) {
        const option = el("option", hour + spec.suffix); option.value = String(hour); control.append(option);
      }
    }
    if (spec.type === "select") {
      for (const option of [{ id: "", label: "請選擇／尚待確認" }, ...spec.options, ...(spec.allowCustom === false ? [] : [{ id: "custom", label: spec.customLabel || "其他，自行填寫" }])]) {
        const node = el("option", option.label); node.value = option.id; control.append(node);
      }
      const customWrap = el("span", "", "custom-slot");
      const customLabel = el("label", "自行填寫「" + spec.label + "」的文字");
      const custom = el(spec.customType === "number" ? "input" : "textarea");
      custom.id = spec.id + "Custom"; custom.rows = 2; custom.autocomplete = "off";
      if (spec.customType === "number") { custom.type = "number"; custom.min = "0"; custom.step = "any"; }
      customLabel.htmlFor = custom.id; controls[custom.id] = custom;
      customWrap.append(customLabel, custom); wrap.append(customWrap);
      if (spec.customReply) {
        const replyLabel = el("label", "民眾回覆的油煙處理說明（不填設備種類）");
        const replyCustom = el("textarea"); replyCustom.id = spec.id + "ReplyCustom"; replyCustom.rows = 2; replyCustom.autocomplete = "off";
        replyLabel.htmlFor = replyCustom.id; controls[replyCustom.id] = replyCustom;
        customWrap.append(replyLabel, replyCustom);
      }
      const toggle = () => { customWrap.hidden = control.value !== "custom"; };
      control.addEventListener("change", toggle); customWrappers.push(toggle); toggle();
      if (spec.options.some(option => option.equipmentMode)) customWrappers.push(() => {
        for (const node of control.options) {
          const option = spec.options.find(item => item.id === node.value);
          node.disabled = !!option?.equipmentMode && option.equipmentMode !== controls.equipment.value;
          node.hidden = node.disabled;
          if (node.disabled && node.selected) control.value = "";
        }
      });
    }
    if (spec.showWhen) customWrappers.push(() => {
      wrap.hidden = controls[spec.showWhen.field].value !== spec.showWhen.value;
      control.disabled = wrap.hidden;
      if (wrap.hidden) control.value = "";
    });
    sentence.append(wrap);
  }
  customWrappers.forEach(toggle => toggle());
  form.addEventListener("change", () => customWrappers.forEach(toggle => toggle()));
  form.append(sentence);
  const status = el("p"); status.setAttribute("role", "status");
  const outputs = el("div"); outputs.hidden = true;
  const drafts = {};
  for (const [key, title] of [["record", "稽查紀錄草稿"], ["reply", "民眾回覆草稿"]]) {
    const section = el("section", "", "panel"); section.append(el("h2", title));
    const label = el("label", "可修改文字；不會改動原始草稿模板。"); label.htmlFor = key;
    const area = el("textarea"); area.id = key; area.rows = 8; area.autocomplete = "off"; area.spellcheck = false;
    drafts[key] = area;
    const message = el("p"); message.setAttribute("role", "status");
    const copy = button("複製文字", async () => {
      message.textContent = "";
      try {
        if (!navigator.clipboard?.writeText) throw new Error("fallback");
        await navigator.clipboard.writeText(area.value); message.textContent = "已複製目前文字。";
      } catch (_) {
        area.focus(); area.select(); let copied = false;
        try { copied = document.execCommand("copy"); } catch (_) { /* 手動複製 */ }
        message.textContent = copied ? "已複製目前文字。" : "已選取文字，請按 Ctrl+C 複製。";
      }
    }, true);
    area.addEventListener("input", () => { message.textContent = ""; });
    section.append(label, area, copy, message); outputs.append(section);
  }
  function changed() {
    if (!outputs.hidden) status.textContent = "選項已變更，下方仍為上次草稿，請重新填入草稿。";
  }
  form.addEventListener("input", changed); form.addEventListener("change", changed);
  const actions = el("div", "", "actions");
  actions.append(button(template.demoLabel, () => {
    Object.values(controls).forEach(control => { control.value = ""; });
    for (const [key, value] of Object.entries(template.demo)) controls[key].value = value;
    customWrappers.forEach(toggle => toggle());
    status.textContent = outputs.hidden ? "已套用你提供的草稿選項，請按「填入兩份草稿」。" : "已套用你提供的草稿選項；下方仍為上次文字，請重新填入。";
  }, true));
  actions.append(button("填入兩份草稿", () => {
    if (!outputs.hidden && !window.confirm("重新填入將覆蓋下方兩份草稿及手動修改，是否繼續？")) return;
    const input = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value]));
    try {
      const generated = DraftEngine.generate(config, template.id, input);
      for (const key of Object.keys(drafts)) drafts[key].value = generated[key];
      outputs.querySelectorAll('[role="status"]').forEach(node => { node.textContent = ""; });
      outputs.hidden = false; status.textContent = "已依選項填回兩份草稿，請核對後複製使用。";
      drafts.record.focus();
    } catch (error) { status.textContent = "無法填入草稿：" + error.message; }
  }));
  form.append(actions); app.append(form, status, outputs);
})();
