import { useEffect } from 'react'
import { ELEMENTS, SPECIES_MAP } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import { sfx } from '../game/audio'

/**
 * 传说降临：限定传说召唤成功时的全屏演出。
 * 光柱 + 旋转符文环 + 元素粒子 + 逐字标题，比破壳更强的一档。
 */
export default function SummonReveal({
  speciesId,
  element,
  onClose,
}: {
  speciesId: string
  element: keyof typeof ELEMENTS
  onClose: () => void
}) {
  const species = SPECIES_MAP[speciesId]
  const el = ELEMENTS[element] ?? ELEMENTS[species.element]
  const art = spriteImage(species.id, species.element, species.stage)

  useEffect(() => {
    sfx('crystal')
    const t = setTimeout(() => sfx('win'), 420)
    const auto = setTimeout(onClose, 6200)
    return () => { clearTimeout(t); clearTimeout(auto) }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#1b130d]/75 px-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="传说降临"
    >
      {/* 背景：旋转光芒 */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
        <div className="absolute inset-0" style={{ background: `radial-gradient(46% 42% at 50% 42%, ${el.color}33, transparent 72%)` }} />
        <div
          className="summon-rays h-[900px] w-[900px]"
          style={{
            background: `repeating-conic-gradient(from 0deg at 50% 50%, ${el.color}f2 0deg 2.6deg, ${el.color}00 2.6deg 24deg)`,
            maskImage: 'radial-gradient(circle at 50% 50%, #000 12%, rgba(0,0,0,.75) 42%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 12%, rgba(0,0,0,.75) 42%, transparent 78%)',
          }}
        />
      </div>
      {/* 符文环 */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
        <div
          className="summon-halo h-[420px] w-[420px] rounded-full"
          style={{ background: `radial-gradient(circle at 50% 50%, #FFF2C488, ${el.color}33 45%, transparent 70%)` }}
        />
        <div className="summon-ring h-[440px] w-[440px] rounded-full border-[3px]" style={{ borderColor: `${el.color}cc`, boxShadow: `0 0 46px ${el.color}88, 0 0 70px ${el.color}44 inset` }} />
        <div className="summon-ring-rev absolute h-[330px] w-[330px] rounded-full border-2 border-dashed" style={{ borderColor: `${el.color}dd` }} />
      </div>
      {/* 开场白闪 */}
      <div className="summon-flash pointer-events-none absolute inset-0 bg-[#FFF8E4]" aria-hidden />
      {/* 上升粒子 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[...Array(22)].map((_, i) => (
          <span
            key={i}
            className="summon-spark absolute bottom-10 h-2 w-2 rounded-full"
            style={{
              left: `${8 + (i * 3.9) % 84}%`,
              background: i % 3 === 0 ? '#FFF3D0' : el.color,
              animationDelay: `${(i % 9) * 0.28}s`,
              animationDuration: `${2.2 + (i % 5) * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-[460px] flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <div className="mb-1 text-[13px] tracking-[0.5em] text-[#FFF3D0]/80">传说降临</div>
        <div className="summon-sprite relative">
          <img src={art} alt={species.name} className="h-[290px] w-[290px] object-contain drop-shadow-[0_0_28px_rgba(255,226,150,0.55)]" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full px-2 py-[2px] text-[11px] font-semibold" style={{ background: '#E7B453', color: '#5A4335' }}>传说</span>
          <span className="rounded-full px-2 py-[2px] text-[11px] font-semibold" style={{ background: `${el.color}22`, color: '#5A4335' }}>{el.name}系</span>
          <span className="rounded-full px-2 py-[2px] text-[11px] font-semibold" style={{ background: '#F1E9D8', color: '#5A4335' }}>限定</span>
        </div>
        <h2 className="summon-title mt-2 text-[30px] font-bold tracking-wide text-[#FFFDF6] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
          {species.name}
        </h2>
        <p className="mt-1 text-[13px] text-[#FFF6E2]/85">{species.desc}</p>
        <button
          onClick={onClose}
          className="mt-5 rounded-full px-6 py-2 text-sm font-semibold shadow-lg"
          style={{ background: '#FFFDF8', color: '#5A4335' }}
        >
          收下传说
        </button>
        <div className="mt-2 text-[11px] text-[#FFF6E2]/60">已加入「精灵养成」，可派它去干活</div>
      </div>
    </div>
  )
}
