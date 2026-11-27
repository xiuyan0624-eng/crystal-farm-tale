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
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('×5'))?.click())
await p.waitForTimeout(300)
const info = await p.evaluate(() => {
  const c = document.querySelector('canvas'); const r = c.getBoundingClientRect()
  const toClient = (lx, ly) => ({ x: r.left + (lx / 1280) * r.width, y: r.top + (ly / 760) * r.height })
  return { rect: { l: r.left, t: r.top, w: r.width, h: r.height }, p0: toClient(52 + 31, 146 + 31), p5: toClient(52 + 5 * 70 + 31, 3 * 70 + 146 + 31) }
})
console.log(JSON.stringify(info))
await p.mouse.click(info.p0.x, info.p0.y)
await p.waitForTimeout(2200)
const st1 = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).plots.filter(x => x.cropId).length)
await p.mouse.click(info.p5.x, info.p5.y)
await p.waitForTimeout(2200)
const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).plots.filter(x => x.cropId).length)
await p.screenshot({ path: '/tmp/plant2.png' })
console.log(JSON.stringify({ st1, st2 }))
await b.close()
