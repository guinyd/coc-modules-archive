/**
 * 动效基础设施 —— 只为「下潜」这一件事服务。
 *
 * 原则（motion-web）：
 *  1. 只用 transform / opacity / clip-path，绝不动画 width/height/top/left；
 *  2. 所有动效都能被 prefers-reduced-motion 一键关闭，内容仍然完整可见；
 *  3. 不在渲染里跑循环：rAF 只在指针/滚动/计数真正需要时启动，静止即停。
 *
 * 这里放的是「可复用的机械」：入场观察、计数、磁吸、滚动深度。
 * 具体的编排（哪个元素在什么时候动）留给页面自己决定。
 */
import { useEffect, useRef, useState } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const FINE_POINTER_QUERY = '(pointer: fine)';

function matches(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

/** 系统是否要求减少动态效果（会跟随系统设置实时变化）。 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matches(REDUCED_QUERY));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(REDUCED_QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * 进入视口一次就置真。
 * rootMargin 默认提前 8%，让元素在真正露头前一点点开始，滚动时不会「等它到了才动」。
 */
export function useInViewOnce({ threshold = 0.12, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      });
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}

/**
 * 数字计数：进入视口后从 0 走到目标值（ease-out-quart）。
 * 减少动态效果时直接给终值，不播中间帧。
 */
export function useCountUp(target, { duration = 920 } = {}) {
  const [ref, inView] = useInViewOnce({ threshold: 0.4 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const end = Number(target) || 0;

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced || duration <= 0) return undefined;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 4;
      setValue(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration, reduced]);

  return [ref, reduced ? end : value];
}

/**
 * 磁吸：指针在元素附近时，元素向指针方向偏移几个像素，离开后弹回中心。
 * 只对精细指针生效；减少动态效果时完全不挂监听。
 */
export function useMagnetic({ strength = 0.14, max = 4 } = {}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !matches(FINE_POINTER_QUERY)) return undefined;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const settle = () => {
      raf = 0;
      el.style.transform = '';
      el.style.setProperty('--mag-x', '0px');
      el.style.setProperty('--mag-y', '0px');
    };

    const loop = () => {
      raf = 0;
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
        if (tx === 0 && ty === 0) { settle(); return; }
        cx = tx; cy = ty;
      }
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      tx = Math.max(-max, Math.min(max, (event.clientX - rect.left - rect.width / 2) * strength));
      ty = Math.max(-max, Math.min(max, (event.clientY - rect.top - rect.height / 2) * strength));
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointercancel', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [reduced, strength, max]);

  return ref;
}

/**
 * 滚动深度：返回一个 0–1 的进度，用 rAF 平滑追踪，静止后自停。
 * 直接写 CSS 变量与文本，不触发 React 渲染，避免整页跟着滚动重绘。
 */
export function useScrollDepth(onProgress) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let raf = 0;
    let target = 0;
    let current = 0;

    const read = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      target = Math.min(1, Math.max(0, window.scrollY / max));
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      raf = 0;
      const ease = reduced ? 1 : 0.16;
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.0004) current = target;
      onProgress(current);
      if (current !== target) raf = requestAnimationFrame(loop);
    };

    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onProgress, reduced]);
}
