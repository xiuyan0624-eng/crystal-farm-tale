import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, job) => ({ id, speciesId: sp, name: sp, element: el, level: 12, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 200, hp: 200, atk: 40, def: 10, spd: 12, job, stamina: 100 })
const sprites = [mk('s1', 'shijiemiao', 'wood', 'water'), mk('s2', 'huajing', 'wood', null), mk('s3', 'yunduo', 'water', null)]
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const out = {}
for (const layout of ['a', 'b', 'c', 'd']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } })
  await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites })
  await ctx.addInitScript(l => localStorage.setItem('crystal-farm-layout', l), layout)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e).slice(0, 120)))
  await p.goto(file, { waitUntil: 'load' })
  await p.waitForTimeout(2200)
  await p.screenshot({ path: `/tmp/layout-${layout}-companions.png` })
  out[layout] = { errs: errs.slice(0, 1) }
  await ctx.close()
}
console.log(JSON.stringify(out))
await b.close()
