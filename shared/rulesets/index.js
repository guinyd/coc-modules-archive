/**
 * 游戏规则集注册表 —— 一套代码支撑多套规则。
 *
 * 为什么放在 shared/：规则集同时被前端（车卡器/详情页/打印）与后端（校验/审卡）使用，
 * 与 coc7e.js 一样必须只有一份定义，避免两边对「点数怎么算」产生分歧。
 *
 * 依赖方向（不可成环）：
 *   rulesets/index.js  ->  ../coc7e-reference.js（纯数据）
 *   rulesets/pulp.js   ->  ./pulp-data.js（生成物）
 *   rulesets/kpcp.js   ->  ./kpcp-data.js（生成物）
 *   coc7e.js           ->  ./rulesets/index.js
 * 因此 index.js 只能 import 数据模块，不能 import coc7e.js（否则与引擎互相引用）。
 *
 * 两套「游戏规则」：coc7th（官方七版）与 pulp（通俗克苏鲁）。
 * 守秘人伴侣（kpcp）不是第三套规则，而是叠加在任一规则之上的**规则层**：
 *   character.gameSystem 仍是 classic7e | pulp；character.kpcp.enabled === true 时，
 *   由 `resolveCardRuleset()` 把基础规则集与伴侣层组合起来交给引擎。
 */

import {
  SKILLS, SKILL_BY_KEY, SKILL_BY_NAME, SPEC_PRESETS, SPEC_OPTIONS, SPEC_SLOTS,
  SOCIAL_SKILLS, OCCUPATIONS, OCCUPATION_BY_ID,
} from '../coc7e-reference.js';
import { PULP_RULESET } from './pulp.js';
import {
  KPCP_ID, KPCP_LAYER, KPCP_TOGGLES, KPCP_TOGGLE_GROUPS, KPCP_BACKGROUND_FIELDS,
  KPCP_SKILLS, KPCP_SKILL_BY_KEY, KPCP_SPEC_SLOTS, KPCP_PACKAGE_OCCUPATIONS,
  applyKpcpLayer,
} from './kpcp.js';

/** 官方 7e —— 默认规则集，旧存档没有 gameSystem 时一律回落到这里 */
export const CLASSIC_ID = 'classic7e';
/** 通俗克苏鲁 */
export const PULP_ID = 'pulp';
/** 守秘人伴侣 —— 规则层 id（不是 gameSystem） */
export { KPCP_ID };

/** 新建角色卡时给专攻槽位预置的默认方向（规则书最常见的两项） */
export const DEFAULT_SPECS = { 'fighting#0': '斗殴', 'firearms#0': '手枪' };

/**
 * 官方 7e 规则集：把引擎里原有的常量包装成统一形状。
 * 这些字段原本散落在 coc7e.js / coc7e-reference.js 中，包一层后引擎可以
 * 统一写成 `R.skills` / `R.occupations`，未知字段回落到官方行为。
 */
export const CLASSIC_RULESET = {
  id: CLASSIC_ID,
  name: '克苏鲁的呼唤 第七版',
  short: 'coc7th',
  tag: '官方规则',
  desc: '经典调查员：年龄补正、教育增强、职业点与兴趣点两套预算，技能成功率上限 99%。',
  bullets: [
    '(3D6)×5 与 (2D6+6)×5 生成属性，可逐项掷骰或手填',
    '年龄补正、教育增强检定、传奇标记',
    '职业点 + 兴趣点（智力×2）两套预算',
    '技能成功率上限 99%',
  ],
  era: '1920s',

  // —— 技能表 ——
  skills: SKILLS,
  skillByKey: SKILL_BY_KEY,
  skillByName: SKILL_BY_NAME,
  specPresets: SPEC_PRESETS,
  specOptions: SPEC_OPTIONS,
  specSlots: SPEC_SLOTS,
  defaultSpecs: DEFAULT_SPECS,
  socialSkills: SOCIAL_SKILLS,

  // —— 职业表 ——
  occupations: OCCUPATIONS,
  occupationById: OCCUPATION_BY_ID,

  // —— 建卡规则 ——
  backgroundFields: null,      // null = 沿用引擎内置的 10 栏
  backgroundCount: 10,
  chargen: null,               // null = 沿用原版逐项掷骰
  interest: (eff) => (Number(eff?.INT) || 0) * 2,
  movement: null,              // null = 沿用官方 7e 移动力表
  creditMode: 'range',
  skillCap: 99,
  hpDivisor: 10,
  bonusPoints: 0,
  archetypes: null,
  talents: null,
  auditRules: null,            // null = 沿用 DEFAULT_AUDIT_RULES

  // —— 运行时（幸运价目表 / 治疗 / 判定）——
  luckSpends: null,
  healing: null,
  crit: { crit: '01', fumble: '100', luckTo01IsExtreme: true },
};

/** 全部基础规则集：新增游戏规则在这里登记即可被前后端识别 */
export const RULESETS = {
  [CLASSIC_ID]: CLASSIC_RULESET,
  [PULP_ID]: PULP_RULESET,
};

/** 解析基础规则集 id；未知 id（含旧存档的 'kpcp'）一律回落到官方 7e */
export function resolveRuleset(id) {
  const key = typeof id === 'string' ? id : '';
  return Object.hasOwn(RULESETS, key) ? RULESETS[key] : CLASSIC_RULESET;
}

/** 是否官方 7e（引擎里少数需要「只在原版成立」的分支用它判断） */
export function isClassicRuleset(R) {
  return (R?.id || CLASSIC_ID) === CLASSIC_ID;
}

/** 该规则集是否启用了守秘人伴侣层 */
export function isKpcpLayer(R) {
  return Boolean(R?.layer?.kpcp);
}

/**
 * 角色卡实际使用的规则集：
 *   优先 ctx（后端已解析，可能是已叠加伴侣层的对象）
 *   其次 character.gameSystem + character.kpcp.enabled（前端/引擎自行解析）
 * 旧存档 gameSystem === 'kpcp' 视为「七版 + 伴侣层」。
 */
export function resolveCardRuleset(sheet) {
  const raw = sheet && typeof sheet === 'object' ? String(sheet.gameSystem || '') : '';
  const base = raw === KPCP_ID ? CLASSIC_RULESET : resolveRuleset(raw || CLASSIC_ID);
  const enabled = sheet?.kpcp?.enabled === true;
  const legacy = raw === KPCP_ID;
  return enabled || legacy ? applyKpcpLayer(base) : base;
}

/** 角色卡实际使用的规则集：优先 ctx（后端已解析），其次按存档字段组合。 */
export function rulesetOf(sheet, ctx = {}) {
  if (ctx?.ruleset && ctx.ruleset.id) return ctx.ruleset;
  return resolveCardRuleset(sheet);
}

/**
 * 「技能来源」：自定义职业模板/规则表单需要按归属规则取技能池。
 *   classic7e → 七版技能；pulp → 通克技能；kpcp → 伴侣修订技能（职业模板专用标记）
 */
export function skillSourceOf(gameSystem) {
  if (gameSystem === PULP_ID) return PULP_RULESET;
  if (gameSystem === KPCP_ID) return applyKpcpLayer(CLASSIC_RULESET);
  return CLASSIC_RULESET;
}

/** 规则层的产品信息（车卡页开关文案 / 审卡页卡片标题共用） */
export const KPCP_LAYER_INFO = {
  id: KPCP_ID,
  name: '守秘人伴侣',
  short: 'kpcp',
  tag: '可选规则层',
  desc: '在官方七版或通俗克苏鲁之上叠加伴侣修订：技能表、背景 8 栏、理智术语、106 件武器与 25 个职业包。',
  bullets: [
    '可在七版 / 通俗任一规则上开启，开启后必须选择一套伴侣房规',
    '技能表换为伴侣修订版（社交合并为「说服」、学识并入神秘学）',
    '职业列表追加 25 个职业包，可按「职业包 / 职业构筑」筛选',
    '六条房规由守秘人在审卡中心按规则集配置',
  ],
  toggles: KPCP_TOGGLES,
  toggleGroups: KPCP_TOGGLE_GROUPS,
  backgroundCount: KPCP_BACKGROUND_FIELDS.length,
  skillCount: KPCP_SKILLS.length,
  specSlots: KPCP_SPEC_SLOTS,
  packageCount: KPCP_PACKAGE_OCCUPATIONS.length,
};

/**
 * 新建角色卡首屏的「选择游戏规则」卡片数据。
 * `id` 直接写进 character.gameSystem（守秘人伴侣是开关，不在这里）。
 */
export const GAME_SYSTEMS = [
  {
    id: CLASSIC_ID,
    name: '克苏鲁的呼唤 第七版',
    short: 'coc7th',
    tag: '官方规则',
    desc: CLASSIC_RULESET.desc,
    bullets: CLASSIC_RULESET.bullets,
  },
  {
    id: PULP_ID,
    name: PULP_RULESET.name,
    short: PULP_RULESET.short,
    tag: PULP_RULESET.tag,
    desc: PULP_RULESET.desc,
    bullets: PULP_RULESET.bullets,
  },
];

export { PULP_RULESET };
export { KPCP_SKILL_BY_KEY };
export { applyKpcpLayer };
export { KPCP_SKILLS, KPCP_SPEC_SLOTS, KPCP_PACKAGE_OCCUPATIONS } from './kpcp.js';