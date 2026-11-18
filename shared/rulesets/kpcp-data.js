// 由 tools/gen-kpcp-data.mjs 生成，请勿手工修改。
// 数据来源：守密人伴侣扩展/_rules-draft/data/{skills,occupations}.json 与 PDF 表 7–14；
// 生成命令：node tools/gen-kpcp-data.mjs（--check 只校验不写盘）


export const KPCP_SKILLS = [
  {
    "key": "accounting",
    "id": "Accounting",
    "name": "会计",
    "en": "Accounting",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  {
    "key": "archaeology",
    "id": "Archaeology",
    "name": "考古学",
    "en": "Archaeology",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  {
    "key": "computer",
    "id": "Computer Use",
    "name": "计算机使用",
    "en": "Computer Use",
    "cat": "学问",
    "base": 5,
    "flags": [
      "modern"
    ],
    "note": "仅现代"
  },
  {
    "key": "electronics",
    "id": "Electronics",
    "name": "电子学",
    "en": "Electronics",
    "cat": "学问",
    "base": 1,
    "flags": [
      "modern"
    ],
    "uncommon": true,
    "note": "仅现代"
  },
  {
    "key": "firstAid",
    "id": "First Aid",
    "name": "急救",
    "en": "First Aid",
    "cat": "学问",
    "base": 30,
    "flags": []
  },
  {
    "key": "history",
    "id": "History",
    "name": "历史",
    "en": "History",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  {
    "key": "hypnosis",
    "id": "Hypnosis",
    "name": "催眠",
    "en": "Hypnosis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "law",
    "id": "Law",
    "name": "法律",
    "en": "Law",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  {
    "key": "library",
    "id": "Library Use",
    "name": "图书馆使用",
    "en": "Library Use",
    "cat": "学问",
    "base": 20,
    "flags": []
  },
  {
    "key": "medicine",
    "id": "Medicine",
    "name": "医学",
    "en": "Medicine",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  {
    "key": "naturalWorld",
    "id": "Natural World",
    "name": "自然学",
    "en": "Natural World",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  {
    "key": "occult",
    "id": "Occult",
    "name": "神秘学",
    "en": "Occult",
    "cat": "学问",
    "base": 5,
    "flags": [],
    "note": "原 学识(Lore) 改为神秘学"
  },
  {
    "key": "psychoanalysis",
    "id": "Psychoanalysis",
    "name": "精神分析",
    "en": "Psychoanalysis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "psychology",
    "id": "Psychology",
    "name": "心理学",
    "en": "Psychology",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  {
    "key": "science",
    "id": "Science",
    "name": "科学",
    "en": "Science",
    "cat": "学问",
    "base": 1,
    "spec": "science",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  {
    "key": "religion",
    "id": "Religion",
    "name": "宗教",
    "en": "Religion",
    "cat": "学问",
    "base": 10,
    "spec": "religion",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "新增技能，须选专精"
  },
  {
    "key": "artillery",
    "id": "Artillery",
    "name": "炮术",
    "en": "Artillery",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "demolitions",
    "id": "Demolitions",
    "name": "爆破",
    "en": "Demolitions",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "dodge",
    "id": "Dodge",
    "name": "闪避",
    "en": "Dodge",
    "cat": "战斗",
    "base": null,
    "flags": [
      "dexHalf"
    ]
  },
  {
    "key": "fighting",
    "id": "Fighting",
    "name": "格斗",
    "en": "Fighting",
    "cat": "战斗",
    "base": 0,
    "spec": "fighting",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（斗殴25/斧15/链锯15/连枷15/绞索15/长矛20/剑20/鞭15）"
  },
  {
    "key": "firearms",
    "id": "Firearms",
    "name": "射击",
    "en": "Firearms",
    "cat": "战斗",
    "base": 0,
    "spec": "firearms",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（手枪20/步枪霰弹枪25/弓15/火焰喷射器15/重型武器15/机枪15）"
  },
  {
    "key": "elecRepair",
    "id": "Electrical Repair",
    "name": "电气维修",
    "en": "Electrical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  {
    "key": "locksmith",
    "id": "Locksmith",
    "name": "锁匠",
    "en": "Locksmith",
    "cat": "技艺",
    "base": 1,
    "flags": []
  },
  {
    "key": "mechRepair",
    "id": "Mechanical Repair",
    "name": "机械维修",
    "en": "Mechanical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  {
    "key": "opHeavyMachine",
    "id": "Operate Heavy Machinery",
    "name": "操作重型机械",
    "en": "Operate Heavy Machinery",
    "cat": "技艺",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "sleightOfHand",
    "id": "Sleight of Hand",
    "name": "妙手",
    "en": "Sleight of Hand",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  {
    "key": "art",
    "id": "Art/Craft",
    "name": "艺术/手艺",
    "en": "Art/Craft",
    "cat": "技艺",
    "base": 5,
    "spec": "art",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  {
    "key": "credit",
    "id": "Credit Rating",
    "name": "信用评级",
    "en": "Credit Rating",
    "cat": "社交",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "每职业固定值（替代原范围）"
  },
  {
    "key": "persuade",
    "id": "Persuade",
    "name": "说服",
    "en": "Persuade",
    "cat": "社交",
    "base": 10,
    "flags": [],
    "note": "合并 魅惑+话术+恐吓+理性论证"
  },
  {
    "key": "reassure",
    "id": "Reassure",
    "name": "安抚",
    "en": "Reassure",
    "cat": "社交",
    "base": null,
    "flags": [],
    "formula": {
      "from": "APP",
      "div": 5
    },
    "uncommon": true,
    "note": "新增技能"
  },
  {
    "key": "cthulhu",
    "id": "Cthulhu Mythos",
    "name": "克苏鲁神话",
    "en": "Cthulhu Mythos",
    "cat": "神话",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "个人兴趣点不可投入"
  },
  {
    "key": "language",
    "id": "Language (Other)",
    "name": "外语",
    "en": "Language (Other)",
    "cat": "语言",
    "base": 1,
    "spec": "language",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 3,
    "note": "统称技能，须选具体语言"
  },
  {
    "key": "ownLanguage",
    "id": "Language (Own)",
    "name": "母语",
    "en": "Language (Own)",
    "cat": "语言",
    "base": null,
    "flags": [
      "edu",
      "named"
    ],
    "note": "起始 = EDU；可花 10 点习得第二门母语"
  },
  {
    "key": "listen",
    "id": "Listen",
    "name": "聆听",
    "en": "Listen",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  {
    "key": "navigate",
    "id": "Navigate",
    "name": "导航",
    "en": "Navigate",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  {
    "key": "readLips",
    "id": "Read Lips",
    "name": "读唇",
    "en": "Read Lips",
    "cat": "调查",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "spotHidden",
    "id": "Spot Hidden",
    "name": "侦查",
    "en": "Spot Hidden",
    "cat": "调查",
    "base": 25,
    "flags": []
  },
  {
    "key": "stealth",
    "id": "Stealth",
    "name": "潜行",
    "en": "Stealth",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  {
    "key": "track",
    "id": "Track",
    "name": "追踪",
    "en": "Track",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  {
    "key": "animalHandling",
    "id": "Animal Handling",
    "name": "驯兽",
    "en": "Animal Handling",
    "cat": "运动",
    "base": 5,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "climb",
    "id": "Climb",
    "name": "攀爬",
    "en": "Climb",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  {
    "key": "diving",
    "id": "Diving",
    "name": "潜水",
    "en": "Diving",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  {
    "key": "driveAuto",
    "id": "Drive Auto",
    "name": "汽车驾驶",
    "en": "Drive Auto",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  {
    "key": "jump",
    "id": "Jump",
    "name": "跳跃",
    "en": "Jump",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  {
    "key": "pilotAircraft",
    "id": "Pilot Aircraft",
    "name": "驾驶（飞行器）",
    "en": "Pilot Aircraft",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  {
    "key": "pilotBoat",
    "id": "Pilot Boat",
    "name": "驾驶（船艇）",
    "en": "Pilot Boat",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  {
    "key": "survival",
    "id": "Survival",
    "name": "生存",
    "en": "Survival",
    "cat": "运动",
    "base": 10,
    "flags": [],
    "note": "不再分专精"
  },
  {
    "key": "swim",
    "id": "Swim",
    "name": "游泳",
    "en": "Swim",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  {
    "key": "throw",
    "id": "Throw",
    "name": "投掷",
    "en": "Throw",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  {
    "key": "ride",
    "id": "Ride",
    "name": "骑术",
    "en": "Ride",
    "cat": "运动",
    "base": 5,
    "spec": "ride",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "统称技能，须选坐骑"
  }
];

export const KPCP_SKILL_BY_KEY = {
  "accounting": {
    "key": "accounting",
    "id": "Accounting",
    "name": "会计",
    "en": "Accounting",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "archaeology": {
    "key": "archaeology",
    "id": "Archaeology",
    "name": "考古学",
    "en": "Archaeology",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  "computer": {
    "key": "computer",
    "id": "Computer Use",
    "name": "计算机使用",
    "en": "Computer Use",
    "cat": "学问",
    "base": 5,
    "flags": [
      "modern"
    ],
    "note": "仅现代"
  },
  "electronics": {
    "key": "electronics",
    "id": "Electronics",
    "name": "电子学",
    "en": "Electronics",
    "cat": "学问",
    "base": 1,
    "flags": [
      "modern"
    ],
    "uncommon": true,
    "note": "仅现代"
  },
  "firstAid": {
    "key": "firstAid",
    "id": "First Aid",
    "name": "急救",
    "en": "First Aid",
    "cat": "学问",
    "base": 30,
    "flags": []
  },
  "history": {
    "key": "history",
    "id": "History",
    "name": "历史",
    "en": "History",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "hypnosis": {
    "key": "hypnosis",
    "id": "Hypnosis",
    "name": "催眠",
    "en": "Hypnosis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "law": {
    "key": "law",
    "id": "Law",
    "name": "法律",
    "en": "Law",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "library": {
    "key": "library",
    "id": "Library Use",
    "name": "图书馆使用",
    "en": "Library Use",
    "cat": "学问",
    "base": 20,
    "flags": []
  },
  "medicine": {
    "key": "medicine",
    "id": "Medicine",
    "name": "医学",
    "en": "Medicine",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  "naturalWorld": {
    "key": "naturalWorld",
    "id": "Natural World",
    "name": "自然学",
    "en": "Natural World",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  "occult": {
    "key": "occult",
    "id": "Occult",
    "name": "神秘学",
    "en": "Occult",
    "cat": "学问",
    "base": 5,
    "flags": [],
    "note": "原 学识(Lore) 改为神秘学"
  },
  "psychoanalysis": {
    "key": "psychoanalysis",
    "id": "Psychoanalysis",
    "name": "精神分析",
    "en": "Psychoanalysis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "psychology": {
    "key": "psychology",
    "id": "Psychology",
    "name": "心理学",
    "en": "Psychology",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  "science": {
    "key": "science",
    "id": "Science",
    "name": "科学",
    "en": "Science",
    "cat": "学问",
    "base": 1,
    "spec": "science",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  "religion": {
    "key": "religion",
    "id": "Religion",
    "name": "宗教",
    "en": "Religion",
    "cat": "学问",
    "base": 10,
    "spec": "religion",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "新增技能，须选专精"
  },
  "artillery": {
    "key": "artillery",
    "id": "Artillery",
    "name": "炮术",
    "en": "Artillery",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "demolitions": {
    "key": "demolitions",
    "id": "Demolitions",
    "name": "爆破",
    "en": "Demolitions",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "dodge": {
    "key": "dodge",
    "id": "Dodge",
    "name": "闪避",
    "en": "Dodge",
    "cat": "战斗",
    "base": null,
    "flags": [
      "dexHalf"
    ]
  },
  "fighting": {
    "key": "fighting",
    "id": "Fighting",
    "name": "格斗",
    "en": "Fighting",
    "cat": "战斗",
    "base": 0,
    "spec": "fighting",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（斗殴25/斧15/链锯15/连枷15/绞索15/长矛20/剑20/鞭15）"
  },
  "firearms": {
    "key": "firearms",
    "id": "Firearms",
    "name": "射击",
    "en": "Firearms",
    "cat": "战斗",
    "base": 0,
    "spec": "firearms",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（手枪20/步枪霰弹枪25/弓15/火焰喷射器15/重型武器15/机枪15）"
  },
  "elecRepair": {
    "key": "elecRepair",
    "id": "Electrical Repair",
    "name": "电气维修",
    "en": "Electrical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "locksmith": {
    "key": "locksmith",
    "id": "Locksmith",
    "name": "锁匠",
    "en": "Locksmith",
    "cat": "技艺",
    "base": 1,
    "flags": []
  },
  "mechRepair": {
    "key": "mechRepair",
    "id": "Mechanical Repair",
    "name": "机械维修",
    "en": "Mechanical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "opHeavyMachine": {
    "key": "opHeavyMachine",
    "id": "Operate Heavy Machinery",
    "name": "操作重型机械",
    "en": "Operate Heavy Machinery",
    "cat": "技艺",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "sleightOfHand": {
    "key": "sleightOfHand",
    "id": "Sleight of Hand",
    "name": "妙手",
    "en": "Sleight of Hand",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "art": {
    "key": "art",
    "id": "Art/Craft",
    "name": "艺术/手艺",
    "en": "Art/Craft",
    "cat": "技艺",
    "base": 5,
    "spec": "art",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  "credit": {
    "key": "credit",
    "id": "Credit Rating",
    "name": "信用评级",
    "en": "Credit Rating",
    "cat": "社交",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "每职业固定值（替代原范围）"
  },
  "persuade": {
    "key": "persuade",
    "id": "Persuade",
    "name": "说服",
    "en": "Persuade",
    "cat": "社交",
    "base": 10,
    "flags": [],
    "note": "合并 魅惑+话术+恐吓+理性论证"
  },
  "reassure": {
    "key": "reassure",
    "id": "Reassure",
    "name": "安抚",
    "en": "Reassure",
    "cat": "社交",
    "base": null,
    "flags": [],
    "formula": {
      "from": "APP",
      "div": 5
    },
    "uncommon": true,
    "note": "新增技能"
  },
  "cthulhu": {
    "key": "cthulhu",
    "id": "Cthulhu Mythos",
    "name": "克苏鲁神话",
    "en": "Cthulhu Mythos",
    "cat": "神话",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "个人兴趣点不可投入"
  },
  "language": {
    "key": "language",
    "id": "Language (Other)",
    "name": "外语",
    "en": "Language (Other)",
    "cat": "语言",
    "base": 1,
    "spec": "language",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 3,
    "note": "统称技能，须选具体语言"
  },
  "ownLanguage": {
    "key": "ownLanguage",
    "id": "Language (Own)",
    "name": "母语",
    "en": "Language (Own)",
    "cat": "语言",
    "base": null,
    "flags": [
      "edu",
      "named"
    ],
    "note": "起始 = EDU；可花 10 点习得第二门母语"
  },
  "listen": {
    "key": "listen",
    "id": "Listen",
    "name": "聆听",
    "en": "Listen",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  "navigate": {
    "key": "navigate",
    "id": "Navigate",
    "name": "导航",
    "en": "Navigate",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  "readLips": {
    "key": "readLips",
    "id": "Read Lips",
    "name": "读唇",
    "en": "Read Lips",
    "cat": "调查",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "spotHidden": {
    "key": "spotHidden",
    "id": "Spot Hidden",
    "name": "侦查",
    "en": "Spot Hidden",
    "cat": "调查",
    "base": 25,
    "flags": []
  },
  "stealth": {
    "key": "stealth",
    "id": "Stealth",
    "name": "潜行",
    "en": "Stealth",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  "track": {
    "key": "track",
    "id": "Track",
    "name": "追踪",
    "en": "Track",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  "animalHandling": {
    "key": "animalHandling",
    "id": "Animal Handling",
    "name": "驯兽",
    "en": "Animal Handling",
    "cat": "运动",
    "base": 5,
    "flags": [],
    "uncommon": true
  },
  "climb": {
    "key": "climb",
    "id": "Climb",
    "name": "攀爬",
    "en": "Climb",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "diving": {
    "key": "diving",
    "id": "Diving",
    "name": "潜水",
    "en": "Diving",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "driveAuto": {
    "key": "driveAuto",
    "id": "Drive Auto",
    "name": "汽车驾驶",
    "en": "Drive Auto",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "jump": {
    "key": "jump",
    "id": "Jump",
    "name": "跳跃",
    "en": "Jump",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "pilotAircraft": {
    "key": "pilotAircraft",
    "id": "Pilot Aircraft",
    "name": "驾驶（飞行器）",
    "en": "Pilot Aircraft",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  "pilotBoat": {
    "key": "pilotBoat",
    "id": "Pilot Boat",
    "name": "驾驶（船艇）",
    "en": "Pilot Boat",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  "survival": {
    "key": "survival",
    "id": "Survival",
    "name": "生存",
    "en": "Survival",
    "cat": "运动",
    "base": 10,
    "flags": [],
    "note": "不再分专精"
  },
  "swim": {
    "key": "swim",
    "id": "Swim",
    "name": "游泳",
    "en": "Swim",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "throw": {
    "key": "throw",
    "id": "Throw",
    "name": "投掷",
    "en": "Throw",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "ride": {
    "key": "ride",
    "id": "Ride",
    "name": "骑术",
    "en": "Ride",
    "cat": "运动",
    "base": 5,
    "spec": "ride",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "统称技能，须选坐骑"
  }
};

export const KPCP_SKILL_BY_NAME = {
  "会计": {
    "key": "accounting",
    "id": "Accounting",
    "name": "会计",
    "en": "Accounting",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "考古学": {
    "key": "archaeology",
    "id": "Archaeology",
    "name": "考古学",
    "en": "Archaeology",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  "计算机使用": {
    "key": "computer",
    "id": "Computer Use",
    "name": "计算机使用",
    "en": "Computer Use",
    "cat": "学问",
    "base": 5,
    "flags": [
      "modern"
    ],
    "note": "仅现代"
  },
  "电子学": {
    "key": "electronics",
    "id": "Electronics",
    "name": "电子学",
    "en": "Electronics",
    "cat": "学问",
    "base": 1,
    "flags": [
      "modern"
    ],
    "uncommon": true,
    "note": "仅现代"
  },
  "急救": {
    "key": "firstAid",
    "id": "First Aid",
    "name": "急救",
    "en": "First Aid",
    "cat": "学问",
    "base": 30,
    "flags": []
  },
  "历史": {
    "key": "history",
    "id": "History",
    "name": "历史",
    "en": "History",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "催眠": {
    "key": "hypnosis",
    "id": "Hypnosis",
    "name": "催眠",
    "en": "Hypnosis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "法律": {
    "key": "law",
    "id": "Law",
    "name": "法律",
    "en": "Law",
    "cat": "学问",
    "base": 5,
    "flags": []
  },
  "图书馆使用": {
    "key": "library",
    "id": "Library Use",
    "name": "图书馆使用",
    "en": "Library Use",
    "cat": "学问",
    "base": 20,
    "flags": []
  },
  "医学": {
    "key": "medicine",
    "id": "Medicine",
    "name": "医学",
    "en": "Medicine",
    "cat": "学问",
    "base": 1,
    "flags": []
  },
  "自然学": {
    "key": "naturalWorld",
    "id": "Natural World",
    "name": "自然学",
    "en": "Natural World",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  "神秘学": {
    "key": "occult",
    "id": "Occult",
    "name": "神秘学",
    "en": "Occult",
    "cat": "学问",
    "base": 5,
    "flags": [],
    "note": "原 学识(Lore) 改为神秘学"
  },
  "精神分析": {
    "key": "psychoanalysis",
    "id": "Psychoanalysis",
    "name": "精神分析",
    "en": "Psychoanalysis",
    "cat": "学问",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "心理学": {
    "key": "psychology",
    "id": "Psychology",
    "name": "心理学",
    "en": "Psychology",
    "cat": "学问",
    "base": 10,
    "flags": []
  },
  "科学": {
    "key": "science",
    "id": "Science",
    "name": "科学",
    "en": "Science",
    "cat": "学问",
    "base": 1,
    "spec": "science",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  "宗教": {
    "key": "religion",
    "id": "Religion",
    "name": "宗教",
    "en": "Religion",
    "cat": "学问",
    "base": 10,
    "spec": "religion",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "新增技能，须选专精"
  },
  "炮术": {
    "key": "artillery",
    "id": "Artillery",
    "name": "炮术",
    "en": "Artillery",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "爆破": {
    "key": "demolitions",
    "id": "Demolitions",
    "name": "爆破",
    "en": "Demolitions",
    "cat": "战斗",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "闪避": {
    "key": "dodge",
    "id": "Dodge",
    "name": "闪避",
    "en": "Dodge",
    "cat": "战斗",
    "base": null,
    "flags": [
      "dexHalf"
    ]
  },
  "格斗": {
    "key": "fighting",
    "id": "Fighting",
    "name": "格斗",
    "en": "Fighting",
    "cat": "战斗",
    "base": 0,
    "spec": "fighting",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（斗殴25/斧15/链锯15/连枷15/绞索15/长矛20/剑20/鞭15）"
  },
  "射击": {
    "key": "firearms",
    "id": "Firearms",
    "name": "射击",
    "en": "Firearms",
    "cat": "战斗",
    "base": 0,
    "spec": "firearms",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，基础值见各专精（手枪20/步枪霰弹枪25/弓15/火焰喷射器15/重型武器15/机枪15）"
  },
  "电气维修": {
    "key": "elecRepair",
    "id": "Electrical Repair",
    "name": "电气维修",
    "en": "Electrical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "锁匠": {
    "key": "locksmith",
    "id": "Locksmith",
    "name": "锁匠",
    "en": "Locksmith",
    "cat": "技艺",
    "base": 1,
    "flags": []
  },
  "机械维修": {
    "key": "mechRepair",
    "id": "Mechanical Repair",
    "name": "机械维修",
    "en": "Mechanical Repair",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "操作重型机械": {
    "key": "opHeavyMachine",
    "id": "Operate Heavy Machinery",
    "name": "操作重型机械",
    "en": "Operate Heavy Machinery",
    "cat": "技艺",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "妙手": {
    "key": "sleightOfHand",
    "id": "Sleight of Hand",
    "name": "妙手",
    "en": "Sleight of Hand",
    "cat": "技艺",
    "base": 10,
    "flags": []
  },
  "艺术/手艺": {
    "key": "art",
    "id": "Art/Craft",
    "name": "艺术/手艺",
    "en": "Art/Craft",
    "cat": "技艺",
    "base": 5,
    "spec": "art",
    "flags": [
      "spec"
    ],
    "slots": 3,
    "note": "统称技能，不可直接购买"
  },
  "信用评级": {
    "key": "credit",
    "id": "Credit Rating",
    "name": "信用评级",
    "en": "Credit Rating",
    "cat": "社交",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "每职业固定值（替代原范围）"
  },
  "说服": {
    "key": "persuade",
    "id": "Persuade",
    "name": "说服",
    "en": "Persuade",
    "cat": "社交",
    "base": 10,
    "flags": [],
    "note": "合并 魅惑+话术+恐吓+理性论证"
  },
  "安抚": {
    "key": "reassure",
    "id": "Reassure",
    "name": "安抚",
    "en": "Reassure",
    "cat": "社交",
    "base": null,
    "flags": [],
    "formula": {
      "from": "APP",
      "div": 5
    },
    "uncommon": true,
    "note": "新增技能"
  },
  "克苏鲁神话": {
    "key": "cthulhu",
    "id": "Cthulhu Mythos",
    "name": "克苏鲁神话",
    "en": "Cthulhu Mythos",
    "cat": "神话",
    "base": 0,
    "flags": [
      "nocap"
    ],
    "note": "个人兴趣点不可投入"
  },
  "外语": {
    "key": "language",
    "id": "Language (Other)",
    "name": "外语",
    "en": "Language (Other)",
    "cat": "语言",
    "base": 1,
    "spec": "language",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 3,
    "note": "统称技能，须选具体语言"
  },
  "母语": {
    "key": "ownLanguage",
    "id": "Language (Own)",
    "name": "母语",
    "en": "Language (Own)",
    "cat": "语言",
    "base": null,
    "flags": [
      "edu",
      "named"
    ],
    "note": "起始 = EDU；可花 10 点习得第二门母语"
  },
  "聆听": {
    "key": "listen",
    "id": "Listen",
    "name": "聆听",
    "en": "Listen",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  "导航": {
    "key": "navigate",
    "id": "Navigate",
    "name": "导航",
    "en": "Navigate",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  "读唇": {
    "key": "readLips",
    "id": "Read Lips",
    "name": "读唇",
    "en": "Read Lips",
    "cat": "调查",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "侦查": {
    "key": "spotHidden",
    "id": "Spot Hidden",
    "name": "侦查",
    "en": "Spot Hidden",
    "cat": "调查",
    "base": 25,
    "flags": []
  },
  "潜行": {
    "key": "stealth",
    "id": "Stealth",
    "name": "潜行",
    "en": "Stealth",
    "cat": "调查",
    "base": 20,
    "flags": []
  },
  "追踪": {
    "key": "track",
    "id": "Track",
    "name": "追踪",
    "en": "Track",
    "cat": "调查",
    "base": 10,
    "flags": []
  },
  "驯兽": {
    "key": "animalHandling",
    "id": "Animal Handling",
    "name": "驯兽",
    "en": "Animal Handling",
    "cat": "运动",
    "base": 5,
    "flags": [],
    "uncommon": true
  },
  "攀爬": {
    "key": "climb",
    "id": "Climb",
    "name": "攀爬",
    "en": "Climb",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "潜水": {
    "key": "diving",
    "id": "Diving",
    "name": "潜水",
    "en": "Diving",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true
  },
  "汽车驾驶": {
    "key": "driveAuto",
    "id": "Drive Auto",
    "name": "汽车驾驶",
    "en": "Drive Auto",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "跳跃": {
    "key": "jump",
    "id": "Jump",
    "name": "跳跃",
    "en": "Jump",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "驾驶（飞行器）": {
    "key": "pilotAircraft",
    "id": "Pilot Aircraft",
    "name": "驾驶（飞行器）",
    "en": "Pilot Aircraft",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  "驾驶（船艇）": {
    "key": "pilotBoat",
    "id": "Pilot Boat",
    "name": "驾驶（船艇）",
    "en": "Pilot Boat",
    "cat": "运动",
    "base": 1,
    "flags": [],
    "uncommon": true,
    "note": "原 驾驶 拆分"
  },
  "生存": {
    "key": "survival",
    "id": "Survival",
    "name": "生存",
    "en": "Survival",
    "cat": "运动",
    "base": 10,
    "flags": [],
    "note": "不再分专精"
  },
  "游泳": {
    "key": "swim",
    "id": "Swim",
    "name": "游泳",
    "en": "Swim",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "投掷": {
    "key": "throw",
    "id": "Throw",
    "name": "投掷",
    "en": "Throw",
    "cat": "运动",
    "base": 20,
    "flags": []
  },
  "骑术": {
    "key": "ride",
    "id": "Ride",
    "name": "骑术",
    "en": "Ride",
    "cat": "运动",
    "base": 5,
    "spec": "ride",
    "flags": [
      "spec",
      "specGroup"
    ],
    "slots": 1,
    "note": "统称技能，须选坐骑"
  }
};

export const KPCP_SPEC_SLOTS = {
  "art": 3,
  "fighting": 3,
  "firearms": 3,
  "science": 3,
  "language": 3,
  "religion": 1,
  "ride": 1
};

export const KPCP_SPEC_PRESETS = {
  "art": {
    "表演": 5,
    "估价": 5,
    "乔装": 5,
    "美术": 5,
    "伪造": 5,
    "摄影": 5,
    "文学": 5,
    "美术史": 5,
    "农业": 5,
    "技术制图": 5,
    "声乐": 5,
    "器乐": 5,
    "舞蹈": 5,
    "烹饪": 5,
    "裁缝": 5,
    "打字": 5,
    "速记": 5,
    "木工": 5,
    "焊接": 5,
    "管道工": 5
  },
  "science": {
    "人类学": 1,
    "天文学": 1,
    "生物学": 1,
    "植物学": 1,
    "化学": 1,
    "密码学": 1,
    "工程学": 1,
    "法医学": 1,
    "地质学": 1,
    "数学": 1,
    "气象学": 1,
    "药学": 1,
    "物理学": 1,
    "动物学": 1
  },
  "fighting": {
    "斧": 15,
    "斗殴": 25,
    "链锯": 15,
    "连枷": 15,
    "绞索": 15,
    "长矛": 20,
    "剑": 20,
    "鞭": 15
  },
  "firearms": {
    "弓": 15,
    "火焰喷射器": 15,
    "手枪": 20,
    "重型武器": 15,
    "机枪": 15,
    "步枪/霰弹枪": 25
  },
  "language": {
    "英语": 1,
    "拉丁语": 1,
    "希腊语": 1,
    "法语": 1,
    "德语": 1,
    "西班牙语": 1,
    "意大利语": 1,
    "俄语": 1,
    "汉语": 1,
    "日语": 1,
    "阿拉伯语": 1,
    "希伯来语": 1,
    "梵语": 1,
    "古埃及语": 1
  },
  "religion": {
    "基督教": 10,
    "天主教": 10,
    "东正教": 10,
    "伊斯兰教": 10,
    "佛教": 10,
    "印度教": 10,
    "犹太教": 10,
    "道教": 10,
    "神道教": 10,
    "民间信仰": 10,
    "祆教": 10,
    "锡克教": 10
  },
  "ride": {
    "马": 5,
    "骆驼": 5,
    "骡": 5,
    "大象": 5,
    "摩托车": 5,
    "自行车": 5
  }
};

export const KPCP_SPEC_OPTIONS = {
  "art": [
    "表演",
    "估价",
    "乔装",
    "美术",
    "伪造",
    "摄影",
    "文学",
    "美术史",
    "农业",
    "技术制图",
    "声乐",
    "器乐",
    "舞蹈",
    "烹饪",
    "裁缝",
    "打字",
    "速记",
    "木工",
    "焊接",
    "管道工"
  ],
  "fighting": [
    "斧",
    "斗殴",
    "链锯",
    "连枷",
    "绞索",
    "长矛",
    "剑",
    "鞭"
  ],
  "firearms": [
    "弓",
    "火焰喷射器",
    "手枪",
    "重型武器",
    "机枪",
    "步枪/霰弹枪"
  ],
  "science": [
    "人类学",
    "天文学",
    "生物学",
    "植物学",
    "化学",
    "密码学",
    "工程学",
    "法医学",
    "地质学",
    "数学",
    "气象学",
    "药学",
    "物理学",
    "动物学"
  ],
  "language": [
    "英语",
    "拉丁语",
    "希腊语",
    "法语",
    "德语",
    "西班牙语",
    "意大利语",
    "俄语",
    "汉语",
    "日语",
    "阿拉伯语",
    "希伯来语",
    "梵语",
    "古埃及语"
  ],
  "religion": [
    "基督教",
    "天主教",
    "东正教",
    "伊斯兰教",
    "佛教",
    "印度教",
    "犹太教",
    "道教",
    "神道教",
    "民间信仰",
    "祆教",
    "锡克教"
  ],
  "ride": [
    "马",
    "骆驼",
    "骡",
    "大象",
    "摩托车",
    "自行车"
  ]
};

export const KPCP_LANGUAGES = [
  "英语",
  "拉丁语",
  "希腊语",
  "法语",
  "德语",
  "西班牙语",
  "意大利语",
  "俄语",
  "汉语",
  "日语",
  "阿拉伯语",
  "希伯来语",
  "梵语",
  "古埃及语"
];

export const KPCP_RELIGIONS = [
  "基督教",
  "天主教",
  "东正教",
  "伊斯兰教",
  "佛教",
  "印度教",
  "犹太教",
  "道教",
  "神道教",
  "民间信仰",
  "祆教",
  "锡克教"
];

export const KPCP_RIDES = [
  "马",
  "骆驼",
  "骡",
  "大象",
  "摩托车",
  "自行车"
];

export const KPCP_OCCUPATIONS = [
  {
    "id": "antiquarian",
    "name": "古物学家",
    "nameEn": "Antiquarian",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "persuade",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（估价） 70%、艺术/手艺 35%、信用评级（信用评级） 30%、历史 50%、外语 51%、图书馆使用 50%、说服 45%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "估价",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 35,
        "cost": 30,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 51,
        "cost": 50,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "artist",
    "name": "艺术家",
    "nameEn": "Artist",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "naturalWorld",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 80%、信用评级（信用评级） 25%、历史 40%、外语 61%、自然学 45%、说服 40%、心理学 25%、侦查 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 80,
        "cost": 75,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 25,
        "cost": 15
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "athlete",
    "name": "运动员",
    "nameEn": "Athlete",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "fighting",
      "jump",
      "persuade",
      "ride",
      "swim",
      "throw"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 65%、信用评级（信用评级） 20%、格斗（斗殴） 50%、跳跃 65%、说服 30%、骑术 50%、游泳 65%、投掷 75%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "jump",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "ride",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "swim",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "throw",
        "label": "",
        "base": 20,
        "final": 75,
        "cost": 55
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "author",
    "name": "作家",
    "nameEn": "Author",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "naturalWorld",
      "occult",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（文学） 70%、信用评级（信用评级） 20%、历史 50%、外语 61%、图书馆使用 60%、自然学 35%、神秘学 20%、心理学 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "文学",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "clergy_member",
    "name": "神职人员",
    "nameEn": "Clergy Member",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology",
      "reassure",
      "religion"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 25%、历史 50%、外语 41%、图书馆使用 50%、聆听 50%、说服 50%、心理学 35%、安抚 0%、宗教 75%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "reassure",
        "label": "",
        "base": 0,
        "final": 0,
        "cost": 0
      },
      {
        "key": "religion",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65,
        "choose": [
          "基督教",
          "天主教",
          "东正教",
          "伊斯兰教",
          "佛教",
          "印度教",
          "犹太教",
          "道教",
          "神道教",
          "民间信仰",
          "祆教",
          "锡克教"
        ]
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "criminal",
    "name": "罪犯",
    "nameEn": "Criminal",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "fighting",
      "firearms",
      "law",
      "locksmith",
      "persuade",
      "psychology",
      "sleightOfHand",
      "spotHidden",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 20%、格斗（斗殴） 50%、射击（手枪） 40%、法律 20%、锁匠 41%、说服 40%、心理学 35%、妙手 75%、侦查 40%、潜行 65%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "locksmith",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "sleightOfHand",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "dilettante",
    "name": "纨绔子弟",
    "nameEn": "Dilettante",
    "kind": "package",
    "total": 300,
    "cr": [
      80,
      80
    ],
    "creditFixed": 80,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "firearms",
      "language",
      "persuade",
      "ride"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 55%、信用评级（信用评级） 80%、射击（步枪/霰弹枪） 50%、外语 61%、说服 50%、骑术（马） 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 55,
        "cost": 50,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 80,
        "cost": 80
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "ride",
        "label": "马",
        "base": 5,
        "final": 50,
        "cost": 45
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "doctor_of_medicine",
    "name": "医师",
    "nameEn": "Doctor of Medicine",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "firstAid",
      "language",
      "library",
      "medicine",
      "persuade",
      "psychology",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 30%、急救 50%、外语（Latin） 51%、图书馆使用 50%、医学 81%、说服 20%、心理学 30%、科学（生物学） 31%、科学（药学） 31%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "Latin",
        "base": 1,
        "final": 51,
        "cost": 50
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "medicine",
        "label": "",
        "base": 1,
        "final": 81,
        "cost": 80
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 20,
        "cost": 10
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "science",
        "label": "生物学",
        "base": 1,
        "final": 31,
        "cost": 30
      },
      {
        "key": "science",
        "label": "药学",
        "base": 1,
        "final": 31,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "drifter",
    "name": "流浪者",
    "nameEn": "Drifter",
    "kind": "package",
    "total": 300,
    "cr": [
      5,
      5
    ],
    "creditFixed": 5,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "climb",
      "credit",
      "fighting",
      "jump",
      "listen",
      "navigate",
      "persuade",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 40%、攀爬 50%、信用评级（信用评级） 5%、格斗（斗殴） 50%、跳跃 45%、聆听 60%、导航 60%、说服 50%、潜行 70%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 5,
        "cost": 5
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "jump",
        "label": "",
        "base": 20,
        "final": 45,
        "cost": 25
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "engineer",
    "name": "工程师",
    "nameEn": "Engineer",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "elecRepair",
      "library",
      "mechRepair",
      "opHeavyMachine",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（技术制图） 60%、信用评级（信用评级） 30%、电气维修 40%、图书馆使用 40%、机械维修 40%、操作重型机械 26%、科学（工程学） 71%、科学（物理学） 41%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "技术制图",
        "base": 5,
        "final": 60,
        "cost": 55
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 26,
        "cost": 25
      },
      {
        "key": "science",
        "label": "工程学",
        "base": 1,
        "final": 71,
        "cost": 70
      },
      {
        "key": "science",
        "label": "物理学",
        "base": 1,
        "final": 41,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "entertainer",
    "name": "演艺人员",
    "nameEn": "Entertainer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology",
      "sleightOfHand"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 80%、艺术/手艺（乔装） 50%、信用评级（信用评级） 20%、外语 41%、图书馆使用 40%、聆听 30%、说服 40%、心理学 30%、妙手 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 80,
        "cost": 75,
        "choose": [
          "表演",
          "声乐"
        ]
      },
      {
        "key": "art",
        "label": "乔装",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 30,
        "cost": 10
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "sleightOfHand",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "farmer",
    "name": "农民",
    "nameEn": "Farmer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "driveAuto",
      "firearms",
      "mechRepair",
      "naturalWorld",
      "opHeavyMachine",
      "persuade",
      "track"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（农业） 80%、信用评级（信用评级） 20%、汽车驾驶（or Wagon） 50%、射击（步枪/霰弹枪） 50%、机械维修 40%、自然学 50%、操作重型机械 21%、说服 40%、追踪 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "农业",
        "base": 5,
        "final": 80,
        "cost": 75
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "driveAuto",
        "label": "or Wagon",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 21,
        "cost": 20
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "track",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "it_worker_modern_era_only",
    "name": "IT 从业者",
    "nameEn": "IT Worker [modern era only]",
    "kind": "package",
    "total": 300,
    "cr": [
      40,
      40
    ],
    "creditFixed": 40,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "computer",
      "credit",
      "elecRepair",
      "electronics",
      "law",
      "library",
      "science",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "计算机使用 70%、信用评级（信用评级） 40%、电气维修 45%、电子学 36%、法律 15%、图书馆使用 60%、科学（数学） 61%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "computer",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 40,
        "cost": 40
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "electronics",
        "label": "",
        "base": 1,
        "final": 36,
        "cost": 35
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 15,
        "cost": 10
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "science",
        "label": "数学",
        "base": 1,
        "final": 61,
        "cost": 60
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "journalist",
    "name": "记者",
    "nameEn": "Journalist",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "law",
      "library",
      "listen",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 40%、信用评级（信用评级） 30%、历史 55%、法律 20%、图书馆使用 70%、聆听 35%、说服 70%、心理学 40%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 55,
        "cost": 50
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 35,
        "cost": 15
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 70,
        "cost": 60
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "lawyer",
    "name": "律师",
    "nameEn": "Lawyer",
    "kind": "package",
    "total": 300,
    "cr": [
      55,
      55
    ],
    "creditFixed": 55,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "credit",
      "history",
      "law",
      "library",
      "persuade",
      "psychology",
      "reassure"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 30%、信用评级（信用评级） 55%、历史 25%、法律 70%、图书馆使用 60%、说服 75%、心理学 40%、安抚 0%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 55,
        "cost": 55
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "reassure",
        "label": "",
        "base": 0,
        "final": 0,
        "cost": 0
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "librarian",
    "name": "图书管理员",
    "nameEn": "Librarian",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "art",
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "naturalWorld",
      "occult",
      "religion",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 25%、艺术/手艺（美术史） 25%、信用评级（信用评级） 25%、历史 35%、外语 41%、图书馆使用 70%、聆听 40%、自然学 40%、神秘学 30%、宗教 30%、潜行 40%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "art",
        "label": "美术史",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 35,
        "cost": 30
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "religion",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20,
        "choose": [
          "基督教",
          "天主教",
          "东正教",
          "伊斯兰教",
          "佛教",
          "印度教",
          "犹太教",
          "道教",
          "神道教",
          "民间信仰",
          "祆教",
          "锡克教"
        ]
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "military_officer",
    "name": "军官",
    "nameEn": "Military Officer",
    "kind": "package",
    "total": 300,
    "cr": [
      40,
      40
    ],
    "creditFixed": 40,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "credit",
      "fighting",
      "firearms",
      "firstAid",
      "language",
      "navigate",
      "persuade",
      "psychology",
      "survival"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 20%、信用评级（信用评级） 40%、格斗（斗殴） 45%、射击（手枪） 55%、射击（步枪/霰弹枪） 45%、急救 50%、外语 31%、导航 50%、说服 50%、心理学 30%、生存 30%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 40,
        "cost": 40
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 55,
        "cost": 35
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "survival",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "musician",
    "name": "音乐家",
    "nameEn": "Musician",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 75%、信用评级（信用评级） 30%、历史 30%、外语 26%、图书馆使用 60%、聆听 70%、说服 40%、心理学 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 75,
        "cost": 70,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 26,
        "cost": 25,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "parapsychologist",
    "name": "超心理学家",
    "nameEn": "Parapsychologist",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "occult",
      "psychology",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 50%、信用评级（信用评级） 20%、历史 25%、外语 41%、图书馆使用 50%、神秘学 70%、心理学 60%、科学（人类学） 31%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "science",
        "label": "人类学",
        "base": 1,
        "final": 31,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "pilot",
    "name": "飞行员",
    "nameEn": "Pilot",
    "kind": "package",
    "total": 340,
    "cr": [
      50,
      50
    ],
    "creditFixed": 50,
    "attr": "职业包 · 合计 340 点",
    "keys": [
      "credit",
      "elecRepair",
      "mechRepair",
      "navigate",
      "opHeavyMachine",
      "pilotAircraft",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 50%、电气维修 50%、机械维修 60%、导航 60%、操作重型机械 41%、驾驶（飞行器） 71%、科学（天文学） 41%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 50,
        "cost": 50
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40
      },
      {
        "key": "pilotAircraft",
        "label": "",
        "base": 1,
        "final": 71,
        "cost": 70
      },
      {
        "key": "science",
        "label": "天文学",
        "base": 1,
        "final": 41,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "police_detective",
    "name": "警探",
    "nameEn": "Police Detective",
    "kind": "package",
    "total": 300,
    "cr": [
      35,
      35
    ],
    "creditFixed": 35,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "driveAuto",
      "fighting",
      "firearms",
      "law",
      "listen",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 25%、信用评级（信用评级） 35%、汽车驾驶 40%、格斗（斗殴） 45%、射击（手枪） 50%、射击（步枪/霰弹枪） 40%、法律 60%、聆听 40%、说服 40%、心理学 40%、侦查 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20,
        "choose": [
          "表演",
          "乔装"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 35,
        "cost": 35
      },
      {
        "key": "driveAuto",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 40,
        "cost": 15
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 60,
        "cost": 55
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "police_officer",
    "name": "警员",
    "nameEn": "Police Officer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "driveAuto",
      "fighting",
      "firearms",
      "firstAid",
      "law",
      "navigate",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 40%、信用评级（信用评级） 20%、汽车驾驶 50%、格斗（斗殴） 50%、射击（手枪） 40%、射击（步枪/霰弹枪） 45%、急救 50%、法律 50%、导航 40%、说服 40%、心理学 30%、侦查 45%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "driveAuto",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 45,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "private_investigator",
    "name": "私家侦探",
    "nameEn": "Private Investigator",
    "kind": "package",
    "total": 290,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 290 点",
    "keys": [
      "art",
      "credit",
      "firearms",
      "law",
      "library",
      "locksmith",
      "persuade",
      "psychology",
      "spotHidden",
      "track"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 30%、艺术/手艺（乔装） 30%、信用评级（信用评级） 20%、射击（手枪） 40%、法律 40%、图书馆使用 40%、锁匠 31%、说服 40%、心理学 40%、侦查 50%、追踪 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "art",
        "label": "乔装",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "locksmith",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "track",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  {
    "id": "professor",
    "name": "教授",
    "nameEn": "Professor",
    "kind": "package",
    "total": 300,
    "cr": [
      60,
      60
    ],
    "creditFixed": 60,
    "attr": "教授：固定 5 项 + 90 点学术专精池（其中一项须达 90%）",
    "keys": [
      "credit",
      "language",
      "library",
      "persuade",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级 60%、外语（任选）61%、图书馆使用 70%、说服 30%、心理学 30%，另 90 点学术专精（其中一项须达 90%）",
    "note": "原书特殊分配型职业，见 §1.4.3",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 60,
        "cost": 60
      },
      {
        "key": "language",
        "label": "任选",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "图书馆使用",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "说服",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "psychology",
        "label": "心理学",
        "base": 10,
        "final": 30,
        "cost": 20
      }
    ],
    "special": {
      "points": 90,
      "eligible": [
        "history",
        "law",
        "medicine",
        "occult",
        "science",
        "language",
        "accounting",
        "anthropology",
        "archaeology",
        "psychology",
        "psychoanalysis"
      ],
      "oneMustReach": 90
    },
    "page": ""
  },
  {
    "id": "soldier",
    "name": "士兵",
    "nameEn": "Soldier",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "fighting",
      "firearms",
      "firstAid",
      "language",
      "mechRepair",
      "navigate",
      "stealth",
      "survival",
      "swim"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 50%、信用评级（信用评级） 20%、格斗（斗殴） 60%、射击（手枪） 50%、射击（步枪/霰弹枪） 50%、急救 50%、外语 31%、机械维修 30%、导航 30%、潜行 40%、生存 40%、游泳 40%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 60,
        "cost": 35
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "survival",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "swim",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  }
];

export const KPCP_OCCUPATION_BY_ID = {
  "antiquarian": {
    "id": "antiquarian",
    "name": "古物学家",
    "nameEn": "Antiquarian",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "persuade",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（估价） 70%、艺术/手艺 35%、信用评级（信用评级） 30%、历史 50%、外语 51%、图书馆使用 50%、说服 45%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "估价",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 35,
        "cost": 30,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 51,
        "cost": 50,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  "artist": {
    "id": "artist",
    "name": "艺术家",
    "nameEn": "Artist",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "naturalWorld",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 80%、信用评级（信用评级） 25%、历史 40%、外语 61%、自然学 45%、说服 40%、心理学 25%、侦查 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 80,
        "cost": 75,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 25,
        "cost": 15
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      }
    ],
    "special": null,
    "page": ""
  },
  "athlete": {
    "id": "athlete",
    "name": "运动员",
    "nameEn": "Athlete",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "fighting",
      "jump",
      "persuade",
      "ride",
      "swim",
      "throw"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 65%、信用评级（信用评级） 20%、格斗（斗殴） 50%、跳跃 65%、说服 30%、骑术 50%、游泳 65%、投掷 75%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "jump",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "ride",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "swim",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      },
      {
        "key": "throw",
        "label": "",
        "base": 20,
        "final": 75,
        "cost": 55
      }
    ],
    "special": null,
    "page": ""
  },
  "author": {
    "id": "author",
    "name": "作家",
    "nameEn": "Author",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "naturalWorld",
      "occult",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（文学） 70%、信用评级（信用评级） 20%、历史 50%、外语 61%、图书馆使用 60%、自然学 35%、神秘学 20%、心理学 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "文学",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "clergy_member": {
    "id": "clergy_member",
    "name": "神职人员",
    "nameEn": "Clergy Member",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology",
      "reassure",
      "religion"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 25%、历史 50%、外语 41%、图书馆使用 50%、聆听 50%、说服 50%、心理学 35%、安抚 0%、宗教 75%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "reassure",
        "label": "",
        "base": 0,
        "final": 0,
        "cost": 0
      },
      {
        "key": "religion",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65,
        "choose": [
          "基督教",
          "天主教",
          "东正教",
          "伊斯兰教",
          "佛教",
          "印度教",
          "犹太教",
          "道教",
          "神道教",
          "民间信仰",
          "祆教",
          "锡克教"
        ]
      }
    ],
    "special": null,
    "page": ""
  },
  "criminal": {
    "id": "criminal",
    "name": "罪犯",
    "nameEn": "Criminal",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "fighting",
      "firearms",
      "law",
      "locksmith",
      "persuade",
      "psychology",
      "sleightOfHand",
      "spotHidden",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 20%、格斗（斗殴） 50%、射击（手枪） 40%、法律 20%、锁匠 41%、说服 40%、心理学 35%、妙手 75%、侦查 40%、潜行 65%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "locksmith",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 35,
        "cost": 25
      },
      {
        "key": "sleightOfHand",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 65,
        "cost": 45
      }
    ],
    "special": null,
    "page": ""
  },
  "dilettante": {
    "id": "dilettante",
    "name": "纨绔子弟",
    "nameEn": "Dilettante",
    "kind": "package",
    "total": 300,
    "cr": [
      80,
      80
    ],
    "creditFixed": 80,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "firearms",
      "language",
      "persuade",
      "ride"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 55%、信用评级（信用评级） 80%、射击（步枪/霰弹枪） 50%、外语 61%、说服 50%、骑术（马） 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 55,
        "cost": 50,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 80,
        "cost": 80
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "ride",
        "label": "马",
        "base": 5,
        "final": 50,
        "cost": 45
      }
    ],
    "special": null,
    "page": ""
  },
  "doctor_of_medicine": {
    "id": "doctor_of_medicine",
    "name": "医师",
    "nameEn": "Doctor of Medicine",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "credit",
      "firstAid",
      "language",
      "library",
      "medicine",
      "persuade",
      "psychology",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 30%、急救 50%、外语（Latin） 51%、图书馆使用 50%、医学 81%、说服 20%、心理学 30%、科学（生物学） 31%、科学（药学） 31%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "Latin",
        "base": 1,
        "final": 51,
        "cost": 50
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "medicine",
        "label": "",
        "base": 1,
        "final": 81,
        "cost": 80
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 20,
        "cost": 10
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "science",
        "label": "生物学",
        "base": 1,
        "final": 31,
        "cost": 30
      },
      {
        "key": "science",
        "label": "药学",
        "base": 1,
        "final": 31,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "drifter": {
    "id": "drifter",
    "name": "流浪者",
    "nameEn": "Drifter",
    "kind": "package",
    "total": 300,
    "cr": [
      5,
      5
    ],
    "creditFixed": 5,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "climb",
      "credit",
      "fighting",
      "jump",
      "listen",
      "navigate",
      "persuade",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 40%、攀爬 50%、信用评级（信用评级） 5%、格斗（斗殴） 50%、跳跃 45%、聆听 60%、导航 60%、说服 50%、潜行 70%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 5,
        "cost": 5
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "jump",
        "label": "",
        "base": 20,
        "final": 45,
        "cost": 25
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      }
    ],
    "special": null,
    "page": ""
  },
  "engineer": {
    "id": "engineer",
    "name": "工程师",
    "nameEn": "Engineer",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "elecRepair",
      "library",
      "mechRepair",
      "opHeavyMachine",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（技术制图） 60%、信用评级（信用评级） 30%、电气维修 40%、图书馆使用 40%、机械维修 40%、操作重型机械 26%、科学（工程学） 71%、科学（物理学） 41%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "技术制图",
        "base": 5,
        "final": 60,
        "cost": 55
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 26,
        "cost": 25
      },
      {
        "key": "science",
        "label": "工程学",
        "base": 1,
        "final": 71,
        "cost": 70
      },
      {
        "key": "science",
        "label": "物理学",
        "base": 1,
        "final": 41,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  "entertainer": {
    "id": "entertainer",
    "name": "演艺人员",
    "nameEn": "Entertainer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology",
      "sleightOfHand"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 80%、艺术/手艺（乔装） 50%、信用评级（信用评级） 20%、外语 41%、图书馆使用 40%、聆听 30%、说服 40%、心理学 30%、妙手 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 80,
        "cost": 75,
        "choose": [
          "表演",
          "声乐"
        ]
      },
      {
        "key": "art",
        "label": "乔装",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 30,
        "cost": 10
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "sleightOfHand",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  "farmer": {
    "id": "farmer",
    "name": "农民",
    "nameEn": "Farmer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "driveAuto",
      "firearms",
      "mechRepair",
      "naturalWorld",
      "opHeavyMachine",
      "persuade",
      "track"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（农业） 80%、信用评级（信用评级） 20%、汽车驾驶（or Wagon） 50%、射击（步枪/霰弹枪） 50%、机械维修 40%、自然学 50%、操作重型机械 21%、说服 40%、追踪 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "农业",
        "base": 5,
        "final": 80,
        "cost": 75
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "driveAuto",
        "label": "or Wagon",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 21,
        "cost": 20
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "track",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "it_worker_modern_era_only": {
    "id": "it_worker_modern_era_only",
    "name": "IT 从业者",
    "nameEn": "IT Worker [modern era only]",
    "kind": "package",
    "total": 300,
    "cr": [
      40,
      40
    ],
    "creditFixed": 40,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "computer",
      "credit",
      "elecRepair",
      "electronics",
      "law",
      "library",
      "science",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "计算机使用 70%、信用评级（信用评级） 40%、电气维修 45%、电子学 36%、法律 15%、图书馆使用 60%、科学（数学） 61%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "computer",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 40,
        "cost": 40
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 45,
        "cost": 35
      },
      {
        "key": "electronics",
        "label": "",
        "base": 1,
        "final": 36,
        "cost": 35
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 15,
        "cost": 10
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "science",
        "label": "数学",
        "base": 1,
        "final": 61,
        "cost": 60
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  "journalist": {
    "id": "journalist",
    "name": "记者",
    "nameEn": "Journalist",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "law",
      "library",
      "listen",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 40%、信用评级（信用评级） 30%、历史 55%、法律 20%、图书馆使用 70%、聆听 35%、说服 70%、心理学 40%、侦查 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 55,
        "cost": 50
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 35,
        "cost": 15
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 70,
        "cost": 60
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 40,
        "cost": 15
      }
    ],
    "special": null,
    "page": ""
  },
  "lawyer": {
    "id": "lawyer",
    "name": "律师",
    "nameEn": "Lawyer",
    "kind": "package",
    "total": 300,
    "cr": [
      55,
      55
    ],
    "creditFixed": 55,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "credit",
      "history",
      "law",
      "library",
      "persuade",
      "psychology",
      "reassure"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 30%、信用评级（信用评级） 55%、历史 25%、法律 70%、图书馆使用 60%、说服 75%、心理学 40%、安抚 0%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 55,
        "cost": 55
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 75,
        "cost": 65
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "reassure",
        "label": "",
        "base": 0,
        "final": 0,
        "cost": 0
      }
    ],
    "special": null,
    "page": ""
  },
  "librarian": {
    "id": "librarian",
    "name": "图书管理员",
    "nameEn": "Librarian",
    "kind": "package",
    "total": 300,
    "cr": [
      25,
      25
    ],
    "creditFixed": 25,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "art",
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "naturalWorld",
      "occult",
      "religion",
      "stealth"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 25%、艺术/手艺（美术史） 25%、信用评级（信用评级） 25%、历史 35%、外语 41%、图书馆使用 70%、聆听 40%、自然学 40%、神秘学 30%、宗教 30%、潜行 40%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "art",
        "label": "美术史",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 25,
        "cost": 25
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 35,
        "cost": 30
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "naturalWorld",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "religion",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20,
        "choose": [
          "基督教",
          "天主教",
          "东正教",
          "伊斯兰教",
          "佛教",
          "印度教",
          "犹太教",
          "道教",
          "神道教",
          "民间信仰",
          "祆教",
          "锡克教"
        ]
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  "military_officer": {
    "id": "military_officer",
    "name": "军官",
    "nameEn": "Military Officer",
    "kind": "package",
    "total": 300,
    "cr": [
      40,
      40
    ],
    "creditFixed": 40,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "accounting",
      "credit",
      "fighting",
      "firearms",
      "firstAid",
      "language",
      "navigate",
      "persuade",
      "psychology",
      "survival"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "会计 20%、信用评级（信用评级） 40%、格斗（斗殴） 45%、射击（手枪） 55%、射击（步枪/霰弹枪） 45%、急救 50%、外语 31%、导航 50%、说服 50%、心理学 30%、生存 30%",
    "note": "",
    "entries": [
      {
        "key": "accounting",
        "label": "",
        "base": 5,
        "final": 20,
        "cost": 15
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 40,
        "cost": 40
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 55,
        "cost": 35
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "survival",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  "musician": {
    "id": "musician",
    "name": "音乐家",
    "nameEn": "Musician",
    "kind": "package",
    "total": 300,
    "cr": [
      30,
      30
    ],
    "creditFixed": 30,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "listen",
      "persuade",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 75%、信用评级（信用评级） 30%、历史 30%、外语 26%、图书馆使用 60%、聆听 70%、说服 40%、心理学 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 75,
        "cost": 70,
        "choose": [
          "表演",
          "声乐",
          "舞蹈",
          "器乐",
          "绘画",
          "文学",
          "摄影",
          "烹饪",
          "书法",
          "雕塑"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 30,
        "cost": 30
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 26,
        "cost": 25,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 60,
        "cost": 40
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "parapsychologist": {
    "id": "parapsychologist",
    "name": "超心理学家",
    "nameEn": "Parapsychologist",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "history",
      "language",
      "library",
      "occult",
      "psychology",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 50%、信用评级（信用评级） 20%、历史 25%、外语 41%、图书馆使用 50%、神秘学 70%、心理学 60%、科学（人类学） 31%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "history",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "occult",
        "label": "",
        "base": 5,
        "final": 70,
        "cost": 65
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "science",
        "label": "人类学",
        "base": 1,
        "final": 31,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "pilot": {
    "id": "pilot",
    "name": "飞行员",
    "nameEn": "Pilot",
    "kind": "package",
    "total": 340,
    "cr": [
      50,
      50
    ],
    "creditFixed": 50,
    "attr": "职业包 · 合计 340 点",
    "keys": [
      "credit",
      "elecRepair",
      "mechRepair",
      "navigate",
      "opHeavyMachine",
      "pilotAircraft",
      "science"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级（信用评级） 50%、电气维修 50%、机械维修 60%、导航 60%、操作重型机械 41%、驾驶（飞行器） 71%、科学（天文学） 41%",
    "note": "",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 50,
        "cost": 50
      },
      {
        "key": "elecRepair",
        "label": "",
        "base": 10,
        "final": 50,
        "cost": 40
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 60,
        "cost": 50
      },
      {
        "key": "opHeavyMachine",
        "label": "",
        "base": 1,
        "final": 41,
        "cost": 40
      },
      {
        "key": "pilotAircraft",
        "label": "",
        "base": 1,
        "final": 71,
        "cost": 70
      },
      {
        "key": "science",
        "label": "天文学",
        "base": 1,
        "final": 41,
        "cost": 40
      }
    ],
    "special": null,
    "page": ""
  },
  "police_detective": {
    "id": "police_detective",
    "name": "警探",
    "nameEn": "Police Detective",
    "kind": "package",
    "total": 300,
    "cr": [
      35,
      35
    ],
    "creditFixed": 35,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "art",
      "credit",
      "driveAuto",
      "fighting",
      "firearms",
      "law",
      "listen",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺 25%、信用评级（信用评级） 35%、汽车驾驶 40%、格斗（斗殴） 45%、射击（手枪） 50%、射击（步枪/霰弹枪） 40%、法律 60%、聆听 40%、说服 40%、心理学 40%、侦查 50%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "",
        "base": 5,
        "final": 25,
        "cost": 20,
        "choose": [
          "表演",
          "乔装"
        ]
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 35,
        "cost": 35
      },
      {
        "key": "driveAuto",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 40,
        "cost": 15
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 60,
        "cost": 55
      },
      {
        "key": "listen",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      }
    ],
    "special": null,
    "page": ""
  },
  "police_officer": {
    "id": "police_officer",
    "name": "警员",
    "nameEn": "Police Officer",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "driveAuto",
      "fighting",
      "firearms",
      "firstAid",
      "law",
      "navigate",
      "persuade",
      "psychology",
      "spotHidden"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 40%、信用评级（信用评级） 20%、汽车驾驶 50%、格斗（斗殴） 50%、射击（手枪） 40%、射击（步枪/霰弹枪） 45%、急救 50%、法律 50%、导航 40%、说服 40%、心理学 30%、侦查 45%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "driveAuto",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 45,
        "cost": 20
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 50,
        "cost": 45
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 45,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  },
  "private_investigator": {
    "id": "private_investigator",
    "name": "私家侦探",
    "nameEn": "Private Investigator",
    "kind": "package",
    "total": 290,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 290 点",
    "keys": [
      "art",
      "credit",
      "firearms",
      "law",
      "library",
      "locksmith",
      "persuade",
      "psychology",
      "spotHidden",
      "track"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "艺术/手艺（摄影） 30%、艺术/手艺（乔装） 30%、信用评级（信用评级） 20%、射击（手枪） 40%、法律 40%、图书馆使用 40%、锁匠 31%、说服 40%、心理学 40%、侦查 50%、追踪 40%",
    "note": "",
    "entries": [
      {
        "key": "art",
        "label": "摄影",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "art",
        "label": "乔装",
        "base": 5,
        "final": 30,
        "cost": 25
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "law",
        "label": "",
        "base": 5,
        "final": 40,
        "cost": 35
      },
      {
        "key": "library",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "locksmith",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30
      },
      {
        "key": "persuade",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "psychology",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "spotHidden",
        "label": "",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "track",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      }
    ],
    "special": null,
    "page": ""
  },
  "professor": {
    "id": "professor",
    "name": "教授",
    "nameEn": "Professor",
    "kind": "package",
    "total": 300,
    "cr": [
      60,
      60
    ],
    "creditFixed": 60,
    "attr": "教授：固定 5 项 + 90 点学术专精池（其中一项须达 90%）",
    "keys": [
      "credit",
      "language",
      "library",
      "persuade",
      "psychology"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "信用评级 60%、外语（任选）61%、图书馆使用 70%、说服 30%、心理学 30%，另 90 点学术专精（其中一项须达 90%）",
    "note": "原书特殊分配型职业，见 §1.4.3",
    "entries": [
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 60,
        "cost": 60
      },
      {
        "key": "language",
        "label": "任选",
        "base": 1,
        "final": 61,
        "cost": 60,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "library",
        "label": "图书馆使用",
        "base": 20,
        "final": 70,
        "cost": 50
      },
      {
        "key": "persuade",
        "label": "说服",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "psychology",
        "label": "心理学",
        "base": 10,
        "final": 30,
        "cost": 20
      }
    ],
    "special": {
      "points": 90,
      "eligible": [
        "history",
        "law",
        "medicine",
        "occult",
        "science",
        "language",
        "accounting",
        "anthropology",
        "archaeology",
        "psychology",
        "psychoanalysis"
      ],
      "oneMustReach": 90
    },
    "page": ""
  },
  "soldier": {
    "id": "soldier",
    "name": "士兵",
    "nameEn": "Soldier",
    "kind": "package",
    "total": 300,
    "cr": [
      20,
      20
    ],
    "creditFixed": 20,
    "attr": "职业包 · 合计 300 点",
    "keys": [
      "climb",
      "credit",
      "fighting",
      "firearms",
      "firstAid",
      "language",
      "mechRepair",
      "navigate",
      "stealth",
      "survival",
      "swim"
    ],
    "choices": [],
    "social": 0,
    "free": 0,
    "freePool": [],
    "presets": {},
    "desc": "",
    "skillText": "攀爬 50%、信用评级（信用评级） 20%、格斗（斗殴） 60%、射击（手枪） 50%、射击（步枪/霰弹枪） 50%、急救 50%、外语 31%、机械维修 30%、导航 30%、潜行 40%、生存 40%、游泳 40%",
    "note": "",
    "entries": [
      {
        "key": "climb",
        "label": "",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "credit",
        "label": "信用评级",
        "base": 0,
        "final": 20,
        "cost": 20
      },
      {
        "key": "fighting",
        "label": "斗殴",
        "base": 25,
        "final": 60,
        "cost": 35
      },
      {
        "key": "firearms",
        "label": "手枪",
        "base": 20,
        "final": 50,
        "cost": 30
      },
      {
        "key": "firearms",
        "label": "步枪/霰弹枪",
        "base": 25,
        "final": 50,
        "cost": 25
      },
      {
        "key": "firstAid",
        "label": "",
        "base": 30,
        "final": 50,
        "cost": 20
      },
      {
        "key": "language",
        "label": "",
        "base": 1,
        "final": 31,
        "cost": 30,
        "choose": [
          "英语",
          "拉丁语",
          "希腊语",
          "法语",
          "德语",
          "西班牙语",
          "意大利语",
          "俄语",
          "汉语",
          "日语",
          "阿拉伯语",
          "希伯来语",
          "梵语",
          "古埃及语"
        ]
      },
      {
        "key": "mechRepair",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "navigate",
        "label": "",
        "base": 10,
        "final": 30,
        "cost": 20
      },
      {
        "key": "stealth",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      },
      {
        "key": "survival",
        "label": "",
        "base": 10,
        "final": 40,
        "cost": 30
      },
      {
        "key": "swim",
        "label": "",
        "base": 20,
        "final": 40,
        "cost": 20
      }
    ],
    "special": null,
    "page": ""
  }
};

export const KPCP_WEAPONS = [
  {
    "name": "弓与箭 Bow and Arrows",
    "skill": "射击（弓）",
    "skillKey": "firearms",
    "skillLabel": "弓",
    "damage": "1D6+半数DB",
    "impale": "是",
    "range": "30 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "97",
    "price1920": "$7",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "黄铜指虎 Brass Knuckles",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D3+1+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$14",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "长鞭 Bullwhip",
    "skill": "格斗（鞭）",
    "skillKey": "fighting",
    "skillLabel": "鞭",
    "damage": "1D3+半数DB",
    "impale": "否",
    "range": "3 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$4",
    "priceModern": "$70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "燃烧的火把 Burning Torch",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+燃烧",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$0.05",
    "priceModern": "$0.70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "链锯 Chainsaw*",
    "skill": "格斗（链锯）",
    "skillKey": "fighting",
    "skillLabel": "链锯",
    "damage": "2D8",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$400",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  {
    "name": "短棍（包铅棍、护身棍）Blackjack",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$20",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "大棒（棒球棒/板球拍、拨火棍等）Club, Large",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$3",
    "priceModern": "$50",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "小棒（警棍）Club, Small",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "弩 Crossbow",
    "skill": "射击（弓）",
    "skillKey": "firearms",
    "skillLabel": "弓",
    "damage": "1D8+2",
    "impale": "是",
    "range": "50 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "96",
    "price1920": "$10",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "绞索 Garrote*",
    "skill": "格斗（绞索）",
    "skillKey": "fighting",
    "skillLabel": "绞索",
    "damage": "1D6+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$0.50",
    "priceModern": "$5",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "手斧/镰刀 Hatchet/Sickle",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+1+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "刀，大型（砍刀、开山刀等）Knife, Large",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$4",
    "priceModern": "$70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "刀，中型（雕刻刀等）Knife, Medium",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D4+2+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$20",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "刀，小型（弹簧刀等）Knife, Small",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D4+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "带电电线（220V）Live Wire",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "2D8+眩晕",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "–",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  {
    "name": "催泪喷雾 Mace Spray*",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "眩晕",
    "impale": "否",
    "range": "2 码",
    "attacks": "1",
    "ammo": "25 次喷射",
    "malfunction": "–",
    "price1920": "–",
    "priceModern": "$15",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  {
    "name": "双节棍 Nunchaku",
    "skill": "格斗（连枷）",
    "skillKey": "fighting",
    "skillLabel": "连枷",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "投掷石块 Rock, Thrown",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D4+半数DB",
    "impale": "否",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "–",
    "priceModern": "–",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "手里剑 Shuriken",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D3+半数DB",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "2",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$0.50",
    "priceModern": "$5",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "长矛（骑兵长枪）Spear",
    "skill": "格斗（长矛）",
    "skillKey": "fighting",
    "skillLabel": "长矛",
    "damage": "1D8+1",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$25",
    "priceModern": "$200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "长矛，投掷（稀有）Spear, Thrown",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D8+半数DB",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$30",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "电击枪（接触式）Stun Gun (contact)*",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D3+眩晕",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "不定",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$270",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  {
    "name": "电击枪（飞镖式）Stun Gun (dart)*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D3+眩晕",
    "impale": "否",
    "range": "5 码",
    "attacks": "1",
    "ammo": "3",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$550",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  {
    "name": "剑，重型（骑兵军刀）Sword, Heavy",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D8+1+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$30",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "剑，中型（刺剑、重花剑等）Sword, Medium",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D6+1+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$15",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "剑，轻型（开刃击剑用剑、手杖剑等）Sword, Light",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D6+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$25",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "回旋镖（战用，稀有）War Boomerang",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D8+半数DB",
    "impale": "否",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$6",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  {
    "name": "燧发手枪 .54（稀有）Flintlock",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1/4",
    "ammo": "1",
    "malfunction": "93",
    "price1920": "$30",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": ".22 半自动手枪（.22 LR）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6",
    "impale": "是",
    "range": "5 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "$5",
    "priceModern": "$400",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "德林加手枪（.41 Remington 95 型）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6",
    "impale": "是",
    "range": "3 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "99",
    "price1920": "$10",
    "priceModern": "$750",
    "eras": [
      "1920s"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s"
  },
  {
    "name": ".32 左轮手枪",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D8",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$8",
    "priceModern": "$270",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": ".32 半自动手枪（或 7.65mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D8",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "98",
    "price1920": "$11",
    "priceModern": "$400",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": ".38 左轮手枪*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$15",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "毛瑟 C96「驳壳枪」7.63×25mm（稀有）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "$40",
    "priceModern": "$3,500",
    "eras": [
      "1920s"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s"
  },
  {
    "name": "格洛克 17（9×19mm）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "17",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  {
    "name": "P08 鲁格（9×19mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "$40",
    "priceModern": "$2,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "马卡洛夫 PM（9×18mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$450",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  {
    "name": "TT-33／54 式（7.62×25mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$300",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "二战、现代"
  },
  {
    "name": ".44 马格南左轮手枪",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1D4+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$750",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  {
    "name": "柯尔特单动陆军左轮 .45（SAA）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$25",
    "priceModern": "$600",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "韦伯利 Mk VI 左轮 .455（稀有）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$32",
    "priceModern": "$1,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "M1911 手枪（.45 ACP）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "7",
    "malfunction": "98",
    "price1920": "$22",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  {
    "name": "沙漠之鹰 .50 AE（稀有）Desert Eagle",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1D6+3",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "7",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  {
    "name": "1861 斯普林菲尔德滑膛步枪 .58（稀有）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+4",
    "impale": "是",
    "range": "50 码",
    "attacks": "1/4",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "$5",
    "priceModern": "$1,000",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  {
    "name": ".22 栓动步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D6+1",
    "impale": "是",
    "range": "25 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "98",
    "price1920": "$6",
    "priceModern": "$250",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": "温彻斯特 1894 型（.30-30）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+2",
    "impale": "是",
    "range": "50 码",
    "attacks": "1(2)",
    "ammo": "7",
    "malfunction": "100",
    "price1920": "$30",
    "priceModern": "$1,200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": "马蒂尼-亨利步枪 .577/450*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+1D6+3",
    "impale": "是",
    "range": "80 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$8",
    "priceModern": "$800",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  {
    "name": "莫兰上校气步枪（Col. Moran's Air Rifle）*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+1",
    "impale": "是",
    "range": "20 码",
    "attacks": "1/3",
    "ammo": "1",
    "malfunction": "88",
    "price1920": "$200",
    "priceModern": "$200",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  {
    "name": "M1 加兰德（.30-06）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2)",
    "ammo": "8",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$1,200",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "二战、现代"
  },
  {
    "name": "SKS 卡宾枪（7.62×39mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$500",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": "李-恩菲尔德（.303）Lee-Enfield",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "99",
    "price1920": "$30",
    "priceModern": "$750",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": ".30-06 栓动步枪*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "99",
    "price1920": "$30",
    "priceModern": "$1,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": ".223 半自动步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+1",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (3)",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$700",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": ".45/70 杠杆式步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+1D6+3",
    "impale": "是",
    "range": "75 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "$45",
    "priceModern": "$1,200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": "猎象枪（.416 Rigby）Elephant Gun",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+4",
    "impale": "是",
    "range": "50 码",
    "attacks": "1",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$500",
    "priceModern": "$10,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  {
    "name": "德拉贡诺夫狙击步枪（7.62×54mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "1 (2)",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$3,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": "巴雷特 M82（.50 BMG）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D10+1D8+6",
    "impale": "是",
    "range": "250 码",
    "attacks": "1",
    "ammo": "11",
    "malfunction": "96",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": "M39 增强型射手步枪（7.62×51mm）*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "1 (2)",
    "ammo": "20",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": "栓动狙击步枪 Bolt-Action Sniper*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D8+4",
    "impale": "是",
    "range": "200 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  {
    "name": ".410 霰弹枪（1B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6/1D6/1D3",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$10",
    "priceModern": "$150",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s、现代"
  },
  {
    "name": "12 号霰弹枪（2B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$25",
    "priceModern": "$500",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s、现代"
  },
  {
    "name": "12 号霰弹枪（泵动）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "5",
    "malfunction": "100",
    "price1920": "$40",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  {
    "name": "12 号霰弹枪（半自动）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "5",
    "malfunction": "100",
    "price1920": "$60",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  {
    "name": "12 号霰弹枪（2B 锯短）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/1D6",
    "impale": "否",
    "range": "5/10 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  {
    "name": "10 号霰弹枪（2B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+2/2D6+1/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$20",
    "priceModern": "–",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  {
    "name": "温彻斯特 1887 型（10 号）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+2/2D6+1/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "5",
    "malfunction": "96",
    "price1920": "$35",
    "priceModern": "$1,300",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  {
    "name": "伯奈利 M4（12 号）Benelli M4",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "7",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$1,300",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  {
    "name": "AK-47*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$700",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  {
    "name": "FN FAL*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2) 或点射",
    "ammo": "20",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  {
    "name": "M16*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (3) 或点射",
    "ammo": "30",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  {
    "name": "斯泰尔 AUG* Steyr AUG",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$2,500",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  {
    "name": "MP-28*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "97",
    "price1920": "$250",
    "priceModern": "$27,000",
    "eras": [
      "1920s"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s"
  },
  {
    "name": "HK MP5*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$3,000",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  {
    "name": "MP-40 施迈瑟／司登 Sten",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$650",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "二战、现代"
  },
  {
    "name": "PPSh-41（7.62×25mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 或全自动",
    "ammo": "71",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$3,500",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "二战、现代"
  },
  {
    "name": "蝎式 vz-61（.32 ACP）Škorpion",
    "skill": "射击（手枪或步枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪或步枪",
    "damage": "1D8",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "96",
    "price1920": "–",
    "priceModern": "$850",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  {
    "name": "汤普森 M1928A1 或任何「汤米枪」（稀有）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 或点射 或全自动",
    "ammo": "20/30/50",
    "malfunction": "98",
    "price1920": "$250",
    "priceModern": "$2,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s、现代"
  },
  {
    "name": "乌兹（9×19mm）* Uzi",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$1,300",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  {
    "name": "FN P90（5.7×28mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "50",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  {
    "name": "毛瑟 M712 速射型（7.63×25mm）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "99",
    "price1920": "$110",
    "priceModern": "$25,000",
    "eras": [
      "1920s"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s、1930s"
  },
  {
    "name": "加特林机枪 .30-06（稀有）* Gatling",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "60 码",
    "attacks": "点射 或全自动",
    "ammo": "240",
    "malfunction": "98",
    "price1920": "$600",
    "priceModern": "$30,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s"
  },
  {
    "name": "勃朗宁自动步枪 .30-06 M1918*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "100",
    "price1920": "$850",
    "priceModern": "$12,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  {
    "name": "弹链供弹机枪 .30-06* Belt-Fed MG",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "98",
    "price1920": "$1,750",
    "priceModern": "$5,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  {
    "name": "布伦轻机枪 .303 Bren",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 或点射 或全自动",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$7,000",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "二战、现代"
  },
  {
    "name": "刘易斯轻机枪 .303* Lewis",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "点射 或全自动",
    "ammo": "47/97",
    "malfunction": "98",
    "price1920": "$850",
    "priceModern": "$27,000*",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  {
    "name": "米尼岗 Minigun*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "200 码",
    "attacks": "点射 或全自动",
    "ammo": "4000",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  {
    "name": "FN 米尼米／M249（5.56×45mm）",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6",
    "impale": "是",
    "range": "110 码",
    "attacks": "点射 或全自动",
    "ammo": "30/200",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  {
    "name": "M60（7.62×51mm）*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  {
    "name": "勃朗宁 M2（.50 BMG）",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D10+1D8+6",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、现代"
  },
  {
    "name": "莫洛托夫鸡尾酒 Molotov Cocktail",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "2D6+燃烧",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "信号手枪（信号枪）Signal Handgun",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6+燃烧",
    "impale": "是",
    "range": "10 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "$10",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "榴弹发射器 M79*",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "3D10，2 码",
    "impale": "是",
    "range": "20 码",
    "attacks": "1/3",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "炸药棒 Dynamite Stick*",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "4D10，3 码",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "$0.10",
    "priceModern": "$7",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "雷管（电发）Blasting Cap",
    "skill": "电气维修",
    "skillKey": "elecRepair",
    "skillLabel": "",
    "damage": "2D10，1 码",
    "impale": "是",
    "range": "N/A",
    "attacks": "N/A",
    "ammo": "一次性",
    "malfunction": "100",
    "price1920": "$21",
    "priceModern": "$200（每盒）",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "管状炸弹 Pipe Bomb",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "1D10，3 码",
    "impale": "是",
    "range": "就地",
    "attacks": "一次性",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "塑胶炸药 C-4（4 盎司/100g）",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "6D10，3 码",
    "impale": "是",
    "range": "就地",
    "attacks": "一次性",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "手榴弹 Hand Grenade*",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "4D10，3 码",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "81mm 迫击炮 81mm Mortar",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "6D10，6 码",
    "impale": "是",
    "range": "500 码",
    "attacks": "1",
    "ammo": "分装",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "75mm 野战炮 75mm Field Gun",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "10D10，2 码",
    "impale": "是",
    "range": "500 码",
    "attacks": "1/4",
    "ammo": "分装",
    "malfunction": "98",
    "price1920": "$1,500",
    "priceModern": "–",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "120mm 坦克炮（稳定型）",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "15D10，4 码",
    "impale": "是",
    "range": "2,000 码",
    "attacks": "1",
    "ammo": "分装",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "舰载 5 英寸炮（稳定型）",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "12D10，4 码",
    "impale": "是",
    "range": "3,000 码",
    "attacks": "1",
    "ammo": "自动弹仓",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "反人员地雷 AP Mine",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "4D10，5 码",
    "impale": "是",
    "range": "就地",
    "attacks": "就地",
    "ammo": "一次性",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "阔剑地雷 Claymore*",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "6D6，20 码",
    "impale": "是",
    "range": "就地",
    "attacks": "就地",
    "ammo": "一次性",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "火焰喷射器 Flamethrower",
    "skill": "射击（火焰喷射器）",
    "skillKey": "firearms",
    "skillLabel": "火焰喷射器",
    "damage": "2D6+燃烧",
    "impale": "是",
    "range": "25 码",
    "attacks": "1",
    "ammo": "至少 10",
    "malfunction": "93",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  {
    "name": "轻型反坦克武器 LAW",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "8D10，1 码",
    "impale": "是",
    "range": "150 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  {
    "name": "RPG-7（可重复使用）",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "8D10，2 码",
    "impale": "是",
    "range": "150 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  }
];

export const KPCP_WEAPON_BY_NAME = {
  "弓与箭 Bow and Arrows": {
    "name": "弓与箭 Bow and Arrows",
    "skill": "射击（弓）",
    "skillKey": "firearms",
    "skillLabel": "弓",
    "damage": "1D6+半数DB",
    "impale": "是",
    "range": "30 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "97",
    "price1920": "$7",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "黄铜指虎 Brass Knuckles": {
    "name": "黄铜指虎 Brass Knuckles",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D3+1+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$14",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "长鞭 Bullwhip": {
    "name": "长鞭 Bullwhip",
    "skill": "格斗（鞭）",
    "skillKey": "fighting",
    "skillLabel": "鞭",
    "damage": "1D3+半数DB",
    "impale": "否",
    "range": "3 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$4",
    "priceModern": "$70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "燃烧的火把 Burning Torch": {
    "name": "燃烧的火把 Burning Torch",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+燃烧",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$0.05",
    "priceModern": "$0.70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "链锯 Chainsaw*": {
    "name": "链锯 Chainsaw*",
    "skill": "格斗（链锯）",
    "skillKey": "fighting",
    "skillLabel": "链锯",
    "damage": "2D8",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$400",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  "短棍（包铅棍、护身棍）Blackjack": {
    "name": "短棍（包铅棍、护身棍）Blackjack",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$20",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "大棒（棒球棒/板球拍、拨火棍等）Club, Large": {
    "name": "大棒（棒球棒/板球拍、拨火棍等）Club, Large",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$3",
    "priceModern": "$50",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "小棒（警棍）Club, Small": {
    "name": "小棒（警棍）Club, Small",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "弩 Crossbow": {
    "name": "弩 Crossbow",
    "skill": "射击（弓）",
    "skillKey": "firearms",
    "skillLabel": "弓",
    "damage": "1D8+2",
    "impale": "是",
    "range": "50 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "96",
    "price1920": "$10",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "绞索 Garrote*": {
    "name": "绞索 Garrote*",
    "skill": "格斗（绞索）",
    "skillKey": "fighting",
    "skillLabel": "绞索",
    "damage": "1D6+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$0.50",
    "priceModern": "$5",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "手斧/镰刀 Hatchet/Sickle": {
    "name": "手斧/镰刀 Hatchet/Sickle",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D6+1+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "刀，大型（砍刀、开山刀等）Knife, Large": {
    "name": "刀，大型（砍刀、开山刀等）Knife, Large",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D8+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$4",
    "priceModern": "$70",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "刀，中型（雕刻刀等）Knife, Medium": {
    "name": "刀，中型（雕刻刀等）Knife, Medium",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D4+2+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$20",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "刀，小型（弹簧刀等）Knife, Small": {
    "name": "刀，小型（弹簧刀等）Knife, Small",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D4+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "带电电线（220V）Live Wire": {
    "name": "带电电线（220V）Live Wire",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "2D8+眩晕",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "–",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  "催泪喷雾 Mace Spray*": {
    "name": "催泪喷雾 Mace Spray*",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "眩晕",
    "impale": "否",
    "range": "2 码",
    "attacks": "1",
    "ammo": "25 次喷射",
    "malfunction": "–",
    "price1920": "–",
    "priceModern": "$15",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  "双节棍 Nunchaku": {
    "name": "双节棍 Nunchaku",
    "skill": "格斗（连枷）",
    "skillKey": "fighting",
    "skillLabel": "连枷",
    "damage": "1D8+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$15",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "投掷石块 Rock, Thrown": {
    "name": "投掷石块 Rock, Thrown",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D4+半数DB",
    "impale": "否",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "–",
    "priceModern": "–",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "手里剑 Shuriken": {
    "name": "手里剑 Shuriken",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D3+半数DB",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "2",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$0.50",
    "priceModern": "$5",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "长矛（骑兵长枪）Spear": {
    "name": "长矛（骑兵长枪）Spear",
    "skill": "格斗（长矛）",
    "skillKey": "fighting",
    "skillLabel": "长矛",
    "damage": "1D8+1",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$25",
    "priceModern": "$200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "长矛，投掷（稀有）Spear, Thrown": {
    "name": "长矛，投掷（稀有）Spear, Thrown",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D8+半数DB",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$1",
    "priceModern": "$30",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "电击枪（接触式）Stun Gun (contact)*": {
    "name": "电击枪（接触式）Stun Gun (contact)*",
    "skill": "格斗（斗殴）",
    "skillKey": "fighting",
    "skillLabel": "斗殴",
    "damage": "1D3+眩晕",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "不定",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$270",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  "电击枪（飞镖式）Stun Gun (dart)*": {
    "name": "电击枪（飞镖式）Stun Gun (dart)*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D3+眩晕",
    "impale": "否",
    "range": "5 码",
    "attacks": "1",
    "ammo": "3",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$550",
    "eras": [
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "现代"
  },
  "剑，重型（骑兵军刀）Sword, Heavy": {
    "name": "剑，重型（骑兵军刀）Sword, Heavy",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D8+1+DB",
    "impale": "否",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$30",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "剑，中型（刺剑、重花剑等）Sword, Medium": {
    "name": "剑，中型（刺剑、重花剑等）Sword, Medium",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D6+1+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$15",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "剑，轻型（开刃击剑用剑、手杖剑等）Sword, Light": {
    "name": "剑，轻型（开刃击剑用剑、手杖剑等）Sword, Light",
    "skill": "格斗（剑）",
    "skillKey": "fighting",
    "skillLabel": "剑",
    "damage": "1D6+DB",
    "impale": "是",
    "range": "接触",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$25",
    "priceModern": "$130",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "回旋镖（战用，稀有）War Boomerang": {
    "name": "回旋镖（战用，稀有）War Boomerang",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "1D8+半数DB",
    "impale": "否",
    "range": "STR/5 码",
    "attacks": "1",
    "ammo": "–",
    "malfunction": "–",
    "price1920": "$2",
    "priceModern": "$6",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 7,
    "category": "近战武器 Hand-to-Hand",
    "note": "1920s、现代"
  },
  "燧发手枪 .54（稀有）Flintlock": {
    "name": "燧发手枪 .54（稀有）Flintlock",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1/4",
    "ammo": "1",
    "malfunction": "93",
    "price1920": "$30",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  ".22 半自动手枪（.22 LR）": {
    "name": ".22 半自动手枪（.22 LR）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6",
    "impale": "是",
    "range": "5 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "$5",
    "priceModern": "$400",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "德林加手枪（.41 Remington 95 型）": {
    "name": "德林加手枪（.41 Remington 95 型）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6",
    "impale": "是",
    "range": "3 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "99",
    "price1920": "$10",
    "priceModern": "$750",
    "eras": [
      "1920s"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s"
  },
  ".32 左轮手枪": {
    "name": ".32 左轮手枪",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D8",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$8",
    "priceModern": "$270",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  ".32 半自动手枪（或 7.65mm）": {
    "name": ".32 半自动手枪（或 7.65mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D8",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "98",
    "price1920": "$11",
    "priceModern": "$400",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  ".38 左轮手枪*": {
    "name": ".38 左轮手枪*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$15",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "毛瑟 C96「驳壳枪」7.63×25mm（稀有）": {
    "name": "毛瑟 C96「驳壳枪」7.63×25mm（稀有）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "$40",
    "priceModern": "$3,500",
    "eras": [
      "1920s"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s"
  },
  "格洛克 17（9×19mm）*": {
    "name": "格洛克 17（9×19mm）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "17",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  "P08 鲁格（9×19mm）": {
    "name": "P08 鲁格（9×19mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "$40",
    "priceModern": "$2,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "马卡洛夫 PM（9×18mm）": {
    "name": "马卡洛夫 PM（9×18mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$450",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  "TT-33／54 式（7.62×25mm）": {
    "name": "TT-33／54 式（7.62×25mm）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (3)",
    "ammo": "8",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$300",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "二战、现代"
  },
  ".44 马格南左轮手枪": {
    "name": ".44 马格南左轮手枪",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1D4+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$750",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  "柯尔特单动陆军左轮 .45（SAA）": {
    "name": "柯尔特单动陆军左轮 .45（SAA）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$25",
    "priceModern": "$600",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "韦伯利 Mk VI 左轮 .455（稀有）*": {
    "name": "韦伯利 Mk VI 左轮 .455（稀有）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2)",
    "ammo": "6",
    "malfunction": "99",
    "price1920": "$32",
    "priceModern": "$1,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "M1911 手枪（.45 ACP）": {
    "name": "M1911 手枪（.45 ACP）",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (3)",
    "ammo": "7",
    "malfunction": "98",
    "price1920": "$22",
    "priceModern": "$350",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "1920s、现代"
  },
  "沙漠之鹰 .50 AE（稀有）Desert Eagle": {
    "name": "沙漠之鹰 .50 AE（稀有）Desert Eagle",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1D6+3",
    "impale": "是",
    "range": "15 码",
    "attacks": "1",
    "ammo": "7",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 8,
    "category": "手枪 Handguns",
    "note": "现代"
  },
  "1861 斯普林菲尔德滑膛步枪 .58（稀有）": {
    "name": "1861 斯普林菲尔德滑膛步枪 .58（稀有）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+4",
    "impale": "是",
    "range": "50 码",
    "attacks": "1/4",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "$5",
    "priceModern": "$1,000",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  ".22 栓动步枪": {
    "name": ".22 栓动步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D6+1",
    "impale": "是",
    "range": "25 码",
    "attacks": "1",
    "ammo": "6",
    "malfunction": "98",
    "price1920": "$6",
    "priceModern": "$250",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  "温彻斯特 1894 型（.30-30）": {
    "name": "温彻斯特 1894 型（.30-30）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+2",
    "impale": "是",
    "range": "50 码",
    "attacks": "1(2)",
    "ammo": "7",
    "malfunction": "100",
    "price1920": "$30",
    "priceModern": "$1,200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  "马蒂尼-亨利步枪 .577/450*": {
    "name": "马蒂尼-亨利步枪 .577/450*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+1D6+3",
    "impale": "是",
    "range": "80 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$8",
    "priceModern": "$800",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  "莫兰上校气步枪（Col. Moran's Air Rifle）*": {
    "name": "莫兰上校气步枪（Col. Moran's Air Rifle）*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+1",
    "impale": "是",
    "range": "20 码",
    "attacks": "1/3",
    "ammo": "1",
    "malfunction": "88",
    "price1920": "$200",
    "priceModern": "$200",
    "eras": [
      "1920s"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s"
  },
  "M1 加兰德（.30-06）": {
    "name": "M1 加兰德（.30-06）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2)",
    "ammo": "8",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$1,200",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "二战、现代"
  },
  "SKS 卡宾枪（7.62×39mm）": {
    "name": "SKS 卡宾枪（7.62×39mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$500",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  "李-恩菲尔德（.303）Lee-Enfield": {
    "name": "李-恩菲尔德（.303）Lee-Enfield",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2)",
    "ammo": "10",
    "malfunction": "99",
    "price1920": "$30",
    "priceModern": "$750",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  ".30-06 栓动步枪*": {
    "name": ".30-06 栓动步枪*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "99",
    "price1920": "$30",
    "priceModern": "$1,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  ".223 半自动步枪": {
    "name": ".223 半自动步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+1",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (3)",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$700",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  ".45/70 杠杆式步枪": {
    "name": ".45/70 杠杆式步枪",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8+1D6+3",
    "impale": "是",
    "range": "75 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "$45",
    "priceModern": "$1,200",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  "猎象枪（.416 Rigby）Elephant Gun": {
    "name": "猎象枪（.416 Rigby）Elephant Gun",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+4",
    "impale": "是",
    "range": "50 码",
    "attacks": "1",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$500",
    "priceModern": "$10,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "1920s、现代"
  },
  "德拉贡诺夫狙击步枪（7.62×54mm）": {
    "name": "德拉贡诺夫狙击步枪（7.62×54mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "1 (2)",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$3,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  "巴雷特 M82（.50 BMG）": {
    "name": "巴雷特 M82（.50 BMG）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D10+1D8+6",
    "impale": "是",
    "range": "250 码",
    "attacks": "1",
    "ammo": "11",
    "malfunction": "96",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  "M39 增强型射手步枪（7.62×51mm）*": {
    "name": "M39 增强型射手步枪（7.62×51mm）*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "1 (2)",
    "ammo": "20",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  "栓动狙击步枪 Bolt-Action Sniper*": {
    "name": "栓动狙击步枪 Bolt-Action Sniper*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D8+4",
    "impale": "是",
    "range": "200 码",
    "attacks": "1",
    "ammo": "5",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 9,
    "category": "步枪 Rifles",
    "note": "现代"
  },
  ".410 霰弹枪（1B）": {
    "name": ".410 霰弹枪（1B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6/1D6/1D3",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "100",
    "price1920": "$10",
    "priceModern": "$150",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s、现代"
  },
  "12 号霰弹枪（2B）": {
    "name": "12 号霰弹枪（2B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$25",
    "priceModern": "$500",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s、现代"
  },
  "12 号霰弹枪（泵动）": {
    "name": "12 号霰弹枪（泵动）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "5",
    "malfunction": "100",
    "price1920": "$40",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  "12 号霰弹枪（半自动）": {
    "name": "12 号霰弹枪（半自动）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "5",
    "malfunction": "100",
    "price1920": "$60",
    "priceModern": "$350",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  "12 号霰弹枪（2B 锯短）": {
    "name": "12 号霰弹枪（2B 锯短）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/1D6",
    "impale": "否",
    "range": "5/10 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  "10 号霰弹枪（2B）": {
    "name": "10 号霰弹枪（2B）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+2/2D6+1/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "2",
    "malfunction": "100",
    "price1920": "$20",
    "priceModern": "–",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  "温彻斯特 1887 型（10 号）": {
    "name": "温彻斯特 1887 型（10 号）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6+2/2D6+1/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (2)",
    "ammo": "5",
    "malfunction": "96",
    "price1920": "$35",
    "priceModern": "$1,300",
    "eras": [
      "1920s"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "1920s"
  },
  "伯奈利 M4（12 号）Benelli M4": {
    "name": "伯奈利 M4（12 号）Benelli M4",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "4D6/2D6/1D6",
    "impale": "否",
    "range": "10/20/50 码",
    "attacks": "1 (3)",
    "ammo": "7",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$1,300",
    "eras": [
      "现代"
    ],
    "table": 10,
    "category": "霰弹枪 Shotguns",
    "note": "现代"
  },
  "AK-47*": {
    "name": "AK-47*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$700",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  "FN FAL*": {
    "name": "FN FAL*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2) 或点射",
    "ammo": "20",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  "M16*": {
    "name": "M16*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "100 码",
    "attacks": "1 (3) 或点射",
    "ammo": "30",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  "斯泰尔 AUG* Steyr AUG": {
    "name": "斯泰尔 AUG* Steyr AUG",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "2D6",
    "impale": "是",
    "range": "110 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$2,500",
    "eras": [
      "现代"
    ],
    "table": 11,
    "category": "突击步枪 Assault Rifles",
    "note": "现代"
  },
  "MP-28*": {
    "name": "MP-28*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "97",
    "price1920": "$250",
    "priceModern": "$27,000",
    "eras": [
      "1920s"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s"
  },
  "HK MP5*": {
    "name": "HK MP5*",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "30",
    "malfunction": "100",
    "price1920": "–",
    "priceModern": "$3,000",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  "MP-40 施迈瑟／司登 Sten": {
    "name": "MP-40 施迈瑟／司登 Sten",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "95",
    "price1920": "–",
    "priceModern": "$650",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "二战、现代"
  },
  "PPSh-41（7.62×25mm）": {
    "name": "PPSh-41（7.62×25mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 或全自动",
    "ammo": "71",
    "malfunction": "97",
    "price1920": "–",
    "priceModern": "$3,500",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "二战、现代"
  },
  "蝎式 vz-61（.32 ACP）Škorpion": {
    "name": "蝎式 vz-61（.32 ACP）Škorpion",
    "skill": "射击（手枪或步枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪或步枪",
    "damage": "1D8",
    "impale": "是",
    "range": "15 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "96",
    "price1920": "–",
    "priceModern": "$850",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  "汤普森 M1928A1 或任何「汤米枪」（稀有）": {
    "name": "汤普森 M1928A1 或任何「汤米枪」（稀有）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D10+2",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 或点射 或全自动",
    "ammo": "20/30/50",
    "malfunction": "98",
    "price1920": "$250",
    "priceModern": "$2,000",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s、现代"
  },
  "乌兹（9×19mm）* Uzi": {
    "name": "乌兹（9×19mm）* Uzi",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10",
    "impale": "是",
    "range": "20 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "32",
    "malfunction": "98",
    "price1920": "–",
    "priceModern": "$1,300",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  "FN P90（5.7×28mm）": {
    "name": "FN P90（5.7×28mm）",
    "skill": "射击（步枪/霰弹枪）",
    "skillKey": "firearms",
    "skillLabel": "步枪/霰弹枪",
    "damage": "1D8",
    "impale": "是",
    "range": "30 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "50",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$2,000",
    "eras": [
      "现代"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "现代"
  },
  "毛瑟 M712 速射型（7.63×25mm）*": {
    "name": "毛瑟 M712 速射型（7.63×25mm）*",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D10+1",
    "impale": "是",
    "range": "10 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "99",
    "price1920": "$110",
    "priceModern": "$25,000",
    "eras": [
      "1920s"
    ],
    "table": 12,
    "category": "冲锋枪 Submachine Guns",
    "note": "1920s、1930s"
  },
  "加特林机枪 .30-06（稀有）* Gatling": {
    "name": "加特林机枪 .30-06（稀有）* Gatling",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "60 码",
    "attacks": "点射 或全自动",
    "ammo": "240",
    "malfunction": "98",
    "price1920": "$600",
    "priceModern": "$30,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s"
  },
  "勃朗宁自动步枪 .30-06 M1918*": {
    "name": "勃朗宁自动步枪 .30-06 M1918*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 (2) 或点射 或全自动",
    "ammo": "20",
    "malfunction": "100",
    "price1920": "$850",
    "priceModern": "$12,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  "弹链供弹机枪 .30-06* Belt-Fed MG": {
    "name": "弹链供弹机枪 .30-06* Belt-Fed MG",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "98",
    "price1920": "$1,750",
    "priceModern": "$5,000",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  "布伦轻机枪 .303 Bren": {
    "name": "布伦轻机枪 .303 Bren",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "1 或点射 或全自动",
    "ammo": "30",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$7,000",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "二战、现代"
  },
  "刘易斯轻机枪 .303* Lewis": {
    "name": "刘易斯轻机枪 .303* Lewis",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "90 码",
    "attacks": "点射 或全自动",
    "ammo": "47/97",
    "malfunction": "98",
    "price1920": "$850",
    "priceModern": "$27,000*",
    "eras": [
      "1920s"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、二战"
  },
  "米尼岗 Minigun*": {
    "name": "米尼岗 Minigun*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "200 码",
    "attacks": "点射 或全自动",
    "ammo": "4000",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  "FN 米尼米／M249（5.56×45mm）": {
    "name": "FN 米尼米／M249（5.56×45mm）",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6",
    "impale": "是",
    "range": "110 码",
    "attacks": "点射 或全自动",
    "ammo": "30/200",
    "malfunction": "99",
    "price1920": "–",
    "priceModern": "$12,000",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  "M60（7.62×51mm）*": {
    "name": "M60（7.62×51mm）*",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D6+4",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "现代"
  },
  "勃朗宁 M2（.50 BMG）": {
    "name": "勃朗宁 M2（.50 BMG）",
    "skill": "射击（机枪）",
    "skillKey": "firearms",
    "skillLabel": "机枪",
    "damage": "2D10+1D8+6",
    "impale": "是",
    "range": "150 码",
    "attacks": "点射 或全自动",
    "ammo": "250",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 13,
    "category": "机枪 Machine Guns",
    "note": "1920s、现代"
  },
  "莫洛托夫鸡尾酒 Molotov Cocktail": {
    "name": "莫洛托夫鸡尾酒 Molotov Cocktail",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "2D6+燃烧",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "信号手枪（信号枪）Signal Handgun": {
    "name": "信号手枪（信号枪）Signal Handgun",
    "skill": "射击（手枪）",
    "skillKey": "firearms",
    "skillLabel": "手枪",
    "damage": "1D6+燃烧",
    "impale": "是",
    "range": "10 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "$10",
    "priceModern": "$100",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "榴弹发射器 M79*": {
    "name": "榴弹发射器 M79*",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "3D10，2 码",
    "impale": "是",
    "range": "20 码",
    "attacks": "1/3",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "炸药棒 Dynamite Stick*": {
    "name": "炸药棒 Dynamite Stick*",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "4D10，3 码",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "$0.10",
    "priceModern": "$7",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "雷管（电发）Blasting Cap": {
    "name": "雷管（电发）Blasting Cap",
    "skill": "电气维修",
    "skillKey": "elecRepair",
    "skillLabel": "",
    "damage": "2D10，1 码",
    "impale": "是",
    "range": "N/A",
    "attacks": "N/A",
    "ammo": "一次性",
    "malfunction": "100",
    "price1920": "$21",
    "priceModern": "$200（每盒）",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "管状炸弹 Pipe Bomb": {
    "name": "管状炸弹 Pipe Bomb",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "1D10，3 码",
    "impale": "是",
    "range": "就地",
    "attacks": "一次性",
    "ammo": "1",
    "malfunction": "95",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "塑胶炸药 C-4（4 盎司/100g）": {
    "name": "塑胶炸药 C-4（4 盎司/100g）",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "6D10，3 码",
    "impale": "是",
    "range": "就地",
    "attacks": "一次性",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "手榴弹 Hand Grenade*": {
    "name": "手榴弹 Hand Grenade*",
    "skill": "投掷",
    "skillKey": "throw",
    "skillLabel": "",
    "damage": "4D10，3 码",
    "impale": "是",
    "range": "STR/5 码",
    "attacks": "1/2",
    "ammo": "1",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "81mm 迫击炮 81mm Mortar": {
    "name": "81mm 迫击炮 81mm Mortar",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "6D10，6 码",
    "impale": "是",
    "range": "500 码",
    "attacks": "1",
    "ammo": "分装",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "75mm 野战炮 75mm Field Gun": {
    "name": "75mm 野战炮 75mm Field Gun",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "10D10，2 码",
    "impale": "是",
    "range": "500 码",
    "attacks": "1/4",
    "ammo": "分装",
    "malfunction": "98",
    "price1920": "$1,500",
    "priceModern": "–",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "120mm 坦克炮（稳定型）": {
    "name": "120mm 坦克炮（稳定型）",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "15D10，4 码",
    "impale": "是",
    "range": "2,000 码",
    "attacks": "1",
    "ammo": "分装",
    "malfunction": "100",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "舰载 5 英寸炮（稳定型）": {
    "name": "舰载 5 英寸炮（稳定型）",
    "skill": "炮术",
    "skillKey": "artillery",
    "skillLabel": "",
    "damage": "12D10，4 码",
    "impale": "是",
    "range": "3,000 码",
    "attacks": "1",
    "ammo": "自动弹仓",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "反人员地雷 AP Mine": {
    "name": "反人员地雷 AP Mine",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "4D10，5 码",
    "impale": "是",
    "range": "就地",
    "attacks": "就地",
    "ammo": "一次性",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "阔剑地雷 Claymore*": {
    "name": "阔剑地雷 Claymore*",
    "skill": "爆破",
    "skillKey": "demolitions",
    "skillLabel": "",
    "damage": "6D6，20 码",
    "impale": "是",
    "range": "就地",
    "attacks": "就地",
    "ammo": "一次性",
    "malfunction": "99",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "火焰喷射器 Flamethrower": {
    "name": "火焰喷射器 Flamethrower",
    "skill": "射击（火焰喷射器）",
    "skillKey": "firearms",
    "skillLabel": "火焰喷射器",
    "damage": "2D6+燃烧",
    "impale": "是",
    "range": "25 码",
    "attacks": "1",
    "ammo": "至少 10",
    "malfunction": "93",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "1920s",
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "1920s、现代"
  },
  "轻型反坦克武器 LAW": {
    "name": "轻型反坦克武器 LAW",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "8D10，1 码",
    "impale": "是",
    "range": "150 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  },
  "RPG-7（可重复使用）": {
    "name": "RPG-7（可重复使用）",
    "skill": "射击（重武器）",
    "skillKey": "firearms",
    "skillLabel": "重武器",
    "damage": "8D10，2 码",
    "impale": "是",
    "range": "150 码",
    "attacks": "1",
    "ammo": "1",
    "malfunction": "98",
    "price1920": "",
    "priceModern": "",
    "eras": [
      "现代"
    ],
    "table": 14,
    "category": "爆炸物 / 重武器 / 其他",
    "note": "现代"
  }
};

export const KPCP_TERMS = {
  "temporary": "震骇",
  "indefinite": "异变",
  "permanent": "永失",
  "madness": "妄想",
  "sanity": "理智",
  "note": "伴侣版把临时性疯狂称震骇、不定性疯狂称异变、永久性疯狂称永失；意志归零后称妄想。所有术语只在 kpcp 规则内替换。"
};

export const KPCP_DATA_REPORT = {
  "counts": {
    "skills": 50,
    "groups": 7,
    "occupations": 25,
    "weapons": 106
  },
  "unknownSkills": [],
  "unknownOccTokens": [],
  "unknownWeaponSkills": []
};
