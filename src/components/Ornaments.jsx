/**
 * 档案馆的铅版花饰：触手、潮汐线、瞳孔与套准角。
 * 全部 currentColor + inline SVG：静态、可打印、无外链。
 */
import React from 'react';

/** 横向触手分隔线：一条从纸边探出的触须，带吸盘 */
export function TentacleRule({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 720 34"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 20h118c12 0 20-4 27-10 6-5 13-7 20-5 8 2 12 9 10 16-2 7-9 10-15 8" opacity="0.9" />
        <path d="M0 25h126c9 0 16-2 22-7" opacity="0.5" />
        <circle cx="152" cy="15" r="3.1" />
        <circle cx="140" cy="22" r="2.3" />
        <circle cx="163" cy="25" r="1.9" />
        <path d="M188 20h120" strokeDasharray="1 5" opacity="0.55" />
        <path d="M330 17c22-6 42-6 60 2 14 7 28 7 42-1 13-7 26-7 38 0" opacity="0.8" />
        <path d="M330 23c22-6 42-6 60 2 14 7 28 7 42-1 13-7 26-7 38 0" opacity="0.4" />
        <path d="M500 20h118c12 0 20-4 27-10 6-5 13-7 20-5 8 2 12 9 10 16-2 7-9 10-15 8" opacity="0.9" />
        <circle cx="566" cy="19" r="2.4" />
        <circle cx="582" cy="23" r="1.7" />
        <circle cx="668" cy="15" r="2.8" />
      </g>
    </svg>
  );
}

/** 角落触手：从纸角卷进来，适合放在面板对角 */
export function TentacleCorner({ className = '', flipX = false, flipY = false }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2c0 34 8 58 26 76 14 14 33 22 52 18 15-3 24-16 21-30-2-11-12-18-22-15-9 3-14 13-10 21" />
        <path d="M2 14c0 28 7 48 22 63 12 12 28 19 44 16" opacity="0.55" />
        <path d="M2 26c0 22 6 38 18 50" opacity="0.3" />
        <circle cx="14" cy="40" r="2" />
        <circle cx="28" cy="78" r="2.6" />
        <circle cx="52" cy="94" r="3.2" />
        <circle cx="86" cy="52" r="2" />
        <circle cx="97" cy="85" r="2.4" />
        <path d="M108 66c6-6 10-13 11-22M88 44c4-7 5-14 4-21" opacity="0.5" strokeWidth="0.9" />
      </g>
    </svg>
  );
}

/** 瞳孔：单选/状态点、眉标前缀 */
export function EyeGlyph({ className = '', size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-hidden="true">
      <path
        d="M2.5 12C5.6 7.4 8.7 5.6 12 5.6s6.4 1.8 9.5 6.4c-3.1 4.6-6.2 6.4-9.5 6.4S5.6 16.6 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <ellipse cx="12" cy="12" rx="2.4" ry="4.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/** 潮汐涟漪：背景装饰，静态 */
export function RippleField({ className = '' }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.8">
        {[46, 78, 112, 148, 186, 226].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} opacity={0.6 - i * 0.08} strokeDasharray={i % 2 ? '2 6' : undefined} />
        ))}
        <path d="M200 2v28M200 370v28M2 200h28M370 200h28" opacity="0.5" />
        <path d="M60 60l18 18M340 60l-18 18M60 340l18-18M340 340l-18-18" opacity="0.35" />
      </g>
    </svg>
  );
}

/** 编号刻度：像档案盒侧面的标尺 */
export function IndexTicks({ className = '', count = 12 }) {
  return (
    <svg viewBox="0 0 120 8" width="120" height="8" className={className} fill="none" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1={(i / (count - 1)) * 120}
          y1="0"
          x2={(i / (count - 1)) * 120}
          y2={i % 3 === 0 ? 8 : 4}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/**
 * 全站触手背景：三条巨大的触须从纸边探入，慢慢呼吸。
 * fixed 在内容之下（.archive-ambient 层），不拦截任何鼠标事件。
 */
export function TentacleBackdrop() {
  const arm = (id) => (
    <>
      <use href={`#${id}`} strokeWidth="44" opacity="0.12" />
      <use href={`#${id}`} strokeWidth="24" opacity="0.2" />
      <use href={`#${id}`} strokeWidth="1.7" opacity="0.9" />
    </>
  );

  const suckers = (list) => (
    <g opacity="0.95">
      {list.map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} strokeWidth="1.8" />
          <circle cx={cx} cy={cy} r={Math.max(1.6, r * 0.26)} fill="currentColor" stroke="none" />
        </g>
      ))}
    </g>
  );

  return (
    <div className="tentacle-field" aria-hidden="true">
      <div className="tentacle-veil" />
      <svg
        viewBox="0 0 1440 900"
        className="absolute inset-0 h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <path id="tentacle-a" d="M-40 96c96 34 158 12 214-34 42-35 92-46 138-22 38 20 50 64 28 92-20 25-58 28-80 9-19-16-18-43 2-57" />
          <path id="tentacle-b" d="M1480 210c-84 8-140 42-168 96-22 43-52 66-92 68-34 2-58-22-56-50 2-23 22-38 42-31 18 6 25 26 15 40" />
          <path id="tentacle-c" d="M120 940c14-92 52-150 112-178 46-22 78-52 88-92 8-32-10-58-38-60-25-2-44 18-42 40 2 19 20 31 38 25" />
          <path id="tentacle-d" d="M1520 880c-116-34-186-96-212-186-20-70-70-112-140-118-52-4-84 30-78 68 6 32 42 50 72 39 26-9 38-36 28-58" />
        </defs>

        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* 左上：横穿报头的粗触须 */}
          <g className="tentacle-arm tentacle-arm--slow">
            {arm('tentacle-a')}
            <path d="M-40 112c88 30 146 9 198-33 38-31 82-40 122-18" opacity="0.55" />
            <path d="M-40 128c74 24 128 7 176-29" opacity="0.28" />
            {suckers([[228, 52, 8], [252, 66, 6], [272, 84, 4.5], [196, 26, 5], [330, 112, 4]])}
            <path d="M356 128c18-16 27-36 28-58M300 140c10-10 16-22 18-36" opacity="0.5" strokeWidth="0.95" />
          </g>

          {/* 右侧：从馆藏索引后面探出的一束 */}
          <g className="tentacle-arm tentacle-arm--fast">
            {arm('tentacle-b')}
            <path d="M1480 226c-76 10-126 39-153 88-19 36-45 56-78 59" opacity="0.55" />
            <path d="M1480 242c-66 12-110 37-134 80" opacity="0.3" />
            {suckers([[1312, 296, 8], [1288, 312, 6], [1268, 332, 4.5], [1352, 268, 5.5], [1224, 352, 4]])}
            <path d="M1224 352c-4-22 2-42 16-58M1266 366c-2-14 2-27 10-38" opacity="0.45" strokeWidth="0.9" />
          </g>

          {/* 左下：从纸页下爬上来的细触须 */}
          <g className="tentacle-arm">
            {arm('tentacle-c')}
            <path d="M138 940c14-82 48-133 103-159 40-19 68-46 77-82" opacity="0.55" />
            <path d="M158 940c12-72 44-117 92-141" opacity="0.3" />
            {suckers([[270, 702, 8], [292, 682, 6], [312, 658, 4.5], [236, 744, 5]])}
            <path d="M330 610c6-20 4-38-6-55M296 632c4-13 3-25-2-36" opacity="0.45" strokeWidth="0.9" />
          </g>

          {/* 右下：从卡片底下卷上来的一条 */}
          <g className="tentacle-arm tentacle-arm--fast">
            {arm('tentacle-d')}
            <path d="M1520 900c-130-40-206-108-232-204-18-66-62-104-126-110" opacity="0.55" />
            <path d="M1520 916c-116-34-186-96-212-186" opacity="0.26" />
            {suckers([[1438, 846, 7.5], [1376, 804, 6.2], [1330, 752, 5.4], [1319, 730, 5], [1300, 682, 6.2], [1286, 646, 6.4], [1244, 602, 5], [1212, 586, 4.4], [1104, 596, 4], [1094, 638, 3.6]])}
            <path d="M1232 624c8-14 10-30 6-46M1160 600c6-10 8-20 6-31" opacity="0.45" strokeWidth="0.9" />
          </g>
        </g>
      </svg>
    </div>
  );
}

