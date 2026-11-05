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
  AlertTriangle, CheckCircle, ClipboardCheck, Copy, Crown, Eye, GraduationCap, Plus, RefreshCw,
  Power, RotateCcw, Save, Scale, Shield, Trash2, Users, Wand2, X, XCircle,
} from 'lucide-react';
import {
  ALL_CHARS, AUDIT_RULE_META, CHAR_LABEL, DEFAULT_AUDIT_RULES, REVIEW_LABEL, SKILLS, SKILL_BY_KEY,
  SOCIAL_SKILLS, STATUS_LABEL, houseRuleSummary,
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
      {tab === 'rules' && <RulesTab showToast={showToast} showConfirm={showConfirm} currentUser={currentUser} />}
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
      <Panel className="px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
        <p className="mt-2.5 border-t border-line-soft pt-2 font-kai text-[14px] leading-relaxed tracking-[0.06em] text-slate-500">
          {currentUser?.kpRank === 'chief'
            ? '全站角色卡审核队列：任何玩家提交的角色卡都会出现在这里，由你统一复核。'
            : '只显示玩家指定发给你的角色卡：未指定给你的角色卡由首席守秘人或其他守秘人处理。'}
        </p>
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
                      {it.customSkillCount > 0 ? <Badge className={BADGE_LG} tone="cyan">自建技能 {it.customSkillCount}</Badge> : null}
                      {it.reviewTarget?.kpName ? (
                        <Badge className={BADGE_LG} tone="amber">指定：{it.reviewTarget.kpName}</Badge>
                      ) : null}
                      {it.ruleSet?.name ? (
                        <Badge className={BADGE_LG} tone="indigo">规则：{it.ruleSet.name}</Badge>
                      ) : null}
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
const HOUSE_TYPES = [
  { key: 'deriveBase', label: '技能基础值（改变车卡数值）' },
  { key: 'requireAttr', label: '属性门槛（审卡要求）' },
  { key: 'requireSkill', label: '技能门槛（审卡要求）' },
];

const blankDraft = () => ({
  type: 'deriveBase', skill: 'charm',
  source: 'attr', from: 'APP', op: 'div', value: 2, adjust: 0,
  attr: 'INT', min: 60, max: 0, mode: 'any', skills: [''], count: 2,
});

/** 房规 → 一句人话（与车卡页共用同一份文案） */
const houseRuleText = houseRuleSummary;

function ruleTypeLabel(type) {
  return HOUSE_TYPES.find((t) => t.key === type)?.label || type;
}

/** 房规 + 审卡规则同一页：规则集切换、规则编辑、自定义规则编辑 */
function RulesTab({ showToast, showConfirm, currentUser }) {
  const isChief = currentUser?.kpRank === 'chief';
  const [rules, setRules] = useState(DEFAULT_AUDIT_RULES);
  const [sets, setSets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [setName, setSetName] = useState('');
  const [houseRules, setHouseRules] = useState([]);
  const [draftData, setDraftData] = useState({ rules: DEFAULT_AUDIT_RULES, houseRules: [] });
  const [draft, setDraft] = useState(blankDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => sets.find((s) => s.id === selectedId) || null, [sets, selectedId]);
  const isDraft = !selectedId;
  // 全局规则集和其他守秘人的个人集都只能「使用」，不能编辑
  const locked = Boolean(selected && !selected.isMine);
  const canDelete = Boolean(selected && selected.scope !== 'global' && (isChief || selected.isMine));
  const canPublish = Boolean(isChief && selected?.isMine);
  const allowDeriveBase = !isDraft;
  const visibleHouseRules = allowDeriveBase ? houseRules : houseRules.filter((r) => r.type !== 'deriveBase');

  const fillDraftView = (data) => {
    setSelectedId('');
    setSetName('');
    setRules({ ...DEFAULT_AUDIT_RULES, ...(data?.rules || {}) });
    setHouseRules((data?.houseRules || []).map((r) => ({ ...r })));
  };

  const fillSet = (set) => {
    setSelectedId(set.id);
    setSetName(set.name || '');
    setRules({ ...DEFAULT_AUDIT_RULES, ...(set.auditRules || {}) });
    setHouseRules((set.houseRules || []).map((r) => ({ ...r })));
  };

  const refresh = useCallback(async (preferId) => {
    setLoading(true);
    try {
      const [res, rs] = await Promise.all([
        apiGet('/api/admin/audit-rules'),
        apiGet('/api/rule-sets'),
      ]);
      const list = Array.isArray(rs.items) ? rs.items : [];
      setSets(list);
      const view = {
        rules: res.draftRules || { ...DEFAULT_AUDIT_RULES },
        houseRules: Array.isArray(res.draftHouseRules) ? res.draftHouseRules : [],
      };
      setDraftData(view);
      const wanted = preferId !== undefined ? preferId : (res.activeSetId || rs.activeId || '');
      const pick = list.find((s) => s.id === wanted) || null;
      if (pick) fillSet(pick); else fillDraftView(view);
    } catch (err) { showToast(err.message, 'error'); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { refresh(); }, [refresh]);

  // 临时规则模式不允许技能基础值
  useEffect(() => {
    if (isDraft) setDraft((d) => (d.type === 'deriveBase' ? { ...d, type: 'requireAttr' } : d));
  }, [isDraft]);

  const runSet = async (fn, message, preferId) => {
    setBusy(true);
    try {
      await fn();
      await refresh(preferId);
      showToast(message);
    } catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };

  const pickSet = async (id) => {
    if (id === selectedId) return;
    if (!id) {
      setBusy(true);
      try {
        await apiPut('/api/rule-sets/active', { id: null });
        fillDraftView(draftData);
        showToast('已切换到临时规则：只对你生效，不会生成规则集');
      } catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
      return;
    }
    const set = sets.find((s) => s.id === id);
    if (set) fillSet(set);
  };

  const saveCurrent = () => {
    if (locked) return;
    runSet(async () => {
      if (isDraft) {
        await apiPut('/api/admin/audit-rules', {
          auditRules: rules,
          houseRules: houseRules.filter((r) => r.type !== 'deriveBase'),
        });
      } else {
        await apiPut(`/api/rule-sets/${selected.id}`, {
          name: (setName || '').trim() || '我的规则集',
          auditRules: rules,
          houseRules,
        });
      }
    }, isDraft ? '临时规则已保存：只对你生效，不会新建规则集' : '规则集已保存', isDraft ? '' : selectedId);
  };

  const newSet = async () => {
    setBusy(true);
    try {
      const mineCount = sets.filter((s) => s.isMine).length;
      const created = await apiPost('/api/rule-sets', {
        name: `我的规则集 ${mineCount + 1}`, scope: 'personal', auditRules: {}, houseRules: [],
      });
      await refresh(created?.item?.id || '');
      showToast('已新建规则集：编辑内容后点「保存规则集」');
    } catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };

  const duplicate = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const created = await apiPost(`/api/rule-sets/${selected.id}/duplicate`, {});
      await refresh(created?.item?.id || '');
      showToast('已复制为自己的规则集');
    } catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };

  const removeSet = () => {
    if (!selected || !canDelete) return;
    showConfirm(`删除规则集【${selected.name}】？已提交审核的卡会保留当时的规则快照。`, () => (
      runSet(() => apiDelete(`/api/rule-sets/${selected.id}`), '规则集已删除', '')
    ));
  };

  const activate = () => {
    if (!selected) return;
    runSet(() => apiPut('/api/rule-sets/active', { id: selected.id }), '已设为当前规则集', selected.id);
  };

  const publishGlobal = () => {
    if (!canPublish) return;
    showConfirm(`把【${selected.name}】发布为全局规则集？所有守秘人与玩家都会看到这套规则。`, () => (
      runSet(async () => {
        await apiPut('/api/admin/audit-rules/global', {
          auditRules: rules, houseRules, name: setName || selected.name,
        });
      }, '已发布为全局规则集', selectedId)
    ));
  };

  const resetCurrent = () => {
    if (locked) return;
    if (isDraft) {
      runSet(() => apiDelete('/api/admin/audit-rules'), '已清空临时规则', '');
      return;
    }
    runSet(() => apiPut(`/api/rule-sets/${selected.id}`, {
      name: setName || selected.name, auditRules: {}, houseRules: [],
    }), '已重置这套规则集', selectedId);
  };

  const addRule = () => {
    const d = draft;
    let rule = null;
    if (d.type === 'deriveBase') {
      if (!allowDeriveBase) { showToast('临时规则模式下不能改技能基础值', 'error'); return; }
      rule = {
        type: 'deriveBase', skill: d.skill, source: d.source,
        from: d.source === 'attr' ? d.from : '',
        op: d.source === 'fixed' ? 'eq' : (d.op === 'mul' ? 'mul' : 'div'),
        value: Number(d.value) || (d.source === 'fixed' ? 0 : 2),
        adjust: Number(d.adjust) || 0,
      };
    } else if (d.type === 'requireAttr') {
      const min = Number(d.min) || 0;
      const max = Number(d.max) || 0;
      if (!min && !max) { showToast('属性门槛至少要设置下限或上限', 'error'); return; }
      rule = { type: 'requireAttr', attr: d.attr, min, max };
    } else {
      const skills = [...new Set((d.skills || []).filter(Boolean))];
      if (!skills.length) { showToast('技能门槛至少要选一个技能', 'error'); return; }
      rule = {
        type: 'requireSkill', skills, min: Number(d.min) || 60,
        mode: skills.length > 1 ? d.mode : 'all',
        count: skills.length > 1 && d.mode === 'any' ? Math.min(Number(d.count) || 1, skills.length) : skills.length,
      };
    }
    setHouseRules((prev) => [...prev, { ...rule, id: `h${prev.length + 1}_${Date.now().toString(36)}` }]);
    showToast(isDraft ? '已加入临时规则，点「保存临时规则」后生效' : '已加入规则集，点「保存规则集」后生效');
  };

  const skillOptions = SKILLS.filter((s) => !s.spec);

  const ruleMeta = AUDIT_RULE_META.filter((m) => m.group === 'rule');
  const featureMeta = AUDIT_RULE_META.filter((m) => m.group === 'feature');
  const numbers = ruleMeta.filter((m) => m.type === 'number');
  const booleans = ruleMeta.filter((m) => m.type === 'boolean');
  const rulesOn = rules.enabled !== false;

  const stateLabel = isDraft
    ? '临时规则'
    : locked ? (selected.scope === 'global' ? '全局规则（只读）' : '其他守秘人的规则（只读）') : '个人规则中';
  const stateTone = isDraft ? 'amber' : locked ? 'slate' : 'cyan';

  const typeOptions = HOUSE_TYPES.filter((t) => allowDeriveBase || t.key !== 'deriveBase');

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------- 规则集 */}
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">RULE SET 00</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Scale className="h-4 w-4 text-amber-500" strokeWidth={1.7} />规则集
            </h3>
            <Badge className={BADGE_LG} tone="slate">{sets.length} 套</Badge>
          </div>
          <span className="text-[14px] text-slate-500">房规与审卡规则同源</span>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-[16px] leading-relaxed text-slate-500">
            一套规则集同时包含审卡规则与自定义规则。你可以保存多套、随时切换；玩家在车卡「房规」页选用，
            提交审核时服务端会把当时这套规则冻结到卡上。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="选择规则集">
              <Select
                value={selectedId}
                onChange={(e) => pickSet(e.target.value)}
                disabled={loading || busy}
              >
                <option value="">— 未选择 —</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.scope === 'global' ? '（全局）' : `（${s.ownerName || '守秘人'}）`}{s.isActive ? ' · 当前使用' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="规则集名称" hint={isDraft ? '未选择规则集时不能命名' : locked ? '这套规则集不由你维护，名称只读' : undefined}>
              <Input
                maxLength={30}
                value={isDraft ? '' : setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder={isDraft ? '临时规则不会生成规则集' : '如：本桌房规 / 硬核团'}
                disabled={loading || busy || isDraft || locked}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={newSet} disabled={busy || loading}><Plus className="w-4 h-4" />新建</Button>
            <Button variant="ghost" onClick={duplicate} disabled={busy || !selected}><Copy className="w-4 h-4" />复制</Button>
            <Button
              variant="success"
              onClick={activate}
              disabled={busy || !selected || selected.isActive}
            >
              <CheckCircle className="w-4 h-4" />{selected?.isActive ? '当前使用中' : '设为当前'}
            </Button>
            {isChief ? (
              <Button variant="ghost" onClick={publishGlobal} disabled={busy || !canPublish}>
                <Shield className="w-4 h-4" />发布为全局
              </Button>
            ) : null}
            <Button variant="ghost" onClick={removeSet} disabled={busy || !canDelete}><Trash2 className="w-4 h-4" />删除</Button>
          </div>
          <p className="text-[14px] leading-relaxed text-slate-500">
            {locked
              ? '这套规则集不由你维护：名称与内容都是只读的；可以直接「设为当前」使用，或「复制」一套再改。'
              : isDraft
                ? '未选择规则集：下面的内容只保存在你名下，不会生成规则集，其他人也看不到；这个模式只能设置审卡校验，不能改技能基础值。'
                : '保存只会更新这套规则集本身；要让它生效，请点「设为当前」。'}
          </p>
        </div>
      </Panel>

      {/* -------------------------------------------------- 审卡规则 */}
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">RULEBOOK 01</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Shield className="h-4 w-4 text-amber-500" strokeWidth={1.7} />辅助审卡规则
            </h3>
            <Badge className={BADGE_LG} tone={stateTone}>{stateLabel}</Badge>
          </div>
          <Button variant="ghost" className={MINI} onClick={() => refresh(selectedId)}>
            <RefreshCw className={cx('w-3.5 h-3.5', loading && 'animate-spin')} />重新读取
          </Button>
        </div>
        <div className="space-y-5 p-5">
          <p className="text-[16px] leading-relaxed text-slate-500">
            默认值全部来自<b className="text-slate-300">官方规则书</b>。
          </p>

          <fieldset disabled={locked} className={cx('m-0 min-w-0 space-y-5 border-0 p-0', locked && 'opacity-70')}>
            {/* 核心开关：审卡中心 / 审卡规则的总闸 */}
            <div className={cx('rounded-[2px] border p-4',
              rulesOn ? 'border-amber-600/45 bg-amber-500/[0.06]' : 'border-line-strong bg-paper-deep/40')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Power className={cx('h-4 w-4', rulesOn ? 'text-amber-500' : 'text-ink-mute')} strokeWidth={1.7} />
                    <span className="font-serif text-[17px] font-bold text-slate-100">启用自定义规则审卡</span>
                    <Badge className={BADGE_LG} tone={rulesOn ? 'emerald' : 'slate'}>{rulesOn ? '已启用' : '已关闭'}</Badge>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-500">
                    审卡中心与审卡规则的核心开关：关闭后只执行官方规则书基线；开启后按下面的自定义检查项复核。
                  </p>
                </div>
                <Toggle compact checked={rulesOn} onChange={(v) => setRules({ ...rules, enabled: v })} ariaLabel="启用自定义规则审卡" />
              </div>
            </div>

            <div className={cx(!rulesOn && 'opacity-45')}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-1.5">
                <h4 className="font-serif text-[16px] font-bold text-slate-100">规则项</h4>
                <span className="caption !text-[14px]">RULES · 影响是否合规</span>
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {booleans.map((m) => (
                  <div key={m.key} className="space-y-1">
                    <Toggle
                      checked={Boolean(rules[m.key])}
                      onChange={(v) => setRules({ ...rules, [m.key]: v })}
                      label={m.label}
                    />
                    {m.hint ? <p className="pl-[52px] text-[14px] leading-relaxed text-slate-500">{m.hint}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className={cx(!rulesOn && 'opacity-45')}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-1.5">
                <h4 className="font-serif text-[16px] font-bold text-slate-100">功能项</h4>
                <span className="caption !text-[14px]">FEATURES · 只影响提示，不改变合规结论</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {featureMeta.map((m) => (
                  <div key={m.key} className="space-y-1">
                    <Toggle
                      checked={Boolean(rules[m.key])}
                      onChange={(v) => setRules({ ...rules, [m.key]: v })}
                      label={m.label}
                    />
                    {m.hint ? <p className="pl-[52px] text-[14px] leading-relaxed text-slate-500">{m.hint}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button onClick={saveCurrent} disabled={busy || loading || locked}>
                <Save className="w-4 h-4" />{busy ? '保存中…' : isDraft ? '保存临时规则' : '保存规则集'}
              </Button>
              <Button variant="ghost" onClick={resetCurrent} disabled={busy || loading || locked}>
                <RotateCcw className="w-4 h-4" />{isDraft ? '清空临时规则' : '重置这套规则集'}
              </Button>
              <span className="text-[13.5px] leading-relaxed text-slate-500">
                {locked ? '只读：这套规则集不由你维护。' : isDraft ? '临时规则只影响你本人的审卡结论。' : '保存的是这套规则集本身；是否生效取决于「设为当前」。'}
              </span>
            </div>
          </fieldset>
        </div>
      </Panel>

      {/* -------------------------------------------------- 自定义规则 */}
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">CUSTOM RULES 02</span>
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-bold tracking-[0.02em] text-slate-100">
              <Wand2 className="h-4 w-4 text-amber-500" strokeWidth={1.7} />自定义规则
            </h3>
            <Badge className={BADGE_LG} tone="slate">{visibleHouseRules.length} 条</Badge>
          </div>
          <span className="text-[14px] text-slate-500">会改变车卡数值，或增加审卡要求</span>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-[16px] leading-relaxed text-slate-500">
            自定义规则随规则集保存。技能基础值会写进车卡数值，玩家在「房规」页能看到；
            属性 / 技能门槛只进入审卡结论。
          </p>

          <fieldset disabled={locked} className={cx('m-0 min-w-0 space-y-4 border-0 p-0', locked && 'opacity-70')}>
            {visibleHouseRules.length === 0 ? (
              <p className="border-l-2 border-line-strong bg-paper-deep/40 px-3 py-2 text-[14px] text-slate-500">
                {isDraft ? '临时规则里还没有审卡要求。下面加一条试试。' : '这套规则集还没有自定义规则。下面加一条试试，例如「魅惑基础值 = APP ÷ 2」。'}
              </p>
            ) : (
              <div className="space-y-2">
                {visibleHouseRules.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 border border-line-strong bg-paper-raised p-3">
                    <div className="min-w-0">
                      <Badge tone={r.type === 'deriveBase' ? 'amber' : 'slate'}>{ruleTypeLabel(r.type)}</Badge>
                      <p className="mt-1 text-[15px] leading-relaxed text-slate-200">{houseRuleText(r)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className={MINI}
                      aria-label={`删除自定义规则 ${houseRuleText(r)}`}
                      onClick={() => setHouseRules((prev) => prev.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-serif text-[16px] font-bold text-slate-100">新增自定义规则</h4>
                <span className="caption !text-[14px]">加完记得点上面的「{isDraft ? '保存临时规则' : '保存规则集'}」</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="类型">
                  <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                    {typeOptions.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </Select>
                </Field>

                {draft.type === 'deriveBase' ? (
                  <>
                    <Field label="匹配目标" hint={`规则书基础值 ${SKILL_BY_KEY[draft.skill]?.base ?? 0}（特殊技能按属性计算）`}>
                      <Select value={draft.skill} onChange={(e) => setDraft({ ...draft, skill: e.target.value })}>
                        {skillOptions.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="匹配来源">
                      <Select
                        value={draft.source}
                        onChange={(e) => {
                          const source = e.target.value;
                          setDraft({ ...draft, source, op: source === 'fixed' ? 'eq' : (draft.op === 'eq' ? 'div' : draft.op) });
                        }}
                      >
                        <option value="fixed">固定值</option>
                        <option value="attr">各项属性</option>
                      </Select>
                    </Field>
                    {draft.source === 'attr' ? (
                      <Field label="属性来源">
                        <Select value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })}>
                          {ALL_CHARS.map((k) => <option key={k} value={k}>{CHAR_LABEL[k] || k}</option>)}
                        </Select>
                      </Field>
                    ) : null}
                    <Field label="匹配方式">
                      <Select
                        value={draft.source === 'fixed' ? 'eq' : draft.op}
                        disabled={draft.source === 'fixed'}
                        onChange={(e) => setDraft({ ...draft, op: e.target.value })}
                      >
                        {draft.source === 'fixed' ? <option value="eq">等于</option> : (
                          <>
                            <option value="div">除法（÷）</option>
                            <option value="mul">乘法（×）</option>
                          </>
                        )}
                      </Select>
                    </Field>
                    <Field label="匹配数值" hint={draft.source === 'fixed' ? '直接覆盖原基础值' : draft.op === 'mul' ? '如 2 = ×2' : '如 2 = ÷2'}>
                      <NumberInput
                        min={draft.source === 'fixed' ? 0 : 1}
                        max={draft.source === 'fixed' ? 999 : 20}
                        value={draft.value}
                        onChange={(v) => setDraft({ ...draft, value: v === '' ? (draft.source === 'fixed' ? 0 : 2) : v })}
                      />
                    </Field>
                    <Field label="调整数值" hint="运算后再加减，可为负">
                      <NumberInput min={-50} max={50} value={draft.adjust} onChange={(v) => setDraft({ ...draft, adjust: v === '' ? 0 : v })} />
                    </Field>
                  </>
                ) : null}

                {draft.type === 'requireAttr' ? (
                  <>
                    <Field label="匹配目标">
                      <Select value={draft.attr} onChange={(e) => setDraft({ ...draft, attr: e.target.value })}>
                        {ALL_CHARS.map((k) => <option key={k} value={k}>{CHAR_LABEL[k] || k}</option>)}
                      </Select>
                    </Field>
                    <Field label="最小数值" hint="0 = 不设下限">
                      <NumberInput min={0} max={99} value={draft.min} onChange={(v) => setDraft({ ...draft, min: v === '' ? 0 : v })} />
                    </Field>
                    <Field label="最大数值" hint="0 = 不设上限">
                      <NumberInput min={0} max={99} value={draft.max} onChange={(v) => setDraft({ ...draft, max: v === '' ? 0 : v })} />
                    </Field>
                  </>
                ) : null}

                {draft.type === 'requireSkill' ? (
                  <>
                    <div className="sm:col-span-2">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold tracking-[0.14em] text-ink-mute">匹配目标</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-[2px] border border-amber-600/55 bg-amber-500/10 px-3.5 py-1.5 text-[14.5px] font-semibold tracking-[0.06em] text-amber-300 transition-colors hover:border-amber-500 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={draft.skills.length >= 8}
                          onClick={() => setDraft({ ...draft, skills: [...draft.skills, ''] })}
                        >
                          <Plus className="h-4 w-4" />添加目标
                        </button>
                      </div>
                      <div className="space-y-2">
                        {draft.skills.map((v, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Select
                              value={v}
                              className="w-full max-w-[16rem]"
                              onChange={(e) => setDraft({ ...draft, skills: draft.skills.map((x, j) => (j === i ? e.target.value : x)) })}
                            >
                              <option value="">— 选择技能 —</option>
                              {skillOptions.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                            </Select>
                            {draft.skills.length > 1 ? (
                              <button
                                type="button"
                                className="px-2 text-slate-500 transition-colors hover:text-red-500"
                                aria-label="移除这个目标"
                                onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, j) => j !== i) })}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Field label="匹配标准" hint="技能总值下限">
                      <NumberInput min={1} max={99} value={draft.min} onChange={(v) => setDraft({ ...draft, min: v === '' ? 60 : v })} />
                    </Field>
                    {draft.skills.length > 1 ? (
                      <>
                        <Field label="匹配方式">
                          <Select value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value })}>
                            <option value="any">任选达标（or）</option>
                            <option value="all">全部满足（and）</option>
                          </Select>
                        </Field>
                        {draft.mode === 'any' ? (
                          <Field label="达标数量">
                            <NumberInput min={1} max={8} value={draft.count} onChange={(v) => setDraft({ ...draft, count: v === '' ? 1 : v })} />
                          </Field>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="ghost" onClick={addRule}><Plus className="w-4 h-4" />加入自定义规则</Button>
                <span className="text-[13.5px] text-slate-500">
                  例：取悦基础值 = 固定 30；或「侦查 / 聆听 任选一项 ≥ 60」。
                </span>
              </div>
            </div>
          </fieldset>
        </div>
      </Panel>
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

  const isChief = currentUser?.kpRank === 'chief';
  /** 首席不限制；普通守秘人只能改自己发布的模板（与后端权限一致） */
  const canManage = (occ) => isChief || Boolean(occ.createdBy && occ.createdBy === currentUser?.id);

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
            {isChief ? '' : '编辑与删除仅限自己发布的模板，其他守秘人发布的模板只读。'}
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
                      {canManage(o) ? (
                        <div className="flex shrink-0 gap-1">
                          <button type="button" title="编辑模板" onClick={() => setEditing({ ...o, crMin: o.cr[0], crMax: o.cr[1] })} className="border border-transparent p-2 text-slate-500 transition-colors hover:border-line-strong hover:bg-paper-deep hover:text-emerald-700">
                            <Wand2 className="w-4 h-4" />
                          </button>
                          <button type="button" title="删除模板" onClick={() => remove(o)} className="border border-transparent p-2 text-slate-500 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.05] hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null}
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
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-kai text-[14px] tracking-[0.06em] text-slate-500">
                      <span>发布：{o.createdByName || '—'} · {formatDay(o.createdAt)}</span>
                      {canManage(o) ? null : (
                        <span
                          className="border border-line-strong px-1.5 py-0.5 text-[13px] tracking-[0.1em] text-slate-500"
                          title="只有发布者本人或首席守秘人才能修改"
                        >
                          只读
                        </span>
                      )}
                    </div>
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

/** 职业模板的发布日期：老数据缺字段时显示破折号，避免 Invalid Date */
function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('zh-CN');
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
