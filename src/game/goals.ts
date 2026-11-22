import { SPECIES_MAP, SPECIES, type Element } from './data'
import type { GameState } from './useGame'

// 里程碑：全部从现有存档字段算进度，不需要额外埋点；奖励领取后记在 goalsClaimed 里。
export interface Goal {
  id: string
  name: string
  desc: string
  target: number
  progress: (s: GameState) => number
  reward: { coins?: number; items?: Partial<Record<string, number>> }
}

const legendCount = (s: GameState) =>
  s.dex.filter(id => SPECIES_MAP[id]?.rarity === 'legend').length

const CRYSTAL_ALL: Partial<Record<string, number>> = {
  crystal_wood: 5, crystal_fire: 5, crystal_water: 5, crystal_earth: 5, crystal_light: 5,
}

export const GOALS: Goal[] = [
  { id: 'farm10', name: '农场升到 Lv10', desc: '开垦和种植都能涨农场经验', target: 10, progress: s => s.farmLevel, reward: { coins: 2000 } },
  { id: 'farm20', name: '农场升到 Lv20', desc: '后期地块与品质都起来以后', target: 20, progress: s => s.farmLevel, reward: { coins: 6000, items: { fert_rare: 5 } } },
  { id: 'dex20', name: '图鉴收集 20 只', desc: '孵化不同的精灵填满图鉴', target: 20, progress: s => s.dex.length, reward: { coins: 1500, items: { crystal_wood: 3, crystal_fire: 3 } } },
  { id: 'dex40', name: '图鉴收集 40 只', desc: '两个元素基本集齐的程度', target: 40, progress: s => s.dex.length, reward: { coins: 4000, items: CRYSTAL_ALL } },
  { id: 'dex60', name: '图鉴全收集 60 只', desc: '五系 60 只全部拥有过', target: 60, progress: s => s.dex.length, reward: { coins: 12000, items: { ...CRYSTAL_ALL, fert_rare: 10 } } },
  { id: 'party5', name: '精灵队伍 5 只', desc: '孵化池多敲几颗蛋', target: 5, progress: s => s.sprites.length, reward: { coins: 1200 } },
  { id: 'party10', name: '精灵队伍 10 只', desc: '五个工种都能派满', target: 10, progress: s => s.sprites.length, reward: { coins: 3500, items: { fert_rare: 4 } } },
  { id: 'legend3', name: '收服 3 只传说精灵', desc: '限定传说：世界树苗 / 潮汐圣兽 / 朱雀 / 麒麟 / 星辉龙', target: 3, progress: legendCount, reward: { coins: 8000, items: { crystal_light: 8 } } },
  { id: 'coins50k', name: '攒到 5 万金币', desc: '卖作物、卖动物产出都可以', target: 50000, progress: s => s.coins, reward: { items: { ...CRYSTAL_ALL, fert_rare: 3 } } },
]

export const REWARD_NAMES: Record<string, string> = {
  coins: '金币',
  fert: '普通肥料',
  fert_rare: '稀有肥料',
  crystal_wood: '木结晶',
  crystal_fire: '火结晶',
  crystal_water: '水结晶',
  crystal_earth: '土结晶',
  crystal_light: '光结晶',
}

export function rewardText(g: Goal): string {
  const parts: string[] = []
  if (g.reward.coins) parts.push(`${g.reward.coins} 金币`)
  for (const [k, v] of Object.entries(g.reward.items ?? {})) parts.push(`${REWARD_NAMES[k] ?? k} ×${v}`)
  return parts.join(' · ')
}

export const ELEMENT_GOALS: Element[] = ['wood', 'fire', 'water', 'earth', 'light']
export const TOTAL_SPECIES = SPECIES.length
