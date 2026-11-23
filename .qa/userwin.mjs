import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const mk = (id, sp, el, job) => ({ id, speciesId: sp, name: sp, element: el, level: 5, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 120, hp: 120, atk: 20, def: 6, spd: 10, job, stamina: 100 })
const sprites = [mk('s1', 'shijiemiao', 'wood', 'water'), mk('s2', 'huomiao', 'fire', 'harvest'), mk('s3', 'huajing', 'wood', null), mk('s4', 'yunduo', 'water', null)]
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const out = {}
for (const layout of ['a', 'd']) {
  const ctx = await b.newContext({ viewport: { width: 1312, height: 752 } })   // 用户窗口尺寸
  await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, sprites, farmLevel: 24, plots: base.plots?.length ? base.plots : [] })
  await ctx.addInitScript(l => localStorage.setItem('crystal-farm-layout', l), layout)
  const p = await ctx.newPage()
  await p.goto(file, { waitUntil: 'load' })
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `/tmp/userwin-${layout}.png` })
  out[layout] = true
  await ctx.close()
}
console.log(JSON.stringify(out))
await b.close()
