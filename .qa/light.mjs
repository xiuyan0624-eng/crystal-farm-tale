import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const lightDex = ['guangmiao','xiaoguang','yunyun','huiguangshi','shenghuikishi','chenxinvshen','zhushangling','xingguijisi','yuehuaxian']
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1200 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, farmLevel: 30, dex: lightDex, sprites: [] })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('图鉴'))?.click())
await p.waitForTimeout(800)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('光系'))?.click())
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/light-dex.png', fullPage: true })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
