import { EQUIPS, EQUIP_MAX_LEVEL, SLOT_NAME, enhanceCost, equipById, equipLevelMul, itemName, ownerLook, type EquipSlot } from '../game/data'
import { ownerImage } from '../game/ownerArt'
import { workBonuses, type GameApi } from '../game/useGame'
import Icon, { type IconName } from '../ui/Icon'
import { sfx } from '../game/audio'

const SLOTS: EquipSlot[] = ['tool', 'outfit', 'charm']
const LOOK_NAME = { classic: '亚麻', cream: '绣花', star: '星辉', rain: '雨衣', festival: '祭典', winter: '冬装' } as const

/** 农场主：装备 + 外观。装备只加农场收益，不改战斗数值，避免和精灵养成打架。 */

/** 装备与材料统一用「色标底盘 + 白色矢量图标」，和背包里的一致 */
const EQUIP_TINT: Record<string, string> = { tool: '#B08356', outfit: '#C98BA0', charm: '#C9A227' }
const MATERIAL_TINT: Record<string, string> = {
  fiber: '#9DBE7C', hide: '#C68C5A', dust: '#C9A227', fang: '#C9744F', scale: '#D37A96',
  ember: '#E0803C', fert: '#8C7A62', fert_rare: '#7C9B64',
}
function equipIconName(id: string): IconName {
  if (id.startsWith('hoe')) return 'shovel'
  if (id.startsWith('bell')) return 'sparkle'
  if (/^(apron|dress|coat|kimono)/.test(id)) return 'shirt'
  return 'gem'
}
function materialIconName(id: string): IconName {
  const base = id.replace(/_q\d+$/, '')
  if (base.startsWith('crystal_')) return 'gem'
  switch (base) {
    case 'fiber': return 'fiber'
    case 'hide': return 'hide'
    case 'dust': return 'dust'
    case 'fang': return 'fang'
    case 'scale': return 'scale'
    case 'ember': return 'sparkle'
    case 'fert': case 'fert_rare': return 'fert'
    default: return 'leaf'
  }
}

export default function OwnerPanel({ game }: { game: GameApi }) {
  const { state, equipItem, unequipSlot, enhanceEquip, craftCharm } = game
  const owned = state.ownedEquips ?? []
  const worn = state.ownerEquip ?? {}
  const look = ownerLook(worn as Partial<Record<EquipSlot, string>>)
  const bonusText = () => {
    const b = { grow: 0, qual: 0, crystal: 0, coin: 0 }
    SLOTS.forEach(s => {
      const d = equipById(worn[s])
      if (!d) return
      const mul = equipLevelMul(state.equipLevels?.[d.id] ?? 0)
      b.grow += (d.bonus.grow ?? 0) * mul
      b.qual += (d.bonus.qual ?? 0) * mul
      b.crystal += (d.bonus.crystal ?? 0) * mul
      b.coin += (d.bonus.coin ?? 0) * mul
    })
    const parts: string[] = []
    if (b.grow) parts.push(`生长 +${Math.round(b.grow * 100)}%`)
    if (b.qual) parts.push(`品质 +${Math.round(b.qual * 100)}%`)
    if (b.crystal) parts.push(`水晶 +${Math.round(b.crystal * 100)}%`)
    if (b.coin) parts.push(`售价 +${Math.round(b.coin * 100)}%`)
    return parts.length ? parts.join(' · ') : '还没穿戴装备'
  }

  const setInfo = workBonuses(state)
  const CRAFT_COST = [
    { id: 'fiber', qty: 6 },
    { id: 'hide', qty: 4 },
    { id: 'dust', qty: 3 },
  ]
  const canCraft = CRAFT_COST.every(c => (state.inventory[c.id] ?? 0) >= c.qty)

  return (
    <div className="space-y-3">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title"><Icon name="users" size={17} className="text-berry-deep" />农场主</h2>
          <span className="pill-soft">外观：{LOOK_NAME[look]}</span>
        </div>
        <p className="micro mt-1">装备只提升农场收益（生长 / 品质 / 水晶 / 售价），不参与战斗；打野外魔物和世界 BOSS 都会掉，BOSS 必掉。</p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SLOTS.map(slot => {
            const def = equipById(worn[slot])
            return (
              <div key={slot} className={`rounded-control border-hair p-2.5 ${def ? 'border-butter/60 bg-butter/[0.08]' : 'border-line bg-paper'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="micro">{SLOT_NAME[slot]}</span>
                  {def && (
                    <button onClick={() => { unequipSlot(slot); sfx('click') }} className="micro text-inkfaint hover:text-inksoft">卸下</button>
                  )}
                </div>
                {def ? (() => {
                  const lv = state.equipLevels?.[def.id] ?? 0
                  const maxed = lv >= EQUIP_MAX_LEVEL
                  const cost = maxed ? [] : enhanceCost(def.tier, lv + 1)
                  const can = cost.every(c => (state.inventory[c.id] ?? 0) >= c.qty)
                  return (
                    <>
                      <div className="mt-1 flex items-center gap-1.5 text-caption font-bold text-ink">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: EQUIP_TINT[def.slot] }}>
                          <Icon name={equipIconName(def.id)} size={13} className="text-[color:#FFFDF8]" />
                        </span>
                        {def.name}
                        {lv > 0 && <span className="pill-soft text-micro text-butter-deep">+{lv}</span>}
                      </div>
                      <div className="micro mt-0.5">{def.desc}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {maxed ? (
                          <span className="micro text-inkfaint">已强化满级</span>
                        ) : (
                          <>
                            {cost.map(c => (
                              <span key={c.id} className={`chip text-micro ${(state.inventory[c.id] ?? 0) >= c.qty ? '' : 'text-inkfaint'}`}>
                                {itemName(c.id)} {state.inventory[c.id] ?? 0}/{c.qty}
                              </span>
                            ))}
                            <button
                              onClick={() => { enhanceEquip(def.id); sfx('levelup') }}
                              disabled={!can}
                              className="btn-xs btn-secondary ml-auto"
                            >
                              <Icon name="shovel" size={12} />强化
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )
                })() : (
                  <div className="mt-2 text-caption text-inkfaint">空着</div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-caption text-inksoft">当前加成：{bonusText()}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-caption">
          {setInfo.setName ? (
            <>
              <span className="pill-soft text-butter-deep">🔥 {setInfo.setName}</span>
              <span className="micro text-inksoft">三槽成套：全部装备加成 ×{setInfo.setMul}</span>
            </>
          ) : (
            <span className="micro text-inkfaint">套装：三件装备都达到 T2 触发「精制套装」×1.1，都达到 T3 触发「星辉套装」×1.25</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-control border-hair border-line bg-paper p-2.5">
          <img
            src={ownerImage(state.gender ?? 'girl', look)}
            alt="农场主当前外观"
            className={`h-20 w-20 object-contain ${look === 'star' ? 'star-art' : ''}`}
          />
          <div className="min-w-0">
            <div className="text-caption font-bold text-ink">农场主外观：{LOOK_NAME[look]}</div>
            <div className="micro mt-0.5">
              换「服装」会直接换掉农场里的小人立绘（六套：亚麻 / 绣花 / 星辉 / 雨衣 / 祭典 / 冬装）。
            </div>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title"><Icon name="shovel" size={17} className="text-butternut" />工作台</h2>
          <span className="pill-soft">合成饰品</span>
        </div>
        <p className="micro mt-1">把打怪掉的材料合成一件随机 T2 饰品（已拥有的不会再出）。</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {CRAFT_COST.map(c => {
            const have = state.inventory[c.id] ?? 0
            return (
              <span key={c.id} className={`chip ${have >= c.qty ? '' : 'opacity-50'}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ background: MATERIAL_TINT[c.id.replace(/_q\d+$/, '')] ?? '#B9AE9A' }}>
                  <Icon name={materialIconName(c.id)} size={13} className="text-[color:#FFFDF8]" />
                </span>
                {itemName(c.id)} {have}/{c.qty}
              </span>
            )
          })}
          <button
            onClick={() => { craftCharm(); sfx('crystal') }}
            className="btn btn-primary btn-sm ml-auto"
            disabled={!canCraft}
          >
            <Icon name="sparkle" size={15} />合成饰品
          </button>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title"><Icon name="basket" size={17} className="text-sage-deep" />装备箱</h2>
          <span className="pill-soft num">{owned.length}/{EQUIPS.length}</span>
        </div>
        {owned.length === 0 ? (
          <p className="micro mt-2">还没有装备。去「战斗」页打野外魔物，赢了就有机会掉。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {SLOTS.map(slot => {
              const list = owned.map(equipById).filter((d): d is NonNullable<typeof d> => !!d && d.slot === slot)
              if (!list.length) return null
              return (
                <div key={slot}>
                  <div className="micro mb-1">{SLOT_NAME[slot]}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(d => {
                      const on = worn[slot] === d.id
                      return (
                        <button
                          key={d.id}
                          onClick={() => { equipItem(d.id); sfx('feed') }}
                          className={`chip ${on ? 'chip-active' : 'hover:bg-paper2'}`}
                          title={d.desc}
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: EQUIP_TINT[d.slot] }}>
                            <Icon name={equipIconName(d.id)} size={13} className="text-[color:#FFFDF8]" />
                          </span>
                          {d.name}
                          {on && <span className="micro text-sage-deep">已穿</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
