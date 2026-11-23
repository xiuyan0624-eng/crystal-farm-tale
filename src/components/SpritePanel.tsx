import { useState } from 'react'
import { ANIMALS, CROPS, ELEMENTS, EVOLVE_LEVEL, JOBS, RARITIES, SPECIES_MAP, STAGES, STAR_LEVEL, STAR_SCALE_COST, STAR_SHARD_COST, cropVariants, expForLevel, itemIcon, itemName, jobEff, type FeedStat, type Sprite } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import type { GameApi } from '../game/useGame'
import Icon, { type IconName } from '../ui/Icon'
import { sfx } from '../game/audio'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  )
}

const STAT_META: Record<FeedStat, { name: string; color: string }> = {
  nature: { name: '自然', color: '#7C9B64' },
  vigor: { name: '活力', color: '#C9922F' },
  mana: { name: '灵力', color: '#D35F7B' },
}

/** 农场工作 → 统一图标 */
const JOB_ICON: Record<string, IconName> = {
  water: 'drop', fertilize: 'fert', harvest: 'basket', pest: 'bug', feed: 'feed', mine: 'gem', guard: 'pail',
}

function SpriteCard({ sprite, game }: { sprite: Sprite; game: GameApi }) {
  const { state, feedSprite, renameSprite, awakenStar } = game
  const [editing, setEditing] = useState(false)
  const [expand, setExpand] = useState(false)
  const [name, setName] = useState(sprite.name)
  const species = SPECIES_MAP[sprite.speciesId]
  const el = ELEMENTS[sprite.element]
  const rarity = RARITIES[species.rarity]
  const total = sprite.stats.nature + sprite.stats.vigor + sprite.stats.mana
  const dom = (Object.entries(sprite.stats) as [FeedStat, number][]).sort((a, b) => b[1] - a[1])[0]

  // 进化信息
  let evoInfo = ''
  if (species.line === 'baby' && species.evoAttack) {
    const atkSp = SPECIES_MAP[species.evoAttack]
    const supSp = SPECIES_MAP[species.evoSupport!]
    const predict = total > 0 && dom[0] === 'vigor' ? atkSp : total > 0 ? supSp : null
    evoInfo = predict
      ? `Lv.${EVOLVE_LEVEL.adult} 进化为「${predict.name}」（${predict.lineName}）`
      : `Lv.${EVOLVE_LEVEL.adult} 进化：🥚活力→${atkSp.lineName} / 🥕🌿💎→${supSp.lineName}`
  } else if (species.evolvesTo) {
    const ns = SPECIES_MAP[species.evolvesTo]
    const nextLv = species.stage === 'adult' ? EVOLVE_LEVEL.complete : EVOLVE_LEVEL.ultimate
    evoInfo = `Lv.${nextLv} 进化为「${ns.name}」`
  } else if (species.line === 'limited') {
    evoInfo = '限定传说精灵，不会进化'
  } else if (species.line === 'special') {
    evoInfo = '特殊精灵，不会进化'
  }

  const feedGroups = [
    {
      label: '🥕 蔬菜投喂（自然+）', stat: 'nature' as FeedStat,
      items: CROPS.flatMap(c => cropVariants(state.inventory, c.id).map(v => v.id)),
    },
    {
      label: '🥚 蛋奶投喂（活力+）→ 攻击线', stat: 'vigor' as FeedStat,
      items: ANIMALS.flatMap(a => cropVariants(state.inventory, a.produceId).map(v => v.id)),
    },
    {
      label: '💎 结晶投喂（灵力+）', stat: 'mana' as FeedStat,
      items: ['crystal_wood', 'crystal_fire', 'crystal_water', 'crystal_earth', 'crystal_light']
        .flatMap(b => cropVariants(state.inventory, b).map(v => v.id)),
    },
  ]

  const img = SPRITE_IMG(sprite)

  /** 投喂 / 进化后的物品按钮，全站同一套 chip。 */
  const feedChip = (id: string) => {
    const n = state.inventory[id] ?? 0
    const el = id.startsWith('crystal_') ? (id.replace(/crystal_/, '').replace(/_q\d+$/, '') as keyof typeof ELEMENTS) : null
    return (
      <button key={id} onClick={() => { feedSprite(sprite.id, id); sfx('feed') }} disabled={n === 0} className="chip hover:bg-paper2">
        {el
          ? <Icon name="gem" size={14} style={{ color: ELEMENTS[el].color }} />
          : <span className="text-base leading-none">{itemIcon(id)}</span>}
        {itemName(id)}
        <span className="num text-inkfaint">×{n}</span>
      </button>
    )
  }

  const rarityCls = species.rarity === 'legend' ? 'card-rar-legend rar-shine' : species.rarity === 'epic' ? 'card-rar-epic' : ''
  return (
    <article className={`card relative overflow-hidden p-4 ${rarityCls}`}>
      {species.rarity === 'legend' && <span className="rar-badge rar-badge-legend">传说</span>}
      {species.rarity === 'epic' && <span className="rar-badge rar-badge-epic">史诗</span>}
      {/* 头部：立绘 / 名字 / 稀有度 / 三维 */}
      <div className={`flex items-start gap-3 ${species.rarity === 'legend' || species.rarity === 'epic' ? 'pr-10' : ''}`}>
        <span className="sticker-tile-lg shrink-0">
          {img
            ? <img src={img} className={`h-[50px] w-[50px] object-contain ${sprite.star ? 'star-art' : ''}`} alt={species.name} />
            : <span className="text-2xl">{species.icon}</span>}
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input value={name} onChange={e => setName(e.target.value)} maxLength={8} aria-label="精灵昵称"
                className="field w-28" />
              <button onClick={() => { renameSprite(sprite.id, name); setEditing(false) }} className="btn-primary btn-xs">保存</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-section font-bold text-ink">{sprite.name}</span>
              <button onClick={() => { setName(sprite.name); setEditing(true) }} aria-label="改名"
                className="text-inkfaint hover:text-inksoft" title="改名">
                <Icon name="edit" size={13} />
              </button>
              <span className="pill-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: rarity.color }} />
                {rarity.name}
              </span>
              {sprite.star && (
                <span className="pill-soft text-butter-deep"><Icon name="sparkle" size={12} />星辰</span>
              )}
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-inksoft">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: el.color }} />
              {el.name}系
            </span>
            <span>{STAGES[species.stage].name}</span>
            <span className="num">Lv.{sprite.level}</span>
            {species.lineName && <span className="text-inkfaint">{species.lineName}</span>}
          </div>
          <p className="micro mt-0.5">
            {species.name !== sprite.name && <>物种：{species.name} · </>}
            {evoInfo}
          </p>
        </div>

        <dl className="shrink-0 space-y-0.5 text-right text-micro text-inksoft">
          <div><dt className="inline">生命 </dt><dd className="num inline text-ink">{Math.round(sprite.hp)}/{sprite.maxHp}</dd></div>
          <div><dt className="inline">攻击 </dt><dd className="num inline text-ink">{sprite.atk}</dd></div>
          <div><dt className="inline">防御 </dt><dd className="num inline text-ink">{sprite.def}</dd></div>
          <div><dt className="inline">速度 </dt><dd className="num inline text-ink">{sprite.spd}</dd></div>
        </dl>
      </div>

      {/* 描述 / 特长 / 技能（默认折叠，点「详情」展开） */}
      <div className={`mt-2.5 space-y-1 border-t border-line/60 pt-2.5 text-caption text-inksoft ${expand ? '' : 'hidden'}`}>
        <p className="flex items-start gap-1.5">
          <Icon name="book" size={13} className="mt-0.5 text-inkfaint" />
          {species.desc}
        </p>
        {species.farm && (
          <p className="flex items-start gap-1.5">
            <Icon name="leaf" size={13} className="mt-0.5 text-sage-deep" />
            农场特长：{species.farm}
          </p>
        )}
        {species.passive && (
          <p className="flex items-start gap-1.5">
            <Icon name="sparkle" size={13} className="mt-0.5 text-butter-deep" />
            被动：{species.passive}
          </p>
        )}
        {species.skills.map(sk => (
          <p key={sk.name} className="flex items-start gap-1.5">
            <Icon name={sk.kind === 'heal' ? 'sparkle' : 'swords'} size={13} className={`mt-0.5 ${sk.kind === 'heal' ? 'text-sage-deep' : 'text-berry'}`} />
            <span><b className="text-ink">{sk.name}</b>：{sk.desc}</span>
          </p>
        ))}
      </div>

      {/* 经验 / 体力（一行两颗细条） */}
      <div className="mt-2.5 flex items-center gap-3 text-micro text-inksoft">
        <span className="flex flex-1 items-center gap-1.5">
          <span className="shrink-0">经验</span>
          <Bar value={sprite.exp} max={expForLevel(sprite.level)} color="#E7B453" />
        </span>
        <span className="flex flex-1 items-center gap-1.5">
          <span className="shrink-0">体力</span>
          <Bar value={Math.round(sprite.stamina)} max={100} color={sprite.stamina > 30 ? '#7C9B64' : '#C05248'} />
        </span>
        <button onClick={() => setExpand(v => !v)} className="btn-xs btn-secondary shrink-0">
          {expand ? '收起' : '详情'}
        </button>
      </div>

      {/* 农场工作 */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-micro text-inksoft">
          <Icon name="shovel" size={13} className="text-inkfaint" />
          农场工作（消耗体力，属性适配效率更高）
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => { game.assignJob(sprite.id, null); sfx('job') }} className={`chip ${!sprite.job ? 'border-line-strong bg-line/40 text-ink' : 'hover:bg-paper2'}`}>
            休息
          </button>
          {JOBS.map(j => {
            const active = sprite.job === j.id
            const best = j.best.includes(sprite.element)
            return (
              <button key={j.id} onClick={() => { game.assignJob(sprite.id, j.id); sfx('job') }}
                title={`${j.desc} · 效率 ${(jobEff(sprite) / 1.2).toFixed(1)}×（${best ? '属性擅长' : '属性不擅长'}）`}
                className={`chip ${active ? 'border-sage-deep bg-sage/15 text-sage-deep' : 'hover:bg-paper2'}`}>
                <Icon name={JOB_ICON[j.id] ?? 'leaf'} size={13} />
                {j.name}
                {best && <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" aria-label="擅长" />}
              </button>
            )
          })}
        </div>
        {sprite.job && sprite.stamina <= 0 && (
          <p className="mt-1 text-micro text-danger">体力耗尽，工作停摆——投喂或让它休息恢复。</p>
        )}
      </div>

      {/* 星辰觉醒：究极体终盘外观 */}
      {species.stage === 'ultimate' && !sprite.star && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-control border-hair border-butter/60 bg-butter/[0.08] px-2.5 py-2">
          <div className="min-w-0">
            <div className="text-caption font-bold text-ink">星辰觉醒</div>
            <div className="micro">究极体 Lv.{STAR_LEVEL} + 星尘碎片×{STAR_SHARD_COST} + 龙鳞×{STAR_SCALE_COST}：全属性 +20%，换星辰外观</div>
          </div>
          <button
            onClick={() => { awakenStar(sprite.id); sfx('levelup') }}
            disabled={sprite.level < STAR_LEVEL || (state.inventory.star_shard ?? 0) < STAR_SHARD_COST || (state.inventory.scale ?? 0) < STAR_SCALE_COST}
            className="btn-primary btn-xs shrink-0"
          >
            觉醒 ✨{state.inventory.star_shard ?? 0}/{STAR_SHARD_COST} 🐲{state.inventory.scale ?? 0}/{STAR_SCALE_COST}
          </button>
        </div>
      )}

      {/* 成长倾向 */}
      <div className={`mt-3 ${expand ? '' : 'hidden'}`}>
        <div className="mb-1 text-micro text-inksoft">成长倾向（决定进化方向）</div>
        <div className="flex h-2 overflow-hidden rounded-full bg-line/60">
          {(['nature', 'vigor', 'mana'] as FeedStat[]).map(st => (
            total > 0 && sprite.stats[st] > 0 && (
              <div key={st} style={{ width: `${(sprite.stats[st] / total) * 100}%`, background: STAT_META[st].color }} title={`${STAT_META[st].name} ${sprite.stats[st]}`} />
            )
          ))}
          {total === 0 && <div className="w-full text-center text-micro leading-4 text-inkfaint">尚未投喂</div>}
        </div>
        <div className="mt-1 flex gap-3 text-micro text-inksoft">
          {(['nature', 'vigor', 'mana'] as FeedStat[]).map(st => (
            <span key={st} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: STAT_META[st].color }} />
              {STAT_META[st].name} <b className="num text-ink">{sprite.stats[st]}</b>
            </span>
          ))}
        </div>
      </div>

      {/* 投喂 */}
      {species.line === 'baby' ? (
        <div className={`mt-3 space-y-2 border-t border-line/60 pt-2.5 ${expand ? '' : 'hidden'}`}>
          {feedGroups.map(g => (
            <div key={g.stat}>
              <div className="mb-1 flex items-center gap-1.5 text-micro text-inksoft">
                <span className="h-2 w-2 rounded-full" style={{ background: STAT_META[g.stat].color }} />
                {g.label}
              </div>
              <div className="flex flex-wrap gap-1.5">{g.items.map(feedChip)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`mt-3 border-t border-line/60 pt-2.5 ${expand ? '' : 'hidden'}`}>
          <div className="mb-1.5 text-micro text-inksoft">进化后仍可投喂获得经验</div>
          <div className="flex flex-wrap gap-1.5">{feedGroups.flatMap(g => g.items).map(feedChip)}</div>
        </div>
      )}
    </article>
  )
}

function SPRITE_IMG(sprite: Sprite) {
  const species = SPECIES_MAP[sprite.speciesId]
  // 幼体有专属贴纸；成体/完全体/究极体用元素团子兜底，保证同屏是一种物料
  return spriteImage(sprite.speciesId, species.element, species.stage)
}

export default function SpritePanel({ game }: { game: GameApi }) {
  const { state } = game
  return (
    <div className="space-y-3">
      <section className="card p-4">
        <h2 className="section-title">
          <Icon name="bottle" size={18} className="text-berry" />
          精灵养成
        </h2>
        <p className="caption mt-1.5">
          幼体到 Lv.{EVOLVE_LEVEL.adult} 进化，方向由主导喂养方式决定：蛋奶（活力）喂出攻击线，蔬菜 / 结晶喂出功能线；之后 Lv.{EVOLVE_LEVEL.complete} 完全体、Lv.{EVOLVE_LEVEL.ultimate} 究极体。
        </p>
      </section>

      {state.sprites.length === 0 && (
        <section className="card flex flex-col items-center gap-2 p-8 text-center">
          <Icon name="egg" size={30} className="text-inkfaint" />
          <p className="caption">还没有小精灵，去「孵化池」注入 5 颗水晶孵化一只。</p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {state.sprites.map(sp => <SpriteCard key={sp.id} sprite={sp} game={game} />)}
      </div>
    </div>
  )
}
