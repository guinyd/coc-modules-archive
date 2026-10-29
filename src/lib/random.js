/**
 * 稳定的伪随机：所有「随机」装饰都由内容自身的 id/标题决定，
 * 刷新不会跳变，但不同档案各有各的印章角度、雕版与色彩。
 */
export function hashString(value) {
  const raw = String(value ?? '');
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick(seed, list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list[hashString(seed) % list.length];
}

/** min ~ max 之间的稳定数（可带小数位） */
export function jitter(seed, min, max, digits = 0) {
  const h = hashString(seed);
  const unit = (h % 1000) / 1000;
  const value = min + unit * (max - min);
  return digits > 0 ? Number(value.toFixed(digits)) : Math.round(value);
}

/** 从一个数组里稳定地取 n 个不重复项 */
export function sample(seed, list, n) {
  const out = [];
  const used = new Set();
  let cursor = hashString(seed);
  while (out.length < Math.min(n, list.length)) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    const idx = cursor % list.length;
    if (!used.has(idx)) { used.add(idx); out.push(list[idx]); }
  }
  return out;
}
