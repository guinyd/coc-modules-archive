/**
 * 站级动效编排 —— 「下潜」。
 *
 * 这一层不负责页面长什么样，只负责：
 *   · 下潜深度尺（滚动联动，整站唯一的连续运动）；
 *   · 数字比在进入视口时数出来；
 *   · 磁吸按钮；
 *   · 头版阅读灯（跟随指针的局部照明，不是尾随光标）；
 *   · 路由切换时的一道墨线。
 *
 * 所有组件在 prefers-reduced-motion 下退化为静态；不新增第三方依赖。
 */
import React, { useCallback, useEffect, useRef } from 'react';

import { cx } from './ui.jsx';
import {
  useCountUp, useMagnetic, useReducedMotion, useScrollDepth,
} from '../lib/motion.js';

const DEPTH_METERS = 1200;
const RAIL_HEIGHT = 232;

/**
 * 左侧下潜深度尺：滚动到哪儿，就潜到哪儿。
 * 只在 ≥1440px 的桌面显示（此时内容两侧才有余量），不遮挡正文。
 */
export function DepthGauge() {
  const markerRef = useRef(null);
  const fillRef = useRef(null);
  const valueRef = useRef(null);
  const reduced = useReducedMotion();
  const lastValue = useRef(-1);

  const paint = useCallback((p) => {
    const marker = markerRef.current;
    const fill = fillRef.current;
    const label = valueRef.current;
    if (marker) marker.style.transform = `translate3d(0, ${(p * (RAIL_HEIGHT - 9)).toFixed(2)}px, 0)`;
    if (fill) fill.style.transform = `scaleY(${p.toFixed(4)})`;
    if (label) {
      const meters = Math.round(p * DEPTH_METERS);
      if (meters !== lastValue.current) {
        lastValue.current = meters;
        label.textContent = `${String(meters).padStart(4, '0')} M`;
      }
    }
  }, []);

  useScrollDepth(paint);

  return (
    <div className={cx('depth-gauge no-print', reduced && 'depth-gauge--static')} aria-hidden="true">
      <div className="depth-rail">
        <span className="depth-line" />
        <span className="depth-ticks" />
        <span className="depth-fill" ref={fillRef} />
        <span className="depth-marker" ref={markerRef}>
          <span className="depth-diamond" />
        </span>
      </div>
      <span className="depth-value" ref={valueRef}>0000 M</span>
    </div>
  );
}

/** 进入视口后把数字数出来；减少动态效果时直接显示终值。 */
export function CountUp({ value, pad = 2, className }) {
  const [ref, current] = useCountUp(value);
  return (
    <span ref={ref} className={cx('tabular', className)}>
      {String(current).padStart(pad, '0')}
    </span>
  );
}

/** 磁吸外壳：把指针的靠近翻译成几个像素的偏移，离开即回中。 */
export function Magnetic({ children, className, strength = 0.14, max = 4 }) {
  const ref = useMagnetic({ strength, max });
  return <span ref={ref} className={cx('magnetic inline-flex', className)}>{children}</span>;
}

/**
 * 头版阅读灯：指针在纸面上移动时，一小圈暖光跟着走。
 * 监听挂在父元素上，灯本身 pointer-events:none，不抢任何点击。
 */
export function ReadingLamp({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const host = el.parentElement;
    if (!host) return undefined;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return undefined;

    let raf = 0;
    let lastEvent = null;
    const apply = () => {
      raf = 0;
      if (!lastEvent) return;
      const rect = host.getBoundingClientRect();
      el.style.setProperty('--lx', `${(lastEvent.clientX - rect.left).toFixed(0)}px`);
      el.style.setProperty('--ly', `${(lastEvent.clientY - rect.top).toFixed(0)}px`);
      el.style.opacity = '1';
    };
    const onMove = (event) => {
      lastEvent = event;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => { el.style.opacity = '0'; };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className={cx('reading-lamp', className)} />;
}

/** 换页时从内容顶部扫过的一道墨线，提醒「翻到下一页了」。 */
export function RouteSweep() {
  return <span aria-hidden="true" className="route-sweep" />;
}
