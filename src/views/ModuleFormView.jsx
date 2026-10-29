/**
 * KP 录入 / 编辑模组档案 —— v3「馆藏登记表」。
 *
 * 版面：左侧一张窄的登记须知（桌面常驻），右侧是一张可以盖章的纸质登记表。
 * 所有字段、maxLength、必填与回调保持原样，只换视觉与编排。
 */
import React from 'react';
import { ArrowLeft, FileText, Pin, Plus } from 'lucide-react';
import { Button, Combobox, Field, Input, Select, Textarea, SectionHeading, cx } from '../components/ui.jsx';
import { SealMark, CornerTick } from '../components/Emblem.jsx';

/** 单行字段：像登记表上的填空线，而不是网页输入框 */
const line = '!rounded-none !border-0 !border-b !border-ink-mute/45 !bg-transparent !px-0 !py-1.5 !shadow-none transition-colors hover:!border-vermilion/60 focus:!ring-0 focus:!border-indigo';
const area = '!rounded-[2px] !bg-paper-raised';

const NOTES = [
  '名称与合集决定它被归入哪一排目录；合集可以现场新建。',
  '附加档案均为选填，但车卡要求与 KP 备注会直接影响玩家体验。',
  '档案发布后可随时回到详情页修改，旧编号不会改变。',
];

export default function ModuleFormView({ isEditing, formData, setFormData, uniqueSeries, onSubmit, onBack }) {
  const pinned = !!formData.isPinned;

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" className="!-ml-1.5 mb-3 !px-2 !py-1 !text-[14.5px]" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />返回
          </Button>
          <p className="flex items-center gap-2 text-[14px] font-bold tracking-[0.24em] text-ink-mute">
            <span aria-hidden="true" className="inline-block h-[5px] w-[5px] bg-vermilion" />
            ACCESSION FORM · 07
          </p>
          <h2 className="page-title--indigo moon-text-anim mt-2 flex w-fit max-w-full items-center gap-2.5 font-serif text-[30px] font-bold leading-tight tracking-[0.01em] sm:text-[36px]">
            {isEditing ? <FileText className="h-[25px] w-[25px] text-ochre" /> : <Plus className="h-[25px] w-[25px] text-ochre" />}
            {isEditing ? '编辑档案' : '录入档案'}
          </h2>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-ink-mute">
            每一条新档案都会被编入馆藏索引；带 * 的条目为必填。
          </p>
        </div>

        <div className="flex items-center gap-3 pb-1">
          <span aria-hidden="true" className="hidden rotate-[-4deg] border-2 border-vermilion/70 px-2.5 py-1 font-serif text-[14px] font-bold tracking-[0.22em] text-vermilion/80 sm:inline-block">
            {isEditing ? '校 订' : '新 收'}
          </span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
            className={cx(
              'flex h-9 items-center gap-1.5 border px-2.5 text-[14px] transition-colors',
              pinned
                ? 'border-vermilion bg-vermilion/[0.06] font-semibold text-vermilion'
                : 'border-line-strong bg-transparent text-ink-mute hover:border-ink/50 hover:text-ink',
            )}
          >
            <Pin className="h-4 w-4" />置顶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[218px_minmax(0,1fr)] lg:gap-8">
        {/* ------------------------------------------------------- 左侧：登记须知 */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="border-b border-ink pb-2 text-[14px] font-bold tracking-[0.22em] text-ink-mute">登记须知</p>
            <ol className="mt-3 space-y-3">
              {NOTES.map((n, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="tabular mt-0.5 font-mono text-[14px] tracking-[0.14em] text-ochre">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[14px] leading-[1.8] text-ink-mute">{n}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex items-center gap-2.5 border-t border-line pt-4">
              <SealMark size={30} className="text-vermilion/70" strokeWidth={1.8} />
              <p className="font-kai text-[14px] leading-relaxed tracking-[0.12em] text-ink-mute">收录世界上<br />不可名状的超自然案件</p>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------- 右侧：登记表 */}
        <div className="surface relative px-5 py-6 sm:px-8 sm:py-8">
          <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-line-strong"><CornerTick className="h-full w-full" /></span>
          <span aria-hidden="true" className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-line-strong"><CornerTick className="h-full w-full" /></span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 text-line-strong"><CornerTick className="h-full w-full" /></span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 text-line-strong"><CornerTick className="h-full w-full" /></span>

          <form onSubmit={onSubmit} className="relative space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed border-line-strong pb-2.5 font-mono text-[14px] tracking-[0.14em] text-ink-mute">
              <span>THE SECRET ARCHIVE · ACCESSION RECORD</span>
              <span className="flex items-center gap-2">
                编号
                <span aria-hidden="true" className="inline-block w-20 border-b border-dotted border-ink/50" />
                日期
                <span aria-hidden="true" className="inline-block w-24 border-b border-dotted border-ink/50" />
              </span>
            </div>

            <div>
              <SectionHeading index="01" title="基础条目" desc="名称、年代与规模决定它会被归入哪一排目录。" />
              <div className="mt-5 grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
                <Field label="名称" required>
                  <Input className={line} required maxLength={60} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </Field>
                <Field label="所属合集/系列 (选填)">
                  <Combobox
                    options={uniqueSeries}
                    value={formData.series}
                    onChange={(v) => setFormData({ ...formData, series: v })}
                    maxLength={40}
                    placeholder="选择已有合集，或直接输入新名字…"
                    emptyHint="没有匹配的合集，直接输入即可创建"
                    inputClassName={line}
                  />
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-7 gap-y-4 md:grid-cols-4">
                <Field label="地区"><Input className={line} maxLength={40} value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} /></Field>
                <Field label="时代" required>
                  <Select className={line} required value={formData.era} onChange={(e) => setFormData({ ...formData, era: e.target.value })}>
                    <option value="" disabled>请选择</option>
                    <option value="1920s">1920s</option>
                    <option value="现代">现代</option>
                    <option value="其他">其他</option>
                  </Select>
                </Field>
                <Field label="人数" required><Input className={line} required maxLength={20} value={formData.players} onChange={(e) => setFormData({ ...formData, players: e.target.value })} /></Field>
                <Field label="时长" required><Input className={line} required maxLength={20} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} /></Field>
              </div>

              <div className="mt-5">
                <Field label="简介" required>
                  <Textarea className={area} required rows={4} maxLength={4000} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </Field>
              </div>
            </div>

            <div className="border-t border-line pt-7">
              <SectionHeading index="02" title="附加档案" desc="选填；车卡要求与警示会出现在详情页的辅助栏。" />
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="车卡要求"><Textarea className={area} rows={2} maxLength={2000} value={formData.charInfo} onChange={(e) => setFormData({ ...formData, charInfo: e.target.value })} /></Field>
                <Field label="推荐职业"><Textarea className={area} rows={2} maxLength={2000} value={formData.occupations} onChange={(e) => setFormData({ ...formData, occupations: e.target.value })} /></Field>
                <Field label="推荐技能"><Textarea className={area} rows={2} maxLength={2000} value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} /></Field>
                <Field label="KP 警告/备注"><Textarea className={area} rows={2} maxLength={2000} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></Field>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
              <div>
                <p className="text-[16px] text-ink-mute">提交后仍可在档案详情页修改。</p>
                <p className="mt-2 font-kai text-[14px] tracking-[0.14em] text-ink-mute">经办人 <span className="ml-2 inline-block w-24 border-b border-dotted border-ink/40 align-middle" /></p>
              </div>
              <Button size="lg" type="submit" className="!px-6">
                {isEditing ? '保存修改' : '发布至档案馆'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}