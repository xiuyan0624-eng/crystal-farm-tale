import { useEffect } from 'react'
import { ELEMENTS, SPECIES_MAP, type Element } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import { sfx } from '../game/audio'
import Icon from '../ui/Icon'

/** 进化演出：旧形态淡出 → 新形态亮起，盖住整个界面一次 */
export default function EvolveReveal({
  fromSpecies, toSpecies, element, onClose,
}: { fromSpecies: string; toSpecies: string; element: Element; onClose: () => void }) {
  const from = SPECIES_MAP[fromSpecies]
  const to = SPECIES_MAP[toSpecies]
  const el = ELEMENTS[element]
  const beforeArt = from ? spriteImage(from.id, from.element, from.stage) : ''
  const afterArt = to ? spriteImage(to.id, to.element, to.stage) : ''

  useEffect(() => {
    sfx('levelup')
    const t = window.setTimeout(onClose, 4600)
    return () => window.clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 px-4 backdrop-blur-[2px]" onClick={onClose}
      role="dialog" aria-modal="true" aria-label="进化">
      <div className="card relative w-full max-w-[420px] overflow-hidden px-6 py-7 text-center animate-[pop_.28s_ease-out]"
        onClick={e => e.stopPropagation()}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-80"
          style={{ background: `radial-gradient(60% 100% at 50% 0%, ${el.color}44, transparent 72%)` }} />
        {[...Array(10)].map((_, i) => (
          <span key={i} className="evolve-spark absolute h-1.5 w-1.5 rounded-full"
            style={{
              left: `${10 + i * 8}%`, top: `${18 + (i % 4) * 12}%`,
              background: i % 2 ? el.color : '#F6D98B',
              animationDelay: `${(i % 5) * 0.22}s`,
            }} aria-hidden />
        ))}

        <p className="micro text-inksoft">进化中……</p>

        <div className="relative mt-2 flex items-end justify-center gap-2">
          <div className="flex flex-col items-center opacity-45 blur-[0.6px]">
            {beforeArt && <img src={beforeArt} alt={from?.name ?? ''} className="h-24 w-24 object-contain" />}
            <span className="mt-1 text-[11px] text-inkfaint">{from?.name}</span>
          </div>
          <span className="mb-8 text-inkfaint" aria-hidden><Icon name="sparkle" size={18} /></span>
          <div className="flex flex-col items-center">
            {afterArt && <img src={afterArt} alt={to?.name ?? ''} className="h-32 w-32 object-contain animate-[pop_.4s_ease-out]" />}
            <span className="mt-1 text-caption font-bold text-ink">{to?.name}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="pill" style={{ color: el.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: el.color }} />
            {el.name}系
          </span>
          {to && <span className="pill-soft">{to.stage === 'ultimate' ? '究极体' : to.stage === 'complete' ? '完全体' : '成体'}</span>}
          {to?.lineName && <span className="pill-soft">{to.lineName}</span>}
        </div>
        {to?.skills[0] && (
          <p className="mt-2 text-caption text-inksoft">
            <b className="text-ink">{to.skills[0].name}</b>：{to.skills[0].desc}
          </p>
        )}

        <button onClick={onClose} className="btn-primary mt-4 w-full">收下新形态</button>
        <p className="micro mt-2">属性与体力都已按新形态重算</p>
      </div>
    </div>
  )
}
