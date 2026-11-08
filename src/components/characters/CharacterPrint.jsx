/**
 * 角色卡打印版面（A4，双页），对标官方《1920s 调查员》纸质卡的栏目结构。
 *
 * 为什么用「浏览器打印」而不是截图导出：
 *   - 纸质卡本来就是给人打印的，浏览器的「打印 / 另存为 PDF」输出的是矢量文字，清晰且可搜索；
 *   - 不需要引入 html2canvas/html-to-image 之类的第三方脚本，也就不必为了导出功能放开 CSP。
 *
 * 版面设计要点：
 *   - 字号整体上调（技能 9px → 11px，其它栏目同步放大），仍保证第一页容纳全部栏目；
 *   - **全部技能都会打印**并标出括号内的基础值；专攻技能只有选了方向才打印；
 *   - **已分配点数的技能排在前面并加浅底加粗**，未动过的默认技能排在后面，一眼能看出这张卡"练了什么"；
 *   - 每个技能前有一个小方块 ☐，玩家可在游戏里勾选"本局大成功"（与官方纸质卡一致）；
 *   - 消费水平 / 现金 / 资产由信用评级自动算出，另留一栏「额外资产」；
 *   - 审核状态与 KP 批复不属于角色卡本体，永远不会出现在打印件上。
 */

import React, { useMemo } from 'react';
import { BACKGROUND_FIELDS, ALL_CHARS, CHAR_LABEL, STATUS_LABEL } from '../../../shared/coc7e.js';

function Line({ value, className = '' }) {
  return (
    // ⚠️ 必须单行：whitespace-nowrap + 定宽 + 超出裁切，否则长姓名/长住地会折行把基础信息撑成两行
    <span
      title={typeof value === 'string' ? value : undefined}
      className={`inline-block border-b border-ink/45 align-bottom min-w-[2rem] px-1 whitespace-nowrap overflow-hidden text-ellipsis ${className}`}
    >
      {value || '\u00a0'}
    </span>
  );
}

function Box({ label, value, sub }) {
  return (
    <div className="border border-ink/25 rounded-[3px] bg-paper px-1.5 py-0.5 text-center leading-tight">
      <div className="text-[10.5px] text-ink-mute">{label}</div>
      <div className="text-[18px] font-bold font-mono text-ink">{value ?? '—'}</div>
      {sub ? <div className="text-[10.5px] text-ink-mute">{sub}</div> : null}
    </div>
  );
}

/**
 * 官方纸质卡式的可圈画数字格：白底、无边框，只把数字排在格子里，玩家用笔圈。
 * lead：把 0 的位置换成文字（如「疯了」「霉运连连」），数字从 1 开始。
 */
function Pill({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap rounded-full border border-ink/45 px-1.5 py-[1px] leading-none">
      <span className="text-[8.5px] text-ink-mute">{label}</span>
      <b className="font-mono text-[10px] text-ink">{value}</b>
    </span>
  );
}

function NumGrid({ from, to, cols = 10, cellH = 16, lead = '', leadSpan = 2 }) {
  const nums = [];
  for (let i = from; i <= to; i += 1) nums.push(i);
  return (
    <div
      className="grid gap-x-[1px] gap-y-[1px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {lead ? (
        <span
          className="flex items-center justify-center text-center font-serif text-[10px] leading-[1.05] text-ink"
          style={{ gridColumn: `span ${leadSpan}`, height: cellH }}
        >
          {lead}
        </span>
      ) : null}
      {nums.map((n) => (
        <span
          key={n}
          className="flex items-center justify-center font-mono text-[10.5px] leading-none text-ink"
          style={{ height: cellH }}
        >
          {String(n).padStart(2, '0')}
        </span>
      ))}
    </div>
  );
}

/**
 * 技能表的一列。
 * 已投点的技能加浅底 + 加粗；每行前面留一个 ☐ 供玩家标记本局大成功。
 */
function SkillColumn({ skills }) {
  return (
    // table-fixed + colgroup：列宽固定、技能名单行裁切 —— 保证「一个技能一行」
    <table className="w-full self-start text-[12.5px] border-collapse table-fixed">
      <colgroup>
        <col style={{ width: '15px' }} />
        <col style={{ width: '11px' }} />
        <col />
        <col style={{ width: '40px' }} />
        <col style={{ width: '35px' }} />
      </colgroup>
      <tbody>
        {skills.map((s) => {
          const allocated = s.occ > 0 || s.interest > 0 || s.growth > 0;
          // 名字长的（「操作重型机械」「外语（拉丁语）」等）自动缩一档，尽量不被裁切
          const label = `${s.name}（${s.base}%）`;
          const tight = label.length >= 11;
          return (
            <tr
              key={s.id}
              style={{ height: 16 }}
              className={`border-b border-ink/12 ${allocated ? 'bg-paper font-bold' : ''}`}
            >
              <td className="py-[1px] align-middle text-center text-[12px] leading-[16px]">{s.marked ? '☑' : '☐'}</td>
              <td className="py-[1px] text-[11px] leading-[16px] text-ink-mute">{s.isOccupation ? '★' : (s.kind === 'custom' ? '✎' : '')}</td>
              <td className={`py-[1px] pr-1 leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis ${tight ? 'text-[11px]' : ''}`}>
                <span title={label}>{s.name}</span>
                <span className="text-ink-mute font-normal">（{s.base}%）</span>
              </td>
              <td className="py-[1px] text-right font-mono leading-[16px] whitespace-nowrap text-ink-mute font-normal">
                {s.half}/{s.fifth}
              </td>
              <td className="py-[1px] text-right font-mono leading-[16px] whitespace-nowrap">{s.total}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function CharacterPrint({ character }) {
  const printedAt = useMemo(() => new Date().toLocaleDateString(), []);
  if (!character?.derived) return null;
  const d = character.derived;

  // 全部技能：专攻槽位只有填了方向才打印；已投点的排前面
  const printable = d.skills.filter((s) => (s.spec ? Boolean(s.custom) : true));
  const allocated = printable.filter((s) => s.occ > 0 || s.interest > 0 || s.growth > 0 || s.marked);
  const untouched = printable.filter((s) => !(s.occ > 0 || s.interest > 0 || s.growth > 0 || s.marked));
  const ordered = [...allocated, ...untouched];
  const per = Math.ceil(ordered.length / 3) || 1;
  const cols = [ordered.slice(0, per), ordered.slice(per, per * 2), ordered.slice(per * 2)];

  const w = d.wealth || { level: '—', cashText: '—', assetsText: '—' };

  const numCells = (from, to, stretch = false) => Array.from({ length: to - from + 1 }, (_, i) => {
    const n = from + i;
    return <span key={n} className={`flex ${stretch ? 'h-full' : 'h-[13px]'} items-center justify-center font-mono text-[10.5px] leading-none text-ink`}>{String(n).padStart(2, '0')}</span>;
  });

  return (
    <div className="print-root text-ink">
      {/* ============================ 第 1 页 ============================ */}
      <section className="print-paper print-page">
        <div className="border border-ink/45 p-2.5 shadow-[inset_0_0_0_1px_#dccdb1]">
          <div className="text-center border-b border-ink/45 pb-0.5 mb-1">
            <div className="text-[11.5px] tracking-[0.5em] text-ochre">❖ {character.era || '1920s'} 调查员 · 秘密调查档案馆 ❖</div>
            <div className="text-[21px] font-semibold font-serif tracking-[0.26em]">COC 七版 角色卡</div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[12px] mb-1">
            <div className="whitespace-nowrap">姓名：<Line value={character.name} className="w-[8.6rem]" /></div>
            <div className="whitespace-nowrap">玩家：<Line value={character.playerName} className="w-[7.4rem]" /></div>
            <div className="whitespace-nowrap">职业：<Line value={d.occupation?.name || '无'} className="w-[7.4rem]" /></div>
            <div className="whitespace-nowrap">年龄：<Line value={character.age} className="w-[3rem]" /></div>
            <div className="whitespace-nowrap">性别：<Line value={character.gender} className="w-[3.4rem]" /></div>
            <div className="whitespace-nowrap">住地：<Line value={character.residence} className="w-[7.4rem]" /></div>
            <div className="whitespace-nowrap">故乡：<Line value={character.birthplace} className="w-[7.4rem]" /></div>
            <div className="whitespace-nowrap">时代：<Line value={character.era} className="w-[5rem]" /></div>
            <div className="whitespace-nowrap">状态：<Line value={STATUS_LABEL[character.status] || ''} className="w-[5rem]" /></div>
          </div>

          {/* 属性：固定信息，只保留八项属性 */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            {ALL_CHARS.filter((k) => k !== 'Luck').map((k) => (
              <Box key={k} label={`${CHAR_LABEL[k]} ${k}`} value={d.eff[k]} sub={`${d.half[k]}/${d.fifth[k]}`} />
            ))}
          </div>

          {/* 生命 / 魔法 / 移动与伤害加值：同一横行，HP 标题行装下全部标记与派生 */}
          <div className="grid grid-cols-[1fr_1fr_max-content] gap-1 mb-1 items-stretch">
            {/* 生命 HP */}
            <div className="border border-ink/35 rounded-[3px] px-1.5 py-1 flex flex-col">
              <div className="grid grid-cols-5 items-center gap-x-[1px]">
                <div className="col-span-4 flex items-baseline gap-x-1.5 whitespace-nowrap">
                  <span className="font-bold text-[12.5px]">生命 HP</span>
                  <Pill label="Max" value={d.hp} />
                  <span className="text-[9px] text-ink-mute">重伤值 <b className="font-mono text-[10px] text-ink">{Math.floor(d.hp / 2)}</b></span>
                  <span className="inline-flex items-center gap-x-1 text-[9px] text-ink-soft">
                    <span className="inline-flex items-center gap-[1.5px]"><i className="inline-block h-[7px] w-[7px] border border-ink/60" />重伤</span>
                    <span className="inline-flex items-center gap-[1.5px]"><i className="inline-block h-[7px] w-[7px] border border-ink/60" />濒死</span>
                    <span className="inline-flex items-center gap-[1.5px]"><i className="inline-block h-[7px] w-[7px] border border-ink/60" />昏迷</span>
                  </span>
                </div>
                <span className="text-center font-mono text-[10.5px] text-ink">00</span>
              </div>
              <div className="mt-1 flex-1 grid grid-cols-5 grid-rows-4 gap-[1px]">
                {numCells(1, 20, true)}
              </div>
            </div>

            {/* 魔法 MP：标题、Max 与数列同一网格，铺满整框 */}
            <div className="border border-ink/35 rounded-[3px] px-1.5 py-1 flex">
              <div className="flex-1 grid grid-rows-2 gap-[1px]" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                <span className="flex items-center font-bold text-[12px] whitespace-nowrap" style={{ gridColumn: 'span 3' }}>魔法 MP</span>
                <span className="flex items-center whitespace-nowrap" style={{ gridColumn: 'span 3' }}><Pill label="Max" value={d.mp} /></span>
                {numCells(0, 24, true)}
              </div>
            </div>

            {/* 移动力 / 伤害加值：宽度贴近内容 */}
            <div className="grid grid-rows-2 gap-1">
              <div className="flex flex-col justify-center border border-ink/25 rounded-[3px] px-1.5 py-0.5 text-center leading-tight">
                <div className="text-[9px] text-ink-mute">移动力 MOV</div>
                <div className="text-[15px] font-bold font-mono text-ink">{d.mov}</div>
              </div>
              <div className="flex flex-col justify-center border border-ink/25 rounded-[3px] px-1.5 py-0.5 text-center leading-tight">
                <div className="text-[9px] text-ink-mute">伤害加值 / 体格</div>
                <div className="text-[13px] font-bold font-mono text-ink">{d.db} / {d.build}</div>
              </div>
            </div>
          </div>

          {/* 理智 SAN：标题、勾选与数字同一网格流式排布 */}
          <div className="border border-ink/35 rounded-[3px] px-2 py-1 mb-1">
            <div className="grid items-center gap-x-[1px] gap-y-[1px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
              <span className="font-bold text-[13px]" style={{ gridColumn: 'span 4' }}>理智 SAN</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft" style={{ gridColumn: 'span 3' }}><i className="inline-block h-[8px] w-[8px] border border-ink/60" />临时疯狂</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft" style={{ gridColumn: 'span 4' }}><i className="inline-block h-[8px] w-[8px] border border-ink/60" />不定时疯狂</span>
              <span className="flex items-center whitespace-nowrap" style={{ gridColumn: 'span 4' }}><Pill label="Start" value={d.san} /></span>
              <span className="flex items-center whitespace-nowrap" style={{ gridColumn: 'span 4' }}><Pill label="Max" value={d.sanMax} /></span>
              <span className="font-serif text-[10px] leading-[1.05] text-ink" style={{ gridColumn: 'span 2' }}>疯了</span>
              {numCells(1, 99)}
            </div>
          </div>

          {/* 幸运 LUCK：数字从标题旁开始 */}
          <div className="border border-ink/35 rounded-[3px] px-2 py-1 mb-1">
            <div className="grid items-center gap-x-[1px] gap-y-[1px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
              <span className="font-bold text-[13px]" style={{ gridColumn: 'span 4' }}>幸运 LUCK</span>
              <span className="flex items-center whitespace-nowrap" style={{ gridColumn: 'span 4' }}><Pill label="Start" value={d.eff.Luck} /></span>
              <span className="font-serif text-[10px] leading-[1.05] text-ink" style={{ gridColumn: 'span 3' }}>霉运连连</span>
              {numCells(1, 99)}
            </div>
          </div>

          {/* 技能 */}
          <div className="border border-ink/25 rounded-[3px] overflow-hidden">
            <div className="bg-paper-deep px-2 py-1 text-[11px] font-bold text-ink-soft flex justify-between flex-wrap gap-1 shadow-[inset_0_-1px_0_0_var(--color-line)]">
              <span>调查员技能（★本职 · ✎自定义 · 加粗=已投点 · ☐=本局大成功标记 · 括号内为基础值）</span>
              <span className="font-normal text-[10px] text-ink-mute">
                职业 {d.spent.occupation}/{d.budget.occupation} · 兴趣 {d.spent.interest}/{d.budget.interest}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-x-2 px-1.5 py-1.5">
              {cols.map((col, i) => <SkillColumn key={i} skills={col} />)}
            </div>
          </div>

          {/* 武器 */}
          <div className="border border-ink/25 rounded-[3px] overflow-hidden mt-3">
            <div className="bg-paper-deep px-2 py-1 text-[12.5px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)]">❖ 武器</div>
            <table className="w-full text-[11.5px] border-collapse">
              <thead>
                <tr className="border-b border-ink/25 text-ink-mute">
                  <th className="text-left px-2 py-[2px]">武器名称</th>
                  <th className="text-left px-2 py-[2px]">使用技能</th>
                  <th className="text-left px-2 py-[2px]">伤害</th>
                  <th className="text-left px-2 py-[2px]">射程</th>
                  <th className="text-left px-2 py-[2px]">每轮攻击</th>
                  <th className="text-left px-2 py-[2px]">装弹量</th>
                  <th className="text-left px-2 py-[2px]">故障值</th>
                </tr>
              </thead>
              <tbody>
                {(character.weapons || []).map((row, i) => (
                  <tr key={`${row.name}-${i}`} className="border-b border-ink/12">
                    <td className="px-2 py-[1.5px] font-bold">{row.name}</td>
                    <td className="px-2 py-[1.5px]">{row.skill}</td>
                    <td className="px-2 py-[1.5px]">{row.damage}</td>
                    <td className="px-2 py-[1.5px]">{row.range}</td>
                    <td className="px-2 py-[1.5px]">{row.attacks}</td>
                    <td className="px-2 py-[1.5px]">{row.ammo}</td>
                    <td className="px-2 py-[1.5px]">{row.malfunction}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 1 - (character.weapons || []).length) }).map((_, i) => (
                  <tr key={`e${i}`} className="border-b border-ink/12">
                    {Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-2 py-[8px]" />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[10.5px] text-ink-mute mt-1.5 text-center">
            ❖ {character.ownerName || character.playerName || ''} · 由「秘密调查档案馆」生成 · {printedAt} ❖
          </div>
        </div>
      </section>

      {/* ============================ 第 2 页 ============================ */}
      <section className="print-paper print-page">
        <div className="border border-ink/45 p-3 h-full flex flex-col shadow-[inset_0_0_0_1px_#dccdb1]">
          <div className="text-center border-b border-ink/45 pb-1 mb-2">
            <div className="text-xl font-semibold font-serif tracking-[0.26em]">背景故事</div>
            <div className="text-[11.5px] text-ink-mute">
              {character.name}{character.playerName ? ` · ${character.playerName}` : ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {BACKGROUND_FIELDS.map(([key, label]) => (
              <div key={key} className="print-avoid-break">
                <div className="text-[12.5px] font-bold text-ink border-b border-ink/25 mb-[2px]">{label}</div>
                <div className="text-[11.5px] leading-[1.55] whitespace-pre-wrap min-h-[2.9rem]">
                  {character.background?.[key] || ''}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="border border-ink/25 rounded-[3px] overflow-hidden">
              <div className="bg-paper-deep px-2 py-1 text-[12.5px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)]">❖ 装备和物品</div>
              <div className="p-2 text-[11.5px] leading-[1.65] min-h-[5.5rem]">
                {(character.equipmentItems || []).length ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {character.equipmentItems.map((it) => (
                      <div key={it.id} className="break-inside-avoid [overflow-wrap:anywhere]">
                        <span className="text-ink-mute">【{it.part || '随身'}】</span>{it.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{character.equipment || ''}</div>
                )}
              </div>
            </div>
            <div className="border border-ink/25 rounded-[3px] overflow-hidden">
              <div className="bg-paper-deep px-2 py-1 text-[12.5px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)] flex justify-between">
                <span>❖ 资产</span>
                <span className="font-normal text-ink-mute tracking-normal">按信用评级自动计算</span>
              </div>
              <div className="p-2 text-[11.5px] space-y-1">
                <div>时代 / 货币：<b>{character.era} · {w.currencyLabel || ''}</b></div>
                <div>消费水平：<b>{w.level}</b><span className="mx-2">·</span>信用评级：<b className="font-mono">{d.creditRating}%</b>
                  {d.occupation ? <span className="text-ink-mute">（{d.occupation.cr[0]}-{d.occupation.cr[1]}）</span> : null}
                </div>
                <div>现金：<b className="font-mono">{w.cashText}</b><span className="mx-2">·</span>资产：<b className="font-mono">{w.assetsText}</b></div>
                <div className="pt-1 border-t border-ink/12">
                  额外资产：<span className="whitespace-pre-wrap">{character.extraAssets || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 经历：模组关联 */}
          <div className="border border-ink/25 rounded-[3px] overflow-hidden mt-3 flex-1">
            <div className="bg-paper-deep px-2 py-1 text-[12.5px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)] flex justify-between">
              <span>❖ 经历（跑团记录）</span>
              <span className="font-normal text-ink-mute tracking-normal">共 {(character.moduleLinks || []).length} 个模组</span>
            </div>
            <table className="w-full text-[11.5px] border-collapse">
              <thead>
                <tr className="border-b border-ink/25 text-ink-mute">
                  <th className="text-left px-2 py-[2px] w-[22%]">日期</th>
                  <th className="text-left px-2 py-[2px]">模组</th>
                  <th className="text-left px-2 py-[2px] w-[12%]">身份</th>
                  <th className="text-left px-2 py-[2px] w-[38%]">备注</th>
                </tr>
              </thead>
              <tbody>
                {(character.moduleLinks || []).map((l) => (
                  <tr key={l.moduleId} className="border-b border-ink/12">
                    <td className="px-2 py-[1.5px] font-mono">{l.date || ''}</td>
                    <td className="px-2 py-[1.5px]">{l.moduleTitle}</td>
                    <td className="px-2 py-[1.5px]">{l.role}</td>
                    <td className="px-2 py-[1.5px]">{l.note || ''}</td>
                  </tr>
                ))}
                {(character.moduleLinks || []).length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-3 text-center text-ink-mute/70">暂无记录</td></tr>
                )}
              </tbody>
            </table>
            {character.experience ? (
              <div className="p-2 text-[11.5px] leading-[1.65] whitespace-pre-wrap border-t border-ink/12">
                {character.experience}
              </div>
            ) : null}
          </div>

          <div className="text-[10.5px] text-ink-mute mt-1.5 text-center">
            ❖ 角色卡由「秘密调查档案馆」生成 · COC 第 7 版规则 ❖
          </div>
        </div>
      </section>

      {((character.spells || []).length > 0 || (character.tomes || []).length > 0) ? (
        <section className="print-paper print-page">
          <div className="flex items-baseline justify-between border-b-2 border-ink pb-1">
            <div className="font-serif text-[16px] font-black tracking-[0.08em] text-ink">附 表</div>
            <div className="text-[10.5px] text-ink-mute">{character.name} · 法术与神话典籍</div>
          </div>

          <div className="mt-2 border border-ink/25 rounded-[3px] overflow-hidden">
            <div className="bg-paper-deep px-2 py-1 text-[12px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)] flex justify-between">
              <span>❖ 法术详情</span>
              <span className="font-normal text-ink-mute tracking-normal">{(character.spells || []).length} 条</span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-ink/25 text-ink-mute">
                  <th className="text-left px-1.5 py-[2px] w-[24%]">法术</th>
                  <th className="text-left px-1.5 py-[2px] w-[16%]">分类</th>
                  <th className="text-left px-1.5 py-[2px] w-[16%]">消耗</th>
                  <th className="text-left px-1.5 py-[2px] w-[14%]">用时</th>
                  <th className="text-left px-1.5 py-[2px]">条件</th>
                </tr>
              </thead>
              <tbody>
                {(character.spells || []).map((sp) => (
                  <tr key={sp.id} className="border-b border-ink/12 align-top">
                    <td className="px-1.5 py-[1.5px] font-bold">{sp.name}</td>
                    <td className="px-1.5 py-[1.5px]">{sp.category || ''}</td>
                    <td className="px-1.5 py-[1.5px]">{sp.cost || ''}</td>
                    <td className="px-1.5 py-[1.5px]">{sp.time || ''}</td>
                    <td className="px-1.5 py-[1.5px]">{sp.condition || ''}{sp.notes ? <span className="text-ink-mute">（{sp.notes}）</span> : null}</td>
                  </tr>
                ))}
                {(character.spells || []).length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-2 text-center text-ink-mute/70">暂无记录</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-ink/25 rounded-[3px] overflow-hidden">
            <div className="bg-paper-deep px-2 py-1 text-[12px] font-bold text-ink-soft tracking-[0.15em] shadow-[inset_0_-1px_0_0_var(--color-line)] flex justify-between">
              <span>❖ 神话典籍</span>
              <span className="font-normal text-ink-mute tracking-normal">{(character.tomes || []).length} 本</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2">
              {(character.tomes || []).map((tm) => (
                <div key={tm.id} className="border border-ink/20 rounded-[2px] p-1.5 break-inside-avoid">
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-serif text-[11.5px] font-bold">{tm.name}</span>
                    {tm.meta ? <span className="text-[9.5px] text-ink-mute">{tm.meta}</span> : null}
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink-soft">
                    {tm.sanity ? <span className="mr-2">理智 {tm.sanity}</span> : null}
                    {tm.occult ? <span className="mr-2">神秘学 {tm.occult}</span> : null}
                    {tm.mythos ? <span className="mr-2">神话 {tm.mythos}</span> : null}
                  </div>
                  {tm.spells ? <div className="mt-0.5 text-[10px] text-ink-soft">法术：{tm.spells}</div> : null}
                  {tm.notes ? <div className="mt-0.5 line-clamp-2 text-[9.5px] leading-[1.5] text-ink-mute">{tm.notes}</div> : null}
                </div>
              ))}
              {(character.tomes || []).length === 0 && (
                <div className="col-span-2 py-2 text-center text-[11px] text-ink-mute/70">暂无记录</div>
              )}
            </div>
          </div>

          <div className="text-[10.5px] text-ink-mute mt-1.5 text-center">
            ❖ 角色卡由「秘密调查档案馆」生成 · COC 第 7 版规则 ❖
          </div>
        </section>
      ) : null}
    </div>
  );
}
