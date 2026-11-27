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
await p.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('孵化'))?.click())
await p.waitForTimeout(600)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('召唤传说'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('收下传说'))?.click())
await p.waitForTimeout(500)
// 养成页看工种
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('养成'))?.click())
await p.waitForTimeout(800)
const card = await p.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find(d => d.className.includes && d.className.includes('card') && d.textContent.includes('休息') === false && d.textContent.includes('牧场照料'))
  return (el?.textContent || '').slice(0, 160)
})
await p.screenshot({ path: '/tmp/born-job2.png' })
// 战斗页 8bit
const before = await p.evaluate(() => (window).__audibleBgm)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(900)
const inBattle = await p.evaluate(() => (window).__audibleBgm)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('农场世界'))?.click())
await p.waitForTimeout(900)
const after = await p.evaluate(() => (window).__audibleBgm)
console.log(JSON.stringify({ before, inBattle, after, card, errs: errs.slice(0, 2) }))
await b.close()
