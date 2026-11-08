/**
 * 半自动车卡编辑器。
 *
 * 设计目标：把 Excel 车卡表里"要手算的部分"全部自动化，同时保留玩家对每一步的控制权。
 *   - 属性：可手填，也可一键掷骰（3D6×5 / (2D6+6)×5），并显示掷骰明细。
 *   - 派生值：HP / MP / 理智 / 移动力 / 伤害加值 / 体格 / 闪避 / 母语 全部实时计算。
 *   - 年龄补正：按 COC 7e 规则自动套用（可关闭），并提示需要做几次教育增强检定。
 *   - 技能：默认列出全部技能；职业点预算按职业公式自动算，兴趣点为智力×2。
 *   - 本职技能：从职业模板自动标记，并对「任选社交 / 任意特长 / 任选其一」给出待选槽位。
 *   - 专攻技能用下拉菜单选择方向；信用评级与克苏鲁神话重点高亮。
 *   - 支持自定义技能（自命名 + 自填基础值），计入点数统计并一起打印。
 *   - 访客模式：不登录也能完整车卡与导出，数据只存在本机浏览器里。
 *
 * 计算一律调用 shared/coc7e.js（与后端同一份算法），保存时后端会再算一遍，前端无法伪造数值。
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle, ArrowLeft, BookOpen, Check, CloudUpload, Crown, Dices, Download, FileText, Info, Library, Plus, Save,
  ScrollText, Search, Sword, Trash2, User as UserIcon, Wand2, X,
} from 'lucide-react';
import {
  ALL_CHARS, BACKGROUND_FIELDS, BUILTIN_WEAPON, CHAR_LABEL, CHARS, CUSTOM_SKILL_MAX, ERAS,
  NAMED_SKILL_HINT, OCCUPATIONS, SKILL_BY_KEY, SOCIAL_SKILLS, STATUSES, STATUS_LABEL,
  WEAPONS, ageAdjust, agePoolKeys, agePoolPoints, defaultAgeAlloc, resolveAgeAlloc,
  occupationBranchHints, blankCustomSkill, blankSheet, blankSkills, computeSheet,
  currenciesFor, DEFAULT_CURRENCY, isNamedSkill, specOptions, validateSheet,
  blankEduGrowth, blankLegendary, blankLegendaryBonus, grantEduReroll, resetEduGrowth, houseRuleSummary,
  AUDIT_RULE_META, DEFAULT_AUDIT_RULES,
} from '../../../shared/coc7e.js';
import { rollCharacteristics, rollLuck, educationCheck } from '../../lib/dice.js';
import {
  SPELL_CATALOG, SPELL_CATEGORIES, TOME_CATALOG, SPELL_LIMIT, TOME_LIMIT,
  blankSpell, blankTome, spellFromCatalog, tomeFromCatalog,
} from '../../../shared/occult.js';
import { parseAttributeBlocks, ATTR_LABEL, ATTR_ORDER } from '../../lib/attrImport.js';
import { apiGet, apiPost, apiPut } from '../../lib/api.js';
import {
  Badge, Button, Combobox, Drawer, Field, Input, Modal, NumberInput, Pager, Panel, Select, Tabs, Textarea, Toggle, WarningList, cx,
} from '../ui.jsx';

/** 表单字段：label 12.5px、输入框 15px、占位符至少 ink-mute（ui.jsx 的 Field 写死 9.5px，这里用后代选择器覆盖） */
const FIELD = 'text-[16px] [&>span:first-child>span:first-child]:text-[14px] [&>span:first-child>span:first-child]:tracking-[0.12em] [&>span:first-child>span:first-child]:text-ink-soft [&_input::placeholder]:text-ink-mute [&_textarea::placeholder]:text-ink-mute';

const TABS = [
  { key: 'base', label: '属性与职业', icon: UserIcon },
  { key: 'house', label: '房规', icon: ScrollText },
  { key: 'skills', label: '技能分配', icon: Wand2 },
  { key: 'combat', label: '战斗', icon: Sword },
  { key: 'story', label: '背景故事', icon: BookOpen },
  { key: 'journal', label: '装备与经历', icon: FileText },
  { key: 'appendix', label: '附表', icon: Library },
];

const occultId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;


/** 把后端返回的角色卡对象（或访客草稿）转成可编辑的表单数据 */
export function toEditableSheet(character) {
  if (!character) return { ...blankSheet(), ruleSetId: '' };
  return {
    ruleSetId: character.ruleSetId || '',
    name: character.name || '',
    playerName: character.playerName || '',
    occupationId: character.occupationId === undefined || character.occupationId === null
      ? '' : String(character.occupationId),
    age: character.age ?? 25,
    gender: character.gender || '',
    residence: character.residence || '',
    birthplace: character.birthplace || '',
    era: character.era || '1920s',
    chars: { ...blankSheet().chars, ...(character.chars || {}) },
    charGrowth: { ...(character.charGrowth || {}) },
    sanGrowth: character.sanGrowth || 0,
    eduBonus: character.eduBonus || 0,
    applyAgeAdjust: character.applyAgeAdjust === true,   // 默认关闭，老卡保留已保存的选择
    armorPenalty: character.armorPenalty || 0,
    ageAlloc: { ...(character.ageAlloc || {}) },
    eduGrowth: { ...blankEduGrowth(), ...(character.eduGrowth || {}) },
    legendary: { ...blankLegendary(), ...(character.legendary || {}) },
    legendaryBonus: { ...blankLegendaryBonus(), ...(character.legendaryBonus || {}) },
    agePenaltyWaived: character.agePenaltyWaived === true,
    notes: character.notes || '',
    occPicks: character.occPicks || { free: [], social: [], choices: [] },
    skills: (character.skills && character.skills.length ? character.skills : blankSkills())
      .map((s) => ({ ...s })),
    customSkills: (character.customSkills || []).map((s) => ({ ...s })),
    skillMarks: { ...(character.skillMarks || {}) },
    weapons: (character.weapons && character.weapons.length
      ? character.weapons
      : blankSheet().weapons).map((w) => ({ ...w })),
    equipment: character.equipment || '',
    equipmentItems: Array.isArray(character.equipmentItems) ? character.equipmentItems : [],
    spells: Array.isArray(character.spells) ? character.spells.map((x) => ({ ...x })) : [],
    tomes: Array.isArray(character.tomes) ? character.tomes.map((x) => ({ ...x })) : [],
    currency: character.currency || DEFAULT_CURRENCY[character.era || '1920s'] || 'USD',
    extraAssets: character.extraAssets || '',
    background: { ...blankSheet().background, ...(character.background || {}) },
    experience: character.experience || '',
    // 「模组经历」在详情页维护，但存档是全量 PUT，这里必须原样带上，
    // 否则编辑保存会把关联模组清空（服务端也会做缺省保护）。
    moduleLinks: (character.moduleLinks || []).map((l) => ({
      moduleId: l.moduleId,
      role: l.role || 'PC',
      date: l.date || '',
      note: l.note || '',
    })),
    status: character.status || 'draft',
    isPublic: Boolean(character.isPublic),
  };
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ------------------------------------------------------------------ 小组件
function ProgressBar({ used, total, label, hint }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const over = used > total;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-[14px] leading-[1.6]">
        <span className="text-ink-soft">{label}{hint ? <span className="ml-1 text-ink-mute">{hint}</span> : null}</span>
        <span className={cx('tabular font-mono font-semibold', over ? 'text-vermilion' : 'text-forest')}>
          {used} / {total}{over ? `（超 ${used - total}）` : `（余 ${total - used}）`}
        </span>
      </div>
      <div className="h-[4px] overflow-hidden rounded-full bg-paper-deep">
        <div className={cx('h-full transition-all duration-300', over ? 'bg-vermilion/90' : 'bg-forest/80')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DerivedGrid({ derived }) {
  const items = [
    ['生命值 HP', derived.hp], ['魔法点 MP', derived.mp], ['理智 SAN', `${derived.san} / ${derived.sanMax}`],
    ['移动力 MOV', derived.mov], ['伤害加值 DB', derived.db], ['体格 Build', derived.build],
    ['闪避', derived.dodgeBase], ['母语', derived.ownLanguageBase],
  ];
  return (
    <div className="grid grid-cols-2 divide-line border-y border-line-strong sm:grid-cols-4 sm:divide-x">
      {items.map(([label, value]) => (
        <div key={label} className="px-3.5 py-4">
          <div className="mb-1.5 font-mono text-[14px] font-semibold tracking-[0.14em] text-ink-mute">{label}</div>
          <div className="tabular font-serif text-[24px] font-bold leading-none text-ink">{value}</div>
        </div>
      ))}
    </div>
  );
}

/** 专攻方向下拉：列出该组的官方常见方向，也允许自己输入 */
function SpecPicker({ skillKey, value, onChange }) {
  const options = specOptions(skillKey);
  const [customMode, setCustomMode] = useState(() => Boolean(value) && !options.includes(value));
  if (customMode) {
    return (
      <span className="flex min-w-0 items-center gap-0.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 24))}
          maxLength={24}
          placeholder="自定义"
          className="w-[5.4rem] rounded-[2px] border border-line-strong bg-paper-raised px-1.5 py-0.5 text-[12.5px] text-ink"
        />
        <button
          type="button"
          title="回到预设列表"
          onClick={() => { setCustomMode(false); onChange(''); }}
          className="text-ink-mute transition-colors hover:text-vermilion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }
  return (
    <select
      value={options.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === '__custom__') { setCustomMode(true); onChange(''); } else onChange(e.target.value);
      }}
      className="w-[5.4rem] shrink-0 cursor-pointer rounded-[2px] border border-line-strong bg-paper-raised px-1 py-0.5 text-[12.5px] text-ink"
    >
      <option value="">（未选择）</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">自定义…</option>
    </select>
  );
}

/**
 * 「任选 N 项社交技能 / 任意 N 项特长」选择器。
 * 自由特长的候选池有几十项，给一个搜索框才找得到；社交技能只有 4 项，平铺更直观。
 */
function SpecialtyPicker({ group, onToggle }) {
  const [q, setQ] = useState('');
  const pool = useMemo(
    () => group.pool || Object.values(SKILL_BY_KEY).map((s) => s.key),
    [group.pool],
  );
  const searchable = !group.pool && pool.length > 8;
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return pool;
    return pool.filter((k) => (SKILL_BY_KEY[k]?.name || k).toLowerCase().includes(kw));
  }, [pool, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[14px] text-ink-soft">
          {group.label} <span className="font-bold text-ochre">{group.picked.length}/{group.limit}</span>
          <span className="ml-2 text-[12.5px] text-ink-mute">带分支的技能组（格斗/射击/技艺/外语/科学）按整组计入，分支在技能表里自选</span>
        </p>
        {searchable ? (
          <div className="flex items-center gap-1.5">
            <Search className="h-4 w-4 text-ink-mute" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索特长…"
              className="!py-1.5 !w-40 text-[14px]"
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
        {list.map((k) => {
          const on = group.picked.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => onToggle(group.type, k)}
              className={cx('rounded-[2px] border px-2.5 py-1.5 text-[14px] font-semibold transition',
                on ? 'border-forest bg-forest text-paper-raised' : 'border-line-strong bg-paper-raised text-ink-soft hover:border-forest/50')}
            >
              {SKILL_BY_KEY[k]?.name || k}
              {SKILL_BY_KEY[k]?.spec ? (
                <span className="ml-1 text-[11.5px] font-normal opacity-80">含全部分支</span>
              ) : null}
            </button>
          );
        })}
        {searchable && list.length === 0 ? (
          <p className="py-1 text-[14px] leading-[1.7] text-ink-mute">没有匹配的本职候选；规则书之外的技能可用下方「自定义技能」并勾选本职。</p>
        ) : null}
      </div>
      {group.picked.length > 0 ? (
        <p className="mt-2 text-[14px] text-ink-mute">
          已选：{group.picked.map((k) => SKILL_BY_KEY[k]?.name || k).join('、')}
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ 主组件
function fmtAuditValue(meta, value) {
  if (meta.type === 'boolean') return value ? '启用' : '关闭';
  if (meta.key === 'minPointUsage') return value ? `${Math.round(value * 100)}%` : '不检查';
  return value ? String(value) : '不检查';
}

/** 规则集详情抽屉：把审卡阈值与自定义规则完整摊开，玩家选之前就能看清。 */
function RuleSetDetail({ set }) {
  if (!set) return null;
  const rules = { ...DEFAULT_AUDIT_RULES, ...(set.auditRules || {}) };
  const houseRules = set.houseRules || [];
  const numeric = houseRules.filter((r) => r.type === 'deriveBase');
  const checks = houseRules.filter((r) => r.type !== 'deriveBase');
  return (
    <div className="space-y-5 text-[14px] leading-relaxed text-ink-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={set.scope === 'global' ? 'amber' : 'slate'}>{set.scope === 'global' ? '全局默认' : '个人规则'}</Badge>
        {set.isActive ? <Badge tone="emerald">守秘人当前在用</Badge> : null}
      </div>
      <p className="text-[13.5px] text-ink-mute">
        发布：{set.ownerName || '未登记'}{set.updatedAt ? ` · ${new Date(set.updatedAt).toLocaleDateString('zh-CN')}` : ''}
      </p>

      <section>
        <h4 className="mb-2 font-serif text-[16px] font-bold text-ink">数值规则（会改写车卡）</h4>
        {numeric.length ? (
          <ul className="space-y-1.5">
            {numeric.map((r) => (
              <li key={r.id} className="border-l-2 border-ochre/50 pl-2.5">{houseRuleSummary(r)}</li>
            ))}
          </ul>
        ) : <p className="text-ink-mute">这套规则不改变车卡基础值。</p>}
      </section>

      <section>
        <h4 className="mb-2 font-serif text-[16px] font-bold text-ink">审卡校验项</h4>
        <ul className="space-y-1">
          {AUDIT_RULE_META.map((meta) => {
            const value = rules[meta.key];
            const changed = value !== DEFAULT_AUDIT_RULES[meta.key];
            return (
              <li key={meta.key} className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1">
                <span className="min-w-0">
                  {meta.label}
                  {changed ? <span className="ml-1 text-[12px] text-ochre">已调整</span> : null}
                </span>
                <b className="shrink-0 font-mono text-[13px] text-ink">{fmtAuditValue(meta, value)}</b>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 font-serif text-[16px] font-bold text-ink">自定义审卡要求</h4>
        {checks.length ? (
          <ul className="space-y-1.5">
            {checks.map((r) => (
              <li key={r.id} className="border-l-2 border-moon/50 pl-2.5">{houseRuleSummary(r)}</li>
            ))}
          </ul>
        ) : <p className="text-ink-mute">没有额外的属性 / 技能门槛。</p>}
      </section>
    </div>
  );
}

export default function CharacterEditor({
  characterId = null, loadCharacter = null, owners = [], customOccupations = [],
  currentUser, guest = false, initialSheet = null,
  onSaved, onGuestSave, onCancel, showToast, showConfirm,
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(Boolean(characterId) && !guest);
  const [sheet, setSheet] = useState(() => toEditableSheet(initialSheet));
  const [tab, setTab] = useState('base');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [occOpen, setOccOpen] = useState(false);
  // 骰娘导入：长期存在的输入框 + 解析出的候选卡片
  const [importText, setImportText] = useState('');
  const [importBlocks, setImportBlocks] = useState([]);
  const [skillFilter, setSkillFilter] = useState('all');
  const [skillQuery, setSkillQuery] = useState('');
  const [gearDraft, setGearDraft] = useState({ part: '', name: '' });
  const [ownerId, setOwnerId] = useState(initialSheet?.ownerId || currentUser?.id || '');
  const [weaponPick, setWeaponPick] = useState('');
  // 守秘人发布的规则集（房规 + 审卡规则）：玩家在「房规」页选用
  const [ruleSets, setRuleSets] = useState([]);

  const occupations = useMemo(() => [...OCCUPATIONS, ...(customOccupations || [])], [customOccupations]);
  const chosenRuleSet = useMemo(
    () => (ruleSets || []).find((s) => s.id === sheet.ruleSetId) || null,
    [ruleSets, sheet.ruleSetId],
  );
  const houseRules = useMemo(() => chosenRuleSet?.houseRules || [], [chosenRuleSet]);
  const RULE_PAGE = 6;
  const [ruleQuery, setRuleQuery] = useState('');
  const [rulePage, setRulePage] = useState(1);
  const [ruleDetail, setRuleDetail] = useState(null);
  // 附表：法术详情 / 神话典籍
  const [spellPicker, setSpellPicker] = useState(null);
  const [spellQuery, setSpellQuery] = useState('');
  const [spellCat, setSpellCat] = useState('全部');
  const [tomePicker, setTomePicker] = useState(false);
  const [tomeQuery, setTomeQuery] = useState('');
  const ruleHints = useMemo(() => {
    const out = new Set();
    (ruleSets || []).forEach((s) => { if (s.name) out.add(s.name); if (s.ownerName) out.add(s.ownerName); });
    return [...out].slice(0, 20);
  }, [ruleSets]);
  const filteredRuleSets = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase();
    if (!q) return ruleSets || [];
    return (ruleSets || []).filter((s) => [s.name, s.ownerName, s.scope === 'global' ? '全局默认' : '个人规则']
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [ruleSets, ruleQuery]);
  const rulePages = Math.max(1, Math.ceil(filteredRuleSets.length / RULE_PAGE));
  const rulePageNow = Math.min(rulePage, rulePages);
  const pagedRuleSets = filteredRuleSets.slice((rulePageNow - 1) * RULE_PAGE, rulePageNow * RULE_PAGE);
  useEffect(() => { setRulePage(1); }, [ruleQuery]);
  const ctx = useMemo(() => ({ customOccupations, houseRules }), [customOccupations, houseRules]);

  /**
   * 编辑既有角色卡时加载数据。
   *
   * ⚠️ 踩坑记录：早先这个 effect 把 loadCharacter / initialSheet / onCancel / showToast 都放进了依赖，
   * 而父组件每次渲染都会新建这些函数 —— 于是 App 一重渲染（比如 toast 消失）effect 就重跑，
   * 把正在编辑的 sheet 重置成空白，表现为「年龄补正还没保存，属性就被清零」。
   * 现在改用 ref 保存回调，依赖只保留 characterId / guest。
   * 注意不能再用「已加载过就跳过」的 loadedRef 守卫：React StrictMode 会先挂载再卸载、
   * 第二次 effect 直接 return，导致首次请求的 alive 已被置 false，页面永远停在载入中。
   */
  const loaderRef = useRef(loadCharacter);
  const toastRef = useRef(showToast);
  const cancelRef = useRef(onCancel);
  useEffect(() => { loaderRef.current = loadCharacter; }, [loadCharacter]);
  useEffect(() => { toastRef.current = showToast; }, [showToast]);
  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);

  useEffect(() => {
    if (guest) { setLoading(false); return undefined; }
    if (!characterId) {
      // 新建角色卡：初始值由 useState 的初始化函数给出，这里**绝不能**再重置一次
      setCharacter(null);
      setLoading(false);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    Promise.resolve(loaderRef.current?.())
      .then((data) => {
        if (!alive || !data) return;
        setCharacter(data);
        setSheet(toEditableSheet(data));
        setOwnerId(data.ownerId);
        setDirty(false);
      })
      .catch((err) => {
        if (alive) { toastRef.current?.(err.message, 'error'); cancelRef.current?.(); }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [characterId, guest]);

  // 房规列表：登录用户才能看到守秘人发布的规则集；访客只能看到本机草稿
  useEffect(() => {
    if (guest) { setRuleSets([]); return undefined; }
    let alive = true;
    apiGet('/api/rule-sets')
      .then((data) => { if (alive) setRuleSets(Array.isArray(data.items) ? data.items : []); })
      .catch(() => { /* 拉取失败不阻塞车卡 */ });
    return () => { alive = false; };
  }, [guest]);

  const derived = useMemo(() => computeSheet(sheet, ctx), [sheet, ctx]);
  const attrSum = CHARS.reduce((n, k) => n + (Number(derived.eff?.[k]) || 0), 0);
  const attrWithLuck = attrSum + (Number(derived.eff?.Luck) || 0);
  const warnings = useMemo(() => validateSheet(sheet, ctx), [sheet, ctx]);
  const occ = useMemo(
    () => occupations.find((o) => String(o.id) === String(sheet.occupationId)) || null,
    [occupations, sheet.occupationId],
  );

  const patch = useCallback((partial) => { setSheet((prev) => ({ ...prev, ...partial })); setDirty(true); }, []);

  /** 装备条目：结构化列表，同步一份纯文本给旧版打印 / Markdown 兜底 */
  const setEquipmentItems = (items) => {
    patch({
      equipmentItems: items,
      equipment: items.filter((it) => it.name)
        .map((it) => `【${it.part || '随身'}】${it.name}`).join('\n'),
    });
  };
  const gearItems = sheet.equipmentItems || [];
  const addGear = () => {
    const name = gearDraft.name.trim();
    if (!name) return;
    setEquipmentItems([...gearItems, {
      id: `g${Date.now().toString(36)}`,
      part: gearDraft.part.trim(), name,
    }]);
    setGearDraft({ part: gearDraft.part, name: '' });
  };

  const setChar = (key, value) => {
    setSheet((prev) => ({ ...prev, chars: { ...prev.chars, [key]: value === '' ? '' : Number(value) } }));
    setDirty(true);
  };

  const setCharGrowth = (key, value) => {
    const n = value === '' ? 0 : Math.max(0, Math.min(99, Math.trunc(Number(value)) || 0));
    setSheet((prev) => ({ ...prev, charGrowth: { ...(prev.charGrowth || {}), [key]: n } }));
    setDirty(true);
  };

  /** 年龄补正池的指纹：属性组合 + 点数。变了就说明旧的分配不再适用 */
  const poolKey = (age) => {
    const adj = ageAdjust(age);
    return `${agePoolKeys(adj).join(',')}:${agePoolPoints(adj)}`;
  };

  /**
   * 修改年龄。
   * ⚠️ 不能每次按键都钳制（那样输入 25 会被夹成 15/120）—— 输入框自己处理合法性，
   * 这里只负责在「补正池」变化时清掉旧的力量/体质/敏捷分配，让默认平均分配接手。
   */
  const setAge = (value) => {
    setSheet((prev) => {
      const age = value === '' ? '' : value;
      return {
        ...prev,
        age,
        ageAlloc: poolKey(prev.age) === poolKey(age) ? (prev.ageAlloc || {}) : {},
      };
    });
    setDirty(true);
  };

  /** 调整年龄补正分配（只允许在补正池涉及的属性上加减） */
  const setAgeAlloc = (key, value) => {
    setSheet((prev) => {
      const adj = ageAdjust(prev.age);
      const cur = resolveAgeAlloc(adj, prev.ageAlloc);
      const n = value === '' ? 0 : Math.max(0, Math.trunc(Number(value)) || 0);
      return { ...prev, ageAlloc: { ...cur, [key]: n } };
    });
    setDirty(true);
  };

  const resetAgeAlloc = (mode) => {
    setSheet((prev) => {
      const adj = ageAdjust(prev.age);
      if (mode === 'even') return { ...prev, ageAlloc: defaultAgeAlloc(adj) };
      // 「清零」要显式写 0：空对象会被引擎当成「没填过」而回落到默认平均分配
      const zeros = {};
      for (const k of agePoolKeys(adj)) zeros[k] = 0;
      return { ...prev, ageAlloc: zeros };
    });
    setDirty(true);
  };

  const setSkill = (id, field, value) => {
    setSheet((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, [field]: value === '' ? '' : Number(value) } : s)),
    }));
    setDirty(true);
  };
  const setSkillCustom = (id, value) => {
    setSheet((prev) => ({ ...prev, skills: prev.skills.map((s) => (s.id === id ? { ...s, custom: value } : s)) }));
    setDirty(true);
  };
  const setCustomSkill = (id, field, value) => {
    setSheet((prev) => ({
      ...prev,
      customSkills: prev.customSkills.map((s) => (s.id === id
        ? {
          ...s,
          [field]: (field === 'name' || field === 'isOccupation')
            ? value
            : (value === '' ? '' : Number(value)),
        }
        : s)),
    }));
    setDirty(true);
  };
  const addCustomSkill = () => {
    if (sheet.customSkills.length >= CUSTOM_SKILL_MAX) return showToast(`自定义技能最多 ${CUSTOM_SKILL_MAX} 项`, 'error');
    patch({ customSkills: [...sheet.customSkills, blankCustomSkill()] });
  };
  const removeCustomSkill = (id) => patch({ customSkills: sheet.customSkills.filter((s) => s.id !== id) });

  // ---------------------------------------------------------- 附表：法术 / 典籍
  const spellRows = sheet.spells || [];
  const tomeRows = sheet.tomes || [];
  const updateSpell = (id, field, value) => {
    setSheet((prev) => ({
      ...prev,
      spells: (prev.spells || []).map((sp) => (sp.id === id ? { ...sp, [field]: value } : sp)),
    }));
    setDirty(true);
  };
  const addSpell = (entry) => {
    if (spellRows.length >= SPELL_LIMIT) { showToast(`法术最多 ${SPELL_LIMIT} 条`, 'error'); return; }
    const id = occultId('sp');
    const row = entry ? spellFromCatalog(entry, id) : blankSpell({ id });
    setSheet((prev) => ({ ...prev, spells: [...(prev.spells || []), row] }));
    setDirty(true);
    if (entry) showToast(`已填入「${entry.name}」`);
  };
  const removeSpell = (id) => patch({ spells: spellRows.filter((sp) => sp.id !== id) });
  const updateTome = (id, field, value) => {
    setSheet((prev) => ({
      ...prev,
      tomes: (prev.tomes || []).map((tm) => (tm.id === id ? { ...tm, [field]: value } : tm)),
    }));
    setDirty(true);
  };
  const addTome = (entry) => {
    if (tomeRows.length >= TOME_LIMIT) { showToast(`典籍最多 ${TOME_LIMIT} 条`, 'error'); return; }
    const id = occultId('tm');
    const row = entry ? tomeFromCatalog(entry, id) : blankTome({ id });
    setSheet((prev) => ({ ...prev, tomes: [...(prev.tomes || []), row] }));
    setDirty(true);
    if (entry) showToast(`已填入「${entry.name}」`);
  };
  const removeTome = (id) => patch({ tomes: tomeRows.filter((tm) => tm.id !== id) });
  const spellResults = useMemo(() => {
    const q = spellQuery.trim().toLowerCase();
    return SPELL_CATALOG.filter((sp) => (spellCat === '全部' || sp.category === spellCat)
      && (!q || sp.name.toLowerCase().includes(q)
        || sp.category.toLowerCase().includes(q)
        || (sp.aliases || []).some((a) => a.toLowerCase().includes(q))));
  }, [spellQuery, spellCat]);
  const tomeResults = useMemo(() => {
    const q = tomeQuery.trim().toLowerCase();
    if (!q) return TOME_CATALOG;
    return TOME_CATALOG.filter((tm) => tm.name.toLowerCase().includes(q)
      || (tm.meta || '').toLowerCase().includes(q)
      || (tm.desc || '').toLowerCase().includes(q));
  }, [tomeQuery]);

  // ---------------------------------------------------------- 属性生成
  const luckTwice = derived.ageAdjust.luckRolls > 1;   // 15-19 岁：幸运掷两次取高

  const doRollAll = () => {
    const { chars } = rollCharacteristics();
    const luck = rollLuck(luckTwice);
    setSheet((prev) => ({ ...prev, chars: { ...chars, Luck: luck.value } }));
    setDirty(true);
    showToast(`已生成属性（幸运 ${luck.value}）`);
  };

  const doRollLuck = () => {
    const luck = rollLuck(luckTwice);
    setChar('Luck', luck.value);
    showToast(`幸运重掷为 ${luck.value}`);
  };

  /** 把一组解析结果填进属性；缺失项保持原值 */
  const applyImportBlock = (block) => {
    setSheet((prev) => ({
      ...prev,
      chars: {
        ...prev.chars,
        ...block.chars,
        ...(block.luck !== null ? { Luck: block.luck } : {}),
      },
    }));
    setImportBlocks([]);
    setDirty(true);
    showToast(`已导入 ${Object.keys(block.chars).length + (block.luck !== null ? 1 : 0)} 项属性`);
  };

  /** 解析粘贴框：一组直接填，多组拆成卡片让玩家选 */
  const doImportAttributes = () => {
    const blocks = parseAttributeBlocks(importText);
    if (!blocks.length) {
      showToast('没有识别到属性，请确认文本里有「力量:55」这类行', 'error');
      return;
    }
    if (blocks.length === 1) {
      applyImportBlock(blocks[0]);
      return;
    }
    setImportBlocks(blocks);
  };

  /**
   * 教育增强（年龄成长）：
   *  - 自动检定：D100 > 当前教育则 +1D10，逐个记下骰点，并写入 eduGrowth 记录（KP 可见）；
   *  - 手动录入：玩家/ KP 直接填提升总值（面团线下车卡的补录）；
   *  - 清零：把数值与记录一起清掉。
   * ⚠️ 提升量只记进 eduBonus（有效教育 = 掷骰教育 + eduBonus），**不再关掉年龄补正**；
   *    只要结算过（哪怕这次没提升），「需要做 N 次教育增强检定」的提示就会消失。
   */
  const eduActor = currentUser?.username || (guest ? '访客' : '');

  const isKp = currentUser?.role === 'admin';
  // 结算过又没有 KP 授权 → 玩家不能自助重掷 / 清零（服务端同样会拦）
  const eduLocked = derived.eduGrowth.locked && !isKp;
  const eduGranted = derived.eduGrowth.granted || 0;
  // 手动录入先存草稿，点「确认结算」才写入 eduBonus / 记一条流水（避免每敲一键就结算）
  const [eduDraft, setEduDraft] = useState(String(Number(sheet.eduBonus) || 0));
  useEffect(() => {
    setEduDraft(String(Number(sheet.eduBonus) || 0));
  }, [sheet.eduBonus]);
  const eduDraftDirty = Math.max(0, Math.trunc(Number(eduDraft) || 0)) !== (Number(sheet.eduBonus) || 0);

  const doEduChecks = () => {
    const n = derived.ageAdjust.eduChecks;
    if (!n) return showToast('该年龄不需要进行教育增强检定', 'error');
    if (eduLocked) {
      return showToast('这张卡的教育增强已经结算过了；需要重掷请让 KP 在角色卡列表 / 审卡中心点「授权重掷」', 'error');
    }
    if (derived.eduGrowth.settled) {
      showConfirm?.(`这张卡已经结算过 ${derived.eduGrowth.attempts?.length || 1} 次教育增强`
        + `${eduGranted > 0 ? `（KP 已授权 ${eduGranted} 次重掷，本次会用掉一次）` : ''}。确定要重掷一次吗？`, runEduChecks);
      return;
    }
    runEduChecks();
  };

  const runEduChecks = () => {
    const n = derived.ageAdjust.eduChecks;
    let edu = derived.eff.EDU;                 // 用当前有效教育作为检定门槛
    let totalGain = 0;
    const log = [];
    const rolls = [];
    for (let i = 0; i < n; i++) {
      const r = educationCheck(edu);
      log.push(`第 ${i + 1} 次：${r.detail}`);
      rolls.push({ roll: r.roll, gain: r.gain });
      edu += r.gain;
      totalGain += r.gain;
    }
    setSheet((prev) => {
      const prevGrowth = derived.eduGrowth;
      const isReroll = prevGrowth.settled === true;
      const bonus = isReroll ? totalGain : (Number(prev.eduBonus) || 0) + totalGain;
      const attempt = {
        at: Date.now(), by: eduActor, manual: false, count: n, gain: totalGain,
        rolls, totalAfter: bonus, via: isReroll ? 'reroll' : 'roll',
      };
      return {
        ...prev,
        eduBonus: bonus,
        eduGrowth: {
          ...prevGrowth,
          settled: true, manual: false, count: n, gain: totalGain, rolls,
          at: attempt.at, by: eduActor,
          granted: isReroll ? Math.max(0, (prevGrowth.granted || 0) - 1) : 0,
          attempts: [...(prevGrowth.attempts || []), attempt].slice(-20),
        },
      };
    });
    setDirty(true);
    showToast(totalGain > 0 ? `教育增强完成，共 +${totalGain}（流水已保存，KP 可见）` : '教育增强检定完成，本次没有提升（已记为已结算）');
  };

  /** 手动录入教育增强总值（面团补录）：确认后一次性写入数值与流水（同样受锁定约束） */
  const setEduBonusManual = (v) => {
    if (eduLocked) return showToast('已结算，手动修改需要 KP 先授权重掷或重置', 'error');
    const gain = v === '' ? 0 : Math.max(0, Math.min(999, Math.trunc(Number(v)) || 0));
    setSheet((prev) => {
      const prevGrowth = derived.eduGrowth;
      const isReroll = prevGrowth.settled === true;
      const attempt = {
        at: Date.now(), by: eduActor, manual: true, count: 0, gain,
        rolls: [], totalAfter: gain, via: isReroll ? 'manual' : 'manual',
      };
      return {
        ...prev,
        eduBonus: gain,
        eduGrowth: {
          ...prevGrowth,
          settled: true, manual: true, count: 0, gain, rolls: [],
          at: attempt.at, by: eduActor,
          granted: isReroll ? Math.max(0, (prevGrowth.granted || 0) - 1) : 0,
          attempts: [...(prevGrowth.attempts || []), attempt].slice(-20),
        },
      };
    });
    setDirty(true);
  };

  /** 玩家点「确认结算」才落库：写一次 eduBonus、记一条流水 */
  const commitEduManual = () => {
    setEduBonusManual(eduDraft);
  };

  /** 清零教育补正（KP 用；玩家在锁定状态下被服务端拦住） */
  const clearEduBonus = () => {
    showConfirm?.('确定清零教育增强吗？提升数值与结算流水都会被清空（提示会重新出现）。', () => {
      setSheet((prev) => ({ ...prev, eduBonus: 0, eduGrowth: resetEduGrowth(eduActor) }));
      setDirty(true);
      showToast('教育增强已清零（重置痕迹已保留）');
    });
  };

  /** KP：授权一次重掷 */
  const grantEduRerollOnce = () => {
    setSheet((prev) => ({ ...prev, eduGrowth: grantEduReroll(derived.eduGrowth, eduActor) }));
    setDirty(true);
    showToast('已授权一次教育增强重掷，玩家下次结算时会用掉');
  };

  // ---------------------------------------------------------- KP 专属：传奇 / 年龄豁免
  const setLegendaryEnabled = (on) => {
    const actor = currentUser?.username || (guest ? '访客' : '');
    setSheet((prev) => ({
      ...prev,
      legendary: {
        ...blankLegendary(),
        ...(prev.legendary || {}),
        enabled: Boolean(on),
        by: on ? actor : '',
        at: on ? Date.now() : 0,
      },
    }));
    setDirty(true);
    showToast(on ? '已开启传奇标记（允许突破属性 99）' : '已关闭传奇标记');
  };

  const setLegendaryBonus = (key, value) => {
    const n = value === '' ? 0 : Math.max(0, Math.min(999, Math.trunc(Number(value)) || 0));
    setSheet((prev) => ({
      ...prev,
      legendaryBonus: { ...blankLegendaryBonus(), ...(prev.legendaryBonus || {}), [key]: n },
    }));
    setDirty(true);
  };

  const setOccupation = (id) => {
    setSheet((prev) => {
      const next = occupations.find((o) => String(o.id) === String(id)) || null;
      // 官方只给了一个专攻方向时（如 牧师 → 外语（拉丁语））顺手替玩家选好，避免漏填；
      // 每个技能组只填一个空槽位，玩家已经选过方向的就不动。
      const singles = occupationBranchHints(next).filter((h) => h.options.length === 1);
      let skills = prev.skills;
      if (singles.length) {
        const hasCustom = new Set(prev.skills.filter((s) => s.custom).map((s) => s.key));
        const filled = new Set();
        skills = prev.skills.map((s) => {
          const hit = singles.find((h) => h.key === s.key);
          if (!hit || hasCustom.has(s.key) || filled.has(s.key)) return s;
          if (s.custom || s.occ || s.interest || s.growth) return s;
          filled.add(s.key);
          return { ...s, custom: hit.options[0] };
        });
      }
      return {
        ...prev,
        occupationId: String(id || ''),
        occPicks: { free: [], social: [], choices: [] },
        skills,
      };
    });
    setDirty(true);
  };

  const togglePick = (group, key) => {
    setSheet((prev) => {
      const picks = { ...prev.occPicks, [group]: [...(prev.occPicks?.[group] || [])] };
      const limit = group === 'social' ? (occ?.social || 0) : (occ?.free || 0);
      const idx = picks[group].indexOf(key);
      if (idx >= 0) picks[group].splice(idx, 1);
      else if (picks[group].length < limit) picks[group].push(key);
      else return prev;
      return { ...prev, occPicks: picks };
    });
    setDirty(true);
  };

  const setChoice = (index, key) => {
    setSheet((prev) => {
      const choices = [...(prev.occPicks?.choices || [])];
      while (choices.length <= index) choices.push('');
      choices[index] = choices[index] === key ? '' : key;
      return { ...prev, occPicks: { ...prev.occPicks, choices } };
    });
    setDirty(true);
  };

  // ---------------------------------------------------------- 保存
  const buildPayload = () => ({ ...sheet });

  const requireBasics = () => {
    if (!sheet.name.trim()) { setTab('base'); showToast('请先填写角色名', 'error'); return false; }
    if (!sheet.occupationId) { setTab('base'); setOccOpen(true); showToast('请从职业列表中选择一个职业', 'error'); return false; }
    return true;
  };

  const saveToServer = async () => {
    if (!requireBasics()) return null;
    const isNew = !character?.id;
    const payload = buildPayload();
    if (isNew && currentUser?.role === 'admin' && ownerId && ownerId !== currentUser.id) {
      payload.ownerId = ownerId; // KP 代玩家建卡
    }
    const saved = isNew
      ? await apiPost('/api/characters', payload)
      : await apiPut(`/api/characters/${character.id}`, payload);
    setDirty(false);
    return saved;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (guest) {
        if (!sheet.name.trim()) { setTab('base'); showToast('请先填写角色名', 'error'); return; }
        if (!sheet.occupationId) { setTab('base'); setOccOpen(true); showToast('请从职业列表中选择一个职业', 'error'); return; }
        onGuestSave?.(buildPayload(), character?.id || characterId || null);
        setDirty(false);
      } else {
        const saved = await saveToServer();
        if (saved) { showToast(character?.id ? '角色卡已保存' : '角色卡已创建'); onSaved?.(saved); }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  };

  /** 访客草稿 → 收录到自己的档案馆 */
  const handlePublish = async () => {
    setSaving(true);
    try {
      const saved = await saveToServer();
      if (saved) { showToast('已收录到你的档案馆'); onSaved?.(saved); }
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  };

  const tryClose = () => {
    if (!dirty) return onCancel?.();
    showConfirm('有未保存的修改，确定要离开吗？', () => onCancel?.());
  };

  // ---------------------------------------------------------- 技能筛选
  const visibleSkills = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    return derived.skills.filter((s) => {
      if (s.kind === 'custom') return !q || s.name.toLowerCase().includes(q);
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (skillFilter === 'used') return s.used || s.occ > 0 || s.interest > 0 || s.growth > 0 || s.houseBase;
      if (skillFilter === 'occ') return s.isOccupation;
      if (skillFilter === 'spec') return Boolean(s.spec);
      return true;
    });
  }, [derived.skills, skillFilter, skillQuery]);

  const specGroups = occ
    ? [
      ...(occ.social ? [{ type: 'social', label: `任选 ${occ.social} 项社交技能`, pool: SOCIAL_SKILLS, picked: sheet.occPicks?.social || [], limit: occ.social }] : []),
      ...(occ.free ? [{ type: 'free', label: `任选 ${occ.free} 项其他特长`, pool: null, picked: sheet.occPicks?.free || [], limit: occ.free }] : []),
    ]
    : [];

  /** 官方指定的专攻方向（如 牧师 → 外语（拉丁语）），按技能键索引 */
  const branchHints = useMemo(() => {
    const map = new Map();
    for (const h of occupationBranchHints(occ)) map.set(h.key, h);
    return map;
  }, [occ]);

  const skillCols = useMemo(() => {
    // 同一个技能的多行（例如两条「格斗」/两条「射击」专攻槽）必须留在同一栏；
    // 再按顺序在组边界处尽量均分左右，避免同名分类被拆到两栏。
    const groups = [];
    for (const s of visibleSkills) {
      const k = s.kind === 'custom' ? `custom:${s.id}` : (s.key || s.id);
      const last = groups[groups.length - 1];
      if (last && last.key === k) last.items.push(s);
      else groups.push({ key: k, items: [s] });
    }
    const total = visibleSkills.length;
    let cum = 0; let best = 0; let bestDiff = Infinity;
    for (let i = 0; i < groups.length; i += 1) {
      cum += groups[i].items.length;
      const diff = Math.abs(cum - total / 2);
      if (diff < bestDiff) { bestDiff = diff; best = i + 1; }
    }
    return [
      groups.slice(0, best).flatMap((g) => g.items),
      groups.slice(best).flatMap((g) => g.items),
    ];
  }, [visibleSkills]);

  const renderSkillRow = (s) => {
                  const isCredit = s.special === 'credit';
                  const isMythos = s.special === 'cthulhu';
                  const creditBad = isCredit && occ && !derived.creditInRange;
                  return (
                    <tr
                      key={s.id}
                      className={cx(
                        'hover:bg-paper-deep/50',
                        s.isOccupation && 'bg-forest/[0.04]',
                        isCredit && (creditBad ? 'bg-vermilion/[0.06]' : 'bg-amber-500/[0.06]'),
                        isMythos && 'bg-moon/[0.06]',
                      )}
                    >
                      <td className="px-1.5 py-1.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {s.kind === 'custom'
                            ? <span className="shrink-0 font-bold text-moon" title="自定义技能">✎</span>
                            : (s.isOccupation
                              ? (s.pickedOccupation
                                ? <span className="shrink-0 font-bold text-vermilion" title="自选本职（社交 / 任选）">❤</span>
                                : <span className="shrink-0 font-bold text-ochre" title="原本职技能">★</span>)
                              : <span className="shrink-0 text-ink-mute/60">·</span>)}
                          <span className={cx('truncate text-ink-soft', (isCredit || isMythos) && 'font-bold text-ink')}>
                            {SKILL_BY_KEY[s.key]?.name || s.name}
                          </span>
                          {s.spec ? (
                            <SpecPicker skillKey={s.key} value={s.custom} onChange={(v) => setSkillCustom(s.id, v)} />
                          ) : null}
                          {isNamedSkill(s.key) ? (
                            <input
                              value={s.custom}
                              onChange={(e) => setSkillCustom(s.id, e.target.value.slice(0, 24))}
                              maxLength={24}
                              placeholder={NAMED_SKILL_HINT[s.key]?.placeholder || '请填写'}
                              className={cx('w-[5.5rem] shrink-0 rounded-[2px] border bg-paper-raised px-1.5 py-0.5 text-[12.5px] text-ink',
                                s.custom ? 'border-line-strong' : 'border-amber-600/60')}
                            />
                          ) : null}
                        </div>
                        {(() => {
                          const hint = s.isOccupation && s.spec ? branchHints.get(s.key) : null;
                          const ok = hint ? Boolean(s.custom) && hint.options.includes(s.custom) : false;
                          const bits = [];
                          if (hint) bits.push(
                            <span key="hint"
                              className={cx('rounded-[2px] border px-1 py-[1px]',
                                ok ? 'border-forest/40 bg-forest/10 text-forest' : 'border-amber-600/45 bg-ochre/10 text-ochre')}
                              title="本职技能原文对该专攻方向的要求，请 KP 留意"
                            >
                              本职{hint.required ? '指定' : '建议'}：{hint.options.join('/')}{ok ? ' ✓' : ''}
                            </span>,
                          );
                          if (isCredit) bits.push(
                            <span key="credit"
                              className={cx('rounded-[2px] border px-1 py-[1px] font-mono',
                                occ ? (creditBad ? 'border-vermilion/50 bg-vermilion/10 text-vermilion' : 'border-amber-600/45 bg-ochre/10 text-ochre') : 'border-line-strong text-ink-soft')}
                            >
                              {occ ? `职业要求 ${occ.cr[0]}-${occ.cr[1]}%` : '选择职业后可校验区间'}
                            </span>,
                          );
                          if (isMythos) bits.push(
                            <span key="mythos" className="rounded-[2px] border border-amber-600/45 bg-amber-500/[0.08] px-1 py-[1px] text-ochre">
                              神话知识 · 不可用点数提升
                            </span>,
                          );
                          if (isNamedSkill(s.key) && !s.custom) bits.push(
                            <span key="named" className="text-ochre">未选择{NAMED_SKILL_HINT[s.key]?.label || '名称'}</span>,
                          );
                          return bits.length ? <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11.5px]">{bits}</div> : null;
                        })()}
                      </td>
                      <td className="px-1 py-1.5 text-center font-mono text-[14px] text-ink-mute">{s.base}</td>
                      <td className="px-1 py-1.5">
                        {isMythos
                          ? <div className="text-center text-ink-mute">—</div>
                          : <NumberInput blankZero value={s.occ} onChange={(v) => setSkill(s.id, 'occ', v)} className={cx('!px-1 !py-1.5 text-center text-[14.5px]', s.occ ? '!border-ochre/55 !bg-ochre/10 !text-ochre' : '!border-x-transparent !border-t-transparent !border-b-line-strong/50 !bg-transparent !text-ink-mute/45 !shadow-none')} />}
                      </td>
                      <td className="px-1 py-1.5">
                        {isMythos
                          ? <div className="text-center text-ink-mute">—</div>
                          : <NumberInput blankZero value={s.interest} onChange={(v) => setSkill(s.id, 'interest', v)} className={cx('!px-1 !py-1.5 text-center text-[14.5px]', s.interest ? '!border-forest/55 !bg-forest/10 !text-forest' : '!border-x-transparent !border-t-transparent !border-b-line-strong/50 !bg-transparent !text-ink-mute/45 !shadow-none')} />}
                      </td>
                      <td className="px-1 py-1.5"><NumberInput blankZero value={s.growth} onChange={(v) => setSkill(s.id, 'growth', v)} className={cx('!px-1 !py-1.5 text-center text-[14.5px]', s.growth ? '!border-moon/55 !bg-moon/10 !text-moon' : '!border-x-transparent !border-t-transparent !border-b-line-strong/50 !bg-transparent !text-ink-mute/45 !shadow-none')} /></td>
                      <td className="px-1 py-1.5 text-center font-mono text-[14px] font-bold text-forest">{s.total}%</td>
                      <td className="px-1 py-1.5 text-center font-mono text-[13.5px] text-ink-soft">{s.half}</td>
                      <td className="px-1 py-1.5 text-center font-mono text-[13.5px] text-ink-mute">{s.fifth}</td>
                    </tr>
                  );
  };

  if (loading) {
    return <Panel><div className="p-12 text-center text-ink-soft">正在载入角色卡…</div></Panel>;
  }

  const totalSkills = derived.skills.length;
  const usedCount = derived.skills.filter((s) => s.used).length;

  return (
    <div className="space-y-5">
      {/* 顶部操作条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" className="!px-2.5 !py-1.5 !text-[14px]" onClick={tryClose}>
            <ArrowLeft className="h-4 w-4" />返回
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-serif text-[25px] font-bold leading-[1.2] tracking-[0.01em] text-ink sm:text-[27px]">
                {sheet.name || '未命名调查员'}
              </span>
              {guest ? <Badge tone="amber" className="!text-[14px]">访客模式 · 仅存本机</Badge> : null}
              {dirty ? <Badge tone="amber" className="!text-[14px]">未保存</Badge> : <Badge tone="emerald" className="!text-[14px]">已同步</Badge>}
            </div>
            <div className="mt-1.5 text-[14px] text-ink-soft">
              {occ ? occ.name : '未选择职业'} · {sheet.age} 岁 · {STATUS_LABEL[sheet.status]}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button variant="ghost" className="!px-3 !py-1.5 !text-[14px]" onClick={() => onCancel?.()}>取消</Button>
          <Button className="!px-3.5 !py-1.5 !text-[14px]" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? '保存中…' : (guest ? '保存到本机' : '保存角色卡')}
          </Button>
        </div>
      </div>

      {guest && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-amber-600/50 bg-amber-500/[0.06] px-4 py-3.5">
          <div className="flex items-start gap-2 text-[14px] leading-[1.8] text-ink-soft">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              访客模式下可以完整车卡、打印与导出 PDF，数据只保存在<b>本机浏览器</b>，不会收录进档案馆。
              {currentUser ? '你已登录，可以直接收录。' : '登录后即可一键收录到自己的账号下。'}
            </span>
          </div>
          {currentUser ? (
            <Button onClick={handlePublish} disabled={saving}><CloudUpload className="w-4 h-4" />收录到档案馆</Button>
          ) : null}
        </div>
      )}

      {!occ ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-vermilion/45 bg-vermilion/[0.05] px-4 py-3.5">
          <div className="flex items-start gap-2 text-[14px] leading-[1.8] text-ink-soft">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>还没有选择职业。必须先选定职业，系统才能标记本职技能并算出职业技能点。</span>
          </div>
          <Button onClick={() => setOccOpen(true)}><Search className="w-4 h-4" />选择职业</Button>
        </div>
      ) : null}

      {/* 派生值总览 */}
      <Panel className="space-y-4 p-5 sm:p-6">
        <DerivedGrid derived={derived} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressBar used={derived.spent.occupation} total={derived.budget.occupation} label="职业技能点" />
          <ProgressBar used={derived.spent.interest} total={derived.budget.interest} label="兴趣技能点" hint="（智力×2）" />
        </div>
        {warnings.length > 0 && <WarningList items={warnings} />}
      </Panel>

      {/* 分页 */}
      <div className="border-b border-line">
        <Tabs items={TABS.map((t) => ({ value: t.key, label: t.label, icon: t.icon }))} value={tab} onChange={setTab} className="border-b-0 [&_[data-tab]]:text-[14px]" />
        <p className="pb-2 text-[14px] leading-relaxed text-ink-mute sm:hidden">← 左右滑动切换栏目 →</p>
      </div>

      {/* ---------------------------------------------------- 属性与职业 */}
      {tab === 'base' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid lg:grid-cols-3 gap-5">
            <Panel className="space-y-5 p-5 sm:p-6 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Field className={FIELD} label="角色名" required>
                  <Input value={sheet.name} maxLength={40} onChange={(e) => patch({ name: e.target.value })} placeholder="例：约翰·H·沃特雷" />
                </Field>
                <Field className={FIELD} label="玩家名"><Input value={sheet.playerName} maxLength={40} onChange={(e) => patch({ playerName: e.target.value })} /></Field>
                <Field className={FIELD} label="年龄"
                  hint={sheet.agePenaltyWaived ? 'KP 已豁免年龄减益：可填任意非负整数' : '15-120 之间；影响属性补正与教育增强'}>
                  <NumberInput min={sheet.agePenaltyWaived ? 0 : 15} max={sheet.agePenaltyWaived ? 999 : 120} value={sheet.age} onChange={setAge} />
                </Field>
                <Field className={FIELD} label="性别"><Input value={sheet.gender} maxLength={20} onChange={(e) => patch({ gender: e.target.value })} /></Field>
                <Field className={FIELD} label="住地"><Input value={sheet.residence} maxLength={40} onChange={(e) => patch({ residence: e.target.value })} /></Field>
                <Field className={FIELD} label="故乡 / 出身"><Input value={sheet.birthplace} maxLength={40} onChange={(e) => patch({ birthplace: e.target.value })} /></Field>
                <Field className={FIELD} label="时代">
                  <Select value={sheet.era} onChange={(e) => patch({ era: e.target.value })}>
                    {ERAS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field className={FIELD} label="状态">
                  <Select value={sheet.status} onChange={(e) => patch({ status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </Select>
                </Field>
              </div>

              {currentUser?.role === 'admin' && currentUser?.kpRank === 'chief' && !character?.id && !guest && (
                <Field className={FIELD} label="归属玩家" hint="仅首席守秘人可代玩家建卡">
                  <Select value={ownerId} onChange={(e) => { setOwnerId(e.target.value); setDirty(true); }}>
                    {owners.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </Select>
                </Field>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="ghost" onClick={doRollAll}><Dices className="w-4 h-4" />一键掷骰生成属性</Button>
                <Button variant="ghost" onClick={doRollLuck}>重掷幸运</Button>
                <Button
                  variant="ghost"
                  onClick={() => showConfirm('清空所有属性与技能投入？', () => patch({ chars: blankSheet().chars, skills: blankSkills(), customSkills: [] }))}
                >
                  <Trash2 className="w-4 h-4" />清空
                </Button>
              </div>
              <div className="space-y-2 rounded-[2px] border border-line-strong bg-paper-deep/40 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[14px] font-semibold tracking-[0.06em] text-ink-soft">
                    从骰娘导入属性 <span className="ml-1 font-mono text-[13px] tracking-[0.14em] text-ink-mute">PASTE FROM DICE BOT</span>
                  </p>
                  <span className="text-[13px] text-ink-mute">一次可粘多组，自动拆分</span>
                </div>
                <Textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (importBlocks.length) setImportBlocks([]);
                  }}
                  placeholder={'力量:55 敏捷:60 意志:70\n体质:50 外貌:55 教育:60\n体型:65 智力:85 幸运:50'}
                  className="font-mono text-[14px] leading-[1.7]"
                  aria-label="粘贴骰娘生成的属性"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={doImportAttributes}><Download className="w-4 h-4" />导入属性</Button>
                  {importText ? (
                    <Button variant="ghost" onClick={() => { setImportText(''); setImportBlocks([]); }}>
                      <X className="w-4 h-4" />清空输入
                    </Button>
                  ) : null}
                  {importBlocks.length > 1 ? (
                    <span className="text-[13px] text-ochre">识别到 {importBlocks.length} 组，点一张卡片填入</span>
                  ) : null}
                </div>
                {importBlocks.length > 1 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {importBlocks.map((b, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyImportBlock(b)}
                        className="group rounded-[2px] border border-line-strong bg-paper/70 p-2.5 text-left transition-colors hover:border-ochre hover:bg-ochre/10"
                      >
                        <span className="mb-1.5 block font-mono text-[12.5px] tracking-[0.14em] text-ink-mute group-hover:text-ochre">
                          候选 {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="grid grid-cols-3 gap-x-3 gap-y-0.5 font-mono text-[13px] leading-[1.7] text-ink-soft">
                          {ATTR_ORDER.filter((k) => (k === 'Luck' ? b.luck !== null : Number.isFinite(b.chars[k]))).map((k) => (
                            <span key={k}>
                              {ATTR_LABEL[k]} <b className="text-ink">{k === 'Luck' ? b.luck : b.chars[k]}</b>
                            </span>
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel className="space-y-4 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><UserIcon className="h-4 w-4 text-ochre" />职业</h3>
              <div className="rounded-[2px] border border-line-strong bg-paper-deep/50 p-4">
                <div className="flex flex-wrap items-center gap-2 font-serif text-[14px] font-bold tracking-[0.02em] text-ink">
                  {occ ? occ.name : '未选择'}
                  {occ?.isCustom ? <Badge tone="cyan">KP 模板</Badge> : null}
                </div>
                {occ ? (
                  <>
                    <div className="mt-1.5 text-[14px] leading-[1.7] text-ink-soft">
                      信用评级 <b className="text-ochre">{occ.cr[0]}-{occ.cr[1]}</b> · 技能点 {occ.attr}
                    </div>
                    {occ.desc ? <p className="mt-2 text-[16px] leading-[1.75] text-ink-soft">{occ.desc}</p> : null}
                    {occ.note ? <p className="mt-1.5 text-[14px] leading-[1.7] text-ochre">官方备注：{occ.note}</p> : null}
                    {occ.skillText ? (
                      <p className="mt-2.5 border-t border-line pt-2.5 text-[16px] leading-[1.75] text-ink-soft">
                        <span className="text-ink-soft">本职技能原文：</span>{occ.skillText}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1.5 text-[16px] leading-[1.7] text-ink-soft">选择职业后会自动标记本职技能并算出职业技能点。</p>
                )}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setOccOpen(true)}>
                <Search className="w-4 h-4" />{occ ? '更换职业' : '选择职业'}
              </Button>

              {occ && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-[14px] font-semibold tracking-[0.04em] text-ink-soft">固定本职技能</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(occ.keys)].map((k) => (
                        <Badge key={k} tone="emerald" className="!text-[14px] !tracking-[0.02em]">★ {SKILL_BY_KEY[k]?.name || k}</Badge>
                      ))}
                      <Badge tone="amber" className="!text-[14px] !tracking-[0.02em]">★ 信用评级</Badge>
                    </div>
                  </div>

                  {branchHints.size > 0 && (
                    <div>
                      <p className="mb-2 text-[14px] font-semibold tracking-[0.04em] text-ink-soft">官方指定 / 建议的专攻方向</p>
                      <div className="space-y-1">
                        {[...branchHints.values()].map((h) => (
                          <div key={h.key} className="text-[14px] leading-[1.7] text-ink-soft">
                            {h.name}：{h.options.join(' / ')}
                            <span className="ml-1 text-ink-mute">{h.required ? '（指定）' : '（从中选择）'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(occ.choices || []).map((group, i) => (
                    <div key={i}>
                      <p className="mb-2 text-[14px] font-semibold tracking-[0.04em] text-ink-soft">任选其一（第 {i + 1} 组）</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.map((k) => {
                          const on = (sheet.occPicks?.choices || [])[i] === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setChoice(i, k)}
                              className={cx('rounded-[2px] border px-2.5 py-1.5 text-[14px] font-semibold transition',
                                on ? 'border-forest bg-forest text-paper-raised' : 'border-line-strong bg-paper-raised text-ink-soft hover:border-forest/50')}
                            >
                              {SKILL_BY_KEY[k]?.name || k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {specGroups.map((g) => (
                    <SpecialtyPicker key={g.type} group={g} onToggle={togglePick} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><Info className="h-4 w-4 text-ochre" />属性明细与年龄补正</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-baseline gap-2 rounded-[2px] border border-ochre/45 bg-ochre/[0.07] px-3 py-1.5 tabular text-ink">
                  <span className="text-[12.5px] tracking-[0.08em] text-ink-mute">属性总和</span>
                  <b className="font-mono text-[17px] font-bold">{attrSum}</b>
                  <span className="font-mono text-[13px] text-ink-mute">/</span>
                  <b className="font-mono text-[17px] font-bold text-ochre">{attrWithLuck}</b>
                  <span className="text-[12px] text-ink-mute">不含运 / 含运</span>
                </span>
                <span className="text-[14px] text-ink-mute">{derived.ageAdjust.label}</span>
              </div>
            </div>
            {currentUser?.role === 'admin' ? (
              <div className="mb-4 space-y-3 rounded-[2px] border border-amber-600/40 bg-amber-500/[0.06] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[14px] leading-[1.75] text-ink-soft">
                    <Crown className="w-4 h-4" />
                    <b>KP 专属设置</b>
                    <span className="text-[14px] text-ink-mute">（玩家无法自行修改，保存时会由服务端强制保留）</span>
                  </div>
                  {derived.legendary.by ? (
                    <span className="text-[14px] text-ink-mute">
                      传奇标记由 {derived.legendary.by} 于
                      {derived.legendary.at ? new Date(derived.legendary.at).toLocaleString('zh-CN') : '未知时间'} 开启
                    </span>
                  ) : null}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Toggle
                    checked={Boolean(sheet.legendary?.enabled)}
                    onChange={setLegendaryEnabled}
                    label="传奇标记：允许突破属性 99 上限"
                    hint="开启后每个属性多出一栏「传奇 +」，额外调整值单独累加，不与掷骰属性混用"
                  />
                  <Toggle
                    checked={Boolean(sheet.agePenaltyWaived)}
                    onChange={(v) => patch({ agePenaltyWaived: v })}
                    label="豁免年龄减益（只享受教育成长）"
                    hint="属性不再因年龄下降、移动力不减；教育增强检定与成长照常保留"
                  />
                </div>
                {sheet.legendary?.enabled ? (
                  <Field className={FIELD} label="传奇备注（选填）" hint="例如：完成《××》战役，KP 奖励突破上限">
                    <Input
                      value={sheet.legendary?.note || ''}
                      maxLength={200}
                      onChange={(e) => patch({ legendary: { ...(sheet.legendary || blankLegendary()), note: e.target.value } })}
                    />
                  </Field>
                ) : null}
              </div>
            ) : derived.legendary.enabled ? (
              <div className="mb-4 flex items-center gap-2 rounded-[2px] border border-amber-600/40 bg-amber-500/[0.06] p-3.5 text-[14px] leading-[1.75] text-ink-soft">
                <Crown className="w-4 h-4" />
                KP 已为这张卡开启<b>传奇标记</b>：允许突破属性 99 上限，额外调整值单独成栏。
                {derived.legendary.note ? <span className="text-ochre/80">（{derived.legendary.note}）</span> : null}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_CHARS.map((k) => (
                <div key={k} className="rounded-[2px] border border-line-strong bg-paper-deep/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-bold text-ink">
                      {CHAR_LABEL[k]} <span className="font-mono text-[14px] text-ink-mute">{k}</span>
                    </span>
                    <span className="font-mono text-[14px] text-ink-mute">半 {derived.half[k]} / 五 {derived.fifth[k]}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="mb-1 font-mono text-[14px] font-semibold tracking-[0.06em] text-ink-mute">掷骰值</div>
                      <NumberInput value={sheet.chars[k]} onChange={(v) => setChar(k, v)} className="!py-2" />
                    </div>
                    <div className="w-16">
                      <div className="mb-1 font-mono text-[14px] font-semibold tracking-[0.06em] text-moon">成长 +</div>
                      <NumberInput
                        min={0}
                        max={99}
                        value={sheet.charGrowth?.[k] || 0}
                        onChange={(v) => setCharGrowth(k, v)}
                        className="!py-2 !border-moon/50"
                      />
                    </div>
                    {derived.legendary.enabled ? (
                      <div className="w-20">
                        <div className="mb-1 font-mono text-[14px] font-semibold tracking-[0.06em] text-ochre">传奇 +</div>
                        <NumberInput
                          min={0}
                          max={999}
                          value={sheet.legendaryBonus?.[k] || 0}
                          onChange={(v) => setLegendaryBonus(k, v)}
                          className="!py-2 !border-amber-700/60"
                        />
                      </div>
                    ) : null}
                    <div className="text-right shrink-0 w-16">
                      <div className="font-mono text-[14px] font-semibold tracking-[0.06em] text-ink-mute">有效值</div>
                      <div className={cx('font-mono text-[17px] font-bold', derived.eff[k] !== derived.raw[k] ? 'text-ochre' : 'text-forest')}>
                        {derived.eff[k]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-moon/40 bg-moon/[0.05] px-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-2 text-[15px] font-bold text-ink">
                  理智 SAN
                  <span className="font-mono text-[15px]">
                    起始 <b className="text-forest">{derived.san}</b>
                    <span className="mx-1 text-ink-mute">/</span>
                    上限 <b className="text-ochre">{derived.sanMax}</b>
                  </span>
                </p>
                <p className="mt-1 text-[13.5px] leading-[1.65] text-ink-soft">
                  起始 = min(意志 + 成长, 99 − 神话知识)，最低 0；上限随克苏鲁神话增长而下降（当前神话 {derived.mythos}）。成长可正可负——剧本削减 SAN 时填负数。
                </p>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-moon">成长 ±</span>
                <NumberInput
                  min={-99}
                  max={99}
                  value={sheet.sanGrowth || 0}
                  onChange={(v) => { patch({ sanGrowth: v === '' ? 0 : Math.max(-99, Math.min(99, Math.trunc(Number(v)) || 0)) }); }}
                  className="!w-20 !py-2 !border-moon/50"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Toggle
                checked={sheet.applyAgeAdjust}
                onChange={(v) => patch({ applyAgeAdjust: v })}
                label="自动套用年龄补正"
                hint="外貌为固定减值；力量/体型/体质/敏捷为合计减 N 点，由玩家自行分配"
              />
              <Field className={FIELD} label="护甲减值（可选）" hint="穿戴重型护甲时移动力下降">
                <NumberInput min={0} max={10} value={sheet.armorPenalty} onChange={(v) => patch({ armorPenalty: v === '' ? 0 : v })} />
              </Field>
            </div>

            {/* 年龄补正分配：除外貌外都是「合计 −N，自行分配」*/}
            {sheet.applyAgeAdjust && derived.ageAdjust.poolPoints > 0 && (
              <div className={cx('mt-4 p-4 rounded-[3px] border',
                derived.ageAdjust.allocComplete ? 'border-line-strong bg-paper-deep' : 'border-amber-600/45 bg-amber-500/[0.06]')}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="text-[14px] leading-[1.8] text-ink">
                    <b className="text-ochre">年龄补正分配</b>
                    <span className="ml-2 text-ink-soft">
                      {derived.ageAdjust.poolKeys.map((k) => CHAR_LABEL[k]).join(' / ')} 合计需减少
                      <b className="text-ochre font-mono mx-1">{derived.ageAdjust.poolPoints}</b>点
                      {derived.ageAdjust.app !== 0 ? `（外貌固定 ${derived.ageAdjust.app}）` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cx('font-mono text-[14px] font-bold',
                      derived.ageAdjust.allocComplete ? 'text-forest' : 'text-ochre')}>
                      已分配 {derived.ageAdjust.allocSum} / {derived.ageAdjust.poolPoints}
                    </span>
                    <Button variant="subtle" onClick={() => resetAgeAlloc('even')}>平均分配</Button>
                    <Button variant="subtle" onClick={() => resetAgeAlloc('clear')}>清零</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {derived.ageAdjust.poolKeys.map((k) => (
                    <label key={k} className="flex items-center gap-2 rounded-[2px] border border-line-strong bg-paper-raised px-3 py-2">
                      <span className="text-[14px] font-bold text-ink-soft">{CHAR_LABEL[k]}</span>
                      <span className="text-[14px] text-ink-mute">−</span>
                      <NumberInput
                        min={0}
                        max={derived.ageAdjust.poolPoints}
                        value={derived.ageAdjust.alloc[k] || 0}
                        onChange={(v) => setAgeAlloc(k, v)}
                        className="!py-1.5 !w-16 text-[14px]"
                      />
                    </label>
                  ))}
                </div>
                {!derived.ageAdjust.allocComplete && (
                  <p className="mt-2 text-[14px] leading-[1.7] text-ochre">
                    {derived.ageAdjust.poolPoints - derived.ageAdjust.allocSum > 0
                      ? `还有 ${derived.ageAdjust.poolPoints - derived.ageAdjust.allocSum} 点没有分配；`
                      : `已经多分配了 ${derived.ageAdjust.allocSum - derived.ageAdjust.poolPoints} 点；`}
                    规则要求把合计减值正好分完（KP 允许时可不计较）。
                  </p>
                )}
              </div>
            )}

            {derived.ageAdjust.luckRolls > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-amber-600/40 bg-amber-500/[0.06] p-4">
                <div className="text-[14px] leading-[1.8] text-ink-soft">
                  15-19 岁：幸运可以掷两次取较高值（当前幸运 <b className="font-mono text-ink">{sheet.chars.Luck || 0}</b>）。
                </div>
                <Button variant="ghost" onClick={doRollLuck}><Dices className="w-4 h-4" />幸运掷两次取高</Button>
              </div>
            )}

            {sheet.applyAgeAdjust && (
              <div className="mt-4 space-y-3 rounded-[2px] border border-moon/35 bg-moon/[0.05] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[14px] leading-[1.8] text-ink-soft">
                    教育增强（年龄成长）
                    {derived.ageAdjust.eduChecks > 0 ? (
                      <>
                        ：该年龄需要进行 <b className="text-moon">{derived.ageAdjust.eduChecks}</b> 次检定
                        （D100 &gt; 当前教育则教育 +1D10）
                      </>
                    ) : <span className="text-ink-soft">：该年龄不需要检定，也可手动录入（面团补录）</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {derived.eduGrowth.settled
                      ? <Badge tone="emerald" className="!text-[14px]">已结算</Badge>
                      : <Badge tone="amber" className="!text-[14px]">未结算</Badge>}
                    {eduLocked ? <Badge tone="slate" className="!text-[14px]">已锁定</Badge> : null}
                    {eduGranted > 0 ? <Badge tone="cyan" className="!text-[14px]">KP 已授权 {eduGranted} 次重掷</Badge> : null}
                    {derived.eduGrowth.rerolls > 0 ? <Badge tone="amber" className="!text-[14px]">已重掷 {derived.eduGrowth.rerolls} 次</Badge> : null}
                    {derived.ageAdjust.eduChecks > 0 && (
                      <Button variant="ghost" onClick={doEduChecks} disabled={eduLocked}>
                        <Dices className="w-4 h-4" />{derived.eduGrowth.settled ? '重掷并结算' : '自动检定并结算'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <Field label={eduLocked ? '提升总值（已锁定）' : '提升总值（填好后确认）'} className={cx('!w-52', FIELD)}>
                    <NumberInput
                      min={0}
                      max={999}
                      value={eduDraft === '' ? '' : Number(eduDraft) || 0}
                      onChange={(v) => setEduDraft(v === '' ? '' : String(v))}
                      disabled={eduLocked}
                    />
                  </Field>
                  {!eduLocked ? (
                    <Button
                      variant="subtle"
                      onClick={commitEduManual}
                      disabled={!eduDraftDirty}
                      title={eduDraftDirty ? '确认后才会写入提升值并记一条流水' : '数值未变化'}
                    >
                      <Check className="w-4 h-4" />确认结算
                    </Button>
                  ) : null}
                  {isKp ? (
                    <>
                      <Button variant="subtle" onClick={grantEduRerollOnce}>授权重掷一次</Button>
                      <Button variant="subtle" onClick={clearEduBonus}>重置教育增强</Button>
                    </>
                  ) : (
                    <Button variant="subtle" onClick={clearEduBonus} disabled={eduLocked}>清零教育补正</Button>
                  )}
                  <span className="pb-2 text-[14px] text-ink-mute">
                    有效教育 = 掷骰教育 + 提升总值；填完点「确认结算」，只记一条流水
                  </span>
                </div>

                {eduLocked ? (
                  <p className="text-[14px] leading-[1.7] text-ochre">
                    教育增强已结算并锁定：玩家不能自助重掷或清零（服务端同样会拦）。需要重掷请在
                    「角色卡管理 / 审卡中心」或本页点「授权重掷一次」，或直接「重置教育增强」。
                  </p>
                ) : eduGranted > 0 ? (
                  <p className="text-[14px] leading-[1.7] text-moon">
                    KP 已授权 {eduGranted} 次重掷：玩家点「重掷并结算」时会自动用掉一次，并记入流水。
                  </p>
                ) : null}

                {derived.eduGrowth.attempts?.length ? (
                  <div className="space-y-1.5 rounded-[2px] border border-line-strong bg-paper-deep/40 p-3 text-[14px] leading-[1.7] text-ink-soft">
                    <div className="text-[14px] font-bold text-ink">
                      结算流水（共 {derived.eduGrowth.attempts.length} 次
                      {derived.eduGrowth.rerolls > 0 ? `，其中重掷 ${derived.eduGrowth.rerolls} 次` : ''}）
                    </div>
                    {derived.eduGrowth.attempts.map((a, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-ink-mute">#{i + 1}</span>
                        <span className={cx('rounded-[2px] border px-1.5 py-0.5 text-[14px]',
                          a.via === 'manual' ? 'border-moon/50 text-moon'
                            : a.via === 'reroll' ? 'border-amber-600/45 text-ochre'
                              : 'border-line-strong text-ink-soft')}
                        >
                          {a.via === 'manual' ? '手动录入' : a.via === 'reroll' ? '授权重掷' : '自动检定'}
                        </span>
                        <span>{a.manual ? '' : `检定 ${a.count} 次`}</span>
                        <span>提升 <b className="text-moon font-mono">+{a.gain}</b></span>
                        <span className="text-ink-mute">累计 {a.totalAfter}</span>
                        {a.by ? <span className="text-ink-mute">by {a.by}</span> : null}
                        {a.at ? <span className="text-ink-mute">{new Date(a.at).toLocaleString('zh-CN')}</span> : null}
                        {a.rolls?.length ? (
                          <span className="font-mono text-ink-mute">
                            {a.rolls.map((r) => `D100=${r.roll}→+${r.gain}`).join('、')}
                          </span>
                        ) : null}
                      </div>
                    ))}
                    {derived.eduGrowth.lastGrant?.by ? (
                      <div className="text-ink-mute">
                        最近授权：{derived.eduGrowth.lastGrant.by}
                        {derived.eduGrowth.lastGrant.at ? ` · ${new Date(derived.eduGrowth.lastGrant.at).toLocaleString('zh-CN')}` : ''}
                      </div>
                    ) : null}
                    {derived.eduGrowth.lastReset?.by ? (
                      <div className="text-ink-mute">
                        最近重置：{derived.eduGrowth.lastReset.by}
                        {derived.eduGrowth.lastReset.at ? ` · ${new Date(derived.eduGrowth.lastReset.at).toLocaleString('zh-CN')}` : ''}
                      </div>
                    ) : null}
                    <div className="text-ink-mute">流水随角色卡保存，KP 在管理列表、审卡中心与详情页都能看到。</div>
                  </div>
                ) : (
                  <p className="text-[16px] leading-[1.7] text-ink-soft">
                    还没有结算过。KP 会在审卡时看到「教育增强未结算」；掷过骰或用面团补录后，提示会自动消失。
                  </p>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ---------------------------------------------------- 技能 */}
      {tab === 'skills' && (
        <Panel className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
              <Wand2 className="h-4 w-4 text-ochre" />技能分配
              <span className="ml-2 text-[14px] font-normal text-ink-mute">已投点 {usedCount} / {totalSkills} 项</span>
            </h3>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="!py-2 !w-auto text-[16px]">
                <option value="all">显示全部技能</option>
                <option value="used">仅显示已投点</option>
                <option value="occ">仅显示本职技能</option>
                <option value="spec">仅显示专攻技能</option>
              </Select>
              <Input value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} placeholder="搜索技能…" className="!py-2 !w-40 text-[16px]" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ProgressBar used={derived.spent.occupation} total={derived.budget.occupation} label="职业技能点" />
            <ProgressBar used={derived.spent.interest} total={derived.budget.interest} label="兴趣技能点" hint="（智力×2）" />
          </div>

          {occ && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] leading-[1.7] text-ink-soft">
              <span>
                当前职业信用评级要求：
                <b className={cx('font-mono ml-1', derived.creditInRange ? 'text-forest' : 'text-vermilion')}>
                  {occ.cr[0]}-{occ.cr[1]}%
                </b>
                <span className="ml-1 text-ink-mute">（当前 {derived.creditRating}%）</span>
              </span>
              <span className="text-ink-mute">★ = 原本职 · <span className="text-vermilion">❤</span> = 自选本职（社交 / 任选）· 可用职业点提升</span>
            </div>
          )}

          <p className="text-[14px] leading-relaxed text-ink-mute sm:hidden">← 左右滑动表格查看「职业点 / 兴趣点 / 成长」→</p>
          {visibleSkills.length === 0 ? (
            <p className="rounded-[2px] border border-line-strong p-8 text-center text-[14.5px] text-ink-mute">没有符合条件的技能</p>
          ) : (
            <>
              <div className="hidden xl:grid grid-cols-2 gap-3">
                {[0, 1].map((col) => (
                  <div key={col} className="overflow-x-auto rounded-[2px] border border-line-strong">
                    <table className="w-full table-fixed text-[13.5px] leading-[1.5]">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[8%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[9%]" />
                        <col className="w-[9%]" />
                      </colgroup>
              <thead className="bg-paper-deep/70 text-[12.5px] text-ink-mute">
                <tr>
                  <th className="px-2 py-1.5 text-left">技能</th>
                  <th className="px-0.5 py-1.5 text-center">基础</th>
                  <th className="px-0.5 py-1.5 text-center">职业</th>
                  <th className="px-0.5 py-1.5 text-center">兴趣</th>
                  <th className="px-0.5 py-1.5 text-center">成长</th>
                  <th className="px-0.5 py-1.5 text-center">合计</th>
                  <th className="px-0.5 py-1.5 text-center">半值</th>
                  <th className="px-0.5 py-1.5 text-center">五值</th>
                </tr>
              </thead>
                      <tbody className="divide-y divide-line-strong">
                        {skillCols[col].map(renderSkillRow)}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-[2px] border border-line-strong xl:hidden">
                <table className="w-full min-w-[640px] text-[14.5px] leading-[1.55]">
                  <thead className="bg-paper-deep/70 text-[13.5px] text-ink-mute">
                    <tr>
                      <th className="px-2 py-2 text-left">技能</th>
                      <th className="px-1 py-2 w-14 text-center">基础</th>
                      <th className="px-1 py-2 w-20 text-center">职业</th>
                      <th className="px-1 py-2 w-20 text-center">兴趣</th>
                      <th className="px-1 py-2 w-20 text-center">成长</th>
                      <th className="px-1 py-2 w-16 text-center">合计</th>
                      <th className="px-1 py-2 w-12 text-center">半值</th>
                      <th className="px-1 py-2 w-12 text-center">五值</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-strong">
                    {visibleSkills.map(renderSkillRow)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 自定义技能 */}
          <div className="border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="flex items-center gap-2 text-[16px] font-bold text-ink">
                  <Plus className="w-4 h-4 text-moon" />自定义技能
                  <span className="text-[14px] font-normal text-ink-mute">{sheet.customSkills.length} / {CUSTOM_SKILL_MAX}</span>
                </h4>
                <p className="mt-1 text-[16px] leading-[1.75] text-ink-soft">
                  规则书没写、或 KP 房规新增的技能可以自己加：填名称与基础值，勾选「本职」后也能用职业点提升。
                </p>
              </div>
              <Button variant="ghost" onClick={addCustomSkill}><Plus className="w-4 h-4" />添加技能</Button>
            </div>

            {sheet.customSkills.length > 0 && (
              <div className="overflow-x-auto rounded-[2px] border border-line-strong">
                <table className="w-full min-w-[820px] text-[14.5px] leading-[1.6]">
                  <thead className="bg-paper-deep/70 text-[14px] text-ink-mute">
                    <tr>
                      <th className="p-2 text-left w-56">技能名称</th>
                      <th className="p-2 w-20 text-center">本职</th>
                      <th className="p-2 w-20 text-center">基础</th>
                      <th className="p-2 w-24 text-center">职业点</th>
                      <th className="p-2 w-24 text-center">兴趣点</th>
                      <th className="p-2 w-24 text-center">成长</th>
                      <th className="p-2 w-20 text-center">合计</th>
                      <th className="p-2 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-strong">
                    {sheet.customSkills.map((cs) => {
                      const d = derived.skills.find((x) => x.id === cs.id);
                      return (
                        <tr key={cs.id} className="bg-moon/[0.04]">
                          <td className="p-2">
                            <input
                              value={cs.name}
                              maxLength={24}
                              placeholder="例：驾驶（坦克）"
                              onChange={(e) => setCustomSkill(cs.id, 'name', e.target.value)}
                              className="w-full rounded-[2px] border border-line-strong bg-paper-raised px-2 py-1.5 text-[14.5px] text-ink"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(cs.isOccupation)}
                              onChange={(e) => setCustomSkill(cs.id, 'isOccupation', e.target.checked)}
                              className="w-4 h-4 accent-emerald-500 cursor-pointer"
                              title="勾选后可用职业点提升"
                            />
                          </td>
                          <td className="p-2"><NumberInput value={cs.base} onChange={(v) => setCustomSkill(cs.id, 'base', v)} className="!py-1.5 text-[14.5px]" /></td>
                          <td className="p-2"><NumberInput value={cs.occ} onChange={(v) => setCustomSkill(cs.id, 'occ', v)} className="!py-1.5 text-[14.5px]" /></td>
                          <td className="p-2"><NumberInput value={cs.interest} onChange={(v) => setCustomSkill(cs.id, 'interest', v)} className="!py-1.5 text-[14.5px]" /></td>
                          <td className="p-2"><NumberInput value={cs.growth} onChange={(v) => setCustomSkill(cs.id, 'growth', v)} className="!py-1.5 text-[14.5px]" /></td>
                          <td className="p-2 text-center font-mono text-[14px] font-bold text-moon">{d ? `${d.total}%` : '—'}</td>
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => removeCustomSkill(cs.id)} className="p-1.5 text-ink-mute transition-colors hover:text-vermilion">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ---------------------------------------------------- 战斗 */}
      {tab === 'combat' && (
        <Panel className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><Sword className="h-4 w-4 text-ochre" />武器与战斗</h3>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <select
                value={weaponPick}
                onChange={(e) => {
                  const name = e.target.value;
                  setWeaponPick('');
                  if (!name) return;
                  const preset = WEAPONS.find((w) => w.name === name);
                  if (!preset) return;
                  patch({
                    weapons: [...sheet.weapons, {
                      name: preset.name, skill: preset.skill, damage: preset.damage, range: preset.range,
                      attacks: preset.attacks, ammo: preset.ammo, malfunction: preset.malfunction,
                    }],
                  });
                }}
                className="max-w-full cursor-pointer rounded-[2px] border border-line-strong bg-paper-raised px-3 py-2 text-[14px] text-ink"
              >
                <option value="">从武器表选择…</option>
                {WEAPONS.filter((w) => w.name !== BUILTIN_WEAPON
                  && w.eras.includes(sheet.era === '现代' ? '现代' : '1920s'))
                  .map((w) => <option key={w.name} value={w.name}>{w.name}（{w.damage}）</option>)}
              </select>
              <Button
                variant="ghost"
                onClick={() => patch({ weapons: [...sheet.weapons, { name: '', skill: '', damage: '', range: '', attacks: '', ammo: '', malfunction: '' }] })}
              >
                <Plus className="w-4 h-4" />自定义武器
              </Button>
            </div>
          </div>
          <p className="text-[16px] leading-[1.75] text-ink-soft">
            「{BUILTIN_WEAPON}」是规则书里的常驻攻击方式，固定保留在第一条且不可删除；其余武器可从官方武器表直接选。
          </p>
          <p className="text-[14px] leading-relaxed text-ink-mute sm:hidden">← 左右滑动表格可查看完整武器信息 →</p>
          <div className="overflow-x-auto rounded-[2px] border border-line-strong">
            <table className="w-full min-w-[820px] text-[14.5px] leading-[1.6]">
              <thead className="bg-paper-deep/70 text-[14px] text-ink-mute">
                <tr>{['武器名称', '使用技能', '伤害', '射程', '每轮攻击', '装弹量', '故障值', ''].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line-strong">
                {sheet.weapons.map((w, i) => {
                  const isBare = w.name === BUILTIN_WEAPON;
                  return (
                    // ⚠️ key 必须稳定：早先用 `${w.name}-${i}`，改名时 key 变了 → 整行重挂载 →
                    // 输入框失焦，表现为「只能输入第一个字母，必须再点一次」，中文输入法也被打断。
                    <tr key={`weapon-${i}`} className={isBare ? 'bg-paper-raised' : undefined}>
                      {['name', 'skill', 'damage', 'range', 'attacks', 'ammo', 'malfunction'].map((f) => (
                        <td key={f} className="p-1.5">
                          <input
                            value={w[f] || ''}
                            maxLength={40}
                            readOnly={isBare}
                            onChange={(e) => patch({ weapons: sheet.weapons.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)) })}
                            className={cx('w-full rounded-[2px] border border-line-strong bg-paper-raised p-2 text-[14.5px] text-ink',
                              isBare && 'opacity-80 cursor-not-allowed')}
                          />
                        </td>
                      ))}
                      <td className="p-1.5 text-center">
                        {isBare ? (
                          <span className="text-[14px] text-ink-mute">常驻</span>
                        ) : (
                          <button type="button" onClick={() => patch({ weapons: sheet.weapons.filter((_, j) => j !== i) })} className="p-2 text-vermilion transition-colors hover:text-vermilion-deep">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sheet.weapons.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-[14.5px] text-ink-mute">还没有武器，点击右上角添加</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[['伤害加值', derived.db], ['体格', derived.build], ['闪避', derived.dodgeBase], ['移动力', derived.mov]].map(([l, v]) => (
              <div key={l} className="rounded-[2px] border border-line-strong bg-paper-deep/50 p-3.5 text-center">
                <div className="font-mono text-[14px] font-semibold tracking-[0.1em] text-ink-mute">{l}</div>
                <div className="tabular mt-1.5 font-serif text-[22px] font-bold leading-none text-ink">{v}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ---------------------------------------------------- 背景故事 */}
      {tab === 'story' && (
        <Panel className="space-y-4 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><BookOpen className="h-4 w-4 text-ochre" />背景故事</h3>
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {BACKGROUND_FIELDS.map(([key, label]) => (
              <Field className={FIELD} key={key} label={label}>
                <Textarea
                  rows={3}
                  maxLength={600}
                  value={sheet.background?.[key] || ''}
                  onChange={(e) => patch({ background: { ...sheet.background, [key]: e.target.value } })}
                />
              </Field>
            ))}
          </div>
        </Panel>
      )}

      {/* ---------------------------------------------------- 房规 */}
      {tab === 'house' && (
        <div className="space-y-5">
          <Panel className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
              <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
                <ScrollText className="h-4 w-4 text-ochre" />房规
              </h3>
              <span className="font-mono text-[13px] tracking-[0.14em] text-ink-mute tabular">{ruleSets.length} 套规则集</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              守秘人可以发布多套规则集，每一套同时包含房规与审卡规则。选定后本卡按这套房规计算；提交审核时会冻结当时的规则，
              之后守秘人再改也不影响这张卡。
            </p>

            {guest ? (
              <p className="border-l-2 border-ochre bg-paper-deep/40 px-3 py-2 text-[14px] leading-relaxed text-ink-soft">
                访客草稿不联网，只能按规则书基础值计算；登录后可选用守秘人发布的房规。
              </p>
            ) : ruleSets.length === 0 ? (
              <p className="border-l-2 border-line-strong bg-paper-deep/40 px-3 py-2 text-[14px] leading-relaxed text-ink-soft">
                还没有守秘人发布规则集，按官方规则书计算即可。
              </p>
            ) : (
              <>
              <div className="space-y-3">
                <Combobox
                  value={ruleQuery}
                  onChange={setRuleQuery}
                  options={ruleHints}
                  placeholder="查找规则集名称或发布守秘人"
                  emptyHint="没有匹配的规则集，可直接输入关键字"
                />

                <label className={cx('flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 transition-colors',
                  !sheet.ruleSetId ? 'border-ochre bg-ochre/[0.06]' : 'border-line-strong bg-paper-raised hover:border-ink-mute')}>
                  <input type="radio" name="ruleSet" className="mt-1 accent-[var(--ink)]" checked={!sheet.ruleSetId} onChange={() => patch({ ruleSetId: '' })} />
                  <span className="min-w-0">
                    <span className="block font-serif text-[16px] font-bold text-ink">官方规则书</span>
                    <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-soft">不使用任何房规，按规则书基础值计算。</span>
                  </span>
                </label>

                {pagedRuleSets.map((set) => {
                  const active = sheet.ruleSetId === set.id;
                  const numeric = (set.houseRules || []).filter((r) => r.type === 'deriveBase');
                  const checks = (set.houseRules || []).filter((r) => r.type !== 'deriveBase');
                  return (
                    <label key={set.id} className={cx('flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 transition-colors',
                      active ? 'border-ochre bg-ochre/[0.06]' : 'border-line-strong bg-paper-raised hover:border-ink-mute')}>
                      <input type="radio" name="ruleSet" className="mt-1 accent-[var(--ink)]" checked={active} onChange={() => patch({ ruleSetId: set.id })} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-[16px] font-bold text-ink">{set.name}</span>
                          <Badge tone={set.scope === 'global' ? 'amber' : 'slate'}>{set.scope === 'global' ? '全局默认' : '个人规则'}</Badge>
                          {set.isActive ? <Badge tone="emerald">守秘人当前在用</Badge> : null}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] text-ink-mute">
                          发布：{set.ownerName || '未登记'}
                          {set.updatedAt ? ` · ${new Date(set.updatedAt).toLocaleDateString('zh-CN')}` : ''}
                        </span>
                        {numeric.length ? (
                          <span className="mt-2 block space-y-1">
                            {numeric.map((r) => (
                              <span key={r.id} className="block text-[14px] leading-relaxed text-ink-soft">
                                <span className="mr-1 font-mono text-[12.5px] tracking-[0.1em] text-ink-mute">数值</span>
                                {houseRuleSummary(r)}
                                <span className="text-ink-mute">（原 {derived.skills?.find((s) => s.key === r.skill)?.origBase ?? SKILL_BY_KEY[r.skill]?.base ?? 0}）</span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="mt-2 block text-[14px] text-ink-mute">这套规则不改变车卡基础值。</span>
                        )}
                        {checks.length ? (
                          <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-mute">
                            另有 {checks.length} 条审卡要求（不改变数值，提交后由守秘人复核）。
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRuleDetail(set); }}
                        className="shrink-0 self-start border-b border-line-strong pb-0.5 text-[13.5px] text-ochre transition-colors hover:border-ochre"
                      >
                        详情
                      </button>
                    </label>
                  );
                })}
                {filteredRuleSets.length === 0 ? (
                  <p className="border border-dashed border-line-strong px-3 py-6 text-center text-[14px] text-ink-mute">
                    没有匹配的规则集，换个名字或守秘人用户名试试。
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-ink-mute">
                  {ruleQuery ? `已筛选：${filteredRuleSets.length} 套` : rulePages <= 1 ? `共 ${filteredRuleSets.length} 套` : ''}
                </span>
                <Pager page={rulePageNow} total={filteredRuleSets.length} pageSize={RULE_PAGE} onChange={setRulePage} label="套" />
              </div>
              </>
            )}
          </Panel>

          <Drawer open={Boolean(ruleDetail)} onClose={() => setRuleDetail(null)} title={ruleDetail ? ruleDetail.name : ''}>
            <RuleSetDetail set={ruleDetail} />
          </Drawer>
        </div>
      )}

      {/* ---------------------------------------------------- 装备与经历 */}
      {tab === 'journal' && (
        <div className="space-y-5">
          <Panel className="space-y-4 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><FileText className="h-4 w-4 text-ochre" />装备与资产</h3>
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[14.5px] font-bold text-ink">装备和物品</span>
                <span className="text-[14px] text-ink-mute">已登记 {gearItems.length} 件</span>
              </div>
              {gearItems.length > 0 ? (
                <ul className="divide-y divide-line-strong rounded-[2px] border border-line-strong">
                  {gearItems.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5">
                      <Input
                        value={it.part || ''}
                        maxLength={40}
                        placeholder="部位（背包 / 手上 / 口袋…）"
                        onChange={(e) => setEquipmentItems(gearItems.map((x) => (x.id === it.id ? { ...x, part: e.target.value.slice(0, 40) } : x)))}
                        className="!w-36 !py-1 !text-[14px]"
                      />
                      <Input
                        value={it.name || ''}
                        maxLength={120}
                        placeholder="物品名称"
                        onChange={(e) => setEquipmentItems(gearItems.map((x) => (x.id === it.id ? { ...x, name: e.target.value.slice(0, 120) } : x)))}
                        className="!min-w-0 flex-1 !py-1 !text-[14px]"
                      />
                      <button
                        type="button"
                        onClick={() => setEquipmentItems(gearItems.filter((x) => x.id !== it.id))}
                        className="border-b border-transparent px-1 text-[14px] text-red-600 transition-colors hover:border-red-500"
                      >
                        移除
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[2px] border border-dashed border-line-strong p-2">
                <Input value={gearDraft.part} maxLength={40} placeholder="部位（背包 / 手上 / 口袋…）" onChange={(e) => setGearDraft({ ...gearDraft, part: e.target.value })} className="!w-40 !py-1.5 !text-[14px]" />
                <Input value={gearDraft.name} maxLength={120} placeholder="物品名称" onChange={(e) => setGearDraft({ ...gearDraft, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') addGear(); }} className="!min-w-0 flex-1 !py-1.5 !text-[14px]" />
                <Button variant="ghost" onClick={addGear} disabled={!gearDraft.name.trim()}><Plus className="w-4 h-4" />添加物品</Button>
              </div>
              {gearItems.length === 0 && sheet.equipment ? (
                <p className="mt-2 whitespace-pre-wrap rounded-[2px] border border-line-strong bg-paper-deep/40 p-2.5 text-[14px] leading-[1.7] text-ink-soft">
                  <span className="text-ink-mute">旧版文字：</span>{sheet.equipment}
                </p>
              ) : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field className={FIELD} label="时代" hint="影响生活水平与物价表">
                <Select value={sheet.era} onChange={(e) => {
                  const era = e.target.value;
                  patch({ era, currency: DEFAULT_CURRENCY[era] || 'USD' });
                }}>
                  {ERAS.map((x) => <option key={x} value={x}>{x}</option>)}
                </Select>
              </Field>
              <Field className={FIELD} label="货币" hint="换算倍率为叙事参考">
                <Select value={sheet.currency} onChange={(e) => patch({ currency: e.target.value })}>
                  {currenciesFor(sheet.era).map((c) => (
                    <option key={c.code} value={c.code}>{c.label}{c.mult !== 1 ? `（×${c.mult}）` : ''}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="space-y-3 rounded-[2px] border border-amber-600/40 bg-amber-500/[0.05] p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-[14px] font-bold text-ochre">
                  <LockIcon />由信用评级自动计算 · 不可修改
                </span>
                <span className="text-[14px] text-ink-mute">
                  生活水平：<b>{derived.wealth.level}</b> · 信用评级 {derived.creditRating}%
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  ['消费水平', derived.wealth.level],
                  ['现金', derived.wealth.cashText],
                  ['资产', derived.wealth.assetsText],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[2px] border border-line-strong bg-paper-deep/40 px-3 py-2.5">
                    <div className="text-[14px] text-ink-mute">{label}</div>
                    <div className="font-mono text-[16px] font-bold text-ink">{value}</div>
                  </div>
                ))}
              </div>
              <p className="text-[14px] leading-[1.75] text-ink-soft">
                数据取自官方「资产及物价参考」表：{sheet.era} 的 {derived.wealth.currencyLabel}，信用评级 {derived.creditRating} 落在「{derived.wealth.level}」档。
                想提高现金与资产，只能通过提升信用评级（把职业点投进信用评级）。
              </p>
            </div>

            <Field className={FIELD} label="额外资产（选填）" hint="规则表之外的房产、遗产、藏品等，自由填写，会打印在角色卡上">
              <Textarea rows={2} maxLength={400} value={sheet.extraAssets} onChange={(e) => patch({ extraAssets: e.target.value })} />
            </Field>
          </Panel>

          <Panel className="space-y-4 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink"><FileText className="h-4 w-4 text-ochre" />跑团经历</h3>
            <Field className={FIELD} label="经历记录" hint="自由记述，会打印在角色卡的「经历」栏">
              <Textarea rows={4} maxLength={4000} value={sheet.experience} onChange={(e) => patch({ experience: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center gap-1.5 text-[14px] leading-[1.7] text-ink-soft">
              <Download className="w-3.5 h-3.5" />
              {guest ? '访客角色卡保存在本机，登录收录后才能在详情页关联模组。' : '关联模组请到「角色卡详情」页操作（玩家与 KP 均可添加）。'}
              {!guest && sheet.moduleLinks?.length > 0 ? (
                <span className="text-forest/90">当前已关联 {sheet.moduleLinks.length} 个模组，保存时会原样保留。</span>
              ) : null}
            </div>
          </Panel>

          <Panel className="space-y-3 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
              <FileText className="h-4 w-4 text-moon" />备注
              <span className="ml-2 text-[14px] font-normal text-ink-mute">只做记录，不会打印在角色卡上</span>
            </h3>
            <Field className={FIELD} label="备注内容" hint="KP 与本人都能在详情页看到；导出编码时会一起带上，骰娘指令与打印版面不含它">
              <Textarea
                rows={5}
                maxLength={4000}
                value={sheet.notes || ''}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="例：本局获得的法术、与某位 NPC 的约定、下次跑团要记得的事…"
              />
            </Field>
          </Panel>
        </div>
      )}

{/* ---------------------------------------------------- 附表 */}
      {tab === 'appendix' && (
        <div className="space-y-5">
          <Panel className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
                  <Library className="h-4 w-4 text-ochre" />法术详情
                  <span className="text-[14px] font-normal text-ink-mute">{spellRows.length} / {SPELL_LIMIT}</span>
                </h3>
                <p className="mt-1 text-[14px] leading-[1.7] text-ink-soft">
                  点名称旁的「大典」按分类浏览或搜索官方法术，点选后自动补全名称、分类、消耗与用时；也可以手写自定义法术。
                </p>
              </div>
              <Button variant="ghost" onClick={() => addSpell()} disabled={spellRows.length >= SPELL_LIMIT}>
                <Plus className="w-4 h-4" />添加法术
              </Button>
            </div>
            {spellRows.length === 0 ? (
              <p className="border border-dashed border-line-strong py-10 text-center text-[14.5px] text-ink-mute">
                还没有法术。点「添加法术」手填，或点「大典」从目录里挑一条自动补全。
              </p>
            ) : (
              <div className="space-y-3">
                {spellRows.map((sp) => (
                  <div key={sp.id} className="space-y-2 rounded-[2px] border border-line-strong bg-paper-raised p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={sp.name || ''}
                        maxLength={80}
                        placeholder="法术名称"
                        onChange={(e) => updateSpell(sp.id, 'name', e.target.value.slice(0, 80))}
                        className="!min-w-0 flex-1 !py-1.5 !text-[15px]"
                      />
                      <Button
                        variant="subtle"
                        onClick={() => { setSpellPicker(sp.id); setSpellQuery(''); setSpellCat('全部'); }}
                      >
                        <Search className="w-4 h-4" />大典
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeSpell(sp.id)}
                        className="border-b border-transparent px-1 text-[14px] text-red-600 transition-colors hover:border-red-500"
                      >
                        移除
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Select value={sp.category || ''} onChange={(e) => updateSpell(sp.id, 'category', e.target.value)}>
                        <option value="">未分类</option>
                        {SPELL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                      <Input value={sp.cost || ''} maxLength={80} placeholder="消耗（例：6 点魔法值）" onChange={(e) => updateSpell(sp.id, 'cost', e.target.value.slice(0, 80))} />
                      <Input value={sp.time || ''} maxLength={80} placeholder="用时（例：30 分钟）" onChange={(e) => updateSpell(sp.id, 'time', e.target.value.slice(0, 80))} />
                      <Input value={sp.en || ''} maxLength={120} placeholder="英文名（可选）" onChange={(e) => updateSpell(sp.id, 'en', e.target.value.slice(0, 120))} />
                    </div>
                    <Input value={sp.condition || ''} maxLength={300} placeholder="条件（材料、仪式、前置…）" onChange={(e) => updateSpell(sp.id, 'condition', e.target.value.slice(0, 300))} />
                    <Input value={sp.alias || ''} maxLength={300} placeholder="别名（用「、」分隔，例：掌控元素、雨之舞）" onChange={(e) => updateSpell(sp.id, 'alias', e.target.value.slice(0, 300))} />
                    <Textarea rows={4} maxLength={8000} value={sp.detail || ''} placeholder="法术详情（效果、范围、持续时间、代价…）" onChange={(e) => updateSpell(sp.id, 'detail', e.target.value.slice(0, 8000))} />
                    <Input value={sp.notes || ''} maxLength={500} placeholder="备注（本卡相关的记录）" onChange={(e) => updateSpell(sp.id, 'notes', e.target.value.slice(0, 500))} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
                  <BookOpen className="h-4 w-4 text-moon" />神话典籍
                  <span className="text-[14px] font-normal text-ink-mute">{tomeRows.length} / {TOME_LIMIT}</span>
                </h3>
                <p className="mt-1 text-[14px] leading-[1.7] text-ink-soft">
                  点「典籍」从目录里挑一本，自动补全语言/作者、理智损失与技能加成；也可以记录自编典籍。
                </p>
              </div>
              <Button variant="ghost" onClick={() => addTome()} disabled={tomeRows.length >= TOME_LIMIT}>
                <Plus className="w-4 h-4" />添加典籍
              </Button>
            </div>
            {tomeRows.length === 0 ? (
              <p className="border border-dashed border-line-strong py-10 text-center text-[14.5px] text-ink-mute">
                还没有典籍。调查员读过的书、抄本或残卷都可以记在这里。
              </p>
            ) : (
              <div className="space-y-3">
                {tomeRows.map((tm) => (
                  <div key={tm.id} className="space-y-2 rounded-[2px] border border-line-strong bg-paper-raised p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={tm.name || ''}
                        maxLength={120}
                        placeholder="典籍名称"
                        onChange={(e) => updateTome(tm.id, 'name', e.target.value.slice(0, 120))}
                        className="!min-w-0 flex-1 !py-1.5 !text-[15px]"
                      />
                      <Button variant="subtle" onClick={() => { setTomePicker(true); setTomeQuery(''); }}>
                        <Search className="w-4 h-4" />典籍
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeTome(tm.id)}
                        className="border-b border-transparent px-1 text-[14px] text-red-600 transition-colors hover:border-red-500"
                      >
                        移除
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                      <Input value={tm.meta || ''} maxLength={300} placeholder="语言 / 作者 / 年代" onChange={(e) => updateTome(tm.id, 'meta', e.target.value.slice(0, 300))} />
                      <Input value={tm.sanity || ''} maxLength={80} placeholder="理智损失" onChange={(e) => updateTome(tm.id, 'sanity', e.target.value.slice(0, 80))} />
                      <Input value={tm.occult || ''} maxLength={80} placeholder="神秘学（+%）" onChange={(e) => updateTome(tm.id, 'occult', e.target.value.slice(0, 80))} />
                      <Input value={tm.mythos || ''} maxLength={80} placeholder="克苏鲁神话（+%）" onChange={(e) => updateTome(tm.id, 'mythos', e.target.value.slice(0, 80))} />
                    </div>
                    <Input value={tm.en || ''} maxLength={160} placeholder="英文名（可选）" onChange={(e) => updateTome(tm.id, 'en', e.target.value.slice(0, 160))} />
                    <Textarea rows={2} maxLength={4000} value={tm.spells || ''} placeholder="记载的法术" onChange={(e) => updateTome(tm.id, 'spells', e.target.value.slice(0, 4000))} />
                    <Textarea rows={7} maxLength={12000} value={tm.desc || ''} placeholder="典籍全文 / 详情（语言、版本、理智损失、咒文与其它效果…）" onChange={(e) => updateTome(tm.id, 'desc', e.target.value.slice(0, 12000))} />
                    <Textarea rows={2} maxLength={500} value={tm.notes || ''} placeholder="本卡相关的备注" onChange={(e) => updateTome(tm.id, 'notes', e.target.value.slice(0, 500))} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      <Drawer open={Boolean(spellPicker)} onClose={() => setSpellPicker(null)} title="法术大典">
        <div className="space-y-3">
          <Input value={spellQuery} onChange={(e) => setSpellQuery(e.target.value)} placeholder="搜索法术名、别名或分类…" autoFocus />
          <div className="flex flex-wrap gap-1.5">
            {['全部', ...SPELL_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSpellCat(c)}
                className={cx('rounded-[2px] border px-2 py-1 text-[13px] transition-colors',
                  spellCat === c ? 'border-ochre/60 bg-ochre/10 text-ochre' : 'border-line-strong text-ink-soft hover:border-ink-mute')}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="text-[13.5px] text-ink-mute">共 {spellResults.length} 条</div>
          <ul className="max-h-[60vh] divide-y divide-line-strong overflow-y-auto rounded-[2px] border border-line-strong">
            {spellResults.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  onClick={() => {
                    const id = spellPicker;
                    setSheet((prev) => ({
                      ...prev,
                      spells: (prev.spells || []).map((sp) => (sp.id === id
                        ? { ...spellFromCatalog(entry, sp.id), condition: sp.condition, notes: sp.notes }
                        : sp)),
                    }));
                    setSpellPicker(null);
                    setDirty(true);
                    showToast(`已填入「${entry.name}」`);
                  }}
                  className="w-full px-2.5 py-2 text-left transition-colors hover:bg-paper-deep/50"
                >
                  <span className="font-bold text-ink">{entry.name}</span>
                  <span className="ml-2 text-[12.5px] text-ink-mute">{entry.category}</span>
                  <span className="block text-[13px] text-ink-soft">{entry.cost || '消耗未注明'}{entry.time ? ` · ${entry.time}` : ''}</span>
                  {entry.detail ? <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.6] text-ink-mute">{entry.detail}</span> : null}
                  {entry.aliases?.length ? <span className="block text-[12.5px] text-ink-mute">别名：{entry.aliases.join('、')}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Drawer>

      <Drawer open={tomePicker} onClose={() => setTomePicker(false)} title="神话典籍">
        <div className="space-y-3">
          <Input value={tomeQuery} onChange={(e) => setTomeQuery(e.target.value)} placeholder="搜索书名、语言、作者或摘要…" autoFocus />
          <div className="text-[13.5px] text-ink-mute">共 {tomeResults.length} 条</div>
          <ul className="max-h-[60vh] divide-y divide-line-strong overflow-y-auto rounded-[2px] border border-line-strong">
            {tomeResults.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  onClick={() => {
                    const empty = tomeRows.find((tm) => !tm.name);
                    if (empty) {
                      setSheet((prev) => ({
                        ...prev,
                        tomes: (prev.tomes || []).map((tm) => (tm.id === empty.id ? { ...tomeFromCatalog(entry, tm.id), notes: tm.notes } : tm)),
                      }));
                    } else {
                      addTome(entry);
                    }
                    setTomePicker(false);
                    setDirty(true);
                  }}
                  className="w-full px-2.5 py-2 text-left transition-colors hover:bg-paper-deep/50"
                >
                  <span className="font-bold text-ink">{entry.name}</span>
                  <span className="block text-[13px] text-ink-soft">{entry.meta || ''}</span>
                  {entry.desc ? <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.6] text-ink-mute">{entry.desc}</span> : null}
                  <span className="block text-[12.5px] text-ink-mute">
                    {[entry.sanity && `理智 ${entry.sanity}`, entry.occult && `神秘学 ${entry.occult}`, entry.mythos && `神话 ${entry.mythos}`].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Drawer>

      <OccupationPicker
        open={occOpen}
        onClose={() => setOccOpen(false)}
        occupations={occupations}
        current={sheet.occupationId}
        onPick={(id) => { setOccupation(id); setOccOpen(false); }}
        derived={derived}
      />
    </div>
  );
}

// ------------------------------------------------------------------ 职业选择
function OccupationPicker({ open, onClose, onPick, current, derived, occupations }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return occupations;
    return occupations.filter((o) => o.name.toLowerCase().includes(kw)
      || (o.desc || '').toLowerCase().includes(kw)
      || o.keys.some((k) => (SKILL_BY_KEY[k]?.name || '').includes(kw)));
  }, [q, occupations]);

  return (
    <Modal open={open} onClose={onClose} title="选择职业" wide>
      <div className="space-y-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索职业名、简介或本职技能…" autoFocus />
        <div className="text-[14px] text-ink-mute">共 {list.length} 个职业（含 KP 自定义模板）</div>
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {list.map((o) => {
            const budget = o.pts
              ? (o.pts.terms || []).reduce((a, t) => a + (derived.eff[t.stat] || 0) * t.mult, 0)
                + Math.max(0, ...(o.pts.max || []).map((t) => (derived.eff[t.stat] || 0) * t.mult))
              : 0;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onPick(o.id)}
                className={cx('w-full rounded-[2px] border p-4 text-left transition',
                  String(current) === String(o.id) ? 'border-forest bg-forest/[0.06]' : 'border-line-strong bg-paper-raised hover:border-forest/45')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-serif text-[16px] font-bold tracking-[0.01em] text-ink">
                    {o.name}
                    {o.isCustom ? <Badge tone="cyan">KP 模板</Badge> : null}
                  </span>
                  <span className="text-[14px] text-ink-soft">
                    信用评级 {o.cr[0]}-{o.cr[1]} · 技能点 {o.attr} = <b className="text-forest">{budget}</b>
                  </span>
                </div>
                {o.desc ? <p className="mt-1.5 text-[16px] leading-[1.75] text-ink-soft">{o.desc}</p> : null}
                {o.isCustom && o.createdByName ? (
                  <p className="mt-1 text-[14px] leading-[1.7] text-ink-mute">发布：{o.createdByName}</p>
                ) : null}
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...new Set(o.keys)].slice(0, 10).map((k) => (
                    <span key={k} className="rounded-[2px] bg-paper-deep px-1.5 py-0.5 text-[14px] text-ink-soft">
                      {SKILL_BY_KEY[k]?.name || k}
                    </span>
                  ))}
                  {o.choices?.length ? <span className="rounded-[2px] bg-ochre/10 px-1.5 py-0.5 text-[14px] text-ochre">任选其一 ×{o.choices.length}</span> : null}
                  {o.social ? <span className="rounded-[2px] bg-moon/10 px-1.5 py-0.5 text-[14px] text-moon">社交 ×{o.social}</span> : null}
                  {o.free ? <span className="rounded-[2px] bg-moon/10 px-1.5 py-0.5 text-[14px] text-moon">任意 ×{o.free}</span> : null}
                </div>
                {o.skillText ? (
                  <p className="mt-1.5 text-[14px] leading-[1.7] text-ink-soft">
                    <span className="text-ink-soft">官方本职技能：</span>{o.skillText}
                  </p>
                ) : null}
                {o.note ? <p className="mt-1 text-[14px] leading-[1.7] text-ochre">官方备注：{o.note}</p> : null}
              </button>
            );
          })}
          {list.length === 0 && <p className="py-8 text-center text-[16px] text-ink-mute">没有匹配的职业</p>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] leading-[1.7] text-ink-soft">必须从列表中选一个职业；规则书没有的职业请让 KP 在「审卡中心 → 职业模板」里添加。</p>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}
