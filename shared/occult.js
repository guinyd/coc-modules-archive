/* 附表：法术详情与神话典籍
 * 目录来自《魔法大典》《神话典籍》世界书（由本地 JSON 整理生成，源文件不入库）；
 * 这里只做规范化与空行构造，保证前后端、备份与打印共用同一套口径。
 */
import { SPELL_CATEGORIES, SPELL_CATALOG, TOME_CATALOG } from './occultCatalog.js';

export { SPELL_CATEGORIES, SPELL_CATALOG, TOME_CATALOG };

export const SPELL_LIMIT = 40;
export const TOME_LIMIT = 20;
export const SPELL_DEFAULT_CATEGORY = '其他法术';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function blankSpell(partial = {}) {
  return {
    id: '', name: '', en: '', category: '', cost: '', time: '', condition: '',
    detail: '', alias: '', notes: '',
    ...partial,
  };
}

export function blankTome(partial = {}) {
  return {
    id: '', name: '', en: '', meta: '', sanity: '', occult: '', mythos: '', spells: '',
    desc: '', notes: '',
    ...partial,
  };
}

export function normalizeSpell(input, index = 0) {
  const s = input && typeof input === 'object' ? input : {};
  const category = SPELL_CATEGORIES.includes(s.category) ? s.category : str(s.category, 24);
  return {
    id: str(s.id, 32) || `sp${index + 1}`,
    name: str(s.name, 80),
    en: str(s.en, 120),
    category,
    cost: str(s.cost, 80),
    time: str(s.time, 80),
    condition: str(s.condition, 300),
    detail: str(s.detail, 8000),
    alias: str(s.alias, 300),
    notes: str(s.notes, 500),
  };
}

export function normalizeTome(input, index = 0) {
  const t = input && typeof input === 'object' ? input : {};
  return {
    id: str(t.id, 32) || `tm${index + 1}`,
    name: str(t.name, 120),
    en: str(t.en, 160),
    meta: str(t.meta, 300),
    sanity: str(t.sanity, 80),
    occult: str(t.occult, 80),
    mythos: str(t.mythos, 80),
    spells: str(t.spells, 4000),
    desc: str(t.desc, 12000),
    notes: str(t.notes, 500),
  };
}

export function normalizeSpells(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const [i, item] of list.entries()) {
    const s = normalizeSpell(item, i);
    if (!s.name) continue;
    if (seen.has(s.id)) s.id = `${s.id}_${i}`;
    seen.add(s.id);
    out.push(s);
    if (out.length >= SPELL_LIMIT) break;
  }
  return out;
}

export function normalizeTomes(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const [i, item] of list.entries()) {
    const t = normalizeTome(item, i);
    if (!t.name) continue;
    if (seen.has(t.id)) t.id = `${t.id}_${i}`;
    seen.add(t.id);
    out.push(t);
    if (out.length >= TOME_LIMIT) break;
  }
  return out;
}

/** 从大典条目生成一行可编辑的法术 */
export function spellFromCatalog(entry, id = '') {
  if (!entry) return blankSpell({ id });
  return normalizeSpell({
    id,
    name: entry.name,
    en: entry.en || '',
    category: entry.category || '',
    cost: entry.cost || '',
    time: entry.time || '',
    detail: entry.detail || '',
    alias: Array.isArray(entry.aliases) ? entry.aliases.join('、') : (entry.alias || ''),
  });
}

/** 从典籍条目生成一行可编辑的典籍 */
export function tomeFromCatalog(entry, id = '') {
  if (!entry) return blankTome({ id });
  return normalizeTome({
    id,
    name: entry.name,
    en: entry.en || '',
    meta: entry.meta || '',
    sanity: entry.sanity || '',
    occult: entry.occult || '',
    mythos: entry.mythos || '',
    spells: entry.spells || '',
    desc: entry.desc || '',
  });
}
