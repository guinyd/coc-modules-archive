#!/usr/bin/env node
/**
 * 通俗克苏鲁（Pulp Cthulhu）规则集自检（无框架，`node tools/check-pulp.mjs`）。
 *
 * 覆盖三件事：
 *   1. 生成物完整性 —— 技能 / 职业 / 原型 / 天赋 / 幸运价目表条数，以及职业技能串是否全部解析成技能键；
 *   2. 公式级差异（施工规划 §6 的 T1–T16）—— HP 除数、技能无上限、三池预算、原型白名单、信用区间等；
 *   3. 与官方 7e 的隔离 —— 同一份数据在 classic 规则下必须保持原行为。
 *
 * 只依赖 shared/ 纯函数，不需要启动服务端。
 */

import {
  blankSheet, blankSkills, computeSheet, validateSheet, auditSheet, CLASSIC_ID, CHARS,
} from '../shared/coc7e.js';
import { resolveRuleset, GAME_SYSTEMS, PULP_ID } from '../shared/rulesets/index.js';
import {
  PULP_CHARGEN, PULP_QUICK, PULP_CRIT, PULP_TONES, PULP_AUDIT_RULES,
} from '../shared/rulesets/pulp.js';
import {
  PULP_SKILLS, PULP_SKILL_BY_KEY, PULP_OCCUPATIONS, PULP_ARCHETYPES,
  PULP_TALENTS, PULP_LUCK_SPENDS, PULP_MADNESS_TALENTS, PULP_NPC_TALENTS,
  PULP_GADGETS, PULP_DATA_REPORT,
} from '../shared/rulesets/pulp-data.js';

let pass = 0; const fails = [];
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fails.push(name); console.log(`  ✗ ${name} ${extra}`); }
};
const section = (t) => console.log(`\n== ${t} ==`);

const P = resolveRuleset(PULP_ID);
const C = resolveRuleset(CLASSIC_ID);
const ids = (findings) => findings.map((f) => f.id);
const has = (findings, id) => ids(findings).includes(id);

/** 通俗克苏鲁底卡：默认选警官 + 冒险家，属性接近官方速建样板 */
const pulp = (over = {}) => ({
  ...blankSheet('u1', PULP_ID),
  name: '通克自检', occupationId: 'police_officer', archetypeId: 'adventurer', coreChar: 'DEX',
  age: 30, era: '1920s', gender: '男',
  chars: { STR: 50, CON: 60, SIZ: 60, DEX: 70, APP: 60, INT: 60, POW: 60, EDU: 60, Luck: 65 },
  ...over,
});
const skillRow = (sheet, key, custom = '') => (sheet.skills || []).find((s) => s.key === key && (s.custom || '') === custom);
const withSkill = (sheet, key, patch, custom = '') => ({
  ...sheet,
  skills: (sheet.skills || []).map((s) => (s.key === key && (s.custom || '') === custom ? { ...s, ...patch } : s)),
});

section('生成物完整性（tools/gen-pulp-data.mjs 产出）');
ok('技能 58 条（53 项 + 5 项灵能）', PULP_SKILLS.length === 58, `实际 ${PULP_SKILLS.length}`);
ok('专攻组 8 个（格斗 / 射击 / 艺术 / 语言 / 科学 / 学识 / 操纵 / 生存）',
  Object.keys(P.specSlots || {}).length === 8, JSON.stringify(Object.keys(P.specSlots || {})));
ok('职业 68 条', PULP_OCCUPATIONS.length === 68, `实际 ${PULP_OCCUPATIONS.length}`);
ok('原型 22 条', PULP_ARCHETYPES.length === 22, `实际 ${PULP_ARCHETYPES.length}`);
ok('天赋 40 条', PULP_TALENTS.length === 40, `实际 ${PULP_TALENTS.length}`);
ok('幸运价目 7 条', PULP_LUCK_SPENDS.length === 7);
ok('疯狂天赋 19 条 / NPC 天赋 17 条 / 小发明 9 件',
  PULP_MADNESS_TALENTS.length === 19 && PULP_NPC_TALENTS.length === 17 && PULP_GADGETS.length === 9);
ok('技能串全部解析成功（unknown 为空）', (PULP_DATA_REPORT.unknown || []).length === 0,
  JSON.stringify((PULP_DATA_REPORT.unknown || []).slice(0, 5)));
ok('每个职业的技能键都存在于技能表', PULP_OCCUPATIONS.every((o) => [...(o.keys || []), ...((o.choices || []).flat()), ...(o.freePool || [])]
  .every((k) => Boolean(PULP_SKILL_BY_KEY[k]))), '有职业引用了不存在的技能键');
ok('每个原型的奖励技能键都存在于技能表',
  PULP_ARCHETYPES.every((a) => (a.bonusKeys || []).every((k) => Boolean(PULP_SKILL_BY_KEY[k]))));
ok('职业点数公式全部为正（EDU 60 / DEX 60 / STR 60 / APP 60 / POW 60）', PULP_OCCUPATIONS.every((o) => {
  const eff = { EDU: 60, DEX: 60, STR: 60, APP: 60, POW: 60, INT: 60, CON: 60, SIZ: 60 };
  const sum = (o.pts?.terms || []).reduce((a, t) => a + eff[t.stat] * t.mult, 0);
  const best = Math.max(0, ...(o.pts?.max || []).map((t) => eff[t.stat] * t.mult));
  return sum + best > 0;
}));
ok('pulp 空卡技能槽 68 个（58 项 + 专攻组展开）', blankSheet('u1', PULP_ID).skills.length === 68,
  `实际 ${blankSheet('u1', PULP_ID).skills.length}`);
ok('建卡首屏列出多套规则（含通克）', GAME_SYSTEMS.length >= 2 && GAME_SYSTEMS.some((g) => g.id === PULP_ID));

section('T1 核心属性 (1D6+13)×5 = 70–95');
ok('掷骰常量正确', PULP_CHARGEN.archetype.coreCharRoll.dice === '1d6'
  && PULP_CHARGEN.archetype.coreCharRoll.add === 13 && PULP_CHARGEN.archetype.coreCharRoll.mul === 5);
ok('区间下限 70 / 上限 95', (1 + 13) * 5 === 70 && (6 + 13) * 5 === 95);
ok('核心属性 100 超上限会报 coreCharMax', has(
  auditSheet(pulp({ chars: { ...pulp().chars, DEX: 100 } }), {}, { ruleset: P }).findings, 'coreCharMax',
));

section('T2 / T3 HP 除数');
ok('T2 通俗：CON60 + SIZ60 → HP 24（不是 12）', computeSheet(pulp(), { ruleset: P }).hp === 24,
  `实际 ${computeSheet(pulp(), { ruleset: P }).hp}`);
ok('T2 对照：官方 7e 同一属性 → HP 12', computeSheet({ ...blankSheet(), chars: { CON: 60, SIZ: 60 } }).hp === 12);
ok('T3 低通俗档 → HP 12', computeSheet(pulp({ pulpTone: 'low' }), { ruleset: P }).hp === 12);
ok('档位表三档且 HP 除数 10 / 5 / 5', PULP_TONES.map((t) => t.hpDivisor).join() === '10,5,5');

section('T4 初始幸运 (2D6+6)×5 = 40–90');
ok('掷骰常量正确', PULP_CHARGEN.luckFormula.dice === '2d6' && PULP_CHARGEN.luckFormula.add === 6
  && PULP_CHARGEN.luckFormula.mul === 5);
ok('区间下限 40 / 上限 90', (1 + 1 + 6) * 5 === 40 && (6 + 6 + 6) * 5 === 90);

section('T5 / T6 职业点数公式（含「任选其一取高」）');
ok('T5 考古学家 EDU 70 → 280 点', computeSheet(pulp({
  occupationId: 'archaeologist', chars: { ...pulp().chars, EDU: 70 },
}), { ruleset: P }).budget.occupation === 280,
`实际 ${computeSheet(pulp({ occupationId: 'archaeologist', chars: { ...pulp().chars, EDU: 70 } }), { ruleset: P }).budget.occupation}`);
ok('T6 警官 EDU60 + max(DEX70, STR50) → 260 点', computeSheet(pulp({
  chars: { ...pulp().chars, EDU: 60, DEX: 70, STR: 50 },
}), { ruleset: P }).budget.occupation === 260,
`实际 ${computeSheet(pulp({ chars: { ...pulp().chars, EDU: 60, DEX: 70, STR: 50 } }), { ruleset: P }).budget.occupation}`);

section('T7 / T14 信用评级');
ok('T7 医生的信用评级区间是 30–80', P.occupationById.doctor.cr.join() === '30,80');
ok('信用评级落在区间内不报错', !has(auditSheet(withSkill(pulp(), 'credit', { occ: 20 }), {}, { ruleset: P }).findings, 'requireCreditInRange'));
ok('T14 警官区间 9–30，填 35 报信用越界',
  has(auditSheet(withSkill(pulp(), 'credit', { occ: 35 }), {}, { ruleset: P }).findings, 'requireCreditInRange'));

section('T8 兴趣点 = INT×2');
ok('INT 60 → 120 点', computeSheet(pulp(), { ruleset: P }).budget.interest === 120,
  `实际 ${computeSheet(pulp(), { ruleset: P }).budget.interest}`);
ok('与官方 7e 的 INT×2 一致', computeSheet({ ...blankSheet(), chars: { INT: 60 } }).budget.interest === 120);

section('T9 / T10 / T15 英雄奖励点（第三预算通道）');
const bonVivant = pulp({ archetypeId: 'bon_vivant', coreChar: 'SIZ' });
ok('原型固定发放 100 点奖励点', computeSheet(bonVivant, { ruleset: P }).budget.bonus === 100);
ok('未选原型时不发放奖励点', computeSheet(pulp({ archetypeId: '' }), { ruleset: P }).budget.bonus === 0);
ok('T9 奖励点 101 → bonusBudgetExceeded', has(
  auditSheet(withSkill(bonVivant, 'spotHidden', { bonus: 101 }), {}, { ruleset: P }).findings, 'bonusBudgetExceeded',
));
ok('T10 非白名单技能（攀爬）→ bonusNotAllowed', has(
  auditSheet(withSkill(bonVivant, 'climb', { bonus: 10 }), {}, { ruleset: P }).findings, 'bonusNotAllowed',
));
ok('白名单技能（侦察）可以投奖励点', !has(
  auditSheet(withSkill(bonVivant, 'spotHidden', { bonus: 10 }), {}, { ruleset: P }).findings, 'bonusNotAllowed',
));
ok('T15 本职 50 + 兴趣 30 + 奖励 20 = 100（三池叠加合法）', (() => {
  const sheet = withSkill(bonVivant, 'spotHidden', { occ: 50, interest: 30, bonus: 20 });
  const c = computeSheet(sheet, { ruleset: P });
  const row = c.skills.find((s) => s.key === 'spotHidden');
  const f = auditSheet(sheet, {}, { ruleset: P }).findings;
  return row.total === 25 + 100 && !has(f, 'forbidMixedPoints') && !has(f, 'bonusBudgetExceeded');
})(), (() => {
  const c = computeSheet(withSkill(bonVivant, 'spotHidden', { occ: 50, interest: 30, bonus: 20 }), { ruleset: P });
  return `total=${c.skills.find((s) => s.key === 'spotHidden').total}`;
})());

section('T11 / T12 技能上限与判定口径');
ok('T11 技能 110% 合法，半值 55、五值 22', (() => {
  const c = computeSheet(withSkill(pulp(), 'spotHidden', { occ: 85 }), { ruleset: P });
  const row = c.skills.find((s) => s.key === 'spotHidden');
  return row.total === 110 && row.half === 55 && row.fifth === 22;
})(), (() => {
  const c = computeSheet(withSkill(pulp(), 'spotHidden', { occ: 85 }), { ruleset: P });
  const row = c.skills.find((s) => s.key === 'spotHidden');
  return `total=${row.total} half=${row.half} fifth=${row.fifth}`;
})());
ok('T11 对照组：官方 7e 同一投法被截到 99', (() => {
  const baseCl = { ...blankSheet(), occupationId: 2, chars: { ...pulp().chars } };
  const sheet = { ...baseCl, skills: baseCl.skills.map((s) => (s.key === 'spotHidden' ? { ...s, interest: 85 } : s)) };
  return computeSheet(sheet).skills.find((s) => s.key === 'spotHidden').total === 99;
})());
ok('T11 技能 110 不再触发 skillCap 告警（无上限）',
  !has(auditSheet(withSkill(pulp(), 'spotHidden', { occ: 85 }), {}, { ruleset: P }).findings, 'skillCap'));
ok('T12 大成功只有 01、掷 100 只是普通失败', PULP_CRIT.crit === '01' && PULP_CRIT.fumble === null);
ok('T12 幸运调到 01 只算极限成功', PULP_CRIT.luckTo01IsExtreme === true);

section('T13 速建数值');
ok('8 项本职技能 = 80/70/70/60/60/50/50/40，合计 480',
  PULP_QUICK.occSkills.length === 8 && PULP_QUICK.occSkills.reduce((a, b) => a + b, 0) === 480);
ok('其余 7 项属性 = 80/70/60/60/50/50/40，核心属性 90',
  PULP_QUICK.others.length === 7 && PULP_QUICK.others.reduce((a, b) => a + b, 0) === 410
  && PULP_QUICK.coreValue === 90);
ok('非职业技能 5 项各 +20', PULP_QUICK.nonOccCount === 5 && PULP_QUICK.nonOccBonus === 20);

section('T16 原型与天赋校验');
ok('未选原型 → archetypeRequired', has(auditSheet(pulp({ archetypeId: '' }), {}, { ruleset: P }).findings, 'archetypeRequired'));
ok('未指定核心属性 → coreCharMissing', has(auditSheet(pulp({ coreChar: '' }), {}, { ruleset: P }).findings, 'coreCharMissing'));
ok('核心属性不在原型范围 → coreCharInvalid',
  has(auditSheet(pulp({ coreChar: 'POW' }), {}, { ruleset: P }).findings, 'coreCharInvalid'));
ok('天赋只有 1 项 → talentsCount', has(
  auditSheet(pulp({ talents: ['phys-01'] }), {}, { ruleset: P }).findings, 'talentsCount',
), JSON.stringify(ids(auditSheet(pulp({ talents: ['phys-01'] }), {}, { ruleset: P }).findings)));
ok('天赋 2 项合法', !has(auditSheet(pulp({ talents: PULP_TALENTS.slice(0, 2).map((t) => t.id) }), {}, { ruleset: P }).findings, 'talentsCount'));
ok('无情斗士强制「坚定不移」（ment-01）→ talentForced', (() => {
  const sheet = pulp({ archetypeId: 'ruthless', coreChar: 'INT', talents: ['phys-01', 'phys-02'] });
  return has(auditSheet(sheet, {}, { ruleset: P }).findings, 'talentForced');
})());
ok('无情斗士带上坚定不移后不再报 talentForced', (() => {
  const sheet = pulp({ archetypeId: 'ruthless', coreChar: 'INT', talents: ['ment-01', 'phys-01'] });
  return !has(auditSheet(sheet, {}, { ruleset: P }).findings, 'talentForced');
})());
ok('关键连接必须指向已填背景 → keyConnectionMissing',
  has(auditSheet(pulp({ keyConnection: '' }), {}, { ruleset: P }).findings, 'keyConnectionMissing'));

section('规则隔离（同一份数据在 7e 下不变）');
ok('classic 技能槽 64 个', blankSkills(C).length === 64);
ok('classic 技能上限 99', C.skillCap === 99);
ok('classic 预算只有职业 / 兴趣两池', (() => {
  const b = computeSheet({ ...blankSheet(), occupationId: 2, chars: { ...pulp().chars } }).budget;
  return b.occupation > 0 && b.interest === 120 && (b.bonus === 0 || b.bonus === undefined);
})());
ok('classic 不检查原型 / 关键连接', (() => {
  const f = auditSheet({ ...blankSheet(), occupationId: 2, chars: { ...pulp().chars } }, {}).findings;
  return !has(f, 'archetypeRequired') && !has(f, 'keyConnectionMissing');
})());
ok('游戏规则 id 不会被写错（pulp / classic7e）', P.id === PULP_ID && C.id === CLASSIC_ID);
ok('pulp 审卡默认启用 6 栏背景下限', PULP_AUDIT_RULES.backgroundMinFields === 6);

section('v10.10 年龄规则关闭与通克基线');
ok('通克规则集声明 ageAdjust 关闭', P.chargen?.ageAdjust?.enabled === false);
ok('派生值摘要标记 ageRulesOff', computeSheet(pulp({ age: 90 }), { ruleset: P }).ruleset.ageRulesOff === true);
ok('通克完全不套年龄补正（age 90 与 age 25 属性相同）', (() => {
  const a = computeSheet(pulp({ age: 25 }), { ruleset: P });
  const b = computeSheet(pulp({ age: 90 }), { ruleset: P });
  return CHARS.every((k) => a.eff[k] === b.eff[k]);
})());
ok('官方 7e 仍然套年龄补正（age 80 的 STR 低于 age 25）', (() => {
  const base = { ...blankSheet(), occupationId: 2, gameSystem: CLASSIC_ID, chars: { ...pulp().chars } };
  const a = computeSheet({ ...base, age: 25, applyAgeAdjust: true });
  const b = computeSheet({ ...base, age: 80, applyAgeAdjust: true });
  return b.eff.STR < a.eff.STR;
})());
ok('通克车卡只保留掷骰一种方式（不提供速建入口）',
  Array.isArray(P.chargen?.methods) && P.chargen.methods.length === 1 && P.chargen.methods[0].id === 'roll');
ok('通克审卡基线自带原型 / 天赋 / 奖励点 / 关键连接', (() => {
  const r = P.auditRules || {};
  return r.requireArchetype === true && r.talentsCount === 2 && r.bonusPoints === 100
    && r.bonusWhitelist === true && r.requireKeyConnection === true;
})());
ok('官方 7e 没有通克专属规则项', (() => {
  const r = C.auditRules || {};
  return !r.requireArchetype && !r.bonusWhitelist && !r.requireKeyConnection;
})());

console.log(`\n================ 通克自检：${pass} 通过 / ${fails.length} 失败 ================`);
if (fails.length) { console.log('失败项：\n - ' + fails.join('\n - ')); process.exit(1); }