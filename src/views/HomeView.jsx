/**
 * 首页 —— v5「深潜档案馆」。
 *
 * 这一版把首页当成一间**档案馆的前台工作台**来做：
 *   1. 头版是一张带红色页边、触手花边的公报纸（`.sheet`），左侧社论式标题、
 *      右侧「今日索引」——不是装饰，而是最新的两份卷宗与三行账目。
 *   2. 下方是真正的生产力布局：左侧固定检索条件（筛选 + 合集），
 *      中间卷宗陈列，右侧馆藏账目与最近归档；手机上收成单列，
 *      筛选变成 2×2 网格，不做横向滚动，避免边缘被裁。
 *   3. 每张卷宗卡是一份带封皮的档案：封面打开后是标题、提要、参数与
 *      「查阅档案」的动作行；管理员按钮悬停浮出。
 *   4. 装饰由 module.id 的哈希决定（旋转角度、编目点、图案），
 *      同一页不会重复成一条流水线。
 *
 * 依赖契约（ui-check）：卡片根节点含 cursor-pointer 与「查阅档案」；
 * 头版含「收录世界上不可名状的超自然案件」；未登录含「登录身份」由壳层提供。
 */
import React from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCircle, Dices,
  Edit, FileText, FolderArchive, LayoutGrid, ListChecks, Lock, Pin, Search, Trash2, X,
} from 'lucide-react';
import {
  EmptyState, Reveal, Select, Tabs, cx,
} from '../components/ui.jsx';
import CoverPlate, { fileNumberOf } from '../components/ModuleCover.jsx';
import { SealMark, SealWatermark } from '../components/Emblem.jsx';
import { IndexTicks, TentacleCorner, TentacleRule } from '../components/Ornaments.jsx';
import { CountUp, Magnetic, ReadingLamp } from '../components/Motion.jsx';
import { hashString } from '../lib/random.js';

const pad2 = (n) => String(n).padStart(2, '0');
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const roman = (n) => ROMAN[n - 1] || pad2(n);

function trackPointer(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

/** 日期线：卷期、公历与农历感的短注 */
function Dateline({ total }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-b border-ink/25 pb-2 font-mono text-[14px] tracking-[0.24em] text-ink-mute">
      <span className="flex items-center gap-3">
        <span>馆藏 {pad2(total)} 份</span>
        <span className="hidden items-center gap-3 sm:flex">
          <span aria-hidden="true" className="h-[3px] w-[3px] bg-vermilion/70" />
          <span>内部流通 · 请勿携出</span>
        </span>
      </span>
    </div>
  );
}

/** 右侧「今日索引」：不是装饰画，而是最实用的三行与最新两卷 */
function IndexPanel({ stats, latest, currentUser, onOpenModule, onGoAuth, onGoCharacters }) {
  return (
    <aside className="hero-side relative mt-6 lg:mt-0 lg:pl-7">
      <span aria-hidden="true" className="absolute -left-0 top-1 bottom-1 hidden w-px bg-line-strong lg:block" />
      <div className="flex items-baseline justify-between border-b border-ink/40 pb-2">
        <span className="font-serif text-[16px] font-bold tracking-[0.08em] text-ink">今日索引</span>
        <span className="font-mono text-[14px] tracking-[0.22em] text-ink-mute">INDEX TODAY</span>
      </div>

      <dl className="divide-y divide-line border-b border-ink/40">
        {stats.map((s, i) => (
          <div key={s.label} className="group flex items-baseline justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 font-mono text-[14px] tracking-[0.18em] text-ink-mute">
              <span className="text-vermilion/80">{pad2(i + 1)}</span>
              {s.label}
            </dt>
            <dd className="flex items-baseline gap-1 font-serif text-[27px] font-black leading-none text-ink tabular transition-colors group-hover:text-vermilion">
              <CountUp value={s.value} />
              <span className="font-sans text-[14px] font-normal tracking-[0.1em] text-ink-mute">{s.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[14px] tracking-[0.22em] text-ink-mute">最新收录</span>
          <IndexTicks count={5} className="text-vermilion/60" />
        </div>
        <ul className="mt-1.5 space-y-0.5">
          {latest.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onOpenModule(m)}
                className="group flex h-8 w-full items-center gap-2 text-left"
              >
                <span className="font-mono text-[14px] text-vermilion/70">{pad2(i + 1)}</span>
                <span className="min-w-0 flex-1 truncate font-serif text-[14.5px] font-semibold text-ink-soft transition-colors group-hover:text-vermilion">
                  {m.title}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 translate-y-px text-ink-mute opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            </li>
          ))}
          {latest.length === 0 ? <li className="font-kai text-[14px] text-ink-mute">尚无收录。</li> : null}
        </ul>
      </div>

      <div className="mt-5 border-t border-ink/40 pt-4">
        <button
          type="button"
          onClick={currentUser ? onGoCharacters : onGoAuth}
          className="press group flex min-h-[60px] w-full items-center justify-between gap-3 border border-transparent bg-[var(--c-masthead)] px-4 py-2.5 text-left text-[var(--c-masthead-ink)] transition-colors duration-300 hover:border-ochre/50 hover:text-ochre"
        >
          <span>
            <span className="block font-serif text-[15px] font-bold tracking-[0.06em]">{currentUser ? '继续我的调查' : '领取阅览证'}</span>
            <span className="mt-0.5 block font-mono text-[14px] tracking-[0.2em] opacity-55">
              {currentUser ? 'CONTINUE INVESTIGATION' : 'READER PERMIT'}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </aside>
  );
}

/** 卷宗条目：封面是「印版」，文字像编目签条贴在纸面上，不再套一张卡片壳 */
function DossierCard({ module, played, isAdmin, onOpen, onEdit, onDelete, onSeries, index }) {
  return (
    <Reveal variant="unseal" delay={Math.min(index, 4) * 40} className="dossier group/card relative flex h-full flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(module)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(module); } }}
        className="flex h-full cursor-pointer flex-col outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vermilion"
      >
        <div
          onMouseMove={trackPointer}
          className="dossier-cover spot-card relative overflow-hidden border border-line-strong shadow-[0_12px_26px_-24px_rgba(6,18,18,.9)]"
        >
          {/* 标签全部收进封面里，与状态章同一族；左侧合集、右侧置顶与调查状态 */}
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-20 flex items-start justify-between gap-2">
            <div className="pointer-events-auto min-w-0 max-w-[58%]">
              {module.series ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSeries(module.series); }}
                  title={`查看合集：${module.series}`}
                  className="cover-chip cover-chip--series max-w-full hover:border-[#e8a08c]/90 hover:bg-[#3a1710]/90 hover:text-[#fbe7d6]"
                >
                  <span aria-hidden="true" className="h-[6px] w-[6px] shrink-0 rotate-45 bg-[#e8a08c]" />
                  <span className="truncate">{module.series}</span>
                </button>
              ) : (
                <span className="cover-chip cover-chip--single max-w-full">
                  <span aria-hidden="true" className="h-[6px] w-[6px] shrink-0 rotate-45 bg-[#f3e7cd]/55" />
                  <span className="truncate">散卷</span>
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {module.isPinned ? (
                <span className="cover-chip cover-chip--pin">
                  <Pin className="h-3.5 w-3.5" strokeWidth={2} />置顶
                </span>
              ) : null}
              <span className={cx('cover-chip', played && 'cover-chip--done')}>
                <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-full', played ? 'bg-[#b7d8ac]' : 'bg-[#f3e7cd]/55')} />
                {played ? '已调查' : '未调查'}
              </span>
            </div>
          </div>

          <CoverPlate module={module} variant="card" />
          {isAdmin ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 gap-2 opacity-0 transition-all duration-300 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 sm:flex">
              <button
                type="button"
                onClick={(e) => onEdit(module, e)}
                className="flex h-8 w-8 items-center justify-center border border-[#f3e7cd]/25 bg-[#0b1714]/88 text-[#f3e7cd] shadow-[0_8px_18px_-10px_rgba(0,0,0,.95)] backdrop-blur-[2px] transition-colors hover:border-[#f3e7cd]/60 hover:bg-[#c2542f] hover:text-[#fbf4e2]"
                aria-label="编辑模组"
              >
                <Edit className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={(e) => onDelete(module.id, e)}
                className="flex h-8 w-8 items-center justify-center border border-[#f3e7cd]/25 bg-[#0b1714]/88 text-[#e8a08c] shadow-[0_8px_18px_-10px_rgba(0,0,0,.95)] backdrop-blur-[2px] transition-colors hover:border-[#8f2a1c] hover:bg-[#8f2a1c] hover:text-[#fbf4e2]"
                aria-label="删除模组"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>

        {/* 编目文字：不套白卡，直接落在纸面上 */}
        <div className="flex flex-1 flex-col px-0.5 pt-3">
          <p className="dossier-desc line-clamp-2 text-[16px] leading-[1.78] text-ink-soft">{module.description}</p>

          <div className="mt-auto pt-3">
            <span className="dossier-rule block h-px w-full bg-line-strong" />
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="dossier-title flex items-center gap-1.5 text-[15px] font-semibold tracking-[0.03em] text-ink">
                <BookOpen className="h-4 w-4" strokeWidth={1.8} />
                查阅档案
              </span>
              <ArrowRight className="dossier-arrow h-6 w-6 text-ink-mute" strokeWidth={1.7} />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function HomeView({
  modules, currentUser, playedModules, isAdmin,
  homeTab, setHomeTab, searchTerm, setSearchTerm,
  filterRegion, setFilterRegion, filterPlayers, setFilterPlayers,
  filterDuration, setFilterDuration, filterPlayed, setFilterPlayed,
  selectedCollection, setSelectedCollection, uniqueSeries, uniqueRegions,
  uniquePlayers, uniqueDurations, filteredModules,
  onOpenModule, onEditModule, onDeleteModule, onTogglePlayed, onGoAuth, onGoCharacters,
}) {
  const hasFilter = Boolean(filterRegion || filterPlayers || filterDuration || filterPlayed || selectedCollection);
  const clearAll = () => {
    setFilterRegion(''); setFilterPlayers(''); setFilterDuration('');
    setFilterPlayed(''); setSelectedCollection(null);
  };

  const tabItems = [
    { value: 'grid', label: '卷宗阅览', icon: LayoutGrid },
    { value: 'collections', label: '合集', icon: FolderArchive },
    ...(currentUser ? [{ value: 'list', label: '列表记录', icon: ListChecks }] : []),
  ];

  const stats = [
      { label: '馆藏总数', value: pad2(modules.length), unit: '份' },
      { label: '系列合集', value: pad2(uniqueSeries.length), unit: '组' },
  ...(currentUser ? [{ label: '我的归档', value: pad2(playedModules.length), unit: '卷' }] : []),
  ];

  const latest = [...modules]
    .sort((a, b) => hashString(`recent-${a.id}`) - hashString(`recent-${b.id}`))
    .slice(0, 3);

  const openRandom = () => {
    if (!filteredModules.length) return;
    onOpenModule(filteredModules[Math.floor(Math.random() * filteredModules.length)]);
  };

  const selClass = '!w-full !rounded-none !border-line-strong !bg-paper-raised !py-2 !pl-3 !pr-8 !text-[14px] !text-ink-soft transition-colors hover:!border-ink-mute focus:!border-vermilion';

  return (
    <div className="pb-6">
      {/* ============================================================ 头版 */}
      <header className="sheet sheet-margin relative overflow-hidden px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        <ReadingLamp />
        <TentacleCorner className="pointer-events-none absolute -bottom-16 -left-14 hidden h-52 w-52 text-ink/[0.18] sm:block" flipY />
        <SealWatermark size={360} className="pointer-events-none absolute -bottom-24 -right-14 hidden text-ink/[0.045] lg:block" />
        <div className="relative">
          <Dateline total={modules.length} />

          <div className="mt-6 grid gap-8 lg:mt-7 lg:grid-cols-[minmax(0,1.42fr)_minmax(0,0.78fr)] lg:gap-10">
            <div className="min-w-0">
              <p className="hero-fade flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[14px] font-semibold tracking-[0.24em] text-vermilion" style={{ '--delay': '30ms' }}>
                <span aria-hidden="true" className="h-[6px] w-[6px] bg-vermilion" />
                档案馆卷宗阅览室 · 案件收录区
                <span aria-hidden="true" className="hidden h-px w-10 bg-vermilion/35 sm:block" />
                <span className="hidden text-ink-mute sm:inline">READING ROOM · CASE INTAKE</span>
              </p>

              <h1 className="mt-4 font-serif tracking-[-0.035em]">
                <span className="sr-only">收录世界上不可名状的超自然案件</span>
                <span aria-hidden="true" className="block">
                  <span className="line-mask">
                    <span className="line-rise" style={{ '--delay': '90ms' }}>
                      <span className="block text-[34px] font-black leading-[1.06] text-ink sm:text-[52px] lg:text-[58px]">收录世界上</span>
                    </span>
                  </span>
                  <span className="line-mask">
                    <span className="line-rise" style={{ '--delay': '170ms' }}>
                      <span className="title-grad title-grad--red title-grad--breathe block w-fit text-[34px] font-black leading-[1.06] sm:text-[52px] lg:text-[58px]">不可名状的</span>
                    </span>
                  </span>
                  <span className="line-mask">
                    <span className="line-rise" style={{ '--delay': '250ms' }}>
                      <span className="title-grad title-grad--teal title-grad--breathe title-grad--breathe-lag block w-fit text-[34px] font-black leading-[1.06] sm:text-[52px] lg:text-[58px]">超自然案件</span>
                    </span>
                  </span>
                </span>
              </h1>

              <p className="hero-fade mt-5 max-w-[39rem] text-pretty border-l-2 border-vermilion/40 pl-3.5 text-[14px] leading-[1.9] text-ink-soft" style={{ '--delay': '380ms' }}>
                自1920年代起，凡异常案件调查中留下的证词、剪报与手记，皆按禁忌编号封存成卷：有些纸页比停尸房更冷，有些墨迹会在午夜自行改写，有些卷宗会记住翻阅者的呼吸。推门进来的调查员，请先查阅档案，让馆员确认你还记得自己的名字；在理智尚可计数之前选好案卷，再决定你要带走哪一段真相——因为每一段真相，也都在挑选带走它的人。
              </p>

              <div className="hero-fade mt-6 flex flex-wrap items-center gap-x-3 gap-y-2.5" style={{ '--delay': '460ms' }}>
                <Magnetic strength={0.16} max={4}>
                  <button
                    type="button"
                    onClick={onGoCharacters}
                    className="lume press group inline-flex h-11 items-center gap-2 bg-vermilion px-6 text-[15px] font-semibold tracking-[0.05em] text-paper-raised shadow-[3px_3px_0_0_rgba(23,17,9,0.18)] btn-stamp"
                  >
                    免费车卡
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </Magnetic>

                <button
                  type="button"
                  onClick={() => document.getElementById('archive-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="cta-ghost group inline-flex h-11 items-center gap-1.5 border border-ink/50 px-5 text-[14.5px] font-semibold tracking-[0.03em] text-ink transition-colors duration-300 hover:border-vermilion hover:text-vermilion"
                >
                  翻阅馆藏
                  <ArrowDown className="cta-arrow h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={openRandom}
                  className="group inline-flex h-11 items-center gap-1.5 px-2 font-kai text-[14px] tracking-[0.1em] text-ink-mute transition-colors hover:text-vermilion"
                  title="从当前筛选结果里随机抽一份卷宗"
                >
                  <Dices className="h-6 w-6 transition-transform duration-500 group-hover:rotate-180" />
                  随手抽一卷
                </button>

                {currentUser ? (
                  <button
                    type="button"
                    onClick={onGoCharacters}
                    className="link-ink ml-1 inline-flex min-h-11 items-center text-[14px] tracking-[0.04em] text-ink-mute hover:text-vermilion"
                  >
                    我的角色卡
                  </button>
                ) : (
                  <span className="hidden font-kai text-[14px] tracking-[0.14em] text-ink-mute sm:inline">
                    无需登录即可试车一张卡
                  </span>
                )}
              </div>

              <div aria-hidden="true" className="mt-8 hidden items-center gap-4 lg:flex">
                <TentacleRule className="h-7 w-[238px] shrink-0 text-ink/35" />
                <span className="h-px flex-1 bg-line" />
                <span className="shrink-0 font-mono text-[14px] tracking-[0.24em] text-ink-mute">NO ENTRY WITHOUT A NAME</span>
              </div>
            </div>

            <IndexPanel
              stats={stats}
              latest={latest}
              currentUser={currentUser}
              onOpenModule={onOpenModule}
              onGoAuth={onGoAuth}
              onGoCharacters={onGoCharacters}
            />
          </div>
        </div>
      </header>

      {/* ============================================================ 工作台 */}
      <section id="archive-index" className="mt-7 scroll-mt-32">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink/60 pb-2">
          <div className="flex items-baseline gap-3">
            <span className="flex h-[22px] items-center bg-vermilion px-2 font-mono text-[14px] font-bold tracking-[0.12em] text-paper-raised">01</span>
            <h2 className="font-serif text-[26px] font-black tracking-[0.01em] text-ink">馆藏索引</h2>
            <span className="hidden font-mono text-[14px] tracking-[0.22em] text-ink-mute sm:inline">ARCHIVE INDEX</span>
          </div>
          <span className="flex items-center gap-2 font-mono text-[14px] tracking-[0.16em] text-ink-mute">
            <span aria-hidden="true" className="h-[4px] w-[4px] bg-vermilion" />
            {pad2(filteredModules.length)} 份匹配 / 共 {pad2(modules.length)} 份
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[198px_minmax(0,1fr)_218px]">
          {/* 左栏：检索条件 —— 与右轨一起跟随滚动，滚到下层时两侧不留白 */}
          <aside className="no-scrollbar space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6.5rem)] lg:self-start lg:overflow-y-auto">
            <div className="border border-line-strong bg-paper-raised/70 p-3.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-serif text-[15px] font-bold tracking-[0.06em] text-ink">检索条件</span>
                {hasFilter ? (
                  <button type="button" onClick={clearAll} className="font-mono text-[14px] tracking-[0.14em] text-vermilion underline decoration-vermilion/40 underline-offset-2 hover:decoration-vermilion">
                    全部清除
                  </button>
                ) : (
                  <span className="font-mono text-[14px] tracking-[0.18em] text-ink-mute">FILTER</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                <label className="block">
                  <span className="mb-1 block font-mono text-[14px] tracking-[0.16em] text-ink-mute">地区</span>
                  <Select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={selClass} aria-label="按地区筛选">
                    <option value="">全部地区</option>
                    {uniqueRegions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[14px] tracking-[0.16em] text-ink-mute">人数</span>
                  <Select value={filterPlayers} onChange={(e) => setFilterPlayers(e.target.value)} className={selClass} aria-label="按人数筛选">
                    <option value="">全部人数</option>
                    {uniquePlayers.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[14px] tracking-[0.16em] text-ink-mute">时长</span>
                  <Select value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)} className={selClass} aria-label="按时长筛选">
                    <option value="">全部时长</option>
                    {uniqueDurations.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </label>
                {currentUser ? (
                  <label className="block">
                    <span className="mb-1 block font-mono text-[14px] tracking-[0.16em] text-ink-mute">调查状态</span>
                    <Select value={filterPlayed} onChange={(e) => setFilterPlayed(e.target.value)} className={selClass} aria-label="按调查状态筛选">
                      <option value="">全部状态</option>
                      <option value="unplayed">未调查</option>
                      <option value="played">已调查</option>
                    </Select>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="border border-line-strong bg-paper-raised/70 p-3.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-serif text-[15px] font-bold tracking-[0.06em] text-ink">档案目录</span>
                <span className="font-mono text-[14px] tracking-[0.18em] text-ink-mute">CATALOG</span>
              </div>
              <div className="mt-1.5 flex flex-col">
                {tabItems.map((it, i) => {
                  const active = homeTab === it.value;
                  return (
                    <button
                      key={it.value}
                      type="button"
                      onClick={() => {
                        if (!currentUser && it.value === 'list') return onGoAuth();
                        setHomeTab(it.value);
                      }}
                      className={cx(
                        'group relative flex min-h-11 items-center gap-2.5 border-b border-line/70 pl-2.5 pr-1 text-left last:border-0',
                        'transition-all duration-300 ease-[var(--ease-soft)]',
                        active ? 'bg-vermilion/[0.07]' : 'hover:bg-paper-deep/50',
                      )}
                    >
                      <span aria-hidden="true" className={cx('absolute inset-y-1.5 left-0 w-[2px] transition-transform duration-300', active ? 'scale-y-100 bg-vermilion' : 'scale-y-0 bg-vermilion/40')} />
                      <span className={cx('font-mono text-[14px] tracking-[0.1em]', active ? 'text-vermilion' : 'text-ink-mute/70')}>{pad2(i + 1)}</span>
                      <it.icon className={cx('h-[13px] w-[13px] transition-colors', active ? 'text-vermilion' : 'text-ink-mute')} strokeWidth={1.9} />
                      <span className={cx('flex-1 font-serif text-[15px] font-semibold transition-colors', active ? 'text-ink' : 'text-ink-soft group-hover:text-ink')}>{it.label}</span>
                      {active ? <span aria-hidden="true" className="h-[4px] w-[4px] bg-vermilion" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* 中栏：检索 + 陈列 */}
          <div className="min-w-0">
            <div className="command-bar flex items-center gap-3 px-3.5 py-2 sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={1.9} />
              <input
                type="text"
                placeholder="搜索模组、地区或关键词…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-0 border-0 bg-transparent py-1 text-[14.5px] text-ink outline-none placeholder:text-ink-mute/80"
                aria-label="搜索模组"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="清除搜索"
                  className="shrink-0 p-1 text-ink-mute transition-colors hover:text-vermilion"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span className="hidden shrink-0 border border-line-strong px-1.5 py-0.5 font-mono text-[14px] tracking-[0.18em] text-ink-mute sm:inline">SEARCH</span>
              )}
            </div>

            <div className="mt-4 flex items-end gap-4">
              <Tabs items={tabItems} value={homeTab} onChange={(v) => { if (!currentUser && v === 'list') return onGoAuth(); setHomeTab(v); }} className="flex-1" />
            </div>

            {selectedCollection && homeTab === 'grid' ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-vermilion/30 bg-vermilion/[0.05] px-3 py-2">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <FolderArchive className="h-4 w-4 text-vermilion" />
                  合集：{selectedCollection}
                  <span className="font-mono text-[14px] font-normal tracking-[0.14em] text-ink-mute">{pad2(filteredModules.length)} 份</span>
                </span>
                <button type="button" onClick={() => setSelectedCollection(null)} className="font-mono text-[14px] tracking-[0.12em] text-ink-mute underline decoration-line-strong underline-offset-2 hover:text-vermilion">
                  退出合集
                </button>
              </div>
            ) : null}

            {/* 卷宗网格 */}
            {homeTab === 'grid' ? (
              <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2">
                {filteredModules.map((module, i) => (
                  <DossierCard
                    key={module.id}
                    module={module}
                    index={i}
                    played={playedModules.includes(module.id)}
                    isAdmin={isAdmin}
                    onOpen={onOpenModule}
                    onEdit={(m, e) => onEditModule(m, e)}
                    onDelete={onDeleteModule}
                    onSeries={(series) => { setSelectedCollection(series); setHomeTab('grid'); }}
                  />
                ))}
                {filteredModules.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState icon={FileText} title="没有找到匹配的档案" desc="试着调整搜索关键字，或清除筛选条件。" />
                  </div>
                ) : null}

                <div className="col-span-full mt-3 flex flex-wrap items-center justify-between gap-6 border-y border-ink/25 px-1 py-7">
                  <div className="flex items-center gap-4">
                    <SealMark size={44} className="shrink-0 text-vermilion/60" />
                    <div>
                      <p className="font-serif text-[20px] font-bold tracking-[0.01em] text-ink">索引到此为止，档案仍在增加。</p>
                      <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">闭馆之后，新的卷宗会自己出现在架子上。</p>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] tracking-[0.24em] text-ink-mute">
                    END OF INDEX · {pad2(filteredModules.length)} / {pad2(modules.length)}
                  </span>
                </div>
              </div>
            ) : null}

            {/* 合集目录 */}
            {homeTab === 'collections' ? (
              <div className="mt-5">
                {uniqueSeries.length === 0 ? (
                  <p className="border border-dashed border-line-strong py-14 text-center font-kai text-[16px] text-ink-mute">
                    还没有任何合集。发布模组时填写「系列」，它们会自动归入同一组。
                  </p>
                ) : (
                  <ul className="border-y border-ink/40">
                    {uniqueSeries.map((series, i) => {
                      const list = modules.filter((m) => m.series === series);
                      return (
                        <Reveal as="li" key={series} delay={Math.min(i, 8) * 40} className="border-b border-line last:border-0">
                          <button
                            type="button"
                            onClick={() => { setSelectedCollection(series); setHomeTab('grid'); }}
                            className="group flex w-full items-center gap-4 px-2 py-4 text-left transition-colors duration-300 hover:bg-paper-raised"
                          >
                            <span className="w-7 shrink-0 font-mono text-[14px] tracking-[0.1em] text-vermilion/70">{roman(i + 1)}</span>
                            <TentacleRule className="hidden h-7 w-16 shrink-0 text-ink/20 sm:block" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-3">
                                <span className="truncate font-serif text-[20px] font-bold tracking-[0.01em] text-ink transition-colors group-hover:text-vermilion sm:text-[24px]">{series}</span>
                                <span aria-hidden="true" className="hidden flex-1 border-b border-dotted border-line-strong sm:block" />
                                <span className="ml-auto shrink-0 font-serif text-[20px] font-black leading-none text-ink tabular sm:ml-0">{pad2(list.length)}</span>
                              </span>
                              <span className="mt-1 block truncate text-[14px] text-ink-mute">{list.slice(0, 3).map((m) => m.title).join(' · ')}</span>
                            </span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition-all duration-300 group-hover:translate-x-1 group-hover:text-vermilion" />
                          </button>
                        </Reveal>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {/* 列表记录 */}
            {homeTab === 'list' && currentUser ? (
              <div className="mt-5 overflow-x-auto border border-line-strong">
                <table className="w-full min-w-[520px] text-left">
                  <thead className="border-b border-line-strong bg-paper-deep/70 font-mono text-[14px] tracking-[0.18em] text-ink-mute">
                    <tr>
                      <th className="w-12 px-3 py-2.5 text-center">状</th>
                      <th className="px-3 py-2.5">名称</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">合集</th>
                      <th className="px-3 py-2.5 text-right">参数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((m) => {
                      const played = playedModules.includes(m.id);
                      return (
                        <tr
                          key={m.id}
                          onClick={(e) => onTogglePlayed(m.id, e)}
                          className={cx('cursor-pointer border-b border-line transition-colors last:border-0', played ? 'bg-forest/[0.06] hover:bg-forest/[0.1]' : 'hover:bg-paper-deep/60')}
                        >
                          <td className="px-3 py-3 text-center">
                            <CheckCircle className={cx('mx-auto h-4 w-4', played ? 'text-forest' : 'text-ink-mute/60')} strokeWidth={1.9} />
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[14.5px] font-semibold text-ink">{m.title}</span>
                            {m.isPinned ? <Pin className="ml-1.5 inline h-4 w-4 text-ochre" /> : null}
                            <span className="ml-2 font-mono text-[14px] tracking-[0.14em] text-ink-mute">{fileNumberOf(m)}</span>
                          </td>
                          <td className="hidden px-3 py-3 text-[14px] text-ink-mute sm:table-cell">{m.series || '—'}</td>
                          <td className="px-3 py-3 text-right font-mono text-[14px] text-ink-soft tabular">{m.players} 人 · {m.duration}h</td>
                        </tr>
                      );
                    })}
                    {filteredModules.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-12 text-center text-[14.5px] text-ink-mute">没有找到匹配的档案</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {/* 右栏：馆藏账目与守秘人入口 */}
          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="relative overflow-hidden border border-line-strong bg-[var(--c-masthead)] p-4 text-[var(--c-masthead-ink)]">
              <TentacleCorner className="pointer-events-none absolute -right-5 -top-4 h-24 w-24 opacity-20" flipX />
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <span className="font-serif text-[14.5px] font-bold tracking-[0.1em]">馆藏账目</span>
                <Lock className="h-4 w-4 opacity-50" strokeWidth={1.8} />
              </div>
              <dl className="mt-2 divide-y divide-white/10">
                {[
                  ['在册卷宗', pad2(modules.length)],
                  ['系列合集', pad2(uniqueSeries.length)],
                  ...(currentUser ? [['我的归档', pad2(playedModules.length)]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-2">
                    <dt className="font-mono text-[14px] tracking-[0.18em] opacity-55">{k}</dt>
                    <dd className="font-serif text-[20px] font-black leading-none tabular">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 border-t border-white/15 pt-2 font-kai text-[14px] leading-relaxed tracking-[0.08em] opacity-55">
                账目每日闭馆后复核，编号终身有效。
              </p>
            </div>

            <div className="border border-line-strong bg-paper-raised/70 p-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-serif text-[14.5px] font-bold tracking-[0.06em] text-ink">最近收录</span>
                <CalendarDays className="h-4 w-4 text-vermilion/70" strokeWidth={1.8} />
              </div>
              <ul className="mt-2 divide-y divide-line/70">
                {latest.map((m, i) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => onOpenModule(m)} className="group flex min-h-11 w-full items-center gap-2 py-2 text-left">
                      <span className="font-mono text-[14px] text-vermilion/60">{pad2(i + 1)}</span>
                      <span className="min-w-0 flex-1 truncate font-serif text-[14px] font-semibold text-ink-soft transition-colors group-hover:text-vermilion">{m.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-line-strong bg-paper-raised/70 p-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-serif text-[14.5px] font-bold tracking-[0.06em] text-ink">快速入口</span>
                <IndexTicks count={4} className="text-vermilion/50" />
              </div>
              <div className="mt-2 space-y-1">
                <button type="button" onClick={onGoCharacters} className="group flex w-full items-center justify-between py-2 text-left font-serif text-[14.5px] font-semibold text-ink-soft transition-colors hover:text-vermilion">
                  我的角色卡
                  <ArrowUpRight className="h-4 w-4 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
                <button type="button" onClick={openRandom} className="group flex w-full items-center justify-between border-t border-line/70 py-2 text-left font-serif text-[14.5px] font-semibold text-ink-soft transition-colors hover:text-vermilion">
                  随机抽一卷
                  <Dices className="h-6 w-6 opacity-40 transition-transform duration-500 group-hover:rotate-180 group-hover:opacity-100" />
                </button>
              </div>
            </div>

          </aside>
        </div>
      </section>

      {/* 报尾 */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/60 pt-3">
        <span className="flex items-center gap-2 font-kai text-[14px] tracking-[0.14em] text-ink-mute">
          <CalendarDays className="h-4 w-4" strokeWidth={1.7} />
          馆藏持续收录中 · 归档编号终身有效
        </span>
      </div>
    </div>
  );
}
