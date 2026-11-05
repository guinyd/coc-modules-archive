/**
 * 数据层：单文件 JSON 存储 + 原子写入 + 每日备份 + 数据结构迁移。
 *
 * 为什么保留 JSON 文件而不是换数据库？
 *  - 本站数据量极小（几十个用户、几十张角色卡），JSON 完全够用，运维成本为零（备份 = 拷一个文件）。
 *  - 但**必须**修掉原实现的三个致命点：整文件覆写非原子（断电/被杀会写出半个文件）、无备份、无迁移入口。
 *  本实现改为「写临时文件 → fsync → rename」的原子替换，并在每天首次写入前留一份快照。
 *
 * 数据常驻内存，所有写操作通过 save() 落盘；单进程部署下不存在并发写冲突。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isVeryWeak, hashPasswordSync, hashToken, tokenExpiry } from './security.js';
import { blankEduGrowth, blankLegendary, blankLegendaryBonus, KP_TITLES, PLAYER_TITLES } from '../../shared/coc7e.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.COCOC_DATA_DIR
  ? path.resolve(process.env.COCOC_DATA_DIR)
  : path.join(__dirname, '..', 'data');
export const DB_FILE = process.env.COCOC_DB_FILE
  ? path.resolve(process.env.COCOC_DB_FILE)
  : path.join(DATA_DIR, 'database.json');

const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_KEEP = 14;
/** 写合并窗口：角色卡连续保存时只落一次盘；进程退出用 saveNow() 兜底。 */
const SAVE_DEBOUNCE_MS = 120;
export const SCHEMA_VERSION = 9;
/** 每个账号默认的角色卡上限；管理员可在账号管理里逐个调整（0 表示暂停建卡）。 */
export const DEFAULT_MAX_CHARACTERS = 30;

let data = null;
let saveTimer = null;
let backedUpDay = '';

// ------------------------------------------------------------------ 结构
function emptyDB() {
  return {
    schemaVersion: SCHEMA_VERSION,
    users: [],
    modules: [],
    played_records: [],
    sessions: [],
    characters: [],
    customOccupations: [],   // KP 自定义职业模板
    reviews: [],             // 角色卡审核记录（批复只存在这里，不进角色卡本体）
    keeperMarks: [],         // 守秘人的「可带团」标记（模组 × 守秘人）
    settings: { auditRules: null }, // KP 辅助审卡规则（null = 使用内置默认值）
  };
}

function ensureShape(d) {
  const out = d && typeof d === 'object' ? d : {};
  for (const key of ['users', 'modules', 'played_records', 'sessions', 'characters',
    'customOccupations', 'reviews', 'keeperMarks']) {
    if (!Array.isArray(out[key])) out[key] = [];
  }
  if (!out.settings || typeof out.settings !== 'object') out.settings = { auditRules: null };
  return out;
}

// ------------------------------------------------------------------ 迁移
/**
 * v1 -> v2：
 *  - 明文口令 → scrypt 哈希（迁移时明文还在，直接一次性哈希，之后数据库中不再有明文）
 *  - 明文 token → SHA-256 摘要（已登录的浏览器仍持有原始 token，摘要比对依然有效，不会把人踢下线）
 *  - 新建 characters 表
 *  - 补 createdAt/updatedAt
 */
function migrate(d) {
  const notes = [];
  let changed = false;
  let weak = 0;

  for (const u of d.users) {
    if (typeof u.password === 'string' && u.password && !u.passwordHash) {
      const rec = hashPasswordSync(u.password);
      u.passwordHash = rec.hash;
      u.passwordSalt = rec.salt;
      u.passwordAlgo = 'scrypt';
      u.passwordParams = { N: rec.N, r: rec.r, p: rec.p };
      // 仅对"短到不合规"的口令做提醒；普通弱口令不再强制（项目要求不做强度强制）
      if (isVeryWeak(u.password)) {
        u.mustChangePassword = true;
        weak += 1;
      }
    }
    if (u.password !== undefined) { delete u.password; changed = true; }

    if (typeof u.token === 'string' && u.token && !u.tokenHash) {
      u.tokenHash = hashToken(u.token);
      u.tokenExpiresAt = tokenExpiry();
    }
    if (u.token !== undefined) { delete u.token; changed = true; }

    if (u.tokenHash && !u.tokenExpiresAt) { u.tokenExpiresAt = tokenExpiry(); changed = true; }
    if (!u.createdAt) { u.createdAt = Number(u.id) || Date.now(); changed = true; }
    if (!u.updatedAt) { u.updatedAt = u.createdAt; changed = true; }
    if (typeof u.title !== 'string') { u.title = u.role === 'admin' ? '首席守秘人' : '见习调查员'; changed = true; }
  }
  if (changed) notes.push('用户口令已哈希化、令牌已摘要化');
  if (weak) notes.push(`${weak} 个账号仍在使用弱口令，已标记为需要改密`);

  // v3 -> v4：口令不再强制强度，清掉历史遗留的「需改密」标记
  for (const u of d.users) {
    if (u.mustChangePassword) { u.mustChangePassword = false; changed = true; }
  }

  // v2 -> v3：角色卡增加审核状态字段；新增自定义职业 / 审核记录 / 审卡规则容器
  for (const c of d.characters) {
    if (!c.reviewStatus) { c.reviewStatus = 'none'; changed = true; }
  }
  if (!d.settings || typeof d.settings !== 'object') { d.settings = { auditRules: null }; changed = true; }

  // v4 -> v5：年龄补正改为「力量/体型/体质/敏捷 合计减 N 点、自行分配」，
  // 旧卡补一个空的分配表（空 = 引擎按默认平均分配结算，老卡不会因此丢减值）
  for (const c of d.characters) {
    if (!c.ageAlloc || typeof c.ageAlloc !== 'object' || Array.isArray(c.ageAlloc)) {
      c.ageAlloc = {};
      changed = true;
    }
  }

  // v5 -> v6：教育增强结算记录 / 传奇标记与额外调整值 / KP 年龄减益豁免 / 玩家备注
  for (const c of d.characters) {
    if (!c.eduGrowth || typeof c.eduGrowth !== 'object' || Array.isArray(c.eduGrowth)) {
      const g = blankEduGrowth();
      // 老卡只要已经有教育增强数值，就视为「已结算过」，避免旧提示重新冒出来
      if (Number(c.eduBonus) > 0) { g.settled = true; g.gain = Number(c.eduBonus); }
      c.eduGrowth = g;
      changed = true;
    }
    if (!c.legendary || typeof c.legendary !== 'object' || Array.isArray(c.legendary)) {
      c.legendary = blankLegendary();
      changed = true;
    }
    if (!c.legendaryBonus || typeof c.legendaryBonus !== 'object' || Array.isArray(c.legendaryBonus)) {
      c.legendaryBonus = blankLegendaryBonus();
      changed = true;
    }
    if (typeof c.agePenaltyWaived !== 'boolean') { c.agePenaltyWaived = false; changed = true; }
    if (typeof c.notes !== 'string') { c.notes = ''; changed = true; }
  }

  // v6 -> v7：每个账号的角色卡上限（默认 30，管理员可调；0 表示暂停建卡）
  for (const u of d.users) {
    if (!Number.isInteger(u.maxCharacters) || u.maxCharacters < 0 || u.maxCharacters > 200) {
      u.maxCharacters = DEFAULT_MAX_CHARACTERS;
      changed = true;
    }
  }
  if (changed && d.schemaVersion < 7) notes.push('账号增加角色卡上限（默认 30）');

  // v7 -> v8：多 KP 体系
  //  - 守秘人分「首席（全局唯一，权限最大）」与「普通 KP」，KP 另有五级称号
  //  - 记录账号由哪位 KP 发放（createdBy / createdByName）
  //  - 角色卡增加托管（custody）与指定审核人（reviewKpId / reviewKpName）
  //  - 模组补发布者署名快照（createdByName）
  // 升级时把「最早创建的管理员」立为首席，其余既有管理员降为普通 KP（历史上实际只有一位）。
  const upgrading = !d.schemaVersion || d.schemaVersion < 8;
  if (upgrading) {
    const admins = d.users
      .filter((u) => u.role === 'admin')
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const chief = admins[0];
    for (const u of admins) u.kpRank = u === chief ? 'chief' : 'keeper';
    changed = true;
  }
  // 兜底：无论哪个版本，只要库里有人却没有首席，就把最早的管理员顶上（否则系统会没人能管）
  if (d.users.some((u) => u.role === 'admin') && !d.users.some((u) => u.role === 'admin' && u.kpRank === 'chief')) {
    const firstAdmin = d.users
      .filter((u) => u.role === 'admin')
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))[0];
    firstAdmin.kpRank = 'chief';
    changed = true;
  }
  for (const u of d.users) {
    if (u.role === 'admin') {
      if (u.kpRank !== 'chief' && u.kpRank !== 'keeper') { u.kpRank = 'keeper'; changed = true; }
      if (typeof u.kpTitle !== 'string' || !KP_TITLES.includes(u.kpTitle)) {
        u.kpTitle = u.kpRank === 'chief' ? KP_TITLES[KP_TITLES.length - 1] : KP_TITLES[0];
        changed = true;
      }
    } else {
      if (u.kpRank !== undefined) { delete u.kpRank; changed = true; }
      if (u.kpTitle !== undefined) { delete u.kpTitle; changed = true; }
    }
    if (u.createdBy === undefined) { u.createdBy = null; changed = true; }
    if (typeof u.createdByName !== 'string') { u.createdByName = ''; changed = true; }
    if (u.auditRules === undefined) { u.auditRules = null; changed = true; }
    // 老库里管理员头衔是「首席守秘人」，现在管理员也走玩家五级称号
    if (typeof u.title !== 'string' || !PLAYER_TITLES.includes(u.title)) {
      u.title = PLAYER_TITLES[0]; changed = true;
    }
  }
  // 模组署名：历史模组用发布者当前用户名回填（作者可能已改名，只能取现名）
  for (const m of d.modules) {
    if (typeof m.createdByName !== 'string' || !m.createdByName) {
      const author = d.users.find((u) => u.id === m.createdBy);
      m.createdByName = author ? author.username : '';
      changed = true;
    }
  }
  for (const c of d.characters) {
    if (c.custody === undefined) { c.custody = null; changed = true; }
    if (c.reviewKpId === undefined) { c.reviewKpId = null; changed = true; }
    if (c.reviewKpName === undefined) { c.reviewKpName = null; changed = true; }
  }

  // v8 -> v9：一张角色卡允许多位守秘人托管；新增守秘人「可带团」标记
  //  - custody 由单个对象升级为数组 [{ kpId, kpName, grantedAt, grantedBy }]
  //  - keeperMarks: [{ id, moduleId, kpId, kpName, at }] —— 任何守秘人都能标记任意模组
  //  - 老账号补「发放人」真实用户名（没有记录的按首席回填）
  const chiefUser = d.users.find((u) => u.role === 'admin' && u.kpRank === 'chief')
    || d.users.find((u) => u.role === 'admin');
  const chiefName = chiefUser ? chiefUser.username : '';
  for (const c of d.characters) {
    let list;
    if (Array.isArray(c.custody)) list = c.custody;
    else if (c.custody && typeof c.custody === 'object' && c.custody.kpId) list = [c.custody];
    else list = [];
    const seen = new Set();
    const next = [];
    for (const g of list) {
      if (!g || typeof g !== 'object' || typeof g.kpId !== 'string' || !g.kpId) continue;
      if (seen.has(g.kpId)) continue;
      seen.add(g.kpId);
      next.push({
        kpId: g.kpId,
        kpName: typeof g.kpName === 'string' ? g.kpName : '',
        grantedAt: Number(g.grantedAt) || 0,
        grantedBy: typeof g.grantedBy === 'string' ? g.grantedBy : '',
      });
    }
    if (JSON.stringify(next) !== JSON.stringify(c.custody)) { c.custody = next; changed = true; }
  }
  const markSeen = new Set();
  d.keeperMarks = (d.keeperMarks || []).filter((m) => {
    if (!m || typeof m !== 'object' || !m.moduleId || !m.kpId) return false;
    const key = `${m.moduleId}|${m.kpId}`;
    if (markSeen.has(key)) return false;
    markSeen.add(key);
    return true;
  }).map((m) => ({
    id: typeof m.id === 'string' && m.id ? m.id : `km_${m.moduleId}_${m.kpId}`,
    moduleId: m.moduleId,
    kpId: m.kpId,
    kpName: typeof m.kpName === 'string' ? m.kpName : '',
    at: Number(m.at) || 0,
  }));
  for (const u of d.users) {
    if (u.role === 'admin' || u.createdByName) continue;
    const issuer = u.createdBy ? d.users.find((x) => x.id === u.createdBy) : null;
    const name = (issuer && issuer.username) || chiefName || '';
    if (name) { u.createdByName = name; changed = true; }
  }

  if (!d.schemaVersion || d.schemaVersion < SCHEMA_VERSION) {
    d.schemaVersion = SCHEMA_VERSION;
    changed = true;
    notes.push(`数据结构升级到 v${SCHEMA_VERSION}（角色卡审核状态 / 自定义职业 / 审卡规则 / 年龄补正分配 / 成长记录与传奇标记）`);
  }
  return { changed, notes };
}

// ------------------------------------------------------------------ 读写
/**
 * 清理上次进程被强杀时遗留的原子写临时文件。
 * 只扫数据目录与备份目录顶层，避免每次启动递归遍历大目录。
 */
function cleanupStaleTmpFiles() {
  for (const dir of [DATA_DIR, BACKUP_DIR]) {
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue; // 目录不存在或不可读（首次启动）不算错误
    }
    for (const name of names) {
      if (!/^database\.json\..*\.tmp$/.test(name)) continue;
      try {
        fs.unlinkSync(path.join(dir, name));
        console.log(`[db] 已清理残留临时文件 ${path.join(dir, name)}`);
      } catch (err) {
        console.error(`[db] 清理残留临时文件失败 ${name}:`, err.message);
      }
    }
  }
}

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  cleanupStaleTmpFiles();
  // 安全（SEC-01）：旧版数据文件最初放在 backend/database.json，里面可能是明文口令。
  // 不再自动复制到数据目录；数据目录没有库时直接拒绝启动，宁可让运维手动处理。
  const legacy = path.join(__dirname, '..', 'database.json');
  const hasLegacy = fs.existsSync(legacy) && path.resolve(legacy) !== path.resolve(DB_FILE);
  if (!fs.existsSync(DB_FILE) && hasLegacy) {
    const err = new Error(
      `[db] 检测到旧版明文数据库 ${legacy}\n`
      + '     出于安全考虑已拒绝启动，且不会把它复制到数据目录。\n'
      + `     请确认 ${DB_FILE} 可用后删除或移出该文件；如确需迁移，请手动处理后重启。`
    );
    err.code = 'LEGACY_PLAINTEXT_DB';
    throw err;
  }
  if (hasLegacy) {
    console.warn(`[db] ⚠️  检测到旧版明文数据库 ${legacy}；当前使用 ${DB_FILE}，请尽快删除该旧文件`);
  }
  let raw = null;
  let existed = false;
  if (fs.existsSync(DB_FILE)) {
    existed = true;
    raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
  data = ensureShape(raw || emptyDB());
  const { changed, notes } = migrate(data);
  if (changed || !existed) {
    if (existed) backup('pre-migration');
    writeAtomic(data);
    for (const n of notes) console.log(`[db] ${n}`);
  }
  console.log(`[db] ${DB_FILE} 已载入：users=${data.users.length} modules=${data.modules.length} `
    + `characters=${data.characters.length} 自定义职业=${data.customOccupations.length} 审核记录=${data.reviews.length}`);
  return data;
}

export function db() {
  if (!data) load();
  return data;
}

/**
 * 落盘（写合并 + 原子替换）。
 * 一次请求内的多次修改只排一个 120ms 定时器；定时器到点写最新内存态。
 * 进程退出必须调用 saveNow()，否则窗口内的修改会丢。
 */
export function save() {
  if (!data) return;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!data) return;
    try { writeAtomic(data); } catch (err) { console.error('[db] 落盘失败:', err.message); }
  }, SAVE_DEBOUNCE_MS);
  if (typeof saveTimer.unref === 'function') saveTimer.unref();
}

/** 立即落盘：退出、迁移、以及不能容忍 120ms 丢失的关键写。 */
export function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!data) return;
  writeAtomic(data);
}

/**
 * 原子替换。
 * 临时文件名带进程号 + 时间戳 + 随机串：两个进程（或重试）同时落盘时不会互相覆盖半个文件。
 * Windows 上目标文件可能被杀毒/索引服务短暂占用，rename 对 EPERM/EACCES/EBUSY 做几次退避重试。
 */
function renameWithRetry(from, to) {
  let lastErr = null;
  for (let i = 0; i < 4; i += 1) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      lastErr = err;
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
      // writeAtomic 是同步路径，这里只能同步退避；仅在异常分支发生，最多约 120ms
      const until = Date.now() + 20 * (i + 1);
      while (Date.now() < until) { /* spin */ }
    }
  }
  throw lastErr;
}

function writeAtomic(obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  backupDailyOnce();
  const tmp = `${DB_FILE}.${process.pid}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.tmp`;
  const payload = JSON.stringify(obj);
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, payload, 'utf-8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    renameWithRetry(tmp, DB_FILE);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* 临时文件删不掉不影响主流程 */ }
    throw err;
  }
}

/** 每天只做一次 daily 备份：避免每次落盘都 readdir + 压缩。 */
function backupDailyOnce() {
  const day = new Date().toISOString().slice(0, 10);
  if (backedUpDay === day) return;
  backup('daily');
  backedUpDay = day;
}

/** 备份策略：每天最多一份（daily）、迁移前一份（pre-migration），只保留最近 N 份 */
function backup(tag) {
  if (!fs.existsSync(DB_FILE)) return;
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(BACKUP_DIR, tag === 'daily' ? `database-${day}.json` : `database-${tag}-${Date.now()}.json`);
    if (!fs.existsSync(file)) fs.copyFileSync(DB_FILE, file);
    const list = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('database-')).sort();
    while (list.length > BACKUP_KEEP) {
      const victim = list.shift();
      fs.unlinkSync(path.join(BACKUP_DIR, victim));
    }
  } catch (err) {
    console.error('[db] 备份失败（不影响主流程）:', err.message);
  }
}

// ------------------------------------------------------------------ 查询助手
export function findUserById(id) {
  return db().users.find((u) => u.id === id) || null;
}
export function findUserByToken(rawToken) {
  if (!rawToken) return null;
  const h = hashToken(rawToken);
  const now = Date.now();
  const user = db().users.find((u) => u.tokenHash && u.tokenHash === h) || null;
  if (!user) return null;
  if (user.tokenExpiresAt && user.tokenExpiresAt < now) return null;
  return user;
}
export function findModuleById(id) {
  return db().modules.find((m) => m.id === id) || null;
}
export function findCharacterById(id) {
  return db().characters.find((c) => c.id === id) || null;
}
export function findCustomOccupationById(id) {
  return db().customOccupations.find((o) => String(o.id) === String(id)) || null;
}
/** KP 自定义职业模板（供规则引擎解析 occupationId） */
export function customOccupations() {
  return db().customOccupations;
}
/** 某张角色卡的审核记录（按时间倒序，最新在前） */
export function reviewsOf(characterId) {
  return db().reviews
    .filter((r) => r.characterId === characterId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** 对外安全投影：任何情况下都不得把口令/令牌字段返回给客户端 */
export function publicUser(u) {
  if (!u) return null;
  const isKeeper = u.role === 'admin';
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    title: u.title || '见习调查员',
    // 多 KP：首席 = chief，其余守秘人 = keeper；玩家没有这两个字段
    kpRank: isKeeper ? (u.kpRank === 'chief' ? 'chief' : 'keeper') : null,
    kpTitle: isKeeper ? (u.kpTitle || '见习守秘人') : null,
    mustChangePassword: Boolean(u.mustChangePassword),
    characterLimit: Number.isInteger(u.maxCharacters) ? u.maxCharacters : DEFAULT_MAX_CHARACTERS,
  };
}

/**
 * 改名后的连带处理：把该用户名下、playerName 正好等于旧名的角色卡一并改名，
 * 避免"卡上写着旧名字"的错位。玩家自己手填过的其它名字不动。
 * @returns {number} 被同步的角色卡数量
 */
export function syncPlayerName(userId, oldName, newName) {
  let n = 0;
  for (const c of db().characters) {
    if (c.ownerId === userId && (c.playerName || '') === oldName) {
      c.playerName = newName;
      c.updatedAt = Date.now();
      n += 1;
    }
  }
  return n;
}

/** 用户名是否已被占用（改名时排除自己） */
export function usernameTaken(username, exceptUserId = null) {
  return db().users.some((u) => u.username === username && u.id !== exceptUserId);
}

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}
