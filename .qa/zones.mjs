import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const plot = (kind = 'soil') => ({ cropId: null, plantedAt: 0, waterCount: 0, fertilizer: 0, level: 3, kind })
const plots = Array.from({ length: 24 }, (_, i) => plot())
plots[7] = plot('greenhouse')
plots[16] = plot('pond')
const save = { ...base, coins: 99999, farmLevel: 24, plots, inventory: { seed_orchid: 3, seed_lotus: 3 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 900 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1600)
await p.screenshot({ path: '/tmp/zones-farm.png' })
// 点开第 6 块空地（普通位置）看弹窗
const box = await p.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return null
  const r = c.getBoundingClientRect()
  const X = (52 + 5 * 70 + 31) / 1280 * r.width + r.left
  const Y = (146 + 0 * 70 + 31) / 760 * r.height + r.top
  return { X, Y }
})
if (box) {
  await p.mouse.click(box.X, box.Y)
  await p.waitForTimeout(700)
}
await p.screenshot({ path: '/tmp/zones-popup.png' })
const labels = await p.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent || '').filter(t => t.includes('改成')))
console.log(JSON.stringify({ errs: errs.slice(0, 2), labels }))
await b.close()
