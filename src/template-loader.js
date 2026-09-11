(function (root) {
  "use strict";
  function unique(items, label) {
    if (!Array.isArray(items)) throw new Error(label + "必須是陣列。");
    const ids = new Set();
    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id)) throw new Error(label + "識別碼缺漏或重複。");
      ids.add(item.id);
    }
  }
  function validateCatalog(config) {
    if (!config) throw new Error("找不到案件分類設定。");
    unique(config.categories, "案件大類"); unique(config.caseTypes, "案件類型"); unique(config.templateFiles, "模板清單");
    for (const category of config.categories) {
      if (!category.title || !["active", "development"].includes(category.status)) throw new Error("案件大類名稱或狀態不完整。");
    }
    for (const type of config.caseTypes) {
      if (!type.title || !config.categories.some(item => item.id === type.categoryId) || !["active", "development"].includes(type.status)) throw new Error("案件類型資料或所屬大類無效。");
    }
    const files = new Set();
    for (const entry of config.templateFiles) {
      // 只載入本目錄的 JS 資料檔，不接受網址或跨目錄路徑。
      if (!/^[\w-]+\.js$/.test(entry.file) || files.has(entry.file)) throw new Error("模板檔名無效或重複。");
      files.add(entry.file);
    }
    return config;
  }
  function validateLoaded(config) {
    validateCatalog(config); unique(config.templates, "已載入模板");
    if (config.templates.length !== config.templateFiles.length) throw new Error("模板數量與載入清單不一致。");
    for (const template of config.templates) {
      if (!config.templateFiles.some(entry => entry.id === template.id)) throw new Error("模板識別碼與清單不一致。");
      const type = config.caseTypes.find(item => item.id === template.caseTypeId && item.categoryId === template.categoryId);
      if (!type || type.status !== "active" || !config.categories.some(item => item.id === template.categoryId && item.status === "active")) throw new Error("模板所屬分類不存在或尚未開放。");
      root.DraftEngine.validate(template);
    }
    return config;
  }
  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "data/templates/" + file;
      script.onload = resolve;
      script.onerror = () => reject(new Error("無法載入模板檔：" + file));
      document.head.append(script);
    });
  }
  async function load(config, readFile = loadScript) {
    validateCatalog(config);
    config.templates = [];
    for (const entry of config.templateFiles) {
      try { await readFile(entry.file); }
      catch (error) { throw new Error("模板 " + entry.file + " 載入失敗：" + error.message); }
    }
    return validateLoaded(config);
  }
  root.TemplateLoader = { load, validateCatalog, validateLoaded };
})(typeof window === "undefined" ? globalThis : window);
