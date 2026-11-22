// 野外魔物 / 世界 BOSS 的贴纸图（第二批生图）
import slimeUrl from '../assets/sticker/monster_slime.png'
import boarUrl from '../assets/sticker/monster_boar.png'
import wolfUrl from '../assets/sticker/monster_wolf.png'
import turtleUrl from '../assets/sticker/monster_turtle.png'
import golemUrl from '../assets/sticker/monster_golem.png'
import dragonUrl from '../assets/sticker/monster_dragon.png'
import bossUrl from '../assets/sticker/boss_dragonking.png'

export const ENEMY_IMAGES: Record<string, string> = {
  slime: slimeUrl,
  boar: boarUrl,
  wolf: wolfUrl,
  turtle: turtleUrl,
  golem: golemUrl,
  dragon: dragonUrl,
}

// 世界 BOSS「苍穹古龙王」
export const BOSS_IMAGE = bossUrl
