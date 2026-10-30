/**
 * 模组详情 —— v8.6「档案夹：封面在上、夹页在下」。
 *
 *   1. 顶部只留编目操作条（返回 / 记录号 / 阅览声明）。
 *   2. 一张宽封面作「夹子的封面」，下面抽出「夹页」——上沿被封面压住，
 *      两侧略内收，下缘完整露出；封面上不再重复系列/分类/卷次/密级/落款。
 *   3. 夹页自下而上依次是：登记条（地区·时代 + 复制/编辑/调查）、车卡入口、
 *      案件背景与附加档案、右侧可跟随滚动的「基础参数」阅览便笺、借阅签名与编号行。
 *   4. 便笺保留鼠标跟随的轻微倾斜，作为档案馆里一张会被手碰到的纸。
 *
 * 功能文案（案件背景 / 基础参数 / 标记为已调查 / 已调查）不可改，ui-check 依赖。
 */
import React from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, BookMarked, Copy, Edit,
  FolderArchive, Search, Trash2, Users,
} from 'lucide-react';
import { Button, SectionHeading, cx } from '../components/ui.jsx';
import CoverPlate, { fileNumberOf } from '../components/ModuleCover.jsx';
import { SealMark } from '../components/Emblem.jsx';
import { TentacleCorner } from '../components/Ornaments.jsx';
import { jitter } from '../lib/random.js';

function FieldBlock({ label, children, wide }) {
  return (
    <div className={cx('border-t border-line-strong pt-3', wide && 'sm:col-span-2')}>
      <dt className="flex items-center gap-2 font-mono text-[14px] font-semibold uppercase tracking-[0.22em] text-vermilion">
        <span aria-hidden="true" className="inline-block h-[4px] w-[4px] bg-vermilion" />
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-line break-words text-[15px] leading-[1.95] text-ink-soft">
        {children}
      </dd>
    </div>
  );
}

function ReaderRow({ label, value }) {
  return (
    <div className="reader-note__row">
      <span className="reader-note__k">{label}</span>
      <span className="reader-note__v">{value}</span>
    </div>
  );
}

export default function ModuleDetailView({
  module, isAdmin, played, currentUser, onBack, onCopy, onEdit, onDelete, onTogglePlayed, onGoCharacters,
}) {
  const hasExtra = Boolean(module.charInfo || module.occupations || module.skills || module.notes);
  const minted = jitter(`${module.id}seal`, -5, 3, 1);

  const tiltNote = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(680px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
  };
  const untiltNote = (event) => {
    event.currentTarget.style.transform = '';
  };

  return (
    <div className="relative pb-12 pt-7 lg:pt-9">
      <TentacleCorner className="pointer-events-none absolute -bottom-8 -left-12 hidden h-44 w-44 text-ink/[0.05] lg:block" />
      <h1 className="sr-only">{module.title}</h1>

      {/* ------------------------------------------------------------ 编目操作条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 font-mono text-[14px] font-semibold tracking-[0.14em] text-ink-soft transition-colors hover:text-vermilion"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2} />
            返回馆藏
          </button>
          <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
          <span className="font-mono text-[14px] tracking-[0.2em] text-ink-mute">RECORD {fileNumberOf(module)}</span>
        </div>
        <span className="flex items-center gap-2 font-kai text-[14px] tracking-[0.1em] text-ink-mute">
          <BookMarked className="h-4 w-4" strokeWidth={1.8} />
          仅限馆内阅览 · 请勿携出
        </span>
      </div>

      {/* ------------------------------------------------------------ 档案夹：封面在上，夹页在下 */}
      <div className="folder-stack mt-11">
        <div className="folder-front">
          <div className="curtain relative h-[280px] overflow-hidden border border-ink/45 sm:h-[320px] lg:h-[360px]">
            <CoverPlate module={module} variant="hero" className="h-full !min-h-0 border-0" />
            <span className={cx('cover-tag', !module.series && 'cover-tag--single')}>
              <FolderArchive className="h-4 w-4" strokeWidth={1.9} />
              <span className="truncate">{module.series || '散卷'}</span>
            </span>
          </div>
        </div>

        <article className="folder-inner">
          {/* 登记条：地区与时代只在这里出现一次，右侧是三个有主次的操作 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-line pb-3">
            <span className="flex items-center gap-2 font-mono text-[14px] tracking-[0.14em] text-ink-mute">
              <span aria-hidden="true" className="inline-block h-[4px] w-[4px] bg-vermilion" />
              {module.region || '未标注地区'}
              <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
              {module.era || '年代不明'}
            </span>
            <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {isAdmin ? (
                <>
                  <button type="button" onClick={(e) => onEdit(module, e)} className="record-act record-act--edit group w-full justify-center sm:w-auto">
                    <Edit className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6" strokeWidth={1.9} />
                    编辑
                  </button>
                  <button type="button" onClick={(e) => onDelete(module.id, e)} className="record-act record-act--delete group w-full justify-center sm:w-auto">
                    <Trash2 className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6" strokeWidth={1.9} />
                    删除
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={(e) => onTogglePlayed(module.id, e)}
                title={played ? '点击撤销调查标记' : '点击标记为已调查'}
                className={cx('record-act record-act--investigate group w-full justify-center sm:w-auto', played && 'is-played')}
              >
                {played ? (
                  <BadgeCheck className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                ) : (
                  <Search className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" strokeWidth={2} />
                )}
                {played ? '已调查' : '标记为已调查'}
              </button>
            </div>
          </div>

          {currentUser ? (
            <Button size="lg" className="mt-4 !w-full !justify-between" onClick={onGoCharacters}>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" strokeWidth={1.8} />
                为这个模组车一张卡
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <p className="mt-4 border-t border-line pt-3 font-kai text-[14px] leading-relaxed tracking-[0.06em] text-ink-mute">
              登录后可为该案卷创建角色卡。
            </p>
          )}

          {/* ------------------------------------------------------ 正文 */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_288px]">
            <div className="min-w-0">
              <section>
                <SectionHeading
                  index="01"
                  title="案件背景"
                  right={<span className="hidden font-mono text-[14px] tracking-[0.18em] text-ink-mute sm:inline">CASE BACKGROUND</span>}
                />
                <p className="mt-5 max-w-[74ch] whitespace-pre-line break-words text-[16px] leading-[2] text-ink-soft first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-serif first-letter:text-[52px] first-letter:font-black first-letter:leading-[0.78] first-letter:text-vermilion">
                  {module.description}
                </p>
              </section>

              {hasExtra ? (
                <section className="mt-11">
                  <SectionHeading
                    index="02"
                    title="附加档案"
                    right={<span className="hidden font-mono text-[14px] tracking-[0.18em] text-ink-mute sm:inline">SUPPLEMENT</span>}
                  />
                  <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
                    {module.charInfo ? <FieldBlock label="车卡要求">{module.charInfo}</FieldBlock> : null}
                    {module.occupations ? <FieldBlock label="推荐职业">{module.occupations}</FieldBlock> : null}
                    {module.skills ? <FieldBlock label="推荐技能" wide>{module.skills}</FieldBlock> : null}
                    {module.notes ? (
                      <div className="relative border border-vermilion/30 bg-vermilion/[0.05] px-5 py-4 sm:col-span-2">
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-vermilion" />
                        <dt className="relative flex items-center gap-1.5 font-mono text-[14px] font-semibold tracking-[0.22em] text-vermilion">
                          <AlertCircle className="h-4 w-4" strokeWidth={1.9} />
                          KP 批注 / 警告
                        </dt>
                        <dd className="relative mt-2 whitespace-pre-line break-words text-[15px] leading-[1.95] text-ink-soft">
                          {module.notes}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}
            </div>

            {/* 阅览便笺：滚动时固定在右侧；鼠标移入时会像一张纸被轻轻掀起 */}
            <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-24 lg:self-start">
              <div
                className="reader-note reader-note--live"
                onMouseMove={tiltNote}
                onMouseLeave={untiltNote}
              >
                <div className="flex items-baseline justify-between gap-2 border-b border-[#3a2f16]/20 pb-2">
                  <span className="font-serif text-[14px] font-bold text-[#5d4212]">基础参数</span>
                  <span className="font-mono text-[14px] tracking-[0.2em] text-[#7a6535]">READER'S CARD</span>
                </div>
                <div className="mt-1">
                  <ReaderRow label="人数" value={`${module.players} 人`} />
                  <ReaderRow label="时长" value={module.duration ? `${module.duration} 小时` : '未标注'} />
                  <ReaderRow label="时代" value={module.era || '年代不明'} />
                  <ReaderRow label="地区" value={module.region || '未标注地区'} />
                  <ReaderRow label="调查状态" value={played ? '已调查' : '未调查'} />
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(module)}
                  className="press mt-3 flex h-9 w-full items-center justify-center gap-1.5 border border-[#3a2f16]/30 bg-[#3a2f16]/[0.06] px-3 font-mono text-[14px] font-semibold tracking-[0.1em] text-[#3a2f16] transition-colors hover:border-[#3a2f16] hover:bg-[#3a2f16] hover:text-[#f8efdc]"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.9} />
                  复制简介
                </button>
              </div>
            </aside>
          </div>

          {/* ------------------------------------------------------ 借阅登记：压在夹页底 */}
          <div className="mt-10 border-t border-line pt-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[14px] tracking-[0.2em] text-ink-mute/85">BORROWER'S SIGNATURE</p>
                <p className="mt-2 flex items-baseline gap-2 font-kai text-[14px] tracking-[0.1em] text-ink-mute">
                  <span className="shrink-0">借阅人</span>
                  <span aria-hidden="true" className="h-[13px] flex-1 border-b border-dotted border-line-strong" />
                </p>
              </div>
              <span
                aria-hidden="true"
                className="-mb-3 mt-4 block shrink-0"
                style={{ transform: `rotate(${minted}deg)` }}
              >
                <SealMark size={104} className="text-vermilion/85 drop-shadow-[0_12px_18px_rgba(23,17,9,0.32)]" strokeWidth={1.15} />
              </span>
            </div>

            <p className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-2.5 font-mono text-[14px] tracking-[0.16em] text-ink-mute">
              <span>馆藏编号 {fileNumberOf(module)}</span>
              <span className="hidden sm:inline">档案馆 · 终身有效</span>
              <span>MCMXX</span>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
