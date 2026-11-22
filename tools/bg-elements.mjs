// 五系各打一场，检查战斗背景是否按元素切换
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const root = process.cwd()
const file = pathToFileURL(resolve(root, 'single/index.html')).href
const outDir = resolve(process.argv[2] ?? root, '')
const now = Date.now()
const mk = (id, sp, el, lv) => ({ id, speciesId: sp, name: sp, element: el, level: lv, exp: 0,
  stats: { nature: 1, vigor: 1, mana: 0 }, maxHp: 480, hp: 480, atk: 80, def: 30, spd: 24, job: null, stamina: 100 })
const save = { coins: 300, farmExp: 0, farmLevel: 4, inventory: {}, gender: 'girl', plots: [], animals: [], eggs: [],
  dex: ['yaya','shuizhu','huomiao','tudundun','chenxing'], feedLog: [],
  sprites: [mk('s1','yaya','wood',40), mk('s2','shuizhu','water',40), mk('s3','huomiao','fire',40)],
  hatchPity: { sinceEpic: 0, sinceLegend: 0 }, firstEarthCrystalGranted: true }
const targets = [
  ['草丛史莱姆', 'wood'], ['月夜魔狼', 'fire'], ['深渊玄龟', 'water'],
  ['暴躁野猪', 'earth'], ['苍穹古龙', 'light'],
]
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errs = []
page.on('pageerror', e => errs.push(String(e).slice(0, 200)))
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
await page.goto(file, { waitUntil: 'load' })
await page.evaluate(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(900)
const picker = page.getByText('小莓', { exact: false })
if (await picker.count()) await picker.first().click()
await page.waitForTimeout(500)
await page.getByRole('tab', { name: /战斗/ }).first().click()
await page.waitForTimeout(500)
for (const [name, el] of targets) {
  const card = page.getByRole('button', { name: new RegExp(name) }).first()
  if (!(await card.count())) { errs.push('no card ' + name); continue }
  await card.click()
  await page.waitForTimeout(300)
  const go = page.getByRole('button', { name: /小队出击/ }).first()
  if (!(await go.count())) { errs.push('no go ' + name); continue }
  await go.click()
  await page.waitForTimeout(1100)
  await page.screenshot({ path: resolve(outDir, `bg-${el}.png`) })
  const flee = page.getByRole('button', { name: /逃跑/ }).first()
  if (await flee.count()) { await flee.click(); await page.waitForTimeout(500) }
}
console.log(JSON.stringify({ outDir, errs }))
await browser.close()
