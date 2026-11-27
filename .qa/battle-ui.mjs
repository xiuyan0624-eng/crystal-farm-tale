import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, lv = 22) => ({ id, speciesId: sp, name: sp, element: 'wood', level: lv, exp: 0, stats: { nature: 2, vigor: 2, mana: 2 }, maxHp: 900, hp: 900, atk: 200, def: 60, spd: 30, job: 'harvest', stamina: 100 })
const save = { ...base, farmLevel: 30, sprites: [mk('a', 'chanraoteng'), mk('b', 'huajing'), mk('c', 'jingjiyao')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1100 } })
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
// 选三只
for (const n of ['chanraoteng', 'huajing', 'jingjiyao']) {
  await p.evaluate(name => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes(name))?.click(), n)
  await p.waitForTimeout(200)
}
await p.screenshot({ path: '/tmp/team-order.png', fullPage: true })
// 双击史莱姆开战
const cards = await p.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('草丛史莱姆'))
  if (!btn) return null
  const r = btn.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
if (cards) { await p.mouse.dblclick(cards.x, cards.y) }
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/battle-switch.png' })
// 点队友换人
const before = await p.evaluate(() => document.body.innerText.includes('换人'))
const switched = await p.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button')).filter(x => x.className.includes('chip'))
  const target = btns.find(x => !x.disabled)
  if (!target) return false
  target.click(); return true
})
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/battle-switch2.png' })
const after = await p.evaluate(() => document.body.innerText.includes('换人'))
console.log(JSON.stringify({ cards: !!cards, switched, beforeText: before, afterText: after, errs: errs.slice(0, 2) }))
await b.close()
