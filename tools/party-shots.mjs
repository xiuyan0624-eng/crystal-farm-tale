// 养成/图鉴截图（带 3 只精灵的存档）
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const root = process.cwd()
const file = pathToFileURL(resolve(root, 'single/index.html')).href
const outDir = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '.oil-ui/game-visual-unify/shots')
const prefix = process.argv[3] ?? 'party'
const now = Date.now()
const sprites = [
  { id: 's1', speciesId: 'yaya', name: '芽芽', element: 'wood', level: 18, exp: 40, stats: { nature: 2, vigor: 1, mana: 0 }, maxHp: 210, hp: 210, atk: 42, def: 18, spd: 26, job: 'water', stamina: 72 },
  { id: 's2', speciesId: 'hualing', name: '花铃', element: 'wood', level: 22, exp: 10, stats: { nature: 3, vigor: 0, mana: 1 }, maxHp: 236, hp: 236, atk: 38, def: 22, spd: 30, job: 'harvest', stamina: 55 },
  { id: 's3', speciesId: 'chenxing', name: '辰星', element: 'light', level: 35, exp: 120, stats: { nature: 4, vigor: 2, mana: 2 }, maxHp: 420, hp: 420, atk: 72, def: 40, spd: 44, job: null, stamina: 100 },
]
const save = {
  coins: 1240, farmExp: 96, farmLevel: 6,
  inventory: { seed_carrot: 4, fert: 2, carrot_q2: 2, crystal_wood: 2, crystal_light: 1 },
  plots: [{ cropId: 'tomato', plantedAt: now - 300000, waterCount: 1, fertilizer: 0, level: 0 }],
  animals: [{ uid: 'a1', type: 'bee', satiety: 90, produceProgress: 0, produceReady: 0 }],
  eggs: [], sprites, dex: sprites.map(s => s.speciesId), feedLog: [], gender: 'girl',
  hatchPity: { sinceEpic: 3, sinceLegend: 12 }, firstEarthCrystalGranted: true,
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
for (const [tab, name] of [['精灵养成', 'sprite'], ['精灵图鉴', 'dex']]) {
  await page.getByRole('tab', { name: new RegExp(tab) }).first().click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(outDir, `${prefix}-${name}.png`), fullPage: true })
}
console.log(JSON.stringify({ outDir, prefix, errors }, null, 2))
await browser.close()
