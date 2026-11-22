// 幼体精灵贴纸：按文件名自动收集（sp_<speciesId>.png），新图丢进目录即生效
import type { Element, Stage } from './data'

function collectSpriteArt(mods: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [path, url] of Object.entries(mods)) {
    const m = path.match(/sp_([a-z_]+)\.png$/)
    if (m) map[m[1]] = url
  }
  return map
}

function collectBlobs(mods: Record<string, string>): Record<Element, string> {
  const map = {} as Record<Element, string>
  for (const [path, url] of Object.entries(mods)) {
    const m = path.match(/blob_(wood|fire|water|earth|light)\.png$/)
    if (m) map[m[1] as Element] = url
  }
  return map
}

export const SPRITE_IMAGES: Record<string, string> = collectSpriteArt(
  import.meta.glob('../assets/sticker/sp_*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
)

export const ELEMENT_BLOBS: Record<Element, string> = collectBlobs(
  import.meta.glob('../assets/sticker/blob_*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
)

/**
 * 第二批生图的成体 / 究极体贴纸：按「元素 + 阶段」取。
 * 用 import.meta.glob 收集已有文件，这样图还没出全也能正常构建，
 * 丢一张进 src/assets/sticker/ 就自动生效（文件名 spirit_<元素>_adult|final.png）。
 */
type StageArt = Partial<Record<Element, string>>

function collectStageArt(mods: Record<string, string>): StageArt {
  const map: StageArt = {}
  for (const [path, url] of Object.entries(mods)) {
    const m = path.match(/spirit_(wood|fire|water|earth|light)_(adult|final)\.png$/)
    if (m) map[m[1] as Element] = url
  }
  return map
}

const ADULT_ART = collectStageArt(import.meta.glob('../assets/sticker/spirit_*_adult.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)
const FINAL_ART = collectStageArt(import.meta.glob('../assets/sticker/spirit_*_final.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)

/** 取精灵的展示贴图：幼体/特殊有专属贴纸，成体与究极体有分批生图，其余用元素团子兜底 */
export function spriteImage(speciesId: string, element: Element, stage?: Stage): string {
  if (SPRITE_IMAGES[speciesId]) return SPRITE_IMAGES[speciesId]
  if (stage === 'adult') return ADULT_ART[element] ?? ELEMENT_BLOBS[element]
  if (stage === 'complete' || stage === 'ultimate') {
    return FINAL_ART[element] ?? ADULT_ART[element] ?? ELEMENT_BLOBS[element]
  }
  return ELEMENT_BLOBS[element]
}
