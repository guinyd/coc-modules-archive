/**
 * 骰娘机器人导入指令 —— 与官方车卡 Excel「简化卡 骰娘导入」同格式。
 *
 * 生成形如：
 *   .st 力量50str50敏捷60dex60意志55pow55体质50con50外貌65app65教育70edu70体型60siz60
 *      智力60灵感60int60san55san值55理智55理智值55幸运45运气45mp11魔法11hp12体力12
 *      会计5侦查25... &DB=0 体格:0 闪避:30 护甲:无 &点38左轮=1D10
 *
 * 四种骰娘的前缀不同（见 DICEBOT_FORMATS）。**技能名按角色卡所用规则集输出**：
 * 七版用官方技能表，通俗克苏鲁用通克技能表，守秘人伴侣叠加层用伴侣修订表；
 * 同时把其它规则集里同一技能的旧叫法作为别名一并带上，方便各家骰娘识别。
 * 纯函数，前端与测试共用。
 */

import { ALL_CHARS, SKILL_BY_KEY } from './coc7e.js';
import { RULESETS, resolveCardRuleset } from './rulesets/index.js';

/** 属性输出顺序与别名（对齐 Excel：中文名 + 英文缩写，智力额外给「灵感」） */
const CHAR_TOKENS = [
  ['STR', ['力量', 'str']],
  ['DEX', ['敏捷', 'dex']],
  ['POW', ['意志', 'pow']],
  ['CON', ['体质', 'con']],
  ['APP', ['外貌', 'app']],
  ['EDU', ['教育', 'edu']],
  ['SIZ', ['体型', 'siz']],
  ['INT', ['智力', '灵感', 'int']],
];

/** 七版技能别名（Excel「技能名的改变」+ 规则书常见叫法），键为技能中文名 */
export const SKILL_ALIASES = {
  汽车驾驶: ['汽车', '驾驶'],
  电子学: [],
  步枪霰弹枪: ['步枪', '霰弹枪', '步霰'],
  图书馆使用: ['图书馆'],
  锁匠: ['开锁', '撬锁'],
  博物学: ['自然学'],
  计算机使用: ['计算机', '电脑'],
  导航: ['领航'],
  信用评级: ['信用', '信誉'],
  操作重型机械: ['重型操作', '重型机械', '重型', '重型机械操作'],
  克苏鲁神话: ['克苏鲁', 'cm'],
  取悦: ['魅惑'],
  格斗: [],
  射击: [],
  外语: [],
  技艺: [],
  科学: [],
  驾驶: [],
  生存: [],
  学识: [],
  母语: [],
};

/** 各规则集专属别名：键为**该规则集**里的技能名（同名技能跨表会自动互补，见 aliasesFor） */
export const SKILL_ALIASES_BY_RULESET = {
  classic7e: SKILL_ALIASES,
  pulp: {
    艺术和手艺: ['技艺', '艺术', '手艺'],
    操纵: ['驾驶', '飞行器', '船艇', 'pilot'],
    语言: ['外语'],
    学识: ['传说', 'lore'],
    侦察: ['侦查'],
    博物学: ['自然学'],
    取悦: ['魅惑', 'charm'],
    话术: ['快速交谈', 'fastTalk'],
    恐吓: ['威吓', 'intimidate'],
    说服: ['劝说', 'persuade'],
    数学: ['数学', 'mathematics'],
  },
  kpcp: {
    说服: ['取悦', '话术', '恐吓', 'charm', 'fastTalk', 'intimidate', 'persuade'],
    自然学: ['博物学', 'naturalWorld'],
    宗教: ['神学', 'religion'],
    安抚: ['安慰'],
    侦查: ['侦察'],
    艺术: ['技艺', '艺术和手艺'],
    外语: ['语言'],
  },
};

/** 可选的骰娘格式 */
export const DICEBOT_FORMATS = [
  { id: 'dice', label: '通用（DICE / shiki / 溯洄）', hint: '.st 属性技能…' },
  { id: 'tower', label: '塔系骰娘', hint: '.st 角色名-属性技能…' },
  { id: 'mdice', label: 'MDice（惠惠）', hint: '.st 角色名？属性技能…' },
  { id: 'shiki', label: 'shiki Exp10（带状态/派生/武器）', hint: '.st … 时代/性别 &DB 体格 闪避 护甲 &武器' },
];

function namePrefix(bot, name) {
  const n = String(name || '').trim();
  if (bot === 'tower') return `${n}-`;
  if (bot === 'mdice') return `${n}？`;
  return '';
}

/** 取角色卡实际规则集：显式传入优先，否则按存档的游戏系统 + 伴侣层开关解析 */
function cardRuleset(sheet, derived, opts) {
  if (opts?.ruleset?.skillByKey) return opts.ruleset;
  const fromDerived = derived?.ruleset;
  if (fromDerived?.skillByKey) return fromDerived;
  return resolveCardRuleset(sheet);
}

/** 「外语（英语）」→ { head:'外语', qual:'英语' }；没有括号时 head 为原名、qual 为空 */
function parenSplit(name) {
  const m = String(name || '').match(/^(.+?)[（(](.+?)[)）]$/);
  if (!m) return { head: String(name || ''), qual: '' };
  return { head: m[1].trim(), qual: m[2].trim() };
}

/**
 * 专攻技能拆成可直接识别的别名：去掉「射击 / 格斗 / 外语…」这类分支头，
 * 斜杠拆开，霰弹枪额外补「步霰」（与官方 Excel 骰娘导入一致）。
 */
function specTokens(custom) {
  const parts = String(custom || '')
    .split(/[/／]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const tokens = [];
  for (const p of parts) {
    tokens.push(p);
    if (p.includes('霰弹')) tokens.push('步霰');
  }
  return [...new Set(tokens)];
}

/**
 * 某个技能在该规则集里的别名集合：
 * ① 手写别名表（Excel 叫法 + 规则书常见叫法）
 * ② 其它规则集里**同一个 key** 的名字（七版/通克/伴侣互认，旧骰娘也能认）
 * ③ 名字里的斜杠压平（艺术/手艺 → 艺术和手艺）
 */
function aliasTable(R) {
  return R?.layer?.kpcp
    ? SKILL_ALIASES_BY_RULESET.kpcp
    : (SKILL_ALIASES_BY_RULESET[R?.id] || SKILL_ALIASES);
}

/** 只取手写别名表里的中文叫法（不做跨规则集互认）：专攻组的统称用它，避免
 *  「母语」把通克的「语言」/ 伴侣版的「外语」当成别名一起带出去。 */
function tableAliasesFor(name, R) {
  const table = aliasTable(R);
  const { head } = parenSplit(name);
  const out = new Set([...(table[name] || []), ...(table[head] || [])]);
  out.delete(name);
  return [...out].filter((a) => a && !/[A-Za-z]/.test(a));
}

function aliasesFor(key, name, R) {
  const table = aliasTable(R);
  const { head } = parenSplit(name);
  const out = new Set([...(table[name] || []), ...(table[head] || [])]);
  for (const rs of Object.values(RULESETS)) {
    const n = rs?.skillByKey?.[key]?.name;
    if (n && n !== name) out.add(n);
  }
  if (name.includes('/') || name.includes('／')) out.add(name.replace(/[/／]/g, ''));
  out.delete(name);
  // 技能只保留中文叫法：骰娘词库里没有 charm / fastTalk / naturalWorld 这类英文技能名，
  // 带上只会让指令变脏（属性缩写 str/dex 等仍按官方 Excel 格式保留）
  return [...out].filter((a) => a && !/[A-Za-z]/.test(a));
}

/** 专攻组里「统称本身也要导出」的名字（骰娘按这些词条记录整组与分支） */
const NAMED_SPEC_HEADS = new Set(['外语', '母语', '语言', '宗教', '神秘学']);

/** 需要导出的技能（普通技能全给基础值；专攻技能只给已选方向/投过点的） */
function skillsForExport(derived, R) {
  const defs = R?.skillByKey || SKILL_BY_KEY;
  const out = [];
  // 伴侣版的「第二母语」在派生表末尾追加，导出时挪到母语紧后面，输出更像一张正常的卡
  // （母语80 法语80 拉丁语80，而不是跑到指令最末尾去）
  let list = Array.isArray(derived.skills) ? derived.skills.slice() : [];
  const extras = list.filter((s) => s.extraLanguage);
  if (extras.length) {
    const rest = list.filter((s) => !s.extraLanguage);
    const at = rest.findIndex((s) => s.key === 'ownLanguage');
    rest.splice(at >= 0 ? at + 1 : rest.length, 0, ...extras);
    list = rest;
  }
  for (const s of list) {
    const def = defs[s.key];
    const display = s.name || def?.name || s.key;
    if (s.kind === 'custom') {
      if (s.name && s.total > 0) out.push({ tokens: [s.name], total: s.total });
      continue;
    }
    if (s.spec) {
      const invested = s.occ > 0 || s.interest > 0 || s.bonus > 0 || s.growth > 0;
      // 单槽专精组（伴侣版「宗教」）即使没写专精也要给出统称与数值；多槽组只在选了方向或投点后导出
      const soloGroup = Number(def?.slots) === 1;
      if (!s.custom && !invested && !soloGroup) continue;
      // 骰娘只认「手枪 / 斗殴 / 英语」这类分支名，不带「射击手枪」这种拼接词
      const head = def?.name || parenSplit(display).head;
      if (!s.custom) {
        // 空专精：直接给统称（宗教 10），并把神学/religion 这类别名一起带上
        out.push({ tokens: [head], total: s.total, aliases: aliasesFor(s.key, head, R) });
        continue;
      }
      const tokens = specTokens(s.custom);
      // 统称本身也有意义的专攻组（外语 / 母语 / 宗教 / 神秘学…）：统称 + 分支一起给，
      // 例如「宗教50神学50天主教50」「神秘学37炼金术37」。射击 / 格斗 / 艺术这类
      // 只认分支名的组仍只给分支，避免指令里多出无意义的上位词。
      const namedHead = NAMED_SPEC_HEADS.has(head);
      out.push({
        // 顺序对齐官方 Excel：统称 → 旧叫法 → 具体分支（宗教 神学 天主教）
        tokens: namedHead ? [head, ...tableAliasesFor(head, R), ...tokens] : tokens,
        total: s.total,
        aliases: [],
      });
      continue;
    }
    const { head, qual } = parenSplit(display);
    if (qual) {
      // 标名技能（母语 / 宗教 / 伴侣版神秘学…）：给统称 + 分支名，**不再拼「统称+方向」**。
      // 骰娘只认「法语 / 拉丁语 / 天主教」这类独立词条，`母语法语` 是 Excel 的显示写法，
      // 塞进指令只会变成无意义的脏词；同一技能多行分支靠 emitted 去重，最终得到
      // 「母语80法语80拉丁语80」「宗教50神学50天主教50」。
      out.push({ tokens: [head, qual], total: s.total, aliases: tableAliasesFor(head, R) });
      continue;
    }
    // 名字里带斜杠（伴侣版「艺术/手艺」）：导出时压平，原名进别名
    if (display.includes('/') || display.includes('／')) {
      const flat = display.replace(/[/／]/g, '');
      out.push({ name: flat, total: s.total, aliases: [display, ...aliasesFor(s.key, flat, R)] });
      continue;
    }
    out.push({ name: display, total: s.total, aliases: aliasesFor(s.key, display, R) });
  }
  return out;
}

/**
 * 生成骰娘导入指令。
 * @param {object} sheet   角色卡存档（用 name/era/gender/weapons）
 * @param {object} derived computeSheet() 的结果
 * @param {{bot?:string, dot?:string, includeExtra?:boolean, ruleset?:object}} [opts]
 *        bot: dice | tower | mdice | shiki ｜ dot: '.' 或 '。' ｜ includeExtra: 附加时代/性别/派生值/武器
 *        ruleset: 可选，显式指定规则集（默认按存档解析，含伴侣层）
 */
export function buildDiceBotCommand(sheet, derived, opts = {}) {
  const bot = DICEBOT_FORMATS.some((f) => f.id === opts.bot) ? opts.bot : 'dice';
  const dot = opts.dot === '。' ? '。' : '.';
  const includeExtra = opts.includeExtra === true || bot === 'shiki';
  const s = sheet || {};
  const d = derived || {};
  const R = cardRuleset(s, d, opts);

  const parts = [];
  for (const [k, names] of CHAR_TOKENS) {
    const v = Number(d.eff?.[k] ?? 0);
    for (const n of names) parts.push(`${n}${v}`);
  }
  const luck = Number(d.eff?.Luck ?? 0);
  parts.push(`幸运${luck}`, `运气${luck}`);
  const san = Number(d.san ?? 0);
  parts.push(`san${san}`, `san值${san}`, `理智${san}`, `理智值${san}`);
  parts.push(`mp${Number(d.mp ?? 0)}`, `魔法${Number(d.mp ?? 0)}`);
  parts.push(`hp${Number(d.hp ?? 0)}`, `体力${Number(d.hp ?? 0)}`);

  // 同一组「名字+数值」只输出一次：别名重复（如两支都叫「驾驶」）不算错误，但不必刷两遍
  const emitted = new Set(parts);
  const push = (name, value) => {
    const token = `${name}${value}`;
    if (!name || emitted.has(token)) return;
    // 相邻两个英文技能名之间必须留空格：charm40fastTalk40 这种粘成一片的写法
    // 骰娘无法可靠切分（中文名靠汉字天然分隔，英文名不会）
    const prev = String(parts[parts.length - 1] || '');
    if (/^[A-Za-z]/.test(name) && /[A-Za-z]\d+$/.test(prev)) parts.push(' ');
    emitted.add(token);
    parts.push(token);
  };
  for (const sk of skillsForExport(d, R)) {
    if (sk.tokens) {
      for (const t of sk.tokens) push(t, sk.total);
      for (const a of sk.aliases || []) push(a, sk.total);
      continue;
    }
    push(sk.name, sk.total);
    for (const a of sk.aliases) push(a, sk.total);
  }

  let text = `${dot}st ${namePrefix(bot, s.name)}${parts.join('')}`;

  if (includeExtra) {
    text += ` 时代:${s.era || '1920s'}\t性别:${s.gender || '保密'}\t`;
    const armor = Number(s.armorPenalty) > 0 ? String(s.armorPenalty) : '无';
    text += ` &DB=${d.db ?? 0} 体格:${d.build ?? 0} 闪避:${d.dodgeBase ?? 0} 护甲:${armor}`;
    for (const w of (Array.isArray(s.weapons) ? s.weapons : [])) {
      if (!w?.name) continue;
      text += ` &${w.name}=${w.damage || '—'}`;
    }
  }
  return text.replace(/\s+$/, '');
}

/**
 * 该卡会导出的技能「主名」清单（不含别名），按规则集取对应技能表。
 * 供测试确认各规则集不会串用别的技能表的名字。
 */
export function diceBotSkillNames(sheet, derived, opts = {}) {
  const R = cardRuleset(sheet || {}, derived || {}, opts);
  return skillsForExport(derived || {}, R).map((s) => s.name || s.tokens?.[0] || '');
}

/** 生成全部四种格式，供界面一次性展示/切换 */
export function buildAllDiceBotCommands(sheet, derived, dot = '.', opts = {}) {
  return DICEBOT_FORMATS.map((f) => ({
    ...f,
    text: buildDiceBotCommand(sheet, derived, { ...opts, bot: f.id, dot }),
  }));
}

/** 属性/技能的中文名清单（导入解析用：把「力量50str50」切开） */
export const DICEBOT_NAME_TO_CHAR = (() => {
  const map = {};
  for (const [k, names] of CHAR_TOKENS) for (const n of names) map[n.toLowerCase()] = k;
  map['幸运'] = 'Luck'; map['运气'] = 'Luck';
  return map;
})();

export { ALL_CHARS };