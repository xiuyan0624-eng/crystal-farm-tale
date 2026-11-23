import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const inv = { seed_carrot: 6, fert: 2, crystal_wood: 7, crystal_wood_q2: 3, crystal_fire: 10, crystal_water: 10, crystal_earth: 10, crystal_light: 10 }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, inventory: inv })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 150)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('孵化池'))?.click())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/summon-crystal.png', fullPage: true })
const before = await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('召唤传说'))?.disabled)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('召唤传说'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('农场世界'))?.click())
await p.waitForTimeout(2000)
await p.screenshot({ path: '/tmp/summon-visible.png' })
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { n: s.sprites.length, last: s.sprites.slice(-1)[0]?.speciesId, wood: s.inventory.crystal_wood, woodQ2: s.inventory.crystal_wood_q2 } })
console.log(JSON.stringify({ before, st, errs: errs.slice(0, 2) }))
await b.close()
