/**
 * 守秘人控制台：录入带团记录 + 全模组带团盘点 + 导出长图。
 *
 * 视觉：v3「铅印案卷」的守秘人台账 —— 顶部是一条账目条（衬线大数字 + 方点小标签），
 * 下方是两张印刷账页：深墨表头、宽字距小字、行间细墨线、悬停纸槽。
 *
 * 与旧实现的关键差异：
 *  - 录入记录时用 **模组 id** 关联（旧实现用模组标题字符串匹配，重名模组会串数据）。
 *  - 所有请求走统一 API 客户端，删除/新增后不再直接改动 state 数组的排序。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image as ImageIcon, NotebookPen, Search, X,
} from 'lucide-react';
import { apiDelete, apiGet, apiPost } from '../lib/api.js';
import {
  Button, Combobox, EmptyState, Field, Input, PageHeader, Panel, Select, Tabs, cx,
} from './ui.jsx';

/** 深墨表头里的小字：宽字距、纸色、全大写 */
const TH = 'px-4 py-3 text-left text-[14px] font-semibold uppercase tracking-[0.18em] text-paper/60';

/** 控制台表单标签放大：9.5→11.5px，提示 11px */
const FIELD_LG = '[&>span>span:first-child]:!text-[14px] [&>span>span:first-child]:!tracking-[0.14em] '
  + '[&>span>span+span]:!text-[14px]';

/** 控制台输入控件统一 14px */
const CTRL = '!text-[14px]';

/** 账目条单元格：方点 + 宽字距小标签 + 衬线大数字 */
function LedgerCell({
  index, label, value, unit, className,
}) {
  return (
    <div className={cx('relative bg-paper-raised px-4 py-4 sm:px-6 sm:py-5', className)}>
      <span aria-hidden="true" className="absolute right-3 top-3 font-mono text-[14px] tracking-[0.18em] text-slate-500/60">{index}</span>
      <dt className="flex items-center gap-2 pr-6 text-[14px] font-semibold tracking-[0.16em] text-slate-500">
        <span aria-hidden="true" className="h-[5px] w-[5px] shrink-0 bg-red-500" />
        {label}
      </dt>
      <dd className="mt-2.5 flex items-baseline gap-1">
        <span className="font-serif text-[28px] font-bold leading-none tracking-[-0.01em] text-slate-100 tabular sm:text-[32px]">{value}</span>
        <span className="text-[14px] tracking-[0.14em] text-slate-500">{unit}</span>
      </dd>
    </div>
  );
}

export default function KpDashboardPanel({ modules, showToast, showConfirm, handlePreview, users = [] }) {
  const [sessions, setSessions] = useState([]);
  const [kpTab, setKpTab] = useState('history');
  const [overviewFilter, setOverviewFilter] = useState('all');
  const [form, setForm] = useState({ moduleId: '', date: '', duration: '', investigators: [] });
  const [moduleQuery, setModuleQuery] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchSessions = useCallback(async () => {
    try { setSessions(await apiGet('/api/sessions')); } catch (err) { showToast(err.message, 'error'); }
  }, [showToast]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filteredModuleOptions = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) => m.title.toLowerCase().includes(q) || (m.series || '').toLowerCase().includes(q));
  }, [modules, moduleQuery]);

  const addPlayer = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    setForm((prev) => (prev.investigators.includes(trimmed)
      ? prev
      : { ...prev, investigators: [...prev.investigators, trimmed] }));
    setPlayerSearch('');
  };
  const removePlayer = (name) => setForm((prev) => ({ ...prev, investigators: prev.investigators.filter((p) => p !== name) }));

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!form.moduleId) return showToast('请选择模组', 'error');
    if (form.investigators.length === 0) return showToast('请至少添加一名在车玩家', 'error');
    setBusy(true);
    try {
      await apiPost('/api/sessions', {
        moduleId: form.moduleId,
        date: form.date,
        duration: Number(form.duration),
        playerCount: form.investigators.length,
        investigators: form.investigators.join(', '),
      });
      showToast('跑团记录添加成功！');
      setForm({ moduleId: '', date: '', duration: '', investigators: [] });
      fetchSessions();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const handleDeleteSession = (id) => showConfirm('确定删除这条带团记录吗？', async () => {
    try {
      await apiDelete(`/api/sessions/${id}`);
      showToast('记录已删除');
      fetchSessions();
    } catch (err) { showToast(err.message, 'error'); }
  });

  const totalHours = sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const moduleStats = useMemo(() => {
    const stats = {};
    sessions.forEach((s) => {
      if (!stats[s.moduleId]) stats[s.moduleId] = { count: 0, totalDuration: 0 };
      stats[s.moduleId].count += 1;
      stats[s.moduleId].totalDuration += (Number(s.duration) || 0);
    });
    return stats;
  }, [sessions]);

  const filteredOverviewModules = useMemo(() => modules.filter((m) => {
    const count = moduleStats[m.id]?.count || 0;
    if (overviewFilter === 'unplayed') return count === 0;
    if (overviewFilter === 'played') return count > 0;
    return true;
  }).sort((a, b) => (moduleStats[b.id]?.count || 0) - (moduleStats[a.id]?.count || 0)), [modules, moduleStats, overviewFilter]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sessions],
  );

  const maxSessionCount = useMemo(
    () => Math.max(1, ...Object.values(moduleStats).map((s) => s.count)),
    [moduleStats],
  );

  const avgHours = sessions.length ? (totalHours / sessions.length).toFixed(1) : '0.0';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        tone="forest"
        title="守秘人控制台"
        desc="记录每一场带团，盘点全部馆藏；导出长图时可作为开团履历。"
        actions={(
          <span className="stamp hidden !text-[14px] text-indigo sm:inline-flex" aria-hidden="true">
            KP · LEDGER NO.01
          </span>
        )}
      />

      {/* 账目条：场次 / 时长 / 均场 / 馆藏 */}
      <section aria-label="带团总账" className="animate-in fade-in">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-[18px] font-bold tracking-[0.03em] text-slate-100">带团总账</span>
            <span className="caption hidden !text-[14px] sm:inline">LEDGER OF SESSIONS</span>
          </div>
          <span className="caption !text-[14px]">卷号 KP-01 · 自 1920 起</span>
        </div>
        <dl className="grid grid-cols-2 gap-px border-y-2 border-ink bg-line sm:grid-cols-4">
          <LedgerCell index="01" label="总带团场次" value={sessions.length} unit="场" />
          <LedgerCell index="02" label="累计时长" value={totalHours.toFixed(1)} unit="h" />
          <LedgerCell index="03" label="平均每场" value={avgHours} unit="h" />
          <LedgerCell index="04" label="馆藏模组" value={modules.length} unit="部" />
        </dl>
      </section>

      <Tabs
        items={[{ value: 'history', label: '历史记录与分析' }, { value: 'overview', label: '全模组带团盘点' }]}
        value={kpTab}
        onChange={setKpTab}
      />

      {kpTab === 'history' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <form onSubmit={handleAddSession} className="surface h-fit">
            <div className="flex items-center justify-between gap-3 border-b border-line-strong px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FORM 01</span>
                <h3 className="flex items-center gap-2 font-serif text-[18px] font-bold tracking-[0.02em] text-slate-100">
                  <NotebookPen className="h-4 w-4 text-amber-500" strokeWidth={1.7} /> 录入跑团记录
                </h3>
              </div>
              <span className="caption hidden !text-[14px] sm:inline">SESSION LOG</span>
            </div>
            <div className="mt-1 space-y-4 p-5">
              <Field className={FIELD_LG} label="选择模组" required hint="按 id 关联">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
                  <Input value={moduleQuery} onChange={(e) => setModuleQuery(e.target.value)} placeholder="筛选模组…" className={cx(CTRL, '!pl-9')} />
                </div>
                <Select required value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })} className={cx(CTRL, 'mt-2')}>
                  <option value="">请选择已收录的模组…</option>
                  {filteredModuleOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}{m.series ? `（${m.series}）` : ''} · {m.era}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field className={FIELD_LG} label="日期" required>
                  <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ colorScheme: 'dark' }} className={CTRL} />
                </Field>
                <Field className={FIELD_LG} label="用时(h)" required>
                  <Input required type="number" step="0.5" min="0.5" max="72" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="4.5" className={CTRL} />
                </Field>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between border-b border-line pb-2">
                  <span className="caption !text-[14px]">在车调查员 <span className="text-red-500">*</span></span>
                  <span className="font-mono text-[14px] tracking-wider text-slate-500 tabular">{form.investigators.length} 人</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {form.investigators.map((p) => (
                    <span key={p} className="flex items-center gap-1.5 border border-line-strong bg-paper px-2.5 py-1 text-[14px] text-slate-300">
                      {p}
                      <button type="button" onClick={() => removePlayer(p)} className="flex h-6 w-6 items-center justify-center text-slate-500 transition-colors hover:text-red-500"><X className="h-4 w-4" /></button>
                    </span>
                  ))}
                  {form.investigators.length === 0 && <span className="text-[14px] text-slate-500">还没有添加玩家</span>}
                </div>
                <div className="flex gap-2">
                  <Combobox
                    className="flex-1"
                    options={users.filter((u) => !form.investigators.includes(u.username)).map((u) => u.username)}
                    value={playerSearch}
                    onChange={setPlayerSearch}
                    onPick={(name) => addPlayer(name)}
                    maxLength={40}
                    placeholder="选人 / 输入名字后回车…"
                    emptyHint="没有匹配的账号，可直接输入名字后回车"
                  />
                  <Button variant="ghost" className="!px-3.5 !py-2 !text-[14px]" onClick={() => addPlayer(playerSearch)}>加入</Button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full !py-3 !text-[14px]">{busy ? '保存中…' : '保存执导记录'}</Button>
            </div>
          </form>

          <Panel className="flex h-full min-w-0 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-strong px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FOLIO 02</span>
                <h3 className="font-serif text-[18px] font-bold tracking-[0.02em] text-slate-100">近期详细带团记录</h3>
              </div>
              <Button
                variant="ghost"
                className="!px-3.5 !py-2 !text-[14px]"
                onClick={() => handlePreview('kp-history', { sessions, moduleStats, totalHours, modules })}
              >
                <ImageIcon className="h-4 w-4" /> 预览并导出长图
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-deep/40 px-5 py-2">
              <span className="font-kai text-[14px] tracking-[0.12em] text-slate-500">按日期倒序 · 墨迹即履历</span>
              <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500 tabular">共 {sessions.length} 条</span>
            </div>
            <div className="max-h-[620px] min-w-0 flex-1 overflow-auto">
              <table className="w-full min-w-[720px] whitespace-nowrap text-left text-[14.5px]">
                <thead className="sticky top-0 z-10 bg-ink">
                  <tr>
                    <th className={cx(TH, 'hidden w-12 sm:table-cell')}>No.</th>
                    <th className={TH}>日期</th>
                    <th className={TH}>剧本名</th>
                    <th className={TH}>时长</th>
                    <th className={TH}>玩家名单</th>
                    <th className={cx(TH, 'text-right')}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((s, i) => {
                    const m = modules.find((x) => x.id === s.moduleId);
                    return (
                      <tr key={s.id} className="border-t border-line transition-colors hover:bg-paper-deep/50">
                        <td className="hidden px-4 py-4 font-mono text-[14px] tracking-[0.12em] text-slate-500/70 sm:table-cell">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-4 py-4 font-mono text-[14px] text-slate-500 tabular">{s.date}</td>
                        <td className="px-4 py-4 font-serif text-[16px] font-semibold text-slate-100">{m?.title || '未知模组'}</td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-[14.5px] font-semibold text-emerald-600 tabular">{s.duration}h</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-[14px] text-slate-300 tabular">{s.playerCount}人</span>
                            <span className="max-w-[240px] truncate text-[14px] text-slate-500">{s.investigators}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button type="button" onClick={() => handleDeleteSession(s.id)} className="flex h-8 items-center justify-center border border-transparent px-2.5 text-[14px] text-slate-500 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.06] hover:text-red-600">删除</button>
                        </td>
                      </tr>
                    );
                  })}
                  {sessions.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-10 [&_p:last-child]:!text-[14.5px]"><EmptyState title="暂无任何跑团记录" desc="在左侧选定模组、日期与玩家，保存后即出现在这里。" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {kpTab === 'overview' && (
        <Panel className="overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-line-strong px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FOLIO 03</span>
              <h3 className="font-serif text-[18px] font-bold tracking-[0.02em] text-slate-100">系统全收录模组带团状态</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={overviewFilter} onChange={(e) => setOverviewFilter(e.target.value)} className="!w-auto !py-2 !text-[14.5px]">
                <option value="all">显示全部模组</option>
                <option value="unplayed">找出从未带过的模组</option>
                <option value="played">只看带过的模组</option>
              </Select>
              <Button
                variant="ghost"
                className="!px-3.5 !py-2 !text-[14px]"
                onClick={() => handlePreview('kp-all', { filteredOverviewModules, moduleStats, overviewFilter })}
              >
                <ImageIcon className="h-4 w-4" /> 导出盘点长图
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-deep/40 px-5 py-2">
            <span className="font-kai text-[14px] tracking-[0.12em] text-slate-500">馆藏清点 · 未盖“已带”印者即待开</span>
            <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500 tabular">共 {filteredOverviewModules.length} 部</span>
          </div>
          <div className="max-h-[700px] min-w-0 overflow-auto">
            <table className="w-full min-w-[720px] text-left text-[14.5px]">
              <thead className="sticky top-0 z-10 bg-ink">
                <tr>
                  <th className={cx(TH, 'hidden w-12 sm:table-cell')}>No.</th>
                  <th className={TH}>模组名称</th>
                  <th className={cx(TH, 'hidden sm:table-cell')}>地区与时代</th>
                  <th className={TH}>带团次数</th>
                  <th className={TH}>平均用时</th>
                  <th className={cx(TH, 'hidden sm:table-cell')}>历史累计用时</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverviewModules.map((m, i) => {
                  const stats = moduleStats[m.id] || { count: 0, totalDuration: 0 };
                  const isUnplayed = stats.count === 0;
                  return (
                    <tr key={m.id} className="border-t border-line transition-colors hover:bg-paper-deep/50">
                      <td className="hidden px-4 py-4 font-mono text-[14px] tracking-[0.12em] text-slate-500/70 sm:table-cell">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-4 font-serif text-[16px] font-semibold text-slate-100">{m.title}</td>
                      <td className="hidden px-4 py-4 text-[14px] text-slate-500 sm:table-cell">{m.region} · {m.era}</td>
                      <td className="px-4 py-4">
                        {isUnplayed ? (
                          <span className="stamp inline-flex !px-2 !py-0.5 !text-[14px] text-red-600/80">从未带过</span>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 text-right font-mono text-[14px] font-semibold text-emerald-700 tabular">{stats.count}</span>
                            <span className="h-[3px] w-16 bg-paper-deep" aria-hidden="true">
                              <span
                                className="block h-full bg-emerald-600"
                                style={{ width: `${Math.max(10, Math.round((stats.count / maxSessionCount) * 100))}%` }}
                              />
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[14px] text-slate-300 tabular">
                        {isUnplayed ? '—' : `${(stats.totalDuration / stats.count).toFixed(1)} h`}
                      </td>
                      <td className="hidden px-4 py-4 font-mono text-[14px] text-slate-500 tabular sm:table-cell">
                        {isUnplayed ? '—' : `${stats.totalDuration} h`}
                      </td>
                    </tr>
                  );
                })}
                {filteredOverviewModules.length === 0 && (
                  <tr><td colSpan="6" className="px-4 py-10 [&_p:last-child]:!text-[14.5px]"><EmptyState title="此分类下没有模组" desc="换个筛选条件再试，或先去发布一个模组。" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
