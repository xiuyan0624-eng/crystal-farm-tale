import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const save = { ...base, farmLevel: 12, inventory: { seed_carrot: 4, seed_leaf: 6, seed_corn: 2, fert: 2 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 900 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1800)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('一键补种'))?.click())
await p.waitForTimeout(1200)
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { planted: s.plots.filter(p => p.cropId).length, seeds: Object.fromEntries(Object.entries(s.inventory).filter(([k]) => k.startsWith('seed_'))) } })
await p.screenshot({ path: '/tmp/replant.png' })
console.log(JSON.stringify({ st, errs: errs.slice(0, 2) }))
await b.close()
