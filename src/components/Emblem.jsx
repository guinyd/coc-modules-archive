/**
 * 档案馆徽记 —— v5「深潜档案馆」。
 *
 * 旧盾牌 / 双环蜡封 / 罗盘瞳印全部退役。现在的记号是一枚**潮汐之眼**：
 * 一圈断裂的铜环，中央一只竖瞳，四条触手从环下探出，环上有八枚刻度。
 * 它既是档案馆的印章，也是克苏鲁的呼吸。
 *
 * 导出：
 *   SealMark        小印（16px 起可用，currentColor）
 *   SealWatermark   大压印（静态，导出安全）
 *   StampSeal       带文字的旋转印章
 *   CoverMotif      封面雕刻（六种，按 seed 稳定选择）
 *   CornerTick      套准角标
 *   motifKindOf     取该 seed 对应的雕版名
 */
import React from 'react';

import { hashString, pick } from '../lib/random.js';

export function SealMark({ className = '', size = 28, strokeWidth = 2.4, title }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* 外环：八段，像被海水咬过 */}
        <path d="M32 3.5a28.5 28.5 0 0 1 20.15 8.35" />
        <path d="M55.6 17.2A28.5 28.5 0 0 1 60.5 32" />
        <path d="M60.5 32a28.5 28.5 0 0 1-8.35 20.15" />
        <path d="M46.8 55.6A28.5 28.5 0 0 1 32 60.5" />
        <path d="M32 60.5a28.5 28.5 0 0 1-20.15-8.35" />
        <path d="M8.4 46.8A28.5 28.5 0 0 1 3.5 32" />
        <path d="M3.5 32A28.5 28.5 0 0 1 11.85 11.85" />
        <path d="M17.2 8.4A28.5 28.5 0 0 1 32 3.5" />
        {/* 中央竖瞳 */}
        <path d="M14.5 32c5.2-8.2 11-12.3 17.5-12.3S44.3 23.8 49.5 32C44.3 40.2 38.5 44.3 32 44.3S19.7 40.2 14.5 32Z" />
        <ellipse cx="32" cy="32" rx="4.3" ry="8.6" />
        <circle cx="32" cy="32" r="1.5" fill="currentColor" stroke="none" />
        {/* 触手：从环下缘卷出去 */}
        <path d="M20 50.5c2.6 4.4 1.6 7.6-1.6 9.4-2.4 1.3-4.9.3-5.6-1.9-.6-1.9.7-3.6 2.6-3.4" />
        <path d="M44 50.5c-2.6 4.4-1.6 7.6 1.6 9.4 2.4 1.3 4.9.3 5.6-1.9.6-1.9-.7-3.6-2.6-3.4" />
        <circle cx="16.2" cy="56" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="47.8" cy="56" r="0.9" fill="currentColor" stroke="none" />
        {/* 顶端刻度 */}
        <path d="M32 3.5v4.2M32 56.3v4.2M3.5 32h4.2M56.3 32h4.2" />
      </g>
    </svg>
  );
}

/** 证书 / 信笺上的大压印：只留最外圈与瞳，静态、无滤镜，导出安全 */
export function SealWatermark({ className = '', size = 320, opacity = 0.12, strokeWidth = 1 }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ opacity }}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="29.2" />
        <circle cx="32" cy="32" r="24.6" strokeDasharray="1 4" />
        <path d="M11 32c6.4-10.2 13.7-15.3 21-15.3S46.6 21.8 53 32c-6.4 10.2-13.7 15.3-21 15.3S17.4 42.2 11 32Z" />
        <ellipse cx="32" cy="32" rx="5.2" ry="10.4" />
        <circle cx="32" cy="32" r="1.7" fill="currentColor" stroke="none" />
        <path d="M32 2.8v5M32 56.2v5M2.8 32h5M56.2 32h5" />
      </g>
    </svg>
  );
}

const STAMP_TONES = {
  vermilion: 'text-vermilion',
  ink: 'text-ink',
  forest: 'text-forest',
  indigo: 'text-indigo',
  moon: 'text-moon',
};

export function StampSeal({ label = '已归档', sub = 'FILE CLOSED', className = '', tone = 'vermilion' }) {
  return (
    <span className={`stamp ${STAMP_TONES[tone] || STAMP_TONES.vermilion} ${className}`}>
      <span className="font-serif text-[13px] leading-none tracking-[0.16em]">{label}</span>
      {sub ? <span className="font-mono text-[7.5px] leading-none tracking-[0.2em] opacity-70">{sub}</span> : null}
    </span>
  );
}

export function CornerTick({ className = '' }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path d="M1 9V1h8M1 4h4M4 1v3" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ 封面雕刻 */
const MOTIFS = ['tentacle', 'eye', 'astrolabe', 'tide', 'arch', 'constellation'];

export function motifKindOf(seed) {
  return MOTIFS[hashString(seed) % MOTIFS.length];
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 0.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  vectorEffect: 'non-scaling-stroke',
};

/** 触手（主雕版）：一条从深处卷起的粗触手，带吸盘与气泡 */
function Tentacle() {
  return (
    <g {...stroke}>
      <path d="M4 118C18 96 40 92 52 74c9-14 4-29-10-33-12-3.5-22 4-22 14 0 8 7 13 14 11" strokeWidth="2.1" />
      <path d="M8 124c14-18 34-22 46-38 8-11 5-22-5-26" strokeWidth="1.4" />
      <path d="M52 74c8-3 16 0 20 7 3 6 1 13-5 16-5 2.4-10 .6-11-4" strokeWidth="1.5" />
      <circle cx="41" cy="69" r="2.4" /><circle cx="33" cy="78" r="3" /><circle cx="26" cy="88" r="3.4" />
      <circle cx="20" cy="99" r="3.8" /><circle cx="33" cy="59" r="1.9" /><circle cx="24" cy="52" r="1.3" />
      <circle cx="66" cy="79" r="1.6" /><circle cx="73" cy="87" r="1.2" /><circle cx="58" cy="92" r="1.4" />
      <path d="M86 30c5-2 10 1 10 6M92 50c4-1 7 1 8 4M70 116c4 0 7 2 8 5" strokeWidth="1.1" />
    </g>
  );
}

function EyeMotif() {
  return (
    <g {...stroke}>
      <circle cx="60" cy="60" r="46" />
      <circle cx="60" cy="60" r="38" strokeDasharray="2 5" />
      <path d="M14 60c13-19 28-29 46-29s33 10 46 29C93 79 78 89 60 89S27 79 14 60Z" strokeWidth="1.8" />
      <ellipse cx="60" cy="60" rx="10" ry="21" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="3.4" fill="currentColor" stroke="none" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={60 + Math.cos(a) * 48}
            y1={60 + Math.sin(a) * 48}
            x2={60 + Math.cos(a) * (i % 2 ? 53 : 56)}
            y2={60 + Math.sin(a) * (i % 2 ? 53 : 56)}
          />
        );
      })}
      <path d="M96 14l6 6M24 106l-6 6M104 96l-6 6M16 24l6-6" strokeWidth="1.4" />
    </g>
  );
}

function Astrolabe() {
  return (
    <g {...stroke}>
      <circle cx="62" cy="62" r="50" />
      <circle cx="62" cy="62" r="41" />
      <circle cx="62" cy="62" r="26" strokeDasharray="1 4" />
      <path d="M62 4v116M4 62h116" strokeWidth="1.2" />
      <path d="M26 26l72 72M98 26 26 98" strokeWidth="0.8" opacity="0.7" />
      <path d="M42 36l12 74M82 36 70 110" strokeWidth="0.7" opacity="0.5" />
      <circle cx="62" cy="62" r="7" />
      <circle cx="62" cy="62" r="2" fill="currentColor" stroke="none" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={62 + Math.cos(a) * 45}
            y1={62 + Math.sin(a) * 45}
            x2={62 + Math.cos(a) * 50}
            y2={62 + Math.sin(a) * 50}
          />
        );
      })}
    </g>
  );
}

function Tide() {
  return (
    <g {...stroke}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M0 ${36 + i * 14}c14-${i % 2 ? 8 : 11} 26-${i % 2 ? 8 : 11} 40 0s26 ${i % 2 ? 8 : 11} 40 0 26-${i % 2 ? 8 : 11} 40 0`}
          strokeWidth={0.9 + (i % 3) * 0.2}
          opacity={0.45 + i * 0.08}
        />
      ))}
      <circle cx="34" cy="70" r="2.2" /><circle cx="102" cy="58" r="1.6" /><circle cx="78" cy="98" r="1.2" />
      <path d="M14 20c8 4 12 10 14 18M110 112c-7-3-11-8-13-15" strokeWidth="1.3" />
    </g>
  );
}

function Arch() {
  return (
    <g {...stroke}>
      <path d="M34 116V58c0-18 12-30 28-30s28 12 28 30v58" strokeWidth="1.8" />
      <path d="M44 116V60c0-12 8-20 18-20s18 8 18 20v56" />
      <path d="M26 116h72M52 116v-28h20v28M62 40v12M62 62c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9Z" />
      <path d="M46 20l4 8M78 20l-4 8M18 100c6-4 8-9 8-15M106 100c-6-4-8-9-8-15" strokeWidth="1.3" />
      <circle cx="62" cy="71" r="2.4" fill="currentColor" stroke="none" />
    </g>
  );
}

function Constellation() {
  const pts = [[24, 26], [52, 44], [40, 76], [78, 34], [88, 62], [64, 92], [100, 102], [16, 100], [108, 20]];
  const edges = [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [2, 5], [5, 6], [2, 7], [3, 8], [6, 4]];
  return (
    <g {...stroke}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} strokeWidth="0.8" opacity="0.7" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.4} fill={i % 3 === 0 ? 'currentColor' : 'none'} />
      ))}
      <circle cx="62" cy="62" r="52" strokeDasharray="1 6" opacity="0.5" />
    </g>
  );
}

const MOTIF_NODES = {
  tentacle: <Tentacle />,
  eye: <EyeMotif />,
  astrolabe: <Astrolabe />,
  tide: <Tide />,
  arch: <Arch />,
  constellation: <Constellation />,
};

/**
 * 封面雕刻：由 seed 决定用哪一枚。viewBox 固定 124 见方，宽高自适应。
 */
export function CoverMotif({ seed = '', className = '', opacity = 0.5 }) {
  const kind = pick(seed, MOTIFS);
  return (
    <svg viewBox="0 0 124 124" className={className} style={{ opacity }} aria-hidden="true">
      {MOTIF_NODES[kind] || MOTIF_NODES.tentacle}
    </svg>
  );
}
