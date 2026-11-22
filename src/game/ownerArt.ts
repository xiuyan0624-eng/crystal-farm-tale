// 农场主换装：每个性别 × 三套服装各一张贴纸（owner_<gender>_<look>.png）
// 用 glob 收，文件一放进 src/assets/sticker/ 就自动生效
type Gender = 'girl' | 'boy'
import type { OwnerLook } from './data'
type Look = OwnerLook

const FILES = import.meta.glob('../assets/sticker/owner_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const LOOK_SLUG: Record<Look, string> = { classic: 'linen', cream: 'embroidery', star: 'star', rain: 'rain', festival: 'festival', winter: 'winter' }

function collect(): Partial<Record<`${Gender}_${Look}`, string>> {
  const out: Partial<Record<`${Gender}_${Look}`, string>> = {}
  for (const [path, url] of Object.entries(FILES)) {
    const m = /owner_(girl|boy)_([a-z_]+)\.png$/.exec(path)
    if (!m) continue
    const [, gender, slug] = m
    const look = (Object.keys(LOOK_SLUG) as Look[]).find(k => LOOK_SLUG[k] === slug)
    if (!look) continue
    out[`${gender as Gender}_${look}`] = url
  }
  return out
}

const ART = collect()

/** 农场主当前服装对应的贴纸；没有对应图时返回 undefined，由调用方退回默认立绘 */
export function ownerImage(gender: Gender, look: Look): string | undefined {
  return ART[`${gender}_${look}`]
}
