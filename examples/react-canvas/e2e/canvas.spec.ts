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
