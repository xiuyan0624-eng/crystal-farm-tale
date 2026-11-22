import { ELEMENTS, RARITIES, SPECIES_MAP, type Rarity, type Sprite } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import { sfx } from '../game/audio'
import Icon from '../ui/Icon'

/** 破壳画面：孵化出精灵时盖住整个界面，把新精灵亮出来 */
export default function HatchReveal({ sprite, tier, onClose }: { sprite: Sprite; tier?: Rarity | null; onClose: () => void }) {
  const species = SPECIES_MAP[sprite.speciesId]
  const el = ELEMENTS[species.element]
  const rarity = RARITIES[species.rarity]
  const art = spriteImage(species.id, species.element, species.stage)
  const big = species.rarity === 'legend' || species.rarity === 'epic'
  const RANK: Rarity[] = ['common', 'fine', 'rare', 'epic', 'legend']
  const fxTier = RANK.indexOf(tier ?? species.rarity) >= RANK.indexOf(species.rarity) ? (tier ?? species.rarity) : species.rarity

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/25 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="card relative w-full max-w-[380px] overflow-hidden px-6 py-7 text-center animate-[pop_.28s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* 元素色柔光 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-70"
          style={{ background: `radial-gradient(60% 100% at 50% 0%, ${el.color}33, transparent 70%)` }}
        />
        {/* 稀有度专属光效 */}
        {fxTier === 'legend' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {[...Array(16)].map((_, i) => (
              <span
                key={i}
                className="hatch-rain absolute top-0 h-3 w-[2px] rounded-full"
                style={{
                  left: `${4 + i * 6}%`,
                  animationDelay: `${(i % 8) * 0.16}s`,
                  background: i % 2 ? '#E7B453' : '#F6D98B',
                }}
              />
            ))}
          </div>
        )}
        {fxTier === 'epic' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="hatch-beam absolute left-1/2 top-0 h-full w-24 -translate-x-1/2"
              style={{ background: `linear-gradient(180deg, ${el.color}55, transparent 78%)` }}
            />
            <div
              className="hatch-beam absolute left-1/2 top-0 h-full w-8 -translate-x-1/2"
              style={{ background: 'linear-gradient(180deg, #FFF6DDaa, transparent 70%)', animationDelay: '.18s' }}
            />
          </div>
        )}
        {fxTier === 'rare' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {[0, 1].map(i => (
              <span
                key={i}
                className="hatch-ring absolute left-1/2 top-[42%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ borderColor: `${el.color}77`, animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </div>
        )}

        {/* 闪光 */}
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="hatch-spark absolute text-sm"
            style={{
              left: `${12 + (i * 13)}%`,
              top: `${18 + ((i % 3) * 22)}%`,
              animationDelay: `${i * 0.18}s`,
              color: i % 2 ? '#E7B453' : el.color,
            }}
          >✦</span>
        ))}

        <div className="relative">
          <div className="micro text-inksoft">蛋壳裂开了…</div>
          <div className="relative mx-auto mt-2 grid h-44 w-44 place-items-center">
            <div
              className="absolute inset-0 rounded-full opacity-60 blur-xl"
              style={{ background: `radial-gradient(circle, ${el.color}55, transparent 70%)` }}
            />
            <img src={art} alt={species.name} className={`relative h-40 w-40 object-contain ${big ? 'star-art' : ''}`} />
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="pill-soft" style={{ color: rarity.color }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: rarity.color }} />
              {rarity.name}
            </span>
            <span className="pill-soft">{el.icon}{el.name}系</span>
            <span className="pill-soft">{species.line === 'attack' ? '攻击线' : species.line === 'support' ? '功能线' : species.line === 'special' ? '特殊' : species.line === 'limited' ? '限定' : '幼体'}</span>
          </div>
          <h3 className="mt-2 text-title font-bold text-ink">{species.name}</h3>
          <p className="caption mt-1 min-h-[2.4em]">{species.desc}</p>

          <button
            className="btn-primary mt-4 w-full"
            onClick={() => { sfx('click'); onClose() }}
          >
            <Icon name="paw" size={16} />收下它
          </button>
          <div className="micro mt-2">已加入「精灵养成」，可以派它去干活了</div>
        </div>
      </div>
    </div>
  )
}
