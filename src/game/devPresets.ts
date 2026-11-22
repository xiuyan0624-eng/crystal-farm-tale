import { SPECIES, SPECIES_MAP, calcStats, type Sprite } from './data'
import { makeSprite, type FarmAnimal, type GameState, type Plot, type SpriteEgg } from './useGame'

// 测试模式用的几套存档：只改本地存档，导出包里的默认开局不受影响。
const now = () => Date.now()

function plot(cropId: string | null, ageSec: number, level: Plot['level'] = 0, extra: Partial<Plot> = {}): Plot {
  return {
    cropId,
    plantedAt: cropId ? now() - ageSec * 1000 : 0,
    waterCount: cropId ? 2 : 0,
    fertilizer: 0,
    level,
    ...extra,
  }
}

function animal(type: string, ready = 0): FarmAnimal {
  return { uid: `dev_${type}_${Math.random().toString(36).slice(2, 7)}`, type, satiety: 80, produceProgress: 0, produceReady: ready }
}

function egg(element: 'wood' | 'fire' | 'water' | 'earth' | 'light', rarity: 'rare' | 'epic' | 'legend', secToHatch = 20): SpriteEgg {
  return { uid: `dev_egg_${Math.random().toString(36).slice(2, 7)}`, element, rarity, hatchAt: now() + secToHatch * 1000 }
}

function leveled(speciesId: string, level: number, job: string | null = null): Sprite {
  const species = SPECIES_MAP[speciesId]
  const base = makeSprite(species)
  const stats = calcStats(species, level, base.stats)
  return { ...base, level, ...stats, hp: stats.maxHp, job: job as Sprite['job'], stamina: 100 }
}

const CRYSTALS = { crystal_wood: 6, crystal_fire: 6, crystal_water: 6, crystal_earth: 6, crystal_light: 6 }

/** 中期：农场 Lv6、8 块地、4 只动物、5 只精灵（各带工种），够测自动农业/孵化/战斗 */
export function midGame(base: GameState): GameState {
  const sprites = [
    leveled('yaya', 20, 'water'),
    leveled('hualing', 18, 'harvest'),
    leveled('tudundun', 16, 'fertilize'),
    leveled('huomiao', 15, 'pest'),
    leveled('xingchen', 14, 'guard'),
  ]
  return {
    ...base,
    coins: 3000,
    farmExp: 150,
    farmLevel: 6,
    inventory: {
      seed_carrot: 12, seed_leaf: 10, seed_corn: 8, seed_pumpkin: 5, seed_berry: 4, seed_tomato: 6,
      fert: 12, fert_rare: 4,
      ...CRYSTALS,
      egg: 6, milk: 4, wool: 3,
    },
    plots: [
      plot('carrot', 400, 1),
      plot('leaf', 60, 0, { waterCount: 1 }),
      plot('corn', 30, 2, { fertilizer: 1, waterCount: 1 }),
      plot(null, 0),
      plot('tomato', 500, 1),
      plot('ginseng', 90, 3, { fertilizer: 2, waterCount: 2 }),
      plot('berry', 700, 2),
      plot(null, 0, 3),
    ],
    animals: [animal('chicken', 2), animal('sheep', 1), animal('cow', 0), animal('bee', 0)],
    eggs: [egg('wood', 'rare'), egg('fire', 'epic', 60)],
    sprites,
    dex: Array.from(new Set([...sprites.map(s => s.speciesId), 'tudundun', 'hualing', 'xingchen'])),
    hatchPity: { sinceEpic: 4, sinceLegend: 18 },
    firstEarthCrystalGranted: true,
  }
}

/** 后期：农场 Lv14、12 块地大多成熟、满图鉴、8 只高阶精灵 */
export function lateGame(base: GameState): GameState {
  const sprites = [
    leveled('chanraoteng', 40, 'harvest'),
    leveled('huajing', 38, 'water'),
    leveled('yanzhao', 42, 'pest'),
    leveled('qingliushi', 36, 'water'),
    leveled('yandunbing', 40, 'fertilize'),
    leveled('huiguangshi', 44, 'guard'),
    leveled('yaya', 22, 'harvest'),
    leveled('xingchen', 26, 'guard'),
  ]
  const plots: Plot[] = [
    plot('ginseng', 900, 3, { fertilizer: 2, waterCount: 3 }),
    plot('berry', 900, 3, { fertilizer: 2, waterCount: 3 }),
    plot('pumpkin', 900, 2, { fertilizer: 1, waterCount: 3 }),
    plot('corn', 900, 2, { waterCount: 3 }),
    plot('tomato', 900, 2, { waterCount: 3 }),
    plot('carrot', 900, 1, { waterCount: 3 }),
    plot('leaf', 40, 3, { waterCount: 1 }),
    plot('corn', 60, 3, { waterCount: 1 }),
    plot('berry', 30, 3, { waterCount: 1 }),
    plot('ginseng', 120, 3, { waterCount: 2 }),
    plot(null, 0, 3),
    plot(null, 0, 2),
  ]
  return {
    ...base,
    coins: 26000,
    farmExp: 900,
    farmLevel: 14,
    inventory: {
      seed_carrot: 20, seed_leaf: 20, seed_corn: 20, seed_pumpkin: 20, seed_berry: 20, seed_tomato: 20, seed_ginseng: 12,
      fert: 40, fert_rare: 12,
      ...Object.fromEntries(Object.entries(CRYSTALS).map(([k, v]) => [k, v * 5])),
      egg: 20, milk: 12, wool: 10, star_shard: 6,
    },
    ownedEquips: ['hoe_iron', 'apron_embroidery', 'bell_silver', 'hoe_spirit'],
    ownerEquip: { tool: 'hoe_iron', outfit: 'apron_embroidery' },
    plots,
    animals: [animal('chicken', 2), animal('chicken', 2), animal('sheep', 1), animal('sheep', 1), animal('cow', 3), animal('bee', 0)],
    eggs: [egg('water', 'epic', 30), egg('light', 'epic', 90), egg('earth', 'legend', 300)],
    sprites,
    dex: SPECIES.map(s => s.id),
    hatchPity: { sinceEpic: 7, sinceLegend: 44 },
    firstEarthCrystalGranted: true,
  }
}

/** 满图鉴 + 所有幼体各来一只，方便测图鉴外观 */
export function fullDex(base: GameState): GameState {
  return { ...base, dex: SPECIES.map(s => s.id) }
}


/** 终盘档：24 块地全开（含温室/池塘与新作物）、装备齐、一只星辰觉醒精灵，用来测扩建/装备/星辰外观 */
export function endGame(base: GameState): GameState {
  const sprites = [
    { ...leveled('shangushumo', 60, 'harvest'), star: true },
    leveled('shengmingzhishu', 58, 'water'),
    leveled('yanyuzhanshen', 56, 'pest'),
    leveled('canghai', 54, 'mine'),
    leveled('jibingnvwang', 52, 'fertilize'),
    leveled('yuehuaxian', 50, 'guard'),
    leveled('yanzhao', 44, 'harvest'),
    leveled('huajing', 40, 'water'),
  ]
  const plots: Plot[] = [
    ...Array.from({ length: 24 }, (_, i) => plot(i < 6 ? 'ginseng' : i < 12 ? 'berry' : i < 18 ? 'pumpkin' : 'corn', 900 - i * 10, 3)),
  ]
  plots[18] = plot('orchid', 400, 3, { kind: 'greenhouse', waterCount: 2 })
  plots[19] = plot('orchid', 900, 3, { kind: 'greenhouse', waterCount: 3 })
  plots[20] = plot('lotus', 500, 3, { kind: 'pond', waterCount: 2 })
  plots[21] = plot('lotus', 900, 3, { kind: 'pond', waterCount: 3 })
  plots[22] = plot(null, 0, 3, { kind: 'greenhouse' })
  plots[23] = plot(null, 0, 2, { kind: 'pond' })
  return {
    ...base,
    coins: 50000,
    farmExp: 2400,
    farmLevel: 24,
    inventory: {
      seed_carrot: 20, seed_leaf: 20, seed_corn: 20, seed_pumpkin: 20, seed_berry: 20, seed_tomato: 20, seed_ginseng: 12,
      seed_orchid: 6, seed_lotus: 6,
      fert: 40, fert_rare: 12, star_shard: 6,
      ...Object.fromEntries(Object.entries(CRYSTALS).map(([k, v]) => [k, v * 6])),
      egg: 20, milk: 12, wool: 10,
    },
    plots,
    animals: [animal('chicken', 2), animal('chicken', 2), animal('sheep', 1), animal('sheep', 1), animal('cow', 3), animal('bee', 0)],
    eggs: [egg('light', 'legend', 300), egg('wood', 'epic', 60)],
    sprites,
    dex: SPECIES.map(s => s.id),
    ownedEquips: ['hoe_iron', 'apron_embroidery', 'bell_silver', 'hoe_spirit', 'bell_star'],
    ownerEquip: { tool: 'hoe_iron', outfit: 'apron_embroidery', charm: 'bell_silver' },
    hatchPity: { sinceEpic: 7, sinceLegend: 44 },
    firstEarthCrystalGranted: true,
  }
}
