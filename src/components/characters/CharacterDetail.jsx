/**
 * 角色卡详情（只读展示）＋「经历」模组关联 ＋ 送审 / KP 批复。
 *
 * 权限：
 *   - 玩家：可查看自己的卡（以及被 KP 设为公开的卡），可增删模组关联、提交审核。
 *   - KP：可查看与修改所有人的卡，代记经历，并直接在详情页批复。
 * 服务端对每个写操作都会再次校验归属，前端按钮的显隐只是体验优化。
 *
 * 注意：审核状态与批复**不属于角色卡本体**，只用于流程沟通，永远不会被打印导出。
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, BookOpen, Calendar, CheckCircle, ClipboardCheck, Crown, Edit, ExternalLink,
  FileText, Link2, Plus, Printer, ScrollText, Send, Share2, Shield, Sword, Trash2, Undo2,
  User as UserIcon, Wand2, XCircle,
} from 'lucide-react';
import {
  ALL_CHARS, BACKGROUND_FIELDS, CHAR_LABEL, MODULE_ROLES, REVIEW_LABEL,
  SKILL_BY_KEY, STATUS_LABEL, grantEduReroll, resetEduGrowth,
} from '../../../shared/coc7e.js';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api.js';
import {
  Badge, Button, EmptyState, Field, Input, Panel, Select, Tabs, Textarea, WarningList, cx,
} from '../ui.jsx';
import { ExportCardModal } from './CardTransferModal.jsx';

const STATUS_TONE = { draft: 'slate', active: 'emerald', retired: 'amber', dead: 'red' };
const REVIEW_TONE = { none: 'slate', pending: 'amber', approved: 'emerald', rejected: 'red' };

/** 字段标签放大到 12.5px：ui.jsx 的 Field 内部写死 9.5px，这里用后代选择器覆盖，不改共享组件 */
const FIELD_LABEL = '[&>span:first-child>span:first-child]:text-[14px] [&>span:first-child>span:first-child]:tracking-[0.12em]';

function StatBox({ label, value, sub, tone = 'emerald' }) {
  const tones = { emerald: 'text-forest', amber: 'text-ochre', cyan: 'text-moon' };
  return (
    <div className="rounded-[2px] border border-line-strong bg-paper-deep/40 px-2.5 py-3 text-center">
      <div className="font-mono text-[14px] font-semibold tracking-[0.14em] text-ink-mute">{label}</div>
      <div className={cx('tabular mt-2 font-serif text-[28px] font-bold leading-none', tones[tone])}>{value}</div>
      {sub ? <div className="mt-1.5 text-[14px] leading-snug text-ink-mute">{sub}</div> : null}
    </div>
  );
}

/** 规则提示的严重级别配色 */
const FINDING_TONE = {
  error: 'border-red-500/45 bg-red-500/[0.06] text-vermilion',
  warn: 'border-amber-500/45 bg-amber-500/[0.06] text-ochre',
  info: 'border-cyan-500/40 bg-cyan-500/[0.05] text-moon',
};

export default function CharacterDetail({
  characterId, currentUser, showToast, showConfirm, onBack, onEdit, onPrint, onChanged,
  reviewMode = false,
}) {
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [linkForm, setLinkForm] = useState({ moduleId: '', role: 'PC', date: '', note: '' });
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState(reviewMode ? 'review' : 'sheet');
  const [rejectComment, setRejectComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setC(await apiGet(`/api/characters/${characterId}`));
    } catch (err) {
      showToast(err.message, 'error');
      onBack?.();
    } finally {
      setLoading(false);
    }
  }, [characterId, showToast, onBack]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiGet('/api/characters/meta')
      .then((m) => setModuleOptions(m.moduleOptions || []))
      .catch(() => { /* ignore */ });
  }, []);

  const addLink = async () => {
    if (!linkForm.moduleId) return showToast('请选择要关联的模组', 'error');
    setAdding(true);
    try {
      const updated = await apiPost(`/api/characters/${c.id}/modules`, linkForm);
      setC(updated);
      setLinkForm({ moduleId: '', role: 'PC', date: '', note: '' });
      showToast('已记入经历');
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setAdding(false); }
  };

  const removeLink = (moduleId, title) => showConfirm(`从经历中移除【${title}】？`, async () => {
    try {
      const updated = await apiDelete(`/api/characters/${c.id}/modules/${moduleId}`);
      setC(updated);
      onChanged?.();
    } catch (err) { showToast(err.message, 'error'); }
  });

  const submitReview = () => showConfirm(
    review?.status === 'rejected' ? '重新提交给 KP 审核？' : '把这张角色卡提交给 KP 审核？',
    async () => {
      try {
        setC(await apiPost(`/api/characters/${c.id}/submit`, {}));
        showToast('已提交审核');
        onChanged?.();
      } catch (err) { showToast(err.message, 'error'); }
    },
    { detail: 'KP 会看到一张只读的角色卡，审核状态与批复不会写进卡里，也不会被打印。', danger: false },
  );

  const withdrawReview = async () => {
    try {
      setC(await apiPost(`/api/characters/${c.id}/withdraw`, {}));
      showToast('已撤回审核');
      onChanged?.();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const doReview = async (verdict) => {
    setBusy(true);
    try {
      const updated = await apiPost(`/api/characters/${c.id}/review`, { verdict, comment: rejectComment });
      setC(updated);
      setRejectComment('');
      showToast(verdict === 'approved' ? '已通过审核' : '已驳回并附上批复');
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  /** KP：授权一次重掷 / 重置教育增强（不必进入编辑器） */
  const grantEdu = async () => {
    try {
      const saved = await apiPatch(`/api/characters/${c.id}`, {
        eduGrowth: grantEduReroll(c.eduGrowth, currentUser?.username || ''),
      });
      setC(saved);
      showToast('已授权一次教育增强重掷');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const resetEdu = async () => {
    try {
      const saved = await apiPatch(`/api/characters/${c.id}`, {
        eduBonus: 0,
        eduGrowth: resetEduGrowth(currentUser?.username || ''),
      });
      setC(saved);
      showToast('已重置教育增强');
    } catch (err) { showToast(err.message, 'error'); }
  };

  if (loading && !c) return <Panel><EmptyState title="正在载入角色卡…" /></Panel>;
  if (!c) return null;

  const d = c.derived;
  const usedSkills = d.skills.filter((s) => s.used || s.occ > 0 || s.interest > 0 || s.growth > 0);
  const review = c.review || { status: 'none' };
  const canReview = c.canReview && review.status === 'pending';
  const legendary = c.legendary || { enabled: false };
  const legendaryBonus = c.legendaryBonus || {};
  const eduGrowth = c.eduGrowth || {};

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" onClick={onBack} className="!p-3"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h2 className="flex flex-wrap items-center gap-x-3 gap-y-2 font-serif text-[34px] font-bold leading-[1.15] tracking-[-0.005em] text-ink sm:text-[38px]">
                {c.name}
                <Badge tone={STATUS_TONE[c.status]} className="!text-[14px]">{STATUS_LABEL[c.status]}</Badge>
                {review.status !== 'none' ? (
                  <Badge tone={REVIEW_TONE[review.status]} className="!text-[14px]">{REVIEW_LABEL[review.status]}</Badge>
                ) : null}
                {c.isPublic ? <Badge tone="cyan" className="!text-[14px]">公开只读</Badge> : null}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[16px] leading-[1.7] text-ink-soft">
                <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" />{c.ownerName}</span>
                <span>{d.occupation?.name || '无职业'}</span>
                <span>{c.age} 岁</span>
                <span>{c.era}</span>
                {c.gender ? <span>{c.gender}</span> : null}
                {c.residence ? <span>住地 {c.residence}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={() => setExportOpen(true)}><Share2 className="h-4 w-4" />导出编码 / 骰娘指令</Button>
            <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={() => onPrint(c)}><Printer className="h-4 w-4" />打印 / 导出 PDF</Button>
            {c.isOwner && (review.status === 'none' || review.status === 'rejected') ? (
              <Button variant="amber" className="!px-3 !py-1.5 !text-[14px]" onClick={submitReview}>
                <Send className="h-4 w-4" />{review.status === 'rejected' ? '修改后重新提交' : '提交 KP 审核'}
              </Button>
            ) : null}
            {c.isOwner && review.status === 'pending' ? (
              <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={withdrawReview}><Undo2 className="h-4 w-4" />撤回审核</Button>
            ) : null}
            {c.canEdit ? <Button className="!px-3.5 !py-1.5 !text-[14px]" onClick={() => onEdit(c)}><Edit className="h-4 w-4" />编辑</Button> : null}
          </div>
        </div>

        {/* 驳回批复：只在这里显示，不进角色卡、不打印 */}
        {review.status === 'rejected' && review.comment ? (
          <div className="mt-5 border-l-2 border-red-500/50 bg-red-500/[0.05] px-4 py-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-[16px] font-bold text-vermilion">
              <XCircle className="w-4 h-4" />KP 批复（{review.reviewedByName || 'KP'} · {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : ''}）
            </div>
            <p className="whitespace-pre-wrap text-[16px] leading-[1.85] text-ink-soft">{review.comment}</p>
            <p className="mt-2 text-[14px] text-ink-mute">批复只用于沟通，不会出现在角色卡或打印件上。</p>
          </div>
        ) : null}
        {review.status === 'approved' ? (
          <div className="mt-5 flex items-center gap-2 border-l-2 border-forest/50 bg-forest/[0.06] px-4 py-3 text-[14px] text-forest">
            <CheckCircle className="w-4 h-4" />
            已通过 KP 审核{review.reviewedByName ? `（${review.reviewedByName}）` : ''}。批复在通过时已清空。
          </div>
        ) : null}
        {review.status === 'pending' ? (
          <div className="mt-5 flex items-center gap-2 border-l-2 border-ochre/50 bg-ochre/[0.06] px-4 py-3 text-[14px] text-ochre">
            <ClipboardCheck className="w-4 h-4" />已提交审核，等待 KP 批复。
          </div>
        ) : null}
      </Panel>

      {/* 派生值 */}
      <Panel className="p-5 space-y-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
          <StatBox label="生命值 HP" value={d.hp} />
          <StatBox label="魔法点 MP" value={d.mp} />
          <StatBox label="理智 SAN" value={d.san} />
          <StatBox label="移动力 MOV" value={d.mov} />
          <StatBox label="伤害加值" value={d.db} tone="amber" />
          <StatBox label="体格" value={d.build} tone="amber" />
          <StatBox
            label="信用评级"
            value={`${d.creditRating}%`}
            sub={d.creditRange ? `要求 ${d.creditRange[0]}-${d.creditRange[1]}%` : ''}
            tone={d.creditInRange === false ? 'amber' : 'cyan'}
          />
        </div>
        <div className="grid gap-2 text-[14.5px] leading-[1.8] text-ink-soft sm:grid-cols-2">
          <div>职业技能点：<b className="font-mono text-[14px] font-bold tabular text-ink">{d.spent.occupation}</b> / {d.budget.occupation}</div>
          <div>兴趣技能点：<b className="font-mono text-[14px] font-bold tabular text-ink">{d.spent.interest}</b> / {d.budget.interest}（智力×2）</div>
        </div>
        <WarningList items={c.warnings} />
      </Panel>

      {/* KP 审核面板 */}
      {c.canReview ? (
        <Panel className="space-y-4 border-amber-600/40 p-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="flex items-center gap-2 font-serif text-[17px] font-bold tracking-[0.01em] text-ink">
              <Shield className="w-4 h-4 text-ochre" />KP 审核区
              <span className="text-[14px] font-normal text-ink-mute">仅 KP 可见 · 不影响玩家看到的角色卡内容</span>
            </h3>
            {c.audit ? (
              <Badge tone={c.audit.passed ? 'emerald' : 'red'}>
                规则判定：{c.audit.passed ? '通过' : '不合规'}
              </Badge>
            ) : null}
          </div>

          {c.audit ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
                <div className="rounded-[2px] border border-line-strong bg-paper-deep/40 p-3">
                  <div className="text-ink-mute">属性总和</div>
                  <div className="tabular mt-1 font-serif text-[17px] font-bold text-ink">{c.audit.stats.charTotal}</div>
                </div>
                <div className="rounded-[2px] border border-line-strong bg-paper-deep/40 p-3">
                  <div className="text-ink-mute">职业点</div>
                  <div className="tabular mt-1 font-serif text-[17px] font-bold text-ink">{c.audit.stats.occupationPoints} / {c.audit.stats.occupationBudget}</div>
                </div>
                <div className="rounded-[2px] border border-line-strong bg-paper-deep/40 p-3">
                  <div className="text-ink-mute">兴趣点</div>
                  <div className="tabular mt-1 font-serif text-[17px] font-bold text-ink">{c.audit.stats.interestPoints} / {c.audit.stats.interestBudget}</div>
                </div>
                <div className="rounded-[2px] border border-line-strong bg-paper-deep/40 p-3">
                  <div className="text-ink-mute">自定义技能</div>
                  <div className="tabular mt-1 font-serif text-[17px] font-bold text-ink">{c.audit.stats.customSkillCount}</div>
                </div>
              </div>

              {c.audit.findings.length > 0 ? (
                <ul className="space-y-1.5">
                  {c.audit.findings.map((f, i) => (
                    <li key={`${f.id}-${i}`} className={cx('rounded-[2px] border p-3 text-[14.5px] leading-[1.75]', FINDING_TONE[f.level])}>
                      <b>{f.label}</b>：{f.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-1.5 text-[16px] text-forest"><CheckCircle className="w-4 h-4" />按当前规则未发现问题</p>
              )}
            </div>
          ) : null}

          {canReview ? (
            <div className="border-t border-line pt-4 space-y-3">
              <Field label="驳回时的批复" hint="通过时批复会被清空，不需要填写" className={FIELD_LABEL}>
                <Textarea
                  rows={2}
                  maxLength={500}
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="例：力量 90 偏高，请把属性总和控制在 600 以内"
                />
              </Field>
              <div className="flex gap-2">
                <Button onClick={() => doReview('approved')} disabled={busy}>
                  <CheckCircle className="w-4 h-4" />通过审核
                </Button>
                <Button variant="danger" onClick={() => doReview('rejected')} disabled={busy || !rejectComment.trim()}>
                  <XCircle className="w-4 h-4" />驳回并批复
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[16px] leading-[1.75] text-ink-soft">
              {review.status === 'pending' ? '该卡处于待审核状态，可在上方直接批复。' : '该卡当前不在待审核队列中。'}
            </p>
          )}

          {c.reviewHistory?.length ? (
            <details className="text-[14px] leading-[1.75] text-ink-mute">
              <summary className="cursor-pointer hover:text-ink-soft">审核历史（{c.reviewHistory.length}）</summary>
              <ul className="mt-2 space-y-1">
                {c.reviewHistory.map((h) => (
                  <li key={h.id}>
                    {new Date(h.createdAt).toLocaleString()} · {h.kpName} ·{' '}
                    <span className={h.verdict === 'approved' ? 'text-forest' : 'text-vermilion'}>
                      {h.verdict === 'approved' ? '通过' : '驳回'}
                    </span>
                    {h.comment ? `：${h.comment}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Panel>
      ) : null}

      {/* 分页 */}
      <Tabs
        items={[
          { value: 'sheet', label: '属性与技能', icon: Wand2 },
          { value: 'story', label: '背景故事', icon: BookOpen },
          { value: 'journal', label: '装备与经历', icon: ScrollText },
        ]}
        value={tab}
        onChange={setTab}
        className="border-b-0"
      />

      {tab === 'sheet' && (
        <div className="space-y-5 animate-in fade-in">
          <Panel className="p-5 sm:p-6">
            <h3 className="mb-4 font-serif text-[17px] font-bold tracking-[0.01em] text-ink">属性</h3>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-9">
              {ALL_CHARS.map((k) => (
                <div key={k} className="rounded-[2px] border border-line-strong bg-paper-deep/40 px-1.5 py-2.5 text-center">
                  <div className="font-mono text-[14px] font-semibold tracking-[0.08em] text-ink-mute">{CHAR_LABEL[k]}</div>
                  <div className={cx('tabular mt-1 font-serif text-[20px] font-bold leading-none', d.eff[k] !== d.raw[k] ? 'text-ochre' : 'text-ink')}>
                    {d.eff[k]}
                  </div>
                  <div className="tabular mt-1 text-[14px] text-ink-mute">基础 {d.raw[k]}</div>
                  {legendary.enabled ? (
                    <div className="font-mono text-[14px] font-semibold text-ochre">传奇 +{legendaryBonus[k] || 0}</div>
                  ) : null}
                  <div className="tabular mt-0.5 text-[14px] text-ink-mute">{d.half[k]}/{d.fifth[k]}</div>
                </div>
              ))}
            </div>
            {legendary.enabled ? (
              <div className="mt-4 flex items-start gap-2.5 border-l-2 border-amber-600/55 bg-amber-500/[0.06] px-3.5 py-3 text-[14px] leading-[1.8] text-ink-soft">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
                <span>
                  KP 已开启<b>传奇标记</b>：允许突破属性 99 上限，上表「传奇 +N」是额外调整值（单独一栏，不与掷骰属性混用）。
                  {legendary.note ? ` 备注：${legendary.note}` : ''}
                  {legendary.by ? `（${legendary.by}${legendary.at ? ` · ${new Date(legendary.at).toLocaleDateString('zh-CN')}` : ''}）` : ''}
                </span>
              </div>
            ) : null}
            {c.agePenaltyWaived ? (
              <div className="mt-4 border-l-2 border-forest/45 bg-forest/[0.06] px-3.5 py-3 text-[14px] leading-[1.8] text-forest">
                KP 已豁免这张卡的年龄减益：属性不因年龄下降、移动力不减，教育成长照常保留。
              </div>
            ) : null}
            {d.ageAdjust.label ? (
              <p className="mt-3 text-[16px] leading-[1.8] text-ink-soft">
                年龄补正：{d.ageAdjust.apply ? d.ageAdjust.label : '已关闭'}
                {d.ageAdjust.apply && !c.agePenaltyWaived && d.ageAdjust.poolPoints > 0
                  ? ` · 分配：${d.ageAdjust.poolKeys.map((k) => `${CHAR_LABEL[k]} −${d.ageAdjust.alloc[k] || 0}`).join('，')}`
                  : ''}
                {` · 教育增强 +${d.ageAdjust.eduBonus}`}
              </p>
            ) : null}
            <div className="mt-3 space-y-1.5 text-[14px] leading-[1.7] text-ink-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">教育增强记录：</span>
                {eduGrowth.settled ? <Badge tone="emerald" className="!text-[14px]">已结算</Badge> : <Badge tone="amber" className="!text-[14px]">未结算</Badge>}
                {eduGrowth.settled && (eduGrowth.granted || 0) <= 0 ? <Badge tone="slate" className="!text-[14px]">已锁定</Badge> : null}
                {(eduGrowth.granted || 0) > 0 ? <Badge tone="cyan" className="!text-[14px]">KP 已授权 {eduGrowth.granted} 次重掷</Badge> : null}
                {(eduGrowth.rerolls || 0) > 0 ? <Badge tone="amber" className="!text-[14px]">已重掷 {eduGrowth.rerolls} 次</Badge> : null}
                {!eduGrowth.settled ? (
                  <span className="text-ochre">该年龄需要 {d.ageAdjust.eduChecks} 次教育增强检定</span>
                ) : null}
              </div>
              {(eduGrowth.attempts || []).length > 0 ? (
                <div className="space-y-0.5">
                  {(eduGrowth.attempts || []).map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-x-2">
                      <span className="text-ink-mute">#{i + 1}</span>
                      <span className={cx('rounded border px-1.5 py-0.5 text-[14px]',
                        a.via === 'manual' ? 'border-cyan-600/50 text-moon'
                          : a.via === 'reroll' ? 'border-amber-500/40 text-ochre'
                            : 'border-line-strong text-ink-soft')}
                      >
                        {a.via === 'manual' ? '手动录入' : a.via === 'reroll' ? '授权重掷' : '自动检定'}
                      </span>
                      {a.manual ? null : <span>检定 {a.count} 次</span>}
                      <span>提升 <b className="font-mono text-moon">+{a.gain}</b></span>
                      <span className="text-ink-mute">累计 {a.totalAfter}</span>
                      {a.by ? <span className="text-ink-mute">by {a.by}</span> : null}
                      {a.at ? <span className="text-ink-mute">{new Date(a.at).toLocaleString('zh-CN')}</span> : null}
                      {a.rolls?.length ? (
                        <span className="font-mono text-ink-mute">{a.rolls.map((r) => `D100=${r.roll}→+${r.gain}`).join('、')}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {currentUser?.role === 'admin' ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button variant="subtle" onClick={grantEdu}>授权重掷一次</Button>
                  <Button variant="subtle" onClick={resetEdu}>重置教育增强</Button>
                  <span className="text-[14px] leading-[1.7] text-ink-mute">
                    玩家已结算后不能自助重掷；授权会在他下次结算时消耗一次，并记入流水。
                  </span>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="flex items-center font-serif text-[17px] font-bold text-ink"><Wand2 className="mr-2 h-4 w-4 text-forest" />技能（{usedSkills.length}）</h3>
              <span className="text-[14px] text-ink-mute">★ = 本职技能 · ✎ = 自定义技能 · 打印时会列出全部技能与基础值</span>
            </div>
            <div className="overflow-x-auto rounded-[2px] border border-line-strong">
              <table className="w-full min-w-[620px] text-[14.5px] leading-[1.65]">
                <thead className="bg-paper-deep/70 text-[14px] text-ink-mute">
                  <tr>
                    <th className="p-3 text-left">技能</th>
                    <th className="p-3 w-20 text-center">基础</th>
                    <th className="p-3 w-20 text-center">职业</th>
                    <th className="p-3 w-20 text-center">兴趣</th>
                    <th className="p-3 w-20 text-center">成长</th>
                    <th className="p-3 w-24 text-center">成功率</th>
                    <th className="p-3 w-24 text-center">困难/极难</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-strong">
                  {usedSkills.map((s) => (
                    <tr
                      key={s.id}
                      className={cx(
                        s.isOccupation && 'bg-emerald-500/[0.03]',
                        s.special === 'credit' && 'bg-amber-500/[0.06]',
                        s.special === 'cthulhu' && 'bg-amber-500/[0.06]',
                      )}
                    >
                      <td className="p-3 text-ink">
                        {s.kind === 'custom'
                          ? <span className="text-moon mr-1.5">✎</span>
                          : (s.isOccupation ? <span className="text-forest mr-1.5">★</span> : <span className="text-ink-mute/70 mr-1.5">·</span>)}
                        <span className={cx(s.special && 'font-bold text-ink')}>{s.name}</span>
                      </td>
                      <td className="p-3 text-center font-mono text-[14px] text-ink-mute">{s.base}</td>
                      <td className="p-3 text-center font-mono text-ink-soft">{s.occ || '-'}</td>
                      <td className="p-3 text-center font-mono text-ink-soft">{s.interest || '-'}</td>
                      <td className="p-3 text-center font-mono text-ink-soft">{s.growth || '-'}</td>
                      <td className="tabular p-3 text-center text-[14px] font-bold text-forest">{s.total}%</td>
                      <td className="p-3 text-center font-mono text-[14px] text-ink-soft">{s.half} / {s.fifth}</td>
                    </tr>
                  ))}
                  {usedSkills.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-[14.5px] text-ink-mute">还没有分配任何技能点</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center font-serif text-[17px] font-bold text-ink"><Sword className="mr-2 h-4 w-4 text-forest" />武器</h3>
            {(c.weapons || []).length === 0 ? (
              <p className="text-[16px] text-ink-mute">未登记武器</p>
            ) : (
              <div className="overflow-x-auto rounded-[2px] border border-line-strong">
                <table className="w-full min-w-[640px] text-[14.5px] leading-[1.65]">
                  <thead className="bg-paper-deep/70 text-[14px] text-ink-mute">
                    <tr>{['武器', '技能', '伤害', '射程', '攻击', '装弹', '故障'].map((h) => <th key={h} className="p-3 text-left">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line-strong">
                    {c.weapons.map((w, i) => (
                      <tr key={i}>
                        <td className="p-3 font-bold text-ink">{w.name}</td>
                        <td className="p-3 text-ink-soft">{w.skill}</td>
                        <td className="p-3 text-ink-soft font-mono">{w.damage}</td>
                        <td className="p-3 text-ink-soft">{w.range}</td>
                        <td className="p-3 text-ink-soft">{w.attacks}</td>
                        <td className="p-3 text-ink-soft">{w.ammo}</td>
                        <td className="p-3 text-ink-soft">{w.malfunction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'story' && (
        <Panel className="animate-in fade-in p-5 sm:p-6">
          <h3 className="mb-5 flex items-center font-serif text-[17px] font-bold text-ink"><BookOpen className="mr-2 h-4 w-4 text-forest" />背景故事</h3>
          <div className="grid md:grid-cols-2 gap-5">
            {BACKGROUND_FIELDS.map(([key, label]) => (
              <div key={key}>
                <div className="mb-2.5 border-b border-line pb-2 text-[14px] font-bold tracking-[0.04em] text-ink-soft">{label}</div>
                <p className="min-h-[2rem] whitespace-pre-wrap text-[16px] leading-[1.9] text-ink-soft">
                  {c.background?.[key] || <span className="text-ink-mute">—</span>}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'journal' && (
        <div className="space-y-5 animate-in fade-in">
          <Panel className="space-y-4 p-5 sm:p-6">
            <h3 className="flex items-center font-serif text-[17px] font-bold text-ink"><ScrollText className="mr-2 h-4 w-4 text-forest" />经历（关联模组）</h3>

            <div className="space-y-2">
              {(c.moduleLinks || []).map((l) => (
                <div key={l.moduleId} className="flex flex-wrap items-center gap-3 rounded-[2px] border border-line-strong bg-paper-deep/40 p-3.5">
                  <Badge tone="emerald">{l.role}</Badge>
                  <div className="flex-1 min-w-[10rem]">
                    <div className="text-[14px] font-bold text-ink">{l.moduleTitle}</div>
                    <div className="text-[14px] text-ink-mute">
                      {l.moduleRegion} {l.moduleEra}
                      {l.date ? ` · ${l.date}` : ''}
                      {l.note ? ` · ${l.note}` : ''}
                    </div>
                  </div>
                  {c.canEdit ? (
                    <button type="button" onClick={() => removeLink(l.moduleId, l.moduleTitle)} className="p-2.5 text-ink-mute transition-colors hover:text-vermilion" title="移除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              ))}
              {(c.moduleLinks || []).length === 0 && <p className="py-2 text-[16px] text-ink-mute">还没有关联任何模组。</p>}
            </div>

            {c.canEdit ? (
              <div className="border-t border-line pt-4 space-y-3">
                <p className="flex items-center gap-1.5 text-[16px] text-ink-soft">
                  <Link2 className="w-3.5 h-3.5" />关联一个跑过的模组（玩家与 KP 均可添加）
                </p>
                <div className="grid sm:grid-cols-4 gap-3">
                  <Field label="模组" className={cx('sm:col-span-2', FIELD_LABEL)}>
                    <Select value={linkForm.moduleId} onChange={(e) => setLinkForm({ ...linkForm, moduleId: e.target.value })}>
                      <option value="">请选择模组…</option>
                      {moduleOptions.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </Select>
                  </Field>
                  <Field label="参与身份" className={FIELD_LABEL}>
                    <Select value={linkForm.role} onChange={(e) => setLinkForm({ ...linkForm, role: e.target.value })}>
                      {MODULE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  </Field>
                  <Field label="日期" className={FIELD_LABEL}>
                    <Input type="date" value={linkForm.date} onChange={(e) => setLinkForm({ ...linkForm, date: e.target.value })} style={{ colorScheme: 'dark' }} />
                  </Field>
                </div>
                <Field label="经历备注" className={FIELD_LABEL}>
                  <Textarea rows={2} maxLength={200} value={linkForm.note} onChange={(e) => setLinkForm({ ...linkForm, note: e.target.value })} placeholder="例：第一次跑团，角色失去 5 点理智" />
                </Field>
                <Button onClick={addLink} disabled={adding}><Plus className="w-4 h-4" />{adding ? '添加中…' : '加入经历'}</Button>
              </div>
            ) : null}
          </Panel>

          <Panel className="space-y-4 p-5 sm:p-6">
            <h3 className="flex items-center font-serif text-[17px] font-bold text-ink"><FileText className="mr-2 h-4 w-4 text-forest" />装备与资产</h3>
            <div>
              <div className="mb-2 text-[14.5px] font-bold text-ink">装备和物品</div>
              <p className="whitespace-pre-wrap rounded-[2px] border border-line-strong bg-paper-deep/40 p-3.5 text-[16px] leading-[1.85] text-ink-soft">
                {c.equipment || <span className="text-ink-mute">—</span>}
              </p>
            </div>
            <div className="space-y-3 rounded-[2px] border border-line-strong bg-paper-deep/30 p-4">
              <div className="text-[14px] leading-[1.7] text-ink-mute">
                按「{c.era} · {d.wealth?.currencyLabel}」与信用评级 {d.creditRating}% 自动计算（不可手改）
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[['消费水平', d.wealth?.level], ['现金', d.wealth?.cashText], ['资产', d.wealth?.assetsText]].map(([l, v]) => (
                  <div key={l} className="border border-line rounded-[3px] bg-paper-deep/45 p-3">
                    <div className="mb-1.5 text-[14px] text-ink-mute">{l}</div>
                    <div className="font-mono text-[16px] font-bold text-ink">{v || '—'}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1.5 text-[14px] text-ink-mute">额外资产</div>
                <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-ink-soft">{c.extraAssets || '—'}</div>
              </div>
            </div>
            {c.experience ? (
              <div>
                <div className="mb-2 text-[14.5px] font-bold text-ink">经历记录</div>
                <p className="whitespace-pre-wrap rounded-[2px] border border-line-strong bg-paper-deep/40 p-3.5 text-[16px] leading-[1.85] text-ink-soft">{c.experience}</p>
              </div>
            ) : null}
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="flex items-center gap-2 font-serif text-[17px] font-bold tracking-[0.01em] text-ink">
                <FileText className="w-4 h-4 text-moon" />备注
              </h3>
              <span className="text-[14px] text-ink-mute">只做记录，不会出现在骰娘指令与打印件上</span>
            </div>
            <p className="whitespace-pre-wrap rounded-[2px] border border-line-strong bg-paper-deep/40 p-3.5 text-[16px] leading-[1.85] text-ink-soft">
              {c.notes || <span className="text-ink-mute">—</span>}
            </p>
          </Panel>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-ink-mute">
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />创建 {new Date(c.createdAt).toLocaleString()}</span>
        <span>最近更新 {new Date(c.updatedAt).toLocaleString()}</span>
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />归属 {c.ownerName}</span>
        {currentUser?.role === 'admin' ? <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />KP 可见全部角色卡</span> : null}
      </div>

      <ExportCardModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        character={c}
        onToast={showToast}
      />
    </div>
  );
}
