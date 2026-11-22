// 造一份"玩到中期"的存档，用来给新素材拍对照图（番茄/人参/蜜蜂/新地块）。
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const root = resolve(import.meta.dirname, '..')
const file = pathToFileURL(resolve(root, 'single/index.html')).href
const outDir = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '.oil-ui/game-visual-unify/shots')
const prefix = process.argv[3] ?? 'art'

const now = Date.now()
const plots = [
  { cropId: 'tomato', plantedAt: now - 120000, waterCount: 2, fertilizer: 1, level: 2 },
  { cropId: 'ginseng', plantedAt: now - 260000, waterCount: 1, fertilizer: 0, level: 1 },
  { cropId: 'corn', plantedAt: now - 200000, waterCount: 3, fertilizer: 2, level: 3 },
  { cropId: 'carrot', plantedAt: now - 400000, waterCount: 0, fertilizer: 0, level: 0 },
  { cropId: 'leaf', plantedAt: now - 90000, waterCount: 1, fertilizer: 0, level: 1 },
  { cropId: 'pumpkin', plantedAt: now - 300000, waterCount: 2, fertilizer: 1, level: 2 },
]
const animals = [
  { uid: 'a-chicken', type: 'chicken', satiety: 70, produceProgress: 0, produceReady: 0 },
  { uid: 'a-sheep', type: 'sheep', satiety: 55, produceProgress: 0, produceReady: 0 },
  { uid: 'a-cow', type: 'cow', satiety: 80, produceProgress: 0, produceReady: 0 },
  { uid: 'a-bee', type: 'bee', satiety: 90, produceProgress: 0, produceReady: 0 },
]
const save = {
  coins: 1240,
  farmExp: 96,
  farmLevel: 6,
  inventory: {
    seed_carrot: 4, seed_leaf: 3, seed_tomato: 3, fert: 2,
    crystal_wood: 2, crystal_fire: 1, crystal_water: 2, crystal_earth: 2, crystal_light: 1,
  },
  plots,
  animals,
  eggs: [],
  sprites: [],
  dex: [],
  feedLog: [],
  gender: 'girl',
  hatchPity: { sinceEpic: 0, sinceLegend: 0 },
  firstEarthCrystalGranted: true,
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('ERR ' + String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 160)) })
await page.goto(file, { waitUntil: 'load' })
await page.evaluate((s) => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(2600)
await page.screenshot({ path: resolve(outDir, `${prefix}-world.png`) })
await page.screenshot({ path: resolve(outDir, `${prefix}-world-full.png`), fullPage: true })

// 窄屏
const narrow = await browser.newContext({ viewport: { width: 480, height: 820 } })
const p2 = await narrow.newPage()
await p2.goto(file, { waitUntil: 'load' })
await p2.evaluate((s) => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
await p2.reload({ waitUntil: 'load' })
await p2.waitForTimeout(2400)
await p2.screenshot({ path: resolve(outDir, `${prefix}-narrow.png`) })

console.log(JSON.stringify({ outDir, prefix, errors }, null, 2))
await browser.close()
