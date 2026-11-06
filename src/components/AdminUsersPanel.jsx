/**
 * 守秘人名册（账号管理）。
 *
 * 多 KP 体系下的分工：
 *  - 首席守秘人（kpRank === 'chief'）：看到全站账号，可发放玩家或守秘人、任免守秘人、
 *    改名 / 重置密码 / 删除 / 调建卡额度 / 授予玩家头衔；
 *  - 普通守秘人：只看得到自己发放的账号，页面只提供「发放调查员账号」与只读名册
 *    （服务端同样会 403，UI 不再给出入口）。
 *
 * 与旧实现的差异：
 *  - 「重置密码」不再把口令固定成 123456，而是由服务端生成随机强口令并只显示一次。
 *  - 新建账号只要求密码长度 ≥6 位（不强制复杂度）。
 *  - 删除账号会同时清理该玩家的角色卡与已跑记录，界面明确提示影响范围。
 *
 * 视觉：v3「铅印案卷」的馆员名册 —— 发放新账号是一张登记单，
 * 账号表是深墨表头的账页，重置口令是一次性凭据票据。
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Crown, RefreshCw, Search, Shield, User as UserIcon, UserPlus } from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../lib/api.js';
import {
  Badge, Button, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Pager, Panel, Select, StatStrip, cx,
} from './ui.jsx';
import { usernameHint } from './AccountRenameCard.jsx';
import { KP_TITLES, PLAYER_TITLES } from '../../shared/coc7e.js';

/** 普通守秘人发号时服务端统一使用的建卡额度（backend/lib/db.js DEFAULT_MAX_CHARACTERS） */
const DEFAULT_CHARACTER_LIMIT = 30;

const isChiefAccount = (u) => u?.role === 'admin' && u?.kpRank === 'chief';
const isKeeperAccount = (u) => u?.role === 'admin';
/** 发放人：老数据没有留痕时按「首席」展示 */
const issuerOf = (u, chiefName) => u?.createdByName || chiefName || '首席';

/** 三档身份：首席守秘人 / 守秘人 · 称号 / 调查员 */
function RoleBadge({ user, className }) {
  const chief = isChiefAccount(user);
  const keeper = isKeeperAccount(user);
  const Icon = chief ? Crown : keeper ? Shield : UserIcon;
  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 border px-2 py-1 text-[14px] tracking-[0.06em]',
      keeper
        ? 'border-amber-500/45 bg-amber-500/[0.05] text-amber-500'
        : 'border-indigo/35 bg-indigo/[0.04] text-indigo',
      className,
    )}>
      <Icon className="h-4 w-4" />
      {chief ? '首席' : keeper ? '守秘人' : '调查员'}
    </span>
  );
}

/** 账号行内的建卡上限编辑器：失焦或回车时提交，0 表示暂停建卡 */
function LimitInput({ value, used, onCommit }) {
  const [draft, setDraft] = useState(String(value ?? 30));

  const commit = () => {
    const n = Math.trunc(Number(draft));
    if (!Number.isFinite(n)) { setDraft(String(value ?? 30)); return; }
    const next = Math.max(0, Math.min(200, n));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        max={200}
        inputMode="numeric"
        aria-label="建卡上限"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        onWheel={(e) => e.currentTarget.blur()}
        className="w-14 border border-line-strong bg-paper px-1.5 py-1 text-center font-mono text-[14px] text-slate-100 outline-none focus:border-indigo"
      />
      <span className="whitespace-nowrap text-[13px] text-slate-500">张 · 已用 {used}</span>
    </span>
  );
}

/** 只读的建卡额度：普通守秘人看不到任何编辑入口 */
function LimitText({ value, used }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[14px] text-slate-200 tabular">{value ?? DEFAULT_CHARACTER_LIMIT}</span>
      <span className="whitespace-nowrap text-[13px] text-slate-500">张 · 已用 {used}</span>
    </span>
  );
}

export default function AdminUsersPanel({
  currentUser, setView, showToast, showConfirm,
}) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newLimit, setNewLimit] = useState(30);
  const [newRole, setNewRole] = useState('user');
  const [newKpTitle, setNewKpTitle] = useState(KP_TITLES[0]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null);
  const [renaming, setRenaming] = useState(null);   // { id, username }
  const [renameTo, setRenameTo] = useState('');
  const [query, setQuery] = useState('');
  const [promoteId, setPromoteId] = useState('');
  const [promoteTitle, setPromoteTitle] = useState(KP_TITLES[0]);
  // 首席移交后本机立即按普通守秘人渲染，避免继续显示仅首席可见的入口
  const [chiefTransferred, setChiefTransferred] = useState(false);

  const isChief = !chiefTransferred && currentUser?.kpRank === 'chief';

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await apiGet('/api/admin/users'));
    } catch (err) { showToast(err.message, 'error'); }
  }, [showToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const makeKeeper = isChief && newRole === 'admin';
      await apiPost('/api/admin/users', {
        username: newUsername,
        password: newPwd,
        maxCharacters: newLimit,
        ...(isChief ? { role: newRole } : {}),
        ...(makeKeeper ? { kpTitle: newKpTitle } : {}),
      });
      showToast(makeKeeper ? `守秘人账号已发放（${newKpTitle}）` : '调查员账号已发放');
      setNewUsername(''); setNewPwd(''); setNewLimit(30);
      setNewRole('user'); setNewKpTitle(KP_TITLES[0]);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const handleResetPwd = (userId, username) => showConfirm(
    `要重置账号【${username}】的密码吗？`,
    async () => {
      try {
        const res = await apiPut(`/api/admin/users/${userId}/password`, {});
        setIssued({ username, password: res.password });
        showToast('已生成新的随机密码，请立即转告本人');
        loadUsers();
      } catch (err) { showToast(err.message, 'error'); }
    },
    { detail: '系统会生成一个随机强口令，旧密码立即失效；请把它安全地转告本人。', danger: false },
  );

  const handleDeleteUser = (userId, username, charCount, keeper) => showConfirm(
    `确定要永久删除账号【${username}】吗？`,
    async () => {
      try {
        const res = await apiDelete(`/api/admin/users/${userId}`);
        showToast(`账号已删除（同时清理角色卡 ${res.charsRemoved} 张）`);
        loadUsers();
      } catch (err) { showToast(err.message, 'error'); }
    },
    {
      detail: `该账号名下有 ${charCount} 张角色卡，删除后一并清除且不可恢复。`
        + (keeper ? '该账号是守秘人，删除后其审卡任务会退回首席守秘人。' : ''),
    },
  );

  /** 首席代改用户名 */
  const handleRename = async () => {
    const target = renaming;
    if (!target) return;
    const next = renameTo.trim();
    const problem = usernameHint(next);
    if (problem) return showToast(problem, 'error');
    if (next === target.username) return showToast('新用户名没有变化', 'error');
    try {
      const res = await apiPut(`/api/admin/users/${target.id}/username`, { username: next });
      showToast(res.syncedCharacters
        ? `已改名为「${next}」，同步更新了 ${res.syncedCharacters} 张角色卡的玩家名`
        : `已改名为「${next}」`);
      setRenaming(null);
      setRenameTo('');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /** 玩家五级荣誉头衔（守秘人同时是玩家，也有这份称号） */
  const handleUpdateTitle = async (userId, newTitle) => {
    try {
      await apiPut(`/api/admin/users/${userId}/title`, { title: newTitle });
      showToast(`已授予玩家头衔：${newTitle}`);
      loadUsers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /** 守秘人五级称号 */
  const handleUpdateKpTitle = async (userId, newKpTitle) => {
    try {
      await apiPut(`/api/admin/users/${userId}/kp-title`, { kpTitle: newKpTitle });
      showToast(`守秘人称号已改为「${newKpTitle}」`);
      loadUsers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /** 调整单个账号的建卡上限；0 = 暂停建卡 */
  const handleUpdateLimit = async (userId, maxCharacters) => {
    try {
      await apiPatch(`/api/admin/users/${userId}`, { maxCharacters });
      showToast(`建卡上限已改为 ${maxCharacters} 张`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      loadUsers();
    }
  };

  /** 任命普通守秘人：先升级身份，再写入所选称号 */
  const handlePromote = () => {
    const target = users.find((u) => u.id === promoteId);
    if (!target) return showToast('请先选择一个玩家账号', 'error');
    return showConfirm(
      `把【${target.username}】任命为守秘人？`,
      async () => {
        try {
          await apiPut(`/api/admin/users/${target.id}/kp-rank`, { role: 'admin', kpRank: 'keeper' });
          await apiPut(`/api/admin/users/${target.id}/kp-title`, { kpTitle: promoteTitle });
          showToast(`已将【${target.username}】任命为${promoteTitle}`);
          setPromoteId('');
          loadUsers();
        } catch (err) {
          showToast(err.message, 'error');
          loadUsers();
        }
      },
      {
        detail: `守秘人称号：${promoteTitle}。任命后可审核玩家指定给他的角色卡、发布职业模板并维护个人审卡规则。`,
        danger: false,
      },
    );
  };

  /** 撤销守秘人身份，回到玩家 */
  const handleDemote = (target) => showConfirm(
    `把守秘人【${target.username}】降回玩家？`,
    async () => {
      try {
        await apiPut(`/api/admin/users/${target.id}/kp-rank`, { role: 'user' });
        showToast(`【${target.username}】已降回玩家`);
        loadUsers();
      } catch (err) { showToast(err.message, 'error'); }
    },
    { detail: '该账号将失去审卡与发布职业模板的权限；指定给他的待审角色卡会退回首席守秘人。' },
  );

  /** 首席移交：全局唯一，接任者上任后原首席自动降为普通守秘人 */
  const handleTransferChief = (target) => showConfirm(
    `把首席之位移交给【${target.username}】？`,
    async () => {
      try {
        await apiPut(`/api/admin/users/${target.id}/kp-rank`, { role: 'admin', kpRank: 'chief' });
        showToast('首席已移交，你现在是普通守秘人；建议重新登录刷新权限');
        setChiefTransferred(true);
        loadUsers();
      } catch (err) { showToast(err.message, 'error'); }
    },
    { detail: '首席全局唯一：移交后你会立即降为普通守秘人，只能看到自己发放的账号。' },
  );

  const admins = users.filter(isKeeperAccount).length;
  /** 老账号没有 createdByName 时，用首席守秘人的真实用户名兜底 */
  const chiefName = users.find(isChiefAccount)?.username || '首席';
  const stats = [
    { label: isChief ? '在册馆员' : '我发放的账号', value: users.length, unit: '人' },
    { label: isChief ? '守秘人' : '其中守秘人', value: admins, unit: '位' },
    { label: '调查员', value: users.length - admins, unit: '位' },
    { label: '名下角色卡', value: users.reduce((sum, u) => sum + (u.characterCount || 0), 0), unit: '张' },
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter((u) => u.username.toLowerCase().includes(normalizedQuery))
    : users;
  const keepers = users
    .filter(isKeeperAccount)
    .sort((a, b) => (isChiefAccount(a) ? 0 : 1) - (isChiefAccount(b) ? 0 : 1));
  const ACCOUNT_PAGE = 8;
  const KEEPER_PAGE = 4;
  const [accountPage, setAccountPage] = useState(1);
  const [keeperPage, setKeeperPage] = useState(1);
  useEffect(() => { setAccountPage(1); }, [normalizedQuery]);
  const accountPages = Math.max(1, Math.ceil(filteredUsers.length / ACCOUNT_PAGE));
  const accountPageNow = Math.min(accountPage, accountPages);
  const pagedUsers = filteredUsers.slice((accountPageNow - 1) * ACCOUNT_PAGE, accountPageNow * ACCOUNT_PAGE);
  const keeperPages = Math.max(1, Math.ceil(keepers.length / KEEPER_PAGE));
  const keeperPageNow = Math.min(keeperPage, keeperPages);
  const pagedKeepers = keepers.slice((keeperPageNow - 1) * KEEPER_PAGE, keeperPageNow * KEEPER_PAGE);
  const players = users.filter((u) => u.role === 'user');
  const formatRegistered = (value) => {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in">
      <PageHeader
        tone="ink"
        back={{ label: '返回个人中心', onClick: () => setView('profile') }}
        title={isChief ? '守秘人名册与账号管理' : '我发放的账号'}
        desc={isChief
          ? '全站账号由首席守秘人统管：发放调查员或守秘人、任免守秘人、调整建卡额度与头衔。口令以哈希形式保存，任何人都无法查看原文。'
          : '名册里只会出现你自己发放的账号：可以发放新的调查员账号、查看角色卡数与建卡额度；改名、重置密码与额度调整由首席守秘人统一处理。'}
        actions={(
          <>
            <span className="stamp hidden !text-[14px] text-red-600 sm:inline-flex" aria-hidden="true">
              MEMBER REGISTER
            </span>
            <Button variant="ghost" onClick={loadUsers}><RefreshCw className="h-4 w-4" />刷新</Button>
          </>
        )}
      />

      <StatStrip items={stats} />

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line-strong bg-paper-deep/40 px-5 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">FORM 04</span>
            <h2 className="font-serif text-[18px] font-bold tracking-[0.02em] text-slate-100">
              {isChief ? '发放新账号' : '发放调查员账号'}
            </h2>
            <span className="font-kai text-[14px] tracking-[0.08em] text-slate-500">一册一人 · 离册即失效</span>
          </div>
          <span className="caption">NEW ACCOUNT</span>
        </div>

        <form
          onSubmit={handleCreateUser}
          className={cx(
            'grid gap-5 p-5 sm:grid-cols-2 sm:items-end sm:p-6',
            isChief ? 'xl:grid-cols-[1fr_1fr_7rem_8rem_10rem_auto]' : 'xl:grid-cols-[1fr_1fr_7rem_auto]',
          )}
        >
          <Field label="新用户名">
            <Input
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={24}
              className="!rounded-none !border-x-0 !border-t-0 !border-b !border-line-strong !bg-transparent !px-0 focus:!border-indigo focus:!ring-0"
            />
          </Field>
          <Field label="初始密码" hint="≥6 位">
            <Input
              required
              type="text"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              maxLength={128}
              className="!rounded-none !border-x-0 !border-t-0 !border-b !border-line-strong !bg-transparent !px-0 focus:!border-indigo focus:!ring-0"
            />
          </Field>
          {isChief && (
            <Field label="角色">
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="!rounded-none !border-x-0 !border-t-0 !border-b !border-line-strong !bg-transparent !py-2.5 !pl-0 !pr-8 !text-[14px] text-slate-200 focus:!border-indigo focus:!ring-0"
              >
                <option value="user">玩家</option>
                <option value="admin">守秘人</option>
              </Select>
            </Field>
          )}
          {isChief && newRole === 'admin' && (
            <Field label="守秘人称号">
              <Select
                value={newKpTitle}
                onChange={(e) => setNewKpTitle(e.target.value)}
                className="!rounded-none !border-x-0 !border-t-0 !border-b !border-line-strong !bg-transparent !py-2.5 !pl-0 !pr-8 !text-[14px] text-slate-200 focus:!border-indigo focus:!ring-0"
              >
                {KP_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          )}
          <Field label="建卡额度" hint={isChief ? '0 = 暂停建卡' : '由首席统一设定'}>
            <NumberInput
              min={0}
              max={200}
              value={isChief ? newLimit : DEFAULT_CHARACTER_LIMIT}
              disabled={!isChief}
              onChange={(v) => setNewLimit(v === '' ? 0 : v)}
              className="!rounded-none !border-x-0 !border-t-0 !border-b !border-line-strong !bg-transparent !px-0 !text-left focus:!border-indigo focus:!ring-0"
            />
          </Field>
          <div className={cx('flex items-end', isChief ? 'xl:col-start-6' : 'xl:col-start-4')}>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto"><UserPlus className="h-4 w-4" />发放新账号</Button>
          </div>
        </form>
      </Panel>

      {isChief && (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b-2 border-ink px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">COMMISSION 01</span>
              <h2 className="font-serif text-[20px] font-bold tracking-[0.01em] text-slate-100">守秘人任免</h2>
              <span className="caption hidden sm:inline">KEEPER COMMISSION</span>
            </div>
            <span className="font-kai text-[14px] tracking-[0.08em] text-slate-500">首席全局唯一 · 接任即移交</span>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-[16px] leading-relaxed text-slate-500">
              把玩家账号任命为守秘人（附带称号）、把守秘人降回玩家，或把首席之位移交给某位守秘人。
              普通守秘人只能管理自己发放的账号，审卡规则也都是各自的个人规则。
            </p>

            <div className="mt-4 border-y border-line">
              {pagedKeepers.map((k) => (
                <div key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line-soft py-3 last:border-b-0">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center border border-red-500/50 bg-red-500/[0.04] font-serif text-[14px] font-bold text-red-600"
                    >
                      {k.username.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-slate-100">
                        {k.username}
                        {k.id === currentUser?.id ? <span className="ml-2 font-kai text-[14px] tracking-[0.08em] text-slate-500">本账号</span> : null}
                      </span>
                      <span className="mt-0.5 block font-kai text-[14px] tracking-[0.06em] text-slate-500">发放人：{issuerOf(k, chiefName)}</span>
                    </span>
                  </div>

                  {isChiefAccount(k) ? (
                    <span className="inline-flex items-center gap-1.5 border border-amber-500/45 bg-amber-500/[0.05] px-2 py-1 text-[14px] tracking-[0.06em] text-amber-500">
                      <Crown className="h-4 w-4" />首席
                    </span>
                  ) : (
                    <>
                      <Select
                        value={k.kpTitle || KP_TITLES[0]}
                        onChange={(e) => handleUpdateKpTitle(k.id, e.target.value)}
                        aria-label={`${k.username} 的守秘人称号`}
                        className="!w-auto !min-w-[9.5rem] !py-1.5 !text-[14px]"
                      >
                        {KP_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </Select>
                      <button
                        type="button"
                        onClick={() => handleTransferChief(k)}
                        className="border-b border-transparent pb-0.5 text-[14px] text-amber-500 transition-colors hover:border-amber-500 hover:text-amber-400"
                      >
                        接任首席
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemote(k)}
                        className="whitespace-nowrap border-b border-transparent pb-0.5 text-[13.5px] text-red-600 transition-colors hover:border-red-500 hover:text-red-500"
                      >
                        降回玩家
                      </button>
                    </>
                  )}
                </div>
              ))}
              <Pager page={keeperPageNow} total={keepers.length} pageSize={KEEPER_PAGE} onChange={setKeeperPage} label="位" />
            </div>

            <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
              <Field label="任命新守秘人" hint={players.length ? `可选玩家 ${players.length} 位` : '暂无玩家账号'}>
                <Select
                  value={promoteId}
                  onChange={(e) => setPromoteId(e.target.value)}
                  disabled={!players.length}
                >
                  <option value="">请选择玩家账号…</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.username}</option>)}
                </Select>
              </Field>
              <Field label="守秘人称号">
                <Select
                  value={promoteTitle}
                  onChange={(e) => setPromoteTitle(e.target.value)}
                  disabled={!promoteId}
                >
                  {KP_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <div className="flex items-end">
                <Button onClick={handlePromote} disabled={!promoteId} className="w-full sm:w-auto">
                  <Crown className="h-4 w-4" />任命守秘人
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {issued && (
        <div className="relative overflow-hidden border-2 border-amber-500/50 bg-paper-raised p-4 sm:p-5">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" />
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
            <p className="text-[16px] font-bold text-amber-500">新口令（只显示这一次，请立即抄送本人）</p>
            <span className="caption">ONE-TIME CREDENTIAL</span>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all border border-line-strong bg-paper px-3 py-2.5 font-mono text-[14px] tracking-[0.04em] text-slate-100">
              {issued.username} / {issued.password}
            </code>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(`${issued.username} / ${issued.password}`)
                    .then(() => showToast('已复制到剪贴板'))
                    .catch(() => showToast('复制失败，请手动选择复制', 'error'));
                }}
              >
                <Copy className="h-4 w-4" />复制
              </Button>
              <Button variant="ghost" onClick={() => setIssued(null)}>知道了</Button>
            </div>
          </div>
          <p className="mt-2 font-kai text-[14px] tracking-[0.08em] text-slate-500">此凭据离页即焚 · 不留副本</p>
        </div>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b-2 border-ink px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[14px] tracking-[0.18em] text-red-500">INDEX 01</span>
            <h2 className="font-serif text-[20px] font-bold tracking-[0.01em] text-slate-100">馆员名册</h2>
            <span className="caption hidden sm:inline">
              {isChief ? 'REGISTER OF KEEPERS & INVESTIGATORS' : 'REGISTER OF ISSUED ACCOUNTS'}
            </span>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索用户名…"
                aria-label="搜索用户名"
                className="!w-full !py-2 !pl-9 !text-[16px] sm:!w-[220px]"
              />
            </div>
            <span className="border border-line-strong bg-paper px-2 py-1 font-mono text-[14px] tracking-[0.14em] text-slate-500 tabular">
              {normalizedQuery ? `${filteredUsers.length} / ${users.length}` : users.length} 位在册
            </span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="bg-ink text-paper-raised">
                <th className="w-12 px-3 py-3 font-mono text-[14px] font-medium tracking-[0.14em] text-paper-deep/70">NO.</th>
                <th className="px-2.5 py-2.5 text-[14px] font-semibold tracking-[0.16em]">用户名</th>
                <th className="px-2.5 py-2.5 text-[14px] font-semibold tracking-[0.16em]">权限角色</th>
                <th className="px-2.5 py-2.5 text-[14px] font-semibold tracking-[0.16em]">荣誉头衔</th>
                <th className="px-2.5 py-2.5 text-center text-[14px] font-semibold tracking-[0.16em]">角色卡</th>
                <th className="px-2.5 py-2.5 text-center text-[14px] font-semibold tracking-[0.16em]">建卡额度</th>
                <th className="px-2.5 py-2.5 text-[14px] font-semibold tracking-[0.16em]">发放人</th>
                {isChief && (
                  <th className="px-2.5 py-2.5 text-right text-[14px] font-semibold tracking-[0.16em]">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u, idx) => {
                const canDelete = isChief && !isChiefAccount(u) && u.id !== currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-line transition-colors hover:bg-paper-deep/60">
                    <td className="px-3 py-[13px] font-mono text-[14px] text-slate-500 tabular">
                      {String((accountPageNow - 1) * ACCOUNT_PAGE + idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cx(
                            'flex h-6 w-6 shrink-0 items-center justify-center border font-serif text-[14px] font-bold',
                            isKeeperAccount(u)
                              ? 'border-red-500/50 bg-red-500/[0.04] text-red-600'
                              : 'border-indigo/35 bg-paper text-indigo',
                          )}
                        >
                          {u.username.slice(0, 1)}
                        </span>
                        <span className="max-w-[9.5rem] truncate text-[14.5px] font-medium text-slate-100" title={u.username}>{u.username}</span>
                        {u.mustChangePassword ? <Badge tone="red" className="!text-[14px]">弱口令待改</Badge> : null}
                      </span>
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <RoleBadge user={u} />
                    </td>
                    <td className="px-2.5 py-[10px]">
                      {isChief ? (
                        <Select
                          value={u.title || PLAYER_TITLES[0]}
                          onChange={(e) => handleUpdateTitle(u.id, e.target.value)}
                          aria-label={`${u.username} 的玩家头衔`}
                          className="!w-[8.25rem] !min-w-0 !max-w-none !rounded-none !border-x-0 !border-t-0 !bg-transparent !py-1 !pl-0 !pr-6 !text-[14px] text-slate-300"
                        >
                          {PLAYER_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Select>
                      ) : (
                        <span className="font-kai text-[14.5px] tracking-[0.08em] text-slate-400">{u.title || PLAYER_TITLES[0]}</span>
                      )}
                    </td>
                    <td className="px-2.5 py-[10px] text-center">
                      <span className={cx('font-mono text-[16px] font-semibold tabular', u.characterCount ? 'text-emerald-700' : 'text-slate-500')}>
                        {u.characterCount || 0}
                      </span>
                      <span className="ml-1 text-[14px] text-slate-500">张</span>
                    </td>
                    <td className="px-2.5 py-[10px] text-center">
                      {isChief ? (
                        <LimitInput
                          key={`${u.id}-${u.characterLimit}`}
                          value={u.characterLimit}
                          used={u.characterCount || 0}
                          onCommit={(next) => handleUpdateLimit(u.id, next)}
                        />
                      ) : (
                        <LimitText value={u.characterLimit} used={u.characterCount || 0} />
                      )}
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <span className="block max-w-[7.5rem] truncate font-kai text-[14px] tracking-[0.06em] text-slate-400" title={issuerOf(u, chiefName)}>{issuerOf(u, chiefName)}</span>
                    </td>
                    {isChief && (
                      <td className="px-2.5 py-[10px]">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setRenaming({ id: u.id, username: u.username }); setRenameTo(u.username); }}
                            className="whitespace-nowrap border-b border-transparent pb-0.5 text-[13.5px] text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-100"
                          >
                            改名
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPwd(u.id, u.username)}
                            className="whitespace-nowrap border-b border-transparent pb-0.5 text-[13.5px] text-emerald-700 transition-colors hover:border-emerald-700 hover:text-emerald-600"
                          >
                            重置密码
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username, u.characterCount || 0, isKeeperAccount(u))}
                              className="whitespace-nowrap border-b border-transparent pb-0.5 text-[13.5px] text-red-600 transition-colors hover:border-red-500 hover:text-red-500"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={isChief ? 8 : 7} className="px-4 py-10">
                    <EmptyState
                      title="没有匹配的账号"
                      desc={isChief ? '换一个用户名关键词再试。' : '你还没有发放过账号，或关键词不匹配。'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pager page={accountPageNow} total={filteredUsers.length} pageSize={ACCOUNT_PAGE} onChange={setAccountPage} label="位" />
        </div>

        <div className="md:hidden">
          {pagedUsers.map((u) => {
            const canDelete = isChief && !isChiefAccount(u) && u.id !== currentUser?.id;
            return (
              <article key={u.id} className="border-b border-line px-4 py-[14px] last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cx(
                        'flex h-8 w-8 shrink-0 items-center justify-center border font-serif text-[14px] font-bold',
                        isKeeperAccount(u)
                          ? 'border-red-500/50 bg-red-500/[0.04] text-red-600'
                          : 'border-indigo/35 bg-paper text-indigo',
                      )}
                    >
                      {u.username.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-medium text-slate-100">{u.username}</p>
                      <p className="mt-0.5 font-kai text-[14px] tracking-[0.06em] text-slate-500">
                        {u.mustChangePassword ? '弱口令待改' : `加入于 ${formatRegistered(u.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <RoleBadge user={u} className="shrink-0" />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-2.5">
                  <div>
                    <dt className="font-mono text-[14px] tracking-[0.14em] text-slate-500">角色卡数</dt>
                    <dd className={cx('mt-0.5 font-mono text-[14px] font-semibold tabular', u.characterCount ? 'text-emerald-700' : 'text-slate-500')}>
                      {u.characterCount || 0} / {u.characterLimit ?? 30} <span className="text-[14px] font-normal text-slate-500">张</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[14px] tracking-[0.14em] text-slate-500">注册时间</dt>
                    <dd className="mt-0.5 font-mono text-[14.5px] text-slate-300 tabular">{formatRegistered(u.createdAt)}</dd>
                  </div>
                  <div className="col-span-2 border-t border-line-soft pt-2">
                    <dt className="font-mono text-[14px] tracking-[0.14em] text-slate-500">发放人</dt>
                    <dd className="mt-0.5 font-kai text-[14.5px] tracking-[0.08em] text-slate-300">{issuerOf(u, chiefName)}</dd>
                  </div>
                </dl>

                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500">建卡上限</span>
                  {isChief ? (
                    <LimitInput
                      key={`${u.id}-${u.characterLimit}`}
                      value={u.characterLimit}
                      used={u.characterCount || 0}
                      onCommit={(next) => handleUpdateLimit(u.id, next)}
                    />
                  ) : (
                    <LimitText value={u.characterLimit} used={u.characterCount || 0} />
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500">玩家头衔</span>
                  {isChief ? (
                    <Select
                      value={u.title || PLAYER_TITLES[0]}
                      onChange={(e) => handleUpdateTitle(u.id, e.target.value)}
                      aria-label={`${u.username} 的玩家头衔`}
                      className="!w-auto !min-w-[9.5rem] !py-1.5 !text-[14px]"
                    >
                      {PLAYER_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  ) : (
                    <span className="font-kai text-[14.5px] tracking-[0.08em] text-slate-300">{u.title || PLAYER_TITLES[0]}</span>
                  )}
                </div>

                {isChief ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setRenaming({ id: u.id, username: u.username }); setRenameTo(u.username); }}
                      className="min-h-[38px] flex-1 border border-line-strong bg-paper px-2 text-[14px] text-slate-300 transition-colors hover:border-slate-400 hover:text-slate-100"
                    >
                      改名
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetPwd(u.id, u.username)}
                      className="min-h-[38px] flex-1 border border-emerald-700/45 bg-emerald-700/[0.05] px-2 text-[14px] text-emerald-700 transition-colors hover:border-emerald-700 hover:text-emerald-600"
                    >
                      重置密码
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.username, u.characterCount || 0, isKeeperAccount(u))}
                        className="min-h-[38px] flex-1 border border-red-500/45 bg-red-500/[0.04] px-2 text-[14px] text-red-600 transition-colors hover:border-red-500 hover:text-red-500"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 border-t border-line-soft pt-2.5 font-kai text-[14px] leading-relaxed tracking-[0.06em] text-slate-500">
                    账号资料由首席守秘人统一维护；改名、重置密码与额度调整请联系首席。
                  </p>
                )}
              </article>
            );
          })}
          {filteredUsers.length === 0 && (
            <div className="px-5 py-10">
              <EmptyState
                title="没有匹配的账号"
                desc={isChief ? '换一个用户名关键词再试。' : '你还没有发放过账号，或关键词不匹配。'}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink px-4 py-2.5 sm:px-5">
          <span className="caption">
            {isChief ? `在册 ${users.length} 位` : `你发放的 ${users.length} 位`} · 名册随操作即时更新
          </span>
          <span className="font-kai text-[14px] tracking-[0.08em] text-slate-500">
            登记 · {isChief ? '首席' : '守秘人'}
          </span>
        </div>
      </Panel>

      <Modal open={Boolean(renaming)} onClose={() => setRenaming(null)} title="修改用户名">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
            <span className="caption">RENAME SLIP</span>
            <span className="font-mono text-[14px] text-slate-500">FORM 04-B</span>
          </div>
          <p className="text-sm text-slate-300">
            把 <b className="text-slate-100">{renaming?.username}</b> 改成：
          </p>
          <div className="border border-line-strong bg-paper p-3.5">
            <Field label="新用户名" hint="2-24 位，支持中文、字母、数字、_ . -">
              <Input value={renameTo} maxLength={24} onChange={(e) => setRenameTo(e.target.value)} autoFocus />
            </Field>
          </div>
          <p className="text-[14px] leading-relaxed text-slate-500">
            改名后该用户下次登录要用新名字；系统会把「玩家名正好等于旧用户名」的角色卡一并改名。
            带团记录、证书签名等历史文本不会被追溯修改。
          </p>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <Button variant="ghost" onClick={() => setRenaming(null)}>取消</Button>
            <Button onClick={handleRename} disabled={!renameTo.trim()}>确认改名</Button>
          </div>
        </div>
      </Modal>

      <p className="flex items-start gap-2 border-t border-line pt-3 text-[14px] leading-relaxed text-slate-500">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" />
        {isChief
          ? '首席守秘人可以管理全站账号，但无法读取任何人的原始密码（数据库中只保存 scrypt 哈希）。'
          : '你只能管理自己发放的账号，且无法读取任何人的原始密码（数据库中只保存 scrypt 哈希）；更多操作请联系首席守秘人。'}
      </p>
    </div>
  );
}