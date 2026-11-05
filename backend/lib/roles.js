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
import { CHIEF_KP_TITLE, DEFAULT_AUDIT_RULES, KP_TITLES } from '../../shared/coc7e.js';

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

/** 托管中的那张卡：普通 KP 只能做「传奇 / 豁免年龄 / 教育」三个快捷操作 */
export function isCustodian(actor, character) {
  if (!actor || !character) return false;
  return isKeeper(actor) && Boolean(character.custody?.kpId) && character.custody.kpId === actor.id;
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
 * 某个守秘人生效的辅助审卡规则。
 * 层级：内置默认值 < 全局基准（首席维护）< 该 KP 自己的覆盖项。
 * 玩家侧只看到全局基准（用于前端提示），不暴露任何人的私有覆盖。
 */
export function auditRulesFor(actor) {
  const base = { ...DEFAULT_AUDIT_RULES, ...(db().settings?.auditRules || {}) };
  if (isKeeper(actor) && !isChief(actor) && actor.auditRules && typeof actor.auditRules === 'object') {
    return { ...base, ...actor.auditRules };
  }
  return base;
}

/** 允许普通 KP 在托管卡上直接改的字段（其余一律拒绝） */
export const CUSTODIAN_PATCH_FIELDS = ['legendary', 'legendaryBonus', 'agePenaltyWaived'];