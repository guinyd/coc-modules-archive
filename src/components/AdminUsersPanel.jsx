/**
 * 账号管理（仅 KP）。
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
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api.js';
import {
  Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, Select, StatStrip, cx,
} from './ui.jsx';
import { usernameHint } from './AccountRenameCard.jsx';

const TITLES = ['见习调查员', '资深调查员', '精英调查员', '传奇调查员', '神话调查员'];

export default function AdminUsersPanel({ setView, showToast, showConfirm }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null);
  const [renaming, setRenaming] = useState(null);   // { id, username, chars }
  const [renameTo, setRenameTo] = useState('');
  const [query, setQuery] = useState('');

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
      await apiPost('/api/admin/users', { username: newUsername, password: newPwd });
      showToast('用户创建成功');
      setNewUsername(''); setNewPwd('');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const handleResetPwd = (userId, username) => showConfirm(
    `要重置用户【${username}】的密码吗？`,
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

  const handleDeleteUser = (userId, username, charCount) => showConfirm(
    `确定要永久删除用户【${username}】吗？`,
    async () => {
      try {
        const res = await apiDelete(`/api/admin/users/${userId}`);
        showToast(`用户已删除（同时清理角色卡 ${res.charsRemoved} 张）`);
        loadUsers();
      } catch (err) { showToast(err.message, 'error'); }
    },
    { detail: `该用户名下有 ${charCount} 张角色卡，删除后一并清除且不可恢复。` },
  );

  /** KP 代改用户名 */
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

  const handleUpdateTitle = async (userId, newTitle) => {
    try {
      await apiPut(`/api/admin/users/${userId}/title`, { title: newTitle });
      showToast(`已授予头衔：${newTitle}`);
      loadUsers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const admins = users.filter((u) => u.role === 'admin').length;
  const stats = [
    { label: '在册馆员', value: users.length, unit: '人' },
    { label: '守秘人', value: admins, unit: '位' },
    { label: '调查员', value: users.length - admins, unit: '位' },
    { label: '名下角色卡', value: users.reduce((sum, u) => sum + (u.characterCount || 0), 0), unit: '张' },
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter((u) => u.username.toLowerCase().includes(normalizedQuery))
    : users;
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
        title="用户账号管理与成就授予"
        desc="新账号一律由 KP 发放；口令以哈希形式保存，管理员也无法查看原文。"
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
            <h2 className="font-serif text-[18px] font-bold tracking-[0.02em] text-slate-100">发放新账号</h2>
            <span className="font-kai text-[14px] tracking-[0.08em] text-slate-500">一册一人 · 离册即失效</span>
          </div>
          <span className="caption">NEW ACCOUNT</span>
        </div>

        <form onSubmit={handleCreateUser} className="grid gap-5 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6">
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
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto"><UserPlus className="h-4 w-4" />发放新账号</Button>
          </div>
        </form>
      </Panel>

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
            <span className="caption hidden sm:inline">REGISTER OF KEEPERS &amp; INVESTIGATORS</span>
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
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="bg-ink text-paper-raised">
                <th className="w-12 px-3 py-3 font-mono text-[14px] font-medium tracking-[0.14em] text-paper-deep/70">NO.</th>
                <th className="px-4 py-3 text-[14px] font-semibold tracking-[0.16em]">用户名</th>
                <th className="px-4 py-3 text-[14px] font-semibold tracking-[0.16em]">权限角色</th>
                <th className="px-4 py-3 text-[14px] font-semibold tracking-[0.16em]">荣誉头衔（显示在证书）</th>
                <th className="px-4 py-3 text-center text-[14px] font-semibold tracking-[0.16em]">角色卡</th>
                <th className="px-4 py-3 text-right text-[14px] font-semibold tracking-[0.16em]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="border-b border-line transition-colors hover:bg-paper-deep/60">
                  <td className="px-3 py-[13px] font-mono text-[14px] text-slate-500 tabular">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-[13px]">
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cx(
                          'flex h-7 w-7 shrink-0 items-center justify-center border font-serif text-[14px] font-bold',
                          u.role === 'admin'
                            ? 'border-red-500/50 bg-red-500/[0.04] text-red-600'
                            : 'border-indigo/35 bg-paper text-indigo',
                        )}
                      >
                        {u.username.slice(0, 1)}
                      </span>
                      <span className="text-[15px] font-medium text-slate-100">{u.username}</span>
                      {u.mustChangePassword ? <Badge tone="red" className="!text-[14px]">弱口令待改</Badge> : null}
                    </span>
                  </td>
                  <td className="px-4 py-[13px]">
                    <span className={cx(
                      'inline-flex items-center gap-1.5 border px-2 py-1 text-[14px] tracking-[0.06em]',
                      u.role === 'admin'
                        ? 'border-amber-500/45 bg-amber-500/[0.05] text-amber-500'
                        : 'border-indigo/35 bg-indigo/[0.04] text-indigo',
                    )}>
                      {u.role === 'admin'
                        ? <Crown className="h-4 w-4" />
                        : <UserIcon className="h-4 w-4" />}
                      {u.role === 'admin' ? '管理员 (KP)' : '调查员'}
                    </span>
                  </td>
                  <td className="px-4 py-[13px]">
                    {u.role === 'admin' ? (
                      <span className="font-kai text-[14.5px] tracking-[0.14em] text-amber-500">【 首席守秘人 】</span>
                    ) : (
                      <Select
                        value={u.title || '见习调查员'}
                        onChange={(e) => handleUpdateTitle(u.id, e.target.value)}
                        className="!w-auto !min-w-[10.25rem] !rounded-none !border-x-0 !border-t-0 !bg-transparent !py-1 !pl-0 !pr-8 !text-[14.5px] text-slate-300"
                      >
                        {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-[13px] text-center">
                    <span className={cx('font-mono text-[16px] font-semibold tabular', u.characterCount ? 'text-emerald-700' : 'text-slate-500')}>
                      {u.characterCount || 0}
                    </span>
                    <span className="ml-1 text-[14px] text-slate-500">张</span>
                  </td>
                  <td className="px-4 py-[13px]">
                    <div className="flex justify-end gap-3.5">
                      <button
                        type="button"
                        onClick={() => { setRenaming({ id: u.id, username: u.username }); setRenameTo(u.username); }}
                        className="border-b border-transparent pb-0.5 text-[14px] text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-100"
                      >
                        改名
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPwd(u.id, u.username)}
                        className="border-b border-transparent pb-0.5 text-[14px] text-emerald-700 transition-colors hover:border-emerald-700 hover:text-emerald-600"
                      >
                        重置密码
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username, u.characterCount || 0)}
                          className="border-b border-transparent pb-0.5 text-[14px] text-red-600 transition-colors hover:border-red-500 hover:text-red-500"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10">
                    <EmptyState title="没有匹配的账号" desc="换一个用户名关键词再试。" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {filteredUsers.map((u) => (
            <article key={u.id} className="border-b border-line px-4 py-[14px] last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cx(
                      'flex h-8 w-8 shrink-0 items-center justify-center border font-serif text-[14px] font-bold',
                      u.role === 'admin'
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
                <span className={cx(
                  'inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[14px] tracking-[0.06em]',
                  u.role === 'admin'
                    ? 'border-amber-500/45 bg-amber-500/[0.05] text-amber-500'
                    : 'border-indigo/35 bg-indigo/[0.04] text-indigo',
                )}>
                  {u.role === 'admin' ? <Crown className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  {u.role === 'admin' ? '管理员 (KP)' : '调查员'}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-2.5">
                <div>
                  <dt className="font-mono text-[14px] tracking-[0.14em] text-slate-500">角色卡数</dt>
                  <dd className={cx('mt-0.5 font-mono text-[14px] font-semibold tabular', u.characterCount ? 'text-emerald-700' : 'text-slate-500')}>
                    {u.characterCount || 0} <span className="text-[14px] font-normal text-slate-500">张</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[14px] tracking-[0.14em] text-slate-500">注册时间</dt>
                  <dd className="mt-0.5 font-mono text-[14.5px] text-slate-300 tabular">{formatRegistered(u.createdAt)}</dd>
                </div>
              </dl>

              {u.role === 'admin' ? (
                <p className="mt-2.5 font-kai text-[16px] tracking-[0.12em] text-amber-500">【 首席守秘人 】</p>
              ) : (
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[14px] tracking-[0.14em] text-slate-500">头衔</span>
                  <Select
                    value={u.title || '见习调查员'}
                    onChange={(e) => handleUpdateTitle(u.id, e.target.value)}
                    className="!w-auto !min-w-[9.5rem] !py-1.5 !text-[14px]"
                  >
                    {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
              )}

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
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id, u.username, u.characterCount || 0)}
                    className="min-h-[38px] flex-1 border border-red-500/45 bg-red-500/[0.04] px-2 text-[14px] text-red-600 transition-colors hover:border-red-500 hover:text-red-500"
                  >
                    删除
                  </button>
                )}
              </div>
            </article>
          ))}
          {filteredUsers.length === 0 && (
            <div className="px-5 py-10">
              <EmptyState title="没有匹配的账号" desc="换一个用户名关键词再试。" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink px-4 py-2.5 sm:px-5">
          <span className="caption">在册 {users.length} 位 · 名册随操作即时更新</span>
          <span className="font-kai text-[14px] tracking-[0.08em] text-slate-500">登记 · 首席守秘人</span>
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
        管理员可以管理账号，但无法读取任何人的原始密码（数据库中只保存 scrypt 哈希）。
      </p>
    </div>
  );
}