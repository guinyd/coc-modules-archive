/**
 * 角色卡 Markdown / JSON 备份的导出与导入。
 *
 *  - .md：人可读档案（基础信息、属性、全部技能、背景、装备……），不含数据块，适合阅读存档；
 *  - .json：完整备份（packCard 的全部字段），导入时据此无损还原成一张可继续编辑的草稿卡。
 *
 * 只导出**玩家输入**（派生值一律由规则引擎重算），且**不含** id / 归属 / 审核 / 模组经历。
 * 纯函数，前端与测试共用。
 */

import {
  ALL_CHARS, BACKGROUND_FIELDS, CHAR_LABEL, STATUS_LABEL,
  blankSheet, clampInt, computeSheet, skillName,
} from './coc7e.js';
import { normalizeSpells, normalizeTomes } from './occult.js';

/** 允许在记录里传输的字段（其余一律丢弃） */
const FIELDS = [
  'name', 'playerName', 'occupationId', 'age', 'gender', 'residence', 'birthplace', 'era',
  'chars', 'charGrowth', 'sanGrowth', 'eduBonus', 'eduGrowth', 'applyAgeAdjust', 'ageAlloc', 'armorPenalty',
  'agePenaltyWaived',
  'occPicks', 'skills', 'customSkills', 'weapons', 'equipment', 'equipmentItems', 'spells', 'tomes', 'currency', 'extraAssets',
  'background', 'experience', 'notes', 'status',
];

// ------------------------------------------------------------------ 打包 / 解包
/** 从完整角色卡里挑出可导出的字段 */
export function packCard(sheet) {
  const s = sheet || {};
  const out = {};
  for (const k of FIELDS) {
    if (s[k] === undefined || s[k] === null) continue;
    out[k] = s[k];
  }
  return out;
}

/**
 * 把记录里的数据还原成一张**可直接编辑**的角色卡（以 blankSheet 兜底，字段全部经过裁剪）。
 * @returns {{ ok:boolean, sheet?:object, error?:string }}
 */
export function unpackCard(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: '导入内容不是一张角色卡' };
  const base = blankSheet();
  const out = { ...base };
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const int = (v, min, max, dflt = 0) => clampInt(v, min, max, dflt);

  out.name = str(obj.name, 40);
  out.playerName = str(obj.playerName, 40);
  out.occupationId = obj.occupationId === undefined || obj.occupationId === null ? '' : String(obj.occupationId).slice(0, 32);
  out.age = int(obj.age, 0, 999, 25);
  out.gender = str(obj.gender, 20);
  out.residence = str(obj.residence, 40);
  out.birthplace = str(obj.birthplace, 40);
  out.era = ['1920s', '现代', '其他'].includes(obj.era) ? obj.era : '1920s';

  out.chars = { ...base.chars };
  if (obj.chars && typeof obj.chars === 'object') {
    for (const k of ALL_CHARS) out.chars[k] = int(obj.chars[k], 0, 99, 0);
  }
  out.charGrowth = {};
  if (obj.charGrowth && typeof obj.charGrowth === 'object') {
    for (const k of ALL_CHARS) {
      const n = int(obj.charGrowth[k], 0, 99, 0);
      if (n) out.charGrowth[k] = n;
    }
  }
  out.sanGrowth = int(obj.sanGrowth, -99, 99, 0);
  out.eduBonus = int(obj.eduBonus, 0, 999, 0);
  if (obj.eduGrowth && typeof obj.eduGrowth === 'object') out.eduGrowth = { ...base.eduGrowth, ...obj.eduGrowth };
  out.applyAgeAdjust = obj.applyAgeAdjust === true;
  out.agePenaltyWaived = obj.agePenaltyWaived === true;
  if (obj.ageAlloc && typeof obj.ageAlloc === 'object') {
    out.ageAlloc = {};
    for (const k of ['STR', 'SIZ', 'CON', 'DEX']) {
      if (obj.ageAlloc[k] !== undefined) out.ageAlloc[k] = int(obj.ageAlloc[k], 0, 99, 0);
    }
  }
  out.armorPenalty = int(obj.armorPenalty, 0, 10, 0);
  out.spells = normalizeSpells(obj.spells);
  out.tomes = normalizeTomes(obj.tomes);

  if (obj.occPicks && typeof obj.occPicks === 'object') {
    const arr = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max) : []);
    out.occPicks = {
      free: arr(obj.occPicks.free, 12),
      social: arr(obj.occPicks.social, 12),
      choices: arr(obj.occPicks.choices, 12),
    };
  }

  if (Array.isArray(obj.skills)) {
    out.skills = obj.skills
      .filter((s) => s && typeof s.id === 'string' && typeof s.key === 'string')
      .slice(0, 200)
      .map((s) => ({
        id: s.id.slice(0, 32),
        key: s.key.slice(0, 32),
        custom: str(s.custom, 24),
        occ: int(s.occ, 0, 99, 0),
        interest: int(s.interest, 0, 99, 0),
        growth: int(s.growth, 0, 99, 0),
      }));
  }
  if (Array.isArray(obj.customSkills)) {
    out.customSkills = obj.customSkills.slice(0, 20).map((s, i) => ({
      id: typeof s?.id === 'string' && s.id ? s.id.slice(0, 32) : `cs_import${i}`,
      name: str(s?.name, 24),
      base: int(s?.base, 0, 99, 0),
      occ: int(s?.occ, 0, 99, 0),
      interest: int(s?.interest, 0, 99, 0),
      growth: int(s?.growth, 0, 99, 0),
      isOccupation: Boolean(s?.isOccupation),
    })).filter((s) => s.name);
  }
  if (Array.isArray(obj.weapons)) {
    out.weapons = obj.weapons.slice(0, 11).map((w) => ({
      name: str(w?.name, 40),
      skill: str(w?.skill, 40),
      damage: str(w?.damage, 30),
      range: str(w?.range, 30),
      attacks: str(w?.attacks, 20),
      ammo: str(w?.ammo, 20),
      malfunction: str(w?.malfunction, 20),
    })).filter((w) => w.name);
  }
  out.equipment = str(obj.equipment, 4000);
  out.equipmentItems = (Array.isArray(obj.equipmentItems) ? obj.equipmentItems : []).slice(0, 100).map((it, i) => ({
    id: typeof it?.id === 'string' && it.id ? it.id.slice(0, 32) : `g${i + 1}`,
    part: str(it?.part, 40),
    name: str(it?.name, 120),
  })).filter((it) => it.name);
  out.currency = str(obj.currency, 8);
  out.extraAssets = str(obj.extraAssets, 400);
  if (obj.background && typeof obj.background === 'object') {
    out.background = { ...base.background };
    for (const k of Object.keys(base.background)) out.background[k] = str(obj.background[k], 600);
  }
  out.experience = str(obj.experience, 4000);
  out.notes = str(obj.notes, 4000);
  out.status = ['draft', 'active', 'retired', 'dead'].includes(obj.status) ? obj.status : 'draft';
  // 导入的卡一律从「未提交审核」的草稿开始，且不带传奇标记（那要 KP 单独给）
  out.legendary = { ...base.legendary };
  out.legendaryBonus = { ...base.legendaryBonus };
  out.agePenaltyWaived = false;
  out.moduleLinks = [];
  out.skillMarks = {};
  out.isPublic = false;
  return { ok: true, sheet: out };
}

// ------------------------------------------------------------------ Markdown 生成
const text = (v) => String(v ?? '').trim();
const cell = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>') || '—';
const body = (v, empty = '（未填写）') => (text(v) || empty);

function attrTotals(sheet, derived) {
  const s = sheet || {};
  let base = 0;
  for (const k of ALL_CHARS) {
    if (k === 'Luck') continue;
    base += Number(derived?.eff?.[k] ?? s.chars?.[k]) || 0;
  }
  const luck = Number(derived?.eff?.Luck ?? s.chars?.Luck) || 0;
  return { base, withLuck: base + luck };
}

function skillTotal(row) {
  return (row.base || 0) + (row.occ || 0) + (row.interest || 0) + (row.growth || 0);
}

function skillRows(sheet, derived) {
  const rows = [];
  for (const s of derived?.skills || []) {
    rows.push({
      name: skillName(s.key, s.custom) + (s.houseBase ? '（房规调整）' : ''),
      base: s.base, occ: s.occ || 0, interest: s.interest || 0, growth: s.growth || 0, total: s.total,
      used: Boolean(s.used || s.houseBase || s.occ > 0 || s.interest > 0 || s.growth > 0),
    });
  }
  for (const s of sheet.customSkills || []) {
    if (!s?.name) continue;
    const row = { name: `${s.name}（自建）`, base: s.base || 0, occ: s.occ || 0, interest: s.interest || 0, growth: s.growth || 0 };
    row.total = skillTotal(row);
    rows.push(row);
  }
  return rows;
}

/**
 * 生成一份 Markdown 角色卡记录。
 * @param {object} character 角色卡（或访客草稿）
 * @param {object} [derived] 已算好的派生值（不传则内部 computeSheet）
 */
export function buildCardMarkdown(character, derived) {
  const s = character || {};
  const d = derived || computeSheet(s);
  const lines = [];
  const name = text(s.name) || '未命名调查员';

  lines.push(`# 调查员档案 · ${name}`, '');
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`);
  const set = s.ruleSet || s.ruleSnapshot || null;
  lines.push(`> 规则集：${set?.name || set?.setName || '官方规则书'}`);
  lines.push('> 本文件只记录玩家填写的车卡内容，不含归属账号、审核状态与模组经历。', '');

  lines.push('## 基础信息', '');
  lines.push(`- 姓名：${body(s.name)}`);
  lines.push(`- 玩家：${body(s.playerName)}`);
  lines.push(`- 职业：${body(d.occupation?.name, '未选择职业')}`);
  lines.push(`- 年龄：${s.age ?? '—'}`);
  lines.push(`- 性别：${body(s.gender)}`);
  lines.push(`- 时代：${body(s.era)}`);
  lines.push(`- 居住地：${body(s.residence)}`);
  lines.push(`- 出生地：${body(s.birthplace)}`);
  lines.push(`- 状态：${STATUS_LABEL[s.status] || '草稿'}`, '');

  lines.push('## 属性', '', '| 属性 | 数值 | 成长 |', '| --- | --- | --- |');
  for (const k of ALL_CHARS) {
    const growth = Number(s.charGrowth?.[k]) || 0;
    lines.push(`| ${CHAR_LABEL[k]} ${k} | ${cell(d.eff?.[k] ?? s.chars?.[k])} | ${growth ? `+${growth}` : '—'} |`);
  }
  const { base: attrBase, withLuck: attrWithLuck } = attrTotals(s, d);
  lines.push('', `- 属性总和：${attrBase} / ${attrWithLuck}（不含运 / 含运）`, '');

  lines.push('## 派生值', '',
    '| 生命值 | 魔法值 | 理智起始 | 理智上限 | 幸运 | 伤害加成 | 体格 | 移动 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    `| ${d.hp} | ${d.mp} | ${d.san} | ${d.sanMax} | ${d.eff?.Luck ?? '—'} | ${d.db} | ${d.build} | ${d.mov} |`,
    '', `- 理智上限 = 99 − 神话知识（当前神话 ${d.mythos ?? 0}）`, '');

  lines.push('## 职业', '');
  if (d.occupation) {
    lines.push(`- 职业：${d.occupation.name}`);
    if (Array.isArray(d.occupation.cr)) lines.push(`- 信用评级区间：${d.occupation.cr[0]}–${d.occupation.cr[1]}`);
    if (d.occupation.desc) lines.push(`- 描述：${d.occupation.desc}`);
  } else {
    lines.push('- 职业：未选择');
  }
  lines.push('');

  lines.push('## 技能（全部）', '', '| 技能 | 基础 | 职业 | 兴趣 | 成长 | 合计 |', '| --- | --- | --- | --- | --- | --- |');
  const rows = skillRows(s, d);
  if (rows.length) {
    for (const r of rows) lines.push(`| ${cell(r.name)} | ${r.base} | ${r.occ} | ${r.interest} | ${r.growth} | ${r.total} |`);
  } else {
    lines.push('| （无技能数据） | — | — | — | — | — |');
  }
  lines.push('');

  const weapons = (s.weapons || []).filter((w) => w?.name);
  lines.push('## 武器', '');
  if (weapons.length) {
    lines.push('| 武器 | 技能 | 伤害 | 射程 | 攻击次数 | 弹药 | 故障值 |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const w of weapons) {
      lines.push(`| ${cell(w.name)} | ${cell(w.skill)} | ${cell(w.damage)} | ${cell(w.range)} | ${cell(w.attacks)} | ${cell(w.ammo)} | ${cell(w.malfunction)} |`);
    }
  } else {
    lines.push('（未填写）');
  }
  lines.push('');

  lines.push('## 背景故事', '');
  for (const [key, label] of BACKGROUND_FIELDS) {
    lines.push(`### ${label}`, '', body(s.background?.[key]), '');
  }

  lines.push('## 装备与资产', '');
  const gearLines = (s.equipmentItems || [])
    .map((it) => `- 【${it.part || '随身'}】${it.name}`);
  lines.push('### 随身装备', '', gearLines.length ? gearLines.join('\n') : body(s.equipment), '');
  lines.push('### 钱财', '');
  lines.push(`- 现金：${cell(d.wealth?.cashText || '—')}`);
  lines.push(`- 其他资产：${body(s.extraAssets)}`);
  lines.push('');

  const spells = (s.spells || []).filter((sp) => sp?.name);
  const tomes = (s.tomes || []).filter((t) => t?.name);
  if (spells.length || tomes.length) {
    lines.push('## 附表', '');
    lines.push('### 法术详情', '');
    if (spells.length) {
      lines.push('| 法术 | 分类 | 消耗 | 用时 | 条件 |', '| --- | --- | --- | --- | --- |');
      for (const sp of spells) {
        lines.push(`| ${cell(sp.name)} | ${cell(sp.category)} | ${cell(sp.cost)} | ${cell(sp.time)} | ${cell(sp.condition)} |`);
      }
    } else {
      lines.push('（未填写）');
    }
    const detailed = spells.filter((sp) => sp.detail || sp.alias || sp.notes);
    if (detailed.length) {
      lines.push('');
      for (const sp of detailed) {
        lines.push(`**${sp.name}**${sp.alias ? `（别名：${sp.alias}）` : ''}`, '');
        if (sp.detail) lines.push(...String(sp.detail).split(String.fromCharCode(10)).map((x) => `> ${x}`), '');
        if (sp.notes) lines.push(`- 备注：${sp.notes}`, '');
      }
    }
    lines.push('');
    lines.push('### 神话典籍', '');
    if (tomes.length) {
      for (const t of tomes) {
        const bits = [t.en, t.meta, t.sanity && `理智损失：${t.sanity}`, t.occult && `神秘学：${t.occult}`, t.mythos && `克苏鲁神话：${t.mythos}`, t.spells && `法术：${t.spells}`].filter(Boolean);
        lines.push(`- **${t.name}**${bits.length ? ` — ${bits.join(' · ')}` : ''}`);
        if (t.desc) lines.push(...String(t.desc).split(String.fromCharCode(10)).map((x) => `  > ${x}`));
        if (t.notes) lines.push(`  - 备注：${t.notes}`);
      }
    } else {
      lines.push('（未填写）');
    }
    lines.push('');
  }

  lines.push('## 经历', '', body(s.experience), '');
  lines.push('## 备注', '', body(s.notes), '');

  return lines.join('\n');
}

/** 生成安全的文件名 */
function safeName(name) {
  const bad = '\\/:*?"<>|';
  let out = '';
  for (const ch of String(name || '未命名调查员')) {
    if (bad.includes(ch) || ch === '\n' || ch === '\r') continue;
    out += ch;
  }
  return out.trim().slice(0, 40) || '未命名调查员';
}

/** 生成安全的 .md 文件名 */
export function cardMarkdownFilename(name) {
  return `调查员档案-${safeName(name)}.md`;
}

// ------------------------------------------------------------------ JSON 备份
/** 生成一份可还原的 JSON 备份（游戏内数据，不含归属/审核/模组经历） */
export function buildCardBackup(character) {
  const payload = {
    app: '秘密调查档案馆',
    kind: 'character-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    character: packCard(character || {}),
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

/** 生成安全的 .json 备份文件名 */
export function cardBackupFilename(name) {
  return `调查员档案-${safeName(name)}.json`;
}

// ------------------------------------------------------------------ 导入
function unpackParsed(obj) {
  if (obj && typeof obj === 'object' && obj.kind === 'character-backup' && obj.character) return unpackCard(obj.character);
  if (obj && typeof obj === 'object' && obj.sheet) return unpackCard(obj.sheet);
  return unpackCard(obj);
}

/**
 * 从 .md（旧版带数据块）或 .json 备份还原一张角色卡。
 * @returns {{ ok:boolean, sheet?:object, error?:string }}
 */
export function importCardData(input) {
  const raw = String(input || '');
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请先粘贴角色卡 Markdown 或备份 JSON' };
  const NL = String.fromCharCode(10);
  const CR = String.fromCharCode(13);
  const plainLines = trimmed.split(NL).map((l) => l.split(CR).join('').trim());
  if (plainLines.some((l) => l.startsWith('COC7G1:') || l.startsWith('COC7C1:'))) {
    return { ok: false, error: '角色卡编码已经停用，请改用导出的 .md 或 .json 备份' };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: '备份数据已损坏，无法解析；请重新导出后再试' };
    }
    return unpackParsed(obj);
  }

  const start = raw.indexOf('```json');
  if (start >= 0) {
    let p = start + 7;
    while (p < raw.length && (raw[p] === ' ' || raw[p] === NL || raw[p] === CR)) p += 1;
    const end = raw.indexOf('```', p);
    if (end > p) {
      try {
        return unpackCard(JSON.parse(raw.slice(p, end).trim()));
      } catch {
        return { ok: false, error: '导入数据块已损坏，无法解析；请重新导出后再试' };
      }
    }
  }

  if (trimmed.startsWith('# 调查员档案')) {
    return {
      ok: false,
      error: '这份 Markdown 只有可读内容，不含备份数据；要还原请使用导出的 .json 备份（或旧版带数据块的 .md）',
    };
  }
  return { ok: false, error: '无法识别：请粘贴导出的 .md 档案或 .json 备份' };
}

/** 兼容旧调用名 */
export const importCardMarkdown = importCardData;
