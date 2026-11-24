import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, lv) => ({ id, speciesId: sp, name: sp, element: el, level: lv, exp: 0, stats: { nature: 2, vigor: 2, mana: 2 }, maxHp: 900, hp: 900, atk: 300, def: 60, spd: 30, job: null, stamina: 100 })
const save = { ...base, farmLevel: 40, sprites: [mk('s1', 'shangushumo', 'wood', 46), mk('s2', 'canghai', 'water', 44), mk('s3', 'zhuque', 'fire', 42)], dex: ['shangushumo', 'canghai', 'zhuque'] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 900 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1600)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(700)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('荧光史莱姆'))?.click())
await p.waitForTimeout(500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小队出击'))?.click())
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/fx-0.png' })
// 手动攻击一次，抓动作中的帧
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim().startsWith('攻击'))?.click())
await p.waitForTimeout(120)
await p.screenshot({ path: '/tmp/fx-1.png' })
await p.waitForTimeout(400)
const has = await p.evaluate(() => !!document.querySelector('.fx-lunge, .fx-hurt'))
console.log(JSON.stringify({ has, errs: errs.slice(0, 2) }))
await b.close()
