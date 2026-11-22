import { useEffect, useState } from 'react'

/**
 * 图鉴未捕获卡用「轮廓线」而不是灰色剪影：
 * 在浏览器里把贴纸的 alpha 通道做一次内描边（mask 减去腐蚀后的 mask），
 * 只留下沿外形的细线，既认得出形状，又不剧透配色。
 * 结果按 src 缓存，同一张图只算一次。
 */
const cache = new Map<string, string>()
const pending = new Map<string, Promise<string | null>>()

const INK = [59, 46, 38] as const // 纸色系的深棕 ink #3B2E26

function buildOutline(img: HTMLImageElement): string | null {
  const MAX = 320
  const scale = Math.min(1, MAX / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const src = document.createElement('canvas')
  src.width = w
  src.height = h
  const sctx = src.getContext('2d')
  if (!sctx) return null
  sctx.drawImage(img, 0, 0, w, h)
  let data: ImageData
  try {
    data = sctx.getImageData(0, 0, w, h)
  } catch {
    return null // 画布被跨域污染时退回普通剪影
  }
  const a = data.data
  const mask = new Uint8Array(w * h)
  for (let i = 0, p = 3; i < mask.length; i++, p += 4) mask[i] = a[p] > 24 ? 1 : 0

  // 腐蚀 2px：只有「自己在内、旁边是透明」的边缘像素留下来
  const R = 3
  const out = new ImageData(w, h)
  const o = out.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!mask[i]) continue
      let edge = false
      for (let dy = -R; dy <= R && !edge; dy++) {
        const yy = y + dy
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) { edge = true; break }
          if (!mask[yy * w + xx]) { edge = true; break }
        }
      }
      if (edge) {
        const p = i * 4
        o[p] = INK[0]
        o[p + 1] = INK[1]
        o[p + 2] = INK[2]
        o[p + 3] = 235
      }
    }
  }
  const dst = document.createElement('canvas')
  dst.width = w
  dst.height = h
  const dctx = dst.getContext('2d')
  if (!dctx) return null
  dctx.putImageData(out, 0, 0)
  try {
    return dst.toDataURL('image/png')
  } catch {
    return null
  }
}

function loadOutline(src: string): Promise<string | null> {
  const hit = cache.get(src)
  if (hit) return Promise.resolve(hit)
  const inflight = pending.get(src)
  if (inflight) return inflight
  const job = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const url = buildOutline(img)
      if (url) cache.set(src, url)
      pending.delete(src)
      resolve(url)
    }
    img.onerror = () => { pending.delete(src); resolve(null) }
    img.src = src
  })
  pending.set(src, job)
  return job
}

/** 传入贴纸地址，返回轮廓图地址；算不出来或还没算完时返回 undefined */
export function useOutline(src: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (src ? cache.get(src) : undefined))
  useEffect(() => {
    if (!src) { setUrl(undefined); return }
    const hit = cache.get(src)
    if (hit) { setUrl(hit); return }
    let alive = true
    loadOutline(src).then((u) => { if (alive) setUrl(u ?? undefined) })
    return () => { alive = false }
  }, [src])
  return url
}
