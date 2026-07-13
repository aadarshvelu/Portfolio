import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/aadar/AppData/Local/Temp/title-check'
const URL = 'http://localhost:3004'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.error('[err]', m.text()) })
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas')
await page.waitForTimeout(8500)
await page.screenshot({ path: `${OUT}/01-focus-first-light.png` })

// Tap LEFT once → THE ARCHITECT
await page.click('button[aria-label="Previous chapter"]')
await page.waitForTimeout(1300)
await page.screenshot({ path: `${OUT}/02-left1-architect.png` })

// Tap LEFT again → COLD OPEN
await page.click('button[aria-label="Previous chapter"]')
await page.waitForTimeout(1300)
await page.screenshot({ path: `${OUT}/03-left2-cold-open.png` })

await browser.close()
console.log('done →', OUT)
