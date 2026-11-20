/**
 * 守秘人伴侣 · 群战集群单位（mass combat）
 *
 * 把一群低阶敌人抽象成一个单一实体，减少结算量。构建公式（按规则书/团内约定）：
 *   - 力量 = 单项 STR × 2；体质 = CON × 5；体型 = SIZ × 5
 *   - 生命上限 = (体质 + 体型) ÷ 10（即 (CON×5 + SIZ×5) ÷ 10，向下取整）
 *   - 体格按规则书 STR+SIZ 表正常计算
 *   - 伤害加值取「体格大一级」的数值（群体协同）
 *   - 闪避 = 敏捷 ÷ 5
 *   - 攻击技能翻倍
 *
 * 战力衰减：生命高于一半 → 每回合 3 次攻击；低于一半 → 2 次攻击且群体动作加惩罚骰；
 * 低于五分之一 → 每回合 1 次攻击。
 *
 * 纯函数，前端与自检共用；不读写任何存储。
 */

import { damageBonusBuild } from './coc7e.js';

/** 各属性的群体放大幅度 */
export const MASS_ATTR_SCALE = { STR: 2, CON: 5, SIZ: 5 };

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

/** 体格 → 伤害加值（COC 7e 表） */
export function dbForBuild(build) {
  const b = num(build, 0);
  if (b <= -2) return '−2';
  if (b === -1) return '−1';
  if (b === 0) return '0';
  if (b === 1) return '+1D4';
  return `+${b - 1}D6`;
}

/** 战力衰减：按当前生命判定每回合攻击次数与惩罚骰 */
export function attritionStage(hpNow, hpMax) {
  const max = Math.max(0, num(hpMax, 0));
  const now = Math.max(0, Math.min(max, num(hpNow, 0)));
  if (max <= 0) {
    return {
      stage: 0, attacks: 0, penaltyDie: false, label: '—', hint: '先填入生命上限',
    };
  }
  if (now * 2 > max) {
    return {
      stage: 3, attacks: 3, penaltyDie: false, label: '满编', hint: '生命高于一半：每回合 3 次攻击',
    };
  }
  if (now * 5 > max) {
    return {
      stage: 2, attacks: 2, penaltyDie: true, label: '半残', hint: '生命低于一半：每回合 2 次攻击，群体动作加惩罚骰',
    };
  }
  return {
    stage: 1, attacks: 1, penaltyDie: false, label: '濒散', hint: '生命低于五分之一：每回合 1 次攻击',
  };
}

/**
 * 构建集群单位。
 * @param {{name?:string,count?:number,STR?:number,CON?:number,SIZ?:number,DEX?:number,
 *          brawl?:number,hpNow?:number,note?:string}} input 单项敌人数值
 */
export function buildMassUnit(input = {}) {
  const name = String(input.name || '').trim() || '集群单位';
  const count = Math.max(0, num(input.count, 0));
  const str = Math.max(0, num(input.STR, 0)) * MASS_ATTR_SCALE.STR;
  const con = Math.max(0, num(input.CON, 0)) * MASS_ATTR_SCALE.CON;
  const siz = Math.max(0, num(input.SIZ, 0)) * MASS_ATTR_SCALE.SIZ;
  const dex = Math.max(0, num(input.DEX, 0));
  const brawl = Math.max(0, num(input.brawl, 0));
  // 攻击技能可以不止格斗：刀、斧、擒拿…由 KP 自己加，每条都按群战规则翻倍
  const rawAttacks = Array.isArray(input.attacks) && input.attacks.length
    ? input.attacks
    : [{ label: '格斗', value: input.brawl }];
  const attacks = rawAttacks
    .map((a) => {
      const label = String(a?.label || '').trim() || '格斗';
      const base = Math.max(0, num(a?.value, 0));
      return { label, base, total: base * 2 };
    })
    .filter((a) => a.base > 0 || a.label !== '格斗' || rawAttacks.length === 1);

  const hpMax = Math.max(0, Math.floor((con + siz) / 10));
  const dbb = damageBonusBuild(str, siz);
  const db = dbForBuild(dbb.build + 1);
  const dodge = Math.floor(dex / 5);
  const attack = attacks[0]?.total ?? brawl * 2;
  // 当前生命留空 = 满编（不能把空串当 0，否则一打开就是「濒散」）
  const hpInput = String(input.hpNow ?? '').trim();
  const hpNow = hpInput === ''
    ? hpMax
    : Math.max(0, Math.min(hpMax, num(hpInput, hpMax)));
  const stage = attritionStage(hpNow, hpMax);

  return {
    name,
    count,
    str,
    con,
    siz,
    dex,
    brawl,
    attacks,
    strSiz: dbb.total,
    hpMax,
    hpNow,
    build: dbb.build,
    baseDb: dbForBuild(dbb.build),
    db,
    dodge,
    attack,
    halfLine: Math.floor(hpMax / 2),
    fifthLine: Math.floor(hpMax / 5),
    stage,
    note: String(input.note || '').trim(),
  };
}

/** 三档战力衰减的完整门槛表（用于打印/导出） */
export function attritionTable(hpMax) {
  const max = Math.max(0, num(hpMax, 0));
  return [
    {
      key: 'full', label: '满编', range: `生命 > ${Math.floor(max / 2)}`, attacks: 3, penaltyDie: false,
    },
    {
      key: 'half', label: '半残', range: `${Math.floor(max / 5) + 1} – ${Math.floor(max / 2)}`, attacks: 2, penaltyDie: true,
    },
    {
      key: 'rout', label: '濒散', range: `≤ ${Math.floor(max / 5)}`, attacks: 1, penaltyDie: false,
    },
  ];
}