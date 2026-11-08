#!/usr/bin/env node
/**
 * 规则引擎 / 骰娘指令 / 角色卡 Markdown 的轻量自检（无框架，`node tools/check-shared.mjs`）。
 *
 * 这些是**纯函数**，不依赖服务端；放一个独立脚本是为了在不启动服务的情况下也能快速回归，
 * 尤其是骰娘指令格式与编码导入导出这类"看起来对、其实错一位"的东西。
 */

import {
  blankSheet, blankSkills, computeSheet, validateSheet, auditSheet,
  ageAdjust, effectiveChars, damageBonusBuild, occupationAllowed,
} from '../shared/coc7e.js';
import { buildDiceBotCommand, DICEBOT_FORMATS } from '../shared/dicebot.js';
import { buildCardBackup, buildCardMarkdown, importCardData } from '../shared/cardmd.js';
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
ok('玩家端警告同步', (() => {
  const w = validateSheet(mixed);
  return w.some((x) => x.includes('同时吃职业点与兴趣点')) && w.some((x) => x.includes('信用评级投入了兴趣点'));
})());
const cleanMixed = {
  ...base,
  skills: blankSkills().map((s) => (s.id === 'spotHidden' ? { ...s, interest: 30 } : s)),
};
ok('本职技能只投兴趣点 → 合规', !auditSheet(cleanMixed, {}).findings.some((f) => f.id.startsWith('forbidMixedPoints')));

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

console.log(`\n================ 自检：${pass} 通过 / ${fails.length} 失败 ================`);
if (fails.length) { console.log('失败项：\n - ' + fails.join('\n - ')); process.exit(1); }
