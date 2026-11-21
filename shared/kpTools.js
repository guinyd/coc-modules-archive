/**
 * KP 工具箱的纯逻辑：骰娘 `.st` 指令解析、数值派生、以及 .md 备份的往返编解码。
 * 前后端共用（自检脚本直接 import），不依赖 DOM。
 */
import { damageBonusBuild, movement } from './coc7e.js';

/** 骰娘指令里的属性名（中文与英文缩写都认，大小写不敏感） */
const ATTR_ALIASES = {
  STR: ['力量', 'str'],
  CON: ['体质', 'con'],
  SIZ: ['体型', 'siz'],
  DEX: ['敏捷', 'dex'],
  APP: ['外貌', 'app'],
  INT: ['智力', '灵感', 'int'],
  POW: ['意志', 'pow'],
  EDU: ['教育', 'edu'],
  luck: ['幸运', '运气', 'luck'],
};

/** 数值类（与属性分开，避免「幸运 80」被当作属性跟技能混一起） */
const VALUE_ALIASES = {
  hp: ['hp', '体力', '生命', '生命值'],
  san: ['san', '理智', '理智值', 'san值'],
  mp: ['mp', '魔法', '魔法值'],
};

const ALIAS_INDEX = new Map();
Object.entries(ATTR_ALIASES).forEach(([key, names]) => names.forEach((n) => ALIAS_INDEX.set(n.toLowerCase(), key)));
Object.entries(VALUE_ALIASES).forEach(([key, names]) => names.forEach((n) => ALIAS_INDEX.set(n.toLowerCase(), key)));

/** 去掉指令前缀：`.st`、`st`、`。st`、`！st`、`/st` 等 */
function stripCommandPrefix(text) {
  return String(text || '')
    .replace(/^\s*[.。!！/／]?\s*st\b/i, ' ')
    .replace(/[：:]/g, '：');
}

/**
 * 解析骰娘 `.st` 指令，返回识别到的属性与数值。
 * 兼容 `st 力量50str50 敏捷44dex44` 这类「中文名+数字+英文名+数字」连写的 token。
 * @returns {{ values: Record<string, number>, unknown: string[], tokens: number }}
 */
export function parseStCommand(text) {
  const raw = String(text || '').trim();
  if (!raw) return { values: {}, unknown: [], tokens: 0 };
  const body = stripCommandPrefix(raw);
  const values = {};
  const unknown = [];
  let tokens = 0;

  const chunks = body.split(/[\s,，、;；|]+/).filter(Boolean);
  for (const chunk of chunks) {
    let rest = chunk;
    let guard = 0;
    while (rest && guard < 40) {
      guard += 1;
      const m = /^([^\d]*?)([+-]?\d+)(.*)$/.exec(rest);
      if (!m) {
        const name = rest.trim();
        if (name && !/^[.。!！/／]$/.test(name)) unknown.push(name);
        break;
      }
      const name = m[1].replace(/[：:=＝]/g, '').trim();
      const value = Number(m[2]);
      rest = m[3];
      if (!name) continue;
      tokens += 1;
      const key = ALIAS_INDEX.get(name.toLowerCase());
      if (key) values[key] = value;
      else unknown.push(name);
    }
  }
  return { values, unknown, tokens };
}

/**
 * 用属性推算出可自动填的数值。
 * @param {Record<string, any>} values 已知字段（属性/数值，键名同状态卡）
 * @param {{ hpRule?: 'classic'|'pulp' }} opts 生命算法：官方 ÷10、通克 ÷5
 */
export function deriveStatus(values = {}, opts = {}) {
  const hpRule = opts.hpRule === 'pulp' ? 'pulp' : 'classic';
  const num = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const STR = num(values.STR);
  const CON = num(values.CON);
  const SIZ = num(values.SIZ);
  const DEX = num(values.DEX);
  const POW = num(values.POW);

  const out = {};
  if (CON !== null && SIZ !== null) {
    out.hpMax = Math.floor((CON + SIZ) / (hpRule === 'pulp' ? 5 : 10));
    out.wound = Math.floor(out.hpMax / 2);
  }
  if (POW !== null) out.mutate = Math.floor(POW / 5);
  if (STR !== null && SIZ !== null) {
    const dbb = damageBonusBuild(STR, SIZ);
    out.build = String(dbb.build);
    out.db = dbb.db;
  }
  if (STR !== null && DEX !== null && SIZ !== null) {
    out.mov = String(movement(STR, DEX, SIZ, 30).mov);
  }
  return out;
}

/* --------------------------------------------------------------- .md 备份标记 */

const MARKER_PREFIX = 'kp-tools-state:v1:';

function toBase64(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64');
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64) {
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  return decodeURIComponent(escape(atob(b64)));
}

/** 在导出的 .md 末尾放一段人眼看不见的备份标记，导入时整份还原 */
export function encodeStateMarker(kind, state) {
  const payload = toBase64(JSON.stringify({ kind, state }));
  return `\n<!-- ${MARKER_PREFIX}${payload} -->\n`;
}

/**
 * 从 .md 文本里取出备份状态。
 * @returns {{ kind: string, state: any } | null} 没有标记或解析失败时返回 null
 */
export function decodeStateMarker(text) {
  const s = String(text || '');
  const m = new RegExp(`<!--\\s*${MARKER_PREFIX}([A-Za-z0-9+/=]+)\\s*-->`).exec(s);
  if (!m) return null;
  try {
    const parsed = JSON.parse(fromBase64(m[1]));
    if (!parsed || typeof parsed !== 'object') return null;
    return { kind: String(parsed.kind || ''), state: parsed.state };
  } catch {
    return null;
  }
}