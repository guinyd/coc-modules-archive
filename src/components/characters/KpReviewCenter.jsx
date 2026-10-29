/**
 * KP 审卡中心：审核队列 + 批量辅助审卡 + 审卡规则设置 + 自定义职业模板。
 *
 * 视觉：v3「铅印案卷」的审阅台 —— 待审队列是左侧带书脊的案卷夹，
 * 批复是票据，批量结果与技能规则是印刷表格。所有状态、请求、回调与文案保持不变。
 *
 * 设计要点：
 *  - 审核状态与批复**不属于角色卡本体**，只存在 reviews 集合里，因此绝不会被打印导出。
 *  - 审卡规则全部**可选**：值为 0 / false 表示不启用该条检查；规则由服务端权威判定，
 *    前端只负责展示结论（防止有人改前端绕过）。
 *  - 批量审卡按当前规则一次性扫描，便于 KP 在开团前统一过一遍。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, CheckCircle, ClipboardCheck, Crown, Eye, GraduationCap, Plus, RefreshCw,
  Save, Scale, Shield, Trash2, Users, Wand2, X, XCircle,
} from 'lucide-react';
import {
  AUDIT_RULE_META, DEFAULT_AUDIT_RULES, REVIEW_LABEL, SKILLS, SKILL_BY_KEY,
  SOCIAL_SKILLS, STATUS_LABEL,
} from '../../../shared/coc7e.js';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../lib/api.js';
import { eduGrowthLabel, grantEduReroll } from '../../../shared/coc7e.js';
import EduQuickModal from './EduQuickModal.jsx';
import {
  Badge, Button, EmptyState, Field, Input, NumberInput, PageHeader, Panel, Tabs,
  Select, Textarea, Toggle, cx,
} from '../ui.jsx';

const TABS = [
  { key: 'queue', label: '待审核队列', icon: ClipboardCheck },
  { key: 'batch', label: '批量审卡', icon: Scale },
  { key: 'rules', label: '审卡规则', icon: Shield },
  { key: 'occupations', label: '职业模板', icon: Wand2 },
];

/** 案卷书脊：待审=朱砂，已通过=墨绿，已驳回=朱砂深，其余=靛青 */
const SPINE = {
  pending: 'bg-red-500',
  approved: 'bg-emerald-600',
  rejected: 'bg-red-700',
  none: 'bg-indigo',
};

const FINDING_DOT = {
  error: 'bg-red-500',
  warn: 'bg-amber-500',
  info: 'bg-cyan-500',
};

/** 规则提示：印在票据背面的细行，不再用彩色圆角胶囊 */
function Findings({ findings }) {
  if (!findings?.length) {
    return <p className="flex items-center gap-1.5 text-[16px] text-emerald-700"><CheckCircle className="h-4 w-4" />未发现问题</p>;
  }
  return (
    <ul className="border-t border-line">
      {findings.map((f, i) => (
        <li key={`${f.id}-${i}`} className="flex items-start gap-2 border-b border-line-soft py-2 text-[14px] leading-relaxed">
          <span aria-hidden="true" className={cx('mt-[7px] h-[5px] w-[5px] shrink-0', FINDING_DOT[f.level] || 'bg-slate-500')} />
          <span className="min-w-0 text-slate-500">
            <b className="font-semibold text-slate-200">{f.label}</b>：{f.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 小号方形操作按钮的统一类 */
const MINI = '!px-3 !py-1.5 !text-[14px]';

/** 状态/技能徽标：ui.Badge 基础字号 9.5px，审阅台统一放大到 11.5px */
const BADGE_LG = '!px-2 !py-[3px] !text-[14px] !tracking-[0.08em]';

/** 放大 ui.Field 的标签（9.5→12.5px）与提示（11→11.5px），只在本文件内使用 */
const FIELD_LG = '[&>span>span:first-child]:!text-[14px] [&>span>span:first-child]:!tracking-[0.12em] '
  + '[&>span>span+span]:!text-[14px] [&>span>span+span]:!leading-snug';

/** 职业模板抽屉内输入框统一 14.5px（ui 基础组件默认 text-base） */
const EDITOR_INPUT = '!text-[16px]';

// ------------------------------------------------------------------ 主组件
export default function KpReviewCenter({ currentUser, showToast, showConfirm, onOpenCharacter }) {
  const [tab, setTab] = useState('queue');

  return (
    <div className="space-y-6">
      <PageHeader
        tone="ochre"
        title="审卡中心"
        desc="集中处理玩家提交的角色卡：辅助规则审卡、批量核对与职业模板维护。审核状态与批复不会被打印导出。"
        actions={(
          <span className="stamp hidden !text-[14px] text-red-600 sm:inline-flex" aria-hidden="true">
            KP · REVIEW DESK
          </span>
        )}
      />
      <Tabs
        items={TABS.map((t) => ({ value: t.key, label: t.label, icon: t.icon }))}
        value={tab}
        onChange={setTab}
      />

      {tab === 'queue' && (
        <QueueTab showToast={showToast} showConfirm={showConfirm} onOpenCharacter={onOpenCharacter} currentUser={currentUser} />
      )}
      {tab === 'batch' && <BatchTab showToast={showToast} onOpenCharacter={onOpenCharacter} />}
      {tab === 'rules' && <RulesTab showToast={showToast} />}
      {tab === 'occupations' && <OccupationsTab showToast={showToast} showConfirm={showConfirm} currentUser={currentUser} />}
    </div>
  );
}

// ------------------------------------------------------------------ 审核队列
function QueueTab({ showToast, showConfirm, onOpenCharacter, currentUser }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [eduItem, setEduItem] = useState(null);
  const eduActor = currentUser?.username || '';

  /** 队列里一键授权重掷（不打开弹窗） */
  const quickGrantEdu = async (it) => {
    try {
      await apiPatch(`/api/characters/${it.id}`, { eduGrowth: grantEduReroll(it.eduGrowth, eduActor) });
      showToast(`已授权【${it.name}】重掷一次教育增强`);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/admin/reviews?status=${status}`);
      setItems(res.items || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  }, [status, showToast]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, verdict) => {
    setBusy(true);
    try {
      await apiPost(`/api/characters/${id}/review`, { verdict, comment });
      showToast(verdict === 'approved' ? '已通过' : '已驳回并附批复');
      setOpenId('');
      setComment('');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-3 px-5 py-3.5">
        <span className="caption mr-1 hidden !text-[14px] sm:inline">阅卷台 / QUEUE</span>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto !py-2 !text-[16px]">
          <option value="pending">待审核</option>
          <option value="rejected">已驳回</option>
          <option value="approved">已通过</option>
          <option value="none">未提交</option>
        </Select>
        <Button variant="ghost" className={MINI} onClick={load}>
          <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />刷新
        </Button>
        <span className="ml-auto border border-line-strong bg-paper px-2.5 py-1 font-mono text-[14px] tracking-[0.14em] text-slate-500 tabular">
          共 {items.length} 张
        </span>
      </Panel>

      <EduQuickModal
        open={Boolean(eduItem)}
        item={eduItem}
        showToast={showToast}
        onClose={() => setEduItem(null)}
        onSaved={() => load()}
      />

      {items.length === 0 ? (
        <Panel><EmptyState icon={ClipboardCheck} title="队列是空的" desc="玩家提交审核后，角色卡会出现在这里。" /></Panel>
      ) : (
        <div className="space-y-3.5">
          {items.map((it, idx) => (
            <article key={it.id} className="folder relative overflow-hidden">
              <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-[3px]', SPINE[it.reviewStatus] || SPINE.none)} />
              <div className="py-5 pl-5 pr-4 sm:py-6 sm:pl-7 sm:pr-6">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="font-mono text-[14px] tracking-[0.18em] text-slate-500">
                        CASE / {String(idx + 1).padStart(3, '0')}
                      </span>
                      <span aria-hidden="true" className="h-px w-5 bg-line-strong" />
                      <h3 className="font-serif text-[20px] font-bold leading-tight tracking-[0.01em] text-slate-100">{it.name}</h3>
                      <Badge className={BADGE_LG} tone={it.reviewStatus === 'pending' ? 'amber' : it.reviewStatus === 'approved' ? 'emerald' : 'red'}>
                        {REVIEW_LABEL[it.reviewStatus] || it.reviewStatus}
                      </Badge>
                      <Badge className={BADGE_LG} tone="slate">{STATUS_LABEL[it.status] || it.status}</Badge>
                      {it.legendary?.enabled ? <Badge className={BADGE_LG} tone="red">传奇 +{it.legendaryBonusTotal || 0}</Badge> : null}
                      {it.agePenaltyWaived ? <Badge className={BADGE_LG} tone="emerald">免年龄减益</Badge> : null}
                    </div>

                    <dl className="mt-4 grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6">
                      {[
                        ['申报人', it.ownerName],
                        ['职业', it.occupationName],
                        ['年龄', `${it.age} 岁`],
                        ['HP', it.hp],
                        ['SAN', it.san],
                        ['MOV', it.mov],
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0 bg-paper px-3.5 py-2.5">
                          <dt className="text-[14px] font-semibold tracking-[0.14em] text-slate-500">{label}</dt>
                          <dd className="mt-1 truncate font-mono text-[16px] font-semibold text-slate-200 tabular">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                      {it.eduGrowth?.settled ? (
                        <span className={cx('flex items-center gap-1.5', (it.eduGrowth.rerolls || 0) > 0 ? 'text-amber-500' : 'text-slate-400')}>
                          <GraduationCap className="h-4 w-4" />教育 +{it.eduGrowth.gain}
                          （{eduGrowthLabel(it.eduGrowth)}）
                          {(it.eduGrowth.rerolls || 0) > 0 ? ` · 重掷 ${it.eduGrowth.rerolls} 次` : ''}
                          {(it.eduGrowth.granted || 0) > 0 ? `· 已授权 ${it.eduGrowth.granted} 次` : ''}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-500"><GraduationCap className="h-4 w-4" />教育未结算</span>
                      )}
                      <span className="ml-auto flex items-center gap-1.5">
                        <span aria-hidden="true" className={cx('h-[5px] w-[5px]', it.warningCount ? 'bg-amber-500' : 'bg-emerald-600')} />
                        <span className={it.warningCount ? 'text-amber-500' : 'text-slate-500'}>
                          {it.warningCount ? `${it.warningCount} 项规则提示` : '规则校验通过'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-line pt-4">
                  <span className="caption mr-auto hidden !text-[14px] sm:inline">批注 / VERDICT</span>
                  {it.eduGrowth ? (
                    <>
                      <Button
                        variant={(it.eduGrowth.granted || 0) > 0 ? 'amber' : 'ghost'}
                        className={MINI}
                        title="查看教育增强流水，授权重掷或重置"
                        onClick={() => setEduItem({ ...it, __actor: eduActor })}
                      >
                        <GraduationCap className="h-4 w-4" />教育
                      </Button>
                      {it.eduGrowth.settled && (it.eduGrowth.granted || 0) <= 0 ? (
                        <Button variant="ghost" className={MINI} title="直接授权一次重掷" onClick={() => quickGrantEdu(it)}>
                          <Crown className="h-4 w-4" />授权重掷
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                  <Button variant="ghost" className={MINI} onClick={() => onOpenCharacter?.(it.id, true)}>
                    <Eye className="h-4 w-4" />打开核对
                  </Button>
                  {it.reviewStatus === 'pending' ? (
                    <>
                      <Button
                        variant="ghost"
                        className={cx(MINI, '!border-emerald-700 !bg-paper-raised !text-emerald-700 hover:!border-emerald-700 hover:!bg-emerald-700 hover:!text-paper-raised')}
                        onClick={() => showConfirm(`直接通过【${it.name}】？`, () => review(it.id, 'approved'), {
                          detail: '通过后批复会被清空，只记录审核人与时间。', danger: false,
                        })}
                        disabled={busy}
                      >
                        <CheckCircle className="h-4 w-4" />通过
                      </Button>
                      <Button
                        variant="ghost"
                        className={cx(MINI, '!border-red-500 !bg-paper-raised !text-red-600 hover:!border-red-600 hover:!bg-red-500 hover:!text-paper-raised')}
                        onClick={() => { setOpenId(openId === it.id ? '' : it.id); setComment(''); }}
                      >
                        <XCircle className="h-4 w-4" />驳回
                      </Button>
                    </>
                  ) : null}
                </div>

                {openId === it.id ? (
                  <div className="mt-4 border-t border-line-strong pt-4">
                    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-line pb-2">
                      <span className="caption !text-[14px]">批复单 / MARGIN NOTE</span>
                      <span className="font-kai text-[14px] tracking-[0.06em] text-slate-500">随卡退回，不归档</span>
                    </div>
                    <Field className={FIELD_LG} label="批复说明" hint="会展示给玩家，但不写入角色卡、不打印">
                      <Textarea rows={2} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="例：技能点超了 20，请重新分配" />
                    </Field>
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                      <Button variant="danger" onClick={() => review(it.id, 'rejected')} disabled={busy || !comment.trim()}>
                        <XCircle className="w-4 h-4" />确认驳回并发送批复
                      </Button>
                      <Button variant="ghost" onClick={() => setOpenId('')}>取消</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 批量审卡
function BatchTab({ showToast, onOpenCharacter }) {
  const [scope, setScope] = useState('pending');
  const [owners, setOwners] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    apiGet('/api/characters/meta')
      .then((m) => setOwners(m.owners || []))
      .catch(() => { /* ignore */ });
  }, []);

  // 手动勾选模式需要先拿到全站角色卡列表
  useEffect(() => {
    if (scope !== 'manual') return;
    apiGet('/api/characters?scope=all')
      .then((res) => setAllCards(res.items || []))
      .catch((err) => showToast(err.message, 'error'));
  }, [scope, showToast]);

  const run = async () => {
    setBusy(true);
    try {
      const ids = [...selected];
      const res = await apiPost('/api/admin/audit/batch', scope === 'manual'
        ? { scope: 'manual', characterIds: ids }
        : { scope, ownerId, status });
      setResult(res);
      showToast(`已审核 ${res.total} 张：合规 ${res.passed}，不合规 ${res.failed}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAllPassed = () => setSelected(new Set((result?.items || []).filter((r) => r.passed).map((r) => r.characterId)));
  const selectAllFailed = () => setSelected(new Set((result?.items || []).filter((r) => !r.passed).map((r) => r.characterId)));
  const selectNone = () => setSelected(new Set());

  /** 审完之后按需给选中的卡打上「已通过」标签 */
  const approveSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return showToast('请先勾选要标记为通过的卡片', 'error');
    setApproving(true);
    try {
      const res = await apiPost('/api/admin/reviews/batch', { characterIds: ids, verdict: 'approved' });
      showToast(`已标记 ${res.reviewed} 张为审核通过${res.skipped?.length ? `，跳过 ${res.skipped.length} 张` : ''}`);
      setSelected(new Set());
      setResult((prev) => (prev ? {
        ...prev,
        items: prev.items.map((r) => (ids.includes(r.characterId) ? { ...r, reviewStatus: 'approved' } : r)),
      } : prev));
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setApproving(false); }
  };

  const summaryItems = [
    { label: '总计', value: result?.total, tone: 'text-slate-100' },
    { label: '合规', value: result?.passed, tone: 'text-emerald-700' },
    { label: '不合规', value: result?.failed, tone: 'text-red-600' },
  ];

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FORM 02</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Scale className="h-4 w-4 text-amber-500" strokeWidth={1.7} />批量辅助审卡
            </h3>
          </div>
          <span className="caption">BATCH AUDIT</span>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-[16px] leading-relaxed text-slate-500">
            按「审卡规则」标签页里启用的规则，一次性扫描多张角色卡。规则未启用的检查项不会产生任何判定。
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field className={FIELD_LG} label="审查范围">
              <Select value={scope} onChange={(e) => { setScope(e.target.value); setSelected(new Set()); setResult(null); }}>
                <option value="pending">仅待审核的卡</option>
                <option value="all">全部角色卡</option>
                <option value="owner">指定玩家的卡</option>
                <option value="manual">手动勾选…</option>
              </Select>
            </Field>
            {scope === 'owner' ? (
              <Field className={FIELD_LG} label="玩家">
                <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                  <option value="">请选择…</option>
                  {owners.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                </Select>
              </Field>
            ) : null}
            <Field className={FIELD_LG} label="生涯状态筛选">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">不限</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          </div>
          {scope === 'manual' ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3 border-b border-line pb-2 text-[14px]">
                <span className="text-slate-500">共 {allCards.length} 张，已勾选 <b className="font-mono text-amber-500">{selected.size}</b> 张</span>
                <button type="button" className="text-emerald-700 underline decoration-emerald-700/40 underline-offset-4 hover:text-emerald-600" onClick={() => setSelected(new Set(allCards.map((c) => c.id)))}>全选</button>
                <button type="button" className="text-slate-500 underline decoration-line-strong underline-offset-4 hover:text-slate-100" onClick={selectNone}>清空</button>
              </div>
              <div className="max-h-72 overflow-y-auto border border-line-strong bg-paper-raised">
                {allCards.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 border-b border-line-soft px-3.5 py-3 transition-colors hover:bg-paper-deep/60">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 shrink-0 accent-amber-500"
                    />
                    <span className="min-w-0 font-serif text-[16px] font-semibold leading-snug text-slate-100">{c.name}</span>
                    <span className="min-w-0 text-[14px] leading-snug text-slate-500">{c.ownerName} · {c.occupationName} · {REVIEW_LABEL[c.reviewStatus] || c.reviewStatus}</span>
                  </label>
                ))}
                {allCards.length === 0 && <p className="p-4 text-[16px] text-slate-500">暂无角色卡</p>}
              </div>
            </div>
          ) : null}

          <Button onClick={run} disabled={busy || (scope === 'manual' && selected.size === 0)}>
            <Scale className="w-4 h-4" />{busy ? '审核中…' : '开始批量审卡'}
          </Button>
        </div>
      </Panel>

      {result ? (
        <>
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
              <span className="caption !text-[14px]">审核结果 / AUDIT RETURN</span>
              <span className="font-kai text-[14px] tracking-[0.06em] text-slate-500">三栏核对 · 盖印即生效</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-line">
              {summaryItems.map((s) => (
                <div key={s.label} className="bg-paper-raised px-5 py-5">
                  <div className="text-[14px] font-semibold tracking-[0.16em] text-slate-500">{s.label}</div>
                  <div className={cx('mt-1.5 font-serif text-[32px] font-bold leading-none tabular', s.tone)}>{s.value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
                <span className="caption !text-[14px]">勾选</span>
                <span className="text-slate-400">已勾选 <b className="font-mono text-amber-500">{selected.size}</b> 张</span>
                <button type="button" className="text-emerald-700 underline decoration-emerald-700/40 underline-offset-4 hover:text-emerald-600" onClick={selectAllPassed}>选中全部合规</button>
                <button type="button" className="text-red-600 underline decoration-red-500/40 underline-offset-4 hover:text-red-500" onClick={selectAllFailed}>选中全部不合规</button>
                <button type="button" className="text-slate-500 underline decoration-line-strong underline-offset-4 hover:text-slate-100" onClick={selectNone}>清空</button>
              </div>
              <Button onClick={approveSelected} disabled={approving || selected.size === 0}>
                <CheckCircle className="w-4 h-4" />{approving ? '标记中…' : `给勾选的 ${selected.size} 张打上「已通过」`}
              </Button>
            </div>
            <p className="mt-2.5 border-t border-line pt-2.5 text-[14px] leading-relaxed text-slate-500">
              提示：批量标记只写审核状态与审核人，不写批复（通过的卡本来就不留批复）。
            </p>
          </Panel>

          <div className="space-y-3">
            {result.items.map((r) => (
              <article key={r.characterId} className="relative overflow-hidden border border-line-strong bg-paper-raised">
                <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-[3px]', r.passed ? 'bg-emerald-600' : 'bg-red-500')} />
                <div className="px-5 py-4 pl-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.characterId)}
                        onChange={() => toggle(r.characterId)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="font-serif text-[16px] font-bold leading-snug text-slate-100">{r.name}</span>
                      <span className="text-[14px] text-slate-500">{r.ownerName}</span>
                      <Badge className={BADGE_LG} tone={r.passed ? 'emerald' : 'red'}>{r.passed ? '合规' : '不合规'}</Badge>
                      <Badge className={BADGE_LG} tone="slate">{REVIEW_LABEL[r.reviewStatus] || r.reviewStatus}</Badge>
                      {r.stats?.legendary ? (
                        <Badge className={BADGE_LG} tone="cyan">传奇 +{r.stats.legendaryBonusTotal || 0}</Badge>
                      ) : null}
                      {r.stats?.agePenaltyWaived ? <Badge className={BADGE_LG} tone="emerald">豁免年龄减益</Badge> : null}
                      <span className={cx('font-mono text-[14px] tabular', r.stats?.eduSettled ? 'text-slate-500' : 'text-amber-500')}>
                        教育增强 {r.stats?.eduSettled
                          ? `+${r.stats.eduBonus}${r.stats.eduManual ? '（手动录入）' : `（检定 ${r.stats.eduCount} 次）`}`
                          : '未结算'}
                      </span>
                    </div>
                    <Button variant="ghost" className={MINI} onClick={() => onOpenCharacter?.(r.characterId, true)}>
                      <Eye className="w-3.5 h-3.5" />打开
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Findings findings={r.findings} />
                  </div>
                </div>
              </article>
            ))}
            {result.items.length === 0 && <Panel><EmptyState title="没有符合条件的角色卡" /></Panel>}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ 审卡规则
function RulesTab({ showToast }) {
  const [rules, setRules] = useState(DEFAULT_AUDIT_RULES);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/admin/audit-rules');
      setRules({ ...DEFAULT_AUDIT_RULES, ...(res.rules || {}) });
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await apiPut('/api/admin/audit-rules', rules);
      setRules({ ...DEFAULT_AUDIT_RULES, ...res.rules });
      showToast('审卡规则已保存');
    } catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };

  const numbers = AUDIT_RULE_META.filter((m) => m.type === 'number');
  const booleans = AUDIT_RULE_META.filter((m) => m.type === 'boolean');

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">RULEBOOK 01</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Shield className="h-4 w-4 text-amber-500" strokeWidth={1.7} />辅助审卡规则
            </h3>
          </div>
          <Button variant="ghost" className={MINI} onClick={load}><RefreshCw className={cx('w-3.5 h-3.5', loading && 'animate-spin')} />重新读取</Button>
        </div>
        <div className="space-y-5 p-5">
          <p className="text-[16px] leading-relaxed text-slate-500">
            所有规则都是<b className="text-slate-300">可选</b>的：数字填 0、开关关掉即表示不检查这一条。规则由服务端判定，玩家端改不了。
          </p>

          <Toggle
            checked={Boolean(rules.enabled)}
            onChange={(v) => setRules({ ...rules, enabled: v })}
            label="启用规则审卡"
            hint="关闭后批量审卡仍可运行，但只会用「职业公式预算」这类内置底线，不套用下面的自定义阈值"
          />

          <div>
            <div className="mb-3 flex items-baseline justify-between border-b border-line pb-1.5">
              <h4 className="font-serif text-[16px] font-bold text-slate-100">数值阈值</h4>
              <span className="caption !text-[14px]">THRESHOLDS</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {numbers.map((m) => (
                <Field key={m.key} className={FIELD_LG} label={m.label} hint={m.hint}>
                  <NumberInput
                    min={0}
                    max={m.key === 'minPointUsage' ? 1 : 10000}
                    value={rules[m.key]}
                    onChange={(v) => setRules({ ...rules, [m.key]: v === '' ? 0 : v })}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between border-b border-line pb-1.5">
              <h4 className="font-serif text-[16px] font-bold text-slate-100">开关项</h4>
              <span className="caption !text-[14px]">TOGGLES</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {booleans.map((m) => (
                <Toggle
                  key={m.key}
                  checked={Boolean(rules[m.key])}
                  onChange={(v) => setRules({ ...rules, [m.key]: v })}
                  label={m.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t border-line pt-4">
            <Button onClick={save} disabled={busy}><Save className="w-4 h-4" />{busy ? '保存中…' : '保存规则'}</Button>
            <Button variant="ghost" onClick={() => setRules(DEFAULT_AUDIT_RULES)}>恢复默认</Button>
          </div>
        </div>
      </Panel>

      <section className="border-l-2 border-ink bg-paper-deep/30 py-4 pl-4 pr-5" aria-label="规则说明与建议">
        <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-line pb-2">
          <p className="font-serif text-[16px] font-bold text-slate-200">规则说明与建议</p>
          <span className="caption !text-[14px]">MARGINALIA</span>
        </div>
        <div className="space-y-2 text-[14px] leading-relaxed text-slate-500">
          <p>· <b className="text-slate-300">属性上限 / 下限 / 总和上限</b>用来卡"六边形战士"：常规 1920s 调查员八项属性合计多在 450-650。</p>
          <p>· <b className="text-slate-300">职业/兴趣技能成功率上限</b>建议 70-80：初始就 90% 的侦查会让模组失去悬念；两项分开设，可以允许兴趣技能堆得更高或更低。</p>
          <p>· <b className="text-slate-300">禁止混点</b>是核心一致性检查：职业点只能投本职技能，兴趣点才是不限的（点数总量本身已由职业公式与智力×2 兜底）。</p>
          <p>· <b className="text-slate-300">职业点最低使用率</b>能揪出"懒得分配"的卡（例如低于 0.8 就提醒）。</p>
          <p>· 自定义技能、关闭年龄补正这类情况只做 info 提示，最终仍由你判断。</p>
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ 职业模板
function OccupationsTab({ showToast, showConfirm, currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/admin/occupations');
      setItems(res.items || []);
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const remove = (occ) => showConfirm(`删除职业模板【${occ.name}】？`, async () => {
    try {
      const res = await apiDelete(`/api/admin/occupations/${occ.id}`);
      showToast(res.affectedCharacters
        ? `已删除；有 ${res.affectedCharacters} 张角色卡仍引用该模板，请提醒玩家改职业`
        : '已删除');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  });

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FORM 03</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Wand2 className="h-4 w-4 text-amber-500" strokeWidth={1.7} />自定义职业模板
            </h3>
            <span className="border border-line-strong bg-paper px-2 py-0.5 font-mono text-[14px] tracking-[0.12em] text-slate-500 tabular">{items.length} 项</span>
          </div>
          <Button className="!text-[14.5px]" onClick={() => setEditing(blankTemplate())}><Plus className="w-4 h-4" />新建职业模板</Button>
        </div>

        <div className="p-5">
          <p className="mb-5 text-[16px] leading-relaxed text-slate-500">
            规则书没有、或本桌特有的职业：自己勾选本职技能、设定信用评级区间与技能点算法，玩家车卡时能直接选。
          </p>

          {items.length === 0 ? (
            <EmptyState icon={Wand2} title={loading ? '载入中…' : '还没有自定义职业'} desc="例如「深潜者信徒」「业余神秘学家」这类房规职业。" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((o) => (
                <article key={o.id} className="folder relative overflow-hidden">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-indigo" />
                  <div className="space-y-3 py-4 pl-5 pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-serif text-[16.5px] font-bold leading-snug text-slate-100">{o.name}</div>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[14px] tracking-[0.06em] text-slate-500 tabular">
                          <span>信用评级 {o.cr[0]}-{o.cr[1]}</span>
                          <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
                          <span>{o.attr}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setEditing({ ...o, crMin: o.cr[0], crMax: o.cr[1] })} className="border border-transparent p-2 text-slate-500 transition-colors hover:border-line-strong hover:bg-paper-deep hover:text-emerald-700">
                          <Wand2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => remove(o)} className="border border-transparent p-2 text-slate-500 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.05] hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                      {o.keys.slice(0, 8).map((k) => (
                        <span key={k} className="border border-line-strong bg-paper px-2 py-1 text-[14px] leading-none tracking-wide text-slate-400">
                          {SKILL_BY_KEY[k]?.name || k}
                        </span>
                      ))}
                      {o.free ? <span className="border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[14px] leading-none tracking-wide text-cyan-600">任意 ×{o.free}</span> : null}
                      {o.social ? <span className="border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[14px] leading-none tracking-wide text-cyan-600">社交 ×{o.social}</span> : null}
                    </div>
                    <div className="font-kai text-[14px] tracking-[0.06em] text-slate-500">{o.createdByName} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {editing ? (
        <TemplateEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          showToast={showToast}
          currentUser={currentUser}
        />
      ) : null}
    </div>
  );
}

function blankTemplate() {
  return {
    id: '', name: '', crMin: 0, crMax: 99, attr: '教育×4',
    pts: { terms: [{ stat: 'EDU', mult: 4 }], max: [] },
    keys: [], customKeys: [], choices: [], social: 0, free: 0, desc: '',
  };
}

const STAT_OPTIONS = [
  ['EDU', '教育'], ['INT', '智力'], ['STR', '力量'], ['DEX', '敏捷'],
  ['APP', '外貌'], ['POW', '意志'], ['CON', '体质'], ['SIZ', '体型'],
];

/** 职业模板编辑器里的字段：标签 12.5px、提示 11px，输入控件由调用方放大到 14.5px */
function DrawerField({ label, hint, required, className, children }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-[14px] font-semibold tracking-[0.12em] text-slate-400">
          {label}
          {required ? <span className="ml-1 text-vermilion" aria-hidden="true">*</span> : null}
        </span>
        {hint ? <span className="text-[14px] leading-snug text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** 职业模板编辑器：勾选本职技能 + 组合技能点公式（右侧抽屉，避免宽表被裁切） */
function TemplateEditor({ value, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(() => ({ ...blankTemplate(), ...value, customKeys: value.customKeys || [] }));
  const [q, setQ] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [busy, setBusy] = useState(false);

  // 抽屉打开时锁定页面滚动；Esc 关闭；卸载时完整恢复
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const addCustomKey = (raw) => {
    const name = String(raw || '').trim().slice(0, 24);
    if (!name) return;
    if (SKILL_BY_KEY[name] || SKILLS.some((s) => s.name === name)) {
      return showToast('这是内置技能，直接在上面勾选即可', 'error');
    }
    if ((form.customKeys || []).includes(name)) return showToast('已经加过了', 'error');
    if ((form.customKeys || []).length >= 20) return showToast('自定义技能最多 20 项', 'error');
    setForm((prev) => ({ ...prev, customKeys: [...(prev.customKeys || []), name] }));
    setCustomKey('');
  };

  const removeCustomKey = (name) => setForm((prev) => ({
    ...prev, customKeys: (prev.customKeys || []).filter((k) => k !== name),
  }));

  const skills = useMemo(
    () => SKILLS.filter((s) => !q.trim() || s.name.includes(q.trim())),
    [q],
  );

  const toggleKey = (key) => {
    setForm((prev) => ({
      ...prev,
      keys: prev.keys.includes(key) ? prev.keys.filter((k) => k !== key) : [...prev.keys, key],
    }));
  };

  // 搜索同时匹配内置技能名与已添加的自定义技能名
  const matchedCustom = (form.customKeys || []).filter((k) => !q.trim() || k.includes(q.trim()));

  const setTerm = (idx, field, v) => {
    setForm((prev) => {
      const terms = prev.pts.terms.map((t, i) => (i === idx ? { ...t, [field]: v } : t));
      return { ...prev, pts: { ...prev.pts, terms } };
    });
  };

  const addTerm = () => setForm((prev) => ({ ...prev, pts: { ...prev.pts, terms: [...prev.pts.terms, { stat: 'EDU', mult: 2 }] } }));
  const removeTerm = (idx) => setForm((prev) => ({ ...prev, pts: { ...prev.pts, terms: prev.pts.terms.filter((_, i) => i !== idx) } }));
  const toggleMax = (stat) => setForm((prev) => {
    const has = prev.pts.max.some((t) => t.stat === stat);
    return {
      ...prev,
      pts: {
        ...prev.pts,
        max: has ? prev.pts.max.filter((t) => t.stat !== stat) : [...prev.pts.max, { stat, mult: 2 }],
      },
    };
  });

  const save = async () => {
    if (!form.name.trim()) return showToast('请填写职业名称', 'error');
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        crMin: form.crMin,
        crMax: form.crMax,
        attr: form.attr,
        pts: { terms: form.pts.terms, max: form.pts.max },
        keys: form.keys,
        customKeys: form.customKeys || [],
        choices: form.choices,
        social: form.social,
        free: form.free,
        desc: form.desc,
      };
      if (form.id) await apiPut(`/api/admin/occupations/${form.id}`, payload);
      else await apiPost('/api/admin/occupations', payload);
      showToast('职业模板已保存');
      onSaved?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const formulaText = [
    ...form.pts.terms.map((t) => `${STAT_OPTIONS.find((s) => s[0] === t.stat)?.[1] || t.stat}×${t.mult}`),
    form.pts.max.length
      ? `取大（${form.pts.max.map((t) => `${STAT_OPTIONS.find((s) => s[0] === t.stat)?.[1] || t.stat}×${t.mult}`).join(' / ')}）`
      : '',
  ].filter(Boolean).join(' ＋ ');

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex p-0 md:items-stretch md:justify-end md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={form.id ? `编辑职业模板：${form.name}` : '新建职业模板'}
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="drawer-sheet relative z-10 mx-auto flex h-full w-full flex-col border border-line-strong bg-paper-raised shadow-[0_30px_90px_-34px_rgba(0,0,0,.72)] animate-in slide-in-from-right duration-300 md:shadow-[0_34px_90px_-40px_rgba(0,0,0,.74)]">
        <header className="sticky top-0 z-20 flex shrink-0 items-start gap-4 border-b border-line-strong bg-paper-raised px-5 py-4 sm:px-7">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FORM 03 / OCCUPATION</span>
              <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500">{form.id ? 'REVISE' : 'NEW'}</span>
            </div>
            <h2 className="mt-1 break-words font-serif text-[22px] font-bold leading-tight tracking-[0.01em] text-slate-100">
              {form.id ? `编辑职业模板：${form.name}` : '新建职业模板'}
            </h2>
            <p className="mt-1 text-[16px] leading-relaxed text-slate-500">保存后会立即出现在玩家车卡的职业选择里。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭职业模板编辑器"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong bg-paper text-slate-500 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40"
          >
            <X className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DrawerField className="sm:col-span-2" label="职业名称" required>
              <Input
                className={EDITOR_INPUT}
                maxLength={24}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：深潜者信徒"
              />
            </DrawerField>

            <DrawerField label="信用评级下限" hint="0–99">
              <NumberInput
                className={EDITOR_INPUT}
                min={0}
                max={99}
                value={form.crMin}
                onChange={(v) => setForm({ ...form, crMin: v === '' ? 0 : v })}
              />
            </DrawerField>
            <DrawerField label="信用评级上限" hint="0–99">
              <NumberInput
                className={EDITOR_INPUT}
                min={0}
                max={99}
                value={form.crMax}
                onChange={(v) => setForm({ ...form, crMax: v === '' ? 99 : v })}
              />
            </DrawerField>

            <DrawerField className="sm:col-span-2" label="技能点公式" hint={`当前：${formulaText || '（未设置）'}`}>
              <div className="min-w-0 space-y-2.5 border border-line-strong bg-paper p-3.5">
                {form.pts.terms.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2.5">
                    <Select
                      value={t.stat}
                      onChange={(e) => setTerm(i, 'stat', e.target.value)}
                      className="!w-[8.5rem] min-w-0 !py-2.5 !text-[14px]"
                    >
                      {STAT_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </Select>
                    <span className="font-mono text-[14px] text-slate-500">×</span>
                    <NumberInput
                      min={1}
                      max={10}
                      value={t.mult}
                      onChange={(v) => setTerm(i, 'mult', v === '' ? 1 : v)}
                      className="!w-[5.5rem] !py-2.5 !text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeTerm(i)}
                      aria-label="删除这一项"
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-slate-500 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.05] hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" className="!py-2 !text-[14px]" onClick={addTerm}>
                  <Plus className="w-4 h-4" />加一项
                </Button>
              </div>
            </DrawerField>

            <DrawerField
              className="sm:col-span-2"
              label="取大项（可选）"
              hint="勾选的属性按 ×2 计算后取最大值，再与上面的项相加（对应「教育×2＋力量或敏捷×2」这类公式）"
            >
              <div className="flex min-w-0 flex-wrap gap-2">
                {STAT_OPTIONS.map(([k, label]) => {
                  const on = form.pts.max.some((t) => t.stat === k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleMax(k)}
                      className={cx('border px-3.5 py-2 text-[14px] font-semibold transition-colors',
                        on ? 'border-amber-600 bg-amber-600 text-paper-raised' : 'border-line-strong bg-paper-raised text-slate-400 hover:border-amber-600/60')}
                    >
                      {label}×2
                    </button>
                  );
                })}
              </div>
            </DrawerField>

            <DrawerField className="sm:col-span-2" label="点法说明" hint="显示给玩家看的一句话，例如「教育×4」">
              <Input
                className={EDITOR_INPUT}
                maxLength={40}
                value={form.attr}
                onChange={(e) => setForm({ ...form, attr: e.target.value })}
              />
            </DrawerField>

            <div className="grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2">
              <DrawerField label="任选社交技能槽位">
                <NumberInput
                  className={EDITOR_INPUT}
                  min={0}
                  max={6}
                  value={form.social}
                  onChange={(v) => setForm({ ...form, social: v === '' ? 0 : v })}
                />
              </DrawerField>
              <DrawerField label="任意特长槽位">
                <NumberInput
                  className={EDITOR_INPUT}
                  min={0}
                  max={8}
                  value={form.free}
                  onChange={(v) => setForm({ ...form, free: v === '' ? 0 : v })}
                />
              </DrawerField>
            </div>

            <DrawerField className="sm:col-span-2" label="一句话简介">
              <Textarea
                className={EDITOR_INPUT}
                rows={2}
                maxLength={200}
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
              />
            </DrawerField>

            <DrawerField
              className="sm:col-span-2"
              label={`本职技能（内置已选 ${form.keys.length} · 自定义 ${(form.customKeys || []).length}）`}
              hint="玩家在这些技能上可以用职业点提升"
            >
              <div className="min-w-0 space-y-2.5">
                <Input
                  className={EDITOR_INPUT}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索内置技能…"
                />
                <div className="flex max-h-48 min-w-0 flex-wrap content-start gap-2 overflow-y-auto overflow-x-hidden border border-line-strong bg-paper p-3.5">
                  {skills.map((s) => {
                    const on = form.keys.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleKey(s.key)}
                        className={cx('max-w-full break-words border px-2.5 py-1.5 text-[14px] font-semibold leading-snug transition-colors',
                          on ? 'border-emerald-700 bg-emerald-700 text-paper-raised' : 'border-line-strong bg-paper-raised text-slate-400 hover:border-emerald-700/60')}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {matchedCustom.map((name) => (
                    <span
                      key={name}
                      className="flex max-w-full items-center gap-1.5 break-words border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-1.5 text-[14px] font-semibold leading-snug text-cyan-600"
                    >
                      {name}
                      <button type="button" onClick={() => removeCustomKey(name)} aria-label={`移除自定义技能 ${name}`} className="shrink-0 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && matchedCustom.length === 0 && (
                    <span className="text-[14px] text-slate-500">没有匹配的技能</span>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    className={cx(EDITOR_INPUT, 'min-w-0 flex-1')}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomKey(customKey); } }}
                    maxLength={24}
                    placeholder="规则书没有的技能名，例如：驾驶（坦克）"
                  />
                  <Button variant="ghost" className="!shrink-0 !py-2.5 !text-[14px]" onClick={() => addCustomKey(customKey)} disabled={!customKey.trim()}>
                    <Plus className="w-4 h-4" />添加
                  </Button>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-500">
                  提示：加进来的自定义技能会自动成为该职业的本职技能；玩家车卡时在「自定义技能」里填同名即可用职业点提升。
                  社交技能组当前为 {SOCIAL_SKILLS.map((k) => SKILL_BY_KEY[k]?.name).join('、')}；信用评级会自动对所有职业开放。
                </p>
              </div>
            </DrawerField>
          </div>
        </div>

        <footer className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line-strong bg-paper-raised px-5 py-3.5 sm:px-7">
          <p className="hidden font-kai text-[14px] tracking-[0.06em] text-slate-500 sm:block">Esc 关闭 · 保存后立即生效</p>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <Button variant="ghost" className="!px-4 !py-2.5 !text-[14px]" onClick={onClose} disabled={busy}>取消</Button>
            <Button className="!px-5 !py-2.5 !text-[14px]" onClick={save} disabled={busy}>
              <Save className="w-4 h-4" />{busy ? '保存中…' : '保存模板'}
            </Button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
