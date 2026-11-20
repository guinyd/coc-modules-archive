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
import { resolveRuleset } from '../../shared/rulesets/index.js';
import { KPCP_DEFAULT_RULES, normalizeKpcpRules } from '../../shared/rulesets/kpcp.js';

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
export function officialAuditRules(gameSystem) {
  return baseAuditRules(gameSystem);
}

/**
 * 基础游戏规则：只有官方七版与通俗克苏鲁两套。
 * 守秘人伴侣（kpcp）自 v10.13 起不再是一套 gameSystem，而是可叠加在两套之上的规则层；
 * 旧数据里 gameSystem === 'kpcp' 的角色按「官方七版 + 伴侣层」迁移。
 */
export function systemOf(value) {
  return value === 'pulp' ? 'pulp' : 'classic7e';
}

/** 旧数据 / 旧接口里可能出现的 kpcp 规则：
 *  - gameSystem === 'kpcp'（v10.11 / v10.12 的独立规则）
 *  - gameSystem === 'kpcp' 的规则集
 * 用于迁移，不作为新数据的可选值。 */
export function isLegacyKpcpSystem(value) {
  return value === 'kpcp';
}

/** 每套游戏规则在用户记录上的槽位（当前启用的规则集 / 临时规则 / 临时房规） */
export const SYSTEM_SLOTS = {
  classic7e: { active: 'activeRuleSetId', rules: 'auditRules', houses: 'draftHouseRules' },
  pulp: { active: 'activeRuleSetPulpId', rules: 'auditRulesPulp', houses: 'draftHouseRulesPulp' },
};

export function slotsOf(gameSystem) {
  return SYSTEM_SLOTS[systemOf(gameSystem)] || SYSTEM_SLOTS.classic7e;
}

/** 某套游戏规则的官方审卡基线：官方 7e 用内置默认，通克再叠加规则集自带的差异项 */
export function baseAuditRules(gameSystem) {
  const R = resolveRuleset(systemOf(gameSystem));
  return { ...DEFAULT_AUDIT_RULES, ...(R.auditRules || {}) };
}

export function globalAuditRules(gameSystem) {
  const sys = systemOf(gameSystem);
  const legacy = sys === 'classic7e' ? (db().settings?.auditRules || {}) : {};
  const set = globalAuditSet(sys);
  return { ...baseAuditRules(sys), ...legacy, ...(set?.auditRules || {}) };
}

export function auditRulesFor(actor, gameSystem) {
  const sys = systemOf(gameSystem);
  const base = globalAuditRules(sys);
  if (!actor) return base;
  const set = activeRuleSet(actor, sys);
  // 选了规则集就只用这套；未选择时用「临时规则」（按规则分开存，只对自己生效）
  if (set) return { ...base, ...(set.auditRules || {}) };
  const slot = slotsOf(sys).rules;
  const raw = isKeeper(actor) ? actor[slot] : null;
  const draft = raw && typeof raw === 'object' ? raw : null;
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

/** 某个守秘人当前启用的规则集（按游戏规则各有一套）；未选择时为 null（改用临时规则） */
export function activeRuleSet(user, gameSystem) {
  if (!isKeeper(user)) return null;
  const sys = systemOf(gameSystem);
  const id = user[slotsOf(sys).active];
  if (!id) return null;
  const set = ruleSetById(id);
  // 规则集与游戏规则必须匹配；旧数据没有 gameSystem 的一律算官方七版
  if (!set || systemOf(set.gameSystem) !== sys) return null;
  return set;
}

/** 该守秘人实际生效的房规（全局集 + 个人集叠加，同 id 以后者为准） */
export function houseRulesFor(actor, gameSystem) {
  const sys = systemOf(gameSystem);
  const base = normalizeHouseRules(globalAuditSet(sys)?.houseRules || []);
  if (!actor || !isKeeper(actor)) return base;
  const set = activeRuleSet(actor, sys);
  const fallback = actor[slotsOf(sys).houses] || [];
  const extra = set ? (set.houseRules || []) : fallback;
  const merged = new Map(base.map((r) => [r.id, r]));
  for (const r of normalizeHouseRules(extra)) merged.set(r.id, r);
  return [...merged.values()];
}

/** 全局规则集（每套游戏规则各取第一套 scope=global；没有时退回旧的 settings.auditRules） */
export function globalAuditSet(gameSystem) {
  const sys = systemOf(gameSystem);
  return (db().settings?.ruleSets || []).find((s) => s && s.scope === 'global' && systemOf(s.gameSystem) === sys) || null;
}

/** 给前端的规则集摘要（不含内部字段） */
export function ruleSetSummary(set) {
  if (!set) return null;
  const sys = systemOf(set.gameSystem);
  return {
    id: set.id,
    name: set.name,
    gameSystem: sys,
    // 未开启的规则集不对外暴露伴侣房规内容（避免玩家/前端误判为已配置）
    kpcp: set.kpcpEnabled === true && set.kpcp ? normalizeKpcpRules(set.kpcp) : null,
    kpcpEnabled: set.kpcpEnabled === true,
    scope: set.scope === 'global' ? 'global' : 'personal',
    ownerId: set.ownerId || null,
    ownerName: set.ownerName || '',
    houseRules: normalizeHouseRules(set.houseRules || []),
    auditRules: set.auditRules && typeof set.auditRules === 'object' ? set.auditRules : {},
    createdAt: set.createdAt || 0,
    updatedAt: set.updatedAt || 0,
  };
}

/**
 * 提交审核时冻结的规则快照。
 *
 * auditRules 存的是**该规则集真实生效的完整阈值**（全局继承层 < 本集差异），而不是
 * 规则集里的差异项：审卡时直接按快照执行，既不受审卡人自己那套规则影响，也不会因为
 * 全局规则后来改动而让已提交的卡变了判据（v10.14.0 修复）。
 */
export function snapshotRuleSet(set) {
  const s = ruleSetSummary(set);
  if (!s) return null;
  return {
    setId: s.id,
    setName: s.name,
    gameSystem: s.gameSystem,
    ownerName: s.ownerName,
    scope: s.scope,
    houseRules: s.houseRules,
    auditRules: { ...globalAuditRules(s.gameSystem), ...(s.auditRules || {}) },
    kpcp: s.kpcp,
    kpcpEnabled: s.kpcpEnabled === true,
    at: Date.now(),
  };
}

/**
 * 守秘人伴侣的可选房规（规则层配置）：优先「当前启用的规则集」，
 * 其次「全局规则集」，再次 KP 的临时规则，最后回落到官方默认。
 * v10.13 起任何基础规则（七版 / 通克）都可以带伴侣层，因此不再限定 kpcp 系统。
 */
export function kpcpRulesFor(actor, gameSystem) {
  const sys = systemOf(gameSystem);
  const active = actor ? activeRuleSet(actor, sys) : null;
  if (active?.kpcpEnabled === true && active.kpcp) return normalizeKpcpRules(active.kpcp);
  const global = globalAuditSet(sys);
  if (global?.kpcpEnabled === true && global.kpcp) return normalizeKpcpRules(global.kpcp);
  if (actor?.draftKpcpRules) return normalizeKpcpRules(actor.draftKpcpRules);
  return normalizeKpcpRules(KPCP_DEFAULT_RULES);
}

/** 某套基础规则下「哪些规则集带了伴侣房规」——角色卡开启伴侣层时只能选这些 */
export function kpcpRuleSetsFor(actor, gameSystem) {
  const sys = systemOf(gameSystem);
  return allRuleSets().filter((set) => systemOf(set.gameSystem) === sys && set.kpcpEnabled === true);
}

/** 允许普通 KP 在托管卡上直接改的字段（其余一律拒绝） */
export const CUSTODIAN_PATCH_FIELDS = ['legendary', 'legendaryBonus', 'agePenaltyWaived'];