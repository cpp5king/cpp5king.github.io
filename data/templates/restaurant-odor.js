// 依使用者核定：四種營業狀態、設備連動固定勸導、電子鼻選填及手冊交付選项。
window.INSPECTION_CONFIG.templates.push({
  "id": "restaurant-odor-reference",
  "categoryId": "air",
  "caseTypeId": "restaurant-odor",
  "title": "現有範本",
  "version": "1.0.0",
  "formTitle": "依草稿順序選填",
  "instructions": "依現場事實選填；電子鼻數值為選填。勸導文字依防制設備選項自動加入，無設備時請選擇手冊交付情形。",
  "relatedTemplates": [{"id":"restaurant-odor-sampling-pending","label":"周界異味採樣－待檢驗結果"}],
  "mobileWizard": {
    "ariaLabel": "餐飲油煙手機逐步流程",
    "brandLabel": "稽查助手",
    "brandSlogan": "空氣污染・現場查核",
    "fallbackTitle": "其他必要事項",
    "steps": [
      {"id":"basic","title":"稽查基本資料","help":"先記錄日期、時間與稽查對象；不知道的資料可保留待確認。","fields":["date","time","subject"]},
      {"id":"operation","title":"營業與烹飪狀態","help":"依到場當下實際情形選擇，不以平時狀態代替現場事實。","fields":["operating"]},
      {"id":"control","title":"油煙污染防制設備","help":"確認是否設有防制設備；有設備時再依現場可確認情形勾選設備種類。","fields":["equipment"]},
      {"id":"observation","title":"周界觀察與電子鼻","help":"記錄本次周界實際觀察；電子鼻數值為選填，不取代法定檢測。","fields":["observation","measurement"]},
      {"id":"guidance","title":"現場勸導／手冊","help":"依防制設備情形完成本次應記錄的勸導或手冊交付事項。","fields":["handbook"]}
    ]
  },
  "fields": [
    {
      "id": "date",
      "label": "稽查日期（輸出為民國年）",
      "type": "date",
      "format": "roc",
      "missing": "（日期尚待確認）"
    },
    {
      "id": "time",
      "label": "稽查時間（只選小時）",
      "type": "hour",
      "suffix": "時許",
      "missing": "（時間尚待確認）"
    },
    {
      "id": "subject",
      "label": "店名（請使用代稱）",
      "type": "text",
      "missing": "（店名尚待確認）"
    },
    {
      "id": "operating",
      "label": "營業狀態",
      "type": "select",
      "options": [
        {
          "id": "cooking",
          "label": "營業中，進行烹飪作業",
          "value": "營業中，進行烹飪作業"
        },
        {
          "id": "open-not-cooking",
          "label": "營業中，未進行烹飪作業",
          "value": "營業中，未進行烹飪作業"
        },
        {
          "id": "closed",
          "label": "未營業",
          "value": "未營業"
        },
        {
          "id": "close",
          "label": "大門深鎖",
          "value": "現場大門深鎖無人回應，於周界外巡查未發現有排放油煙致空污異味之情事，爾後本局將不定期派員前往巡查。"
        }
      ],
      "missing": "（營業狀態尚待確認）",
      "allowCustom": false
    },
    {
      "id": "equipment",
      "showWhen": {
        "field": "operating",
        "operator": "notEquals",
        "value": "close"
      },
      "label": "油煙污染防制情形",
      "type": "choiceGroup",
      "showUnanswered": false,
      "options": [
        {
          "id": "none",
          "label": "未設置污染防制設備",
          "value": ""
        },
        {
          "id": "present",
          "label": "油煙經污染防制設備處理後排放",
          "usesItems": true,
          "value": "油煙收集後經由空污防制設備處理（{{items}}）後排放至大氣，",
          "replyValue": "油煙收集後經由空污防制設備處理後排放至大氣，"
        }
      ],
      "itemsKey": "equipmentTypes",
      "itemsLabel": "有設備：勾選種類",
      "separator": "、",
      "items": [
        {
          "id": "bag",
          "label": "袋濾式"
        },
        {
          "id": "wash",
          "label": "洗滌式"
        },
        {
          "id": "static",
          "label": "靜電集塵"
        },
        {
          "id": "cyclone",
          "label": "旋風集塵"
        },
        {
          "id": "adsorption",
          "label": "吸附"
        },
        {
          "id": "absorption",
          "label": "吸收"
        },
        {
          "id": "combustion",
          "label": "燃燒"
        },
        {
          "id": "other",
          "label": "其他",
          "customKey": "equipmentOther",
          "customLabel": "其他設備名稱",
          "missing": "其他設備名稱尚待確認"
        }
      ],
      "itemsMissing": "設備種類尚待確認",
      "missing": "（油煙處理及防制設備情形尚待確認），"
    },
    {
      "id": "observation",
      "showWhen": {
        "field": "operating",
        "operator": "notEquals",
        "value": "close"
      },
      "label": "周界查察結果",
      "type": "select",
      "options": [
        {
          "id": "no-odor",
          "label": "未發現明顯油煙逸散致空污異味之情形",
          "value": "於周界外巡查未發現有明顯油煙逸散致空污異味之情形"
        },
        {
          "id": "smoke",
          "label": "些許油煙異味情形",
          "value": "於周界外巡查確有些許油煙異味情形"
        }
      ],
      "missing": "（周界查察結果尚待確認）"
    },
    {
      "id": "measurement",
      "showWhen": {
        "field": "operating",
        "operator": "notEquals",
        "value": "close"
      },
      "label": "電子鼻量測（只填入稽查紀錄）",
      "type": "number",
      "missing": "（電子鼻數值尚待確認）",
      "min": 0,
      "optional": true,
      "prefix": "（電子鼻數值為",
      "suffix": "）"
    },
    {
      "id": "guidancemaintenance",
      "label": "固定勸導文字",
      "type": "fixed",
      "value": "，本局仍勸導業者加強防制設備及增加維護保養設備頻率",
      "missing": "尚待確認",
      "showWhen": {
        "field": "equipment",
        "value": "present"
      }
    },
    {
      "id": "guidanceinstall",
      "label": "固定勸導文字",
      "type": "fixed",
      "value": "，本局仍囑業者加裝空污防制措施",
      "missing": "尚待確認",
      "showWhen": {
        "field": "equipment",
        "value": "none"
      }
    },
    {
      "id": "handbook",
      "label": "是否已交付新北市餐飲污染防制手冊",
      "type": "select",
      "allowCustom": false,
      "showWhen": {
        "field": "equipment",
        "value": "none"
      },
      "options": [
        {
          "id": "yes",
          "label": "本次已交付",
          "value": "，並當場交付新北市餐飲污染防制手冊供其參考"
        },
        {
          "id": "previous",
          "label": "先前已交付，本次不再重複交付",
          "value": ""
        }
      ],
      "missing": "，（手冊交付情形尚待確認）"
    },
    {
      "id": "operatingSeparator",
      "label": "固定銜接文字",
      "type": "fixed",
      "value": "，",
      "missing": "尚待確認",
      "showWhen": {
        "field": "operating",
        "operator": "notEquals",
        "value": "close"
      }
    },
    {
      "id": "closing",
      "label": "固定銜接文字",
      "type": "fixed",
      "value": "，爾後本局將不定期派員前往巡查，以維護環境品質。",
      "missing": "尚待確認",
      "showWhen": {
        "field": "operating",
        "operator": "notEquals",
        "value": "close"
      }
    }
  ],
  "record": [
    "本局於{{date}}{{time}}派員前往所陳地址，經查該址為{{subject}}，稽查時{{operating}}{{operatingSeparator}}{{equipment}}{{observation}}{{measurement}}{{guidancemaintenance}}{{guidanceinstall}}{{handbook}}{{closing}}"
  ],
  "reply": [
    "有關臺端反映事項，本局於{{date}}{{time}}派員前往所陳地址，經查該址為{{subject}}，稽查時{{operating}}{{operatingSeparator}}{{equipment}}{{observation}}{{guidancemaintenance}}{{guidanceinstall}}{{handbook}}{{closing}}若您再次發現污染情形，請撥打新北市政府1999市政服務專線反映，本局會再度派員依法查處。"
  ]
});
