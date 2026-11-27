import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, lv = 20) => ({ id, speciesId: sp, name: sp, element: el, level: lv, exp: 0, stats: { nature: 3, vigor: 1, mana: 1 }, maxHp: 9999, hp: 9999, atk: 999, def: 99, spd: 40, job: null, stamina: 100 })
// 24 块地全开：2 池塘 + 2 温室，其余空
const plots = Array.from({ length: 24 }, (_, i) => ({ id: 'p' + i, cropId: i === 0 ? 'lotus' : null, plantedAt: Date.now() - 400000, waterCount: 3, fertilizer: 1, level: 0, kind: i === 1 ? 'pond' : i === 2 ? 'greenhouse' : 'soil' }))
const save = { ...base, coins: 20000, farmLevel: 30, plots, inventory: { seed_lotus: 5, seed_orchid: 5, seed_carrot: 5 },
  dex: ['huajing'], sprites: [mk('s1', 'huajing', 'wood'), mk('s2', 'chanraoteng', 'wood')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1800)
await p.screenshot({ path: '/tmp/r98-farm.png' })
// 打开池塘地块弹窗
const box = await p.evaluate(() => {
  const c = document.querySelector('canvas'); const r = c.getBoundingClientRect()
  return { x: (52 + 97 + 31) / 1280 * r.width + r.left, y: (168 + 31) / 760 * r.height + r.top }
})
await p.mouse.click(box.x, box.y)
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/r98-pond.png' })
const txt = await p.evaluate(() => document.body.innerText)
// 战斗页
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/r98-battle.png' })
console.log(JSON.stringify({ lotusSeedOnly: !/胡萝卜种子/.test(txt), greenhouseHint: txt.includes('温室'), errs: errs.slice(0, 2) }))
await b.close()
