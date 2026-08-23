import { expect, test } from '@playwright/test'

test('saves and loads the sample scene', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CanvasKit Phase 1')).toBeVisible()
  await page.getByRole('button', { name: 'Save scene' }).click()
  await expect(page.getByTestId('scene-json')).not.toHaveValue('')
  await page.getByRole('button', { name: 'Load scene' }).click()
})
