import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
// 芽芽 Lv.9，活力 4（走攻击线），背包一堆胡萝卜可投喂
const baby = { id: 's1', speciesId: 'yaya', name: '芽芽', element: 'wood', level: 10, exp: 0, stats: { nature: 1, vigor: 4, mana: 1 }, maxHp: 320, hp: 320, atk: 60, def: 20, spd: 22, job: null, stamina: 100 }
const legend = { id: 's2', speciesId: 'shijiemiao', name: '世界树苗', element: 'wood', level: 29, exp: 0, stats: { nature: 5, vigor: 1, mana: 2 }, maxHp: 500, hp: 500, atk: 80, def: 40, spd: 30, job: null, stamina: 100 }
const save = { ...base, coins: 5000, dex: ['yaya','shijiemiao'], sprites: [baby, legend], inventory: { carrot: 20, seed_carrot: 3 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 200)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('养成'))?.click())
await p.waitForTimeout(900)
// 详情 → 投喂胡萝卜（自然+1）够升级
const feed = await p.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim() === '详情')
  btn?.click()
  return !!btn
})
await p.waitForTimeout(400)
let clicks = 0
for (let i = 0; i < 6; i++) {
  const ok = await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(x => /^胡萝卜\s*×/.test((x.textContent || '').trim()) && x.getBoundingClientRect().left < 800)
    if (btn) { btn.click(); return true }
    return false
  })
  if (ok) clicks++
  await p.waitForTimeout(420)
}
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/evolve-reveal.png' })
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { species: s.sprites.map(x => x.speciesId), dex: s.dex, hasReveal: document.body.innerText.includes('进化中') } })
console.log(JSON.stringify({ feed, clicks, st, errs: errs.slice(0, 2) }))
await b.close()
