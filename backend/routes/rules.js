/**
 * 规则集（房规 + 审卡规则的组合）。
 *
 * 一套规则集 = { auditRules, houseRules }。同一守秘人可以保存多套、随时切换；
 * 首席还能发布「全局规则集」供玩家在车卡时选用。玩家提交审核时会把选用的
 * 规则集冻结到角色卡上（ruleSnapshot），之后规则再改也不影响已提交的卡。
 */
import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { audit } from '../lib/audit.js';
import { save, db } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import {
  isChief, isKeeper, allRuleSets, ruleSetById, ruleSetSummary, activeRuleSet,
} from '../lib/roles.js';
import {
  AUDIT_RULE_META, DEFAULT_AUDIT_RULES, HOUSE_RULE_LIMIT, normalizeHouseRules,
} from '../../shared/coc7e.js';
import { parseAuditRules } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

const newId = () => `rs_${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;

function parseName(value) {
  const name = String(value == null ? '' : value).trim().slice(0, 30);
  if (name.length < 1) throw badRequest('规则集需要一个名字');
  return name;
}

/** 只存与官方默认不同的项，方便叠加与比较 */
function diffRules(full) {
  const out = {};
  for (const meta of AUDIT_RULE_META) {
    if (full[meta.key] !== DEFAULT_AUDIT_RULES[meta.key]) out[meta.key] = full[meta.key];
  }
  return out;
}

function parseSetBody(body) {
  const b = body && typeof body === 'object' ? body : {};
  const auditRules = b.auditRules === undefined ? {} :
    (b.auditRules && typeof b.auditRules === 'object' ? diffRules(parseAuditRules(b.auditRules)) : {});
  const houseRules = normalizeHouseRules(Array.isArray(b.houseRules) ? b.houseRules.slice(0, HOUSE_RULE_LIMIT) : []);
  return { name: parseName(b.name), auditRules, houseRules };
}

function findOwnedSet(req, id) {
  const set = ruleSetById(id);
  if (!set) throw notFound('规则集不存在');
  const global = set.scope === 'global';
  const owner = global ? isChief(req.user) : set.ownerId === req.user.id;
  if (!owner) throw forbidden(global ? '全局规则集只能由首席维护' : '只能修改自己的规则集');
  return set;
}

/** 删除权限：本人可删自己的个人集；首席可删任何规则集（含其他守秘人的个人集） */
function findDeletableSet(req, id) {
  const set = ruleSetById(id);
  if (!set) throw notFound('规则集不存在');
  if (set.scope === 'global') throw forbidden('全局默认规则集不能删除');
  if (isChief(req.user)) return set;
  if (set.scope === 'global') throw forbidden('全局规则集只能由首席维护');
  if (set.ownerId !== req.user.id) throw forbidden('只能删除自己的规则集');
  return set;
}

function summaryFor(req, set) {
  const s = ruleSetSummary(set);
  if (!s) return null;
  const active = activeRuleSet(req.user);
  return {
    ...s,
    isMine: s.ownerId === req.user.id,
    isActive: Boolean(active && active.id === s.id),
  };
}

/** 全部可用规则集：全局 + 所有守秘人的个人规则集（玩家选卡时要能看到是谁的） */
router.get('/rule-sets', (req, res) => {
  const keeper = isKeeper(req.user);
  const active = keeper ? activeRuleSet(req.user) : null;
  res.json({
    items: allRuleSets().map((s) => {
      const item = summaryFor(req, s);
      // 审卡阈值属于守秘人的工作参数，玩家只需要房规与发布者；不向前端泄露
      if (item && !keeper) {
        delete item.auditRules;
        item.isActive = false;
      }
      return item;
    }),
    activeId: active ? active.id : null,
  });
});

router.post('/rule-sets', (req, res) => {
  if (!isKeeper(req.user)) throw forbidden('只有守秘人可以创建规则集');
  const body = req.body || {};
  const scope = body.scope === 'global' ? 'global' : 'personal';
  if (scope === 'global' && !isChief(req.user)) throw forbidden('只有首席守秘人可以发布全局规则集');
  const { name, auditRules, houseRules } = parseSetBody(body);
  const now = Date.now();
  const set = {
    id: newId(), name, scope,
    ownerId: scope === 'global' ? null : req.user.id,
    ownerName: isChief(req.user) ? '首席守秘人' : (req.user.username || ''),
    auditRules, houseRules,
    createdAt: now, updatedAt: now,
  };
  if (scope === 'global') {
    db().settings.ruleSets = [...(db().settings.ruleSets || []), set];
  } else {
    req.user.ruleSets = [...(req.user.ruleSets || []), set];
  }
  audit(req, 'ruleset.create', { setId: set.id, name, scope });
  save();
  res.status(201).json({ item: summaryFor(req, set) });
});

/** 设为当前启用的规则集；id 传 null / 空串表示回到「未选择」（使用临时规则） */
router.put('/rule-sets/active', (req, res) => {
  if (!isKeeper(req.user)) throw forbidden('只有守秘人可以启用规则集');
  const id = req.body?.id ?? null;
  if (id === null || id === '') {
    req.user.activeRuleSetId = null;
    req.user.updatedAt = Date.now();
    audit(req, 'ruleset.activate', { setId: null, name: '未选择' });
    save();
    return res.json({ success: true, activeId: null });
  }
  const set = ruleSetById(id);
  if (!set) throw notFound('规则集不存在');
  // 允许启用其他守秘人发布的规则集：只是使用，不获得维护权
  req.user.activeRuleSetId = set.id;
  audit(req, 'ruleset.activate', { setId: set.id, name: set.name });
  save();
  res.json({ success: true, activeId: set.id });
});

router.put('/rule-sets/:id', (req, res) => {
  const set = findOwnedSet(req, req.params.id);
  const { name, auditRules, houseRules } = parseSetBody({ ...req.body, name: req.body?.name ?? set.name });
  set.name = name;
  set.auditRules = auditRules;
  set.houseRules = houseRules;
  set.updatedAt = Date.now();
  audit(req, 'ruleset.update', { setId: set.id, name });
  save();
  res.json({ item: summaryFor(req, set) });
});

router.delete('/rule-sets/:id', (req, res) => {
  const set = findDeletableSet(req, req.params.id);
  if (set.scope === 'global') {
    db().settings.ruleSets = (db().settings.ruleSets || []).filter((s) => s.id !== set.id);
  } else {
    // 首席可删别人的个人集，所以从属主账号里移除，而不是从当前请求者
    const owner = db().users.find((u) => u.id === set.ownerId);
    if (owner) {
      owner.ruleSets = (owner.ruleSets || []).filter((s) => s.id !== set.id);
      if (owner.activeRuleSetId === set.id) {
        owner.activeRuleSetId = owner.ruleSets[0]?.id || null;
      }
    }
  }
  // 引用它的角色卡保留 ruleSnapshot；未提交的卡清掉选择，避免指向空规则集
  for (const c of db().characters) {
    if (c.ruleSetId === set.id) c.ruleSetId = null;
  }
  audit(req, 'ruleset.delete', { setId: set.id, name: set.name });
  save();
  res.json({ success: true, id: set.id });
});

/** 兼容旧调用：PUT /rule-sets/:id/active */
router.put('/rule-sets/:id/active', (req, res) => {
  if (!isKeeper(req.user)) throw forbidden('只有守秘人可以启用规则集');
  const set = ruleSetById(req.params.id);
  if (!set) throw notFound('规则集不存在');
  req.user.activeRuleSetId = set.id;
  audit(req, 'ruleset.activate', { setId: set.id, name: set.name });
  save();
  res.json({ success: true, activeId: set.id });
});

/** 复制一套到自己的个人规则集（方便从全局默认起步） */
router.post('/rule-sets/:id/duplicate', (req, res) => {
  if (!isKeeper(req.user)) throw forbidden('只有守秘人可以复制规则集');
  const src = ruleSetById(req.params.id);
  if (!src) throw notFound('规则集不存在');
  const now = Date.now();
  const set = {
    id: newId(),
    name: parseName(req.body?.name || `${src.name}（副本）`),
    scope: 'personal',
    ownerId: req.user.id,
    ownerName: req.user.username || '',
    auditRules: { ...(src.auditRules || {}) },
    houseRules: normalizeHouseRules(src.houseRules || []),
    createdAt: now, updatedAt: now,
  };
  req.user.ruleSets = [...(req.user.ruleSets || []), set];
  audit(req, 'ruleset.duplicate', { from: src.id, setId: set.id });
  save();
  res.status(201).json({ item: summaryFor(req, set) });
});

export default router;