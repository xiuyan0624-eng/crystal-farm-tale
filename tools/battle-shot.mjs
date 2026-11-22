// 战斗页截图：讨伐卡 / 世界 BOSS / 战斗舞台（用存档 fixture 直接进中期状态）
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const root = process.cwd()
const file = pathToFileURL(resolve(root, 'single/index.html')).href
const outDir = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '.oil-ui/game-visual-unify/shots')
const prefix = process.argv[3] ?? 'battle'
const now = Date.now()

const sprites = [
  { id: 's1', speciesId: 'yaya', name: '芽芽', element: 'wood', level: 18, exp: 0, stats: { nature: 2, vigor: 1, mana: 0 }, maxHp: 210, hp: 210, atk: 42, def: 18, spd: 26, job: null, stamina: 100 },
  { id: 's2', speciesId: 'huomiao', name: '火苗仔', element: 'fire', level: 16, exp: 0, stats: { nature: 3, vigor: 0, mana: 0 }, maxHp: 180, hp: 180, atk: 52, def: 14, spd: 22, job: null, stamina: 100 },
  { id: 's3', speciesId: 'shuizhu', name: '水珠仔', element: 'water', level: 15, exp: 0, stats: { nature: 0, vigor: 3, mana: 0 }, maxHp: 160, hp: 160, atk: 30, def: 16, spd: 20, job: null, stamina: 100 },
]
const save = {
  coins: 1240, farmExp: 96, farmLevel: 6,
  inventory: { seed_carrot: 4, fert: 2, crystal_wood: 2 },
  plots: [{ cropId: 'tomato', plantedAt: now - 300000, waterCount: 1, fertilizer: 0, level: 0 }],
  animals: [{ uid: 'a1', type: 'bee', satiety: 90, produceProgress: 0, produceReady: 0 }],
  eggs: [], sprites, dex: sprites.map(s => s.speciesId), feedLog: [], gender: 'girl',
  hatchPity: { sinceEpic: 0, sinceLegend: 0 }, firstEarthCrystalGranted: true,
}

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
await page.goto(file, { waitUntil: 'load' })
await page.evaluate((s) => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(1500)
await page.getByRole('tab', { name: /战斗/ }).first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: resolve(outDir, `${prefix}-list.png`), fullPage: true })
await page.getByRole('tab', { name: /战斗/ }).first().click()

// 先看 BOSS：点「讨伐 BOSS」
const bossBtn = page.getByRole('button', { name: /讨伐 BOSS/ }).first()
if (await bossBtn.count()) {
  await bossBtn.click()
  await page.waitForTimeout(2200)
  await page.screenshot({ path: resolve(outDir, `${prefix}-boss.png`) })
  const quit = page.getByRole('button', { name: /逃跑/ }).first()
  if (await quit.count()) await quit.click()
  await page.waitForTimeout(600)
}

// 选「熔岩巨像」开打
const card = page.getByRole('button', { name: /熔岩巨像/ }).first()
if (await card.count()) {
  await card.click()
  await page.waitForTimeout(400)
  const go = page.getByRole('button', { name: /小队出击/ }).first()
  if (await go.count()) {
    await go.click()
    await page.waitForTimeout(2500)
    await page.screenshot({ path: resolve(outDir, `${prefix}-stage.png`) })
  }
}
console.log(JSON.stringify({ outDir, prefix, errors }, null, 2))
await browser.close()
