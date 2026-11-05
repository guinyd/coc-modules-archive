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
  isChief, requireChief, auditRulesFor, kpDisplayTitle, officialAuditRules, globalAuditRules,
  activeRuleSet, globalAuditSet, ruleSetSummary,
} from '../lib/roles.js';
import {
  parseNewUser, parseTitle, parseKpTitle, parseKpRank, parseOccupationTemplate,
  parseAuditRules, parseUsernameChange, parseCharacterLimit, vId,
} from '../lib/validate.js';
import { audit, readAudit } from '../lib/audit.js';
import { AUDIT_RULE_META, normalizeHouseRules } from '../../shared/coc7e.js';

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
 * 三层结构（v10.3 起）：
 *   官方规则书基线 —— 代码内置（DEFAULT_AUDIT_RULES），任何人都不能改；
 *   全局默认规则   —— settings.auditRules，首席显式「保存为全局默认」；
 *   个人覆盖       —— user.auditRules，只影响本人审卡（首席也一样）。
 *
 * 「重置为默认」= 清空个人覆盖，回落到全局默认（未设即官方基线）。
 */
/** 规则集清单（自己的 + 全局），供规则页的切换器使用 */
function ruleSetList(user) {
  const globals = (db().settings.ruleSets || []).filter((s) => s && s.scope === 'global');
  const mine = (user.ruleSets || []).filter((s) => s && s.scope !== 'global');
  return [...globals, ...mine].map((s) => {
    const out = ruleSetSummary(s);
    return out ? { ...out, isMine: out.ownerId === user.id } : null;
  }).filter(Boolean);
}

router.get('/audit-rules', (req, res) => {
  const official = officialAuditRules();
  const global = globalAuditRules();
  const effective = auditRulesFor(req.user);
  const active = activeRuleSet(req.user);
  const gset = globalAuditSet();
  const draft = req.user.auditRules && typeof req.user.auditRules === 'object' ? req.user.auditRules : {};
  const draftHouseRules = normalizeHouseRules(req.user.draftHouseRules || []);
  res.json({
    rules: effective,               // 兼容旧前端字段
    meta: AUDIT_RULE_META,          // 兼容旧前端：规则元数据
    official,                       // 官方规则书基线
    global,                         // 全局默认（官方 < 首席设定）
    base: global,                   // 兼容旧字段
    own: active && active.ownerId === req.user.id ? (active.auditRules || null) : null,
    effective,
    personalized: active
      ? Boolean(active.ownerId === req.user.id && Object.keys(active.auditRules || {}).length)
      : Object.keys(draft).length > 0,
    hasGlobal: Boolean((gset && Object.keys(gset.auditRules || {}).length)
      || Object.keys(db().settings?.auditRules || {}).length),
    activeSet: ruleSetSummary(active),
    activeSetId: active ? active.id : null,
    sets: ruleSetList(req.user),
    draftRules: { ...global, ...draft },      // 「未选择」模式下编辑用的完整规则
    draftHouseRules,                          // 临时规则里的自定义规则（只含审卡校验）
    draftPersonalized: Object.keys(draft).length > 0 || draftHouseRules.length > 0,
  });
});

/**
 * 保存「未选择」模式下的临时规则：只写在自己的 user.auditRules / draftHouseRules 上，
 * 不创建规则集、不出现在他人的列表里；同时清掉 activeRuleSetId。
 */
router.put('/audit-rules', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const rules = parseAuditRules(body.auditRules && typeof body.auditRules === 'object' ? body.auditRules : body);
  const base = globalAuditRules();
  const diff = {};
  for (const key of Object.keys(rules)) {
    if (rules[key] !== base[key]) diff[key] = rules[key];
  }
  const draftHouseRules = normalizeHouseRules(Array.isArray(body.houseRules) ? body.houseRules : [])
    .filter((r) => r.type !== 'deriveBase');
  req.user.auditRules = Object.keys(diff).length ? diff : null;
  req.user.draftHouseRules = draftHouseRules;
  req.user.activeRuleSetId = null;
  req.user.updatedAt = Date.now();
  save();
  audit(req, 'admin.audit_rules_draft', {
    enabled: rules.enabled, keys: Object.keys(diff).length, houseRules: draftHouseRules.length,
  });
  res.json({
    success: true, draft: true, scope: 'personal',
    rules: auditRulesFor(req.user), own: req.user.auditRules,
    personalized: Object.keys(diff).length > 0,
    activeSetId: null, activeSet: null, sets: ruleSetList(req.user),
    draftRules: { ...base, ...(req.user.auditRules || {}) },
    draftHouseRules, draftPersonalized: Object.keys(diff).length > 0 || draftHouseRules.length > 0,
  });
});

router.delete('/audit-rules', (req, res) => {
  req.user.auditRules = null;
  req.user.draftHouseRules = [];
  req.user.updatedAt = Date.now();
  save();
  audit(req, 'admin.audit_rules_reset', { scope: 'draft' });
  res.json({
    success: true, draft: true, scope: 'personal',
    rules: auditRulesFor(req.user), own: null, personalized: false,
    activeSetId: null, activeSet: null, sets: ruleSetList(req.user),
    draftRules: globalAuditRules(), draftHouseRules: [], draftPersonalized: false,
  });
});

/** 首席：把当前规则写进「全局规则集」（没有就建一套） */
router.put('/audit-rules/global', requireChief, (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const rules = parseAuditRules(body.auditRules && typeof body.auditRules === 'object' ? body.auditRules : body);
  const base = officialAuditRules();
  const diff = {};
  for (const key of Object.keys(rules)) {
    if (rules[key] !== base[key]) diff[key] = rules[key];
  }
  const now = Date.now();
  let set = globalAuditSet();
  if (!set) {
    set = {
      id: `rs_global_${now.toString(36)}`,
      name: '全局默认规则',
      scope: 'global',
      ownerId: null,
      ownerName: '首席守秘人',
      auditRules: {}, houseRules: [],
      createdAt: now, updatedAt: now,
    };
    db().settings.ruleSets = [...(db().settings.ruleSets || []), set];
  }
  const displayName = String(body.name == null ? '' : body.name).trim().slice(0, 30);
  if (displayName) set.name = displayName;
  set.auditRules = diff;
  if (Array.isArray(body.houseRules)) {
    set.houseRules = normalizeHouseRules(body.houseRules);
  }
  set.updatedAt = now;
  req.user.auditRules = null;
  req.user.updatedAt = now;
  save();
  audit(req, 'admin.audit_rules_global', { enabled: rules.enabled, keys: Object.keys(diff).length });
  res.json({
    success: true, rules: globalAuditRules(), global: diff, own: null,
    hasGlobal: Object.keys(diff).length > 0, activeSetId: set.id,
    activeSet: ruleSetSummary(set), sets: ruleSetList(req.user), scope: 'chief',
  });
});

router.delete('/audit-rules/global', requireChief, (req, res) => {
  const now = Date.now();
  for (const s of db().settings.ruleSets || []) {
    if (s && s.scope === 'global') { s.auditRules = {}; s.updatedAt = now; }
  }
  if (db().settings) db().settings.auditRules = null;
  req.user.auditRules = null;
  req.user.updatedAt = now;
  save();
  audit(req, 'admin.audit_rules_global_reset', {});
  res.json({
    success: true, rules: globalAuditRules(), global: null, own: null,
    hasGlobal: false, sets: ruleSetList(req.user), scope: 'chief',
  });
});

export default router;