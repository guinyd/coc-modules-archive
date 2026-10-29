/**
 * 长图预览与导出（调查员结业档案 / KP 执导履历 / 全模组盘点）。
 *
 * 安全说明：html-to-image 作为正式依赖打包进产物，无运行时外链、可离线。
 *
 * 版面说明（v3 美术重塑 · 铅印文书）：
 *   #export-canvas 里的内容会被 html-to-image 序列化成 SVG foreignObject 导出，
 *   因此画布内只用静态 CSS（实色 / linear-gradient / 边框 / 阴影 / 内联 SVG），
 *   不用 mask、动画、@property、filter、外链字体或外部图片。
 *   装饰全部由「双线外框 + 朱砂反白标题条 + 账表 + 印章」构成：
 *     · 印章是 Emblem.jsx 的 SealMark（罗盘 + 瞳孔），不再画盾牌与双环蜡封；
 *     · SealWatermark 只做极淡压印（opacity ≤ 0.06），无动画；
 *     · 画布本身保持 800px 设计宽，窄屏只在画布外层的 wrapper 上缩放。
 */

import React, { useEffect, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Button } from './ui.jsx';
import { SealMark, SealWatermark } from './Emblem.jsx';

const EXPORT_WIDTH = 800;

/* 月下文书色板（画布内只能用内联样式，全部静态） */
const INK = {
  paper: '#ece3d1',
  paperRaised: '#f8f1e1',
  paperDeep: '#dfd4bf',
  ink: '#171109',
  body: '#3d3325',
  soft: '#746653',
  vermilion: '#a52a1d',
  indigo: '#163f45',
  ochre: '#a8792b',
  cyan: '#1a5b5f',
  moon: '#2f7d7a',
  rule: 'rgba(23, 17, 9, 0.55)',
  ruleSoft: 'rgba(23, 17, 9, 0.2)',
  ruleFaint: 'rgba(23, 17, 9, 0.09)',
};

const today = () => new Date().toLocaleDateString('zh-CN');

/** 画布外框：双线 + 四角朱砂方点（纯静态） */
function PaperFrame() {
  const corner = { position: 'absolute', width: 6, height: 6, backgroundColor: INK.vermilion };
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute" style={{ inset: 10, border: `2px solid ${INK.ink}` }} />
      <div aria-hidden="true" className="pointer-events-none absolute" style={{ inset: 15, border: `1px solid ${INK.rule}` }} />
      <span aria-hidden="true" className="pointer-events-none" style={{ ...corner, left: 7, top: 7 }} />
      <span aria-hidden="true" className="pointer-events-none" style={{ ...corner, right: 7, top: 7 }} />
      <span aria-hidden="true" className="pointer-events-none" style={{ ...corner, left: 7, bottom: 7 }} />
      <span aria-hidden="true" className="pointer-events-none" style={{ ...corner, right: 7, bottom: 7 }} />
    </>
  );
}

/** 报头：馆名 + 卷宗编号，下面一道粗墨线 */
function Masthead({ docNo }) {
  return (
    <div className="flex items-end justify-between" style={{ borderBottom: `2px solid ${INK.ink}`, paddingBottom: 8 }}>
      <div className="flex items-center gap-2">
        <SealMark size={18} strokeWidth={3.4} className="shrink-0 text-red-500" />
        <span className="font-serif" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4em', color: INK.ink }}>
          秘密调查档案馆
        </span>
      </div>
      <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: INK.soft }}>
        {docNo} · MCMXX
      </span>
    </div>
  );
}

/** 顶部深空标题条：墨绿底、纸色字、左侧一道朱砂书脊 */
function TitleBar({ title, mark }) {
  return (
    <div
      className="relative flex items-center justify-between"
      style={{ backgroundColor: '#142d2c', color: INK.paper, padding: '11px 18px 13px 22px', marginTop: 16, overflow: 'hidden' }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: INK.vermilion }} />
      <span aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, width: 190, height: '100%', backgroundImage: 'linear-gradient(90deg, rgba(168,121,43,0), rgba(168,121,43,0.34))' }} />
      {/* 极细朱砂内线：压在标题条底沿，收住整块深色，不新增图片资源 */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 22,
          right: 18,
          bottom: 5,
          height: 1,
          backgroundImage: 'linear-gradient(90deg, rgba(196,74,52,0.85) 0%, rgba(196,74,52,0.5) 46%, rgba(196,74,52,0) 100%)',
        }}
      />
      <span className="relative flex flex-col" style={{ gap: 3 }}>
        <span className="font-mono" style={{ fontSize: 8.5, letterSpacing: '0.34em', opacity: 0.6 }}>
          THE DROWNED ARCHIVE · CERTIFICATE
        </span>
        <span className="font-serif" style={{ fontSize: 25, fontWeight: 700, letterSpacing: '0.26em', lineHeight: 1.2 }}>
          {title}
        </span>
      </span>
      <span className="font-mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', opacity: 0.72, position: 'relative' }}>{mark}</span>
    </div>
  );
}

/** 报头下的三格账目条：编号 / 日期 / 类别 */
function MetaRow({ items }) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, borderBottom: `1px solid ${INK.ruleSoft}` }}
    >
      {items.map(([label, value], i) => (
        <div
          key={label}
          style={{
            padding: '10px 12px 11px',
            borderLeft: i === 0 ? 'none' : `1px solid ${INK.ruleFaint}`,
          }}
        >
          <p className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: INK.soft }}>{label}</p>
          <p className="tabular" style={{ fontSize: 13, color: INK.ink, marginTop: 4, letterSpacing: '0.04em' }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

/** 分节小标题：编号 + 中文 + 英文注记 */
function SectionLabel({ index, title, en, style }) {
  return (
    <div className="flex items-baseline gap-2" style={{ marginTop: 20, marginBottom: 8, ...style }}>
      <span className="font-mono" style={{ fontSize: 10.5, fontWeight: 700, color: INK.ochre, letterSpacing: '0.08em' }}>{index}</span>
      <span className="font-serif" style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '0.18em', color: INK.ink }}>{title}</span>
      <span className="flex-1" style={{ borderBottom: `1px dotted ${INK.ruleSoft}`, transform: 'translateY(-3px)' }} />
      <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: INK.soft }}>{en}</span>
    </div>
  );
}

/** 表头单元 */
function Th({ children, className = '', style }) {
  return (
    <th
      className={`font-mono ${className}`}
      style={{
        padding: '8px 10px',
        fontSize: 11,
        letterSpacing: '0.17em',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: INK.ink,
        backgroundColor: 'rgba(23,17,9,0.045)',
        borderBottom: `1.5px solid ${INK.ink}`,
        textAlign: 'left',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

/** 数据单元：账表式点线分隔 */
function Td({ children, className = '', style }) {
  return (
    <td
      className={className}
      style={{
        padding: '7px 10px',
        fontSize: 13,
        color: INK.body,
        borderBottom: `1px dotted ${INK.ruleSoft}`,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {children}
    </td>
  );
}

/** 朱砂大印：Emblem 的罗盘印章，不再是盾牌 / 双环蜡封 */
function ArchiveSeal({ size = 92, label = '档案馆印' }) {
  return (
    <div
      className="flex shrink-0 flex-col items-center"
      style={{ color: INK.vermilion, transform: 'rotate(-7deg)', opacity: 0.94 }}
    >
      <SealMark size={size} strokeWidth={2.1} />
      <span className="font-serif" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.26em', marginTop: 3 }}>
        {label}
      </span>
    </div>
  );
}

/** 落款：左档案馆、中大印、右守秘人楷体签名 */
function Footer({ kpName, signerLabel = '守秘人署名' }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ borderTop: `2px solid ${INK.ink}`, boxShadow: `0 3px 0 -2px ${INK.ink}`, height: 0 }} />
      <div className="flex items-end justify-between gap-4" style={{ paddingTop: 15 }}>
        <div style={{ maxWidth: 300 }}>
          <p className="font-serif" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', color: INK.ink }}>
            秘密调查档案馆 · 最高监督委员会
          </p>
          <p className="font-mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: INK.soft, marginTop: 7, lineHeight: 1.65 }}>
            ATTESTED BY THE ARCHIVE COMMITTEE
            <br />
            INTERNAL CIRCULATION ONLY · NOT FOR PUBLIC RELEASE
          </p>
        </div>
        <div className="flex items-end gap-5">
          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <p className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: INK.soft }}>{signerLabel} / KEEPER</p>
            <p className="font-kai" style={{ fontSize: 14, lineHeight: 1.35, color: INK.ink, marginTop: 7, letterSpacing: '0.1em' }}>
              {kpName || '—'}
            </p>
            <span
              aria-hidden="true"
              style={{ display: 'block', width: 186, height: 1, marginLeft: 'auto', marginTop: 4, backgroundColor: INK.rule }}
            />
            <p className="font-mono tabular" style={{ fontSize: 9, letterSpacing: '0.16em', color: INK.soft, marginTop: 6 }}>
              {today()}
            </p>
          </div>
          <ArchiveSeal size={80} />
        </div>
      </div>
    </div>
  );
}

/** 页脚微注记 */
function FooterNote() {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{ marginTop: 18, paddingTop: 8, borderTop: `1px solid ${INK.ruleSoft}` }}
    >
      <p className="font-kai" style={{ fontSize: 10.5, letterSpacing: '0.24em', color: INK.soft }}>秘密调查档案馆 · 一九二〇年代</p>
      <p className="font-mono" style={{ fontSize: 8.5, letterSpacing: '0.22em', color: INK.soft }}>OFFICIAL DEPOSIT · MCMXX</p>
    </div>
  );
}

/** 盘点小计：把账表收成一行「合计」 */
function auditTotals(data) {
  const rows = data?.filteredOverviewModules || [];
  const stats = data?.moduleStats || {};
  return rows.reduce((acc, m) => {
    const s = stats[m.id] || { count: 0, totalDuration: 0 };
    acc.count += s.count || 0;
    acc.hours += Number(s.totalDuration) || 0;
    return acc;
  }, { rows: rows.length, count: 0, hours: 0 });
}

export default function CertificatePreview({
  previewMode, previewData, currentUser, kpName, playedModules, modules,
  onClose, showToast, toast,
}) {
  const [exporting, setExporting] = useState(false);
  const [imgError, setImgError] = useState('');
  const canvasRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  /* 窄屏：整张文书按可用宽度等比缩小（导出仍然是 800px 原始尺寸） */
  useEffect(() => {
    const calc = () => {
      const avail = Math.max(280, Math.min(window.innerWidth - 28, 1200));
      const scale = Math.min(1, avail / EXPORT_WIDTH);
      setFit({ scale, height: (canvasRef.current?.offsetHeight || 0) * scale });
    };
    calc();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null;
    if (ro && canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', calc);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, []);

  const filename = previewMode === 'player'
    ? '调查员结业档案.jpg'
    : previewMode === 'kp-all' ? '全模组带团盘点表.jpg' : '守秘人履历记录.jpg';

  const exportAsImage = async () => {
    try {
      setExporting(true);
      setImgError('');
      showToast('正在渲染长图，请稍候…');
      const element = document.getElementById('export-canvas');
      if (!element) throw new Error('找不到目标元素');

      const parent = element.parentElement;
      const originalOverflow = parent.style.overflowX;
      parent.style.overflowX = 'visible';

      // 等字体与布局稳定，避免文字被截断
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 120));

      const canvasHeight = element.offsetHeight;
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: INK.paper,
        pixelRatio: 2,
        width: EXPORT_WIDTH,
        height: canvasHeight,
        style: { width: `${EXPORT_WIDTH}px`, height: `${canvasHeight}px`, margin: '0', transform: 'none' },
      });

      parent.style.overflowX = originalOverflow;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      showToast('高清长图已保存！');
    } catch (err) {
      setImgError(err.message);
      showToast(`生成长图失败：${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  /* 头衔：月光渐变等级字（导出画布内为静态 background-clip:text，不含动画） */
  const titleColor = (title, role) => {
    if (role === 'admin') return { gradient: 'linear-gradient(100deg, #142d2c 0%, #a52a1d 55%, #c9963f 100%)', letterSpacing: '0.22em' };
    switch (title) {
      case '资深调查员': return { gradient: 'linear-gradient(100deg, #163f45 0%, #2f7d7a 100%)', letterSpacing: '0.14em' };
      case '精英调查员': return { gradient: 'linear-gradient(100deg, #4c2438 0%, #8a4a5f 100%)', letterSpacing: '0.16em' };
      case '传奇调查员': return { gradient: 'linear-gradient(100deg, #7c2418 0%, #a8792b 100%)', letterSpacing: '0.16em' };
      case '神话调查员': return { gradient: 'linear-gradient(100deg, #0d3b3a 0%, #2f7d7a 55%, #a8792b 100%)', letterSpacing: '0.2em' };
      default: return { color: INK.body, letterSpacing: '0.14em' };
    }
  };

  const played = modules.filter((m) => playedModules.includes(m.id));
  const audit = previewMode === 'kp-all' && previewData ? auditTotals(previewData) : null;
  const docNo = `NO. A-${String(Date.now()).slice(-6)}`;
  const tone = titleColor(currentUser?.title || '见习调查员', currentUser?.role);

  return (
    <div className="min-h-screen w-full bg-paper pb-24">
      {toast && (
        <div className={`fixed left-1/2 top-5 z-[100] flex -translate-x-1/2 items-center border-2 px-4 py-2 text-[12.5px] shadow-[3px_3px_0_0_rgba(4,16,30,0.24)] ${
          toast.type === 'error'
            ? 'border-red-500 bg-paper-raised text-red-500'
            : 'border-emerald-600 bg-paper-raised text-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <header className="fixed left-0 top-0 z-[60] w-full border-b-2 border-ink bg-paper-raised">
        <div className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <SealMark size={21} strokeWidth={2.4} className="shrink-0 text-red-500" />
            <span className="font-serif text-[16px] font-bold tracking-[0.16em] text-ink">文书预览</span>
            <span className="hidden h-3.5 w-px bg-line-strong sm:block" />
            <span className="hidden truncate font-mono text-[10px] tracking-[0.2em] text-ink-mute sm:inline">
              {filename.replace('.jpg', '')} · 800PX
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="!px-3 !py-1.5 !text-[13px]" onClick={onClose} disabled={exporting}>
              <X className="h-4 w-4" />返回
            </Button>
            <Button className="!px-3.5 !py-1.5 !text-[13px]" onClick={exportAsImage} disabled={exporting}>
              <Download className="h-4 w-4" />{exporting ? '渲染中…' : '导出长图'}
            </Button>
          </div>
        </div>
      </header>

      {imgError ? (
        <p className="mx-auto mt-24 max-w-[460px] border-l-2 border-red-500 bg-red-50 px-3 py-2 font-mono text-[11px] text-red-500">
          导出失败：{imgError}
        </p>
      ) : null}

      <div className="flex w-full justify-center px-3 pb-10 pt-[86px]">
        <div style={{ width: EXPORT_WIDTH * fit.scale, height: fit.height || undefined }} className="overflow-hidden">
          <div
            style={{
              width: EXPORT_WIDTH,
              transform: fit.scale === 1 ? 'none' : `scale(${fit.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              id="export-canvas"
              ref={canvasRef}
              className="relative overflow-hidden"
              style={{
                width: EXPORT_WIDTH,
                minWidth: EXPORT_WIDTH,
                maxWidth: EXPORT_WIDTH,
                boxSizing: 'border-box',
                backgroundColor: INK.paper,
                backgroundImage: `linear-gradient(180deg, #f8f1e1 0%, ${INK.paper} 34%, ${INK.paperDeep} 100%)`,
                boxShadow: '0 22px 60px -30px rgba(8,19,17,0.62), 0 0 0 1px rgba(23,17,9,0.18)',
                color: INK.ink,
                padding: '32px 38px 26px',
              }}
            >
              <PaperFrame />

              {/* 极淡的压印（静态 SVG，无动画） */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute"
                style={{ left: '50%', top: 196, transform: 'translateX(-50%)', color: INK.moon, opacity: 0.05 }}
              >
                <SealWatermark size={566} opacity={1} strokeWidth={1} />
              </div>

              <div className="relative" style={{ zIndex: 1 }}>
                {/* 版面 1：玩家结业档案 */}
                {previewMode === 'player' && (
                  <>
                    <Masthead docNo={docNo} />
                    <TitleBar title="调查员生涯鉴定档案" mark="FORM C-01" />
                    <MetaRow
                      items={[
                        ['卷宗编号 / FILE NO.', docNo],
                        ['签发日期 / ISSUED', today()],
                        ['归档类别 / CLASS', currentUser?.role === 'admin' ? '守秘人·首席' : '调查员'],
                      ]}
                    />

                    <div className="flex items-end justify-between" style={{ marginTop: 20 }}>
                      <div>
                        <p className="font-mono" style={{ fontSize: 9, letterSpacing: '0.24em', color: INK.soft }}>调查生涯记录</p>
                        <p className="font-serif" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.06em', color: INK.ink, marginTop: 5 }}>
                          {currentUser?.username || '见习调查员'}
                        </p>
                        <span className="block" style={{ width: 200, height: 1, background: INK.rule, marginTop: 7 }} />
                      </div>
                      <div
                        style={{
                          width: 112,
                          border: `1px solid ${INK.rule}`,
                          backgroundColor: 'rgba(248,241,225,0.72)',
                          padding: '8px 4px 7px',
                          textAlign: 'center',
                        }}
                      >
                        <p className="font-mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: INK.soft }}>已调查事件</p>
                        <p className="tabular font-serif" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: INK.ink, marginTop: 3 }}>
                          {played.length}
                        </p>
                        <p className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: INK.soft, marginTop: 4 }}>EVENTS ON FILE</p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 18,
                        borderTop: `1px solid ${INK.rule}`,
                        borderBottom: `1px solid ${INK.rule}`,
                        padding: '16px 0 18px',
                        textAlign: 'center',
                      }}
                    >
                      <p className="font-kai" style={{ fontSize: 12, letterSpacing: '0.26em', color: INK.body }}>
                        经档案馆最高监督委员会最终裁定，正式认定
                      </p>
                      <p
                        className="font-serif"
                        style={{
                          fontSize: 34,
                          fontWeight: 700,
                          display: 'inline-block',
                          marginTop: 10,
                          letterSpacing: tone.letterSpacing,
                          lineHeight: 1.2,
                          ...(tone.gradient
                            ? {
                              backgroundImage: tone.gradient,
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                            }
                            : { color: tone.color }),
                        }}
                      >
                        {currentUser?.role === 'admin' ? '首席守秘人' : (currentUser?.title || '见习调查员')}
                      </p>
                    </div>

                    <SectionLabel index="01" title="生涯事迹明细" en="CHRONICLE OF CASES" />
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <Th style={{ width: '48%' }}>事件档案</Th>
                          <Th style={{ width: '27%' }}>时代区域</Th>
                          <Th style={{ width: '25%', textAlign: 'center' }}>参与规模</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {played.map((m, i) => (
                          <tr key={m.id}>
                            <Td className="font-serif" style={{ fontSize: 13, color: INK.ink, wordBreak: 'break-word' }}>
                              <span className="font-mono tabular" style={{ fontSize: 10, color: INK.ochre, marginRight: 8 }}>
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              {m.title}
                            </Td>
                            <Td>{m.region} · {m.era}</Td>
                            <Td className="tabular font-mono" style={{ textAlign: 'center' }}>{m.players} 人</Td>
                          </tr>
                        ))}
                        {played.length === 0 && (
                          <tr>
                            <Td className="font-kai" style={{ textAlign: 'center', color: INK.soft, padding: '20px 0' }} colSpan={3}>
                              尚未归档任何调查事件
                            </Td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <Footer kpName={kpName} />
                  </>
                )}

                {/* 版面 2：KP 带团履历 */}
                {previewMode === 'kp-history' && previewData && (
                  <>
                    <Masthead docNo={docNo} />
                    <TitleBar title="守秘人执导履历" mark="FORM K-02" />
                    <MetaRow
                      items={[
                        ['守秘人 / KEEPER', currentUser?.username || '首席 KP'],
                        ['签发日期 / ISSUED', today()],
                        ['卷宗类别 / CLASS', '执导履历'],
                      ]}
                    />

                    <div
                      className="grid"
                      style={{ gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `1px solid ${INK.ruleSoft}`, marginTop: 4 }}
                    >
                      {[
                        ['执导总场次', `${previewData.sessions?.length || 0} 场`, 'SESSIONS OF RECORD', true],
                        ['累计带团时长', `${(previewData.totalHours || 0).toFixed(1)} H`, 'HOURS ON RECORD', false],
                        ['归档模组数', `${(previewData.modules || []).length} 部`, 'MODULES ON FILE', false],
                      ].map(([label, value, en, big], idx) => (
                        <div
                          key={label}
                          style={{ padding: '14px 12px 13px', borderLeft: idx === 0 ? 'none' : `1px solid ${INK.ruleFaint}` }}
                        >
                          <p className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: INK.soft }}>{label}</p>
                          <p
                            className="tabular font-serif"
                            style={{ fontSize: big ? 30 : 26, fontWeight: 700, lineHeight: 1, color: INK.ink, marginTop: 7 }}
                          >
                            {value}
                          </p>
                          <p className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: INK.soft, marginTop: 5 }}>{en}</p>
                        </div>
                      ))}
                    </div>

                    <SectionLabel index="01" title="近期执导明细" en="SESSIONS OF RECORD" />
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <Th style={{ width: '22%' }}>运行日期</Th>
                          <Th style={{ width: '33%' }}>模组名</Th>
                          <Th style={{ width: '14%' }}>用时</Th>
                          <Th style={{ width: '31%' }}>调查员名单</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...(previewData.sessions || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map((s) => {
                          const m = (previewData.modules || []).find((x) => x.id === s.moduleId);
                          return (
                            <tr key={s.id}>
                              <Td className="font-mono tabular" style={{ fontSize: 12, color: INK.soft, letterSpacing: '0.02em' }}>{s.date}</Td>
                              <Td className="font-serif" style={{ color: INK.ink, wordBreak: 'break-word' }}>{m?.title || '未知'}</Td>
                              <Td className="tabular font-mono" style={{ color: INK.ochre, fontWeight: 700 }}>{s.duration} H</Td>
                              <Td style={{ wordBreak: 'break-word' }}>
                                {s.investigators} <span style={{ fontSize: 12, color: INK.soft }}>({s.playerCount} 人)</span>
                              </Td>
                            </tr>
                          );
                        })}
                        {(previewData.sessions || []).length === 0 && (
                          <tr>
                            <Td className="font-kai" style={{ textAlign: 'center', color: INK.soft, padding: '20px 0' }} colSpan={4}>
                              暂无执导记录
                            </Td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <Footer kpName={currentUser?.username || kpName} />
                  </>
                )}

                {/* 版面 3：全模组盘点 */}
                {previewMode === 'kp-all' && previewData && (
                  <>
                    <Masthead docNo={docNo} />
                    <TitleBar title="全模组带团状态盘点" mark="FORM K-03" />
                    <MetaRow
                      items={[
                        ['筛选条件 / FILTER', previewData.overviewFilter === 'all' ? '全部模组' : previewData.overviewFilter === 'unplayed' ? '从未带过' : '已带过'],
                        ['统计日期 / AS OF', today()],
                        ['收录条数 / ENTRIES', `${(previewData.filteredOverviewModules || []).length} 条`],
                      ]}
                    />

                    <SectionLabel index="01" title="模组带团账目" en="MODULE AUDIT LEDGER" style={{ marginTop: 18 }} />
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <Th style={{ width: '32%' }}>模组名称</Th>
                          <Th style={{ width: '19%' }}>地区 / 时代</Th>
                          <Th style={{ width: '17%', textAlign: 'center' }}>带团次数</Th>
                          <Th style={{ width: '16%', textAlign: 'center' }}>平均用时</Th>
                          <Th style={{ width: '16%', textAlign: 'center' }}>累计用时</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {(previewData.filteredOverviewModules || []).map((m) => {
                          const stats = previewData.moduleStats?.[m.id] || { count: 0, totalDuration: 0 };
                          const isUnplayed = stats.count === 0;
                          return (
                            <tr key={m.id}>
                              <Td className="font-serif" style={{ color: INK.ink, wordBreak: 'break-word' }}>{m.title}</Td>
                              <Td>{m.region} · {m.era}</Td>
                              <Td className="tabular font-mono" style={{ textAlign: 'center', color: isUnplayed ? INK.vermilion : INK.ochre, fontWeight: 700 }}>
                                {isUnplayed ? '从未带过' : `${stats.count} 次`}
                              </Td>
                              <Td className="tabular font-mono" style={{ textAlign: 'center' }}>{isUnplayed ? '—' : `${(stats.totalDuration / stats.count).toFixed(1)} H`}</Td>
                              <Td className="tabular font-mono" style={{ textAlign: 'center', color: INK.soft }}>{isUnplayed ? '—' : `${stats.totalDuration} H`}</Td>
                            </tr>
                          );
                        })}
                        {(previewData.filteredOverviewModules || []).length === 0 && (
                          <tr>
                            <Td className="font-kai" style={{ textAlign: 'center', color: INK.soft, padding: '20px 0' }} colSpan={5}>
                              此分类下没有模组数据
                            </Td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            className="font-mono"
                            style={{
                              padding: '9px 10px',
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              color: INK.soft,
                              borderTop: `2px solid ${INK.ink}`,
                            }}
                          >
                            合计 / TOTAL
                          </td>
                          <td className="tabular font-mono" style={{ padding: '9px 10px', fontSize: 13, color: INK.body, borderTop: `2px solid ${INK.ink}` }}>
                            {audit.rows} 部
                          </td>
                          <td
                            className="tabular font-serif"
                            style={{ padding: '9px 10px', fontSize: 13, fontWeight: 700, textAlign: 'center', color: INK.ink, borderTop: `2px solid ${INK.ink}` }}
                          >
                            {audit.count} 次
                          </td>
                          <td style={{ padding: '9px 10px', fontSize: 13, textAlign: 'center', color: INK.soft, borderTop: `2px solid ${INK.ink}` }}>—</td>
                          <td
                            className="tabular font-serif"
                            style={{ padding: '9px 10px', fontSize: 13, fontWeight: 700, textAlign: 'center', color: INK.ink, borderTop: `2px solid ${INK.ink}` }}
                          >
                            {audit.hours} H
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <Footer kpName={currentUser?.username || kpName} signerLabel="盘点人署名" />
                  </>
                )}

                <FooterNote />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
