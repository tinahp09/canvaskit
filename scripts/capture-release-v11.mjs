import { mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const run = promisify(execFile)
const output = resolve(process.cwd(), 'docs/public/releases/v11')
const baseUrl = process.env.CANVASKIT_DEMO_URL ?? 'http://127.0.0.1:4191'

await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1120 }, deviceScaleFactor: 1 })

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.screenshot({ path: resolve(output, 'v11.0-overview.png'), fullPage: true })

  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await page.getByRole('button', { name: 'Bea: add circle' }).click()
  await page.screenshot({ path: resolve(output, 'v11.0-concurrent-nodes.png'), fullPage: true })

  await page.getByRole('button', { name: 'Disconnect Bea' }).click()
  await page.getByRole('button', { name: 'Ada: recolor rectangle' }).click()
  await page.getByRole('button', { name: 'Reconnect Bea' }).click()
  await page.screenshot({ path: resolve(output, 'v11.0-reconnect.png'), fullPage: true })
} finally {
  await browser.close()
}

await run('ffmpeg', [
  '-y', '-pattern_type', 'glob', '-framerate', '1/2',
  '-i', resolve(output, 'v11.0-*.png'),
  '-vf', 'fps=10,scale=960:-1:flags=lanczos',
  resolve(output, 'v11.0-realtime-crdt.gif'),
])
