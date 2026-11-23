import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, job) => ({ id, speciesId: sp, name: sp, element: el, level: 30, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 400, hp: 400, atk: 60, def: 20, spd: 15, job, stamina: 100 })
// 前 12 只都是干活的，世界树苗排在最后（第 13 只）——旧逻辑会被 slice(0,6) 切掉
const sprites = [
  mk('a1','huajing','wood','harvest'), mk('a2','shangushumo','wood','water'), mk('a3','jinjiyao','wood','fertilize'),
  mk('a4','shengmingzhishu','wood','pest'), mk('a5','canghai','water','guard'), mk('a6','jibingnvwang','water','mine'),
  mk('a7','yanyuzhanshen','fire','harvest'), mk('a8','dixinyanmo','fire','water'), mk('a9','zhuque','fire','feed'),
  mk('a10','daditan','earth','harvest'), mk('a11','huangmozhuzhu','earth','pest'), mk('a12','qilin','earth','guard'),
  mk('a13','shijiemiao','wood','water'),
]
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 752 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites })
await ctx.addInitScript(() => localStorage.setItem('crystal-farm-layout', 'd'))
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 150)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(2600)
await p.screenshot({ path: '/tmp/many-sprite.png' })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
