import { useEffect, useState } from 'react'
import { CRYSTAL_Q, ELEMENTS, ELEMENT_LIST, RARITIES, SUMMON_COST, itemName, parseItem, type Element } from '../game/data'
import { rarityByScore, type GameApi } from '../game/useGame'
import Icon from '../ui/Icon'
import { sfx } from '../game/audio'

const fmtTime = (sec: number) => sec >= 3600 ? `${(sec / 3600).toFixed(1)} 小时` : sec >= 60 ? `${Math.ceil(sec / 60)} 分钟` : `${sec} 秒`
const fmtRemain = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  if (s >= 3600) return `${Math.floor(s / 3600)} 时 ${Math.floor((s % 3600) / 60)} 分`
  if (s >= 60) return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
  return `${s} 秒`
}

/** 元素色只当小标记，界面本身保持纸色。 */
function ElementDot({ el, size = 8 }: { el: Element; size?: number }) {
  return <span className="rounded-full" style={{ width: size, height: size, background: ELEMENTS[el].color, display: 'inline-block', flex: 'none' }} />
}

export default function FusionPanel({ game }: { game: GameApi }) {
  const { state, incubate, hatch, summonLimited } = game
  const [picked, setPicked] = useState<string[]>([]) // 水晶物品 id（可重复选择直到消耗完数量）
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const now = Date.now()

  // 背包里的水晶（含品质变体）
  const crystalItems = Object.entries(state.inventory)
    .filter(([id]) => id.startsWith('crystal_'))
    .sort(([a], [b]) => a.localeCompare(b))

  const countOf = (id: string) => state.inventory[id] ?? 0
  const pickedOf = (id: string) => picked.filter(x => x === id).length

  const addOne = (id: string) => {
    setPicked(p => (p.length >= 5 || pickedOf(id) >= countOf(id)) ? p : [...p, id])
  }
  const removeOne = (id: string) => {
    setPicked(p => {
      const idx = p.lastIndexOf(id)
      return idx < 0 ? p : p.filter((_, i) => i !== idx)
    })
  }

  // 预测：品质分 → 稀有度；元素多数决
  const score = picked.reduce((n, id) => n + Math.min(parseItem(id).q, 4), 0)
  const rule = picked.length > 0 ? rarityByScore(Math.max(5, score)) : null
  const elemCounts = new Map<Element, number>()
  picked.forEach(id => {
    const el = parseItem(id).base.replace('crystal_', '') as Element
    elemCounts.set(el, (elemCounts.get(el) ?? 0) + 1)
  })
  let topEls: Element[] = []
  if (picked.length > 0) {
    const maxN = Math.max(...elemCounts.values())
    topEls = [...elemCounts.entries()].filter(([, n]) => n === maxN).map(([e]) => e)
  }
  const crystalCount = (el: (typeof ELEMENT_LIST)[number]) =>
    Object.entries(state.inventory)
      .filter(([id]) => parseItem(id).base === `crystal_${el}`)
      .reduce((sum, [, v]) => sum + v, 0)
  const canSummon = ELEMENT_LIST.every(el => crystalCount(el) >= SUMMON_COST)

  return (
    <div className="space-y-3">
      {/* 孵化池 */}
      <section className="card p-4 sm:p-5">
        <h2 className="section-title">
          <Icon name="crucible" size={18} className="text-berry" />
          水晶孵化池
          <span className="pill-soft num ml-auto">{picked.length}/5 · {score} 分</span>
        </h2>
        <p className="caption mt-1.5">
          放入 5 颗水晶：数量最多的属性决定精灵属性（并列随机）；品质分越高，精灵越稀有。
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[168px_1fr]">
          {/* 法阵 */}
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border-hair border-line bg-paper"
            style={{ boxShadow: picked.length === 5 ? 'inset 0 0 0 8px rgba(211,95,123,0.10)' : 'inset 0 0 0 8px rgba(231,215,195,0.45)' }}>
            <div className="absolute inset-3 rounded-full border border-dashed border-line-strong/70" />
            <div className="flex w-[104px] flex-wrap justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map(i => {
                const id = picked[i]
                if (!id) {
                  return <span key={`empty-${i}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line-strong/70 text-micro text-inkfaint">·</span>
                }
                const el = parseItem(id).base.replace('crystal_', '') as Element
                return <Icon key={`${id}-${i}`} name="gem" size={26} style={{ color: ELEMENTS[el].color }} />
              })}
            </div>
            <span className="absolute -bottom-2 rounded-full border-hair border-line bg-paper2 px-2 py-0.5 text-micro font-semibold text-inksoft num">
              品质分 {score}
            </span>
          </div>

          {/* 水晶选择 */}
          <div>
            {crystalItems.length === 0 && <p className="caption">背包里还没有水晶，收获作物或打怪可以获得。</p>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {crystalItems.map(([id, n]) => {
                const { base, q } = parseItem(id)
                const el = base.replace('crystal_', '') as Element
                const cq = CRYSTAL_Q[Math.min(q, 4) - 1]
                const sel = pickedOf(id)
                return (
                  <div key={id}
                    className={`relative rounded-control border-hair p-2 text-center transition-colors ${sel > 0 ? 'border-berry bg-berry/10' : 'border-line bg-paper'}`}>
                    <button onClick={() => addOne(id)} disabled={n - sel <= 0 || picked.length >= 5}
                      className="w-full disabled:cursor-not-allowed">
                      <Icon name="gem" size={20} className="mx-auto" style={{ color: ELEMENTS[el].color }} />
                      <div className="mt-1 text-caption font-semibold text-ink">{itemName(id)}</div>
                      <div className="text-caption text-inksoft"><span className="num">×{n}</span> · {cq.name}</div>
                    </button>
                    {sel > 0 && (
                      <button onClick={() => removeOne(id)} aria-label="取消这颗"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-hair border-line bg-paper2 text-ink">
                        <Icon name="minus" size={11} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="micro mt-2">点水晶 +1 颗（同种可叠加），点右上角 − 取消。</p>
          </div>
        </div>

        {picked.length > 0 && rule && (
          <p className="caption mt-3">
            <Icon name="sparkle" size={13} className="mr-1 inline-block align-[-2px] text-inksoft" />
            预测：<b style={{ color: RARITIES[rule.rarity].color }}>{RARITIES[rule.rarity].name}</b> 精灵蛋 · 约 {fmtTime(state.sprites.length === 0 ? Math.min(rule.time, 10) : rule.time)} · 属性：
            {topEls.length === 1
              ? <span className="inline-flex items-center gap-1"><ElementDot el={topEls[0]} size={7} />{ELEMENTS[topEls[0]].name}系</span>
              : topEls.map(e => `${ELEMENTS[e].name}`).join(' / ') + '（并列随机）'}
          </p>
        )}
        <p className="micro mt-1">保底：史诗 {Math.min(state.hatchPity.sinceEpic, 10)}/10 次内必出 · 传说 {Math.min(state.hatchPity.sinceLegend, 50)}/50 次内必出</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => { incubate(picked); setPicked([]); sfx('crystal') }} disabled={picked.length !== 5} className="btn-primary">
            <Icon name="sparkle" size={15} />
            注入孵化池
          </button>
          {picked.length > 0 && (
            <button onClick={() => setPicked([])} className="btn-soft">
              <Icon name="minus" size={14} />
              清空
            </button>
          )}
        </div>

        {/* 稀有度对照 */}
        <div className="mt-4 rounded-control border-hair border-line bg-paper p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-ink">
            <Icon name="book" size={14} className="text-inksoft" />
            品质分对照
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['5 分', '普通幼体', '30 秒', RARITIES.common.color],
              ['6–10 分', '优质幼体', '2 分钟', RARITIES.fine.color],
              ['11–15 分', '特殊精灵', '8 分钟', RARITIES.rare.color],
              ['16–19 分', '史诗 · 特殊 + 天赋', '30 分钟', RARITIES.epic.color],
              ['20 分', '传说 · 限定精灵', '2 小时', RARITIES.legend.color],
            ].map(([score, name, time, color]) => (
              <span key={score} className="pill-soft gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="num">{score}</span>
                <b style={{ color }}>{name}</b>
                <span className="text-inkfaint">{time}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 限定传说召唤 */}
      <section className="card p-4 sm:p-5">
        <h2 className="section-title">
          <Icon name="sparkle" size={18} className="text-butter-deep" />
          传说召唤阵
          <span className="pill-soft ml-auto num">五系各 {SUMMON_COST} 枚</span>
        </h2>
        <p className="caption mt-1.5">
          集齐五系结晶各 {SUMMON_COST} 枚（任意品级，优先消耗低品级），随机召唤一只限定传说精灵：世界树苗 / 潮汐圣兽 / 朱雀 / 麒麟 / 星辉龙。
          召唤出的精灵会直接加入牧场。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ELEMENT_LIST.map(el => {
            const n = crystalCount(el)
            const ok = n >= SUMMON_COST
            return (
              <span key={el} className={`pill ${ok ? '' : 'opacity-60'}`}>
                <ElementDot el={el} size={7} />
                {ELEMENTS[el].name}
                <span className={`num ${ok ? 'text-sage-deep' : 'text-inkfaint'}`}>{n}/{SUMMON_COST}</span>
              </span>
            )
          })}
          <button onClick={() => { summonLimited(); sfx('crystal') }} disabled={!canSummon} className="btn-secondary ml-auto">
            <Icon name="sparkle" size={15} />
            召唤传说
          </button>
        </div>
      </section>

      {/* 精灵蛋 */}
      <section className="card p-4 sm:p-5">
        <h2 className="section-title">
          <Icon name="egg" size={18} className="text-inksoft" />
          孵化室
          <span className="pill-soft num ml-auto">{state.eggs.length} 颗</span>
        </h2>
        {state.eggs.length === 0 && <p className="caption mt-2">还没有精灵蛋，先去上面注入 5 颗水晶。</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {state.eggs.map(egg => {
            const ready = now >= egg.hatchAt
            const r = RARITIES[egg.rarity]
            return (
              <div key={egg.uid} className={`rounded-card border-hair p-3 text-center ${ready ? 'border-berry bg-berry/10' : 'border-line bg-paper'}`}>
                <Icon name="egg" size={30} className="mx-auto" style={{ color: ELEMENTS[egg.element].color }} />
                <div className="mt-1.5 flex items-center justify-center gap-1 text-micro text-inksoft">
                  <ElementDot el={egg.element} size={6} />
                  {ELEMENTS[egg.element].name}系
                </div>
                <div className="text-micro font-semibold" style={{ color: r.color }}>{r.name}</div>
                {ready ? (
                  <button onClick={() => { hatch(egg.uid); sfx('hatch') }} className="btn-primary btn-xs mt-2 w-full">
                    <Icon name="egg" size={13} />
                    敲开蛋壳
                  </button>
                ) : (
                  <div className="mt-2 flex items-center justify-center gap-1 text-micro text-inkfaint">
                    <Icon name="clock" size={12} />
                    {fmtRemain(egg.hatchAt - now)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
