import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
const save = { ...base, coins: 5000, farmLevel: 20, sprites: [], eggs: [], inventory: { crystal_wood: 12, crystal_fire: 12, crystal_water: 12, crystal_earth: 12, crystal_light: 12 } }
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 180)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
// 召唤一只限定（先关掉演出以便读数）
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('孵化'))?.click())
await p.waitForTimeout(700)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('召唤传说'))?.click())
await p.waitForTimeout(2200)
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); const sp = s.sprites.slice(-1)[0]; return { n: s.sprites.length, job: sp?.job, name: sp?.name } })
await p.screenshot({ path: '/tmp/born-job.png' })
// 战斗页 BGM
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('孵化池'))?.click())
await p.waitForTimeout(300)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(900)
const bgm = await p.evaluate(() => localStorage.getItem('crystal-farm-bgm'))
await p.screenshot({ path: '/tmp/battle-bgm.png' })
console.log(JSON.stringify({ st, bgm, errs: errs.slice(0, 2) }))
await b.close()
