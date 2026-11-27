import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, name, el) => ({ id, speciesId: sp, name, element: el, level: 12, exp: 0, stats: { nature: 1, vigor: 4, mana: 1 }, maxHp: 300, hp: 300, atk: 60, def: 20, spd: 20, job: null, stamina: 100 })
const save = { ...base, dex: ['yaya','chanraoteng','jingjiyao','shangushumo','huajing','baihuaxianzi','shengmingzhishu','hualing'], sprites: [mk('s1','yaya','芽芽','wood')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1100 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('图鉴'))?.click())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/dex-chain.png', fullPage: true })
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('养成'))?.click())
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/sprite-tendency.png', fullPage: true })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
