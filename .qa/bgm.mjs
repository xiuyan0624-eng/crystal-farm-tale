import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage({ viewport: { width: 1312, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(2500)
const info = await p.evaluate(() => {
  const a = document.querySelector('audio')
  return { hasAudioTag: !!a, src: a?.src?.slice(0, 40) ?? null, dur: a?.duration ?? null, paused: a?.paused ?? null }
})
console.log(JSON.stringify({ info, errs: errs.slice(0, 2) }))
await b.close()
