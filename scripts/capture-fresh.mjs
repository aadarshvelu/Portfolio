import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/aadar/AppData/Local/Temp/review2'
const URL = 'http://localhost:3004'

const SHOTS = [
  { name: 'r01-hero',        p: 0.020 },
  { name: 'r02-firstlight',  p: 0.062 },
  { name: 'r03-beat-early',  p: 0.140 },
  { name: 'r04-beat-mid',    p: 0.220 },
  { name: 'r05-beat-late',   p: 0.300 },
  { name: 'r06-confetti',    p: 0.340 },
  { name: 'r07-carrier',     p: 0.390 },
  { name: 'r08-kaggle',      p: 0.455 },
  { name: 'r09-kozhikode',   p: 0.482 },
  { name: 'r10-aws',         p: 0.510 },
  { name: 'r11-peel',        p: 0.570 },
  { name: 'r12-masthead',    p: 0.625 },
  { name: 'r13-story1',      p: 0.650 },
  { name: 'r14-story2',      p: 0.780 },
  { name: 'r15-story3',      p: 0.900 },
  { name: 'r16-postcard-f',  p: 0.980 },
  { name: 'r17-postcard-b',  p: 0.999 },
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas')
await page.waitForTimeout(7000)

for (const s of SHOTS) {
  await page.evaluate(p => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: p * max, behavior: 'instant' })
  }, s.p)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false })
  console.log(s.name)
}
await browser.close()
console.log('done — 17 captures')
