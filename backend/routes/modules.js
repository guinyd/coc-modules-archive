/**
 * 模组档案 / 已跑标记 / KP 带团记录路由。
 *
 * 与旧实现的关键差异：
 *  - POST/PUT 使用显式白名单（parseModule），彻底修掉「客户端可覆盖 id」的写入漏洞。
 *  - 删除模组时级联清理 played_records、sessions，并**解除角色卡上的模组经历关联**。
 *  - 带团记录的玩家名单与人数在服务端做了长度与区间约束。
 */

import { Router } from 'express';
import {
  db, save, findModuleById, newId,
} from '../lib/db.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import { requireAdmin, requireAuth } from '../lib/auth.js';
import { isChief, kpDisplayTitle } from '../lib/roles.js';
import { parseModule, parseSession, vId } from '../lib/validate.js';
import { audit } from '../lib/audit.js';

const router = Router();

const THEME_COLORS = [
  'from-gray-900 to-slate-700', 'from-green-900 to-emerald-900',
  'from-purple-900 to-indigo-900', 'from-red-950 to-orange-900',
  'from-blue-950 to-cyan-900', 'from-amber-900 to-stone-900',
];

// ------------------------------------------------------------------ 模组
router.get('/modules', (req, res) => {
  const modules = [...db().modules].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  res.json(modules);
});

router.post('/modules', requireAdmin, (req, res) => {
  const data = parseModule(req.body);
  const now = Date.now();
  // id / themeColor / createdAt 由服务端生成，客户端无从干预
  const mod = {
    id: newId('m'),
    ...data,
    themeColor: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
    createdAt: now,
    updatedAt: now,
    createdBy: req.user.id,
    // 发布署名：快照当时的 KP 名字，之后改名不影响历史署名的可读性
    createdByName: req.user.username,
    createdByTitle: kpDisplayTitle(req.user),
  };
  db().modules.push(mod);
  save();
  audit(req, 'module.create', { moduleId: mod.id, title: mod.title });
  res.json(mod);
});

router.put('/modules/:id', requireAdmin, (req, res) => {
  const id = vId(req.params.id, '模组');
  const mod = findModuleById(id);
  if (!mod) throw notFound('找不到该模组');
  // 普通 KP 只能改自己发布的模组；首席不受限
  if (!isChief(req.user) && mod.createdBy !== req.user.id) {
    throw forbidden('只能修改自己发布的模组');
  }
  const data = parseModule(req.body, { partial: true });
  Object.assign(mod, data, { updatedAt: Date.now() });
  save();
  audit(req, 'module.update', { moduleId: id, fields: Object.keys(data) });
  res.json(mod);
});

router.delete('/modules/:id', requireAdmin, (req, res) => {
  const id = vId(req.params.id, '模组');
  const database = db();
  const mod = findModuleById(id);
  if (!mod) throw notFound('找不到该模组');
  if (!isChief(req.user) && mod.createdBy !== req.user.id) {
    throw forbidden('只能删除自己发布的模组');
  }
  database.modules = database.modules.filter((m) => m.id !== id);
  const played = database.played_records.filter((r) => r.moduleId === id).length;
  database.played_records = database.played_records.filter((r) => r.moduleId !== id);
  const sessions = database.sessions.filter((s) => s.moduleId === id).length;
  database.sessions = database.sessions.filter((s) => s.moduleId !== id);
  // 角色卡上的「经历」关联也要一并摘除，避免出现指向已删模组的死链
  let unlinked = 0;
  for (const c of database.characters) {
    const before = c.moduleLinks?.length || 0;
    c.moduleLinks = (c.moduleLinks || []).filter((l) => l.moduleId !== id);
    if (c.moduleLinks.length !== before) { c.updatedAt = Date.now(); unlinked += 1; }
  }
  database.keeperMarks = database.keeperMarks.filter((m) => m.moduleId !== id);
  save();
  audit(req, 'module.delete', { moduleId: id, played, sessions, unlinkedCharacters: unlinked });
  res.json({ success: true, playedRemoved: played, sessionsRemoved: sessions, charactersUnlinked: unlinked });
});

// ------------------------------------------------------------------ 已跑标记
router.get('/played', requireAuth, (req, res) => {
  res.json(db().played_records.filter((r) => r.userId === req.user.id));
});

router.post('/played', requireAuth, (req, res) => {
  const moduleId = vId(req.body?.moduleId, '模组');
  const database = db();
  if (!findModuleById(moduleId)) throw notFound('找不到该模组');
  const idx = database.played_records.findIndex(
    (r) => r.userId === req.user.id && r.moduleId === moduleId,
  );
  let played;
  if (idx >= 0) {
    database.played_records.splice(idx, 1);
    played = false;
  } else {
    database.played_records.push({ userId: req.user.id, moduleId, at: Date.now() });
    played = true;
  }
  save();
  audit(req, 'played.toggle', { moduleId, played });
  res.json({ success: true, played });
});

// ------------------------------------------------------------------ 带团记录
router.get('/sessions', requireAdmin, (req, res) => {
  const database = db();
  const list = database.sessions
    // 普通 KP 只看自己的带团记录；首席看全站（盘点用）
    .filter((s) => isChief(req.user) || s.createdBy === req.user.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(list);
});

router.post('/sessions', requireAdmin, (req, res) => {
  const data = parseSession(req.body);
  if (!findModuleById(data.moduleId)) throw badRequest('模组不存在，请先收录该模组');
  const session = { id: newId('s'), ...data, createdAt: Date.now(), createdBy: req.user.id };
  db().sessions.push(session);
  save();
  audit(req, 'session.create', { sessionId: session.id, moduleId: data.moduleId });
  res.json(session);
});

router.delete('/sessions/:id', requireAdmin, (req, res) => {
  const id = vId(req.params.id, '记录');
  const database = db();
  const session = database.sessions.find((s) => s.id === id);
  if (!session) throw notFound('找不到该记录');
  if (!isChief(req.user) && session.createdBy !== req.user.id) {
    throw forbidden('只能删除自己的带团记录');
  }
  database.sessions = database.sessions.filter((s) => s.id !== id);
  save();
  audit(req, 'session.delete', { sessionId: id });
  res.json({ success: true });
});

// ------------------------------------------------------------------ 守密人名册
/**
 * 名册：所有守秘人 + 各自标记「可带团」的模组。
 * 需要登录才能查看（访客只能看到模组本身，看不到谁带过）。
 */
router.get('/keepers/roster', requireAuth, (req, res) => {
  const database = db();
  const marks = database.keeperMarks || [];
  const items = database.users
    .filter((u) => u.role === 'admin')
    .map((u) => {
      const own = marks
        .filter((m) => m.kpId === u.id)
        .sort((a, b) => (b.at || 0) - (a.at || 0));
      return {
        id: u.id,
        username: u.username,
        kpTitle: kpDisplayTitle(u),
        isChief: isChief(u),
        moduleIds: own.map((m) => m.moduleId),
        moduleCount: own.length,
      };
    })
    .sort((a, b) => (Number(b.isChief) - Number(a.isChief))
      || (b.moduleCount - a.moduleCount)
      || String(a.username).localeCompare(String(b.username)));
  res.json({ items });
});

/** 任何守秘人都能给任意模组打「可带团」标记（与谁发布的无关），再点一次取消。 */
router.post('/modules/:id/mark', requireAdmin, (req, res) => {
  const moduleId = vId(req.params.id, '模组');
  const database = db();
  if (!findModuleById(moduleId)) throw notFound('找不到该模组');
  const marks = database.keeperMarks;
  const idx = marks.findIndex((m) => m.moduleId === moduleId && m.kpId === req.user.id);
  let marked;
  if (idx >= 0) {
    marks.splice(idx, 1);
    marked = false;
  } else {
    marks.push({
      id: newId('km'),
      moduleId,
      kpId: req.user.id,
      kpName: req.user.username,
      at: Date.now(),
    });
    marked = true;
  }
  save();
  audit(req, 'keeper.mark', { moduleId, marked });
  res.json({ success: true, marked, moduleId, kpId: req.user.id });
});

export default router;
