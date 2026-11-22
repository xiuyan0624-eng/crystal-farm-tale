/**
 * Smoke-test a single-file game build in headless Chrome: does it boot, does it
 * paint, and what does it put on screen? Used to verify the inlined prototype
 * before it is dropped into a Game Studio project.
 *
 * Usage: node verify-single.mjs <file.html> <out.png>
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const htmlPath = resolve(process.argv[2] ?? 'single/index.html')
const shotPath = resolve(process.argv[3] ?? 'single/shot.png')

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const consoleErrors = []
const pageErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300))
})
page.on('pageerror', (error) => pageErrors.push(String(error).slice(0, 300)))

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
await page.waitForTimeout(4000)

const info = await page.evaluate(() => {
  const root = document.querySelector('#root')
  const canvases = [...document.querySelectorAll('canvas')]
  return {
    title: document.title,
    rootChildren: root ? root.children.length : -1,
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
    canvases: canvases.map((canvas) => ({ width: canvas.width, height: canvas.height })),
    images: [...document.querySelectorAll('img')].length,
    brokenImages: [...document.querySelectorAll('img')].filter((img) => !img.complete || img.naturalWidth === 0).length,
  }
})

await page.screenshot({ path: shotPath })
console.log(JSON.stringify({ info, consoleErrors, pageErrors }, null, 2))
await browser.close()
if (pageErrors.length > 0) process.exitCode = 1
