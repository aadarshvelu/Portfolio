// High-detail region crops of the vision build vs the HTML prototype, for
// pixel-level comparison of the console panel and the centre filmstrip frame.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/aadar/AppData/Local/Temp/vision-qa'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text().slice(0, 160)) })

async function shots(url, tag) {
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(3200)
  await page.screenshot({ path: `${OUT}/${tag}-console.png`, clip: { x: 1596, y: 18, width: 324, height: 920 } })
  await page.screenshot({ path: `${OUT}/${tag}-center.png`, clip: { x: 360, y: 300, width: 900, height: 420 } })
  await page.screenshot({ path: `${OUT}/${tag}-full.png` })
  console.log('shot', tag)
}

await shots('http://localhost:5173/', 'v')

// catch the hero-title glitch mid channel-switch
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForSelector('canvas', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(3000)
await page.evaluate(() => window.__visionTune && window.__visionTune(1))
await page.waitForTimeout(320)
await page.screenshot({ path: `${OUT}/v-glitch.png`, clip: { x: 360, y: 50, width: 900, height: 300 } })
console.log('shot glitch')

await shots('http://localhost:5173/hero-broadcast.html', 'r')

await browser.close()
console.log('done →', OUT)
