/**
 * 模组适用的游戏规则 —— 统一的「版本」口径。
 *
 * 数据侧仍然只有三个值：'' （不限 / 其它）、'classic7e'、'pulp'。
 * 界面上按需求统一叫「coc7th / 通克 / 其它」，避免出现第四种写法。
 */
export const MODULE_SYSTEMS = [
  { id: 'classic7e', label: 'coc7th', full: '克苏鲁的呼唤 第七版' },
  { id: 'pulp', label: '通克', full: '通俗克苏鲁（Pulp Cthulhu）' },
  { id: '', label: '其它', full: '不限规则，两套都可用' },
];

/** 把任意历史值收敛成三态之一（未知值一律归入「其它」）。 */
export function moduleSystemId(module) {
  const g = module?.gameSystem;
  return g === 'classic7e' || g === 'pulp' ? g : '';
}

export function moduleSystemLabel(module) {
  const id = moduleSystemId(module);
  return MODULE_SYSTEMS.find((s) => s.id === id)?.label || '其它';
}

export function moduleSystemFull(module) {
  const id = moduleSystemId(module);
  return MODULE_SYSTEMS.find((s) => s.id === id)?.full || '';
}