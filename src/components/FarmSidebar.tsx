import { CROPS, ELEMENTS, ELEMENT_LIST, JOBS, SPECIES_MAP, itemName, parseItem } from '../game/data'
import { GOALS } from '../game/goals'
import { spriteImage } from '../game/spriteImages'
import type { GameApi } from '../game/useGame'
import Icon from '../ui/Icon'
import { ITEM_STICKERS } from './PixelWorld'

/** 农场页右栏：把「假玩家 / 世界频道」换成玩家真正要看的东西 */
export default function FarmSidebar({ game, onNavigate }: { game: GameApi; onNavigate: (tab: string) => void }) {
  const { state } = game

  // 水晶按属性汇总（含中/上/极品）
  const crystals = ELEMENT_LIST.map(el => {
    const n = Object.entries(state.inventory)
      .filter(([id, v]) => v > 0 && id.startsWith('crystal_') && parseItem(id).base === `crystal_${el}`)
      .reduce((sum, [, v]) => sum + v, 0)
    return { el, n }
  })

  const plots = state.plots
  const todo = [
    { icon: 'drop' as const, name: '待浇水', n: plots.filter(p => p.cropId && (p.waterCount ?? 0) < 3).length },
    { icon: 'basket' as const, name: '可收获', n: plots.filter(p => { const c = p.cropId ? CROPS.find(x => x.id === p.cropId) : null; return !!c && (Date.now() - p.plantedAt) / 1000 >= c.growTime }).length },
    { icon: 'leaf' as const, name: '空地', n: plots.filter(p => !p.cropId).length },
    { icon: 'bug' as const, name: '虫害', n: plots.filter(p => (p.pest ?? 0) > 0).length },
  ].filter(t => t.n > 0)

  // 种子与批量操作（原来是农场画面下方的一条，现在并进右栏）
  const seeds = Object.entries(state.inventory)
    .filter(([id, n]) => id.startsWith('seed_') && n > 0)
    .sort((a, b) => b[1] - a[1])
  const plantable = (seedId: string, kind: string) => {
    const c = CROPS.find(x => `seed_${x.id}` === seedId)
    return !!c && (!c.onlyKind || c.onlyKind === kind)
  }
  const waterNeed = plots.filter(p => p.cropId && (p.waterCount ?? 0) < 3).length
  const readyCount = plots.filter(p => {
    const c = p.cropId ? CROPS.find(x => x.id === p.cropId) : null
    return !!c && (Date.now() - p.plantedAt) / 1000 >= c.growTime
  }).length
  const emptyCount = plots.filter(p => !p.cropId).length
  const seedKinds = seeds.filter(([id]) => plantable(id, 'soil') || plantable(id, 'greenhouse') || plantable(id, 'pond')).length

  const crew = state.sprites.slice(0, 6)
  const goals = GOALS.map(g => ({ g, done: g.progress(state), canClaim: g.progress(state) >= g.target && !(state.goalsClaimed ?? []).includes(g.id) }))
    .filter(x => x.canClaim || x.done < x.g.target)
    .slice(0, 3)

  return (
    <div className="space-y-3">
      {/* 种子 & 操作 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="leaf" size={15} className="text-sage-deep" />
          种子 &amp; 操作
          <span className="ml-auto text-[10px] text-inkfaint">点种子→点地块播种</span>
        </h4>
        {seeds.length === 0 ? (
          <p className="micro text-inkfaint">没有种子，去下方「种子商店」买。</p>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {seeds.map(([id, n]) => (
              <button key={id} onClick={() => game.setSelectedSeed(game.selectedSeed === id ? null : id)}
                className={`chip w-full justify-start text-[11px] ${game.selectedSeed === id ? 'border-sage-deep bg-sage/15 text-sage-deep' : 'hover:bg-paper2'}`}>
                {ITEM_STICKERS[id.replace(/^seed_/, '')] ? <img src={ITEM_STICKERS[id.replace(/^seed_/, '')]} className="h-4 w-4 object-contain" alt="" /> : null}
                <span className="truncate">{itemName(id).replace('种子', '')}</span>
                <span className="num ml-auto text-inkfaint">×{n}</span>
              </button>
            ))}
          </div>
        )}
        {game.selectedSeed && (
          <p className="mt-1 text-[10px] text-sage-deep">已选 {itemName(game.selectedSeed)} —— 去点一块空地</p>
        )}
        <div className="mt-2 grid grid-cols-1 gap-1">
          <button onClick={() => { if (waterNeed > 0) game.waterAll() }} disabled={waterNeed === 0} className="btn-primary btn-xs w-full justify-center">
            <Icon name="drop" size={13} /> 一键浇水{waterNeed > 0 ? ` ${waterNeed}` : ''}
          </button>
          <button onClick={() => { if (readyCount > 0) game.harvestAll() }} disabled={readyCount === 0} className="btn-soft btn-xs w-full justify-center">
            <Icon name="basket" size={13} /> 一键收获{readyCount > 0 ? ` ${readyCount}` : ''}
          </button>
          <button onClick={() => game.replantAll()} disabled={emptyCount === 0 || seedKinds === 0} className="btn-soft btn-xs w-full justify-center">
            <Icon name="leaf" size={13} /> 一键补种{emptyCount > 0 ? ` ${emptyCount}` : ''}
          </button>
        </div>
      </section>

      {/* 农事待办 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="leaf" size={15} className="text-sage-deep" />
          农事待办
        </h4>
        {todo.length === 0 ? (
          <p className="micro text-inkfaint">地里没事：都浇过水、也没有熟透的作物。</p>
        ) : (
          <ul className="space-y-1">
            {todo.map(t => (
              <li key={t.name} className="flex items-center gap-1.5 text-micro text-inksoft">
                <Icon name={t.icon} size={13} className={t.name === '虫害' ? 'text-danger' : 'text-inkfaint'} />
                {t.name}
                <span className="num ml-auto font-bold text-ink">{t.n}</span>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => onNavigate('sprite')} className="btn-ghost btn-xs mt-2 w-full justify-center">
          派精灵去干活
          <Icon name="arrowUp" size={12} className="rotate-90" />
        </button>
      </section>

      {/* 水晶速览 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="gem" size={15} className="text-sage-deep" />
          水晶
          <button onClick={() => onNavigate('fusion')} className="ml-auto text-micro text-sage-deep hover:underline">去孵化</button>
        </h4>
        <div className="grid grid-cols-5 gap-1">
          {crystals.map(({ el, n }) => (
            <div key={el} className="flex flex-col items-center gap-0.5 rounded-control bg-paper2/70 py-1">
              <span className="h-2 w-2 rounded-full" style={{ background: ELEMENTS[el].color }} />
              <span className="num text-caption font-bold text-ink">{n}</span>
              <span className="text-[10px] text-inkfaint">{ELEMENTS[el].name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 精灵小队 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="sparkle" size={15} className="text-inksoft" />
          精灵小队
          <span className="ml-auto pill-soft num">{state.sprites.length}</span>
        </h4>
        {crew.length === 0 ? (
          <p className="micro text-inkfaint">还没有精灵，去孵化池敲一颗蛋。</p>
        ) : (
          <ul className="space-y-1.5">
            {crew.map(sp => {
              const species = SPECIES_MAP[sp.speciesId]
              const job = JOBS.find(j => j.id === sp.job)
              return (
                <li key={sp.id} className="flex items-center gap-2">
                  <img src={spriteImage(sp.speciesId, species.element, species.stage)} alt="" className="h-7 w-7 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className="truncate text-caption font-semibold text-ink">{sp.name}</span>
                      <span className="ml-auto num text-[10px] text-inkfaint">Lv.{sp.level}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="truncate text-[10px] text-inkfaint">{job ? job.name : '休息'}</span>
                      <span className="ml-auto h-1 w-12 overflow-hidden rounded-full bg-line/70">
                        <span className="block h-full rounded-full bg-sage" style={{ width: `${Math.max(0, Math.min(100, sp.stamina))}%` }} />
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <button onClick={() => onNavigate('sprite')} className="btn-ghost btn-xs mt-2 w-full justify-center">
          养成交给精灵
          <Icon name="arrowUp" size={12} className="rotate-90" />
        </button>
      </section>

      {/* 里程碑 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="coin" size={15} className="text-butter-deep" />
          里程碑
          <button onClick={() => onNavigate('dex')} className="ml-auto text-micro text-sage-deep hover:underline">全部</button>
        </h4>
        <ul className="space-y-2">
          {goals.map(({ g, done, canClaim }) => (
            <li key={g.id}>
              <div className="flex items-baseline gap-1">
                <span className="truncate text-caption text-ink">{g.name}</span>
                <span className="ml-auto num text-[10px] text-inkfaint">{Math.min(done, g.target)}/{g.target}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-line/70">
                  <span className="block h-full rounded-full bg-butter" style={{ width: `${Math.min(100, (done / g.target) * 100)}%` }} />
                </span>
                {canClaim ? (
                  <button onClick={() => game.claimGoal(g.id)} className="btn-primary btn-xs">领取</button>
                ) : (
                  <span className="w-8 text-[10px] text-inkfaint">进行中</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 背包提示 */}
      <section className="card p-3">
        <div className="flex items-center gap-1.5 text-micro text-inksoft">
          <Icon name="basket" size={14} className="text-inkfaint" />
          背包里有 {Object.values(state.inventory).filter(n => n > 0).length} 种东西
          <span className="ml-auto text-inkfaint">在下方查看</span>
        </div>
        <p className="mt-1 text-[10px] text-inkfaint">
          {Object.entries(state.inventory).filter(([, n]) => n > 0).slice(0, 4).map(([id]) => itemName(id)).join(' · ') || '还是空的'}
        </p>
      </section>
    </div>
  )
}
