import { test } from '@playwright/test'

const url = 'http://127.0.0.1:4186'
const assets = 'docs/public/releases/v10'

test('captures V10 sync release states', async ({ page }) => {
  await page.goto(url)
  await page.screenshot({ path: `${assets}/v10.0-overview.png`, fullPage: true })
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await page.getByRole('button', { name: 'Queue for sync' }).click()
  await page.screenshot({ path: `${assets}/v10.0-offline-queue.png`, fullPage: true })
  await page.getByRole('button', { name: 'Simulate remote edit' }).click()
  await page.getByRole('button', { name: 'Sync now' }).click()
  await page.screenshot({ path: `${assets}/v10.0-conflict-resolution.png`, fullPage: true })
})
