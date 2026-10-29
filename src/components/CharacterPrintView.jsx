/**
 * 角色卡打印预览页。
 * 屏幕上是 A4 纸张预览，点「打印 / 导出 PDF」调用浏览器原生打印，
 * 在打印对话框里选择「另存为 PDF」即可得到矢量 PDF（文字可选中、可搜索）。
 *
 * 两种数据来源：
 *   - characterId：登录用户，从服务端拉取（会做归属校验）；
 *   - character：访客草稿，直接由上层传入，不经过服务端。
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Edit, Info, Printer } from 'lucide-react';
import { computeSheet, validateSheet } from '../../shared/coc7e.js';
import { apiGet } from '../lib/api.js';
import { Button, EmptyState, Panel } from './ui.jsx';
import CharacterPrint from './characters/CharacterPrint.jsx';

export default function CharacterPrintView({
  characterId, character: preset, customOccupations = [], onBack, onEdit, showToast,
}) {
  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(!preset);
  const hostRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (preset) { setLoading(false); return undefined; }
    let alive = true;
    setLoading(true);
    apiGet(`/api/characters/${characterId}`)
      .then((data) => { if (alive) setFetched(data); })
      .catch((err) => { showToast(err.message, 'error'); onBack?.(); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [characterId, preset, showToast, onBack]);

  // 访客草稿没有 derived，就地补一份（与后端同一套算法）
  const character = useMemo(() => {
    if (preset) {
      const ctx = { customOccupations };
      return { ...preset, derived: preset.derived || computeSheet(preset, ctx), warnings: preset.warnings || validateSheet(preset, ctx) };
    }
    return fetched;
  }, [preset, fetched, customOccupations]);

  const pagesReady = !loading && Boolean(character);

  // 屏幕上把 210mm 的 A4 版面按可用宽度等比缩放（打印时仍还原 100%，不影响出片）
  useLayoutEffect(() => {
    if (!pagesReady) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;
    const PAPER_W = (210 / 25.4) * 96;
    const calc = () => {
      const avail = host.clientWidth;
      if (avail > 0) setZoom(Math.min(1, avail / PAPER_W));
    };
    calc();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null;
    if (ro) ro.observe(host);
    return () => { if (ro) ro.disconnect(); };
  }, [pagesReady]);


  if (loading && !character) return <Panel><EmptyState title="正在准备打印版面…" /></Panel>;
  if (!character) return null;

  return (
    <div className="space-y-4">
      {/*
        工具栏：跟随明暗主题（bg-paper/80 · border-line · text-ink），打印时由 .no-print 整体隐藏。
        纸面本身不跟随主题 —— 见 CharacterPrint 根节点的 .print-root（index.css 里恒按浅色令牌渲染）。
      */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border border-line bg-paper/80 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" className="!px-2.5 !py-1.5 !text-[14px]" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />返回
          </Button>
          <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
          <div className="min-w-0">
            <div className="truncate font-serif text-[19px] tracking-[0.02em] text-ink">{character.name} · 打印版面</div>
            <div className="mt-1 text-[14px] text-ink-mute">
              A4 双页 · 全部技能与基础值都会打印 · 在打印对话框中选择「另存为 PDF」即可导出
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && character.canEdit !== false ? (
            <Button variant="ghost" className="!px-2.5 !py-1.5 !text-[14px]" onClick={() => onEdit(character)}>
              <Edit className="h-4 w-4" />编辑
            </Button>
          ) : null}
          <Button className="!px-3.5 !py-1.5 !text-[14px]" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />打印 / 导出 PDF
          </Button>
        </div>
      </div>

      <div className="no-print flex items-start gap-2.5 border-l-2 border-ochre/45 bg-ochre/[0.05] px-3 py-2">
        <Info className="mt-[1px] h-4 w-4 shrink-0 text-ochre" />
        <p className="text-[14px] leading-relaxed text-ink-mute">
          打印设置里把「页边距」设为默认、「背景图形」保持关闭 —— 卡面本身不需要背景色即可清晰打印。
          审核状态与 KP 批复不会出现在打印件上。
        </p>
      </div>

      {/* 纸张区域：深一层的纸色台面把 A4 纸托起来；打印时台面不参与出片 */}
      <div
        ref={hostRef}
        className="flex flex-col items-center border border-line bg-paper-deep px-3 py-6 sm:px-6 print:border-0 print:bg-transparent print:p-0"
      >
        <div className="print-scale" style={zoom < 1 ? { zoom } : undefined}>
          <CharacterPrint character={character} />
        </div>
      </div>
    </div>
  );
}