#!/usr/bin/env node
/**
 * 无头 Chrome 截图：选角 / 农场世界 / 地块弹窗 / 孵化池 / 精灵养成 / 图鉴 / 战斗 / 480 窄屏。
 *
 *   node tools/shots.mjs [outDir] [prefix]
 *
 * 依赖 profile 里的 playwright-core 与系统 Chrome；纯本地 file:// 打开 single/index.html。
 */
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, process.argv[2] ?? '../.oil-ui/game-visual-unify/shots')
const prefix = process.argv[3] ?? 'shot'
const file = pathToFileURL(resolve(root, 'single/index.html')).href
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const errors = []

async function open(width, height, dsf = 1) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dsf })
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)) })
  await page.goto(file, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  return page
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(outDir, `${prefix}-${name}.png`) })
}

async function clickTab(page, label) {
  const tab = page.getByRole('tab', { name: new RegExp(label) })
  if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(500); return true }
  const btn = page.getByRole('button', { name: new RegExp(label) })
  if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(500); return true }
  return false
}

/** 点画布上的逻辑坐标（plot 1 中心 86,279）。 */
async function clickCanvas(page, lx, ly) {
  const box = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  await page.mouse.click(box.x + (lx / 1280) * box.w, box.y + (ly / 760) * box.h)
  await page.waitForTimeout(700)
}

const page = await open(1280, 900)
await shot(page, '00-gender')
await page.getByText('小莓', { exact: false }).first().click()
await page.waitForTimeout(900)
await shot(page, '01-world')
await clickCanvas(page, 86, 279)
await shot(page, '02-popup')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
for (const [tab, name] of [['孵化池', '03-fusion'], ['精灵养成', '04-sprite'], ['精灵图鉴', '05-dex'], ['战斗', '06-battle']]) {
  await clickTab(page, tab)
  await shot(page, name)
}
await page.close()

const narrow = await open(480, 820)
await narrow.getByText('小莓', { exact: false }).first().click()
await narrow.waitForTimeout(900)
await shot(narrow, '07-narrow')
await narrow.close()

await browser.close()
console.log(JSON.stringify({ outDir, prefix, errors }, null, 2))
