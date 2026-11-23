import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, job) => ({ id, speciesId: sp, name: sp, element: el, level: 10, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 200, hp: 200, atk: 30, def: 10, spd: 12, job, stamina: 100 })
const sprites = [mk('s1', 'shijiemiao', 'wood', 'water'), mk('s2', 'huajing', 'wood', 'harvest')]
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 752 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(3500)
await p.screenshot({ path: '/tmp/idle-no-bubble.png' })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
