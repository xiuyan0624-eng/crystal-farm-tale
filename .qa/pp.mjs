import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, lv = 30) => ({ id, speciesId: sp, name: sp, element: 'wood', level: lv, exp: 0, stats: { nature: 2, vigor: 2, mana: 2 }, maxHp: 900, hp: 900, atk: 300, def: 60, spd: 30, job: 'harvest', stamina: 100 })
const save = { ...base, farmLevel: 30, team: ['a', 'b'], sprites: [mk('a', 'chanraoteng'), mk('b', 'jingjiyao')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1120 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 180)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(700)
const teamRestored = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).team)
// 双击 BOSS 卡片
const box = await p.evaluate(() => {
  const h = Array.from(document.querySelectorAll('h2')).find(x => (x.textContent || '').includes('世界 BOSS'))
  const r = h.closest('section').getBoundingClientRect(); return { x: r.x + 120, y: r.y + 40 }
})
await p.mouse.dblclick(box.x, box.y)
await p.waitForTimeout(800)
const inBattle = await p.evaluate(() => (document.body.innerText || '').includes('战斗中'))
// 连点轻击，看 PP 与 miss
for (let i = 0; i < 3; i++) {
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('枝击'))?.click())
  await p.waitForTimeout(450)
}
await p.screenshot({ path: '/tmp/pp-battle.png' })
const txt = await p.evaluate(() => document.querySelector('section.card')?.innerText ?? '')
console.log(JSON.stringify({ teamRestored, inBattle, hasPP: /PP\s*\d+\/\d+/.test(txt), errs: errs.slice(0, 2) }))
await b.close()
