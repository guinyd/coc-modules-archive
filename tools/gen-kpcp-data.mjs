// 生成守秘人伴侣（kpcp）规则集数据：tools/kpcp-src/*.json → shared/rulesets/kpcp-data.js
// 用法：node tools/gen-kpcp-data.mjs [--check]
// 数据源：守密人伴侣扩展/_rules-draft/data/{skills.json,occupations.json} 与从 PDF 表 7–14 抽出的 weapons-raw.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'tools', 'kpcp-src');
const OUT = path.join(ROOT, 'shared', 'rulesets', 'kpcp-data.js');
const CHECK = process.argv.includes('--check');

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(SRC, name), 'utf8'));

const rawSkills = readJson('skills.json');
const rawOccs = readJson('occupations.json');
const rawWeapons = readJson('weapons-raw.json');

/* ------------------------------------------------------------------ *
 * 1. 技能：84 条 → 引擎技能表（统称技能折叠为专攻组）
 * ------------------------------------------------------------------ */

// 普通技能：英文 id → 引擎 key
const KEY_BY_ID = {
  'Accounting': 'accounting',
  'Animal Handling': 'animalHandling',
  'Archaeology': 'archaeology',
  'Artillery': 'artillery',
  'Climb': 'climb',
  'Computer Use': 'computer',
  'Credit Rating': 'credit',
  'Cthulhu Mythos': 'cthulhu',
  'Demolitions': 'demolitions',
  'Diving': 'diving',
  'Dodge': 'dodge',
  'Drive Auto': 'driveAuto',
  'Electrical Repair': 'elecRepair',
  'Electronics': 'electronics',
  'First Aid': 'firstAid',
  'History': 'history',
  'Hypnosis': 'hypnosis',
  'Jump': 'jump',
  'Law': 'law',
  'Library Use': 'library',
  'Listen': 'listen',
  'Locksmith': 'locksmith',
  'Mechanical Repair': 'mechRepair',
  'Medicine': 'medicine',
  'Natural World': 'naturalWorld',
  'Navigate': 'navigate',
  'Occult': 'occult',
  'Operate Heavy Machinery': 'opHeavyMachine',
  'Persuade': 'persuade',
  'Pilot Aircraft': 'pilotAircraft',
  'Pilot Boat': 'pilotBoat',
  'Psychoanalysis': 'psychoanalysis',
  'Psychology': 'psychology',
  'Read Lips': 'readLips',
  'Reassure': 'reassure',
  'Sleight of Hand': 'sleightOfHand',
  'Spot Hidden': 'spotHidden',
  'Stealth': 'stealth',
  'Survival': 'survival',
  'Swim': 'swim',
  'Throw': 'throw',
  'Track': 'track',
};

// 统称技能：英文 id → 专攻组（组名同时是引擎的 spec 键）
const GROUP_BY_ID = {
  'Art/Craft': 'art',
  'Fighting': 'fighting',
  'Firearms': 'firearms',
  'Science': 'science',
  'Language (Other)': 'language',
  'Language (Own)': 'ownLanguage',
  'Religion': 'religion',
  'Ride': 'ride',
};

const GROUP_META = {
  art: { name: '艺术/手艺', slots: 3, base: 5, cat: '技艺', flags: ['spec'] },
  fighting: { name: '格斗', slots: 3, base: 0, cat: '战斗', flags: ['spec'] },
  firearms: { name: '射击', slots: 3, base: 0, cat: '战斗', flags: ['spec'] },
  science: { name: '科学', slots: 3, base: 1, cat: '学问', flags: ['spec'] },
  language: { name: '外语', slots: 3, base: 1, cat: '语言', flags: ['spec'] },
  religion: { name: '宗教', slots: 1, base: 10, cat: '学问', flags: ['spec'] },
  ride: { name: '骑术', slots: 1, base: 5, cat: '运动', flags: ['spec'] },
};

// 常见外语/宗教/坐骑（书内未给清单，按 CoC7 常用项列出，均可在 UI 自定义）
const LANGUAGES = ['英语', '拉丁语', '希腊语', '法语', '德语', '西班牙语', '意大利语', '俄语', '汉语', '日语', '阿拉伯语', '希伯来语', '梵语', '古埃及语'];
const RELIGIONS = ['基督教', '天主教', '东正教', '伊斯兰教', '佛教', '印度教', '犹太教', '道教', '神道教', '民间信仰', '祆教', '锡克教'];
const RIDES = ['马', '骆驼', '骡', '大象', '摩托车', '自行车'];

const CAT_HINT = {
  'Accounting': '学问', 'Animal Handling': '运动', 'Anthropology': '学问', 'Appraise': '技艺',
  'Archaeology': '学问', 'Artillery': '战斗', 'Astronomy': '学问', 'Axe': '战斗',
  'Biology': '学问', 'Botany': '学问', 'Bow': '战斗', 'Brawl': '战斗', 'Chainsaw': '战斗',
  'Chemistry': '学问', 'Climb': '运动', 'Computer Use': '学问', 'Credit Rating': '社交',
  'Cryptography': '学问', 'Cthulhu Mythos': '神话', 'Demolitions': '战斗', 'Disguise': '技艺',
  'Diving': '运动', 'Dodge': '战斗', 'Drive Auto': '运动', 'Electrical Repair': '技艺',
  'Electronics': '学问', 'Engineering': '学问', 'Fine Art': '技艺', 'First Aid': '学问',
  'Flail': '战斗', 'Flamethrower': '战斗', 'Forensics': '学问', 'Forgery': '技艺',
  'Garrote': '战斗', 'Geology': '学问', 'Handgun': '战斗', 'Heavy Weapons': '战斗',
  'History': '学问', 'Hypnosis': '学问', 'Jump': '运动', 'Law': '学问', 'Library Use': '学问',
  'Listen': '调查', 'Locksmith': '技艺', 'Machine Gun': '战斗', 'Mathematics': '学问',
  'Mechanical Repair': '技艺', 'Medicine': '学问', 'Meteorology': '学问', 'Natural World': '学问',
  'Navigate': '调查', 'Occult': '学问', 'Operate Heavy Machinery': '技艺', 'Persuade': '社交',
  'Pharmacy': '学问', 'Photography': '技艺', 'Physics': '学问', 'Pilot Aircraft': '运动',
  'Pilot Boat': '运动', 'Psychoanalysis': '学问', 'Psychology': '学问', 'Read Lips': '调查',
  'Reassure': '社交', 'Rifle/Shotgun': '战斗', 'Sleight of Hand': '技艺', 'Spear': '战斗',
  'Spot Hidden': '调查', 'Stealth': '调查', 'Survival': '运动', 'Swim': '运动', 'Sword': '战斗',
  'Throw': '运动', 'Track': '调查', 'Whip': '战斗', 'Zoology': '学问',
};

const specPresets = {};
const specOptions = {};
const skills = [];
const unknownSkills = [];

for (const s of rawSkills) {
  const group = s.generic ? GROUP_BY_ID[s.generic] : (GROUP_BY_ID[s.id] || null);
  if (group) {
    // 子项（generic 指向父）→ 并入组预设
    if (s.generic) {
      if (!specPresets[group]) specPresets[group] = {};
      specPresets[group][s.zh] = Number.isFinite(s.basePct) ? s.basePct : GROUP_META[group]?.base || 0;
    }
    continue;
  }
  const key = KEY_BY_ID[s.id];
  if (!key) { unknownSkills.push(s.id); continue; }
  const def = {
    key,
    id: s.id,
    name: s.zh,
    en: s.id,
    cat: CAT_HINT[s.id] || s.zh,
    base: Number.isFinite(s.basePct) ? s.basePct : null,
    flags: [],
  };
  if (s.baseExpr === 'DEX/2') { def.base = null; def.flags.push('dexHalf'); }
  if (s.baseExpr === 'EDU') { def.base = null; def.flags.push('edu', 'named'); }
  if (s.baseExpr === 'APP/5') { def.base = null; def.formula = { from: 'APP', div: 5 }; }
  if (s.id === 'Credit Rating' || s.id === 'Cthulhu Mythos') def.flags.push('nocap');
  if (s.modern) def.flags.push('modern');
  if (s.uncommon) def.uncommon = true;
  if (s.note) def.note = s.note;
  if (s.id === 'Reassure') def.uncommon = true;
  skills.push(def);
}

// 专攻组本体
for (const [group, meta] of Object.entries(GROUP_META)) {
  if (group === 'ownLanguage') continue;
  const parent = rawSkills.find((s) => s.id === Object.keys(GROUP_BY_ID).find((k) => GROUP_BY_ID[k] === group));
  const def = {
    key: group,
    id: parent?.id || group,
    name: meta.name,
    en: parent?.id || group,
    cat: meta.cat,
    base: group === 'fighting' || group === 'firearms' ? 0 : meta.base,
    spec: group,
    flags: ['spec'],
    slots: meta.slots,
  };
  if (parent?.spec) def.flags.push('specGroup');
  if (parent?.note) def.note = parent.note;
  skills.push(def);
}

// 母语：具名 + EDU 基础（保持单行，带语种输入）
skills.push({
  key: 'ownLanguage',
  id: 'Language (Own)',
  name: '母语',
  en: 'Language (Own)',
  cat: '语言',
  base: null,
  flags: ['edu', 'named'],
  note: '起始 = EDU；可花 10 点习得第二门母语',
});

specPresets.language = Object.fromEntries(LANGUAGES.map((zh) => [zh, 1]));
specPresets.religion = Object.fromEntries(RELIGIONS.map((zh) => [zh, 10]));
specPresets.ride = Object.fromEntries(RIDES.map((zh) => [zh, 5]));
for (const group of ['art', 'science']) {
  specPresets[group] = specPresets[group] || {};
  if (group === 'art') {
    Object.assign(specPresets[group], {
      文学: 5, 美术史: 5, 农业: 5, 技术制图: 5, 声乐: 5, 器乐: 5, 舞蹈: 5,
      烹饪: 5, 裁缝: 5, 打字: 5, 速记: 5, 木工: 5, 焊接: 5, 管道工: 5,
    });
  }
  if (group === 'science') Object.assign(specPresets[group], { 密码学: 1, 法医学: 1 });
}
specOptions.art = Object.keys(specPresets.art);
specOptions.fighting = Object.keys(specPresets.fighting);
specOptions.firearms = Object.keys(specPresets.firearms);
specOptions.science = Object.keys(specPresets.science);
specOptions.language = LANGUAGES;
specOptions.religion = RELIGIONS;
specOptions.ride = RIDES;

const SPEC_SLOTS = Object.fromEntries(Object.entries(GROUP_META).map(([g, m]) => [g, m.slots]));

skills.sort((a, b) => (a.cat < b.cat ? -1 : a.cat > b.cat ? 1 : 0));

const skillByKey = Object.fromEntries(skills.map((s) => [s.key, s]));
const skillByName = Object.fromEntries(skills.map((s) => [s.name, s]));

/* ------------------------------------------------------------------ *
 * 2. 职业：25 个包 → 引擎职业 shape（kind:'package'）
 * ------------------------------------------------------------------ */

const EN2ZH = {};
for (const s of rawSkills) EN2ZH[s.id] = s.zh;
Object.assign(EN2ZH, {
  'Art History': '美术史', 'Farming': '农业', 'Technical Drawing': '技术制图',
  'Literature': '文学', 'Acting': '表演', 'Singing': '声乐', 'Disguise': '乔装',
  'Horse': '马', 'Wagon': '马车',
});

const HEAD_ALIAS = {
  'Art': 'art',
  'Art/Craft': 'art',
  'Fighting': 'fighting',
  'Firearms': 'firearms',
  'Science': 'science',
  'Language': 'language',
  'Religion': 'religion',
  'Ride': 'ride',
};

const CHOICE_POOLS = {
  art: ['表演', '声乐', '舞蹈', '器乐', '绘画', '文学', '摄影', '烹饪', '书法', '雕塑'],
  language: LANGUAGES,
  religion: RELIGIONS,
  science: Object.keys(specPresets.science),
  ride: RIDES,
  fighting: Object.keys(specPresets.fighting),
  firearms: Object.keys(specPresets.firearms),
};

const parseEntry = (e) => {
  const token = String(e.skill || '').trim();
  const m = token.match(/^(.+?)\s*\((.+)\)$/);
  const head = (m ? m[1] : token).trim();
  const inner = (m ? m[2] : '').trim();
  const base = Number.isFinite(e.base) ? e.base : 0;
  const final = Number.isFinite(e.final) ? e.final : 0;
  const cost = Number.isFinite(e.cost) ? e.cost : Math.max(0, final - base);

  if (/^credit rating$/i.test(head)) {
    return { key: 'credit', label: '信用评级', base, final, cost };
  }
  const groupKey = HEAD_ALIAS[head];
  if (groupKey) {
    if (/choose/i.test(inner)) {
      let cands = CHOICE_POOLS[groupKey] || [];
      const named = inner.replace(/^choose\s*/i, '').split(/\s+or\s+/i).map((x) => EN2ZH[x.trim()] || x.trim()).filter(Boolean);
      if (!/a musical one/i.test(inner) && named.length && !/one$/i.test(inner)) cands = named;
      return { key: groupKey, label: '', base, final, cost, choose: cands };
    }
    const label = EN2ZH[inner] || inner;
    return { key: groupKey, label, base, final, cost };
  }
  const key = KEY_BY_ID[head];
  if (!key) return null;
  const label = inner ? EN2ZH[inner] || inner : '';
  return { key, label, base, final, cost };
};

const occupations = [];
const unknownOccTokens = [];

for (const o of rawOccs) {
  const entries = [];
  for (const e of o.skills || []) {
    const parsed = parseEntry(e);
    if (!parsed) { unknownOccTokens.push(`${o.en}: ${e.skill}`); continue; }
    entries.push(parsed);
  }
  const cr = entries.find((x) => x.key === 'credit')?.final ?? 0;
  const keys = [...new Set(entries.map((x) => x.key))];
  const occupation = {
    id: String(o.en).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    name: String(o.zh).replace(/\*$/, '').trim(),
    nameEn: String(o.en).replace(/\*$/, '').trim(),
    kind: 'package',
    total: Number.isFinite(o.total) ? o.total : (o.special === 'SPECIAL' ? null : entries.reduce((n, x) => n + x.cost, 0)),
    cr: [cr, cr],
    creditFixed: cr,
    attr: o.special === 'SPECIAL' ? '教授：固定 5 项 + 90 点学术专精池（其中一项须达 90%）' : `职业包 · 合计 ${Number.isFinite(o.total) ? o.total : 0} 点`,
    keys,
    choices: [],
    social: 0,
    free: 0,
    freePool: [],
    presets: {},
    desc: '',
    skillText: entries.map((x) => `${x.key === 'credit' ? '信用评级' : (skillByKey[x.key]?.name || x.key)}${x.label ? `（${x.label}）` : ''} ${x.final}%`).join('、'),
    note: o.special === 'SPECIAL' ? '原书特殊分配型职业，见 §1.4.3' : '',
    entries,
    special: o.special === 'SPECIAL'
      ? { points: 90, eligible: ['history', 'law', 'medicine', 'occult', 'science', 'language', 'accounting', 'anthropology', 'archaeology', 'psychology', 'psychoanalysis'], oneMustReach: 90 }
      : null,
    page: '',
  };
  occupations.push(occupation);
}

// 教授：补固定 5 项（书 §1.4.3）
const prof = occupations.find((o) => o.nameEn === 'Professor');
if (prof) {
  const fixed = [
    { key: 'credit', label: '信用评级', base: 0, final: 60, cost: 60 },
    { key: 'language', label: '任选', base: 1, final: 61, cost: 60 },
    { key: 'library', label: '图书馆使用', base: 20, final: 70, cost: 50 },
    { key: 'persuade', label: '说服', base: 10, final: 30, cost: 20 },
    { key: 'psychology', label: '心理学', base: 10, final: 30, cost: 20 },
  ].map((e) => ({ ...e, choose: e.key === 'language' ? LANGUAGES : undefined }));
  prof.entries = [...fixed, ...prof.entries];
  prof.keys = [...new Set(prof.entries.map((x) => x.key))];
  prof.total = 300; // 固定 5 项 210 点 + 90 点学术专精池
  prof.creditFixed = 60;
  prof.cr = [60, 60];
  prof.skillText = '信用评级 60%、外语（任选）61%、图书馆使用 70%、说服 30%、心理学 30%，另 90 点学术专精（其中一项须达 90%）';
}

const occupationById = Object.fromEntries(occupations.map((o) => [o.id, o]));

/* ------------------------------------------------------------------ *
 * 3. 武器：8 张表 106 件
 * ------------------------------------------------------------------ */

const W_SKILL = {
  '投掷': { key: 'throw', label: '' },
  '炮术': { key: 'artillery', label: '' },
  '爆破': { key: 'demolitions', label: '' },
  '电气维修': { key: 'elecRepair', label: '' },
};

const W_LABEL_FIX = {
  '矛': '长矛', '步枪': '步枪/霰弹枪', '霰弹枪': '步枪/霰弹枪', '剑': '剑',
};

const parseWeaponSkill = (text) => {
  const t = String(text || '').trim();
  if (W_SKILL[t]) return { ...W_SKILL[t], raw: t };
  const m = t.match(/^格斗[（(]\s*(.+?)\s*[)）]$/);
  if (m) return { key: 'fighting', label: W_LABEL_FIX[m[1]] || m[1], raw: t };
  const f = t.match(/^射击[（(]\s*(.+?)\s*[)）]$/);
  if (f) return { key: 'firearms', label: W_LABEL_FIX[f[1]] || f[1], raw: t };
  return { key: '', label: '', raw: t };
};

const splitPrice = (s) => {
  const t = String(s || '').trim();
  if (!t || t === 'N/A') return { p1920: '', pModern: '' };
  const parts = t.split('/');
  if (parts.length === 1) return { p1920: parts[0], pModern: parts[0] };
  return { p1920: parts[0], pModern: parts[1] };
};

const weapons = [];
const unknownWeaponSkills = [];
const rows = Array.isArray(rawWeapons) ? rawWeapons : rawWeapons.weapons || [];
for (const r of rows) {
  const c = r.cells || [];
  const name = String(c[0] || '').trim();
  if (!name) continue;
  const sk = parseWeaponSkill(c[1]);
  if (!sk.key) unknownWeaponSkills.push(`${r.table}: ${c[1]}`);
  const price = splitPrice(c[8]);
  const eraText = String(c[9] || '').trim();
  const eras = ['1920s', '现代'].filter((e) => !eraText || eraText.includes(e) || (!eraText.includes('1920s') && !eraText.includes('现代')));
  weapons.push({
    name,
    skill: sk.label ? `${skillByKey[sk.key]?.name || sk.raw}（${sk.label}）` : (skillByKey[sk.key]?.name || sk.raw),
    skillKey: sk.key,
    skillLabel: sk.label,
    damage: String(c[2] || '').trim(),
    impale: String(c[3] || '').trim(),
    range: String(c[4] || '').trim(),
    attacks: String(c[5] || '').trim(),
    ammo: String(c[6] || '').trim(),
    malfunction: String(c[7] || '').trim(),
    price1920: price.p1920,
    priceModern: price.pModern,
    eras,
    table: r.table || '',
    category: r.category || '',
    note: eraText,
  });
}

const weaponByName = Object.fromEntries(weapons.map((w) => [w.name, w]));

/* ------------------------------------------------------------------ *
 * 4. 输出
 * ------------------------------------------------------------------ */

const HDR = `// 由 tools/gen-kpcp-data.mjs 生成，请勿手工修改。
// 数据来源：守密人伴侣扩展/_rules-draft/data/{skills,occupations}.json 与 PDF 表 7–14；
// 生成命令：node tools/gen-kpcp-data.mjs（--check 只校验不写盘）
`;

const j = (v) => JSON.stringify(v, null, 2);
const parts = [
  HDR,
  `export const KPCP_SKILLS = ${j(skills)};`,
  `export const KPCP_SKILL_BY_KEY = ${j(skillByKey)};`,
  `export const KPCP_SKILL_BY_NAME = ${j(skillByName)};`,
  `export const KPCP_SPEC_SLOTS = ${j(SPEC_SLOTS)};`,
  `export const KPCP_SPEC_PRESETS = ${j(specPresets)};`,
  `export const KPCP_SPEC_OPTIONS = ${j(specOptions)};`,
  `export const KPCP_LANGUAGES = ${j(LANGUAGES)};`,
  `export const KPCP_RELIGIONS = ${j(RELIGIONS)};`,
  `export const KPCP_RIDES = ${j(RIDES)};`,
  `export const KPCP_OCCUPATIONS = ${j(occupations)};`,
  `export const KPCP_OCCUPATION_BY_ID = ${j(occupationById)};`,
  `export const KPCP_WEAPONS = ${j(weapons)};`,
  `export const KPCP_WEAPON_BY_NAME = ${j(weaponByName)};`,
  `export const KPCP_TERMS = ${j({
    temporary: '震骇',
    indefinite: '异变',
    permanent: '永失',
    madness: '妄想',
    sanity: '理智',
    note: '伴侣版把临时性疯狂称震骇、不定性疯狂称异变、永久性疯狂称永失；意志归零后称妄想。所有术语只在 kpcp 规则内替换。',
  })};`,
  `export const KPCP_DATA_REPORT = ${j({
    counts: {
      skills: skills.length,
      groups: Object.keys(GROUP_META).length,
      occupations: occupations.length,
      weapons: weapons.length,
    },
    unknownSkills,
    unknownOccTokens,
    unknownWeaponSkills,
  })};`,
];

const text = parts.join('\n\n') + '\n';

const problems = [...unknownSkills, ...unknownOccTokens, ...unknownWeaponSkills];
console.log('技能', skills.length, '（专攻组', Object.keys(GROUP_META).length, '）');
console.log('职业', occupations.length, '职业包合计异常：', occupations.filter((o) => o.total !== null && o.total !== 300 && o.kind === 'package').map((o) => `${o.name}=${o.total}`).join(', ') || '无');
console.log('武器', weapons.length);
if (problems.length) {
  console.error('未解析：');
  for (const p of problems) console.error(' -', p);
  process.exitCode = 1;
}

if (CHECK) {
  console.log('--check：仅校验，不写盘');
} else {
  fs.writeFileSync(OUT, text);
  console.log('已写入', path.relative(ROOT, OUT), text.length, 'bytes');
}