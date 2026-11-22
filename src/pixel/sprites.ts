// ==================== 代码手绘像素精灵 ====================
// 每个字符 = 一个像素，'.' 为透明

export interface PixSprite {
  rows: string[]
  pal: Record<string, string>
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sp: PixSprite,
  x: number, y: number,
  scale: number,
  flip = false,
) {
  const rows = sp.rows
  const w = rows[0].length
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      if (ch === '.') continue
      const color = sp.pal[ch]
      if (!color) continue
      ctx.fillStyle = color
      const cc = flip ? w - 1 - c : c
      ctx.fillRect(x + cc * scale, y + r * scale, scale, scale)
    }
  }
}

export function spriteSize(sp: PixSprite, scale: number) {
  return { w: sp.rows[0].length * scale, h: sp.rows.length * scale }
}

function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 255) - 24)
  const g = Math.max(0, ((n >> 8) & 255) - 24)
  const b = Math.max(0, (n & 255) - 24)
  return `rgb(${r},${g},${b})`
}

// -------------------- 小鸡（2帧） --------------------
const CHICKEN_PAL: Record<string, string> = {
  W: '#faf6ec', w: '#e8e0cc', R: '#e64545', O: '#f2a63b', K: '#26221e', L: '#e8963c', P: '#f5c8c8',
}

export const CHICKEN_A: PixSprite = {
  pal: CHICKEN_PAL,
  rows: [
    '......RRR.......',
    '.....RWRW.......',
    '....WWWWWW......',
    '...WWWWKWW......',
    '...WWWWWWWOO....',
    '..WWWWWWWWOO....',
    '..WWWWWWWWW.....',
    '.WWWWWWWWWWW....',
    '.WWWWWWWWWWw....',
    '..WWWWWWWww.....',
    '..WPWWWWWw......',
    '...WWWWWW.......',
    '....L...L.......',
    '...LL...LL......',
  ],
}

export const CHICKEN_B: PixSprite = {
  pal: CHICKEN_PAL,
  rows: [
    '......RRR.......',
    '.....RWRW.......',
    '....WWWWWW......',
    '...WWWWKWW......',
    '...WWWWWWWOO....',
    '..WWWWWWWWOO....',
    '..WWWWWWWWW.....',
    '.WWWWWWWWWWW....',
    '.WWWWWWWWWWw....',
    '..WWWWWWWww.....',
    '..WPWWWWWw......',
    '...WWWWWW.......',
    '.....L.L........',
    '....LL.LL.......',
  ],
}

// -------------------- 绵羊（2帧） --------------------
const SHEEP_PAL: Record<string, string> = {
  F: '#f5efdf', f: '#e8e0cc', D: '#d9b896', d: '#c9a682', K: '#26221e', P: '#f0b8b8',
}

export const SHEEP_A: PixSprite = {
  pal: SHEEP_PAL,
  rows: [
    '....FFFFFFFFFF......',
    '..FFFFFFFFFFFFFF....',
    '.FFFFFFFFFFFFFFFF...',
    '.FFFFFFFFFFDDDDDD...',
    'FFFFFFFFFFDDKDDKD...',
    'FFFFFFFFFFDDDDPDD...',
    'FFFFFFFFFFFDDDDDD...',
    '.FFFFFFFFFFFFdF.....',
    '..FFFFFFFFFFFF......',
    '...d..d...d..d......',
    '...d..d...d..d......',
  ],
}

export const SHEEP_B: PixSprite = {
  pal: SHEEP_PAL,
  rows: [
    '....FFFFFFFFFF......',
    '..FFFFFFFFFFFFFF....',
    '.FFFFFFFFFFFFFFFF...',
    '.FFFFFFFFFFDDDDDD...',
    'FFFFFFFFFFDDKDDKD...',
    'FFFFFFFFFFDDDDPDD...',
    'FFFFFFFFFFFDDDDDD...',
    '.FFFFFFFFFFFFdF.....',
    '..FFFFFFFFFFFF......',
    '....d..d.d...d......',
    '....d..d.d...d......',
  ],
}

// -------------------- 奶牛（2帧） --------------------
const COW_PAL: Record<string, string> = {
  W: '#f5f2ea', B: '#4a4a4a', P: '#f0b8c4', p: '#d18a9a', K: '#26221e', H: '#e8dcc0', E: '#e8a8b8',
}

export const COW_A: PixSprite = {
  pal: COW_PAL,
  rows: [
    '.....WWWWWWWWWWWW.........',
    '...WWWWBBBBWWWWWWWWW......',
    '..WWWWWBBBBWWWWWWWWWW.....',
    '..WWWWWWWWWWWBBBWWWWW.....',
    '.WWWWWWWWWWWWBBBWWWWW.....',
    '.WWWWWWWWWWWWWWWWWWWWHH...',
    '.WWBWWWWWWWWWWWWKWWKWW....',
    '.WWBWWWWWWWWWWWWWWWWWW....',
    '..WWWWWWWWWWWPPPPPPWW.....',
    '...WWWWWWWWWPpPPpPPW......',
    '....WWWWWWWWPPPPPPP.......',
    '.....W..W....W..W.........',
    '.....W..W....W..W.........',
  ],
}

export const COW_B: PixSprite = {
  pal: COW_PAL,
  rows: [
    '.....WWWWWWWWWWWW.........',
    '...WWWWBBBBWWWWWWWWW......',
    '..WWWWWBBBBWWWWWWWWWW.....',
    '..WWWWWWWWWWWBBBWWWWW.....',
    '.WWWWWWWWWWWWBBBWWWWW.....',
    '.WWWWWWWWWWWWWWWWWWWWHH...',
    '.WWBWWWWWWWWWWWWKWWKWW....',
    '.WWBWWWWWWWWWWWWWWWWWW....',
    '..WWWWWWWWWWWPPPPPPWW.....',
    '...WWWWWWWWWPpPPpPPW......',
    '....WWWWWWWWPPPPPPP.......',
    '......W..W..W..W..........',
    '......W..W..W..W..........',
  ],
}

// -------------------- 小精灵团子 --------------------
export function blobSprite(body: string): PixSprite {
  const pal: Record<string, string> = {
    B: body, b: shade(body), K: '#26221e', P: '#f5b8c8', G: '#a8d86a',
  }
  return {
    pal,
    rows: [
      '......GG........',
      '.....GGBG.......',
      '....BBBBBB......',
      '...BBBBBBBB.....',
      '..BBKBBBBKBB....',
      '..BBBBBBBBBB....',
      '..BPBBBBBBPB....',
      '...BBBBBBBB.....',
      '....bbbbbb......',
      '...B..BB..B.....',
    ],
  }
}

// -------------------- 小农夫（粉发双马尾，2帧） --------------------
const FARMER_PAL: Record<string, string> = {
  H: '#f5a8c0', h: '#e08aa8', F: '#ffdcc8', K: '#3a2e2e', P: '#f5a0a0',
  D: '#5a4a6a', d: '#4a3a58', W: '#f5f0ea', S: '#ffdcc8', B: '#7a5a4a',
}

export const FARMER_A: PixSprite = {
  pal: FARMER_PAL,
  rows: [
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '.HHHHHFFFFHHHHH.',
    '.HHHHFKFFKFHHHH.',
    'HHHHHFFFFFFHHHHH',
    'HHH..FFPPFF..HHH',
    'HH....FFFF....HH',
    'h.....DDDD.....h',
    '.....WDDDDW.....',
    '....WWDDDDWW....',
    '....WDDDDDDW....',
    '....DDDDDDDD....',
    '.....SS..SS.....',
    '.....BB..BB.....',
  ],
}

export const FARMER_B: PixSprite = {
  pal: FARMER_PAL,
  rows: [
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '.HHHHHFFFFHHHHH.',
    '.HHHHFKFFKFHHHH.',
    'HHHHHFFFFFFHHHHH',
    'HHH..FFPPFF..HHH',
    'HH....FFFF....HH',
    'h.....DDDD.....h',
    '.....WDDDDW.....',
    '....WWDDDDWW....',
    '....WDDDDDDW....',
    '....DDDDDDDD....',
    '......SSS.......',
    '......BBB.......',
  ],
}

// -------------------- 作物 --------------------
const CROP_PAL_BASE: Record<string, string> = { G: '#5aa84f', g: '#4c9244', D: '#3d7a38' }

export const SPROUT: PixSprite = {
  pal: CROP_PAL_BASE,
  rows: [
    '...G...G...',
    '....G.G....',
    '.G...G...G.',
    '..G..G..G..',
    '...GGGGG...',
  ],
}

export const BUSH: PixSprite = {
  pal: CROP_PAL_BASE,
  rows: [
    '....GGGGG....',
    '..GGGGGGGGG..',
    '.GGgGGGGGgGG.',
    '.GGGGGGGGGGG.',
    '..GGGgGGgGG..',
    '....GGGGG....',
  ],
}

export function matureCrop(fruit: string): PixSprite {
  return {
    pal: { ...CROP_PAL_BASE, F: fruit, f: shade(fruit) },
    rows: [
      '....GGGGG....',
      '..GGFGGGFGG..',
      '.GGfGGGGGfG..',
      '.GGGGGFGGGGG.',
      '.GGgGGGfGgGG.',
      '..GGGGGGGGG..',
      '....GGGGG....',
    ],
  }
}

// -------------------- 树 --------------------
export const TREE: PixSprite = {
  pal: { G: '#6ab04c', g: '#58a03e', D: '#3d7a38', T: '#8a5a3a', t: '#6e462e', P: '#f5b8d0' },
  rows: [
    '......GGGGGGG.......',
    '....GGGGGGGGGGG.....',
    '..GGGGPGGGGGGGGG....',
    '.GGGGGGGGGGGPGGGG...',
    '.GGgGGGGGGgGGGGGG...',
    'GGGGGGGGGGGGGGGGGG..',
    'GGGGPGGGGGGGGGGgGG..',
    '.GGGGGGGGPGGGGGGG...',
    '..GGGGGGGGGGGGGG....',
    '....GGGGGGGGGG......',
    '.......TTTT.........',
    '.......TTtt.........',
    '......TTTtt.........',
  ],
}

// -------------------- 花 --------------------
export function flower(color: string): PixSprite {
  return {
    pal: { F: color, Y: '#f8e868', G: '#6ab04c' },
    rows: [
      '.F.F.',
      'FYFYF',
      '.FFF.',
      '..G..',
      '.GG..',
    ],
  }
}
