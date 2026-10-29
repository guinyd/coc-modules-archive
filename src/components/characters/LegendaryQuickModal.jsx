/**
 * KP 快捷编辑「传奇标记」——不解锁车卡编辑器，直接在角色卡列表里开关。
 *
 * 与编辑器里的 KP 面板共用同一套字段（legendary + legendaryBonus）：
 * 服务端只允许管理员写这两项，玩家即使伪造请求也会被替换回存档值。
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Crown } from 'lucide-react';
import { ALL_CHARS, CHAR_LABEL, blankLegendary, blankLegendaryBonus, computeSheet } from '../../../shared/coc7e.js';
import { apiPatch } from '../../lib/api.js';
import { Badge, Button, Field, Input, Modal, Toggle, cx } from '../ui.jsx';

export default function LegendaryQuickModal({ open, item, onClose, onSaved, showToast }) {
  const [enabled, setEnabled] = useState(false);
  const [bonus, setBonus] = useState(() => blankLegendaryBonus());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // 打开时把列表里的当前值灌进来（列表摘要已经带了 legendary / legendaryBonus）
  useEffect(() => {
    if (!open || !item) return;
    setEnabled(item.legendary?.enabled === true);
    setBonus({ ...blankLegendaryBonus(), ...(item.legendaryBonus || {}) });
    setNote(item.legendary?.note || '');
  }, [open, item]);

  const preview = useMemo(() => {
    if (!item) return null;
    return computeSheet({
      ...item,
      legendary: { ...blankLegendary(), ...(item.legendary || {}), enabled },
      legendaryBonus: bonus,
    });
  }, [item, enabled, bonus]);

  const total = ALL_CHARS.reduce((a, k) => a + (Number(bonus[k]) || 0), 0);

  const save = async () => {
    setBusy(true);
    try {
      const saved = await apiPatch(`/api/characters/${item.id}`, {
        legendary: { ...blankLegendary(), ...(item.legendary || {}), enabled, note },
        legendaryBonus: bonus,
      });
      showToast(enabled ? `已为【${saved.name}】开启传奇标记（额外 +${total}）` : `已关闭【${saved.name}】的传奇标记`);
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title={`传奇标记 · ${item.name}`} wide>
      <div className="space-y-4">
        <div className="rounded-[3px] border border-red-500/25 bg-red-500/[0.04] p-4 space-y-3">
          <Toggle
            checked={enabled}
            onChange={setEnabled}
            label="允许这张卡突破属性 99 上限"
            hint="开启后额外调整值单独累加，不与掷骰属性混用；审卡时属性上限规则对该卡失效"
          />
          <Field label="传奇备注（选填）" hint="例如：完成《××》战役，KP 奖励突破上限">
            <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <div className={cx('rounded-[3px] border p-4', enabled ? 'border-line bg-paper-deep/70' : 'border-line bg-paper-deep/70 opacity-60')}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="font-serif text-[16px] text-slate-200">额外调整值（单独一栏）</div>
            <div className="text-[14px] text-slate-500">合计 <b className="text-red-300 font-mono">+{total}</b></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ALL_CHARS.map((k) => (
              <label key={k} className="rounded-[4px] border border-line bg-paper-deep/45 px-2 py-1.5">
                <div className="flex items-center justify-between text-[14px] text-slate-500 mb-1">
                  <span>{CHAR_LABEL[k]}</span>
                  {preview ? <span className="font-mono">→ {preview.eff[k]}</span> : null}
                </div>
                <input
                  type="number"
                  min={0}
                  max={999}
                  disabled={!enabled}
                  value={bonus[k] || 0}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(999, Math.trunc(Number(e.target.value)) || 0));
                    setBonus((prev) => ({ ...prev, [k]: n }));
                  }}
                  className="w-full rounded-[3px] border border-line bg-paper-deep/70 px-2 py-1 text-center font-mono text-[14px] tabular text-slate-100 outline-none transition focus:border-amber-500/45 disabled:opacity-50"
                />
              </label>
            ))}
          </div>
          {preview ? (
            <p className="text-[14px] text-slate-500 mt-3">
              预览：{ALL_CHARS.filter((k) => (bonus[k] || 0) > 0).map((k) => `${CHAR_LABEL[k]} ${preview.raw[k]}→${preview.eff[k]}`).join('　') || '（尚未填写调整值）'}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14px] text-slate-500 flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-red-300/80" />
            只有 KP 能改这两项；玩家自己保存时服务端会保留这里的值。
            {item.legendary?.enabled ? <Badge tone="red">当前已开启</Badge> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>取消</Button>
            <Button onClick={save} disabled={busy}>{busy ? '保存中…' : '保存'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
