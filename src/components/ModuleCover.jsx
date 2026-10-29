/**
 * 模组封面 —— 深潜档案馆的封皮。
 *
 * 一片封皮就是一份装订好的案卷：
 *   - 八种深海油墨，按模组原有 themeColor 家族映射，再按 id 哈希决定
 *     渐变角度、两团晕光的位置，保证上百份卷宗摆在一起也不会撞色；
 *   - 封面只留「档案编号 + 题名」两类文字，其余靠装订孔、双线内框、
 *     四角套准角标与深海雕刻图案说话，避免长题名被装饰文字挤占；
 *   - 卡片与详情 hero 共用同一套版式，只调尺寸与内边距。
 *
 * 导出：
 *   <CoverPlate module variant="card|hero" />   完整封面（含题名）
 *   fileNumberOf(module)                        档案编号
 *   coverInk(module)                            油墨名（给外部配色用）
 */
import React from 'react';

import { CoverMotif, SealWatermark } from './Emblem.jsx';
import { hashString, jitter } from '../lib/random.js';

/** 八种深海印版：from/to 是印版的两端，glow/glow2 是两团冷光。 */
export const PLATE_INKS = {
  abyss: { from: '#122620', to: '#081310', glow: 'rgba(128, 200, 176, 0.46)', glow2: 'rgba(58, 130, 150, 0.28)', name: '深渊' },
  indigo: { from: '#14304d', to: '#081a2b', glow: 'rgba(112, 176, 224, 0.46)', glow2: 'rgba(60, 98, 168, 0.30)', name: '墨蓝' },
  teal: { from: '#0e3d3d', to: '#072324', glow: 'rgba(104, 216, 200, 0.46)', glow2: 'rgba(38, 120, 140, 0.30)', name: '咸水' },
  marsh: { from: '#1e3a26', to: '#0d1e14', glow: 'rgba(136, 206, 138, 0.40)', glow2: 'rgba(84, 120, 62, 0.28)', name: '苔沼' },
  blood: { from: '#401c15', to: '#220d0a', glow: 'rgba(224, 110, 72, 0.44)', glow2: 'rgba(126, 52, 40, 0.30)', name: '陈血' },
  ochre: { from: '#3a2c19', to: '#1e1509', glow: 'rgba(230, 188, 104, 0.42)', glow2: 'rgba(126, 94, 40, 0.28)', name: '赭石' },
  wreck: { from: '#0f2338', to: '#06101d', glow: 'rgba(104, 154, 208, 0.44)', glow2: 'rgba(40, 74, 120, 0.32)', name: '沉船' },
  peat: { from: '#2a2a1c', to: '#14140d', glow: 'rgba(186, 196, 140, 0.34)', glow2: 'rgba(94, 96, 62, 0.26)', name: '泥炭' },
};

/**
 * 把服务端的 themeColor 家族映射到深海印版。
 * 认不出来的（老数据/手工值）按 id 哈希落到几种主色之一，保持稳定。
 */
export function coverInk(module) {
  const t = String(module?.themeColor || '');
  if (/red|orange|rose|pink/.test(t)) return 'blood';
  if (/amber|stone|yellow|gold/.test(t)) return 'ochre';
  if (/purple|indigo|violet|fuchsia/.test(t)) return 'indigo';
  if (/green|emerald|lime|olive/.test(t)) return 'marsh';
  if (/blue|cyan|sky|teal/.test(t)) return 'teal';
  const fallback = ['indigo', 'abyss', 'teal', 'wreck', 'blood', 'marsh'];
  return fallback[hashString(module?.id || module?.title) % fallback.length];
}

/** 由模组 id 生成一枚稳定的档案编号（纯展示，无业务含义） */
export function fileNumberOf(module) {
  const raw = String(module?.id || '').replace(/^[a-z]+_/i, '').replace(/[^0-9a-z]/gi, '');
  const tail = (raw.slice(-6) || '000000').toUpperCase();
  return `NO.${tail}`;
}

/** 印版上的细双线（兼容旧引用） */
export function GoldDivider({ className = '', tone = 'ink' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className={`h-px flex-1 ${tone === 'paper' ? 'bg-[#f6ebcd]/35' : 'bg-ink/25'}`} />
      <span className={`h-[5px] w-[5px] rotate-45 ${tone === 'paper' ? 'bg-[#f6ebcd]/60' : 'bg-ink/45'}`} />
      <span className={`h-px flex-1 ${tone === 'paper' ? 'bg-[#f6ebcd]/35' : 'bg-ink/25'}`} />
    </div>
  );
}

/**
 * 完整封面。
 * @param {object} module
 * @param {'card'|'hero'} variant
 */
export default function CoverPlate({ module, variant = 'card', className = '' }) {
  const hero = variant === 'hero';
  const inkKey = coverInk(module);
  const ink = PLATE_INKS[inkKey] || PLATE_INKS.abyss;
  const seed = String(module?.id || module?.title || 'x');
  const h = hashString(`${seed}|plate`);
  const angle = 116 + (h % 92);
  const glowX = 72 + (h % 24);
  const glowY = -22 + (h % 10);
  const glowBX = 2 + ((h >> 3) % 28);
  const stampTilt = jitter(`${seed}stamp`, -7.5, 5.5, 1);

  return (
    <div
      data-cover-plate={variant}
      data-cover-ink={inkKey}
      className={`plate relative isolate flex w-full flex-col overflow-hidden ${hero ? 'min-h-[320px] p-6 pl-11 sm:p-8 sm:pl-14' : 'h-[230px] px-4 pb-3.5 pt-3 pl-9'} ${className}`}
      style={{
        backgroundColor: ink.to,
        backgroundImage: `radial-gradient(68% 92% at ${glowX}% ${glowY}%, ${ink.glow}, transparent 62%), radial-gradient(56% 66% at ${glowBX}% 112%, ${ink.glow2}, transparent 70%), linear-gradient(${angle}deg, ${ink.from} 0%, ${ink.to} 66%, ${ink.to} 100%)`,
      }}
    >
      {hero ? <span className="sr-only">档案编号 {fileNumberOf(module)}</span> : null}

      {/* 印刷斜纹：很轻的一层，给平涂色版一点纸的呼吸 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{ backgroundImage: 'repeating-linear-gradient(112deg, #f6ebcd 0 1px, transparent 1px 6px)' }}
      />

      {/* 极淡大压印：只在 hero 出现，给空出来的上半张纸一点层次 */}
      {hero ? (
        <SealWatermark
          size={420}
          opacity={0.07}
          strokeWidth={0.9}
          className="pointer-events-none absolute right-[22%] top-[42%] hidden -translate-y-1/2 text-[#f6ebcd] lg:block"
        />
      ) : null}

      {/* 深水里探入的雕刻：卡片在右下、hero 在右中，保证图案完整可见 */}
      <div
        aria-hidden="true"
        className={`cover-motif pointer-events-none absolute text-[#f6ebcd] ${hero ? 'right-[3%] top-[52%] w-[42%] max-w-[420px] -translate-y-1/2' : 'bottom-4 right-1 w-[58%] max-w-[238px]'}`}
      >
        <CoverMotif seed={seed} opacity={hero ? 0.4 : 0.27} className="h-auto w-full" />
      </div>

      {/* 月晕环 */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-[320px] w-[320px] rounded-full border border-[#f6ebcd]/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 h-[210px] w-[210px] rounded-full border border-[#f6ebcd]/[0.08]" />

      {/* 装订孔：左侧一排 */}
      <div aria-hidden="true" className={`pointer-events-none absolute left-[13px] flex flex-col justify-between ${hero ? 'inset-y-9' : 'inset-y-5'}`}>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className="h-[7px] w-[7px] rounded-full border border-[#f6ebcd]/25 bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
        ))}
      </div>

      {/* 双线内框 + 四角套准角标 */}
      <div
        data-cover-rule=""
        aria-hidden="true"
        className={`pointer-events-none absolute border border-[#f6ebcd]/22 ${hero ? 'inset-3' : 'inset-2'}`}
      />
      <div aria-hidden="true" className={`pointer-events-none absolute border border-[#f6ebcd]/10 ${hero ? 'inset-[17px]' : 'inset-[13px]'}`} />
      <div aria-hidden="true" className={`pointer-events-none absolute ${hero ? 'inset-[13px]' : 'inset-[9px]'}`}>
        {[
          'left-0 top-0 border-l border-t',
          'right-0 top-0 border-r border-t',
          'bottom-0 left-0 border-b border-l',
          'bottom-0 right-0 border-b border-r',
        ].map((pos) => (
          <span key={pos} data-cover-corner="" className={`absolute h-[9px] w-[9px] border-[#f6ebcd]/55 ${pos}`} />
        ))}
      </div>

      {/* 顶部只留档案编号；card 的编号改为 sr-only，避免与叠签、状态章抢位 */}
      <div className="relative z-10 flex items-start justify-end">
        {hero ? (
          <span className="shrink-0 border border-[#f6ebcd]/12 bg-[#0b0d0a]/45 px-1.5 py-0.5 font-mono text-[11.5px] tracking-[0.1em] tabular text-[#f6ebcd]/78 backdrop-blur-[1px] sm:px-2 sm:py-1 sm:text-[14px] sm:tracking-[0.16em]">
            档案编号 {fileNumberOf(module)}
          </span>
        ) : (
          <span className="sr-only">{fileNumberOf(module)}</span>
        )}
      </div>

      {/* 题名：卡片带地区/时代/人数/时长，hero 只留题名与条码，信息交给下方夹页 */}
      <div className={`relative z-10 mt-auto ${hero ? 'pt-16' : 'pt-6'}`}>
        <h3
          title={module.title}
          className={`cover-title font-serif font-black leading-[1.18] tracking-[-0.01em] ${
            hero ? 'text-[38px] sm:text-[54px]' : 'line-clamp-2 text-[27px]'
          }`}
        >
          {module.title}
        </h3>

        <div className={`flex items-center justify-between gap-3 border-t border-[#f6ebcd]/15 pt-2 ${hero ? 'mt-4 pt-3' : 'mt-2.5'}`}>
          {hero ? (
            <span aria-hidden="true" />
          ) : (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] text-[#f6ebcd]/82">
              <span>{module.region || '未标注地区'}</span>
              <span aria-hidden="true" className="h-2 w-px bg-[#f6ebcd]/20" />
              <span>{module.era}</span>
              <span aria-hidden="true" className="h-2 w-px bg-[#f6ebcd]/20" />
              <span>{module.players} 人 · {module.duration}h</span>
            </span>
          )}
          <span aria-hidden="true" className="flex shrink-0 items-end gap-[2px]">
            {[3, 7, 4, 9, 5, 8, 3, 6, 9, 4, 7].map((b, i) => (
              <span key={i} className="w-[2px] bg-[#f6ebcd]/35" style={{ height: `${b + 3}px` }} />
            ))}
          </span>
        </div>
      </div>

      {/* 馆藏印章：hero 在右下、card 也收进右下角，按 id 微微转动 */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-10 border border-[#e88a74]/80 font-serif font-bold text-[#f0a08a] ${hero ? 'px-3.5 py-1 text-[14px] tracking-[0.18em]' : 'px-2 py-0.5 text-[14px] tracking-[0.14em]'}`}
        style={{
          right: hero ? '26px' : '10px',
          top: 'auto',
          bottom: hero ? '58px' : '54px',
          transform: `rotate(${stampTilt}deg)`,
          backgroundColor: 'rgba(20, 12, 9, 0.18)',
        }}
      >
        馆藏
      </span>
    </div>
  );
}
