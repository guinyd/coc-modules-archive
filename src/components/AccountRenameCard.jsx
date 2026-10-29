/**
 * 账号资料卡片：修改用户名。
 *
 * 说明：
 *  - 用户名是**登录标识**，改名后下次登录要用新名字；当前会话令牌不受影响。
 *  - 系统会把「玩家名正好等于旧用户名」的角色卡一并改名，避免卡上留着旧称呼。
 *  - 手填过的其它玩家名不会被改动。
 */

import React, { useState } from 'react';
import { AtSign, Info } from 'lucide-react';
import { apiPut } from '../lib/api.js';
import { Button, Field, Input, Panel } from './ui.jsx';

/** 与服务端保持一致的用户名规则 */
const USERNAME_RE = /^[\u4e00-\u9fa5A-Za-z0-9_.-]{2,24}$/;

/** 纸面表格里的下划线输入 */
const lineInput = '!rounded-none !border-0 !border-b !border-line-strong !bg-transparent !px-0 !py-2 '
  + '!shadow-none focus:!ring-0 focus:!border-cyan-500';

export function usernameHint(name) {
  if (name.length < 2) return '用户名至少 2 位';
  if (name.length > 24) return '用户名最多 24 位';
  if (!USERNAME_RE.test(name)) return '只能包含中文、字母、数字、下划线、点或连字符';
  return null;
}

export default function AccountRenameCard({ currentUser, showToast, onRenamed }) {
  const [name, setName] = useState(currentUser?.username || '');
  const [busy, setBusy] = useState(false);

  const changed = name.trim() !== (currentUser?.username || '');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const problem = usernameHint(trimmed);
    if (problem) return showToast(problem, 'error');
    if (!changed) return showToast('用户名没有变化', 'error');
    setBusy(true);
    try {
      const res = await apiPut('/api/user/username', { username: trimmed });
      showToast(res.syncedCharacters
        ? `用户名已改为「${trimmed}」，同步更新了 ${res.syncedCharacters} 张角色卡的玩家名`
        : `用户名已改为「${trimmed}」`);
      onRenamed?.(res.user);
      setName(res.user.username);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <Panel className="relative overflow-hidden p-0">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[14px] tracking-[0.2em] text-moon">01</span>
          <h4 className="font-serif text-[17px] font-bold tracking-[0.02em] text-ink">账号资料</h4>
        </div>
        <span className="text-[14px] tracking-[0.22em] text-ink-mute">READER PROFILE</span>
      </div>

      <div className="px-5 pb-4 pt-4">
        <p className="text-[14px] leading-relaxed text-ink-mute">用户名即登录标识，改名后请用新名字登录。</p>
        <form onSubmit={submit} className="mt-4">
          <Field label="用户名" hint="2-24 位">
            <div className="relative max-w-sm">
              <AtSign className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" strokeWidth={1.8} />
              <Input
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                className={`${lineInput} !pl-5`}
                placeholder="中文、字母、数字、_ . -"
              />
            </div>
          </Field>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit" disabled={busy || !changed} className="!px-3.5 !py-1.5 !text-[14px]">
              {busy ? '提交中…' : '保存用户名'}
            </Button>
            {changed ? (
              <button type="button" onClick={() => setName(currentUser?.username || '')} className="border-b border-transparent text-[14px] text-ink-mute transition-colors hover:border-line hover:text-ink">
                还原
              </button>
            ) : null}
          </div>
          <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-[14px] leading-relaxed text-ink-mute">
            <li className="flex items-start gap-1.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute/70" strokeWidth={1.8} />
              当前用户名：<b className="text-ink-soft">{currentUser?.username}</b>。改名后<b className="text-ink-soft">请用新名字登录</b>，当前登录状态不受影响。
            </li>
            <li className="flex items-start gap-1.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute/70" strokeWidth={1.8} />
              如果 KP 用你的用户名在证书上签名、或带团记录里写的是你的名字，那些是历史记录，不会跟着改。
            </li>
          </ul>
        </form>
      </div>
    </Panel>
  );
}