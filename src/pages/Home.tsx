import { ownerImage } from '../game/ownerArt'
import { useEffect, useState } from 'react'
import { useGame } from '../game/useGame'
import FusionPanel from '../components/FusionPanel'
import SpritePanel from '../components/SpritePanel'
import BattlePanel, { type BattleStatus } from '../components/BattlePanel'
import DexPanel from '../components/DexPanel'
import OwnerPanel from '../components/OwnerPanel'
import FarmSidebar from '../components/FarmSidebar'
import MmoPanel from '../components/MmoPanel'
import PixelWorld from '../components/PixelWorld'
import DevPanel from '../components/DevPanel'
import HatchReveal from '../components/HatchReveal'
import EvolveReveal from '../components/EvolveReveal'
import SummonReveal from '../components/SummonReveal'
import { ELEMENT_LIST, ELEMENTS } from '../game/data'
import Icon, { type IconName } from '../ui/Icon'
import { getBgmStyle, initAudio, isMuted, setBgmStyle, sfx, startBgm, toggleMuted } from '../game/audio'
import girlUrl from '../assets/sticker/girl.png'
import boyUrl from '../assets/sticker/boy.png'

const TABS: { id: string; name: string; icon: IconName; comp: React.ComponentType<{ game: ReturnType<typeof useGame> }> }[] = [
  { id: 'world', name: '农场世界', icon: 'farm', comp: PixelWorld },
  { id: 'fusion', name: '孵化池', icon: 'crucible', comp: FusionPanel },
  { id: 'sprite', name: '精灵养成', icon: 'paw', comp: SpritePanel },
  { id: 'dex', name: '精灵图鉴', icon: 'book', comp: DexPanel },
  { id: 'owner', name: '农场主', icon: 'users', comp: OwnerPanel },
  { id: 'battle', name: '战斗', icon: 'swords', comp: BattlePanel },
]

export default function Home() {
  const game = useGame()
  const { state, toasts } = game
  const [tab, setTab] = useState<string>('world')
  const [muted, setMuted] = useState<boolean>(isMuted())
  const [bgmStyle, setStyle] = useState(getBgmStyle())
  const [devOpen, setDevOpen] = useState(false)
  const [battleStatus, setBattleStatus] = useState<BattleStatus | null>(null)

  // 浏览器只允许在用户手势之后出声：第一次点/按就解锁音效并起 BGM
  useEffect(() => {
    const unlock = () => {
      initAudio()
      startBgm()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  const Active = TABS.find(t => t.id === tab)!.comp

  const crystalTotal = Object.entries(state.inventory)
    .filter(([id]) => id.startsWith('crystal_'))
    .reduce((n, [, v]) => n + v, 0)

  // 初次进入：选择主角
  if (!state.gender) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card w-full max-w-lg p-8 text-center">
          <div className="mb-4 flex justify-center text-berry">
            <Icon name="farm" size={40} />
          </div>
          <h1 className="text-title font-bold text-ink">晶灵农场物语</h1>
          <p className="caption mt-2 mb-7">先选一位小农夫，之后农场里只有你；衣服随时可以在「农场主」页换。</p>
          <div className="grid grid-cols-2 gap-4">
            {([
              { id: 'girl' as const, url: ownerImage('girl', 'classic') ?? girlUrl, name: '小莓', desc: '热爱草莓的元气女孩' },
              { id: 'boy' as const, url: ownerImage('boy', 'classic') ?? boyUrl, name: '小禾', desc: '戴着草帽的勤劳男孩' },
            ]).map(hero => (
              <button key={hero.id} onClick={() => game.setGender(hero.id)}
                className="card group p-4 text-center transition-transform duration-150 hover:-translate-y-0.5 hover:border-line-strong active:translate-y-0">
                <img src={hero.url} alt={hero.name} className="mx-auto h-36 object-contain" />
                <div className="mt-2 text-section font-bold text-ink">{hero.name}</div>
                <div className="caption">{hero.desc}</div>
              </button>
            ))}
          </div>
          <p className="micro mt-6">选择后可以随时「重开」</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-ink">
      {/* 顶栏：一条墨线，一种强调色 */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="sticker-tile text-berry"><Icon name="farm" size={20} /></span>
            <div className="min-w-0">
              <h1 className="truncate text-section font-bold leading-tight text-ink">晶灵农场物语</h1>
              <p className="caption -mt-0.5 hidden sm:block">种田 · 孵化 · 养成 · 战斗</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {battleStatus && tab !== 'battle' && (
              <button onClick={() => { setTab('battle'); sfx('click') }}
                className="pill border-berry/40 bg-berry/5 hover:bg-berry/10"
                title="点回战斗页">
                <Icon name="swords" size={14} className="text-berry-deep" />
                <span className="text-berry-deep">{battleStatus.auto ? '自动战斗中' : '战斗待操作'}</span>
                <span className="hidden max-w-[9rem] truncate text-inksoft sm:inline">{battleStatus.enemy}</span>
                <span className="h-1.5 w-10 overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full bg-berry-deep"
                    style={{ width: `${Math.max(0, Math.round((battleStatus.hp / Math.max(1, battleStatus.maxHp)) * 100))}%` }} />
                </span>
              </button>
            )}
            <span className="pill" title="农场等级">
              <Icon name="leaf" size={14} className="text-sage-deep" />
              <span className="stat-value">Lv.{state.farmLevel}</span>
            </span>
            <span className="pill" title="金币">
              <Icon name="coin" size={14} className="text-butter-deep" />
              <span className="stat-value">{state.coins}</span>
            </span>
            <span className="pill" title="结晶总数">
              <Icon name="gem" size={14} className="text-berry" />
              <span className="stat-value">{crystalTotal}</span>
            </span>
            <span className="pill" title="精灵数量">
              <Icon name="egg" size={14} className="text-inksoft" />
              <span className="stat-value">{state.sprites.length}</span>
            </span>
            <button
              onClick={() => { setMuted(toggleMuted()); sfx('click') }}
              className="btn-ghost btn-xs" title={muted ? '开启声音' : '静音'}
              aria-label={muted ? '开启声音' : '静音'}>
              <Icon name={muted ? 'mute' : 'volume'} size={14} />
              <span className="hidden sm:inline">{muted ? '静音' : '声音'}</span>
            </button>
            <button
              onClick={() => { setStyle(setBgmStyle(bgmStyle === 'box' ? '8bit' : 'box')); sfx('click') }}
              className="btn-ghost btn-xs" title={bgmStyle === 'box' ? '背景音乐：音乐盒（点切换 8bit）' : '背景音乐：8bit 芯片（点切换音乐盒）'}
              aria-label="切换背景音乐风格">
              <Icon name="volume" size={14} />
              <span className="hidden sm:inline">{bgmStyle === 'box' ? '音乐盒' : '8bit'}</span>
            </button>
            <button
              onClick={() => { setDevOpen(true); sfx('click') }}
              className="btn-ghost btn-xs" title="测试模式：一键跳到中期/后期存档"
              aria-label="测试模式">
              <Icon name="bug" size={14} />
              <span className="hidden sm:inline">测试</span>
            </button>
            <button onClick={() => { if (confirm('确定要重新开始吗？当前进度将被清空！')) game.resetGame() }}
              className="btn-ghost btn-xs" title="重新开始">
              <Icon name="refresh" size={13} />
              重开
            </button>
          </div>
        </div>

        {/* 页签：图标 + 文字，同一套胶囊 */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); sfx('click') }}
              className={`tab ${tab === t.id ? 'tab-active' : ''}`}>
              <Icon name={t.icon} size={16} />
              {t.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-2 py-3 sm:px-5 sm:py-4 lg:grid-cols-[1fr_276px]">
        <div className="min-w-0">
          {tab !== 'battle' && <Active game={game} />}
          {/* 战斗面板一直挂着：切去别的页签时战斗（自动模式）继续在后台跑 */}
          <div className={tab === 'battle' ? '' : 'hidden'}>
            <BattlePanel game={game} active={tab === 'battle'} onStatus={setBattleStatus} />
          </div>
        </div>
        <aside className="hidden lg:block">
          {tab === 'battle'
            ? <MmoPanel game={game} />
            : <FarmSidebar game={game} onNavigate={t => { setTab(t); sfx('click') }} />}
        </aside>
      </main>

      <div className="mx-auto max-w-7xl px-2 pb-2 sm:px-5 lg:hidden">
        <details className="card px-3 py-2" open>
          <summary className="flex cursor-pointer select-none items-center gap-1.5 text-caption font-semibold text-inksoft">
            <Icon name="leaf" size={15} />
            农事待办 / 水晶 / 小队
          </summary>
          <div className="mt-3">
            {tab === 'battle'
              ? <MmoPanel game={game} />
              : <FarmSidebar game={game} onNavigate={t => { setTab(t); sfx('click') }} />}
          </div>
        </details>
      </div>

      <footer className="mx-auto max-w-7xl px-3 pb-6 sm:px-5">
        <div className="card flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3">
          <p className="micro inline-flex items-center gap-1.5">
            <Icon name="gem" size={13} className="text-inkfaint" />
            元素图例
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {ELEMENT_LIST.map(el => (
              <span key={el} className="pill-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: ELEMENTS[el].color, filter: 'saturate(0.85)' }} />
                {ELEMENTS[el].name}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <DevPanel api={game} open={devOpen} onClose={() => setDevOpen(false)} />
      {(() => {
        const hatched = state.lastHatch ? state.sprites.find(sp => sp.id === state.lastHatch) : undefined
        return hatched ? <HatchReveal sprite={hatched} tier={state.lastHatchRarity} onClose={game.dismissHatch} /> : null
      })()}
      {state.lastSummon && (
        <SummonReveal
          speciesId={state.lastSummon.speciesId}
          element={state.lastSummon.element}
          onClose={game.dismissSummon}
        />
      )}
      {state.lastEvolve && (
        <EvolveReveal
          fromSpecies={state.lastEvolve.fromSpecies}
          toSpecies={state.lastEvolve.toSpecies}
          element={state.lastEvolve.element}
          onClose={game.dismissEvolve}
        />
      )}

      {/* 通知：纸卡 + 左强调条 */}
      <div className="pointer-events-none fixed bottom-24 right-4 z-30 flex w-[min(300px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.slice(-2).map(t => (
          <div key={t.id} className="card-float flex items-start gap-2 border-l-4 border-l-sage px-3 py-2">
            <Icon name="sparkle" size={15} className="mt-0.5 text-sage-deep" />
            <span className="text-caption text-ink">{t.text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
