import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el) => ({ id, speciesId: sp, name: sp, element: el, level: 46, exp: 0, stats: { nature: 2, vigor: 2, mana: 2 }, maxHp: 900, hp: 900, atk: 260, def: 50, spd: 30, job: null, stamina: 100 })
const save = { ...base, farmLevel: 46, sprites: [mk('s1', 'shangushumo', 'wood')], dex: ['shangushumo'] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(600)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('荧光史莱姆'))?.click())
await p.waitForTimeout(400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小队出击'))?.click())
await p.waitForTimeout(400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('自动战斗'))?.click())
await p.waitForTimeout(9000)
await p.screenshot({ path: '/tmp/loot-icons.png' })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
