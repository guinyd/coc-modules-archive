/**
 * 多 KP 体系的权限判定（唯一口径）。
 *
 * 兼容层：`role` 语义不变 —— `role === 'admin'` 仍然表示「守秘人」，旧代码里所有
 * `requireAdmin` 继续有效（普通 KP 也是 admin）。第二个维度 `kpRank` 区分：
 *   chief  —— 首席守秘人，全局唯一，所有校验直接放行；
 *   keeper —— 普通守秘人，只在被授权/被指派的范围内工作。
 *
 * 前端有一份同名同语义的实现（src/lib/roles.js），两边改动必须同步。
 */

import { audit } from './audit.js';
import { db } from './db.js';
import { forbidden } from './errors.js';
import { CHIEF_KP_TITLE, DEFAULT_AUDIT_RULES, KP_TITLES, normalizeHouseRules } from '../../shared/coc7e.js';

/** 任何守秘人（含首席） */
export function isKeeper(user) {
  return user?.role === 'admin';
}

/** 首席守秘人：全局权限最大，任何地方直接放行 */
export function isChief(user) {
  return user?.role === 'admin' && user.kpRank === 'chief';
}

/** 玩家 */
export function isPlayer(user) {
  return user?.role === 'user';
}

/** 必须首席：用于删除账号 / 改名 / 改头衔 / 审计日志等「其它 KP 不开放」的能力 */
export function requireChief(req, res, next) {
  if (!req.user) return next(forbidden('请先登录'));
  if (!isChief(req.user)) {
    audit(req, 'auth.forbidden_chief', { path: req.originalUrl });
    return next(forbidden('该操作仅限首席守秘人'));
  }
  next();
}

/** KP 对外显示用的称号：首席固定「首席守秘人」，其余取五级守秘人称号 */
export function kpDisplayTitle(user) {
  if (!isKeeper(user)) return '';
  if (isChief(user)) return CHIEF_KP_TITLE;
  return KP_TITLES.includes(user.kpTitle) ? user.kpTitle : KP_TITLES[0];
}

/** 可选的守秘人名单（玩家用来选审核人 / 托管人）——只暴露公开身份信息 */
export function keeperDirectory() {
  return db().users
    .filter((u) => u.role === 'admin')
    .sort((a, b) => {
      const ac = isChief(a) ? 0 : 1;
      const bc = isChief(b) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return (a.createdAt || 0) - (b.createdAt || 0);
    })
    .map((u) => ({
      id: u.id,
      username: u.username,
      kpTitle: kpDisplayTitle(u),
      isChief: isChief(u),
      characterCount: db().characters.filter((c) => c.ownerId === u.id).length,
    }));
}

/** 卡的主人本人，或首席 */
export function canEditCard(actor, character) {
  if (!actor || !character) return false;
  return isChief(actor) || character.ownerId === actor.id;
}

/** 这张卡的托管守秘人 id 列表（兼容旧的单对象写法） */
export function custodianIds(character) {
  const list = Array.isArray(character?.custody) ? character.custody : [];
  return list.map((g) => g?.kpId).filter(Boolean);
}

/** 托管中的那张卡：普通 KP 只能做「传奇 / 豁免年龄 / 教育」三个快捷操作（可多人托管） */
export function isCustodian(actor, character) {
  if (!actor || !character) return false;
  return isKeeper(actor) && custodianIds(character).includes(actor.id);
}

/** 能在角色卡管理页里看到 / 做快捷操作的卡：首席全部，普通 KP 只看托管给自己的 */
export function canManageCard(actor, character) {
  if (!actor || !character) return false;
  return isChief(actor) || canEditCard(actor, character) || isCustodian(actor, character);
}

/** 能审核这张卡：首席全部，普通 KP 只审「玩家指定送给自己」的 */
export function canReviewCard(actor, character) {
  if (!actor || !character) return false;
  if (isChief(actor)) return true;
  return isKeeper(actor) && Boolean(character?.reviewKpId) && character.reviewKpId === actor.id;
}

/**
 * 审卡规则的三层结构（v10.3 起）：
 *   1. 官方规则书基线 —— `DEFAULT_AUDIT_RULES`，代码内置、任何人都改不了；
 *   2. 全局默认规则 —— `settings.auditRules`，由首席守秘人显式「保存为全局默认」；
 *   3. 个人覆盖 —— `user.auditRules`，只影响本人的审卡判定（首席也一样）。
 *
 * 「重置为默认」= 清掉个人覆盖，回到全局默认（全局默认未设时即官方基线）；
 * 首席编辑自己的规则不会自动写进全局默认，必须显式保存。
 */
export function officialAuditRules() {
  return { ...DEFAULT_AUDIT_RULES };
}

export function globalAuditRules() {
  const legacy = db().settings?.auditRules || {};
  const set = globalAuditSet();
  return { ...DEFAULT_AUDIT_RULES, ...legacy, ...(set?.auditRules || {}) };
}

export function auditRulesFor(actor) {
  const base = globalAuditRules();
  if (!actor) return base;
  const set = activeRuleSet(actor);
  // 选了规则集就只用这套；未选择时用「临时规则」（user.auditRules，只对自己生效）
  if (set) return { ...base, ...(set.auditRules || {}) };
  const draft = isKeeper(actor) && actor.auditRules && typeof actor.auditRules === 'object' ? actor.auditRules : null;
  return { ...base, ...(draft || {}) };
}

// ------------------------------------------------------------------ 规则集
/** 全部规则集（全局 + 各守秘人个人），按发布者与更新时间排序 */
export function allRuleSets() {
  const out = [];
  for (const s of db().settings?.ruleSets || []) {
    if (s && s.scope === 'global') out.push(s);
  }
  for (const u of db().users) {
    if (u.role !== 'admin') continue;
    for (const s of u.ruleSets || []) {
      if (s && s.scope !== 'global') out.push(s);
    }
  }
  return out.filter((s) => s && typeof s.id === 'string');
}

export function ruleSetById(id) {
  if (!id) return null;
  return allRuleSets().find((s) => s.id === id) || null;
}

/** 某个守秘人当前启用的规则集；未选择时为 null（改用临时规则） */
export function activeRuleSet(user) {
  if (!isKeeper(user) || !user.activeRuleSetId) return null;
  return ruleSetById(user.activeRuleSetId);
}

/** 该守秘人实际生效的房规（全局集 + 个人集叠加，同 id 以后者为准） */
export function houseRulesFor(actor) {
  const base = normalizeHouseRules(globalAuditSet()?.houseRules || []);
  if (!actor || !isKeeper(actor)) return base;
  const set = activeRuleSet(actor);
  const extra = set ? (set.houseRules || []) : (actor.draftHouseRules || []);
  const merged = new Map(base.map((r) => [r.id, r]));
  for (const r of normalizeHouseRules(extra)) merged.set(r.id, r);
  return [...merged.values()];
}

/** 全局规则集（第一套 scope=global；没有时退回旧的 settings.auditRules） */
export function globalAuditSet() {
  return (db().settings?.ruleSets || []).find((s) => s && s.scope === 'global') || null;
}

/** 给前端的规则集摘要（不含内部字段） */
export function ruleSetSummary(set) {
  if (!set) return null;
  return {
    id: set.id,
    name: set.name,
    scope: set.scope === 'global' ? 'global' : 'personal',
    ownerId: set.ownerId || null,
    ownerName: set.ownerName || '',
    houseRules: normalizeHouseRules(set.houseRules || []),
    auditRules: set.auditRules && typeof set.auditRules === 'object' ? set.auditRules : {},
    createdAt: set.createdAt || 0,
    updatedAt: set.updatedAt || 0,
  };
}

/** 提交审核时冻结的规则快照 */
export function snapshotRuleSet(set) {
  const s = ruleSetSummary(set);
  if (!s) return null;
  return {
    setId: s.id,
    setName: s.name,
    ownerName: s.ownerName,
    scope: s.scope,
    houseRules: s.houseRules,
    auditRules: s.auditRules,
    at: Date.now(),
  };
}

/** 允许普通 KP 在托管卡上直接改的字段（其余一律拒绝） */
export const CUSTODIAN_PATCH_FIELDS = ['legendary', 'legendaryBonus', 'agePenaltyWaived'];