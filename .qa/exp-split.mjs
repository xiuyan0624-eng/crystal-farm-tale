import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, lv = 22) => ({ id, speciesId: sp, name: sp, element: 'wood', level: lv, exp: 0, stats: { nature: 2, vigor: 2, mana: 2 }, maxHp: 900, hp: 900, atk: 400, def: 60, spd: 30, job: 'harvest', stamina: 100 })
const save = { ...base, farmLevel: 30, sprites: [mk('a', 'chanraoteng'), mk('b', 'jingjiyao'), mk('c', 'huajing')] }
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
await p.waitForTimeout(600)
for (const n of ['chanraoteng', 'jingjiyao', 'huajing']) {
  await p.evaluate(name => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes(name))?.click(), n)
  await p.waitForTimeout(150)
}
// 双击开战
const pos = await p.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('草丛史莱姆'))
  const r = btn.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await p.mouse.dblclick(pos.x, pos.y)
await p.waitForTimeout(700)
// 换到 b
await p.evaluate(() => {
  const chips = Array.from(document.querySelectorAll('button')).filter(x => x.className.includes('chip') && !x.disabled)
  chips[0]?.click()
})
await p.waitForTimeout(600)
// 连点攻击直到结算
for (let i = 0; i < 4; i++) {
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim().startsWith('攻击'))?.click())
  await p.waitForTimeout(500)
}
await p.screenshot({ path: '/tmp/exp-split.png' })
await p.waitForTimeout(2500)
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return s.sprites.map(x => ({ id: x.id, lv: x.level, exp: x.exp })) })
const txt = JSON.stringify(st)
console.log(JSON.stringify({ st, errs: errs.slice(0, 2) }))
await b.close()
