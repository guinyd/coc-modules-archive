#!/usr/bin/env node
/**
 * 规则引擎 / 骰娘指令 / 角色卡 Markdown 的轻量自检（无框架，`node tools/check-shared.mjs`）。
 *
 * 这些是**纯函数**，不依赖服务端；放一个独立脚本是为了在不启动服务的情况下也能快速回归，
 * 尤其是骰娘指令格式与编码导入导出这类"看起来对、其实错一位"的东西。
 */

import { readFileSync } from 'node:fs';
import {
  blankSheet, blankSkills, computeSheet, validateSheet, auditSheet,
  ageAdjust, effectiveChars, damageBonusBuild, occupationAllowed,
  OCCUPATIONS, normalizeHouseRules, backgroundFieldsOf, AUDIT_RULE_META,
} from '../shared/coc7e.js';
import { buildDiceBotCommand, DICEBOT_FORMATS, diceBotSkillNames } from '../shared/dicebot.js';
import { buildCardBackup, buildCardMarkdown, importCardData } from '../shared/cardmd.js';
import { resolveCardRuleset, customOccupationsFor } from '../shared/rulesets/index.js';
import { KPCP_DEFAULT_RULES, KPCP_AUDIT_RULES } from '../shared/rulesets/kpcp.js';
import { PULP_AUDIT_RULES } from '../shared/rulesets/pulp.js';
import { buildMassUnit, attritionTable, attritionStage } from '../shared/massCombat.js';
import {
  SPELL_CATALOG, SPELL_CATEGORIES, TOME_CATALOG,
  normalizeSpells, normalizeTomes, spellFromCatalog, tomeFromCatalog,
} from '../shared/occult.js';

let pass = 0; const fails = [];
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fails.push(name); console.log(`  ✗ ${name} ${extra}`); }
};
const section = (t) => console.log(`\n== ${t} ==`);

const base = {
  ...blankSheet(),
  name: '自检调查员', occupationId: 2, age: 45, era: '1920s', gender: '男',
  chars: { STR: 60, CON: 50, SIZ: 70, DEX: 55, APP: 65, INT: 60, POW: 50, EDU: 70, Luck: 45 },
};

section('年龄补正表（官方空白卡）');
ok('15-19：力量/体型合计 −5、教育 −5、幸运两次', (() => {
  const a = ageAdjust(17);
  return a.pools[0].points === 5 && a.pools[0].keys.join() === 'STR,SIZ' && a.edu === -5 && a.luckRolls === 2;
})());
ok('40-49：池 5、外貌 −5、检定 2、MOV −1', (() => {
  const a = ageAdjust(45);
  return a.pools[0].points === 5 && a.app === -5 && a.eduChecks === 2 && a.movPenalty === 1;
})());
ok('60-69：池 20、外貌 −15、检定 4', (() => {
  const a = ageAdjust(65);
  return a.pools[0].points === 20 && a.app === -15 && a.eduChecks === 4;
})());
ok('80-89：池 80、外貌 −25', ageAdjust(85).pools[0].points === 80 && ageAdjust(85).app === -25);
ok('分配式扣点：只扣玩家分配的那几项', (() => {
  const eff = effectiveChars(base.chars, 45, { ageAlloc: { STR: 5, CON: 0, DEX: 0 } });
  return eff.STR === 55 && eff.CON === 50 && eff.DEX === 55 && eff.APP === 60;
})());
ok('豁免年龄减益：属性不降、教育成长照常', (() => {
  const eff = effectiveChars(base.chars, 65, { waivePenalty: true, eduBonus: 15 });
  return eff.STR === 60 && eff.APP === 65 && eff.EDU === 85;
})());
ok('传奇额外调整值单独累加', (() => {
  const eff = effectiveChars(base.chars, 45, { legendary: { STR: 100 } });
  return eff.STR === base.chars.STR + 100 - 2;   // 默认分配给 STR 2 点年龄减值
})());

section('体格 / 伤害加值表（突破 99 之后）');
const tbl = [[64, -2], [65, -1], [85, 0], [125, 1], [165, 2], [205, 3], [285, 4], [365, 5], [445, 6]];
ok('表格每一档都对得上', tbl.every(([total, build]) => {
  const siz = 50;
  return damageBonusBuild(total - siz, siz).build === build;
}), JSON.stringify(tbl.map(([t]) => damageBonusBuild(t - 50, 50).build)));

section('混点规则（v1.7 严格版）');
const mixed = {
  ...base,
  skills: blankSkills().map((s) => (s.id === 'spotHidden' ? { ...s, occ: 15, interest: 15 }
    : s.id === 'credit' ? { ...s, occ: 30, interest: 10 } : s)),
};
const findings = auditSheet(mixed, { forbidMixedPoints: true, creditOccOnly: true }).findings.map((f) => f.id);
ok('同技能双点 → error', findings.includes('forbidMixedPoints.sameSkill'));
ok('信用评级投兴趣点 → error', findings.includes('creditOccOnly'));
ok('玩家端警告同步（仅开启禁混点时）', (() => {
  const w = validateSheet(mixed, { auditRules: { forbidMixedPoints: true } });
  return w.some((x) => x.includes('同时吃职业点与兴趣点')) && w.some((x) => x.includes('信用评级投入了兴趣点'));
})());
ok('未开启禁混点时不提示同技能混点', !validateSheet(mixed).some((x) => x.includes('同时吃职业点与兴趣点')));
const cleanMixed = {
  ...base,
  skills: blankSkills().map((s) => (s.id === 'spotHidden' ? { ...s, interest: 30 } : s)),
};
ok('本职技能只投兴趣点 → 合规', !auditSheet(cleanMixed, {}).findings.some((f) => f.id.startsWith('forbidMixedPoints')));

function rulesetSkillSheet(extra = {}) {
  const sheet = { ...base, ...extra };
  const R = resolveCardRuleset(sheet);
  const rows = blankSkills(R).map((s) => (
    s.key === 'spotHidden' || s.key === 'naturalWorld' || s.key === 'persuade'
      ? { ...s, interest: 5 }
      : s
  ));
  return { ...sheet, skills: rows };
}

section('骰娘导入指令');
const d = computeSheet(base);
for (const f of DICEBOT_FORMATS) {
  const cmd = buildDiceBotCommand(base, d, { bot: f.id });
  ok(`${f.label}：.st 开头 + 属性别名 + 技能`,
    cmd.startsWith('.st ')
    && cmd.includes(`力量${d.eff.STR}str${d.eff.STR}`)
    && cmd.includes(`侦查${d.skills.find((s) => s.key === 'spotHidden').total}`),
    cmd.slice(0, 60));
}
ok('塔系前缀带角色名-', buildDiceBotCommand(base, d, { bot: 'tower' }).startsWith('.st 自检调查员-'));
ok('惠惠前缀带角色名？', buildDiceBotCommand(base, d, { bot: 'mdice' }).startsWith('.st 自检调查员？'));
ok('句号模式', buildDiceBotCommand(base, d, { bot: 'dice', dot: '。' }).startsWith('。st '));
ok('专攻技能拆分支：去掉射击/格斗头、拆斜杠、补「步霰」', (() => {
  const specSheet = {
    ...base,
    skills: [
      { id: 'firearms#0', key: 'firearms', custom: '手枪', occ: 20 },
      { id: 'firearms#1', key: 'firearms', custom: '步枪/霰弹枪', occ: 25 },
      { id: 'fighting#0', key: 'fighting', custom: '斗殴', occ: 25 },
    ],
  };
  const sd = computeSheet(specSheet);
  const cmd = buildDiceBotCommand(specSheet, sd, { bot: 'tower' });
  const has = (t) => cmd.includes(t);
  return !cmd.includes('/')
    && has('手枪') && has('步枪') && has('霰弹枪') && has('步霰') && has('斗殴')
    && !cmd.includes('射击') && !cmd.includes('格斗');
})());
ok('规则集各自的技能名：七版用七版表', (() => {
  const sheet = rulesetSkillSheet();
  const sd = computeSheet(sheet, {});
  const names = diceBotSkillNames(sheet, sd);
  return names.includes('侦查') && names.includes('博物学') && !names.includes('自然学') && !names.includes('侦察');
})());
ok('规则集各自的技能名：通克用通克表（七版叫法降为别名）', (() => {
  const sheet = rulesetSkillSheet({ gameSystem: 'pulp' });
  const sd = computeSheet(sheet, {});
  const names = diceBotSkillNames(sheet, sd);
  const cmd = buildDiceBotCommand(sheet, sd, { bot: 'dice' });
  return names.includes('侦察') && names.includes('博物学') && !names.includes('侦查')
    && cmd.includes('侦查') && cmd.includes('自然学');
})());
ok('背景故事栏目按规则集取（七版/通克 10 栏，伴侣层 8 栏）', (() => {
  const klass = backgroundFieldsOf(resolveCardRuleset({ gameSystem: 'classic7e' }));
  const pulp = backgroundFieldsOf(resolveCardRuleset({ gameSystem: 'pulp' }));
  const kpcp = backgroundFieldsOf(resolveCardRuleset({ gameSystem: 'classic7e', kpcp: { enabled: true, toggles: {}, customRules: [] } }));
  const keysOf = (f) => f.map(([k]) => k);
  return klass.length === 10 && keysOf(klass).includes('appearance')
    && pulp.length === 10 && keysOf(pulp).includes('encounters')
    && kpcp.length === 8 && keysOf(kpcp).includes('description')
    && keysOf(kpcp).includes('encountersStrangeEntities') && !keysOf(kpcp).includes('appearance');
})());
ok('空专精的单槽技能（宗教）即使没填专精也导出统称与数值', (() => {
  const sheet = rulesetSkillSheet({ gameSystem: 'classic7e', kpcp: { enabled: true, toggles: {}, customRules: [] } });
  const sd = computeSheet(sheet, {});
  const cmd = buildDiceBotCommand(sheet, sd, { bot: 'dice' });
  return cmd.includes('宗教10') && cmd.includes('神学10');
})());
ok('技能别名只保留中文（不带 charm / naturalWorld 这类英文名）', (() => {
  const sheets = [
    rulesetSkillSheet(),
    rulesetSkillSheet({ gameSystem: 'pulp' }),
    rulesetSkillSheet({ gameSystem: 'classic7e', kpcp: { enabled: true, toggles: {}, customRules: [] } }),
  ];
  return sheets.every((sheet) => {
    const cmd = buildDiceBotCommand(sheet, computeSheet(sheet, {}), { bot: 'dice' });
    return !cmd.includes('charm') && !cmd.includes('naturalWorld') && !cmd.includes('religion')
      && !cmd.includes('fastTalk') && !cmd.includes('persuade');
  });
})());
ok('相邻英文技能名之间留空格（不再出现 charm40fastTalk40）', (() => {
  const sheets = [
    rulesetSkillSheet(),
    rulesetSkillSheet({ gameSystem: 'pulp' }),
    rulesetSkillSheet({ gameSystem: 'classic7e', kpcp: { enabled: true, toggles: {}, customRules: [] } }),
  ];
  return sheets.every((sheet) => {
    const cmd = buildDiceBotCommand(sheet, computeSheet(sheet, {}), { bot: 'dice' });
    return !/[A-Za-z]\d+[A-Za-z]\d/.test(cmd);
  });
})());
ok('规则集各自的技能名：伴侣层用伴侣修订表（社交合并为「说服」，旧叫法进别名）', (() => {
  const sheet = rulesetSkillSheet({ gameSystem: 'classic7e', kpcp: { enabled: true, toggles: {}, customRules: [] } });
  const sd = computeSheet(sheet, {});
  const names = diceBotSkillNames(sheet, sd);
  const cmd = buildDiceBotCommand(sheet, sd, { bot: 'dice' });
  return names.includes('自然学') && names.includes('说服') && names.includes('侦查')
    && !names.includes('博物学') && !names.includes('取悦') && !names.includes('话术')
    && cmd.includes('博物学') && cmd.includes('取悦') && cmd.includes('话术');
})());
ok('shiki 版带派生值与武器', (() => {
  const cmd = buildDiceBotCommand(base, d, { bot: 'shiki' });
  return cmd.includes('&DB=') && cmd.includes('闪避:') && cmd.includes('&徒手=');
})());

section('附表：法术与神话典籍');
ok('法术目录含 400+ 条与 17 个分类', SPELL_CATALOG.length >= 400 && SPELL_CATEGORIES.length === 17,
  `${SPELL_CATALOG.length}/${SPELL_CATEGORIES.length}`);
ok('典籍目录覆盖全部版本（110+ 本）', TOME_CATALOG.length >= 110, String(TOME_CATALOG.length));
const spellRow = spellFromCatalog(SPELL_CATALOG[0], 'sp_test');
ok('从大典补全法术名/分类/消耗/用时/详情/别名',
  spellRow.name === SPELL_CATALOG[0].name && spellRow.category === SPELL_CATALOG[0].category
  && spellRow.cost === SPELL_CATALOG[0].cost
  && spellRow.detail === (SPELL_CATALOG[0].detail || '')
  && spellRow.alias === (SPELL_CATALOG[0].aliases || []).join('、'), JSON.stringify(spellRow).slice(0, 120));
const tomeRow = tomeFromCatalog(TOME_CATALOG[0], 'tm_test');
ok('从典籍目录补全书名与全文', tomeRow.name === TOME_CATALOG[0].name && Boolean(tomeRow.desc));
ok('空名法术被过滤、数量封顶 40',
  normalizeSpells([{ name: '' }, { name: '  ' }]).length === 0
  && normalizeSpells(Array.from({ length: 45 }, (_, i) => ({ name: `法术${i}` }))).length === 40);
ok('法术目录带详情与别名（天气改换术）', (() => {
  const w = SPELL_CATALOG.find((x) => x.name === '天气改换术');
  return Boolean(w && w.detail.includes('缓和或恶化天气') && w.aliases.includes('雨之舞'));
})());
ok('内联字段不再吞掉用时/详情（通神术）', (() => {
  const t = SPELL_CATALOG.find((x) => x.name === '通神术');
  return Boolean(t && t.time === '5~10（1D6+4）轮' && t.detail.startsWith('没有人会去使用通神术')
    && t.aliases.includes('召来开路者') && t.cost.startsWith('5点POW'));
})());
ok('全部法术都有消耗/用时/详情', SPELL_CATALOG.every((x) => x.cost && x.time && x.detail));

ok('旧版截断的典籍正文已补全（德基安之书）', (() => {
  const t = TOME_CATALOG.find((x) => x.name === '《德基安之书》' && x.meta === '亚特兰蒂斯版');
  return Boolean(t && t.desc.includes('长年的狂热研究') && t.desc.includes('Shamballah'));
})());
ok('典籍名称保留书名号', TOME_CATALOG.every((t) => t.name.startsWith('《')));

ok('典籍数量封顶 20', normalizeTomes(Array.from({ length: 25 }, (_, i) => ({ name: `典籍${i}` }))).length === 20);

section('角色卡 Markdown / JSON 备份');
const md = buildCardMarkdown(base);
ok('以调查员档案标题开头', md.startsWith('# 调查员档案 · 自检调查员'), md.slice(0, 30));
ok('包含属性、全部技能与背景章节',
  md.includes('## 属性') && md.includes('## 技能（全部）') && md.includes('## 背景故事'));
ok('列出全部技能（不止已投点）', md.split(String.fromCharCode(10)).filter((l) => l.startsWith('| ') && !l.includes('---') && !l.startsWith('| 技能')).length > 40);
ok('属性总和区分含运 / 不含运', md.includes('属性总和：480 / 525（不含运 / 含运）'));
ok('属性表带成长列、派生值写明理智上限', md.includes('| 属性 | 数值 | 成长 |') && md.includes('理智上限 = 99 − 神话知识'));
ok('Markdown 不再内嵌数据块', !md.includes('<details>') && !md.includes('```json'));
ok('可读 Markdown 不再用于还原，提示改用 .json',
  (() => { const r = importCardData(md); return !r.ok && r.error.includes('.json'); })());
const backup = buildCardBackup(base);
const back = importCardData(backup);
ok('JSON 备份往返成功', back.ok && back.sheet.name === base.name && back.sheet.chars.STR === 60, back.error);
ok('JSON 备份保留属性/理智成长',
  (() => { const r = importCardData(buildCardBackup({ ...base, charGrowth: { STR: 5 }, sanGrowth: 7 })); return r.ok && r.sheet.charGrowth.STR === 5 && r.sheet.sanGrowth === 7; })());
ok('导入后是干净的新卡（无传奇/无模组经历/草稿）',
  back.ok && back.sheet.legendary.enabled === false && back.sheet.moduleLinks.length === 0 && back.sheet.status === 'draft');
ok('旧版带数据块的 Markdown 仍可导入', (() => {
  const legacy = '# 调查员档案 · 旧卡' + String.fromCharCode(10) + '```json' + String.fromCharCode(10)
    + JSON.stringify({ name: '旧卡', chars: { STR: 50 } }) + String.fromCharCode(10) + '```';
  const r = importCardData(legacy);
  return r.ok && r.sheet.name === '旧卡';
})());
ok('旧角色卡编码提示已停用', (() => { const r = importCardData('COC7G1:abcd'); return !r.ok && r.error.includes('停用'); })());
ok('空内容被拒绝', importCardData('   ').ok === false);

section('属性与理智成长');
const growthSheet = {
  ...blankSheet(), name: '成长自检', chars: { ...blankSheet().chars, POW: 60, CON: 50, SIZ: 50 },
  charGrowth: { POW: 10 }, sanGrowth: 20,
};
const gd = computeSheet(growthSheet, {});
ok('属性成长计入有效值（POW 60+10）', gd.eff.POW === 70, gd.eff.POW);
ok('SAN 起始 = 意志+成长（70+20）', gd.san === 90, gd.san);
ok('SAN 上限默认 99', gd.sanMax === 99);
const mythSheet = { ...growthSheet, skills: [{ id: 'cthulhu', key: 'cthulhu', occ: 20 }] };
const md2 = computeSheet(mythSheet, {});
ok('SAN 上限 = 99 − 神话知识（20）', md2.sanMax === 79 && md2.san === 79, `${md2.sanMax}/${md2.san}`);
ok('自由特长可选分支组（格斗整组算本职）', (() => {
  const occ = { keys: ['dodge'], free: 1, pts: { terms: [{ stat: 'EDU', mult: 4 }] } };
  const allowed = occupationAllowed(occ, { free: ['fighting'] });
  return allowed.has('fighting') && !allowed.has('firearms');
})());

const capSheet = { ...growthSheet, chars: { ...growthSheet.chars, STR: 95 }, charGrowth: { STR: 10 } };
const cd = computeSheet(capSheet, {});
ok('成长不能让属性突破 99（95+10→99）', cd.eff.STR === 99, cd.eff.STR);
const budgetSheet = { ...blankSheet(), name: '预算自检', chars: { ...blankSheet().chars, INT: 70, EDU: 80 }, charGrowth: { INT: 20, EDU: 10 } };
const bd = computeSheet(budgetSheet, {});
ok('成长不计入兴趣点预算（INT 70+20，预算仍 140）', bd.eff.INT === 90 && bd.budget.interest === 140, `${bd.eff.INT}/${bd.budget.interest}`);
const negSheet = { ...growthSheet, sanGrowth: -10 };
const nd = computeSheet(negSheet, {});
ok('SAN 成长可为负（70−10=60）', nd.san === 60, nd.san);

const occultSheet = { ...base, spells: [spellRow], tomes: [tomeRow] };
const occultMd = buildCardMarkdown(occultSheet);
ok('Markdown 附表输出法术与典籍', occultMd.includes('## 附表') && occultMd.includes('### 法术详情')
  && occultMd.includes('### 神话典籍') && occultMd.includes(spellRow.name) && occultMd.includes(tomeRow.name));
const occultBack = importCardData(buildCardBackup(occultSheet));
ok('JSON 备份保留法术与典籍',
  occultBack.ok && occultBack.sheet.spells.length === 1 && occultBack.sheet.tomes.length === 1);

section('房规除法取整');
ok('属性 ÷ 2 向下取整（81 ÷ 2 = 40）', (() => {
  const sheet = { ...blankSheet(), name: '房规取整', chars: { ...base.chars, APP: 81 } };
  const d = computeSheet(sheet, { houseRules: [{ type: 'deriveBase', skill: 'charm', source: 'attr', from: 'APP', op: 'div', value: 2, adjust: 0 }] });
  const charm = d.skills.find((x) => x.key === 'charm');
  return charm?.base === 40;
})());
ok('乘法结果也向下取整（APP 81 × 1.5 = 121）', (() => {
  const sheet = { ...blankSheet(), name: '房规取整2', chars: { ...base.chars, APP: 81 } };
  const d = computeSheet(sheet, { houseRules: [{ type: 'deriveBase', skill: 'charm', source: 'attr', from: 'APP', op: 'mul', value: 1.5, adjust: 0 }] });
  const charm = d.skills.find((x) => x.key === 'charm');
  return charm?.base === 121;
})());


section('规则细节修复：探险家二选一 / 忽略年龄');
ok('探险家（古典）未选任一项时，攀爬/游泳都不算本职', (() => {
  const occ = OCCUPATIONS.find((o) => o.id === 53);
  const a = occupationAllowed(occ, { choices: [] });
  return !a.has('climb') && !a.has('swim');
})());
ok('探险家（古典）选游泳后只有游泳算本职', (() => {
  const occ = OCCUPATIONS.find((o) => o.id === 53);
  const a = occupationAllowed(occ, { choices: ['swim'] });
  return a.has('swim') && !a.has('climb');
})());
ok('自定义职业模板按归属规则分流（伴侣层＝主体模板 + 伴侣模板）', (() => {
  const list = [
    { id: 'c1', name: '七版模板', gameSystem: 'classic7e' },
    { id: 'c2', name: '通克模板', gameSystem: 'pulp' },
    { id: 'c3', name: '伴侣模板', gameSystem: 'kpcp' },
    { id: 'c4', name: '旧模板（无字段）' },
  ];
  const ids = (R) => customOccupationsFor(R, list).map((o) => o.id).join(',');
  const classic = resolveCardRuleset({ gameSystem: 'classic7e' });
  const pulp = resolveCardRuleset({ gameSystem: 'pulp' });
  const classicKpcp = resolveCardRuleset({ gameSystem: 'classic7e', kpcp: { enabled: true } });
  return ids(classic) === 'c1,c4'
    && ids(pulp) === 'c2'
    // 伴侣层是叠加：主体规则模板必须继续可见，伴侣模板一并给出（v10.13.11）
    && ids(classicKpcp) === 'c1,c3,c4';
})());
ok('忽略年龄规则可被房规白名单接受', normalizeHouseRules([{ type: 'ignoreAge' }])[0]?.type === 'ignoreAge');
ok('忽略年龄规则不套用年龄补正（APP 65 不再 −5）', (() => {
  const sheet = { ...base, applyAgeAdjust: true };
  return computeSheet(sheet).eff.APP === 60 && computeSheet(sheet, { ignoreAge: true }).eff.APP === 65;
})());
ok('忽略年龄规则隐藏年龄范围提示', !validateSheet({ ...base, age: 130 }, { ignoreAge: true }).some((x) => x.includes('年龄超')));
ok('忽略年龄规则隐藏教育未结算提示', !auditSheet({ ...base, applyAgeAdjust: true }, {}, { ignoreAge: true }).findings.some((f) => f.id === 'eduUnsettled'));

section('骰娘导入指令：标名技能拆分（v10.13.14）');
ok('伴侣版多门母语拆成「母语 + 各分支」，不再出现「母语法语」这种联合词', (() => {
  const sheet = {
    ...blankSheet('u1', 'classic7e'),
    kpcp: { enabled: true, toggles: KPCP_DEFAULT_RULES.toggles },
    chars: { STR: 60, CON: 50, SIZ: 45, DEX: 44, APP: 71, INT: 75, POW: 75, EDU: 80 },
    extraLanguages: ['法语', '拉丁语'],
  };
  const R = resolveCardRuleset(sheet);
  sheet.skills = blankSkills(R);
  const d = computeSheet(sheet, { ruleset: R });
  const cmd = buildDiceBotCommand(sheet, d, {});
  const seg = (cmd.match(/母语\d+[^聆]*/) || [''])[0];
  return seg.includes('母语80法语80拉丁语80')
    && !cmd.includes('母语法语') && !cmd.includes('母语拉丁语');
})());
ok('宗教带分支时给「统称 → 旧叫法 → 分支」（宗教 神学 天主教）', (() => {
  const sheet = {
    ...blankSheet('u1', 'classic7e'),
    kpcp: { enabled: true, toggles: KPCP_DEFAULT_RULES.toggles },
    chars: { STR: 60, CON: 50, SIZ: 45, DEX: 44, APP: 71, INT: 75, POW: 75, EDU: 80 },
  };
  const R = resolveCardRuleset(sheet);
  sheet.skills = blankSkills(R).map((s) => (s.key === 'religion' ? { ...s, custom: '天主教', interest: 40 } : s));
  const d = computeSheet(sheet, { ruleset: R });
  const cmd = buildDiceBotCommand(sheet, d, {});
  const seg = (cmd.match(/宗教\d+[^炮术]*/) || [''])[0];
  return /^宗教\d+神学\d+天主教\d+/.test(seg) && !cmd.includes('宗教天主教');
})());

section('审卡：规则集显式设回官方默认值（0 = 不检查）必须生效（v10.13.14）');
const auditIds = (sheet, rules) => auditSheet(sheet, rules).findings.map((f) => f.id);
const kpcpSheet = () => ({
  ...blankSheet('u1', 'classic7e'),
  kpcp: { enabled: true },
  chars: { STR: 60, CON: 50, SIZ: 45, DEX: 44, APP: 71, INT: 75, POW: 75, EDU: 80 },
});
ok('通克默认要求填背景栏；显式设 0 后不再提示', (() => {
  const sheet = { ...blankSheet('u1', 'pulp'), chars: { STR: 60, CON: 50, SIZ: 45, DEX: 44, APP: 71, INT: 75, POW: 75, EDU: 80 } };
  return auditIds(sheet, {}).includes('backgroundMinFields')
    && !auditIds(sheet, { backgroundMinFields: 0 }).includes('backgroundMinFields');
})());
ok('伴侣层同样可被显式 0 关掉', (() => {
  const sheet = kpcpSheet();
  return auditIds(sheet, {}).includes('backgroundMinFields')
    && !auditIds(sheet, { backgroundMinFields: 0 }).includes('backgroundMinFields');
})());
ok('显式给出更严的栏数会触发提示，文案用实际栏数（伴侣版 8 栏）', (() => {
  const f = auditSheet(kpcpSheet(), { backgroundMinFields: 3 }).findings.find((x) => x.id === 'backgroundMinFields');
  return Boolean(f) && f.detail.includes('/ 8 栏');
})());
ok('职业技能上限设 0 同样能关掉阈值', (() => {
  const sheet = {
    ...blankSheet('u1', 'classic7e'),
    chars: { STR: 60, CON: 50, SIZ: 45, DEX: 44, APP: 71, INT: 75, POW: 75, EDU: 80 },
  };
  sheet.skills = blankSkills().map((s) => (s.key === 'spotHidden' ? { ...s, occ: 60 } : s));
  return auditIds(sheet, { occSkillMax: 50 }).includes('occSkillMax')
    && !auditIds(sheet, { occSkillMax: 0 }).includes('occSkillMax');
})());

section('审卡：通俗核心属性下限（v10.13.14）');
ok('原型核心属性低于设定的下限时报错，设 0 不检查', (() => {
  const sheet = { ...blankSheet('u1', 'pulp'), chars: { STR: 60, CON: 50, SIZ: 45, DEX: 55, APP: 71, INT: 75, POW: 75, EDU: 80 } };
  const R = resolveCardRuleset(sheet);
  const arch = (R.archetypes || [])[0];
  if (!arch) return false;
  sheet.archetypeId = arch.id;
  sheet.coreChar = arch.coreChar[0];
  const hit = auditSheet(sheet, { coreCharMin: 70 }).findings.some((f) => f.id === 'coreCharMin');
  const off = auditSheet(sheet, { coreCharMin: 0 }).findings.some((f) => f.id === 'coreCharMin');
  return hit && !off;
})());
section('审卡规则表全量生效（v10.14.0）');
// 结构性自查：规则集里能配的每一项，auditSheet 里都必须真的读它。
// 只靠「界面能填、保存成功」不够——曾经就出现过存了但审卡根本不看的项（occTotalTolerance / specFloor）。
ok('规则表里每一项都被引擎真正消费（没有「存了不生效」的项）', (() => {
  // 有的项在 auditSheet 里（r.xxx），有的在 computeSheet 的预算里（auditRules?.xxx），两者都算生效
  const src = readFileSync(new URL('../shared/coc7e.js', import.meta.url), 'utf8');
  const dead = AUDIT_RULE_META
    .map((m) => m.key)
    .filter((k) => !new RegExp(`(?:r\\.|auditRules\\??\\.)${k}\\b`).test(src));
  if (dead.length) console.log(`    未生效：${dead.join(', ')}`);
  return dead.length === 0;
})());
// 规则集基线里写进去的键也必须是真规则（不能塞没人读的自定义键充数）
ok('规则集自带的审卡基线只包含真实规则项', (() => {
  const known = new Set(AUDIT_RULE_META.map((m) => m.key));
  const stray = [...Object.keys(PULP_AUDIT_RULES || {}), ...Object.keys(KPCP_AUDIT_RULES || {})]
    .filter((k) => !known.has(k));
  if (stray.length) console.log(`    规则集里多出来的键：${stray.join(', ')}`);
  return stray.length === 0;
})());

section('群战集群构建器（v10.14.1）');
// 公式全部来自守秘人伴侣的群战规则：属性放大、生命合成、体格与伤害加值、闪避与攻击
const massSample = buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35 });
ok('群战：力量×2、体质×5、体型×5',
  massSample.str === 100 && massSample.con === 250 && massSample.siz === 325,
  JSON.stringify({ str: massSample.str, con: massSample.con, siz: massSample.siz }));
ok('群战：生命 =（放大后体质 + 体型）÷10',
  massSample.hpMax === 57, String(massSample.hpMax));
ok('群战：伤害加值取「群体体格大一级」的档位',
  massSample.db === '+5D6' && massSample.build === 5,
  JSON.stringify({ build: massSample.build, db: massSample.db, base: massSample.baseDb }));
ok('群战：闪避 = 敏捷÷5、攻击技能翻倍',
  massSample.dodge === 9 && massSample.attack === 70,
  JSON.stringify({ dodge: massSample.dodge, attack: massSample.attack }));
// 战力衰减：>一半 3 次；低于一半 2 次并加惩罚骰；低于五分之一 1 次
ok('群战：战力衰减三档门限与攻击次数',
  attritionStage(57, 57).attacks === 3
  && attritionStage(28, 57).attacks === 2 && attritionStage(28, 57).penaltyDie === true
  && attritionStage(11, 57).attacks === 1,
  JSON.stringify([attritionStage(57, 57), attritionStage(28, 57), attritionStage(11, 57)]));
ok('群战：衰减表给出三档区间与提示',
  (() => {
    const rows = attritionTable(57);
    return rows.length === 3
      && rows.map((r) => r.label).join(',') === '满编,半残,濒散'
      && rows[1].range === '12 – 28' && rows[2].range === '≤ 11';
  })(), JSON.stringify(attritionTable(57)));
// 当前生命留空要按满编算（曾经把空串当 0，一打开就是「濒散」）
ok('群战：当前生命留空时视为满编（不是 0）',
  buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35, hpNow: '' }).stage.stage === 3
  && buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35 }).hpNow === 57
  && buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35, hpNow: 0 }).stage.stage === 1,
  JSON.stringify([
    buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35, hpNow: '' }).stage,
    buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, brawl: 35, hpNow: 0 }).stage,
  ]));

// 群战：支持多个攻击技能（刀、斧头、擒拿等），每项各自 ×2
ok('群战：支持多个攻击技能（每项 ×2）',
  (() => {
    const u = buildMassUnit({
      STR: 50, CON: 50, SIZ: 65, DEX: 45,
      attacks: [{ label: '格斗', value: 35 }, { label: '斧头', value: 40 }],
    });
    return u.attacks.length === 2
      && u.attacks[1].label === '斧头'
      && u.attacks[1].base === 40
      && u.attacks[1].total === 80
      && u.attack === 70;
  })(), JSON.stringify(buildMassUnit({ STR: 50, CON: 50, SIZ: 65, DEX: 45, attacks: [{ label: '格斗', value: 35 }, { label: '斧头', value: 40 }] }).attacks));

console.log(`\n================ 自检：${pass} 通过 / ${fails.length} 失败 ================`);
if (fails.length) { console.log('失败项：\n - ' + fails.join('\n - ')); process.exit(1); }
