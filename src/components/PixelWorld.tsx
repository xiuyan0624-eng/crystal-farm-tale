import { useEffect, useMemo, useRef, useState } from 'react'
import plotUrl from '../assets/sticker/plot.png'
import chickenUrl from '../assets/sticker/chicken.png'
import sheepUrl from '../assets/sticker/sheep.png'
import cowUrl from '../assets/sticker/cow.png'
import girlUrl from '../assets/sticker/girl.png'
import boyUrl from '../assets/sticker/boy.png'
import wateringCanUrl from '../assets/sticker/watering_can.png'
import shovelUrl from '../assets/sticker/shovel.png'
import basketUrl from '../assets/sticker/strawberry_basket.png'
import milkJarUrl from '../assets/sticker/milk_jar.png'
import hayUrl from '../assets/sticker/hay.png'
import treeUrl from '../assets/sticker/tree.png'
import barnUrl from '../assets/sticker/barn.png'
import fenceUrl from '../assets/sticker/fence.png'
import signUrl from '../assets/sticker/sign.png'
import troughUrl from '../assets/sticker/trough.png'
import stonesUrl from '../assets/sticker/stones.png'
import flowersUrl from '../assets/sticker/flowers.png'
import wheelbarrowUrl from '../assets/sticker/wheelbarrow.png'
import coopUrl from '../assets/sticker/coop.png'
import penUrl from '../assets/sticker/pen.png'
import cowshedUrl from '../assets/sticker/cowshed.png'
import hiveUrl from '../assets/sticker/hive.png'
import bucketUrl from '../assets/sticker/strawberry_bucket.png'
import sproutUrl from '../assets/sticker/sprout.png'
import cropCarrotUrl from '../assets/sticker/crop_carrot.png'
import cropLeafUrl from '../assets/sticker/crop_leaf.png'
import cropPumpkinUrl from '../assets/sticker/crop_pumpkin.png'
import cropLotusUrl from '../assets/sticker/crop_lotus.png'
import cropOrchidUrl from '../assets/sticker/crop_orchid.png'
import cropBerryUrl from '../assets/sticker/crop_berry.png'
import cropCornUrl from '../assets/sticker/crop_corn.png'
import cropTomatoUrl from '../assets/sticker/crop_tomato.png'
import cropGinsengUrl from '../assets/sticker/crop_ginseng.png'
import beeUrl from '../assets/sticker/bee.png'
import { ownerImage } from '../game/ownerArt'
import type { OwnerLook } from '../game/data'
import { ANIMALS, CROPS, ELEMENTS, FERTILIZERS, PLOT_LEVELS, PLOT_KINDS, PLOT_KIND_LIST, MAX_PLOTS, QUALITIES, SPECIES_MAP, cropVariants, farmExpForLevel, itemIcon, itemName, ownerLook, parseItem, plotExpandCost, qualityOf } from '../game/data'
import { SPRITE_IMAGES, ELEMENT_BLOBS, spriteImage } from '../game/spriteImages'
import { beeBonus, isDry, plotProgress, workBonuses, type GameApi, type Plot } from '../game/useGame'
import Icon, { type IconName } from '../ui/Icon'
import { sfx } from '../game/audio'

// 物品 → 贴纸图
export const ITEM_STICKERS: Record<string, string> = {
  carrot: cropCarrotUrl, leaf: cropLeafUrl, pumpkin: cropPumpkinUrl, berry: cropBerryUrl, corn: cropCornUrl,
  tomato: cropTomatoUrl, ginseng: cropGinsengUrl, milk: milkJarUrl, lotus: cropLotusUrl, orchid: cropOrchidUrl,
}

type FarmerActionType = 'water' | 'harvest' | 'feed' | 'plant' | 'collect'
interface PendingAction {
  kind: 'plant' | 'water' | 'harvest' | 'feedAnimal' | 'collect'
  plotIdx?: number
  animalUid?: string
  itemId?: string
  tx: number
  ty: number
  pose: FarmerActionType
}

const W = 1280, H = 760

// 农田区：6列×4行（最多24块）
const PLOT_ROWS = 4, PLOT_COLS = 6

type Rect = { x1: number; y1: number; x2: number; y2: number }
type RectDef = { x: number; y: number; w: number; h: number }
type LayoutDef = {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  name: string
  /** 地块网格：起点、间距、逐行右移（做斜向错落） */
  grid: { x0: number; y0: number; dx: number; dy: number; shift?: number; cols?: number; rows?: number }
  pasture: Rect
  /** 精灵闲逛的活动带（默认在底部草地） */
  companionBand?: { x1: number; x2: number; y1: number; y2: number }
  /** 牧场下栏的缺口（门）：这一段不画栅栏，小路从这里进来 */
  pastureGate?: number
  barn: RectDef
  path: [number, number][]
  deco: { key: 'tree' | 'hay' | 'stones' | 'flowers' | 'wheelbarrow' | 'sign' | 'trough' | 'coop' | 'pen' | 'cowshed' | 'hive'; x: number; y: number; w: number; h: number }[]
  /** 地块尺寸（默认 88）；改小就变成"地图式"密度 */
  plotSize?: number
  /** 角色/动物/精灵缩放（默认 1） */
  walkerScale?: number
  /** 前景层：压在角色上方的装饰，做边缘框景 */
  fg?: { key: 'flowers' | 'stones' | 'tree' | 'hay'; x: number; y: number; w: number; h: number }[]
}

/** 三套场景布局：A 分区 / B 围合农场院（默认）/ C 斜向纵深 */
const LAYOUTS: Record<'a' | 'b' | 'c' | 'd', LayoutDef> = {
  a: {
    name: 'A · 分区',
    grid: { x0: 36, y0: 250, dx: 96, dy: 96 },
    pasture: { x1: 720, y1: 60, x2: 1240, y2: 330 },
    barn: { x: 40, y: -10, w: 300, h: 270 },
    path: [[206, 244], [232, 430], [360, 640], [730, 692]],
    deco: [
      { key: 'tree', x: 1130, y: 6, w: 140, h: 172 },
      { key: 'hay', x: 350, y: 96, w: 100, h: 72 },
      { key: 'stones', x: 1040, y: 372, w: 95, h: 62 },
      { key: 'flowers', x: 80, y: 620, w: 110, h: 70 },
      { key: 'flowers', x: 560, y: 654, w: 100, h: 64 },
      { key: 'wheelbarrow', x: 430, y: 556, w: 100, h: 72 },
      { key: 'sign', x: 640, y: 596, w: 95, h: 95 },
      { key: 'trough', x: 1000, y: 232, w: 105, h: 55 },
    ],
  },
  b: {
    name: 'B · 围合农场院',
    grid: { x0: 150, y0: 222, dx: 96, dy: 96 },
    pasture: { x1: 720, y1: 80, x2: 1230, y2: 470 },
    barn: { x: 30, y: -35, w: 300, h: 265 },
    path: [[180, 232], [206, 470], [350, 650], [780, 700]],
    deco: [
      { key: 'hay', x: 372, y: 108, w: 100, h: 72 },
      { key: 'tree', x: 1166, y: 4, w: 140, h: 172 },
      { key: 'stones', x: 1076, y: 498, w: 95, h: 62 },
      { key: 'flowers', x: 620, y: 648, w: 110, h: 70 },
      { key: 'flowers', x: 880, y: 664, w: 100, h: 64 },
      { key: 'wheelbarrow', x: 660, y: 596, w: 100, h: 72 },
      { key: 'sign', x: 300, y: 600, w: 95, h: 95 },
      { key: 'trough', x: 1002, y: 288, w: 105, h: 55 },
    ],
  },
  d: {
    name: 'D · 小图重排',
    plotSize: 62,
    walkerScale: 0.72,
    grid: { x0: 52, y0: 168, dx: 70, dy: 70, cols: 6, rows: 4 },
    pasture: { x1: 726, y1: 132, x2: 1204, y2: 470 },
    barn: { x: 430, y: 2, w: 218, h: 200 },
    path: [[556, 186], [520, 300], [596, 404], [716, 466]],
    pastureGate: 720,
    companionBand: { x1: 430, x2: 704, y1: 238, y2: 452 },
    deco: [
      { key: 'tree', x: 1164, y: 8, w: 116, h: 142 },
      { key: 'hay', x: 662, y: 178, w: 72, h: 52 },
      // 牧场：动物的住处沿后侧排开，前面留出活动区
      { key: 'cowshed', x: 840, y: 128, w: 156, h: 122 },
      { key: 'coop', x: 742, y: 158, w: 108, h: 96 },
      { key: 'pen', x: 996, y: 148, w: 124, h: 94 },
      { key: 'hive', x: 1140, y: 166, w: 62, h: 76 },
      { key: 'trough', x: 946, y: 300, w: 80, h: 42 },
      { key: 'wheelbarrow', x: 604, y: 470, w: 76, h: 55 },
    ],
  },
  c: {
    name: 'C · 斜向纵深',
    grid: { x0: 60, y0: 110, dx: 96, dy: 104, shift: 54 },
    pasture: { x1: 830, y1: 60, x2: 1245, y2: 430 },
    barn: { x: 892, y: 444, w: 240, h: 225 },
    path: [[190, 120], [420, 340], [700, 520], [980, 664]],
    deco: [
      { key: 'tree', x: 1150, y: 6, w: 140, h: 172 },
      { key: 'stones', x: 628, y: 70, w: 95, h: 62 },
      { key: 'hay', x: 1146, y: 596, w: 100, h: 72 },
      { key: 'flowers', x: 40, y: 610, w: 110, h: 70 },
      { key: 'flowers', x: 986, y: 640, w: 100, h: 64 },
      { key: 'wheelbarrow', x: 404, y: 396, w: 100, h: 72 },
      { key: 'sign', x: 40, y: 494, w: 95, h: 95 },
      { key: 'trough', x: 1104, y: 296, w: 105, h: 55 },
    ],
  },
}

/** Game Studio 的预览 iframe 是不透明源，读 localStorage 会抛 SecurityError，必须兜住 */
function readLayoutPref(): 'a' | 'b' | 'c' | 'd' {
  try {
    const v = localStorage.getItem('crystal-farm-layout')
    return (v === 'a' || v === 'b' || v === 'c' || v === 'd' ? v : 'd')
  } catch {
    return 'd'
  }
}
const LAYOUT_ID = readLayoutPref()
const LAYOUT = LAYOUTS[LAYOUT_ID] ?? LAYOUTS.d
const WALKER_SCALE = LAYOUT.walkerScale ?? 1
const PLOT_SIZE = LAYOUT.plotSize ?? 88
const PASTURE = LAYOUT.pasture
// 默认带放在画布中段草地上：底部 y635+ 会被「选种子/一键浇水」浮层挡住
const COMPANION_BAND = LAYOUT.companionBand ?? { x1: 380, x2: 690, y1: 240, y2: 405 }

/** 地块分区：左上 2×2 温室、右下 2×2 池塘，其余是普通田 */
const GRID_COLS = LAYOUT.grid.cols ?? PLOT_COLS
const GRID_ROWS = LAYOUT.grid.rows ?? PLOT_ROWS
function plotZone(idx: number): 'greenhouse' | 'pond' | null {
  const r = Math.floor(idx / GRID_COLS)
  const c = idx % GRID_COLS
  if (r <= 1 && c <= 1) return 'greenhouse'
  if (r >= GRID_ROWS - 2 && c >= GRID_COLS - 2) return 'pond'
  return null
}
function zoneCells(zone: 'greenhouse' | 'pond'): number[] {
  const out: number[] = []
  for (let r = 0; r < GRID_ROWS; r += 1) {
    for (let c = 0; c < GRID_COLS; c += 1) {
      const idx = r * GRID_COLS + c
      if (plotZone(idx) === zone) out.push(idx)
    }
  }
  return out
}
const PLOT_POS: [number, number][] = []
for (let r = 0; r < (LAYOUT.grid.rows ?? PLOT_ROWS); r++) {
  for (let c = 0; c < (LAYOUT.grid.cols ?? PLOT_COLS); c++) {
    PLOT_POS.push([LAYOUT.grid.x0 + c * LAYOUT.grid.dx + r * (LAYOUT.grid.shift ?? 0), LAYOUT.grid.y0 + r * LAYOUT.grid.dy])
  }
}

/** 场景配色：暖纸底 + 低饱和草绿。环境道具压低饱和度，贴纸（角色/作物）保持彩色。 */
const SCENE = {
  ground: '#EFE7D0',
  patchA: '#E6E1C4',
  patchB: '#DDD9BA',
  tuft: 'rgba(124,155,100,0.5)',
  pebble: 'rgba(173,153,124,0.55)',
  path: '#F7ECD5',
  pathEdge: 'rgba(59,46,38,0.10)',
  shadow: 'rgba(90,70,55,0.20)',
}
const ENV_FILTER = 'saturate(0.92) brightness(0.99) hue-rotate(3deg)'

interface Img { el: HTMLImageElement; ok: boolean }

/** 统一光影：所有立着的道具用同一方向、同一颜色的软投影。 */
function drawProp(
  ctx: CanvasRenderingContext2D,
  img: Img,
  x: number,
  y: number,
  w: number,
  h: number,
  options: { filter?: string; shadow?: boolean; shadowAlpha?: number } = {},
) {
  if (!img.ok) return
  if (options.shadow !== false) {
    const a = options.shadowAlpha ?? 0.22
    // 两层接触阴影：外面一层很淡更大，里面一层更实，像东西真的压在地面上
    ctx.fillStyle = `rgba(96,74,56,${a * 0.45})`
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h * 0.95, w * 0.40, Math.max(4, w * 0.080), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(84,64,48,${a})`
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h * 0.94, w * 0.26, Math.max(2.5, w * 0.045), 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.save()
  ctx.filter = options.filter ?? ENV_FILTER
  ctx.drawImage(img.el, x, y, w, h)
  ctx.restore()
}

/** 草簇：几笔短竖线，让地面不是一块纯色。 */
function drawTufts(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.lineCap = 'round'
  // 零散短草
  ctx.strokeStyle = SCENE.tuft
  ctx.lineWidth = 1.6
  for (let i = 0; i < 110; i += 1) {
    const x = rand(i * 21) * W
    const y = 170 + rand(i * 31) * (H - 190)
    const len = 4 + rand(i * 7) * 5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 1.6, y - len)
    ctx.moveTo(x + 3, y)
    ctx.lineTo(x + 3.4, y - len * 0.8)
    ctx.stroke()
  }
  // 成簇草：几笔更长更绿的草叶，给暖纸底一点农场的绿
  ctx.strokeStyle = 'rgba(124,155,100,0.62)'
  ctx.lineWidth = 2
  for (let i = 0; i < 22; i += 1) {
    const x = 40 + rand(i * 37) * (W - 80)
    const y = 230 + rand(i * 41) * (H - 270)
    for (let b = -1; b <= 1; b += 1) {
      ctx.beginPath()
      ctx.moveTo(x + b * 3, y)
      ctx.lineTo(x + b * 6, y - 9 - rand(i * 5 + b + 4) * 5)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** 纸纹：一次画到离屏画布，之后每帧贴一层，几乎不涨开销。 */
let grainCanvas: HTMLCanvasElement | null = null
function getGrain(): HTMLCanvasElement {
  if (grainCanvas) return grainCanvas
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  for (let i = 0; i < 1600; i += 1) {
    const x = rand(i * 3) * W
    const y = rand(i * 5) * H
    g.fillStyle = i % 3 === 0 ? 'rgba(59,46,38,0.035)' : 'rgba(255,255,255,0.28)'
    g.fillRect(x, y, 1, 1)
  }
  grainCanvas = canvas
  return canvas
}

function loadImg(url: string): Img {
  const el = new Image()
  const img: Img = { el, ok: false }
  el.onload = () => { img.ok = true }
  el.src = url
  return img
}

interface Walker {
  uid: string
  x: number; y: number; tx: number; ty: number
  speed: number; wait: number; moving: boolean
  flip: boolean; size: number; img: Img
  star?: boolean // 星辰觉醒：金色光环 + 提亮
  tint?: string  // 农场主外观：服装决定的色调
  emoji?: string // 无贴图时用 emoji（蜜蜂）
}

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}


/** 材料的色标：让线描图标也有贴纸那样的「颜色块」重量 */
const MATERIAL_TINT: Record<string, string> = {
  fiber: '#9DBE7C', hide: '#C68C5A', dust: '#C9A227', fang: '#C9744F', scale: '#D37A96',
  ember: '#E0803C', fert: '#8C7A62', fert_rare: '#7C9B64', egg: '#E7B453', milk: '#C9D6DC', wool: '#E5D6C3',
}

/** 材料 / 肥料这类没有贴纸的物品，用统一的矢量图标，不再混用 emoji */
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
    case 'egg': return 'egg'
    case 'milk': return 'bottle'
    case 'wool': return 'paw'
    case 'fert': case 'fert_rare': return 'fert'
    default: return 'leaf'
  }
}

function drawWalker(ctx: CanvasRenderingContext2D, w: Walker, t: number) {
  const bob = w.moving ? Math.abs(Math.sin(t * 9)) * w.size * 0.05 : Math.sin(t * 2) * w.size * 0.015
  ctx.fillStyle = SCENE.shadow
  ctx.beginPath()
  ctx.ellipse(w.x + w.size / 2, w.y + w.size * 0.9, w.size * 0.36, w.size * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
  if (w.emoji || !w.img.ok) {
    ctx.font = `${w.size * 0.8}px sans-serif`
    ctx.textAlign = 'center'
    ctx.save()
    if (w.flip) { ctx.translate(w.x + w.size / 2, w.y - bob); ctx.scale(-1, 1); ctx.fillText(w.emoji ?? '❔', 0, w.size * 0.8) }
    else ctx.fillText(w.emoji ?? '❔', w.x + w.size / 2, w.y + w.size * 0.8 - bob)
    ctx.restore()
    return
  }
  const im = w.img.el
  const ar = im.height / im.width
  const dw = w.size, dh = w.size * ar
  ctx.save()
  if (w.tint) ctx.filter = w.tint
  if (w.star) {
    // 金色光晕：让觉醒精灵在农场里一眼能认出来
    const gx = w.x + dw / 2, gy = w.y + dh * 0.55
    const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, dw * 0.95)
    glow.addColorStop(0, 'rgba(255,208,120,0.42)')
    glow.addColorStop(1, 'rgba(255,208,120,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(gx, gy, dw * 0.95, 0, Math.PI * 2)
    ctx.fill()
    ctx.filter = 'saturate(1.3) brightness(1.07)'
  }
  if (w.flip) {
    ctx.translate(w.x + dw, w.y - bob)
    ctx.scale(-1, 1)
    ctx.drawImage(im, 0, 0, dw, dh)
  } else {
    ctx.drawImage(im, w.x, w.y - bob, dw, dh)
  }
  ctx.restore()
}

/** 工种图标（矢量和界面那套 Icon 同源，不依赖系统 emoji 字体） */
function drawJobGlyph(ctx: CanvasRenderingContext2D, jobId: string, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.strokeStyle = '#3B2E26'
  ctx.fillStyle = '#3B2E26'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const p = (pts: [number, number][], close = false) => {
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    if (close) ctx.closePath()
    ctx.stroke()
  }
  if (jobId === 'water') {
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.bezierCurveTo(r * 0.75, -r * 0.25, r * 0.8, r * 0.15, r * 0.55, r * 0.5)
    ctx.bezierCurveTo(r * 0.1, r * 0.95, -r * 0.1, r * 0.95, -r * 0.55, r * 0.5)
    ctx.bezierCurveTo(-r * 0.8, r * 0.15, -r * 0.75, -r * 0.25, 0, -r)
    ctx.stroke()
  } else if (jobId === 'fertilize') {
    p([[-r * 0.65, -r * 0.45], [r * 0.65, -r * 0.45], [r * 0.92, r * 0.9], [-r * 0.92, r * 0.9]], true)
    ctx.beginPath()
    ctx.arc(0, -r * 0.45, r * 0.34, Math.PI, Math.PI * 2)
    ctx.stroke()
    p([[-r * 0.55, -r * 0.05], [r * 0.55, -r * 0.05]])
    ctx.beginPath(); ctx.arc(0, r * 0.45, r * 0.13, 0, Math.PI * 2); ctx.fill()
  } else if (jobId === 'harvest') {
    ctx.beginPath()
    ctx.arc(0, -r * 0.5, r * 0.42, Math.PI, Math.PI * 2)
    ctx.stroke()
    p([[-r * 0.95, -r * 0.5], [r * 0.95, -r * 0.5], [r * 0.7, r * 0.85], [-r * 0.7, r * 0.85]], true)
    p([[-r * 0.82, r * 0.1], [r * 0.82, r * 0.1]])
  } else if (jobId === 'pest') {
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.6, r * 0.82, 0, 0, Math.PI * 2); ctx.stroke()
    p([[-r * 0.2, -r * 0.85], [-r * 0.42, -r * 1.12]])
    p([[r * 0.2, -r * 0.85], [r * 0.42, -r * 1.12]])
    p([[-r * 0.58, r * 0.05], [-r * 1.0, -r * 0.2]])
    p([[r * 0.58, r * 0.05], [r * 1.0, -r * 0.2]])
    p([[-r * 0.58, r * 0.8], [-r * 0.98, r * 1.0]])
    p([[r * 0.58, r * 0.8], [r * 0.98, r * 1.0]])
    for (const [dx, dy] of [[-0.28, 0.05], [0.3, 0.55]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.12, 0, Math.PI * 2); ctx.fill()
    }
  } else if (jobId === 'mine') {
    p([[0, -r], [r * 0.85, -r * 0.2], [r * 0.5, r * 0.9], [-r * 0.5, r * 0.9], [-r * 0.85, -r * 0.2]], true)
    p([[-r * 0.85, -r * 0.2], [r * 0.85, -r * 0.2]])
    p([[0, -r], [0, r * 0.9]])
  } else if (jobId === 'guard') {
    p([[-r * 0.8, -r * 0.4], [r * 0.8, -r * 0.4], [r * 0.55, r * 0.95], [-r * 0.55, r * 0.95]], true)
    ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.42, Math.PI, Math.PI * 2); ctx.stroke()
    p([[-r * 0.72, r * 0.1], [r * 0.72, r * 0.1]])
  }
  ctx.restore()
}

/** 动物状态气泡：内容还是贴纸 emoji（蛋/奶/毛），不换成图标 */
function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, t: number) {
  const bounce = Math.abs(Math.sin(t * 5)) * 5
  ctx.save()
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,252,246,0.96)'
  ctx.strokeStyle = 'rgba(231,215,195,0.95)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y - bounce, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillText(text, x, y - bounce + 8)
  ctx.restore()
}

function drawJobBubble(ctx: CanvasRenderingContext2D, x: number, y: number, jobId: string, t: number) {
  const bounce = Math.abs(Math.sin(t * 5)) * 5
  const cy = y - bounce
  ctx.save()
  ctx.fillStyle = 'rgba(255,252,246,0.96)'
  ctx.strokeStyle = 'rgba(213,95,123,0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, cy, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  drawJobGlyph(ctx, jobId, x, cy, 8)
}

interface Popup { kind: 'animal' | 'plot'; uid?: string; plotIdx?: number; x: number; y: number }

/** 土地升级区块（弹窗内） */
function PlotUpgrade({ game, plot, plotIdx }: { game: GameApi; plot: Plot; plotIdx: number }) {
  const { state } = game
  const kind = plot.kind ?? 'soil'
  const kindDef = PLOT_KINDS[kind]
  const unlocked = state.plots.length >= MAX_PLOTS
  // 分区固定：左上 2×2 是温室区、右下 2×2 是池塘区，其他位置只能种普通作物
  const zone = plotZone(plotIdx)
  const zoneHint = zone === 'greenhouse' ? '这里是温室区' : zone === 'pond' ? '这里是池塘区' : null
  const kindSection = unlocked ? (
    <div className="mt-2 border-t border-line/60 pt-2">
      <p className="micro mb-1.5">
        地块类型：<span className="font-bold text-ink">{kindDef.icon} {kindDef.name}</span> —— {kindDef.desc}
      </p>
      {!plot.cropId && (
        <div className="grid grid-cols-1 gap-1">
          {zoneHint && (
            <button onClick={() => {
              const target = zone === 'greenhouse' ? 'greenhouse' : 'pond'
              const def = PLOT_KIND_LIST.find(d => d.id === target)!
              game.convertPlot(plotIdx, def.id)
              sfx('job')
            }}
              disabled={kind === (zone === 'greenhouse' ? 'greenhouse' : 'pond') || state.coins < (PLOT_KIND_LIST.find(d => d.id === (zone === 'greenhouse' ? 'greenhouse' : 'pond'))?.price ?? 0)}
              className="btn-soft btn-xs w-full">
              {kind === (zone === 'greenhouse' ? 'greenhouse' : 'pond')
                ? `当前：${PLOT_KINDS[zone === 'greenhouse' ? 'greenhouse' : 'pond'].name}`
                : `${zone === 'greenhouse' ? '🌿' : '💧'} {zoneHint}：改成${PLOT_KINDS[zone === 'greenhouse' ? 'greenhouse' : 'pond'].name}（${PLOT_KIND_LIST.find(d => d.id === (zone === 'greenhouse' ? 'greenhouse' : 'pond'))?.price} 金币）`}
            </button>
          )}
          {!zoneHint && <p className="micro text-inkfaint">普通农田（温室在左上角、池塘在右下角）</p>}
        </div>
      )}
    </div>
  ) : null

  if (plot.level >= 3) return <><p className="mt-2 text-micro text-inkfaint">已是最高级「仙土」</p>{kindSection}</>
  const next = PLOT_LEVELS[plot.level + 1]
  const c = next.cost
  const costParts = [`${c.coins} 金币`]
  if (c.fert) costParts.push(`肥料 ×${c.fert}`)
  if (c.midCrystal) costParts.push(`中品结晶 ×${c.midCrystal}`)
  if (c.topCrystal) costParts.push(`极品结晶 ×${c.topCrystal}`)
  return (
    <div className="mt-2 border-t border-line/60 pt-2">
      <p className="micro mb-1.5">
        升级「{next.name}」：生长 ×{next.speedMul} · 品质 +{Math.round(next.qualAdd * 100)}% · 水晶 +{Math.round(next.crystalAdd * 100)}%
      </p>
      <button onClick={() => { game.upgradePlot(plotIdx); sfx('job') }} className="btn-soft btn-xs w-full">
        <Icon name="arrowUp" size={13} />
        升级（{costParts.join(' + ')}）
      </button>
      {kindSection}
    </div>
  )
}

export default function PixelWorld({ game }: { game: GameApi }) {
  const { state } = game
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null)
  const [popup, setPopup] = useState<Popup | null>(null)
  const seedRef = useRef<string | null>(null)
  seedRef.current = selectedSeed
  const gameRef = useRef(game)
  gameRef.current = game

  const sceneRef = useRef<{
    imgs: Record<string, Img>
    animalWalkers: Map<string, Walker>
    blobWalkers: Map<string, Walker>
    farmer: Walker
    ownerImgs: Partial<Record<OwnerLook, Img>>
    farmerAction: { type: FarmerActionType; until: number } | null
    /** 立即结算的动作：只借一帧循环把动作姿势播出来 */
    pendingPose: { type: FarmerActionType } | null
    pending: PendingAction | null
    popupRef: { current: Popup | null }
    /** 每块地上一次看到的浇水次数（用来在画面上做「刚浇过水」的反馈） */
    prevWater: Map<number, number>
    /** 上一次看到的作物与虫害，用来播「收掉了 / 虫没了」的反馈 */
    prevCrop: Map<number, string | null>
    prevPest: Map<number, boolean>
    fx: { x: number; y: number; kind: 'water' | 'harvest' | 'pest'; until: number; text?: string }[]
  } | null>(null)

  if (!sceneRef.current) {
    const imgs: Record<string, Img> = {
      plot: loadImg(plotUrl), chicken: loadImg(chickenUrl),
      sheep: loadImg(sheepUrl), cow: loadImg(cowUrl), girl: loadImg(girlUrl), boy: loadImg(boyUrl),
      tool_water: loadImg(wateringCanUrl), tool_plant: loadImg(shovelUrl),
      tool_harvest: loadImg(basketUrl), tool_feed: loadImg(milkJarUrl), tool_collect: loadImg(bucketUrl),
      hay: loadImg(hayUrl), tree: loadImg(treeUrl),
      barn: loadImg(barnUrl), fence: loadImg(fenceUrl), sign: loadImg(signUrl),
      trough: loadImg(troughUrl), stones: loadImg(stonesUrl), flowers: loadImg(flowersUrl),
      wheelbarrow: loadImg(wheelbarrowUrl), bucket: loadImg(bucketUrl), sprout: loadImg(sproutUrl),
      coop: loadImg(coopUrl), pen: loadImg(penUrl), cowshed: loadImg(cowshedUrl), hive: loadImg(hiveUrl),
      carrot: loadImg(cropCarrotUrl), leaf: loadImg(cropLeafUrl), pumpkin: loadImg(cropPumpkinUrl),
      berry: loadImg(cropBerryUrl), corn: loadImg(cropCornUrl),
      tomato: loadImg(cropTomatoUrl), ginseng: loadImg(cropGinsengUrl), bee: loadImg(beeUrl),
      lotus: loadImg(cropLotusUrl), orchid: loadImg(cropOrchidUrl),
    }
    // 预载 15 只幼体贴纸 + 5 色元素团子（特殊/限定精灵用）
    Object.entries(SPRITE_IMAGES).forEach(([k, v]) => { imgs[`sp_${k}`] = loadImg(v) })
    Object.entries(ELEMENT_BLOBS).forEach(([k, v]) => { imgs[`blob_${k}`] = loadImg(v) })
    // 成体/完全体贴纸（农场里干活的大精灵要能画出来）
    Object.keys(ELEMENTS).forEach(el => {
      imgs[`adult_${el}`] = loadImg(spriteImage('__none__', el as never, 'adult'))
      imgs[`final_${el}`] = loadImg(spriteImage('__none__', el as never, 'complete'))
    })
    const mk = (uid: string, img: Img, x: number, y: number, speed: number, size: number): Walker =>
      ({ uid, x, y, tx: x, ty: y, speed, wait: Math.random() * 2, moving: false, flip: false, size, img })
    const isBoy = gameRef.current.state.gender === 'boy'
    const gender = isBoy ? 'boy' : 'girl'
    // 农场主换装：三套服装各一张贴纸，缺图时退回默认立绘
    const ownerImgs: Partial<Record<OwnerLook, Img>> = {}
    for (const look of ['classic', 'cream', 'star', 'rain', 'festival', 'winter'] as const) {
      const url = ownerImage(gender, look)
      if (url) ownerImgs[look] = loadImg(url)
    }
    const ownerLookKey = ownerLook(gameRef.current.state.ownerEquip ?? {})
    sceneRef.current = {
      imgs,
      animalWalkers: new Map(),
      blobWalkers: new Map(),
      ownerImgs,
      farmer: mk('farmer', ownerImgs[ownerLookKey] ?? (isBoy ? imgs.boy : imgs.girl), 650, 420, 240, 92),
      farmerAction: null,
      pendingPose: null,
      pending: null,
      popupRef: { current: null },
      prevWater: new Map(),
      prevCrop: new Map(),
      prevPest: new Map(),
      fx: [],
    }
  }
  sceneRef.current.popupRef.current = popup

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    // 高分屏按 DPR 放大 backing store，绘制仍用 W/H 逻辑坐标（指针换算不受影响）
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    let raf = 0
    let last = performance.now()
    const start = last

    const wanderUpdate = (w: Walker, dt: number, x1: number, x2: number, y1: number, y2: number) => {
      if (!w.moving) {
        w.wait -= dt
        if (w.wait <= 0) {
          w.tx = x1 + Math.random() * (x2 - x1)
          w.ty = y1 + Math.random() * (y2 - y1)
          w.moving = true
          w.flip = w.tx < w.x
        }
      } else {
        const dx = w.tx - w.x, dy = w.ty - w.y
        const dist = Math.hypot(dx, dy)
        if (dist < 4) { w.moving = false; w.wait = 1 + Math.random() * 3.5 }
        else { w.x += (dx / dist) * w.speed * dt; w.y += (dy / dist) * w.speed * dt }
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.filter = 'none'
      const st = sceneRef.current!
      const g = gameRef.current.state
      const t = (now - start) / 1000
      const nowMs = Date.now()
      const wb = workBonuses(g)

      // ---- 同步动物 ----
      const animalImg: Record<string, { img?: Img; emoji?: string; size: number; speed: number }> = {
        chicken: { img: st.imgs.chicken, size: Math.round(68 * WALKER_SCALE), speed: 62 },
        sheep: { img: st.imgs.sheep, size: Math.round(88 * WALKER_SCALE), speed: 32 },
        cow: { img: st.imgs.cow, size: Math.round(104 * WALKER_SCALE), speed: 26 },
        bee: { img: st.imgs.bee, size: Math.round(46 * WALKER_SCALE), speed: 90 },
      }
      const seen = new Set<string>()
      g.animals.forEach(a => {
        seen.add(a.uid)
        if (!st.animalWalkers.has(a.uid)) {
          const m = animalImg[a.type] ?? animalImg.chicken
          st.animalWalkers.set(a.uid, {
            uid: a.uid,
            x: PASTURE.x1 + 40 + Math.random() * (PASTURE.x2 - PASTURE.x1 - 140),
            y: PASTURE.y1 + 150 + Math.random() * (PASTURE.y2 - PASTURE.y1 - 220),
            tx: 0, ty: 0, speed: m.speed, wait: Math.random() * 2,
            moving: false, flip: false, size: m.size, img: m.img ?? { el: new Image(), ok: false }, emoji: m.emoji,
          })
        }
      })
      Array.from(st.animalWalkers.keys()).forEach(k => { if (!seen.has(k)) st.animalWalkers.delete(k) })

      // ---- 同步小精灵：每只都在农场里露个脸 ----
      // 优先级：限定/传说 > 正在干活 > 新获得的；总数上限 12（再多会挤满草地）
      const rankOf = (sp: (typeof g.sprites)[number]) => {
        const sp0 = SPECIES_MAP[sp.speciesId]
        return (sp0?.line === 'limited' ? 2 : sp0?.rarity === 'legend' ? 1.5 : 0) + (sp.job ? 1 : 0)
      }
      const companions = g.sprites
        .map((sp, idx) => ({ sp, idx }))
        .sort((a, b) => {
          const d = rankOf(b.sp) - rankOf(a.sp)
          return d !== 0 ? d : b.idx - a.idx
        })
        .slice(0, 12)
        .map(x => x.sp)
      const seenB = new Set<string>()
      companions.forEach(sp => {
        seenB.add(sp.id)
        if (st.blobWalkers.has(sp.id)) return
        const species = SPECIES_MAP[sp.speciesId]
        const art = species.stage === 'baby'
          ? (st.imgs[`sp_${sp.speciesId}`] ?? st.imgs[`blob_${species.element}`])
          : species.stage === 'adult'
            ? st.imgs[`adult_${species.element}`]
            : st.imgs[`final_${species.element}`]
        st.blobWalkers.set(sp.id, {
          uid: sp.id,
          x: COMPANION_BAND.x1 + Math.random() * (COMPANION_BAND.x2 - COMPANION_BAND.x1),
          y: COMPANION_BAND.y1 + Math.random() * (COMPANION_BAND.y2 - COMPANION_BAND.y1),
          tx: 0, ty: 0, speed: 78, wait: Math.random() * 2,
          moving: false, flip: false, size: Math.round((species.stage === 'baby' ? 50 : 56) * WALKER_SCALE),
          img: art,
          star: !!sp.star,
        })
      })
      Array.from(st.blobWalkers.keys()).forEach(k => { if (!seenB.has(k)) st.blobWalkers.delete(k) })

      // ---- 浇水反馈：哪块地刚被浇水，就在那儿溅一下，并让负责浇水的精灵走过去 ----
      g.plots.forEach((p, i) => {
        const prev = st.prevWater.get(i) ?? p.waterCount
        if (p.waterCount > prev) {
          const [px, py] = PLOT_POS[i]
          st.fx.push({ x: px + PLOT_SIZE / 2, y: py + PLOT_SIZE - 8, kind: 'water', until: t + 1.1 })
          const worker = Array.from(st.blobWalkers.values()).find(w => {
            const sp = g.sprites.find(x => x.id === w.uid)
            return sp?.job === 'water'
          })
          if (worker) {
            worker.tx = px + 12
            worker.ty = py + PLOT_SIZE + 8
            worker.moving = true
          }
        }
        st.prevWater.set(i, p.waterCount)
      })

      // ---- 收获 / 驱虫反馈：作物被收掉、虫没了，都在画面上给个响动 ----
      g.plots.forEach((p, i) => {
        const prevCrop = st.prevCrop.get(i) ?? p.cropId
        const [px, py] = PLOT_POS[i]
        if (prevCrop && !p.cropId) {
          st.fx.push({ kind: 'harvest', x: px + PLOT_SIZE / 2, y: py - 2, until: t + 1.8, text: '+收获' })
          const worker = Array.from(st.blobWalkers.values()).find(w => {
            const sp = g.sprites.find(x => x.id === w.uid)
            return sp?.job === 'harvest'
          })
          if (worker) { worker.tx = px + 14; worker.ty = py + PLOT_SIZE + 6; worker.moving = true }
        }
        st.prevCrop.set(i, p.cropId)
        const prevPest = st.prevPest.get(i) ?? !!p.pest
        if (prevPest && !p.pest) {
          st.fx.push({ kind: 'pest', x: px + PLOT_SIZE / 2, y: py + PLOT_SIZE / 2, until: t + 1.1, text: '虫没了' })
        }
        st.prevPest.set(i, !!p.pest)
      })

      // ---- 更新 ----
      st.animalWalkers.forEach(w => wanderUpdate(w, dt, PASTURE.x1 + 20, PASTURE.x2 - w.size - 10, PASTURE.y1 + 140, PASTURE.y2 - w.size - 10))
      st.blobWalkers.forEach(w => {
        const sp = g.sprites.find(x => x.id === w.uid)
        const working = !!sp?.job && sp.stamina > 0
        if (working) wanderUpdate(w, dt, 40, 720, 300, 690)
        else wanderUpdate(w, dt, COMPANION_BAND.x1, COMPANION_BAND.x2, COMPANION_BAND.y1, COMPANION_BAND.y2)
      })
      const f = st.farmer
      {
        const look = ownerLook(g.ownerEquip ?? {})
        const target = st.ownerImgs[look]
        if (target && f.img !== target) f.img = target
        // 衣服已经画在贴纸里，只有星辉套装再补一点微光
        f.tint = look === 'star' ? 'saturate(1.12) brightness(1.05)' : undefined
      }
      if (f.moving) {
        const dx = f.tx - f.x, dy = f.ty - f.y
        const dist = Math.hypot(dx, dy)
        if (dist < 5) {
          f.moving = false
          if (st.pending) {
            const act = st.pending
            st.pending = null
            const gg = gameRef.current
            if (act.kind === 'plant' && act.plotIdx !== undefined) gg.plant(act.plotIdx, act.itemId!.replace('seed_', ''))
            if (act.kind === 'water' && act.plotIdx !== undefined) gg.water(act.plotIdx)
            if (act.kind === 'harvest' && act.plotIdx !== undefined) gg.harvest(act.plotIdx)
            if (act.kind === 'feedAnimal' && act.animalUid && act.itemId) gg.feedAnimal(act.animalUid, act.itemId)
            if (act.kind === 'collect' && act.animalUid) gg.collectProduce(act.animalUid)
            st.farmerAction = { type: act.pose, until: t + 1.5 }
          }
        } else {
          f.x += (dx / dist) * f.speed * dt
          f.y += (dy / dist) * f.speed * dt
        }
      }
      if (st.pendingPose) {
        st.farmerAction = { type: st.pendingPose.type, until: t + 1.1 }
        st.pendingPose = null
      }
      if (st.farmerAction && t > st.farmerAction.until) st.farmerAction = null

      // ---------- 绘制 ----------
      // 地面：暖纸底 + 两层色斑 + 草簇 + 纸纹，先铺底再叠道具
      ctx.fillStyle = SCENE.ground
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.fillStyle = SCENE.patchA
      ctx.globalAlpha = 0.55
      for (let i = 0; i < 26; i += 1) {
        const px = rand(i * 13) * W, py = 150 + rand(i * 17) * (H - 170)
        ctx.beginPath()
        ctx.ellipse(px, py, 30 + rand(i * 7) * 62, 14 + rand(i * 5) * 22, rand(i) * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = SCENE.patchB
      ctx.globalAlpha = 0.45
      for (let i = 0; i < 16; i += 1) {
        const px = rand(i * 29) * W, py = 200 + rand(i * 23) * (H - 240)
        ctx.beginPath()
        ctx.ellipse(px, py, 22 + rand(i * 11) * 40, 10 + rand(i * 13) * 14, rand(i) * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      // 割草条纹：很淡的斜向亮带，让草地有"被照料过"的秩序感
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.fillStyle = '#FFFFFF'
      for (let i = -8; i < 18; i += 1) {
        ctx.save()
        ctx.translate(i * 90, 0)
        ctx.rotate(-0.18)
        ctx.fillRect(0, 120, 46, H)
        ctx.restore()
      }
      ctx.restore()
      // 土壤斑点：让大面积草地有材质，而不是一块纯色
      ctx.save()
      for (let i = 0; i < 260; i += 1) {
        const px = rand(i * 3.7) * W
        const py = 150 + rand(i * 5.1) * (H - 160)
        const a = 0.035 + rand(i * 7.3) * 0.05
        ctx.fillStyle = `rgba(140,118,88,${a})`
        ctx.beginPath()
        ctx.ellipse(px, py, 1.2 + rand(i * 11) * 3.4, 0.9 + rand(i * 13) * 2.2, rand(i) * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      // 几块更深的土色区域（地块周围的地面更"被踩过"）
      for (let i = 0; i < 6; i += 1) {
        const px = rand(i * 31) * W
        const py = 220 + rand(i * 37) * (H - 260)
        ctx.fillStyle = 'rgba(150,124,94,0.075)'
        ctx.beginPath()
        ctx.ellipse(px, py, 90 + rand(i * 17) * 130, 30 + rand(i * 19) * 40, rand(i) * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      drawTufts(ctx)
      // 顶部远景：一层很轻的暖影，把地平线压回去
      const topFade = ctx.createLinearGradient(0, 0, 0, 190)
      topFade.addColorStop(0, 'rgba(120,104,80,0.10)')
      topFade.addColorStop(1, 'rgba(120,104,80,0)')
      ctx.fillStyle = topFade
      ctx.fillRect(0, 0, W, 190)
      ctx.save()
      ctx.fillStyle = 'rgba(124,155,100,0.10)'
      ctx.beginPath(); ctx.ellipse(120, 110, 260, 90, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(W - 150, 90, 220, 80, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // 小路：按布局给的折线画，宽填色 + 柔边 + 沿路石子
      const pathPts = LAYOUT.path
      ctx.save()
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      const strokePath = (width: number, color: string) => {
        ctx.lineWidth = width
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(pathPts[0][0], pathPts[0][1])
        for (let i = 1; i < pathPts.length - 1; i += 1) {
          const [x1, y1] = pathPts[i]
          const [x2, y2] = pathPts[i + 1]
          ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2)
        }
        const last = pathPts[pathPts.length - 1]
        ctx.lineTo(last[0], last[1])
        ctx.stroke()
      }
      strokePath(46, 'rgba(90,67,53,0.08)')
      strokePath(40, SCENE.path)
      strokePath(34, '#FAF1DC')
      // 沿路撒石子
      ctx.fillStyle = SCENE.pebble
      for (let i = 1; i < pathPts.length; i += 1) {
        const [ax, ay] = pathPts[i - 1]
        const [bx, by] = pathPts[i]
        const seg = Math.hypot(bx - ax, by - ay)
        const n = Math.max(3, Math.round(seg / 34))
        for (let k = 0; k < n; k += 1) {
          const tt = (k + 0.4) / n
          const px = ax + (bx - ax) * tt + Math.sin(k * 2.3 + i) * 22
          const py = ay + (by - ay) * tt + Math.cos(k * 1.9 + i) * 12
          ctx.beginPath()
          ctx.ellipse(px, py, 2.2 + rand(k + i) * 2, 1.4 + rand(k * 3 + i) * 1.1, rand(k * 5) * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()

      // 纸纹与暗角：收住四周，让画面像一页纸
      ctx.drawImage(getGrain(), 0, 0)
      const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.46, W / 2, H / 2, Math.max(W, H) * 0.66)
      vignette.addColorStop(0, 'rgba(90,70,55,0)')
      vignette.addColorStop(1, 'rgba(90,70,55,0.10)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      const deco: { y: number; draw: () => void }[] = []

      const b = LAYOUT.barn
      if (st.imgs.barn.ok) deco.push({ y: b.y + b.h * 0.98, draw: () => drawProp(ctx, st.imgs.barn, b.x, b.y, b.w, b.h) })
      for (const d of LAYOUT.deco) {
        const img = (st.imgs as unknown as Record<string, typeof st.imgs.barn>)[d.key]
        if (img?.ok) deco.push({ y: d.y + d.h * 0.96, draw: () => drawProp(ctx, img, d.x, d.y, d.w, d.h) })
      }

      // 牧场：围栏内换一层更暖的踩踏土色，让"牧场"和"草地"分开
      ctx.save()
      const pg = ctx.createLinearGradient(0, PASTURE.y1, 0, PASTURE.y2)
      pg.addColorStop(0, 'rgba(205,184,148,0.16)')
      pg.addColorStop(1, 'rgba(205,184,148,0.26)')
      ctx.fillStyle = pg
      ctx.beginPath()
      ctx.roundRect(PASTURE.x1 - 10, PASTURE.y1 + 6, PASTURE.x2 - PASTURE.x1 + 20, PASTURE.y2 - PASTURE.y1 + 10, 26)
      ctx.fill()
      // 靠围栏一圈更深的落影
      ctx.strokeStyle = 'rgba(150,124,94,0.10)'
      ctx.lineWidth = 10
      ctx.stroke()
      ctx.restore()

      // 牧场围栏：用和贴纸同色系的木条 + 立柱直接画一个四边形围栏。
      // 侧面按透视画成"向里收"的短段（立柱竖直、横木带斜率），比把横栏旋转 90° 合理。
      {
        const woodRail = '#D9A96A'
        const woodRailHi = '#EBC98F'
        const woodPost = '#E2B477'
        const woodLine = '#8A5B3A'
        const postW = 15
        const postH = 50
        const gate = LAYOUT.pastureGate

        const post = (x: number, baseY: number, h: number) => {
          ctx.save()
          ctx.fillStyle = woodPost
          ctx.strokeStyle = woodLine
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.roundRect(x - postW / 2, baseY - h, postW, h, 4)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = woodRailHi
          ctx.beginPath()
          ctx.ellipse(x, baseY - h + 5, postW / 2 - 3.4, 2.4, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        const rail = (x1: number, y1: number, x2: number, y2: number, w = 8) => {
          ctx.save()
          ctx.lineCap = 'round'
          ctx.strokeStyle = woodLine
          ctx.lineWidth = w + 2.4
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
          ctx.strokeStyle = woodRail
          ctx.lineWidth = w
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
          ctx.strokeStyle = woodRailHi
          ctx.lineWidth = Math.max(1.6, w * 0.36)
          ctx.beginPath(); ctx.moveTo(x1, y1 - 1.5); ctx.lineTo(x2, y2 - 1.5); ctx.stroke()
          ctx.restore()
        }

        const railYs = [-postH + 13, -postH + 24, -postH + 35]
        const rowXs = () => {
          const xs: number[] = []
          for (let x = PASTURE.x1; x <= PASTURE.x2 - 10; x += 94) xs.push(x)
          xs.push(PASTURE.x2)
          return xs
        }

        const row = (y: number, ySort: number, skipGate: boolean) => {
          const xs = rowXs()
          deco.push({
            y: ySort,
            draw: () => {
              for (let i = 0; i < xs.length - 1; i += 1) {
                const ax = xs[i]
                const bx = xs[i + 1]
                if (skipGate && gate != null && ax < gate && bx > gate) {
                  for (const ry of railYs) {
                    rail(ax, y + ry, gate - 58, y + ry)
                    rail(gate + 58, y + ry, bx, y + ry)
                  }
                } else {
                  for (const ry of railYs) rail(ax, y + ry, bx, y + ry)
                }
              }
              for (const x of xs) {
                if (skipGate && gate != null && Math.abs(x - gate) < 56) continue
                post(x, y, postH)
              }
            },
          })
        }

        row(PASTURE.y1 + 8, PASTURE.y1 + 10, false)
        // 前栏底下补一条很淡的长影，围栏才"落地"
        deco.push({
          y: PASTURE.y2 + 2,
          draw: () => {
            ctx.save()
            ctx.fillStyle = 'rgba(96,74,56,0.10)'
            ctx.beginPath()
            ctx.roundRect(PASTURE.x1 - 10, PASTURE.y2 + 3, PASTURE.x2 - PASTURE.x1 + 20, 9, 5)
            ctx.fill()
            ctx.restore()
          },
        })
        row(PASTURE.y2, PASTURE.y2 + 30, true)

        const side = (x: number, inward: number) => {
          const steps = 4
          const yA = PASTURE.y1 + 22
          const yB = PASTURE.y2 - 4
          const pts: [number, number][] = []
          for (let i = 0; i <= steps; i += 1) {
            const tt = i / steps
            pts.push([x + inward * tt, yA + (yB - yA) * tt])
          }
          for (let i = 0; i < pts.length; i += 1) {
            const [px, py] = pts[i]
            deco.push({ y: py + 6, draw: () => post(px, py, postH - 5) })
            if (i > 0) {
              const [qx, qy] = pts[i - 1]
              deco.push({
                y: py + 5,
                draw: () => {
                  for (const ry of [-postH + 15, -postH + 26, -postH + 37]) rail(qx, qy + ry, px, py + ry, 6.5)
                },
              })
            }
          }
        }
        side(PASTURE.x1 + 5, 10)
        side(PASTURE.x2 - 5, -10)

        if (gate != null) {
          deco.push({
            y: PASTURE.y2 + 34,
            draw: () => {
              post(gate - 58, PASTURE.y2 + 4, postH + 8)
              post(gate + 58, PASTURE.y2 + 4, postH + 8)
            },
          })
        }
      }
      if (st.imgs.tool_plant.ok) deco.push({ y: b.y + b.h + 4, draw: () => drawProp(ctx, st.imgs.tool_plant, b.x + b.w * 0.72, b.y + b.h * 0.56, 40, 66) })

      // 地块 + 作物
      g.plots.forEach((plot, i) => {
        const [px, py] = PLOT_POS[i]
        const lvDef = PLOT_LEVELS[plot.level]
        deco.push({
          y: py + PLOT_SIZE,
          draw: () => {
            if (st.imgs.plot.ok) {
              // 地块是地面的一部分：染成土壤色，加圆角内阴影，别再跳成粉色方块
              ctx.save()
              ctx.fillStyle = SCENE.shadow
              ctx.beginPath()
              ctx.ellipse(px + PLOT_SIZE / 2, py + PLOT_SIZE + 2, PLOT_SIZE * 0.42, 7, 0, 0, Math.PI * 2)
              ctx.fill()
              ctx.drawImage(st.imgs.plot.el, px, py, PLOT_SIZE, PLOT_SIZE)
              ctx.restore()
              const inner = ctx.createLinearGradient(0, py, 0, py + PLOT_SIZE)
              inner.addColorStop(0, 'rgba(59,46,38,0.12)')
              inner.addColorStop(0.4, 'rgba(59,46,38,0)')
              ctx.save()
              ctx.fillStyle = inner
              ctx.beginPath(); ctx.roundRect(px + 1, py + 1, PLOT_SIZE - 2, PLOT_SIZE - 2, 14); ctx.fill()
              ctx.strokeStyle = 'rgba(59,46,38,0.10)'
              ctx.lineWidth = 1.2
              ctx.stroke()
              ctx.restore()
            }
            // 土地等级染色
            if (plot.level > 0) {
              ctx.fillStyle = plot.level === 1 ? 'rgba(59,46,38,0.18)' : plot.level === 2 ? 'rgba(110,143,168,0.16)' : 'rgba(201,146,47,0.18)'
              ctx.beginPath(); ctx.roundRect(px + 8, py + 8, PLOT_SIZE - 16, PLOT_SIZE - 16, 12); ctx.fill()
            }
            if (plot.level >= 2 && Math.sin(t * 3 + i) > 0) {
              ctx.strokeStyle = plot.level === 2 ? 'rgba(110,143,168,0.65)' : 'rgba(201,146,47,0.7)'
              ctx.lineWidth = 2
              ctx.beginPath(); ctx.roundRect(px + 6, py + 6, PLOT_SIZE - 12, PLOT_SIZE - 12, 12); ctx.stroke()
            }
            // 地块类型：温室玻璃 / 池塘水面
            {
              const pk = plot.kind ?? 'soil'
              if (pk === 'greenhouse') {
                ctx.save()
                ctx.fillStyle = 'rgba(255,255,255,0.26)'
                ctx.beginPath(); ctx.roundRect(px + 2, py + 2, PLOT_SIZE - 4, PLOT_SIZE - 4, 14); ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.85)'
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.roundRect(px + 4, py + 4, PLOT_SIZE - 8, PLOT_SIZE - 8, 12); ctx.stroke()
                // 玻璃高光
                ctx.strokeStyle = 'rgba(255,255,255,0.55)'
                ctx.lineWidth = 1.4
                ctx.beginPath(); ctx.moveTo(px + 14, py + PLOT_SIZE - 18); ctx.lineTo(px + 34, py + 14); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(px + 30, py + PLOT_SIZE - 14); ctx.lineTo(px + 46, py + 22); ctx.stroke()
                // 顶棚小三角
                ctx.strokeStyle = 'rgba(124,155,100,0.85)'
                ctx.beginPath(); ctx.moveTo(px + 14, py + 8); ctx.lineTo(px + PLOT_SIZE / 2, py - 6); ctx.lineTo(px + PLOT_SIZE - 14, py + 8); ctx.stroke()
                ctx.restore()
              } else if (pk === 'pond') {
                ctx.save()
                // 池塘：用不透明水面盖住土块，再画一圈浅水边和水纹
                const wg = ctx.createLinearGradient(0, py, 0, py + PLOT_SIZE)
                wg.addColorStop(0, '#BBD7E2')
                wg.addColorStop(1, '#94B8CC')
                ctx.fillStyle = wg
                ctx.beginPath(); ctx.roundRect(px + 2, py + 2, PLOT_SIZE - 4, PLOT_SIZE - 4, 16); ctx.fill()
                ctx.strokeStyle = 'rgba(232,244,248,0.9)'
                ctx.lineWidth = 3
                ctx.beginPath(); ctx.roundRect(px + 4, py + 4, PLOT_SIZE - 8, PLOT_SIZE - 8, 14); ctx.stroke()
                ctx.strokeStyle = 'rgba(255,255,255,0.55)'
                ctx.lineWidth = 1.4
                for (let k = 0; k < 3; k += 1) {
                  ctx.beginPath()
                  ctx.moveTo(px + 12, py + 16 + k * 12 + Math.sin(t * 1.5 + k + i) * 2)
                  ctx.quadraticCurveTo(px + PLOT_SIZE / 2, py + 12 + k * 12 + Math.sin(t * 1.2 + k) * 2, px + PLOT_SIZE - 12, py + 16 + k * 12)
                  ctx.stroke()
                }
                ctx.strokeStyle = 'rgba(110,143,168,0.75)'
                ctx.lineWidth = 1.6
                ctx.beginPath(); ctx.roundRect(px + 4, py + 4, PLOT_SIZE - 8, PLOT_SIZE - 8, 14); ctx.stroke()
                // 水面波纹
                ctx.strokeStyle = 'rgba(255,255,255,0.55)'
                ctx.lineWidth = 1.4
                for (let k = 0; k < 2; k++) {
                  const wy = py + 28 + k * 22 + Math.sin(t * 1.6 + i + k) * 2
                  ctx.beginPath()
                  ctx.ellipse(px + PLOT_SIZE / 2, wy, 22 - k * 6, 5, 0, Math.PI * 0.15, Math.PI * 0.85)
                  ctx.stroke()
                }
                ctx.restore()
              }
            }
            const crop = plot.cropId ? CROPS.find(c => c.id === plot.cropId) : null
            if (crop) {
              const frac = plotProgress(plot, wb, nowMs)
              const ready = frac >= 1
              const dry = isDry(plot, wb, nowMs)
              const cx = px + PLOT_SIZE / 2, cy = py + PLOT_SIZE / 2 + 6
              const sway = Math.sin(t * 2 + i) * 2
              if (plot.waterCount > 0 && !ready) {
                ctx.fillStyle = 'rgba(110,143,168,0.22)'
                ctx.beginPath()
                ctx.roundRect(px + 10, py + 10, PLOT_SIZE - 20, PLOT_SIZE - 20, 12)
                ctx.fill()
              }
              if (dry) {
                ctx.fillStyle = 'rgba(201,146,47,0.20)'
                ctx.beginPath()
                ctx.roundRect(px + 10, py + 10, PLOT_SIZE - 20, PLOT_SIZE - 20, 12)
                ctx.fill()
              }
              const cropImg = st.imgs[crop.id as string]
              const cw = PLOT_SIZE * 0.64
              if (frac < 0.3 && st.imgs.sprout.ok) ctx.drawImage(st.imgs.sprout.el, cx - cw * 0.32, cy - cw * 0.29, cw * 0.64, cw * 0.59)
              else if (frac < 0.7 && st.imgs.sprout.ok) ctx.drawImage(st.imgs.sprout.el, cx - cw * 0.43, cy - cw * 0.39 + sway * 0.3, cw * 0.86, cw * 0.80)
              else if (cropImg?.ok) {
                const ar = cropImg.el.height / cropImg.el.width
                const dw = cw, dh = dw * ar
                ctx.drawImage(cropImg.el, cx - dw / 2, cy - dh / 2 + sway * 0.4, dw, dh)
              } else {
                // 无贴图作物（番茄/人参）用纸色剪影占位，和贴纸区分开
                ctx.save()
                ctx.globalAlpha = 0.5
                ctx.filter = 'grayscale(1) sepia(0.2) brightness(0.7)'
                ctx.font = `${36 + frac * 10}px sans-serif`
                ctx.textAlign = 'center'
                ctx.fillText(crop.icon, cx, cy + 12 + sway * 0.4)
                ctx.restore()
              }
              if (ready && Math.sin(t * 4 + i * 2) > 0.3) {
                ctx.fillStyle = '#ffd76e'
                ctx.beginPath(); ctx.arc(cx + 28, cy - 28, 3.5, 0, Math.PI * 2); ctx.fill()
                ctx.beginPath(); ctx.arc(cx - 30, cy - 16, 2.5, 0, Math.PI * 2); ctx.fill()
              }
              if (plot.pest) {
                const wob = Math.sin(t * 5 + i) * 1.6
                ctx.font = '20px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('🐛', px + PLOT_SIZE - 12 + wob, py + 26)
              }
              // 状态标记：三颗水滴 / 肥料圆点 / 干旱三角，全用纸面色板
              for (let w = 0; w < plot.waterCount; w += 1) {
                ctx.fillStyle = '#6E8FA8'
                ctx.beginPath(); ctx.arc(px + 10 + w * 8, py + 13, 2.6, 0, Math.PI * 2); ctx.fill()
              }
              if (plot.fertilizer > 0) {
                ctx.fillStyle = plot.fertilizer === 2 ? '#9A7BA8' : '#C9922F'
                ctx.beginPath(); ctx.arc(px + 10, py + (plot.waterCount > 0 ? 23 : 13), 3.2, 0, Math.PI * 2); ctx.fill()
              }
              if (dry) {
                ctx.fillStyle = '#C05248'
                ctx.beginPath()
                ctx.moveTo(px + PLOT_SIZE - 8, py + 8)
                ctx.lineTo(px + PLOT_SIZE - 20, py + 8)
                ctx.lineTo(px + PLOT_SIZE - 14, py + 19)
                ctx.closePath(); ctx.fill()
              }
              // 进度条
              if (!ready) {
                ctx.fillStyle = 'rgba(59,46,38,0.18)'
                ctx.beginPath(); ctx.roundRect(px + 12, py + PLOT_SIZE - 10, PLOT_SIZE - 24, 5, 3); ctx.fill()
                ctx.fillStyle = dry ? '#C9922F' : '#7C9B64'
                ctx.beginPath(); ctx.roundRect(px + 12, py + PLOT_SIZE - 10, (PLOT_SIZE - 24) * frac, 5, 3); ctx.fill()
              }
            }
            // 空地块显示土地等级名
            if (!crop && plot.level > 0) {
              ctx.font = '10px sans-serif'
              ctx.textAlign = 'center'
              ctx.fillStyle = 'rgba(59,46,38,0.55)'
              ctx.fillText(lvDef.name, px + PLOT_SIZE / 2, py + PLOT_SIZE - 8)
            }
          },
        })
      })

      // 温室 / 池塘：两个固定分区各加一个"地标"，让它们像农场里的两个角落
      {
        const gh = zoneCells('greenhouse').filter(i => g.plots[i]?.kind === 'greenhouse')
        if (gh.length) {
          const xs = gh.map(i => PLOT_POS[i][0])
          const ys = gh.map(i => PLOT_POS[i][1])
          const gx = Math.min(...xs) - 10
          const gy = Math.min(...ys) - 16
          const gw = Math.max(...xs) + PLOT_SIZE - gx + 10
          const gh2 = Math.max(...ys) + PLOT_SIZE - gy + 12
          deco.push({
            y: gy + gh2,
            draw: () => {
              ctx.save()
              // 玻璃棚：半透明白 + 细白框 + 屋脊
              ctx.fillStyle = 'rgba(255,255,255,0.16)'
              ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh2, 14); ctx.fill()
              ctx.strokeStyle = 'rgba(255,255,255,0.75)'
              ctx.lineWidth = 2
              ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh2, 14); ctx.stroke()
              ctx.strokeStyle = 'rgba(255,255,255,0.5)'
              ctx.lineWidth = 1.2
              ctx.beginPath(); ctx.moveTo(gx + 8, gy + 10); ctx.lineTo(gx + gw - 8, gy + 10); ctx.stroke()
              ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy + 4); ctx.lineTo(gx + gw / 2, gy + gh2 - 8); ctx.stroke()
              // 屋脊高光 + 人字形棚顶
              ctx.strokeStyle = 'rgba(255,255,255,0.85)'
              ctx.lineWidth = 3
              ctx.beginPath(); ctx.moveTo(gx + 12, gy + 6); ctx.lineTo(gx + gw - 12, gy + 6); ctx.stroke()
              ctx.strokeStyle = 'rgba(255,255,255,0.6)'
              ctx.lineWidth = 1.6
              ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy - 10); ctx.lineTo(gx + 10, gy + 6); ctx.stroke()
              ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy - 10); ctx.lineTo(gx + gw - 10, gy + 6); ctx.stroke()
              // 四个角柱
              ctx.fillStyle = 'rgba(124,155,100,0.8)'
              for (const [cx2, cy2] of [[gx + 3, gy + 4], [gx + gw - 7, gy + 4], [gx + 3, gy + gh2 - 12], [gx + gw - 7, gy + gh2 - 12]]) {
                ctx.beginPath(); ctx.roundRect(cx2, cy2, 4, 10, 2); ctx.fill()
              }
              ctx.restore()
            },
          })
        }
        const pd = zoneCells('pond').filter(i => g.plots[i]?.kind === 'pond')
        if (pd.length) {
          const xs = pd.map(i => PLOT_POS[i][0])
          const ys = pd.map(i => PLOT_POS[i][1])
          const px0 = Math.min(...xs) - 8
          const py0 = Math.min(...ys) - 8
          const pw = Math.max(...xs) + PLOT_SIZE - px0 + 8
          const ph = Math.max(...ys) + PLOT_SIZE - py0 + 10
          deco.push({
            y: py0 + ph + 8,
            draw: () => {
              ctx.save()
              // 池塘边的木栈道：沿下沿铺一条，带立柱和横纹
              const deckH = 14
              const dy = py0 + ph + 2
              ctx.fillStyle = '#C79A5E'
              ctx.strokeStyle = '#8A5B3A'
              ctx.lineWidth = 2
              ctx.beginPath(); ctx.roundRect(px0 + 2, dy, pw - 4, deckH, 5); ctx.fill(); ctx.stroke()
              ctx.strokeStyle = 'rgba(120,84,52,0.45)'
              ctx.lineWidth = 1.2
              for (let bx = px0 + 16; bx < px0 + pw - 8; bx += 18) {
                ctx.beginPath(); ctx.moveTo(bx, dy + 2); ctx.lineTo(bx, dy + deckH - 2); ctx.stroke()
              }
              ctx.fillStyle = '#B98A50'
              ctx.strokeStyle = '#8A5B3A'
              for (const bx of [px0 + 14, px0 + pw / 2, px0 + pw - 20]) {
                ctx.beginPath(); ctx.roundRect(bx, dy + deckH - 4, 6, 10, 2); ctx.fill(); ctx.stroke()
              }
              // 水草：三片叶子 + 穗
              for (const [rx, ry, s2] of [[px0 + 4, dy + deckH + 6, 1], [px0 + 12, dy + deckH + 8, 0.8], [px0 + pw - 16, dy + deckH + 7, 0.9]] as [number, number, number][]) {
                ctx.strokeStyle = '#7C9B64'
                ctx.lineWidth = 2.4
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 3 * s2, ry - 12 * s2, rx + 1 * s2, ry - 22 * s2); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx - 5 * s2, ry - 10 * s2, rx - 3 * s2, ry - 18 * s2); ctx.stroke()
                ctx.fillStyle = '#8A5B3A'
                ctx.beginPath(); ctx.ellipse(rx + 1 * s2, ry - 23 * s2, 2, 4.5, 0, 0, Math.PI * 2); ctx.fill()
              }
              ctx.restore()
            },
          })
        }
      }

      // 角色也进同一套 y 排序：走到谷仓/树/栅栏后面时会被正确遮挡
      const cast: Walker[] = [...Array.from(st.animalWalkers.values()), ...Array.from(st.blobWalkers.values()), st.farmer]
      cast.sort((a, b) => a.y - b.y)
      cast.forEach(w => {
        deco.push({
          y: w.y + w.size * 0.94,
          draw: () => {
            drawWalker(ctx, w, t)
            if (w.uid === 'farmer' && st.farmerAction) {
              const tool = st.imgs[`tool_${st.farmerAction.type}`]
              if (tool?.ok) {
                const ar = tool.el.height / tool.el.width
                const tw = w.size * 0.62, th = tw * ar
                const dir = w.flip ? -1 : 1
                ctx.drawImage(tool.el, w.x + w.size / 2 + dir * w.size * 0.28 - (dir < 0 ? tw : 0), w.y + w.size * 0.42, tw, th)
              }
            }
          },
        })
      })
      deco.sort((a, b) => a.y - b.y).forEach(d => d.draw())

      // 前景层：压在角色上方的花草，把画面"框"住（只在有 fg 的布局里画）
      for (const f of LAYOUT.fg ?? []) {
        const img = (st.imgs as unknown as Record<string, typeof st.imgs.barn>)[f.key]
        if (img?.ok) drawProp(ctx, img, f.x, f.y, f.w, f.h, { shadow: false })
      }

      // 刚浇过水的水花
      st.fx = st.fx.filter(f => t < f.until)
      st.fx.forEach(f => {
        const dur = f.kind === 'harvest' ? 1.8 : 1.1
        const k = 1 - Math.max(0, f.until - t) / dur
        ctx.save()
        ctx.globalAlpha = Math.max(0, 1 - k) * 0.9
        if (f.kind === 'water') {
          ctx.strokeStyle = 'rgba(110,143,168,0.85)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.ellipse(f.x, f.y, 12 + k * 30, 6 + k * 14, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = 'rgba(110,143,168,0.55)'
          for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5
            ctx.beginPath()
            ctx.arc(f.x + Math.cos(a) * (14 + k * 26), f.y - 8 - Math.sin(a) * (8 + k * 16), 2.6, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (f.kind === 'harvest') {
          ctx.fillStyle = 'rgba(201,146,47,0.9)'
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + k
            const r = 8 + k * 34
            ctx.beginPath()
            ctx.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6, 2.8 * (1 - k) + 1, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          ctx.fillStyle = 'rgba(124,155,100,0.75)'
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 * i) / 4
            ctx.beginPath()
            ctx.arc(f.x + Math.cos(a) * (10 + k * 22), f.y + Math.sin(a) * (8 + k * 18) - k * 14, 3 * (1 - k) + 1, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        if (f.text) {
          ctx.globalAlpha = Math.max(0, 1 - k) * 0.95
          ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = f.kind === 'harvest' ? '#C9922F' : '#7C9B64'
          ctx.fillText(f.text, f.x, f.y - 14 - k * 26)
        }
        ctx.restore()
      })


      // 工作精灵头顶的工作图标（让它「在干什么」一眼可见）
      Array.from(st.blobWalkers.values()).forEach(w => {
        const sp = g.sprites.find(x => x.id === w.uid)
        if (!sp?.job) return
        if (!sp.job || sp.stamina <= 0) return
        // 只在真的干完一次活之后闪 2.2 秒，不再常驻
        const acted = sp.actedAt ?? 0
        if (!acted || Date.now() - acted > 2200) return
        drawJobBubble(ctx, w.x + w.size / 2, w.y - 12, sp.job as string, t)
      })

      // 动物状态气泡
      g.animals.forEach(a => {
        const w = st.animalWalkers.get(a.uid)
        if (!w) return
        const def = ANIMALS.find(d => d.id === a.type)!
        const cx = w.x + w.size / 2
        if (a.produceReady > 0) drawBubble(ctx, cx, w.y - 14, def.produceIcon, t)
        else if (a.satiety < 30) drawBubble(ctx, cx, w.y - 14, '🍽️', t)
      })

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const walkFarmerTo = (tx: number, ty: number) => {
    const st = sceneRef.current!
    st.farmer.tx = tx
    st.farmer.ty = ty
    st.farmer.moving = true
    st.farmer.flip = st.farmer.tx < st.farmer.x
  }

  /** 立刻结算一个地块动作，只借一帧播放动作姿势（重复操作不再等走路）。 */
  const actNow = (kind: 'plant' | 'water' | 'harvest', plotIdx: number, itemId?: string) => {
    const st = sceneRef.current!
    const g = gameRef.current
    const tx = PLOT_POS[plotIdx][0] + 10
    const ty = PLOT_POS[plotIdx][1] + PLOT_SIZE + 14
    st.farmer.x = tx
    st.farmer.y = ty
    st.farmer.tx = tx
    st.farmer.ty = ty
    st.farmer.moving = false
    st.pending = null
    st.pendingPose = { type: kind }
    if (kind === 'plant' && itemId) { sfx('plant'); g.plant(plotIdx, itemId.replace('seed_', '')) }
    if (kind === 'water') {
      const p = g.state.plots[plotIdx]
      if (p.cropId && p.waterCount < 3) sfx('water')
      g.water(plotIdx)
    }
    if (kind === 'harvest') {
      const p = g.state.plots[plotIdx]
      const crop = p.cropId ? CROPS.find(c => c.id === p.cropId) : undefined
      if (crop && plotProgress(p, workBonuses(g.state)) >= 1) sfx('harvest')
      g.harvest(plotIdx)
    }
    setPopup(null)
  }

  /** 近处直接干、远处才走过去：首次有仪式感，同一块地的重复操作不拖时间。 */
  const actAtPlot = (kind: 'plant' | 'water' | 'harvest', plotIdx: number, itemId?: string) => {
    const st = sceneRef.current!
    const tx = PLOT_POS[plotIdx][0] + 10
    const ty = PLOT_POS[plotIdx][1] + PLOT_SIZE + 14
    if (Math.hypot(st.farmer.x - tx, st.farmer.y - ty) < 260) {
      actNow(kind, plotIdx, itemId)
      return
    }
    st.pending = { kind, plotIdx, itemId, tx, ty, pose: kind }
    walkFarmerTo(tx, ty)
    setPopup(null)
  }

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    const st = sceneRef.current!
    const g = gameRef.current
    const wb = workBonuses(g.state)

    // 点动物？
    let hitAnimal: string | null = null
    st.animalWalkers.forEach(w => {
      const ar = w.img.ok ? w.img.el.height / w.img.el.width : 1
      if (x >= w.x && x <= w.x + w.size && y >= w.y && y <= w.y + w.size * ar) hitAnimal = w.uid
    })
    if (hitAnimal) {
      setPopup({ kind: 'animal', uid: hitAnimal, x: e.clientX - rect.left, y: e.clientY - rect.top })
      return
    }

    // 点地块？
    const plotIdx = PLOT_POS.findIndex(([px, py]) => x >= px && x <= px + PLOT_SIZE && y >= py && y <= py + PLOT_SIZE)
    if (plotIdx >= 0 && plotIdx < g.state.plots.length) {
      const plot = g.state.plots[plotIdx]
      const crop = plot.cropId ? CROPS.find(c => c.id === plot.cropId) : null
      const ready = crop ? plotProgress(plot, wb) >= 1 : false
      if (!plot.cropId) {
        if (!seedRef.current) {
          // 没选种子：打开地块弹窗（可升级土地）
          setPopup({ kind: 'plot', plotIdx, x: e.clientX - rect.left, y: e.clientY - rect.top })
          g.notify('点地块里的种子直接播种，或去下方商店买种子 🌰')
          return
        }
        setPopup(null)
        actAtPlot('plant', plotIdx, seedRef.current)
      } else if (ready) {
        actAtPlot('harvest', plotIdx)
      } else {
        // 生长中：打开地块操作弹窗
        setPopup({ kind: 'plot', plotIdx, x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
      return
    }

    setPopup(null)
    // 点空地：农夫走过去
    walkFarmerTo(Math.max(20, Math.min(W - 100, x - 44)), Math.max(20, Math.min(H - 100, y - 80)))
  }

  // 小农夫跑去动物身边执行动作
  const sendFarmerToAnimal = (uid: string, act: { kind: 'feedAnimal' | 'collect'; itemId?: string; pose: FarmerActionType }) => {
    const st = sceneRef.current!
    const w = st.animalWalkers.get(uid)
    if (!w) return
    st.pending = { ...act, animalUid: uid, tx: w.x + w.size / 2 - 44, ty: w.y + w.size + 6 }
    walkFarmerTo(st.pending.tx, st.pending.ty)
    setPopup(null)
  }

  // 地块浇水：在附近就立刻浇，离得远才走过去
  const sendFarmerToPlot = (plotIdx: number) => {
    actAtPlot('water', plotIdx)
  }

  const wb = workBonuses(state)
  const seeds = Object.entries(state.inventory).filter(([id]) => id.startsWith('seed_'))

  const sellables = Object.entries(state.inventory).filter(([id]) => !id.startsWith('seed_'))
  const backpackGroups = useMemo(() => {
    const cat = (id: string) => {
      const base = parseItem(id).base
      if (base.startsWith('crystal_')) return 'crystal'
      if (CROPS.some(c => c.id === base)) return 'crop'
      if (ANIMALS.some(a => a.produceId === base)) return 'animal'
      if (FERTILIZERS.some(f => f.id === base)) return 'fert'
      return 'material'
    }
    const labels: Record<string, string> = { crop: '作物', animal: '牧场产出', crystal: '水晶', fert: '肥料', material: '材料' }
    const order = ['crop', 'animal', 'crystal', 'fert', 'material']
    const map = new Map<string, [string, number][]>()
    sellables.forEach(entry => {
      const k = cat(entry[0])
      map.set(k, [...(map.get(k) ?? []), entry])
    })
    return order.map(k => ({ key: k, label: labels[k], items: map.get(k) ?? [] }))
  }, [sellables])
  const recentSales = (state.sellLog ?? []).map((entry, idx) => ({ entry: { ...entry, idx }, index: idx })).slice(-6).reverse()
  const popupAnimal = popup?.kind === 'animal' ? state.animals.find(a => a.uid === popup.uid) : null
  const popupDef = popupAnimal ? ANIMALS.find(d => d.id === popupAnimal.type) : null
  const popupPlot = popup?.kind === 'plot' && popup.plotIdx !== undefined ? state.plots[popup.plotIdx] : null
  const popupCrop = popupPlot?.cropId ? CROPS.find(c => c.id === popupPlot.cropId) : null
  // 浮条上的批量按钮计数
  const waterNeed = state.plots.filter(p => p.cropId && p.waterCount < 3).length
  const readyCount = state.plots.filter(p => p.cropId && plotProgress(p, wb) >= 1).length
  const emptyCount = state.plots.filter(p => !p.cropId).length
  const seedKinds = Object.keys(state.inventory).filter(k => k.startsWith('seed_') && (state.inventory[k] ?? 0) > 0).length

  // 物品贴纸图（带品质后缀的 id 也能匹配）
  const itemSticker = (id: string) => {
    const base = id.replace(/_q\d+$/, '').replace(/^seed_/, '')
    return ITEM_STICKERS[base]
  }

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden p-0">
        <canvas ref={canvasRef} onClick={onClick} className="w-full block cursor-pointer" />
        {/* 动物操作弹窗 */}
        {popup?.kind === 'animal' && popupAnimal && popupDef && (
          <div className="card-float absolute z-10 w-60 p-3"
            style={{ left: Math.min(popup.x, (canvasRef.current?.clientWidth ?? 1100) - 256), top: Math.max(10, popup.y - 40) }}>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{popupDef.icon}</span>
              <div className="min-w-0">
                <div className="text-caption font-bold text-ink">{popupDef.name}</div>
                <div className="micro">饱腹 {Math.round(popupAnimal.satiety)}%</div>
              </div>
              <button onClick={() => setPopup(null)} className="btn-ghost ml-auto px-1.5 py-0.5" aria-label="关闭">
                <Icon name="close" size={14} />
              </button>
            </div>
            {popupAnimal.type === 'bee' && (
              <p className="mt-2 text-micro text-sage-deep">授粉中：全场作物品质 +15%（吃饱才有效）</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {popupDef.foods.flatMap(fd => cropVariants(state.inventory, fd)).length === 0 && (
                <p className="micro">没有它爱吃的食物（{popupDef.foods.map(f => CROPS.find(c => c.id === f)?.name).join('、')}）</p>
              )}
              {popupDef.foods.flatMap(fd => cropVariants(state.inventory, fd)).map(v => (
                <button key={v.id}
                  onClick={() => sendFarmerToAnimal(popup.uid!, { kind: 'feedAnimal', itemId: v.id, pose: 'feed' })}
                  className="chip hover:bg-paper2"
                  style={v.q > 1 ? { borderColor: qualityOf(v.id).color } : undefined}>
                  {itemSticker(v.id) ? <img src={itemSticker(v.id)} className="h-4 w-4 object-contain" alt="" /> : <span className="text-base leading-none">{itemIcon(v.id)}</span>}
                  {itemName(v.id)}
                  <span className="num text-inkfaint">×{v.n}</span>
                </button>
              ))}
            </div>
            {popupAnimal.produceReady > 0 ? (
              <button onClick={() => sendFarmerToAnimal(popup.uid!, { kind: 'collect', pose: 'collect' })} className="btn-primary btn-xs mt-2 w-full">
                <Icon name="basket" size={13} />
                收 {popupDef.produceName} ×{popupAnimal.produceReady}
              </button>
            ) : (
              <p className="micro mt-2">产出进度 {Math.round((popupAnimal.produceProgress / popupDef.produceTime) * 100)}%（吃饱才会产出）</p>
            )}
          </div>
        )}
        {/* 地块操作弹窗 */}
        {popup?.kind === 'plot' && popupPlot && popup.plotIdx !== undefined && (
          <div className="card-float absolute z-10 w-64 p-3"
            style={{ left: Math.min(popup.x, (canvasRef.current?.clientWidth ?? 1100) - 266), top: Math.max(10, popup.y - 60) }}>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{popupCrop ? popupCrop.icon : '▤'}</span>
              <div className="min-w-0">
                <div className="text-caption font-bold text-ink">{popupCrop ? popupCrop.name : '空地'}</div>
                <div className="micro">{PLOT_LEVELS[popupPlot.level].name}</div>
              </div>
              <button onClick={() => setPopup(null)} className="btn-ghost ml-auto px-1.5 py-0.5" aria-label="关闭">
                <Icon name="close" size={14} />
              </button>
            </div>

            {popupCrop && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-micro text-inksoft">
                  <span className="w-12 shrink-0">生长 {Math.round(plotProgress(popupPlot, wb) * 100)}%</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
                    <div className="h-full rounded-full bg-sage" style={{ width: `${Math.round(plotProgress(popupPlot, wb) * 100)}%` }} />
                  </div>
                </div>
                {isDry(popupPlot, wb) && <p className="text-micro text-danger">干旱中：生长减半、品质降档，快浇水。</p>}
                {popupPlot.pest ? <p className="text-micro text-danger">🐛 闹虫了：生长减半，驱掉才能恢复。</p> : null}
                <p className="micro">浇水 {popupPlot.waterCount}/3 · {popupPlot.fertilizer > 0 ? '已施肥' : '未施肥'}</p>
              </div>
            )}

            {!popupCrop && (
              <div className="mt-2">
                <p className="micro mb-1">选一种种子，马上播种：</p>
                <div className="flex flex-wrap gap-1.5">
                  {seeds.length === 0 && <p className="micro">没有种子，先去下方种子商店买。</p>}
                  {seeds.map(([id, n]) => (
                    <button key={id} onClick={() => { setSelectedSeed(id); actNow('plant', popup.plotIdx!, id) }} className="chip hover:bg-paper2">
                      {itemSticker(id) ? <img src={itemSticker(id)} className="h-4 w-4 object-contain" alt="" /> : <span className="text-base leading-none">{itemIcon(id)}</span>}
                      {itemName(id)}
                      <span className="num text-inkfaint">×{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => sendFarmerToPlot(popup.plotIdx!)} disabled={!popupPlot.cropId || popupPlot.waterCount >= 3} className="btn-primary btn-xs">
                <Icon name="drop" size={13} />
                浇水
              </button>
              {popupPlot.pest ? (
                <button onClick={() => { game.clearPest(popup.plotIdx!); sfx('skill') }} className="btn-secondary btn-xs">
                  驱虫
                </button>
              ) : null}
              {FERTILIZERS.map(f => (
                <button key={f.id} onClick={() => { game.fertilize(popup.plotIdx!, f.id); sfx('fertilize') }}
                  disabled={popupPlot.fertilizer !== 0 || !state.inventory[f.id]}
                  className="chip hover:bg-paper2">
                  {f.name}
                  <span className="num text-inkfaint">×{state.inventory[f.id] ?? 0}</span>
                </button>
              ))}
            </div>
            <PlotUpgrade game={game} plot={popupPlot} plotIdx={popup.plotIdx} />
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-1 border-t border-line bg-paper2/80 px-3 py-1.5 text-micro text-inksoft">
          <span>点地块播种 / 管理 / 收获 · 点动物喂食 / 收产出 · 点空地让农夫走过去</span>
        </div>

        {/* 浮条：选种子 + 批量操作（固定在农场画面里，不用来回滚动） */}
        <div className="absolute bottom-[40px] left-1/2 z-10 w-[calc(100%-12px)] max-w-[760px] -translate-x-1/2">
          <div className="card-float flex flex-nowrap items-center justify-start gap-1.5 overflow-x-auto px-2 py-1.5 sm:flex-wrap sm:justify-center sm:overflow-visible">
            <span className="flex flex-none items-center gap-1 whitespace-nowrap text-micro font-semibold text-inksoft">
              <Icon name="leaf" size={13} />
              选种子
            </span>
            {seeds.length === 0 && <span className="micro whitespace-nowrap">先去下方商店买</span>}
            {seeds.map(([id, n]) => (
              <button key={id} onClick={() => setSelectedSeed(selectedSeed === id ? null : id)}
                className={`chip flex-none ${selectedSeed === id ? 'border-sage-deep bg-sage/15 text-sage-deep' : 'hover:bg-paper2'}`}>
                {itemSticker(id) ? <img src={itemSticker(id)} className="h-4 w-4 object-contain" alt="" /> : <span className="text-base leading-none">{itemIcon(id)}</span>}
                {itemName(id)}
                <span className="num text-inkfaint">×{n}</span>
              </button>
            ))}
            {selectedSeed && (
              <span className="flex-none whitespace-nowrap text-micro text-sage-deep">点泥土块播种</span>
            )}
            <span className="mx-0.5 h-5 w-px flex-none bg-line" />
            <button onClick={() => { setPopup(null); if (waterNeed > 0) sfx('water'); game.waterAll() }} disabled={waterNeed === 0} className="btn-primary btn-xs flex-none whitespace-nowrap">
              <Icon name="drop" size={13} />
              一键浇水{waterNeed > 0 ? ` ${waterNeed}` : ''}
            </button>
            <button onClick={() => { setPopup(null); if (readyCount > 0) sfx('harvest'); game.harvestAll() }} disabled={readyCount === 0} className="btn-soft btn-xs flex-none whitespace-nowrap">
              <Icon name="basket" size={13} />
              一键收获{readyCount > 0 ? ` ${readyCount}` : ''}
            </button>
            <button onClick={() => { setPopup(null); sfx('plant'); game.replantAll() }} disabled={emptyCount === 0 || seedKinds === 0}
              className="btn-soft btn-xs flex-none whitespace-nowrap" title="用背包里最多的种子，把空地一次性补上">
              <Icon name="leaf" size={13} />
              一键补种{emptyCount > 0 ? ` ${emptyCount}` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* 农场信息 + 扩建 */}
      <section className="card flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2.5">
          <span className="sticker-tile text-sage-deep"><Icon name="leaf" size={18} /></span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-caption font-bold text-ink num">农场 Lv.{state.farmLevel}</span>
              <span className="pill-soft num">{state.farmExp}/{farmExpForLevel(state.farmLevel)} 经验</span>
            </div>
            <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${(state.farmExp / farmExpForLevel(state.farmLevel)) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-micro text-inksoft">
          <span className="pill-soft num">土地 {state.plots.length}/24</span>
          {beeBonus(state) > 0 && <span className="pill-soft text-sage-deep">蜜蜂授粉 +15% 品质</span>}
          {(wb.growMul > 1 || wb.qualAdd > 0 || wb.crystalAdd > 0) && (
            <span className="pill-soft text-sage-deep">
              工作加成
              {wb.growMul > 1 && ` · 生长 ×${wb.growMul.toFixed(2)}`}
              {wb.qualAdd > 0 && ` · 品质 +${Math.round(wb.qualAdd * 100)}%`}
              {wb.crystalAdd > 0 && ` · 水晶 +${Math.round(wb.crystalAdd * 100)}%`}
            </span>
          )}
        </div>

        <button onClick={() => { game.expandPlot(); sfx('buy') }} disabled={state.plots.length >= 24} className="btn-secondary btn-xs ml-auto">
          <Icon name="tractor" size={14} />
          开垦新地块
          <span className="num text-inkfaint">{plotExpandCost(state.plots.length)} 金币</span>
        </button>
      </section>

      {/* 种子商店 + 牧场商店 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <h3 className="section-title mb-3">
            <Icon name="leaf" size={16} className="text-sage-deep" />
            种子商店
          </h3>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 xl:grid-cols-7">
            {CROPS.map(c => {
              const locked = state.farmLevel < c.unlockLv
              return (
                <button key={c.id} type="button"
                  onClick={() => {
                    // 未解锁时不要用 disabled（会吞掉点击、无任何提示，像「买不了」）
                    if (locked) { sfx('error'); game.notify(`农场 Lv.${c.unlockLv} 解锁${c.name}！`) ; return }
                    game.buySeed(c.id); sfx('buy')
                  }}
                  className={`rounded-control border-hair p-1.5 text-center transition-colors ${locked ? 'border-dashed border-line bg-paper/50 opacity-70' : 'border-line bg-paper hover:bg-paper2'}`}>
                  <div className="flex h-9 items-center justify-center">
                    {ITEM_STICKERS[c.id]
                      ? <img src={ITEM_STICKERS[c.id]} className="h-9 object-contain" alt={c.name} />
                      : <span className="art-silhouette text-xl" aria-hidden>{c.icon}</span>}
                  </div>
                  <div className="mt-0.5 text-caption font-semibold text-ink">{c.name}</div>
                  <div className="whitespace-nowrap text-caption text-inksoft">{locked ? <span className="num">Lv.{c.unlockLv}</span> : <span className="num">{c.seedPrice} 金币</span>}</div>
                  {c.onlyKind && (
                    <div className="text-caption text-butter-deep">需{PLOT_KINDS[c.onlyKind].name}</div>
                  )}
                  <div className="text-caption text-inksoft">
                    水晶 {Math.round(c.crystalChance * 100)}%
                    {c.crystalElement !== 'any' && (
                      <span className="ml-1 inline-flex items-center gap-0.5 align-[-1px]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: ELEMENTS[c.crystalElement].color }} />
                        {ELEMENTS[c.crystalElement].name}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="card p-4">
          <h3 className="section-title mb-3">
            <Icon name="users" size={16} className="text-inksoft" />
            牧场商店
            <span className="pill-soft ml-auto">动物产肥料，蜜蜂授粉</span>
          </h3>
          <div className="grid grid-cols-4 gap-1.5">
            {ANIMALS.map(a => (
              <button key={a.id} onClick={() => { game.buyAnimal(a.id); sfx('buy') }}
                className="rounded-control border-hair border-line bg-paper p-1.5 text-center transition-colors hover:bg-paper2">
                <div className="flex h-11 items-center justify-center">
                  {a.id === 'chicken' ? <img src={chickenUrl} className="h-11 object-contain" alt={a.name} />
                    : a.id === 'sheep' ? <img src={sheepUrl} className="h-11 object-contain" alt={a.name} />
                    : a.id === 'cow' ? <img src={cowUrl} className="h-11 object-contain" alt={a.name} />
                    : <img src={beeUrl} className="h-11 object-contain" alt={a.name} />}
                </div>
                <div className="mt-0.5 text-caption font-semibold text-ink">{a.name}</div>
                <div className="text-caption text-inksoft num">{a.price} 金币</div>
                <div className="flex items-center justify-center gap-0.5 text-caption text-inksoft">
                  吃
                  {a.foods.map(f => ITEM_STICKERS[f]
                    ? <img key={f} src={ITEM_STICKERS[f]} className="h-4 w-4 object-contain" alt={CROPS.find(c => c.id === f)?.name ?? f} />
                    : <span key={f}>{CROPS.find(c => c.id === f)?.icon}</span>)}
                </div>
                {a.fert && <div className="text-caption text-inksoft">产 {FERTILIZERS.find(f => f.id === a.fert)?.name} ×{a.fertN}</div>}
                {a.id === 'bee' && <div className="text-caption text-sage-deep">全场品质 +15%</div>}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 背包：按类别分组 + 误卖回购 */}
      <section className="card p-4">
        <h3 className="section-title mb-3">
          <Icon name="basket" size={16} className="text-inksoft" />
          背包
          <span className="pill-soft ml-auto">点击物品出售换金币</span>
        </h3>
        {sellables.length === 0 && <p className="caption mb-2">空空如也，先去种田吧。</p>}
        {backpackGroups.map(g => g.items.length > 0 && (
          <div key={g.key} className="mb-2.5 last:mb-0">
            <div className="micro mb-1.5 flex items-center gap-1.5 text-inksoft">
              <span className="h-1 w-1 rounded-full bg-inkfaint" />{g.label}
              <span className="num text-inkfaint">{g.items.reduce((a, [, n]) => a + n, 0)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map(([id, n]) => {
                const isCrystal = id.startsWith('crystal_')
                const el = isCrystal ? id.replace(/crystal_/, '').replace(/_q\d+$/, '') as keyof typeof ELEMENTS : null
                const q = qualityOf(id)
                const stk = itemSticker(id)
                return (
                  <button key={id} onClick={() => { game.sellItem(id); sfx('coin') }} title={`出售 ${itemName(id)}`}
                    className="chip px-2.5 py-1.5 hover:bg-paper2"
                    style={{ borderColor: q.q > 1 ? q.color : undefined }}>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-paper2/60"
                      style={!stk && !el ? { background: MATERIAL_TINT[id.replace(/_q\d+$/, '')] ?? '#B9AE9A', borderColor: 'transparent' } : undefined}>
                      {stk
                        ? <img src={stk} className="h-5 w-5 object-contain" alt="" />
                        : el
                          ? <Icon name="gem" size={14} style={{ color: ELEMENTS[el].color }} />
                          : <Icon name={materialIconName(id)} size={13} className="text-[color:#FFFDF8]" />}
                    </span>
                    <span style={q.q > 1 ? { color: q.color } : undefined}>{itemName(id)}</span>
                    <span className="num text-inkfaint">×{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {recentSales.length > 0 && (
          <div className="mt-3 border-t border-hair border-line pt-2.5">
            <div className="micro mb-1.5 text-inksoft">最近卖出（点「回购」原价买回）</div>
            <div className="flex flex-wrap gap-1.5">
              {recentSales.map(({ entry, index }) => (
                <button key={`${entry.id}-${index}`} onClick={() => { game.buyBack(entry.idx); sfx('coin') }}
                  className="chip px-2 py-1 hover:bg-paper2" title={`${itemName(entry.id)} · ${entry.price} 金币`}>
                  {itemSticker(entry.id)
                    ? <img src={itemSticker(entry.id)} className="h-5 w-5 object-contain" alt="" />
                    : <Icon name={materialIconName(entry.id)} size={15} className="text-inksoft" />}
                  <span>{itemName(entry.id)}</span>
                  <span className="num text-inkfaint">{entry.price}</span>
                  <span className="ml-0.5 text-micro text-[color:var(--berry)]">回购</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-inksoft">
          <span className="inline-flex items-center gap-1"><Icon name="sparkle" size={12} className="text-inkfaint" />品质由浇水 / 施肥 / 土地 / 精灵工作决定：</span>
          {QUALITIES.map(q => (
            <span key={q.q} className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: q.color }} />
              {q.name} <span className="num text-inkfaint">×{q.sellMul}</span>
            </span>
          ))}
          <span className="text-inkfaint">水晶分下 / 中 / 上 / 极品，5 颗入孵化池。</span>
        </div>
      </section>
    </div>
  )
}
