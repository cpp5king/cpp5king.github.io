/* 不依賴畫面的流程核心；將來可由其他介面使用相同節點結構。 */
(function (root) {
  "use strict";
  function validate(flow) {
    if (!flow || !flow.nodes || !flow.outcomes || !flow.nodes[flow.start]) throw new Error("流程缺少起始節點。");
    for (const [id, node] of Object.entries(flow.nodes)) {
      if (flow.outcomes[id]) throw new Error("節點與結果的識別碼重複。");
      if (!node.title || !Array.isArray(node.options) || !node.options.length) throw new Error("節點缺少標題或選項。");
      if (!Array.isArray(node.checks) || !Array.isArray(node.evidence) || !node.direction || !node.legal) throw new Error("節點提示資料不完整。");
      for (const option of node.options) {
        if (!option.label || (!flow.nodes[option.next] && !flow.outcomes[option.next])) throw new Error("選項指向不存在的節點。");
      }
    }
    const active = new Set();
    const done = new Set();
    function visit(id) {
      if (flow.outcomes[id]) {
        if (!flow.outcomes[id].title || !flow.outcomes[id].direction) throw new Error("結果資料不完整。");
        return;
      }
      if (active.has(id)) throw new Error("示範流程不可包含循環。");
      if (done.has(id)) return;
      active.add(id);
      flow.nodes[id].options.forEach(option => visit(option.next));
      active.delete(id);
      done.add(id);
    }
    visit(flow.start);
    return flow;
  }
  function current(flow, history) {
    return history.length ? history[history.length - 1].next : flow.start;
  }
  function choose(flow, history, index) {
    const id = current(flow, history);
    const option = flow.nodes[id]?.options[index];
    if (!option) throw new Error("無效選項。");
    return history.concat({ nodeId: id, answer: option.label, next: option.next });
  }
  root.FlowEngine = { validate, current, choose };
})(typeof window === "undefined" ? globalThis : window);
