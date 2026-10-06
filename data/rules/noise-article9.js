// 第9條單一離線規則資料
(function(root){root.NOISE_ARTICLE9_RULES={
  "version": "2.7",
  "source": "使用者提供及確認的第9條第一階段規則與標準值",
  "types": [
    {
      "id": "factory",
      "label": "工廠（場）",
      "table": "factory",
      "legalBasis": "噪音管制法第9條第1項第1款"
    },
    {
      "id": "entertainment",
      "label": "娛樂場所",
      "table": "business",
      "legalBasis": "噪音管制法第9條第1項第2款"
    },
    {
      "id": "business",
      "label": "營業場所",
      "table": "business",
      "legalBasis": "噪音管制法第9條第1項第3款"
    },
    {
      "id": "construction",
      "label": "營建工程",
      "table": "construction",
      "legalBasis": "噪音管制法第9條第1項第4款"
    },
    {
      "id": "speaker",
      "label": "擴音設施",
      "table": "speaker",
      "legalBasis": "噪音管制法第9條第1項第5款"
    },
    {
      "id": "other",
      "label": "其他經主管機關公告之場所、工程及設施",
      "table": "other",
      "legalBasis": "噪音管制法第9條第1項第6款"
    }
  ],
  "facilities": [
    {
      "id": "1",
      "label": "空調（通風、冷暖氣機）系統"
    },
    {
      "id": "2",
      "label": "冷卻水塔"
    },
    {
      "id": "3",
      "label": "抽水（加壓）馬達"
    },
    {
      "id": "4",
      "label": "抽排風機"
    },
    {
      "id": "5",
      "label": "冷凍（冷藏）櫃"
    },
    {
      "id": "6",
      "label": "發電機（含固定及移動式）"
    },
    {
      "id": "7",
      "label": "變壓器"
    },
    {
      "id": "8",
      "label": "非營業用卡拉OK"
    }
  ],
  "periods": [
    {
      "id": "day",
      "label": "日間"
    },
    {
      "id": "evening",
      "label": "晚間"
    },
    {
      "id": "night",
      "label": "夜間"
    }
  ],
  "zones": [
    {
      "id": "1",
      "label": "第1類",
      "periods": {
        "day": [
          "07:00",
          "19:00"
        ],
        "evening": [
          "19:00",
          "22:00"
        ],
        "night": [
          "22:00",
          "07:00"
        ]
      }
    },
    {
      "id": "2",
      "label": "第2類",
      "periods": {
        "day": [
          "07:00",
          "19:00"
        ],
        "evening": [
          "19:00",
          "22:00"
        ],
        "night": [
          "22:00",
          "07:00"
        ]
      }
    },
    {
      "id": "3",
      "label": "第3類",
      "periods": {
        "day": [
          "07:00",
          "19:00"
        ],
        "evening": [
          "19:00",
          "23:00"
        ],
        "night": [
          "23:00",
          "07:00"
        ]
      }
    },
    {
      "id": "4",
      "label": "第4類",
      "periods": {
        "day": [
          "07:00",
          "19:00"
        ],
        "evening": [
          "19:00",
          "23:00"
        ],
        "night": [
          "23:00",
          "07:00"
        ]
      }
    }
  ],
  "frequencies": [
    {
      "id": "full",
      "label": "全頻（20Hz～20kHz）",
      "bands": [
        "full"
      ]
    },
    {
      "id": "low",
      "label": "低頻（20Hz～200Hz）",
      "bands": [
        "low"
      ]
    },
    {
      "id": "both",
      "label": "全頻＋低頻",
      "bands": [
        "full",
        "low"
      ]
    }
  ],
  "bands": {
    "full": "全頻（20Hz～20kHz）",
    "low": "低頻（20Hz～200Hz）"
  },
  "metrics": {
    "leq": "Leq",
    "lmax": "Lmax",
    "leqLF": "Leq,LF"
  },
  "tables": {
    "factory": {
      "full": {
        "leq": [
          [
            50,
            45,
            40
          ],
          [
            57,
            52,
            47
          ],
          [
            67,
            57,
            52
          ],
          [
            80,
            70,
            65
          ]
        ]
      },
      "low": {
        "leqLF": [
          [
            39,
            39,
            36
          ],
          [
            39,
            39,
            36
          ],
          [
            44,
            44,
            41
          ],
          [
            47,
            47,
            44
          ]
        ]
      }
    },
    "business": {
      "full": {
        "leq": [
          [
            55,
            50,
            40
          ],
          [
            57,
            52,
            47
          ],
          [
            67,
            57,
            52
          ],
          [
            80,
            70,
            65
          ]
        ]
      },
      "low": {
        "leqLF": [
          [
            32,
            32,
            27
          ],
          [
            37,
            32,
            27
          ],
          [
            37,
            37,
            32
          ],
          [
            40,
            40,
            35
          ]
        ]
      }
    },
    "construction": {
      "full": {
        "leq": [
          [
            67,
            47,
            47
          ],
          [
            67,
            57,
            47
          ],
          [
            72,
            67,
            62
          ],
          [
            80,
            70,
            65
          ]
        ],
        "lmax": [
          [
            100,
            80,
            70
          ],
          [
            100,
            80,
            70
          ],
          [
            100,
            85,
            75
          ],
          [
            100,
            85,
            75
          ]
        ]
      },
      "low": {
        "leqLF": [
          [
            44,
            44,
            39
          ],
          [
            44,
            44,
            39
          ],
          [
            46,
            46,
            41
          ],
          [
            49,
            49,
            44
          ]
        ]
      }
    },
    "speaker": {
      "full": {
        "leq": [
          [
            57,
            47,
            40
          ],
          [
            72,
            57,
            47
          ],
          [
            77,
            62,
            52
          ],
          [
            82,
            72,
            62
          ]
        ]
      }
    },
    "other": {
      "full": {
        "leq": [
          [
            55,
            50,
            35
          ],
          [
            57,
            52,
            42
          ],
          [
            67,
            57,
            47
          ],
          [
            80,
            70,
            60
          ]
        ]
      },
      "low": {
        "leqLF": [
          [
            32,
            32,
            27
          ],
          [
            37,
            32,
            27
          ],
          [
            37,
            37,
            32
          ],
          [
            40,
            40,
            35
          ]
        ]
      }
    }
  },
  "measurement": {
    "durationSeconds": 120,
    "windLimit": 5,
    "noCorrectionDifference": 10,
    "minimumDifference": 3,
    "annualBackgroundType": "factory",
    "annualBackgroundBand": "full",
    "metrics": [
      {
        "id": "leq",
        "band": "full",
        "label": "一般均能音量",
        "short": "均能",
        "standard": "均能"
      },
      {
        "id": "lmax",
        "band": "full",
        "label": "最大音量",
        "short": "最大音量",
        "standard": "最大音量"
      },
      {
        "id": "leqLF",
        "band": "low",
        "label": "低頻均能音量",
        "short": "低頻均能",
        "standard": "低頻均能"
      }
    ],
    "points": {
      "yes": {
        "record": "陳情人指定之生活居住場所",
        "reply": "臺端指定之生活居住場所"
      },
      "no": {
        "record": "周界1公尺外之適當處所",
        "reply": "周界外之適當處所"
      }
    },
    "messages": {
      "pending": window.NOISE_TEXTS.common.missing,
      "rain": window.NOISE_TEXTS.article9.text044,
      "wind": window.NOISE_TEXTS.article9.text045,
      "difference": window.NOISE_TEXTS.article9.text046,
      "compliant": window.NOISE_TEXTS.article9.text047,
      "exceeded": window.NOISE_TEXTS.article9.text048,
      "background": window.NOISE_TEXTS.article9.text049,
      "unsupported": window.NOISE_TEXTS.article9.text050
    }
  }
};})(typeof window === "undefined" ? globalThis : window);
