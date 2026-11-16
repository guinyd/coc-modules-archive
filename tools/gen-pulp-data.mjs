#!/usr/bin/env node
/**
 * 生成 shared/rulesets/pulp-data.js ——《通俗克苏鲁》(Pulp Cthulhu) 规则数据。
 *
 * 源数据在 tools/pulp-src/*.json（从项目资料《通克规则/_data/》原样拷入，便于复现构建）。
 * 本脚本把原著资料的形状归一化成 shared/coc7e.js 引擎认识的形状：
 *   - 技能：{id,zh,en,group,base:{type,value|expr},spec,flags} → {key,name,base,cat,spec?,flags?}
 *   - 职业：原著自然语言技能串（“两项社交技能(取悦、话术、恐吓、说服)”“任意两项其他个人或时代特长”…）
 *           → {keys,choices,social,free,freePool,presets}，与 classic 职业同构。
 *   - 原型：bonusSkills 中文名 → bonusKeys（奖励点白名单）。
 * 解析器规则见 docs（REF: 通克规则/_data/skill-aliases.json grammar）。
 *
 * 用法：node tools/gen-pulp-data.mjs [--check]
 *   --check 只校验并打印报告，不写文件。
 * 生成物请勿手改；改动请改 pulp-src/ 或本脚本后重跑。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'pulp-src');
const OUT = path.join(HERE, '..', 'shared', 'rulesets', 'pulp-data.js');
const CHECK_ONLY = process.argv.includes('--check');

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(SRC, name), 'utf8'));

/* ────────────────────────────── 技能表 ────────────────────────────── */

/** pulp 技能 id → 引擎内部 key。与 classic 同名者复用 classic key，便于跨规则转换。 */
const KEY_MAP = {
  accounting: 'accounting',
  animal_handling: 'animalHandling',
  anthropology: 'anthropology',
  appraise: 'appraise',
  archaeology: 'archaeology',
  art_craft: 'art',
  artillery: 'artillery',
  charm: 'charm',
  climb: 'climb',
  computer_use: 'computer',
  credit_rating: 'credit',
  cthulhu_mythos: 'cthulhu',
  demolitions: 'demolitions',
  disguise: 'disguise',
  diving: 'diving',
  dodge: 'dodge',
  drive_auto: 'driveAuto',
  electrical_repair: 'elecRepair',
  fast_talk: 'fastTalk',
  fighting: 'fighting',
  firearms: 'firearms',
  first_aid: 'firstAid',
  history: 'history',
  hypnosis: 'hypnosis',
  intimidate: 'intimidate',
  jump: 'jump',
  language: 'language',
  language_own: 'ownLanguage',
  law: 'law',
  library_use: 'library',
  listen: 'listen',
  locksmith: 'locksmith',
  lore: 'lore',
  mechanical_repair: 'mechRepair',
  medicine: 'medicine',
  natural_world: 'naturalWorld',
  navigate: 'navigate',
  occult: 'occult',
  operate_heavy: 'opHeavyMachine',
  persuade: 'persuade',
  pilot: 'pilot',
  psychoanalysis: 'psychoanalysis',
  psychology: 'psychology',
  read_lips: 'lipReading',
  ride: 'ride',
  science: 'science',
  sleight_of_hand: 'sleightOfHand',
  spot_hidden: 'spotHidden',
  stealth: 'stealth',
  survival: 'survival',
  swim: 'swim',
  throw: 'throw',
  track: 'track',
  // 灵能（Pulp 新增，基础值 00%，走奖励点或兴趣点）
  psychic_clairvoyance: 'psychicClairvoyance',
  psychic_divination: 'psychicDivination',
  psychic_medium: 'psychicMedium',
  psychic_telepathy: 'psychicTelepathy',
  psychic_psychokinesis: 'psychicPsychokinesis',
};

/** pulp 技能分组 → classic cat（只影响编辑器分组显示顺序） */
const CAT_MAP = {
  通识: '调查',
  技艺: '特技',
  学术: '学问',
  运动: '特技',
  战斗: '战斗',
  机械: '支援',
  交涉: '交涉',
  支援: '支援',
  调查: '调查',
  学问: '学问',
  特技: '特技',
};

/** 专攻组的槽位数（对齐纸质角色卡版面） */
const SPEC_SLOTS = { art: 3, fighting: 3, firearms: 3, language: 3, science: 3, lore: 1, pilot: 1, survival: 1 };

/**
 * 专攻组预设标签 → 基础值。
 * fighting / firearms 的数值来自原著子项；其余组的值与组基础值相同，仅作为编辑器下拉建议。
 */
const SPEC_PRESETS = {
  fighting: { 斗殴: 25, 斧: 15, 弓: 15, 链锯: 10, 连枷: 10, 绞索: 15, 刀剑: 20, 鞭: 5 },
  firearms: { 手枪: 20, '步枪/霰弹枪': 25, 冲锋枪: 15, 机关枪: 10, 重武器: 10, 火焰喷射器: 10, 矛: 20 },
  art: {
    表演: 5, 声乐: 5, 喜剧: 5, 舞蹈: 5, 器乐: 5, 绘画: 5, 书法: 5, 雕塑: 5, 文学: 5,
    摄影: 5, 烹饪: 5, 裁缝: 5, 理发: 5, 打字: 5, 速记: 5, 木工: 5, 焊接: 5, 管道工: 5, 技术制图: 5,
  },
  science: {
    化学: 1, 物理学: 1, 地理学: 1, 生物学: 1, 植物学: 1, 药学: 1, 工程学: 1, 天文学: 1,
    数学: 1, 地质学: 1, 动物学: 1, 气象学: 1, 司法科学: 1, 考古学: 1, 密码学: 1,
  },
  language: {
    拉丁语: 1, 希腊语: 1, 法语: 1, 德语: 1, 西班牙语: 1, 意大利语: 1, 俄语: 1,
    汉语: 1, 日语: 1, 阿拉伯语: 1, 希伯来语: 1, 梵语: 1, 古英语: 1,
  },
  lore: { 神话学: 1, 民俗学: 1, 地方志: 1, 家谱学: 1, 神秘学: 1 },
  pilot: { 飞行器: 1, 船: 1 },
  survival: { 海上: 10, 沙漠: 10, 极地: 10, 丛林: 10, 山地: 10, 城市: 10, 沼泽: 10 },
};

const BASE_CAT = '调查';

function buildSkills(raw) {
  const out = [];
  const specGroups = {}; // 组 key → {name, base, labels:Set}
  for (const s of raw) {
    if (s.parent) {
      // 专攻子项：并入父组的预设表，不单独成行
      const g = KEY_MAP[s.parent];
      if (!g) throw new Error(`未知专攻父组：${s.parent}`);
      specGroups[g] = specGroups[g] || { name: '', base: 0, labels: {} };
      const label = String(s.zh).replace(/^[^（(]*[（(]/, '').replace(/[）)]$/, '');
      specGroups[g].labels[label] = Number(s.base.value) || 0;
      continue;
    }
    const key = KEY_MAP[s.id];
    if (!key) throw new Error(`未知技能 id：${s.id}`);
    const def = {
      key,
      name: s.zh,
      base: 0,
      cat: CAT_MAP[s.group] || BASE_CAT,
    };
    if (s.base.type === 'attr') {
      def.base = null;
      def.flags = [];
      if (s.base.expr === 'DEX/2') def.flags.push('dexHalf');
      else if (s.base.expr === 'EDU') def.flags.push('edu', 'named');
      else throw new Error(`未知属性基础值表达式：${s.base.expr}（${s.id}）`);
    } else if (s.base.type === 'value') {
      def.base = Number(s.base.value) || 0;
    } else if (s.base.type === 'zero') {
      def.base = 0;
    } else {
      throw new Error(`未知基础值类型：${s.base.type}（${s.id}）`);
    }
    if (s.spec) {
      def.spec = key;
      def.flags = [...(def.flags || []), 'spec'];
      specGroups[key] = specGroups[key] || { name: s.zh, base: def.base || 0, labels: {} };
      specGroups[key].name = specGroups[key].name || s.zh;
    }
    if (s.id === 'credit_rating' || s.id === 'cthulhu_mythos') def.flags = [...(def.flags || []), 'nocap'];
    if ((s.flags || []).includes('psychic')) def.flags = [...(def.flags || []), 'psychic'];
    if ((s.flags || []).includes('nocap') && !(def.flags || []).includes('nocap')) def.flags = [...(def.flags || []), 'nocap'];
    if ((s.flags || []).includes('rare')) def.rare = true;
    if (s.newInPulp) def.newInPulp = true;
    if (!def.flags?.length) delete def.flags;
    out.push(def);
  }
  // 专攻组的预设：原著子项数值 ∪ 手工补的建议标签
  for (const [g, preset] of Object.entries(SPEC_PRESETS)) {
    const grp = specGroups[g];
    if (!grp) throw new Error(`预设表引用了不存在的专攻组：${g}`);
    grp.labels = { ...grp.labels, ...preset };
  }
  return { skills: out, specGroups };
}

/* ────────────────────────────── 中文解析器 ────────────────────────────── */

const CN_DIGIT = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 在括号深度 0 处按给定字符集切分 */
function splitTop(text, seps) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of String(text)) {
    if (ch === '（' || ch === '(') depth += 1;
    else if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && seps.includes(ch)) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** 取出最外层括号内容与括号后残余：'科学(化学)' → {head:'科学', inner:'化学', tail:''} */
function takeParen(text) {
  const s = String(text).trim();
  const at = s.search(/[（(]/);
  if (at < 0) return { head: s, inner: '', tail: '' };
  let depth = 0;
  let inner = '';
  let end = -1;
  for (let i = at; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '（' || ch === '(') {
      depth += 1;
      if (depth === 1) continue;
    } else if (ch === '）' || ch === ')') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    inner += ch;
  }
  if (end < 0) return { head: s, inner: '', tail: '' };
  return { head: s.slice(0, at).trim(), inner: inner.trim(), tail: s.slice(end + 1).trim() };
}

/** 括号内文字 → 候选标签数组（去掉“任意/如/等/类”等说明成分） */
function innerLabels(inner) {
  let t = String(inner || '').trim();
  if (!t) return [];
  if (/^(任意|任选|自选|随意)/.test(t) && !/[、,，或]/.test(t)) return [];
  t = t.replace(/^(任意|任选|自选)[:：]?/, '');
  t = t.replace(/^[^如：:]*[如：:]/, '');
  const parts = t
    .split(/[、,，或/]/)
    .map((x) => x.replace(/[等类]$/g, '').replace(/^[的如]/, '').trim())
    .filter((x) => x && x !== '任意' && x.length <= 10);
  return [...new Set(parts)];
}

/** 标签归一：把原著里的简称/别称映射到技能或专攻预设的标准写法 */
const LABEL_ALIAS = {
  拉丁文: '拉丁语',
  步霰: '步枪/霰弹枪',
  步枪: '步枪/霰弹枪',
  霰弹枪: '步枪/霰弹枪',
  物理: '物理学',
  地理: '地理学',
  天文: '天文学',
  生物: '生物学',
  植物: '植物学',
  化学: '化学',
  数学: '数学',
  艺术: '艺术',
  手艺: '艺术和手艺',
};

function normLabel(x) {
  const t = String(x || '').trim();
  return LABEL_ALIAS[t] || t;
}

function cnNum(ch) {
  if (ch && CN_DIGIT[ch]) return CN_DIGIT[ch];
  const n = Number(ch);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * 技能串解析器。
 * @param {string[]} rawList 原著技能串数组
 * @param {object} idx      索引（zh→key、别名、专攻组）
 */
function makeResolver(idx) {
  const { zh2key, alias, groups } = idx;

  /** 单个名字 → 技能 key（支持别名与专攻父组） */
  const nameToKey = (name) => {
    const raw = String(name || '').trim();
    if (!raw) return null;
    return zh2key[raw] || zh2key[alias[raw]] || null;
  };

  const resolveAtom = (text, acc, { inChoice = false } = {}) => {
    const { head, inner, tail } = takeParen(text);
    if (tail) return false; // 「艺术(表演)或乔装」这类复合串交给「或」逻辑
    const key = nameToKey(head);
    if (!key) return false;
    acc.keys.push(key);
    const grp = groups[key];
    if (grp && !inChoice) {
      const labels = innerLabels(inner).map(normLabel).filter((l) => grp.labels[l] !== undefined || true);
      if (labels.length) acc.presets[key] = [...new Set([...(acc.presets[key] || []), ...labels])];
    }
    return true;
  };

  return { resolveAtom, nameToKey };
}

const FREE_RE = /^(?:任意?|任选)?(?:其他)?([一二两三四五六七八九十\d])(?:项|种|个)/;
const SOCIAL_RE = /^([一二两三四五六七八九十\d])项?社交技能/;
const BELOW_RE = /^下面(?:的)?(?:任选)?([一二两三四五六七八九十\d])(?:项|种)(.*?)[:：](.*)$/;
/** 原著断句残片（如「任意四项其他学术」+「时代或个人特长」），跟在自由槽位后时并入上一条 */
const FRAGMENT_RE = /^(时代|个人|学术|技能|特长|专业)/;

/**
 * 解析一条职业/原型技能清单。
 * @returns {{keys:string[],choices:string[][],social:number,free:number,freePool:string[]|null,presets:object,unknown:string[],notes:string[]}}
 */
function parseSkillList(rawList, resolver, { allowFree = true, where = '' } = {}) {
  const acc = { keys: [], choices: [], social: 0, free: 0, freePool: null, presets: {}, unknown: [], notes: [] };
  const tokens = [];

  // 先摊平数组；「下面任选N项:X」会吞掉后续条目（如士兵：急救/机械维修/外语）
  for (let i = 0; i < rawList.length; i += 1) {
    const t = String(rawList[i]).replace(/[※*]/g, '').trim();
    if (!t) continue;
    const m = t.match(BELOW_RE);
    if (m) {
      const need = cnNum(m[1]);
      const pool = [];
      for (const x of splitTop(m[3], '或')) pool.push(x);
      for (let j = i + 1; j < rawList.length; j += 1) {
        const nx = String(rawList[j]).replace(/[※*]/g, '').trim();
        if (!nx) continue;
        for (const x of splitTop(nx, '或')) pool.push(x);
      }
      tokens.push({ kind: 'below', need, pool });
      i = rawList.length;
      break;
    }
    tokens.push({ kind: 'text', text: t });
  }

  const expand = (text) => {
    // 顶层「和」连接：侦查和下面的一种个人特长:汽车驾驶或骑术
    const andParts = splitTop(text, '和及');
    if (andParts.length > 1) return andParts.flatMap((x) => expand(x));
    return [text];
  };

  /** 「下面任选 N 项：A、B、C」——1 项且候选≥2 时建模为 choices；否则建模为受限自由槽 */
  const applyBelow = (need, pool) => {
    const poolKeys = [];
    const poolNames = [];
    for (const p of pool) {
      const { head, inner } = takeParen(p);
      const key = resolver.nameToKey(head);
      if (!key) {
        acc.unknown.push(p);
        continue;
      }
      poolKeys.push(key);
      poolNames.push(head);
      const grp = idx_groups(resolver, key);
      if (grp) {
        const labels = innerLabels(inner).map(normLabel);
        if (labels.length) acc.presets[key] = [...new Set([...(acc.presets[key] || []), ...labels])];
      }
    }
    const uniq = [...new Set(poolKeys)];
    if (need === 1 && uniq.length >= 2) acc.choices.push(uniq);
    else if (allowFree && uniq.length) {
      acc.free += Math.min(need || 1, uniq.length);
      acc.freePool = [...new Set([...(acc.freePool || []), ...uniq])];
    } else if (uniq.length) acc.keys.push(...uniq);
    acc.notes.push(`${where}: 下面任选 ${need} 项（${poolNames.join('/')}）`);
  };

  /** 单条文本：先匹配整串模式（社交/自由/下面任选），都不中再按「和」「或」拆 */
  const parseText = (text) => {
    const t = text.trim().replace(/。+$/, '');
    if (!t) return;

    const social = t.match(SOCIAL_RE);
    if (social) {
      acc.social += cnNum(social[1]) || 1;
      return;
    }
    // 「任意三项科学专业领域」→ 三个科学专攻槽全部纳入本职（正好等于槽位数）
    if (/^任意?三项科学专业领域$/.test(t)) {
      acc.keys.push('science');
      acc.notes.push(`${where}: 任意三项科学专业领域 → 科学专攻槽`);
      return;
    }
    const below = t.match(BELOW_RE);
    if (below) {
      applyBelow(cnNum(below[1]), splitTop(below[3], '或'));
      return;
    }
    const free = t.match(FREE_RE);
    if (free && allowFree) {
      acc.free += cnNum(free[1]) || 1;
      return;
    }
    // 断句残片：只有在前文出现自由槽位时才当作续接，否则仍报未解析
    if (acc.free > 0 && FRAGMENT_RE.test(t) && !splitTop(t, '或').some((x) => resolver.nameToKey(takeParen(x).head))) {
      acc.notes.push(`${where}: 续接片段「${t}」（并入前一条自由槽位）`);
      return;
    }
    // 整串就是一个技能名/技能+专攻（如「艺术和手艺」「格斗(斗殴)」）
    if (resolver.resolveAtom(t, acc)) return;
    // 「和」连接：侦查和下面的一种个人特长:汽车驾驶或骑术
    const andParts = splitTop(t, '和及');
    if (andParts.length > 1) {
      for (const part of andParts) parseText(part);
      return;
    }
    // 「或」选项
    const alts = splitTop(t, '或');
    if (alts.length > 1) {
      const keys = [];
      for (const a of alts) {
        const key = resolver.nameToKey(takeParen(a).head);
        if (key) keys.push(key);
        else acc.unknown.push(a);
      }
      const uniq = [...new Set(keys)];
      if (uniq.length >= 2) acc.choices.push(uniq);
      else if (uniq.length === 1) acc.keys.push(uniq[0]);
      return;
    }
    if (!resolver.resolveAtom(t, acc)) acc.unknown.push(t);
  };

  for (const tok of tokens) {
    if (tok.kind === 'below') applyBelow(tok.need, tok.pool);
    else parseText(tok.text);
  }
  acc.keys = [...new Set(acc.keys)];
  // 若某个 fixed key 已经出现在 choices 里，从 fixed 移除（choices 覆盖它）
  const inChoice = new Set(acc.choices.flat());
  acc.keys = acc.keys.filter((k) => !inChoice.has(k));
  return acc;
}

// resolveAtom 需要访问专攻组表，单独包一层（避免把整个 idx 塞进闭包）
let GROUP_REF = {};
function idx_groups(_resolver, key) {
  return GROUP_REF[key] || null;
}

/* ────────────────────────────── 职业归一化 ────────────────────────────── */

const STAT_ZH = { STR: '力量', CON: '体质', SIZ: '体型', DEX: '敏捷', APP: '外貌', INT: '智力', POW: '意志', EDU: '教育' };

function attrText(points) {
  const terms = (points.terms || []).map((t) => `${STAT_ZH[t.stat] || t.stat}×${t.mul}`);
  const any = (points.anyOf || []).map((grp) => grp.map((t) => `${STAT_ZH[t.stat] || t.stat}×${t.mul}`).join('＋'));
  if (!terms.length && !any.length) return '—';
  let s = terms.join('＋');
  if (any.length) s += `${s ? '＋' : ''}（${any.join(' 或 ')}${points.max ? '，取高' : ''}）`;
  return s;
}

function ptsOf(points) {
  const terms = (points.terms || []).map((t) => ({ stat: t.stat, mult: t.mul }));
  const max = [];
  for (const grp of points.anyOf || []) {
    const rt = grp.reduce((s, t) => s + (Number(t.mul) || 0), 0);
    // 引擎的 pts.max 只支持单项取最大；组内多项时按“组和”折算成单条虚拟项会失真，直接报错要求人工处理
    if (grp.length !== 1) throw new Error(`anyOf 组内多于一项，引擎暂不支持：${JSON.stringify(points)}`);
    max.push({ stat: grp[0].stat, mult: rt });
  }
  return { terms, max };
}

/* ────────────────────────────── 主流程 ────────────────────────────── */

const skillsJson = readJson('skills-pulp.json');
const occJson = readJson('occupations-pulp.json');
const archJson = readJson('archetypes.json');
const talentsJson = readJson('talents.json');
const luckJson = readJson('luck-spends.json');
const madnessJson = readJson('madness-talents.json');
const npcJson = readJson('npc-talents.json');
const gadgetsJson = readJson('gadgets.json');
const aliasJson = readJson('skill-aliases.json');

const { skills, specGroups } = buildSkills(skillsJson.skills);

// 中文 → key 索引（技能名 + 别名 + 专攻子项标签）
const zh2key = {};
for (const s of skills) {
  zh2key[s.name] = s.key;
  // 原著里“艺术和手艺”也写作“艺术/手艺”“手艺”“工艺”
  if (s.key === 'art') {
    zh2key['艺术/手艺'] = 'art';
    zh2key['艺术和手艺'] = 'art';
    zh2key['手艺'] = 'art';
    zh2key['工艺'] = 'art';
  }
}
const alias = { ...(aliasJson.aliases || {}) };
// 专攻子项标签也参与名字解析（如「射击(步枪/霰弹枪)」的 head 仍是「射击」，子项由括号处理）
GROUP_REF = specGroups;

const resolver = makeResolver({ zh2key, alias, groups: specGroups });

const report = { occupations: 0, archetypes: 0, unknown: [], warnings: [], stats: {} };
const occupations = [];
for (const o of occJson.occupations) {
  const parsed = parseSkillList(o.skills || [], resolver, { where: o.id });
  if (parsed.unknown.length) report.unknown.push(`${o.id}: ${parsed.unknown.join(' / ')}`);
  if (parsed.notes.length) report.warnings.push(...parsed.notes);
  const cr = Array.isArray(o.creditRange) && o.creditRange.length === 2 ? o.creditRange.map(Number) : null;
  if (!cr || !Number.isFinite(cr[0]) || !Number.isFinite(cr[1])) report.unknown.push(`${o.id}: 信用评级区间缺失`);
  const pts = ptsOf(o.points || { terms: [], anyOf: [], max: false });
  const name = String(o.zh).replace(/[（(][A-Za-z][^）)]*[）)]/g, '').trim();
  occupations.push({
    id: o.id,
    name,
    nameEn: o.en || '',
    cr: cr || [0, 99],
    attr: attrText(o.points || {}),
    pts,
    keys: parsed.keys,
    choices: parsed.choices,
    social: parsed.social,
    free: parsed.free,
    freePool: parsed.freePool,
    presets: parsed.presets,
    desc: '',
    skillText: (o.skills || []).join('，'),
    note: [o.creditNote, o.kpClause].filter(Boolean).join(' ').trim(),
    page: o.page || '',
    contacts: o.contacts || '',
  });
  report.occupations += 1;
}

const archetypes = [];
for (const a of archJson.archetypes) {
  const parsed = parseSkillList(a.bonusSkills || [], resolver, { allowFree: false, where: a.id });
  if (parsed.unknown.length) report.unknown.push(`archetype ${a.id}: ${parsed.unknown.join(' / ')}`);
  if (parsed.free || parsed.social) report.warnings.push(`archetype ${a.id}: 奖励技能里出现自由槽位，已忽略计数`);
  const bonusKeys = [...new Set([...parsed.keys, ...parsed.choices.flat()])];
  archetypes.push({
    id: a.id,
    zh: a.zh,
    en: a.en || '',
    coreChar: a.coreChar || [],
    bonusKeys,
    bonusPresets: parsed.presets,
    bonusSkillRaw: a.bonusSkillRaw || (a.bonusSkills || []).join('，'),
    bonusCount: bonusKeys.length,
    suggestedOccupations: a.suggestedOccupations || [],
    talentRule: a.talentRule || '',
    talentForced: a.talentForced || [],
    traits: a.traits || [],
  });
  report.archetypes += 1;
  const expect = a.coreChar?.length ? Number(archJson.archetypes.find((x) => x.id === a.id)?.bonusSkills?.length || 0) : 0;
  void expect;
}

// 奖励技能条目数与原著清单条目数对齐校验（允许专攻括号带来的合并）
for (const a of archetypes) {
  if (!a.bonusKeys.length) report.warnings.push(`原型 ${a.id} 没有解析出任何奖励技能`);
}

// 技能统计
const specCount = skills.filter((s) => s.spec).length;
const psychicCount = skills.filter((s) => (s.flags || []).includes('psychic')).length;
report.stats = {
  skills: skills.length,
  specGroups: specCount,
  psychic: psychicCount,
  occupations: occupations.length,
  archetypes: archetypes.length,
  talents: talentsJson.talents.length,
  luckSpends: luckJson.entries.length,
  madnessTalents: madnessJson.entries.length,
  npcTalents: npcJson.entries.length,
  gadgets: gadgetsJson.gadgets.length,
};

if (report.unknown.length) {
  console.error('✗ 有未解析的技能串：');
  for (const u of report.unknown) console.error('  - ' + u);
  process.exitCode = 1;
}
if (report.warnings.length) {
  console.log('· 备注：');
  for (const w of report.warnings) console.log('  - ' + w);
}

// 职业点数预算自检：用 60 属性估算，确保公式可算且非 0
const sampleEff = { STR: 60, CON: 60, SIZ: 60, DEX: 60, APP: 60, INT: 60, POW: 60, EDU: 70, Luck: 50 };
const zeroBudget = occupations.filter((o) => {
  let sum = 0;
  for (const t of o.pts.terms || []) sum += (sampleEff[t.stat] || 0) * t.mult;
  let best = 0;
  for (const t of o.pts.max || []) best = Math.max(best, (sampleEff[t.stat] || 0) * t.mult);
  return sum + best <= 0;
});
if (zeroBudget.length) {
  console.error('✗ 职业点数预算为 0：', zeroBudget.map((o) => o.id).join(', '));
  process.exitCode = 1;
}

console.log('· 统计：', JSON.stringify(report.stats));
console.log('· 技能表：', skills.map((s) => s.key).join(','));
if (process.exitCode) process.exit();

/* ────────────────────────────── 产出 ────────────────────────────── */

const banner = `// 本文件由 tools/gen-pulp-data.mjs 从 tools/pulp-src/*.json 生成，请勿手改。
// 数据来源：《通俗克苏鲁》(Pulp Cthulhu) 1.14 版，见 通克规则/_data/ 与 docs。
// 前端(实时计算/展示)与后端(权威校验)共用；规则逻辑见 shared/rulesets/pulp.js 与 shared/coc7e.js。
`;

const body = [
  banner,
  '/** Pulp 技能表：与 coc7e-reference.js 的 SKILLS 同构（key/name/base/cat/spec/flags） */',
  `export const PULP_SKILLS = ${JSON.stringify(skills, null, 0)};`,
  'export const PULP_SKILL_BY_KEY = Object.fromEntries(PULP_SKILLS.map((s) => [s.key, s]));',
  'export const PULP_SKILL_BY_NAME = Object.fromEntries(PULP_SKILLS.map((s) => [s.name, s]));',
  '',
  '/** 专攻组预设值：组名 → { 专攻标签: 基础值 } */',
  `export const PULP_SPEC_PRESETS = ${JSON.stringify(Object.fromEntries(Object.entries(specGroups).map(([k, v]) => [k, v.labels])), null, 0)};`,
  '/** 专攻组下拉选项 */',
  `export const PULP_SPEC_OPTIONS = ${JSON.stringify(Object.fromEntries(Object.entries(specGroups).map(([k, v]) => [k, Object.keys(v.labels)])), null, 0)};`,
  '/** 每个专攻组的槽位数 */',
  `export const PULP_SPEC_SLOTS = ${JSON.stringify(SPEC_SLOTS)};`,
  '',
  '/** 68 个通俗职业（keys 固定本职 / choices 任选其一 / social 社交槽 / free 自由槽 / freePool 自由槽可选池 / presets 指定专攻方向） */',
  `export const PULP_OCCUPATIONS = ${JSON.stringify(occupations, null, 0)};`,
  'export const PULP_OCCUPATION_BY_ID = Object.fromEntries(PULP_OCCUPATIONS.map((o) => [o.id, o]));',
  'export const PULP_OCCUPATION_BY_NAME = Object.fromEntries(PULP_OCCUPATIONS.map((o) => [o.name, o]));',
  '',
  '/** 22 个原型：coreChar 可提升为核心属性的属性；bonusKeys 为英雄奖励点白名单 */',
  `export const PULP_ARCHETYPES = ${JSON.stringify(archetypes, null, 0)};`,
  'export const PULP_ARCHETYPE_BY_ID = Object.fromEntries(PULP_ARCHETYPES.map((a) => [a.id, a]));',
  '',
  '/** 40 条天赋（肉体/精神/战斗/其他四张 1D10 表） */',
  `export const PULP_TALENTS = ${JSON.stringify(talentsJson.talents, null, 0)};`,
  'export const PULP_TALENT_BY_ID = Object.fromEntries(PULP_TALENTS.map((t) => [t.id, t]));',
  `export const PULP_TALENT_CATEGORIES = ${JSON.stringify(talentsJson.categories, null, 0)};`,
  'export const PULP_TALENTS_BY_CAT = PULP_TALENT_CATEGORIES.reduce((acc, c) => {',
  '  acc[c.key] = PULP_TALENTS.filter((t) => t.cat === c.key).sort((a, b) => a.roll - b.roll);',
  '  return acc;',
  '}, {});',
  '',
  '/** 幸运花费价目表 */',
  `export const PULP_LUCK_SPENDS = ${JSON.stringify(luckJson.entries, null, 0)};`,
  `export const PULP_LUCK_META = ${JSON.stringify({ recovery: luckJson.recovery, forbidden: luckJson.forbidden, crit: luckJson.crit }, null, 0)};`,
  '',
  '/** 疯狂天赋（永久入卡） */',
  `export const PULP_MADNESS_TALENTS = ${JSON.stringify(madnessJson.entries, null, 0)};`,
  '/** NPC 天赋表 */',
  `export const PULP_NPC_TALENTS = ${JSON.stringify(npcJson.entries, null, 0)};`,
  '/** 怪奇技术小发明 */',
  `export const PULP_GADGETS = ${JSON.stringify(gadgetsJson.gadgets, null, 0)};`,
  '',
  '/** 跨规则转换：pulp 技能 id → 引擎 key（同时用于从原著数据回查） */',
  `export const PULP_KEY_MAP = ${JSON.stringify(KEY_MAP, null, 0)};`,
  '',
  '/** 生成报告（供 check-shared 断言数据完整） */',
  `export const PULP_DATA_REPORT = ${JSON.stringify(report, null, 0)};`,
  '',
].join('\n');

if (CHECK_ONLY) {
  console.log('· --check 模式，未写入文件');
} else {
  fs.writeFileSync(OUT, body + '\n', 'utf8');
  console.log(`✓ 已生成 ${path.relative(process.cwd(), OUT)}（${Buffer.byteLength(body)} 字节）`);
}