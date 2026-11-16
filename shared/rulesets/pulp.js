/**
 * 通俗克苏鲁（Pulp Cthulhu）规则集。
 *
 * 只写「与官方 7e 不同」的部分：技能表、职业表、原型、天赋、幸运价目表、判例与审卡阈值。
 * 引擎（shared/coc7e.js）读取这里的字段做分支，缺省字段自动沿用 7e 行为。
 *
 * 数据来源：`通克规则/_data/*.json` → `tools/gen-pulp-data.mjs` → `./pulp-data.js`（生成物，勿手改）。
 * 本文件只做「规则书条款」的声明与少量纯函数，不含任何 UI 依赖。
 */

import {
  PULP_SKILLS, PULP_SKILL_BY_KEY, PULP_SKILL_BY_NAME,
  PULP_SPEC_PRESETS, PULP_SPEC_OPTIONS, PULP_SPEC_SLOTS,
  PULP_OCCUPATIONS, PULP_OCCUPATION_BY_ID,
  PULP_ARCHETYPES, PULP_ARCHETYPE_BY_ID,
  PULP_TALENTS, PULP_TALENT_BY_ID, PULP_TALENT_CATEGORIES, PULP_TALENTS_BY_CAT,
  PULP_LUCK_SPENDS, PULP_LUCK_META,
  PULP_MADNESS_TALENTS, PULP_NPC_TALENTS, PULP_GADGETS,
} from './pulp-data.js';

export const PULP_ID = 'pulp';

/** 新建卡时给专攻槽预置的默认方向（与 7e 一致：斗殴 / 手枪） */
export const PULP_DEFAULT_SPECS = { 'fighting#0': '斗殴', 'firearms#0': '手枪' };

/** 社交技能组：与 7e 同名同义，职业里的「社交技能」槽位都从这里选 */
export const PULP_SOCIAL_SKILLS = ['charm', 'fastTalk', 'intimidate', 'persuade'];

/**
 * 通俗指示器（书 p.42 右栏）：同一个规则集下的三档玩法。
 * 只影响 HP 除数、天赋数量与少量提示，不改属性掷骰公式。
 */
export const PULP_TONES = [
  {
    id: 'low', label: '低通俗', hpDivisor: 10, talents: [0, 1],
    hint: 'HP 按 (体质+体型)÷10，英雄奖励点照给；天赋 0 或 1 项。适合想保留生存压力的桌。',
  },
  {
    id: 'standard', label: '默认通俗', hpDivisor: 5, talents: [2],
    hint: 'HP 按 (体质+体型)÷5，天赋 2 项 —— 规则书默认档。',
  },
  {
    id: 'high', label: '高通俗', hpDivisor: 5, talents: [3],
    hint: 'HP 同上，天赋 3 项。英雄味最重的一档。',
  },
];

export const PULP_TONE_IDS = PULP_TONES.map((t) => t.id);

/**
 * 原型表：书内用中文名标注强制天赋（「坚定不移」），这里统一换成天赋 id，
 * 便于引擎按 id 比对、UI 按 id 选中。其余字段原样透传。
 */
const TALENT_ID_BY_ZH = new Map(PULP_TALENTS.map((t) => [t.zh, t.id]));
const ARCHETYPES = PULP_ARCHETYPES.map((a) => (
  Array.isArray(a.talentForced) && a.talentForced.length
    ? { ...a, talentForced: a.talentForced.map((x) => TALENT_ID_BY_ZH.get(x) || x) }
    : a
));
const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

/**
 * 书 p.42 第 8 步的速建参考数值（书内印本与「8 项」矛盾，此处按合计 480 的通行读法）。
 * 仅作规则书对照与自检用：车卡界面不提供速建向导，玩家按常规掷骰 / 手填属性。
 */
export const PULP_QUICK = {
  coreValue: 90,
  others: [80, 70, 60, 60, 50, 50, 40],
  occSkills: [80, 70, 70, 60, 60, 50, 50, 40],
  nonOccBonus: 20,
  nonOccCount: 5,
  note: '书内第 8 步印作「1×80、2×70、2×30、3×50、1×40」共 9 个数值，与「选 8 项技能」矛盾；'
    + '本系统按 1×80 / 2×70 / 2×60 / 1×50 / 1×40 的合计 480 的读法收录，仅作对照参考。',
};

/** 建卡规则（引擎与 UI 共用的唯一事实来源） */
export const PULP_CHARGEN = {
  /** 三档通俗指示器（低 / 默认 / 高），供 UI 与导出共用 */
  tones: PULP_TONES,
  attrs: ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'],
  methods: [
    { id: 'roll', label: '掷骰', hint: '常规属性 (3D6)×5 / (2D6+6)×5；原型指定的核心属性 (1D6+13)×5' },
  ],
  rollFormula: {
    low: { dice: '3d6', mul: 5, attrs: ['STR', 'CON', 'DEX', 'APP', 'POW'] },
    high: { dice: '2d6', add: 6, mul: 5, attrs: ['SIZ', 'INT', 'EDU'] },
  },
  luckFormula: { dice: '2d6', add: 6, mul: 5 },
  archetype: {
    required: true,
    coreCharRoll: { dice: '1d6', add: 13, mul: 5 },   // 70–95
    coreMin: 70,
    coreMax: 95,
  },
  ageAdjust: { enabled: false, min: 15, max: 90 },     // 通俗克苏鲁不套用年龄补正与教育增强
  bonusPoints: 100,                                    // 每个原型固定 100 英雄奖励点
  quick: PULP_QUICK,                                   // 仅作规则书对照，界面不提供速建
  lowPulp: { hpDivisor: 10, talentCount: [0, 1] },
  talents: { count: 2, allowed: [1, 2, 3], forcedByArchetype: true },
  creditFromOcc: true,
  woundRules: false,                                   // 重伤规则整章取消
};

/**
 * 治疗与恢复（书 p.？？）：自然恢复 2 HP/天、急救 1D4、医学 1D4（极难成功 +4，且当日恢复 +1）。
 * 仅作展示与 KP 参考，不参与派生值计算。
 */
export const PULP_HEALING = {
  natural: 2,
  fastHeal: 3,
  firstAid: '1D4',
  medicine: '1D4',
  medicineBoost: 4,
  medicineFastHeal: 1,
  note: '重伤规则取消：HP 归零即濒死，不再计算重伤阈值。',
};

/**
 * 判定口径：01 = 大成功；**掷出 100 只是普通失败**（7e 的「大失败」在通俗克苏鲁不存在）。
 * 幸运把骰点调到 01 只算极限成功，不算大成功。
 */
export const PULP_CRIT = {
  crit: '01',
  fumble: null,
  luckTo01IsExtreme: true,
  note: '掷出 100 只是普通失败；只有 01 是天生大成功。',
};

/** 疯狂天赋 / 小发明等运行时数据（二期功能直接取用，不参与车卡校验） */
export const PULP_RUNTIME = {
  madnessTalents: PULP_MADNESS_TALENTS,
  npcTalents: PULP_NPC_TALENTS,
  gadgets: PULP_GADGETS,
  luckSpends: PULP_LUCK_SPENDS,
  luckMeta: PULP_LUCK_META,
  healing: PULP_HEALING,
  crit: PULP_CRIT,
};

/** 审卡阈值：与 7e 基线合并后覆盖，字段含义见 coc7e.js 的 DEFAULT_AUDIT_RULES */
export const PULP_AUDIT_RULES = {
  enabled: true,
  charMin: 15,              // (3D6)×5 下限
  charMax: 90,              // (2D6+6)×5 上限（核心属性 95 由 coreCharMax 单独把关）
  intSizMin40: true,        // 智力/体型走 (2D6+6)×5，下限 40 仍成立
  charTotalMax: 0,
  occSkillMax: 0,
  interestSkillMax: 0,
  requireCreditInRange: true,
  forbidMixedPoints: false, // 通俗克苏鲁鼓励把点数堆到一处，不做混点限制
  creditOccOnly: true,      // 信用评级只能来自职业点
  backgroundMinFields: 6,   // 开局至少前 6 栏
  minPointUsage: 0,
  flagCustomSkills: true,
  checkOccBranches: true,
  // —— 通俗克苏鲁专属（新增规则项） ——
  requireArchetype: true,   // 必须先选原型
  coreCharMax: 95,          // 核心属性上限 (1D6+13)×5
  talentsCount: 2,          // 期望天赋数（随通俗指示器有 1/2/3 三档）
  bonusPoints: 100,         // 英雄奖励点总量（每原型固定）
  bonusWhitelist: true,     // 奖励点只能投原型列出的技能
  skillCap: 0,              // 技能成功率上限：0 = 无上限（书内允许 >100）
  requireKeyConnection: true, // 背景须指定 1 项「关键连接」
};

/** 主规则集对象 */
export const PULP_RULESET = {
  id: PULP_ID,
  name: '通俗克苏鲁',
  short: '通克',
  tag: '通俗扩展',
  desc: '英雄式调查员：先选原型再定核心属性，每原型 100 点英雄奖励点，技能可以突破 100%，'
    + 'HP 按 (体质+体型)÷5 计算 —— 更耐打、更张扬、也更接近廉价小说里的主角。',
  bullets: [
    '22 个原型：核心属性 (1D6+13)×5 = 70–95，并决定 100 点奖励点能投哪些技能',
    'HP = (体质+体型)÷5（低通俗可改回 ÷10），重伤规则取消',
    '技能成功率无上限，幸运价目表 7 条（含免死、减半理智损失）',
    '58 项技能（含 8 项格斗 / 7 项射击专攻）/ 68 个职业 / 40 条天赋 / 19 条疯狂天赋',
  ],
  era: '1920s',

  skills: PULP_SKILLS,
  skillByKey: PULP_SKILL_BY_KEY,
  skillByName: PULP_SKILL_BY_NAME,
  specPresets: PULP_SPEC_PRESETS,
  specOptions: PULP_SPEC_OPTIONS,
  specSlots: PULP_SPEC_SLOTS,
  defaultSpecs: PULP_DEFAULT_SPECS,
  socialSkills: PULP_SOCIAL_SKILLS,

  occupations: PULP_OCCUPATIONS,
  occupationById: PULP_OCCUPATION_BY_ID,

  archetypes: ARCHETYPES,
  archetypeById: ARCHETYPE_BY_ID,
  archetypeOf: pulpArchetypeOf,
  talentOf: pulpTalentRange,
  talents: PULP_TALENTS,
  talentById: PULP_TALENT_BY_ID,
  talentCategories: PULP_TALENT_CATEGORIES,
  talentsByCat: PULP_TALENTS_BY_CAT,

  backgroundFields: null,       // 复用引擎内置的 10 栏（与 7e 同名）
  backgroundCount: 10,
  chargen: PULP_CHARGEN,
  interest: (eff) => (Number(eff?.INT) || 0) * 2,
  movement: null,               // 仍用官方 7e 移动力表
  creditMode: 'range',
  skillCap: null,               // 无上限
  hpDivisor: pulpHpDivisor,
  bonusPoints: 100,
  bonusAllowed: pulpBonusAllowed,   // 引擎在算技能时用它判断奖励点是否可投
  auditRules: PULP_AUDIT_RULES,

  luckSpends: PULP_LUCK_SPENDS,
  luckMeta: PULP_LUCK_META,
  healing: PULP_HEALING,
  crit: PULP_CRIT,
  madnessTalents: PULP_MADNESS_TALENTS,
  npcTalents: PULP_NPC_TALENTS,
  gadgets: PULP_GADGETS,
};

// ------------------------------------------------------------------ 纯函数

/** 当前卡的通俗档位对象（未设置时按默认档） */
export function pulpToneOf(sheet) {
  const id = sheet && typeof sheet === 'object' ? sheet.pulpTone : '';
  return PULP_TONES.find((t) => t.id === id) || PULP_TONES[1];
}

/** HP 除数：低通俗 10，其余 5 */
export function pulpHpDivisor(sheet) {
  return pulpToneOf(sheet).hpDivisor;
}

/** 当前卡的原型对象（未选返回 null） */
export function pulpArchetypeOf(sheet) {
  const id = sheet && typeof sheet === 'object' ? sheet.archetypeId : '';
  if (!id) return null;
  return Object.hasOwn(ARCHETYPE_BY_ID, id) ? ARCHETYPE_BY_ID[id] : null;
}

/** 当前档位允许的天赋数量区间 */
export function pulpTalentRange(sheet) {
  return pulpToneOf(sheet).talents;
}

/**
 * 英雄奖励点的可用白名单。
 * 返回 null 表示这张卡不在「原型奖励点」模式下（不限制）；
 * 否则返回 { keys:Set, presets:{ [skillKey]: string[] } }。
 * `presets` 非空时，该技能只有专攻方向命中时才算允许（例：艺术/手艺(表演)）。
 */
export function pulpBonusAllowed(sheet) {
  const arche = pulpArchetypeOf(sheet);
  if (!arche) return null;
  return {
    keys: new Set(arche.bonusKeys || []),
    presets: arche.bonusPresets || {},
    archetypeId: arche.id,
    archetypeName: arche.zh,
  };
}

/** 某技能槽是否允许投入英雄奖励点 */
export function pulpBonusSlotAllowed(sheet, key, custom) {
  const allow = pulpBonusAllowed(sheet);
  if (!allow) return false;
  if (!allow.keys.has(key)) return false;
  const labels = allow.presets[key];
  if (Array.isArray(labels) && labels.length) return labels.includes(custom);
  return true;
}

/** 某个原型（或当前卡）的奖励点总量 */
export function pulpBonusBudget(sheet) {
  const arche = pulpArchetypeOf(sheet);
  return arche ? PULP_CHARGEN.bonusPoints : 0;
}

/** 按天赋表分类整理的 40 条天赋（四条 d10 表） */
export function pulpTalentTables() {
  return (PULP_TALENT_CATEGORIES || []).map((cat) => ({
    ...cat,
    rows: (PULP_TALENTS_BY_CAT?.[cat.key] || PULP_TALENTS.filter((t) => t.cat === cat.key))
      .slice()
      .sort((a, b) => a.roll - b.roll),
  }));
}

/** 原型强制的天赋（目前只有「无情斗士 → 坚定不移」） */
export function pulpForcedTalents(sheet) {
  const arche = pulpArchetypeOf(sheet);
  return Array.isArray(arche?.talentForced) ? arche.talentForced : [];
}

export { ARCHETYPES as PULP_ARCHETYPES_NORMALIZED, ARCHETYPE_BY_ID as PULP_ARCHETYPE_BY_ID_NORMALIZED };
export { PULP_TALENTS, PULP_ARCHETYPES, PULP_OCCUPATIONS, PULP_SKILLS, PULP_LUCK_SPENDS, PULP_TALENT_CATEGORIES };