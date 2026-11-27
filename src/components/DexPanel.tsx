import { useState } from 'react'
import { ELEMENTS, ELEMENT_LIST, RARITIES, SPECIES, type Element, type SpriteSpecies } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import { useOutline } from '../ui/outline'
import type { GameApi } from '../game/useGame'
import Icon, { type IconName } from '../ui/Icon'
import GoalsPanel from './GoalsPanel'

const LINE_LABEL: Record<string, string> = {
  baby: '幼体', attack: '攻击线', support: '功能线', special: '特殊', limited: '限定传说',
}

/** 每个分组只用一个图标，不再按组换 emoji。 */
const GROUP_ICON: Record<string, IconName> = {
  baby: 'leaf', attack: 'swords', support: 'sparkle', special: 'gem', limited: 'egg',
}

function SpeciesCard({ sp, owned }: { sp: SpriteSpecies; owned: boolean }) {
  const rarity = RARITIES[sp.rarity]
  const art = spriteImage(sp.id, sp.element, sp.stage)
  const outline = useOutline(owned ? undefined : art)
  // 未捕获的物种只给轮廓线；捕获后才是彩色贴纸
  const tier = owned ? sp.rarity : null
  return (
    <div className={`relative rounded-control border-hair p-2 text-center ${
      tier === 'legend' ? 'card-rar-legend rar-shine' : tier === 'epic' ? 'card-rar-epic' : owned ? 'border-line bg-paper2' : 'border-dashed border-line bg-paper/60'
    }`}>
      {tier === 'legend' && <span className="rar-badge rar-badge-legend">传说</span>}
      {tier === 'epic' && <span className="rar-badge rar-badge-epic">史诗</span>}
      <div className="relative flex h-16 items-center justify-center">
        {owned ? (
          <img src={art} alt={sp.name} className="h-16 object-contain" />
        ) : outline ? (
          <img src={outline} alt="未发现" className="h-16 object-contain" />
        ) : (
          <span className="h-16 w-16 rounded-full border-hair border-dashed border-line" aria-hidden />
        )}
      </div>
      <div className={`mt-1 flex items-center justify-center gap-1 text-caption font-bold text-ink ${tier === 'legend' || tier === 'epic' ? 'pt-1' : ''}`}>
        {owned ? sp.name : <span className="text-inkfaint">未发现</span>}
        {owned && <span className="h-2 w-2 rounded-full" style={{ background: rarity.color }} title={rarity.name} />}
      </div>
      <div className="micro">
        {owned ? rarity.name : LINE_LABEL[sp.line]}
      </div>
      {owned && (
        <div className="mt-1 space-y-0.5 text-caption text-inksoft">
          {sp.farm && <div>农场：{sp.farm}</div>}
          {sp.skills[0] && <div>{sp.skills[0].name}</div>}
        </div>
      )}
    </div>
  )
}

export default function DexPanel({ game }: { game: GameApi }) {
  const { state } = game
  const [tab, setTab] = useState<Element>('wood')
  const owned = new Set(state.dex)
  const ownedCount = SPECIES.filter(sp => owned.has(sp.id)).length

  const babies = SPECIES.filter(s => s.element === tab && s.line === 'baby')
  const attackLine = SPECIES.filter(s => s.element === tab && s.line === 'attack')
  const supportLine = SPECIES.filter(s => s.element === tab && s.line === 'support')
  const groups: { key: string; label: string; list: SpriteSpecies[] }[] = [
    { key: 'special', label: '特殊精灵', list: SPECIES.filter(s => s.element === tab && s.line === 'special') },
    { key: 'limited', label: '限定传说', list: SPECIES.filter(s => s.element === tab && s.line === 'limited') },
  ]
  const STAGE_LABEL: Record<string, string> = { baby: '幼体', adult: 'Lv.10', complete: 'Lv.30', ultimate: 'Lv.50' }

  return (
    <div className="space-y-3">
      <section className="card flex flex-wrap items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <Icon name="book" size={18} className="text-berry" />
          <div>
            <h2 className="section-title text-ink">精灵图鉴</h2>
            <p className="caption">共 {SPECIES.length} 只 · 每系 {SPECIES.filter(x => x.element === tab).length} 只 · 幼体 Lv.10 分叉成攻击线 / 功能线</p>
          </div>
        </div>
        <span className="pill">
          <Icon name="gem" size={13} className="text-inkfaint" />
          收集进度
          <span className="stat-value num">{ownedCount}/{SPECIES.length}</span>
        </span>
      </section>

      {/* 属性页签 */}
      <div className="flex flex-wrap gap-1.5">
        {ELEMENT_LIST.map(el => {
          const elOwned = SPECIES.filter(s => s.element === el && owned.has(s.id)).length
          const active = tab === el
          return (
            <button key={el} onClick={() => setTab(el)}
              className={`chip ${active ? 'chip-active' : 'hover:bg-paper2'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: ELEMENTS[el].color }} />
              {ELEMENTS[el].name}系
              <span className="num text-inkfaint">{elOwned}/{SPECIES.filter(x => x.element === el).length}</span>
            </button>
          )
        })}
      </div>

      <GoalsPanel game={game} />

      {/* 进化链：幼体 → 双线 → 究极体 */}
      <section className="card p-4">
        <h3 className="section-title mb-1 text-caption">
          <Icon name="sparkle" size={15} className="text-butter-deep" />
          {ELEMENTS[tab].name}系进化链
          <span className="pill-soft">Lv.10 分叉 · Lv.30 · Lv.50</span>
        </h3>
        <p className="micro mb-3">幼体到 Lv.10 时看三项天赋：活力最高走攻击线，否则走功能线。</p>

        <div className="mb-1 flex items-center gap-1 text-[10px] text-inkfaint">
          <span className="rounded-full bg-paper2 px-2 py-0.5">幼体</span>
          <span>三只幼体都能进化到任意一条线</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {babies.map(sp => <SpeciesCard key={sp.id} sp={sp} owned={owned.has(sp.id)} />)}
        </div>

        <div className="my-2 flex items-center justify-center gap-2 text-[10px] text-inkfaint">
          <span className="h-px flex-1 bg-line" />
          活力最高 → 攻击线　·　自然 / 灵力最高 → 功能线
          <span className="h-px flex-1 bg-line" />
        </div>

        {[
          { line: 'attack' as const, name: '攻击线', list: attackLine, tone: 'text-berry' },
          { line: 'support' as const, name: '功能线', list: supportLine, tone: 'text-sage-deep' },
        ].map(({ name, list, tone }) => (
          <div key={name} className="mb-2 last:mb-0">
            <div className={`mb-1 text-[10px] font-bold ${tone}`}>{name}</div>
            <div className="grid grid-cols-3 items-stretch gap-2">
              {list.map((sp, i) => (
                <div key={sp.id} className="relative">
                  <SpeciesCard sp={sp} owned={owned.has(sp.id)} />
                  <span className="absolute left-1 top-1 rounded-full bg-paper/85 px-1.5 text-[9px] text-inkfaint">
                    {STAGE_LABEL[sp.stage]}
                  </span>
                  {i < list.length - 1 && (
                    <span className="pointer-events-none absolute -right-1.5 top-1/2 -translate-y-1/2 text-inkfaint" aria-hidden>›</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {groups.map(g => {
        const got = g.list.filter(sp => owned.has(sp.id)).length
        return (
          <section key={g.key} className="card p-4">
            <h3 className="section-title mb-3 text-caption">
              <Icon name={GROUP_ICON[g.key] ?? 'book'} size={15} className="text-inksoft" />
              {g.label}
              <span className="pill-soft num">{got}/{g.list.length}</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {g.list.map(sp => <SpeciesCard key={sp.id} sp={sp} owned={owned.has(sp.id)} />)}
            </div>
          </section>
        )
      })}
      </div>

      <section className="card-quiet flex items-start gap-2 p-3">
        <Icon name="sparkle" size={14} className="mt-0.5 text-inkfaint" />
        <p className="micro">
          获取方式：结晶融合孵化（普通 ~ 优质幼体）· 纯血蛋有概率邂逅特殊精灵 · 集齐五系结晶各 1 枚可在「传说召唤阵」召唤限定传说 · 幼体 Lv.10/30/50 进化。
        </p>
      </section>
    </div>
  )
}
