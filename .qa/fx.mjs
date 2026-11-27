import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, name, el) => ({ id, speciesId: sp, name, element: el, level: 50, exp: 0, stats: { nature: 3, vigor: 3, mana: 3 }, maxHp: 900, hp: 900, atk: 300, def: 60, spd: 30, job: null, stamina: 100 })
const save = { ...base, coins: 5000, farmLevel: 50, sprites: [mk('s1','shangushumo','上古树魔','wood'), mk('s2','canghai','沧海龙王','water'), mk('s3','zhuque','朱雀','fire')] }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 900 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), save)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1400)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('战斗'))?.click())
await p.waitForTimeout(800)
// 进野怪战
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('荧光史莱姆'))?.click())
await p.waitForTimeout(500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小队出击'))?.click())
await p.waitForTimeout(600)
// 连点攻击若干次，抓一张有特效的
for (let i = 0; i < 6; i++) {
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').trim() === '攻击')?.click())
  await p.waitForTimeout(260)
}
await p.screenshot({ path: '/tmp/fx-crit.png' })
// 切 BGM 风格
const before = await p.evaluate(() => localStorage.getItem('crystal-farm-bgm'))
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('音乐盒'))?.click())
await p.waitForTimeout(600)
const after = await p.evaluate(() => localStorage.getItem('crystal-farm-bgm'))
await p.screenshot({ path: '/tmp/bgm-style.png' })
console.log(JSON.stringify({ before, after, errs: errs.slice(0, 2) }))
await b.close()
