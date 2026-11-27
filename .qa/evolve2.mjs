import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const baby = { id: 's1', speciesId: 'yaya', name: '芽芽', element: 'wood', level: 10, exp: 0, stats: { nature: 1, vigor: 4, mana: 1 }, maxHp: 320, hp: 320, atk: 60, def: 20, spd: 22, job: null, stamina: 100 }
const legend = { id: 's2', speciesId: 'shijiemiao', name: '世界树苗', element: 'wood', level: 29, exp: 0, stats: { nature: 5, vigor: 1, mana: 2 }, maxHp: 500, hp: 500, atk: 80, def: 40, spd: 30, job: null, stamina: 100 }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites: [baby, legend] })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 200)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim() === '测试')?.click())
await p.waitForTimeout(500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('看一次进化演出'))?.click())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/evolve-reveal.png' })
const has = await p.evaluate(() => document.body.innerText.includes('收下新形态'))
console.log(JSON.stringify({ has, errs: errs.slice(0, 2) }))
await b.close()
