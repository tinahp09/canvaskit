import { expect, test } from '@playwright/test'

test('renders the React canvas and exports SVG and PNG through accessible controls', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174')

  await expect(page.getByLabel('CanvasKit canvas')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Nodes: 1')
  await expect(page.getByLabel('Export preview')).toHaveAttribute('readonly', '')

  await page.getByRole('button', { name: 'Export SVG' }).click()
  await expect(page.getByLabel('Export preview')).toHaveValue(/<svg/)

  await page.getByRole('button', { name: 'Export PNG' }).click()
  await expect(page.getByLabel('Export preview')).toHaveValue(/^data:image\/png;base64,/)
})

test('supports keyboard focus, labelled navigation, live export feedback, and safe textarea output', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174')

  const canvas = page.getByRole('application', { name: 'CanvasKit canvas' })
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await expect(canvas).toHaveCSS('outline-style', 'solid')

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Export preview')).toBeFocused()
  const scriptCount = await page.locator('script').count()
  await page.getByRole('button', { name: 'Export SVG' }).click()
  await expect(page.getByRole('status')).toHaveText('SVG exported.')
  await expect(page.getByLabel('Export preview')).toHaveValue(/<svg/)
  await expect(page.locator('script')).toHaveCount(scriptCount)
})
