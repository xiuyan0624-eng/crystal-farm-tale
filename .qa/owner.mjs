import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const save = { ...base, coins: 20000, inventory: { fiber: 12, hide: 9, dust: 14 },
  ownedEquips: ['hoe_iron', 'hoe_spirit', 'apron_embroidery', 'dress_starlight', 'bell_copper', 'bell_silver'],
  equipLevels: { hoe_iron: 2 }, ownerEquip: { tool: 'hoe_spirit', outfit: 'dress_starlight', charm: 'bell_silver' } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('农场主'))?.click())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/owner-icons.png', fullPage: true })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
