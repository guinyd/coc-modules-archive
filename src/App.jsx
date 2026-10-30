import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle, ClipboardCheck, FileText, Github, LayoutDashboard, LogOut, Mail, Plus, Scale, Share2,
  Shield, Trash2, User, Users, X,
} from 'lucide-react';

import { ApiError, apiDelete, apiGet, apiPost, apiPut, session } from './lib/api.js';
import {
  Badge, Button, ConfirmDialog, EmptyState, Panel, Toast, cx,
} from './components/ui.jsx';
import { SealMark } from './components/Emblem.jsx';
import { TentacleBackdrop, TentacleRule } from './components/Ornaments.jsx';
import { MenuMorph, ThemeMorph } from './components/MorphIcon.jsx';
import { DepthGauge, RouteSweep } from './components/Motion.jsx';
import BackToTop from './components/BackToTop.jsx';
import AdminUsersPanel from './components/AdminUsersPanel.jsx';
import KpDashboardPanel from './components/KpDashboardPanel.jsx';
import CertificatePreview from './components/CertificatePreview.jsx';
import CharacterList from './components/characters/CharacterList.jsx';
import CharacterEditor from './components/characters/CharacterEditor.jsx';
import CharacterDetail from './components/characters/CharacterDetail.jsx';
import CharacterPrintView from './components/CharacterPrintView.jsx';
import KpReviewCenter from './components/characters/KpReviewCenter.jsx';
import { ExportCardModal } from './components/characters/CardTransferModal.jsx';
import { getGuestSheet, saveGuestSheet, deleteGuestSheet } from './lib/guestStore.js';
import { computeSheet } from '../shared/coc7e.js';
import AuthView from './views/AuthView.jsx';
import HomeView from './views/HomeView.jsx';
import ModuleDetailView from './views/ModuleDetailView.jsx';
import ModuleFormView from './views/ModuleFormView.jsx';
import ProfileView from './views/ProfileView.jsx';

const EMPTY_MODULE = {
  title: '', region: '', era: '1920s', players: '', duration: '', description: '',
  series: '', charInfo: '', occupations: '', skills: '', notes: '', isPinned: false,
};

/**
 * 头衔样式（与证书、个人中心共用）。
 * v3：全部改成「油墨实色 + 衬线 + 宽字距」，头衔的分量靠字重与纸上的位置表达。
 */
const getTitleStyles = (title, role) => {
  const common = 'font-serif font-bold tracking-[0.24em]';
  if (role === 'admin') return `${common} text-indigo`;
  switch (title) {
    case '资深调查员': return `${common} text-slate-200`;
    case '精英调查员': return `${common} text-amber-300`;
    case '传奇调查员': return `${common} text-red-500`;
    case '神话调查员': return `${common} text-cyan-300`;
    default: return 'text-slate-400 font-normal tracking-[0.1em]';
  }
};

export default function App() {
  // ------------------------------------------------------------ 全局状态
  const [modules, setModules] = useState([]);
  const [playedModules, setPlayedModules] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => session.user);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('home');
  const [navOpen, setNavOpen] = useState(false);
  const [viewArg, setViewArg] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  const [homeTab, setHomeTab] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterPlayers, setFilterPlayers] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterPlayed, setFilterPlayed] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [formData, setFormData] = useState(EMPTY_MODULE);
  const [isEditing, setIsEditing] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [kpName, setKpName] = useState('档案馆首席 KP');
  const [previewMode, setPreviewMode] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [characterRefresh, setCharacterRefresh] = useState(0);
  const [customOccupations, setCustomOccupations] = useState([]);
  const [guestSheet, setGuestSheet] = useState(null);
  const [characterOrigin, setCharacterOrigin] = useState('characters');
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  });
  const [wipe, setWipe] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('coc-theme', theme); } catch { /* 隐私模式忽略 */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#081311' : '#ece3d1');
  }, [theme]);

  const toggleTheme = useCallback((evt) => {
    const el = evt?.currentTarget || document.querySelector('[data-theme-toggle]');
    const rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 72;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const apply = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    // 主题切换：让一层印泥从按钮漫开盖住页面，在覆盖最厚时换色，避免全页逐节点重绘造成卡顿
    if (reduce) { apply(); return; }
    setWipe({ id: Date.now(), x, y, color: '#a52a1d' });
    window.setTimeout(apply, 240);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type, id: Date.now() }), []);
  const showConfirm = useCallback((msg, onConfirm, opts = {}) => setConfirmDialog({ msg, onConfirm, ...opts }), []);
  // 归位要「瞬时」：全站开了 scroll-behavior:smooth，直接 scrollTo(0,0) 会在旧页面上
  // 缓慢拉回顶部，等新页渲染完还在滑，和入场动画叠在一起（用户看到的「被甩一下」）。
  const resetScroll = useCallback(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    // 只临时改内联样式不够：浏览器会把滚动请求排到下一帧，届时样式已还原成 smooth，
    // 旧页仍会缓慢滑回顶部。behavior:'instant' 强制本帧直接归位。
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    root.style.scrollBehavior = prev;
  }, []);

  const go = useCallback((nextView, arg = null) => {
    resetScroll();
    setView(nextView);
    setViewArg(arg);
  }, [resetScroll]);

  // ------------------------------------------------------------ 数据获取
  const fetchModules = useCallback(async () => {
    try {
      setModules(await apiGet('/api/modules', { auth: false }));
    } catch (err) { showToast(err.message, 'error'); }
  }, [showToast]);

  const fetchPlayedRecords = useCallback(async () => {
    try {
      const list = await apiGet('/api/played');
      setPlayedModules(list.map((r) => r.moduleId));
    } catch { /* 未登录时静默 */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return setUsers([]);
    try { setUsers(await apiGet('/api/admin/users')); } catch { /* ignore */ }
  }, [isAdmin]);

  const fetchCharacterMeta = useCallback(async () => {
    try {
      const m = await apiGet('/api/characters/meta', { auth: Boolean(session.token) });
      setCustomOccupations(m.customOccupations || []);
    } catch { /* 元数据失败不影响主流程 */ }
  }, []);

  const fetchKpName = useCallback(async () => {
    try {
      const data = await apiGet('/api/kp-name', { auth: false });
      if (data.kpName) setKpName(data.kpName);
    } catch { /* ignore */ }
  }, []);

  // 启动：校验收据 + 拉取最新用户信息（含头衔）
  useEffect(() => {
    const init = async () => {
      if (session.token) {
        try {
          const fresh = await apiGet('/api/user/me');
          setCurrentUser(fresh);
          session.saveUser(fresh);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            session.clear();
            setCurrentUser(null);
          }
        }
      }
      fetchModules();
    };
    init();
  }, [fetchModules]);

  // 首页「最新收录」自动刷新：停留首页时每 60 秒静默拉取一次；回到前台立即刷新
  useEffect(() => {
    if (view !== 'home') return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchModules();
    };
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [view, fetchModules]);

  useEffect(() => {
    if (currentUser) fetchPlayedRecords();
    else setPlayedModules([]);
  }, [currentUser, fetchPlayedRecords]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchCharacterMeta(); }, [fetchCharacterMeta]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      if (isAdmin) setKpName(currentUser.username);
      else fetchKpName();
    }
  }, [currentUser, isAdmin, fetchKpName]);

  // 令牌失效（过期/改密/被轮换）时统一回到登录页
  useEffect(() => {
    const onUnauthorized = (e) => {
      setCurrentUser(null);
      session.clear();
      showToast(e.detail?.reason || '登录状态已失效', 'error');
      go('auth');
    };
    window.addEventListener('coc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('coc:unauthorized', onUnauthorized);
  }, [go, showToast]);

  // ------------------------------------------------------------ 认证
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await apiPost(
        isLoginMode ? '/api/login' : '/api/register',
        { username, password },
        { auth: false },
      );
      session.save(data.token, data.user);
      setCurrentUser(data.user);
      setUsername(''); setPassword('');
      showToast(isLoginMode ? '欢迎回来' : '注册成功');
      go('home');
      if (data.user?.mustChangePassword) {
        showToast('当前密码强度不足，建议尽快到个人中心修改', 'error');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try { await apiPost('/api/logout', {}); } catch { /* 即便失败也清理本地 */ }
    session.clear();
    setCurrentUser(null);
    setFilterPlayed('');
    go('home');
    showToast('已登出');
  };

  // ------------------------------------------------------------ 模组
  const handleSubmitModule = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const saved = isEditing
        ? await apiPut(`/api/modules/${formData.id}`, formData)
        : await apiPost('/api/modules', formData);
      await fetchModules();
      showToast(isEditing ? '更新成功' : '发布成功');
      if (isEditing) { setSelectedModule(saved); go('moduleDetail'); } else { go('home'); }
      setFormData(EMPTY_MODULE);
      setIsEditing(false);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDeleteModule = (moduleId, e) => {
    e?.stopPropagation();
    if (!isAdmin) return;
    showConfirm('永久删除该模组？', async () => {
      try {
        await apiDelete(`/api/modules/${moduleId}`);
        await fetchModules();
        showToast('已删除');
        if (selectedModule?.id === moduleId) go('home');
      } catch (err) { showToast(err.message, 'error'); }
    }, { detail: '该模组下的带团记录、已跑标记与角色卡经历关联都会一并清除。' });
  };

  const togglePlayed = async (moduleId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!currentUser) return go('auth');
    try {
      const res = await apiPost('/api/played', { moduleId });
      setPlayedModules((prev) => (res.played
        ? [...new Set([...prev, moduleId])]
        : prev.filter((id) => id !== moduleId)));
    } catch (err) { showToast(err.message, 'error'); }
  };

  const openEditMode = (module, e) => {
    e?.stopPropagation();
    setFormData({ ...EMPTY_MODULE, ...module });
    setIsEditing(true);
    go('moduleForm');
  };

  const handleCopy = async (mod) => {
    const text = `《${mod.title}》\n人数：${mod.players}人\n时长：${mod.duration}小时\n时代：${mod.region || ''} ${mod.era}\n背景：${mod.description}\n`
      + `${mod.charInfo ? `车卡要求：${mod.charInfo}\n` : ''}${mod.occupations ? `推荐职业：${mod.occupations}\n` : ''}`
      + `${mod.skills ? `推荐技能：${mod.skills}\n` : ''}${mod.notes ? `注意：${mod.notes}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板！');
    } catch {
      // 退回到旧 API（部分浏览器非安全上下文不支持 clipboard）
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制到剪贴板！');
      } catch { showToast('复制失败，请手动选择复制', 'error'); }
    }
  };

  // ------------------------------------------------------------ 派生数据
  const uniqueSeries = useMemo(() => [...new Set(modules.map((m) => m.series).filter(Boolean))], [modules]);
  const uniqueRegions = useMemo(() => [...new Set(modules.map((m) => m.region).filter(Boolean))], [modules]);
  const uniquePlayers = useMemo(() => [...new Set(modules.map((m) => m.players).filter(Boolean))], [modules]);
  const uniqueDurations = useMemo(() => [...new Set(modules.map((m) => m.duration).filter(Boolean))], [modules]);

  const filteredModules = useMemo(() => {
    let list = modules;
    if (selectedCollection) return list.filter((m) => m.series === selectedCollection);
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(kw) || m.series?.toLowerCase().includes(kw));
    }
    if (filterRegion) list = list.filter((m) => m.region === filterRegion);
    if (filterPlayers) list = list.filter((m) => m.players === filterPlayers);
    if (filterDuration) list = list.filter((m) => m.duration === filterDuration);
    if (filterPlayed === 'played') list = list.filter((m) => playedModules.includes(m.id));
    if (filterPlayed === 'unplayed') list = list.filter((m) => !playedModules.includes(m.id));
    return list;
  }, [modules, selectedCollection, searchTerm, filterRegion, filterPlayers, filterDuration, filterPlayed, playedModules]);

  const handlePreview = (mode, data = null) => {
    setPreviewMode(mode);
    setPreviewData(data);
    resetScroll();
  };

  // ------------------------------------------------------------ 长图预览独立成页
  if (previewMode) {
    return (
      <CertificatePreview
        previewMode={previewMode}
        previewData={previewData}
        currentUser={currentUser}
        kpName={kpName}
        playedModules={playedModules}
        modules={modules}
        toast={toast}
        showToast={showToast}
        onClose={() => { setPreviewMode(null); setPreviewData(null); }}
      />
    );
  }

  // ------------------------------------------------------------ 角色卡视图
  const renderCharacterView = () => {
    if (view === 'characters') {
      // 未登录 = 访客模式：数据只在本机浏览器里
      if (!currentUser) {
        return (
          <CharacterList
            key={`guest-${characterRefresh}`}
            mode="guest"
            currentUser={null}
            showToast={showToast}
            showConfirm={showConfirm}
            onOpen={(item) => { setCharacterOrigin('characters'); go('characterView', item.id); }}
            onEdit={(item) => { setGuestSheet(item ? getGuestSheet(item.id) : null); setCharacterOrigin('characters'); go('characterEdit', null); }}
            onPrint={(item) => go('characterPrint', item.id)}
          />
        );
      }
      return (
        <CharacterList
          key={`mine-${characterRefresh}`}
          mode="mine"
          currentUser={currentUser}
          showToast={showToast}
          showConfirm={showConfirm}
          onOpen={(item) => { setCharacterOrigin('characters'); go('characterView', item.id); }}
          onEdit={(item) => { setCharacterOrigin('characters'); go('characterEdit', item ? item.id : null); }}
          onPrint={(item) => go('characterPrint', item.id)}
        />
      );
    }
    if (view === 'kpCharacters' && isAdmin) {
      return (
        <CharacterList
          key={`kp-${characterRefresh}`}
          mode="kp"
          currentUser={currentUser}
          showToast={showToast}
          showConfirm={showConfirm}
          onOpen={(item) => { setCharacterOrigin('kpCharacters'); go('characterView', item.id); }}
          onEdit={(item) => { setCharacterOrigin('kpCharacters'); go('characterEdit', item ? item.id : null); }}
          onPrint={(item) => go('characterPrint', item.id)}
        />
      );
    }
    if (view === 'characterEdit') {
      const guest = !currentUser;
      return (
        <CharacterEditor
          key={guest ? (guestSheet?.id || 'guest-new') : (viewArg || 'new')}
          characterId={guest ? null : viewArg}
          guest={guest}
          initialSheet={guest ? guestSheet : null}
          currentUser={currentUser}
          owners={users}
          customOccupations={customOccupations}
          showToast={showToast}
          showConfirm={showConfirm}
          loadCharacter={!guest && viewArg ? () => apiGet(`/api/characters/${viewArg}`) : null}
          onGuestSave={(payload, id) => {
            try {
              const rec = saveGuestSheet(id ? { ...payload, id } : payload);
              setGuestSheet(rec);
              setCharacterRefresh((n) => n + 1);
              go('characterPrint', rec.id);
            } catch (err) { showToast(err.message, 'error'); }
          }}
          onSaved={(saved) => { setCharacterRefresh((n) => n + 1); go('characterView', saved.id); }}
          onCancel={() => go(characterOrigin === 'kpCharacters' ? 'kpCharacters' : 'characters')}
        />
      );
    }
    if (view === 'characterView') {
      // 访客草稿：不走服务端
      if (!currentUser) {
        const g = getGuestSheet(viewArg);
        if (!g) {
          return (
            <Panel>
              <EmptyState
                title="本机没有这张草稿"
                desc="可能已被清理或换了一台设备，返回列表重新创建即可。"
                action={<Button onClick={() => go('characters')}>返回列表</Button>}
              />
            </Panel>
          );
        }
        return (
          <GuestSheetView
            sheet={g}
            showToast={showToast}
            onBack={() => go('characters')}
            onEdit={() => { setGuestSheet(g); go('characterEdit', null); }}
            onPrint={() => go('characterPrint', g.id)}
            onDelete={() => showConfirm('删除这张本机草稿？', () => {
              deleteGuestSheet(g.id);
              setCharacterRefresh((n) => n + 1);
              go('characters');
            })}
            onLogin={() => go('auth')}
          />
        );
      }
      return (
        <CharacterDetail
          characterId={viewArg}
          currentUser={currentUser}
          showToast={showToast}
          showConfirm={showConfirm}
          onBack={() => go(characterOrigin)}
          onEdit={(c) => go('characterEdit', c.id)}
          onPrint={(c) => go('characterPrint', c.id)}
          onChanged={() => setCharacterRefresh((n) => n + 1)}
        />
      );
    }
    if (view === 'characterPrint') {
      const guestRec = currentUser ? null : getGuestSheet(viewArg);
      return (
        <CharacterPrintView
          characterId={guestRec ? null : viewArg}
          character={guestRec}
          customOccupations={customOccupations}
          showToast={showToast}
          onBack={() => go('characterView', viewArg)}
          onEdit={guestRec
            ? () => { setGuestSheet(guestRec); go('characterEdit', null); }
            : (c) => go('characterEdit', c.id)}
        />
      );
    }
    return null;
  };

  // ------------------------------------------------------------ 主渲染
  return (
    <div className="relative flex min-h-screen flex-col bg-paper font-sans text-ink">
      {/* 馆内的潮气与侧光（纯装饰层，样式在 index.css） */}
      <div className="archive-ambient" aria-hidden="true">
        <TentacleBackdrop />
      </div>

      {wipe ? (
        <span
          key={wipe.id}
          aria-hidden="true"
          className="theme-wipe"
          style={{ '--wipe-x': `${wipe.x}px`, '--wipe-y': `${wipe.y}px`, '--wipe-color': wipe.color }}
          onAnimationEnd={() => setWipe(null)}
        />
      ) : null}

      <Toast toast={toast} />
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      <DepthGauge />
      <BackToTop />

      <nav className="no-print glass-bar sticky top-0 z-50 border-b border-black/50 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.95)]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          {/* 报头细目：卷期与身份 */}
          <div className="hidden h-[22px] items-center justify-end gap-4 border-b border-white/10 font-mono text-[14px] tracking-[0.2em] text-[var(--c-masthead-ink)]/45 sm:flex sm:text-[14px] sm:tracking-[0.28em]">
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="hidden md:inline">VOL. IV · NO. 27</span>
              <span className="hidden items-center gap-2.5 sm:flex">
                <span aria-hidden="true" className="h-[3px] w-[3px] bg-vermilion" />
                <span>{currentUser ? '在册读者' : '访客阅览'}</span>
              </span>
            </span>
          </div>

          <div className="flex h-[64px] items-center gap-2 sm:gap-3 lg:gap-4">
            {/* 报头：铅字社徽 + 衬线站名 */}
            <button
              type="button"
              className="group flex min-w-0 shrink items-center gap-2 text-left sm:gap-2.5"
              onClick={() => { go('home'); setHomeTab('grid'); setSelectedCollection(null); }}
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-white/25 bg-white/[0.06] transition-colors duration-300 group-hover:border-vermilion/70">
                <SealMark size={27} className="text-[var(--c-masthead-ink)] transition-transform duration-700 ease-[var(--ease-bounce)] group-hover:-rotate-12" />
              </span>
              <span className="flex min-w-0 flex-col leading-none">
                <span className="truncate font-serif text-[16px] font-black tracking-[0.1em] text-[var(--c-masthead-ink)] sm:text-[17px] sm:tracking-[0.14em]">秘密调查档案馆</span>
              </span>
            </button>

            {/* 桌面导航：带编目的索引导航 */}
            <div className="hidden flex-1 items-stretch justify-center self-stretch lg:flex">
              <NavButton index="01" active={view === 'home'} onClick={() => go('home')} label="馆藏" />
              {currentUser ? (
                <>
                  <NavButton index="02" active={view === 'characters'} onClick={() => go('characters')} label="我的角色卡" />
                  {isAdmin && (
                    <>
                      <span aria-hidden="true" className="mx-0.5 my-4 w-px bg-white/15" />
                      <NavButton index="03" active={view === 'moduleForm'} onClick={() => { setFormData(EMPTY_MODULE); setIsEditing(false); go('moduleForm'); }} label="发布模组" />
                      <NavButton index="04" active={view === 'kpDashboard'} onClick={() => go('kpDashboard')} label="KP 控制台" />
                      <NavButton index="05" active={view === 'kpCharacters'} onClick={() => go('kpCharacters')} label="角色卡管理" />
                      <NavButton index="06" active={view === 'kpReview'} onClick={() => go('kpReview')} label="审卡中心" />
                    </>
                  )}
                </>
              ) : (
                <NavButton index="02" active={view === 'characters'} onClick={() => go('characters')} label="免费车卡" />
              )}
            </div>

            {/* 右侧：主题 / 身份 / 登录 / 手机菜单 */}
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:ml-0">
              <span className={currentUser ? 'hidden sm:inline-flex' : 'inline-flex'}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
              </span>
              {!currentUser ? (
                <Button onClick={() => go('auth')} className="!gap-1.5 !px-2 !py-1.5 !text-[13px] sm:!gap-2 sm:!px-3.5 sm:!py-2 sm:!text-[14px]">
                  <User className="h-4 w-4" />
                  登录身份
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => go('profile')}
                    className={cx(
                      'group relative flex h-9 items-center gap-2 border pl-1 pr-1.5 transition-all duration-300 ease-[var(--ease-soft)] sm:pr-2',
                      view === 'profile'
                        ? 'border-vermilion/70 bg-white/10'
                        : 'border-white/20 hover:border-white/45 hover:bg-white/[0.07]',
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center bg-[var(--c-masthead-ink)] font-serif text-[14px] font-black text-[var(--c-masthead)] sm:h-6 sm:w-6">
                      {String(currentUser.username || '?').slice(0, 1)}
                    </span>
                    <span aria-hidden="true" className="absolute -bottom-[3px] -right-[3px] h-[6px] w-[6px] bg-vermilion" />
                    <span className="hidden max-w-[7rem] truncate text-[14px] font-semibold text-[var(--c-masthead-ink)]/90 sm:block">{currentUser.username}</span>
                    {isAdmin ? <span className="hidden border border-ochre/45 px-1 py-0.5 font-kai text-[14px] tracking-[0.12em] text-ochre sm:block">守秘人</span> : null}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden p-2 text-[var(--c-masthead-ink)]/45 transition-colors hover:bg-vermilion/20 hover:text-vermilion lg:block"
                    title="登出"
                    aria-label="登出"
                  >
                    <LogOut className="h-[16px] w-[16px]" strokeWidth={1.9} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setNavOpen(true)}
                    className="flex h-9 w-9 items-center justify-center border border-white/20 text-[var(--c-masthead-ink)]/80 transition-colors hover:border-vermilion/70 hover:text-vermilion lg:hidden"
                    aria-label="打开导航"
                  >
                    <MenuMorph open={navOpen} className="text-[var(--c-masthead-ink)]/85" />
                    <span className="sr-only">打开导航</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <NavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        view={view}
        currentUser={currentUser}
        isAdmin={isAdmin}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={(v) => { setNavOpen(false); go(v); }}
        onNewModule={() => { setNavOpen(false); setFormData(EMPTY_MODULE); setIsEditing(false); go('moduleForm'); }}
        onLogout={() => { setNavOpen(false); handleLogout(); }}
      />

      <main className="relative z-10 mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-7 sm:px-6 sm:pt-9 lg:px-8">
        <div key={view} className="page-in">
          <RouteSweep />
          {/* ---------------------------------------------------- 登录 / 初始化 */}
          {view === 'auth' && (
            <AuthView
              isLoginMode={isLoginMode}
              setIsLoginMode={setIsLoginMode}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              authError={authError}
              setAuthError={setAuthError}
              onSubmit={handleAuth}
            />
          )}

          {/* ---------------------------------------------------- 模组录入 / 编辑 */}
          {view === 'moduleForm' && isAdmin && (
            <ModuleFormView
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
              uniqueSeries={uniqueSeries}
              onSubmit={handleSubmitModule}
              onBack={() => { go('home'); setFormData(EMPTY_MODULE); }}
            />
          )}

          {/* ---------------------------------------------------- 管理面板 */}
          {view === 'adminUsers' && isAdmin && (
            <AdminUsersPanel setView={(v) => go(v)} showToast={showToast} showConfirm={showConfirm} />
          )}
          {view === 'kpDashboard' && isAdmin && (
            <KpDashboardPanel
              modules={modules}
              users={users}
              showToast={showToast}
              showConfirm={showConfirm}
              handlePreview={handlePreview}
            />
          )}

          {/* ---------------------------------------------------- 角色卡 */}
          {['characters', 'kpCharacters', 'characterEdit', 'characterView', 'characterPrint'].includes(view) && renderCharacterView()}

          {view === 'kpReview' && isAdmin && (
            <KpReviewCenter
              currentUser={currentUser}
              showToast={showToast}
              showConfirm={showConfirm}
              onOpenCharacter={(id) => { setCharacterOrigin('kpReview'); go('characterView', id); }}
            />
          )}

          {/* ---------------------------------------------------- 首页 */}
          {view === 'home' && (
            <HomeView
              modules={modules}
              currentUser={currentUser}
              playedModules={playedModules}
              isAdmin={isAdmin}
              homeTab={homeTab}
              setHomeTab={setHomeTab}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRegion={filterRegion}
              setFilterRegion={setFilterRegion}
              filterPlayers={filterPlayers}
              setFilterPlayers={setFilterPlayers}
              filterDuration={filterDuration}
              setFilterDuration={setFilterDuration}
              filterPlayed={filterPlayed}
              setFilterPlayed={setFilterPlayed}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              uniqueSeries={uniqueSeries}
              uniqueRegions={uniqueRegions}
              uniquePlayers={uniquePlayers}
              uniqueDurations={uniqueDurations}
              filteredModules={filteredModules}
              onGoAuth={() => go('auth')}
              onGoCharacters={() => go('characters')}
              onOpenModule={(m) => { setSelectedModule(m); go('moduleDetail'); }}
              onEditModule={openEditMode}
              onDeleteModule={handleDeleteModule}
              onTogglePlayed={togglePlayed}
            />
          )}

          {/* ---------------------------------------------------- 模组详情 */}
          {view === 'moduleDetail' && selectedModule && (
            <ModuleDetailView
              module={selectedModule}
              isAdmin={isAdmin}
              currentUser={currentUser}
              played={playedModules.includes(selectedModule.id)}
              onBack={() => go('home')}
              onCopy={handleCopy}
              onEdit={openEditMode}
              onDelete={handleDeleteModule}
              onTogglePlayed={togglePlayed}
              onGoCharacters={() => go('characters')}
            />
          )}

          {/* ---------------------------------------------------- 个人中心 */}
          {view === 'profile' && currentUser && (
            <ProfileView
              currentUser={currentUser}
              isAdmin={isAdmin}
              modules={modules}
              playedModules={playedModules}
              getTitleStyles={getTitleStyles}
              showToast={showToast}
              onTogglePlayed={togglePlayed}
              onPreviewCertificate={() => handlePreview('player')}
              onGo={go}
              onLogout={handleLogout}
              onRenamed={(fresh) => { setCurrentUser(fresh); session.saveUser(fresh); }}
            />
          )}
        </div>
      </main>

      <footer className="no-print relative z-10 mt-8 overflow-hidden border-t-[3px] border-vermilion bg-[var(--c-masthead)] text-[var(--c-masthead-ink)]">
        <TentacleRule className="pointer-events-none absolute inset-x-0 -top-1 h-8 w-full opacity-30" />
        <div className="mx-auto max-w-[1240px] px-4 pb-6 pt-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="flex max-w-md items-start gap-4">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center border border-white/25 bg-white/[0.05]">
                <SealMark size={30} className="text-[var(--c-masthead-ink)]" />
              </span>
              <div>
                <p className="font-serif text-[17px] font-black leading-none tracking-[0.14em]">秘密调查档案馆</p>
                <p className="mt-2 font-mono text-[14px] tracking-[0.24em] text-[var(--c-masthead-ink)]/45">THE DROWNED ARCHIVE · ARCHIVE OF SECRET INQUIRY</p>
                <p className="mt-3 font-kai text-[14px] leading-relaxed tracking-[0.1em] text-[var(--c-masthead-ink)]/60">
                  凡不可名状者，皆有其卷宗。<br />馆内资料仅供在册调查员查阅。
                </p>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-1 gap-x-10 gap-y-2.5 self-center font-mono text-[14px] tracking-[0.12em] text-[var(--c-masthead-ink)]/55 sm:grid-cols-2">
              <a
                href="https://github.com/guinyd/coc-modules-archive"
                target="_blank"
                rel="noreferrer noopener"
                title="GitHub · coc-modules-archive"
                className="group inline-flex min-w-0 items-center gap-2.5 text-[#f0d8a4] transition-colors hover:text-[#f7ecd4]"
              >
                <Github className="h-[18px] w-[18px] shrink-0 text-[#f0d8a4]/80 transition-colors group-hover:text-[#f7ecd4]" strokeWidth={1.6} />
                <span className="truncate tracking-[0.16em]">GitHub 仓库</span>
              </a>
              <span className="inline-flex min-w-0 items-center gap-2.5">
                <Scale className="h-[18px] w-[18px] shrink-0 text-[var(--c-masthead-ink)]/45" strokeWidth={1.6} />
                <span className="truncate tracking-[0.16em]">授权协议 · MIT</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-2.5 sm:col-span-2">
                <Mail className="h-[18px] w-[18px] shrink-0 text-[var(--c-masthead-ink)]/45" strokeWidth={1.6} />
                <span className="tracking-[0.16em]">馆长邮箱 · cocyd@qq.com</span>
              </span>
            </div>
          </div>
          <div className="mt-8 flex justify-end border-t border-white/12 pt-3 font-mono text-[14px] tracking-[0.24em] text-[var(--c-masthead-ink)]/35">
            <span>OPEN SOURCE · MIT LICENSE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** 访客本机草稿的只读预览（不经过服务端） */
function GuestSheetView({ sheet, onBack, onEdit, onPrint, onDelete, onLogin, showToast }) {
  const d = computeSheet(sheet, {});
  const used = d.skills.filter((s) => s.used || s.occ > 0 || s.interest > 0 || s.growth > 0);
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div className="space-y-6">
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" onClick={onBack} className="!p-2.5" aria-label="返回">←</Button>
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-serif text-[30px] font-bold leading-tight text-slate-100 sm:text-[36px]">
                  {sheet.name || '未命名调查员'}
                </h1>
                <Badge tone="amber">本机草稿</Badge>
              </div>
              <p className="mt-1.5 text-[16px] text-slate-400">
                {d.occupation?.name || '无职业'} · {sheet.age} 岁 · {sheet.era}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setExportOpen(true)}><Share2 className="h-4 w-4" />导出编码 / 骰娘指令</Button>
            <Button variant="ghost" onClick={onPrint}><FileText className="h-4 w-4" />打印 / 导出 PDF</Button>
            <Button variant="ghost" onClick={onEdit}>编辑</Button>
            <Button onClick={onLogin}><User className="h-4 w-4" />登录后收录</Button>
            <Button variant="danger" onClick={onDelete}><Trash2 className="h-4 w-4" />删除</Button>
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[16px] leading-relaxed text-amber-300">
            这张卡只保存在本机浏览器，没有收录进档案馆：不能关联模组经历，也不会出现在 KP 的角色卡管理里。
          </p>
          <p className="mt-2 text-[14px] text-slate-500">
            教育增强记录：
            {d.eduGrowth.settled ? (
              <span className="text-slate-300">
                {d.eduGrowth.manual ? '手动录入' : `自动检定 ${d.eduGrowth.count} 次`}
                ，提升 <b className="font-serif text-cyan-300">+{d.eduGrowth.gain}</b>
                {d.eduGrowth.rolls?.length ? ` · 骰点 ${d.eduGrowth.rolls.map((r) => `D100=${r.roll}→+${r.gain}`).join('、')}` : ''}
              </span>
            ) : <span className="text-red-500">尚未结算</span>}
          </p>
          {d.legendary.enabled ? (
            <p className="mt-1 text-[14px] text-red-500">KP 已开启传奇标记（额外调整值单独一栏）。</p>
          ) : null}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="grid grid-cols-2 border-y border-line-strong sm:grid-cols-4 lg:grid-cols-7">
          {[['生命值 HP', d.hp], ['魔法点 MP', d.mp], ['理智 SAN', d.san], ['移动力 MOV', d.mov],
            ['伤害加值', d.db], ['体格', d.build], ['信用评级', `${d.creditRating}%`]].map(([l, v]) => (
            <div key={l} className="border-line px-3 py-3 text-center [&:not(:first-child)]:border-l">
              <div className="text-[14px] tracking-[0.12em] text-slate-500">{l}</div>
              <div className="mt-1 font-serif text-[22px] font-bold leading-none text-slate-100 tabular">{v}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <h2 className="mb-4 font-serif text-[19px] font-bold text-slate-100">技能（{used.length}）</h2>
        <div className="overflow-x-auto border border-line-strong">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-800 text-[14px] tracking-[0.1em] text-slate-500">
              <tr>
                <th className="p-3 text-left font-medium">技能</th>
                <th className="w-20 p-3 text-center font-medium">基础</th>
                <th className="w-20 p-3 text-center font-medium">职业</th>
                <th className="w-20 p-3 text-center font-medium">兴趣</th>
                <th className="w-24 p-3 text-center font-medium">成功率</th>
              </tr>
            </thead>
            <tbody>
              {used.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="p-3 text-slate-200">
                    {s.isOccupation ? <span className="mr-1.5 text-emerald-600">★</span> : <span className="mr-1.5 text-slate-600">·</span>}
                    {s.name}
                  </td>
                  <td className="p-3 text-center font-serif text-slate-500 tabular">{s.base}</td>
                  <td className="p-3 text-center font-serif text-slate-300 tabular">{s.occ || '-'}</td>
                  <td className="p-3 text-center font-serif text-slate-300 tabular">{s.interest || '-'}</td>
                  <td className="p-3 text-center font-serif font-bold text-slate-100 tabular">{s.total}%</td>
                </tr>
              ))}
              {used.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">还没有分配技能点</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-[19px] font-bold text-slate-100">备注</h2>
          <span className="text-[14px] text-slate-500">只做记录，不会出现在骰娘指令与打印件上</span>
        </div>
        <p className="whitespace-pre-wrap border border-line-strong bg-paper-deep p-3 text-[16px] leading-relaxed text-slate-300">
          {sheet.notes || <span className="text-slate-500">—</span>}
        </p>
      </Panel>

      <ExportCardModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        character={sheet}
        onToast={showToast}
      />
    </div>
  );
}

/** 顶部导航按钮：索书号 + 文字，悬停时一条朱砂底线从左抹开 */
function NavButton({ active, onClick, label, index }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group relative flex items-center gap-1.5 px-2 text-[14px] font-semibold tracking-[0.05em] whitespace-nowrap transition-colors duration-300 lg:px-2.5 lg:text-[14px]',
        active ? 'text-[var(--c-masthead-ink)]' : 'text-[var(--c-masthead-ink)]/55 hover:text-[var(--c-masthead-ink)]',
      )}
    >
      {index ? (
        <span className={cx('font-mono text-[14px] tracking-[0.06em] transition-colors duration-300', active ? 'text-vermilion' : 'text-white/30 group-hover:text-vermilion/80')}>
          {index}
        </span>
      ) : null}
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-x-2 bottom-0 h-[2px] origin-left bg-vermilion transition-transform duration-500 ease-[var(--ease-swift)]',
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
        )}
      />
    </button>
  );
}

/**
 * 昼 / 夜切换：报头上的小仪表开关。
 * 左侧是滑轨（两端的太阳/月亮是待选目标），右侧一行等宽小字显示当前模式。
 * 滑钮用回弹曲线滑行，钮内图标翻转淡入；按下时页面会扩散一圈印泥波纹。
 */
function ThemeToggle({ theme, onToggle, className }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      data-theme-toggle
      onClick={onToggle}
      aria-label={dark ? '切换到盐纸模式' : '切换到深海模式'}
      aria-pressed={dark}
      title={dark ? '切换到盐纸模式（日间）' : '切换到深海模式（夜间）'}
      className={cx(
        'theme-toggle group flex h-[32px] shrink-0 items-center gap-2 rounded-full border border-white/20 bg-black/25 pl-[3px] pr-2',
        'transition-colors duration-300 hover:border-white/45 hover:bg-black/35 focus-visible:border-vermilion',
        className,
      )}
    >
      <span aria-hidden="true" className="relative flex h-[26px] w-[50px] items-center rounded-full bg-black/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]">
        <span
          className={cx(
            'relative z-10 ml-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full',
            'bg-[var(--c-masthead-ink)] text-[var(--c-masthead)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.45)]',
            'transition-transform duration-[520ms] ease-[var(--ease-bounce)] group-active:scale-95',
            dark ? 'translate-x-[26px]' : 'translate-x-0',
          )}
        >
          <ThemeMorph dark={dark} className="h-4 w-4" />
        </span>
      </span>
      <span aria-hidden="true" className="hidden w-[34px] shrink-0 font-mono text-[14px] tracking-[0.16em] text-[var(--c-masthead-ink)]/60 sm:block">
        {dark ? 'DEEP' : 'SALT'}
      </span>
    </button>
  );
}

/**
 * 手机端导航抽屉：纸面从右侧滑入，Esc / 点遮罩关闭，打开时锁定页面滚动。
 * 桌面端隐藏（渲染也无妨，用 md:hidden 隐藏）。
 */
function NavDrawer({ open, onClose, view, currentUser, isAdmin, theme, onToggleTheme, onNavigate, onNewModule, onLogout }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = currentUser
    ? [
      { key: 'characters', label: '我的角色卡', icon: Users },
      ...(isAdmin ? [
        { key: 'kpDashboard', label: 'KP 控制台', icon: LayoutDashboard },
        { key: 'kpCharacters', label: '角色卡管理', icon: Shield },
        { key: 'kpReview', label: '审卡中心', icon: ClipboardCheck },
      ] : []),
      { key: 'profile', label: '个人中心', icon: User },
    ]
    : [
      { key: 'characters', label: '免费车卡', icon: Users },
      { key: 'auth', label: '登录身份', icon: User },
    ];

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      <div
        className="scrim absolute inset-0 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="导航"
        className="drawer-in absolute right-0 top-0 flex h-full w-[86%] max-w-[340px] flex-col overflow-hidden border-l border-line-strong bg-paper shadow-[-24px_0_80px_-30px_rgba(1,4,8,0.8)]"
      >
        <div className="relative flex items-center justify-between border-b border-white/10 bg-[var(--c-masthead)] px-5 py-4 text-[var(--c-masthead-ink)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center border border-white/25 bg-white/[0.06]">
              <SealMark size={23} className="text-[var(--c-masthead-ink)]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[16px] font-black tracking-[0.12em]">秘密调查档案馆</span>
              <span className="mt-1 font-mono text-[14px] tracking-[0.22em] text-[var(--c-masthead-ink)]/45">THE DROWNED ARCHIVE</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭导航"
            className="p-1.5 text-[var(--c-masthead-ink)]/70 transition-colors hover:bg-white/10 hover:text-vermilion"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-4 z-0 flex justify-center">
          <SealMark size={210} className="text-ink/[0.055]" />
        </div>

        {currentUser ? (
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="relative z-10 flex items-center gap-3 border-b border-line px-5 py-4 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center bg-ink font-serif text-[14px] font-bold text-paper-raised">
              {String(currentUser.username || '?').slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-ink">{currentUser.username}</span>
              <span className="mt-1 block text-[14px] tracking-[0.18em] text-moon">
                {isAdmin ? '守秘人 · 馆藏管理' : '调查员 · 在册'}
              </span>
            </span>
          </button>
        ) : null}

        <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onNavigate(it.key)}
              className={cx(
                'relative mb-1 flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left font-serif text-[16px] font-semibold transition-colors',
                view === it.key
                  ? 'bg-paper-deep text-ink'
                  : 'text-ink-soft hover:bg-paper-deep/70 hover:text-ink',
              )}
            >
              <span
                aria-hidden="true"
                className={cx('absolute inset-y-2 left-0 w-[3px]', view === it.key ? 'bg-gradient-to-b from-moon to-ochre' : 'bg-transparent')}
              />
              <it.icon className={cx('h-[16px] w-[16px]', view === it.key ? 'text-moon' : 'text-ink-mute')} strokeWidth={1.9} />
              {it.label}
            </button>
          ))}

          {isAdmin ? (
            <>
              <div className="my-4 h-px bg-line" />
              <button
                type="button"
                onClick={onNewModule}
                className="flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left font-serif text-[16px] font-semibold text-ink-soft transition-colors hover:bg-paper-deep/70 hover:text-ink"
              >
                <Plus className="h-[16px] w-[16px] text-ink-mute" strokeWidth={1.9} />
                发布模组
              </button>
            </>
          ) : null}
        </nav>

        <div className="relative z-10 border-t border-line px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block font-mono text-[14px] tracking-[0.22em] text-ink-mute">
                {theme === 'dark' ? 'DEEP WATER' : 'SALT PAPER'}
              </span>
              <span className="mt-1 block font-serif text-[14.5px] font-bold text-ink">
                {theme === 'dark' ? '深海模式' : '盐纸模式'}
              </span>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        {currentUser ? (
          <div className="relative z-10 border-t border-line p-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-[14px] text-ink-mute transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-[16px] w-[16px]" strokeWidth={1.9} />
              登出
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}