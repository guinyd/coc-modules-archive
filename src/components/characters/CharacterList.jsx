/**
 * 角色卡列表。
 * 同一个组件服务三种场景：
 *   mode="mine"  —— 登录玩家查看/管理自己的角色卡
 *   mode="guest" —— 未登录访客查看本机草稿（数据只在浏览器里）
 *   mode="kp"    —— KP 统一管理全站角色卡（可筛选归属玩家、状态、审核状态、关联模组）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BookOpen, CloudUpload, Copy, Crown, Edit, Eye, FileText, Filter,
  GraduationCap, LogIn, Plus, Printer, RefreshCw, Search, Share2, Shield, ShieldOff,
  Trash2, Upload, User as UserIcon, Users,
} from 'lucide-react';
import { REVIEW_LABEL, STATUS_LABEL, computeSheet, eduGrowthLabel, validateSheet } from '../../../shared/coc7e.js';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api.js';
import {
  deleteGuestSheet, listGuestSheets, guestCapacity, saveGuestSheet,
} from '../../lib/guestStore.js';
import { ExportCardModal, ImportCardModal } from './CardTransferModal.jsx';
import LegendaryQuickModal from './LegendaryQuickModal.jsx';
import EduQuickModal from './EduQuickModal.jsx';
import {
  Badge, Button, EmptyState, Input, Modal, PageHeader, Panel, Select, cx,
} from '../ui.jsx';
import { SealMark } from '../Emblem.jsx';

const STATUS_SPINE = {
  draft: 'bg-line-strong',
  active: 'bg-cyan-500',
  retired: 'bg-amber-500',
  dead: 'bg-red-500',
};

/** 访客草稿是原始存档，这里就地算出与后端列表一致的摘要字段，卡片组件才能复用 */
function buildGuestItems() {
  return listGuestSheets().map((g) => {
    const d = computeSheet(g);
    return {
      ...g,
      occupationName: d.occupation?.name || '无职业',
      hp: d.hp, san: d.san, mov: d.mov,
      skillCount: d.skills.filter((s) => s.used).length,
      moduleCount: 0,
      warningCount: validateSheet(g).length,
      reviewStatus: 'none',
    };
  });
}

const STATUS_TONE = { draft: 'slate', active: 'emerald', retired: 'amber', dead: 'red' };
const REVIEW_TONE = { none: 'slate', pending: 'amber', approved: 'emerald', rejected: 'red' };

const ACT = 'inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 text-[14px] leading-none text-ink-soft transition-colors duration-150 hover:bg-paper-deep/60 hover:text-ink disabled:opacity-50';
const KP_ACT = 'inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1.5 text-[14px] leading-none transition-colors duration-150';

function CharacterCard({
  item, onOpen, onEdit, onPrint, onDelete, onDuplicate, showOwner, onPublish, guest,
  onLegendary, onEdu, onExport, onToggleWaiveAge, exporting,
}) {
  const kpAct = (on) => cx(
    KP_ACT,
    on
      ? 'bg-ochre/[0.14] text-ochre ring-1 ring-inset ring-ochre/40'
      : 'text-ink-soft hover:bg-paper-deep/60 hover:text-ink',
  );
  const hasKpActions = Boolean(onLegendary || onEdu || onToggleWaiveAge);
  return (
    <article className="char-card group relative flex flex-col overflow-hidden border border-line-strong bg-paper-raised">
      <span aria-hidden="true" className={cx('char-spine absolute inset-y-0 left-0 z-10', STATUS_SPINE[item.status] || 'bg-line-strong')} />
      <div aria-hidden="true" className="char-seal pointer-events-none absolute -right-8 -top-10 text-moon">
        <SealMark size={150} strokeWidth={0.9} />
      </div>

      <div className="relative flex flex-1 flex-col gap-4 p-4 pl-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center border border-line-strong bg-gradient-to-br from-vermilion/10 via-paper-raised to-moon/10 font-serif text-[20px] font-bold leading-none text-ink">
            {(item.name || '?').slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="char-name truncate font-serif text-[21px] font-bold leading-[1.3] tracking-[0.01em] text-ink">{item.name}</h3>
            <p className="mt-1.5 truncate text-[16px] leading-snug text-ink-soft">
              {item.occupationName} · {item.age} 岁 · {item.era}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS_TONE[item.status] || 'slate'} className="!text-[14px] !tracking-[0.08em]">{STATUS_LABEL[item.status] || item.status}</Badge>
              {guest
                ? <Badge tone="amber" className="!text-[14px] !tracking-[0.08em]">本机草稿</Badge>
                : (item.reviewStatus && item.reviewStatus !== 'none'
                  ? <Badge tone={REVIEW_TONE[item.reviewStatus]} className="!text-[14px] !tracking-[0.08em]">{REVIEW_LABEL[item.reviewStatus]}</Badge>
                  : null)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-line border-y border-line py-3">
          {[['HP', item.hp], ['SAN', item.san], ['MOV', item.mov]].map(([l, v]) => (
            <div key={l} className="px-1 text-center">
              <div className="font-mono text-[14px] font-semibold tracking-[0.2em] text-ink-mute">{l}</div>
              <div className="tabular mt-1.5 font-serif text-[23px] font-bold leading-none text-ink">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] leading-[1.7] text-ink-soft">
          <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-ink-mute" />技能 {item.skillCount}</span>
          {!guest && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-ink-mute" />模组 {item.moduleCount}</span>}
          {item.warningCount > 0
            ? <span className="flex items-center gap-1.5 text-ochre"><AlertTriangle className="h-4 w-4" />{item.warningCount} 项提示</span>
            : <span className="flex items-center gap-1.5 text-forest">规则校验通过</span>}
          {(item.isPublic || item.legendary?.enabled || item.agePenaltyWaived) ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {item.isPublic ? <span className="rounded-[2px] border border-moon/45 px-1.5 py-0.5 font-mono text-[14px] leading-none tracking-[0.08em] text-moon">公开</span> : null}
              {item.legendary?.enabled ? <span className="rounded-[2px] border border-vermilion/40 px-1.5 py-0.5 font-mono text-[14px] leading-none tracking-[0.08em] text-vermilion">传奇 +{item.legendaryBonusTotal || 0}</span> : null}
              {item.agePenaltyWaived ? <span className="rounded-[2px] border border-forest/45 px-1.5 py-0.5 font-mono text-[14px] leading-none tracking-[0.08em] text-forest">免年龄减益</span> : null}
            </span>
          ) : null}
          {!guest && item.eduGrowth ? (
            item.eduGrowth.settled
              ? <span className="flex items-center gap-1.5 text-ink-soft">
                <GraduationCap className="h-4 w-4 text-ink-mute" />教育 +{item.eduGrowth.gain}
                （{eduGrowthLabel(item.eduGrowth)}）
                {(item.eduGrowth.rerolls || 0) > 0 ? ` · 重掷 ${item.eduGrowth.rerolls} 次` : ''}
              </span>
              : <span className="flex items-center gap-1.5 text-ochre"><GraduationCap className="h-4 w-4" />教育未结算</span>
          ) : null}
        </div>

        {showOwner && (
          <div className="flex items-center gap-1.5 border-t border-line pt-2.5 text-[14px] text-ink-soft">
            <UserIcon className="h-4 w-4 text-ink-mute" />{item.ownerName}
          </div>
        )}
      </div>

      <div className="char-actions border-t border-line px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className={ACT} onClick={() => onOpen(item)}><Eye className="h-4 w-4" strokeWidth={1.8} />查看</button>
          <button type="button" className={ACT} onClick={() => onEdit(item)}><Edit className="h-4 w-4" strokeWidth={1.8} />编辑</button>
          <button type="button" className={ACT} onClick={() => onPrint(item)}><Printer className="h-4 w-4" strokeWidth={1.8} />打印</button>
          <button
            type="button"
            className={ACT}
            disabled={exporting}
            title="导出角色卡编码（给别人导入）或骰娘机器人导入指令"
            onClick={() => onExport(item)}
          >
            <Share2 className="h-4 w-4" strokeWidth={1.8} />{exporting ? '导出中…' : '导出'}
          </button>
          <div className="flex-1" />
          {guest && onPublish ? (
            <button type="button" title="收录到档案馆" onClick={() => onPublish(item)} className="rounded-[2px] p-2 text-ochre transition-colors hover:bg-ochre/10">
              <CloudUpload className="h-4 w-4" strokeWidth={1.8} />
            </button>
          ) : null}
          {!guest && (
          <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <button type="button" title="复制一张" onClick={() => onDuplicate(item)} className="rounded-[2px] p-2 text-ink-mute transition-colors hover:bg-paper-deep/60 hover:text-ink">
              <Copy className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" title="删除" onClick={() => onDelete(item)} className="rounded-[2px] p-2 text-ink-mute transition-colors hover:bg-vermilion/10 hover:text-vermilion">
              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          )}
          {guest ? (
            <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <button type="button" title="删除" onClick={() => onDelete(item)} className="rounded-[2px] p-2 text-ink-mute transition-colors hover:bg-vermilion/10 hover:text-vermilion">
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          ) : null}
        </div>

        {hasKpActions ? (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-line pt-2">
            <span className="mr-1 pl-1 font-mono text-[14px] font-semibold tracking-[0.18em] text-ink-mute">KP 快捷</span>
            {onLegendary ? (
              <button
                type="button"
                className={kpAct(Boolean(item.legendary?.enabled))}
                title={item.legendary?.enabled
                  ? `传奇标记已开启（额外 +${item.legendaryBonusTotal || 0}），点击修改`
                  : '不解锁编辑，直接给这张卡开启传奇标记与额外调整值'}
                onClick={() => onLegendary(item)}
              >
                <Crown className="h-4 w-4" strokeWidth={1.8} />传奇
                {item.legendary?.enabled ? `+${item.legendaryBonusTotal || 0}` : ''}
              </button>
            ) : null}
            {onToggleWaiveAge ? (
              <button
                type="button"
                className={kpAct(Boolean(item.agePenaltyWaived))}
                title={item.agePenaltyWaived
                  ? '当前已豁免年龄减益（属性不因年龄下降、只保留教育成长），点击恢复'
                  : '一键豁免这张卡的年龄减益（只享受教育成长）'}
                onClick={() => onToggleWaiveAge(item)}
              >
                {item.agePenaltyWaived
                  ? <><ShieldOff className="h-4 w-4" strokeWidth={1.8} />恢复年龄</>
                  : <><Shield className="h-4 w-4" strokeWidth={1.8} />豁免年龄</>}
              </button>
            ) : null}
            {onEdu ? (
              <button
                type="button"
                className={kpAct((item.eduGrowth?.granted || 0) > 0)}
                title="不解锁编辑：查看教育增强流水、授权重掷或重置"
                onClick={() => onEdu(item)}
              >
                <GraduationCap className="h-4 w-4" strokeWidth={1.8} />教育
                {(item.eduGrowth?.granted || 0) > 0 ? `（已授权 ${item.eduGrowth.granted}）` : ''}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
export default function CharacterList({
  mode = 'mine', currentUser, showToast, showConfirm, onOpen, onEdit, onPrint,
}) {
  const isKp = mode === 'kp' && currentUser?.role === 'admin';
  const isGuest = mode === 'guest' || !currentUser;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!isGuest);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [meta, setMeta] = useState({ owners: [], moduleOptions: [], customOccupations: [] });
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    if (isGuest) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isKp) params.set('scope', 'all');
      if (status) params.set('status', status);
      if (isKp && ownerId) params.set('ownerId', ownerId);
      if (moduleId) params.set('moduleId', moduleId);
      if (q.trim()) params.set('q', q.trim());
      const res = await apiGet(`/api/characters?${params.toString()}`);
      let list = res.items || [];
      if (reviewStatus) list = list.filter((c) => (c.reviewStatus || 'none') === reviewStatus);
      setItems(list);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [isKp, isGuest, status, ownerId, moduleId, q, reviewStatus, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isGuest) return;
    apiGet('/api/characters/meta')
      .then((m) => setMeta({
        owners: m.owners || [],
        moduleOptions: m.moduleOptions || [],
        customOccupations: m.customOccupations || [],
      }))
      .catch(() => { /* 元数据失败不影响列表 */ });
  }, [isGuest]);

  const [cardImportOpen, setCardImportOpen] = useState(false);
  const [legendaryItem, setLegendaryItem] = useState(null);
  const [eduItem, setEduItem] = useState(null);
  const [exportItem, setExportItem] = useState(null);
  const [exportingId, setExportingId] = useState('');

  const [guestItems, setGuestItems] = useState(() => buildGuestItems());
  const capacity = guestCapacity();

  const refreshGuest = useCallback(() => setGuestItems(buildGuestItems()), []);

  const displayItems = isGuest ? guestItems : items;

  const stats = useMemo(() => ({
    total: displayItems.length,
    active: displayItems.filter((i) => i.status === 'active').length,
    warned: displayItems.filter((i) => i.warningCount > 0).length,
    pending: displayItems.filter((i) => i.reviewStatus === 'pending').length,
  }), [displayItems]);

  const handleDelete = (item) => showConfirm(`确定删除角色卡【${item.name}】吗？此操作不可恢复。`, async () => {
    try {
      if (isGuest) { deleteGuestSheet(item.id); refreshGuest(); showToast('本机草稿已删除'); return; }
      await apiDelete(`/api/characters/${item.id}`);
      showToast('角色卡已删除');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  });

  /** KP 快捷：一键开关「豁免年龄减益」 */
  const toggleWaiveAge = async (item) => {
    try {
      const saved = await apiPatch(`/api/characters/${item.id}`, { agePenaltyWaived: !item.agePenaltyWaived });
      showToast(saved.agePenaltyWaived
        ? `已豁免【${item.name}】的年龄减益（只保留教育成长）`
        : `已恢复【${item.name}】的年龄减益`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /**
   * 导出：列表摘要不含完整车卡数据，先按需拉一次详情再打开导出弹窗
   * （访客草稿本身就是完整存档，直接用）。
   */
  const openExport = async (item) => {
    if (isGuest) { setExportItem(item); return; }
    setExportingId(item.id);
    try {
      const full = await apiGet(`/api/characters/${item.id}`);
      setExportItem(full);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setExportingId(''); }
  };

  const handleDuplicate = async (item) => {
    try {
      await apiPost(`/api/characters/${item.id}/duplicate`, {});
      showToast('已复制一张角色卡');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /** 把本机访客草稿收录到自己的账号下 */
  const importAllGuest = async () => {
    setImporting(true);
    let done = 0;
    try {
      for (const g of guestItems) {
        const { id, guest, updatedAt, createdAt, ...payload } = g;
        void id; void guest; void updatedAt; void createdAt;
        await apiPost('/api/characters', payload);
        deleteGuestSheet(g.id);
        done += 1;
      }
      refreshGuest();
      await load();
      setImportOpen(false);
      showToast(`已收录 ${done} 张角色卡到你的档案馆`);
    } catch (err) {
      showToast(`收录到第 ${done + 1} 张时失败：${err.message}`, 'error');
      refreshGuest();
      load();
    } finally { setImporting(false); }
  };

  const importOne = async (item) => {
    try {
      const { id, guest, updatedAt, createdAt, ...payload } = item;
      void id; void guest; void updatedAt; void createdAt;
      await apiPost('/api/characters', payload);
      deleteGuestSheet(item.id);
      refreshGuest();
      showToast('已收录到你的档案馆');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const title = isGuest ? '角色卡（访客模式）' : (isKp ? '角色卡统一管理' : '我的角色卡');
  const desc = isGuest
    ? '未登录也能完整车卡、打印与导出 PDF；数据保存在本机浏览器里，登录后可一键收录到自己的账号下。'
    : (isKp
      ? '查看与管理全站调查员角色卡：代玩家修改、批量打印、按玩家 / 状态 / 审核进度检索。'
      : '在这里创建、编辑、打印你的调查员角色卡；KP 可以看到并协助管理。');

  return (
    <div className="space-y-6">
      <PageHeader
        tone={isKp ? 'forest' : 'vermilion'}
        eyebrow={isKp ? 'INVESTIGATOR DOSSIERS · 全站名册' : 'INVESTIGATOR ROSTER · 调查员名册'}
        meta={`MCMXX — ${new Date().getFullYear()} · 内部流通`}
        title={title}
        titleClassName="moon-text !text-[34px] sm:!text-[42px]"
        desc={desc}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {!isGuest && <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={load}><RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />刷新</Button>}
            {isGuest && guestItems.length > 0 && !currentUser && (
              <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={() => onEdit(null)} disabled><LogIn className="h-4 w-4" />登录后可收录</Button>
            )}
            {isGuest && guestItems.length > 0 && currentUser && (
              <Button variant="amber" className="!px-3 !py-1.5 !text-[14px]" onClick={() => setImportOpen(true)}>
                <CloudUpload className="h-4 w-4" />一键收录 {guestItems.length} 张
              </Button>
            )}
            <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={() => setCardImportOpen(true)}>
              <Upload className="h-4 w-4" />导入角色卡
            </Button>
            <Button className="!px-3.5 !py-1.5 !text-[14px]" onClick={() => onEdit(null)}><Plus className="h-4 w-4" />新建角色卡</Button>
          </div>
        )}
      />

      {isGuest && (
        <div className="flex items-start gap-2.5 border-l-2 border-amber-600/50 bg-amber-500/[0.05] px-4 py-3.5 text-[14px] leading-[1.8] text-ink-soft">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ochre" strokeWidth={1.9} />
          <span>
            访客角色卡只保存在这台设备的浏览器里（当前 {capacity.count} / {capacity.max} 张），换设备或清理浏览器数据会丢失。
            {currentUser ? '你已登录，可以随时把草稿收录进档案馆。' : '登录后可以一键收录，并解锁模组经历关联等功能。'}
          </span>
        </div>
      )}

      {!isGuest && (
        <div className="space-y-3.5">
          <div className="relative grid gap-3 border border-line-strong bg-paper-raised/60 p-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索角色名 / 玩家名…" className="!rounded-full !pl-9 !text-[16px]" />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!text-[16px]">
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="!text-[16px]">
              <option value="">全部审核状态</option>
              {Object.entries(REVIEW_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            {isKp ? (
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="!text-[16px]">
                <option value="">全部玩家</option>
                {meta.owners.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </Select>
            ) : (
              <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="!text-[16px]">
                <option value="">全部模组经历</option>
                {meta.moduleOptions.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </Select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] tracking-[0.02em] text-ink-soft">
            <span className="flex items-center gap-1.5"><Filter className="h-4 w-4" strokeWidth={1.8} />共 {stats.total} 张</span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>使用中 {stats.active}</span>
            {isKp && stats.pending > 0 ? <span className="text-ochre">待审核 {stats.pending}</span> : null}
            <span className={stats.warned ? 'text-ochre' : ''}>有规则提示 {stats.warned}</span>
          </div>
        </div>
      )}

      {loading && displayItems.length === 0 ? (
        <Panel><EmptyState title="正在载入…" /></Panel>
      ) : displayItems.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title={isGuest ? '还没有角色卡' : (isKp ? '还没有任何角色卡' : '你还没有角色卡')}
            desc={isGuest
              ? '点击「新建角色卡」即可开始：一键掷骰、自动算派生值、自动标记本职技能，全程无需登录。'
              : (isKp ? '玩家创建角色卡后会出现在这里。' : '点击「新建角色卡」开始半自动车卡。')}
            action={<Button onClick={() => onEdit(null)}><Plus className="w-4 h-4" />新建角色卡</Button>}
          />
        </Panel>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayItems.map((item) => (
            <CharacterCard
              key={item.id}
              item={item}
              guest={isGuest}
              showOwner={isKp}
              onOpen={onOpen}
              onEdit={onEdit}
              onPrint={onPrint}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPublish={isGuest && currentUser ? importOne : null}
              onLegendary={isKp ? (it) => setLegendaryItem(it) : null}
              onEdu={isKp ? (it) => setEduItem(it) : null}
              onToggleWaiveAge={isKp ? toggleWaiveAge : null}
              onExport={openExport}
              exporting={exportingId === item.id}
            />
          ))}
        </div>
      )}

      <ExportCardModal
        open={Boolean(exportItem)}
        character={exportItem}
        onToast={showToast}
        onClose={() => setExportItem(null)}
      />

      <EduQuickModal
        open={Boolean(eduItem)}
        item={eduItem ? { ...eduItem, __actor: currentUser?.username || '' } : null}
        showToast={showToast}
        onClose={() => setEduItem(null)}
        onSaved={() => load()}
      />

      <LegendaryQuickModal
        open={Boolean(legendaryItem)}
        item={legendaryItem}
        showToast={showToast}
        onClose={() => setLegendaryItem(null)}
        onSaved={() => load()}
      />

      <ImportCardModal
        open={cardImportOpen}
        onClose={() => setCardImportOpen(false)}
        onToast={showToast}
        onImport={async (sheet) => {
          try {
            if (isGuest && !currentUser) {
              if (guestItems.length >= capacity.max) return showToast(`本机最多保存 ${capacity.max} 张草稿`, 'error');
              saveGuestSheet(sheet);
              refreshGuest();
              setCardImportOpen(false);
              showToast('已导入到本机草稿');
              return;
            }
            await apiPost('/api/characters', {
              ...sheet,
              name: sheet.name || '导入的调查员',
              playerName: sheet.playerName || currentUser?.username || '',
            });
            setCardImportOpen(false);
            await load();
            showToast('角色卡已导入');
          } catch (err) {
            showToast(`导入失败：${err.message}`, 'error');
          }
        }}
      />

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="收录访客角色卡">
        <div className="space-y-4">
          <p className="text-[16px] leading-[1.7] text-ink-soft">
            下面的 {guestItems.length} 张角色卡将从本机浏览器转移到你的档案馆账号下：
          </p>
          <ul className="space-y-1 max-h-60 overflow-y-auto">
            {guestItems.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-line bg-paper-deep px-3 py-2.5 text-[14.5px]">
                <span className="text-ink">{g.name || '未命名调查员'}</span>
                <span className="text-[14px] text-ink-mute">{g.occupationName || '无职业'}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] text-ink-mute">收录成功后本机草稿会被清理，避免重复。</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={importAllGuest} disabled={importing}>
              <CloudUpload className="w-4 h-4" />{importing ? '收录中…' : '确认收录'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
