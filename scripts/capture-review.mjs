// Captures 15 scroll-beat frames of the WebGL portfolio for unbiased agent review.
// Launches a real Chromium with GPU (D3D11/ANGLE), navigates to the dev server,
// scrolls to each progress mark, waits for smoothed scroll to converge, then
// screenshots to the bundle dir.

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.env.REVIEW_OUT || 'C:/Users/aadar/AppData/Local/Temp/portfolio-review'
const URL = process.env.REVIEW_URL || 'http://localhost:3004'
const W = 1920
const H = 1080

const SHOTS = [
  { name: '01-cold-open',          p: 0.000 },
  { name: '02-dolly-start',        p: 0.020 },
  { name: '03-firstlight-parked',  p: 0.062 },
  { name: '04-beat1-mid',          p: 0.180 },
  { name: '05-confetti-burst',     p: 0.320 },
  { name: '06-carrier-locked',     p: 0.385 },
  { name: '07-kaggle-zoom-in',     p: 0.420 },
  { name: '08-kaggle-vo',          p: 0.455 },
  { name: '09-kozhikode-vo',       p: 0.482 },
  { name: '10-aws-vo',             p: 0.510 },
  { name: '11-page-peel-mid',      p: 0.565 },
  { name: '12-crafts-story1',      p: 0.650 },
  { name: '13-crafts-story2',      p: 0.780 },
  { name: '14-crafts-story3',      p: 0.900 },
  { name: '15-postcard-end',       p: 0.980 },
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-angle=d3d11',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
    '--enable-accelerated-2d-canvas',
    '--enable-webgl',
    '--disable-web-security',
  ],
})

const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

page.on('console', msg => {
  if (msg.type() === 'error') console.error('[page error]', msg.text())
})

console.log('navigate', URL)
await page.goto(URL, { waitUntil: 'networkidle' })

// Wait for canvas + boot sequence to settle
await page.waitForSelector('canvas')
await page.waitForTimeout(3000)

// Confirm WebGL is real
const gpu = await page.evaluate(() => {
  const cv = document.querySelector('canvas')
  const gl = cv.getContext('webgl2') || cv.getContext('webgl')
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown'
})
console.log('gpu:', gpu)

for (const s of SHOTS) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: p * max, behavior: 'instant' })
  }, s.p)
  // smoothed lerp 0.1 — ~30 frames to converge. Plus reveal/fade animations.
  await page.waitForTimeout(1800)
  const file = join(OUT, `${s.name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('captured', s.name, '@', s.p, '→', file)
}

await browser.close()
console.log('done →', OUT)
