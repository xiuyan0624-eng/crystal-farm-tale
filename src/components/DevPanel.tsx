import type { GameApi } from '../game/useGame'
import { endGame, fullDex, lateGame, midGame } from '../game/devPresets'
import { SPECIES, SPECIES_MAP, calcStats } from '../game/data'
import Icon from '../ui/Icon'
import { sfx } from '../game/audio'

interface Props {
  api: GameApi
  open: boolean
  onClose: () => void
}

export default function DevPanel({ api, open, onClose }: Props) {
  if (!open) return null
  const { state, devSet } = api

  const run = (fn: () => void) => { sfx('click'); fn() }

  const addCoins = () => devSet(s => ({ ...s, coins: s.coins + 5000 }))
  const addCrystals = () => devSet(s => {
    const inv = { ...s.inventory }
    for (const el of ['wood', 'fire', 'water', 'earth', 'light']) inv[`crystal_${el}`] = (inv[`crystal_${el}`] ?? 0) + 20
    inv.fert = (inv.fert ?? 0) + 20
    inv.fert_rare = (inv.fert_rare ?? 0) + 8
    return { ...s, inventory: inv }
  })
  const ripen = () => devSet(s => ({
    ...s,
    plots: s.plots.map(p => (p.cropId ? { ...p, plantedAt: Date.now() - 900_000, pest: 0 } : p)),
  }))
  const hatchNow = () => devSet(s => ({ ...s, eggs: s.eggs.map(e => ({ ...e, hatchAt: Date.now() - 1000 })) }))
  const farmLv = () => devSet(s => ({ ...s, farmLevel: s.farmLevel + 1, farmExp: 0 }))
  const levelSprites = () => devSet(s => ({
    ...s,
    sprites: s.sprites.map(sp => {
      const species = SPECIES_MAP[sp.speciesId]
      if (!species) return sp
      const level = Math.min(60, sp.level + 10)
      const stats = calcStats(species, level, sp.stats)
      return { ...sp, level, ...stats, hp: stats.maxHp }
    }),
  }))

  const presets = [
    { name: '中期存档', hint: 'Lv6 · 8 块地 · 4 只动物 · 5 只精灵（各带工种）', fn: () => { devSet(midGame); onClose() } },
    { name: '后期存档', hint: 'Lv14 · 12 块地大半成熟 · 满图鉴 · 8 只高阶精灵', fn: () => { devSet(lateGame); onClose() } },
    { name: '只解锁图鉴', hint: '保留当前进度，图鉴直接 60/60', fn: () => { devSet(fullDex); onClose() } },
    { name: '终盘存档', hint: 'Lv24 · 24 块地（含温室/池塘）· 装备齐 · 一只星辰觉醒', fn: () => { devSet(endGame); onClose() } },
  ]

  const cheats = [
    { name: '+5000 金币', fn: addCoins },
    { name: '各系水晶 +20', fn: addCrystals },
    { name: '地块全部催熟', fn: ripen },
    { name: '精灵蛋立即孵化', fn: hatchNow },
    { name: '农场等级 +1', fn: farmLv },
    { name: '全体精灵 +10 级', fn: levelSprites },
    { name: '补满肥料', fn: () => devSet(s => ({ ...s, inventory: { ...s.inventory, fert: 99, fert_rare: 20 } })) },
    { name: '满图鉴（60/60）', fn: () => devSet(fullDex) },
  ]

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4" role="dialog" aria-modal="true" aria-label="测试模式">
      <div className="card w-[min(420px,100%)] max-h-[86vh] overflow-y-auto p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="section-title">
              <Icon name="bug" size={18} className="text-berry" />
              测试模式
            </h3>
            <p className="micro mt-1">只改这台机器浏览器里的存档，导出包默认还是从零开始。</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-xs" aria-label="关闭">
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="mt-3 space-y-1.5">
          {presets.map(p => (
            <button key={p.name} onClick={() => run(p.fn)}
              className="flex w-full items-center gap-2.5 rounded-control border-hair border-line bg-paper px-3 py-2.5 text-left hover:bg-paper2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-berry/10 text-berry">
                <Icon name="sparkle" size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption font-bold text-ink">{p.name}</span>
                <span className="block text-micro text-inksoft">{p.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {cheats.map(c => (
            <button key={c.name} onClick={() => run(c.fn)} className="btn-soft btn-xs justify-start">
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-hair border-line pt-3">
          <div className="micro mb-1.5">场景布局（换完刷新一次）</div>
          <div className="flex gap-1.5">
            {(['a', 'b', 'c'] as const).map(id => (
              <button key={id} onClick={() => {
                sfx('click')
                try { localStorage.setItem('crystal-farm-layout', id) } catch { /* 预览 iframe 里没有存储权限 */ }
                location.reload()
              }} className="btn-soft btn-xs flex-1">
                {{ a: 'A 分区', b: 'B 围合院', c: 'C 斜向' }[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-hair border-line pt-3">
          <span className="micro">
            当前：Lv.{state.farmLevel} · {state.coins} 金币 · {state.sprites.length} 精灵 · 图鉴 {state.dex.length}/{SPECIES.length}
          </span>
          <button onClick={() => { if (confirm('清空存档，回到新手开局？')) { sfx('click'); api.resetGame(); onClose() } }}
            className="btn-ghost btn-xs">
            <Icon name="refresh" size={13} />
            回到新手
          </button>
        </div>
      </div>
    </div>
  )
}
