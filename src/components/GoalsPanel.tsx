import { GOALS, rewardText } from '../game/goals'
import type { GameApi } from '../game/useGame'
import Icon from '../ui/Icon'

/** 图鉴页顶部的里程碑：进度全部从存档算，达成后点一下领奖励 */
export default function GoalsPanel({ game }: { game: GameApi }) {
  const { state, claimGoal } = game
  const claimed = new Set(state.goalsClaimed ?? [])
  const done = GOALS.filter(g => g.progress(state) >= g.target).length

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">
          <Icon name="sparkle" size={17} className="text-butter-deep" />
          里程碑
        </h2>
        <span className="pill-soft num">{done}/{GOALS.length} 达成 · 已领 {claimed.size}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {GOALS.map(g => {
          const p = Math.min(g.progress(state), g.target)
          const ok = p >= g.target
          const got = claimed.has(g.id)
          return (
            <div key={g.id} className={`rounded-control border-hair p-2.5 ${got ? 'border-line bg-paper2/70' : ok ? 'border-butter/60 bg-butter/[0.08]' : 'border-line bg-paper'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-caption font-bold text-ink">{g.name}</div>
                  <div className="micro mt-0.5">{g.desc}</div>
                </div>
                {got ? (
                  <span className="micro inline-flex shrink-0 items-center gap-0.5 text-sage-deep"><Icon name="shield" size={12} />已领</span>
                ) : ok ? (
                  <button onClick={() => claimGoal(g.id)} className="btn-primary btn-xs shrink-0">领取</button>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
                <div className={`h-full rounded-full ${ok ? 'bg-butter' : 'bg-sage'}`} style={{ width: `${Math.round((p / g.target) * 100)}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="micro num">{p}/{g.target}</span>
                <span className="micro text-inkfaint">奖励：{rewardText(g)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
