import { useEffect, useMemo, useRef, useState } from 'react'
import { ELEMENTS, ENEMIES, EQUIP_MAP, SPECIES_MAP, counterMul, itemName, movesForSpecies, type Element, type EnemyDef, type SkillDef, type Sprite } from '../game/data'
import { spriteImage } from '../game/spriteImages'
import { ENEMY_IMAGES, BOSS_IMAGE } from '../game/enemyImages'
import treeUrl from '../assets/sticker/tree.png'
import fenceUrl from '../assets/sticker/fence.png'
import flowersUrl from '../assets/sticker/flowers.png'
import hayUrl from '../assets/sticker/hay.png'
import { BATTLE_BG } from '../game/battleBg'
import type { GameApi } from '../game/useGame'
import Icon from '../ui/Icon'
import ItemBadge from '../ui/itemBadge'
import { EQUIP_TINT } from '../ui/itemBadge'
import { sfx } from '../game/audio'

// 竖切：任意已孵化精灵可出战（含幼体）；幼体仅普攻，技能键另行禁用
const canFight = (sp: Sprite) => !!SPECIES_MAP[sp.speciesId]
/** 功能线（辅助型）精灵：技能以回复/增益为主，不建议上阵 */
const isSupportLine = (sp: Sprite) => SPECIES_MAP[sp.speciesId]?.line === 'support'
const hasSkill = (sp: Sprite) => (SPECIES_MAP[sp.speciesId]?.skills.length ?? 0) > 0
// 展示图：幼体/成体/究极体都是贴纸，进化形态额外加一层元素色外发光
function spriteFace(sp: Sprite, sizeCls: string) {
  const species = SPECIES_MAP[sp.speciesId]
  const evolved = species.stage !== 'baby'
  const glow = sp.star
    ? `saturate(1.3) brightness(1.08) drop-shadow(0 0 10px ${ELEMENTS[sp.element].color}) drop-shadow(0 0 4px rgba(255,214,120,0.9))`
    : evolved ? `drop-shadow(0 0 6px ${ELEMENTS[sp.element].color})` : undefined
  return (
    <img
      src={spriteImage(sp.speciesId, species.element, species.stage)}
      className={`${sizeCls} object-contain inline-block ${sp.star ? 'star-art' : ''}`}
      style={glow ? { filter: glow } : undefined}
      alt={species.name}
    />
  )
}

/** 元素只作为小圆点出现，界面保持纸色。 */
function ElementDot({ el, size = 7 }: { el: Element; size?: number }) {
  return <span className="inline-block rounded-full" style={{ width: size, height: size, background: ELEMENTS[el].color, flex: 'none' }} />
}

interface BattleState {
  enemy: EnemyDef | 'boss'
  enemyHp: number
  enemyMax: number
  team: string[]              // 上阵精灵 id（最多3只）
  hpMap: Record<string, number>
  activeIdx: number
  energy: number              // 0-3，每回合+1，大招耗3点
  log: string[]
  defending: boolean
  over: boolean
  bossTotalDmg: number
  /** 真正上过场的精灵（吃满经验），其余队友按 30% 学习装置结算 */
  participants: string[]
}

export interface BattleStatus {
  enemy: string
  hp: number
  maxHp: number
  auto: boolean
}

export default function BattlePanel({ game, active = true, onStatus }: {
  game: GameApi
  /** 当前是否显示着这一页（后台战斗时仍是 true 的计时器在跑） */
  active?: boolean
  onStatus?: (s: BattleStatus | null) => void
}) {
  const { state, battleWin, updateSpriteHp, damageWorldBoss, notify } = game
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [teamPick, setTeamPick] = useState<string[]>([])
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null)
  const [auto, setAuto] = useState(false)
  const [loot, setLoot] = useState<{ title: string; exp: number; coins: number; crystals: Element[]; items: { id: string; qty: number }[]; equip?: string } | null>(null)
  const [allyFx, setAllyFx] = useState<{ k: 'lunge' | 'hurt'; n: number } | null>(null)
  const [enemyFx, setEnemyFx] = useState<{ k: 'hurt'; n: number } | null>(null)
  /** 技能爆发 / 暴击特写：贴在敌人身上的一层光效 */
  const [burst, setBurst] = useState<{ kind: 'skill' | 'crit' | 'finish'; element: Element; n: number } | null>(null)
  const [floaters, setFloaters] = useState<{ id: number; text: string; side: 'left' | 'right'; kind: 'hit' | 'crit' | 'hurt' | 'heal' }[]>([])
  const floaterId = useRef(0)
  const enteredRef = useRef(false)

  const popFloater = (text: string, side: 'left' | 'right', kind: 'hit' | 'crit' | 'hurt' | 'heal') => {
    const id = ++floaterId.current
    setFloaters(fs => [...fs.slice(-6), { id, text, side, kind }])
    setTimeout(() => setFloaters(fs => fs.filter(f => f.id !== id)), 1150)
  }
  const fxAlly = (k: 'lunge' | 'hurt') => setAllyFx({ k, n: Date.now() })
  const fxEnemy = () => setEnemyFx({ k: 'hurt', n: Date.now() })
  const activeRef = useRef(active)
  activeRef.current = active

  const fighters = useMemo(() => state.sprites.filter(canFight), [state.sprites])
  const activeSprite = battle ? state.sprites.find(s => s.id === battle.team[battle.activeIdx]) : null

  // 把战斗状态报给外层：切到别的页签时顶栏能显示「战斗中」并能点回来
  useEffect(() => {
    if (!onStatus) return
    if (!battle) { onStatus(null); return }
    onStatus({
      enemy: battle.enemy === 'boss' ? '世界 BOSS · 苍穹古龙王' : battle.enemy.name,
      hp: battle.enemyHp,
      maxHp: battle.enemyMax,
      auto,
    })
  }, [battle, auto, onStatus])

  const togglePick = (id: string) => {
    setTeamPick(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id])
  }

  /** 编队内调整顺序（前 3 位就是上场接力顺序） */
  const movePick = (id: string, dir: -1 | 1) => {
    setTeamPick(p => {
      const i = p.indexOf(id)
      if (i < 0) return p
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const next = [...p]
      ;[next[i], next[j]] = [next[j], next[i]]
      sfx('click')
      return next
    })
  }

  const startBattle = (enemy: EnemyDef | 'boss') => {
    const autoPool = fighters.filter(f => !isSupportLine(f))
    const team = teamPick.length > 0 ? teamPick : (autoPool.length > 0 ? autoPool : fighters).slice(0, 3).map(f => f.id)
    if (team.length === 0) return
    const isBoss = enemy === 'boss'
    const hpMap: Record<string, number> = {}
    team.forEach(id => {
      const sp = state.sprites.find(s => s.id === id)!
      hpMap[id] = sp.hp
    })
    const enemyName = isBoss ? '世界BOSS·苍穹古龙王（全服共斗）' : (enemy as EnemyDef).name
    setBattle({
      enemy,
      enemyHp: isBoss ? state.worldBossHp : (enemy as EnemyDef).hp,
      enemyMax: isBoss ? state.worldBossMax : (enemy as EnemyDef).hp,
      team, hpMap, activeIdx: 0, energy: 1,
      log: [`${team.length}只精灵小队遭遇了 ${enemyName}！`],
      defending: false, over: false, bossTotalDmg: 0, participants: [team[0]],
    })
    setSelectedEnemy(null)
  }

  const endBattle = (b: BattleState) => {
    b.team.forEach(id => updateSpriteHp(id, Math.max(1, Math.round(b.hpMap[id] ?? 1))))
    setBattle(null)
    setTeamPick([])
  }

  const pushLog = (b: BattleState, ...lines: string[]) => ({ ...b, log: [...b.log.slice(-14), ...lines] })

  /** 按怪物的掉落表滚一次战利品（基础怪每项 1 份，精英按区间） */
  const rollLoot = (ed: EnemyDef) => {
    const items: { id: string; qty: number }[] = []
    for (const d of ed.drops ?? []) {
      if (Math.random() > d.chance) continue
      const qty = d.min + Math.floor(Math.random() * (d.max - d.min + 1))
      if (qty > 0) items.push({ id: d.id, qty })
    }
    // 保证每次都有点东西，不至于空手
    if (items.length === 0) items.push({ id: 'dust', qty: 1 })
    return items
  }

  const playerAction = (kind: 'attack' | 'skill' | 'defend', picked?: SkillDef) => {
    if (!battle || !activeSprite || battle.over) return
    let b: BattleState = { ...battle, hpMap: { ...battle.hpMap } }
    let sp = activeSprite
    const enemyDef = b.enemy === 'boss' ? null : (b.enemy as EnemyDef)
    const enemyEl: Element = b.enemy === 'boss' ? 'light' : enemyDef!.element
    const enemyName = b.enemy === 'boss' ? '苍穹古龙王' : enemyDef!.name

    const actWith = (cur: Sprite): 'fainted' | 'ok' => {
      const species = SPECIES_MAP[cur.speciesId]
      const skill = picked ?? species.skills[0]
      const isAttackLine = species.line === 'attack' || species.line === 'limited'
      const myHp = b.hpMap[cur.id]

      // 功能线精灵：受伤后才会自愈（回 6%），避免满血时白回、也避免把敌人伤害完全抵消
      if (species.line === 'support' && myHp < cur.maxHp * 0.78) {
        const healAmt = Math.round(cur.maxHp * 0.06)
        b.hpMap[cur.id] = Math.min(cur.maxHp, myHp + healAmt)
        b = pushLog(b, `功能线的庇护：「${cur.name}」回复 ${healAmt} 点生命`)
        popFloater(`+${healAmt}`, 'left', 'heal')
      }

      if (kind === 'defend') {
        b.defending = true
        b = pushLog(b, `防御：「${cur.name}」摆出了防御姿态！`)
      } else if (kind === 'skill') {
        fxAlly('lunge')
        if (!skill) { notify('这只精灵没有技能！'); return 'ok' }
        const cost = skill.cost ?? 3
        if (b.energy < cost) { notify(`能量不足！${skill.name} 需要 ${cost} 点能量`); return 'ok' }
        b.energy -= cost
        if (skill.kind === 'heal') {
          const healAmt = Math.round(cur.maxHp * skill.mul)
          b.hpMap[cur.id] = Math.min(cur.maxHp, b.hpMap[cur.id] + healAmt)
          b = pushLog(b, `${skill.name}：回复 ${healAmt} 点生命（${skill.desc}）`)
        } else {
          const mul = counterMul(cur.element, enemyEl)
          const dmg = Math.max(1, Math.round(cur.atk * skill.mul * mul - (enemyDef?.def ?? 20) * 0.5))
          b.enemyHp = Math.max(0, b.enemyHp - dmg)
          b.bossTotalDmg += dmg
          b = pushLog(b, `${skill.name}${mul > 1 ? '（克制！）' : mul < 1 ? '（属性不利…）' : ''}：对 ${enemyName} 造成 ${dmg} 点伤害`)
          popFloater(`-${dmg}`, 'right', 'crit')
          setBurst({ kind: 'skill', element: cur.element, n: Date.now() })
          fxEnemy()
          if (b.enemyHp <= 0) setBurst({ kind: 'finish', element: cur.element, n: Date.now() + 1 })
          if (b.enemy === 'boss') damageWorldBoss(dmg)
        }
      } else {
        fxAlly('lunge')
        const mul = counterMul(cur.element, enemyEl)
        let dmg = Math.max(1, Math.round(cur.atk * mul - (enemyDef?.def ?? 20) * 0.5))
        let tag = '普通攻击'
        let critFlag = false
        if (isAttackLine && Math.random() < 0.3) { dmg *= 2; tag = '会心暴击！'; critFlag = true }
        if (mul > 1) tag += '（克制！）'
        else if (mul < 1) tag += '（属性不利…）'
        b.enemyHp = Math.max(0, b.enemyHp - dmg)
        b.bossTotalDmg += dmg
        b = pushLog(b, `${tag}：「${cur.name}」对 ${enemyName} 造成 ${dmg} 点伤害`)
        popFloater(`-${dmg}`, 'right', critFlag ? 'crit' : 'hit')
        if (critFlag) setBurst({ kind: 'crit', element: cur.element, n: Date.now() })
        if (b.enemyHp <= 0) setBurst({ kind: 'finish', element: cur.element, n: Date.now() + 1 })
        fxEnemy()
        if (b.enemy === 'boss') damageWorldBoss(dmg)
      }

      // 敌人反击
      if (b.enemyHp > 0) {
        const eatk = b.enemy === 'boss' ? Math.max(58, Math.round(cur.maxHp * 0.12)) : enemyDef!.atk
        const emul = counterMul(enemyEl, cur.element)
        let edmg = Math.max(1, Math.round(eatk * emul - cur.def * 0.5))
        if (b.defending) { edmg = Math.round(edmg * 0.4); b.defending = false }
        b.hpMap[cur.id] = Math.max(0, b.hpMap[cur.id] - edmg)
        b = pushLog(b, `${enemyName} 反击${emul > 1 ? '（克制你！）' : ''}，对「${cur.name}」造成 ${edmg} 点伤害`)
        popFloater(`-${edmg}`, 'left', 'hurt')
        fxAlly('hurt')
      }
      // 能量回复
      b.energy = Math.min(3, b.energy + 1)
      return b.hpMap[cur.id] <= 0 ? 'fainted' : 'ok'
    }

    const result = actWith(sp)
    if (result === 'fainted' && b.enemyHp > 0) {
      b = pushLog(b, `💫 「${sp.name}」倒下了…`)
      const nextIdx = b.team.findIndex((id, i) => i > b.activeIdx && (b.hpMap[id] ?? 0) > 0)
      // 也可能前面的还活着（防御回合不会倒下，但保险起见找任意存活）
      const anyAlive = b.team.findIndex(id => (b.hpMap[id] ?? 0) > 0)
      const nx = nextIdx >= 0 ? nextIdx : anyAlive
      if (nx >= 0 && b.team[nx] !== sp.id) {
        b.activeIdx = nx
        const nsp = state.sprites.find(s => s.id === b.team[nx])!
        b = pushLog(b, `「${nsp.name}」接替上场！`)
      }
    }

    const allDown = b.team.every(id => (b.hpMap[id] ?? 0) <= 0)

    // 结算
    if (b.enemy !== 'boss' && b.enemyHp <= 0) {
      b.over = true
      const ed = enemyDef!
      const items = rollLoot(ed)
      b = pushLog(b, `🎉 胜利！全队获得 ${ed.expReward} 经验、💰${ed.coinReward} 金币、💎结晶×${ed.crystalReward.length}`)
      sfx('win')
      const gotExclusive = !!ed.exclusive && !state.ownedEquips.includes(ed.exclusive)
      const expMap: Record<string, number> = {}
      b.team.forEach(id => { expMap[id] = b.participants.includes(id) ? ed.expReward : Math.round(ed.expReward * 0.3) })
      const shareTxt = b.team.map(id => {
        const sp2 = state.sprites.find(x => x.id === id)
        return `${sp2?.name ?? id} ${expMap[id]}`
      }).join(' · ')
      b = pushLog(b, `经验分配：${shareTxt}（未上场按 30% 学习装置结算）`)
      battleWin(b.team, ed.expReward, ed.coinReward, ed.crystalReward, false, items, ed.exclusive, ed.id, expMap)
      setLoot({ title: ed.name, exp: ed.expReward, coins: ed.coinReward, crystals: ed.crystalReward, items, equip: gotExclusive ? ed.exclusive : undefined })
      setBattle(b)
      setTimeout(() => endBattle(b), 1200)
      return
    } else if (b.enemy === 'boss' && b.enemyHp <= 0) {
      b.over = true
      const coins = 200 + Math.round(b.bossTotalDmg / 20)
      b = pushLog(b, `👑 全服协力击杀了苍穹古龙王！你贡献 ${b.bossTotalDmg} 伤害，获得 💰${coins} 金币和光结晶×2！`)
      sfx('win')
      const bossItems = [...rollLoot({ ...ENEMIES[ENEMIES.length - 1] } as EnemyDef), { id: 'dust', qty: 6 }, { id: 'scale', qty: 2 }]
      battleWin(b.team, 150, coins, ['light', 'light'], true, bossItems)
      setLoot({ title: '🐲 世界 BOSS · 苍穹古龙王', exp: 150, coins, crystals: ['light', 'light'], items: bossItems })
      setBattle(b)
      setTimeout(() => endBattle(b), 1500)
      return
    } else if (allDown) {
      b.over = true
      b = pushLog(b, `💫 全队倒下了…精灵们被送回农场疗伤（保留 1 点HP，不扣任何东西）`)
      sfx('lose')
      if (b.enemy === 'boss' && b.bossTotalDmg > 0) {
        const coins = Math.round(b.bossTotalDmg / 15)
        b = pushLog(b, `📦 BOSS战参与奖励：💰${coins} 金币`)
        battleWin(b.team, 20, coins, [])
      }
      setBattle(b)
      setTimeout(() => endBattle(b), 1500)
      return
    }
    setBattle(b)
  }

  /** 战斗中换人：消耗一回合，敌方立刻行动一次（宝可梦式） */
  const switchTo = (id: string) => {
    if (!battle || battle.over || id === battle.team[battle.activeIdx]) return
    const idx = battle.team.indexOf(id)
    if (idx < 0 || (battle.hpMap[id] ?? 0) <= 0) return
    const incoming = state.sprites.find(x => x.id === id)
    if (!incoming) return
    let b: BattleState = { ...battle, hpMap: { ...battle.hpMap }, activeIdx: idx }
    if (!b.participants.includes(id)) b.participants = [...b.participants, id]
    b = pushLog(b, `换人：「${incoming.name}」上场（消耗一回合）`)
    // 敌方行动一次
    const enemyDef = b.enemy === 'boss' ? null : (b.enemy as EnemyDef)
    const enemyEl: Element = b.enemy === 'boss' ? 'light' : enemyDef!.element
    const enemyName = b.enemy === 'boss' ? '苍穹古龙王' : enemyDef!.name
    const eatk = b.enemy === 'boss' ? Math.max(58, Math.round(incoming.maxHp * 0.12)) : enemyDef!.atk
    const emul = counterMul(enemyEl, incoming.element)
    const edmg = Math.max(1, Math.round(eatk * emul - incoming.def * 0.5))
    b.hpMap[id] = Math.max(0, (b.hpMap[id] ?? 0) - edmg)
    b = pushLog(b, `${enemyName} 趁机出手${emul > 1 ? '（克制你！）' : ''}，对「${incoming.name}」造成 ${edmg} 点伤害`)
    popFloater(`-${edmg}`, 'left', 'hurt')
    fxAlly('hurt')
    b.energy = Math.min(3, b.energy + 1)
    if ((b.hpMap[id] ?? 0) <= 0) {
      b = pushLog(b, `「${incoming.name}」倒下了…`)
      const alive = b.team.findIndex(t => (b.hpMap[t] ?? 0) > 0)
      if (alive < 0) {
        b.over = true
        b = pushLog(b, `全队倒下了…精灵们被送回农场疗伤（保留 1 点HP，不扣任何东西）`)
        sfx('lose')
        setBattle(b)
        setTimeout(() => endBattle(b), 1400)
        return
      }
      b.activeIdx = alive
      const nsp = state.sprites.find(x => x.id === b.team[alive])
      if (nsp) b = pushLog(b, `「${nsp.name}」接替上场！`)
    }
    sfx('click')
    setBattle(b)
  }

  // 刚进入战斗时把页面滚到顶，避免 sticky 顶栏压住状态面板
  useEffect(() => {
    if (battle && !enteredRef.current) {
      enteredRef.current = true
      if (activeRef.current) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    if (!battle) enteredRef.current = false
  }, [battle])

  // 自动战斗：每 1.5 秒出一手，能量够就放大招
  useEffect(() => {
    if (!auto || !battle || battle.over) return
    const timer = window.setInterval(() => {
      const sp = state.sprites.find(x => x.id === battle.team[battle.activeIdx])
      if (!sp) return
      const ready = hasSkill(sp) && battle.energy >= 3
      sfx(ready ? 'skill' : 'hit')
      playerAction(ready ? 'skill' : 'attack')
    }, 1500)
    return () => window.clearInterval(timer)
    // playerAction 每回合都会变（依赖 battle），这里跟着 battle 重建计时器
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, battle])

  const flee = () => {
    if (!battle) return
    if (battle.enemy === 'boss' && battle.bossTotalDmg > 0) {
      const coins = Math.round(battle.bossTotalDmg / 15)
      battleWin(battle.team, 20, coins, [])
      notify(`BOSS 战参与奖励：${coins} 金币`)
    }
    endBattle(battle)
  }

  // -------------------- 战斗画面 --------------------
  if (battle && activeSprite) {
    const isBoss = battle.enemy === 'boss'
    const ed = isBoss ? null : (battle.enemy as EnemyDef)
    const enemyEl: Element = isBoss ? 'light' : ed!.element
    const mul = counterMul(activeSprite.element, enemyEl)
    const myHp = battle.hpMap[activeSprite.id] ?? 0
    const enemyPct = Math.max(0, (battle.enemyHp / battle.enemyMax) * 100)
    const myPct = Math.max(0, (myHp / activeSprite.maxHp) * 100)
    const bg = BATTLE_BG[enemyEl]
    // 战斗框很扁（约 3.8:1），16:9 背景要按元素微调取景位置，地平线才落在合适高度
    const bgPos: Record<Element, string> = { wood: '50% 62%', fire: '50% 56%', water: '50% 66%', earth: '50% 60%', light: '50% 62%' }
    const moves = movesForSpecies(activeSprite.speciesId)

    return (
      <section className="card overflow-hidden p-0">
        {/* 标题条 */}
        <div className="flex items-center justify-between gap-2 border-b border-hair border-line px-4 py-2.5">
          <h2 className="section-title">
            <Icon name="swords" size={18} className="text-berry" />
            战斗中
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {auto && <span className="pill-soft">自动战斗中</span>}
            {isBoss && <span className="pill-soft">世界 BOSS · 全服共斗</span>}
          </div>
        </div>

        {/* 战场：天空 + 草地 + 远景道具，我方在左、敌人在右 */}
        <div className="relative h-[248px] w-full overflow-hidden sm:h-[286px]">
          {bg ? (
            <>
              <img src={bg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ objectPosition: bgPos[enemyEl] }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/[0.10] to-transparent" />
            </>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#F9F3E4_0%,#FBF6E9_52%,#F2EBD7_100%)]" />
              {/* 地面 */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[58%] bg-[linear-gradient(180deg,#F4EEDA_0%,#EFE7CF_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-[58%] h-px bg-line-strong/45" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-butter/10 to-transparent" />
              {/* 远景：树 / 围栏 / 草花 / 干草，全部用同套贴纸 */}
              <img src={treeUrl} alt="" className="pointer-events-none absolute left-[4%] top-[30%] h-24 opacity-90" />
              <img src={fenceUrl} alt="" className="pointer-events-none absolute left-[26%] top-[46%] h-7 opacity-80" />
              <img src={fenceUrl} alt="" className="pointer-events-none absolute right-[30%] top-[46%] h-7 opacity-70" />
              <img src={flowersUrl} alt="" className="pointer-events-none absolute left-[46%] top-[50%] h-8 opacity-80" />
              <img src={hayUrl} alt="" className="pointer-events-none absolute right-[4%] top-[50%] h-10 opacity-80" />
              <img src={flowersUrl} alt="" className="pointer-events-none absolute right-[34%] top-[52%] h-6 opacity-70" />
            </>
          )}

          {/* 敌人（右） */}
          <div className="absolute bottom-[24px] right-[12%] flex flex-col items-center">
            <span className="pointer-events-none absolute -bottom-1 h-3 w-20 rounded-[50%] bg-ink/[0.10]" />
            {burst && (
              <span key={`b-${burst.n}`} className={`pointer-events-none absolute inset-0 z-10 grid place-items-center ${burst.kind === 'finish' ? 'fx-finish' : burst.kind === 'crit' ? 'fx-crit' : 'fx-burst'}`}>
                <span className="block rounded-full"
                  style={{
                    width: burst.kind === 'crit' ? 132 : 150,
                    height: burst.kind === 'crit' ? 132 : 150,
                    background: `radial-gradient(circle, ${ELEMENTS[burst.element].color}bb 0%, ${ELEMENTS[burst.element].color}33 45%, transparent 70%)`,
                  }} />
              </span>
            )}
            <span key={enemyFx?.n ?? 0} className={enemyFx ? 'fx-hurt' : ''}>
              <img
                src={isBoss ? BOSS_IMAGE : (ENEMY_IMAGES[ed!.id] ?? BOSS_IMAGE)}
                alt={isBoss ? '苍穹古龙王' : ed!.name}
                className={`${isBoss ? 'h-40' : 'h-32'} object-contain drop-shadow`}
                style={!isBoss && ed?.tint ? { filter: ed.tint } : undefined}
              />
            </span>
            <div className="mt-1 flex items-center gap-1 rounded-full bg-paper2/95 px-2 py-0.5 text-micro font-bold text-ink">
              <ElementDot el={enemyEl} />
              {isBoss ? '苍穹古龙王' : ed!.name}
            </div>
            <div className={`mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-line/70 ${enemyPct <= 30 ? 'boss-rage' : ''}`}>
              <div className={`h-full rounded-full transition-all duration-300 ${enemyPct <= 30 ? 'bg-berry' : 'bg-danger'}`} style={{ width: `${enemyPct}%` }} />
            </div>
            {enemyPct <= 30 && battle.enemyHp > 0 && <span className="mt-0.5 text-[10px] font-bold text-berry-deep">残血 · 最后一击</span>}
            <div className="micro num">{Math.round(battle.enemyHp)} / {battle.enemyMax}</div>
          </div>

          {/* 我方状态面板（参考图左上角 HP/MP 框） */}
          <div className="absolute left-3 top-3 w-[186px] rounded-control border-hair border-line bg-paper2/95 p-2 shadow-sticker">
            <div className="flex items-center gap-1.5">
              <span className="sticker-tile shrink-0">{spriteFace(activeSprite, 'h-7 w-7')}</span>
              <div className="min-w-0">
                <div className="truncate text-caption font-bold text-ink">{activeSprite.name}</div>
                <div className="micro">
                  Lv.{activeSprite.level} · {ELEMENTS[activeSprite.element].name}系
                  {mul > 1 ? ' · 克制' : mul < 1 ? ' · 不利' : ''}
                </div>
              </div>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-micro text-inksoft">
                <span>生命</span>
                <span className="num">{Math.round(myHp)}/{activeSprite.maxHp}</span>
              </div>
              <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-sage transition-all duration-300" style={{ width: `${myPct}%` }} />
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-micro text-inksoft">能量</span>
              <span className="flex items-center gap-0.5">
                {[0, 1, 2].map(i => <Icon key={i} name="gem" size={13} className={i < battle.energy ? 'text-berry' : 'text-line-strong'} />)}
              </span>
            </div>
          </div>

          {/* 伤害飘字 */}
          {floaters.map(f => (
            <span
              key={f.id}
              className={`pointer-events-none absolute bottom-[46%] z-10 select-none text-[18px] font-bold animate-[floatUp_1.1s_ease-out_forwards] ${
                f.kind === 'crit' ? 'text-berry-deep' : f.kind === 'hurt' ? 'text-danger' : f.kind === 'heal' ? 'text-sage-deep' : 'text-ink'
              }`}
              style={{
                [f.side === 'right' ? 'right' : 'left']: '16%',
                textShadow: '0 1px 0 rgba(255,255,255,.95), 0 0 8px rgba(255,255,255,.85)',
              }}
            >
              {f.text}
            </span>
          ))}

          {/* 我方精灵（左） */}
          <div className="absolute bottom-[24px] left-[13%] flex flex-col items-center">
            <span className="pointer-events-none absolute bottom-0 h-3.5 w-24 rounded-[50%] bg-ink/[0.12] blur-[1px]" />
            <span key={allyFx?.n ?? 0} className={allyFx ? (allyFx.k === 'lunge' ? 'fx-lunge' : 'fx-hurt') : ''}>
              {spriteFace(activeSprite, 'h-32 w-32')}
            </span>
            <div className="mt-0.5 rounded-full bg-paper2/90 px-2 py-0.5 text-micro text-inksoft">我方</div>
          </div>
        </div>

        {/* 队友血线：点一下换人（宝可梦式，消耗一回合） */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-hair border-line px-4 py-2">
          {battle.team.map(id => {
            const sp2 = state.sprites.find(x => x.id === id)!
            const hp2 = battle.hpMap[id] ?? 0
            const dead = hp2 <= 0
            const isActive = id === activeSprite.id
            const canSwitch = !isActive && !dead && !battle.over
            return (
              <button
                key={id}
                onClick={() => { if (canSwitch) switchTo(id) }}
                disabled={!canSwitch}
                title={isActive ? '正在场上' : dead ? '已倒下' : '换上场（消耗一回合，敌方会出手）'}
                className={`chip ${isActive ? 'border-l-[3px] border-l-berry border-line-strong bg-line/40' : dead ? 'opacity-40' : 'hover:bg-paper2'} ${canSwitch ? 'cursor-pointer' : 'cursor-default'}`}>
                {spriteFace(sp2, 'h-6 w-6')}
                {sp2.name}
                <span className="num text-inkfaint">{Math.round(hp2)}/{sp2.maxHp}</span>
                {canSwitch && <Icon name="refresh" size={11} className="text-inkfaint" />}
              </button>
            )
          })}
          {battle.team.length > 1 && !battle.over && (
            <span className="ml-auto text-micro text-inkfaint">点队友换人 · 消耗一回合</span>
          )}
        </div>

        {/* 指令 + 战报 */}
        <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="space-y-1.5">
            <button
              onClick={() => { sfx('hit'); playerAction('attack') }}
              disabled={battle.over}
              className="flex w-full items-center gap-2.5 rounded-control border-hair border-line bg-paper px-3 py-2.5 text-left transition-colors hover:bg-paper2 disabled:opacity-45">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-berry/10 text-berry"><Icon name="swords" size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption font-bold text-ink">攻击</span>
                <span className="block text-micro text-inksoft">普通攻击；攻击线精灵 30% 打出会心</span>
              </span>
            </button>

            {/* 招式：按阶段解锁，各自消耗能量（宝可梦式选招） */}
            <div className="space-y-1.5">
              {moves.length === 0 && (
                <div className="flex items-center gap-2.5 rounded-control border-hair border-line bg-paper px-3 py-2.5 opacity-60">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-line/40 text-inkfaint"><Icon name="lock" size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-caption font-bold text-ink">技能（未学会）</span>
                    <span className="block text-micro text-inksoft">幼体只有普通攻击，进化到 Lv.10 解锁招式</span>
                  </span>
                </div>
              )}
              {moves.map(mv => {
                const cost = mv.cost ?? 3
                const enough = battle.energy >= cost
                return (
                  <button
                    key={mv.name}
                    onClick={() => { sfx('skill'); playerAction('skill', mv) }}
                    disabled={!enough || battle.over}
                    title={enough ? mv.desc : `能量不足：需要 ${cost} 点（当前 ${battle.energy}）`}
                    className="flex w-full items-center gap-2.5 rounded-control border-hair border-line bg-paper px-3 py-2 text-left transition-colors hover:bg-paper2 disabled:opacity-45">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control ${mv.kind === 'heal' ? 'bg-sage/15 text-sage-deep' : 'bg-butter/15 text-butter-deep'}`}>
                      <Icon name={mv.kind === 'heal' ? 'drop' : 'sparkle'} size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-caption font-bold text-ink">{mv.name}</span>
                        <span className="pill-soft num">{cost} 能量</span>
                        <span className="micro num text-inkfaint">{mv.kind === 'heal' ? '回复' : `威力 ×${mv.mul.toFixed(1)}`}</span>
                      </span>
                      <span className="block truncate text-micro text-inksoft">{mv.desc}</span>
                    </span>
                    <span className="micro num text-inkfaint">{battle.energy}/3</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => { sfx('job'); playerAction('defend') }}
              disabled={battle.over}
              className="flex w-full items-center gap-2.5 rounded-control border-hair border-line bg-paper px-3 py-2.5 text-left transition-colors hover:bg-paper2 disabled:opacity-45">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sage/15 text-sage-deep"><Icon name="shield" size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption font-bold text-ink">防御</span>
                <span className="block text-micro text-inksoft">本回合受到的伤害降到 40%</span>
              </span>
            </button>
          </div>

          <div className="flex max-h-[196px] flex-col rounded-control border-hair border-line bg-paper">
            <div className="border-b border-hair border-line px-3 py-1.5 text-micro font-bold text-inksoft">战报</div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {battle.log.map((l, i) => <p key={i} className="text-caption text-inksoft">{l}</p>)}
            </div>
          </div>
        </div>

        {/* 底部：自动 / 逃跑 */}
        <div className="flex items-center gap-2 border-t border-hair border-line px-4 py-3">
          <button
            onClick={() => { setAuto(a => !a); sfx('click') }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-control border-hair px-3 py-2.5 text-caption font-bold transition-colors ${auto ? 'border-berry bg-berry/10 text-berry-deep' : 'border-line bg-paper text-ink hover:bg-paper2'}`}>
            <Icon name="refresh" size={16} />
            {auto ? '自动战斗中（点一下停）' : '自动战斗'}
          </button>
          <button
            onClick={flee}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control border-hair border-line bg-paper px-3 py-2.5 text-caption font-bold text-ink transition-colors hover:bg-paper2">
            <Icon name="arrowUp" size={16} className="rotate-45" />
            逃跑
          </button>
        </div>
      </section>
    )
  }

  // -------------------- 战斗准备 --------------------
  return (
    <div className="space-y-3">
      {fighters.length === 0 && (
        <section className="card flex items-center gap-2 p-4">
          <Icon name="egg" size={18} className="text-inksoft" />
          <p className="caption">还没有精灵。先去孵化池敲开第一颗蛋，幼体用普通攻击就能打第一场。</p>
        </section>
      )}

      {/* 五行克制 */}
      <section className="card p-3">
        <h2 className="section-title text-caption">
          <Icon name="book" size={15} className="text-inksoft" />
          五行克制
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-micro text-inksoft">
          {(['wood', 'earth', 'water', 'fire'] as Element[]).map((el, i, arr) => (
            <span key={el} className="inline-flex items-center gap-1">
              <ElementDot el={el} />
              {ELEMENTS[el].name}
              {i < arr.length - 1 && <span className="text-inkfaint">→</span>}
            </span>
          ))}
          <span className="text-inkfaint">→</span>
          <ElementDot el="wood" />
          <span>木</span>
          <span className="ml-2 text-inkfaint">克制 ×1.5 · 被克 ×0.75 · 光系中立</span>
        </div>
      </section>

      {/* 编队 */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title" title="最多上阵 3 只，按顺序接力；不选则默认前 3 只">
            <Icon name="users" size={17} className="text-inksoft" />
            编队
            <span className="pill-soft num">{teamPick.length}/3</span>
          </h2>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {fighters.map(sp => {
            const lowHp = sp.hp < sp.maxHp * 0.3
            const pickedIdx = teamPick.indexOf(sp.id)
            return (
              <button key={sp.id} onClick={() => togglePick(sp.id)}
                className={`flex items-center gap-2.5 rounded-control border-hair p-2.5 text-left transition-colors ${pickedIdx >= 0 ? 'border-berry bg-berry/10' : 'border-line bg-paper hover:bg-paper2'} ${isSupportLine(sp) ? 'opacity-80' : ''}`}>
                <span className="sticker-tile">{spriteFace(sp, 'h-9 w-9')}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {pickedIdx >= 0 && <span className="pill-soft num">{pickedIdx + 1} 号位</span>}
                    <span className="text-caption font-bold text-ink">{sp.name}</span>
                    <span className="micro num">Lv.{sp.level}</span>
                    {isSupportLine(sp) && (
                      <span className="pill-soft border-butter/60 text-butter-deep" title="功能线精灵技能偏辅助，输出偏低">
                        辅助型 · 不建议出战
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-inksoft">
                    <span className="inline-flex items-center gap-1"><ElementDot el={sp.element} />{ELEMENTS[sp.element].name}系</span>
                    <span className="num">生命 {Math.round(sp.hp)}/{sp.maxHp}</span>
                    <span className="num">攻 {sp.atk}</span>
                    <span className="num">防 {sp.def}</span>
                    <span className="num">速 {sp.spd}</span>
                  </span>
                  {lowHp && <span className="mt-0.5 block text-micro text-danger">重伤中，等待回血…</span>}
                </span>
                {pickedIdx >= 0 && (
                  <span className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); movePick(sp.id, -1) }}
                      disabled={pickedIdx === 0}
                      title="往前一位（更早登场）"
                      className="grid h-5 w-5 place-items-center rounded border-hair border-line text-inkfaint hover:bg-paper2 disabled:opacity-30">
                      <Icon name="chevronUp" size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); movePick(sp.id, 1) }}
                      disabled={pickedIdx === teamPick.length - 1}
                      title="往后一位"
                      className="grid h-5 w-5 place-items-center rounded border-hair border-line text-inkfaint hover:bg-paper2 disabled:opacity-30">
                      <Icon name="chevronDown" size={12} />
                    </button>
                  </span>
                )}
              </button>
            )
          })}
          {fighters.length === 0 && <p className="caption">暂无战斗精灵</p>}
        </div>
      </section>

      {/* 野外魔物 */}
      <section className="card p-4">
        <h2 className="section-title">
          <Icon name="swords" size={17} className="text-inksoft" />
          野外讨伐
          <span className="ml-2 text-micro font-normal text-inkfaint">点一下看详情 · 双击直接开战</span>
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ENEMIES.map(e => (
            <button key={e.id}
              onClick={() => setSelectedEnemy(selectedEnemy === e.id ? null : e.id)}
              onDoubleClick={() => { if (fighters.length > 0) startBattle(e) }}
              title="单击查看，双击直接开战"
              className={`flex items-center gap-2.5 rounded-control border-hair p-2.5 text-left transition-colors ${selectedEnemy === e.id ? 'border-berry bg-berry/10' : 'border-line bg-paper hover:bg-paper2'}`}>
              <span className="sticker-tile-lg p-0">
                <img src={ENEMY_IMAGES[e.id] ?? BOSS_IMAGE} alt="" className="h-11 w-11 object-contain" style={e.tint ? { filter: e.tint } : undefined} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-caption font-bold text-ink">{e.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-micro text-inksoft">
                  <span className="inline-flex items-center gap-1"><ElementDot el={e.element} />{ELEMENTS[e.element].name}系</span>
                  <span className="num">推荐 Lv.{e.unlockLevel}</span>
                  <span className="num">生命 {e.hp} · 攻 {e.atk} · 防 {e.def}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
        {selectedEnemy && fighters.length > 0 && (
          <div className="mt-3">
            <button onClick={() => startBattle(ENEMIES.find(e => e.id === selectedEnemy)!)}
              className="btn-primary w-full sm:w-auto">
              <Icon name="swords" size={15} />
              小队出击（{teamPick.length > 0 ? `${teamPick.length} 只` : '默认前 3 只'}）
            </button>
          </div>
        )}
      </section>

      {/* 世界 BOSS */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="sticker-tile-lg p-0">
            <img src={BOSS_IMAGE} alt="" className="h-11 w-11 object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="section-title text-ink">世界 BOSS · 苍穹古龙王</h2>
              <span className="pill-soft">全服共斗</span>
            </div>
            <p className="caption mt-1">全服玩家共同讨伐，按贡献伤害结算金币，击杀额外得光结晶 ×2。</p>
            <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full bg-butter-deep transition-all" style={{ width: `${(state.worldBossHp / state.worldBossMax) * 100}%` }} />
            </div>
            <div className="mt-1 text-micro text-inksoft num">全服血量 {Math.round(state.worldBossHp)} / {state.worldBossMax}</div>
          </div>
          {fighters.length > 0 && (
            <button onClick={() => startBattle('boss')} onDoubleClick={() => startBattle('boss')} className="btn-secondary">
              <Icon name="swords" size={15} />
              讨伐 BOSS
            </button>
          )}
        </div>
      </section>

      {/* 战利品结算面板 */}
      {loot && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/25 px-4 backdrop-blur-[2px]" onClick={() => setLoot(null)}>
          <div className="card w-full max-w-[360px] px-6 py-6 animate-[pop_.24s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="micro text-center text-inksoft">战利品</div>
            <h3 className="mt-1 text-center text-section font-bold text-ink">{loot.title}</h3>

            <div className="mt-4 flex items-center justify-center gap-3 text-caption">
              <span className="pill-soft"><Icon name="refresh" size={13} />经验 +{loot.exp}</span>
              <span className="pill-soft"><Icon name="coin" size={13} />{loot.coins}</span>
              {loot.crystals.map((el, i) => (
                <span key={i} className="pill-soft" style={{ color: ELEMENTS[el].color }}>
                  <Icon name="gem" size={13} style={{ color: ELEMENTS[el].color }} />{ELEMENTS[el].name}
                </span>
              ))}
            </div>

            {loot.equip && (() => {
              const ex = EQUIP_MAP[loot.equip!]
              return ex ? (
                <div className="mt-3 flex items-center gap-2 rounded-control border-hair border-butter/70 bg-butter/10 px-3 py-2">
                  <ItemBadge id={ex.id} kind="equip" tint={EQUIP_TINT[ex.slot]} size={26} />
                  <span className="min-w-0 flex-1 truncate text-caption font-bold text-ink">{ex.name}</span>
                  <span className="pill-soft shrink-0 text-micro">专属装备</span>
                </div>
              ) : null
            })()}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {loot.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 rounded-control border-hair border-line bg-paper2 px-3 py-2">
                  <ItemBadge id={it.id} size={26} />
                  <span className="truncate text-caption text-ink">{itemName(it.id)}</span>
                  <span className="ml-auto num text-caption font-bold text-berry-deep">×{it.qty}</span>
                </div>
              ))}
            </div>

            <button className="btn-primary mt-5 w-full" onClick={() => { sfx('click'); setLoot(null) }}>
              <Icon name="basket" size={16} />收下战利品
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
