import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } })
const sp = { ...base, sprites: [{ id: 'x1', speciesId: 'shijiemiao', name: '世界树苗', element: 'wood', level: 5, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 100, hp: 100, atk: 20, def: 5, spd: 10, job: null, stamina: 100 }] }
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), sp)
const p = await ctx.newPage()
p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(2200)
console.log('dbg', JSON.stringify(await p.evaluate(() => window.__dbgBlob)))
await p.screenshot({ path: '/tmp/dbgblob.png' })
await b.close()
