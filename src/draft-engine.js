(function (root) {
  "use strict";
  const types = ['text', 'textarea', 'date', 'hour', 'time', 'number', 'select', 'checkbox', 'choiceGroup', 'checklist', 'fixed', 'computed'];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function matches(condition, input) {
    if (!condition) return true;
    if (condition.operator === 'in') return condition.value.includes(input[condition.field]);
    return condition.operator === 'notEquals' ? input[condition.field] !== condition.value : input[condition.field] === condition.value;
  }
  function validate(template) {
    if (!template || !template.id || !template.title || !Array.isArray(template.fields)) throw new Error('模板識別碼、名稱或欄位不完整。');
    if (template.workflow && !root.TemplateWorkflows?.[template.workflow]?.prepare) throw new Error('找不到模板的本機判斷模組。');
    const keys = new Set();
    const earlier = new Set();
    function claim(key) {
      if (typeof key !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(key) || ['constructor', 'prototype', '__proto__'].includes(key) || keys.has(key)) throw new Error('欄位識別碼缺漏、重複或無效：' + key);
      keys.add(key);
    }
    function condition(value) {
      if (value && (!earlier.has(value.field) || (value.operator === 'in' ? !Array.isArray(value.value) || !value.value.length || value.value.some(item => typeof item !== 'string') : typeof value.value !== 'string'))) throw new Error('條件必須指向前方已定義的欄位，並提供有效比較值。');
      if (value && value.operator !== undefined && !['equals', 'notEquals', 'in'].includes(value.operator)) throw new Error('不支援的條件運算子。');
    }
    for (const field of template.fields) {
      claim(field.id);
      if (!field.label || !types.includes(field.type) || typeof field.missing !== 'string' || !field.missing) throw new Error('欄位類型、名稱或缺漏提示無效：' + field.id);
      condition(field.showWhen);
      if (field.type === 'computed' && !template.workflow) throw new Error('計算欄位缺少本機判斷模組。');
      if (field.type === 'fixed' && typeof field.value !== 'string') throw new Error('固定文字欄位缺少文字。');
      if (field.type === 'hour' && typeof field.suffix !== 'string') throw new Error('小時欄位缺少輸出字尾。');
      if (field.type === 'date' && !['roc', 'iso', 'month-day'].includes(field.format)) throw new Error('日期格式須為 roc、iso 或 month-day。');
      if (field.type === 'number' && field.min !== undefined && !Number.isFinite(field.min)) throw new Error('數字欄位下限無效。');
      if (field.type === 'checkbox' && (typeof field.checkedValue !== 'string' || !field.checkedValue)) throw new Error('勾選欄位缺少有效勾選值。');
      if (['select', 'choiceGroup'].includes(field.type)) {
        if (!Array.isArray(field.options) || !field.options.length) throw new Error('選擇欄位缺少選項。');
        const ids = new Set();
        for (const option of field.options) {
          if (!option.id || option.id === 'custom' || ids.has(option.id) || !option.label || typeof option.value !== 'string') throw new Error('選項識別碼或文字缺漏／重複。');
          if (own(option, 'replyValue') && typeof option.replyValue !== 'string') throw new Error('回覆選項須為文字。');
          condition(option.when); ids.add(option.id);
        }
      }
      if (field.type === 'select' && field.allowCustom !== false) {
        claim(field.id + 'Custom');
        if (field.customReply) claim(field.id + 'ReplyCustom');
      }
      if (['choiceGroup', 'checklist'].includes(field.type)) {
        if (field.type === 'choiceGroup') {
          claim(field.itemsKey);
          if (!field.itemsLabel || !field.itemsMissing) throw new Error('複選子項設定不完整。');
        }
        if (!Array.isArray(field.items) || !field.items.length || typeof field.separator !== 'string') throw new Error('複選子項設定不完整。');
        if (field.emptyValue !== undefined && typeof field.emptyValue !== 'string') throw new Error('未勾選文字必須是字串。');
        const ids = new Set();
        for (const item of field.items) {
          condition(item.when);
          if (!item.id || ids.has(item.id) || !item.label) throw new Error('複選子項識別碼或名稱無效。');
          ids.add(item.id);
          if (item.customKey) { claim(item.customKey); if (!item.missing || !item.customLabel) throw new Error('自訂複選子項缺少提示。'); }
        }
      }
      earlier.add(field.id);
    }
    for (const kind of ['record', 'reply']) {
      if (!Array.isArray(template[kind]) || !template[kind].length) throw new Error('模板缺少草稿段落：' + kind);
      const variants = template[kind + 'Variants'] ?? [];
      if (!Array.isArray(variants)) throw new Error('条件段落必須是陣列。');
      for (const variant of variants) {
        if (!variant.when || !Array.isArray(variant.text) || !variant.text.length) throw new Error('條件段落設定不完整。');
        condition(variant.when);
      }
      for (const paragraph of [...template[kind], ...variants.flatMap(variant => variant.text)]) {
        if (typeof paragraph !== 'string') throw new Error('草稿段落必須是文字。');
        for (const match of paragraph.matchAll(/\{\{([^{}]+)\}\}/g)) if (!earlier.has(match[1])) throw new Error('草稿使用未定義的欄位：' + match[1]);
      }
    }
    return template;
  }
  function normalize(template, input) {
    if (template.workflow) {
      const workflow = root.TemplateWorkflows?.[template.workflow];
      if (!workflow?.prepare) throw new Error('找不到模板的本機判斷模組。');
      input = workflow.prepare(input);
    }
    const result = {};
    for (const field of template.fields) {
      if (!matches(field.showWhen, result)) { result[field.id] = field.type === 'checklist' ? [] : ''; continue; }
      if (field.type === 'fixed') { result[field.id] = ''; continue; }
      const raw = String(input[field.id] ?? '');
      if (field.type === 'checkbox') {
        result[field.id] = raw === field.checkedValue ? field.checkedValue : '';
      } else if (field.type === 'checklist') {
        const selected = Array.isArray(input[field.id]) ? input[field.id] : [];
        result[field.id] = field.items.filter(item => selected.includes(item.id) && matches(item.when, result)).map(item => item.id);
        for (const item of field.items) if (item.customKey && result[field.id].includes(item.id)) result[item.customKey] = String(input[item.customKey] ?? '');
      } else if (['select', 'choiceGroup'].includes(field.type)) {
        const option = field.options.find(item => item.id === raw && matches(item.when, result));
        if (field.type === 'select' && raw === 'custom' && field.allowCustom !== false) {
          result[field.id] = 'custom'; result[field.id + 'Custom'] = String(input[field.id + 'Custom'] ?? '');
          if (field.customReply) result[field.id + 'ReplyCustom'] = String(input[field.id + 'ReplyCustom'] ?? '');
        } else {
          result[field.id] = option?.id || '';
          if (field.type === 'choiceGroup' && option?.usesItems) {
            const selected = Array.isArray(input[field.itemsKey]) ? input[field.itemsKey] : [];
            result[field.itemsKey] = field.items.filter(item => selected.includes(item.id)).map(item => item.id);
            for (const item of field.items) if (item.customKey && result[field.itemsKey].includes(item.id)) result[item.customKey] = String(input[item.customKey] ?? '');
          }
        }
      } else result[field.id] = raw;
    }
    return result;
  }
  function generate(config, templateId, input) {
    const template = config.templates.find(item => item.id === templateId);
    if (!template) throw new Error('找不到指定模板。');
    validate(template);
    const facts = normalize(template, input);
    const errors = root.TemplateWorkflows?.[template.workflow]?.validate?.(facts) || [];
    if (errors.length) throw new Error(errors[0]);
    const values = {}; const replyValues = {};
    for (const field of template.fields) {
      if (!matches(field.showWhen, facts)) { values[field.id] = replyValues[field.id] = ''; continue; }
      const raw = field.type === 'checklist' ? '' : facts[field.id].trim();
      let value = field.missing; let replyValue;
      if (field.type === 'fixed') {
        value = field.value;
      } else if (field.type === 'checklist') {
        const selected = field.items.filter(item => facts[field.id].includes(item.id));
        const names = selected.map(item => item.customKey
          ? (item.valuePrefix || '') + (facts[item.customKey]?.trim() || item.missing)
          : item.value ?? item.label);
        value = selected.length ? (field.prefix || '') + names.join(field.separator) + (field.suffix || '') : field.emptyValue ?? field.missing;
      } else if (field.type === 'choiceGroup') {
        const option = field.options.find(item => item.id === raw && matches(item.when, facts));
        if (option) {
          value = option.value; replyValue = option.replyValue;
          if (option.usesItems) {
            const names = field.items.filter(item => facts[field.itemsKey]?.includes(item.id)).map(item => item.customKey ? facts[item.customKey]?.trim() || item.missing : item.label);
            const joined = names.join(field.separator) || field.itemsMissing;
            value = value.replace(/\{\{items\}\}/g, () => joined);
            if (replyValue !== undefined) replyValue = replyValue.replace(/\{\{items\}\}/g, () => joined);
          }
        }
      } else if (field.type === 'select') {
        const option = field.options.find(item => item.id === raw && matches(item.when, facts));
        if (raw === 'custom' && field.allowCustom !== false) {
          const custom = facts[field.id + 'Custom'].trim();
          const valid = custom && (field.customType !== 'number' || /^(?:\d+)(?:\.\d+)?$/.test(custom));
          value = valid ? (field.customPrefix || '') + custom + (field.customSuffix || '') : field.missing;
          if (field.customReply) replyValue = facts[field.id + 'ReplyCustom'].trim() || field.missing;
        } else { value = option?.value ?? field.missing; replyValue = option?.replyValue; }
      } else if (field.type === 'date') {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
        const date = match ? new Date(raw + 'T00:00:00Z') : null;
        const valid = match && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === raw;
        if (valid && field.format === 'iso') value = raw;
        else if (valid && field.format === 'month-day') value = `${Number(match[2])}月${Number(match[3])}日`;
        else if (valid && Number(match[1]) > 1911) value = `${Number(match[1]) - 1911}年${Number(match[2])}月${Number(match[3])}日`;
      } else if (field.type === 'hour') {
        if (/^(?:[0-9]|1[0-9]|2[0-3])$/.test(raw)) value = Number(raw) + field.suffix;
      } else if (field.type === 'time') {
        if (/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(raw)) value = raw;
      } else if (field.type === 'number') {
        const number = Number(raw);
        const valid = /^(?:\d+)(?:\.\d+)?$/.test(raw) && Number.isFinite(number) && (!field.integer || Number.isSafeInteger(number)) && (field.min === undefined || number >= field.min);
        if (valid) value = (field.prefix || '') + String(number) + (field.suffix || '');
        else if (!raw && field.optional === true) value = ''; 
      } else {
        value = raw || field.missing;
        if (raw && field.prefix && !(field.avoidDuplicatePrefix && raw.startsWith(field.prefix))) value = field.prefix + value;
      }
      values[field.id] = value; replyValues[field.id] = replyValue ?? value;
    }
    // 一次替換，輸入中的大括號或 HTML 文字保持原樣，不再次解析。
    const render = (text, source) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => source[key]);
    function paragraphs(kind) {
      const matching = (template[kind + 'Variants'] || []).filter(variant => matches(variant.when, facts));
      if (matching.length > 1) throw new Error('條件段落同時符合多個分支，請檢查模板設定。');
      return matching[0]?.text || template[kind];
    }
    return { record: paragraphs('record').map(text => render(text, values)).join('\n\n'), reply: paragraphs('reply').map(text => render(text, replyValues)).join('\n\n') };
  }
  root.DraftEngine = { generate, normalize, matches, validate };
})(typeof window === 'undefined' ? globalThis : window);
