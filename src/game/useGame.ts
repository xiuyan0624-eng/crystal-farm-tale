import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ANIMALS, CROPS, CRYSTAL_Q, CROP_EXP, ELEMENTS, ELEMENT_LIST, EVOLVE_LEVEL, FERTILIZERS, JOBS,
  LIMITED_SPECIES, MAX_PLOTS, PLOT_LEVELS, QUALITIES, QUALITY_WEIGHTS, SPECIES_MAP,
  babiesOf, calcStats, expForLevel, farmExpForLevel, itemName, jobEff, parseItem,
  EQUIPS, EQUIP_MAP, MATERIALS, equipLevelMul, enhanceCost, EQUIP_MAX_LEVEL, PLOT_KINDS, plotExpandCost, rollCrystalQuality, specialsOf, STAR_LEVEL, STAR_SHARD_COST, STAR_SCALE_COST, STAR_MUL, SUMMON_COST,
  type PlotKind,
  type Element, type FeedStat, type JobId, type Rarity, type Sprite, type SpriteSpecies,
} from './data'
import { GOALS } from './goals'

// -------------------- 类型 --------------------
export interface Plot {
  cropId: string | null
  plantedAt: number
  waterCount: number      // 浇水次数 0-3，每次+10%进度
  fertilizer: 0 | 1 | 2   // 0无 1普通肥料 2稀有肥料
  level: 0 | 1 | 2 | 3    // 土地等级：普通/黑土地/灵土/仙土
  /** 虫害：被虫啃的地生长变慢，驱虫精灵或玩家点一下能清掉 */
  pest?: number
  /** 地块类型：24 块地全开后可以花钱改造成温室/池塘 */
  kind?: PlotKind
}

export interface FarmAnimal {
  uid: string
  type: string
  satiety: number // 0-100
  produceProgress: number // 秒
  produceReady: number
}

export interface SpriteEgg {
  uid: string
  element: Element
  rarity: Rarity
  hatchAt: number
}

export interface ChatMsg {
  id: number
  text: string
  time: string
  self?: boolean
}

export interface Toast {
  id: number
  text: string
}

export interface GameState {
  coins: number
  farmExp: number
  farmLevel: number
  inventory: Record<string, number>
  plots: Plot[]
  animals: FarmAnimal[]
  eggs: SpriteEgg[]
  sprites: Sprite[]
  worldBossHp: number
  worldBossMax: number
  chat: ChatMsg[]
  feedLog: string[]
  gender: 'girl' | 'boy' | null
  dex: string[]  // 图鉴：获得过的物种 id
  hatchPity: { sinceEpic: number; sinceLegend: number }
  /** 已领取的里程碑 id */
  goalsClaimed: string[]
  /** 已获得的农场主装备（按 id 记录，不占背包格） */
  ownedEquips: string[]
  equipLevels: Record<string, number>
  /** 精英怪每日首杀：记录日期与当天已拿过奖励的敌 id */
  eliteDaily: { date: string; ids: string[] }
  /** 最近卖出的东西（用于误卖回购） */
  sellLog: { id: string; price: number }[]
  /** 当前穿戴：每个槽位一件 */
  ownerEquip: { tool?: string; outfit?: string; charm?: string }
  /** 竖切：首次胡萝卜收获是否已保底给过土结晶 */
  firstEarthCrystalGranted: boolean
  /** 刚孵出来的精灵 id：有值时弹「破壳」画面，收下后清空 */
  /** 破壳画面：刚孵出的精灵 id（一次性，不落盘） */
  lastHatch: string | null
  /** 破壳画面的等级（蛋的稀有度，决定光效强度） */
  lastHatchRarity: Rarity | null
}

// -------------------- 精灵工作加成 --------------------
export interface WorkBonuses {
  growMul: number     // 生长速度倍率（浇水工作）
  qualAdd: number     // 品质权重加成（施肥/驱虫/木精灵收获）
  crystalAdd: number  // 水晶掉率加成（收获工作）
  mineCount: number   // 采光精灵数量
  guardExtra: number  // 看守额外产量概率
  coinMul: number     // 售价倍率（装备）
  setName: string     // 当前套装名（未成套为空串）
  setMul: number      // 套装加成倍率
}
export function workBonuses(s: GameState): WorkBonuses {
  let grow = 0, qual = 0, crys = 0, mine = 0, guard = 0
  for (const sp of s.sprites) {
    if (!sp.job || sp.stamina <= 0) continue
    const norm = jobEff(sp) / 1.2
    const species = SPECIES_MAP[sp.speciesId]
    switch (sp.job) {
      case 'water': grow += 0.20 * norm; break
      case 'fertilize': qual += 0.10 * norm; break
      case 'harvest':
        crys += 0.05 * norm
        if (sp.element === 'wood') qual += 0.005 * sp.level
        break
      case 'pest': qual += 0.08 * norm; break
      case 'mine': mine += norm; break
      case 'guard': guard += 0.05 * norm; break
    }
    void species
  }
  // 农场主装备：独立叠加在精灵工作之上
  let gGrow = 0, gQual = 0, gCrys = 0, gCoin = 0
  Object.values(s.ownerEquip ?? {}).forEach(id => {
    const def = EQUIP_MAP[id]
    if (!def) return
    const mul = equipLevelMul(s.equipLevels?.[id] ?? 0)
    gGrow += (def.bonus.grow ?? 0) * mul
    gQual += (def.bonus.qual ?? 0) * mul
    gCrys += (def.bonus.crystal ?? 0) * mul
    gCoin += (def.bonus.coin ?? 0) * mul
  })
  // 套装：三槽都穿且都 ≥T2 → 精制套装 ×1.1；都 ≥T3 → 星辉套装 ×1.25
  const wornSet = Object.values(s.ownerEquip ?? {}).map(id => EQUIP_MAP[id]).filter(Boolean)
  let setName = ''
  let setMul = 1
  if (wornSet.length === 3) {
    const minTier = Math.min(...wornSet.map(e => e.tier))
    if (minTier >= 3) { setName = '星辉套装'; setMul = 1.25 }
    else if (minTier >= 2) { setName = '精制套装'; setMul = 1.1 }
  }
  return {
    growMul: 1 + Math.min(0.6, grow) + gGrow * setMul,
    qualAdd: qual + gQual * setMul,
    crystalAdd: crys + gCrys * setMul,
    mineCount: mine,
    guardExtra: guard,
    coinMul: 1 + gCoin * setMul,
    setName,
    setMul,
  }
}

/** 蜜蜂授粉：有吃饱的蜜蜂 → 品质权重+15% */
export function beeBonus(s: GameState): number {
  return s.animals.some(a => a.type === 'bee' && a.satiety > 0) ? 0.15 : 0
}

/** 地块生长进度 0-1（含土地速度、浇水工作、干旱减速） */
export function plotProgress(p: Plot, wb: WorkBonuses, now = Date.now()): number {
  if (!p.cropId) return 0
  const crop = CROPS.find(c => c.id === p.cropId)
  if (!crop) return 0
  const pestMul = p.pest ? 0.55 : 1
  const kindMul = PLOT_KINDS[p.kind ?? 'soil'].growMul
  const s = PLOT_LEVELS[p.level].speedMul * wb.growMul * pestMul * kindMul
  const growMs = crop.growTime * 1000
  const elapsed = now - p.plantedAt
  const half = (0.5 * growMs) / s
  if (p.waterCount === 0 && elapsed > half) {
    // 干旱：半程后生长速度减半
    return Math.min(1, 0.5 + (0.5 * s * (elapsed - half)) / growMs)
  }
  return Math.min(1, (s * elapsed) / growMs)
}
export function isDry(p: Plot, wb: WorkBonuses, now = Date.now()): boolean {
  if (!p.cropId || p.waterCount > 0) return false
  const crop = CROPS.find(c => c.id === p.cropId)
  if (!crop) return false
  const half = (0.5 * crop.growTime * 1000) / (PLOT_LEVELS[p.level].speedMul * wb.growMul)
  return now - p.plantedAt > half && plotProgress(p, wb, now) < 1
}

/** 背包加减；数量归零时删除键。 */
function addItem(inv: Record<string, number>, id: string, n: number) {
  inv[id] = (inv[id] ?? 0) + n
  if (inv[id] <= 0) delete inv[id]
}

/** 品质判定：基础权重 ×（1 + 土地 + 肥料 + 精灵工作 + 蜜蜂授粉） */
function rollQuality(s: GameState, p: Plot): number {
  const wb = workBonuses(s)
  const fertAdd = p.fertilizer === 2 ? 0.25 : p.fertilizer === 1 ? 0.10 : 0
  const mul = 1 + PLOT_LEVELS[p.level].qualAdd + PLOT_KINDS[p.kind ?? 'soil'].qualAdd + fertAdd + wb.qualAdd + beeBonus(s)
  const ws = QUALITY_WEIGHTS.map((w, i) => i === 0 ? w : w * mul)
  const total = ws.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  let q = 1
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) { q = i + 1; break } }
  if (p.waterCount === 0 && q > 1) q -= 1 // 干旱：品质降一档
  return q
}

const SAVE_KEY = 'crystal-farm-save-v1'

// 存档读写：Game Studio 的预览把游戏放进 `sandbox="allow-scripts"` 的 iframe，
// 这种不透明来源下访问 localStorage 会抛 SecurityError。这里先试 localStorage，
// 不可用就退回本页内存（游戏照样能玩，只是关掉预览后不保留进度）。
const memorySave = { value: null as string | null }
const saveStore = {
  read(): string | null {
    try {
      return localStorage.getItem(SAVE_KEY)
    } catch {
      return memorySave.value
    }
  },
  write(value: string): void {
    try {
      localStorage.setItem(SAVE_KEY, value)
    } catch {
      memorySave.value = value
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      memorySave.value = null
    }
  },
}
const WORLD_BOSS_MAX = 6000
let uidCounter = 1
const uid = () => `u${Date.now()}_${uidCounter++}`

export function makeSprite(species: SpriteSpecies, feedBonus = 0): Sprite {
  const feed = { nature: feedBonus, vigor: feedBonus, mana: feedBonus }
  const st = calcStats(species, 1, feed)
  return {
    id: uid(),
    speciesId: species.id,
    name: species.name,
    element: species.element,
    level: 1,
    exp: 0,
    stats: feed,
    ...st, hp: st.maxHp,
    job: null,
    stamina: 100,
  }
}

// 旧存档精灵 → 新图鉴物种迁移
const OLD_BABY_MAP: Record<string, string> = { wood: 'yaya', fire: 'huomiao', water: 'shuizhu', earth: 'tudundun', light: 'xingchen' }
const OLD_LINE_MAP: Record<string, { attack: string[]; support: string[] }> = {
  wood: { attack: ['chanraoteng', 'jingjiyao', 'shangushumo'], support: ['huajing', 'baihuaxian', 'shengmingzhishu'] },
  fire: { attack: ['yanzhao', 'chiyanwuzhe', 'yanyuzhanshen'], support: ['rongyanquan', 'baoyanshou', 'dixinyanmo'] },
  water: { attack: ['qingliushi', 'bibofashi', 'canghai'], support: ['bingjingtong', 'shuanghuashi', 'jibingnvwang'] },
  earth: { attack: ['yandunbing', 'shanyuejuren', 'daditan'], support: ['shaxingzhe', 'shabaoshou', 'huangmozhuzhu'] },
  light: { attack: ['huiguangshi', 'shenghuikishi', 'chenxinvshen'], support: ['zhumengling', 'xingguijisi', 'yuehuaxian'] },
}
function migrateSprite(old: Sprite & { stage?: string; evoClass?: string }): Sprite {
  const base = (() => {
    if (old.speciesId && SPECIES_MAP[old.speciesId]) return old
    const el = old.element
    let speciesId = OLD_BABY_MAP[el] ?? 'yaya'
    if (old.stage === 'evolved') {
      const lines = OLD_LINE_MAP[el] ?? OLD_LINE_MAP.wood
      const chain = old.evoClass === 'warrior' ? lines.attack : lines.support
      speciesId = old.level >= 50 ? chain[2] : old.level >= 30 ? chain[1] : chain[0]
    }
    const species = SPECIES_MAP[speciesId]
    const st = calcStats(species, old.level, old.stats ?? { nature: 0, vigor: 0, mana: 0 })
    return { ...old, speciesId, name: species.name, element: species.element, ...st, hp: st.maxHp }
  })()
  return { ...base, job: base.job ?? null, stamina: base.stamina ?? 100 }
}

const newPlot = (): Plot => ({ cropId: null, plantedAt: 0, waterCount: 0, fertilizer: 0, level: 0 })

function initialState(): GameState {
  return {
    coins: 120,
    farmExp: 0,
    farmLevel: 1,
    inventory: {
      seed_carrot: 3, seed_leaf: 2, fert: 2,
      crystal_wood: 1, crystal_fire: 1, crystal_water: 1,
    },
    plots: Array.from({ length: 6 }, newPlot),
    animals: [],
    eggs: [],
    sprites: [],
    worldBossHp: WORLD_BOSS_MAX,
    worldBossMax: WORLD_BOSS_MAX,
    chat: [{ id: 0, text: '📢 欢迎来到晶灵农场物语！种田养殖，孵化水晶精灵，打造你的五行农场！', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }],
    feedLog: [],
    gender: null,
    dex: [],
    hatchPity: { sinceEpic: 0, sinceLegend: 0 },
    lastHatch: null,
    lastHatchRarity: null,
  ownedEquips: [],
  equipLevels: {},
  eliteDaily: { date: '', ids: [] },
  sellLog: [],
  ownerEquip: {},
    goalsClaimed: [],
    firstEarthCrystalGranted: false,
  }
}

function loadState(): GameState {
  try {
    const raw = saveStore.read()
    if (raw) {
      const raw2 = JSON.parse(raw) as Record<string, unknown>
      const parsed = raw2 as unknown as GameState
      if (parsed && parsed.plots && parsed.inventory) {
        const sprites = (parsed.sprites ?? []).map(migrateSprite)
        const dex = Array.from(new Set([...(parsed.dex ?? []), ...sprites.map(sp => sp.speciesId)]))
        // 地块迁移：旧版 watered → waterCount
        const oldPlots = (raw2.plots ?? []) as (Partial<Plot> & { watered?: boolean })[]
        const plots: Plot[] = oldPlots.slice(0, MAX_PLOTS).map(p => ({
          cropId: p.cropId ?? null,
          plantedAt: p.plantedAt ?? 0,
          waterCount: p.waterCount ?? (p.watered ? 1 : 0),
          fertilizer: (p.fertilizer ?? 0) as Plot['fertilizer'],
          level: (p.level ?? 0) as Plot['level'],
          pest: p.pest ?? 0,
          kind: p.kind ?? 'soil',
        }))
        // 精灵蛋迁移：旧版 pure → rarity
        const eggs: SpriteEgg[] = (parsed.eggs ?? []).map(e => ({
          uid: e.uid, element: e.element, hatchAt: e.hatchAt,
          rarity: e.rarity ?? ((e as SpriteEgg & { pure?: boolean }).pure ? 'fine' : 'common'),
        }))
        return {
          ...initialState(), ...parsed, plots, eggs, sprites, dex,
          gender: parsed.gender ?? null, chat: initialState().chat,
          farmExp: parsed.farmExp ?? 0, farmLevel: Math.max(1, Number(parsed.farmLevel) || 1),
          worldBossMax: WORLD_BOSS_MAX,
          worldBossHp: Math.min(WORLD_BOSS_MAX, Math.max(1, Number(parsed.worldBossHp) || WORLD_BOSS_MAX)),
          hatchPity: parsed.hatchPity ?? { sinceEpic: 0, sinceLegend: 0 },
          lastHatch: null, // 破壳画面是一次性事件，重载后不再弹
          lastHatchRarity: null,
        goalsClaimed: (parsed as Partial<GameState>).goalsClaimed ?? [],
      ownedEquips: (parsed as Partial<GameState>).ownedEquips ?? [],
      equipLevels: (parsed as Partial<GameState>).equipLevels ?? {},
      eliteDaily: (parsed as Partial<GameState>).eliteDaily ?? { date: '', ids: [] },
      sellLog: Array.isArray(parsed.sellLog) ? parsed.sellLog.slice(-12) : [],
      ownerEquip: (parsed as Partial<GameState>).ownerEquip ?? {},
          firstEarthCrystalGranted: parsed.firstEarthCrystalGranted ?? false,
        }
      }
    }
  } catch { /* ignore */ }
  return initialState()
}

/** 等级提升后重算属性（保持血量比例），并检查进化，返回进化信息 */
function levelUpSprite(sp: Sprite): { sp: Sprite; evolvedTo?: string } {
  let cur = sp
  let evolvedTo: string | undefined
  for (;;) {
    const species = SPECIES_MAP[cur.speciesId]
    const hpRatio = cur.maxHp > 0 ? cur.hp / cur.maxHp : 1
    const st = calcStats(species, cur.level, cur.stats)
    cur = { ...cur, ...st, hp: Math.max(1, Math.round(st.maxHp * hpRatio)) }
    // 进化检查
    let target: string | undefined
    if (species.line === 'baby' && cur.level >= EVOLVE_LEVEL.adult && species.evoAttack) {
      const dom = (Object.entries(cur.stats) as [FeedStat, number][]).sort((a, b) => b[1] - a[1])[0][0]
      target = dom === 'vigor' ? species.evoAttack : species.evoSupport
    } else if (species.stage === 'adult' && cur.level >= EVOLVE_LEVEL.complete) {
      target = species.evolvesTo
    } else if (species.stage === 'complete' && cur.level >= EVOLVE_LEVEL.ultimate) {
      target = species.evolvesTo
    }
    if (!target || !SPECIES_MAP[target]) break
    const ns = SPECIES_MAP[target]
    const nst = calcStats(ns, cur.level, cur.stats)
    cur = { ...cur, speciesId: ns.id, element: ns.element, ...nst, hp: nst.maxHp }
    evolvedTo = ns.name
  }
  return { sp: cur, evolvedTo }
}

// -------------------- 孵化池：品质分 → 稀有度 --------------------
const HATCH_RULES: { min: number; max: number; rarity: Rarity; time: number }[] = [
  { min: 5, max: 5, rarity: 'common', time: 30 },
  { min: 6, max: 10, rarity: 'fine', time: 120 },
  { min: 11, max: 15, rarity: 'rare', time: 480 },
  { min: 16, max: 19, rarity: 'epic', time: 1800 },
  { min: 20, max: 99, rarity: 'legend', time: 7200 },
]
export function rarityByScore(score: number): { rarity: Rarity; time: number } {
  const r = HATCH_RULES.find(x => score >= x.min && score <= x.max) ?? HATCH_RULES[0]
  return { rarity: r.rarity, time: r.time }
}

export function useGame() {
  /** 当前选中的种子（放在游戏层，右栏与农场共用） */
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null)
  const [state, setState] = useState<GameState>(loadState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const tickCount = useRef(0)

  const notify = useCallback((text: string) => {
    const id = ++toastId.current
    setToasts(t => [...t.slice(-4), { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600)
  }, [])

  // 存档
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        const { chat, ...rest } = s
        void chat
        saveStore.write(JSON.stringify(rest))
        return s
      })
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // 每秒 tick：动物饱腹/产出、精灵回血/体力、工作产出、世界BOSS、假聊天
  useEffect(() => {
    const t = setInterval(() => {
      tickCount.current += 1
      const doWorkExp = tickCount.current % 30 === 0
      setState(s => {
        let animals = s.animals.map(a => {
          let { satiety, produceProgress, produceReady } = a
          satiety = Math.max(0, satiety - 0.5)
          if (satiety > 0 && produceReady < 3) {
            produceProgress += 1
            const def = ANIMALS.find(d => d.id === a.type)!
            if (produceProgress >= def.produceTime) {
              produceProgress = 0
              produceReady += 1
            }
          }
          return { ...a, satiety, produceProgress, produceReady }
        })
        const wb = workBonuses(s)
        let inv = { ...s.inventory }
        let invChanged = false
        const actedIds: string[] = []
        const sprites = s.sprites.map(sp => {
          let cur = sp
          // 回血
          if (cur.hp < cur.maxHp) cur = { ...cur, hp: Math.min(cur.maxHp, cur.hp + Math.max(1, Math.round(cur.maxHp * 0.01))) }
          // 体力：工作每分钟-1，休息每小时+20
          if (cur.job) {
            const st2 = Math.max(0, cur.stamina - 1 / 60)
            if (st2 !== cur.stamina) cur = { ...cur, stamina: st2 }
          } else if (cur.stamina < 100) {
            cur = { ...cur, stamina: Math.min(100, cur.stamina + 20 / 3600) }
          }
          return cur
        })
        // ---------------- 虫害：生长中的地有小概率长虫 ----------------
        const tick = tickCount.current
        let plots = s.plots
        let newPest = 0
        // 有火系驱虫精灵在岗时，作物不容易招虫
        const pestAdeptOnDuty = s.sprites.some(sp => sp.job === 'pest' && sp.stamina > 1
          && !!JOBS.find(j => j.id === 'pest')?.best.includes(sp.element))
        const pestRate = pestAdeptOnDuty ? 0.00055 : 0.0011
        plots = plots.map(p => {
          if (!p.cropId || p.pest || plotProgress(p, wb) >= 1) return p
          if (Math.random() < pestRate) { newPest += 1; return { ...p, pest: 1 } }
          return p
        })
        if (newPest > 0) {
          setTimeout(() => notify('🐛 有地块闹虫了！派个会「驱虫」的精灵，或者点地块手动驱虫'), 30)
        }

        // ---------------- 自动工作：每个工种挑效率最高的那只 ----------------
        const workers = s.sprites.filter(sp => sp.job && sp.stamina > 1)
        const bestWorker = (job: string) => workers
          .filter(w => w.job === job)
          .sort((a, b) => jobEff(b) - jobEff(a))[0]
        const isAdept = (job: string, sp: Sprite) => !!JOBS.find(j => j.id === job)?.best.includes(sp.element)
        /** 动作间隔（秒）：擅长的元素缩短 30% */
        const every = (job: string, base: number, sp: Sprite) => (isAdept(job, sp) ? Math.round(base * 0.7) : base)

        // 浇水
        const waterWorker = bestWorker('water')
        if (waterWorker && tick % every('water', 20, waterWorker) === 0) {
          const idx = plots.findIndex(p => p.cropId && p.waterCount < 3 && plotProgress(p, wb) < 1)
          if (idx >= 0) {
            const crop = CROPS.find(c => c.id === plots[idx].cropId)
            const adept = isAdept('water', waterWorker) && crop
            plots = plots.map((p, i) => (i === idx
              ? { ...p, waterCount: p.waterCount + 1, plantedAt: p.plantedAt - (adept ? crop!.growTime * 1000 * 0.02 : 0) }
              : p))
            actedIds.push(waterWorker.id)
            notify(`「${waterWorker.name}」给第 ${idx + 1} 块地浇了水${adept ? '（水系加成：额外长了一点）' : ''}`)
          }
        }

        // 收获：成熟了自己收（用和玩家同一套结算）
        let autoState: GameState | null = null
        const harvestWorker = bestWorker('harvest')
        if (harvestWorker && tick % every('harvest', 15, harvestWorker) === 0) {
          const base = autoState ?? { ...s, plots, inventory: inv }
          const readyIdx = base.plots.findIndex(p => p.cropId && plotProgress(p, workBonuses(base)) >= 1)
          if (readyIdx >= 0) {
            const r = harvestOne(base, readyIdx)
            if (r) {
              autoState = r.next
              let bonus = 0
              if (isAdept('harvest', harvestWorker)) {
                // 木系擅长收获：多收 1 份
                addItem(autoState.inventory, r.q === 1 ? r.crop.id : `${r.crop.id}_q${r.q}`, 1)
                bonus = 1
              }
              actedIds.push(harvestWorker.id)
              let msg = `「${harvestWorker.name}」自己收了 ${r.crop.name} ×${r.yieldN + bonus}`
              if (bonus) msg += '（木系加成 +1）'
              if (r.crystals > 0) msg += `，还捡到结晶×${r.crystals}`
              notify(msg)
            }
          }
        }
        if (autoState) { plots = autoState.plots; inv = autoState.inventory; invChanged = true }

        // 施肥：拿背包里的普通肥料替一块没施肥的地施肥
        const fertWorker = bestWorker('fertilize')
        if (fertWorker && tick % every('fertilize', 45, fertWorker) === 0) {
          const hasFert = (inv.fert ?? 0) > 0
          const pending = plots.findIndex(p => p.cropId && !p.fertilizer && plotProgress(p, wb) < 1)
          if (hasFert && pending >= 0) {
            addItem(inv, 'fert', -1)
            invChanged = true
            plots = plots.map((p, i) => (i === pending ? { ...p, fertilizer: 1 as Plot['fertilizer'] } : p))
            let extraMsg = ''
            // 土系擅长施肥：顺手把下一块也没施肥的地一起施了（不额外消耗肥料）
            if (isAdept('fertilize', fertWorker)) {
              const second = plots.findIndex(p => p.cropId && !p.fertilizer && plotProgress(p, wb) < 1)
              if (second >= 0) {
                plots = plots.map((p, i) => (i === second ? { ...p, fertilizer: 1 as Plot['fertilizer'] } : p))
                extraMsg = `，土系加成顺手把第 ${second + 1} 块也施了`
              }
            }
            actedIds.push(fertWorker.id)
            notify(`「${fertWorker.name}」用 1 袋普通肥料给第 ${pending + 1} 块地施了肥${extraMsg}`)
          }
        }

        // 驱虫
        const pestWorker = bestWorker('pest')
        if (pestWorker && tick % every('pest', 12, pestWorker) === 0) {
          const infested = plots.findIndex(p => p.pest)
          if (infested >= 0) {
            plots = plots.map((p, i) => (i === infested ? { ...p, pest: 0 } : p))
            actedIds.push(pestWorker.id)
            notify(`「${pestWorker.name}」把第 ${infested + 1} 块地的虫赶跑了`)
          }
        }

        // 喂食：自动喂最饿的一只动物（用背包里它能吃的饲料作物）
        const feedWorker = bestWorker('feed')
        if (feedWorker && tick % every('feed', 30, feedWorker) === 0) {
          const hungry = [...animals].sort((x, y) => x.satiety - y.satiety)[0]
          if (hungry && hungry.satiety < 100) {
            const def = ANIMALS.find(d => d.id === hungry.type)!
            const pick = def.foods
              .flatMap(f => Object.keys(inv).filter(k => (k === f || k.startsWith(`${f}_q`)) && (inv[k] ?? 0) > 0))
              .sort((a, b) => (inv[a] ?? 0) - (inv[b] ?? 0))[0]
            if (pick) {
              addItem(inv, pick, -1)
              invChanged = true
              const { q } = parseItem(pick)
              const gain = 35 + (q - 1) * 10 + (isAdept('feed', feedWorker) ? 10 : 0)
              const idx = animals.findIndex(a => a.uid === hungry.uid)
              animals = animals.map((a, i) => (i === idx ? { ...a, satiety: Math.min(100, a.satiety + gain) } : a))
              actedIds.push(feedWorker.id)
              notify(`「${feedWorker.name}」喂了 ${def.name} ${itemName(pick) || pick}（饱腹 +${Math.round(gain)}${isAdept('feed', feedWorker) ? '，木/土系加成' : ''}）`)
            }
          }
        }

        // 看守：帮玩家把动物的产出收进背包
        const guardWorker = bestWorker('guard')
        if (guardWorker && tick % every('guard', 40, guardWorker) === 0) {
          const a = animals.find(x => x.produceReady > 0)
          if (a) {
            const def = ANIMALS.find(d => d.id === a.type)!
            const got = a.produceReady
            addItem(inv, def.produceId, got)
            if (def.fert && def.fertN) addItem(inv, def.fert, def.fertN)
            invChanged = true
            a.produceReady = 0
            actedIds.push(guardWorker.id)
            notify(`「${guardWorker.name}」帮你收了 ${def.produceName} ×${got}`)
          }
        }

        // 采光工作：随机水晶（平均每10分钟1颗/效率）
        if (wb.mineCount > 0 && Math.random() < wb.mineCount / 600) {
          const el = ELEMENT_LIST[Math.floor(Math.random() * ELEMENT_LIST.length)]
          inv[`crystal_${el}`] = (inv[`crystal_${el}`] ?? 0) + 1
          invChanged = true
          notify(`采集精灵带回了一颗 ${ELEMENTS[el].name}结晶！`)
        }
        // 农场工作经验：每30秒+1（平均每分钟+2）
        let finalSprites = sprites
        if (doWorkExp) {
          finalSprites = sprites.map(sp => {
            if (!sp.job || sp.stamina <= 0) return sp
            let { level, exp } = sp
            exp += 1
            while (exp >= expForLevel(level)) { exp -= expForLevel(level); level += 1 }
            if (level !== sp.level) {
              const { sp: ns, evolvedTo } = levelUpSprite({ ...sp, level, exp })
              if (evolvedTo) setTimeout(() => notify(`🌟 「${sp.name}」在工作中进化为 ${evolvedTo}！`), 50)
              return ns
            }
            return { ...sp, level, exp }
          })
        }
        if (actedIds.length) {
          const now = Date.now()
          finalSprites = finalSprites.map(sp => (actedIds.includes(sp.id) ? { ...sp, actedAt: now } : sp))
        }
        // 世界BOSS被全服玩家缓慢削血，打死后刷新
        let worldBossHp = s.worldBossHp - (Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 6) : 0)
        if (worldBossHp <= 0) worldBossHp = s.worldBossMax
        return { ...s, animals, sprites: finalSprites, plots, worldBossHp, ...(invChanged ? { inventory: inv } : {}) }
      })
      // 随机世界频道聊天
      if (Math.random() < 0.22) {
        setState(s => {
          const players = ['种田大户老王', '精灵大师小樱', '肝帝本帝', '摸鱼选手阿茶', '农场主李大壮', '结晶收藏家', '不眠的守夜人', '胡萝卜杀手', '云端牧歌', '奶牛皮卡丘', '一颗小灵莓', '风之旅人', '星尘召唤师', '羊毛大亨', '萌新求带']
          const tpls = [
            '{p} 在世界频道喊：有没有人组队打苍穹古龙？来个森罗守卫奶妈！',
            '{p} 晒出了刚进化的 {e} 星辉法师，全频道沸腾了！',
            '{p}：今天的草莓大丰收，卖了 500 金币嘿嘿',
            '{p} 孵化池出了闪光 {e} 传说蛋，欧皇本皇！',
            '{p}：萌新提问，绵绵羊不吃胡萝卜怎么办？在线等',
            '{p} 对苍穹古龙造成了 9999 点伤害！',
            '{p}：收上品光结晶，200 金币一枚，无限收！',
            '{p} 的烈焰斗士一刀秒了月夜魔狼，离谱！',
            '{p}：这游戏种田真上头，我已经种了一整夜了',
            '{p} 在世界BOSS战中拿下了最后一击！',
            '{p}：谁知道花奶牛为什么不下奶？——要先喂金玉米啊兄弟',
            '{p} 的农场升到了仙土，品质直接起飞！',
            '{p}：人参掉极品水晶的概率也太高了，快去种！',
          ]
          const p = players[Math.floor(Math.random() * players.length)]
          const el = ELEMENT_LIST[Math.floor(Math.random() * ELEMENT_LIST.length)]
          const text = tpls[Math.floor(Math.random() * tpls.length)].replace('{p}', p).replace('{e}', ELEMENTS[el].icon)
          const msg: ChatMsg = { id: Date.now(), text, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
          return { ...s, chat: [...s.chat.slice(-30), msg] }
        })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [notify])


  // -------------------- 商店 --------------------
  const buySeed = useCallback((cropId: string) => {
    const crop = CROPS.find(c => c.id === cropId)
    if (!crop) { notify('未知种子'); return }
    // 勿在 setState updater 内再 notify/setToasts（React 19 可能整次更新被取消 → 点击完全无反应）
    let msg = ''
    setState(s => {
      if (s.farmLevel < crop.unlockLv) {
        msg = `农场 Lv.${crop.unlockLv} 解锁${crop.name}！`
        return s
      }
      if (s.coins < crop.seedPrice) {
        msg = '金币不足！'
        return s
      }
      const inv = { ...s.inventory }
      addItem(inv, `seed_${cropId}`, 1)
      msg = `购买了 ${crop.icon}${crop.name}种子`
      return { ...s, coins: s.coins - crop.seedPrice, inventory: inv }
    })
    if (msg) notify(msg)
  }, [notify, addItem])

  const buyAnimal = useCallback((type: string) => {
    const def = ANIMALS.find(a => a.id === type)
    if (!def) { notify('未知动物'); return }
    let msg = ''
    setState(s => {
      if (s.coins < def.price) {
        msg = '金币不足！'
        return s
      }
      msg = `迎来了新伙伴 ${def.icon}${def.name}！`
      return { ...s, coins: s.coins - def.price, animals: [...s.animals, { uid: uid(), type, satiety: 60, produceProgress: 0, produceReady: 0 }] }
    })
    if (msg) notify(msg)
  }, [notify])

  const sellItem = useCallback((itemId: string) => {
    setState(s => {
      if (!s.inventory[itemId]) return s
      const { base, q } = parseItem(itemId)
      const mul = QUALITIES[q - 1].sellMul
      let price = 0
      const crop = CROPS.find(c => c.id === base)
      const animal = ANIMALS.find(a => a.produceId === base)
      const fert = FERTILIZERS.find(f => f.id === base)
      if (crop) price = Math.round(crop.sellPrice * mul)
      else if (animal) price = Math.round(animal.sellPrice * mul)
      else if (fert) price = base === 'fert_rare' ? 60 : 15
      else if (base.startsWith('crystal_')) price = CRYSTAL_Q[Math.min(q, 4) - 1].sellPrice
      else if (MATERIALS.some(m => m.id === base)) price = MATERIALS.find(m => m.id === base)!.price
      else return s
      price = Math.round(price * workBonuses(s).coinMul)
      const inv = { ...s.inventory }
      addItem(inv, itemId, -1)
      notify(`卖出 ${itemName(itemId)}，+${price} 金币`)
      const sellLog = [...(s.sellLog ?? []), { id: itemId, price }].slice(-12)
      return { ...s, coins: s.coins + price, inventory: inv, sellLog }
    })
  }, [notify, addItem])

  /** 误卖回购：按当时卖价买回最近卖出的一件 */
  const buyBack = useCallback((index: number) => {
    setState(s => {
      const log = s.sellLog ?? []
      const entry = log[index]
      if (!entry) return s
      if (s.coins < entry.price) { notify('金币不够买回这一件'); return s }
      const inv = { ...s.inventory }
      addItem(inv, entry.id, 1)
      notify(`回购 ${itemName(entry.id)}，-${entry.price} 金币`)
      return { ...s, coins: s.coins - entry.price, inventory: inv, sellLog: log.filter((_, i) => i !== index) }
    })
  }, [notify, addItem])

  // -------------------- 农场 --------------------
  const plant = useCallback((plotIdx: number, cropId: string) => {
    setState(s => {
      const seedId = `seed_${cropId}`
      if (!s.inventory[seedId]) { notify('没有这种种子！'); return s }
      const cropDef = CROPS.find(c => c.id === cropId)
      const plotKind = s.plots[plotIdx]?.kind ?? 'soil'
      if (cropDef?.onlyKind && cropDef.onlyKind !== plotKind) {
        notify(`${cropDef.name}只能种在${PLOT_KINDS[cropDef.onlyKind].name}里`)
        return s
      }
      const plots = s.plots.map((p, i) => i === plotIdx ? { ...p, cropId, plantedAt: Date.now(), waterCount: 0, fertilizer: 0 as Plot['fertilizer'] } : p)
      const inv = { ...s.inventory }
      addItem(inv, seedId, -1)
      return { ...s, plots, inventory: inv }
    })
  }, [notify, addItem])

  /** 一键补种：把空地按「现有种子最多的、当前等级与地块类型允许的」作物补上 */
  const replantAll = useCallback(() => {
    setState(s => {
      const inv = { ...s.inventory }
      const plots = [...s.plots]
      let n = 0
      for (let i = 0; i < plots.length; i++) {
        const p = plots[i]
        if (p.cropId) continue
        const kind = p.kind ?? 'soil'
        const cands = CROPS
          .filter(c => s.farmLevel >= c.unlockLv && (!c.onlyKind || c.onlyKind === kind) && (inv[`seed_${c.id}`] ?? 0) > 0)
          .sort((a, b) => (inv[`seed_${b.id}`] ?? 0) - (inv[`seed_${a.id}`] ?? 0))
        if (!cands.length) break
        const c = cands[0]
        addItem(inv, `seed_${c.id}`, -1)
        plots[i] = { ...p, cropId: c.id, plantedAt: Date.now(), waterCount: 0, fertilizer: 0 as Plot['fertilizer'] }
        n += 1
      }
      if (!n) { notify('没有可补种的空地或种子'); return s }
      notify(`一键补种：${n} 块地已经重新播上`)
      return { ...s, plots, inventory: inv }
    })
  }, [notify, addItem])

  const water = useCallback((plotIdx: number) => {
    setState(s => {
      const p = s.plots[plotIdx]
      if (!p.cropId) return s
      if (p.waterCount >= 3) { notify('这块地已经浇透啦（最多3次）'); return s }
      const crop = CROPS.find(c => c.id === p.cropId)!
      // 浇水：进度+10%（回拨播种时间）
      const boosted = p.plantedAt - crop.growTime * 1000 * 0.1
      const plots = s.plots.map((x, i) => i === plotIdx ? { ...x, plantedAt: boosted, waterCount: x.waterCount + 1 } : x)
      notify(`💧 浇水成功（${p.waterCount + 1}/3），生长加速！`)
      return { ...s, plots }
    })
  }, [notify])

  const fertilize = useCallback((plotIdx: number, fertId: string) => {
    setState(s => {
      const p = s.plots[plotIdx]
      if (!p.cropId) { notify('先种上作物再施肥！'); return s }
      if (p.fertilizer !== 0) { notify('这块地已经施过肥了'); return s }
      const fert = FERTILIZERS.find(f => f.id === fertId)
      if (!fert || !s.inventory[fertId]) { notify(`没有${fert?.name ?? '肥料'}了`); return s }
      const inv = { ...s.inventory }
      addItem(inv, fertId, -1)
      const plots = s.plots.map((x, i) => i === plotIdx ? { ...x, fertilizer: (fertId === 'fert_rare' ? 2 : 1) as Plot['fertilizer'] } : x)
      notify(`施了${fert.name}，品质权重+${Math.round(fert.qualAdd * 100)}%！`)
      return { ...s, plots, inventory: inv }
    })
  }, [notify, addItem])


  // 单块收获：给批量收获复用同一套结算（不通知，交给调用方汇总）
  const harvestOne = (s: GameState, plotIdx: number) => {
    const p = s.plots[plotIdx]
    if (!p.cropId) return null
    const crop = CROPS.find(c => c.id === p.cropId)!
    if (plotProgress(p, workBonuses(s)) < 1) return null
    const wb = workBonuses(s)
    const inv = { ...s.inventory }
    const q = rollQuality(s, p)
    let yieldN = crop.yield
    if (Math.random() < wb.guardExtra) yieldN += 1 // 看守精灵：额外产量
    addItem(inv, q === 1 ? crop.id : `${crop.id}_q${q}`, yieldN)
    // 竖切：首次收获胡萝卜直接给 2 颗土结晶 —— 配合初始 3 颗正好凑齐 5 颗，
    // 第一次收获就能去孵化池，早鸟不用等 10 分钟以上。
    let firstEarthCrystalGranted = s.firstEarthCrystalGranted
    const firstEarth = !firstEarthCrystalGranted && crop.id === 'carrot'
    if (firstEarth) {
      addItem(inv, 'crystal_earth', 2)
      firstEarthCrystalGranted = true
    }
    // 水晶掉落（1-3颗，品质按水晶权重）
    let crystals = 0
    const crystalChance = crop.crystalChance + PLOT_LEVELS[p.level].crystalAdd + PLOT_KINDS[p.kind ?? 'soil'].crystalAdd + wb.crystalAdd
    if (Math.random() < crystalChance) {
      const n = Math.random() < 0.6 ? 1 : Math.random() < 0.75 ? 2 : 3
      for (let i = 0; i < n; i++) {
        const el: Element = crop.crystalElement === 'any' ? ELEMENT_LIST[Math.floor(Math.random() * ELEMENT_LIST.length)] : crop.crystalElement
        const cq = rollCrystalQuality(PLOT_LEVELS[p.level].crystalAdd)
        addItem(inv, cq === 1 ? `crystal_${el}` : `crystal_${el}_q${cq}`, 1)
        crystals += 1
      }
    }
    let { farmExp, farmLevel } = s
    farmExp += 6 + Math.floor(crop.growTime / 10)
    let levelUps = 0
    while (farmExp >= farmExpForLevel(farmLevel)) {
      farmExp -= farmExpForLevel(farmLevel)
      farmLevel += 1
      levelUps += 1
    }
    const plots = s.plots.map((x, i) => i === plotIdx ? { ...x, cropId: null, plantedAt: 0, waterCount: 0, fertilizer: 0 as Plot['fertilizer'] } : x)
    return { next: { ...s, plots, inventory: inv, farmExp, farmLevel, firstEarthCrystalGranted }, crop, q, yieldN, crystals, firstEarth, levelUps }
  }

  // 手动驱虫（自动驱虫由「驱虫」工种的精灵在 tick 里做）
  const clearPest = useCallback((plotIdx: number) => {
    setState(s => {
      const p = s.plots[plotIdx]
      if (!p || !p.pest) return s
      notify(`🐛 你把第 ${plotIdx + 1} 块地的虫赶走了，作物恢复生长`)
      return { ...s, plots: s.plots.map((x, i) => (i === plotIdx ? { ...x, pest: 0 } : x)) }
    })
  }, [notify])

  const harvest = useCallback((plotIdx: number) => {
    setState(s => {
      const r = harvestOne(s, plotIdx)
      if (!r) return s
      const qd = QUALITIES[r.q - 1]
      let msg = r.q === 1
        ? `收获 ${r.crop.icon}${r.crop.name} ×${r.yieldN}`
        : `收获 ${r.crop.icon}【${qd.name}】${r.crop.name} ×${r.yieldN}！`
      if (r.firstEarth) msg += '，获得土结晶×2！5 颗齐了，去孵化池孵蛋吧 🥚'
      if (r.crystals > 0) msg += `，凝结出结晶×${r.crystals}！`
      if (r.levelUps > 0) msg += ` 🎉 农场升到 Lv.${r.next.farmLevel}！`
      notify(msg)
      return r.next
    })
  }, [notify])

  // 一键浇水：所有需要浇水的作物立即 +1 次，不用等小农夫逐块走
  const waterAll = useCallback(() => {
    setState(s => {
      let count = 0
      const plots = s.plots.map(p => {
        if (!p.cropId || p.waterCount >= 3) return p
        const crop = CROPS.find(c => c.id === p.cropId)
        if (!crop) return p
        count += 1
        return { ...p, plantedAt: p.plantedAt - crop.growTime * 1000 * 0.1, waterCount: p.waterCount + 1 }
      })
      if (count === 0) { notify('没有需要浇水的作物（没种地或都已浇透）'); return s }
      notify(`💧 一键浇水：${count} 块地各 +1 次，作物都加快了`)
      return { ...s, plots }
    })
  }, [notify])

  // 一键收获：把所有成熟的地块一次收完，结算与单块收获一致
  const harvestAll = useCallback(() => {
    setState(s => {
      let next = s
      let count = 0
      let items = 0
      let crystals = 0
      let firstEarth = false
      let levelUps = 0
      for (let i = 0; i < s.plots.length; i++) {
        const r = harvestOne(next, i)
        if (!r) continue
        next = r.next
        count += 1
        items += r.yieldN
        crystals += r.crystals
        firstEarth = firstEarth || r.firstEarth
        levelUps += r.levelUps
      }
      if (count === 0) { notify('没有成熟的作物，先浇水等它们长大吧 🌱'); return s }
      notify(`🧺 一键收获 ${count} 块地：作物×${items}${crystals > 0 ? `、结晶×${crystals}` : ''}${firstEarth ? '、土结晶×2（够 5 颗，去孵化池！）' : ''}${levelUps > 0 ? ` 🎉 农场升到 Lv.${next.farmLevel}` : ''}`)
      return next
    })
  }, [notify])

  // 土地升级
  const upgradePlot = useCallback((plotIdx: number) => {
    setState(s => {
      const p = s.plots[plotIdx]
      if (!p || p.level >= 3) return s
      const next = PLOT_LEVELS[p.level + 1]
      if (s.coins < next.cost.coins) { notify(`金币不足！升级${next.name}需要 💰${next.cost.coins}`); return s }
      const inv = { ...s.inventory }
      if (next.cost.fert) {
        if ((inv['fert'] ?? 0) < next.cost.fert) { notify(`需要 普通肥料×${next.cost.fert}`); return s }
        addItem(inv, 'fert', -next.cost.fert)
      }
      if (next.cost.midCrystal) {
        const mids = Object.keys(inv).filter(id => id.startsWith('crystal_') && parseItem(id).q === 2 && (inv[id] ?? 0) > 0)
        const total = mids.reduce((n, id) => n + inv[id], 0)
        if (total < next.cost.midCrystal) { notify(`需要 中品结晶×${next.cost.midCrystal}（任意属性）`); return s }
        let need = next.cost.midCrystal
        for (const id of mids) { const take = Math.min(need, inv[id]); addItem(inv, id, -take); need -= take; if (need <= 0) break }
      }
      if (next.cost.topCrystal) {
        const tops = Object.keys(inv).filter(id => id.startsWith('crystal_') && parseItem(id).q === 4 && (inv[id] ?? 0) > 0)
        const total = tops.reduce((n, id) => n + inv[id], 0)
        if (total < next.cost.topCrystal) { notify(`需要 极品结晶×${next.cost.topCrystal}（任意属性）`); return s }
        let need = next.cost.topCrystal
        for (const id of tops) { const take = Math.min(need, inv[id]); addItem(inv, id, -take); need -= take; if (need <= 0) break }
      }
      const plots = s.plots.map((x, i) => i === plotIdx ? { ...x, level: (x.level + 1) as Plot['level'] } : x)
      notify(`✨ 地块升级为「${next.name}」！生长×${next.speedMul} 品质+${Math.round(next.qualAdd * 100)}%`)
      return { ...s, coins: s.coins - next.cost.coins, plots, inventory: inv }
    })
  }, [notify, addItem])

  // 扩建地块
  const expandPlot = useCallback(() => {
    setState(s => {
      if (s.plots.length >= MAX_PLOTS) { notify('农场已经扩到最大啦（24块）'); return s }
      const cost = plotExpandCost(s.plots.length)
      if (s.coins < cost) { notify(`扩建需要 💰${cost}`); return s }
      notify(`🚜 开垦了新地块！现在有 ${s.plots.length + 1} 块田`)
      return { ...s, coins: s.coins - cost, plots: [...s.plots, newPlot()] }
    })
  }, [notify])

  /** 24 块地全开后，可以把空地改造成温室/池塘（只改类型，不增地） */
  const convertPlot = useCallback((plotIdx: number, kind: PlotKind) => {
    setState(s => {
      const p = s.plots[plotIdx]
      const def = PLOT_KINDS[kind]
      if (!p || p.kind === kind) return s
      if (s.plots.length < MAX_PLOTS) { notify(`先把 ${MAX_PLOTS} 块地全部开垦完`); return s }
      if (p.cropId) { notify('这块地还有作物，先收掉再改造'); return s }
      if (s.coins < def.price) { notify(`金币不够（需要 ${def.price}）`); return s }
      const plots = s.plots.map((x, i) => i === plotIdx ? { ...x, kind } : x)
      notify(`第 ${plotIdx + 1} 块地改造成${def.name}了`)
      return { ...s, plots, coins: s.coins - def.price }
    })
  }, [notify])

  // -------------------- 牧场 --------------------
  const feedAnimal = useCallback((animalUid: string, itemId: string) => {
    setState(s => {
      const a = s.animals.find(x => x.uid === animalUid)
      if (!a) return s
      const def = ANIMALS.find(d => d.id === a.type)!
      const { base, q } = parseItem(itemId)
      if (!def.foods.includes(base)) { notify(`${def.name} 不吃这个哦`); return s }
      if (!s.inventory[itemId]) { notify(`没有${itemName(itemId)}了`); return s }
      const inv = { ...s.inventory }
      addItem(inv, itemId, -1)
      const animals = s.animals.map(x => x.uid === animalUid ? { ...x, satiety: Math.min(100, x.satiety + 35 + (q - 1) * 10) } : x)
      return { ...s, animals, inventory: inv }
    })
  }, [notify, addItem])

  const collectProduce = useCallback((animalUid: string) => {
    setState(s => {
      const a = s.animals.find(x => x.uid === animalUid)
      if (!a || a.produceReady === 0) return s
      const def = ANIMALS.find(d => d.id === a.type)!
      const inv = { ...s.inventory }
      addItem(inv, def.produceId, a.produceReady)
      let msg = `收集 ${def.produceIcon}${def.produceName} ×${a.produceReady}`
      // 肥料产出
      if (def.fert && def.fertN) {
        addItem(inv, def.fert, def.fertN)
        msg += `，附带 ${FERTILIZERS.find(f => f.id === def.fert)?.icon}${FERTILIZERS.find(f => f.id === def.fert)?.name}×${def.fertN}`
      }
      if (Math.random() < def.crystalChance * a.produceReady) {
        const el: Element = def.crystalElement === 'any' ? ELEMENT_LIST[Math.floor(Math.random() * ELEMENT_LIST.length)] : def.crystalElement
        addItem(inv, `crystal_${el}`, 1)
        msg += `，意外获得 ${ELEMENTS[el].icon}${ELEMENTS[el].name}结晶！`
      }
      notify(msg)
      const animals = s.animals.map(x => x.uid === animalUid ? { ...x, produceReady: 0 } : x)
      return { ...s, animals, inventory: inv }
    })
  }, [notify, addItem])

  // -------------------- 水晶孵化池（5颗水晶） --------------------
  const incubate = useCallback((itemIds: string[]) => {
    setState(s => {
      if (itemIds.length !== 5) return s
      const inv = { ...s.inventory }
      for (const id of itemIds) {
        if (!id.startsWith('crystal_') || !inv[id]) { notify('需要 5 颗水晶！'); return s }
      }
      // 元素判定：数量最多的属性（并列随机）
      const counts = new Map<Element, number>()
      let score = 0
      for (const id of itemIds) {
        const { base, q } = parseItem(id)
        const el = base.replace('crystal_', '') as Element
        counts.set(el, (counts.get(el) ?? 0) + 1)
        score += Math.min(q, 4)
      }
      const maxN = Math.max(...counts.values())
      const tops = [...counts.entries()].filter(([, n]) => n === maxN).map(([e]) => e)
      const element = tops[Math.floor(Math.random() * tops.length)]
      for (const id of itemIds) addItem(inv, id, -1)

      // 稀有度判定 + 保底
      let { rarity, time } = rarityByScore(score)
      // 竖切引导期：尚无精灵时孵化上限压到 ≤10 秒（UI 读 hatchAt，时钟自动一致）
      if (s.sprites.length === 0) time = Math.min(time, 10)
      let pity = { ...s.hatchPity }
      let pityMsg = ''
      if (pity.sinceEpic >= 10 && (rarity === 'common' || rarity === 'fine' || rarity === 'rare')) {
        rarity = 'epic'; time = 1800; pityMsg = '（史诗保底触发！）'
      }
      if (pity.sinceLegend >= 50 && rarity !== 'legend') {
        rarity = 'legend'; time = 7200; pityMsg = '（传说保底触发！！）'
      }
      pity = {
        sinceEpic: rarity === 'epic' || rarity === 'legend' ? 0 : pity.sinceEpic + 1,
        sinceLegend: rarity === 'legend' ? 0 : pity.sinceLegend + 1,
      }
      const rName = { common: '普通', fine: '优质', rare: '稀有', epic: '史诗', legend: '传说' }[rarity]
      notify(`${ELEMENTS[element].name}系「${rName}」精灵蛋入孵！品质分${score}，约需 ${time >= 60 ? `${Math.round(time / 60)}分钟` : `${time}秒`}${pityMsg}`)
      const egg: SpriteEgg = { uid: uid(), element, rarity, hatchAt: Date.now() + time * 1000 }
      return { ...s, inventory: inv, eggs: [...s.eggs, egg], hatchPity: pity }
    })
  }, [notify, addItem])

  const hatch = useCallback((eggUid: string) => {
    setState(s => {
      const egg = s.eggs.find(e => e.uid === eggUid)
      if (!egg || Date.now() < egg.hatchAt) return s
      const babies = babiesOf(egg.element)
      const commons = babies.filter(b => b.rarity === 'common')
      const fine = babies.find(b => b.rarity === 'fine')
      const specials = specialsOf(egg.element)
      const limited = LIMITED_SPECIES.filter(x => x.element === egg.element)
      let species: SpriteSpecies
      let feedBonus = 0
      switch (egg.rarity) {
        case 'legend':
          species = limited[0] ?? specials[0] ?? fine ?? babies[0]; break
        case 'epic':
          species = specials[Math.floor(Math.random() * specials.length)] ?? fine ?? babies[0]
          feedBonus = 4 // 史诗蛋：天赋异禀，三维+4
          break
        case 'rare':
          species = specials[Math.floor(Math.random() * specials.length)] ?? fine ?? babies[0]; break
        case 'fine':
          species = fine ?? babies[0]; break
        default:
          species = commons[Math.floor(Math.random() * commons.length)] ?? babies[0]
      }
      const sprite = makeSprite(species, feedBonus)
      const tag = egg.rarity === 'legend' ? '👑 传说降临！' : egg.rarity === 'epic' ? '💜 史诗诞生！' : species.line === 'special' ? '🎉 稀有邂逅！特殊精灵' : species.rarity === 'fine' ? '🌟 优质幼体' : '🐣'
      notify(`${tag}「${sprite.name}」破壳而出！（${ELEMENTS[egg.element].name}系）`)
      return { ...s, eggs: s.eggs.filter(e => e.uid !== eggUid), sprites: [...s.sprites, sprite], dex: Array.from(new Set([...s.dex, species.id])), lastHatch: sprite.id, lastHatchRarity: egg.rarity }
    })
  }, [notify])

  const dismissHatch = useCallback(() => {
    setState(s => (s.lastHatch ? { ...s, lastHatch: null, lastHatchRarity: null } : s))
  }, [])

  // 限定传说召唤：五系结晶各 10 枚（任意品级，优先消耗低品级）
  const summonLimited = useCallback(() => {
    setState(s => {
      const inv = { ...s.inventory }
      const need = SUMMON_COST
      for (const el of ELEMENT_LIST) {
        const ids = Object.keys(inv)
          .filter(id => parseItem(id).base === `crystal_${el}` && (inv[id] ?? 0) > 0)
          .sort((a, b) => parseItem(a).q - parseItem(b).q)
        let left = need
        for (const id of ids) {
          if (left <= 0) break
          const take = Math.min(left, inv[id] ?? 0)
          if (take > 0) { addItem(inv, id, -take); left -= take }
        }
        if (left > 0) {
          setTimeout(() => notify(`需要五种元素结晶各 ${need} 枚（${ELEMENTS[el].name}还差 ${left}）`), 30)
          return s
        }
      }
      const species = LIMITED_SPECIES[Math.floor(Math.random() * LIMITED_SPECIES.length)]
      const sprite = makeSprite(species)
      notify(`传说降临！「${species.name}」回应了你的召唤！`)
      return { ...s, inventory: inv, sprites: [...s.sprites, sprite], dex: Array.from(new Set([...s.dex, species.id])) }
    })
  }, [notify, addItem])

  // -------------------- 精灵养成 --------------------
  // feedType: crop(自然) / produce(活力) / crystal(灵力)
  const feedSprite = useCallback((spriteId: string, itemId: string) => {
    setState(s => {
      const sp = s.sprites.find(x => x.id === spriteId)
      if (!sp) return s
      if (!s.inventory[itemId]) { notify('没有这个东西了'); return s }
      const { base, q } = parseItem(itemId)
      let stat: FeedStat
      let expGain = 0
      if (CROPS.find(c => c.id === base)) { stat = 'nature'; expGain = CROP_EXP[q - 1] }
      else if (ANIMALS.find(a => a.produceId === base)) { stat = 'vigor'; expGain = Math.round(18 * QUALITIES[q - 1].expMul) }
      else if (base.startsWith('crystal_')) { stat = 'mana'; expGain = 25 * Math.min(q, 4) }
      else return s

      const inv = { ...s.inventory }
      addItem(inv, itemId, -1)

      let evolvedSpeciesId: string | null = null
      const sprites = s.sprites.map(x => {
        if (x.id !== spriteId) return x
        const stats = { ...x.stats, [stat]: x.stats[stat] + 1 }
        let { level, exp } = x
        exp += expGain
        while (exp >= expForLevel(level)) { exp -= expForLevel(level); level += 1 }
        // 投喂恢复30体力
        const { sp, evolvedTo } = levelUpSprite({ ...x, level, exp, stats, stamina: Math.min(100, x.stamina + 30) })
        if (evolvedTo) {
          evolvedSpeciesId = sp.speciesId
          setTimeout(() => notify(`「${x.name}」进化为 ${evolvedTo}！`), 50)
        }
        return sp
      })
      const feedDesc = stat === 'nature' ? '🌿自然' : stat === 'vigor' ? '💪活力' : '💫灵力'
      const sp2 = sprites.find(x => x.id === spriteId)!
      notify(`投喂成功！「${sp2.name}」${feedDesc}+1，经验+${expGain}，体力+30（Lv.${sp2.level}）`)
      const dex = evolvedSpeciesId ? Array.from(new Set([...s.dex, evolvedSpeciesId])) : s.dex
      return { ...s, sprites, inventory: inv, dex }
    })
  }, [notify, addItem])

  // -------------------- 精灵工作 --------------------
  const assignJob = useCallback((spriteId: string, job: JobId | null) => {
    setState(s => {
      const sprites = s.sprites.map(x => x.id === spriteId ? { ...x, job } : x)
      const sp = s.sprites.find(x => x.id === spriteId)
      if (sp) {
        const jd = JOBS.find(j => j.id === job)
        notify(job && jd ? `🧑‍🌾「${sp.name}」开始负责${jd.icon}${jd.name}！` : `😴「${sp?.name}」回宿舍休息了`)
      }
      return { ...s, sprites }
    })
  }, [notify])

  // -------------------- 战斗结算 --------------------
  const battleWin = useCallback((spriteIds: string[], expGain: number, coins: number, crystals: Element[], boss = false, loot: { id: string; qty: number }[] = [], exclusive?: string, eliteId?: string) => {
    setState(s => {
      const inv = { ...s.inventory }
      crystals.forEach(el => addItem(inv, `crystal_${el}`, 1))
      loot.forEach(l => addItem(inv, l.id, l.qty))
      let evolvedSpeciesId: string | null = null
      const sprites = s.sprites.map(x => {
        if (!spriteIds.includes(x.id)) return x
        let { level, exp } = x
        exp += expGain
        while (exp >= expForLevel(level)) { exp -= expForLevel(level); level += 1 }
        const { sp, evolvedTo } = levelUpSprite({ ...x, level, exp })
        if (evolvedTo) {
          evolvedSpeciesId = sp.speciesId
          setTimeout(() => notify(`🌟 「${x.name}」在战斗中进化为 ${evolvedTo}！`), 50)
        }
        return sp
      })
      const dex = evolvedSpeciesId ? Array.from(new Set([...s.dex, evolvedSpeciesId])) : s.dex
      // 战利品：装备（BOSS 必掉 / 普通 25%）+ 星尘碎片（BOSS 1 颗 / 普通 15%）
      const ownedEquips = [...(s.ownedEquips ?? [])]
      // 门槛：等级决定能掉到几档装备；BOSS 必掉但同样受等级限制
      const lv = s.farmLevel
      const maxTier = boss ? (lv >= 45 ? 3 : lv >= 30 ? 2 : 1) : (lv >= 25 ? 2 : 1)
      const gearChance = boss ? 1 : lv >= 25 ? 0.25 : 0.12
      if (Math.random() < gearChance) {
        const owned = new Set(ownedEquips)
        const cand = EQUIPS.filter(e => !owned.has(e.id) && e.tier <= maxTier)
        if (cand.length) {
          const drop = cand[Math.floor(Math.random() * cand.length)]
          ownedEquips.push(drop.id)
          setTimeout(() => notify(`🎁 战斗掉落装备：${drop.name}（${drop.desc}）`), 80)
        }
      }
      // 精英怪专属：首次击杀必掉，之后再打就靠普通随机
      if (exclusive && !ownedEquips.includes(exclusive)) {
        const ex = EQUIP_MAP[exclusive]
        if (ex) {
          ownedEquips.push(exclusive)
          setTimeout(() => notify(`🎁 首次击杀掉落专属：${ex.name}（${ex.desc}）`), 80)
        }
      }
      // 精英每日首杀：当天第一次击杀该精英，额外给金币 + 结晶尘
      let eliteDaily = s.eliteDaily ?? { date: '', ids: [] }
      let dailyBonus = 0
      if (eliteId) {
        const today = new Date().toISOString().slice(0, 10)
        const ids = eliteDaily.date === today ? [...eliteDaily.ids] : []
        if (!ids.includes(eliteId)) {
          ids.push(eliteId)
          dailyBonus = Math.max(20, Math.round(coins * 0.6))
          addItem(inv, 'dust', 2)
          setTimeout(() => notify(`📅 每日首杀 ${eliteId ? '' : ''}+${dailyBonus} 金币、结晶尘 ×2`), 90)
        }
        eliteDaily = { date: today, ids }
      }
      const shards = boss ? 1 : Math.random() < 0.15 ? 1 : 0
      if (shards) {
        addItem(inv, 'star_shard', shards)
        setTimeout(() => notify(`✨ 战斗结束捡到星尘碎片 ×${shards}`), 60)
      }
      return { ...s, sprites, coins: s.coins + coins + dailyBonus, inventory: inv, dex, ownedEquips, eliteDaily }
    })
  }, [addItem, notify])

  // -------------------- 农场主装备 --------------------
  const equipItem = useCallback((equipId: string) => {
    setState(s => {
      const def = EQUIP_MAP[equipId]
      if (!def) return s
      if (!(s.ownedEquips ?? []).includes(equipId)) return s
      const next = { ...(s.ownerEquip ?? {}), [def.slot]: equipId }
      setTimeout(() => notify(`穿上了 ${def.name}`), 30)
      return { ...s, ownerEquip: next }
    })
  }, [notify])

  /** 用战利品材料强化装备：最高 5 级，每级 +25% 基础加成 */
  const craftCharm = useCallback(() => {
    const COST: { id: string; qty: number }[] = [
      { id: 'fiber', qty: 6 },
      { id: 'hide', qty: 4 },
      { id: 'dust', qty: 3 },
    ]
    setState(s => {
      const inv = { ...s.inventory }
      const lack = COST.find(c => (inv[c.id] ?? 0) < c.qty)
      if (lack) { setTimeout(() => notify(`材料不够：还差 ${itemName(lack.id)}`), 30); return s }
      const owned = new Set(s.ownedEquips ?? [])
      const pool = EQUIPS.filter(e => e.slot === 'charm' && e.tier <= 2 && !owned.has(e.id))
      if (!pool.length) { setTimeout(() => notify('饰品已经集齐了，材料先留着强化吧'), 30); return s }
      COST.forEach(c => addItem(inv, c.id, -c.qty))
      const got = pool[Math.floor(Math.random() * pool.length)]
      setTimeout(() => notify(`🧰 合成出饰品：${got.name}（${got.desc}）`), 40)
      return { ...s, inventory: inv, ownedEquips: [...(s.ownedEquips ?? []), got.id] }
    })
  }, [addItem, notify])

  const enhanceEquip = useCallback((equipId: string) => {
    setState(s => {
      const def = EQUIP_MAP[equipId]
      if (!def) return s
      if (!(s.ownedEquips ?? []).includes(equipId)) return s
      const cur = s.equipLevels?.[equipId] ?? 0
      if (cur >= EQUIP_MAX_LEVEL) {
        setTimeout(() => notify(`「${def.name}」已经是满级了`), 20)
        return s
      }
      const cost = enhanceCost(def.tier, cur + 1)
      const inv = { ...s.inventory }
      for (const c of cost) {
        if ((inv[c.id] ?? 0) < c.qty) {
          setTimeout(() => notify(`材料不够：还差 ${itemName(c.id)}`), 20)
          return s
        }
      }
      cost.forEach(c => addItem(inv, c.id, -c.qty))
      setTimeout(() => notify(`🔨 「${def.name}」强化到 +${cur + 1}`), 20)
      return { ...s, inventory: inv, equipLevels: { ...(s.equipLevels ?? {}), [equipId]: cur + 1 } }
    })
  }, [addItem, notify])

  const unequipSlot = useCallback((slot: 'tool' | 'outfit' | 'charm') => {
    setState(s => {
      const next = { ...(s.ownerEquip ?? {}) }
      delete next[slot]
      return { ...s, ownerEquip: next }
    })
  }, [])

  // 星辰觉醒：究极体 Lv60 + 3 颗星尘碎片 → 全属性 +20%
  const awakenStar = useCallback((spriteId: string) => {
    setState(s => {
      const sp = s.sprites.find(x => x.id === spriteId)
      if (!sp || sp.star) return s
      const species = SPECIES_MAP[sp.speciesId]
      if (!species || species.stage !== 'ultimate') { setTimeout(() => notify('只有究极体才能星辰觉醒'), 30); return s }
      if (sp.level < STAR_LEVEL) { setTimeout(() => notify(`需要 Lv.${STAR_LEVEL} 才能觉醒（当前 ${sp.level}）`), 30); return s }
      if ((s.inventory.star_shard ?? 0) < STAR_SHARD_COST) {
        setTimeout(() => notify(`星尘碎片不够（${s.inventory.star_shard ?? 0}/${STAR_SHARD_COST}），打 BOSS 掉`), 30)
        return s
      }
      if ((s.inventory.scale ?? 0) < STAR_SCALE_COST) {
        setTimeout(() => notify(`龙鳞不够（${s.inventory.scale ?? 0}/${STAR_SCALE_COST}），打苍穹古龙 / 星辉幼龙掉`), 30)
        return s
      }
      const inv = { ...s.inventory }
      addItem(inv, 'star_shard', -STAR_SHARD_COST)
      addItem(inv, 'scale', -STAR_SCALE_COST)
      const base = calcStats(species, sp.level, sp.stats)
      const boosted: typeof base = {
        maxHp: Math.round(base.maxHp * STAR_MUL),
        atk: Math.round(base.atk * STAR_MUL),
        def: Math.round(base.def * STAR_MUL),
        spd: Math.round(base.spd * STAR_MUL),
      }
      setTimeout(() => notify(`🌟「${sp.name}」星辰觉醒了！全属性 +20%`), 40)
      return {
        ...s,
        inventory: inv,
        sprites: s.sprites.map(x => x.id === spriteId ? { ...x, ...boosted, hp: boosted.maxHp, star: true } : x),
      }
    })
  }, [addItem, notify])

  const updateSpriteHp = useCallback((spriteId: string, hp: number) => {
    setState(s => ({ ...s, sprites: s.sprites.map(x => x.id === spriteId ? { ...x, hp: Math.max(1, Math.min(x.maxHp, hp)) } : x) }))
  }, [])

  const damageWorldBoss = useCallback((dmg: number) => {
    setState(s => ({ ...s, worldBossHp: Math.max(0, s.worldBossHp - dmg) }))
  }, [])

  const renameSprite = useCallback((spriteId: string, name: string) => {
    setState(s => ({ ...s, sprites: s.sprites.map(x => x.id === spriteId ? { ...x, name: name.slice(0, 8) || x.name } : x) }))
  }, [])

  // 里程碑领奖：条件达成且没领过才发奖励
  const claimGoal = useCallback((goalId: string) => {
    const goal = GOALS.find(g => g.id === goalId)
    if (!goal) return
    setState(s => {
      if ((s.goalsClaimed ?? []).includes(goalId)) return s
      if (goal.progress(s) < goal.target) return s
      const inv = { ...s.inventory }
      for (const [k, v] of Object.entries(goal.reward.items ?? {})) inv[k] = (inv[k] ?? 0) + (v ?? 0)
      return {
        ...s,
        coins: s.coins + (goal.reward.coins ?? 0),
        inventory: inv,
        goalsClaimed: [...(s.goalsClaimed ?? []), goalId],
      }
    })
    notify(`🎁 里程碑奖励已领取：${goal.name}`)
  }, [notify])

  // 测试模式：整块替换本地存档（只在浏览器里生效，导出包默认开局不变）
  const devSet = useCallback((patch: (s: GameState) => GameState) => {
    setState(s => patch(s))
    notify('🧪 测试存档已应用')
  }, [notify])

  const resetGame = useCallback(() => {
    saveStore.clear()
    setState(initialState())
    notify('🔄 已开启新的农场生活！')
  }, [notify])

  const setGender = useCallback((gender: 'girl' | 'boy') => {
    setState(s => ({ ...s, gender }))
    notify(gender === 'girl' ? '🌸 欢迎来到晶灵农场，小莓！' : '🌾 欢迎来到晶灵农场，小禾！')
  }, [notify])

  return {
    state, toasts, notify, selectedSeed, setSelectedSeed,
    buySeed, buyAnimal, sellItem, buyBack, replantAll,
    plant, water, fertilize, harvest, clearPest, upgradePlot, expandPlot, waterAll, harvestAll,
    feedAnimal, collectProduce,
    incubate, hatch, dismissHatch, feedSprite, summonLimited, assignJob,
    battleWin, awakenStar, equipItem, unequipSlot, enhanceEquip, craftCharm, convertPlot, updateSpriteHp, damageWorldBoss, renameSprite, resetGame, devSet, claimGoal,
    setGender,
  }
}

export type GameApi = ReturnType<typeof useGame>
