/**
 * 骰娘属性文本解析。
 *
 * 目标：玩家把骰娘输出整段粘进来，点击「导入属性」后自动识别八项属性 + 幸运。
 *
 * 支持的形态（中英文冒号、空格、一行多项、一项一行都行）：
 *   力量:55 敏捷:60 意志:70
 *   体质：50 外貌：55 教育：60
 *   体型 65
 * 头部信息（「<用户634F>的七版COC人物作成:」）、HP / DB / 资产行一律忽略；
 * 连续多组属性会按「力量」出现的位置切成多个候选块，交给界面做成卡片选择。
 */

const ATTR_BY_LABEL = {
  力量: 'STR', 敏捷: 'DEX', 意志: 'POW', 体质: 'CON', 外貌: 'APP',
  教育: 'EDU', 体型: 'SIZ', 智力: 'INT', 幸运: 'Luck',
};

// 英文缩写兜底（部分骰娘会输出 STR/DEX 这类）
const ATTR_BY_ABBR = {
  STR: 'STR', DEX: 'DEX', POW: 'POW', CON: 'CON', APP: 'APP',
  EDU: 'EDU', SIZ: 'SIZ', INT: 'INT', LUCK: 'Luck',
};

const TOKEN_RE = /(力量|敏捷|意志|体质|外貌|教育|体型|智力|幸运|STR|DEX|POW|CON|APP|EDU|SIZ|INT|LUCK)\s*[:：]?\s*(\d{1,3})(?!\d)/gi;

const CORE = ['STR', 'DEX', 'POW', 'CON', 'APP', 'EDU', 'SIZ', 'INT'];
const LABEL = {
  STR: '力量', DEX: '敏捷', POW: '意志', CON: '体质', APP: '外貌',
  EDU: '教育', SIZ: '体型', INT: '智力', Luck: '幸运',
};
const ORDER = [...CORE, 'Luck'];

function newBlock() {
  return { chars: {}, luck: null, lines: [] };
}

function finish(block, out) {
  const coreCount = CORE.filter((k) => Number.isFinite(block.chars[k])).length;
  // 至少 4 项核心属性才当成一份有效候选，避免把正文里的零星数字当成卡
  if (coreCount >= 4) out.push(block);
}

/**
 * @param {string} text
 * @returns {Array<{chars: Record<string, number>, luck: number|null, order: string[]}>}
 */
export function parseAttributeBlocks(text) {
  const src = String(text || '');
  if (!src.trim()) return [];

  const out = [];
  let block = newBlock();
  let hasAny = false;

  for (const line of src.split(/\r?\n/)) {
    TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = TOKEN_RE.exec(line)) !== null) {
      const rawLabel = m[1];
      const key = ATTR_BY_LABEL[rawLabel] || ATTR_BY_ABBR[rawLabel.toUpperCase()];
      if (!key) continue;
      const value = Number(m[2]);
      if (!Number.isFinite(value) || value < 1 || value > 99) continue;

      // 「力量」意味着新的一份属性开始：上一块还没收尾就先结算
      if (key === 'STR' && Number.isFinite(block.chars.STR)) {
        finish(block, out);
        block = newBlock();
      }

      if (key === 'Luck') {
        if (block.luck === null) block.luck = value;
      } else if (!Number.isFinite(block.chars[key])) {
        block.chars[key] = value;
      }
      hasAny = true;
    }
    if (hasAny && block.lines.length < 40) block.lines.push(line);
  }
  finish(block, out);

  return out.map((b) => ({
    chars: { ...b.chars },
    luck: b.luck,
    // 按固定顺序输出，方便卡片展示
    order: ORDER.filter((k) => (k === 'Luck' ? b.luck !== null : Number.isFinite(b.chars[k]))),
  }));
}

/** 供界面展示：把候选块格式化成一行摘要 */
export function describeBlock(block) {
  return ORDER
    .map((k) => {
      if (k === 'Luck') return block.luck === null ? '' : `${LABEL.Luck} ${block.luck}`;
      return Number.isFinite(block.chars[k]) ? `${LABEL[k]} ${block.chars[k]}` : '';
    })
    .filter(Boolean)
    .join(' · ');
}

export { LABEL as ATTR_LABEL, ORDER as ATTR_ORDER };