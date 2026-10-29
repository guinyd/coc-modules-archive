/**
 * 登录 / 首次初始化 —— v5「读者登记窗口」。
 *
 * 左边是馆方的入馆须知：报头、大字标题、三条编号规则和一枚「不得转借」的章；
 * 右边是一张真正挂在窗口前的读者证：挂绳孔、墨色证头、下划线式笔迹栏、
 * 骑缝编号与条形码。夜间的馆灯（主题）会同时换掉纸色与证头。
 *
 * 功能与文案保持：调查员登录 / 系统初始化 / 进入档案馆 / 创建管理员 /
 * 点击初始化首个账号 / 切换登录，全部沿用原 props。
 */
import React from 'react';
import { AlertCircle, ArrowRight, Lock, User } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import { SealMark, SealWatermark } from '../components/Emblem.jsx';
import { TentacleCorner } from '../components/Ornaments.jsx';

const NOTES = [
  { index: '01', text: '首次运行时，第一个账号会成为守秘人（KP）。' },
  { index: '02', text: '角色卡、带团记录与证书都绑定在当前账号下。' },
  { index: '03', text: '目前档案馆是邀请制，不支持自助办卡，请联系你的KP发放。' },
];

function PermitField({ icon: Icon, label, hint, ...props }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 font-mono text-[14px] font-semibold tracking-[0.22em] text-ink-mute">
        <span aria-hidden="true" className="inline-block h-[4px] w-[4px] bg-vermilion" />
        {label}
      </span>
      <span className="relative mt-1.5 block">
        <Icon
          className="pointer-events-none absolute left-0 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ink-mute transition-colors duration-300 peer-focus:text-indigo"
          strokeWidth={1.7}
        />
        <input
          {...props}
          className="peer w-full border-0 border-b-2 border-ink/35 bg-transparent py-2.5 pl-6 pr-1 font-serif text-[16px] font-bold text-ink outline-none transition-colors duration-300 placeholder:font-sans placeholder:text-[14px] placeholder:font-normal placeholder:text-ink-mute/55 hover:border-ink/60 focus:border-indigo"
        />
      </span>
      {hint ? <span className="mt-1.5 block font-kai text-[14px] tracking-[0.08em] text-ink-mute">{hint}</span> : null}
    </label>
  );
}

export default function AuthView({
  isLoginMode, setIsLoginMode, username, setUsername, password, setPassword, authError, setAuthError, onSubmit,
}) {
  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-11 py-3 sm:py-6 lg:grid-cols-[minmax(0,1fr)_428px] lg:gap-16 lg:py-10">
      {/* ------------------------------------------------------ 左：入馆须知 */}
      <section className="relative animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-4 border-b border-ink/40 pb-2.5">
          <span className="flex items-center gap-2 font-mono text-[14px] font-bold tracking-[0.22em] text-ink-mute">
            <span aria-hidden="true" className="inline-block h-[4px] w-[4px] bg-vermilion" />
            ADMISSION · 入馆登记
          </span>
          <span className="hidden font-mono text-[14px] tracking-[0.22em] text-ink-mute sm:inline">FORM 1920-A</span>
        </div>

        <div className="relative mt-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-16 hidden text-ink opacity-[0.055] lg:block">
            <SealWatermark size={250} opacity={1} strokeWidth={0.8} />
          </div>
          <h1 className="relative font-serif text-[38px] font-black leading-[1.1] tracking-[-0.015em] text-ink sm:text-[52px]">
            请出示你的
            <br />
            <span className="page-title--vermilion moon-text-anim">调查员证件</span>
          </h1>
          <div className="mt-6 flex items-start gap-3">
            <SealMark size={28} className="mt-1 shrink-0 text-vermilion" strokeWidth={1.6} />
            <p className="max-w-[31rem] text-[16px] leading-[1.95] text-ink-soft">
              档案馆不对外公开调查记录。持有证件者，方可查阅卷宗、创建角色卡，
              并把那些无法解释的夜晚归档成册。
            </p>
          </div>
        </div>

        <ul className="mt-9 hidden max-w-[32rem] border-y-2 border-ink/25 sm:block">
          {NOTES.map((n) => (
            <li key={n.index} className="flex items-baseline gap-4 border-b border-line px-1 py-3.5 last:border-b-0">
              <span className="tabular font-mono text-[14px] font-bold tracking-[0.2em] text-vermilion">{n.index}</span>
              <span className="text-[14.5px] leading-relaxed text-ink-soft">{n.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-kai text-[14px] tracking-[0.2em] text-ink-mute">馆藏始于一九二〇年代 · 内部流通</p>
          <span aria-hidden="true" className="hidden font-mono text-[14px] tracking-[0.24em] text-ink-mute/70 sm:inline">
            ARCHIVE OF SECRET INQUIRY
          </span>
        </div>

        <div className="mt-10 hidden items-end gap-5 lg:flex">
          <div aria-hidden="true" className="shrink-0 -rotate-[3.5deg] border-2 border-vermilion/75 px-4 py-2 text-center text-vermilion">
            <p className="font-serif text-[16px] font-bold tracking-[0.32em]">不得转借</p>
            <p className="mt-0.5 font-mono text-[14px] tracking-[0.18em] text-vermilion/70">NON-TRANSFERABLE</p>
          </div>
          <p className="max-w-[15rem] pb-1 font-kai text-[14px] leading-relaxed tracking-[0.06em] text-ink-mute">
            本证仅限本人使用。如遇字迹漫漶、照片脱落，请勿继续调阅。
          </p>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-14 -z-10 hidden h-48 w-48 text-ink/[0.10] lg:block">
          <TentacleCorner className="h-full w-full" />
        </div>
      </section>

      {/* ------------------------------------------------------ 右：读者证 */}
      <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '120ms' }}>
        {/* 挂绳孔 */}
        <div
          aria-hidden="true"
          className="relative z-10 mx-auto -mb-[7px] h-[14px] w-24 rounded-full border-2 border-ink/60 bg-paper shadow-[inset_0_2px_4px_rgba(23,17,9,0.28)]"
        />

          <div className="relative">
            <div className="relative z-10 border-2 border-ink/80 bg-paper-raised shadow-[10px_10px_0_-1px_rgba(23,17,9,0.14)]">
          {/* 证头 */}
          <div
            className="relative overflow-hidden px-5 py-5 text-[var(--c-masthead-ink)] sm:px-6"
            style={{ backgroundColor: 'var(--c-masthead)' }}
          >
            <div aria-hidden="true" className="absolute -right-10 -top-10 text-[var(--c-masthead-ink)] opacity-[0.12]">
              <SealMark size={150} strokeWidth={1.1} />
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[14px] tracking-[0.26em] text-[var(--c-masthead-ink)]/60">READER&apos;S PERMIT</p>
                <h2 className="mt-1.5 font-serif text-[22px] font-black tracking-[0.12em]">
                  {isLoginMode ? '调查员登录' : '系统初始化'}
                </h2>
              </div>
              <span className="mt-1 shrink-0 border border-[var(--c-masthead-ink)]/30 px-1.5 py-0.5 font-mono text-[14px] tracking-[0.16em] text-[var(--c-masthead-ink)]/70">
                NO.1920
              </span>
            </div>
            <p className="relative mt-3 font-kai text-[14px] tracking-[0.14em] text-[var(--c-masthead-ink)]/65">
              凭此证可在闭馆后继续阅览
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-[16px] leading-relaxed text-ink-soft">
              {isLoginMode ? '填写用户名与密码，进入馆藏。' : '创建第一个账号，它将拥有守秘人权限。'}
            </p>

            {authError ? (
              <div className="mt-4 flex items-start gap-2 border-l-[3px] border-vermilion bg-vermilion/[0.07] px-3 py-2.5 text-[14px] leading-relaxed text-vermilion">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
                <span>{authError}</span>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <PermitField
                icon={User}
                label="用户名 / NAME"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="请输入用户名"
              />
              <PermitField
                icon={Lock}
                label="密码 / PASSCODE"
                hint={!isLoginMode ? '密码至少 6 位即可。' : undefined}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                placeholder="请输入密码"
              />

              <Button size="lg" type="submit" className="mt-2 w-full !justify-between">
                <span>{isLoginMode ? '进入档案馆' : '创建管理员'}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-ink/30 pt-4 text-[14px]">
              <span className="text-ink-mute">{isLoginMode ? '还没有账号？' : '已有账号？'}</span>
              <button
                type="button"
                onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }}
                className="group inline-flex items-center gap-1 font-semibold text-vermilion transition-colors hover:text-vermilion/80"
              >
                {isLoginMode ? '点击初始化首个账号' : '切换登录'}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* 骑缝：编号 + 条码 */}
          <div className="flex items-center justify-between gap-3 border-t border-dashed border-ink/30 px-5 py-2.5 sm:px-6">
            <span className="font-mono text-[14px] tracking-[0.22em] text-ink-mute">ARCHIVE OF SECRET INQUIRY</span>
            <span className="flex items-end gap-[2px]" aria-hidden="true">
              {[5, 9, 4, 10, 6, 3, 8, 5, 9, 4, 7, 3].map((h, i) => (
                <span key={i} className="w-[2px] bg-ink/35" style={{ height: `${h + 4}px` }} />
              ))}
            </span>
            <span className="font-mono text-[14px] tracking-[0.22em] text-ink-mute">MCMXX</span>
          </div>
          </div>
          {/* 馆印：压在证件卡右下角，盖住骑缝编号，才有“盖棺定论”的落印感 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 -right-6 z-20 hidden text-vermilion/55 sm:block"
            style={{ transform: 'rotate(-12deg)' }}
          >
            <SealMark size={150} strokeWidth={1.2} />
          </span>
        </div>

        <p className="relative z-10 mt-4 text-center font-kai text-[14px] tracking-[0.18em] text-ink-mute">
          证件遗失请至值班室补办
        </p>
      </section>
    </div>
  );
}
