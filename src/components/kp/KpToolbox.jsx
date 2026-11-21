/**
 * KP 工具箱：不落库的桌面小工具。
 *
 * 两件工具：
 *  1. 带团状态记录卡 —— 自由组合字段模块，按 A4 排版打印，适合面团一桌人使用；
 *  2. 守秘人伴侣群战构建器 —— 把一群低阶敌人抽象成一个集群单位，含战力衰减门槛。
 *
 * 设计约束（用户要求）：
 *  - **数据不上服务器**：这里只用组件内存 + 浏览器 localStorage 草稿，不发任何请求；
 *  - **防呆**：改动即自动存本机草稿、关工具/关页面前提示、清空与删除都要二次确认、
 *    顶部常驻「未导出」提醒，避免辛苦排的表一走了之。
 */

import React, {
  useEffect, useLayoutEffect, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Calculator, ChevronLeft, ClipboardList, Download, FileUp, FileWarning, Plus, Printer,
  RotateCcw, Swords, Trash2, Wand2,
} from 'lucide-react';
import {
  Badge, Button, Field, Input, Panel, Textarea, cx,
} from '../ui.jsx';
import {
  attritionTable, buildMassUnit,
} from '../../../shared/massCombat.js';
import {
  decodeStateMarker, deriveStatus, encodeStateMarker, parseStCommand,
} from '../../../shared/kpTools.js';

// ----------------------------------------------------------------- 通用小工具

const pad2 = (n) => String(n).padStart(2, '0');
const nowText = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

/** 本机草稿：读取时与默认值浅合并，写入节流 300ms */
function useDraft(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') return { ...initial, ...saved };
      }
    } catch { /* 隐私模式/配额问题：退回默认值 */ }
    return initial;
  });
  const [savedAt, setSavedAt] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
        setSavedAt(nowText());
      } catch { /* 存不进去就只靠内存，不影响使用 */ }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [key, state]);
  return [state, setState, savedAt];
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 打印时把纸张缩到容器宽度（屏幕预览用，打印还原 100%） */
function useFitZoom(ref, paperMm = 210, dep = null) {
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return undefined;
    const paperPx = (paperMm / 25.4) * 96;
    const calc = () => {
      // 预览容器有 p-2（左右 8px）与 1px 边框，扣掉后再留 2px 余量，
      // 否则 100% 以下的缩放仍会溢出一点点、冒出横向滚动条。
      const avail = host.clientWidth - 20;
      if (avail > 0) setZoom(Math.min(1, Math.floor((avail / paperPx) * 100) / 100));
    };
    calc();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null;
    if (ro) ro.observe(host);
    return () => { if (ro) ro.disconnect(); };
  }, [paperMm, ref, dep]);
  return zoom;
}

/** 打印子树：portal 到 body，屏幕上隐藏、打印时显示，避免被抽屉的滚动容器裁切 */
function PrintLayer({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="print-root print-tool hidden print:block">{children}</div>,
    document.body,
  );
}

/** 纸面：A4 白纸 + 衬线标题 + 页脚 */
function Paper({ title, subtitle, metaRows = [], note, footer, children }) {
  return (
    <div className="print-paper" style={{ color: '#16110a' }}>
      <header className="mb-2 border-b-2 border-black/70 pb-1.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[8.5px] tracking-[0.22em] text-black/50">{subtitle || 'KEEPER’S TABLE SHEET'}</div>
            <h1 className="mt-0.5 font-serif text-[19px] font-bold leading-tight">{title || '带团状态记录卡'}</h1>
          </div>
          <div className="shrink-0 text-right text-[10px] leading-[15px]">
            {metaRows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><span className="text-black/55">{k}：</span>{v}</div>
            ))}
          </div>
        </div>
      </header>
      {note ? <p className="mb-2 whitespace-pre-wrap text-[10px] leading-[15px] text-black/75">{note}</p> : null}
      {children}
      <footer className="mt-2 flex items-end justify-between border-t border-black/25 pt-1 text-[8.5px] text-black/45">
        <span>{footer || '本表只在本机浏览器生成，不上传服务器；离开前请打印或导出 .md 留档。'}</span>
        <span className="font-mono tracking-[0.18em]">KP TOOLKIT</span>
      </footer>
    </div>
  );
}

// ----------------------------------------------------------------- 工具外壳

function ToolShell({
  icon: Icon, title, caption, onClose, dirty, savedAt, exportedAt, actions, children,
}) {
  const [leaveAsk, setLeaveAsk] = useState(false);
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const askLeave = () => {
    if (dirty && !exportedAt) setLeaveAsk(true);
    else onClose();
  };

  // 浮层要盖住整个视口，必须挂到 body：编辑器在 .page-in 里，那个祖先带 transform，
  // 会把 position:fixed 降级成「相对该容器固定」，铺不满屏幕。
  const shell = (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[color:var(--color-paper)]/98 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-strong bg-paper-raised/95 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={askLeave}
            className="flex items-center gap-1 rounded-[2px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:border-red-500/60 hover:text-red-500"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} /> 返回工具箱
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-serif text-[17px] font-bold tracking-[0.02em] text-ink">
              <Icon className="h-4 w-4 text-amber-500" strokeWidth={1.7} />
              <span className="truncate">{title}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-mute">
              <span>{caption}</span>
              <Badge tone={savedAt ? 'emerald' : 'slate'}>{savedAt ? `本机草稿已存 ${savedAt}` : '草稿自动保存'}</Badge>
              {exportedAt ? <Badge tone="emerald">已导出 {exportedAt}</Badge> : <Badge tone="amber">尚未导出</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      </div>

      {leaveAsk ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <Panel className="max-w-[460px] p-6 text-center">
            <FileWarning className="mx-auto h-8 w-8 text-amber-500" strokeWidth={1.6} />
            <h3 className="mt-3 font-serif text-[18px] font-bold text-ink">还没导出就离开？</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              这份表只存在浏览器里（本机草稿已自动保存，不会立刻丢）。建议先
              <span className="text-amber-500"> 打印 / 导出 PDF </span>或
              <span className="text-amber-500"> 导出 .md </span>，再关闭工具。
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="ghost" onClick={() => setLeaveAsk(false)}>继续编辑</Button>
              <Button variant="primary" onClick={onClose}>仍然关闭</Button>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      )}
    </div>
  );
  if (typeof document === 'undefined') return shell;
  return createPortal(shell, document.body);
}

/** 导入面板：粘贴导出过的 .md（或 .st）后还原。两个工具共用同一套外观。 */
function ImportPanel({
  label, placeholder, value, onChange, onImport, onClose, message, tone = 'ok',
}) {
  return (
    <div className="mt-3 rounded-[2px] border border-dashed border-amber-600/45 bg-ochre/[0.06] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12.5px] font-semibold text-ink">{label}</div>
        <button type="button" onClick={onClose} className="text-[12px] text-ink-mute underline-offset-2 hover:underline">收起</button>
      </div>
      <Textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 font-mono text-[12px]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onImport}><Wand2 className="h-4 w-4" strokeWidth={1.8} /> 识别导入</Button>
        <span className={cx('text-[12px]', tone === 'error' ? 'text-red-500' : 'text-ink-mute')}>{message || ''}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- 工具一：带团状态记录卡

const STATUS_FIELDS = [
  { id: 'player', label: '玩家', group: '身份' },
  { id: 'char', label: '角色', group: '身份' },
  { id: 'gender', label: '性别', group: '身份' },
  { id: 'age', label: '年龄', group: '身份' },
  { id: 'occupation', label: '职业', group: '身份' },
  { id: 'STR', label: '力量', group: '属性' },
  { id: 'CON', label: '体质', group: '属性' },
  { id: 'SIZ', label: '体型', group: '属性' },
  { id: 'DEX', label: '敏捷', group: '属性' },
  { id: 'APP', label: '外貌', group: '属性' },
  { id: 'INT', label: '智力', group: '属性' },
  { id: 'POW', label: '意志', group: '属性' },
  { id: 'EDU', label: '教育', group: '属性' },
  { id: 'luck', label: '幸运', group: '属性' },
  { id: 'hp', label: 'HP', group: '数值' },
  { id: 'mp', label: 'MP', group: '数值' },
  { id: 'san', label: 'SAN', group: '数值' },
  { id: 'wound', label: '重伤值', group: '数值', hint: 'HP ÷ 2' },
  { id: 'mutate', label: '异变值', group: '数值', hint: 'POW ÷ 5' },
  { id: 'db', label: '伤害加值', group: '数值' },
  { id: 'build', label: '体格', group: '数值' },
  { id: 'mov', label: '移动', group: '数值' },
  { id: 'checks', label: '健康 / 理智勾选', group: '勾选' },
];

const CHECK_ITEMS = [
  { id: 'wound', label: '重伤' },
  { id: 'unconscious', label: '昏迷' },
  { id: 'dying', label: '濒死' },
  { id: 'shock', label: '震骇' },
  { id: 'mutate', label: '异变' },
  { id: 'madness', label: '临时疯狂' },
];

const DEFAULT_STATUS_FIELDS = ['player', 'char', 'gender', 'hp', 'san', 'wound', 'mutate', 'checks'];
const newEntry = () => ({
  id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  values: {},
  checks: {},
  custom: {},
});

const STATUS_INIT = {
  meta: {
    title: '带团状态记录卡', module: '', date: '', keeper: '', note: '',
  },
  fields: DEFAULT_STATUS_FIELDS,
  customFields: [],
  cols: 2,
  entries: [newEntry(), newEntry()],
};

function statusMarkdown(state) {
  const { meta, fields, customFields, entries } = state;
  const labelOf = (id) => STATUS_FIELDS.find((f) => f.id === id)?.label || id;
  const lines = [`# ${meta.title || '带团状态记录卡'}`, ''];
  if (meta.module) lines.push(`- 模组：${meta.module}`);
  if (meta.date) lines.push(`- 日期：${meta.date}`);
  if (meta.keeper) lines.push(`- 守秘人：${meta.keeper}`);
  if (meta.note) lines.push(`- 备注：${meta.note}`);
  lines.push('', `> 共 ${entries.length} 位调查员 · 本表由 KP 工具箱在本机生成，不上传服务器。`, '');
  entries.forEach((entry, i) => {
    const name = entry.values.char || `角色 ${i + 1}`;
    lines.push(`## ${name}${entry.values.player ? `（${entry.values.player}）` : ''}`, '');
    fields.forEach((fid) => {
      if (fid === 'checks') {
        const ticks = CHECK_ITEMS.map((c) => `${entry.checks?.[c.id] ? '[x]' : '[ ]'} ${c.label}`).join('　');
        lines.push(`- 状态：${ticks}`);
        return;
      }
      lines.push(`- ${labelOf(fid)}：${entry.values?.[fid] ?? ''}`);
    });
    customFields.forEach((cf) => {
      if (!cf.label) return;
      lines.push(`- ${cf.label}：${entry.custom?.[cf.id] ?? ''}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

function StatusSheet({
  state, interactive = false, onToggleCheck, onChangeValue, onChangeCustom,
}) {
  const { meta, fields, customFields, cols, entries } = state;
  const labelOf = (id) => STATUS_FIELDS.find((f) => f.id === id)?.label || id;
  const hasChecks = fields.includes('checks');
  const cellFields = fields.filter((f) => f !== 'checks' && f !== 'player' && f !== 'char');
  return (
    <Paper
      title={meta.title}
      subtitle="KEEPER’S TABLE SHEET · 带团状态记录"
      metaRows={[['模组', meta.module], ['日期', meta.date], ['KP', meta.keeper]]}
      note={meta.note}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, cols))}, minmax(0, 1fr))`,
          gap: '3mm',
        }}
      >
        {entries.map((entry, i) => (
          <section
            key={entry.id || i}
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className="border border-black/45 px-2 py-1.5"
          >
            <div className="flex items-baseline justify-between gap-2 border-b border-black/35 pb-1">
              <span className="truncate text-[13px] font-bold">{entry.values.char || `调查员 ${i + 1}`}</span>
              <span className="shrink-0 text-[9.5px] text-black/60">{entry.values.player || '玩家：—'}</span>
            </div>
            <div className="mt-1 grid grid-cols-4 gap-x-2 gap-y-1">
              {cellFields.map((fid) => (
                <div key={fid} className={fid === 'occupation' ? 'col-span-2' : ''}>
                  <div className="text-[8px] leading-[11px] text-black/55">{labelOf(fid)}</div>
                  <div className="min-h-[15px] border-b border-dotted border-black/40 text-[11px] font-semibold leading-[15px]">
                    {interactive ? (
                      <input
                        value={entry.values?.[fid] || ''}
                        onChange={(e) => onChangeValue?.(entry.id, fid, e.target.value)}
                        placeholder="—"
                        className="w-full bg-transparent text-[11px] font-semibold leading-[15px] text-black outline-none placeholder:text-black/25"
                      />
                    ) : (entry.values?.[fid] || '\u00A0')}
                  </div>
                </div>
              ))}
            </div>
            {hasChecks ? (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-black/25 pt-1 text-[10px] leading-[15px]">
                {CHECK_ITEMS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onToggleCheck?.(entry.id, c.id, !entry.checks?.[c.id])}
                    className={cx(
                      'whitespace-nowrap text-left transition',
                      interactive ? 'cursor-pointer rounded-[2px] px-0.5 hover:bg-black/5' : 'cursor-default',
                    )}
                  >
                    <span className="mr-0.5 font-mono">{entry.checks?.[c.id] ? '☑' : '☐'}</span>{c.label}
                  </button>
                ))}
              </div>
            ) : null}
            {customFields.some((cf) => cf.label) ? (
              <div className="mt-1 space-y-0.5 border-t border-black/25 pt-1">
                {customFields.filter((cf) => cf.label).map((cf) => (
                  <div key={cf.id} className="flex items-baseline gap-1 text-[10px] leading-[15px]">
                    <span className="shrink-0 text-black/60">{cf.label}</span>
                    <span className="min-h-[15px] flex-1 border-b border-dotted border-black/40">
                      {interactive ? (
                        <input
                          value={entry.custom?.[cf.id] || ''}
                          onChange={(e) => onChangeCustom?.(entry.id, cf.id, e.target.value)}
                          placeholder="—"
                          className="w-full bg-transparent text-[10px] leading-[15px] text-black outline-none placeholder:text-black/25"
                        />
                      ) : (entry.custom?.[cf.id] || '\u00A0')}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </Paper>
  );
}

/** 桌面模式：带团时直接在系统里点勾选、改数值，写回同一份本机草稿 */
function StatusBoard({
  state, onToggleCheck, onChangeValue, onChangeCustom,
}) {
  const { fields, customFields, entries } = state;
  const labelOf = (id) => STATUS_FIELDS.find((f) => f.id === id)?.label || id;
  const hasChecks = fields.includes('checks');
  const cellFields = fields.filter((f) => f !== 'checks' && f !== 'player' && f !== 'char');
  const inputCls = 'mt-0.5 w-full rounded-[2px] border border-line-strong bg-paper px-1.5 py-1 text-[12.5px] text-ink outline-none focus:border-amber-600/60';
  return (
    <div className="grid gap-2.5">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="rounded-[2px] border border-line-strong bg-paper-raised/70 px-3 py-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-1.5">
            <span className="truncate font-serif text-[15px] font-bold text-ink">{entry.values.char || `调查员 ${i + 1}`}</span>
            <span className="shrink-0 text-[11.5px] text-ink-mute">{entry.values.player || '玩家：—'}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5">
            {cellFields.map((fid) => (
              <label key={fid} className={cx('block', fid === 'occupation' ? 'col-span-2' : '')}>
                <span className="text-[11px] text-ink-mute">{labelOf(fid)}</span>
                <input
                  value={entry.values?.[fid] || ''}
                  onChange={(e) => onChangeValue?.(entry.id, fid, e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </label>
            ))}
          </div>
          {hasChecks ? (
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
              {CHECK_ITEMS.map((c) => {
                const on = Boolean(entry.checks?.[c.id]);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleCheck?.(entry.id, c.id, !on)}
                    className={cx(
                      'rounded-[2px] border px-2 py-1 text-[12px] transition',
                      on
                        ? 'border-amber-600/70 bg-ochre/20 text-ink'
                        : 'border-line-strong text-ink-mute hover:border-amber-600/40',
                    )}
                  >
                    {on ? '☑' : '☐'} {c.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {customFields.some((cf) => cf.label) ? (
            <div className="mt-2 space-y-1 border-t border-line pt-2">
              {customFields.filter((cf) => cf.label).map((cf) => (
                <label key={cf.id} className="flex items-center gap-2">
                  <span className="w-[5.5rem] shrink-0 truncate text-[11.5px] text-ink-mute">{cf.label}</span>
                  <input
                    value={entry.custom?.[cf.id] || ''}
                    onChange={(e) => onChangeCustom?.(entry.id, cf.id, e.target.value)}
                    placeholder="—"
                    className="flex-1 rounded-[2px] border border-line-strong bg-paper px-1.5 py-1 text-[12.5px] text-ink outline-none focus:border-amber-600/60"
                  />
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StatusTool({ onClose }) {
  const [state, setState, savedAt] = useDraft('archive.kpTools.statusCards.v1', STATUS_INIT);
  const [exportedAt, setExportedAt] = useState('');
  const previewRef = useRef(null);
  const [mode, setMode] = useState('board');
  const zoom = useFitZoom(previewRef, 210, mode);

  const { meta, fields, customFields, entries, cols } = state;
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importTone, setImportTone] = useState('ok');
  const [hpRule, setHpRule] = useState('classic');
  const [stEntry, setStEntry] = useState('');
  const [stText, setStText] = useState('');
  const [stMsg, setStMsg] = useState('');

  /** 把导出过的 .md 整份还原（内部藏了备份标记） */
  const doImportMd = () => {
    const found = decodeStateMarker(importText);
    if (!found || found.kind !== 'status' || !found.state || !Array.isArray(found.state.entries)) {
      setImportTone('error');
      setImportMsg('没找到这张表自己的备份标记。请粘贴本工具「导出 .md」得到的整份文件。');
      return;
    }
    const next = {
      ...STATUS_INIT,
      ...found.state,
      meta: { ...STATUS_INIT.meta, ...(found.state.meta || {}) },
      fields: Array.isArray(found.state.fields) ? found.state.fields : DEFAULT_STATUS_FIELDS,
      customFields: Array.isArray(found.state.customFields) ? found.state.customFields : [],
      entries: found.state.entries.map((e) => ({ ...newEntry(), ...e })),
    };
    setState(next);
    setImportTone('ok');
    setImportMsg(`已还原：${next.entries.length} 位调查员、${next.fields.length} 个字段、${next.customFields.length} 个自定义字段。`);
  };

  /** 单个角色：粘贴骰娘 .st 指令后识别并回填，顺手算出重伤/异变等派生值 */
  const doImportSt = (entryId) => {
    const parsed = parseStCommand(stText);
    const filled = Object.keys(parsed.values);
    if (filled.length === 0) {
      setStMsg('没识别到属性。请粘贴类似「.st 力量50str50 敏捷45dex45 …」的指令。');
      return;
    }
    const derived = deriveStatus(parsed.values, { hpRule });
    const merged = { ...parsed.values, ...derived };
    const ids = Object.keys(merged);
    setState((prev) => {
      const nextFields = [...prev.fields];
      ids.forEach((id) => { if (!nextFields.includes(id)) nextFields.push(id); });
      return {
        ...prev,
        fields: nextFields,
        entries: prev.entries.map((e) => (e.id === entryId
          ? { ...e, values: { ...e.values, ...Object.fromEntries(ids.map((id) => [id, String(merged[id])])) } }
          : e)),
      };
    });
    const labelOf = (id) => STATUS_FIELDS.find((f) => f.id === id)?.label || id;
    const derivedLabels = Object.keys(derived).map(labelOf);
    setStMsg(`识别 ${parsed.tokens} 项，回填 ${filled.length} 项；按属性算出 ${derivedLabels.join(' / ')}（已自动勾选字段）。`);
  };

  const toggleField = (id) => setState((prev) => ({
    ...prev,
    fields: prev.fields.includes(id) ? prev.fields.filter((f) => f !== id) : [...prev.fields, id],
  }));
  const addEntry = () => setState((prev) => ({ ...prev, entries: [...prev.entries, newEntry()] }));
  const removeEntry = (id) => setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  const patchEntry = (id, patch) => setState((prev) => ({
    ...prev,
    entries: prev.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
  const setValue = (id, key, value) => setState((prev) => ({
    ...prev,
    entries: prev.entries.map((e) => (e.id === id ? { ...e, values: { ...e.values, [key]: value } } : e)),
  }));
  const setCheck = (id, key, value) => setState((prev) => ({
    ...prev,
    entries: prev.entries.map((e) => (e.id === id ? { ...e, checks: { ...e.checks, [key]: value } } : e)),
  }));
  const setCustom = (id, key, value) => setState((prev) => ({
    ...prev,
    entries: prev.entries.map((e) => (e.id === id ? { ...e, custom: { ...e.custom, [key]: value } } : e)),
  }));

  const addCustomField = () => setState((prev) => ({
    ...prev,
    customFields: [...prev.customFields, { id: `c${Date.now().toString(36).slice(-5)}`, label: '' }],
  }));
  const patchCustomField = (id, patch) => setState((prev) => ({
    ...prev,
    customFields: prev.customFields.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
  const removeCustomField = (id) => setState((prev) => ({
    ...prev,
    customFields: prev.customFields.filter((c) => c.id !== id),
  }));

  const resetAll = () => {
    if (!window.confirm('清空整张表？所有角色与表头都会恢复空白（本机草稿也会被覆盖）。')) return;
    setState({ ...STATUS_INIT, entries: [newEntry(), newEntry()] });
  };

  const doExport = () => {
    downloadText(`${(meta.title || '带团状态记录').replace(/[\\/:*?"<>|]/g, '_')}.md`,
      statusMarkdown(state) + encodeStateMarker('status', state));
    setExportedAt(nowText());
  };

  return (
    <ToolShell
      icon={ClipboardList}
      title="带团状态记录卡"
      caption="自由组合字段 · A4 打印 · 数据只在本机"
      onClose={onClose}
      dirty={entries.some((e) => Object.values(e.values || {}).some((v) => String(v).trim()))}
      savedAt={savedAt}
      exportedAt={exportedAt}
      actions={(
        <>
          <Button variant="ghost" size="sm" onClick={addEntry}><Plus className="h-4 w-4" strokeWidth={2} /> 添加角色</Button>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen((v) => !v)}><FileUp className="h-4 w-4" strokeWidth={1.8} /> 导入 .md</Button>
          <Button variant="ghost" size="sm" onClick={doExport}><Download className="h-4 w-4" strokeWidth={1.8} /> 导出 .md</Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" strokeWidth={1.8} /> 打印 / 导出 PDF</Button>
          <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="h-4 w-4" strokeWidth={1.8} /> 清空</Button>
        </>
      )}
    >
      <div className="px-4 py-5 sm:px-6">
        <div className="mx-auto grid max-w-[1400px] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          {/* 左：编辑区 */}
          <div className="space-y-4">
            <Panel className="p-5">
              <div className="caption !text-[12px]">01 · 表头</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="表格标题"><Input value={meta.title} onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, title: e.target.value } }))} /></Field>
                <Field label="模组"><Input value={meta.module} onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, module: e.target.value } }))} placeholder="例：奈亚拉托提普的面具" /></Field>
                <Field label="日期"><Input value={meta.date} onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, date: e.target.value } }))} placeholder="2026/11/20" /></Field>
                <Field label="守秘人"><Input value={meta.keeper} onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, keeper: e.target.value } }))} /></Field>
                <Field label="备注" className="sm:col-span-2"><Textarea rows={2} value={meta.note} onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, note: e.target.value } }))} placeholder="本轮开局位置、暗线、需要盯着的线索…" /></Field>
              </div>
            </Panel>

            {importOpen ? (
              <ImportPanel
                label="从 .md 还原本表（粘贴本工具导出过的文件内容）"
                placeholder="把「导出 .md」得到的整份文件粘贴到这里，识别后连角色、字段勾选、自定义字段一起还原。"
                value={importText}
                onChange={setImportText}
                onImport={doImportMd}
                onClose={() => setImportOpen(false)}
                message={importMsg}
                tone={importTone}
              />
            ) : null}

            <Panel className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="caption !text-[12px]">02 · 字段模块</div>
                <div className="flex items-center gap-2 text-[12.5px] text-ink-mute">
                  每页列数
                  <select
                    value={cols}
                    onChange={(e) => setState((p) => ({ ...p, cols: Number(e.target.value) }))}
                    className="rounded-[2px] border border-line-strong bg-paper-raised px-2 py-1 text-[12.5px] text-ink"
                  >
                    <option value={2}>2 列（4–6 人 / 页）</option>
                    <option value={3}>3 列（6–9 人 / 页）</option>
                    <option value={4}>4 列（8–12 人 / 页）</option>
                  </select>
                </div>
              </div>
              {['身份', '属性', '数值', '勾选'].map((group) => (
                <div key={group} className="mt-3">
                  <div className="text-[12px] font-semibold tracking-[0.12em] text-ink-mute">{group}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {STATUS_FIELDS.filter((f) => f.group === group).map((f) => {
                      const on = fields.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleField(f.id)}
                          title={f.hint || ''}
                          className={cx(
                            'rounded-[2px] border px-2 py-1 text-[12.5px] transition',
                            on
                              ? 'border-amber-600/70 bg-ochre/15 text-ink'
                              : 'border-line-strong bg-transparent text-ink-mute hover:border-amber-600/40',
                          )}
                        >
                          {on ? '✓ ' : ''}{f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Panel>

            <Panel className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="caption !text-[12px]">03 · 自定义字段</div>
                <Button variant="ghost" size="sm" onClick={addCustomField}><Plus className="h-4 w-4" strokeWidth={2} /> 添加字段</Button>
              </div>
              {customFields.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-mute">没有自定义字段。可加「随身物品」「暗线标记」「POW 恢复」等只属于这一桌的栏位。</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {customFields.map((cf) => (
                    <div key={cf.id} className="flex items-center gap-2">
                      <Input
                        value={cf.label}
                        placeholder="字段名，例如：随身物品"
                        onChange={(e) => patchCustomField(cf.id, { label: e.target.value })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeCustomField(cf.id)} title="删除这个字段">
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="caption !text-[12px]">04 · 角色（{entries.length}）</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] text-ink-mute">生命算法</span>
                  <select
                    value={hpRule}
                    onChange={(e) => setHpRule(e.target.value)}
                    className="rounded-[2px] border border-line-strong bg-paper-raised px-2 py-1 text-[12.5px] text-ink"
                    title="只影响粘贴 .st 时算出的重伤值"
                  >
                    <option value="classic">官方 ÷10</option>
                    <option value="pulp">通克 ÷5</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={addEntry}><Plus className="h-4 w-4" strokeWidth={2} /> 添加角色</Button>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-ink-mute">
                每个角色可以单独粘贴骰娘 <span className="font-mono">.st</span> 指令（如 <span className="font-mono">.st 力量50str50 敏捷45dex45 …</span>），
                会自动回填属性并算出重伤值（生命 ÷ 2）、异变值（意志 ÷ 5）、伤害加值与体格。
              </p>
              <div className="mt-3 space-y-3">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="rounded-[2px] border border-line-strong p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] tracking-[0.16em] text-ink-mute">NO.{pad2(index + 1)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`删除「${entry.values.char || `调查员 ${index + 1}`}」？`)) removeEntry(entry.id);
                        }}
                        className="rounded-[2px] p-1 text-ink-mute transition hover:bg-red-500/10 hover:text-red-500"
                        title="删除这一行"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {fields.filter((f) => f !== 'checks').map((fid) => (
                        <label key={fid} className="block">
                          <span className="text-[11.5px] text-ink-mute">{STATUS_FIELDS.find((f) => f.id === fid)?.label || fid}</span>
                          <Input
                            className="mt-0.5"
                            value={entry.values?.[fid] || ''}
                            onChange={(e) => setValue(entry.id, fid, e.target.value)}
                          />
                        </label>
                      ))}
                      {customFields.filter((cf) => cf.label).map((cf) => (
                        <label key={cf.id} className="block">
                          <span className="text-[11.5px] text-ink-mute">{cf.label}</span>
                          <Input
                            className="mt-0.5"
                            value={entry.custom?.[cf.id] || ''}
                            onChange={(e) => setCustom(entry.id, cf.id, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    {fields.includes('checks') ? (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-2">
                        {CHECK_ITEMS.map((c) => (
                          <label key={c.id} className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                            <input
                              type="checkbox"
                              checked={Boolean(entry.checks?.[c.id])}
                              onChange={(e) => setCheck(entry.id, c.id, e.target.checked)}
                              className="h-3.5 w-3.5 accent-[color:var(--color-vermilion)]"
                            />
                            {c.label}
                          </label>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => patchEntry(entry.id, { values: { ...entries[index - 1]?.values, ...entry.values }, checks: { ...entries[index - 1]?.checks, ...entry.checks } })}
                      disabled={index === 0}
                      className="mt-2 text-[12px] text-ink-mute underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      沿用上一行的表头与勾选
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStEntry(stEntry === entry.id ? '' : entry.id);
                        setStText('');
                        setStMsg('');
                      }}
                      className="mt-2 ml-3 text-[12px] text-ink-mute underline-offset-2 hover:underline"
                    >
                      {stEntry === entry.id ? '收起 .st 导入' : '粘贴骰娘 .st 导入这一行'}
                    </button>
                    {stEntry === entry.id ? (
                      <ImportPanel
                        label={`把骰娘指令导进「${entry.values.char || `调查员 ${index + 1}`}」`}
                        placeholder=".st 力量50str50 体质50con50 体型65siz65 敏捷45dex45 意志75pow75 教育80edu80 幸运80运气80 hp9体力9 san75理智75 mp15魔法15"
                        value={stText}
                        onChange={setStText}
                        onImport={() => doImportSt(entry.id)}
                        onClose={() => setStEntry('')}
                        message={stMsg}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* 右：桌面模式（可直接点选/改数）或 A4 预览 */}
          <div className="lg:sticky lg:top-2 lg:self-start">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[
                  ['board', '桌面模式'],
                  ['paper', 'A4 预览'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={cx(
                      'rounded-[2px] border px-2.5 py-1 text-[12.5px] transition',
                      mode === id
                        ? 'border-amber-600/70 bg-ochre/15 text-ink'
                        : 'border-line-strong text-ink-mute hover:border-amber-600/40',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-ink-mute">
                {mode === 'paper' ? `${Math.round(zoom * 100)}%` : '点勾选框 / 直接改格子'}
              </span>
            </div>
            {mode === 'board' ? (
              <div className="max-h-[70vh] overflow-y-auto rounded-[2px] border border-line-strong bg-paper-deep/30 p-2">
                <StatusBoard
                  state={state}
                  onToggleCheck={setCheck}
                  onChangeValue={setValue}
                  onChangeCustom={setCustom}
                />
              </div>
            ) : (
              <div ref={previewRef} className="overflow-x-auto rounded-[2px] border border-line-strong bg-paper-deep/40 p-2">
                <div className="mx-auto w-fit" style={{ zoom }}>
                  <StatusSheet
                    state={state}
                    interactive
                    onToggleCheck={setCheck}
                    onChangeValue={setValue}
                    onChangeCustom={setCustom}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PrintLayer><StatusSheet state={state} /></PrintLayer>
    </ToolShell>
  );
}

// ----------------------------------------------------------------- 工具二：群战构建器

const MASS_UNIT_INIT = {
  id: 'u1',
  name: '邪教徒小队',
  count: 6,
  STR: 50,
  CON: 50,
  SIZ: 65,
  DEX: 45,
  attacks: [{ id: 'a1', label: '格斗', value: 35 }],
  hpNow: '',
  note: '',
};

const MASS_INIT = { units: [{ ...MASS_UNIT_INIT, attacks: [{ ...MASS_UNIT_INIT.attacks[0] }] }] };

const newUnitId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const newAttackId = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** 兼容旧草稿：v10.14.x 存的是单个集群对象，这里统一成 units 数组 */
function normalizeMass(state) {
  if (state && Array.isArray(state.units) && state.units.length) return state;
  if (state && (state.STR || state.CON || state.SIZ)) {
    return {
      units: [{
        id: newUnitId(),
        name: String(state.name || '').trim() || '集群单位',
        count: state.count ?? 0,
        STR: state.STR ?? 0,
        CON: state.CON ?? 0,
        SIZ: state.SIZ ?? 0,
        DEX: state.DEX ?? 0,
        attacks: [{ id: newAttackId(), label: '格斗', value: state.brawl ?? 0 }],
        hpNow: state.hpNow ?? '',
        note: state.note ?? '',
      }],
    };
  }
  return MASS_INIT;
}

function massMarkdown(state) {
  const units = normalizeMass(state).units.map((u) => buildMassUnit(u));
  const lines = ['# 集群单位登记表', '', '> 守秘人伴侣 · 群战规则：一群低阶敌人抽象为单一实体。', ''];
  for (const unit of units) {
    const table = attritionTable(unit.hpMax);
    lines.push(
      `## ${unit.name}`,
      '',
      `- 规模：${unit.count ? `${unit.count} 人` : '—'}`,
      `- 力量：${unit.str}（单项 × 2）`,
      `- 体质：${unit.con}（单项 × 5） · 体型：${unit.siz}（单项 × 5）`,
      `- 生命：${unit.hpNow} / ${unit.hpMax}`,
      `- 体格：${unit.build} · 伤害加值：${unit.db}（比体格常态 ${unit.baseDb} 大一级）`,
      `- 闪避：${unit.dodge}%`,
      `- 攻击技能：${unit.attacks.map((a) => `${a.label} ${a.total}%（单项 ${a.base}% 翻倍）`).join(' · ')}`,
      `- 当前阶段：${unit.stage.label} —— ${unit.stage.hint}`,
      '',
      '| 阶段 | 生命区间 | 每回合攻击 | 群体动作 |',
      '| --- | --- | --- | --- |',
      ...table.map((t) => `| ${t.label} | ${t.range} | ${t.attacks} 次 | ${t.penaltyDie ? '加惩罚骰' : '正常'} |`),
      '',
    );
    if (unit.note) lines.push('备注：', '', unit.note, '');
  }
  return lines.join('\n');
}

function MassUnitPaper({ raw }) {
  const unit = buildMassUnit(raw);
  const table = attritionTable(unit.hpMax);
  return (
    <Paper
      title={`集群单位 · ${unit.name}`}
      subtitle="MASS COMBAT UNIT · 群战集群"
      metaRows={[['规模', unit.count ? `${unit.count} 人` : ''], ['生命', `${unit.hpNow} / ${unit.hpMax}`], ['阶段', unit.stage.label]]}
      footer="按守秘人伴侣群战规则构建；表只在本机生成，不上传服务器。"
    >
      <div className="grid grid-cols-4 gap-2">
        {[
          ['力量', unit.str, '单项 ×2'],
          ['体质', unit.con, '单项 ×5'],
          ['体型', unit.siz, '单项 ×5'],
          ['敏捷', unit.dex, '单项'],
          ['体格', unit.build, '规则书表'],
          ['伤害加值', unit.db, `常态 ${unit.baseDb}`],
          ['闪避', `${unit.dodge}%`, '敏捷 ÷ 5'],
          ['集群人数', unit.count || '—', '只作说明'],
        ].map(([label, value, hint]) => (
          <div key={label} className="border border-black/40 px-2 py-1.5">
            <div className="text-[8.5px] leading-[12px] text-black/55">{label}</div>
            <div className="font-serif text-[15px] font-bold leading-tight">{value}</div>
            <div className="text-[8px] leading-[11px] text-black/45">{hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 border border-black/40 px-2 py-1.5">
        <div className="text-[8.5px] text-black/55">攻击技能（单项 ×2）</div>
        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[10.5px] leading-[16px]">
          {unit.attacks.map((a) => (
            <span key={a.label}><span className="text-black/70">{a.label}</span> <b className="font-mono">{a.total}%</b> <span className="text-black/45">(单项 {a.base}%)</span></span>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[112px_minmax(0,1fr)] gap-2 text-[10.5px] leading-[16px]">
        <div className="border border-black/40 px-2 py-1.5">
          <div className="text-[8.5px] text-black/55">单项基准</div>
          <div className="font-mono">STR {raw.STR || 0} · CON {raw.CON || 0}</div>
          <div className="font-mono">SIZ {raw.SIZ || 0} · DEX {raw.DEX || 0}</div>
        </div>
        <div className="border border-black/40 px-2 py-1.5">
          <div className="text-[8.5px] text-black/55">生命条（圈当前值）</div>
          <div className="mt-1 flex flex-wrap gap-x-1.5 font-mono text-[11px] leading-[17px]">
            {Array.from({ length: Math.max(1, unit.hpMax) }, (_, i) => i + 1).map((n) => (
              <span key={n} className={n === unit.halfLine || n === unit.fifthLine ? 'font-bold text-black' : 'text-black/70'}>{pad2(n)}</span>
            ))}
          </div>
        </div>
      </div>

      <table className="mt-2 w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="border-y border-black/50 bg-black/[0.04]">
            <th className="px-2 py-1 text-left font-semibold">阶段</th>
            <th className="px-2 py-1 text-left font-semibold">生命区间</th>
            <th className="px-2 py-1 text-left font-semibold">每回合攻击</th>
            <th className="px-2 py-1 text-left font-semibold">群体动作</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t) => (
            <tr key={t.key} className={cx('border-b border-black/20', unit.stage.stage === 3 - table.findIndex((x) => x.key === t.key) ? 'bg-black/[0.05]' : '')}>
              <td className="px-2 py-1">{t.label}</td>
              <td className="px-2 py-1 font-mono">{t.range}</td>
              <td className="px-2 py-1">{t.attacks} 次</td>
              <td className="px-2 py-1">{t.penaltyDie ? '加惩罚骰' : '正常'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-1.5 text-[10px] leading-[15px] text-black/70">
        当前：<b>{unit.stage.label}</b> —— {unit.stage.hint}（一半 = {unit.halfLine}，五分之一 = {unit.fifthLine}）
      </p>
      {unit.note ? <p className="mt-1 whitespace-pre-wrap text-[10px] leading-[15px] text-black/70">备注：{unit.note}</p> : null}
    </Paper>
  );
}

function MassSheet({ units }) {
  return (
    <div className="space-y-3">
      {units.map((u) => (
        <div key={u.id} className="print-avoid-break">
          <MassUnitPaper raw={u} />
        </div>
      ))}
    </div>
  );
}

function MassTool({ onClose }) {
  const [raw, setRaw, savedAt] = useDraft('archive.kpTools.massCombat.v1', MASS_INIT);
  const [exportedAt, setExportedAt] = useState('');
  const previewRef = useRef(null);
  const state = normalizeMass(raw);
  const units = state.units;
  const zoom = useFitZoom(previewRef, 210, units.length);

  const built = units.map((u) => buildMassUnit(u));

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importTone, setImportTone] = useState('ok');

  /** 把导出过的 .md 整份还原（内部藏了备份标记） */
  const doImportMd = () => {
    const found = decodeStateMarker(importText);
    if (!found || found.kind !== 'mass' || !found.state || !Array.isArray(found.state.units)) {
      setImportTone('error');
      setImportMsg('没找到这份登记表的备份标记。请粘贴本工具「导出 .md」得到的整份文件。');
      return;
    }
    const next = { units: found.state.units.map((u) => ({ ...MASS_UNIT_INIT, ...u })) };
    setRaw(next);
    setImportTone('ok');
    setImportMsg(`已还原 ${next.units.length} 组集群（含攻击技能与当前生命）。`);
  };

  const patchUnit = (id, key, value) => setRaw(() => ({
    units: state.units.map((u) => (u.id === id ? { ...u, [key]: value } : u)),
  }));

  const patchAttack = (id, attackId, key, value) => setRaw(() => ({
    units: state.units.map((u) => (u.id === id
      ? { ...u, attacks: u.attacks.map((a) => (a.id === attackId ? { ...a, [key]: value } : a)) }
      : u)),
  }));

  const addAttack = (id) => setRaw(() => ({
    units: state.units.map((u) => (u.id === id
      ? { ...u, attacks: [...u.attacks, { id: newAttackId(), label: '', value: '' }] }
      : u)),
  }));

  const removeAttack = (id, attackId) => setRaw(() => ({
    units: state.units.map((u) => (u.id === id
      ? { ...u, attacks: u.attacks.length > 1 ? u.attacks.filter((a) => a.id !== attackId) : u.attacks }
      : u)),
  }));

  const addUnit = () => setRaw(() => ({
    units: [...state.units, {
      ...MASS_UNIT_INIT,
      id: newUnitId(),
      name: `集群 ${state.units.length + 1}`,
      attacks: [{ id: newAttackId(), label: '格斗', value: 35 }],
      hpNow: '',
      note: '',
    }],
  }));

  const removeUnit = (id) => {
    if (state.units.length === 1) return;
    if (!window.confirm('删除这一组集群单位？')) return;
    setRaw(() => ({ units: state.units.filter((u) => u.id !== id) }));
  };

  const doExport = () => {
    const title = units.length > 1 ? '集群单位登记表' : (units[0]?.name || '集群单位');
    downloadText(`${String(title).replace(/[\\/:*?"<>|]/g, '_')}.md`,
      massMarkdown(state) + encodeStateMarker('mass', { units: state.units }));
    setExportedAt(nowText());
  };

  const dirty = JSON.stringify(state.units) !== JSON.stringify(MASS_INIT.units);

  const numeric = (unitId, key, label, hint) => (
    <Field label={label} hint={hint}>
      <Input
        inputMode="numeric"
        value={state.units.find((u) => u.id === unitId)?.[key] ?? ''}
        onChange={(e) => patchUnit(unitId, key, e.target.value.replace(/[^\d]/g, ''))}
      />
    </Field>
  );

  return (
    <ToolShell
      icon={Swords}
      title="群战集群构建器"
      caption="一批杂兵 = 一个单位 · 守秘人伴侣群战规则"
      onClose={onClose}
      dirty={dirty}
      savedAt={savedAt}
      exportedAt={exportedAt}
      actions={(
        <>
          <Button variant="ghost" size="sm" onClick={addUnit}><Plus className="h-4 w-4" strokeWidth={2} /> 添加集群</Button>
          <Button variant="ghost" size="sm" onClick={() => setRaw(MASS_INIT)}><RotateCcw className="h-4 w-4" strokeWidth={1.8} /> 重置</Button>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen((v) => !v)}><FileUp className="h-4 w-4" strokeWidth={1.8} /> 导入 .md</Button>
          <Button variant="ghost" size="sm" onClick={doExport}><Download className="h-4 w-4" strokeWidth={1.8} /> 导出 .md</Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" strokeWidth={1.8} /> 打印 / 导出 PDF</Button>
        </>
      )}
    >
      <div className="px-4 py-5 sm:px-6">
        <div className="mx-auto grid max-w-[1400px] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div className="space-y-4">
            {importOpen ? (
              <ImportPanel
                label="从 .md 还原这份登记表（粘贴本工具导出过的文件内容）"
                placeholder="把「导出 .md」得到的整份文件粘贴到这里，识别后连每个集群的名称、属性、攻击技能与当前生命一起还原。"
                value={importText}
                onChange={setImportText}
                onImport={doImportMd}
                onClose={() => setImportOpen(false)}
                message={importMsg}
                tone={importTone}
              />
            ) : null}
            {units.map((u, index) => {
              const unit = built[index];
              return (
                <Panel key={u.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="caption !text-[12px]">
                      {pad2(index + 1)} · {units.length > 1 ? '集群单位' : '单项敌人数值'}
                    </div>
                    {units.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeUnit(u.id)}
                        className="rounded-[2px] p-1 text-ink-mute transition hover:bg-red-500/10 hover:text-red-500"
                        title="删除这一组"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="集群名称"><Input value={u.name} onChange={(e) => patchUnit(u.id, 'name', e.target.value)} placeholder="例：邪教徒小队" /></Field>
                    {numeric(u.id, 'count', '人数', '只作说明，不参与公式')}
                    {numeric(u.id, 'STR', '力量 STR', '单位：单项值')}
                    {numeric(u.id, 'CON', '体质 CON', '单位：单项值')}
                    {numeric(u.id, 'SIZ', '体型 SIZ', '单位：单项值')}
                    {numeric(u.id, 'DEX', '敏捷 DEX', '闪避 = DEX ÷ 5')}
                  </div>

                  <div className="mt-3 rounded-[2px] border border-line-strong p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-ink">攻击技能（填单项值，构建时翻倍）</span>
                      <Button variant="ghost" size="sm" onClick={() => addAttack(u.id)}>
                        <Plus className="h-4 w-4" strokeWidth={2} /> 添加技能
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {u.attacks.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-end gap-2">
                          <Field label="技能" className="min-w-[140px] flex-1">
                            <Input
                              value={a.label}
                              onChange={(e) => patchAttack(u.id, a.id, 'label', e.target.value)}
                              placeholder="格斗 / 刀 / 斧头 / 擒拿…"
                            />
                          </Field>
                          <Field label="单项 %" className="w-24">
                            <Input
                              inputMode="numeric"
                              value={a.value}
                              onChange={(e) => patchAttack(u.id, a.id, 'value', e.target.value.replace(/[^\d]/g, ''))}
                              placeholder="35"
                            />
                          </Field>
                          <span className="pb-2 font-mono text-[12.5px] text-ink-mute">→ {Number(a.value || 0) * 2}%</span>
                          <button
                            type="button"
                            onClick={() => removeAttack(u.id, a.id)}
                            disabled={u.attacks.length <= 1}
                            className="mb-1 rounded-[2px] p-1 text-ink-mute transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30"
                            title="删除这条技能"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[2px] border border-line-strong bg-paper-deep/40 px-3 py-2">
                    <span className="text-[12.5px] text-ink-mute">当前生命</span>
                    <input
                      inputMode="numeric"
                      value={u.hpNow}
                      onChange={(e) => patchUnit(u.id, 'hpNow', e.target.value.replace(/[^\d]/g, ''))}
                      placeholder={String(unit.hpMax)}
                      className="w-16 rounded-[2px] border border-line-strong bg-paper px-1.5 py-1 text-center text-[13px] text-ink tabular outline-none focus:border-amber-600/60"
                    />
                    <span className="text-[12.5px] text-ink-mute">/ {unit.hpMax}</span>
                    {[1, 5, 10].map((n) => (
                      <Button
                        key={n}
                        variant="ghost"
                        size="sm"
                        onClick={() => patchUnit(u.id, 'hpNow', String(Math.max(0, unit.hpNow - n)))}
                      >
                        −{n}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => patchUnit(u.id, 'hpNow', '')}>回满</Button>
                    <span className="ml-auto rounded-[2px] border border-line-strong px-2 py-0.5 text-[12px] text-ink">
                      {unit.stage.label} · 每回合 {unit.stage.attacks} 次{unit.stage.penaltyDie ? ' · 惩罚骰' : ''}
                    </span>
                  </div>

                  <Field label="备注" className="mt-3">
                    <Textarea rows={2} value={u.note} onChange={(e) => patchUnit(u.id, 'note', e.target.value)} placeholder="例：手持短刀与火把，成群冲锋；受伤过半会溃散。" />
                  </Field>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ['力量', unit.str], ['体质', unit.con], ['体型', unit.siz], ['生命上限', unit.hpMax],
                      ['体格', unit.build], ['伤害加值', unit.db], ['闪避', `${unit.dodge}%`],
                      ['攻击技能', `${unit.attack}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[2px] border border-line-strong bg-paper-raised px-3 py-2">
                        <div className="text-[12px] text-ink-mute">{label}</div>
                        <div className="font-serif text-[19px] font-bold leading-tight text-ink tabular">{value}</div>
                      </div>
                    ))}
                  </div>

                  {unit.attacks.length > 1 ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-soft">
                      {unit.attacks.map((a) => (
                        <span key={a.label}>{a.label} <b className="font-mono text-ink">{a.total}%</b></span>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                    伤害加值取「体格大一级」的数值（常态 {unit.baseDb} → 集群 {unit.db}）；战力衰减按当前生命：
                    <b className="text-ink"> {unit.stage.label}</b> —— {unit.stage.hint}。
                  </p>

                  <div className="mt-3 overflow-hidden rounded-[2px] border border-line-strong">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="bg-paper-deep/60 text-ink-mute">
                        <tr>
                          <th className="px-3 py-1.5 font-semibold">阶段</th>
                          <th className="px-3 py-1.5 font-semibold">生命区间</th>
                          <th className="px-3 py-1.5 font-semibold">每回合攻击</th>
                          <th className="px-3 py-1.5 font-semibold">群体动作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attritionTable(unit.hpMax).map((t) => (
                          <tr key={t.key} className="border-t border-line">
                            <td className="px-3 py-1.5 text-ink">{t.label}</td>
                            <td className="px-3 py-1.5 font-mono text-ink-soft">{t.range}</td>
                            <td className="px-3 py-1.5 text-ink-soft">{t.attacks} 次</td>
                            <td className="px-3 py-1.5 text-ink-soft">{t.penaltyDie ? '加惩罚骰' : '正常'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              );
            })}

            <Panel className="p-5">
              <div className="caption !text-[12px]">公式与口径</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-mute">
                <Calculator className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.8} />
                力量 ×2、体质与体型 ×5、生命 =（体质+体型）÷10、体格按规则书表、伤害加值取体格大一级、闪避 = 敏捷 ÷5、攻击技能 ×2。
                攻击技能可以不止格斗：刀、斧头、擒拿等自己加的条目同样按单项 ×2 计算，并一起印在纸面上。
              </p>
            </Panel>
          </div>

          <div className="lg:sticky lg:top-2 lg:self-start">
            <div className="mb-2 flex items-center justify-between">
              <div className="caption !text-[12px]">打印预览（A4 × {units.length}）</div>
              <span className="text-[12px] text-ink-mute">{Math.round(zoom * 100)}%</span>
            </div>
            <div ref={previewRef} className="overflow-x-auto rounded-[2px] border border-line-strong bg-paper-deep/40 p-2">
              <div className="mx-auto w-fit" style={{ zoom }}>
                <MassSheet units={units} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrintLayer><MassSheet units={units} /></PrintLayer>
    </ToolShell>
  );
}

// ----------------------------------------------------------------- 工具箱首页

const TOOLS = [
  {
    id: 'status',
    name: '带团状态记录卡',
    icon: ClipboardList,
    desc: '自由组合字段模块（玩家、角色、属性、HP/SAN、重伤值、异变值、勾选框…），按 A4 排版打印，一页 4–8 人，适合面团桌面。',
    tags: ['A4 打印', '自定义字段', '可导出 .md'],
    accent: 'amber',
  },
  {
    id: 'mass',
    name: '群战集群构建器',
    icon: Swords,
    desc: '守秘人伴侣群战规则：把一群低阶敌人抽象成一个单位，自动算力量/体质/体型、生命、体格、伤害加值、闪避与攻击，并给出战力衰减门槛。',
    tags: ['集群单位', '战力衰减', '可打印'],
    accent: 'red',
  },
];

export default function KpToolbox() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="mb-4 rounded-[2px] border border-line-strong bg-paper-raised/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">不落库工具</span>：这里的表只存在你的浏览器里，
        <span className="text-amber-500"> 不上传服务器、不占账号额度 </span>，
        换设备或清缓存会消失——用完请打印成 PDF 或导出 .md 留档。
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setOpen(tool.id)}
              className="group flex h-full flex-col items-start gap-3 rounded-[2px] border border-line-strong bg-paper-raised/70 p-5 text-left transition hover:border-amber-600/60 hover:bg-paper-raised"
            >
              <span className={cx(
                'flex h-10 w-10 items-center justify-center rounded-[2px] border',
                tool.accent === 'amber' ? 'border-amber-600/50 bg-ochre/15 text-amber-500' : 'border-red-600/45 bg-red-500/10 text-red-500',
              )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="font-serif text-[17px] font-bold tracking-[0.02em] text-ink group-hover:text-amber-500">{tool.name}</span>
              <span className="text-[13px] leading-relaxed text-ink-soft">{tool.desc}</span>
              <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                {tool.tags.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}
              </span>
            </button>
          );
        })}
      </div>

      {open === 'status' ? <StatusTool onClose={() => setOpen(null)} /> : null}
      {open === 'mass' ? <MassTool onClose={() => setOpen(null)} /> : null}
    </>
  );
}