import type { Element } from './data'

// 五张战斗背景：放到 src/assets/battle/bg_<元素>.png 就会自动按敌人五行切换。
// 没放的那一系回退到战斗页里手绘的天空/地面场景，不会报错。
const files = import.meta.glob('../assets/battle/bg_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const BATTLE_BG: Partial<Record<Element, string>> = (() => {
  const map: Partial<Record<Element, string>> = {}
  for (const [path, url] of Object.entries(files)) {
    const m = path.match(/bg_(wood|fire|water|earth|light)\.png$/)
    if (m) map[m[1] as Element] = url
  }
  return map
})()
