import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const legend = { id: 's1', speciesId: 'shijiemiao', name: '世界树苗', element: 'wood', level: 29, exp: 900, stats: { nature: 5, vigor: 1, mana: 2 }, maxHp: 4200, hp: 4200, atk: 900, def: 300, spd: 60, job: null, stamina: 100 }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, farmLevel: 50, dex: ['shijiemiao'], sprites: [legend] })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 200)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(800)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('荧光史莱姆'))?.click())
await p.waitForTimeout(400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小队出击'))?.click())
await p.waitForTimeout(500)
for (let i = 0; i < 4; i++) {
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim().startsWith('攻击'))?.click())
  await p.waitForTimeout(300)
}
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/limited-evolve.png' })
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { species: s.sprites.map(x => x.speciesId), level: s.sprites[0]?.level, dex: s.dex, reveal: document.body.innerText.includes('收下新形态') } })
console.log(JSON.stringify({ st, errs: errs.slice(0, 2) }))
await b.close()
