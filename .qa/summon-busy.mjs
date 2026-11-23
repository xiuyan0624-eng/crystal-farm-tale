import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, job) => ({ id, speciesId: sp, name: sp, element: el, level: 20, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 300, hp: 300, atk: 60, def: 20, spd: 15, job, stamina: 100 })
const sprites = [
  mk('w1', 'yaoyao', 'wood', 'water'), mk('w2', 'huomiao', 'fire', 'harvest'),
  mk('w3', 'shuizhu', 'water', 'fertilize'), mk('w4', 'tudou', 'earth', 'pest'),
  mk('w5', 'guangzai', 'light', 'guard'), mk('w6', 'yaoyao', 'wood', 'mine'),
  mk('b1', 'huajing', 'wood', null), mk('b2', 'mogu', 'wood', null),
  mk('b3', 'yunduo', 'water', null), mk('b4', 'shanshi', 'earth', null),
]
const inv = { seed_carrot: 6, fert: 3, crystal_wood: 10, crystal_fire: 10, crystal_water: 10, crystal_earth: 10, crystal_light: 10 }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites, inventory: inv })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 150)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('孵化池'))?.click())
await p.waitForTimeout(800)
await p.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const pills = btns.filter(b => /注入|点水晶/.test(b.textContent || ''))
  // 直接注入 5 颗，让召唤可用；再点召唤
  Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('召唤传说'))?.click()
})
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('农场世界'))?.click())
await p.waitForTimeout(2500)
await p.screenshot({ path: '/tmp/summon-busy.png' })
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { n: s.sprites.length, last: s.sprites.slice(-1)[0]?.speciesId } })
console.log(JSON.stringify({ st, errs: errs.slice(0, 2) }))
await b.close()
