import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const save = { ...base, coins: 8000, farmLevel: 14, inventory: { seed_carrot: 5 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1500)
// 选种子
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('胡萝卜') && (x.textContent || '').includes('×5'))?.click())
await p.waitForTimeout(300)
// 点第一块空地
const box = await p.evaluate(() => {
  const c = document.querySelector('canvas'); const r = c.getBoundingClientRect()
  return { x: (52 + 31) / 1280 * r.width + r.left, y: (146 + 31) / 760 * r.height + r.top }
})
await p.mouse.click(box.x, box.y)
await p.waitForTimeout(1200)
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { planted: s.plots.filter(x => x.cropId).length, seed: s.inventory.seed_carrot } })
await p.screenshot({ path: '/tmp/plant-from-side.png' })
console.log(JSON.stringify({ st, errs: errs.slice(0, 2) }))
await b.close()
