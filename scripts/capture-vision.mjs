// Capture the vision rebuild (and the reference prototype) with a real-GPU
// headless Chromium — Playwright pages run rAF (not "hidden"), so WebGL renders
// and screenshots are reliable. Env: OUT dir, URL, NAME, TUNE (right-steps).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || 'C:/Users/aadar/AppData/Local/Temp/vision-qa'
const W = Number(process.env.W || 1920)
const H = Number(process.env.H || 1080)
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('console', (m) => {
  if (m.type() === 'error') console.error('[page]', m.text().slice(0, 200))
})

async function cap(url, name, tune = 0) {
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(2500)
  if (tune) {
    await page.evaluate((n) => {
      for (let i = 0; i < n; i++) window.__visionTune && window.__visionTune(1)
    }, tune)
    await page.waitForTimeout(1500)
  }
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('captured', name, url)
}

const gpu = await (async () => {
  await page.goto('http://localhost:5173/', { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
  return page.evaluate(() => {
    const c = document.querySelector('canvas')
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'))
    const d = gl && gl.getExtension('WEBGL_debug_renderer_info')
    return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'
  })
})()
console.log('gpu:', gpu)

// mid power-on
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(950)
await page.screenshot({ path: `${OUT}/vision-boot.png` })
console.log('captured boot')

await cap('http://localhost:5173/', 'vision-ch01')

// play → academy leader → destination page
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(2200)
await page.evaluate(() => window.__visionPlay && window.__visionPlay())
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/vision-leader.png` })
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/vision-page.png` })
console.log('captured leader + page')

await cap('http://localhost:5173/hero-broadcast.html', 'reference')

// interactions: click the ► tuner button → CH02; drag the TINT knob → warm cast
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(2600) // boot → browse
await page.mouse.click(1814, 624) // next ►
await page.waitForTimeout(1100)
await page.screenshot({ path: `${OUT}/vision-click-next.png` })
await page.mouse.move(1750, 438) // TINT knob
await page.mouse.down()
await page.mouse.move(1750, 524, { steps: 8 }) // drag down → tint < 0.5 → warm
await page.mouse.up()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/vision-tint.png` })
console.log('captured interactions')

await browser.close()
console.log('done →', OUT)
