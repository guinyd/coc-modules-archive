import { useId } from 'react';

/**
 * morphicons：同一枚图标在两种状态之间「变形」，而不是简单换图。
 * 全部 inline SVG + CSS 过渡；配色跟随 currentColor；不引入任何依赖。
 */

/**
 * 太阳 → 月亮（morphicons 的 weather/sun-moon 写法）：
 * 一个实心圆盘，靠 mask 里那枚「遮挡圆」滑进来切成弯月；光芒同时收拢。
 * 不是两张图交叉淡入，而是同一形状在变形。
 */
export function ThemeMorph({ dark = false, className = '' }) {
  const maskId = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 24 24"
      className={`morph-icon ${className}`}
      data-dark={dark ? 'true' : 'false'}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle className="morph-cut" cx="16.4" cy="6" r="5.2" fill="black" />
        </mask>
      </defs>
      <g className="morph-rays" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M19.4 4.6l-1.9 1.9M6.5 17.5l-1.9 1.9" />
      </g>
      <circle className="morph-core" cx="12" cy="12" r="5.6" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/** 三条横线 → 叉：用于移动端导航开关 */
export function MenuMorph({ open = false, className = '' }) {
  return (
    <span
      className={`morph-bars flex h-4 w-4 flex-col justify-between ${className}`}
      data-open={open ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span className="block h-[1.5px] w-full bg-current" />
      <span className="block h-[1.5px] w-full bg-current" />
      <span className="block h-[1.5px] w-full bg-current" />
    </span>
  );
}

/** 加号 ↔ 减号：用于展开/收起分区 */
export function PlusMorph({ open = false, className = '' }) {
  return (
    <svg viewBox="0 0 16 16" className={`morph-icon ${className}`} data-open={open ? 'true' : 'false'} aria-hidden="true">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8 3v10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        style={{
          transformOrigin: '8px 8px',
          transform: open ? 'rotate(90deg) scaleX(0.001)' : 'none',
          transition: 'transform 420ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </svg>
  );
}

/** 右箭头 → 下箭头：用于“展开更多 / 进入”一类链接 */
export function ArrowMorph({ open = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`morph-icon ${className}`}
      data-open={open ? 'true' : 'false'}
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 460ms cubic-bezier(0.22,1,0.36,1)' }}
    >
      <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}