/**
 * 游戏规则集注册表 —— 一套代码支撑多套规则。
 *
 * 为什么放在 shared/：规则集同时被前端（车卡器/详情页/打印）与后端（校验/审卡）使用，
 * 与 coc7e.js 一样必须只有一份定义，避免两边对「点数怎么算」产生分歧。
 *
 * 依赖方向（不可成环）：
 *   rulesets/index.js  ->  ../coc7e-reference.js（纯数据）
 *   rulesets/pulp.js   ->  ./pulp-data.js（生成物）+ ./index.js 里的常量？→ 不依赖，pulp.js 自包含
 *   coc7e.js           ->  ./rulesets/index.js
 * 因此 index.js 只能 import 数据模块，不能 import coc7e.js（否则与引擎互相引用）。
 *
 * 规则集对象的字段全部是**数据或纯函数**，引擎按需读取；缺省字段沿用官方 7e 行为，
 * 这样新增一套规则只需要补差异，不必复制整个引擎。
 */

import {
  SKILLS, SKILL_BY_KEY, SKILL_BY_NAME, SPEC_PRESETS, SPEC_OPTIONS, SPEC_SLOTS,
  SOCIAL_SKILLS, OCCUPATIONS, OCCUPATION_BY_ID,
} from '../coc7e-reference.js';
import { PULP_RULESET } from './pulp.js';

/** 官方 7e —— 默认规则集，旧存档没有 gameSystem 时一律回落到这里 */
export const CLASSIC_ID = 'classic7e';
/** 通俗克苏鲁 */
export const PULP_ID = 'pulp';

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
  short: '7e',
  tag: '官方原版',
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

/** 全部规则集：新增规则集在这里登记即可被前后端识别 */
export const RULESETS = {
  [CLASSIC_ID]: CLASSIC_RULESET,
  [PULP_ID]: PULP_RULESET,
};

/** 解析规则集 id；未知 id 一律回落到官方 7e（老存档兼容的兜底） */
export function resolveRuleset(id) {
  const key = typeof id === 'string' ? id : '';
  return Object.hasOwn(RULESETS, key) ? RULESETS[key] : CLASSIC_RULESET;
}

/** 是否官方 7e（引擎里少数需要「只在原版成立」的分支用它判断） */
export function isClassicRuleset(R) {
  return (R?.id || CLASSIC_ID) === CLASSIC_ID;
}

/** 角色卡实际使用的规则集：优先 ctx（后端已解析），其次存档字段 */
export function rulesetOf(sheet, ctx = {}) {
  if (ctx?.ruleset && ctx.ruleset.id) return ctx.ruleset;
  const id = sheet && typeof sheet === 'object' ? sheet.gameSystem : '';
  return resolveRuleset(id || CLASSIC_ID);
}

/**
 * 新建角色卡首屏的「选择游戏规则」卡片数据。
 * `id` 直接写进 character.gameSystem。
 */
export const GAME_SYSTEMS = [
  {
    id: CLASSIC_ID,
    name: '克苏鲁的呼唤 第七版',
    short: '7e',
    tag: '官方原版',
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