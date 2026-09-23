(function () {
  "use strict";
  const app = document.getElementById("app");
  let flow = null;
  let history = [];
  function el(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function button(label, action, secondary = false) {
    const result = el("button", label, secondary ? "secondary" : "");
    result.type = "button";
    result.addEventListener("click", action);
    return result;
  }
  function heading(text) {
    const title = el("h2", text);
    title.tabIndex = -1;
    app.append(title);
    title.focus();
  }
  function section(title, content) {
    const box = el("section", "", "panel");
    box.append(el("h3", title));
    if (Array.isArray(content)) {
      const list = el("ul");
      content.forEach(text => list.append(el("li", text)));
      box.append(list);
    } else box.append(el("p", content));
    return box;
  }
  function home() {
    flow = null;
    history = [];
    app.replaceChildren();
    heading("選擇案件流程");
    app.append(el("p", "第一版僅提供空氣污染 → 餐飲業 → 異味案件。請勿在本工具輸入個人資料。"));
    for (const item of window.INSPECTION_FLOWS || []) {
      const card = section(item.title, item.description);
      card.append(el("p", "資料版本：" + item.version));
      card.append(button("開始示範判斷", () => {
        try { flow = FlowEngine.validate(item); history = []; render(); }
        catch (error) { app.replaceChildren(); heading("流程資料無法載入"); app.append(el("p", error.message), button("返回首頁", home, true)); }
      }));
      app.append(card);
    }
    if (!window.INSPECTION_FLOWS?.length) app.append(el("p", "找不到流程資料，請確認 data/flows 資料夾完整。"));
  }
  function render() {
    app.replaceChildren();
    const id = FlowEngine.current(flow, history);
    const node = flow.nodes[id];
    if (node) {
      heading("步驟 " + (history.length + 1) + "：" + node.title);
      app.append(section("現場應確認事項", node.checks), section("應蒐證事項", node.evidence), section("下一步處理方向", node.direction), section("法規依據", node.legal));
      const choices = el("div", "", "actions");
      node.options.forEach((option, index) => choices.append(button(option.label, () => { history = FlowEngine.choose(flow, history, index); render(); })));
      app.append(choices);
    } else {
      const outcome = flow.outcomes[id];
      heading("案件判斷摘要（假資料示範）");
      app.append(el("p", flow.category.join(" → ") + " ｜ 資料版本：" + flow.version));
      app.append(section("示範結果", outcome.title), section("下一步處理方向", outcome.direction));
      const path = el("ol", "", "history");
      history.forEach(entry => {
        const step = flow.nodes[entry.nodeId];
        const row = el("li");
        row.append(el("h3", step.title), el("p", "選擇：" + entry.answer), section("現場應確認事項", step.checks), section("應蒐證事項", step.evidence), section("下一步處理方向", step.direction), section("法規依據", step.legal));
        path.append(row);
      });
      app.append(path, el("p", "本摘要僅彙整本次選項，未儲存；不包含個人資料，也不構成實際案件之法律判斷。", "notice"));
    }
    const navigation = el("div", "", "actions navigation");
    if (history.length) navigation.append(button("上一步", () => { history = history.slice(0, -1); render(); }, true));
    navigation.append(button("返回首頁並清除作答", home, true));
    app.append(navigation);
  }
  home();
})();
