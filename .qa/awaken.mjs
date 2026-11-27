import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('/Users/wfxy/.dsh/profiles/desktop/node_modules/playwright-core')
const file = pathToFileURL(resolve(process.cwd(), 'single/index.html')).href
const base = JSON.parse(fs.readFileSync('.qa/save.json', 'utf8'))
const ids = ['senluo','canglan','zhuming','ruiguang','yinhan']
const els = { senluo:'wood', canglan:'water', zhuming:'fire', ruiguang:'earth', yinhan:'light' }
const names = { senluo:'森罗树灵', canglan:'沧澜圣王', zhuming:'朱雀·朱明', ruiguang:'麒麟·瑞光', yinhan:'星辉龙·银汉' }
const dex = ['shijiemiao','senluo','chaoxi','canglan','zhuque','zhuming','qilin','ruiguang','xinghuilong','yinhan']
const sprites = ids.slice(0,3).map((id,i)=>({ id:'s'+i, speciesId:id, name:names[id], element:els[id], level:50, exp:0, stats:{nature:3,vigor:3,mana:3}, maxHp:900, hp:900, atk:300, def:80, spd:30, job:null, stamina:100 }))
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1312, height: 1100 } })
await ctx.addInitScript(s => localStorage.setItem('crystal-farm-save-v1', JSON.stringify(s)), { ...base, dex, sprites })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
await p.goto(file, { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('小莓'))?.click())
await p.waitForTimeout(1200)
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('图鉴'))?.click())
await p.waitForTimeout(900)
await p.evaluate(() => Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('木系'))?.click())
await p.waitForTimeout(500)
await p.screenshot({ path: '/tmp/awaken-dex.png', fullPage: true })
await p.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).find(t => (t.textContent || '').includes('养成'))?.click())
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/awaken-sprite.png', fullPage: true })
console.log(JSON.stringify({ errs: errs.slice(0, 2) }))
await b.close()
