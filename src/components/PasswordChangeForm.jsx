/**
 * 修改个人密码。
 * 与服务端一致：只校验长度下限，不强制复杂度。
 */

import React, { useState } from 'react';
import { apiPut } from '../lib/api.js';
import { Button, Field, Input, Panel } from './ui.jsx';

/** 与服务端保持一致：只校验长度，不强制复杂度 */
export const PASSWORD_MIN = 6;

const lineInput = '!rounded-none !border-0 !border-b !border-line-strong !bg-transparent !px-0 !py-2 '
  + '!shadow-none focus:!ring-0 focus:!border-cyan-500';

export function passwordHint(pwd) {
  if (pwd.length < PASSWORD_MIN) return `密码至少 ${PASSWORD_MIN} 位`;
  if (pwd.length > 128) return '密码过长（最多 128 位）';
  return null;
}

export default function PasswordChangeForm({ showToast, onChanged }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = passwordHint(newPwd);
    if (problem) return showToast(problem, 'error');
    if (newPwd !== confirmPwd) return showToast('两次输入的新密码不一致', 'error');
    setBusy(true);
    try {
      await apiPut('/api/user/password', { oldPassword: oldPwd, newPassword: newPwd });
      showToast('密码修改成功，请重新登录');
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="relative overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[14px] tracking-[0.2em] text-moon">02</span>
          <h4 className="font-serif text-[17px] font-bold tracking-[0.02em] text-ink">修改个人密码</h4>
        </div>
        <span className="text-[14px] tracking-[0.22em] text-ink-mute">PASSCODE RENEWAL</span>
      </div>

      <div className="px-5 pb-4 pt-4">
        <p className="text-[14px] leading-relaxed text-ink-mute">新密码至少 6 位；修改成功后当前登录状态会全部失效，需要用新密码重新登录。</p>
        <form onSubmit={submit} className="mt-4">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="当前密码">
              <Input type="password" required value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} autoComplete="current-password" className={lineInput} />
            </Field>
            <Field label="新密码">
              <Input type="password" required value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" className={lineInput} />
            </Field>
            <Field label="确认新密码">
              <Input type="password" required value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" className={lineInput} />
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="font-kai text-[14px] tracking-[0.1em] text-ink-mute">口令更新后，所有设备都需重新登录</span>
            <Button type="submit" disabled={busy} className="!px-4 !py-1.5 !text-[14px]">{busy ? '提交中…' : '确认修改'}</Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}