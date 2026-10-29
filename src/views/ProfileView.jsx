/**
 * 个人中心 —— v4「档案馆员证」。
 *
 * 版式：左侧一张深空墨色馆员证（冷光描边、压印徽记），右侧为编目式的
 * 资料联单（01 账号 / 02 密码 / 03 已调查案件）。功能、文案、回调与原版一致。
 */
import React from 'react';
import { AlertCircle, ArrowUpRight, Crown, FileText, Settings, User, Users } from 'lucide-react';
import { PageHeader } from '../components/ui.jsx';
import { SealMark, SealWatermark } from '../components/Emblem.jsx';
import PasswordChangeForm from '../components/PasswordChangeForm.jsx';
import AccountRenameCard from '../components/AccountRenameCard.jsx';

export default function ProfileView({ currentUser, isAdmin, modules, playedModules, onTogglePlayed, onPreviewCertificate, onGo, showToast, onLogout, onRenamed }) {
  const played = modules.filter((m) => playedModules.includes(m.id));
  const initial = (currentUser?.username || '档').slice(0, 1);
  const cardNo = `NO.${String(currentUser?.id || currentUser?.username || '0000').replace(/[^0-9a-z]/gi, '').slice(-5).toUpperCase().padStart(5, '0')}`;
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: '我的角色卡', icon: Users, onClick: () => onGo('characters') },
    { label: '预览并下载证书', icon: FileText, onClick: onPreviewCertificate },
    ...(isAdmin ? [{ label: '账号管理', icon: Settings, onClick: () => onGo('adminUsers') }] : []),
  ];

  return (
    <div className="pb-10">
      <PageHeader
        tone="indigo"
        eyebrow="READER'S FILE · 私人档案"
        title="个人中心"
        titleClassName="moon-text !text-[38px] sm:!text-[46px]"
        desc="档案员身份、登录凭证与调查记录。"
        meta={<span className="hidden text-[14px] tracking-[0.22em] text-ink-mute sm:inline">MCMXX — {year} · 内部流通</span>}
        actions={(
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {quickLinks.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="group inline-flex items-center gap-1.5 border-b border-line pb-1 text-[14.5px] text-ink-soft transition-colors hover:border-cyan-500 hover:text-ink"
              >
                <Icon className="h-4 w-4 text-ink-mute transition-colors group-hover:text-cyan-500" strokeWidth={1.7} />
                {label}
                <ArrowUpRight className="h-4 w-4 -translate-y-px opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:opacity-100" strokeWidth={1.8} />
              </button>
            ))}
          </div>
        )}
      />

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[298px_minmax(0,1fr)] lg:gap-8">
        {/* ------------------------------------------------ 左：馆员证 */}
        <aside className="lg:sticky lg:top-24">
          <div className="group relative overflow-hidden border border-ink/35 bg-[#060d16] text-[#e8f3ff] shadow-[0_36px_70px_-46px_rgba(2,8,16,0.9)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-2xl transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-2" />
              <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-2xl" />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 -right-12 text-[#e8f3ff] opacity-[0.06]">
              <SealWatermark size={210} opacity={1} strokeWidth={0.9} />
            </div>

            <div className="relative p-6">
              <div className="flex items-center justify-between border-b border-[#e8f3ff]/15 pb-2.5">
                <span className="text-[14px] font-semibold tracking-[0.26em] text-[#e8f3ff]/50">ARCHIVE IDENTITY CARD</span>
                <span className="font-mono text-[14px] tracking-[0.14em] text-[#e8f3ff]/40">{cardNo}</span>
              </div>

              <div className="relative mt-5 flex items-start gap-4">
                <span aria-hidden="true" className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-cyan-200/25 bg-gradient-to-br from-cyan-400/20 via-indigo-500/15 to-transparent font-serif text-[27px] font-black leading-none text-[#e8f3ff]">
                  <span className="absolute inset-x-0 top-0 h-px bg-cyan-200/50" />
                  {initial}
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2 className="truncate font-serif text-[25px] font-bold leading-tight tracking-[0.02em] text-[#f2f8ff]">{currentUser.username}</h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 border border-[#e8f3ff]/20 px-2 py-0.5 text-[14px] tracking-[0.16em] text-[#e8f3ff]/75">
                    {isAdmin ? <Crown className="h-4 w-4" strokeWidth={1.8} /> : <User className="h-4 w-4" strokeWidth={1.8} />}
                    {isAdmin ? '首席守秘人' : (currentUser?.title || '见习调查员')}
                  </p>
                </div>
              </div>

              <dl className="relative mt-6 grid grid-cols-2 gap-px border border-[#e8f3ff]/15 bg-[#e8f3ff]/15">
                <div className="bg-[#060d16] px-3 py-2.5">
                  <dt className="text-[14px] tracking-[0.2em] text-[#e8f3ff]/40">已调查</dt>
                  <dd className="tabular mt-1 font-serif text-[22px] leading-none text-[#e8f3ff]">{playedModules.length}</dd>
                </div>
                <div className="bg-[#060d16] px-3 py-2.5">
                  <dt className="text-[14px] tracking-[0.2em] text-[#e8f3ff]/40">权限</dt>
                  <dd className="mt-1.5 font-serif text-[16px] leading-none text-[#e8f3ff]">{isAdmin ? '守秘人' : '调查员'}</dd>
                </div>
              </dl>

              <div className="relative mt-6 flex items-end justify-between gap-3 pt-4">
                <div className="min-w-0">
                  <p className="font-kai text-[16px] tracking-[0.16em] text-[#e8f3ff]/65">馆方签发 · 不得转借</p>
                  <div aria-hidden="true" className="mt-2 flex h-5 items-end gap-[3px] text-[#e8f3ff]/45">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1].map((w, i) => (
                      <span key={i} className="block bg-current" style={{ width: w, height: i % 3 === 0 ? '100%' : '72%' }} />
                    ))}
                  </div>
                </div>
                <span aria-hidden="true" className="shrink-0 rotate-[-6deg] text-red-500 transition-transform duration-500 group-hover:rotate-[-2deg]">
                  <SealMark size={56} strokeWidth={1.4} className="text-red-500" />
                </span>
              </div>
            </div>
          </div>

          {currentUser.mustChangePassword ? (
            <p className="mt-4 flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/[0.07] px-3 py-2.5 text-[16px] leading-relaxed text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />当前密码强度不足，请尽快在右侧修改
            </p>
          ) : null}
        </aside>

        {/* ------------------------------------------------ 右：资料联单 */}
        <div className="space-y-5">
          <AccountRenameCard currentUser={currentUser} showToast={showToast} onRenamed={onRenamed} />
          <PasswordChangeForm showToast={showToast} onChanged={onLogout} />

          <section className="relative overflow-hidden border border-line bg-paper-raised/60">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[14px] tracking-[0.2em] text-moon">03</span>
                <h4 className="font-serif text-[17px] font-bold tracking-[0.02em] text-ink">已调查案件</h4>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[14px] tracking-[0.22em] text-ink-mute">INVESTIGATION LOG</span>
                <span className="tabular text-[14px] tracking-[0.12em] text-ink-mute">{played.length} 份记录</span>
              </div>
            </div>
            <p className="px-5 pt-3 text-[16px] leading-relaxed text-ink-mute">归档后会在模组卡与证书上留下记录，可随时撤销。</p>
            {played.length === 0 ? (
              <p className="mx-5 mb-5 mt-4 border border-dashed border-line py-7 text-center font-kai text-[16px] text-ink-mute">还没有归档任何案件。</p>
            ) : (
              <ul className="mt-2 grid gap-x-8 px-5 pb-4 sm:grid-cols-2">
                {played.map((m, i) => (
                  <li key={m.id} className="group flex items-center justify-between gap-3 border-b border-line-soft py-2.5 last:border-b-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden="true" className="tabular shrink-0 font-mono text-[14px] text-ink-mute">{String(i + 1).padStart(2, '0')}</span>
                      <span aria-hidden="true" className="h-6 w-[2px] shrink-0 bg-moon/70 transition-all group-hover:h-8" />
                      <div className="min-w-0">
                        <span className="block truncate font-serif text-[15px] text-ink transition-colors group-hover:text-moon">{m.title}</span>
                        <span className="text-[14px] text-ink-mute">{m.region} · {m.era}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => onTogglePlayed(m.id, e)}
                      className="shrink-0 border border-transparent px-2 py-1 text-[14px] text-ink-mute transition-colors hover:border-line hover:text-red-500"
                    >
                      撤销
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}