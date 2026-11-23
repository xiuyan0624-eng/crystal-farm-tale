import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const out = {}
for (const layout of ['c', 'd']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } })
  await ctx.addInitScript(l => localStorage.setItem('crystal-farm-layout', l), layout)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)))
  await p.goto('https://xiuyan0624-eng.github.io/crystal-farm-tale/', { waitUntil: 'load' })
  await p.waitForTimeout(1200)
  await p.getByText('小莓', { exact: false }).first().click()
  await p.waitForTimeout(1600)
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1'))
    s.sprites = [{ id: 'k1', speciesId: 'shijiemiao', name: '世界树苗', element: 'wood', level: 1, exp: 0, stats: { nature: 1, vigor: 1, mana: 1 }, maxHp: 75, hp: 75, atk: 12, def: 5, spd: 10, job: 'water', stamina: 100 }]
    localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s))
  })
  await p.reload({ waitUntil: 'load' })
  await p.waitForTimeout(2500)
  await p.screenshot({ path: `/tmp/live-${layout}.png` })
  out[layout] = errs.slice(0, 1)
  await ctx.close()
}
console.log(JSON.stringify(out))
await b.close()
