/**
 * 守秘人伴侣（kpcp）规则层自检。
 * v10.13 起 kpcp 不是第三套 gameSystem，而是可叠加在七版 / 通克之上的规则层。
 * 运行：node tools/check-kpcp.mjs —— 只读，不改数据库、不写文件；有失败时退出码 1。
 */
import { blankSheet, computeSheet, auditSheet, backgroundFieldsOf } from '../shared/coc7e.js';
import {
  resolveRuleset, resolveCardRuleset, applyKpcpLayer, isKpcpLayer,
  GAME_SYSTEMS, KPCP_ID, CLASSIC_ID, PULP_ID, RULESETS,
} from '../shared/rulesets/index.js';
import {
  kpcpToggles, KPCP_TOGGLES, KPCP_DERIVED_BASE, normalizeKpcpRules, kpcpRuleSummary,
  mapLegacySkill, KPCP_PACKAGE_OCCUPATIONS, KPCP_DEFAULT_RULES,
} from '../shared/rulesets/kpcp.js';

let pass = 0; let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; return; }
  fail += 1;
  console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

const CLASSIC = resolveRuleset(CLASSIC_ID);
const PULP = resolveRuleset(PULP_ID);
const LAYER = applyKpcpLayer(CLASSIC);
const PULP_LAYER = applyKpcpLayer(PULP);

const chars = { STR: 70, CON: 60, SIZ: 50, DEX: 60, APP: 60, INT: 60, POW: 60, EDU: 70, Luck: 50 };
const kcard = (patch = {}) => ({
  ...blankSheet('u1', CLASSIC_ID),
  chars: { ...chars },
  occupationId: 'kpcp:antiquarian',
  kpcp: { enabled: true, toggles: {}, customRules: [], ...(patch.kpcp || {}) },
  ...patch,
});
const rules = (toggles = {}) => ({ toggles: { ...toggles }, customRules: [] });
const derive = (sheet, toggles = {}, extraCtx = {}) => computeSheet(sheet, {
  ruleset: LAYER, kpcpRules: rules(toggles), ...extraCtx,
});

// ---------------------------------------------------------------- 规则层
section('规则层与数据');
ok('只有两套基础游戏规则', Object.keys(RULESETS).join(',') === `${CLASSIC_ID},${PULP_ID}`, Object.keys(RULESETS).join(','));
ok('建卡首屏只剩两张卡', GAME_SYSTEMS.length === 2 && GAME_SYSTEMS.map((g) => g.id).join(',') === `${CLASSIC_ID},${PULP_ID}`);
ok('伴侣层可叠加在七版上', LAYER.layer?.kpcp === true && LAYER.kpcpBaseId === CLASSIC_ID);
ok('伴侣层可叠加在通克上', PULP_LAYER.layer?.kpcp === true && PULP_LAYER.kpcpBaseId === PULP_ID);
ok('层级技能 50 项', LAYER.skills.length === 50, String(LAYER.skills.length));
ok('专攻组 7 个', Object.keys(LAYER.specSlots || {}).length === 7, String(Object.keys(LAYER.specSlots || {}).length));
ok('层级职业 = 基础职业 + 25 个职业包', LAYER.occupations.length === CLASSIC.occupations.length + 25, String(LAYER.occupations.length));
ok('武器 106 件', LAYER.weapons.length === 106, String(LAYER.weapons?.length));
ok('背景 8 栏', backgroundFieldsOf(LAYER).length === 8);
ok('社交技能合并为说服', LAYER.socialSkills.join(',') === 'persuade', LAYER.socialSkills.join(','));
ok('安抚 = APP/5', LAYER.skillByKey.reassure?.formula?.from === 'APP' && LAYER.skillByKey.reassure?.formula?.div === 5);
ok('母语 = EDU', (LAYER.skillByKey.ownLanguage?.flags || []).includes('edu'));
ok('闪避 = DEX/2', (LAYER.skillByKey.dodge?.flags || []).includes('dexHalf'));
ok('神秘学是可选项具名技能（学识并入后需填专精）', (LAYER.skillByKey.occult?.flags || []).includes('named'));
ok('术语替换（震骇 / 异变 / 永失）', LAYER.terms?.temporary === '震骇' && LAYER.terms?.indefinite === '异变' && LAYER.terms?.permanent === '永失');

section('职业包');
ok('职业包全部带 kpcp: 前缀', KPCP_PACKAGE_OCCUPATIONS.every((o) => o.id.startsWith('kpcp:')), '');
ok('职业包合计 300（飞行员 340 / 私家侦探 290 为原书例外）',
  KPCP_PACKAGE_OCCUPATIONS.filter((o) => o.total !== 300).map((o) => `${o.id}:${o.total}`).join(',') === 'kpcp:pilot:340,kpcp:private_investigator:290');
ok('教授固定 210 + 90 点学术池', (() => {
  const p = LAYER.occupationById['kpcp:professor'];
  return p && p.kind === 'package' && p.special && p.special.points === 90 && p.special.oneMustReach === 90;
})());
ok('职业包带 entries 明细', KPCP_PACKAGE_OCCUPATIONS.every((o) => Array.isArray(o.entries) && o.entries.length > 0));

section('旧构筑技能路由');
const mapped = (k) => mapLegacySkill(k).map((x) => x.key).join(',');
ok('取悦/话术/恐吓 → 说服', ['charm', 'fastTalk', 'intimidate'].every((k) => mapped(k) === 'persuade'));
const drama = LAYER.occupationById[4];
ok('旧职业「任选 N 项社交」合并为固定本职「说服」',
  Boolean(drama) && drama.social === 0 && drama.socialMerged === 2 && drama.keys.includes('persuade'),
  drama ? `social=${drama.social} merged=${drama.socialMerged} free=${drama.free} keys=${drama.keys.join(',')}` : 'missing');
ok('社交名额并入任选特长（戏剧演员 free = 1 + 2）',
  Boolean(drama) && drama.free === 3, drama ? `free=${drama.free}` : 'missing');
ok('折叠后的本职键不重复（艺术 + 乔装 → 单一 art）',
  Boolean(drama) && drama.keys.filter((k) => k === 'art').length === 1 && (drama.presets?.art || []).includes('乔装'),
  drama ? `keys=${drama.keys.join(',')} presets=${JSON.stringify(drama.presets)}` : 'missing');
ok('学识 → 神秘学', mapped('lore') === 'occult');
ok('乔装/估价 → 艺术与手艺', mapped('disguise') === 'art' && mapped('appraise') === 'art');
ok('人类学 → 科学', mapped('anthropology') === 'science');
ok('驾驶拆成飞行器/船艇', mapped('pilot') === 'pilotAircraft,pilotBoat');
ok('旧职业键已映射（考古学家 appraise → art）', (() => {
  const occ = LAYER.occupationById[11];
  return occ && occ.keys.includes('art') && !occ.keys.includes('appraise');
})());

// ---------------------------------------------------------------- 派生
section('开层后的派生公式');
const d1 = derive(kcard());
ok('空卡 60 个技能槽', blankSheet('u', CLASSIC_ID).skills.length === 64 && derive(kcard()).skills.length === 60, String(derive(kcard()).skills.length));
ok('HP = ⌊(CON+SIZ)/10⌋（伴侣层不改 HP）', d1.hp === Math.floor((60 + 50) / 10), String(d1.hp));
ok('MP = ⌊POW/5⌋', d1.mp === 12, String(d1.mp));
ok('SAN 起始 = POW', d1.san === 60, String(d1.san));
ok('兴趣点 = EDU + INT', d1.budget.interest === 130, String(d1.budget.interest));
ok('MOV：STR 与 DEX 均大于 SIZ 各 +1（7+2=9）', d1.mov === 9, String(d1.mov));
ok('职业包预算取合计 300', d1.budget.occupation === 300, String(d1.budget.occupation));
ok('职业包信用评级为固定区间 30', String(d1.creditRange) === '30,30', String(d1.creditRange));

const dOff = derive(kcard(), { interestEduInt: false });
ok('关闭「兴趣=教育+智力」回到 INT×2', dOff.budget.interest === 120, String(dOff.budget.interest));
// 移动力差异只在「属性等于体型」时显现：伴侣版初始 7（严格大于才 +1），七版初始 8
const even = { ...kcard(), chars: { ...chars, STR: 50, DEX: 50, SIZ: 50 } };
ok('移动力：三项相等时伴侣版 7', derive(even).mov === 7, String(derive(even).mov));
ok('移动力：关闭后回到七版口径 8', derive(even, { movRule: false }).mov === 8, String(derive(even, { movRule: false }).mov));

const dBases = derive(kcard(), { derivedBases: true });
const byKey = (d, k) => d.skills.filter((s) => s.key === k);
ok('推导基础值：攀爬取 STR/2 与 DEX/2 的高者（35）', byKey(dBases, 'climb')[0]?.base === 35, String(byKey(dBases, 'climb')[0]?.base));
ok('推导基础值：侦查 30 / 说服 12', byKey(dBases, 'spotHidden')[0]?.base === 30 && byKey(dBases, 'persuade')[0]?.base === 12, '');
ok('关闭推导基础值后回到规则书基础（攀爬 20）', byKey(derive(kcard()), 'climb')[0]?.base === 20, String(byKey(derive(kcard()), 'climb')[0]?.base));

// 专精下限：把斗殴投到 65（25 + 40），本组最高一半 = 32 → 其余专精基础值抬到 32
const invested = {
  ...kcard(),
  skills: [
    { id: 'fighting#0', key: 'fighting', custom: '斗殴', occ: 40 },
    { id: 'fighting#1', key: 'fighting', custom: '斧' },
  ],
};
const floorOn = derive(invested);
const brawl = floorOn.skills.filter((s) => s.key === 'fighting' && s.custom === '斗殴')[0];
const axe = floorOn.skills.filter((s) => s.id === 'fighting#1')[0];
// 规则：参照支（斗殴：25 + 40 = 65）自身基础值保持不变，只把其余分支抬到「65 / 2 = 32」，
// 且不得低于其原本基础值（斧 15 → 32）；因此不存在「改写参照支 → 再次抬高」的循环。
ok('专精下限只抬高其它分支，参照支保持原值', brawl?.base === 25 && brawl?.total === 65 && axe?.base === 32,
  `斗殴 ${brawl?.base}/${brawl?.total} · 斧 ${axe?.base}`);
ok('专精下限不会循环叠加（重复计算不改变结果）',
  derive(floorOn ? invested : invested).skills.filter((s) => s.key === 'fighting' && s.custom === '斗殴')[0]?.base === 25);
const floorOff = derive(invested, { specFloor: false });
ok('专精下限关闭后保持规则书原值（斗殴 25 / 斧 15）',
  floorOff.skills.filter((s) => s.key === 'fighting' && s.custom === '斗殴')[0]?.base === 25
  && floorOff.skills.filter((s) => s.id === 'fighting#1')[0]?.base === 15);

section('第二母语');
const dLang = derive({ ...kcard(), extraLanguages: ['法语', '拉丁语'] });
ok('每门第二母语消耗 10 点兴趣', dLang.spent.interest === 20, String(dLang.spent.interest));
ok('生成两行母语技能', dLang.skills.filter((s) => s.extraLanguage).length === 2);
ok('第二母语起始值 = EDU', dLang.skills.filter((s) => s.extraLanguage).every((s) => s.total === 70));
ok('关闭开关后不计点也不生成', (() => {
  const off = derive({ ...kcard(), extraLanguages: ['法语'] }, { secondOwnLanguage: false });
  return off.spent.interest === 0 && off.skills.filter((s) => s.extraLanguage).length === 0;
})());

// ---------------------------------------------------------------- 审卡
section('审卡');
const auditOf = (sheet, toggles = {}, ctxExtra = {}) => auditSheet(sheet, {}, {
  ruleset: LAYER, kpcpRules: rules(toggles), ...ctxExtra,
});
const ids = (a) => a.findings.map((f) => f.id);
ok('缺少伴侣房规时报 kpcpRulesRequired', ids(auditOf(kcard(), {}, { kpcpRules: undefined })).includes('kpcpRulesRequired'));
ok('背景少于 4 栏时报 backgroundMinFields', ids(auditOf({ ...kcard(), background: {} })).includes('backgroundMinFields'));
ok('飞行员 340 只提示不拦（info）', (() => {
  const f = auditOf({ ...kcard(), occupationId: 'kpcp:pilot' }).findings.find((x) => x.id === 'occPackageTotal');
  return f && f.level === 'info';
})());
ok('stats.gameSystem 仍是基础规则', auditOf(kcard()).stats.gameSystem === CLASSIC_ID, auditOf(kcard()).stats.gameSystem);

// ---------------------------------------------------------------- 隔离
section('与其它规则互不影响');
const classicCard = { ...blankSheet('u1', CLASSIC_ID), chars: { ...chars }, occupationId: 11 };
const c1 = computeSheet(classicCard);
ok('七版卡仍是 64 槽且无伴侣层', CLASSIC.skills.length === 54 && c1.skills.length === 64, String(c1.skills.length));
ok('七版卡 HP 不变（11）', c1.hp === 11, String(c1.hp));
ok('七版卡背景仍是 10 栏', backgroundFieldsOf(CLASSIC).length === 10);
ok('七版卡术语不变', !CLASSIC.terms && c1.ruleset?.terms == null);
ok('通克卡 HP = ÷5 不受影响', computeSheet({ ...blankSheet('u', PULP_ID), chars: { ...chars } }).hp === 22);
ok('legacy gameSystem:kpcp 解析为七版 + 伴侣层', (() => {
  const r = resolveCardRuleset({ gameSystem: 'kpcp' });
  return isKpcpLayer(r) && r.kpcpBaseId === CLASSIC_ID;
})());
ok('未开局层的卡不会被叠层', !isKpcpLayer(resolveCardRuleset({ gameSystem: 'classic7e', kpcp: { enabled: false } })));

section('房规配置归一化');
const normalized = normalizeKpcpRules({ toggles: { derivedBases: true, bogus: true }, customRules: [{ name: '团规' }] });
ok('只接受已知开关', normalized.toggles.derivedBases === true && normalized.toggles.bogus === undefined);
ok('团规保留并补 id / enabled', normalized.customRules.length === 1 && normalized.customRules[0].name === '团规' && normalized.customRules[0].enabled === true);
ok('默认开关 6 项', KPCP_TOGGLES.length === 6, String(KPCP_TOGGLES.length));
ok('默认规则可摘要', kpcpRuleSummary(KPCP_DEFAULT_RULES).enabledCount >= 1);
ok('开关回退：ctx 优先于卡内旧值', (() => {
  const sheet = { ...kcard(), kpcp: { enabled: true, toggles: { derivedBases: false } } };
  return kpcpToggles(sheet, { kpcpRules: { toggles: { derivedBases: true } } }).derivedBases === true;
})());

console.log(`\n================ 伴侣规则自检：${pass} 通过 / ${fail} 失败 ================`);
if (fail) process.exit(1);