// 全部音效都是 WebAudio 现场合成的（不占包体），BGM 是一段 60 秒的循环 mp3。
// 浏览器要求第一次用户手势之后才能出声，所以统一由 initAudio() 在首次点击时打开。
import bgmUrl from '../assets/audio/bgm.mp3'

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let sfxGain: GainNode | null = null
let bgmEl: HTMLAudioElement | null = null
let bgmWanted = false
let muted = false

const MUTE_KEY = 'crystal-farm-audio-muted'
const BGM_KEY = 'crystal-farm-bgm'
export type BgmStyle = 'box' | '8bit'
let bgmStyle: BgmStyle = 'box'
let chipTimer: number | null = null
try {
  const saved = localStorage.getItem(BGM_KEY)
  if (saved === '8bit' || saved === 'box') bgmStyle = saved
} catch { /* 内存回退 */ }

try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  muted = false
}

function ensure(): Ctx | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 1
  master.connect(ctx.destination)
  sfxGain = ctx.createGain()
  sfxGain.gain.value = 0.92
  sfxGain.connect(master)
  return ctx
}

function noiseBuffer(c: Ctx, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function tone(c: Ctx, opts: { f: number; f2?: number; t?: number; dur: number; gain?: number; type?: OscillatorType; at?: number }) {
  const t0 = c.currentTime + (opts.at ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.f, t0)
  if (opts.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.f2), t0 + opts.dur)
  const peak = opts.gain ?? 0.25
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
  osc.connect(g).connect(sfxGain!)
  osc.start(t0)
  osc.stop(t0 + opts.dur + 0.02)
}

function noise(c: Ctx, opts: { dur: number; gain?: number; from?: number; to?: number; at?: number; q?: number }) {
  const t0 = c.currentTime + (opts.at ?? 0)
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, opts.dur + 0.05)
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = opts.q ?? 0.9
  filter.frequency.setValueAtTime(opts.from ?? 900, t0)
  if (opts.to) filter.frequency.exponentialRampToValueAtTime(Math.max(60, opts.to), t0 + opts.dur)
  const g = c.createGain()
  g.gain.setValueAtTime(opts.gain ?? 0.18, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
  src.connect(filter).connect(g).connect(sfxGain!)
  src.start(t0)
  src.stop(t0 + opts.dur + 0.05)
}

export type SfxName =
  | 'click' | 'plant' | 'water' | 'fertilize' | 'harvest' | 'coin' | 'crystal'
  | 'buy' | 'hatch' | 'levelup' | 'feed' | 'job' | 'hit' | 'skill' | 'win' | 'lose' | 'error'
  | 'waterAll' | 'harvestAll'

/** 播一个音效；音频还没解锁时静默跳过（不会报错） */
export function sfx(name: SfxName): void {
  if (muted) return
  const c = ensure()
  if (!c || c.state === 'suspended') return
  try {
    switch (name) {
      case 'click': tone(c, { f: 760, dur: 0.06, gain: 0.10, type: 'triangle' }); break
      case 'plant':
        tone(c, { f: 240, f2: 150, dur: 0.18, gain: 0.20, type: 'sine' })
        noise(c, { dur: 0.16, gain: 0.14, from: 900, to: 260 })
        tone(c, { f: 900, f2: 1200, dur: 0.10, gain: 0.06, type: 'triangle', at: 0.05 })
        break
      case 'water':
        noise(c, { dur: 0.42, gain: 0.20, from: 1900, to: 480, q: 0.7 })
        // 水滴回落：三颗递低的清脆音，像水落在土上
        ;[1400, 1180, 980].forEach((f, i) => tone(c, { f, f2: f * 0.72, dur: 0.14, gain: 0.10, at: 0.02 + i * 0.07 }))
        tone(c, { f: 420, f2: 300, dur: 0.3, gain: 0.06, type: 'sine' })
        break
      case 'waterAll': {
        // 一片地扫过去：连续水滴，音高先升后落
        const fs = [1250, 1380, 1500, 1420, 1300, 1180, 1080]
        fs.forEach((f, i) => tone(c, { f, f2: f * 0.74, dur: 0.13, gain: 0.085, at: i * 0.06 }))
        noise(c, { dur: 0.5, gain: 0.16, from: 2100, to: 520, q: 0.8 })
        break
      }
      case 'harvestAll': {
        // 连续收菜：快速上行琶音，收尾一颗金币
        const notes = [523, 587, 659, 784, 880, 1046, 1174, 1318]
        notes.forEach((f, i) => tone(c, { f, dur: 0.16, gain: 0.11, type: 'triangle', at: i * 0.055 }))
        noise(c, { dur: 0.3, gain: 0.10, from: 1100, to: 320 })
        tone(c, { f: 1568, dur: 0.18, gain: 0.10, type: 'square', at: 0.5 })
        break
      }
      case 'fertilize':
        tone(c, { f: 300, f2: 240, dur: 0.18, gain: 0.14, type: 'triangle' })
        noise(c, { dur: 0.24, gain: 0.12, from: 700, to: 220 })
        tone(c, { f: 1174, dur: 0.16, gain: 0.06, at: 0.06 })
        break
      case 'harvest':
        // 拔起来的一声 + 三音上行
        noise(c, { dur: 0.14, gain: 0.12, from: 900, to: 300 })
        ;[523, 659, 784, 1046].forEach((f, i) => tone(c, { f, dur: i === 3 ? 0.3 : 0.2, gain: 0.15, type: 'triangle', at: 0.04 + i * 0.05 }))
        break
      case 'coin': tone(c, { f: 1318, dur: 0.10, gain: 0.14, type: 'square' }); tone(c, { f: 1760, dur: 0.14, gain: 0.12, type: 'square', at: 0.06 }); break
      case 'crystal': tone(c, { f: 1046, dur: 0.6, gain: 0.12 }); tone(c, { f: 1568, dur: 0.5, gain: 0.07, at: 0.02 }); break
      case 'buy': tone(c, { f: 880, dur: 0.08, gain: 0.12, type: 'triangle' }); tone(c, { f: 1174, dur: 0.12, gain: 0.10, type: 'triangle', at: 0.05 }); break
      case 'hatch': tone(c, { f: 300, f2: 1200, dur: 0.45, gain: 0.16 }); noise(c, { dur: 0.18, gain: 0.14, from: 2200, to: 600, at: 0.5 }); tone(c, { f: 1318, dur: 0.4, gain: 0.12, at: 0.55 }); break
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => tone(c, { f, dur: 0.3, gain: 0.13, type: 'triangle', at: i * 0.09 })); break
      case 'feed':
        tone(c, { f: 420, f2: 560, dur: 0.12, gain: 0.14, type: 'triangle' })
        noise(c, { dur: 0.1, gain: 0.09, from: 2600, to: 1400 })
        break
      case 'job': tone(c, { f: 660, f2: 880, dur: 0.14, gain: 0.10, type: 'triangle' }); break
      case 'hit': noise(c, { dur: 0.16, gain: 0.20, from: 1200, to: 200, q: 0.6 }); tone(c, { f: 140, f2: 70, dur: 0.2, gain: 0.20 }); break
      case 'skill': noise(c, { dur: 0.3, gain: 0.12, from: 400, to: 2400, q: 1.2 }); tone(c, { f: 880, f2: 1320, dur: 0.3, gain: 0.10, type: 'triangle', at: 0.06 }); break
      case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(c, { f, dur: 0.4, gain: 0.12, type: 'triangle', at: i * 0.1 })); break
      case 'lose': [440, 392, 330, 262].forEach((f, i) => tone(c, { f, dur: 0.45, gain: 0.11, type: 'sine', at: i * 0.14 })); break
      case 'error': tone(c, { f: 180, f2: 140, dur: 0.16, gain: 0.10, type: 'square' }); break
    }
  } catch {
    /* 合成失败不影响游戏 */
  }
}

/** 首次用户手势时调用：解锁 AudioContext，并按需开始 BGM */
export function initAudio(): void {
  const c = ensure()
  if (c && c.state === 'suspended') void c.resume()
  if (bgmWanted) playBgm()
}

function ensureBgm(): HTMLAudioElement {
  if (!bgmEl) {
    bgmEl = new Audio(bgmUrl)
    bgmEl.loop = true
    bgmEl.preload = 'auto'
    bgmEl.volume = 0
  }
  return bgmEl
}

function playBgm(): void {
  if (bgmStyle === '8bit') { startChiptune(); return }
  const el = ensureBgm()
  bgmWanted = true
  if (muted) return
  void el.play().catch(() => undefined)
  // 淡入，避免一开场就顶到脸上
  const target = 0.26
  const startedAt = performance.now()
  const timer = window.setInterval(() => {
    if (muted) { el.volume = 0; window.clearInterval(timer); return }
    const k = Math.min(1, (performance.now() - startedAt) / 2500)
    el.volume = target * k
    if (k >= 1) window.clearInterval(timer)
  }, 120)
}

/** 开始循环 BGM（会在第一次用户手势后才真正出声） */
export function startBgm(): void {
  bgmWanted = true
  if (ensure()) playBgm()
}

/** 8bit 芯片版 BGM：方波主旋律 + 三角波低音 + 噪声 hi-hat，16 步循环 */
const CHIP_LEAD = [0, 4, 7, 12, 7, 4, 0, 7, 2, 5, 9, 14, 9, 5, 2, 7]
const CHIP_BASS = [-12, -12, -5, -5, -8, -8, -5, -5]
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function startChiptune(): void {
  const c = ensure()
  if (!c || !master) return
  if (chipTimer !== null) return
  const stepMs = 132
  let step = 0
  const oneNote = (freq: number, dur: number, type: OscillatorType, gain: number) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, c.currentTime)
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    o.connect(g)
    g.connect(master!)
    o.start()
    o.stop(c.currentTime + dur + 0.02)
  }
  const tick = () => {
    if (muted) return
    const bar = Math.floor(step / CHIP_LEAD.length)
    const lead = midiToHz(72 + CHIP_LEAD[step % CHIP_LEAD.length])
    const bass = midiToHz(48 + CHIP_BASS[step % CHIP_BASS.length])
    oneNote(lead, 0.11, 'square', 0.028)
    oneNote(bass, 0.2, 'triangle', 0.038)
    if (bar % 2 === 1 && step % 4 === 2) oneNote(3200, 0.03, 'square', 0.012)
    step = (step + 1) % (CHIP_LEAD.length * 4)
  }
  tick()
  chipTimer = window.setInterval(tick, stepMs)
}

function stopChiptune(): void {
  if (chipTimer !== null) {
    window.clearInterval(chipTimer)
    chipTimer = null
  }
}

export function getBgmStyle(): BgmStyle {
  return bgmStyle
}

/** 切换 BGM 风格：音乐盒（mp3） / 8bit（现场合成） */
export function setBgmStyle(style: BgmStyle): BgmStyle {
  bgmStyle = style
  try { localStorage.setItem(BGM_KEY, style) } catch { /* 内存回退 */ }
  if (bgmEl) { bgmEl.pause(); bgmEl.currentTime = 0 }
  stopChiptune()
  if (bgmWanted && !muted) {
    if (style === '8bit') startChiptune()
    else playBgm()
  }
  return bgmStyle
}

export function isMuted(): boolean {
  return muted
}

/** 静音/开声：同时影响音效与 BGM，并记住选择 */
export function toggleMuted(): boolean {
  muted = !muted
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* 内存回退 */ }
  if (master) master.gain.value = muted ? 0 : 1
  if (bgmEl) {
    bgmEl.volume = muted ? 0 : 0.17
    if (muted) bgmEl.pause()
    else if (bgmWanted) void bgmEl.play().catch(() => undefined)
  }
  if (muted) stopChiptune()
  else if (bgmWanted && bgmStyle === '8bit') startChiptune()
  return muted
}
