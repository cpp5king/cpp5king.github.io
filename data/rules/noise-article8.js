// 唯一來源：使用者核定之公告條件；2.2 將工程選項統一為既有營建工程分支。
(function(root) { root.NOISE_ARTICLE8_RULES = {
  "version": "2.2",
  "source": "使用者提供之115年3月5日新北市公告內容",
  "legalBasis": "噪音管制法第8條暨本府現行公告相關",
  "zones": [
    {
      "id": "1",
      "label": "第一類",
      "value": "一"
    },
    {
      "id": "2",
      "label": "第二類",
      "value": "二"
    },
    {
      "id": "3",
      "label": "第三類",
      "value": "三"
    },
    {
      "id": "4",
      "label": "第四類",
      "value": "四"
    }
  ],
  "acts": [
    {
      "id": "fireworks",
      "label": "施放爆竹煙火",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": true,
      "exceptionsComplete": true,
      "exceptions": [
        {
          "id": "government",
          "label": "政府辦理大型活動或國際交流，且經本府專案核准"
        },
        {
          "id": "festival",
          "label": "除夕及春節至元宵節節慶當日"
        }
      ]
    },
    {
      "id": "outdoorSpeaker",
      "label": "室外使用擴音設施",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": true,
      "exceptionsComplete": true,
      "exceptions": [
        {
          "id": "government",
          "label": "政府辦理大型活動或國際交流，且經本府專案核准"
        },
        {
          "id": "publicDuty",
          "label": "執行公務"
        },
        {
          "id": "publicInterest",
          "label": "涉及公共安全及公眾利益"
        },
        {
          "id": "emergency",
          "label": "緊急危難救助"
        }
      ]
    },
    {
      "id": "commercialMachinery",
      "label": "使用動力機械從事餐飲、洗染、乾燥、印刷商業行為",
      "zones": [
        "1",
        "2"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": false
    },
    {
      "id": "religious",
      "label": "使用發出聲響之法器從事宗教或民俗活動",
      "zones": [
        "1",
        "2"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": false
    },
    {
      "id": "instrument",
      "label": "使用樂器發聲",
      "zones": [
        "1",
        "2"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": false
    },
    {
      "id": "vehicleBusiness",
      "label": "運轉引擎或使用動力機械從事清洗、修理、改裝車輛之商業行為",
      "zones": [
        "1",
        "2",
        "3"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "hasExceptions": false
    },
    {
      "id": "karaoke",
      "label": "提供伴唱視聽設備供人歌唱",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "holidayPeriods": [
        [
          "22:00",
          "08:00"
        ],
        [
          "12:00",
          "14:00"
        ]
      ],
      "hasExceptions": true,
      "exceptionsComplete": true,
      "exceptions": [],
      "exceptionChecks": [
        {
          "id": "a8KaraokeRegistered",
          "label": "是否屬「視聽歌唱業」並經登記許可"
        },
        {
          "id": "a8KaraokeZoning",
          "label": "是否符合土地使用分區管制規定"
        }
      ]
    },
    {
      "id": "renovation",
      "label": "使用動力機械／手持工具從事裝修工程",
      "zones": [
        "1",
        "2",
        "3"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "holidayPeriods": [
        [
          "12:00",
          "14:00"
        ],
        [
          "20:00",
          "08:00"
        ]
      ],
      "hasExceptions": false
    },
    {
      "id": "construction",
      "label": "營建工程使用動力機械／手持工具",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "periods": [
        [
          "22:00",
          "08:00"
        ]
      ],
      "holidayPeriods": [
        [
          "12:00",
          "14:00"
        ],
        [
          "20:00",
          "08:00"
        ]
      ],
      "hasExceptions": true,
      "exceptionsComplete": true,
      "exceptions": [
        {
          "id": "emergency",
          "label": "緊急危難救助行為"
        },
        {
          "id": "repair",
          "label": "有危及公共安全、環境污染及影響民生用水、用電、用氣或通訊之搶救、搶修工程"
        },
        {
          "id": "approved",
          "label": "屬連續性或必要工程，並經目的事業主管機關核准施工者",
          "checks": [
            {
              "id": "a8Notice",
              "label": "施工日前3個日曆天（含）通知所在地里長協助告知民眾"
            },
            {
              "id": "a8Sign",
              "label": "施工現場設置告示牌，並載明公告要求之相關資訊"
            },
            {
              "id": "a8Documents",
              "label": "施工現場備妥核准文件供查，並採行適當噪音防制措施"
            }
          ]
        }
      ],
      "recordValue": "營建工程"
    },
    {
      "id": "exhaust",
      "label": "車輛排氣管公告禁止行為",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "allDay": true,
      "hasExceptions": false
    },
    {
      "id": "leafBlower",
      "label": "使用吹葉機從事環境清理作業",
      "zones": [
        "1",
        "2",
        "3",
        "4"
      ],
      "periods": [
        [
          "22:00",
          "06:00"
        ]
      ],
      "hasExceptions": true,
      "exceptionsComplete": true,
      "exceptions": [
        {
          "id": "safety",
          "label": "有危及公共安全"
        },
        {
          "id": "disaster",
          "label": "天然災害復原期間"
        },
        {
          "id": "emergency",
          "label": "緊急危難救助"
        },
        {
          "id": "approved",
          "label": "經目的事業主管機關核准"
        }
      ]
    }
  ],
  "messages": {
    "basic": window.NOISE_TEXTS.article8.text003,
    "act": window.NOISE_TEXTS.article8.text004,
    "holiday": window.NOISE_TEXTS.article8.text005,
    "timeOutside": window.NOISE_TEXTS.article8.text006,
    "zone": window.NOISE_TEXTS.article8.text007,
    "zoneOutside": window.NOISE_TEXTS.article8.text008,
    "exception": window.NOISE_TEXTS.article8.text009,
    "incomplete": window.NOISE_TEXTS.article8.text010,
    "exempt": window.NOISE_TEXTS.article8.text011,
    "established": window.NOISE_TEXTS.article8.text012,
    "checks": window.NOISE_TEXTS.article8.text013
  },
  "holidayDefinition": "例假日／國定假日為行政院人事行政總處公告政府行政機關辦公日曆表之放假日；平日為該日曆表之上班日。"
};
})(typeof window === "undefined" ? globalThis : window);
