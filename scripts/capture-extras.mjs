import { chromium } from 'playwright'
const OUT = 'C:/Users/aadar/AppData/Local/Temp/portfolio-review'
const URL = 'http://localhost:3004'

const SHOTS = [
  { name: '16-postcard-flipping', p: 0.988 },
  { name: '17-postcard-contact',  p: 0.999 },
]

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas')
await page.waitForTimeout(3000)

for (const s of SHOTS) {
  await page.evaluate(p => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: p * max, behavior: 'instant' })
  }, s.p)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false })
  console.log('captured', s.name)
}
await browser.close()
