/**
 * 守秘人后台路由。
 *
 * 多 KP 体系下的分工：
 *   - 所有守秘人（含首席）都能进：发放玩家账号、发布自定义职业模板、维护自己的审卡规则；
 *   - 首席独有：删除账号 / 代改名 / 改头衔改称号 / 调建卡额度 / 重置他人密码 / 看审计日志 /
 *     任命守秘人 / 修改全局审卡基准规则；
 *   - 普通 KP 只能看到「自己发放的」账号，且字段裁剪为只读名单。
 *
 * 最小权限说明：管理员可以管理账号，但**无法读取任何人的口令**（只存哈希），
 * 重置口令时服务端生成随机口令并只回显一次。
 */

import crypto from 'node:crypto';
import { Router } from 'express';
import {
  db, save, publicUser, findUserById, newId, findCustomOccupationById,
  syncPlayerName, usernameTaken, DEFAULT_MAX_CHARACTERS,
} from '../lib/db.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import { checkPasswordStrength, hashPassword } from '../lib/security.js';
import { requireAdmin } from '../lib/auth.js';
import {
  isChief, requireChief, auditRulesFor, kpDisplayTitle,
} from '../lib/roles.js';
import {
  parseNewUser, parseTitle, parseKpTitle, parseKpRank, parseOccupationTemplate,
  parseAuditRules, parseUsernameChange, parseCharacterLimit, vId,
} from '../lib/validate.js';
import { audit, readAudit } from '../lib/audit.js';
import { DEFAULT_AUDIT_RULES, AUDIT_RULE_META } from '../../shared/coc7e.js';

const router = Router();
router.use(requireAdmin);

/** 把某个账号设为首席：全局唯一，其余守秘人一律降为普通 KP */
function setChief(userId, database) {
  for (const u of database.users) {
    if (u.role !== 'admin') continue;
    const next = u.id === userId ? 'chief' : 'keeper';
    if (u.kpRank !== next) {
      u.kpRank = next;
      u.updatedAt = Date.now();
    }
  }
}

// ============================================================ 账号
router.get('/users', (req, res) => {
  const database = db();
  const chief = isChief(req.user);
  const list = database.users
    // 普通 KP 只看得到自己发放的账号；首席看全部
    .filter((u) => chief || (u.createdBy && u.createdBy === req.user.id))
    .map((u) => {
      const base = {
        ...publicUser(u),
        characterCount: database.characters.filter((c) => c.ownerId === u.id).length,
        createdAt: u.createdAt || null,
        createdBy: u.createdBy || null,
        createdByName: u.createdByName || '',
      };
      // 普通 KP 不需要（也不该）看到别人的登录时间
      return chief ? { ...base, lastLoginAt: u.lastLoginAt || null } : base;
    });
  res.json(list);
});

router.post('/users', async (req, res) => {
  const { username, password, role, maxCharacters, kpTitle } = parseNewUser(req.body);
  const chief = isChief(req.user);
  if (!chief && role === 'admin') throw forbidden('只有首席守秘人才能任命新的守秘人');

  const database = db();
  if (database.users.some((u) => u.username === username)) throw badRequest('该用户名已存在');
  const problem = checkPasswordStrength(password);
  if (problem) throw badRequest(problem);

  const rec = await hashPassword(password);
  const now = Date.now();
  const user = {
    id: `u_${now.toString(36)}${crypto.randomBytes(2).toString('hex')}`,
    username,
    passwordHash: rec.hash,
    passwordSalt: rec.salt,
    passwordAlgo: 'scrypt',
    passwordParams: { N: rec.N, r: rec.r, p: rec.p },
    role,
    title: '见习调查员',
    // 普通 KP 发号时不能自行放大建卡额度，统一用默认值
    maxCharacters: chief ? maxCharacters : DEFAULT_MAX_CHARACTERS,
    kpRank: role === 'admin' ? 'keeper' : undefined,
    kpTitle: role === 'admin' ? (kpTitle || '见习守秘人') : undefined,
    auditRules: null,
    // 发放人留痕：谁把这个账号发出去的，永久可查
    createdBy: req.user.id,
    createdByName: req.user.username,
    tokenHash: null,
    tokenExpiresAt: 0,
    createdAt: now,
    updatedAt: now,
  };
  if (user.kpRank === undefined) delete user.kpRank;
  if (user.kpTitle === undefined) delete user.kpTitle;
  database.users.push(user);
  save();
  audit(req, 'admin.user_create', {
    userId: user.id, username, role, maxCharacters: user.maxCharacters, issuedBy: req.user.username,
  });
  res.json({ success: true, user: publicUser(user), createdByName: user.createdByName });
});

/** 调整账号的建卡上限；不允许低于该账号当前已持有的角色卡数 */
router.patch('/users/:id', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  const { maxCharacters } = parseCharacterLimit(req.body);
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  const used = db().characters.filter((c) => c.ownerId === id).length;
  if (maxCharacters < used) {
    throw badRequest(`该账号已有 ${used} 张角色卡，建卡上限不能低于现有数量`);
  }
  user.maxCharacters = maxCharacters;
  user.updatedAt = Date.now();
  save();
  audit(req, 'admin.user_limit', { userId: id, username: user.username, maxCharacters });
  res.json({ success: true, user: publicUser(user) });
});

router.put('/users/:id/password', requireChief, async (req, res) => {
  const id = vId(req.params.id, '用户');
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  // 服务端生成随机口令：不再使用 123456 这类固定弱口令
  const plain = `coc-${crypto.randomBytes(6).toString('base64url')}`;
  const rec = await hashPassword(plain);
  user.passwordHash = rec.hash;
  user.passwordSalt = rec.salt;
  user.passwordAlgo = 'scrypt';
  user.passwordParams = { N: rec.N, r: rec.r, p: rec.p };
  user.tokenHash = null;
  user.tokenExpiresAt = 0;
  user.updatedAt = Date.now();
  save();
  audit(req, 'admin.user_reset_password', { userId: id, username: user.username });
  res.json({ success: true, password: plain, note: '请立即转告本人并提醒其登录后自行修改' });
});

/** KP 代改用户名（发错账号名、玩家改名请求等场景） */
router.put('/users/:id/username', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  const { username } = parseUsernameChange(req.body);
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  if (user.username === username) throw badRequest('新用户名与该用户当前用户名相同');
  if (usernameTaken(username, id)) throw badRequest('该用户名已被占用');

  const oldName = user.username;
  user.username = username;
  user.updatedAt = Date.now();
  const synced = syncPlayerName(id, oldName, username);
  // 已发布的模组 / 职业模板保留发布时的署名快照，只标注改名，不追溯改写历史署名
  save();
  audit(req, 'admin.user_rename', { userId: id, from: oldName, to: username, syncedCharacters: synced });
  res.json({ success: true, user: publicUser(user), syncedCharacters: synced });
});

/** 玩家（含守秘人本人的玩家身份）五级荣誉头衔 */
router.put('/users/:id/title', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  const { title } = parseTitle(req.body);
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  user.title = title;
  user.updatedAt = Date.now();
  save();
  audit(req, 'admin.user_grant_title', { userId: id, username: user.username, title });
  res.json({ success: true, title });
});

/** 守秘人五级称号（与玩家称号并行，互不覆盖） */
router.put('/users/:id/kp-title', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  const { kpTitle } = parseKpTitle(req.body);
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  if (user.role !== 'admin') throw badRequest('该账号不是守秘人');
  user.kpTitle = kpTitle;
  user.updatedAt = Date.now();
  save();
  audit(req, 'admin.user_grant_kp_title', { userId: id, username: user.username, kpTitle });
  res.json({ success: true, kpTitle, display: kpDisplayTitle(user) });
});

/**
 * 任命 / 撤销守秘人，以及首席移交。
 * - kpRank: 'keeper' 表示「成为普通守秘人」；
 * - kpRank: 'chief'  表示「接任首席」，原首席自动降为普通守秘人（全局唯一）；
 * - role: 'user'     表示「撤销守秘人身份，回到玩家」。
 */
router.put('/users/:id/kp-rank', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  const { role, kpRank } = parseKpRank(req.body);
  const database = db();
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');

  if (role === 'user') {
    if (user.role !== 'admin') throw badRequest('该账号已经是玩家');
    if (isChief(user)) throw badRequest('不能撤销首席守秘人，请先把首席移交给其他人');
    user.role = 'user';
    delete user.kpRank;
    delete user.kpTitle;
    delete user.auditRules;
    // 撤销守秘人后，原先指派给他的审卡任务退回给首席，避免卡片卡在无人认领的队列里
    for (const c of database.characters) {
      if (c.reviewKpId === id) {
        c.reviewKpId = null;
        c.reviewKpName = null;
      }
      if (Array.isArray(c.custody) && c.custody.some((g) => g.kpId === id)) {
        c.custody = c.custody.filter((g) => g.kpId !== id);
      }
    }
    database.keeperMarks = database.keeperMarks.filter((m) => m.kpId !== id);
    user.updatedAt = Date.now();
    save();
    audit(req, 'admin.user_demote', { userId: id, username: user.username });
    return res.json({ success: true, user: publicUser(user) });
  }

  if (kpRank === 'chief') {
    // 移交首席：全局唯一
    setChief(id, database);
    user.role = 'admin';
    if (!user.kpTitle) user.kpTitle = '见习守秘人';
    save();
    audit(req, 'admin.chief_transfer', { userId: id, username: user.username, from: req.user.username });
    return res.json({ success: true, user: publicUser(user) });
  }

  // 成为普通守秘人
  if (user.id === req.user.id) throw badRequest('首席只能通过移交来离任');
  user.role = 'admin';
  user.kpRank = 'keeper';
  if (!user.kpTitle) user.kpTitle = '见习守秘人';
  user.updatedAt = Date.now();
  save();
  audit(req, 'admin.user_promote', { userId: id, username: user.username });
  res.json({ success: true, user: publicUser(user) });
});

router.delete('/users/:id', requireChief, (req, res) => {
  const id = vId(req.params.id, '用户');
  if (req.user.id === id) throw badRequest('不能删除自己');
  const database = db();
  const user = findUserById(id);
  if (!user) throw notFound('找不到该用户');
  if (isChief(user)) throw badRequest('不能删除首席守秘人，请先移交首席');
  if (user.role === 'admin' && database.users.filter((u) => u.role === 'admin').length <= 1) {
    throw badRequest('至少需要保留一名守秘人');
  }
  database.users = database.users.filter((u) => u.id !== id);
  // 级联清理：该用户的已跑记录与角色卡（旧实现会留下孤儿数据）
  const playedRemoved = database.played_records.filter((r) => r.userId === id).length;
  database.played_records = database.played_records.filter((r) => r.userId !== id);
  const charsRemoved = database.characters.filter((c) => c.ownerId === id).length;
  database.characters = database.characters.filter((c) => c.ownerId !== id);
  // 他托管中的卡与被指派的审卡任务一并清空
  for (const c of database.characters) {
    if (Array.isArray(c.custody) && c.custody.some((g) => g.kpId === id)) {
      c.custody = c.custody.filter((g) => g.kpId !== id);
    }
    if (c.reviewKpId === id) { c.reviewKpId = null; c.reviewKpName = null; }
  }
  database.keeperMarks = database.keeperMarks.filter((m) => m.kpId !== id);
  save();
  audit(req, 'admin.user_delete', { userId: id, username: user.username, playedRemoved, charsRemoved });
  res.json({ success: true, playedRemoved, charsRemoved });
});

router.get('/audit', requireChief, (req, res) => {
  const date = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
    ? req.query.date
    : new Date().toISOString().slice(0, 10);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
  res.json({ date, entries: readAudit(date, limit) });
});


// ============================================================ 职业模板
/**
 * KP 自定义职业模板：给「规则书没写、但本桌需要」的职业用。
 * 模板只保存**点法与本职技能清单**，不保存任何玩家数据，因此对其他玩家是只读的。
 * 发布署名在列表里公开展示（createdByName），只有作者本人或首席能改 / 删。
 */
router.get('/occupations', (req, res) => {
  res.json({ items: db().customOccupations });
});

router.post('/occupations', (req, res) => {
  const data = parseOccupationTemplate(req.body);
  const database = db();
  if (database.customOccupations.some((o) => o.name === data.name)) {
    throw badRequest('已存在同名职业模板');
  }
  if (database.customOccupations.length >= 100) throw badRequest('自定义职业模板最多 100 个');
  const now = Date.now();
  const occ = {
    id: newId('cocc'),
    ...data,
    isCustom: true,
    createdBy: req.user.id,
    createdByName: req.user.username,
    createdAt: now,
    updatedAt: now,
  };
  database.customOccupations.push(occ);
  save();
  audit(req, 'admin.occupation_create', { id: occ.id, name: occ.name });
  res.json(occ);
});

router.put('/occupations/:id', (req, res) => {
  const id = vId(req.params.id, '职业模板');
  const occ = findCustomOccupationById(id);
  if (!occ) throw notFound('找不到该职业模板');
  if (!isChief(req.user) && occ.createdBy !== req.user.id) {
    throw forbidden('只能修改自己发布的职业模板');
  }
  const data = parseOccupationTemplate(req.body);
  const database = db();
  if (database.customOccupations.some((o) => o.name === data.name && o.id !== occ.id)) {
    throw badRequest('已存在同名职业模板');
  }
  Object.assign(occ, data, { updatedAt: Date.now() });
  save();
  audit(req, 'admin.occupation_update', { id: occ.id, name: occ.name });
  res.json(occ);
});

router.delete('/occupations/:id', (req, res) => {
  const id = vId(req.params.id, '职业模板');
  const occ = findCustomOccupationById(id);
  if (!occ) throw notFound('找不到该职业模板');
  if (!isChief(req.user) && occ.createdBy !== req.user.id) {
    throw forbidden('只能删除自己发布的职业模板');
  }
  const database = db();
  database.customOccupations = database.customOccupations.filter((o) => o.id !== occ.id);
  // 已使用该模板的角色卡保留 occupationId，但解析不到职业 → 前端显示「职业模板已删除」，提示 KP 处理
  const affected = database.characters.filter((c) => String(c.occupationId) === String(occ.id)).length;
  save();
  audit(req, 'admin.occupation_delete', { id: occ.id, name: occ.name, affected });
  res.json({ success: true, affectedCharacters: affected });
});

// ============================================================ 辅助审卡规则
/**
 * 规则分两层：
 *   - 全局基准（settings.auditRules）：首席维护，所有玩家的规则提示都按它走；
 *   - 个人覆盖（user.auditRules）：普通 KP 自己的一份差异配置，只影响他自己的审核判定。
 * 首席直接使用全局基准（他自己就是基准的维护者）。
 */
router.get('/audit-rules', (req, res) => {
  const base = { ...DEFAULT_AUDIT_RULES, ...(db().settings?.auditRules || {}) };
  const effective = auditRulesFor(req.user);
  res.json({
    rules: effective,               // 兼容旧前端字段
    base,
    own: req.user.auditRules || null,
    effective,
    scope: isChief(req.user) ? 'global' : 'personal',
    meta: AUDIT_RULE_META,
  });
});

router.put('/audit-rules', (req, res) => {
  const rules = parseAuditRules(req.body);
  const database = db();
  if (isChief(req.user)) {
    database.settings = database.settings || {};
    database.settings.auditRules = rules;
    save();
    audit(req, 'admin.audit_rules_update', { enabled: rules.enabled, keys: Object.keys(rules).length });
    return res.json({ success: true, rules, scope: 'global' });
  }
  // 普通 KP：只保存与全局基准不同的差异项，基准变了也能自动跟上
  const base = { ...DEFAULT_AUDIT_RULES, ...(database.settings?.auditRules || {}) };
  const own = {};
  for (const key of Object.keys(rules)) {
    if (rules[key] !== base[key]) own[key] = rules[key];
  }
  req.user.auditRules = Object.keys(own).length ? own : null;
  req.user.updatedAt = Date.now();
  save();
  audit(req, 'admin.audit_rules_update', {
    enabled: rules.enabled, keys: Object.keys(own).length, scope: 'personal',
  });
  res.json({ success: true, rules: auditRulesFor(req.user), scope: 'personal' });
});

export default router;