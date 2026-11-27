import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, name, el, job, stam) => ({ id, speciesId: sp, name, element: el, level: 22, exp: 0, stats: { nature: 2, vigor: 1, mana: 1 }, maxHp: 400, hp: 400, atk: 120, def: 30, spd: 20, job, stamina: stam })
const save = { ...base, coins: 8000, farmLevel: 14,
  sprites: [mk('s1','shangushumo','上古树魔','wood','water',72), mk('s2','canghai','沧海龙王','water','harvest',45), mk('s3','zhuque','朱雀','fire','guard',88)],
  inventory: { crystal_wood: 7, crystal_fire: 12, crystal_water_q2: 3, crystal_earth: 4, crystal_light: 1, seed_carrot: 5 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1600)
await p.screenshot({ path: '/tmp/side-wide.png' })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
