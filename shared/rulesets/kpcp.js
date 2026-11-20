// 守秘人伴侣（Keeper's Companion, kpcp）—— **规则层**，不是独立游戏规则。
//
// 设计（v10.13）：
//   角色卡仍然属于官方七版或通俗克苏鲁（character.gameSystem = classic7e | pulp）；
//   开启 `character.kpcp.enabled` 后，在基础规则之上叠加本文件描述的一层修订：
//     · 技能表换成伴侣版修订表（社交合并为「说服」、学识并入神秘学、宗教/安抚/驾驶拆分……）
//     · 背景从 10 栏换成 8 栏
//     · 理智术语换成「震骇 / 异变 / 永失 / 妄想」
//     · 职业列表在原有职业之外追加 25 个职业包（id 前缀 `kpcp:`，避免与 pulp 职业 id 冲突）
//     · 武器表换成伴侣版 106 件
//   六条可选房规（KPCP_TOGGLES）由守秘人在「审卡中心 → 审卡规则」里按规则集配置，
//   引擎通过 ctx.kpcpRules 读取；旧卡随卡保存的 sheet.kpcp.toggles 只作回退。
//
// 依赖方向：本文件只 import 纯数据（kpcp-data.js），不 import coc7e.js / index.js，避免成环。

import {
  KPCP_SKILLS,
  KPCP_SKILL_BY_KEY,
  KPCP_SKILL_BY_NAME,
  KPCP_SPEC_SLOTS,
  KPCP_SPEC_PRESETS,
  KPCP_SPEC_OPTIONS,
  KPCP_LANGUAGES,
  KPCP_RELIGIONS,
  KPCP_RIDES,
  KPCP_OCCUPATIONS,
  KPCP_OCCUPATION_BY_ID,
  KPCP_WEAPONS,
  KPCP_WEAPON_BY_NAME,
  KPCP_TERMS,
} from './kpcp-data.js';

export const KPCP_ID = 'kpcp';

/** 伴侣版技能/职业/武器数据原样再导出，供规则注册表与自检脚本按「技能来源」取用 */
export {
  KPCP_SKILLS, KPCP_SKILL_BY_KEY, KPCP_SKILL_BY_NAME,
  KPCP_SPEC_SLOTS, KPCP_SPEC_PRESETS, KPCP_SPEC_OPTIONS,
  KPCP_LANGUAGES, KPCP_RELIGIONS, KPCP_RIDES,
  KPCP_OCCUPATIONS, KPCP_OCCUPATION_BY_ID,
  KPCP_WEAPONS, KPCP_WEAPON_BY_NAME, KPCP_TERMS,
} from './kpcp-data.js';

/** 伴侣版属性生成（2D6+5 后 ×5、八项自由分配）。作为「车卡提示」保留，不覆盖基础规则的公式。 */
export const KPCP_ROLL = { dice: '2d6', add: 5, mul: 5 };

/** 伴侣版固定结构（开启即生效，不可关） */
export const KPCP_STRUCTURE = {
  skillCount: KPCP_SKILLS.length,
  specGroups: Object.keys(KPCP_SPEC_SLOTS),
  backgroundCount: 8,
  weaponCount: KPCP_WEAPONS.length,
  packageCount: KPCP_OCCUPATIONS.length,
  note: '技能表、背景 8 栏、理智术语、武器表与职业包属于伴侣版的内容修订，开启规则层即生效。',
};

/* ---------------- 六条可选房规 ---------------- */

export const KPCP_TOGGLES = [
  {
    id: 'derivedBases',
    label: '由属性推导技能基础值',
    type: 'boolean',
    def: false,
    group: '车卡',
    hint: '按伴侣版表 A 计算技能基础值（整组统一，遇到「或」取较高者）；未列入的技能保持原基础值。',
    bookRef: 'p.23–24',
  },
  {
    id: 'interestEduInt',
    label: '兴趣点 = 教育 + 智力',
    type: 'boolean',
    def: true,
    group: '车卡',
    hint: '关闭后回到七版的「兴趣点 = 智力 × 2」；通俗克苏鲁同样适用。',
    bookRef: 'p.13',
  },
  {
    id: 'specFloor',
    label: '专精下限（同类专精自动补到最高者的一半）',
    type: 'boolean',
    def: true,
    group: '车卡',
    hint: '同一统称技能下，各专精的基础值自动取为该组最高专精的一半，且不低于默认基础值——自动计算，不消耗点数。',
    bookRef: 'p.24',
  },
  {
    id: 'packageMove',
    label: '职业包可搬点（本职技能默认锁定）',
    type: 'boolean',
    def: false,
    group: '车卡',
    hint: '使用职业包时本职点数默认锁定；开启后允许在包内技能之间自由搬运，任何技能不得低于基础值。',
    bookRef: 'p.11',
  },
  {
    id: 'secondOwnLanguage',
    label: '第二门母语（花 10 点，起始 = 教育）',
    type: 'boolean',
    def: true,
    group: '车卡',
    hint: '每 10 点兴趣可增加一门母语，成功率直接等于教育；更多语言请用「外语」购买。',
    bookRef: 'p.15–20',
  },
  {
    id: 'movRule',
    label: '移动力按伴侣版（同值不加）',
    type: 'boolean',
    def: true,
    group: '战斗',
    hint: '伴侣版 MOV 初始 7，力量/敏捷严格大于体型才 +1；关闭则沿用基础规则（七版 ≥ 即 +1、初始 8）。',
    bookRef: 'p.12',
  },
];

export const KPCP_TOGGLE_IDS = KPCP_TOGGLES.map((t) => t.id);
export const KPCP_TOGGLE_BY_ID = Object.fromEntries(KPCP_TOGGLES.map((t) => [t.id, t]));
export const KPCP_TOGGLE_GROUPS = ['车卡', '战斗'];
export const KPCP_DEFAULT_TOGGLES = Object.fromEntries(KPCP_TOGGLES.map((t) => [t.id, t.def]));

/** 规则集里的伴侣房规：{ toggles, customRules } */
export const KPCP_DEFAULT_RULES = { toggles: { ...KPCP_DEFAULT_TOGGLES }, customRules: [] };

export function normalizeKpcpRules(raw) {
  const out = { toggles: { ...KPCP_DEFAULT_TOGGLES }, customRules: [] };
  const t = raw?.toggles;
  if (t && typeof t === 'object') {
    for (const id of KPCP_TOGGLE_IDS) if (typeof t[id] === 'boolean') out.toggles[id] = t[id];
  }
  const list = Array.isArray(raw?.customRules) ? raw.customRules : [];
  for (const item of list.slice(0, 30)) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.name || '').trim().slice(0, 40);
    if (!name) continue;
    out.customRules.push({
      id: String(item.id || `kr-${out.customRules.length + 1}`).slice(0, 40),
      name,
      note: String(item.note || '').trim().slice(0, 200),
      enabled: item.enabled !== false,
    });
  }
  return out;
}

/** 生效中的开关：规则集优先（ctx.kpcpRules / ctx.kpcp），旧卡 sheet.kpcp.toggles 回退。 */
export function kpcpToggles(sheet, ctx = null) {
  const fromRules = ctx?.kpcpRules || ctx?.kpcp || null;
  const raw = (fromRules && fromRules.toggles) || sheet?.kpcp?.toggles || {};
  const out = { ...KPCP_DEFAULT_TOGGLES };
  for (const id of KPCP_TOGGLE_IDS) {
    if (typeof raw[id] === 'boolean') out[id] = raw[id];
  }
  return out;
}

export function kpcpToggle(sheet, id, ctx = null) {
  return kpcpToggles(sheet, ctx)[id];
}

export function kpcpCustomRules(sheet, ctx = null) {
  const fromRules = ctx?.kpcpRules || ctx?.kpcp || null;
  const list = (fromRules && Array.isArray(fromRules.customRules) && fromRules.customRules) || sheet?.kpcp?.customRules || [];
  return list.filter((r) => r && r.enabled !== false).map((r) => ({ id: r.id, name: r.name, note: r.note || '' }));
}

/** 房规摘要（规则集页与详情页共用）：[{id,label,on}] + 自定义条目 */
export function kpcpRuleSummary(rules) {
  const merged = normalizeKpcpRules(rules);
  const items = KPCP_TOGGLES.map((t) => ({ id: t.id, label: t.label, on: merged.toggles[t.id] }));
  return { items, enabledCount: items.filter((x) => x.on).length, customRules: merged.customRules };
}

/* ---------------- 属性推导基础值（表 A） ---------------- */

// key → [[属性, 除数], ...]，多项表示「或，取较高者」
export const KPCP_DERIVED_BASE = {
  accounting: [['EDU', 10]],
  climb: [['DEX', 2], ['STR', 2]],
  dodge: [['DEX', 2]],
  driveAuto: [['DEX', 2]],
  appraise: [['EDU', 10]],
  elecRepair: [['EDU', 5]],
  firstAid: [['EDU', 2]],
  law: [['EDU', 10]],
  library: [['EDU', 2]],
  listen: [['INT', 2]],
  persuade: [['APP', 5]],
  psychology: [['INT', 5]],
  reassure: [['APP', 5]],
  mechRepair: [['INT', 5]],
  naturalWorld: [['INT', 5]],
  navigate: [['INT', 5]],
  occult: [['EDU', 10]],
  sleightOfHand: [['DEX', 5]],
  spotHidden: [['INT', 2]],
  stealth: [['DEX', 2]],
  survival: [['EDU', 5]],
  swim: [['DEX', 2]],
  throw: [['DEX', 2]],
  track: [['INT', 5]],
  jump: [['DEX', 2]],
  computer: [['EDU', 10]],
  disguise: [['INT', 10]],
  ownLanguage: [['EDU', 1]],
  religion: [['EDU', 5]],
  // 专攻组：按子项标签
  art: {
    表演: [['INT', 10], ['POW', 10]],
    估价: [['EDU', 10]],
    乔装: [['INT', 10]],
    摄影: [['DEX', 10], ['EDU', 10]],
    美术: [['DEX', 10]],
    伪造: [['DEX', 10], ['EDU', 10]],
  },
  fighting: {
    斗殴: [['DEX', 2], ['STR', 2]],
    斧: [['STR', 5]],
    链锯: [['STR', 5]],
    连枷: [['DEX', 5]],
    绞索: [['DEX', 5]],
    长矛: [['STR', 2]],
    剑: [['DEX', 2]],
    鞭: [['DEX', 5]],
  },
  firearms: {
    弓: [['DEX', 5]],
    手枪: [['DEX', 2]],
    '步枪/霰弹枪': [['DEX', 2]],
    火焰喷射器: [['DEX', 5]],
    重型武器: [['STR', 5]],
    机枪: [['STR', 5]],
  },
  ride: { 马: [['DEX', 10]] },
};

const pickBest = (eff, list) => {
  let best;
  for (const [attr, div] of list) {
    const v = Math.floor((Number(eff?.[attr]) || 0) / Math.max(1, Number(div) || 1));
    if (best === undefined || v > best) best = v;
  }
  return best;
};

/** 伴侣版「由属性推导基础值」：开关关闭或未列入时返回 undefined（引擎回落常规基础值）。 */
export function kpcpBaseFor(key, custom, eff, sheet, ctx = null) {
  if (!kpcpToggle(sheet, 'derivedBases', ctx)) return undefined;
  const entry = KPCP_DERIVED_BASE[key];
  if (!entry) return undefined;
  if (Array.isArray(entry)) return pickBest(eff, entry);
  const label = String(custom || '').trim();
  if (!label) return undefined;
  const forLabel = entry[label];
  if (!forLabel) return undefined;
  return pickBest(eff, forLabel);
}

/* ---------------- 移动力 ---------------- */

export function kpcpMovement(eff, sheet, { agePenalty = 0, armorPenalty = 0, waivePenalty = false } = {}) {
  const s = Number(eff?.STR) || 0;
  const d = Number(eff?.DEX) || 0;
  const z = Number(eff?.SIZ) || 0;
  let mov = 7;
  if (s > z) mov += 1;
  if (d > z) mov += 1;
  const penalty = waivePenalty ? 0 : Math.max(0, Number(agePenalty) || 0);
  const armor = Math.max(0, Math.min(10, Number(armorPenalty) || 0));
  return { mov: Math.max(1, mov - penalty - armor), agePenalty: penalty };
}

/* ---------------- 术语 ---------------- */

export const KPCP_TERMS_FULL = {
  ...KPCP_TERMS,
  temporaryLong: '震骇（临时性疯狂）',
  indefiniteLong: '异变（不定性疯狂）',
  permanentLong: '永失（永久性疯狂）',
  madnessLong: '妄想（意志归零）',
};

const CLASSIC_TERMS = {
  temporary: '临时性疯狂',
  indefinite: '不定性疯狂',
  permanent: '永久性疯狂',
  madness: '永久性疯狂',
  temporaryLong: '临时性疯狂',
  indefiniteLong: '不定性疯狂',
  permanentLong: '永久性疯狂',
  madnessLong: '永久性疯狂',
};

export function termsOf(R) {
  return R?.layer?.kpcp ? KPCP_TERMS_FULL : CLASSIC_TERMS;
}

/* ---------------- 背景 8 项 ---------------- */

export const KPCP_BACKGROUND_FIELDS = [
  ['description', '描述'],
  ['personality', '性格'],
  ['significantPeoplePlaces', '重要之人与之地'],
  ['treasuredItems', '重要物品'],
  ['woundsScars', '伤势与疤痕'],
  ['fears', '恐惧'],
  ['tomesSpellsArtifacts', '法术、典籍与神器'],
  ['encountersStrangeEntities', '遭遇奇异实体'],
];

export const KPCP_BACKGROUND_START = 4;

/* ---------------- 武器 ---------------- */

export const KPCP_WEAPON_TABLES = [
  { table: 7, name: '近战武器' },
  { table: 8, name: '手枪' },
  { table: 9, name: '步枪' },
  { table: 10, name: '霰弹枪' },
  { table: 11, name: '突击步枪' },
  { table: 12, name: '冲锋枪' },
  { table: 13, name: '机枪' },
  { table: 14, name: '爆炸物 / 重武器 / 其他' },
];

/* ---------------- 审卡规则（叠加在基础规则之上） ---------------- */

export const KPCP_AUDIT_RULES = {
  // 只放「真会被 auditSheet 消费」的项；专精下限（specFloor）与职业点总和是伴侣层
  // 自己的开关（KPCP_TOGGLES.specFloor / 职业包点数），不走审卡规则表。
  backgroundMinFields: KPCP_BACKGROUND_START,
};

/* ---------------- 旧职业 → 伴侣修订表的路由 ---------------- */

/**
 * 七版 / 通俗的旧技能键在伴侣修订表里已经合并或改名，选职业时自动路由：
 *   取悦 / 话术 / 恐吓 → 说服；学识 → 神秘学；乔装 / 估价 → 艺术/手艺（专精）；
 *   人类学 → 科学（专精）；汽车驾驶 → 汽车驾驶；驾驶 → 飞行器 + 船艇（展开两项）
 */
export const KPCP_LEGACY_SKILLS = {
  charm: [{ key: 'persuade' }],
  fastTalk: [{ key: 'persuade' }],
  intimidate: [{ key: 'persuade' }],
  lore: [{ key: 'occult' }],
  disguise: [{ key: 'art', label: '乔装' }],
  appraise: [{ key: 'art', label: '估价' }],
  anthropology: [{ key: 'science', label: '人类学' }],
  pilot: [{ key: 'pilotAircraft' }, { key: 'pilotBoat' }],
  drive: [{ key: 'driveAuto' }],
};

/** 单个旧技能键 → 伴侣版 [{key,label?}]（已经在修订表里的原样返回） */
export function mapLegacySkill(key) {
  if (Object.hasOwn(KPCP_SKILL_BY_KEY, key)) return [{ key }];
  return KPCP_LEGACY_SKILLS[key] || [{ key }];
}

const mergeUnique = (list) => {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const id = `${item.key}#${item.label || ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
};

/** 把一条旧职业按伴侣修订表重写：键映射、二选一组合并去重、专精预设合并。 */
const LEGACY_SOCIAL_KEYS = new Set(['charm', 'fastTalk', 'intimidate', 'persuade']);

export function mapOccupationForKpcp(occ) {
  if (!occ) return occ;
  const expand = (key) => mapLegacySkill(key);
  // 同一个技能可能由多个旧键折叠而来（如 艺术+乔装 → art），按 key 去重但保留标签进预设
  const keys = [...new Set(mergeUnique((occ.keys || []).flatMap(expand)).map((x) => x.key))];
  const choices = [];
  // 「任选 N 项社交技能」在伴侣版里合并成固定本职「说服」，原来的社交名额并入任选特长。
  let socialMerged = Number(occ.social) || 0;
  for (const group of occ.choices || []) {
    const socialGroup = group.length > 0 && group.every((k) => LEGACY_SOCIAL_KEYS.has(String(k)));
    if (socialGroup) {
      socialMerged += 1;
      continue;
    }
    const merged = mergeUnique(group.flatMap(expand)).map((x) => x.key);
    const socialPicks = merged.filter((k) => LEGACY_SOCIAL_KEYS.has(k));
    if (socialPicks.length === merged.length && merged.length > 0) {
      socialMerged += 1;
      continue;
    }
    if (merged.length === 1) {
      if (!keys.includes(merged[0])) keys.push(merged[0]);
    } else if (merged.length > 1) {
      choices.push(merged);
    }
  }
  if (socialMerged > 0 && !keys.includes('persuade')) keys.push('persuade');
  const presets = {};
  for (const [group, labels] of Object.entries(occ.presets || {})) {
    presets[group] = [...labels];
  }
  // 旧职业里以「艺术/手艺(乔装)」这类标签出现的条目，把标签补进预设，保证槽位有默认方向
  for (const item of mergeUnique((occ.keys || []).flatMap(expand))) {
    if (item.label) {
      presets[item.key] = presets[item.key] || [];
      if (!presets[item.key].includes(item.label)) presets[item.key].push(item.label);
    }
  }
  return {
    ...occ,
    keys,
    choices,
    presets,
    social: 0,
    free: (Number(occ.free) || 0) + socialMerged,
    socialMerged,
  };
}

/* ---------------- 职业包 ---------------- */

/** 伴侣版 25 个职业包，id 统一加 `kpcp:` 前缀，避免与七版数字 id / 通克字符串 id 撞车。 */
export const KPCP_PACKAGE_OCCUPATIONS = KPCP_OCCUPATIONS.map((o) => ({
  ...o,
  id: `kpcp:${o.id}`,
  kind: 'package',
  package: true,
  nameEn: o.nameEn || '',
}));

export const KPCP_PACKAGE_BY_ID = Object.fromEntries(KPCP_PACKAGE_OCCUPATIONS.map((o) => [o.id, o]));

/* ---------------- 组合成「基础规则 + 伴侣层」的规则集对象 ---------------- */

/** 伴侣层标记：引擎用 `R.layer.kpcp` 判断是否启用（而不是看 R.id）。 */
export const KPCP_LAYER = { kpcp: true };

function layered(base) {
  if (!base) return base;
  const skills = KPCP_SKILLS.map((s) => (
    s.key === 'occult'
      ? { ...s, flags: [...new Set([...(s.flags || []), 'named'])] }
      : s
  ));
  const skillByKey = Object.fromEntries(skills.map((s) => [s.key, s]));
  const skillByName = Object.fromEntries(skills.map((s) => [s.name, s]));
  const baseOcc = (base.occupations || []).map(mapOccupationForKpcp);
  const occupations = [...baseOcc, ...KPCP_PACKAGE_OCCUPATIONS];
  const occupationById = Object.fromEntries(occupations.map((o) => [o.id, o]));
  const togglesInterest = (eff, sheet, ctx) => (
    kpcpToggle(sheet, 'interestEduInt', ctx) ? (Number(eff?.EDU) || 0) + (Number(eff?.INT) || 0) : null
  );
  return {
    ...base,
    // id 保持基础规则 id：引擎里 isPulp / isClassic 这类判断继续成立
    id: base.id,
    layer: KPCP_LAYER,
    kpcpBaseId: base.id,
    name: `${base.name} · 守秘人伴侣`,
    short: `${base.short}+kpcp`,
    tag: '伴侣扩展',
    desc: '在基础规则之上叠加《守秘人伴侣》修订：技能表、背景 8 栏、理智术语、106 件武器与 25 个职业包；六条房规由守秘人按规则集开关。',
    bullets: [
      '技能表改为伴侣修订版（社交合并为「说服」、学识并入神秘学、新增宗教与安抚）',
      '背景 8 栏、理智术语「震骇 / 异变 / 永失 / 妄想」、106 件武器',
      '职业列表追加 25 个职业包，可按「职业包 / 职业构筑」筛选',
      '六条房规：推导基础值、兴趣 EDU+INT、专精下限、职业包搬点、第二母语、移动力',
    ],
    skills,
    skillByKey,
    skillByName,
    specSlots: KPCP_SPEC_SLOTS,
    specPresets: KPCP_SPEC_PRESETS,
    specOptions: KPCP_SPEC_OPTIONS,
    defaultSpecs: { 'fighting#0': '斗殴', 'firearms#0': '手枪' },
    socialSkills: ['persuade'],
    occupations,
    occupationById,
    backgroundFields: KPCP_BACKGROUND_FIELDS,
    backgroundCount: KPCP_BACKGROUND_FIELDS.length,
    chargen: base.chargen,
    interest: (eff, sheet, ctx) => {
      const v = togglesInterest(eff, sheet, ctx);
      return v === null ? (typeof base.interest === 'function' ? base.interest(eff, sheet, ctx) : (Number(eff?.INT) || 0) * 2) : v;
    },
    movement: (eff, sheet, extra = {}) => {
      if (!kpcpToggle(sheet, 'movRule', extra.ctx)) {
        return typeof base.movement === 'function' ? base.movement(eff, sheet, extra) : null;
      }
      return kpcpMovement(eff, sheet, extra);
    },
    income: base.income,
    creditMode: base.creditMode,
    skillCap: base.skillCap,
    hpDivisor: base.hpDivisor,
    bonusPoints: base.bonusPoints,
    baseFor: kpcpBaseFor,
    auditRules: { ...(base.auditRules || {}), ...KPCP_AUDIT_RULES },
    weapons: KPCP_WEAPONS,
    weaponByName: KPCP_WEAPON_BY_NAME,
    terms: KPCP_TERMS_FULL,
    languages: KPCP_LANGUAGES,
    religions: KPCP_RELIGIONS,
    rides: KPCP_RIDES,
    toggles: KPCP_TOGGLES,
    // 伴侣层不影响的部分继续沿用基础规则
    archetypes: base.archetypes,
    talents: base.talents,
    luckSpends: base.luckSpends,
    healing: base.healing,
    crit: base.crit,
  };
}

const cache = new Map();

/** 给基础规则集套上伴侣层（幂等、带缓存）。 */
export function applyKpcpLayer(base) {
  if (!base) return base;
  if (base.layer?.kpcp) return base;
  const baseId = base.id || 'classic7e';
  if (!cache.has(baseId)) cache.set(baseId, layered(base));
  return cache.get(baseId);
}

/** 旧版独立 kpcp 规则集对象：仅供旧存档迁移与自检脚本使用，不再出现在 GAME_SYSTEMS 里。 */
export const KPCP_SOLO_RULESET = layered({
  id: 'classic7e',
  name: '克苏鲁的呼唤 第七版',
  short: 'coc7th',
  occupations: [],
});