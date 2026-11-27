import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const today = new Date().toISOString().slice(0, 10)
const plot = () => ({ cropId: 'carrot', plantedAt: Date.now() - 120000, waterCount: 1, fertilizer: 0, level: 1, kind: 'soil' })
const save = { ...base, coins: 1000, farmLevel: 20, plots: Array.from({ length: 6 }, plot), inventory: { seed_carrot: 3 },
  daily: { date: today, water: 18, harvest: 30, elite: 0, claimed: [] } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1500)
// 一键浇水（6 块 +1 → 24/20）
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('一键浇水'))?.click())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/daily-panel.png' })
// 领取完成的委托
const claimed = await p.evaluate(() => {
  const sec = Array.from(document.querySelectorAll('section')).find(s => (s.textContent || '').includes('每日委托'))
  if (!sec) return -1
  const btns = Array.from(sec.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === '领取')
  btns.forEach(b => b.click())
  return btns.length
})
await p.waitForTimeout(2200)
const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { coins: s.coins, daily: s.daily } })
await p.screenshot({ path: '/tmp/daily-claimed.png' })
console.log(JSON.stringify({ claimed, st, errs: errs.slice(0, 2) }))
await b.close()
