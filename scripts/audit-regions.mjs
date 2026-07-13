// Fine-grained region crops, build (v-) vs prototype (r-), 1920x1080.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/aadar/AppData/Local/Temp/vision-qa'
mkdirSync(OUT, { recursive: true })

// Console column screen-x ~1610-1890 (at 1920 wide, fluid). Compute per measured.
// Regions are clip rects {x,y,w,h}. Tuned to the console + glass at 1920x1080.
const REGIONS = {
  dial:      { x: 1660, y: 210, w: 180, h: 200 },
  miniknobs: { x: 1620, y: 380, w: 270, h: 110 },
  readout:   { x: 1616, y: 95,  w: 270, h: 90 },
  fader:     { x: 1616, y: 470, w: 270, h: 60 },
  tuner:     { x: 1616, y: 520, w: 270, h: 60 },
  play:      { x: 1616, y: 575, w: 270, h: 70 },
  foot:      { x: 1616, y: 770, w: 270, h: 70 },
  brand:     { x: 1616, y: 30,  w: 270, h: 70 },
  bezelTL:   { x: 20,   y: 20,  w: 140, h: 140 },
  title:     { x: 600,  y: 40,  w: 720, h: 260 },
  liveframe: { x: 760,  y: 360, w: 420, h: 320 },
  sprockets: { x: 380,  y: 380, w: 360, h: 80 },
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

async function shots(url, tag) {
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(3200)
  for (const [name, r] of Object.entries(REGIONS)) {
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, clip: { x: r.x, y: r.y, width: r.w, height: r.h } })
  }
  console.log('shot', tag)
}

await shots('http://localhost:5173/', 'v')
await shots('http://localhost:5173/hero-broadcast.html', 'r')
await browser.close()
console.log('done →', OUT)
