import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const save = { ...base, coins: 8000, farmLevel: 14, goalsClaimed: [], sprites: [], inventory: { crystal_wood: 7 } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1000 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1500)
const before = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).coins)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim() === '领取')?.click())
await p.waitForTimeout(1200)
const after = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).coins)
// 点“去孵化”跳页
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('去孵化'))?.click())
await p.waitForTimeout(800)
const tabText = await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => t.getAttribute('aria-selected') === 'true')?.textContent || '')
await p.screenshot({ path: '/tmp/side-nav.png' })
console.log(JSON.stringify({ before, after, tabText: tabText.trim(), errs: errs.slice(0, 2) }))
await b.close()
