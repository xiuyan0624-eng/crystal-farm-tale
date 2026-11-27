import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const save = { ...base, coins: 5000, farmLevel: 24, inventory: { seed_carrot: 20, seed_leaf: 20, seed_corn: 20, seed_pumpkin: 20, fert: 3 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
for (const [w, h, tag] of [[1312, 900, 'wide'], [760, 900, 'narrow']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
  await p.goto(file, { waitUntil: 'load' })
  await p.waitForTimeout(1400)
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `/tmp/dock-${tag}.png` })
  console.log(tag, JSON.stringify(errs.slice(0, 1)))
  await ctx.close()
}
await b.close()
