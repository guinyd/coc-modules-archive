/**
 * 通用 UI 原语 —— v3「铅印案卷」。
 *
 * 设计语言：暖棉纸 + 炭黑字 + 朱砂盖章；一张纸就是一张纸——2~3px 圆角、
 * 1px 墨线、印刷色块，不用玻璃、辉光与渐变。按钮按下会「压进纸里」，
 * 页签下有一块滑动的朱砂印。
 *
 * 兼容说明：原有导出（Button/Panel/PageHeader/SectionHeading/StatStrip/Tabs/
 * Badge/Field/Input/Select/Combobox/Toast/…）全部保留同名 API；新增 Reveal
 * （滚动入场）、Stamp（盖章）、TabDivider（双线）。
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, ChevronDown, X } from 'lucide-react';

// ------------------------------------------------------------------ 基础类
export const cx = (...parts) => parts.filter(Boolean).join(' ');

/** 表单控件：档案馆的登记格 —— 纸面、硬边、印泥红聚焦 */
export const fieldBase = 'w-full px-3 py-2.5 bg-paper-raised border border-line-strong rounded-[2px] text-ink '
  + 'placeholder-ink-mute/80 outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] '
  + 'shadow-[inset_0_1px_0_rgba(255,250,238,0.7)] '
  + 'hover:border-ink-mute focus:border-indigo focus:ring-[3px] focus:ring-indigo/10 '
  + 'disabled:opacity-50 disabled:bg-paper-deep';

/**
 * 按钮：印刷铅字块。墨色从底部渗上来，纸色字随之上浮，
 * 主色是档案印泥红，副色是深海青；按下时整块压进纸里。
 */
const base = 'press group/btn inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold tracking-[0.02em] whitespace-nowrap select-none';

/** 控件高度：xs 24 / sm 28 / md 36 / lg 44 / xl 60（与全站图标 16/24/32 配套） */
const sizes = {
  xs: 'h-6 min-h-6 px-2.5 text-[14px]',
  sm: 'h-7 min-h-7 px-3 text-[14px]',
  md: 'h-9 min-h-9 px-4 text-[14.5px]',
  lg: 'h-11 min-h-11 px-5 text-[15px]',
  xl: 'h-[60px] min-h-[60px] px-8 text-[16px]',
};

export const btn = {
  primary: `${base} btn-stamp border border-vermilion-deep `
    + 'shadow-[3px_3px_0_0_rgba(23,17,9,0.18)] hover:border-vermilion-deep '
    + 'hover:shadow-[5px_5px_0_0_rgba(23,17,9,0.16)] hover:-translate-y-px '
    + 'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0',
  ghost: `${base} bg-paper-raised/70 text-ink-soft border border-line-strong `
    + 'hover:border-vermilion/70 hover:text-vermilion hover:bg-paper-raised '
    + 'disabled:opacity-40 disabled:cursor-not-allowed',
  danger: `${base} bg-ink text-paper-raised border border-black/40 `
    + 'shadow-[3px_3px_0_0_rgba(23,17,9,0.24)] '
    + 'hover:bg-vermilion-deep hover:border-vermilion-deep hover:-translate-y-px '
    + 'disabled:opacity-40 disabled:cursor-not-allowed',
  amber: `${base} bg-indigo text-[#f7efdd] border border-indigo-deep `
    + 'shadow-[3px_3px_0_0_rgba(12,42,47,0.24)] '
    + 'hover:bg-indigo-deep hover:-translate-y-px '
    + 'disabled:opacity-40 disabled:cursor-not-allowed',
  subtle: `${base} text-ink-soft bg-paper-deep border border-line-strong text-[14px] `
    + 'hover:bg-paper-raised hover:text-ink hover:border-ink-mute '
    + 'disabled:opacity-40 disabled:cursor-not-allowed',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  return (
    <button type="button" className={cx(base, sizes[size], btn[variant], className)} {...rest}>
      {children}
    </button>
  );
}

/** 纸面面板：1px 墨线 + 顶部纸光（层级靠纸色区分，不加重边框） */
export function Panel({ className, children }) {
  return <div className={cx('surface', className)}>{children}</div>;
}

/** 盖章：旋转的描边印章，颜色取自档案撞色 */
export function Stamp({ children, tone = 'vermilion', className }) {
  const color = tone === 'ink' ? 'text-ink' : tone === 'forest' ? 'text-forest' : tone === 'indigo' ? 'text-indigo' : tone === 'ochre' ? 'text-ochre' : 'text-vermilion';
  return <span className={cx('stamp', color, className)}>{children}</span>;
}

// ------------------------------------------------------------------ 页头 / 分节
/**
 * 页面抬头：档案馆的公文首行 —— 眉标 + 封条 + 大标题 + 一条双墨线。
 * `tone` 给每个部门一套自己的标题纸色（默认仍是深海青）。
 */
const TITLE_TONES = {
  moon: 'moon-text',
  vermilion: 'page-title--vermilion',
  ochre: 'page-title--ochre',
  forest: 'page-title--forest',
  indigo: 'page-title--indigo',
  ink: 'page-title--ink',
};

export function PageHeader({
  title, desc, actions, back, className, titleClassName, eyebrow, meta, tone = 'moon',
}) {
  return (
    <header className={cx('mb-8', className)}>
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink/70 pb-2">
        <span className="inline-flex items-center gap-2 font-mono text-[14px] font-semibold tracking-[0.26em] text-ink-mute">
          <span aria-hidden="true" className="h-[8px] w-[8px] rotate-45 bg-vermilion" />
          {eyebrow || 'ARCHIVE RECORD'}
        </span>
        {meta ? (
          <span className="hidden font-mono text-[14px] tracking-[0.22em] text-ink-mute sm:inline">{meta}</span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0">
          {back ? (
            <button
              type="button"
              onClick={back.onClick}
              className="group mb-3 inline-flex items-center gap-1.5 font-mono text-[14px] tracking-[0.14em] text-ink-mute transition-colors hover:text-vermilion"
            >
              <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
              {back.label || '返回'}
            </button>
          ) : null}
          <h1 className={cx(
            'w-fit max-w-full font-serif text-[30px] font-black leading-[1.14] tracking-[-0.015em] sm:text-[44px]',
            TITLE_TONES[tone] || TITLE_TONES.moon,
            titleClassName,
          )}>
            {title}
          </h1>
          {desc ? <p className="mt-3 max-w-2xl text-[16px] leading-[1.85] text-ink-soft">{desc}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="rule-double mt-5" />
    </header>
  );
}

/** 分节标题：红色编号 + 衬线标题，底边压一条短红线 */
export function SectionHeading({ index, title, desc, right, className }) {
  return (
    <div className={cx('relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-ink/30 pb-2.5', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {index ? (
          <span className="inline-flex h-[20px] min-w-[24px] items-center justify-center bg-vermilion px-1.5 font-mono text-[14px] font-bold tracking-[0.1em] text-paper-raised">
            {index}
          </span>
        ) : null}
        <h2 className="font-serif text-[21px] font-bold tracking-[0.01em] text-ink">{title}</h2>
        {desc ? <span className="text-[14px] text-ink-mute">{desc}</span> : null}
      </div>
      {right}
      <span aria-hidden="true" className="absolute -bottom-[1px] left-0 h-[2px] w-10 bg-vermilion" />
    </div>
  );
}

/** 兼容旧调用：带图标的分节标题，外观与新分节标题一致 */
export function SectionTitle({ icon: Icon, title, desc, right, className }) {
  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3 border-b border-ink/30 pb-2.5', className)}>
      <div className="flex items-center gap-2.5">
        {Icon ? <Icon className="h-[17px] w-[17px] shrink-0 text-vermilion" strokeWidth={1.7} /> : null}
        <div>
          <h2 className="font-serif text-[19px] font-bold tracking-[0.01em] text-ink">{title}</h2>
          {desc ? <p className="mt-1 text-[14px] leading-relaxed text-ink-mute">{desc}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

/** 账目式统计条：红色小格 + 衬线大数字 */
export function StatStrip({ items, className }) {
  return (
    <dl className={cx('grid grid-cols-2 border-y-2 border-ink/60 sm:flex sm:flex-wrap sm:items-stretch', className)}>
      {items.map((it, i) => (
        <div
          key={it.label}
          className={cx(
            'min-w-0 px-3 py-3 sm:min-w-[7.5rem] sm:flex-1 sm:px-5',
            i > 0 && 'sm:border-l sm:border-line-strong',
            i % 2 === 1 && 'border-l border-line-strong',
            i >= 2 && 'border-t border-line-strong sm:border-t-0',
          )}
        >
          <dt className="truncate font-mono text-[14px] font-medium tracking-[0.18em] text-ink-mute">{it.label}</dt>
          <dd className="mt-1.5 flex items-baseline gap-1 font-serif text-[24px] font-black leading-none text-ink tabular sm:text-[30px]">
            {it.value}
            {it.unit ? <span className="font-sans text-[14px] font-normal tracking-wider text-ink-mute">{it.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ 页签
/**
 * 页签：一块印泥红的档案标签从上一页滑到下一页。
 * 指示块用轻微回弹的曲线，不做线性生硬位移。
 */
export function Tabs({ items, value, onChange, className, stretch, size = 'md' }) {
  const wrapRef = useRef(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const el = wrap.querySelector(`[data-tab="${value}"]`);
    if (!el) return;
    setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [value]);

  useEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  const pad = size === 'sm' ? 'px-3 py-2 text-[14px]' : 'px-4 py-2.5 text-[14.5px]';

  return (
    <div
      ref={wrapRef}
      role="tablist"
      className={cx('relative flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-line-strong pb-0', className)}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[2px] bottom-[2px] -skew-x-2 bg-vermilion shadow-[2px_2px_0_0_rgba(23,17,9,0.16)]"
        style={{
          left: ind.left,
          width: ind.width,
          opacity: ind.ready ? 1 : 0,
          transition: ind.ready
            ? 'left 460ms cubic-bezier(0.34,1.28,0.64,1), width 460ms cubic-bezier(0.34,1.28,0.64,1), opacity 180ms'
            : 'none',
        }}
      />
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-tab={it.value}
            data-active={active ? 'true' : undefined}
            onClick={() => onChange(it.value)}
            className={cx(
              'tab-stamp relative z-10 whitespace-nowrap',
              stretch && 'flex-1 justify-center',
              pad,
              active ? 'text-paper-raised' : 'hover:bg-paper-deep/60',
            )}
          >
            {it.icon ? <it.icon className="h-4 w-4" /> : null}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ 徽标
export function Badge({ tone = 'slate', children, className }) {
  const tones = {
    slate: 'bg-paper-deep text-ink-soft border-line-strong',
    emerald: 'bg-forest/10 text-forest border-forest/45',
    amber: 'bg-ochre/12 text-ochre border-ochre/45',
    red: 'bg-vermilion/10 text-vermilion border-vermilion/50',
    cyan: 'bg-moon/10 text-moon border-moon/45',
  };
  return (
    <span className={cx(
      'inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 font-mono text-[14px] font-semibold tracking-[0.1em]',
      tones[tone], className,
    )}>
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ 表单
export function Field({ label, hint, required, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label ? (
        <span className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="font-mono text-[14px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
            {label}{required ? <span className="ml-0.5 text-vermilion">*</span> : null}
          </span>
          {hint ? <span className="text-[14px] text-ink-mute">{hint}</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="mt-1 block text-[14px] text-vermilion">{error}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }) {
  return <input className={cx(fieldBase, className)} {...rest} />;
}

export function Textarea({ className, rows = 3, ...rest }) {
  return <textarea rows={rows} className={cx(fieldBase, 'resize-y leading-relaxed', className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select
      className={cx(
        fieldBase,
        'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23746653%27%20stroke-width%3D%272.5%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E")] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-9',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        'group flex w-full items-center gap-3 rounded-[2px] border p-3 text-left transition-all duration-300 ease-[var(--ease-soft)]',
        checked
          ? 'border-vermilion/45 bg-vermilion/[0.06]'
          : 'border-line-strong bg-paper-raised hover:border-ink-mute',
      )}
    >
      <span className={cx(
        'relative h-[20px] w-[36px] shrink-0 rounded-[2px] border transition-colors duration-300',
        checked ? 'border-vermilion-deep bg-vermilion' : 'border-line-strong bg-paper-deep',
      )}>
        <span className={cx(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-[1px] bg-paper-raised shadow-[0_1px_2px_rgba(23,17,9,0.35)] transition-[left,background-color] duration-300 ease-[var(--ease-bounce)]',
          checked ? 'left-[18px]' : 'left-[2px] group-hover:left-[3px]',
        )} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-mute">{hint}</span> : null}
      </span>
    </button>
  );
}

/**
 * 纸面可搜索下拉框（替代浏览器原生 <datalist>）。
 *
 * 为什么不用 datalist：它的建议列表由浏览器原生渲染，Chrome 下是一块白底面板，
 * CSS 与 color-scheme 都改不动，和印刷纸面非常突兀。这里自绘一个：
 * 输入即过滤、点击/回车选中、点击外部或 Esc 关闭，样式与站点完全统一。
 *
 * @param {string[]} options 候选项
 * @param {(v:string)=>void} onChange 输入变化（自由输入也走这里）
 * @param {(v:string)=>void} [onPick] 点选候选项；给了就只回调它，不再回写 value
 */
export function Combobox({
  value = '', onChange, onPick, options = [], placeholder, maxLength = 60,
  emptyHint = '没有匹配项，可直接输入', className, inputClassName, disabled, id,
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);

  const list = useMemo(() => {
    const kw = String(value || '').trim().toLowerCase();
    const uniq = [...new Set(options.filter(Boolean))];
    if (!kw) return uniq;
    return uniq.filter((o) => String(o).toLowerCase().includes(kw));
  }, [options, value]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  useEffect(() => { setHi(0); }, [value, open]);

  const pick = (v) => {
    if (onPick) onPick(v);
    else onChange?.(v);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={cx('relative', className)}>
      <div className="relative">
        <input
          id={id}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => { onChange?.(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((i) => Math.min(i + 1, list.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') {
              if (open && list[hi]) { e.preventDefault(); pick(list[hi]); }
            } else if (e.key === 'Escape') setOpen(false);
          }}
          className={cx(fieldBase, 'pr-9', inputClassName)}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition hover:text-red-500"
          aria-label="展开候选"
        >
          <ChevronDown className={cx('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      {open && !disabled ? (
        <div
          data-combobox-panel
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-[2px] border border-ink bg-paper-raised py-1 shadow-[0_18px_44px_-22px_rgba(23,18,12,0.6)] animate-in drop-in"
        >
          {list.length === 0 ? (
            <p className="px-3 py-2 text-[14px] text-slate-500">{emptyHint}</p>
          ) : list.map((o, i) => (
            <button
              key={o}
              type="button"
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(o)}
              className={cx(
                'w-full px-3 py-2 text-left text-[14px] transition-colors',
                i === hi ? 'bg-amber-500/15 text-slate-100' : 'text-slate-300 hover:bg-paper-deep',
              )}
            >
              {o}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ 反馈
export function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className={cx(
      'fixed left-1/2 top-5 z-[100] flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-[2px] border px-4 py-2.5 text-[14px] font-medium animate-in drop-in',
      isError
        ? 'border-red-500 bg-[#2a0e0a] text-red-100 shadow-[0_18px_40px_-24px_rgba(23,18,12,0.9)]'
        : 'border-ink bg-ink text-paper-raised shadow-[0_18px_40px_-24px_rgba(23,18,12,0.9)]',
    )}>
      {isError ? <AlertCircle className="h-4 w-4 shrink-0 text-red-300" /> : <CheckCircle className="h-4 w-4 shrink-0 text-emerald-200" />}
      <span className="truncate">{toast.msg}</span>
    </div>
  );
}

export function ConfirmDialog({ dialog, onClose }) {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17120c]/50 p-4 animate-in fade-in">
      <div className="surface w-full max-w-sm animate-in zoom-in-95">
        <div className="rule-double mx-6 mt-6" />
        <div className="p-6">
          <p className="font-serif text-[19px] font-bold leading-snug text-slate-100">{dialog.msg}</p>
          {dialog.detail
            ? <p className="mt-2.5 text-[16px] leading-relaxed text-slate-400">{dialog.detail}</p>
            : null}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>取消</button>
            <button
              type="button"
              onClick={() => { dialog.onConfirm(); onClose(); }}
              className={dialog.danger === false ? btn.primary : btn.danger}
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#081311]/55 p-3 backdrop-blur-sm animate-in fade-in sm:p-6">
      <div className={cx(
        'surface my-4 w-full animate-in zoom-in-95 sm:my-8',
        wide ? 'max-w-3xl' : 'max-w-xl',
      )}>
        <div className="flex items-center justify-between border-b border-line-strong px-5 py-4 sm:px-6">
          <h3 className="font-serif text-[20px] font-bold tracking-wide text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-transparent text-slate-500 transition-colors hover:border-line-strong hover:bg-paper-deep hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="px-4 py-16 text-center animate-in fade-in">
      {Icon ? (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-line-strong bg-paper-raised">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
      ) : null}
      <p className="font-serif text-[19px] font-bold tracking-wide text-slate-200">{title}</p>
      {desc ? <p className="mx-auto mt-2 max-w-md text-[16px] leading-relaxed text-slate-500">{desc}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function WarningList({ items, title = '规则提示' }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[14px] text-emerald-600">
        <CheckCircle className="h-4 w-4" /> 所有规则校验通过
      </div>
    );
  }
  return (
    <div className="rounded-[2px] border border-amber-500/45 bg-amber-500/[0.07] p-4">
      <p className="mb-2 flex items-center text-[14px] font-bold tracking-[0.06em] text-amber-300">
        <AlertCircle className="mr-1.5 h-4 w-4" />{title}（{items.length}）
      </p>
      <ul className="space-y-1">
        {items.map((w, i) => (
          <li key={i} className="flex text-[14px] leading-relaxed text-slate-300">
            <span className="mr-2 text-amber-300">·</span><span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 数值输入（供属性/技能点/年龄使用，禁止滚轮误改）。
 *
 * ⚠️ 不要在每次按键时就 Math.max/min 钳制：用户想输入「25」时，按下「2」会被立刻夹成 15
 * （年龄输入框就是这么变成 15 / 120 的）。这里改成：
 *  - 合法输入实时同步给父组件（合计/派生值照常即时刷新）；
 *  - 只输入了一半（如 15 的「1」）时保留原文，等失焦或回车再夹到合法区间。
 */
export function NumberInput({ value, onChange, min = 0, max = 99, className, ...rest }) {
  const [draft, setDraft] = useState(null);
  const shown = draft !== null ? draft : (value === 0 || value ? String(value) : '');

  const commit = (raw) => {
    setDraft(null);
    if (raw === '') { onChange(''); return; }
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n)) { onChange(''); return; }
    onChange(Math.max(min, Math.min(max, n)));
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      value={shown}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === '') return;
        const n = Math.trunc(Number(raw));
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      onWheel={(e) => e.currentTarget.blur()}
      className={cx(fieldBase, 'text-center font-serif font-bold tabular', className)}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ 滚动入场 */
/**
 * 滚动入场：自己管一个 IntersectionObserver，进入视口后一次性加上 .is-in。
 * - 内容在首屏也已经可见（IO 回调异步触发，不是隐藏等动画）；
 * - prefers-reduced-motion 下由 CSS 直接显示；
 * - 无 IntersectionObserver 时立即显示。
 * - variant="unseal"：卡片从下沿被揭开的启封入场，用于卷宗陈列这类
 *   同构重复的块；普通内容仍用默认的淡入，避免全页一个动作。
 */
export function Reveal({ children, delay = 0, variant = 'fade', className, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setShown(true); io.disconnect(); }
      });
    }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cx(variant === 'unseal' ? 'reveal-unseal' : 'reveal-up', shown && 'is-in', className)}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}