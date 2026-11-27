import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, name, el) => ({ id, speciesId: sp, name, element: el, level: 60, exp: 0, stats: { nature: 3, vigor: 3, mana: 3 }, maxHp: 1200, hp: 1200, atk: 420, def: 80, spd: 30, job: null, stamina: 100 })
const save = { ...base, coins: 5000, farmLevel: 50, sprites: [mk('s1','shangushumo','上古树魔','wood')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 900 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(700)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('荧光史莱姆'))?.click())
await p.waitForTimeout(400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小队出击'))?.click())
await p.waitForTimeout(500)
const clickText = async (needle) => p.evaluate(t => {
  const btn = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim().startsWith(t))
  if (btn) { btn.click(); return true }
  return false
}, needle)
const log = []
for (let i = 0; i < 4; i++) {
  log.push(await clickText('攻击'))
  await p.waitForTimeout(150)
  if (i === 1) await p.screenshot({ path: '/tmp/fx-hit.png' })
}
// 用技能（能量应到 3）
await p.waitForTimeout(400)
await clickText('万藤缠天')
await p.waitForTimeout(160)
await p.screenshot({ path: '/tmp/fx-skill.png' })
const st = await p.evaluate(() => { const t = document.body.innerText; return { hasRage: t.includes('残血'), log: t.includes('造成') } })
console.log(JSON.stringify({ log, st, errs: errs.slice(0, 2) }))
await b.close()
