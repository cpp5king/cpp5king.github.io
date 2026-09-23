(function (root) {
  "use strict";
  function fill(text, values, missing) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? "").trim() || missing);
  }
  function generate(config, templateId, input) {
    const template = config.templates.find(item => item.id === templateId);
    if (!template) throw new Error("找不到指定模板。");
    if (template.fillIn) return generateFillIn(template, input);
    const values = {};
    const conditions = { ...config.conditions, ...template.conditions };
    for (const group of config.groups) for (const field of group.fields) {
      const raw = String(input[field.id] ?? "").trim();
      values[field.id] = conditions[field.id] ? conditions[field.id][raw] || config.missing : raw || config.missing;
    }
    values.resultDetails = String(input.resultDetails ?? "").trim() || config.missing;
    const baseResult = config.results.find(item => item.id === input.result);
    const result = baseResult ? { ...baseResult, ...template.resultOverrides?.[baseResult.id] } : null;
    values.resultRecord = result ? fill(result.record, values, config.missing) : config.missing;
    values.resultReply = result ? fill(result.reply, values, config.missing) : config.missing;
    return {
      record: template.record.map(text => fill(text, values, config.missing)).join("\n\n"),
      reply: template.reply.map(text => fill(text, values, config.missing)).join("\n\n")
    };
  }
  function generateFillIn(template, input) {
    const values = {};
    const replyValues = {};
    for (const field of template.fields) {
      if (field.showWhen && input[field.showWhen.field] !== field.showWhen.value) {
        values[field.id] = replyValues[field.id] = "";
        continue;
      }
      const raw = String(input[field.id] ?? "").trim();
      let value = raw;
      let replyValue;
      if (field.type === "equipment") {
        if (raw === "none") value = field.noneText;
        else if (raw === "present") {
          const selected = Array.isArray(input[field.id + "Types"]) ? input[field.id + "Types"] : [];
          const names = field.options.filter(option => selected.includes(option.id)).map(option => option.id === "other"
            ? String(input[field.id + "Other"] ?? "").trim() || field.otherMissing : option.label);
          value = field.recordText.replace("{{types}}", () => names.join("、") || field.typesMissing);
          replyValue = field.replyText;
        } else value = field.missing;
      } else if (field.type === "select") {
        const option = field.options.find(option => option.id === raw && (!option.equipmentMode || option.equipmentMode === input.equipment));
        if (raw === "custom" && field.allowCustom !== false) {
          const custom = String(input[field.id + "Custom"] ?? "").trim();
          const valid = custom && (field.customType !== "number" || /^(?:\d+)(?:\.\d+)?$/.test(custom));
          value = valid ? (field.customPrefix || "") + custom + (field.customSuffix || "") : field.missing;
          if (field.customReply) replyValue = String(input[field.id + "ReplyCustom"] ?? "").trim() || field.missing;
        } else {
          value = option?.value ?? field.missing;
          replyValue = option?.replyValue;
        }
      } else if (field.type === "date") {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
        const date = match ? new Date(raw + "T00:00:00Z") : null;
        value = match && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === raw && Number(match[1]) > 1911
          ? `${Number(match[1]) - 1911}年${Number(match[2])}月${Number(match[3])}日` : field.missing;
      } else if (field.type === "hour") {
        value = /^(?:[0-9]|1[0-9]|2[0-3])$/.test(raw) ? Number(raw) + field.suffix : field.missing;
      } else value = raw || field.missing;
      values[field.id] = value;
      replyValues[field.id] = replyValue ?? value;
    }
    // 一次替換保留輸入原文；選擇「不填」的空字串不可變為尚待確認。
    const render = (text, source) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => source[key] ?? "尚待確認");
    return { record: template.record.map(text => render(text, values)).join("\n\n"), reply: template.reply.map(text => render(text, replyValues)).join("\n\n") };
  }
  root.DraftEngine = { generate };
})(typeof window === "undefined" ? globalThis : window);
