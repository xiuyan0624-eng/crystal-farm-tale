import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const SAVE = '/Users/wfxy/Documents/deepseek-harness/default-workspace/farm-tale-src/.qa/save.json'

const fresh = async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1400 } })
  const p = await ctx.newPage()
  await p.goto(file, { waitUntil: 'load' })
  await p.evaluate(() => localStorage.clear())
  await p.reload({ waitUntil: 'load' })
  await p.waitForTimeout(900)
  await p.getByText('小莓', { exact: false }).first().click()
  await p.waitForTimeout(1800)
  const save = await p.evaluate(() => localStorage.getItem('crystal-farm-save-v1'))
  fs.writeFileSync(SAVE, save)
  await b.close()
  return JSON.parse(save)
}

const run = async () => {
  const base = JSON.parse(fs.readFileSync(SAVE, 'utf8'))
  const inv = { seed_carrot: 4, fert: 3, fert_rare: 1, carrot: 6, pumpkin: 2, crystal_wood: 12, crystal_fire_q2: 3, egg: 5, wool: 2, fiber: 9, hide: 4, dust: 6, fang: 2, scale: 1 }
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1500 } })
  await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, inventory: inv, sellLog: [] })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
  await p.goto(file, { waitUntil: 'load' })
  await p.waitForTimeout(1500)
  const groups = await p.evaluate(() => Array.from(document.querySelectorAll('section')).map(s => (s.querySelector('h3')?.innerText || '').trim()).filter(Boolean))
  const groupText = await p.evaluate(() => {
    const sec = Array.from(document.querySelectorAll('section')).find(s => (s.querySelector('h3')?.innerText || '').includes('背包'))
    return sec ? sec.innerText.replace(/\n+/g, ' | ').slice(0, 220) : 'no-backpack'
  })
  await p.screenshot({ path: '/tmp/bag-before.png', fullPage: true })
  const sellTwo = await p.evaluate(() => {
    const sec = Array.from(document.querySelectorAll('section')).find(s => (s.querySelector('h3')?.innerText || '').includes('背包'))
    const chips = Array.from(sec.querySelectorAll('button')).filter(b => (b.textContent || '').includes('×'))
    const picked = []
    for (const chip of chips.slice(0, 2)) { picked.push((chip.textContent || '').trim().slice(0, 12)); chip.click() }
    return picked
  })

  const log = await p.evaluate(() => JSON.parse(localStorage.getItem('crystal-farm-save-v1')).sellLog)
  await p.screenshot({ path: '/tmp/bag-after.png', fullPage: true })
  await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('回购'))?.click())
  await p.waitForTimeout(700)
  const after = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('crystal-farm-save-v1')); return { log: s.sellLog?.length ?? 0, coins: s.coins, carrot: s.inventory.carrot ?? 0, wood: s.inventory.crystal_wood ?? 0 } })
  await p.screenshot({ path: '/tmp/bag-buyback.png', fullPage: true })
  await b.close()
  return { sections: groups.slice(0, 8), groupText, sellTwo, logLen: log?.length, log, after, errs: errs.slice(0, 2) }
}
await fresh()
console.log(JSON.stringify(await run()))
